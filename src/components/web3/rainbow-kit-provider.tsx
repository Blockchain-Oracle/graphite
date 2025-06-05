"use client";

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { WagmiProvider, http, createConfig } from 'wagmi';
import { Chain } from 'wagmi/chains';

// Define Graphite Testnet
export const graphiteTestnet = {
  id: 54170,
  name: 'Graphite Testnet',
  nativeCurrency: {
    name: 'Graphite',
    symbol: '@G',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://anon-entrypoint-test-1.atgraphite.com'],
      webSocket: ['wss://ws-anon-entrypoint-test-1.atgraphite.com'],
    },
    public: {
      http: ['https://anon-entrypoint-test-1.atgraphite.com'],
      webSocket: ['wss://ws-anon-entrypoint-test-1.atgraphite.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Graphite Explorer',
      url: 'https://test.atgraphite.com',
    },
  },
  testnet: true,
} as const satisfies Chain;

// Define Graphite Mainnet
export const graphiteMainnet = {
  id: 440017,
  name: 'Graphite Mainnet',
  nativeCurrency: {
    name: 'Graphite',
    symbol: '@G',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://anon-entrypoint-1.atgraphite.com'],
      webSocket: ['wss://ws-anon-entrypoint-1.atgraphite.com'],
    },
    public: {
      http: ['https://anon-entrypoint-1.atgraphite.com'],
      webSocket: ['wss://ws-anon-entrypoint-1.atgraphite.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Graphite Explorer',
      url: 'https://main.atgraphite.com',
    },
  },
} as const satisfies Chain;

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  // Create config and queryClient inside the component
  const [queryClient] = useState(() => new QueryClient());
  
  const config = getDefaultConfig({
    appName: 'Graphite Ecosystem',
    projectId: 'graphite-ecosystem', // Replace with your WalletConnect projectId
    chains: [graphiteTestnet, graphiteMainnet],
    transports: {
      [graphiteTestnet.id]: http(),
      [graphiteMainnet.id]: http(),
    },
  });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 