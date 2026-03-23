/**
 * RFQCard Component
 *
 * Expandable card showing RFQ details, countdown timer, and offers.
 */

import { useState, useEffect } from 'react';
import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';
import { StateRfq, StateOffer } from '../types/rfq';
import { OffersList } from './OffersList';
import {
  formatStrike,
  formatExpiryShort,
  formatCountdown,
  getOptionTypeLabel,
  getOptionTypeColorClasses,
} from '../utils/formatters';

interface RFQCardProps {
  rfq: StateRfq;
  client: ThetanutsClient;
  isExpanded: boolean;
  onToggle: () => void;
  onSettle: () => Promise<void>;
  onCancel: () => Promise<void>;
}

export function RFQCard({
  rfq,
  client,
  isExpanded,
  onToggle,
  onSettle,
  onCancel,
}: RFQCardProps) {
  const [countdown, setCountdown] = useState<string>('');
  const [offers, setOffers] = useState<StateOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [settling, setSettling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(formatCountdown(rfq.offerEndTimestamp));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [rfq.offerEndTimestamp]);

  // Load offers when expanded
  useEffect(() => {
    async function loadOffers() {
      if (!isExpanded) return;

      setLoadingOffers(true);
      try {
        const rfqWithOffers = await client.api.getRfq(rfq.id);
        if (rfqWithOffers.offers) {
          setOffers(Object.values(rfqWithOffers.offers));
        }
      } catch (err) {
        console.error('Failed to load offers:', err);
      } finally {
        setLoadingOffers(false);
      }
    }

    loadOffers();
  }, [isExpanded, rfq.id, client]);

  const optionType = getOptionTypeLabel(Number(rfq.optionType));
  const optionColorClasses = getOptionTypeColorClasses(optionType);

  // Parse strikes - rfq.strikes may be string array
  const strikes = (rfq.strikes || []).map((s) => BigInt(s));
  const strikesDisplay = strikes.map((s) => formatStrike(s)).join(' / ');

  const offerCount = rfq.offers ? Object.keys(rfq.offers).length : 0;
  const hasEnded = countdown === 'Ended';
  const canSettle = hasEnded && offerCount > 0;
  const canCancel = !hasEnded && offerCount === 0;

  const handleSettle = async () => {
    setSettling(true);
    setActionError(null);
    try {
      await onSettle();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to settle');
    } finally {
      setSettling(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setActionError(null);
    try {
      await onCancel();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">#{rfq.id}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${optionColorClasses}`}>
              {optionType}
            </span>
            <span className="font-medium">{strikesDisplay}</span>
            <span className="text-gray-400 text-sm">
              Exp: {formatExpiryShort(rfq.expiryTimestamp)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Offer count badge */}
            <span className={`px-2 py-1 rounded text-xs ${
              offerCount > 0 ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-700 text-gray-400'
            }`}>
              {offerCount} offer{offerCount !== 1 ? 's' : ''}
            </span>

            {/* Countdown */}
            <span className={`text-sm ${hasEnded ? 'text-yellow-400' : 'text-gray-300'}`}>
              {hasEnded ? 'Ended' : countdown}
            </span>

            {/* Expand indicator */}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Secondary info */}
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
          <span>{rfq.numContracts} contracts</span>
          <span className={rfq.isRequestingLongPosition ? 'text-green-400' : 'text-red-400'}>
            {rfq.isRequestingLongPosition ? 'Long' : 'Short'}
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-700">
          {/* Offers */}
          <div className="mt-4">
            {loadingOffers ? (
              <div className="text-sm text-gray-400">Loading offers...</div>
            ) : (
              <OffersList
                offers={offers}
                client={client}
                rfqIsLong={rfq.isRequestingLongPosition}
              />
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-3">
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Cancelling...' : 'Cancel RFQ'}
              </button>
            )}

            {canSettle && (
              <button
                onClick={handleSettle}
                disabled={settling}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {settling ? 'Settling...' : 'Settle RFQ'}
              </button>
            )}

            {!canSettle && !canCancel && hasEnded && offerCount === 0 && (
              <span className="text-sm text-gray-500">
                No offers received - RFQ expired
              </span>
            )}

            {!hasEnded && offerCount > 0 && (
              <span className="text-sm text-gray-500">
                Waiting for offer period to end...
              </span>
            )}
          </div>

          {/* Error message */}
          {actionError && (
            <div className="mt-3 p-2 bg-red-900/30 border border-red-700 rounded text-sm text-red-300">
              {actionError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
