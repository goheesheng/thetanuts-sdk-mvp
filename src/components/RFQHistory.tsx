/**
 * RFQHistory Component
 *
 * Display settled and cancelled RFQ requests.
 */

import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';
import { useRFQ } from '../hooks/useRFQ';
import {
  formatStrike,
  formatExpiryShort,
  formatAddress,
  getOptionTypeLabel,
  getOptionTypeColorClasses,
  getStatusColorClasses,
} from '../utils/formatters';

interface RFQHistoryProps {
  client: ThetanutsClient;
  address: string;
}

export function RFQHistory({ client, address }: RFQHistoryProps) {
  const { historyRfqs, loading, error, refreshRFQs } = useRFQ({ client, address });

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

  if (historyRfqs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-2">No RFQ history</p>
        <p className="text-sm text-gray-500">
          Completed and cancelled RFQs will appear here
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">
          RFQ History ({historyRfqs.length})
        </h3>
        <button
          onClick={refreshRFQs}
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
              <th className="pb-3 pr-4">ID</th>
              <th className="pb-3 pr-4">Type</th>
              <th className="pb-3 pr-4">Strikes</th>
              <th className="pb-3 pr-4">Expiry</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Option</th>
            </tr>
          </thead>
          <tbody>
            {historyRfqs.map((rfq) => {
              const optionType = getOptionTypeLabel(Number(rfq.optionType));
              const optionColorClasses = getOptionTypeColorClasses(optionType);
              const statusColorClasses = getStatusColorClasses(rfq.status);
              const strikes = (rfq.strikes || []).map((s) => BigInt(s));
              const strikesDisplay = strikes.map((s) => formatStrike(s)).join(' / ');

              return (
                <tr key={rfq.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 pr-4">
                    <span className="text-gray-400">#{rfq.id}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${optionColorClasses}`}>
                      {optionType}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm">
                    {strikesDisplay}
                  </td>
                  <td className="py-3 pr-4 text-gray-300 text-sm">
                    {formatExpiryShort(rfq.expiryTimestamp)}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColorClasses}`}>
                      {rfq.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {rfq.status === 'settled' && rfq.optionAddress ? (
                      <a
                        href={`https://basescan.org/address/${rfq.optionAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-sm"
                      >
                        {formatAddress(rfq.optionAddress)}
                      </a>
                    ) : (
                      <span className="text-gray-500 text-sm">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
