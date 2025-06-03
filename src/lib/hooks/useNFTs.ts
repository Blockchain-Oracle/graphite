import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { getContractConfig, CONTRACT_ADDRESSES } from '../web3/contract-config';
import { NFT, NFTTier, getTierFromTrustScore } from '../types';

/**
 * Hook to get user's NFTs from the blockchain
 */
export function useUserNFTs(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const userAddress = address || connectedAddress;
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const publicClient = usePublicClient();

  // Get the trust NFT contract config
  const trustNFTConfig = {
    address: CONTRACT_ADDRESSES.trustNFT as `0x${string}`,
    abi: getContractConfig('trustNFT').abi,
  };

  // Read NFT balance
  const { data: balance, isLoading: isBalanceLoading, refetch: refetchBalance } = useReadContract({
    ...trustNFTConfig,
    functionName: 'balanceOf',
    args: [userAddress!],
    query: { 
      enabled: !!userAddress,
    }
  });

  // Fetch user's NFTs
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!userAddress || !balance) {
        setNfts([]);
        return;
      }

      // Check if balance is a valid bigint and greater than zero
      const balanceValue = balance ? BigInt(balance.toString()) : BigInt(0);
      if (balanceValue <= BigInt(0)) {
        setNfts([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const nftsData: NFT[] = [];

        // For each NFT owned by the user
        for (let i = 0; i < Number(balanceValue); i++) {
          try {
            // Get token ID at index i
            const tokenId = await fetchTokenOfOwnerByIndex(userAddress, i);
            if (!tokenId) continue;

            // Get NFT metadata
            const nft = await fetchNFTDetails(tokenId);
            if (nft) {
              nftsData.push(nft);
            }
          } catch (err) {
            console.error(`Error fetching NFT at index ${i}:`, err);
          }
        }

        setNfts(nftsData);
      } catch (err) {
        console.error('Error fetching NFTs:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch NFTs'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTs();
  }, [userAddress, balance, publicClient]);

  // Helper function to get token ID by index
  const fetchTokenOfOwnerByIndex = async (owner: `0x${string}`, index: number): Promise<bigint | null> => {
    if (!publicClient) return null;
    
    try {
      const data = await publicClient.readContract({
        ...trustNFTConfig,
        functionName: 'tokenOfOwnerByIndex',
        args: [owner, BigInt(index)],
      });
      return data as bigint;
    } catch (err) {
      console.error('Error fetching token ID:', err);
      return null;
    }
  };

  // Helper function to fetch NFT details by token ID
  const fetchNFTDetails = async (tokenId: bigint): Promise<NFT | null> => {
    if (!publicClient) return null;
    
    try {
      // Get trust score for this NFT
      const trustScore = await publicClient.readContract({
        ...trustNFTConfig,
        functionName: 'trustScoreOf',
        args: [tokenId],
      });

      // Get URI for metadata
      const tokenURI = await publicClient.readContract({
        ...trustNFTConfig,
        functionName: 'tokenURI',
        args: [tokenId],
      });

      // Get token owner
      const owner = await publicClient.readContract({
        ...trustNFTConfig,
        functionName: 'ownerOf',
        args: [tokenId],
      });

      if (!trustScore || !tokenURI || !owner) return null;

      const tier = getTierFromTrustScore(Number(trustScore));
      
      // For on-chain NFTs, we might need to fetch metadata from URI
      // For simplicity, constructing basic metadata here
      const nft: NFT = {
        id: tokenId.toString(),
        tokenId: Number(tokenId),
        name: `Graphite Trust NFT #${tokenId}`,
        description: `Trust NFT representing trust score ${trustScore}`,
        image: `/trust-badges/tier-${tier}.svg`,
        owner: owner as string,
        trustScore: Number(trustScore),
        tier,
        createdAt: new Date().toISOString(), // Would get from contract in real implementation
        attributes: [
          { trait_type: 'Trust Score', value: Number(trustScore) },
          { trait_type: 'Tier', value: tier },
        ],
      };

      return nft;
    } catch (err) {
      console.error(`Error fetching NFT details for token ID ${tokenId}:`, err);
      return null;
    }
  };

  // Filter and sort functions
  const filterByTier = (tier: NFTTier) => {
    return nfts.filter(nft => nft.tier === tier);
  };

  const filterByScore = (minScore: number, maxScore?: number) => {
    return nfts.filter(nft => {
      if (maxScore !== undefined) {
        return nft.trustScore >= minScore && nft.trustScore <= maxScore;
      }
      return nft.trustScore >= minScore;
    });
  };

  const sortByScore = (ascending: boolean = true) => {
    const sorted = [...nfts].sort((a, b) => {
      return ascending 
        ? a.trustScore - b.trustScore 
        : b.trustScore - a.trustScore;
    });
    return sorted;
  };

  const sortByDate = (ascending: boolean = true) => {
    const sorted = [...nfts].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
    return sorted;
  };

  return {
    nfts,
    isLoading,
    error,
    refetchBalance,
    filterByTier,
    filterByScore,
    sortByScore,
    sortByDate,
  };
}

/**
 * Hook to mint a new Trust NFT
 */
export function useMintNFT() {
  const { address } = useAccount();
  const { writeContractAsync, data: hash, isPending, isError, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const trustNFTConfig = {
    address: CONTRACT_ADDRESSES.trustNFT as `0x${string}`,
    abi: getContractConfig('trustNFT').abi,
  };

  const mint = async () => {
    if (!address) throw new Error('Wallet not connected');
    
    try {
      return await writeContractAsync({
        ...trustNFTConfig,
        functionName: 'mint',
        // args: [], // Assuming mint doesn't require arguments beyond the sender
      });
    } catch (err) {
      console.error('Error minting NFT:', err);
      throw err;
    }
  };

  const isProcessing = isPending || isConfirming;

  return {
    mint,
    isProcessing,
    isSuccess,
    isError,
    error,
    hash,
  };
}

/**
 * Hook to interact with a specific NFT by token ID
 */
export function useNFTDetails(tokenId: number | null) {
  const [nft, setNft] = useState<NFT | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const trustNFTConfig = {
    address: CONTRACT_ADDRESSES.trustNFT as `0x${string}`,
    abi: getContractConfig('trustNFT').abi,
  };

  useEffect(() => {
    const fetchNFT = async () => {
      if (!tokenId || !publicClient) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Get trust score for this NFT
        const trustScore = await publicClient.readContract({
          ...trustNFTConfig,
          functionName: 'trustScoreOf',
          args: [BigInt(tokenId)],
        });

        // Get URI for metadata
        const tokenURI = await publicClient.readContract({
          ...trustNFTConfig,
          functionName: 'tokenURI',
          args: [BigInt(tokenId)],
        });

        // Get token owner
        const owner = await publicClient.readContract({
          ...trustNFTConfig,
          functionName: 'ownerOf',
          args: [BigInt(tokenId)],
        });

        if (!trustScore || !tokenURI || !owner) {
          setError(new Error('Failed to fetch NFT data'));
          return;
        }

        const tier = getTierFromTrustScore(Number(trustScore));
        
        // For on-chain NFTs, we might need to fetch metadata from URI
        // For simplicity, constructing basic metadata here
        const nftData: NFT = {
          id: tokenId.toString(),
          tokenId: tokenId,
          name: `Graphite Trust NFT #${tokenId}`,
          description: `Trust NFT representing trust score ${trustScore}`,
          image: `/trust-badges/tier-${tier}.svg`,
          owner: owner as string,
          trustScore: Number(trustScore),
          tier,
          createdAt: new Date().toISOString(), // Would get from contract in real implementation
          attributes: [
            { trait_type: 'Trust Score', value: Number(trustScore) },
            { trait_type: 'Tier', value: tier },
          ],
        };

        setNft(nftData);
      } catch (err) {
        console.error(`Error fetching NFT details for token ID ${tokenId}:`, err);
        setError(err instanceof Error ? err : new Error('Failed to fetch NFT details'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFT();
  }, [tokenId, publicClient]);

  /**
   * Refresh the NFT's trust score from the blockchain
   */
  const refreshTrustScore = async () => {
    if (!tokenId || !publicClient) return;
    
    try {
      setIsLoading(true);
      
      // Request trust score update
      await writeContractAsync({
        ...trustNFTConfig,
        functionName: 'refreshTrustScore',
        args: [BigInt(tokenId)],
      });
      
      // Refetch NFT details after a short delay
      setTimeout(async () => {
        try {
          const newTrustScore = await publicClient.readContract({
            ...trustNFTConfig,
            functionName: 'trustScoreOf',
            args: [BigInt(tokenId)],
          });
          
          if (newTrustScore && nft) {
            const newTier = getTierFromTrustScore(Number(newTrustScore));
            setNft({
              ...nft,
              trustScore: Number(newTrustScore),
              tier: newTier,
              attributes: [
                { trait_type: 'Trust Score', value: Number(newTrustScore) },
                { trait_type: 'Tier', value: newTier },
              ],
            });
          }
        } catch (err) {
          console.error('Error fetching updated trust score:', err);
        } finally {
          setIsLoading(false);
        }
      }, 2000); // Wait for blockchain update to propagate
      
    } catch (err) {
      console.error('Error refreshing trust score:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh trust score'));
      setIsLoading(false);
    }
  };

  return {
    nft,
    isLoading,
    error,
    refreshTrustScore,
  };
}

/**
 * Hook for NFT customization operations
 */
export function useCustomizeNFT() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trustNFTConfig = {
    address: CONTRACT_ADDRESSES.trustNFT as `0x${string}`,
    abi: getContractConfig('trustNFT').abi,
  };

  /**
   * Update the customization data for an NFT
   */
  const updateCustomization = async (
    tokenId: number,
    customizationData: string // JSON string or IPFS hash to customization data
  ) => {
    if (!tokenId) throw new Error('Token ID is required');
    
    try {
      setIsCustomizing(true);
      setError(null);
      
      const hash = await writeContractAsync({
        ...trustNFTConfig,
        functionName: 'setCustomizationData',
        args: [BigInt(tokenId), customizationData],
      });
      
      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return hash;
    } catch (err) {
      console.error('Error updating NFT customization:', err);
      setError(err instanceof Error ? err : new Error('Failed to update customization'));
      throw err;
    } finally {
      setIsCustomizing(false);
    }
  };

  return {
    updateCustomization,
    isCustomizing: isPending || isCustomizing,
    error,
  };
} 