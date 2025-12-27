'use client';

import { createConfig, http } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

const chains = [polygon] as const;

const transports = chains.reduce(
  (acc, chain) => {
    acc[chain.id] = http();
    return acc;
  },
  {} as Record<number, ReturnType<typeof http>>,
);

let connectorsCache: ReturnType<typeof injected>[] | null = null;

function getConnectors(): ReturnType<typeof injected>[] {
  if (connectorsCache) {
    return connectorsCache;
  }

  const connectors: ReturnType<typeof injected>[] = [injected()];
  
  if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined' && projectId) {
    try {
      connectors.push(
        walletConnect({
          projectId: projectId || 'd5ae982840c967e66912e2ff3ff1a61b',
          showQrModal: true,
          metadata: {
            name: 'Polymarket Trader',
            description: 'Trade prediction markets',
            url: window.location.origin,
            icons: [],
          },
        }) as ReturnType<typeof injected>
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to initialize WalletConnect:', error);
      }
    }
  }
  
  connectorsCache = connectors;
  return connectors;
}

export const wagmiConfig = createConfig({
  chains,
  connectors: getConnectors(),
  transports,
  ssr: false,
});

export { chains as wagmiChains };