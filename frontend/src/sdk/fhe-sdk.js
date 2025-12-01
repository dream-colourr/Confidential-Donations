import { BrowserProvider, Contract, parseEther, toBeHex, hexlify } from 'ethers';
import { config, CONTRACT_ABI } from '../utils/config';
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';

/**
 * ConfidentialDonationSDK
 * Zama fhevmjs SDK Integration
 * Handles encrypted donation creation and management
 */
export class ConfidentialDonationSDK {
  constructor() {
    this.contractAddress = config.contractAddress;
    this.chainId = config.chainId;
    this.relayerUrl = config.relayerUrl;
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.instance = null;
    this.userAddress = null;
    this.initialized = false;
  }

  /**
   * Initialize the FHE instance with Zama Testnet Relayer
   */
  async initialize() {
    try {
      console.log('🔧 Initializing SDK...');
      
      // Validate required configuration
      if (!config.relayerUrl) {
        throw new Error('Relayer URL is not configured. Please set VITE_RELAYER_URL in .env.local');
      }

      if (!config.networkUrl) {
        throw new Error('Network URL is not configured. Please set VITE_NETWORK_URL in .env.local');
      }

      console.log('Using relayer:', config.relayerUrl);
      console.log('Using network:', config.networkUrl);
      console.log('Using chainId:', this.chainId);

      // Use official Zama SepoliaConfig but override relayerUrl to use .org (not .cloud)
      const instanceConfig = {
        ...SepoliaConfig,
        relayerUrl: 'https://relayer.testnet.zama.org', // Override to working relayer host
        network: config.networkUrl // Use our configured RPC
      };

      console.log('🔧 Creating FHE instance with relayerUrl:', instanceConfig.relayerUrl);

      // createInstance returns a FhevmInstance
      this.instance = await createInstance(instanceConfig);
      this.initialized = true;
      console.log('✅ SDK initialized successfully (Zama relayer instance created)');
      return true;
    } catch (error) {
      console.error('❌ SDK initialization failed:', error);
      throw new Error(`Initialization failed: ${error.message}`);
    }
  }

  /**
   * Connect wallet and initialize contract
   */
  async connectWallet() {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('Please install MetaMask or compatible wallet');
      }

      console.log('🔗 Connecting wallet...');
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Check and switch to Sepolia network (chainId: 11155111)
      const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex
      try {
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Current chain ID:', currentChainId);
        
        if (currentChainId !== SEPOLIA_CHAIN_ID) {
          console.log('📡 Switching to Sepolia network...');
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: SEPOLIA_CHAIN_ID }],
            });
            console.log('✅ Switched to Sepolia');
          } catch (switchError) {
            if (switchError.code === 4902) {
              // Chain doesn't exist in MetaMask, add it
              console.log('📲 Adding Sepolia network to MetaMask...');
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: SEPOLIA_CHAIN_ID,
                  chainName: 'Sepolia Testnet',
                  rpcUrls: ['https://eth-sepolia.public.blastapi.io'],
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://sepolia.etherscan.io'],
                }],
              });
              console.log('✅ Sepolia network added to MetaMask');
            } else {
              throw switchError;
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not switch network:', error);
        // Don't throw - allow connection even if network switch fails
      }
      
      // Initialize provider and signer
      this.provider = new BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.userAddress = await this.signer.getAddress();
      
      // Verify we're on Sepolia
      const network = await this.provider.getNetwork();
      const networkChainId = Number(network.chainId); // Convert BigInt to number
      console.log('Connected to network:', network.name, '(chainId:', networkChainId, ')');
      
      if (networkChainId !== 11155111) {
        throw new Error(`❌ Wrong network! Connected to ${network.name}. Please use Sepolia testnet (chainId: 11155111)`);
      }
      
      // Initialize contract with signer (allows transactions)
      this.contract = new Contract(this.contractAddress, CONTRACT_ABI, this.signer);
      
      console.log('✅ Wallet connected:', this.userAddress);
      console.log('✅ Network verified: Sepolia (11155111)');
      return this.userAddress;
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      throw new Error(`Wallet connection failed: ${error.message}`);
    }
  }

  /**
   * Create encrypted input for a value
   * Uses @zama-fhe/relayer-sdk for real FHE encryption
   */
  async createEncryptedInput(value) {
    try {
      if (!this.instance || !this.userAddress) {
        throw new Error('SDK not initialized - call initialize() and connectWallet() first');
      }

      // Convert value to wei if it's a string (ETH amount)
      const valueWei = typeof value === 'string' ? parseEther(value) : BigInt(value);

      console.log('🔐 Creating encrypted input via Zama relayer for value (wei):', valueWei.toString());

      // Create a relayer encrypted input for the contract and user
      const relayerInput = await this.instance.createEncryptedInput(this.contractAddress, this.userAddress);

      // Choose the appropriate add method. Contract expects an einput (euint64/einput)
      // We'll add the value as 64-bit integer (sufficient for ETH wei values in tests)
      relayerInput.add64(BigInt(valueWei.toString()));

      // Encrypt the input via the relayer SDK. It returns handles and an inputProof (Uint8Array)
      const { handles, inputProof } = await relayerInput.encrypt();

      // Convert handle (Uint8Array) to hex string suitable for bytes32 contract param
      const handleHex = handles && handles.length > 0 ? hexlify(handles[0]) : null;
      const proofHex = inputProof ? hexlify(inputProof) : null;

      if (!handleHex || !proofHex) {
        throw new Error('Relayer returned invalid handles/proof');
      }

      console.log('✅ Value encrypted (relayer) - handle and proof generated');

      return {
        handle: handleHex,
        proof: proofHex
      };
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Create a donation campaign with encrypted goal
   */
  async createCampaign(campaignData) {
    try {
      if (!this.contract || !this.instance) {
        throw new Error('SDK not properly initialized');
      }

      const { name, description, goalAmount, durationDays } = campaignData;

      console.log('📝 Creating campaign:', name);

      // Encrypt the goal amount
      const { handle: encryptedGoal, proof: goalProof } = await this.createEncryptedInput(goalAmount);

      // Create campaign with encrypted goal
      const tx = await this.contract.createCampaign(
        name,
        description,
        encryptedGoal,
        goalProof,
        durationDays
      );

      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();

      // Extract campaign ID from event
      let campaignId = null;
      if (receipt && receipt.logs) {
        try {
          const event = receipt.logs.find(
            log => log.topics[0] === this.contract.interface.getEvent('CampaignCreated').topicHash
          );
          if (event) {
            const decoded = this.contract.interface.parseLog(event);
            campaignId = Number(decoded.args.campaignId);
          }
        } catch (e) {
          console.warn('Could not parse campaign ID from logs');
        }
      }

      console.log('✅ Campaign created successfully');
      return { campaignId, txHash: receipt.hash, receipt };
    } catch (error) {
      console.error('❌ Campaign creation failed:', error);
      throw new Error(`Campaign creation failed: ${error.message}`);
    }
  }

  /**
   * Make an encrypted donation
   */
  async makeDonation(donationData) {
    try {
      if (!this.contract || !this.instance) {
        throw new Error('SDK not properly initialized');
      }

      const { campaignId, amount, isAnonymous = true, ethValue } = donationData;

      console.log('💝 Encrypting donation amount...');

      // Encrypt the donation amount
      const { handle: encryptedAmount, proof: donationProof } = await this.createEncryptedInput(amount);

      console.log('📤 Sending encrypted donation transaction...');

      // Send encrypted donation
      const tx = await this.contract.donate(
        campaignId,
        encryptedAmount,
        donationProof,
        isAnonymous,
        {
          value: parseEther(ethValue.toString())
        }
      );

      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();

      console.log('✅ Donation successful! Transaction:', receipt.hash);
      return { txHash: receipt.hash, receipt };
    } catch (error) {
      console.error('❌ Donation failed:', error);
      throw new Error(`Donation failed: ${error.message}`);
    }
  }

  /**
   * Get campaign information
   */
  async getCampaignInfo(campaignId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const info = await this.contract.getCampaignInfo(campaignId);
      
      return {
        name: info[0],
        description: info[1],
        beneficiary: info[2],
        deadline: Number(info[3]),
        active: info[4],
        donorCount: Number(info[5]),
        createdAt: Number(info[6])
      };
    } catch (error) {
      console.error('❌ Failed to get campaign info:', error);
      throw new Error(`Failed to get campaign info: ${error.message}`);
    }
  }

  /**
   * Get all active campaigns
   */
  async getActiveCampaigns() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const campaignIds = await this.contract.getActiveCampaigns();
      return campaignIds.map(id => Number(id));
    } catch (error) {
      console.error('❌ Failed to get active campaigns:', error);
      throw new Error(`Failed to get active campaigns: ${error.message}`);
    }
  }

  /**
   * Withdraw funds from a campaign (beneficiary only)
   */
  async withdrawFunds(campaignId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      console.log('💸 Withdrawing campaign funds...');

      const tx = await this.contract.withdrawFunds(campaignId);
      const receipt = await tx.wait();

      console.log('✅ Funds withdrawn successfully');
      return { txHash: receipt.hash, receipt };
    } catch (error) {
      console.error('❌ Withdrawal failed:', error);
      throw new Error(`Withdrawal failed: ${error.message}`);
    }
  }

  /**
   * Get user's contribution to a campaign (encrypted)
   */
  async getMyContribution(campaignId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const contribution = await this.contract.getMyContribution(campaignId);
      return contribution;
    } catch (error) {
      console.error('❌ Failed to get contribution:', error);
      throw new Error(`Failed to get contribution: ${error.message}`);
    }
  }

  /**
   * Setup event listeners for contract events
   */
  setupEventListeners(callback) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    this.contract.on('CampaignCreated', (campaignId, name, beneficiary, deadline, event) => {
      callback('CampaignCreated', {
        campaignId: Number(campaignId),
        name,
        beneficiary,
        deadline: Number(deadline),
        transactionHash: event.log.transactionHash
      });
    });

    this.contract.on('DonationMade', (campaignId, donor, timestamp, anonymous, event) => {
      callback('DonationMade', {
        campaignId: Number(campaignId),
        donor,
        timestamp: Number(timestamp),
        anonymous,
        transactionHash: event.log.transactionHash
      });
    });

    console.log('✅ Event listeners set up');
  }

  /**
   * Remove all event listeners
   */
  removeEventListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
      console.log('✅ Event listeners removed');
    }
  }

  /**
   * Get SDK status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      walletConnected: !!this.userAddress,
      userAddress: this.userAddress,
      contractAddress: this.contractAddress,
      chainId: this.chainId
    };
  }
}

/**
 * Factory function to create SDK instance
 */
export function createConfidentialDonationSDK() {
  return new ConfidentialDonationSDK();
}