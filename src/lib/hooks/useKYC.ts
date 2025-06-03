import { useAccount, useConfig, usePublicClient } from 'wagmi';
import { 
  useWriteContract, 
  useWaitForTransactionReceipt,
} from 'wagmi';
import { getContractConfig, CONTRACT_ADDRESSES, ABIS } from '../web3/contract-config';
import { stringToBytes, parseEther, toHex } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Helper function to compute SHA256 and format as bytes32 hex string
async function sha256ToBytes32(message: string): Promise<`0x${string}`> {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);
  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  // convert ArrayBuffer to hex string, ensuring it's 32 bytes (64 hex chars)
  // SHA256 output is already 32 bytes.
  return toHex(new Uint8Array(hashBuffer));
}

/**
 * Hook to interact with the KYC and Activation system
 */
export function useKYC() {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const config = useConfig();
  
  const [processingUuid, setProcessingUuid] = useState<string | null>(null);
  const [kycApiError, setKycApiError] = useState<string | null>(null);
  
  // Contract configurations
  const feeContractConfig = {
    address: CONTRACT_ADDRESSES.fee as `0x${string}`,
    abi: ABIS.fee, // This is IGraphiteFee.abi
  };

  const kycContractConfig = {
    address: CONTRACT_ADDRESSES.kyc as `0x${string}`,
    abi: ABIS.kyc,
  };

  const reputationContractConfig = {
    address: CONTRACT_ADDRESSES.reputation as `0x${string}`,
    abi: ABIS.reputation,
  };

  // Query for paid fee status (formerly activation status)
  const paidFeeStatusQuery = useQuery({
    queryKey: ['paid-fee-status', address, chain?.id],
    queryFn: async () => {
      if (!address || !publicClient) return null;
      try {
        const result = await publicClient.readContract({
          ...feeContractConfig, // Use the correct fee contract config
          functionName: 'paidFee', // Correct function name from IGraphiteFee
          args: [address],
        });
        return !!result;
      } catch (error) {
        console.error('Error checking paid fee status:', error);
        throw error;
      }
    },
    enabled: !!address && !!publicClient,
  });
  
  // Query for initial fee (formerly activation fee)
  const initialFeeQuery = useQuery({
    queryKey: ['initial-fee', chain?.id],
    queryFn: async () => {
      if (!publicClient) return null;
      try {
        const result = await publicClient.readContract({
          ...feeContractConfig, // Use the correct fee contract config
          functionName: 'initialFee', // Correct function name from IGraphiteFee
          // No args for initialFee()
        });
        return result as bigint;
      } catch (error) {
        console.error('Error fetching initial fee:', error);
        throw error;
      }
    },
    enabled: !!publicClient,
    staleTime: 3600000, // 1 hour - fees don't change often
    gcTime: 3600000 * 24, // 24 hours
  });

  // Query for KYC level
  const kycLevelQuery = useQuery({
    queryKey: ['kyc-level', address, chain?.id],
    queryFn: async () => {
      if (!address || !publicClient) return null;
      try {
        const result = await publicClient.readContract({
          ...kycContractConfig,
          functionName: 'level',
          args: [address],
        });
        return result as bigint;
      } catch (error) {
        console.error('Error checking KYC level:', error);
        throw error;
      }
    },
    enabled: !!address && !!publicClient,
  });

  const reputationQuery = useQuery({
    queryKey: ['reputation-score', address, chain?.id],
    queryFn: async () => {
      if (!address || !publicClient || !reputationContractConfig.address) return null;
      try {
        const rawScore = await publicClient.readContract({
          ...reputationContractConfig,
          functionName: 'getReputation',
          args: [address],
        }) as bigint;
        return Number(rawScore);//TODO: scale it to 0-1000
      } catch (error) {
        console.error('Error fetching reputation score:', error);
        return 0; // Default to 0 on error
      }
    },
    enabled: !!address && !!publicClient && !!reputationContractConfig.address,
  });

  // Activate Account (Pay Fee)
  const { writeContractAsync: activateAccountWrite, data: activateHash, isPending: isActivating } = useWriteContract();
  const { isLoading: isConfirmingActivation, isSuccess: isActivationSuccess } = useWaitForTransactionReceipt({
    hash: activateHash,
  });

  const activateAccount = async () => {
    if (!initialFeeQuery.data) throw new Error('Initial fee not loaded');
    return await activateAccountWrite({
      ...feeContractConfig, // This was already correct, using fee contract for 'pay'
      functionName: 'pay',
      value: initialFeeQuery.data as bigint,
    });
  };

  // Request KYC Verification
  const { writeContractAsync: requestKycWrite, data: kycRequestHash, isPending: isRequestingKyc, error: kycWriteError } = useWriteContract();
  const { isLoading: isConfirmingKycRequest, isSuccess: isKycRequestSuccess } = useWaitForTransactionReceipt({
    hash: kycRequestHash,
  });

  const requestKycVerification = async (level: number = 1) => {
    setKycApiError(null); // Clear previous API errors
    const newUuid = uuidv4();
    console.log('Generated KYC UUID:', newUuid);
    setProcessingUuid(newUuid);

    try {
      const kycDataHash = await sha256ToBytes32(newUuid);
      console.log('KYC Data Hash (sha256(uuid)):', kycDataHash);
      
      return await requestKycWrite({
        ...kycContractConfig,
        functionName: 'createKYCRequest',
        args: [BigInt(level), kycDataHash], 
        value: parseEther('0.1'), 
        type: 'legacy',
        gasPrice: BigInt(300000000000), // 300 Gwei, from Hardhat config
        gas: BigInt(3000000) 
      });
    } catch (error) {
      console.error('Error during KYC request preparation or write:', error);
      setProcessingUuid(null); // Clear UUID if submission fails early
      throw error; // Re-throw to be caught by the caller
    }
  };

  // Effect to call the KYC processing API after successful on-chain transaction
  useEffect(() => {
    const processKycRequestApi = async (uuid: string) => {
      console.log('Attempting to call KYC processing API with UUID:', uuid);
      setKycApiError(null);
      try {
        const response = await fetch('https://test.kyc.atgraphite.com/api/kyc/process-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: uuid }),
        });
        
        const responseBody = await response.text(); // Read body for more info
        console.log('KYC API Response Status:', response.status);
        console.log('KYC API Response Body:', responseBody);

        if (!response.ok) {
          const errorMsg = `KYC API call failed: ${response.status} ${response.statusText}. Body: ${responseBody}`;
          console.error(errorMsg);
          setKycApiError(errorMsg);
        } else {
          console.log('KYC API call successful. Triggering refetch for KYC level and reputation.');
          kycLevelQuery.refetch();
          reputationQuery.refetch(); // Refetch reputation after KYC process
        }
      } catch (error: any) {
        const errorMsg = `Error calling KYC API: ${error.message || error}`;
        console.error(errorMsg);
        setKycApiError(errorMsg);
      } finally {
        setProcessingUuid(null); // Clear UUID after processing attempt
      }
    };

    // Only run if the KYC request transaction was successful, we have a UUID, and a matching hash
    if (isKycRequestSuccess && processingUuid && kycRequestHash) {
      // Ensure this effect only runs once for this specific successful transaction
      // by comparing the kycRequestHash with the one that triggered this success.
      // (Implicitly handled by kycRequestHash being a dependency of useWaitForTransactionReceipt)
      processKycRequestApi(processingUuid);
    }
  }, [isKycRequestSuccess, processingUuid, kycRequestHash, kycLevelQuery, reputationQuery]); // Added reputationQuery

  // Invalidate queries when transactions succeed
  if (isActivationSuccess) {
    paidFeeStatusQuery.refetch(); // Refetch paid status after successful payment
    reputationQuery.refetch(); // Also refetch reputation after account activation
  }
  
  // Consolidate loading states
  const isProcessing = isActivating || isConfirmingActivation || isRequestingKyc || isConfirmingKycRequest;
  const isReading = paidFeeStatusQuery.isLoading || initialFeeQuery.isLoading || kycLevelQuery.isLoading || reputationQuery.isLoading;
  const isKycVerified = kycLevelQuery.data != null && kycLevelQuery.data > BigInt(0);

  return {
    address,
    // Activation related (using IGraphiteFee)
    hasPaidFee: paidFeeStatusQuery.data,
    isPaidFeeStatusLoading: paidFeeStatusQuery.isLoading,
    refetchPaidFeeStatus: paidFeeStatusQuery.refetch,
    initialActivationFee: initialFeeQuery.data,
    isInitialFeeLoading: initialFeeQuery.isLoading,
    refetchInitialFee: initialFeeQuery.refetch,
    activateAccount,
    isActivating: isActivating || isConfirmingActivation,
    isActivationSuccess, // This specifically refers to the 'pay' transaction success
    activateHash,
    // KYC
    kycLevel: kycLevelQuery.data,
    isKycLevelLoading: kycLevelQuery.isLoading,
    refetchKycLevel: kycLevelQuery.refetch,
    isKycVerified,
    reputationScore: reputationQuery.data, // This is the scaled score (0-1000)
    isReputationLoading: reputationQuery.isLoading,
    refetchReputationScore: reputationQuery.refetch,
    requestKycVerification,
    isRequestingKyc: isRequestingKyc || isConfirmingKycRequest,
    isKycRequestSuccess,
    kycRequestHash,
    kycWriteError, // Expose kyc write error
    kycApiError, // Expose kyc api error
    // Overall states
    isProcessing,
    isReading,
    // Error states
    paidFeeStatusError: paidFeeStatusQuery.error,
    initialFeeError: initialFeeQuery.error,
    kycLevelError: kycLevelQuery.error,
    reputationError: reputationQuery.error,
  };
}