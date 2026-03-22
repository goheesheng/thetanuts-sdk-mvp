import { useState, useEffect } from 'react';
import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';

interface TokenBalancesProps {
  client: ThetanutsClient;
  address: string;
}

interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
}

export function TokenBalances({ client, address }: TokenBalancesProps) {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBalances() {
      try {
        setLoading(true);
        const config = client.chainConfig;

        const tokens = [
          { symbol: 'USDC', address: config.tokens.USDC.address, decimals: config.tokens.USDC.decimals },
          { symbol: 'WETH', address: config.tokens.WETH.address, decimals: config.tokens.WETH.decimals },
        ];

        const balancePromises = tokens.map(async (token) => {
          const balance = await client.erc20.getBalance(token.address, address);
          const formatted = (Number(balance) / Math.pow(10, token.decimals)).toFixed(
            token.decimals === 6 ? 2 : 4
          );
          return {
            symbol: token.symbol,
            balance: formatted,
            decimals: token.decimals,
          };
        });

        const fetchedBalances = await Promise.all(balancePromises);
        setBalances(fetchedBalances);
      } catch (err) {
        console.error('Failed to fetch balances:', err);
      } finally {
        setLoading(false);
      }
    }

    if (address) {
      fetchBalances();
    }
  }, [client, address]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Token Balances</h2>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Token Balances</h2>
      <div className="space-y-3">
        {balances.map((token) => (
          <div
            key={token.symbol}
            className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium">
                {token.symbol.charAt(0)}
              </div>
              <span className="font-medium">{token.symbol}</span>
            </div>
            <span className="font-mono text-lg">{token.balance}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
