/// <reference types="vite/client" />

interface EthereumProvider {
  isMetaMask?: boolean;
  isBraveWallet?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  providers?: EthereumProvider[];
}

interface Window {
  ethereum?: EthereumProvider;
}
