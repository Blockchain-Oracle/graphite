'use client';

import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/web3/contract-config';

export function useUserProfileData(userAddress?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = userAddress || connectedAddress;

  // Config for Reputation Contract (for Trust Score)
  const reputationContractConfig = {
    address: CONTRACT_ADDRESSES.reputation as `0x${string}`,
    abi: ABIS.reputation,
  };

  // Config for KYC Contract
  const kycContractConfig = {
    address: CONTRACT_ADDRESSES.kyc as `0x${string}`,
    abi: ABIS.kyc,
  };

  // Fetch Trust Score (Reputation Score)
  const {
    data: rawTrustScore, 
    isLoading: isTrustScoreLoading,
    error: trustScoreError,
    refetch: refetchTrustScore,
  } = useReadContract({
    ...reputationContractConfig,
    functionName: 'getReputation',
    args: targetAddress ? [targetAddress] : undefined, 
    query: {
      enabled: !!targetAddress,
      select: (data: unknown) => {
        if (typeof data === 'bigint') {
          return Number(data);
        }
        // Return null or a default number if data is not a bigint (e.g. undefined initially)
        return null; 
      },
    },
  });

  // Fetch KYC Level
  const {
    data: rawKycLevel, 
    isLoading: isKycLevelLoading,
    error: kycLevelError,
    refetch: refetchKycLevel,
  } = useReadContract({
    ...kycContractConfig,
    functionName: 'level',
    args: targetAddress ? [targetAddress] : undefined, 
    query: {
      enabled: !!targetAddress,
      select: (data: unknown) => {
        if (typeof data === 'bigint') {
          return Number(data);
        }
        // Return null or a default number if data is not a bigint
        return null; 
      },
    },
  });
  
  const refetchAll = () => {
    if (targetAddress) {
        refetchTrustScore();
        refetchKycLevel();
    }
  };

  return {
    trustScore: rawTrustScore as number | null, // Cast based on select logic
    isTrustScoreLoading,
    trustScoreError,
    kycLevel: rawKycLevel as number | null, // Cast based on select logic
    isKycLevelLoading,
    kycLevelError,
    isLoading: isTrustScoreLoading || isKycLevelLoading,
    refetchUserProfileData: refetchAll,
  };
} 