import { useState, useEffect } from 'react';
import { useAccount, useConfig } from 'wagmi';
import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt
} from 'wagmi';
import { getPublicClient } from 'wagmi/actions';
import { type PublicClient } from 'viem';
import { getContractConfig } from '../web3/contract-config';
import { NFT, NFTTier, NFTAttribute } from '../types';

// Helper function to format token URI for metadata compatibility
const formatTokenURI = (tokenURI: string, nft: { 
  tokenId: string | number,
  trustScore: number, 
  badgeType?: number,
  name?: string,
  description?: string,
  owner?: string,
  verified?: boolean
}) => {
  // If the token URI is already a full URL, return it
  if (tokenURI.startsWith('http')) return tokenURI;
  
  // Otherwise, construct the metadata URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const url = new URL(`${baseUrl}/api/metadata/${nft.tokenId}`);
  
  // Add query parameters
  url.searchParams.append('trustScore', nft.trustScore.toString());
  if (nft.badgeType !== undefined) url.searchParams.append('badgeType', nft.badgeType.toString());
  if (nft.name) url.searchParams.append('badgeName', encodeURIComponent(nft.name));
  if (nft.description) url.searchParams.append('badgeMessage', encodeURIComponent(nft.description));
  if (nft.owner) url.searchParams.append('owner', nft.owner);
  if (nft.verified !== undefined) url.searchParams.append('verified', nft.verified.toString());
  url.searchParams.append('timestamp', Math.floor(Date.now() / 1000).toString());
  
  return url.toString();
};

/**
 * Hook to get all NFTs owned by the connected wallet
 */
export function useUserNFTs() {
  const { address } = useAccount();
  const config = useConfig();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get balance of NFTs
  const { data: balance, isLoading: isBalanceLoading, isError: isBalanceError } = useReadContract({
    ...getContractConfig('trustNFT'),
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Get NFTs using tokenOfOwnerByIndex
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!balance || !address) return;
      
      try {
        const publicClient = getPublicClient(config);
        if (!publicClient) {
          throw new Error('Failed to get public client');
        }
        
        const nftPromises = [];
        for (let i = 0; i < Number(balance); i++) {
          nftPromises.push(fetchNFTAtIndex(i, publicClient));
        }
        
        const results = await Promise.all(nftPromises);
        setNfts(results.filter(Boolean) as NFT[]);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
        setError(error instanceof Error ? error : new Error('Failed to fetch NFTs'));
      } finally {
        setIsLoading(false);
      }
    };

    if (!isBalanceLoading && balance !== undefined && !isBalanceError) {
      fetchNFTs();
    } else if (isBalanceError) {
      setIsLoading(false);
      setError(new Error('Failed to fetch NFT balance'));
    }
  }, [balance, address, isBalanceLoading, isBalanceError, config]);

  const fetchNFTAtIndex = async (index: number, publicClient: PublicClient): Promise<NFT | null> => {
    try {
      if (!address) return null;
      
      // Get token ID at index
      const tokenId = await publicClient.readContract({
        ...getContractConfig('trustNFT'),
        functionName: 'tokenOfOwnerByIndex',
        args: [address as `0x${string}`, BigInt(index)],
      });

      if (!tokenId) return null;

      // Get token URI and badge data
      const [tokenURI, badgeData, trustScore] = await Promise.all([
        publicClient.readContract({
          ...getContractConfig('trustNFT'),
          functionName: 'tokenURI',
          args: [tokenId],
        }),
        publicClient.readContract({
          ...getContractConfig('trustNFT'),
          functionName: 'getBadgeData',
          args: [tokenId],
        }),
        publicClient.readContract({
          ...getContractConfig('trustNFT'),
          functionName: 'lastTrustScore',
          args: [tokenId],
        }),
      ]);
      
      // Determine tier based on trust score
      const tierLevel = await getTierLevel(Number(trustScore), publicClient);
      const tierEnum = getTierEnum(tierLevel);
      
      // Cast badgeData to appropriate type for consistent access
      const typedBadgeData = badgeData as [number, string, string, boolean];
      
      // Prepare NFT data
      const nftDataForURI = {
        tokenId: Number(tokenId),
        trustScore: Number(trustScore),
        badgeType: Number(typedBadgeData[0]),
        name: typedBadgeData[1],
        description: typedBadgeData[2],
        owner: address as string,
        verified: typedBadgeData[3]
      };
      
      // Format the token URI
      const formattedTokenURI = formatTokenURI(tokenURI as string, nftDataForURI);
      
      // Convert to NFT format that matches our interface
      const nft: NFT = {
        id: tokenId.toString(),
        tokenId: Number(tokenId),
        name: typedBadgeData[1] || `Trust Badge #${tokenId}`,
        description: typedBadgeData[2] || 'A Graphite Trust Badge',
        image: formattedTokenURI,
        tier: tierEnum,
        trustScore: Number(trustScore),
        owner: address as string,
        createdAt: new Date().toISOString(),
        attributes: [
          { trait_type: 'Badge Type', value: Number(typedBadgeData[0]) },
          { trait_type: 'Verified', value: typedBadgeData[3] ? 'Yes' : 'No' },
          { trait_type: 'Trust Score', value: Number(trustScore) }
        ],
        customizations: {
          baseModel: 'standard',
          accessories: [],
          colors: { primary: '#A0A0A0', secondary: '#FFFFFF', accent: '#888888' },
          animation: 'static'
        }
      };
      
      return nft;
    } catch (error) {
      console.error(`Error fetching NFT at index ${index}:`, error);
      return null;
    }
  };

  // Helper function to get tier level from trust score
  const getTierLevel = async (trustScore: number, publicClient: PublicClient): Promise<number> => {
    try {
      const data = await publicClient.readContract({
        ...getContractConfig('trustScoreAdapter'),
        functionName: 'getTierLevel',
        args: [BigInt(trustScore)],
      });
      
      return Number(data || 1);
    } catch (error) {
      // Default to tier 1 if there's an error
      console.error("Error getting tier level:", error);
      return 1;
    }
  };

  // Helper function to convert tier level to tier name as enum
  const getTierEnum = (level: number): NFTTier => {
    switch (level) {
      case 1: return NFTTier.TIER_1;
      case 2: return NFTTier.TIER_2;
      case 3: return NFTTier.TIER_3;
      case 4: return NFTTier.TIER_4;
      case 5: return NFTTier.TIER_5;
      default: return NFTTier.TIER_1;
    }
  };

  return { nfts, isLoading, error };
}

/**
 * Hook to mint a new Trust NFT
 */
export function useMintNFT() {
  const { writeContractAsync, isPending, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: transactionError } = useWaitForTransactionReceipt({
    hash,
  });

  const mintNFT = async (badgeType = 1) => {
    try {
      return await writeContractAsync({
        ...getContractConfig('trustNFT'),
        functionName: 'mintWithType',
        args: [badgeType],
        value: BigInt(0), // Include any value if required for minting
      });
    } catch (error) {
      console.error("Error minting NFT:", error);
      throw error;
    }
  };

  return {
    mintNFT,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error: writeError || transactionError,
  };
}

/**
 * Hook to get a single NFT by token ID
 */
export function useNFTDetails(tokenId: number | undefined) {
  const config = useConfig();
  const [nft, setNft] = useState<NFT | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tokenId) {
      setIsLoading(false);
      return;
    }

    const fetchNFT = async () => {
      try {
        setIsLoading(true);
        const publicClient = getPublicClient(config);
        
        if (!publicClient) {
          throw new Error('Failed to get public client');
        }
        
        // Get token URI and badge data
        const [tokenURI, badgeData, trustScore, owner] = await Promise.all([
          publicClient.readContract({
            ...getContractConfig('trustNFT'),
            functionName: 'tokenURI',
            args: [BigInt(tokenId)],
          }),
          publicClient.readContract({
            ...getContractConfig('trustNFT'),
            functionName: 'getBadgeData',
            args: [BigInt(tokenId)],
          }),
          publicClient.readContract({
            ...getContractConfig('trustNFT'),
            functionName: 'lastTrustScore',
            args: [BigInt(tokenId)],
          }),
          publicClient.readContract({
            ...getContractConfig('trustNFT'),
            functionName: 'ownerOf',
            args: [BigInt(tokenId)],
          }),
        ]);

        // Determine tier based on trust score
        const tierLevel = await getTierLevel(Number(trustScore), publicClient);
        const tierEnum = getTierEnum(tierLevel);
        
        // Cast badgeData to appropriate type for consistent access
        const typedBadgeData = badgeData as [number, string, string, boolean];
        
        // Prepare NFT data for formatting token URI
        const nftDataForURI = {
          tokenId,
          trustScore: Number(trustScore),
          badgeType: Number(typedBadgeData[0]),
          name: typedBadgeData[1],
          description: typedBadgeData[2],
          owner: owner as string,
          verified: typedBadgeData[3]
        };
        
        // Format the token URI
        const formattedTokenURI = formatTokenURI(tokenURI as string, nftDataForURI);
        
        // Create NFT object that matches our interface
        const fullNFTData: NFT = {
          id: tokenId.toString(),
          tokenId,
          name: typedBadgeData[1] || `Trust Badge #${tokenId}`,
          description: typedBadgeData[2] || 'A Graphite Trust Badge',
          image: formattedTokenURI,
          tier: tierEnum,
          trustScore: Number(trustScore),
          owner: owner as string,
          createdAt: new Date().toISOString(),
          attributes: [
            { trait_type: 'Badge Type', value: Number(typedBadgeData[0]) },
            { trait_type: 'Verified', value: typedBadgeData[3] ? 'Yes' : 'No' },
            { trait_type: 'Trust Score', value: Number(trustScore) }
          ],
          customizations: {
            baseModel: 'standard',
            accessories: [],
            colors: { primary: '#A0A0A0', secondary: '#FFFFFF', accent: '#888888' },
            animation: 'static'
          }
        };
        
        setNft(fullNFTData);
      } catch (error) {
        console.error(`Error fetching NFT details for token ${tokenId}:`, error);
        setError(error instanceof Error ? error : new Error(`Failed to fetch NFT details for token ${tokenId}`));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFT();
  }, [tokenId, config]);

  // Helper function to get tier level from trust score
  const getTierLevel = async (trustScore: number, publicClient: PublicClient): Promise<number> => {
    try {
      const data = await publicClient.readContract({
        ...getContractConfig('trustScoreAdapter'),
        functionName: 'getTierLevel',
        args: [BigInt(trustScore)],
      });
      
      return Number(data || 1);
    } catch (error) {
      // Default to tier 1 if there's an error
      console.error("Error getting tier level:", error);
      return 1;
    }
  };

  // Helper function to convert tier level to tier enum
  const getTierEnum = (level: number): NFTTier => {
    switch (level) {
      case 1: return NFTTier.TIER_1;
      case 2: return NFTTier.TIER_2;
      case 3: return NFTTier.TIER_3;
      case 4: return NFTTier.TIER_4;
      case 5: return NFTTier.TIER_5;
      default: return NFTTier.TIER_1;
    }
  };

  return { nft, isLoading, error };
}

/**
 * Hook to customize an NFT
 */
export function useCustomizeNFT() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const customizeBadgeName = async (tokenId: number, name: string) => {
    try {
      return await writeContractAsync({
        ...getContractConfig('trustNFT'),
        functionName: 'setBadgeName',
        args: [BigInt(tokenId), name],
      });
    } catch (error) {
      console.error("Error customizing badge name:", error);
      throw error;
    }
  };

  const customizeBadgeMessage = async (tokenId: number, message: string) => {
    try {
      return await writeContractAsync({
        ...getContractConfig('trustNFT'),
        functionName: 'setBadgeMessage',
        args: [BigInt(tokenId), message],
      });
    } catch (error) {
      console.error("Error customizing badge message:", error);
      throw error;
    }
  };

  const customizeBadgeType = async (tokenId: number, badgeType: number) => {
    try {
      return await writeContractAsync({
        ...getContractConfig('trustNFT'),
        functionName: 'setBadgeType',
        args: [BigInt(tokenId), badgeType],
      });
    } catch (error) {
      console.error("Error customizing badge type:", error);
      throw error;
    }
  };

  const refreshTrustScore = async (tokenId: number) => {
    try {
      return await writeContractAsync({
        ...getContractConfig('trustNFT'),
        functionName: 'refreshTrustScore',
        args: [BigInt(tokenId)],
      });
    } catch (error) {
      console.error("Error refreshing trust score:", error);
      throw error;
    }
  };

  return {
    customizeBadgeName,
    customizeBadgeMessage,
    customizeBadgeType,
    refreshTrustScore,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
} 