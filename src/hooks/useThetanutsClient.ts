import { useMemo } from 'react';
import { ethers } from 'ethers';
import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';

const BASE_CHAIN_ID = 8453;
const BASE_RPC_URL = 'https://mainnet.base.org';

interface UseThetanutsClientProps {
  signer?: ethers.JsonRpcSigner | null;
  isCorrectNetwork?: boolean;
}

export function useThetanutsClient({ signer, isCorrectNetwork }: UseThetanutsClientProps = {}) {
  const client = useMemo(() => {
    // Use a public RPC provider for read-only operations
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);

    const config: {
      chainId: 8453;
      provider: ethers.JsonRpcProvider | ethers.BrowserProvider;
      signer?: ethers.JsonRpcSigner;
      apiBaseUrl?: string;
    } = {
      chainId: BASE_CHAIN_ID,
      provider,
      // Use proxy in development to avoid CORS issues
      apiBaseUrl: import.meta.env.DEV ? '/api/thetanuts' : undefined,
    };

    // Add signer if wallet is connected and on correct network
    if (signer && isCorrectNetwork) {
      config.signer = signer;
    }

    return new ThetanutsClient(config);
  }, [signer, isCorrectNetwork]);

  return client;
}
