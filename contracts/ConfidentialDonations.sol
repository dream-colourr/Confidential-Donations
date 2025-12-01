// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/config/ZamaFHEVMConfig.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ConfidentialDonations
 * @notice Privacy-preserving donation platform using Zama's FHE technology
 * @dev Updated for Zama FHEVM v0.7+
 */
contract ConfidentialDonations is SepoliaZamaFHEVMConfig, Ownable, ReentrancyGuard {
    
    // Campaign structure
    struct Campaign {
        string name;
        string description;
        address payable beneficiary;
        euint64 encryptedGoal;
        euint64 encryptedTotalRaised;
        uint256 deadline;
        bool active;
        uint256 donorCount;
        uint256 createdAt;
    }
    
    // Donation record
    struct Donation {
        uint256 campaignId;
        address donor;
        euint64 encryptedAmount;
        uint256 timestamp;
        bool isAnonymous;
    }
    
    // State variables
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Donation[]) private campaignDonations;
    mapping(uint256 => mapping(address => euint64)) private donorContributions;
    mapping(address => uint256[]) private userCampaigns;
    mapping(uint256 => mapping(address => bool)) public hasDonated;
    mapping(uint256 => uint256) public campaignBalances;
    
    uint256 public campaignCounter;
    uint256 public platformFeePercentage = 250; // 2.5%
    address public feeCollector;
    bool public paused;
    
    // Events
    event CampaignCreated(
        uint256 indexed campaignId,
        string name,
        address indexed beneficiary,
        uint256 deadline
    );
    
    event DonationMade(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 timestamp,
        bool isAnonymous
    );
    
    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed beneficiary,
        uint256 amount
    );
    
    // Modifiers
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier campaignExists(uint256 _campaignId) {
        require(_campaignId < campaignCounter, "Campaign does not exist");
        _;
    }
    
    modifier campaignActive(uint256 _campaignId) {
        require(campaigns[_campaignId].active, "Campaign not active");
        require(block.timestamp < campaigns[_campaignId].deadline, "Campaign expired");
        _;
    }
    
    // Constructor
    constructor(address _feeCollector) Ownable(msg.sender) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
    }
    
    /**
     * @notice Create a new donation campaign
     */
    function createCampaign(
        string memory _name,
        string memory _description,
        einput _encryptedGoal,
        bytes calldata _goalProof,
        uint256 _durationDays
    ) external whenNotPaused nonReentrant {
        require(bytes(_name).length > 0, "Name required");
        require(_durationDays >= 1 && _durationDays <= 365, "Invalid duration");
        
        euint64 goal = TFHE.asEuint64(_encryptedGoal, _goalProof);
        euint64 totalRaised = TFHE.asEuint64(0);
        
        TFHE.allowThis(goal);
        TFHE.allowThis(totalRaised);
        
        uint256 deadline = block.timestamp + (_durationDays * 1 days);
        
        campaigns[campaignCounter] = Campaign({
            name: _name,
            description: _description,
            beneficiary: payable(msg.sender),
            encryptedGoal: goal,
            encryptedTotalRaised: totalRaised,
            deadline: deadline,
            active: true,
            donorCount: 0,
            createdAt: block.timestamp
        });
        
        userCampaigns[msg.sender].push(campaignCounter);
        
        emit CampaignCreated(campaignCounter, _name, msg.sender, deadline);
        
        campaignCounter++;
    }
    
    /**
     * @notice Make an encrypted donation
     */
    function donate(
        uint256 _campaignId,
        einput _encryptedAmount,
        bytes calldata _proof,
        bool _anonymous
    ) external payable 
        campaignExists(_campaignId) 
        campaignActive(_campaignId) 
        whenNotPaused 
        nonReentrant 
    {
        require(msg.value >= 0.001 ether, "Minimum donation: 0.001 ETH");
        
        Campaign storage campaign = campaigns[_campaignId];
        
        euint64 donationAmount = TFHE.asEuint64(_encryptedAmount, _proof);
        TFHE.allowThis(donationAmount);
        
        // Calculate fee
        uint256 platformFee = (msg.value * platformFeePercentage) / 10000;
        uint256 donationAfterFee = msg.value - platformFee;
        
        euint64 encryptedDonationAfterFee = TFHE.asEuint64(donationAfterFee);
        TFHE.allowThis(encryptedDonationAfterFee);
        
        // Update campaign total
        campaign.encryptedTotalRaised = TFHE.add(
            campaign.encryptedTotalRaised,
                encryptedDonationAfterFee
        );
            TFHE.allowThis(campaign.encryptedTotalRaised);
        
        // Update donor contribution -- add amount or initialize
        if (!hasDonated[_campaignId][msg.sender]) {
            donorContributions[_campaignId][msg.sender] = donationAmount;
        } else {
            donorContributions[_campaignId][msg.sender] = TFHE.add(donorContributions[_campaignId][msg.sender], donationAmount);
        }

        // Update donor count
        if (!hasDonated[_campaignId][msg.sender]) {
            campaign.donorCount++;
            hasDonated[_campaignId][msg.sender] = true;
        }
        
        // Record donation
        campaignDonations[_campaignId].push(Donation({
            campaignId: _campaignId,
            donor: _anonymous ? address(0) : msg.sender,
            encryptedAmount: encryptedDonationAfterFee,
            timestamp: block.timestamp,
            isAnonymous: _anonymous
        }));
        
        // Transfer fee
        payable(feeCollector).transfer(platformFee);
        // Add net donation to the campaign's Ether balance
        campaignBalances[_campaignId] += donationAfterFee;
        
        // Allow beneficiary to access
        TFHE.allow(encryptedDonationAfterFee, campaign.beneficiary);
        
        emit DonationMade(_campaignId, _anonymous ? address(0) : msg.sender, block.timestamp, _anonymous);
    }

    function getMyContribution(uint256 _campaignId) external view returns (euint64) {
        return donorContributions[_campaignId][msg.sender];
    }

    function getMyContributionHandle(uint256 _campaignId) external view returns (bytes32) {
        euint64 contribution = donorContributions[_campaignId][msg.sender];
        return bytes32(uint256(euint64.unwrap(contribution)));
    }

    function canDecryptMyContribution(uint256 _campaignId) external view returns (bool) {
        return TFHE.isSenderAllowed(donorContributions[_campaignId][msg.sender]);
    }
    
    /**
     * @notice Withdraw funds (beneficiary only)
     */
    function withdrawFunds(uint256 _campaignId) 
        external 
        campaignExists(_campaignId) 
        nonReentrant
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.beneficiary, "Not beneficiary");
        require(campaign.active, "Campaign not active");
        
        uint256 balance = campaignBalances[_campaignId];
        require(balance > 0, "No funds");

        campaign.active = false;
        // zero the campaign balance before transfer to avoid reentrancy
        campaignBalances[_campaignId] = 0;
        campaign.beneficiary.transfer(balance);
        
        emit FundsWithdrawn(_campaignId, campaign.beneficiary, balance);
    }
    
    /**
     * @notice Get campaign information
     */
    function getCampaignInfo(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (
            string memory name,
            string memory description,
            address beneficiary,
            uint256 deadline,
            bool active,
            uint256 donorCount,
            uint256 createdAt
        ) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.name,
            campaign.description,
            campaign.beneficiary,
            campaign.deadline,
            campaign.active,
            campaign.donorCount,
            campaign.createdAt
        );
    }
    
    /**
     * @notice Get all active campaigns
     */
    function getActiveCampaigns() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < campaignCounter; i++) {
            if (campaigns[i].active && block.timestamp < campaigns[i].deadline) {
                activeCount++;
            }
        }
        
        uint256[] memory activeCampaigns = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < campaignCounter; i++) {
            if (campaigns[i].active && block.timestamp < campaigns[i].deadline) {
                activeCampaigns[index] = i;
                index++;
            }
        }
        
        return activeCampaigns;
    }
    
    /**
     * @notice Get user's campaigns
     */
    function getUserCampaigns(address _user) external view returns (uint256[] memory) {
        return userCampaigns[_user];
    }
    
    // Admin functions
    function pause() external onlyOwner {
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
    
    function updateFeeCollector(address _newFeeCollector) external onlyOwner {
        require(_newFeeCollector != address(0), "Invalid address");
        feeCollector = _newFeeCollector;
    }
    
    receive() external payable {}
}