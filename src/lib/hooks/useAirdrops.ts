import { useState, useEffect } from 'react';
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
      // Get airdrop address and metadata from factory
      const airdropAddress = await publicClient.readContract({
        ...getContractConfig('airdropFactory'),
        functionName: 'airdrops',
        args: [BigInt(index)],
      }) as `0x${string}`;

      if (!airdropAddress) return null;

      // Get airdrop details from the SybilResistantAirdrop contract
      const [token, name, symbol, totalTokens, startTime, endTime, claimedCount] = await Promise.all([
        publicClient.readContract({
          address: airdropAddress,
          abi: getContractConfig('sybilResistantAirdrop').abi,
          functionName: 'token',
        }),
        publicClient.readContract({
          address: airdropAddress,
          abi: getContractConfig('sybilResistantAirdrop').abi,
          functionName: 'name',
        }),
        publicClient.readContract({
          address: airdropAddress,
          abi: getContractConfig('sybilResistantAirdrop').abi,
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: airdropAddress,
          abi: getContractConfig('sybilResistantAirdrop').abi,
          functionName: 'totalTokens',
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
        publicClient.readContract({
          address: airdropAddress,
          abi: getContractConfig('sybilResistantAirdrop').abi,
          functionName: 'claimedCount',
        }),
      ]);

      // Get airdrop creator info from factory
      const creatorInfo = await publicClient.readContract({
        ...getContractConfig('airdropFactory'),
        functionName: 'getAirdropCreator',
        args: [airdropAddress],
      });

      // Determine airdrop status
      const now = Math.floor(Date.now() / 1000);
      let status: 'upcoming' | 'active' | 'expired' | 'completed' = 'active';
      
      if (Number(startTime) > now) {
        status = 'upcoming';
      } else if (Number(endTime) < now) {
        status = 'expired';
      } else if (Number(claimedCount) >= Number(totalTokens)) {
        status = 'completed';
      }

      // Create AirdropData object
      return {
        id: airdropAddress,
        name: name as string || `Airdrop ${index + 1}`,
        symbol: symbol as string || 'TOKEN',
        amount: 100, // Default amount per user - actual amount would come from contract
        logoUrl: '/trust-badges/tier-3.svg', // Default logo - actual logo would come from token metadata
        creatorName: 'Graphite User', // Default creator name
        creatorAddress: creatorInfo as string,
        startDate: new Date(Number(startTime) * 1000).toISOString(),
        endDate: new Date(Number(endTime) * 1000).toISOString(),
        claimers: Number(claimedCount),
        totalTokens: Number(totalTokens),
        description: `${name} airdrop by Graphite`,
        type: 'ERC20', // Default type - actual type would be determined by token contract
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
  const [isEligible, setIsEligible] = useState<boolean>(false);
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);
  const [claimAmount, setClaimAmount] = useState<bigint>(BigInt(0));
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

        // Check if user is in merkle tree (eligible)
        const eligibility = await publicClient.readContract({
          address: airdropAddress,
          abi: getContractConfig('sybilResistantAirdrop').abi,
          functionName: 'isEligible',
          args: [address],
        });

        // Check if user has already claimed
        const claimed = await publicClient.readContract({
          address: airdropAddress,
          abi: getContractConfig('sybilResistantAirdrop').abi,
          functionName: 'hasClaimed',
          args: [address],
        });

        // Get claim amount if eligible
        let amount = BigInt(0);
        if (eligibility && !claimed) {
          amount = await publicClient.readContract({
            address: airdropAddress,
            abi: getContractConfig('sybilResistantAirdrop').abi,
            functionName: 'getClaimAmount',
            args: [address],
          }) as bigint;
        }

        setIsEligible(!!eligibility);
        setHasClaimed(!!claimed);
        setClaimAmount(amount);
      } catch (error) {
        console.error("Error checking airdrop eligibility:", error);
        setError(error instanceof Error ? error : new Error('Failed to check airdrop eligibility'));
      } finally {
        setIsLoading(false);
      }
    };

    checkEligibility();
  }, [address, airdropAddress, config]);

  // Function to claim the airdrop
  const claimAirdrop = async (proof: `0x${string}`[]) => {
    if (!airdropAddress || !address) {
      throw new Error('Airdrop address or user address not provided');
    }

    try {
      return await writeContractAsync({
        address: airdropAddress,
        abi: getContractConfig('sybilResistantAirdrop').abi,
        functionName: 'claim',
        args: [proof],
      });
    } catch (error) {
      console.error("Error claiming airdrop:", error);
      throw error;
    }
  };

  return {
    isEligible,
    hasClaimed,
    claimAmount,
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
  const { writeContractAsync, isPending, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: transactionError } = useWaitForTransactionReceipt({
    hash,
  });

  // Create airdrop function
  const createAirdrop = async (
    name: string,
    symbol: string,
    tokenAddress: `0x${string}`,
    merkleRoot: `0x${string}`,
    totalAmount: bigint,
    startTime: bigint,
    endTime: bigint
  ) => {
    try {
      return await writeContractAsync({
        ...getContractConfig('airdropFactory'),
        functionName: 'createAirdrop',
        args: [
          name,
          symbol,
          tokenAddress,
          merkleRoot,
          totalAmount,
          startTime,
          endTime
        ],
      });
    } catch (error) {
      console.error("Error creating airdrop:", error);
      throw error;
    }
  };

  return {
    createAirdrop,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error: writeError || transactionError,
  };
}

/**
 * Hook to get user's airdrops
 */
export function useUserAirdrops() {
  const { address } = useAccount();
  const { airdrops, isLoading, error } = useAirdrops();
  
  // Airdrops created by the user
  const createdAirdrops = airdrops.filter(
    airdrop => airdrop.creatorAddress.toLowerCase() === (address?.toLowerCase() || '')
  );

  // Check eligibility for all airdrops (this would need to be optimized in a real app)
  const [eligibilityMap, setEligibilityMap] = useState<Record<string, { isEligible: boolean, hasClaimed: boolean }>>({});
  const config = useConfig();
  
  useEffect(() => {
    const checkEligibilityForAllAirdrops = async () => {
      if (!address || airdrops.length === 0) return;
      
      const publicClient = getPublicClient(config);
      if (!publicClient) return;
      
      const eligibilityResults: Record<string, { isEligible: boolean, hasClaimed: boolean }> = {};
      
      for (const airdrop of airdrops) {
        try {
          const airdropAddress = airdrop.id as `0x${string}`;
          
          // Check if user is eligible
          const isEligible = await publicClient.readContract({
            address: airdropAddress,
            abi: getContractConfig('sybilResistantAirdrop').abi,
            functionName: 'isEligible',
            args: [address],
          });
          
          // Check if user has claimed
          const hasClaimed = await publicClient.readContract({
            address: airdropAddress,
            abi: getContractConfig('sybilResistantAirdrop').abi,
            functionName: 'hasClaimed',
            args: [address],
          });
          
          eligibilityResults[airdrop.id] = {
            isEligible: !!isEligible,
            hasClaimed: !!hasClaimed
          };
        } catch (error) {
          console.error(`Error checking eligibility for airdrop ${airdrop.id}:`, error);
          eligibilityResults[airdrop.id] = {
            isEligible: false,
            hasClaimed: false
          };
        }
      }
      
      setEligibilityMap(eligibilityResults);
    };
    
    checkEligibilityForAllAirdrops();
  }, [address, airdrops, config]);

  // Combine airdrops with eligibility info
  const enhancedAirdrops = airdrops.map(airdrop => ({
    ...airdrop,
    isEligible: eligibilityMap[airdrop.id]?.isEligible || false,
    hasClaimed: eligibilityMap[airdrop.id]?.hasClaimed || false
  }));

  // Filter eligible airdrops
  const eligibleAirdrops = enhancedAirdrops.filter(
    airdrop => airdrop.isEligible && !airdrop.hasClaimed && airdrop.status === 'active'
  );

  // Filter claimed airdrops
  const claimedAirdrops = enhancedAirdrops.filter(
    airdrop => airdrop.hasClaimed
  );

  return {
    allAirdrops: enhancedAirdrops,
    createdAirdrops,
    eligibleAirdrops,
    claimedAirdrops,
    isLoading,
    error
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
      // Note: In a production environment, you'd use a proper Merkle tree library like merkletreejs
      // For this hook, we're implementing a simplified version to demonstrate the concept
      
      // Step 1: Hash and sort all leaf nodes
      const leaves = recipients.map(recipient => {
        // Hash address and amount together
        return keccak256(
          encodeAbiParameters(
            [{ type: 'address' }, { type: 'uint256' }],
            [recipient.address, recipient.amount]
          )
        );
      });
      
      // Simple implementation for demonstration purposes
      // In a real app, use a library like merkletreejs to properly implement this
      
      // Simulate merkle root - In a real implementation, you would build the tree and get the root
      const pseudoRoot = keccak256(toHex(leaves.join(''))) as `0x${string}`;
      
      // Generate pseudo-proofs for each recipient
      // In a real implementation, you would generate actual Merkle proofs
      const proofs: Record<string, `0x${string}`[]> = {};
      recipients.forEach(recipient => {
        // Create a deterministic proof based on address
        // This is just for simulation - use a proper Merkle tree library in production
        const addressHash = keccak256(recipient.address);
        proofs[recipient.address.toLowerCase()] = [addressHash as `0x${string}`];
      });
      
      const merkleData: MerkleProofData = {
        root: pseudoRoot,
        proofs,
        recipients
      };
      
      setMerkleData(merkleData);
      return merkleData;
      
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
    if (!merkleData) return null;
    
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
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i].trim();
            if (!row) continue;
            
            const [address, amountStr] = row.split(',').map(part => part.trim());
            
            // Validate address format
            if (!address || !address.startsWith('0x') || address.length !== 42) {
              console.warn(`Invalid address format at line ${i + 1}: ${address}`);
              continue;
            }
            
            // Parse amount
            let amount: bigint;
            try {
              amount = BigInt(amountStr);
            } catch (err) {
              console.warn(`Invalid amount format at line ${i + 1}: ${amountStr}`);
              continue;
            }
            
            recipients.push({
              address: address as `0x${string}`,
              amount
            });
          }
          
          resolve(recipients);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to parse CSV file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading CSV file'));
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