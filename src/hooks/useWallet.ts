import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const BASE_CHAIN_ID = 8453;

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isCorrectNetwork: boolean;
}

// Get MetaMask provider specifically (handles multiple wallet extensions)
function getMetaMaskProvider() {
  if (!window.ethereum) return null;

  // If ethereum.providers exists, find MetaMask specifically
  if (window.ethereum.providers?.length) {
    const metaMaskProvider = window.ethereum.providers.find(
      (p) => p.isMetaMask && !(p as { isBraveWallet?: boolean }).isBraveWallet
    );
    if (metaMaskProvider) return metaMaskProvider;
  }

  // Check if the main provider is MetaMask
  if (window.ethereum.isMetaMask) {
    return window.ethereum;
  }

  return null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnecting: false,
    isConnected: false,
    provider: null,
    signer: null,
    isCorrectNetwork: false,
  });

  const updateWalletState = useCallback(async () => {
    const ethereum = getMetaMaskProvider();
    if (!ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        setState({
          address: accounts[0].address,
          chainId,
          isConnecting: false,
          isConnected: true,
          provider,
          signer,
          isCorrectNetwork: chainId === BASE_CHAIN_ID,
        });
      } else {
        setState({
          address: null,
          chainId: null,
          isConnecting: false,
          isConnected: false,
          provider: null,
          signer: null,
          isCorrectNetwork: false,
        });
      }
    } catch (error) {
      console.error('Failed to update wallet state:', error);
    }
  }, []);

  const connect = useCallback(async () => {
    const ethereum = getMetaMaskProvider();
    if (!ethereum) {
      alert('Please install MetaMask to use this app');
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      await ethereum.request({ method: 'eth_requestAccounts' });
      await updateWalletState();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [updateWalletState]);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      chainId: null,
      isConnecting: false,
      isConnected: false,
      provider: null,
      signer: null,
      isCorrectNetwork: false,
    });
  }, []);

  const switchToBase = useCallback(async () => {
    const ethereum = getMetaMaskProvider();
    if (!ethereum) return;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }],
      });
    } catch (error: unknown) {
      // Chain not added, try to add it
      if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
              chainName: 'Base',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          });
        } catch (addError) {
          console.error('Failed to add Base network:', addError);
        }
      }
    }
  }, []);

  useEffect(() => {
    updateWalletState();

    const ethereum = getMetaMaskProvider();
    if (ethereum) {
      const handleAccountsChanged = () => updateWalletState();
      const handleChainChanged = () => updateWalletState();

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [updateWalletState]);

  return {
    ...state,
    connect,
    disconnect,
    switchToBase,
  };
}
