/**
 * ExpiryPicker Component
 *
 * Date picker that only allows Friday 8:00 UTC selections.
 * Shows next 4 valid expiry dates as quick-select buttons.
 */

import { useMemo } from 'react';
import { ExpiryPickerProps } from '../types/rfq';

/**
 * Get the next N Friday 8:00 UTC timestamps
 */
function getNextFridayExpiries(count: number, minDate?: number): number[] {
  const expiries: number[] = [];
  const now = minDate ? Math.max(Date.now(), minDate * 1000) : Date.now();
  let date = new Date(now);

  // Move to the next day to avoid same-day expiries
  date.setUTCDate(date.getUTCDate() + 1);

  while (expiries.length < count) {
    // Find next Friday
    const dayOfWeek = date.getUTCDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    date.setUTCDate(date.getUTCDate() + daysUntilFriday);

    // Set to 8:00 UTC
    date.setUTCHours(8, 0, 0, 0);

    // Only add if it's in the future
    if (date.getTime() > now) {
      expiries.push(Math.floor(date.getTime() / 1000));
    }

    // Move to next day to find next Friday
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return expiries;
}

/**
 * Format expiry timestamp for display
 */
function formatExpiryOption(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ExpiryPicker({ value, onChange, minDate, error }: ExpiryPickerProps) {
  // Generate next 4 valid expiry dates
  const quickExpiries = useMemo(() => getNextFridayExpiries(4, minDate), [minDate]);

  // Format selected value for display
  const selectedDisplay = value ? formatExpiryOption(value) : 'Select expiry';

  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-400">
        Expiry (Friday 8:00 UTC)
      </label>

      {/* Quick select buttons */}
      <div className="grid grid-cols-2 gap-2">
        {quickExpiries.map((expiry) => (
          <button
            key={expiry}
            type="button"
            onClick={() => onChange(expiry)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              value === expiry
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {formatExpiryOption(expiry)}
          </button>
        ))}
      </div>

      {/* Selected value display */}
      {value && (
        <div className="mt-2 p-2 bg-gray-800 rounded-lg text-sm">
          <span className="text-gray-400">Selected: </span>
          <span className="text-white font-medium">{selectedDisplay}</span>
          <span className="text-gray-500 ml-2">08:00 UTC</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-400 mt-1">{error}</p>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Options expire on Fridays at 8:00 UTC
      </p>
    </div>
  );
}
