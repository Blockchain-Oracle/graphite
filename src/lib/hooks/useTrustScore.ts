import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { getContractConfig } from '../web3/contract-config';

/**
 * Tiers for the trust score system
 */
export const TRUST_TIERS = {
  1: { name: 'Newcomer', color: '#607D8B', range: [0, 199] },
  2: { name: 'Established', color: '#4CAF50', range: [200, 399] },
  3: { name: 'Trusted', color: '#2196F3', range: [400, 599] },
  4: { name: 'Influencer', color: '#9C27B0', range: [600, 799] },
  5: { name: 'Authority', color: '#FFC107', range: [800, 1000] },
};

/**
 * Hook to get a user's trust score
 * @param address The address to get the trust score for
 */
export function useTrustScore(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  // Get trust score for the address
  const { data: trustScore, isLoading: isTrustScoreLoading, error } = useReadContract({
    ...getContractConfig('trustScoreAdapter'),
    functionName: 'getTrustScore',
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress,
    }
  });

  // Get tier level based on trust score
  const { data: tierLevel, isLoading: isTierLoading } = useReadContract({
    ...getContractConfig('trustScoreAdapter'),
    functionName: 'getTierLevel',
    args: trustScore !== undefined ? [trustScore] : undefined,
    query: {
      enabled: trustScore !== undefined,
    }
  });

  // Get tier name based on trust score
  const { data: tierName, isLoading: isTierNameLoading } = useReadContract({
    ...getContractConfig('trustScoreAdapter'),
    functionName: 'getTierName',
    args: trustScore !== undefined ? [trustScore] : undefined,
    query: {
      enabled: trustScore !== undefined,
    }
  });

  // Helper function to determine tier from score directly
  const getTierFromScore = (score: number): number => {
    if (score < 200) return 1;
    if (score < 400) return 2;
    if (score < 600) return 3;
    if (score < 800) return 4;
    return 5;
  };

  return {
    trustScore: trustScore !== undefined ? Number(trustScore) : 0,
    tierLevel: tierLevel !== undefined ? Number(tierLevel) : 0,
    tierName: tierName || '',
    tier: getTierFromScore(Number(trustScore || 0)),
    isLoading: isTrustScoreLoading || isTierLoading || isTierNameLoading,
    error,
  };
} 