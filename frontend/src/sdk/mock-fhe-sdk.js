/**
 * Minimal Mock FHE SDK (lightweight)
 * Used only for local development when the real relayer is unreachable
 */
export class MockConfidentialDonationSDK {
  constructor() {
    this.initialized = false;
    this.userAddress = null;
    this.contractAddress = null;
  }

  async initialize() {
    console.warn('⚠️ Using Mock FHE SDK (VITE_USE_MOCK_FHE=true)');
    this.initialized = true;
    return true;
  }

  async connectWallet() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Please install MetaMask');
    }
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    // use real wallet address if available
    try {
      this.userAddress = (await window.ethereum.request({ method: 'eth_accounts' }))[0];
    } catch (e) {
      this.userAddress = '0x' + Math.random().toString(16).slice(2, 42);
    }
    return this.userAddress;
  }

  async createEncryptedInput(contractAddress, userAddress) {
    // Minimal stub that returns an object with add64 and encrypt()
    const generateHex = len => '0x' + Array.from({ length: len }).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    return {
      add64: () => { return this; },
      encrypt: async () => {
        // return a fake handle (32 bytes) and proof
        const handle = new Uint8Array(32).map(() => Math.floor(Math.random() * 256));
        const proof = new Uint8Array(64).map(() => Math.floor(Math.random() * 256));
        return { handles: [handle], inputProof: proof };
      }
    };
  }
}

export function createMockConfidentialDonationSDK() {
  return new MockConfidentialDonationSDK();
}
