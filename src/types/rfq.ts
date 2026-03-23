/**
 * RFQ Type Definitions
 *
 * TypeScript interfaces for the RFQ Trading Page feature.
 * Re-exports relevant SDK types and defines internal types.
 */

import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';

// Re-export SDK types for convenience
// These are inferred from the SDK's API responses
type StateApiResponse = Awaited<ReturnType<ThetanutsClient['api']['getStateFromRfq']>>;
export type StateRfq = StateApiResponse['rfqs'][string];
export type StateOffer = StateApiResponse['offers'][string][string];
export type StateOption = StateApiResponse['options'][string];

// RFQ Key Pair type from SDK
export type RFQKeyPair = Awaited<ReturnType<ThetanutsClient['rfqKeys']['getOrCreateKeyPair']>>;

/**
 * Option structure types supported by the RFQ system
 */
export type OptionStructure = 'vanilla' | 'spread' | 'butterfly' | 'condor' | 'iron-condor';

/**
 * Underlying assets supported
 */
export type Underlying = 'ETH' | 'BTC';

/**
 * Option types
 */
export type OptionType = 'CALL' | 'PUT';

/**
 * Collateral tokens supported
 */
export type CollateralToken = 'USDC' | 'WETH' | 'cbBTC';

/**
 * Form state for creating an RFQ request
 */
export interface RFQFormState {
  /** Option structure type */
  structure: OptionStructure;
  /** Underlying asset */
  underlying: Underlying;
  /** Option type (CALL or PUT) */
  optionType: OptionType;
  /** Strike prices (human-readable, e.g., 2500 for $2,500) */
  strikes: number[];
  /** Expiry timestamp (Unix seconds) - must be Friday 8:00 UTC */
  expiry: number;
  /** Number of contracts */
  numContracts: number;
  /** True for long (buy) position, false for short (sell) */
  isLong: boolean;
  /** Collateral token */
  collateralToken: CollateralToken;
  /** Offer deadline in minutes from now */
  offerDeadlineMinutes: number;
  /** Reserve price (optional) - minimum acceptable price per contract */
  reservePrice?: number;
  /** Convert to limit order if no offers received (requires reserve price) */
  convertToLimitOrder: boolean;
}

/**
 * Transaction status states
 */
export type TxStatus = 'idle' | 'approving' | 'submitting' | 'success' | 'error';

/**
 * Transaction state for tracking on-chain operations
 */
export interface TransactionState {
  /** Current status of the transaction */
  status: TxStatus;
  /** Transaction hash (if submitted) */
  hash: string | null;
  /** Error message (if failed) */
  error: string | null;
}

/**
 * Decrypted offer display data
 */
export interface DecryptedOfferDisplay {
  /** Offeror's wallet address */
  offeror: string;
  /** Decrypted offer amount (price per contract, 8 decimals) */
  amount: bigint | null;
  /** Offer nonce */
  nonce: bigint | null;
  /** Whether decryption was successful */
  isDecrypted: boolean;
  /** Original offer data */
  originalOffer: StateOffer;
}

/**
 * RFQ status types
 */
export type RFQStatus = 'active' | 'settled' | 'cancelled';

/**
 * Main navigation tab
 */
export type MainTab = 'orderbook' | 'rfq';

/**
 * RFQ page sub-navigation tab
 */
export type RFQSubTab = 'create' | 'active' | 'history';

// ============================================
// Component Props Interfaces
// ============================================

/**
 * Props for TabNavigation component
 */
export interface TabNavigationProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

/**
 * Props for RFQPage component
 */
export interface RFQPageProps {
  client: ThetanutsClient;
  address: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
}

/**
 * Props for RFQCreateForm component
 */
export interface RFQCreateFormProps {
  client: ThetanutsClient;
  address: string;
  onSuccess: (rfqId: string) => void;
}

/**
 * Props for RFQList component
 */
export interface RFQListProps {
  client: ThetanutsClient;
  address: string;
  onRFQSettled?: () => void;
}

/**
 * Props for RFQCard component
 */
export interface RFQCardProps {
  rfq: StateRfq;
  client: ThetanutsClient;
  isExpanded: boolean;
  onToggle: () => void;
  onSettle: () => Promise<void>;
  onCancel: () => Promise<void>;
}

/**
 * Props for OffersList component
 */
export interface OffersListProps {
  offers: StateOffer[];
  client: ThetanutsClient;
  /** Whether the RFQ requester is in a long position (affects best price sorting) */
  rfqIsLong: boolean;
}

/**
 * Props for RFQHistory component
 */
export interface RFQHistoryProps {
  client: ThetanutsClient;
  address: string;
}

/**
 * Props for ExpiryPicker component
 */
export interface ExpiryPickerProps {
  /** Selected expiry timestamp (Unix seconds) */
  value: number | null;
  /** Callback when expiry changes */
  onChange: (expiry: number) => void;
  /** Minimum allowed date (optional) */
  minDate?: number;
  /** Error message to display */
  error?: string;
}

// ============================================
// Hook Return Types
// ============================================

/**
 * WebSocket subscription callbacks for RFQ
 */
export interface RFQSubscriptionCallbacks {
  onOfferMade?: (quotationId: string) => void;
  onOfferRevealed?: (quotationId: string) => void;
  onSettled?: (quotationId: string) => void;
  onCancelled?: (quotationId: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Return type for useRFQ hook
 */
export interface UseRFQReturn {
  // State
  activeRfqs: StateRfq[];
  historyRfqs: StateRfq[];
  loading: boolean;
  error: string | null;

  // Actions
  createRFQ: (params: RFQFormState) => Promise<string>;
  settleRFQ: (quotationId: bigint) => Promise<void>;
  cancelRFQ: (quotationId: bigint) => Promise<void>;
  refreshRFQs: () => Promise<void>;

  // Offers
  getOffersForRFQ: (rfqId: string) => Promise<StateOffer[]>;
  decryptOffer: (offer: StateOffer) => Promise<DecryptedOfferDisplay>;

  // Keys
  ensureKeyPair: () => Promise<RFQKeyPair>;

  // WebSocket
  subscribeToRFQ: (quotationId: bigint, callbacks: RFQSubscriptionCallbacks) => () => void;
}

/**
 * Number of strikes required for each option structure
 */
export const STRIKES_PER_STRUCTURE: Record<OptionStructure, number> = {
  'vanilla': 1,
  'spread': 2,
  'butterfly': 3,
  'condor': 4,
  'iron-condor': 4,
};

/**
 * Default form values for RFQ creation
 */
export const DEFAULT_RFQ_FORM: RFQFormState = {
  structure: 'vanilla',
  underlying: 'ETH',
  optionType: 'PUT',
  strikes: [0],
  expiry: 0,
  numContracts: 1,
  isLong: true,
  collateralToken: 'USDC',
  offerDeadlineMinutes: 6,
  reservePrice: undefined,
  convertToLimitOrder: false,
};
