'use client';

import { useReadContract } from 'wagmi';
import { Award, Shield, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/web3/contract-config';

export interface Achievement {
  id: string;
  name: string;
  date: string; // Using generic date as specific event timestamps are hard without an indexer
  icon: LucideIcon;
  achieved: boolean;
}

interface UseUserAchievementsProps {
  userAddress?: `0x${string}`;
  kycLevel: number | null;
  isKycLevelLoading: boolean;
}

export function useUserAchievements({ 
  userAddress, 
  kycLevel,
  isKycLevelLoading 
}: UseUserAchievementsProps) {
  
  const trustNFTContractConfig = {
    address: CONTRACT_ADDRESSES.trustNFT as `0x${string}`,
    abi: ABIS.trustNFT,
  };

  const {
    data: nftBalance,
    isLoading: isNftBalanceLoading,
    error: nftBalanceError,
    refetch: refetchNftBalance,
  } = useReadContract({
    ...trustNFTContractConfig,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
      select: (data: unknown): number => {
        if (typeof data === 'bigint') {
          return Number(data);
        }
        return 0; // Default to 0 if not a bigint or undefined
      },
    },
  });

  const isLoading = isKycLevelLoading || isNftBalanceLoading;
  const error = nftBalanceError; // For now, only considering NFT balance error for simplicity

  const achievements: Achievement[] = [];

  // Achievement: Completed KYC
  achievements.push({
    id: 'completed-kyc',
    name: 'Completed KYC',
    date: kycLevel && kycLevel > 0 ? 'On-chain Verified' : 'Not Yet Achieved',
    icon: Shield,
    achieved: !!(kycLevel && kycLevel > 0),
  });
  
  // Achievement: First NFT Minted (implies "Joined Graphite")
  const hasMintedNft = typeof nftBalance === 'number' && nftBalance > 0;
  achievements.push({
    id: 'first-nft-minted',
    name: 'First NFT Minted',
    date: hasMintedNft ? 'On-chain Verified' : 'Not Yet Achieved',
    icon: Award,
    achieved: hasMintedNft,
  });

  achievements.push({
    id: 'joined-graphite',
    name: 'Joined Graphite Ecosystem',
    date: hasMintedNft ? 'On-chain Verified (via NFT Mint)' : 'Not Yet Achieved',
    icon: User,
    achieved: hasMintedNft, // Tying this to minting an NFT for now
  });
  
  // Filter out unachieved ones if you only want to display what's done
  // Or keep them all and let the UI decide how to display (e.g., grayed out)
  // For this example, let's return all and let UI handle it.

  const refetchAchievements = () => {
    if (userAddress) {
      refetchNftBalance();
      // kycLevel refetch is handled by useUserProfileData, so no need to call here
    }
  };

  return {
    achievements,
    isLoading,
    error,
    refetchAchievements,
  };
} 