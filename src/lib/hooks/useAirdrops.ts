import { useState, useEffect, useMemo } from 'react';
import { useAccount, useConfig } from 'wagmi';
import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt
} from 'wagmi';
import { getPublicClient } from 'wagmi/actions';
import { type PublicClient, keccak256, encodeAbiParameters, toHex } from 'viem';
import { getContractConfig } from '../web3/contract-config';
import type { AirdropData } from '@/components/web3/airdrop-card';

// Key for localStorage
const MERKLE_DATA_STORAGE_KEY = 'graphite-airdrop-merkle-data';

/**
 * Hook to get all airdrops from the factory
 */
export function useAirdrops() {
  const config = useConfig();
  const [airdrops, setAirdrops] = useState<AirdropData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get number of airdrops from factory
  const { data: airdropCount, isLoading: isCountLoading, isError: isCountError } = useReadContract({
    ...getContractConfig('airdropFactory'),
    functionName: 'getAirdropCount',
    args: [],
    query: {
      // Always enabled
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  });

  // Fetch airdrops data
  useEffect(() => {
    const fetchAirdrops = async () => {
      if (!airdropCount) return;
      
      try {
        const publicClient = getPublicClient(config);
        if (!publicClient) {
          throw new Error('Failed to get public client');
        }
        
        const airdropPromises = [];
        for (let i = 0; i < Number(airdropCount); i++) {
          airdropPromises.push(fetchAirdropAtIndex(i, publicClient));
        }
        
        const results = await Promise.all(airdropPromises);
        setAirdrops(results.filter(Boolean) as AirdropData[]);
      } catch (error) {
        console.error("Error fetching airdrops:", error);
        setError(error instanceof Error ? error : new Error('Failed to fetch airdrops'));
      } finally {
        setIsLoading(false);
      }
    };

    if (!isCountLoading && airdropCount !== undefined && !isCountError) {
      fetchAirdrops();
    } else if (isCountError) {
      setIsLoading(false);
      setError(new Error('Failed to fetch airdrop count'));
    }
  }, [airdropCount, isCountLoading, isCountError, config]);

  const fetchAirdropAtIndex = async (index: number, publicClient: PublicClient): Promise<AirdropData | null> => {
    try {
      const erc20MinimalAbiForAirdrops = [
        {
          "constant": true,
          "inputs": [],
          "name": "name",
          "outputs": [{ "name": "", "type": "string" }],
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "symbol",
          "outputs": [{ "name": "", "type": "string" }],
          "type": "function"
        }
      ];

      // Get airdrop address from factory
      const airdropAddress = await publicClient.readContract({
        ...getContractConfig('airdropFactory'),
        functionName: 'airdrops',
        args: [BigInt(index)],
      }) as `0x${string}`;

      if (!airdropAddress || airdropAddress === '0x0000000000000000000000000000000000000000') return null;

      // Get core airdrop details from the SybilResistantAirdrop contract
      const [tokenContractAddress, contractStartTime, contractEndTime] = await Promise.all([
        publicClient.readContract({
          address: airdropAddress,
          abi: getContractConfig('sybilResistantAirdrop').abi,
          functionName: 'token', // Address of the ERC20 token
        }),
        publicClient.readContract({
          address: airdropAddress,
          abi: getContractConfig('sybilResistantAirdrop').abi,
          functionName: 'startTime',
        }),
        publicClient.readContract({
          address: airdropAddress,
          abi: getContractConfig('sybilResistantAirdrop').abi,
          functionName: 'endTime',
        }),
      ]);

      // Fetch ERC20 token details (name and symbol)
      let tokenName: string = `Airdrop Token ${index + 1}`;
      let tokenSymbol: string = 'TKN';
      try {
        const [fetchedTokenName, fetchedTokenSymbol] = await Promise.all([
          publicClient.readContract({
            address: tokenContractAddress as `0x${string}`,
            abi: erc20MinimalAbiForAirdrops,
            functionName: 'name',
          }),
          publicClient.readContract({
            address: tokenContractAddress as `0x${string}`,
            abi: erc20MinimalAbiForAirdrops,
            functionName: 'symbol',
          }),
        ]);
        tokenName = fetchedTokenName as string || tokenName;
        tokenSymbol = fetchedTokenSymbol as string || tokenSymbol;
      } catch (tokenError) {
        console.warn(`Error fetching ERC20 metadata for token ${tokenContractAddress} in airdrop ${airdropAddress}:`, tokenError);
        // Keep default names if metadata fetch fails
      }
      

      // Get airdrop creator info from factory
      const creatorAddress = await publicClient.readContract({
        ...getContractConfig('airdropFactory'),
        functionName: 'airdropCreators', // Corrected function name
        args: [airdropAddress],
      }) as `0x${string}`;

      // Determine airdrop status
      const now = Math.floor(Date.now() / 1000);
      let status: 'upcoming' | 'active' | 'expired' | 'completed' = 'active';
      
      if (Number(contractStartTime) > now) {
        status = 'upcoming';
      } else if (Number(contractEndTime) < now) {
        status = 'expired'; 
      }
      // Note: 'completed' status based on claimedCount/totalTokens is removed as these are not directly on the airdrop contract.

      // Create AirdropData object
      return {
        id: airdropAddress,
        name: tokenName,
        symbol: tokenSymbol,
        amount: 100, // Default amount per user - actual amount would come from Merkle tree data per user
        logoUrl: '/trust-badges/tier-3.svg', // Default logo - actual logo could come from token metadata service
        tokenContractAddress: tokenContractAddress as `0x${string}`,
        creatorName: `User ${creatorAddress.slice(0,6)}...`, // Placeholder, could use ENS lookup
        creatorAddress: creatorAddress,
        startDate: new Date(Number(contractStartTime) * 1000).toISOString(),
        endDate: new Date(Number(contractEndTime) * 1000).toISOString(),
        claimers: 0, // Placeholder, as SybilResistantAirdrop doesn't expose a simple claimedCount
        totalTokens: 0, // Placeholder, as SybilResistantAirdrop doesn't expose totalTokens for airdrop
        description: `${tokenName} airdrop by ${creatorAddress.slice(0,6)}...`,
        type: 'ERC20',
        status,
      };
    } catch (error) {
      console.error(`Error fetching airdrop at index ${index}:`, error);
      return null;
    }
  };

  // Filter functions
  const filterByStatus = (status: AirdropData['status']) => {
    return airdrops.filter(airdrop => airdrop.status === status);
  };

  const filterByCreator = (creatorAddress: string) => {
    return airdrops.filter(airdrop => 
      airdrop.creatorAddress.toLowerCase() === creatorAddress.toLowerCase()
    );
  };

  const getUpcomingAirdrops = () => filterByStatus('upcoming');
  const getActiveAirdrops = () => filterByStatus('active');
  const getExpiredAirdrops = () => filterByStatus('expired');
  const getCompletedAirdrops = () => filterByStatus('completed');

  return {
    airdrops,
    isLoading,
    error,
    filterByStatus,
    filterByCreator,
    getUpcomingAirdrops,
    getActiveAirdrops,
    getExpiredAirdrops,
    getCompletedAirdrops,
  };
}

/**
 * Hook to check eligibility and claim an airdrop
 */
export function useAirdropClaim(airdropAddress?: `0x${string}`) {
  const { address } = useAccount();
  const config = useConfig();
  const [eligibilityDetails, setEligibilityDetails] = useState<{
    isActivated: boolean;
    trustScore: number;
    kycLevel: number;
    isBlacklisted: boolean;
    hasClaimedAirdrop: boolean;
  }>({
    isActivated: false,
    trustScore: 0,
    kycLevel: 0,
    isBlacklisted: false, 
    hasClaimedAirdrop: false
  });
  const [claimAmount, setClaimAmount] = useState<bigint>(BigInt(0));
  const [merkleProof, setMerkleProof] = useState<`0x${string}`[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { writeContractAsync, isPending: isClaimPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check eligibility and claim status
  useEffect(() => {
    const checkEligibility = async () => {
      if (!address || !airdropAddress) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const publicClient = getPublicClient(config);
        
        if (!publicClient) {
          throw new Error('Failed to get public client');
        }

        // Get detailed eligibility information from the contract
        const details = await publicClient.readContract({
          address: airdropAddress,
          abi: getContractConfig('sybilResistantAirdrop').abi,
          functionName: 'getEligibilityDetails',
          args: [address],
        }) as [boolean, bigint, bigint, boolean, boolean];

        // Parse eligibility details
        const eligibilityInfo = {
          isActivated: details[0],
          trustScore: Number(details[1]),
          kycLevel: Number(details[2]),
          isBlacklisted: details[3],
          hasClaimedAirdrop: details[4]
        };

        setEligibilityDetails(eligibilityInfo);

        // Get stored Merkle data for this airdrop and user
        const { amount, proof } = getMerkleDataForAirdrop(airdropAddress, address);
        if (amount) {
          setClaimAmount(amount);
        } else {
          // Fallback to reading from contract if no stored data
          try {
            const requiredTrustScore = await publicClient.readContract({
              address: airdropAddress,
              abi: getContractConfig('sybilResistantAirdrop').abi,
              functionName: 'requiredTrustScore',
            }) as bigint;
            
            setClaimAmount(requiredTrustScore); // Using this as a placeholder amount
          } catch (amountError) {
            console.warn("Could not determine claim amount:", amountError);
            setClaimAmount(BigInt(0));
          }
        }
        
        if (proof && proof.length > 0) {
          setMerkleProof(proof);
        }
      } catch (error) {
        console.error("Error checking airdrop eligibility:", error);
        setError(error instanceof Error ? error : new Error('Failed to check airdrop eligibility'));
        setEligibilityDetails({
          isActivated: false,
          trustScore: 0,
          kycLevel: 0,
          isBlacklisted: false,
          hasClaimedAirdrop: false
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkEligibility();
  }, [address, airdropAddress, config]);

  // Function to claim the airdrop
  const claimAirdrop = async () => {
    if (!airdropAddress || !address) {
      throw new Error('Airdrop address or user address not provided');
    }

    // This is where you'd verify the user meets all eligibility requirements
    const { isActivated, trustScore, kycLevel, isBlacklisted, hasClaimedAirdrop } = eligibilityDetails;
    
    if (!isActivated) {
      throw new Error('Account not activated');
    }
    
    if (isBlacklisted) {
      throw new Error('Address is blacklisted');
    }
    
    if (hasClaimedAirdrop) {
      throw new Error('Airdrop already claimed');
    }

    try {
      return await writeContractAsync({
        address: airdropAddress,
        abi: getContractConfig('sybilResistantAirdrop').abi,
        functionName: 'claim',
        args: [claimAmount, merkleProof],
      });
    } catch (error) {
      console.error("Error claiming airdrop:", error);
      throw error;
    }
  };

  // Determine if the user is eligible based on all criteria
  const isEligible = eligibilityDetails.isActivated && 
    !eligibilityDetails.isBlacklisted && 
    !eligibilityDetails.hasClaimedAirdrop;

  return {
    // Split out individual eligibility details
    ...eligibilityDetails,
    // Also provide the combined eligibility status
    isEligible,
    claimAmount,
    merkleProof,
    isLoading,
    error,
    claimAirdrop,
    isClaimPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook to fetch token metadata from a contract address
 * Used to verify token information before creating an airdrop
 */
export function useTokenMetadata(tokenAddress?: `0x${string}`) {
  const config = useConfig();
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
    balance?: bigint;
    logo?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { address: userAddress } = useAccount();

  useEffect(() => {
    const fetchTokenMetadata = async () => {
      if (!tokenAddress) {
        setTokenInfo(null);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const publicClient = getPublicClient(config);
        if (!publicClient) {
          throw new Error('Failed to get public client');
        }

        // Common ERC20 ABI entries for metadata
        const erc20Abi = [
          {
            "constant": true,
            "inputs": [],
            "name": "name",
            "outputs": [{ "name": "", "type": "string" }],
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [{ "name": "", "type": "string" }],
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [{ "name": "", "type": "uint8" }],
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "totalSupply",
            "outputs": [{ "name": "", "type": "uint256" }],
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [{ "name": "owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "", "type": "uint256" }],
            "type": "function"
          }
        ];
        
        // Fetch token metadata in parallel
        const results = await Promise.allSettled([
          // Get token name
          publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'name',
          }),
          // Get token symbol
          publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'symbol',
          }),
          // Get token decimals
          publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'decimals',
          }),
          // Get token total supply
          publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'totalSupply',
          }),
          // Get user balance (optional)
          userAddress ? publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [userAddress],
          }) : Promise.resolve(undefined)
        ]);
        
        // Extract results safely
        const name = results[0].status === 'fulfilled' ? results[0].value as string : 'Unknown Token';
        const symbol = results[1].status === 'fulfilled' ? results[1].value as string : '???';
        const decimals = results[2].status === 'fulfilled' ? Number(results[2].value) : 18;
        const totalSupply = results[3].status === 'fulfilled' ? results[3].value as bigint : BigInt(0);
        const balance = results[4]?.status === 'fulfilled' ? results[4].value as bigint : undefined;
        
        // Try to fetch a token logo from common sources
        // This is a simplified approach - in a production app you might want to use a token list or API
        let logo: string | undefined = undefined;
        
        // Set the token info
        setTokenInfo({
          name,
          symbol,
          decimals,
          totalSupply,
          balance,
          logo
        });
      } catch (err) {
        console.error('Error fetching token metadata:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch token metadata'));
        setTokenInfo(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTokenMetadata();
  }, [tokenAddress, config, userAddress]);

  /**
   * Format the token amount for display with proper decimals
   * @param amount The raw token amount (in wei/smallest units)
   * @returns Formatted amount as a string with proper decimal places
   */
  const formatTokenAmount = (amount: bigint): string => {
    if (!tokenInfo) return '0';
    
    const decimals = tokenInfo.decimals;
    const divisor = BigInt(10) ** BigInt(decimals);
    const integerPart = amount / divisor;
    const fractionalPart = amount % divisor;
    
    // Format with proper decimal places
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    return `${integerPart}.${fractionalStr}`.replace(/\.?0+$/, '');
  };

  /**
   * Validate if the token is suitable for an airdrop
   * @returns Object containing validation status and any errors
   */
  const validateTokenForAirdrop = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!tokenInfo) {
      errors.push('Token information could not be loaded');
      return { isValid: false, errors };
    }
    
    // Check if token has valid metadata
    if (tokenInfo.name === 'Unknown Token' || tokenInfo.symbol === '???') {
      errors.push('Token contract does not implement standard ERC20 metadata methods');
    }
    
    // Check if total supply is zero
    if (tokenInfo.totalSupply === BigInt(0)) {
      errors.push('Token has zero total supply');
    }
    
    // Check if user has sufficient balance (if balance is available)
    if (tokenInfo.balance !== undefined && tokenInfo.balance === BigInt(0)) {
      errors.push('You do not have any tokens to airdrop');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  return {
    tokenInfo,
    isLoading,
    error,
    formatTokenAmount,
    validateTokenForAirdrop
  };
}

/**
 * Hook to create a new airdrop
 */
export function useCreateAirdrop() {
  const { data: hash, writeContractAsync, isPending, error, status } = useWriteContract();

  const createAirdrop = async (
    // name: string, // Kept for potential off-chain use or UI, not passed to this specific contract call
    // symbol: string, // Kept for potential off-chain use or UI, not passed to this specific contract call
    tokenContractAddress: `0x${string}`,
    merkleRoot: `0x${string}`, // bytes32
    requiredTrustScore: bigint,
    requiredKYCLevel: bigint,
    // totalAmount: bigint, // Not a direct parameter for factory.createAirdrop
    startTime: bigint,
    endTime: bigint,
    merkleData?: MerkleProofData // Add merkleData parameter to store after successful creation
  ) => {
    try {
      console.log("Calling createAirdrop with params:", {
        tokenAddress: tokenContractAddress,
        merkleRoot,
        requiredTrustScore: requiredTrustScore.toString(),
        requiredKYCLevel: requiredKYCLevel.toString(),
        startTime: startTime.toString(),
        endTime: endTime.toString(),
      });
      const tx = await writeContractAsync({
        abi: getContractConfig('airdropFactory').abi,
        address: getContractConfig('airdropFactory').address,
        functionName: 'createAirdrop',
        args: [
          tokenContractAddress,
          merkleRoot,
          requiredTrustScore,
          requiredKYCLevel,
          startTime,
          endTime
        ],
        gasPrice: BigInt(300000000000), // 300 Gwei, from Hardhat config
        gas: BigInt(3000000) 
      });
      
      // If we have merkle data and transaction was successful, store it
      if (merkleData) {
        // We need to wait for transaction receipt to get the airdrop address
        // This will be handled in the component after transaction confirmation
        storeMerkleDataForLaterUse(merkleData);
      }
      
      return tx;
    } catch (err) {
      console.error("Error creating airdrop:", err);
      throw err; // Re-throw to be caught by the caller and update component state
    }
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    createAirdrop,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error,
  };
}

/**
 * Store Merkle data for an airdrop in localStorage
 * @param merkleData The Merkle data to store
 */
export function storeMerkleDataForLaterUse(merkleData: MerkleProofData): void {
  try {
    // Get existing data
    const existingDataStr = localStorage.getItem(MERKLE_DATA_STORAGE_KEY);
    const existingData = existingDataStr ? JSON.parse(existingDataStr) : {};
    
    // Add new merkle data, using the root as the key
    existingData[merkleData.root] = merkleData;
    
    // Store updated data
    localStorage.setItem(MERKLE_DATA_STORAGE_KEY, JSON.stringify(existingData));
    console.log(`Stored Merkle data for root: ${merkleData.root}`);
  } catch (error) {
    console.error("Error storing Merkle data:", error);
  }
}

/**
 * Update stored Merkle data with airdrop contract address after successful creation
 * @param merkleRoot The Merkle root used for the airdrop
 * @param airdropAddress The address of the deployed airdrop contract
 */
export function updateMerkleDataWithAirdropAddress(merkleRoot: `0x${string}`, airdropAddress: `0x${string}`): void {
  try {
    // Get existing data
    const existingDataStr = localStorage.getItem(MERKLE_DATA_STORAGE_KEY);
    if (!existingDataStr) return;
    
    const existingData = JSON.parse(existingDataStr);
    
    // Find the merkle data by root
    if (existingData[merkleRoot]) {
      // Update with airdrop address
      existingData[merkleRoot].airdropAddress = airdropAddress;
      
      // Also create a reference by airdrop address for easier lookup
      existingData[airdropAddress] = existingData[merkleRoot];
      
      // Store updated data
      localStorage.setItem(MERKLE_DATA_STORAGE_KEY, JSON.stringify(existingData));
      console.log(`Updated Merkle data for airdrop: ${airdropAddress}`);
    }
  } catch (error) {
    console.error("Error updating Merkle data with airdrop address:", error);
  }
}

/**
 * Get Merkle data for a specific airdrop and user
 * @param airdropAddress The airdrop contract address
 * @param userAddress The user's address
 * @returns The claim amount and Merkle proof for the user, or empty values if not found
 */
export function getMerkleDataForAirdrop(airdropAddress: `0x${string}`, userAddress: `0x${string}`): {
  amount: bigint | null;
  proof: `0x${string}`[] | null;
} {
  try {
    // Get stored data
    const storedDataStr = localStorage.getItem(MERKLE_DATA_STORAGE_KEY);
    if (!storedDataStr) return { amount: null, proof: null };
    
    const storedData = JSON.parse(storedDataStr);
    
    // Try to find by airdrop address
    const merkleData = storedData[airdropAddress];
    if (!merkleData) return { amount: null, proof: null };
    
    // Find the user's data
    const normalizedUserAddress = userAddress.toLowerCase();
    const recipient = merkleData.recipients?.find(r => 
      r.address.toLowerCase() === normalizedUserAddress
    );
    
    if (!recipient) return { amount: null, proof: null };
    
    // Get the proof
    const proof = merkleData.proofs?.[normalizedUserAddress];
    
    return {
      amount: BigInt(recipient.amount.toString()),
      proof: proof || null
    };
  } catch (error) {
    console.error("Error retrieving Merkle data:", error);
    return { amount: null, proof: null };
  }
}

/**
 * Export the Merkle data for an airdrop as JSON
 * @param merkleRoot The Merkle root to export data for
 * @returns JSON string of the Merkle data or null if not found
 */
export function exportMerkleData(merkleRoot: `0x${string}`): string | null {
  try {
    const storedDataStr = localStorage.getItem(MERKLE_DATA_STORAGE_KEY);
    if (!storedDataStr) return null;
    
    const storedData = JSON.parse(storedDataStr);
    const merkleData = storedData[merkleRoot];
    
    if (!merkleData) return null;
    
    return JSON.stringify(merkleData, null, 2);
  } catch (error) {
    console.error("Error exporting Merkle data:", error);
    return null;
  }
}

/**
 * Import Merkle data from a JSON string
 * @param jsonData JSON string containing Merkle data
 * @returns True if import was successful
 */
export function importMerkleData(jsonData: string): boolean {
  try {
    const merkleData = JSON.parse(jsonData) as MerkleProofData;
    
    if (!merkleData.root || !merkleData.proofs || !merkleData.recipients) {
      throw new Error("Invalid Merkle data format");
    }
    
    storeMerkleDataForLaterUse(merkleData);
    return true;
  } catch (error) {
    console.error("Error importing Merkle data:", error);
    return false;
  }
}

/**
 * Hook to get user's airdrops
 */
export function useUserAirdrops() {
  const { address } = useAccount();
  const { 
    airdrops: initialAirdrops, // Renamed for clarity
    isLoading: isLoadingInitialAirdrops, 
    error: initialAirdropsError 
  } = useAirdrops(); 
  
  const [eligibilityMap, setEligibilityMap] = useState<Record<string, { isEligible: boolean, hasClaimed: boolean }>>({});
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(true);
  const [eligibilityError, setEligibilityError] = useState<Error | null>(null);
  const config = useConfig();
  
  useEffect(() => {
    const checkEligibilityForAllAirdrops = async () => {
      // Ensure address and initialAirdrops are present and initialAirdrops has items
      if (!address || !initialAirdrops || initialAirdrops.length === 0) {
        setEligibilityMap({}); // Clear map if not applicable
        setIsLoadingEligibility(false);
        return;
      }
      
      setIsLoadingEligibility(true);
      setEligibilityError(null);
      const publicClient = getPublicClient(config);

      if (!publicClient) {
        setEligibilityError(new Error('Failed to get public client for eligibility check.'));
        setIsLoadingEligibility(false);
        return;
      }
      
      const newEligibilityMap: Record<string, { isEligible: boolean, hasClaimed: boolean }> = {};
      
      try {
        for (const airdrop of initialAirdrops) {
          try {
            const airdropAddress = airdrop.id as `0x${string}`;
            
            const isEligiblePromise = publicClient.readContract({
              address: airdropAddress,
              abi: getContractConfig('sybilResistantAirdrop').abi,
              functionName: 'isEligible',
              args: [address],
            });
            
            const hasClaimedPromise = publicClient.readContract({
              address: airdropAddress,
              abi: getContractConfig('sybilResistantAirdrop').abi,
              functionName: 'hasClaimed',
              args: [address],
            });

            const [isEligibleResult, hasClaimedResult] = await Promise.all([isEligiblePromise, hasClaimedPromise]);
            
            newEligibilityMap[airdrop.id] = {
              isEligible: !!isEligibleResult,
              hasClaimed: !!hasClaimedResult
            };
          } catch (error) {
            console.error(`Error checking eligibility for airdrop ${airdrop.id}:`, error);
            // Set default/error state for this specific airdrop in the map
            newEligibilityMap[airdrop.id] = {
              isEligible: false,
              hasClaimed: false
            };
          }
        }
        setEligibilityMap(newEligibilityMap);
      } catch (error) {
        // This catch is for errors in the overall process, like Promise.all failing if not handled per-item
        console.error(`Error during bulk eligibility check:`, error);
        setEligibilityError(error instanceof Error ? error : new Error('Failed to check eligibility for all airdrops.'));
      } finally {
        setIsLoadingEligibility(false);
      }
    };
    
    checkEligibilityForAllAirdrops();
  }, [address, initialAirdrops, config]); // initialAirdrops is from useAirdrops

  // Combine airdrops with eligibility info using useMemo
  const enhancedAirdrops = useMemo(() => {
    if (!initialAirdrops) return []; // Handle case where initialAirdrops might be undefined briefly
    return initialAirdrops.map(airdrop => ({
      ...airdrop,
      isEligible: eligibilityMap[airdrop.id]?.isEligible || false,
      hasClaimed: eligibilityMap[airdrop.id]?.hasClaimed || false
    }));
  }, [initialAirdrops, eligibilityMap]);

  // Filter eligible airdrops using useMemo
  const eligibleAirdrops = useMemo(() => enhancedAirdrops.filter(
    airdrop => airdrop.isEligible && !airdrop.hasClaimed && airdrop.status === 'active'
  ), [enhancedAirdrops]);

  // Filter claimed airdrops using useMemo
  const claimedAirdrops = useMemo(() => enhancedAirdrops.filter(
    airdrop => airdrop.hasClaimed
  ), [enhancedAirdrops]);
  
  // Airdrops created by the user using useMemo
  const createdAirdrops = useMemo(() => enhancedAirdrops.filter(
    airdrop => airdrop.creatorAddress.toLowerCase() === (address?.toLowerCase() || '')
  ), [enhancedAirdrops, address]);

  return {
    allAirdrops: enhancedAirdrops,
    createdAirdrops,
    eligibleAirdrops,
    claimedAirdrops,
    isLoading: isLoadingInitialAirdrops || isLoadingEligibility, // Combined loading state
    error: initialAirdropsError || eligibilityError // Combined error state
  };
}

/**
 * Hook to check and manage token allowance for airdrop creation
 */
export function useTokenAllowance(tokenAddress?: `0x${string}`, amount?: bigint) {
  const { address: userAddress } = useAccount();
  const config = useConfig();
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasSufficientAllowance, setHasSufficientAllowance] = useState(false);
  
  const { writeContractAsync, isPending: isApprovePending, data: approveHash } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Common ERC20 allowance and approve ABI
  const erc20AllowanceAbi = [
    {
      "constant": true,
      "inputs": [
        { "name": "owner", "type": "address" },
        { "name": "spender", "type": "address" }
      ],
      "name": "allowance",
      "outputs": [{ "name": "", "type": "uint256" }],
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        { "name": "spender", "type": "address" },
        { "name": "value", "type": "uint256" }
      ],
      "name": "approve",
      "outputs": [{ "name": "", "type": "bool" }],
      "type": "function"
    }
  ];

  // Get the airdrop factory address from config
  const { address: airdropFactoryAddress } = getContractConfig('airdropFactory');

  // Check token allowance whenever relevant parameters change
  useEffect(() => {
    const checkAllowance = async () => {
      if (!tokenAddress || !userAddress || !airdropFactoryAddress) {
        setAllowance(BigInt(0));
        setHasSufficientAllowance(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const publicClient = getPublicClient(config);
        if (!publicClient) {
          throw new Error('Failed to get public client');
        }

        // Get current allowance
        const currentAllowance = await publicClient.readContract({
          address: tokenAddress,
          abi: erc20AllowanceAbi,
          functionName: 'allowance',
          args: [userAddress, airdropFactoryAddress]
        }) as bigint;

        setAllowance(currentAllowance);
        
        // Check if allowance is sufficient
        if (amount) {
          setHasSufficientAllowance(currentAllowance >= amount);
        }
      } catch (err) {
        console.error('Error checking token allowance:', err);
        setError(err instanceof Error ? err : new Error('Failed to check token allowance'));
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAllowance();
  }, [tokenAddress, userAddress, airdropFactoryAddress, amount, config, isApproveSuccess]);

  // Approve tokens for the airdrop factory
  const approveTokens = async (amountToApprove: bigint = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935')) => {
    if (!tokenAddress || !airdropFactoryAddress) {
      throw new Error('Token address or airdrop factory address not provided');
    }

    try {
      return await writeContractAsync({
        address: tokenAddress,
        abi: erc20AllowanceAbi,
        functionName: 'approve',
        args: [airdropFactoryAddress, amountToApprove]
      });
    } catch (error) {
      console.error("Error approving tokens:", error);
      throw error;
    }
  };

  // Format allowance for display
  const formatAllowance = (decimals: number): string => {
    if (allowance === BigInt(0)) return '0';
    
    const divisor = BigInt(10) ** BigInt(decimals);
    const integerPart = allowance / divisor;
    const fractionalPart = allowance % divisor;
    
    // Format with proper decimal places
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    return `${integerPart}.${fractionalStr}`.replace(/\.?0+$/, '');
  };

  return {
    allowance,
    hasSufficientAllowance,
    isLoading,
    error,
    approveTokens,
    isApprovePending,
    isApproveConfirming,
    isApproveSuccess,
    approveHash,
    formatAllowance
  };
}

// Type for Merkle Tree recipients
export interface AirdropRecipient {
  address: `0x${string}`;
  amount: bigint;
}

// Type for Merkle Tree proof
export interface MerkleProofData {
  root: `0x${string}`;
  proofs: Record<string, `0x${string}`[]>;
  recipients: AirdropRecipient[];
  leafLookup: Record<string, `0x${string}`>;
}

/**
 * Hook to create and manage Merkle trees for airdrops
 */
export function useMerkleTree() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [merkleData, setMerkleData] = useState<MerkleProofData | null>(null);
  
  /**
   * Generate a Merkle root and proofs for a list of recipients
   * @param recipients List of recipient addresses and amounts
   * @returns Merkle root and proofs object
   */
  const generateMerkleTree = async (recipients: AirdropRecipient[]): Promise<MerkleProofData> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Dynamically import MerkleTree to avoid issues if it's not immediately available or for server-side contexts
      const { default: MerkleTree } = await import('merkletreejs');

      const leafLookup: Record<string, `0x${string}`> = {};
      
      // Step 1: Create leaf nodes
      const leaves = recipients.map(recipient => {
        const leaf = keccak256(
          encodeAbiParameters(
            [{ type: 'address' }, { type: 'uint256' }],
            [recipient.address, recipient.amount]
          )
        ) as `0x${string}`;
        leafLookup[recipient.address.toLowerCase()] = leaf;
        return leaf;
      });
      
      // Step 2: Create the Merkle tree
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      
      // Step 3: Get the Merkle root
      const root = tree.getHexRoot() as `0x${string}`;
      
      // Step 4: Generate proofs for each recipient
      const proofs: Record<string, `0x${string}`[]> = {};
      recipients.forEach(recipient => {
        const leaf = leafLookup[recipient.address.toLowerCase()];
        if (leaf) {
          // Cast each element of the proof array to `0x${string}`
          proofs[recipient.address.toLowerCase()] = tree.getHexProof(leaf).map(p => p as `0x${string}`);
        }
      });
      
      const newMerkleData: MerkleProofData = {
        root,
        proofs,
        recipients,
        leafLookup
      };
      
      setMerkleData(newMerkleData);
      return newMerkleData;
      
    } catch (err) {
      console.error("Error generating Merkle tree:", err);
      const error = err instanceof Error ? err : new Error('Failed to generate Merkle tree');
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Get the Merkle proof for a specific address
   * @param address Address to get proof for
   * @returns Array of proof hashes or null if not found
   */
  const getProofForAddress = (address: `0x${string}`): `0x${string}`[] | null => {
    if (!merkleData || !merkleData.proofs) return null;
    
    const normalizedAddress = address.toLowerCase();
    return merkleData.proofs[normalizedAddress] || null;
  };
  
  /**
   * Validate that an address is included in the Merkle tree
   * @param address Address to validate
   * @returns True if the address is in the tree
   */
  const isAddressInTree = (address: `0x${string}`): boolean => {
    if (!merkleData) return false;
    return !!getProofForAddress(address);
  };
  
  /**
   * Get the amount allocated to a specific address
   * @param address Address to check
   * @returns Amount allocated or null if not found
   */
  const getAmountForAddress = (address: `0x${string}`): bigint | null => {
    if (!merkleData) return null;
    
    const normalizedAddress = address.toLowerCase();
    const recipient = merkleData.recipients.find(r => 
      r.address.toLowerCase() === normalizedAddress
    );
    
    return recipient ? recipient.amount : null;
  };
  
  /**
   * Parse a CSV file containing addresses and amounts
   * @param file CSV file to parse
   * @returns List of recipients parsed from the CSV
   */
  const parseRecipientsFromCSV = async (file: File): Promise<AirdropRecipient[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          if (!csv) {
            reject(new Error('Failed to read CSV file'));
            return;
          }
          
          const rows = csv.split('\n');
          const recipients: AirdropRecipient[] = [];
          
          // Process each row (skip header if it exists)
          // Assuming CSV format: address,amount
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i].trim();
            if (!row) continue; // Skip empty rows
            
            // Handle potential header row: simple check, can be made more robust
            if (i === 0 && row.toLowerCase().includes('address') && row.toLowerCase().includes('amount')) {
                console.log("Skipping header row:", row);
                continue;
            }

            const parts = row.split(',');
            if (parts.length < 2) {
                console.warn(`Skipping malformed row (not enough parts) at line ${i + 1}: ${row}`);
                continue;
            }
            const address = parts[0].trim();
            const amountStr = parts[1].trim();
            
            // Validate address format
            if (!address.startsWith('0x') || address.length !== 42) {
              console.warn(`Invalid address format at line ${i + 1}: ${address}`);
              continue;
            }
            
            // Parse amount
            let amount: bigint;
            try {
              // Handle potential quotes around amount if CSV exports them
              amount = BigInt(amountStr.replace(/"/g, ''));
            } catch (err) {
              console.warn(`Invalid amount format at line ${i + 1}: ${amountStr}`);
              continue;
            }
            
            recipients.push({
              address: address as `0x${string}`,
              amount
            });
          }
          
          if (recipients.length === 0 && rows.length > 0) {
            reject(new Error('CSV parsed but no valid recipient data found. Check format (address,amount) and ensure no extra headers.'));
            return;
          }
          if (recipients.length === 0 && rows.length === 0) {
            reject(new Error('CSV file is empty or contains no processable rows.'));
            return;
          }
          
          resolve(recipients);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to parse CSV file content'));
        }
      };
      
      reader.onerror = (err) => { // Added error object to onerror
        console.error("FileReader error:", err);
        reject(new Error('Error reading CSV file with FileReader'));
      };
      
      reader.readAsText(file);
    });
  };

  return {
    generateMerkleTree,
    isGenerating,
    error,
    merkleData,
    getProofForAddress,
    isAddressInTree,
    getAmountForAddress,
    parseRecipientsFromCSV
  };
} 