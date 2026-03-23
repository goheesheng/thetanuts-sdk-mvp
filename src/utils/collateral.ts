/**
 * Collateral Calculation Utility
 *
 * Estimates collateral requirements for RFQ short positions based on
 * option type, underlying, structure, and strikes.
 */

import { OptionType, Underlying, OptionStructure } from '../types/rfq';

export interface CollateralResult {
  amount: number;
  token: 'USDC' | 'WETH' | 'cbBTC';
  formula: string;
}

/**
 * Determine the collateral token based on option type and underlying.
 * - PUT options: Always USDC
 * - CALL options: Underlying token (WETH for ETH, cbBTC for BTC)
 */
function getCollateralToken(optionType: OptionType, underlying: Underlying): 'USDC' | 'WETH' | 'cbBTC' {
  if (optionType === 'PUT') {
    return 'USDC';
  }
  // CALL options use the underlying asset as collateral
  return underlying === 'ETH' ? 'WETH' : 'cbBTC';
}

/**
 * Calculate the spread width between adjacent strikes.
 */
function calculateSpreadWidth(strikes: number[]): number {
  if (strikes.length < 2) return 0;
  return Math.abs(strikes[1] - strikes[0]);
}

/**
 * Calculate the maximum spread width for multi-leg structures.
 */
function calculateMaxSpread(strikes: number[]): number {
  if (strikes.length < 2) return 0;

  let maxSpread = 0;
  for (let i = 1; i < strikes.length; i++) {
    const spread = Math.abs(strikes[i] - strikes[i - 1]);
    if (spread > maxSpread) {
      maxSpread = spread;
    }
  }
  return maxSpread;
}

/**
 * Calculate estimated collateral for an RFQ short position.
 *
 * Collateral requirements:
 * - Vanilla PUT: numContracts × strike (in USDC)
 * - Vanilla CALL (inverse): numContracts (in underlying token)
 * - Spread: numContracts × spreadWidth (in USDC for PUT)
 * - Butterfly/Condor: numContracts × maxSpread (in USDC for PUT)
 *
 * Note: This is an ESTIMATE. Actual collateral is determined at settlement.
 * Strikes are expected in USD (e.g., 2500 for $2500).
 */
export function calculateCollateral(params: {
  optionType: OptionType;
  underlying: Underlying;
  structure: OptionStructure;
  strikes: number[];
  numContracts: number;
}): CollateralResult {
  const { optionType, underlying, structure, strikes, numContracts } = params;

  // Validate inputs
  if (numContracts <= 0 || strikes.length === 0 || strikes.some(s => s <= 0)) {
    return {
      amount: 0,
      token: getCollateralToken(optionType, underlying),
      formula: 'Enter valid parameters',
    };
  }

  const token = getCollateralToken(optionType, underlying);

  // CALL options (inverse): collateral is in the underlying token
  if (optionType === 'CALL') {
    return {
      amount: numContracts,
      token,
      formula: `${numContracts} contracts = ${numContracts} ${token}`,
    };
  }

  // PUT options: collateral is in USDC, calculation depends on structure
  let amount: number;
  let formula: string;

  switch (structure) {
    case 'vanilla': {
      // Vanilla PUT: numContracts × strike
      const strike = strikes[0];
      amount = numContracts * strike;
      formula = `${numContracts} × $${strike.toLocaleString()}`;
      break;
    }

    case 'spread': {
      // Spread: numContracts × spreadWidth
      const spreadWidth = calculateSpreadWidth(strikes);
      amount = numContracts * spreadWidth;
      formula = `${numContracts} × $${spreadWidth.toLocaleString()} spread`;
      break;
    }

    case 'butterfly': {
      // Butterfly: numContracts × maxSpread
      const maxSpread = calculateMaxSpread(strikes);
      amount = numContracts * maxSpread;
      formula = `${numContracts} × $${maxSpread.toLocaleString()} max spread`;
      break;
    }

    case 'condor':
    case 'iron-condor': {
      // Condor/Iron Condor: numContracts × maxSpread
      const maxSpread = calculateMaxSpread(strikes);
      amount = numContracts * maxSpread;
      formula = `${numContracts} × $${maxSpread.toLocaleString()} max spread`;
      break;
    }

    default:
      amount = 0;
      formula = 'Unknown structure';
  }

  return {
    amount,
    token,
    formula,
  };
}
