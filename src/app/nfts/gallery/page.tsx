'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUserNFTs } from '@/lib/hooks/useNFTs';
import dynamic from 'next/dynamic';
import { NFTTier, MOCK_NFTS } from '@/lib/types';
import { SparklesText } from '@/components/magicui/sparkles-text';
import { Particles } from '@/components/magicui/particles';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GalleryContent } from './gallery-content';

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

const TIER_FILTERS = [
  { label: 'All', value: null },
  { label: 'Tier 1', value: NFTTier.TIER_1 },
  { label: 'Tier 2', value: NFTTier.TIER_2 },
  { label: 'Tier 3', value: NFTTier.TIER_3 },
  { label: 'Tier 4', value: NFTTier.TIER_4 },
  { label: 'Tier 5', value: NFTTier.TIER_5 },
];

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Score (High to Low)', value: 'score-desc' },
  { label: 'Score (Low to High)', value: 'score-asc' },
];

// Basic loading component for Suspense fallback
function GalleryLoadingFallback() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-pulse text-center">
        <div className="h-16 w-16 bg-secondary/50 rounded-full mx-auto"></div>
        <p className="mt-4 text-white">Loading Gallery...</p>
      </div>
    </div>
  );
}

export default function NFTGalleryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative overflow-hidden">
        {/* Background particles - kept in the page layout */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <Particles
            className="absolute inset-0"
            quantity={300} // Reduced quantity for potentially better performance
            color="#555" // Darker color for less distraction
            vy={-0.05} // Slower movement
            vx={0}      // No horizontal movement initially
            staticity={20}
            ease={30}
            refresh={true}
          />
        </div>
        
        <div className="relative z-10">
          <Suspense fallback={<GalleryLoadingFallback />}>
            <GalleryContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 