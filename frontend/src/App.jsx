import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, Loader } from 'lucide-react';
import { createConfidentialDonationSDK } from './sdk/fhe-sdk';
import { WalletConnect } from './components/WalletConnect';
import { CreateCampaignModal } from './components/CreateCampaignModal';
import { DonationModal } from './components/DonationModal';
import { CampaignCard } from './components/CampaignCard';

function App() {
  // SDK and Auth State
  const [sdk, setSdk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');

  // Campaigns State
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Initialize SDK on mount
  useEffect(() => {
    initializeSDK();
  }, []);

  const initializeSDK = async () => {
    try {
      setLoading(true);
      const sdkInstance = createConfidentialDonationSDK();
      await sdkInstance.initialize();
      setSdk(sdkInstance);
      setInitError(null);
    } catch (error) {
      console.error('SDK initialization error:', error);
      setInitError(error.message || 'Failed to initialize SDK');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    if (!sdk) {
      setInitError('SDK not ready. Please try again.');
      return;
    }

    try {
      setActionLoading(true);
      const address = await sdk.connectWallet();
      setUserAddress(address);
      setWalletConnected(true);
      await loadCampaigns();
    } catch (error) {
      console.error('Wallet connection error:', error);
      setInitError(`Failed to connect wallet: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const loadCampaigns = async () => {
    if (!sdk) return;

    try {
      setCampaignsLoading(true);
      const campaignIds = await sdk.getActiveCampaigns();

      if (campaignIds.length === 0) {
        setCampaigns([]);
        return;
      }

      const campaignDetails = await Promise.all(
        campaignIds.map(id => sdk.getCampaignInfo(id).then(info => ({ id, ...info })))
      );

      setCampaigns(campaignDetails);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleCreateCampaign = async (formData) => {
    if (!sdk || !walletConnected) {
      setInitError('Please connect wallet first');
      return;
    }

    try {
      setActionLoading(true);
      await sdk.createCampaign({
        name: formData.name,
        description: formData.description,
        goalAmount: formData.goal,
        durationDays: parseInt(formData.duration)
      });

      setShowCreateModal(false);
      await loadCampaigns();
      alert('✅ Campaign created successfully!');
    } catch (error) {
      console.error('Campaign creation error:', error);
      alert(`❌ Failed to create campaign: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMakeDonation = async ({ amount, isAnonymous }) => {
    if (!sdk || !selectedCampaign) {
      setInitError('Something went wrong');
      return;
    }

    try {
      setActionLoading(true);
      await sdk.makeDonation({
        campaignId: selectedCampaign.id,
        amount: amount,
        isAnonymous: isAnonymous,
        ethValue: amount
      });

      setShowDonationModal(false);
      setSelectedCampaign(null);
      await loadCampaigns();
      alert('💝 Donation successful! Thank you for your support!');
    } catch (error) {
      console.error('Donation error:', error);
      alert(`❌ Donation failed: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Confidential Donations</h1>
            </div>
            <p className="text-sm text-gray-600">Secure • Private • Transparent</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Error Alert */}
        {initError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-sm text-red-700">{initError}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Initializing SDK...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Wallet Connect */}
            <WalletConnect
              walletConnected={walletConnected}
              userAddress={userAddress}
              onConnect={handleConnectWallet}
              loading={actionLoading}
            />

            {/* Create Campaign Button */}
            {walletConnected && (
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={actionLoading}
                className="mb-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                ➕ Create New Campaign
              </button>
            )}

            {/* Campaigns Section */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Active Campaigns {campaigns.length > 0 && `(${campaigns.length})`}
              </h2>

              {campaignsLoading ? (
                <div className="flex items-center justify-center min-h-96">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <p className="text-gray-600 mb-4">No active campaigns yet</p>
                  {walletConnected && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Be the first to create one →
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns.map(campaign => (
                    <div key={campaign.id}>
                      <CampaignCard
                        campaign={campaign}
                        onSelect={() => {
                          setSelectedCampaign(campaign);
                          setShowDonationModal(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Modals */}
      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCampaign}
        loading={actionLoading}
      />

      <DonationModal
        isOpen={showDonationModal}
        onClose={() => {
          setShowDonationModal(false);
          setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
        onSubmit={handleMakeDonation}
        loading={actionLoading}
      />

      {/* Footer */}
      <footer className="mt-16 bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            Powered by Zama FHEVM • Homomorphic Encryption for Privacy
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;