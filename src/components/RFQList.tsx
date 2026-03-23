/**
 * RFQList Component
 *
 * Display list of active RFQ requests with real-time updates.
 */

import { useState, useEffect } from 'react';
import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';
import { RFQCard } from './RFQCard';
import { useRFQ } from '../hooks/useRFQ';

interface RFQListProps {
  client: ThetanutsClient;
  address: string;
  onRFQSettled?: () => void;
}

export function RFQList({ client, address, onRFQSettled }: RFQListProps) {
  const { activeRfqs, loading, error, refreshRFQs, settleRFQ, cancelRFQ, subscribeToRFQ } = useRFQ({
    client,
    address,
  });

  const [expandedRfqId, setExpandedRfqId] = useState<string | null>(null);

  // Subscribe to WebSocket updates for all active RFQs
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    for (const rfq of activeRfqs) {
      const unsub = subscribeToRFQ(BigInt(rfq.id), {
        onOfferMade: () => {
          // RFQ data will be refreshed automatically by the hook
        },
        onSettled: () => {
          onRFQSettled?.();
        },
      });
      unsubscribes.push(unsub);
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [activeRfqs, subscribeToRFQ, onRFQSettled]);

  const handleToggle = (rfqId: string) => {
    setExpandedRfqId(expandedRfqId === rfqId ? null : rfqId);
  };

  const handleSettle = async (rfqId: string) => {
    await settleRFQ(BigInt(rfqId));
    onRFQSettled?.();
  };

  const handleCancel = async (rfqId: string) => {
    await cancelRFQ(BigInt(rfqId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={refreshRFQs}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (activeRfqs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-2">No active RFQ requests</p>
        <p className="text-sm text-gray-500">
          Create a new RFQ to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">
          Active RFQs ({activeRfqs.length})
        </h3>
        <button
          onClick={refreshRFQs}
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {activeRfqs.map((rfq) => (
        <RFQCard
          key={rfq.id}
          rfq={rfq}
          client={client}
          isExpanded={expandedRfqId === rfq.id}
          onToggle={() => handleToggle(rfq.id)}
          onSettle={() => handleSettle(rfq.id)}
          onCancel={() => handleCancel(rfq.id)}
        />
      ))}
    </div>
  );
}
