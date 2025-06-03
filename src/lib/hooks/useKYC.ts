import { useAccount } from 'wagmi';
import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt 
} from 'wagmi';
import { getContractConfig, CONTRACT_ADDRESSES } from '../web3/contract-config';

/**
 * Hook to interact with the KYC verification system
 */
export function useKYC() {
  const { address } = useAccount();
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Get user's KYC level (0-3)
  const { data: kycLevel, isLoading: isKycLevelLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.kyc as `0x${string}`,
    abi: [
      {
        type: 'function',
        name: 'getKYCLevel',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view'
      }
    ],
    functionName: 'getKYCLevel',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Request KYC verification
  const requestKycVerification = async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      return await writeContractAsync({
        address: CONTRACT_ADDRESSES.kyc as `0x${string}`,
        abi: [
          {
            type: 'function',
            name: 'requestVerification',
            inputs: [],
            outputs: [],
            stateMutability: 'nonpayable'
          }
        ],
        functionName: 'requestVerification',
      });
    } catch (error) {
      console.error("Error requesting KYC verification:", error);
      throw error;
    }
  };

  // Calculate reputation points from KYC level (0-3 points)
  const getKycReputationPoints = (level: number) => {
    return level; // Direct mapping: KYC level 0-3 → Reputation points 0-3
  };

  return {
    kycLevel: kycLevel !== undefined ? Number(kycLevel) : 0,
    isKycLevelLoading,
    requestKycVerification,
    isPending,
    isConfirming,
    isSuccess,
    getKycReputationPoints,
    refetch,
  };
} 