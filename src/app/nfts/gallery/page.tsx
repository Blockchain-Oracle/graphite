'use client';

import { useState, useEffect } from 'react';
import { useUserNFTs } from '@/lib/hooks/useNFTs';
import dynamic from 'next/dynamic';
import { NFTTier } from '@/lib/types';
import { SparklesText } from '@/components/magicui/sparkles-text';
import { Particles } from '@/components/magicui/particles';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export default function NFTGalleryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams?.get('filter');
  const { address } = useAccount();
  
  const [selectedTier, setSelectedTier] = useState<NFTTier | null>(null);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0].value);
  const [viewMode, setViewMode] = useState<'all' | 'owned'>(filterParam === 'owned' ? 'owned' : 'all');
  
  const userAddress = address || MOCK_ADDRESS;
  
  const { nfts: allNfts, isLoading: isLoadingAll, error: errorAll } = useUserNFTs(undefined);
  const { nfts: userNfts, isLoading: isLoadingOwned, error: errorOwned } = useUserNFTs(viewMode === 'owned' ? userAddress : undefined);

  // Determine current loading state and error based on viewMode
  const isLoading = viewMode === 'owned' ? isLoadingOwned : isLoadingAll;
  const error = viewMode === 'owned' ? errorOwned : errorAll;
  
  const displayNfts = viewMode === 'owned' ? userNfts : allNfts;
  
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams?.toString());
    if (viewMode === 'owned') {
      newParams.set('filter', 'owned');
    } else {
      newParams.delete('filter');
    }
    const newUrl = `/nfts/gallery${newParams.toString() ? `?${newParams.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
    // Intentionally not re-fetching when only filterParam changes, viewMode controls data source
  }, [viewMode, router, searchParams]);
  
  const filteredNFTs = selectedTier 
    ? displayNfts.filter(nft => nft.tier === selectedTier) 
    : displayNfts;
  
  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'score-desc':
        return b.trustScore - a.trustScore;
      case 'score-asc':
        return a.trustScore - b.trustScore;
      default:
        return 0;
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative overflow-hidden">
        {/* Background particles */}
        <div className="absolute inset-0 pointer-events-none">
          <Particles
            className="absolute inset-0"
            quantity={300}
            color="#888"
            vy={-0.1}
          />
        </div>
        
        <div className="relative z-10">
          <div className="mb-8 text-center">
            <SparklesText
              className="text-4xl sm:text-5xl font-bold"
            >
              {viewMode === 'owned' ? 'My Collection' : 'NFT Gallery'}
            </SparklesText>
            <p className="text-muted-foreground mt-2">
              {viewMode === 'owned' 
                ? 'Explore your Trust Guardian NFTs' 
                : 'Discover Trust Guardian NFTs from the community'}
            </p>
          </div>
          
          <div className="mb-6">
            <Tabs defaultValue={viewMode} className="w-full" onValueChange={(value) => setViewMode(value as 'all' | 'owned')}>
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="all">All NFTs</TabsTrigger>
                <TabsTrigger value="owned">My Collection</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex flex-wrap gap-2">
              {TIER_FILTERS.map((filter) => (
                <button
                  key={filter.label}
                  className={`px-4 py-2 rounded-full text-sm ${
                    selectedTier === filter.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 hover:bg-secondary/80'
                  }`}
                  onClick={() => setSelectedTier(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center">
              <label htmlFor="sort" className="mr-2 text-sm">
                Sort by:
              </label>
              <select
                id="sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-3 py-2 rounded-md bg-secondary/50 text-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse text-center">
                <div className="h-16 w-16 bg-secondary/50 rounded-full mx-auto"></div>
                <p className="mt-4">Loading NFTs...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
              <p>Error loading NFTs: {error.message}</p>
            </div>
          ) : sortedNFTs.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-bold mb-2">
                {viewMode === 'owned' ? 'No NFTs Found in Your Collection' : 'No NFTs Found'}
              </h3>
              <p className="text-muted-foreground mb-8">
                {viewMode === 'owned' 
                  ? "You don't have any NFTs yet. Mint one to get started!"
                  : "No NFTs match your filter criteria."}
              </p>
              {viewMode === 'owned' && (
                <a
                  href="/nfts/mint"
                  className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Mint Your First NFT
                </a>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedNFTs.map((nft) => (
                <NFTCard key={nft.id} nft={nft} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 