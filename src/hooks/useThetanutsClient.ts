import { useMemo } from 'react';
import { ethers } from 'ethers';
import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';

const BASE_CHAIN_ID = 8453;
const BASE_RPC_URL = 'https://rpc.ankr.com/base/5e9458e4bf5a4f8893ad36e5422b9e2289cf89f4b5142312bd9b65ea1162234b';

interface UseThetanutsClientProps {
  signer?: ethers.JsonRpcSigner | null;
  isCorrectNetwork?: boolean;
}

export function useThetanutsClient({ signer, isCorrectNetwork }: UseThetanutsClientProps = {}) {
  const client = useMemo(() => {
    // Use a public RPC provider for read-only operations
    // Use staticNetwork to avoid network detection issues
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL, BASE_CHAIN_ID, {
      staticNetwork: true,
    });

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
