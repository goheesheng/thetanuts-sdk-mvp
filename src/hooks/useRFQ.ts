/**
 * useRFQ Hook
 *
 * Centralized state management and SDK operations for RFQ trading.
 * Handles RFQ creation, settlement, cancellation, offer decryption, and WebSocket subscriptions.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';
import {
  StateRfq,
  StateOffer,
  RFQKeyPair,
  RFQFormState,
  DecryptedOfferDisplay,
  RFQSubscriptionCallbacks,
  UseRFQReturn,
} from '../types/rfq';

interface UseRFQProps {
  client: ThetanutsClient;
  address: string | null;
}

export function useRFQ({ client, address }: UseRFQProps): UseRFQReturn {
  // State
  const [activeRfqs, setActiveRfqs] = useState<StateRfq[]>([]);
  const [historyRfqs, setHistoryRfqs] = useState<StateRfq[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track active WebSocket subscriptions for cleanup
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());

  /**
   * Fetch user's RFQs and categorize by status
   */
  const fetchUserRFQs = useCallback(async () => {
    if (!address) {
      setActiveRfqs([]);
      setHistoryRfqs([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rfqs = await client.api.getUserRfqs(address);

      // Separate active vs history (settled/cancelled)
      const active: StateRfq[] = [];
      const history: StateRfq[] = [];

      for (const rfq of rfqs) {
        if (rfq.status === 'active') {
          active.push(rfq);
        } else {
          history.push(rfq);
        }
      }

      // Sort active by creation time (newest first)
      active.sort((a, b) => b.createdAt - a.createdAt);
      // Sort history by creation time (newest first)
      history.sort((a, b) => b.createdAt - a.createdAt);

      setActiveRfqs(active);
      setHistoryRfqs(history);
    } catch (err) {
      console.error('Failed to fetch user RFQs:', err);
      setError('Failed to load RFQs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [client, address]);

  /**
   * Refresh RFQs (public method)
   */
  const refreshRFQs = useCallback(async () => {
    await fetchUserRFQs();
  }, [fetchUserRFQs]);

  /**
   * Ensure we have an ECDH key pair for sealed-bid auctions
   */
  const ensureKeyPair = useCallback(async (): Promise<RFQKeyPair> => {
    return await client.rfqKeys.getOrCreateKeyPair();
  }, [client]);

  /**
   * Create a new RFQ request
   */
  const createRFQ = useCallback(async (params: RFQFormState): Promise<string> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    // Ensure we have keys for sealed-bid offers
    const keyPair = await ensureKeyPair();

    // Build the appropriate RFQ request based on structure
    let rfqRequest;
    const baseParams = {
      requester: address as `0x${string}`,
      underlying: params.underlying,
      optionType: params.optionType,
      numContracts: params.numContracts,
      isLong: params.isLong,
      offerDeadlineMinutes: params.offerDeadlineMinutes,
      collateralToken: params.collateralToken,
      reservePrice: params.reservePrice,
      convertToLimitOrder: params.convertToLimitOrder,
      requesterPublicKey: keyPair.publicKey,
    };

    switch (params.structure) {
      case 'vanilla':
        rfqRequest = client.optionFactory.buildRFQRequest({
          ...baseParams,
          strikes: params.strikes[0],
          expiry: params.expiry,
        });
        break;

      case 'spread':
        rfqRequest = client.optionFactory.buildSpreadRFQ({
          ...baseParams,
          lowerStrike: Math.min(params.strikes[0], params.strikes[1]),
          upperStrike: Math.max(params.strikes[0], params.strikes[1]),
          expiry: params.expiry,
        });
        break;

      case 'butterfly':
        const sortedButterfly = [...params.strikes].sort((a, b) => a - b);
        rfqRequest = client.optionFactory.buildButterflyRFQ({
          ...baseParams,
          lowerStrike: sortedButterfly[0],
          middleStrike: sortedButterfly[1],
          upperStrike: sortedButterfly[2],
          expiry: params.expiry,
        });
        break;

      case 'condor':
        const sortedCondor = [...params.strikes].sort((a, b) => a - b);
        rfqRequest = client.optionFactory.buildCondorRFQ({
          ...baseParams,
          strike1: sortedCondor[0],
          strike2: sortedCondor[1],
          strike3: sortedCondor[2],
          strike4: sortedCondor[3],
          expiry: params.expiry,
        });
        break;

      case 'iron-condor':
        const sortedIronCondor = [...params.strikes].sort((a, b) => a - b);
        rfqRequest = client.optionFactory.buildIronCondorRFQ({
          ...baseParams,
          underlying: params.underlying,
          strike1: sortedIronCondor[0],
          strike2: sortedIronCondor[1],
          strike3: sortedIronCondor[2],
          strike4: sortedIronCondor[3],
          expiry: params.expiry,
        });
        break;

      default:
        throw new Error(`Unknown structure: ${params.structure}`);
    }

    // For short positions, we need collateral approval
    // Note: SDK buildRFQRequest sets collateralAmount to 0 as collateral is pulled at settlement
    // But for SELL positions, user needs to approve collateral for the OptionFactory
    if (!params.isLong) {
      const config = client.chainConfig;
      let collateralAddress: string;

      switch (params.collateralToken) {
        case 'USDC':
          collateralAddress = config.tokens.USDC.address;
          break;
        case 'WETH':
          collateralAddress = config.tokens.WETH.address;
          break;
        case 'cbBTC':
          collateralAddress = config.tokens.cbBTC?.address || '';
          break;
        default:
          throw new Error(`Unknown collateral token: ${params.collateralToken}`);
      }

      // Calculate required collateral amount based on option type
      // For PUT: collateral = strike * numContracts / 1e8
      // For CALL: collateral = numContracts (1:1 with underlying)
      let collateralAmount: bigint;
      if (params.optionType === 'PUT') {
        // Use the highest strike for collateral calculation
        const maxStrike = Math.max(...params.strikes);
        collateralAmount = BigInt(Math.floor(maxStrike * params.numContracts * 1e6)); // USDC decimals
      } else {
        // CALL - collateral in underlying (WETH)
        collateralAmount = BigInt(Math.floor(params.numContracts * 1e18)); // WETH decimals
      }

      // Ensure allowance for OptionFactory
      const factoryAddress = config.contracts.optionFactory;
      await client.erc20.ensureAllowance(collateralAddress, factoryAddress, collateralAmount);
    }

    // Submit the RFQ
    const receipt = await client.optionFactory.requestForQuotation(rfqRequest);

    // Get the RFQ ID from the transaction (we'd need to parse events or use callStatic)
    // For now, refresh and return the latest RFQ ID
    await refreshRFQs();

    // Return transaction hash as identifier (actual RFQ ID would come from events)
    return receipt.hash;
  }, [client, address, ensureKeyPair, refreshRFQs]);

  /**
   * Settle an RFQ after offer period ends
   */
  const settleRFQ = useCallback(async (quotationId: bigint): Promise<void> => {
    await client.optionFactory.settleQuotation(quotationId);
    await refreshRFQs();
  }, [client, refreshRFQs]);

  /**
   * Cancel an RFQ (only if no offers)
   */
  const cancelRFQ = useCallback(async (quotationId: bigint): Promise<void> => {
    await client.optionFactory.cancelQuotation(quotationId);
    await refreshRFQs();
  }, [client, refreshRFQs]);

  /**
   * Get offers for a specific RFQ
   */
  const getOffersForRFQ = useCallback(async (rfqId: string): Promise<StateOffer[]> => {
    const rfq = await client.api.getRfq(rfqId);
    if (!rfq.offers) {
      return [];
    }
    return Object.values(rfq.offers);
  }, [client]);

  /**
   * Decrypt an offer using our ECDH key pair
   */
  const decryptOffer = useCallback(async (offer: StateOffer): Promise<DecryptedOfferDisplay> => {
    try {
      const decrypted = await client.rfqKeys.decryptOffer(
        offer.signedOfferForRequester,
        offer.signingKey
      );

      return {
        offeror: offer.offeror,
        amount: decrypted.offerAmount,
        nonce: decrypted.nonce,
        isDecrypted: true,
        originalOffer: offer,
      };
    } catch (err) {
      console.warn('Failed to decrypt offer:', err);
      return {
        offeror: offer.offeror,
        amount: null,
        nonce: null,
        isDecrypted: false,
        originalOffer: offer,
      };
    }
  }, [client]);

  /**
   * Subscribe to real-time updates for an RFQ
   */
  const subscribeToRFQ = useCallback((
    quotationId: bigint,
    callbacks: RFQSubscriptionCallbacks
  ): () => void => {
    const rfqIdStr = quotationId.toString();

    // Unsubscribe from existing subscription if any
    const existingUnsub = subscriptionsRef.current.get(rfqIdStr);
    if (existingUnsub) {
      existingUnsub();
    }

    // Create new subscription
    const subscription = client.ws.subscribeToRfq(quotationId, {
      onOfferMade: () => {
        // Refresh RFQ data when offer is made
        refreshRFQs();
        callbacks.onOfferMade?.(rfqIdStr);
      },
      onOfferRevealed: () => {
        refreshRFQs();
        callbacks.onOfferRevealed?.(rfqIdStr);
      },
      onSettled: () => {
        refreshRFQs();
        callbacks.onSettled?.(rfqIdStr);
      },
      onCancelled: () => {
        refreshRFQs();
        callbacks.onCancelled?.(rfqIdStr);
      },
      onError: (error) => {
        console.error('RFQ WebSocket error:', error);
        callbacks.onError?.(error);
      },
    });

    // Store unsubscribe function
    subscriptionsRef.current.set(rfqIdStr, subscription.unsubscribe);

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(rfqIdStr);
    };
  }, [client, refreshRFQs]);

  // Initial fetch when address changes
  useEffect(() => {
    if (address) {
      fetchUserRFQs();
    } else {
      setActiveRfqs([]);
      setHistoryRfqs([]);
    }
  }, [address, fetchUserRFQs]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach((unsub) => unsub());
      subscriptionsRef.current.clear();
    };
  }, []);

  return {
    // State
    activeRfqs,
    historyRfqs,
    loading,
    error,

    // Actions
    createRFQ,
    settleRFQ,
    cancelRFQ,
    refreshRFQs,

    // Offers
    getOffersForRFQ,
    decryptOffer,

    // Keys
    ensureKeyPair,

    // WebSocket
    subscribeToRFQ,
  };
}
