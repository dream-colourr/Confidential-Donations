const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("ConfidentialDonations (integration w/ MockTFHEExecutor + MockACL)", function () {
  let MockTFHEExecutor, MockACL, ConfidentialDonations;
  let executor, acl, conf;
  let owner, feeCollector, donor;

  // Sepolia addresses from node_modules/fhevm/config/ZamaFHEVMConfig.sol
  const SEPOLIA_ACL = "0xFee8407e2f5e3Ee68ad77cAE98c434e637f516e5".toLowerCase();
  const SEPOLIA_EXECUTOR = "0x687408aB54661ba0b4aeF3a44156c616c6955E07".toLowerCase();
  const SEPOLIA_PAYMENT = "0xFb03BE574d14C256D56F09a198B586bdfc0A9de2".toLowerCase();
  const SEPOLIA_KMS = "0x9D6891A6240D6130c54ae243d8005063D05fE14b".toLowerCase();

  beforeEach(async function () {
    [owner, feeCollector, donor, other] = await ethers.getSigners();

    MockTFHEExecutor = await ethers.getContractFactory("MockTFHEExecutor");
    MockACL = await ethers.getContractFactory("MockACL");

    executor = await MockTFHEExecutor.deploy();
    await executor.waitForDeployment();

    acl = await MockACL.deploy();
    await acl.waitForDeployment();

    // Set code on the Sepolia addresses so the library's Sepolia config points to our mocks
    // We copy runtime code from deployed mocks to those static addresses.
    const executorAddr = executor.target ?? executor.address ?? (await executor.getAddress());
    const aclAddr = acl.target ?? acl.address ?? (await acl.getAddress());
    const executorCode = await ethers.provider.getCode(executorAddr);
    const aclCode = await ethers.provider.getCode(aclAddr);

    // Hardhat helper to set code at a particular address
    await network.provider.send("hardhat_setCode", [SEPOLIA_ACL, aclCode]);
    await network.provider.send("hardhat_setCode", [SEPOLIA_EXECUTOR, executorCode]);
    // For completeness, also set payment and KMS to our mocks
    await network.provider.send("hardhat_setCode", [SEPOLIA_PAYMENT, executorCode]);
    await network.provider.send("hardhat_setCode", [SEPOLIA_KMS, aclCode]);

    // Now deploy the ConfidentialDonations contract
    ConfidentialDonations = await ethers.getContractFactory("ConfidentialDonations");
    conf = await ConfidentialDonations.deploy(feeCollector.address);
    await conf.waitForDeployment();
  });

  it("deploys and sets fee collector correctly", async function () {
    const fc = await conf.feeCollector();
    expect(fc).to.equal(feeCollector.address);

    // owner should be the deployer - check owner via Ownable
    const contractOwner = await conf.owner();
    expect(contractOwner.toLowerCase()).to.equal(owner.address.toLowerCase());
  });

  it("allows the owner to pause and unpause", async function () {
    await conf.pause();
    expect(await conf.paused()).to.equal(true);

    await conf.unpause();
    expect(await conf.paused()).to.equal(false);
  });

  it("create a campaign and accepts a donation (encrypted proofs)", async function () {
    // Create a campaign with encrypted goal (use proof to represent plaintext 100)
    const goalValue = 100;
    const abiCoder = new ethers.AbiCoder();
    const goalProof = abiCoder.encode(["uint256"], [goalValue]);

    const zeroBytes32 = '0x' + '00'.repeat(32);
    const tx = await conf.createCampaign("Campaign A", "desc", zeroBytes32, goalProof, 30);
    const receipt = await tx.wait();

    expect(await conf.campaignCounter()).to.equal(1);

    // Donor makes a donation - encode the donation after fee as proof
    const donationWei = ethers.parseEther("0.01");

    // Platform fee is 2.5% -> platformFee = donationWei * 250 / 10000
    const platformFee = (donationWei * BigInt(250)) / BigInt(10000);
    const donationAfterFee = donationWei - platformFee;

    const donationProof = abiCoder.encode(["uint256"], [donationAfterFee.toString()]);

    // donate with proof; contract requires a minimum msg.value of 0.001 ETH, we're sending 0.01 ETH
    await conf.connect(donor).donate(0, zeroBytes32, donationProof, false, { value: donationWei });

    // Verify donorCount incremented
    const info = await conf.getCampaignInfo(0);
    expect(info.donorCount).to.equal(1);
  });

  it("lets beneficiary withdraw funds", async function () {
    // Create a campaign and donate
    const abiCoder = new ethers.AbiCoder();
    const goalProof = abiCoder.encode(["uint256"], [50]);
    const zeroBytes32 = '0x' + '00'.repeat(32);

    const donationWei = ethers.parseEther("0.005"); // meets min 0.001
    const platformFee = (donationWei * BigInt(250)) / BigInt(10000);
    const donationAfterFee = donationWei - platformFee;
    const donationProof = abiCoder.encode(["uint256"], [donationAfterFee.toString()]);

    await conf.createCampaign("Campaign B", "desc", zeroBytes32, goalProof, 30);
    await conf.connect(donor).donate(0, zeroBytes32, donationProof, false, { value: donationWei });

    const confAddr = await conf.getAddress();
    const balBefore = await ethers.provider.getBalance(confAddr);
    expect(balBefore).to.equal(donationAfterFee);

    // Withdraw funds as beneficiary (campaign creator is the deployer owner)
    await conf.withdrawFunds(0);

    const balAfter = await ethers.provider.getBalance(confAddr);
    expect(balAfter).to.equal(0);
  });

  it("keeps funds separate across campaigns", async function () {
    // Create two campaigns
    const abiCoder = new ethers.AbiCoder();
    const goalProof = abiCoder.encode(["uint256"], [200]);
    const zeroBytes32 = '0x' + '00'.repeat(32);
    await conf.createCampaign("Campaign A", "desc", zeroBytes32, goalProof, 30);
    await conf.createCampaign("Campaign X", "desc", zeroBytes32, goalProof, 30);

    const donationWei1 = ethers.parseEther("0.01");
    const platformFee1 = (donationWei1 * BigInt(250)) / BigInt(10000);
    const donationAfterFee1 = donationWei1 - platformFee1;
    const proof1 = abiCoder.encode(["uint256"], [donationAfterFee1.toString()]);
    await conf.connect(donor).donate(1, zeroBytes32, proof1, false, { value: donationWei1 });

    const donationWei2 = ethers.parseEther("0.005");
    const platformFee2 = (donationWei2 * BigInt(250)) / BigInt(10000);
    const donationAfterFee2 = donationWei2 - platformFee2;
    const proof2 = abiCoder.encode(["uint256"], [donationAfterFee2.toString()]);
    await conf.connect(donor).donate(0, zeroBytes32, proof2, false, { value: donationWei2 });

    const confAddr = await conf.getAddress();
    const bal0 = await ethers.provider.getBalance(confAddr);
    // Balances of both campaigns combined
    expect(bal0).to.equal(donationAfterFee1 + donationAfterFee2);

    // Withdraw campaign 0 funds only
    await conf.withdrawFunds(0);

    const balAfter0 = await ethers.provider.getBalance(confAddr);
    expect(balAfter0).to.equal(donationAfterFee1);

    // Withdraw campaign 1 funds only
    await conf.withdrawFunds(1);
    const balAfterAll = await ethers.provider.getBalance(confAddr);
    expect(balAfterAll).to.equal(0);
  });
});
