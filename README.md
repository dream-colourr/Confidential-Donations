# 🔒 Confidential Donations — privacy-first on-chain giving

> A privacy-preserving donation platform built with Zama's FHE (Fully Homomorphic Encryption) on Ethereum.

[![License: BSD-3-Clause-Clear](https://img.shields.io/badge/License-BSD--3--Clause--Clear-blue.svg)](./LICENSE)  
[![Solidity ^0.8.24](https://img.shields.io/badge/Solidity-%5E0.8.24-lightgrey)](https://github.com/ethereum/solidity)  
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

Confidential Donations enables encrypted donation amounts to be stored and processed on-chain without revealing raw values — private, auditable fundraising using Zama's FHEVM primitives.

---

## 📁 Project Structure

```
confidential-donations/
├── contracts/
│   └── ConfidentialDonations.sol    # Main FHE-enabled donation contract
├── frontend/
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── hooks/                   # Custom hooks for FHE
│   │   ├── utils/                   # Helper functions
│   │   └── App.jsx                  # Main app
│   ├── public/                      # Static assets
│   └── package.json
├── scripts/
│   ├── deploy.js                    # Deployment script
│   └── interact.js                  # Contract interaction examples
├── test/
│   └── confidentialDonations.test.js # Test suite
├── hardhat.config.js                # Hardhat configuration
├── package.json
├── .env.example                     # Environment template
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd confidential-donations
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env
```

**Edit `.env` file:**

```env
# Deployer wallet private key (WITHOUT 0x prefix)
PRIVATE_KEY=your_private_key_here

# Zama FHEVM Sepolia RPC
SEPOLIA_RPC_URL=https://devnet.zama.ai

# Etherscan API (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key

# Zama Gateway for FHE decryption
GATEWAY_URL=https://gateway.sepolia.zama.dev

# Fee collector address
FEE_COLLECTOR_ADDRESS=0xYourAddress

# Frontend config (after deployment)
VITE_CONTRACT_ADDRESS=
VITE_CHAIN_ID=8009
VITE_RPC_URL=https://devnet.zama.ai
```
 

## 📦 Deployment

### Compile Contracts

```bash
npm run compile
```

### Deploy to Zama Sepolia

```bash
npm run deploy:sepolia
```

**Expected output:**
```
Deploying to Zama FHEVM Sepolia...
Contract deployed to: 0xABC123...
✅ Deployment successful!
```

### Verify Contract

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> "<FEE_COLLECTOR_ADDRESS>"
```

### Update Frontend

After deployment, update `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

---

## 🎯 Core Functions

### For Campaign Creators

#### `createCampaign()`
Create a new fundraising campaign with encrypted goal.

**Parameters:**
- `name` - Campaign name
- `description` - Campaign details
- `encryptedGoal` - Encrypted funding goal (euint64)
- `goalProof` - ZK proof for encrypted value
- `durationDays` - Campaign duration (1-365 days)

```solidity
function createCampaign(
    string memory _name,
    string memory _description,
    einput _encryptedGoal,
    bytes calldata _goalProof,
    uint256 _durationDays
) external
```

#### `withdrawFunds()`
Withdraw collected donations (beneficiary only).

**Parameters:**
- `campaignId` - Campaign identifier

```solidity
function withdrawFunds(uint256 _campaignId) external
```

---

### For Donors

#### `donate()`
Make an encrypted donation to a campaign.

**Parameters:**
- `campaignId` - Target campaign
- `encryptedAmount` - Encrypted donation amount (euint64)
- `proof` - ZK proof for encrypted value
- `anonymous` - Hide donor identity

**Fee:** 2.5% platform fee deducted automatically

```solidity
function donate(
    uint256 _campaignId,
    einput _encryptedAmount,
    bytes calldata _proof,
    bool _anonymous
) external payable
```

#### `getMyContribution()`
View your encrypted total contribution to a campaign.

**Returns:** `euint64` - Your encrypted contribution amount

```solidity
function getMyContribution(uint256 _campaignId) external view returns (euint64)
```

---

### Public View Functions

#### `getCampaignInfo()`
Get public campaign details (excludes encrypted data).

**Returns:**
- `name` - Campaign name
- `description` - Details
- `beneficiary` - Creator address
- `deadline` - End timestamp
- `active` - Campaign status
- `donorCount` - Number of unique donors
- `createdAt` - Creation timestamp

```solidity
function getCampaignInfo(uint256 _campaignId) external view
```

#### `getActiveCampaigns()`
List all currently active campaigns.

**Returns:** `uint256[]` - Array of active campaign IDs

```solidity
function getActiveCampaigns() external view returns (uint256[] memory)
```

#### `getUserCampaigns()`
Get all campaigns created by a specific user.

**Parameters:**
- `user` - Creator address

**Returns:** `uint256[]` - Array of campaign IDs

```solidity
function getUserCampaigns(address _user) external view returns (uint256[] memory)
```

---

## 🧪 Testing

### Run Local Tests

```bash
# Start local Hardhat node
npm run node

# Deploy locally (in another terminal)
npm run deploy:local

# Run test suite
npm test
```

### Test Coverage

- ✅ Campaign creation with encrypted goals
- ✅ Anonymous & public donations
- ✅ Encrypted amount handling
- ✅ Platform fee calculations
- ✅ Fund withdrawals & security
- ✅ Access control & permissions
- ✅ Reentrancy protection

---

## 🔐 Privacy Features

### Encrypted Data (On-Chain)
- **Donation amounts** - Hidden using `euint64`
- **Campaign goals** - Encrypted targets
- **Total raised** - Encrypted running totals
- **Individual contributions** - Private donor tracking

### Public Data (Visible)
- Campaign names & descriptions
- Beneficiary addresses
- Deadlines & creation dates
- Donor counts (not amounts)
- Campaign active status

### Access Control
- **Donors** can decrypt their own contributions
- **Beneficiaries** can decrypt their campaign totals
- **Public** cannot see any encrypted amounts
- Platform fees calculated on actual ETH transfers

---

## 📖 Zama Resources

### Official Documentation
- **FHEVM Docs**: https://docs.zama.ai/fhevm
- **Getting Started**: https://docs.zama.ai/fhevm/getting-started
- **Contract Guide**: https://docs.zama.ai/fhevm/guides/contracts
- **Encrypted Types**: https://docs.zama.ai/fhevm/fundamentals/types
- **Gateway Integration**: https://docs.zama.ai/fhevm/guides/gateway

### Developer Tools
- **GitHub Repository**: https://github.com/zama-ai/fhevm
- **Example Contracts**: https://github.com/zama-ai/fhevm/tree/main/examples
- **Hardhat Template**: https://github.com/zama-ai/fhevm-hardhat-template
- **React Template**: https://github.com/zama-ai/fhevm-react-template

### Community & Support
- **Discord Server**: https://discord.fhe.org
- **Twitter/X**: https://twitter.com/zama_fhe
- **Blog**: https://www.zama.ai/blog
- **YouTube Tutorials**: https://www.youtube.com/@zama_fhe

### Technical Concepts
- **FHE Whitepaper**: https://www.zama.ai/fhe
- **TFHE-rs Library**: https://github.com/zama-ai/tfhe-rs
- **Decryption Flow**: https://docs.zama.ai/fhevm/guides/decrypt
- **ACL System**: https://docs.zama.ai/fhevm/fundamentals/acl

---

## 🛠️ Development Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Start local node
npm run node

# Deploy locally
npm run deploy:local

# Deploy to Sepolia
npm run deploy:sepolia

# Start frontend
cd frontend && npm run dev

# Clean artifacts
npm run clean
```

---

## 🔒 Security Notes

- **Never commit `.env`** - Contains private keys
- **Use different keys** - Separate for dev/test/prod
- **Verify contracts** - Always verify on Etherscan
- **Test thoroughly** - Use testnet before mainnet
- **Audit smart contracts** - For production deployments

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear** license. See [LICENSE](./LICENSE) for details.

---

## 🆘 Support

- **Issues**: Open a GitHub issue
- **Discord**: Join Zama community for help
- **Docs**: Check Zama documentation
- **Email**: Contact project maintainers

---

**Built with ❤️ using Zama's Fully Homomorphic Encryption technology**
