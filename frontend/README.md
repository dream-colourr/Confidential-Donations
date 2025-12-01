# Frontend — Confidential Donations

Required environment variables (frontend/.env.local):

- `VITE_CONTRACT_ADDRESS` — deployed contract address
- `VITE_RELAYER_URL` — URL of the Zama relayer (required, no default fallback)
- `VITE_NETWORK_URL` — network RPC URL (e.g. Sepolia)

Notes:
- This project uses `@zama-fhe/relayer-sdk` to create encrypted inputs. The app will attempt to contact the relayer endpoint at startup; ensure `VITE_RELAYER_URL` points to a reachable relayer.
- The previous mock SDK has been removed — to re-enable mock behavior, reintroduce a development guard in `src/sdk/fhe-sdk.js` or add a local mock relayer.
# Confidential Donations Frontend

> Privacy-preserving donation UI powered by Zama FHE technology

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or compatible Ethereum wallet
- Sepolia testnet ETH (for transactions)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**

Create `frontend/.env.local`:
```env
# Contract address (auto-populated by deployment script)
VITE_CONTRACT_ADDRESS=0x...

# Network configuration
VITE_CHAIN_ID=11155111
VITE_NETWORK_URL=https://rpc.sepolia.org
VITE_GATEWAY_URL=https://gateway.devnet.zama.ai
```

> The `VITE_CONTRACT_ADDRESS` is automatically set by the deployment script in the root directory.

3. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📦 Tech Stack

- **React 18** - UI framework
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **ethers.js v6** - Ethereum interaction
- **fhevmjs 0.6.2** - Zama FHE encryption library
- **Lucide Icons** - Beautiful icon set

## 🔐 FHE Integration

### Latest Zama SDK (v0.6.2)

The frontend uses the latest Zama FHE library for client-side encryption:

```javascript
import { createInstance } from 'fhevmjs';

// Initialize FHE instance
const instance = await createInstance({
  chainId: 11155111,
  networkUrl: 'https://rpc.sepolia.org',
  gatewayUrl: 'https://gateway.devnet.zama.ai'
});

// Create encrypted input
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add64(donationAmount); // euint64 encryption
const encrypted = await input.encrypt();
```

### Key Features

- ✅ **Client-side Encryption** - All amounts encrypted in the browser
- ✅ **Zero-Knowledge Proofs** - Cryptographic validation of encrypted inputs
- ✅ **Homomorphic Operations** - Contract can process encrypted donations without decryption
- ✅ **Privacy by Design** - Donation amounts never visible on-chain

## 📋 Main Components

### `src/App.jsx`
Main application component with:
- Wallet connection flow
- Campaign creation UI
- Campaign browsing and filtering
- Donation modal with encryption
- Real-time campaign updates

### `src/sdk/fhe-sdk.js`
Confidential Donations SDK wrapper:
- `ConfidentialDonationSDK` class - Main SDK interface
- Encryption/decryption utilities
- Contract interaction methods
- Event listener management

**Key Methods:**
```javascript
await sdk.initialize()              // Initialize FHE instance
await sdk.connectWallet()           // Connect MetaMask wallet
await sdk.createCampaign(data)     // Create encrypted campaign
await sdk.makeDonation(data)       // Send encrypted donation
await sdk.getCampaignInfo(id)      // Fetch campaign details
await sdk.getActiveCampaigns()     // List all active campaigns
await sdk.withdrawFunds(campaignId) // Withdraw funds (beneficiary)
```

### `src/utils/config.js`
Configuration file with:
- Contract address
- Chain ID and network URLs
- Gateway configuration
- Full contract ABI with proof parameters

## 🎨 UI Features

### Campaign Discovery
- Browse active donation campaigns
- View campaign metadata (name, description, deadline)
- Track donor count and campaign progress
- Filter by creator or deadline

### Donation Interface
- Encrypted donation amount input
- Anonymous donation option
- Transaction status feedback
- Real-time campaign updates after donation

### Wallet Integration
- MetaMask connection prompt
- Address display with truncation
- Automatic network detection
- Transaction receipt tracking

### Features Dashboard
- Fully Encrypted - All amounts encrypted using FHE
- Anonymous Donations - Optional privacy for donors
- Transparent Impact - Track progress while maintaining privacy

## 🔄 Workflow

### Creating a Campaign
1. Connect wallet (MetaMask)
2. Click "Create Campaign"
3. Fill in campaign details (name, description, goal)
4. Goal amount is encrypted before sending to blockchain
5. Campaign ID is returned on success

### Making a Donation
1. Connect wallet
2. Click "Donate Now" on a campaign
3. Enter donation amount in ETH
4. Choose anonymous mode (optional)
5. Amount is encrypted client-side
6. Transaction is sent with encrypted payload
7. Cryptographic proof validates the encryption
8. Funds are transferred with 2.5% platform fee

## 🛠️ Development

### Build for production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

### Lint code:
```bash
npm run lint
```

## 🔌 Contract Interaction

The frontend communicates with `ConfidentialDonations.sol` contract:

### Core Functions
```solidity
// Create encrypted campaign
function createCampaign(
  string memory _name,
  string memory _description,
  bytes calldata _encryptedGoal,
  bytes calldata _goalProof,
  uint256 _durationDays
) external

// Send encrypted donation
function donate(
  uint256 _campaignId,
  bytes calldata _encryptedAmount,
  bytes calldata _proof,
  bool _anonymous
) external payable

// Withdraw funds
function withdrawFunds(uint256 _campaignId) external
```

## 📊 Event Handling

The SDK listens to contract events:

- **CampaignCreated** - New campaign launched
- **DonationMade** - Donation received
- **FundsWithdrawn** - Funds withdrawn by beneficiary

## ⚙️ Configuration

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_CONTRACT_ADDRESS` | (required) | Deployed contract address |
| `VITE_CHAIN_ID` | `11155111` | Sepolia chain ID |
| `VITE_NETWORK_URL` | `https://rpc.sepolia.org` | RPC endpoint |
| `VITE_GATEWAY_URL` | `https://gateway.devnet.zama.ai` | Zama FHE gateway |

## 🐛 Troubleshooting

### "Contract not initialized"
- Ensure `VITE_CONTRACT_ADDRESS` is set in `.env.local`
- Deploy contract first: `npm run deploy:sepolia` from root

### "Wallet connection failed"
- Install MetaMask extension
- Make sure Sepolia testnet is added to MetaMask
- Reload the page

### "Encryption failed"
- Check if FHE gateway is accessible
- Verify `VITE_GATEWAY_URL` is correct
- Check browser console for network errors

### "Transaction rejected"
- Ensure you have enough Sepolia ETH
- Check MetaMask is connected to correct network
- Verify campaign is still active

## 📚 Resources

- [Zama FHE Documentation](https://docs.zama.ai/fhevm)
- [fhevmjs GitHub](https://github.com/zama-ai/fhevmjs)
- [Sepolia Faucet](https://www.sepoliafaucet.com/)
- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)

## 📝 License

BSD-3-Clause-Clear

---

**Built with ❤️ using Zama's Fully Homomorphic Encryption**
