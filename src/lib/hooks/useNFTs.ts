import { useState, useEffect } from 'react';
import { MOCK_NFTS, NFT, NFTTier } from '../types';

export function useUserNFTs(address: string | undefined) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchNFTs = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        if (address) {
          // Filter mock NFTs by owner address if address is provided
          const userNfts = MOCK_NFTS.filter((nft: NFT) => nft.owner.toLowerCase() === address.toLowerCase());
          setNfts(userNfts);
        } else {
          // If no address, set all NFTs (for the 'All NFTs' view)
          setNfts(MOCK_NFTS);
        }
      } catch (err) {
        console.error('Error fetching NFTs:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch NFTs'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTs();
  }, [address]);

  // Filter functions
  const filterByTier = (tier: NFTTier) => {
    return nfts.filter(nft => nft.tier === tier);
  };

  const filterByDate = (fromDate: Date, toDate: Date) => {
    return nfts.filter(nft => {
      const createdAt = new Date(nft.createdAt);
      return createdAt >= fromDate && createdAt <= toDate;
    });
  };

  const sortByScore = (ascending: boolean = true) => {
    return [...nfts].sort((a, b) => {
      return ascending 
        ? a.trustScore - b.trustScore 
        : b.trustScore - a.trustScore;
    });
  };

  return {
    nfts,
    isLoading,
    error,
    filterByTier,
    filterByDate,
    sortByScore,
  };
}

export function useNFTDetails(tokenId: number | null) {
  const [nft, setNft] = useState<NFT | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchNFTDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Simulate API call with a delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (tokenId === null) {
          setNft(null);
          return;
        }
        
        // Find NFT by tokenId
        const foundNft = MOCK_NFTS.find((nft: NFT) => nft.tokenId === tokenId);
        
        if (!foundNft) {
          throw new Error(`NFT with token ID ${tokenId} not found`);
        }
        
        setNft(foundNft);
      } catch (err) {
        console.error('Error fetching NFT details:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch NFT details'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTDetails();
  }, [tokenId]);

  return { nft, isLoading, error };
}

export function useMintNFT() {
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<Error | null>(null);
  const [mintedNFT, setMintedNFT] = useState<NFT | null>(null);

  const mint = async (trustScore: number, tier: NFTTier, image: string) => {
    setIsMinting(true);
    setMintError(null);
    setMintedNFT(null);
    
    try {
      // Simulate minting process with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would be a call to the blockchain
      // const tier = getTierForScore(trustScore); // tier is now passed as an argument
      
      // Generate a mock minted NFT
      const newNFT: NFT = {
        id: `mock-${Date.now()}`,
        tokenId: MOCK_NFTS.length + 1, // This could lead to collisions if MOCK_NFTS is modified elsewhere
        name: `Trust Guardian - ${tier.replace('_', ' ')}`,
        description: `A newly minted ${tier.replace('_', ' ')} tier Trust Guardian`,
        image: image, // Use the passed image
        // model: `/models/${tier.toLowerCase().replace('_', '-')}.glb`, // REMOVED
        owner: '0x1234567890123456789012345678901234567890', // This would be the user's address
        trustScore,
        tier,
        createdAt: new Date().toISOString(),
        attributes: [
          { trait_type: 'Mint Date', value: new Date().toLocaleDateString() },
          { trait_type: 'Trust Score', value: trustScore }
        ],
        customizations: { // Add default customization
            baseModel: 'standard',
            accessories: [],
            colors: { primary: '#A0A0A0', secondary: '#FFFFFF', accent: '#888888' },
            animation: 'static'
        }
      };
      
      // Add the new NFT to the MOCK_NFTS array for persistence in the session
      MOCK_NFTS.push(newNFT);

      setMintedNFT(newNFT);
      return newNFT;
    } catch (err) {
      console.error('Error minting NFT:', err);
      const error = err instanceof Error ? err : new Error('Failed to mint NFT');
      setMintError(error);
      throw error;
    } finally {
      setIsMinting(false);
    }
  };

  return { mint, isMinting, mintError, mintedNFT };
}

export function useCustomizeNFT() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);

  const saveCustomization = async (
    tokenId: number, 
    customization: NFT['customizations']
  ) => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Simulate saving customization with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real implementation, this would be a call to the blockchain
      console.log('Saving customization for token ID', tokenId, customization);
      
      // Return a mock success response
      return { success: true };
    } catch (err) {
      console.error('Error saving NFT customization:', err);
      const error = err instanceof Error ? err : new Error('Failed to save customization');
      setSaveError(error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveCustomization, isSaving, saveError };
}

// Helper function
function getTierForScore(score: number): NFTTier {
  if (score >= 800) return NFTTier.TIER_5;
  if (score >= 600) return NFTTier.TIER_4;
  if (score >= 400) return NFTTier.TIER_3;
  if (score >= 200) return NFTTier.TIER_2;
  return NFTTier.TIER_1;
} 