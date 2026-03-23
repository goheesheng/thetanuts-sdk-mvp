/**
 * OffersList Component
 *
 * Display and decrypt offers for an RFQ.
 * Sorts by best price and highlights best offer.
 */

import { useState, useEffect } from 'react';
import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';
import { StateOffer, DecryptedOfferDisplay } from '../types/rfq';
import { formatAddress, formatPrice } from '../utils/formatters';

interface OffersListProps {
  offers: StateOffer[];
  client: ThetanutsClient;
  rfqIsLong: boolean;
}

export function OffersList({ offers, client, rfqIsLong }: OffersListProps) {
  const [decryptedOffers, setDecryptedOffers] = useState<DecryptedOfferDisplay[]>([]);
  const [decrypting, setDecrypting] = useState(true);

  // Decrypt offers on mount
  useEffect(() => {
    async function decryptAllOffers() {
      setDecrypting(true);
      const decrypted: DecryptedOfferDisplay[] = [];

      for (const offer of offers) {
        try {
          const result = await client.rfqKeys.decryptOffer(
            offer.signedOfferForRequester,
            offer.signingKey
          );
          decrypted.push({
            offeror: offer.offeror,
            amount: result.offerAmount,
            nonce: result.nonce,
            isDecrypted: true,
            originalOffer: offer,
          });
        } catch (err) {
          // Decryption failed - offer may use different keys
          decrypted.push({
            offeror: offer.offeror,
            amount: null,
            nonce: null,
            isDecrypted: false,
            originalOffer: offer,
          });
        }
      }

      // Sort by best price (for Long: lowest is best, for Short: highest is best)
      decrypted.sort((a, b) => {
        // Non-decrypted offers go to the end
        if (!a.isDecrypted && !b.isDecrypted) return 0;
        if (!a.isDecrypted) return 1;
        if (!b.isDecrypted) return -1;

        const aPrice = Number(a.amount);
        const bPrice = Number(b.amount);

        return rfqIsLong ? aPrice - bPrice : bPrice - aPrice;
      });

      setDecryptedOffers(decrypted);
      setDecrypting(false);
    }

    if (offers.length > 0) {
      decryptAllOffers();
    } else {
      setDecryptedOffers([]);
      setDecrypting(false);
    }
  }, [offers, client, rfqIsLong]);

  if (decrypting) {
    return (
      <div className="text-sm text-gray-400 py-2">
        Decrypting offers...
      </div>
    );
  }

  if (decryptedOffers.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-2">
        No offers yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-300">
        Offers ({decryptedOffers.length})
      </h4>
      <div className="space-y-1">
        {decryptedOffers.map((offer, index) => {
          const isBest = index === 0 && offer.isDecrypted;

          return (
            <div
              key={offer.offeror}
              className={`flex items-center justify-between p-2 rounded-lg ${
                isBest ? 'bg-green-900/30 border border-green-700' : 'bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">
                  {formatAddress(offer.offeror)}
                </span>
                {isBest && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-green-600 text-white rounded">
                    BEST
                  </span>
                )}
              </div>

              {offer.isDecrypted ? (
                <span className="text-sm font-mono text-white">
                  {formatPrice(offer.amount!)} /contract
                </span>
              ) : (
                <span className="text-sm text-gray-500 italic">
                  Encrypted
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
