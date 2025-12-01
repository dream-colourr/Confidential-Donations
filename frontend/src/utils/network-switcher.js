/**
 * Network Switcher Utility
 * Handles switching to Sepolia testnet
 */

export const SEPOLIA_CONFIG = {
  chainId: '0xaa36a7', // 11155111 in hex
  chainIdDecimal: 11155111,
  chainName: 'Sepolia Testnet',
  rpcUrls: ['https://eth-sepolia.public.blastapi.io'],
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

export async function switchToSepolia() {
  if (!window.ethereum) {
    throw new Error('MetaMask not found. Please install MetaMask.');
  }

  try {
    // Try to switch to existing Sepolia network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CONFIG.chainId }],
    });
    console.log('✅ Switched to Sepolia');
    return true;
  } catch (switchError) {
    if (switchError.code === 4902) {
      // Network doesn't exist, add it
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_CONFIG],
        });
        console.log('✅ Added Sepolia network and switched');
        return true;
      } catch (addError) {
        console.error('Failed to add Sepolia network:', addError);
        throw addError;
      }
    } else {
      console.error('Failed to switch to Sepolia:', switchError);
      throw switchError;
    }
  }
}

export async function getCurrentChainId() {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }

  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  return parseInt(chainId, 16);
}

export function isOnSepolia(chainId) {
  return chainId === SEPOLIA_CONFIG.chainIdDecimal;
}
