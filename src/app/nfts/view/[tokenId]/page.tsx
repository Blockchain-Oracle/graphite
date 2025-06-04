'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNFTDetails } from '@/lib/hooks/useNFTs';
import { Button } from '@/components/ui/button';
import { SparklesText } from '@/components/magicui/sparkles-text';
import { getTierColor, NFTTier, NFTAttribute } from '@/lib/types';
import dynamic from 'next/dynamic';
import { useAccount } from 'wagmi';
import { Particles } from '@/components/magicui/particles';
import { Badge } from '@/components/ui/badge';
import { Share2, ExternalLink } from 'lucide-react';
import Image from 'next/image';

export default function ViewNFTPage() {
  const { tokenId } = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const parsedTokenId = parseInt(tokenId as string, 10);
  
  const { nft, isLoading, error } = useNFTDetails(
    isNaN(parsedTokenId) ? null : parsedTokenId
  );
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Show particles effect for high-tier NFTs
  useEffect(() => {
    if (nft && (nft.tier === NFTTier.TIER_4 || nft.tier === NFTTier.TIER_5)) {
      setShowParticles(true);
    }
  }, [nft]);

  // Handle share NFT
  const handleShare = async () => {
    if (!nft) return;
    
    try {
      await navigator.share({
        title: `Check out my ${nft.name} NFT!`,
        text: `I own the ${nft.tier} tier Trust Guardian NFT with a trust score of ${nft.trustScore}!`,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing NFT:', error);
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Check if current user is the owner
  const isOwner = address && nft?.owner.toLowerCase() === address.toLowerCase();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-32 w-32 bg-secondary/20 rounded-full mx-auto"></div>
          <div className="h-6 w-48 bg-secondary/20 rounded mt-6 mx-auto"></div>
          <div className="h-4 w-64 bg-secondary/10 rounded mt-4 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-500">Error</h2>
        <p className="mt-2 text-muted-foreground">
          {error?.message || 'NFT not found'}
        </p>
        <Button 
          className="mt-6"
          onClick={() => router.push('/nfts/gallery')}
        >
          Back to Gallery
        </Button>
      </div>
    );
  }
  
  const tierColor = getTierColor(nft.tier);

  return (
    <div className={`relative ${isFullscreen ? 'h-screen w-screen fixed inset-0 z-50 bg-black' : ''}`}>
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <Particles
            className="absolute inset-0"
            quantity={100}
            color={tierColor}
            vy={-0.1}
          />
        </div>
      )}
      
      {isFullscreen && (
        <Button
          variant="outline" 
          size="sm"
          className="absolute top-4 right-4 z-[51] bg-black/50 text-white hover:bg-black/70"
          onClick={toggleFullscreen}
        >
          Exit Fullscreen
        </Button>
      )}
      
      <div className={`${isFullscreen ? 'w-full h-full p-0 m-0 flex flex-col' : 'container mx-auto px-4 py-8'}`}>
        <div className={`${isFullscreen ? 'w-full h-full flex-grow flex flex-col' : 'max-w-6xl mx-auto'}`}>
          <div className={`mb-8 text-center ${isFullscreen ? 'hidden' : ''}`}>
            <SparklesText
              className="text-3xl sm:text-4xl font-bold"
              colors={{ first: tierColor, second: '#FFFFFF' }}
            >
              {nft.name}
            </SparklesText>
            <p className="text-muted-foreground mt-2">
              {nft.description}
            </p>
            <div className="mt-3 flex justify-center">
              <Badge 
                className="text-sm font-medium"
                style={{ backgroundColor: `${tierColor}40`, color: tierColor, borderColor: `${tierColor}80` }}
              >
                {nft.tier} TIER
              </Badge>
            </div>
          </div>
          
          <div className={`flex flex-col lg:flex-row gap-8 ${isFullscreen ? 'h-full flex-grow' : ''}`}>
            <div className={`${isFullscreen ? 'w-full h-full flex-grow' : 'lg:w-2/3'}`}>
              <div 
                className={`
                  bg-black/5 backdrop-blur-sm rounded-lg overflow-hidden
                  ${isFullscreen ? 'h-full w-full' : 'aspect-video'}
                  relative flex items-center justify-center
                `}
              >
                <div className={`absolute inset-0 ${isFullscreen ? 'flex items-center justify-center' : ''}`}>
                  {nft && (
                    <Image
                      src={nft.image || `/trust-badges/${nft.tier.toLowerCase().replace('_', '-')}.svg`}
                      alt={nft.name}
                      fill
                      className={`object-contain ${isFullscreen ? 'p-0' : 'p-4'}`}
                      priority
                    />
                  )}
                  {!nft && (
                     <div className="flex h-full w-full items-center justify-center bg-black/5">
                       <p className="text-sm text-muted-foreground">Loading image...</p>
                     </div>
                  )}
                </div>
                
                {!isFullscreen && (
                  <button 
                    className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                  </button>
                )}
                
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white"
                  style={{ display: isFullscreen ? 'none' : 'block' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Trust Score: {nft.trustScore}</span>
                    </div>
                    <div>
                      <span 
                        className="px-2 py-1 rounded text-sm font-semibold"
                        style={{ backgroundColor: `${tierColor}40`, color: tierColor }}
                      >
                        {nft.tier} TIER
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {!isFullscreen && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/nfts/gallery')}
                    className="flex-1 min-w-[120px]"
                  >
                    Back to Gallery
                  </Button>
                  
                  {isOwner && (
                    <Button
                      onClick={() => router.push(`/nfts/customize/${nft.tokenId}`)}
                      className="flex-1 min-w-[120px]"
                    >
                      Customize
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </Button>
                  
                  <a 
                    href={`https://etherscan.io/token/${process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'}?a=${nft.tokenId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      <span>View on Etherscan</span>
                    </Button>
                  </a>
                </div>
              )}
            </div>
            
            {!isFullscreen && (
              <div className="lg:w-1/3 space-y-6">
                <div className="bg-black/5 backdrop-blur-sm rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Metadata</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Token ID</span>
                      <span className="font-medium">{nft.tokenId}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Tier</span>
                      <span className="font-medium">{nft.tier}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Trust Score</span>
                      <span className="font-medium">{nft.trustScore}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">{new Date(nft.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/5 backdrop-blur-sm rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Attributes</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {nft.attributes.map((attr: NFTAttribute, index: number) => (
                      <div 
                        key={index} 
                        className="bg-black/5 rounded-lg p-3"
                        style={{ borderLeft: `3px solid ${tierColor}40` }}
                      >
                        <div className="text-sm text-muted-foreground">
                          {attr.trait_type}
                        </div>
                        <div className="font-medium mt-1 truncate">
                          {attr.value.toString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-black/5 backdrop-blur-sm rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Owner</h2>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-secondary mr-3 flex items-center justify-center overflow-hidden">
                      <img 
                        src={`https://effigy.im/a/${nft.owner}.svg`} 
                        alt="Owner avatar" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Owner Address
                      </div>
                      <div className="font-medium truncate" style={{ maxWidth: '250px' }}>
                        {nft.owner}
                      </div>
                    </div>
                  </div>
                  {isOwner && (
                    <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded text-sm text-green-500 text-center">
                      You own this NFT
                    </div>
                  )}
                </div>
                
                {nft.customizations && (
                  <div className="bg-black/5 backdrop-blur-sm rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Customizations</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-muted-foreground">Base Model</span>
                        <span className="font-medium capitalize">{nft.customizations.baseModel}</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-muted-foreground">Accessories</span>
                        <span className="font-medium capitalize">
                          {nft.customizations.accessories.length === 0 
                            ? 'None' 
                            : nft.customizations.accessories.join(', ')}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-muted-foreground">Animation</span>
                        <span className="font-medium capitalize">{nft.customizations.animation}</span>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span className="text-muted-foreground">Colors</span>
                        <div className="flex gap-1">
                          {Object.entries(nft.customizations.colors).map(([key, color]) => (
                            <div 
                              key={key}
                              className="h-5 w-5 rounded-full border border-white/20"
                              style={{ backgroundColor: color as string }}
                              title={`${key}: ${color}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 