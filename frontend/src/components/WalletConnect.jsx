import React, { useState, useEffect } from 'react';
import { Wallet, AlertCircle } from 'lucide-react';
import { switchToSepolia, getCurrentChainId, isOnSepolia } from '../utils/network-switcher';

export const WalletConnect = ({ walletConnected, userAddress, onConnect, loading }) => {
  const [chainId, setChainId] = useState(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);

  useEffect(() => {
    checkNetwork();
    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        checkNetwork();
      });
    }
  }, [walletConnected]);

  const checkNetwork = async () => {
    try {
      const currentChainId = await getCurrentChainId();
      setChainId(currentChainId);
      setIsWrongNetwork(!isOnSepolia(currentChainId));
    } catch (error) {
      console.error('Error checking network:', error);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      setSwitchingNetwork(true);
      await switchToSepolia();
      await checkNetwork();
    } catch (error) {
      alert(`Failed to switch network: ${error.message}`);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getNetworkName = () => {
    if (!chainId) return 'Unknown';
    if (chainId === 11155111) return 'Sepolia ✅';
    if (chainId === 1) return 'Mainnet ❌';
    if (chainId === 5) return 'Goerli ❌';
    if (chainId === 137) return 'Polygon ❌';
    return `Chain ${chainId} ❌`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold">Wallet</h2>
            {walletConnected ? (
              <p className="text-sm text-green-600">Connected: {formatAddress(userAddress)}</p>
            ) : (
              <p className="text-sm text-gray-500">Not connected</p>
            )}
          </div>
        </div>
        <button
          onClick={onConnect}
          disabled={loading || walletConnected}
          className={`px-6 py-2 rounded font-semibold transition ${
            walletConnected
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Connecting...' : walletConnected ? 'Connected' : 'Connect Wallet'}
        </button>
      </div>

      {/* Network Status */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Network</p>
            <p className={`text-sm font-mono ${
              isWrongNetwork ? 'text-red-600 font-bold' : 'text-green-600 font-bold'
            }`}>
              {getNetworkName()}
            </p>
          </div>
          
          {isWrongNetwork && walletConnected && (
            <button
              onClick={handleSwitchNetwork}
              disabled={switchingNetwork}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold transition disabled:opacity-50"
            >
              {switchingNetwork ? 'Switching...' : 'Switch to Sepolia'}
            </button>
          )}
        </div>

        {isWrongNetwork && walletConnected && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded p-3 flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-semibold">Wrong Network!</p>
              <p>Please switch to Sepolia Testnet to use this dApp.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
