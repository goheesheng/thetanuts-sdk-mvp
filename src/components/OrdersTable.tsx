import { useState, useEffect } from 'react';
import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';

interface OrdersTableProps {
  client: ThetanutsClient;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  onTradeComplete?: () => void;
}

// Use SDK types directly by inferring from fetchOrders return type
type OrderWithSignature = Awaited<ReturnType<ThetanutsClient['api']['fetchOrders']>>[number];

type TxStatus = 'idle' | 'approving' | 'filling' | 'success' | 'error';

export function OrdersTable({ client, isConnected, isCorrectNetwork, onTradeComplete }: OrdersTableProps) {
  const [orders, setOrders] = useState<OrderWithSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [fillAmount, setFillAmount] = useState<string>('');
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [client]);

  async function fetchOrders() {
    try {
      setLoading(true);
      setError(null);
      const fetchedOrders = await client.api.fetchOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  const formatStrike = (strike: bigint) => {
    return `$${(Number(strike) / 1e8).toLocaleString()}`;
  };

  const formatExpiry = (expiry: bigint) => {
    const date = new Date(Number(expiry) * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: bigint) => {
    return `$${(Number(price) / 1e8).toFixed(4)}`;
  };

  const getOptionTypeLabel = (optionType?: number) => {
    if (optionType === 0) return 'CALL';
    if (optionType === 1) return 'PUT';
    return 'UNKNOWN';
  };

  const getAssetFromOrder = (orderData: OrderWithSignature): string => {
    // Determine asset from rawApiData.priceFeed or isCall
    const priceFeed = orderData.rawApiData?.priceFeed?.toLowerCase() || '';
    if (priceFeed.includes('btc')) return 'BTC';
    if (priceFeed.includes('eth')) return 'ETH';
    // Fallback: check collateral or default to ETH
    return 'ETH';
  };

  const handleFillClick = (orderNonce: string) => {
    if (expandedOrder === orderNonce) {
      setExpandedOrder(null);
      setFillAmount('');
      setTxStatus('idle');
      setTxError(null);
      setTxHash(null);
    } else {
      setExpandedOrder(orderNonce);
      setFillAmount('');
      setTxStatus('idle');
      setTxError(null);
      setTxHash(null);
    }
  };

  const handleFillOrder = async (orderData: OrderWithSignature) => {
    if (!fillAmount || parseFloat(fillAmount) <= 0) {
      setTxError('Please enter a valid amount');
      return;
    }

    try {
      setTxStatus('approving');
      setTxError(null);
      setTxHash(null);

      // Convert USDC amount to bigint (6 decimals)
      const usdcAmount = BigInt(Math.floor(parseFloat(fillAmount) * 1e6));

      // Get contract addresses
      const config = client.chainConfig;
      const usdcAddress = config.tokens.USDC.address;
      const optionBookAddress = config.contracts.optionBook;

      // Ensure approval
      await client.erc20.ensureAllowance(usdcAddress, optionBookAddress, usdcAmount);

      setTxStatus('filling');

      // Fill the order
      const receipt = await client.optionBook.fillOrder(orderData, usdcAmount);

      setTxHash(receipt.hash);
      setTxStatus('success');

      // Refresh orders and balances
      await fetchOrders();
      onTradeComplete?.();

    } catch (err: unknown) {
      console.error('Fill order failed:', err);
      setTxStatus('error');
      if (err instanceof Error) {
        setTxError(err.message);
      } else {
        setTxError('Transaction failed. Please try again.');
      }
    }
  };

  const canTrade = isConnected && isCorrectNetwork;

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Available Orders</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Available Orders</h2>
        <div className="text-red-400 text-center py-8">{error}</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Available Orders</h2>
        <div className="text-gray-400 text-center py-8">No orders available</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Available Orders ({orders.length})</h2>
        <button
          onClick={fetchOrders}
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
              <th className="pb-3 pr-4">Type</th>
              <th className="pb-3 pr-4">Asset</th>
              <th className="pb-3 pr-4">Strike</th>
              <th className="pb-3 pr-4">Expiry</th>
              <th className="pb-3 pr-4">Price</th>
              <th className="pb-3 pr-4">Side</th>
              <th className="pb-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((orderData, index) => {
              const { order } = orderData;
              const optionTypeLabel = getOptionTypeLabel(order.optionType);
              const strike = order.strikes && order.strikes.length > 0 ? order.strikes[0] : 0n;
              const orderKey = `${order.nonce}-${index}`;
              const isExpanded = expandedOrder === orderKey;

              return (
                <>
                  <tr key={orderKey} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        optionTypeLabel === 'CALL'
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-red-600/20 text-red-400'
                      }`}>
                        {optionTypeLabel}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium">{getAssetFromOrder(orderData)}</td>
                    <td className="py-3 pr-4 font-mono">{formatStrike(strike)}</td>
                    <td className="py-3 pr-4 text-gray-300">{formatExpiry(order.expiry)}</td>
                    <td className="py-3 pr-4 font-mono text-blue-400">{formatPrice(order.price)}</td>
                    <td className="py-3 pr-4">
                      <span className={order.isBuyer ? 'text-green-400' : 'text-red-400'}>
                        {order.isBuyer ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleFillClick(orderKey)}
                        disabled={!canTrade}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          canTrade
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isExpanded ? 'Cancel' : 'Fill'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${orderKey}-form`} className="bg-gray-750">
                      <td colSpan={7} className="p-4 bg-gray-700/30">
                        <div className="max-w-md">
                          <h3 className="text-sm font-semibold mb-3">Fill Order</h3>

                          {/* Amount Input */}
                          <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-1">
                              Amount (USDC)
                            </label>
                            <input
                              type="number"
                              value={fillAmount}
                              onChange={(e) => setFillAmount(e.target.value)}
                              placeholder="Enter USDC amount"
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                              disabled={txStatus === 'approving' || txStatus === 'filling'}
                            />
                          </div>

                          {/* Preview */}
                          {fillAmount && parseFloat(fillAmount) > 0 && (
                            <div className="mb-4 p-3 bg-gray-800 rounded-lg text-sm">
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-400">You pay:</span>
                                <span className="font-mono">${parseFloat(fillAmount).toFixed(2)} USDC</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Est. contracts:</span>
                                <span className="font-mono">
                                  {(parseFloat(fillAmount) / (Number(order.price) / 1e8)).toFixed(4)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Status Messages */}
                          {txStatus === 'approving' && (
                            <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-sm text-blue-300">
                              Approving USDC... Please confirm in your wallet.
                            </div>
                          )}
                          {txStatus === 'filling' && (
                            <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-sm text-blue-300">
                              Filling order... Please confirm in your wallet.
                            </div>
                          )}
                          {txStatus === 'success' && (
                            <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-sm text-green-300">
                              Order filled successfully!
                              {txHash && (
                                <a
                                  href={`https://basescan.org/tx/${txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block mt-1 text-blue-400 hover:underline"
                                >
                                  View on BaseScan
                                </a>
                              )}
                            </div>
                          )}
                          {txError && (
                            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300">
                              {txError}
                            </div>
                          )}

                          {/* Fill Button */}
                          <button
                            onClick={() => handleFillOrder(orderData)}
                            disabled={
                              !fillAmount ||
                              parseFloat(fillAmount) <= 0 ||
                              txStatus === 'approving' ||
                              txStatus === 'filling'
                            }
                            className={`w-full py-2 rounded-lg font-medium transition-colors ${
                              fillAmount && parseFloat(fillAmount) > 0 && txStatus !== 'approving' && txStatus !== 'filling'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {txStatus === 'approving'
                              ? 'Approving...'
                              : txStatus === 'filling'
                              ? 'Filling...'
                              : 'Fill Order'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {!canTrade && (
        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-sm text-yellow-300">
          {!isConnected
            ? 'Connect your wallet to trade'
            : 'Please switch to Base network to trade'}
        </div>
      )}
    </div>
  );
}
