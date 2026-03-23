/**
 * CollateralEstimate Component
 *
 * Displays estimated collateral requirements for RFQ short positions.
 * Uses the SDK's calculateCollateral utility for accurate calculations.
 * Shows "No collateral required" for long positions.
 */

import { useMemo } from 'react';
import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';
import { HelpIcon } from './Tooltip';
import { OptionType, Underlying, OptionStructure } from '../types/rfq';

interface CollateralEstimateProps {
  client: ThetanutsClient;
  isLong: boolean;
  optionType: OptionType;
  underlying: Underlying;
  structure: OptionStructure;
  strikes: number[];
  numContracts: number;
}

/**
 * Map structure + optionType to SDK's PayoutType
 */
function getPayoutType(
  structure: OptionStructure,
  optionType: OptionType
): 'call' | 'put' | 'call_spread' | 'put_spread' {
  if (structure === 'vanilla') {
    return optionType === 'CALL' ? 'call' : 'put';
  }
  // Spreads, butterflies, condors all use spread collateral logic
  return optionType === 'CALL' ? 'call_spread' : 'put_spread';
}

/**
 * Get collateral token based on option type and underlying
 */
function getCollateralToken(
  optionType: OptionType,
  underlying: Underlying
): 'USDC' | 'WETH' | 'cbBTC' {
  if (optionType === 'PUT') {
    return 'USDC';
  }
  return underlying === 'ETH' ? 'WETH' : 'cbBTC';
}

/**
 * Get collateral decimals based on token
 */
function getCollateralDecimals(token: 'USDC' | 'WETH' | 'cbBTC'): number {
  switch (token) {
    case 'USDC':
      return 6;
    case 'WETH':
      return 18;
    case 'cbBTC':
      return 8;
  }
}

export function CollateralEstimate({
  client,
  isLong,
  optionType,
  underlying,
  structure,
  strikes,
  numContracts,
}: CollateralEstimateProps) {
  const collateral = useMemo(() => {
    if (isLong) return null;

    // Validate inputs
    if (numContracts <= 0 || strikes.length === 0 || strikes.some((s) => s <= 0)) {
      return null;
    }

    try {
      const payoutType = getPayoutType(structure, optionType);
      const token = getCollateralToken(optionType, underlying);
      const decimals = getCollateralDecimals(token);

      // Convert strikes from USD to 8-decimal format (SDK expectation)
      const strikesOnChain = strikes.map((s) => BigInt(Math.round(s * 1e8)));

      // Convert numContracts to 18-decimal format (SDK expectation)
      const numContractsOnChain = BigInt(Math.round(numContracts * 1e18));

      // Use SDK's calculateCollateral
      const collateralAmount = client.utils.calculateCollateral({
        type: payoutType,
        strikes: strikesOnChain,
        numContracts: numContractsOnChain,
        priceDecimals: 8,
        sizeDecimals: 18,
      });

      // Convert from on-chain format to human-readable
      const amount = Number(collateralAmount) / Math.pow(10, decimals);

      // Build formula string for tooltip
      let formula: string;
      if (optionType === 'CALL') {
        formula = `${numContracts} contracts = ${numContracts} ${token}`;
      } else if (structure === 'vanilla') {
        formula = `${numContracts} × $${strikes[0].toLocaleString()} strike`;
      } else {
        const spreadWidth = Math.abs(strikes[1] - strikes[0]);
        formula = `${numContracts} × $${spreadWidth.toLocaleString()} spread width`;
      }

      return { amount, token, formula };
    } catch (err) {
      console.error('Failed to calculate collateral:', err);
      return null;
    }
  }, [client, isLong, optionType, underlying, structure, strikes, numContracts]);

  // Long positions don't require collateral
  if (isLong) {
    return (
      <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Collateral</span>
          <HelpIcon tooltip="Long positions pay premium at settlement, no upfront collateral needed" />
        </div>
        <p className="text-green-400 text-sm mt-1">
          No collateral required - you pay premium only
        </p>
      </div>
    );
  }

  // Short positions need collateral
  if (!collateral || collateral.amount === 0) {
    return (
      <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Estimated Collateral</span>
          <HelpIcon tooltip="Enter valid parameters to see estimate" />
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Enter valid strike prices to see estimate
        </p>
      </div>
    );
  }

  // Format amount with appropriate decimals
  const formattedAmount = collateral.amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: collateral.token === 'USDC' ? 2 : 6,
  });

  return (
    <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Estimated Collateral</span>
        <HelpIcon tooltip={collateral.formula} />
      </div>
      <p className="text-white font-medium mt-1">
        ~{formattedAmount} {collateral.token}
      </p>
      <p className="text-xs text-yellow-400/80 mt-2">
        Actual amount determined at settlement
      </p>
    </div>
  );
}
