interface WalletConnectProps {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  chainId: number | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

export function WalletConnect({
  address,
  isConnected,
  isConnecting,
  isCorrectNetwork,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
}: WalletConnectProps) {
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <button
        onClick={onConnect}
        disabled={isConnecting}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg font-medium transition-colors"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {!isCorrectNetwork && (
        <button
          onClick={onSwitchNetwork}
          className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition-colors"
        >
          Switch to Base
        </button>
      )}
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          isCorrectNetwork ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
        }`}>
          {isCorrectNetwork ? 'Base' : 'Wrong Network'}
        </span>
        <span className="px-3 py-1.5 bg-gray-700 rounded-lg font-mono text-sm">
          {address && truncateAddress(address)}
        </span>
        <button
          onClick={onDisconnect}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
