import { useState } from 'react';
import { useWallet } from './hooks/useWallet';
import { useThetanutsClient } from './hooks/useThetanutsClient';
import { WalletConnect } from './components/WalletConnect';
import { OrdersTable } from './components/OrdersTable';
import { TokenBalances } from './components/TokenBalances';
import { TabNavigation } from './components/TabNavigation';
import { RFQPage } from './components/RFQPage';
import { MainTab } from './types/rfq';

function App() {
  const {
    address,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    chainId,
    signer,
    connect,
    disconnect,
    switchToBase,
  } = useWallet();

  const client = useThetanutsClient({ signer, isCorrectNetwork });

  // Tab state for switching between Orderbook and RFQ
  const [activeTab, setActiveTab] = useState<MainTab>('orderbook');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
                T
              </div>
              <h1 className="text-xl font-bold">Thetanuts Finance</h1>
            </div>
            {/* Tab Navigation */}
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
          <WalletConnect
            address={address}
            isConnected={isConnected}
            isConnecting={isConnecting}
            isCorrectNetwork={isCorrectNetwork}
            chainId={chainId}
            onConnect={connect}
            onDisconnect={disconnect}
            onSwitchNetwork={switchToBase}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content Area - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            {activeTab === 'orderbook' ? (
              <OrdersTable
                client={client}
                isConnected={isConnected}
                isCorrectNetwork={isCorrectNetwork}
              />
            ) : (
              <RFQPage
                client={client}
                address={address}
                isConnected={isConnected}
                isCorrectNetwork={isCorrectNetwork}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {isConnected && address ? (
              <TokenBalances client={client} address={address} />
            ) : (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Token Balances</h2>
                <p className="text-gray-400 text-center py-4">
                  Connect your wallet to view balances
                </p>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">About</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Thetanuts Finance is an on-chain options trading protocol on Base.
                Connect your wallet to view your balances and trade options.
              </p>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Network</span>
                  <span className="text-blue-400">Base Mainnet</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Chain ID</span>
                  <span className="font-mono">8453</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
