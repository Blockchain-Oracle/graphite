'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserNFTs } from '@/lib/hooks/useNFTs';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { SparklesText } from '@/components/magicui/sparkles-text';
import { Particles } from '@/components/magicui/particles';
import { Paintbrush, ArrowRight } from 'lucide-react';

// Import NFTCard dynamically with SSR disabled
const NFTCard = dynamic(() => import('@/components/web3/nft-card').then(mod => ({ default: mod.NFTCard })), {
  ssr: false,
  loading: () => (
    <div className="border rounded-lg p-4 h-[320px]">
      <div className="animate-pulse flex flex-col h-full">
        <div className="h-6 bg-secondary/20 rounded w-1/2 mb-4"></div>
        <div className="flex-1 bg-secondary/10 rounded mb-4"></div>
        <div className="h-8 bg-secondary/20 rounded"></div>
      </div>
    </div>
  )
});

// Assuming user is connected via Rainbow Kit
// For prototype we'll use a mock address
const MOCK_ADDRESS = '0x1234567890123456789012345678901234567890';

export default function NFTCustomizePage() {
  const router = useRouter();
  const [address] = useState(MOCK_ADDRESS);
  const { nfts, isLoading, error } = useUserNFTs(address);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <Particles
            className="absolute inset-0"
            quantity={100}
            color="#888"
            vy={-0.1}
          />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <SparklesText
              className="text-4xl sm:text-5xl font-bold"
            >
              Customize Your NFTs
            </SparklesText>
            <p className="text-muted-foreground mt-2">
              Select an NFT to customize its appearance and animations
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse text-center">
                <div className="h-16 w-16 bg-secondary/50 rounded-full mx-auto"></div>
                <p className="mt-4">Loading your NFTs...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
              <p>Error loading NFTs: {error.message}</p>
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-16 bg-black/5 backdrop-blur-sm rounded-lg p-8">
              <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Paintbrush className="w-12 h-12 text-muted-foreground" />
              </div>
              
              <h3 className="text-2xl font-bold mb-2">No NFTs to Customize</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                You don't have any NFTs yet. Mint your first Trust Guardian to unlock customization options.
              </p>
              
              <Button
                size="lg"
                onClick={() => router.push('/nfts/mint')}
                className="group"
              >
                Mint Your First NFT
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Tip:</span> Click on any NFT below to access its customization options.
                  Higher tier NFTs have more customization features available.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {nfts.map((nft) => (
                  <div 
                    key={nft.id}
                    className="cursor-pointer transition-transform hover:scale-105"
                    onClick={() => router.push(`/nfts/customize/${nft.tokenId}`)}
                  >
                    <NFTCard nft={nft} showActions={false} />
                    <div className="mt-2 text-center">
                      <Button
                        variant="outline" 
                        className="w-full"
                      >
                        <Paintbrush className="mr-2 h-4 w-4" />
                        Customize
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 