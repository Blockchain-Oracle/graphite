import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { getContractConfig, CONTRACT_ADDRESSES } from '../web3/contract-config';
import { NFT, NFTTier, getTierFromTrustScore, MOCK_NFTS, NFTAttribute } from '../types';

/**
 * Hook to get user's NFTs from the blockchain
 */
export function useUserNFTs(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const userAddress = address || connectedAddress;
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalSupplyOfNFTs, setTotalSupplyOfNFTs] = useState<number>(0);
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

  const { data: fetchedTotalSupply, isLoading: isTotalSupplyLoading } = useReadContract({
    ...trustNFTConfig,
    functionName: 'totalSupply',
    query: {
      enabled: !address, // Only fetch total supply if no specific address is provided (i.e., fetching all NFTs)
    }
  });

  useEffect(() => {
    if (fetchedTotalSupply) {
      setTotalSupplyOfNFTs(Number(fetchedTotalSupply));
    }
  }, [fetchedTotalSupply]);

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
      const { abi: trustNFTAbi } = getContractConfig('trustNFT');
      const { abi: ecosystemAbi } = getContractConfig('reputationEcosystem');

      // Define a type for the structure returned by getBadgeData
      type BadgeDataReturnType = [number, string, string, boolean];

      const [tokenUri, owner, rawLastTrustScore, badgeDataResult] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.trustNFT as `0x${string}`,
          abi: trustNFTAbi,
          functionName: 'tokenURI',
          args: [tokenId],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.trustNFT as `0x${string}`,
          abi: trustNFTAbi,
          functionName: 'ownerOf',
          args: [tokenId],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.trustNFT as `0x${string}`,
          abi: trustNFTAbi,
          functionName: 'lastTrustScore',
          args: [tokenId],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.trustNFT as `0x${string}`,
          abi: trustNFTAbi,
          functionName: 'getBadgeData',
          args: [tokenId],
        }),
      ]);

      const score = Number(rawLastTrustScore);
      const tier = getTierFromScore(score);
      const badgeData = badgeDataResult as BadgeDataReturnType | null;

      const nftName = badgeData && badgeData[1] ? badgeData[1] : `Graphite Trust NFT #${tokenId.toString()}`;
      const nftDescription = badgeData && badgeData[2] ? badgeData[2] : `A unique Trust NFT for user ${owner}.`;
      const numericId: number = Number(tokenId); // Explicitly convert to number

      const attributes: NFTAttribute[] = [];
      if (badgeData) {
        attributes.push({ trait_type: 'Badge Type', value: badgeData[0] });
        attributes.push({ trait_type: 'Badge Name', value: badgeData[1] });
        attributes.push({ trait_type: 'Badge Message', value: badgeData[2] });
        attributes.push({ trait_type: 'Verified Badge', value: badgeData[3] ? 'Yes' : 'No' });
      }
      // Add other relevant attributes if any

      return {
        id: tokenId.toString(),
        tokenId: numericId,
        name: nftName,
        description: nftDescription,
        image: `/api/badge-images/${tokenId.toString()}`,
        owner: owner as `0x${string}`,
        trustScore: score,
        tier,
        attributes,
        // tokenUri: tokenUri as string, // Temporarily commented out
        // Default or placeholder values for fields expected by the NFT interface
        createdAt: new Date().toISOString(), // Placeholder, ideally fetch actual mint date
        customizations: undefined, // Placeholder
      };
    } catch (error) {
      console.error(`Error fetching details for NFT ${tokenId}:`, error);
      return null;
    }
  };

  // Helper function to get tier name based on score (align with contract logic if possible)
  // This should mirror the contract's getTierName/getTierLevel if precise alignment is needed
  const getTierFromScore = (score: number): NFTTier => {
    if (score < 200) return 'Basic' as NFTTier;
    if (score < 400) return 'Moderate' as NFTTier;
    if (score < 600) return 'Good' as NFTTier;
    if (score < 800) return 'High' as NFTTier;
    return 'Exceptional' as NFTTier;
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
    totalSupplyOfNFTs: address ? 0 : totalSupplyOfNFTs, // Only return total supply if no specific address
  };
}

/**
 * Hook to mint a new Trust NFT
 */
export function useMintNFT() {
  const { address } = useAccount();
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Configuration for the GraphiteReputationEcosystem contract
  const ecosystemContractConfig = {
    address: CONTRACT_ADDRESSES.reputationEcosystem as `0x${string}`,
    abi: getContractConfig('reputationEcosystem').abi,
  };

  // Read the mintCost from the ecosystem contract
  const { data: mintCost, isLoading: isMintCostLoading, error: mintCostError } = useReadContract({
    ...ecosystemContractConfig,
    functionName: 'mintCost',
    query: {
      enabled: !!address, // Only fetch if user is connected
    }
  });

  const mint = async () => {
    if (!address) throw new Error('Wallet not connected');
    if (isMintCostLoading) throw new Error('Mint cost is being loaded, please wait.');
    if (mintCostError) throw new Error(`Failed to load mint cost: ${mintCostError.message}`);
    if (mintCost === undefined || mintCost === null) throw new Error('Mint cost not available.');

    try {
      const txHash = await writeContractAsync({
        ...ecosystemContractConfig, // Use ecosystem contract config
        functionName: 'mintNFT',    // Call the ecosystem's mintNFT function
        // No args needed for ecosystem.mintNFT()
        value: mintCost as bigint, // Send mintCost with the transaction
      });
      return txHash;
    } catch (err: any) {
      console.error('Error during writeContractAsync in useMintNFT:', err);
      // Re-throw the error so the caller (and useWriteContract internal state) is aware.
      // The useEffect below will handle parsing it into a user-friendly message.
      throw err; 
    }
  };

  const isProcessing = isPending || isConfirming;

  // We need a local state for the parsed error message
  const [parsedError, setParsedError] = useState<string | null>(null);

  // Effect to parse error from useWriteContract or mintCostError
  useEffect(() => {
    const rawError = error || mintCostError;
    if (rawError) {
      let specificMessage = 'An unknown error occurred.';
      // Prefer shortMessage if available and a string, otherwise use message.
      const messageSource = (typeof (rawError as any).shortMessage === 'string' ? (rawError as any).shortMessage : rawError.message) || '';

      if (messageSource.includes('AccountNotActivated')) {
        specificMessage = 'Account not activated. Please activate your account first.';
      } else if (messageSource.includes('InsufficientKYCLevel')) {
        specificMessage = 'Insufficient KYC level. Please complete the required KYC verification.';
      } else if (messageSource.includes('InsufficientMintFee')) {
        specificMessage = 'Insufficient fee sent for minting. Please ensure you have enough funds.';
      } else if (messageSource.includes('MintingDisabled')) {
        specificMessage = 'Minting is currently disabled by the administrator.';
      } else if (rawError.message && rawError.message.includes('Mint cost not available')) {
        specificMessage = 'Mint cost is not available. Please try again shortly.';
      } else if (rawError.message && rawError.message.includes('Failed to load mint cost')) {
        specificMessage = 'Could not load mint cost. Please check your connection or try again.';
      } else {
        // Fallback for other viem/contract errors
        specificMessage = messageSource.length > 150 ? 'A contract error occurred. Please try again.' : messageSource;
        if (!specificMessage) { // Ensure there's always some message
            specificMessage = 'An unexpected error occurred during the transaction.';
        }
      }
      setParsedError(specificMessage);
    } else {
      setParsedError(null);
    }
  }, [error, mintCostError]);

  return {
    mint,
    isProcessing,
    isSuccess,
    isError: !!parsedError, // isError is true if parsedError is not null
    error: parsedError,     // Return the parsed, user-friendly error message
    hash,
    mintCost: mintCost as bigint | undefined,
    isMintCostLoading,
  };
}

/**
 * Hook to interact with a specific NFT by token ID
 */
export function useNFTDetails(tokenId: number | null) {
  const [nft, setNft] = useState<NFT | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // const publicClient = usePublicClient(); // No longer needed if no blockchain calls

  // const trustNFTConfig = { // No longer needed
  //   address: CONTRACT_ADDRESSES.trustNFT as `0x${string}`,
  //   abi: getContractConfig('trustNFT').abi,
  // };

  useEffect(() => {
    const fetchNFTFromMock = () => {
      if (tokenId === null || tokenId === undefined || isNaN(tokenId)) {
        setNft(null);
        setIsLoading(false);
        if (tokenId !== null && tokenId !== undefined) setError(new Error('Invalid Token ID'));
        return;
      }
      
      setIsLoading(true);
      setError(null);

      // Find NFT from MOCK_NFTS
      const mockNFTData = MOCK_NFTS.find(n => n.tokenId === tokenId);

      if (!mockNFTData) {
        setError(new Error(`NFT with Token ID ${tokenId} not found in mock data.`));
        setNft(null);
      } else {
        setNft(mockNFTData); // Use mock data directly, including owner
      }
      setIsLoading(false);
    };

    fetchNFTFromMock();
  }, [tokenId]);

  return {
    nft,
    isLoading,
    error,
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