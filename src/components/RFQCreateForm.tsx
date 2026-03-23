/**
 * RFQCreateForm Component
 *
 * Form for creating new RFQ requests with all option parameters.
 */

import { useState } from 'react';
import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';
import { ExpiryPicker } from './ExpiryPicker';
import { HelpIcon } from './Tooltip';
import { CollateralEstimate } from './CollateralEstimate';
import {
  RFQFormState,
  OptionStructure,
  Underlying,
  OptionType,
  CollateralToken,
  TransactionState,
  STRIKES_PER_STRUCTURE,
  DEFAULT_RFQ_FORM,
} from '../types/rfq';
import { useRFQ } from '../hooks/useRFQ';

interface RFQCreateFormProps {
  client: ThetanutsClient;
  address: string;
  onSuccess: (rfqId: string) => void;
}

const STRUCTURES: { id: OptionStructure; label: string; description: string }[] = [
  { id: 'vanilla', label: 'Vanilla', description: 'Single strike option' },
  { id: 'spread', label: 'Spread', description: '2 strikes for directional' },
  { id: 'butterfly', label: 'Butterfly', description: '3 strikes, profit at middle' },
  { id: 'condor', label: 'Condor', description: '4 strikes, wider profit zone' },
  { id: 'iron-condor', label: 'Iron Condor', description: 'Combined put & call spreads' },
];

const COLLATERAL_TOKENS: CollateralToken[] = ['USDC', 'WETH', 'cbBTC'];
const DEADLINE_OPTIONS = [3, 6, 10, 15, 30];

export function RFQCreateForm({ client, address, onSuccess }: RFQCreateFormProps) {
  const { createRFQ } = useRFQ({ client, address });

  // Form state
  const [form, setForm] = useState<RFQFormState>({
    ...DEFAULT_RFQ_FORM,
    strikes: [0],
  });

  // Transaction state
  const [txState, setTxState] = useState<TransactionState>({
    status: 'idle',
    hash: null,
    error: null,
  });

  // Update form field
  const updateForm = <K extends keyof RFQFormState>(field: K, value: RFQFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Update structure and adjust strikes array
  const updateStructure = (structure: OptionStructure) => {
    const numStrikes = STRIKES_PER_STRUCTURE[structure];
    const newStrikes = Array(numStrikes).fill(0);
    // Preserve existing strike values where possible
    for (let i = 0; i < Math.min(form.strikes.length, numStrikes); i++) {
      newStrikes[i] = form.strikes[i];
    }
    setForm((prev) => ({ ...prev, structure, strikes: newStrikes }));
  };

  // Update individual strike
  const updateStrike = (index: number, value: number) => {
    setForm((prev) => {
      const newStrikes = [...prev.strikes];
      newStrikes[index] = value;
      return { ...prev, strikes: newStrikes };
    });
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!form.expiry) return 'Please select an expiry date';
    if (form.strikes.some((s) => s <= 0)) return 'All strike prices must be greater than 0';
    if (form.numContracts < 0.001) return 'Minimum contract size is 0.001';
    if (form.offerDeadlineMinutes <= 0) return 'Offer deadline must be greater than 0';

    // Check strike ordering for certain structures
    if (form.structure === 'spread' || form.structure === 'butterfly' || form.structure === 'condor') {
      const hasDistinct = new Set(form.strikes).size === form.strikes.length;
      if (!hasDistinct) return 'All strikes must be different';
    }

    return null;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setTxState({ status: 'error', hash: null, error: validationError });
      return;
    }

    setTxState({ status: 'submitting', hash: null, error: null });

    try {
      const txHash = await createRFQ(form);
      setTxState({ status: 'success', hash: txHash, error: null });
      onSuccess(txHash);
    } catch (err) {
      console.error('Failed to create RFQ:', err);
      setTxState({
        status: 'error',
        hash: null,
        error: err instanceof Error ? err.message : 'Failed to create RFQ',
      });
    }
  };

  // Get strike label based on structure and index
  const getStrikeLabel = (index: number): string => {
    switch (form.structure) {
      case 'vanilla':
        return 'Strike Price';
      case 'spread':
        return index === 0 ? 'Lower Strike' : 'Upper Strike';
      case 'butterfly':
        return ['Lower Strike', 'Middle Strike', 'Upper Strike'][index];
      case 'condor':
      case 'iron-condor':
        return `Strike ${index + 1}`;
      default:
        return 'Strike';
    }
  };

  const isSubmitting = txState.status === 'submitting' || txState.status === 'approving';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Structure Selection */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Option Structure
          <HelpIcon tooltip="Choose the complexity of your option trade" />
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {STRUCTURES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => updateStructure(s.id)}
              className={`p-3 rounded-lg text-left transition-colors ${
                form.structure === s.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-medium">{s.label}</div>
              <div className="text-xs opacity-75">{s.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Underlying & Option Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Underlying
            <HelpIcon tooltip="The asset the option is based on" />
          </label>
          <div className="flex gap-2">
            {(['ETH', 'BTC'] as Underlying[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => updateForm('underlying', u)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  form.underlying === u
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Option Type
            <HelpIcon tooltip="CALL: profit if price goes up. PUT: profit if price goes down" />
          </label>
          <div className="flex gap-2">
            {(['CALL', 'PUT'] as OptionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateForm('optionType', t)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  form.optionType === t
                    ? t === 'CALL'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Strike Prices */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Strike Price{form.strikes.length > 1 ? 's' : ''} (USD)
          <HelpIcon tooltip="The price at which the option can be exercised" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          {form.strikes.map((strike, index) => (
            <div key={index}>
              <label className="block text-xs text-gray-500 mb-1">
                {getStrikeLabel(index)}
              </label>
              <input
                type="number"
                value={strike || ''}
                onChange={(e) => updateStrike(index, parseFloat(e.target.value) || 0)}
                placeholder="e.g., 2500"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Expiry */}
      <ExpiryPicker
        value={form.expiry}
        onChange={(expiry) => updateForm('expiry', expiry)}
      />

      {/* Number of Contracts & Position */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Contracts
            <HelpIcon tooltip="Number of option contracts to trade" />
          </label>
          <input
            type="number"
            value={form.numContracts || ''}
            onChange={(e) => updateForm('numContracts', parseFloat(e.target.value) || 0)}
            placeholder="Number of contracts"
            min={0.001}
            step={0.001}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">Minimum: 0.001</p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Position
            <HelpIcon tooltip="Long: buy options. Short: sell options (requires collateral)" />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateForm('isLong', true)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                form.isLong
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Long (Buy)
            </button>
            <button
              type="button"
              onClick={() => updateForm('isLong', false)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                !form.isLong
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Short (Sell)
            </button>
          </div>
        </div>
      </div>

      {/* Collateral & Offer Deadline */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Collateral Token
            <HelpIcon tooltip="Token used as collateral for short positions" />
          </label>
          <select
            value={form.collateralToken}
            onChange={(e) => updateForm('collateralToken', e.target.value as CollateralToken)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={isSubmitting}
          >
            {COLLATERAL_TOKENS.map((token) => (
              <option key={token} value={token}>
                {token}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Offer Deadline
            <HelpIcon tooltip="Time market makers have to submit quotes" />
          </label>
          <select
            value={form.offerDeadlineMinutes}
            onChange={(e) => updateForm('offerDeadlineMinutes', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={isSubmitting}
          >
            {DEADLINE_OPTIONS.map((mins) => (
              <option key={mins} value={mins}>
                {mins} minutes
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reserve Price (Optional) */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Reserve Price (optional)
          <span className="text-xs text-gray-500 ml-2">Min acceptable price per contract</span>
        </label>
        <input
          type="number"
          value={form.reservePrice || ''}
          onChange={(e) => updateForm('reservePrice', parseFloat(e.target.value) || undefined)}
          placeholder="e.g., 50.00"
          min={0}
          step={0.01}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
          disabled={isSubmitting}
        />

        {/* Limit Order Conversion Option - only show when reserve price is set */}
        {form.reservePrice && form.reservePrice > 0 && (
          <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.convertToLimitOrder}
                onChange={(e) => updateForm('convertToLimitOrder', e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <div>
                <span className="text-sm text-gray-300">
                  Convert to limit order if no offers
                  <HelpIcon tooltip="Without this, RFQ expires worthless if no offers. With this, it becomes a limit order that can be filled later." />
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  If enabled, your RFQ becomes a limit order at your reserve price when the offer deadline passes with no offers received.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* No reserve price message */}
        {(!form.reservePrice || form.reservePrice <= 0) && (
          <p className="text-xs text-gray-500 mt-2">
            No reserve price - best offer wins
          </p>
        )}
      </div>

      {/* Preview Section */}
      {form.expiry > 0 && form.strikes[0] > 0 && form.numContracts > 0 && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Preview</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Structure:</span>
              <span className="capitalize">{form.structure.replace('-', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Option:</span>
              <span>{form.underlying} {form.optionType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Strikes:</span>
              <span>${form.strikes.filter(s => s > 0).join(' / $')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Contracts:</span>
              <span>{form.numContracts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Position:</span>
              <span className={form.isLong ? 'text-green-400' : 'text-red-400'}>
                {form.isLong ? 'Long (Buy)' : 'Short (Sell)'}
              </span>
            </div>
          </div>

          {/* Collateral Estimate */}
          <CollateralEstimate
            client={client}
            isLong={form.isLong}
            optionType={form.optionType}
            underlying={form.underlying}
            structure={form.structure}
            strikes={form.strikes}
            numContracts={form.numContracts}
          />
        </div>
      )}

      {/* Status Messages */}
      {txState.status === 'submitting' && (
        <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-sm text-blue-300">
          Creating RFQ... Please confirm in your wallet.
        </div>
      )}
      {txState.status === 'approving' && (
        <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-sm text-blue-300">
          Approving collateral... Please confirm in your wallet.
        </div>
      )}
      {txState.status === 'success' && (
        <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg text-sm text-green-300">
          RFQ created successfully!
          {txState.hash && (
            <a
              href={`https://basescan.org/tx/${txState.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-1 text-blue-400 hover:underline"
            >
              View on BaseScan
            </a>
          )}
        </div>
      )}
      {txState.error && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300">
          {txState.error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          isSubmitting
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isSubmitting ? 'Creating...' : 'Create RFQ Request'}
      </button>
    </form>
  );
}
