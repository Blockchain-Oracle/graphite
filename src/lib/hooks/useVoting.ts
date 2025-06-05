import { useState, useEffect } from 'react';
import { 
  useContractRead, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useAccount,
  usePublicClient
} from 'wagmi';
import { getContractConfig } from '@/lib/web3/contract-config';
import { formatUnits } from 'viem';
import { type Log } from 'viem';

// Types for vote data
export type VoteOption = {
  index: number;
  text: string;
  voteCount: bigint;
};

export type VoteData = {
  address: `0x${string}`;
  description: string;
  options: VoteOption[];
  startTime: bigint;
  endTime: bigint;
  requiredTrustScore: bigint;
  requiredKYCLevel: bigint;
  requiredToken: `0x${string}` | null;
  requiredTokenBalance: bigint;
  totalVotes: bigint;
  proposalCreator: `0x${string}`;
  hasUserVoted?: boolean;
  userEligibility?: EligibilityDetails;
};

export type EligibilityStatus = 
  | 'Eligible'
  | 'NotActivated'
  | 'InsufficientKYC'
  | 'LowTrustScore'
  | 'InsufficientTokenBalance'
  | 'GenericIneligible';

export type EligibilityDetails = {
  isActiveOnGraphite: boolean;
  userKycLevel: bigint;
  userTrustScore: bigint;
  userTokenBalance: bigint;
  meetsAllRequirements: boolean;
  statusReason: EligibilityStatus;
};

// Hook to fetch all votes from the factory
export function useVotes() {
  const [votes, setVotes] = useState<`0x${string}`[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const voteFactoryConfig = getContractConfig('voteFactory');
  
  // Get count of votes
  const { data: voteCount } = useContractRead({
    address: voteFactoryConfig.address,
    abi: voteFactoryConfig.abi,
    functionName: 'getVoteContractsCount',
  });
  
  // Fetch all vote contract addresses
  useEffect(() => {
    const fetchVotes = async () => {
      if (!voteCount) return;
      
      try {
        setIsLoading(true);
        const voteAddresses: `0x${string}`[] = [];
        
        for (let i = 0; i < Number(voteCount); i++) {
          const voteAddress = await fetch(`/api/votes/contract?index=${i}`).then(res => res.json());
          if (voteAddress && voteAddress.address) {
            voteAddresses.push(voteAddress.address as `0x${string}`);
          }
        }
        
        setVotes(voteAddresses);
        setError(null);
      } catch (err) {
        console.error("Error fetching votes:", err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching votes'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVotes();
  }, [voteCount]);
  
  return { votes, isLoading, error, voteCount: voteCount ? Number(voteCount) : 0 };
}

// Hook to fetch details about a specific vote
export function useVoteDetails(voteAddress?: `0x${string}`) {
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { address: userAddress } = useAccount();
  
  const voteAbi = getContractConfig('vote').abi;
  
  // Fetch vote details
  useEffect(() => {
    const fetchVoteDetails = async () => {
      if (!voteAddress) return;
      
      try {
        setIsLoading(true);
        
        // Fetch vote details from API
        const response = await fetch(`/api/votes/details?address=${voteAddress}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch vote details: ${response.statusText}`);
        }
        
        const data = await response.json();
        setVoteData(data);
        
      } catch (err) {
        console.error("Error fetching vote details:", err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching vote details'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVoteDetails();
  }, [voteAddress, userAddress]);
  
  // Listen for vote events
  useWatchContractEvent({
    address: voteAddress,
    abi: voteAbi,
    eventName: 'Voted',
    onLogs(logs) {
      // Refresh vote data when a new vote is cast
      if (voteAddress) {
        fetch(`/api/votes/details?address=${voteAddress}`)
          .then(res => res.json())
          .then(data => setVoteData(data))
          .catch(err => console.error("Error refreshing vote data:", err));
      }
    },
  });
  
  return { voteData, isLoading, error };
}

// Hook to check user's eligibility to vote
export function useVoteEligibility(voteAddress?: `0x${string}`) {
  const [eligibility, setEligibility] = useState<EligibilityDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { address: userAddress } = useAccount();
  const voteAbi = getContractConfig('vote').abi;
  
  // Get eligibility details
  const { data, isError, isLoading: isReadLoading } = useContractRead({
    address: voteAddress,
    abi: voteAbi,
    functionName: 'getEligibilityDetails',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!voteAddress && !!userAddress,
    }
  });
  
  // Process eligibility data
  useEffect(() => {
    if (isReadLoading) {
      setIsLoading(true);
      return;
    }
    
    if (isError) {
      setError(new Error('Failed to check eligibility'));
      setIsLoading(false);
      return;
    }
    
    if (data) {
      // Map numeric status to string status
      const statusMap: Record<number, EligibilityStatus> = {
        0: 'Eligible',
        1: 'NotActivated',
        2: 'InsufficientKYC',
        3: 'LowTrustScore',
        4: 'InsufficientTokenBalance',
        5: 'GenericIneligible'
      };
      
      const typedData = data as any;
      const statusReason = statusMap[Number(typedData.statusReason)] || 'GenericIneligible';
      
      setEligibility({
        isActiveOnGraphite: typedData.isActiveOnGraphite,
        userKycLevel: typedData.userKycLevel,
        userTrustScore: typedData.userTrustScore,
        userTokenBalance: typedData.userTokenBalance,
        meetsAllRequirements: typedData.meetsAllRequirements,
        statusReason
      });
      
      setIsLoading(false);
    }
  }, [data, isError, isReadLoading]);
  
  return { eligibility, isLoading, error };
}

// Hook to cast a vote
export function useVoteCast(voteAddress?: `0x${string}`) {
  const voteAbi = getContractConfig('vote').abi;
  
  // Cast vote transaction
  const { 
    data: voteData,
    isPending: isVoting,
    error: voteError,
    writeContract: castVote
  } = useWriteContract();
  
  // Wait for transaction
  const { 
    isLoading: isConfirming,
    isSuccess: isVoteConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash: voteData,
  });
  
  const vote = (optionIndex: number) => {
    if (!voteAddress) return;
    
    castVote({
      address: voteAddress,
      abi: voteAbi,
      functionName: 'vote',
      args: [BigInt(optionIndex)]
    });
  };
  
  return {
    vote,
    isVoting,
    isConfirming,
    isVoteConfirmed,
    error: voteError || confirmError,
    txHash: voteData
  };
}

// Hook to create a new vote
export function useCreateVote() {
  const voteFactoryConfig = getContractConfig('voteFactory');
  
  // Create vote transaction
  const {
    data: createData,
    isPending: isCreating,
    error: createError,
    writeContract
  } = useWriteContract();
  
  // Wait for transaction
  const {
    isLoading: isConfirming,
    isSuccess: isVoteCreated,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash: createData,
  });
  
  // Get the created vote address from the transaction receipt
  const publicClient = usePublicClient();
  const [createdVoteAddress, setCreatedVoteAddress] = useState<`0x${string}` | null>(null);
  
  useEffect(() => {
    const getVoteAddress = async () => {
      if (isVoteCreated && createData && publicClient) {
        try {
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: createData,
          });
          
          // Find the VoteCreated event
          const voteCreatedTopic = '0x9c6f8368fe7e77e8cb9438744581403bcb3f53298e517f04c1b8475487402e97'; // keccak256("VoteCreated(address,address,string,uint256,uint256)")
          const voteCreatedLog = receipt.logs.find(log => 
            log.topics[0]?.toLowerCase() === voteCreatedTopic.toLowerCase()
          );
          
          if (voteCreatedLog) {
            // The vote contract address is the second indexed parameter
            const voteAddress = `0x${voteCreatedLog.topics[2]?.slice(26)}` as `0x${string}`;
            setCreatedVoteAddress(voteAddress);
          }
        } catch (err) {
          console.error("Error getting vote address from receipt:", err);
        }
      }
    };
    
    getVoteAddress();
  }, [isVoteCreated, createData, publicClient]);
  
  const createVote = (args: any[]) => {
    writeContract({
      address: voteFactoryConfig.address,
      abi: voteFactoryConfig.abi,
      functionName: 'createVote',
      args
    });
  };
  
  return {
    createVote,
    isCreating,
    isConfirming,
    isVoteCreated,
    error: createError || confirmError,
    txHash: createData,
    createdVoteAddress
  };
} 