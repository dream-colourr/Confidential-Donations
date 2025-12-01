const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Deploying Confidential Donations Contract...");
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  console.log("");

  // Get fee collector from env or use deployer
  const feeCollector = process.env.FEE_COLLECTOR_ADDRESS || deployer.address;
  console.log("💵 Fee collector address:", feeCollector);
  console.log("");

  // Deploy contract
  console.log("⏳ Deploying contract...");
  const ConfidentialDonations = await ethers.getContractFactory("ConfidentialDonations");
  const contract = await ConfidentialDonations.deploy(feeCollector);

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract address:", address);
  console.log("");

  // Save address to .env files
  console.log("💾 Saving contract address...");
  
  // Append to root .env
  if (!fs.existsSync('.env')) {
    fs.writeFileSync('.env', '');
  }
  fs.appendFileSync('.env', `\nCONTRACT_ADDRESS=${address}\n`);
  
  // Write to frontend .env.local
  fs.writeFileSync('./frontend/.env.local', `VITE_CONTRACT_ADDRESS=${address}\n`);
  
  console.log("✅ Contract address saved to .env and frontend/.env.local");
  console.log("");

  // Wait for confirmations (for verification)
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("⏳ Waiting for block confirmations...");
    await contract.deploymentTransaction().wait(5);
    console.log("✅ Confirmed!");
  }

  console.log("");
  console.log("🎉 Deployment complete!");
  console.log("");
  console.log("Next steps:");
  console.log("1. Copy .env.example to .env (if not done)");
  console.log("2. cd frontend && npm run dev");
  console.log("3. Start donating!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });