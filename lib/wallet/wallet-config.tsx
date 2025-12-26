'use client';

import { createConfig, http } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { defineChain, type Chain } from 'viem';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

const polygonAmoy = defineChain({
  id: 80002,
  name: 'Polygon Amoy',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology'],
    },
  },
  blockExplorers: {
    default: {
      name: 'PolygonScan',
      url: 'https://amoy.polygonscan.com',
    },
  },
  testnet: true,
}) as Chain;

const isDevelopment =
  process.env.NEXT_PUBLIC_ENV === 'development' ||
  process.env.NODE_ENV === 'development' ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost');

const chains: readonly [Chain, ...Chain[]] = isDevelopment
  ? [polygonAmoy]
  : [polygon];

const transports = chains.reduce(
  (acc, chain) => {
    acc[chain.id] = http();
    return acc;
  },
  {} as Record<number, ReturnType<typeof http>>,
);

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected(),
    walletConnect({
      projectId: projectId || 'd5ae982840c967e66912e2ff3ff1a61b',
      showQrModal: true,
      metadata: {
        name: 'Polymarket Trader',
        description: 'Trade prediction markets',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://polymarket-trader.vercel.app',
        icons: [],
      },
    }),
  ],
  transports,
  ssr: false,
});

export { chains as wagmiChains };