import React, { useState } from 'react';
import { Heart, X, Eye, EyeOff } from 'lucide-react';

export const DonationModal = ({ isOpen, onClose, campaign, onSubmit, loading }) => {
  const [amount, setAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ amount, isAnonymous });
    setAmount('');
  };

  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Make Donation
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-gray-50">
          <h3 className="font-semibold mb-2">{campaign.name}</h3>
          <p className="text-sm text-gray-600 mb-4">{campaign.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Donation Amount (ETH) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              step="0.001"
              min="0.001"
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum: 0.001 ETH</p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded"
              />
              <div className="flex items-center gap-2">
                {isAnonymous ? (
                  <>
                    <Eye className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">Anonymous Donation</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">Public Donation</span>
                  </>
                )}
              </div>
            </label>
            <p className="text-xs text-gray-600 mt-2">
              {isAnonymous
                ? 'Your donation amount will be encrypted and visible only to you'
                : 'Your donation will be publicly visible'}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-xs text-yellow-700">
              ✓ This is a mock donation for testing. No real funds will be transferred.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4" />
              {loading ? 'Processing...' : 'Donate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
