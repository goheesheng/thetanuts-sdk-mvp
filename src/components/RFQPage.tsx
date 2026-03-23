/**
 * RFQPage Component
 *
 * Main container for RFQ functionality with sub-navigation.
 */

import { useState } from 'react';
import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';
import { ErrorBoundary } from './ErrorBoundary';
import { RFQCreateForm } from './RFQCreateForm';
import { RFQList } from './RFQList';
import { RFQHistory } from './RFQHistory';
import { RFQSubTab } from '../types/rfq';

interface RFQPageProps {
  client: ThetanutsClient;
  address: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
}

const subTabs: { id: RFQSubTab; label: string }[] = [
  { id: 'create', label: 'Create' },
  { id: 'active', label: 'Active' },
  { id: 'history', label: 'History' },
];

export function RFQPage({ client, address, isConnected, isCorrectNetwork }: RFQPageProps) {
  const [activeSubTab, setActiveSubTab] = useState<RFQSubTab>('create');

  // Handle successful RFQ creation - switch to Active tab
  const handleRFQCreated = () => {
    setActiveSubTab('active');
  };

  // Show connect prompt if not connected
  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">RFQ Trading</h2>
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            Connect your wallet to use RFQ trading
          </p>
        </div>
      </div>
    );
  }

  // Show network warning if wrong network
  if (!isCorrectNetwork) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">RFQ Trading</h2>
        <div className="text-center py-8">
          <p className="text-yellow-400 mb-4">
            Please switch to Base network to use RFQ trading
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">RFQ Trading</h2>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-lg mb-6">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSubTab === tab.id
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <ErrorBoundary onReset={() => setActiveSubTab('create')}>
        {activeSubTab === 'create' && address && (
          <RFQCreateForm
            client={client}
            address={address}
            onSuccess={handleRFQCreated}
          />
        )}

        {activeSubTab === 'active' && address && (
          <RFQList
            client={client}
            address={address}
            onRFQSettled={() => {
              // Optionally switch to history after settlement
            }}
          />
        )}

        {activeSubTab === 'history' && address && (
          <RFQHistory
            client={client}
            address={address}
          />
        )}
      </ErrorBoundary>
    </div>
  );
}
