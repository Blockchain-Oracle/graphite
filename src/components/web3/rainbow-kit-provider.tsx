"use client";

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { WagmiProvider, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  // Create config and queryClient inside the component
  const [queryClient] = useState(() => new QueryClient());
  
  const config = getDefaultConfig({
    appName: 'Graphite Ecosystem',
    projectId: 'graphite-ecosystem', // Replace with your WalletConnect projectId
    chains: [sepolia],
    transports: {
      [sepolia.id]: http(),
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