/**
 * Shared Formatting Utilities
 *
 * Common formatting functions used across Orderbook and RFQ components.
 */

/**
 * Format strike price from 8 decimal bigint to human-readable USD string
 * @param strike - Strike price in 8 decimals (e.g., 250000000000n = $2,500)
 * @returns Formatted string like "$2,500"
 */
export function formatStrike(strike: bigint): string {
  return `$${(Number(strike) / 1e8).toLocaleString()}`;
}

/**
 * Format expiry timestamp to human-readable date string
 * @param expiry - Unix timestamp in seconds
 * @returns Formatted string like "Mar 28, 2026, 08:00 AM"
 */
export function formatExpiry(expiry: bigint | number): string {
  const timestamp = typeof expiry === 'bigint' ? Number(expiry) : expiry;
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format expiry timestamp to short date (for compact displays)
 * @param expiry - Unix timestamp in seconds
 * @returns Formatted string like "Mar 28"
 */
export function formatExpiryShort(expiry: bigint | number): string {
  const timestamp = typeof expiry === 'bigint' ? Number(expiry) : expiry;
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format price from 8 decimal bigint to human-readable USD string
 * @param price - Price in 8 decimals
 * @returns Formatted string like "$45.5000"
 */
export function formatPrice(price: bigint): string {
  return `$${(Number(price) / 1e8).toFixed(4)}`;
}

/**
 * Format price as a simple number (for calculations/display without $)
 * @param price - Price in 8 decimals
 * @returns Number value
 */
export function priceToNumber(price: bigint): number {
  return Number(price) / 1e8;
}

/**
 * Format countdown to deadline
 * @param deadline - Unix timestamp in seconds
 * @returns Formatted countdown string like "5m 32s" or "Ended"
 */
export function formatCountdown(deadline: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = deadline - now;

  if (remaining <= 0) {
    return 'Ended';
  }

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Format wallet address to truncated form
 * @param address - Full wallet address (0x...)
 * @param startChars - Number of characters to show at start (default 6)
 * @param endChars - Number of characters to show at end (default 4)
 * @returns Truncated address like "0x1234...abcd"
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format number of contracts
 * @param contracts - Number of contracts (can be bigint string or number)
 * @returns Formatted string like "10" or "1.5"
 */
export function formatContracts(contracts: string | number | bigint): string {
  const num = typeof contracts === 'bigint' ? Number(contracts) : Number(contracts);
  return num.toLocaleString();
}

/**
 * Format USDC amount from 6 decimals
 * @param amount - Amount in 6 decimals
 * @returns Formatted string like "$1,250.00"
 */
export function formatUSDC(amount: bigint | number): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  return `$${(num / 1e6).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format token amount with proper decimals
 * @param amount - Raw amount
 * @param decimals - Token decimals (default 18)
 * @param maxDecimals - Maximum decimals to display (default 4)
 * @returns Formatted string
 */
export function formatTokenAmount(
  amount: bigint | number,
  decimals: number = 18,
  maxDecimals: number = 4
): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  const value = num / Math.pow(10, decimals);
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Get option type label from numeric type
 * @param optionType - 0 for CALL, 1 for PUT
 * @returns "CALL", "PUT", or "UNKNOWN"
 */
export function getOptionTypeLabel(optionType?: number): string {
  if (optionType === 0) return 'CALL';
  if (optionType === 1) return 'PUT';
  return 'UNKNOWN';
}

/**
 * Get RFQ status color classes
 * @param status - RFQ status string
 * @returns Tailwind color classes for badge
 */
export function getStatusColorClasses(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-blue-600/20 text-blue-400';
    case 'settled':
      return 'bg-green-600/20 text-green-400';
    case 'cancelled':
      return 'bg-red-600/20 text-red-400';
    default:
      return 'bg-gray-600/20 text-gray-400';
  }
}

/**
 * Get option type color classes
 * @param optionType - "CALL" or "PUT"
 * @returns Tailwind color classes for badge
 */
export function getOptionTypeColorClasses(optionType: string): string {
  return optionType === 'CALL'
    ? 'bg-green-600/20 text-green-400'
    : 'bg-red-600/20 text-red-400';
}
