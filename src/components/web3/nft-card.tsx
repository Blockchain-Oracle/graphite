'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NFT, getTierColor } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Paintbrush, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NFTCardProps {
  nft: NFT;
  showActions?: boolean;
}

export function NFTCard({ nft, showActions = true }: NFTCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const tierColor = getTierColor(nft.tier);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate a refresh action
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
  };

  return (
    <Card className="overflow-hidden backdrop-blur-xl border border-opacity-50 transition-all hover:shadow-xl"
      style={{ borderColor: `${tierColor}40`, background: `linear-gradient(135deg, ${tierColor}10, transparent)` }}>
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <h3 className="font-bold truncate" style={{ color: tierColor }}>{nft.name}</h3>
          <span className="text-xs bg-black/20 px-2 py-1 rounded-full">
            {nft.tier.replace('_', ' ')}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 relative">
        <div className="aspect-square bg-black/5 rounded-md overflow-hidden">
          <div className="w-full h-full relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Image 
                src={nft.image || `/trust-badges/${nft.tier.toLowerCase().replace('_', '-')}.svg`}
                alt={nft.name}
                fill
                className="object-contain p-2"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-2">
          <p className="text-xs text-foreground/70 truncate">{nft.description}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-foreground/50">Score: {nft.trustScore}</span>
            <span className="text-xs text-foreground/50">
              {new Date(nft.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 mr-1 hover:bg-accent hover:text-accent-foreground"
            style={{ color: tierColor, borderColor: tierColor }}
            onClick={() => router.push(`/nfts/view/${nft.tokenId}`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            <span>View</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 mx-1 hover:bg-accent hover:text-accent-foreground"
            style={{ color: tierColor, borderColor: tierColor }}
            onClick={() => router.push(`/nfts/customize/${nft.tokenId}`)}
          >
            <Paintbrush className="h-4 w-4 mr-1" />
            <span>Edit</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 ml-1 hover:bg-accent hover:text-accent-foreground"
            style={{ color: tierColor, borderColor: tierColor }}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 