# Graphite Trust NFT: Frontend Quick-Start Guide

This guide provides step-by-step instructions for integrating the Graphite Trust NFT system into your frontend application.

## Prerequisites

- Next.js application with the App Router
- Wagmi and ethers.js set up for Web3 integration
- React and TypeScript knowledge
- TailwindCSS for styling (recommended)

## Step 1: Configure Contract Addresses

Create a constants file to store contract addresses:

```typescript
// src/lib/constants.ts

export const CONTRACT_ADDRESSES = {
  // Update these with your deployed contract addresses
  ADAPTER: '0x...',
  TRUST_NFT: '0x...',
  ECOSYSTEM: '0x...',
  FACTORY: '0x...',
};

// Graphite system contracts (fixed addresses)
export const GRAPHITE_ADDRESSES = {
  REPUTATION: '0x0000000000000000000000000000000000001008',
  KYC: '0x0000000000000000000000000000000000001001',
  ACTIVATION: '0x0000000000000000000000000000000000001000',
  FILTER: '0x0000000000000000000000000000000000001002',
};

// Trust tier colors and names
export const TRUST_TIERS = {
  1: { name: 'Beginner', color: '#607D8B' },
  2: { name: 'Novice', color: '#4CAF50' },
  3: { name: 'Trusted', color: '#2196F3' },
  4: { name: 'Established', color: '#9C27B0' },
  5: { name: 'Elite', color: '#FFC107' },
};
```

## Step 2: Add Contract ABIs

Store the contract ABIs in your project:

```typescript
// src/lib/abis/index.ts

export { default as GraphiteTrustScoreAdapterABI } from './GraphiteTrustScoreAdapter.json';
export { default as GraphiteTrustNFTABI } from './GraphiteTrustNFT.json';
export { default as GraphiteReputationEcosystemABI } from './GraphiteReputationEcosystem.json';
export { default as GraphiteAirdropFactoryABI } from './GraphiteAirdropFactory.json';
export { default as SybilResistantAirdropABI } from './SybilResistantAirdrop.json';
```

## Step 3: Create Custom Hooks

Create hooks for interacting with the contracts:

```typescript
// src/hooks/useTrustScore.ts

import { useContractRead } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { GraphiteTrustScoreAdapterABI } from '@/lib/abis';

export function useTrustScore(address: `0x${string}` | undefined) {
  const { data, isLoading, error } = useContractRead({
    address: CONTRACT_ADDRESSES.ADAPTER as `0x${string}`,
    abi: GraphiteTrustScoreAdapterABI,
    functionName: 'getTrustScore',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  return {
    trustScore: data ? Number(data) : 0,
    isLoading,
    error,
  };
}
```

```typescript
// src/hooks/useNFTs.ts

import { useContractRead, useContractReads } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { GraphiteTrustNFTABI } from '@/lib/abis';

export function useUserNFTs(address: `0x${string}` | undefined) {
  // Implementation for fetching user's NFTs
  // See full implementation in the comprehensive guide
}
```

```typescript
// src/hooks/useMintNFT.ts

import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { GraphiteReputationEcosystemABI } from '@/lib/abis';

export function useMintNFT() {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESSES.ECOSYSTEM as `0x${string}`,
    abi: GraphiteReputationEcosystemABI,
    functionName: 'mintNFT',
  });

  const { data, isLoading, isSuccess, write, error } = useContractWrite(config);

  return {
    mint: write,
    isLoading,
    isSuccess,
    error,
    txData: data,
  };
}
```

## Step 4: Build UI Components

Create components for displaying NFTs and trust scores:

```tsx
// src/components/TrustScoreBadge.tsx

import { TRUST_TIERS } from '@/lib/constants';
import { useTrustScore } from '@/hooks/useTrustScore';
import { useTrustTier } from '@/hooks/useTrustTier';

export function TrustScoreBadge({ address }: { address: `0x${string}` }) {
  const { trustScore, isLoading: scoreLoading } = useTrustScore(address);
  const { tier, isLoading: tierLoading } = useTrustTier(trustScore);
  
  if (scoreLoading || tierLoading) return <div>Loading...</div>;
  
  const tierInfo = TRUST_TIERS[tier as keyof typeof TRUST_TIERS];
  
  return (
    <div className="flex items-center space-x-2">
      <div 
        className="px-3 py-1 rounded-full text-sm font-medium"
        style={{ 
          backgroundColor: `${tierInfo.color}20`,
          color: tierInfo.color
        }}
      >
        {tierInfo.name}
      </div>
      <span className="text-sm">Score: {trustScore}</span>
    </div>
  );
}
```

```tsx
// src/components/NFTCard.tsx

import Image from 'next/image';
import { TRUST_TIERS } from '@/lib/constants';

interface NFTCardProps {
  nft: {
    id: string;
    tokenURI: string;
    trustScore: number;
    tier: number;
    badgeType: number;
    badgeName: string;
    badgeMessage: string;
  };
  onClick?: () => void;
}

export function NFTCard({ nft, onClick }: NFTCardProps) {
  const tierInfo = TRUST_TIERS[nft.tier as keyof typeof TRUST_TIERS];
  
  return (
    <div 
      className="rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-square relative">
        <Image 
          src={nft.tokenURI || `/trust-badges/tier-${nft.tier}.svg`}
          alt={nft.badgeName || `Tier ${nft.tier} Badge`}
          fill
          className="object-contain p-4"
        />
      </div>
      <div className="p-4 border-t">
        <h3 className="font-medium">{nft.badgeName || `Trust Badge #${nft.id}`}</h3>
        <div className="flex items-center justify-between mt-2">
          <span 
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ 
              backgroundColor: `${tierInfo.color}20`,
              color: tierInfo.color
            }}
          >
            {tierInfo.name}
          </span>
          <span className="text-xs text-gray-500">Score: {nft.trustScore}</span>
        </div>
      </div>
    </div>
  );
}
```

## Step 5: Create Pages

Create pages for viewing and minting NFTs:

```tsx
// src/app/nfts/page.tsx

'use client';

import { useAccount } from 'wagmi';
import { useUserNFTs } from '@/hooks/useNFTs';
import { NFTCard } from '@/components/NFTCard';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { useMintNFT } from '@/hooks/useMintNFT';

export default function NFTsPage() {
  const { address, isConnected } = useAccount();
  const { nfts, isLoading } = useUserNFTs(address);
  const { mint, isLoading: isMinting } = useMintNFT();
  
  if (!isConnected) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Connect your wallet</h1>
        <p>Please connect your wallet to view your NFTs</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Trust Badges</h1>
        {address && <TrustScoreBadge address={address} />}
      </div>
      
      <button 
        className="mb-8 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        onClick={() => mint?.()}
        disabled={isMinting}
      >
        {isMinting ? 'Minting...' : 'Mint New Badge'}
      </button>
      
      {isLoading ? (
        <div>Loading your badges...</div>
      ) : nfts?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {nfts.map(nft => (
            <NFTCard 
              key={nft.id} 
              nft={nft} 
              onClick={() => window.location.href = `/nfts/${nft.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">No badges yet</h2>
          <p className="text-gray-500">Mint your first trust badge to get started</p>
        </div>
      )}
    </div>
  );
}
```

## Step 6: Integrate Ready Player Me (Optional)

For 3D avatar integration:

```tsx
// src/components/RPMAvatarViewer.tsx

'use client';

import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import { TRUST_TIERS } from '@/lib/constants';
import * as THREE from 'three';

function AvatarModel({ avatarId, tier, ...props }) {
  const group = useRef();
  const { scene } = useGLTF(`https://models.readyplayer.me/${avatarId}.glb`);
  
  // Clone the scene to avoid mutating the cached scene
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  // Apply tier-based effects
  useEffect(() => {
    // Example effect: change material colors based on tier
    const tierInfo = TRUST_TIERS[tier];
    const color = new THREE.Color(tierInfo.color);
    
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Apply subtle tier-based effects to materials
        if (child.material.name.includes('Eyes')) {
          child.material.emissive = color;
          child.material.emissiveIntensity = tier * 0.2;
        }
      }
    });
  }, [clonedScene, tier]);
  
  // Optional: Add animation
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y += 0.002;
    }
  });
  
  return (
    <group ref={group} {...props}>
      <primitive object={clonedScene} />
    </group>
  );
}

export function RPMAvatarViewer({ avatarId, tier, trustScore }) {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 3], fov: 50 }}
      style={{ height: '100%', width: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <AvatarModel avatarId={avatarId} tier={tier} position={[0, -1, 0]} />
      <OrbitControls 
        enablePan={false}
        minDistance={2}
        maxDistance={5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
      />
      <Environment preset="city" />
    </Canvas>
  );
}
```

## Step 7: Setup Airdrop Integration

For creating and claiming airdrops:

```tsx
// src/hooks/useCreateAirdrop.ts

import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { GraphiteAirdropFactoryABI } from '@/lib/abis';

export function useCreateAirdrop(
  tokenAddress: `0x${string}`,
  merkleRoot: `0x${string}`,
  requirements: {
    trustScore: number;
    kycLevel: number;
    accountAge: number;
  },
  timing: {
    startTime: number;
    endTime: number;
  }
) {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
    abi: GraphiteAirdropFactoryABI,
    functionName: 'createAirdrop',
    args: [
      tokenAddress,
      merkleRoot,
      requirements.trustScore,
      requirements.kycLevel,
      requirements.accountAge,
      timing.startTime,
      timing.endTime
    ],
  });

  const { data, isLoading, isSuccess, write, error } = useContractWrite(config);

  return {
    createAirdrop: write,
    isLoading,
    isSuccess,
    error,
    txData: data,
  };
}
```

## Step 8: Handle Errors

Create a utility for handling contract errors:

```typescript
// src/utils/errorHandling.ts

export function parseContractError(error: any): string {
  if (!error) return 'Unknown error';
  
  // Extract error message from different error formats
  const errorMessage = 
    error.reason || 
    error.message || 
    (error.error?.message || '') || 
    error.toString();
  
  // Handle known error types
  if (errorMessage.includes('InsufficientTrustScore')) {
    return 'Your trust score is too low for this action.';
  }
  
  if (errorMessage.includes('AccountNotActivated')) {
    return 'You need to activate your Graphite account first.';
  }
  
  if (errorMessage.includes('InsufficientKYCLevel')) {
    return 'Your KYC level is too low. Please complete KYC verification.';
  }
  
  if (errorMessage.includes('MintingDisabled')) {
    return 'NFT minting is currently disabled.';
  }
  
  if (errorMessage.includes('user rejected transaction')) {
    return 'Transaction rejected by user.';
  }
  
  // Return original message for unknown errors
  return errorMessage;
}
```

## Step 9: Add Toast Notifications

Implement toast notifications for transaction feedback:

```tsx
// src/components/TransactionToast.tsx

import { toast } from 'react-hot-toast';

export function showTransactionToast(
  txData: any, 
  messages: { 
    loading: string; 
    success: string; 
    error: string; 
  }
) {
  return toast.promise(
    txData.wait(),
    {
      loading: messages.loading,
      success: messages.success,
      error: (err) => `${messages.error}: ${parseContractError(err)}`,
    }
  );
}
```

## Step 10: Build the NFT Viewer Page

Create a detailed NFT viewer page:

```tsx
// src/app/nfts/[id]/page.tsx

'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useContractRead } from 'wagmi';
import { CONTRACT_ADDRESSES, TRUST_TIERS } from '@/lib/constants';
import { GraphiteTrustNFTABI } from '@/lib/abis';
import { RPMAvatarViewer } from '@/components/RPMAvatarViewer';

export default function NFTViewerPage() {
  const { id } = useParams();
  const [avatarId, setAvatarId] = useState('');
  
  // Fetch NFT data
  const { data: tokenURI } = useContractRead({
    address: CONTRACT_ADDRESSES.TRUST_NFT as `0x${string}`,
    abi: GraphiteTrustNFTABI,
    functionName: 'tokenURI',
    args: [BigInt(id as string)],
  });
  
  const { data: trustScore } = useContractRead({
    address: CONTRACT_ADDRESSES.TRUST_NFT as `0x${string}`,
    abi: GraphiteTrustNFTABI,
    functionName: 'lastTrustScore',
    args: [BigInt(id as string)],
  });
  
  const { data: badgeData } = useContractRead({
    address: CONTRACT_ADDRESSES.TRUST_NFT as `0x${string}`,
    abi: GraphiteTrustNFTABI,
    functionName: 'getBadgeData',
    args: [BigInt(id as string)],
  });
  
  // Get tier based on trust score
  const tier = useTrustTier(trustScore ? Number(trustScore) : undefined);
  
  // Get avatar ID from token metadata (example implementation)
  useEffect(() => {
    if (tokenURI) {
      // This is a simplified example. In reality, you'd fetch the
      // JSON metadata from tokenURI and extract the avatarId
      fetchMetadata(tokenURI as string).then(metadata => {
        if (metadata?.avatarId) {
          setAvatarId(metadata.avatarId);
        }
      });
    }
  }, [tokenURI]);
  
  const tierInfo = tier ? TRUST_TIERS[tier as keyof typeof TRUST_TIERS] : TRUST_TIERS[1];
  
  return (
    <div className="container mx-auto p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-[500px] bg-gray-100 rounded-lg overflow-hidden">
          {avatarId ? (
            <RPMAvatarViewer 
              avatarId={avatarId}
              tier={tier || 1}
              trustScore={trustScore ? Number(trustScore) : 0}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image 
                src={`/trust-badges/tier-${tier || 1}.svg`}
                alt={`Tier ${tier || 1} Badge`}
                width={300}
                height={300}
              />
            </div>
          )}
        </div>
        
        <div>
          <h1 className="text-2xl font-bold mb-4">
            {badgeData?.badgeName || `Trust Badge #${id}`}
          </h1>
          
          <div className="mb-6">
            <span 
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: `${tierInfo.color}20`,
                color: tierInfo.color
              }}
            >
              {tierInfo.name} Tier
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium">Trust Score</h2>
              <p className="text-gray-700">{trustScore ? Number(trustScore) : 0}/1000</p>
            </div>
            
            <div>
              <h2 className="text-lg font-medium">Badge Type</h2>
              <p className="text-gray-700">#{badgeData?.badgeType || 1}</p>
            </div>
            
            {badgeData?.badgeMessage && (
              <div>
                <h2 className="text-lg font-medium">Message</h2>
                <p className="text-gray-700">{badgeData.badgeMessage}</p>
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              onClick={() => window.location.href = `/nfts/${id}/customize`}
            >
              Customize Badge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Conclusion

This quick-start guide provides the basic structure for integrating the Graphite Trust NFT system into your frontend. For more detailed implementations, refer to the comprehensive integration guide and the contract architecture documentation.

Remember to update the contract addresses in your constants file after deployment." 