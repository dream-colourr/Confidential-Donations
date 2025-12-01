import React from 'react';
import { Heart, Clock, Users } from 'lucide-react';

export const CampaignCard = ({ campaign, onSelect }) => {
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const timeRemaining = campaign.deadline - Math.floor(Date.now() / 1000);
  const daysRemaining = Math.ceil(timeRemaining / 86400);
  const isExpired = daysRemaining <= 0;

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
    >
      <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
        <h3 className="text-lg font-bold truncate">{campaign.name}</h3>
        <p className="text-sm opacity-90 truncate">{campaign.description || 'No description'}</p>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Heart className="w-4 h-4" />
            <span>{campaign.donorCount} donors</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{isExpired ? 'Expired' : `${daysRemaining}d left`}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              campaign.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {campaign.active ? 'Active' : 'Closed'}
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-700">
          <p>Beneficiary:</p>
          <p className="font-mono text-xs text-gray-500">
            {campaign.beneficiary.substring(0, 10)}...{campaign.beneficiary.substring(campaign.beneficiary.length - 8)}
          </p>
        </div>

        <button className="w-full mt-3 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold text-sm">
          View Details
        </button>
      </div>
    </div>
  );
};
