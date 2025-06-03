"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useKYC } from "@/lib/hooks/useKYC";
import { useTrustScore } from "@/lib/hooks/useTrustScore";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { CustomConnectButton } from "./connect-wallet-button";
import { formatEther } from "viem";

interface KycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (trustScore: number) => void;
}

const kycSteps = [
  {
    id: "connect",
    title: "Connect Wallet",
    description: "Please connect your wallet to begin the verification process.",
  },
  {
    id: "activate",
    title: "Activate Account",
    description: "Activate your account on the Graphite network. This requires a one-time fee.",
  },
  {
    id: "request_kyc",
    title: "Request KYC Verification",
    description: "Submit your wallet for KYC Level 1 verification.",
  },
  {
    id: "complete",
    title: "Verification Submitted",
    description: "Your KYC verification request has been submitted.",
  },
];

export function KycVerificationModal({
  isOpen,
  onClose,
  onVerificationComplete,
}: KycVerificationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [checkedInitial, setCheckedInitial] = useState(false);
  const { address, isConnected } = useAccount();
  const {
    hasPaidFee,
    initialActivationFee,
    activateAccount,
    isActivating,
    isActivationSuccess,
    refetchPaidFeeStatus,
    kycLevel,
    requestKycVerification,
    isRequestingKyc,
    isKycRequestSuccess,
    refetchKycLevel,
    isReading: isKycHookReading,
    isProcessing: isKycHookProcessing,
    paidFeeStatusError,
    initialFeeError,
    kycLevelError,
  } = useKYC();
  const { trustScore, isLoading: isTrustScoreLoading } = useTrustScore(address);

  const proceedToNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, kycSteps.length - 1));
  }, []);

  // Only handle wallet connection status changes
  useEffect(() => {
    if (isConnected && currentStep === 0) {
      proceedToNextStep();
    } else if (!isConnected && currentStep > 0) {
      setCurrentStep(0);
    }
  }, [isConnected, currentStep, proceedToNextStep]);

  // Initial data fetch when modal opens
  useEffect(() => {
    if (isOpen && isConnected && !checkedInitial) {
      refetchPaidFeeStatus();
      refetchKycLevel();
      setCheckedInitial(true);
    } else if (!isOpen) {
      setCheckedInitial(false);
    }
  }, [isOpen, isConnected, checkedInitial, refetchPaidFeeStatus, refetchKycLevel]);

  // Check activation status when on step 1
  useEffect(() => {
    if (currentStep === 1 && hasPaidFee === true) {
      proceedToNextStep();
    }
  }, [hasPaidFee, currentStep, proceedToNextStep]);
  
  // Handle activation success
  useEffect(() => {
    if (isActivationSuccess) {
      refetchPaidFeeStatus();
    }
  }, [isActivationSuccess, refetchPaidFeeStatus]);

  // Check KYC level when on step 2
  useEffect(() => {
    if (currentStep === 2 && kycLevel !== undefined && kycLevel !== null && kycLevel >= BigInt(1)) {
      proceedToNextStep();
    }
  }, [currentStep, kycLevel, proceedToNextStep]);

  // Handle KYC request success
  useEffect(() => {
    if (isKycRequestSuccess) {
      refetchKycLevel();
      proceedToNextStep();
    }
  }, [isKycRequestSuccess, refetchKycLevel, proceedToNextStep]);

  // More specific error handling based on current step
  useEffect(() => {
    let message = null;
    if (currentStep === 1) {
      if (paidFeeStatusError && typeof paidFeeStatusError.message === 'string') {
        message = `Error checking activation status: ${paidFeeStatusError.message}`;
      } else if (initialFeeError && typeof initialFeeError.message === 'string') {
        message = `Error fetching activation fee: ${initialFeeError.message}`;
      }
    } else if (currentStep === 2) {
      if (kycLevelError && typeof kycLevelError.message === 'string') {
        message = `Error checking KYC level: ${kycLevelError.message}`;
      }
    }
    if (message) {
      setError(message);
    }
  }, [currentStep, paidFeeStatusError, initialFeeError, kycLevelError]);

  if (!isOpen) return null;

  const handleActivate = async () => {
    setError(null);
    if (!activateAccount) return;
    try {
      await activateAccount();
    } catch (e: any) {
      console.error("Error activating account:", e);
      setError(e.message || "Failed to activate account.");
    }
  };

  const handleRequestKyc = async () => {
    setError(null);
    if (!requestKycVerification) return;
    try {
      await requestKycVerification(1);
    } catch (e: any) {
      console.error("Error requesting KYC:", e);
      setError(e.message || "Failed to request KYC.");
    }
  };

  const handleCompleteFlow = () => {
    onVerificationComplete(trustScore || 0);
    onClose();
  };

  const step = kycSteps[currentStep];
  const isLastStep = currentStep === kycSteps.length - 1;

  const isLoading = isKycHookReading || isTrustScoreLoading;
  const isProcessing = isKycHookProcessing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={!isProcessing ? onClose : undefined}></div>
      
      <div className="relative z-10 w-full max-w-md rounded-xl bg-gray-900 p-6 shadow-2xl">
        {!isProcessing && (
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          </button>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">KYC & Activation</h2>
          <p className="text-gray-400">
            Complete the steps to activate your account and verify your identity.
          </p>
        </div>

        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-blue-400">Step {currentStep + 1} of {kycSteps.length}</span>
            <span className="text-gray-400">{Math.round(((currentStep + 1) / kycSteps.length) * 100)}% Complete</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
              style={{ width: `${((currentStep + 1) / kycSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-500/20 p-3 text-sm text-red-400">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-8 min-h-[150px]"
        >
          <h3 className="mb-1 text-xl font-semibold text-white">{step.title}</h3>
          <p className="mb-6 text-sm text-gray-400">{step.description}</p>

          {currentStep === 0 && (
            <div className="flex flex-col items-center justify-center">
              <CustomConnectButton />
              <p className="mt-4 text-xs text-gray-500">Your wallet connection status will be updated here.</p>
            </div>
          )}

          {currentStep === 1 && (
            <div className="rounded-lg bg-gray-800 p-4 text-center">
              {isLoading && <p className="text-gray-300">Checking activation status...</p>}
              {!isLoading && initialActivationFee !== undefined && initialActivationFee !== null && (
                <p className="text-gray-300 mb-2">
                  Activation Fee: {formatEther(initialActivationFee as bigint)} ETH
                </p>
              )}
              {!isLoading && (initialActivationFee === undefined || initialActivationFee === null) && (
                 <p className="text-gray-300 mb-2">Loading activation fee...</p>
              )}
              <Button 
                onClick={handleActivate} 
                disabled={isProcessing || isLoading || hasPaidFee === true || initialActivationFee === undefined || initialActivationFee === null}
                className="w-full"
              >
                {isProcessing ? "Processing..." : "Activate Account"}
              </Button>
            </div>
          )}

          {currentStep === 2 && (
             <div className="rounded-lg bg-gray-800 p-4 text-center">
              {isLoading && <p className="text-gray-300">Checking KYC status...</p>}
              {!isLoading && kycLevel !== undefined && kycLevel !== null && (
                <p className="text-gray-300 mb-2">
                  Current KYC Level: {Number(kycLevel)}
                </p>
              )}
               <Button 
                onClick={handleRequestKyc} 
                disabled={isProcessing || isLoading || (kycLevel !== undefined && kycLevel !== null && kycLevel >= BigInt(1))}
                className="w-full"
              >
                {isProcessing ? "Processing..." : "Request KYC Level 1"}
              </Button>
             </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
               <div className="mb-4 rounded-full bg-blue-500/20 p-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
                  <path d="M9 16.2L4.8 12L3.4 13.4L9 19L21 7L19.6 5.6L9 16.2Z" fill="currentColor" />
                </svg>
              </div>
              <h4 className="mb-2 text-xl font-semibold text-white">Request Submitted</h4>
              <p className="text-gray-400 mb-4">
                Your KYC verification request has been successfully submitted to the network.
                 Your Trust Score will be updated once the verification is processed.
              </p>
            </div>
          )}
        </motion.div>

        <div className="flex justify-end">
          {isLastStep ? (
            <Button 
              onClick={handleCompleteFlow} 
              disabled={isProcessing}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isProcessing ? "Processing..." : "Finish"}
            </Button>
          ) : (
            <Button 
              onClick={proceedToNextStep} 
              disabled={isProcessing || isLoading || 
                         (currentStep === 0 && !isConnected) || 
                         (currentStep === 1 && (hasPaidFee === false || initialActivationFee === undefined || initialActivationFee === null)) ||
                         (currentStep === 2 && (kycLevel === undefined || kycLevel === null || kycLevel < BigInt(1)))
                       }
              className={cn(
                "rounded-lg bg-gradient-to-r px-4 py-2 text-sm font-medium text-white transition-all",
                (isProcessing || isLoading || 
                  (currentStep === 0 && !isConnected) || 
                  (currentStep === 1 && (hasPaidFee === false || initialActivationFee === undefined || initialActivationFee === null)) ||
                  (currentStep === 2 && (kycLevel === undefined || kycLevel === null || kycLevel < BigInt(1)))
                ) 
                  ? "from-gray-600 to-gray-700 opacity-70" 
                  : "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                (currentStep > 0 && currentStep < kycSteps.length -1) && "invisible" 
              )}
            >
              {isProcessing ? "Processing..." : "Next"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 