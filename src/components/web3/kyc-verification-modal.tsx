"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useKYC } from "@/lib/hooks/useKYC";
import { useTrustScore } from "@/lib/hooks/useTrustScore";
import { useAccount } from "wagmi";

interface KycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (trustScore: number) => void;
}

// Simplified KYC steps for blockchain integration
const kycSteps = [
  {
    id: "connect",
    title: "Connect Wallet",
    description: "Verify your blockchain identity",
    fields: [],
  },
  {
    id: "verification",
    title: "Request Verification",
    description: "Submit your wallet for KYC verification",
    fields: [],
  },
  {
    id: "complete",
    title: "Verification Complete",
    description: "Your verification request has been submitted",
    fields: [],
  },
];

export function KycVerificationModal({
  isOpen,
  onClose,
  onVerificationComplete,
}: KycVerificationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { address } = useAccount();
  const { kycLevel, requestKycVerification, isPending, isSuccess, refetch } = useKYC();
  const { trustScore, isLoading: isTrustScoreLoading } = useTrustScore(address);

  // Move to first step if wallet is connected, otherwise stay at connect wallet step
  useEffect(() => {
    if (address && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [address, currentStep]);

  // When verification is successful, move to completion step
  useEffect(() => {
    if (isSuccess) {
      setCurrentStep(2);
      setIsSubmitting(false);
      
      // Refetch KYC level after success
      refetch();
    }
  }, [isSuccess, refetch]);

  if (!isOpen) return null;

  const handleNextStep = async () => {
    if (currentStep < kycSteps.length - 1) {
      // If we're on the verification step, submit the verification request
      if (currentStep === 1) {
        setIsSubmitting(true);
        try {
          await requestKycVerification();
          // Note: state updates will happen in the useEffect when isSuccess changes
        } catch (error) {
          console.error("Error requesting KYC verification:", error);
          setIsSubmitting(false);
        }
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      // Complete the verification process
      handleComplete();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsSubmitting(true);
    
    // Use the actual trust score from the contract
    setTimeout(() => {
      onVerificationComplete(trustScore);
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  const step = kycSteps[currentStep];
  const isLastStep = currentStep === kycSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      
      <div className="relative z-10 w-full max-w-md rounded-xl bg-gray-900 p-6 shadow-2xl">
        <button
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">KYC Verification</h2>
          <p className="text-gray-400">
            Complete verification to increase your trust score
          </p>
        </div>

        {/* Progress bar */}
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

        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h3 className="mb-1 text-xl font-semibold text-white">{step.title}</h3>
          <p className="mb-6 text-sm text-gray-400">{step.description}</p>

          {/* KYC level indicator */}
          {kycLevel !== undefined && (
            <div className="mb-4 rounded-lg bg-gray-800 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Current KYC Level:</span>
                <span className="font-medium text-white">Level {kycLevel}</span>
              </div>
              
              {/* KYC Level bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-700">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
                  style={{ width: `${(kycLevel / 3) * 100}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Level 0</span>
                <span>Level 1</span>
                <span>Level 2</span>
                <span>Level 3</span>
              </div>
            </div>
          )}

          {/* Steps content */}
          {currentStep === 0 && (
            <div className="rounded-lg bg-gray-800 p-4 text-center">
              <div className="mb-4 text-gray-300">
                {!address ? (
                  <>
                    <p>Please connect your wallet to continue with KYC verification.</p>
                    <p className="mt-2 text-sm text-gray-500">This will verify your blockchain identity.</p>
                  </>
                ) : (
                  <>
                    <p>Wallet connected!</p>
                    <p className="mt-2 text-sm break-all">{address}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="rounded-lg bg-gray-800 p-4 text-center">
              <div className="mb-4 text-gray-300">
                <p>By proceeding, you will submit your wallet address for KYC verification.</p>
                <p className="mt-2 text-sm text-gray-500">Once verified, your trust score will be updated.</p>
              </div>
              
              <div className="mt-4 flex items-center justify-center">
                <svg className="mr-2 h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-yellow-500">This transaction requires blockchain confirmation.</span>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            // Final confirmation step
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 rounded-full bg-blue-500/20 p-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
                  <path d="M9 16.2L4.8 12L3.4 13.4L9 19L21 7L19.6 5.6L9 16.2Z" fill="currentColor" />
                </svg>
              </div>
              <h4 className="mb-2 text-xl font-semibold text-white">
                Verification Request Submitted
              </h4>
              <p className="text-gray-400 mb-4">
                Your KYC verification request has been submitted to the network.
              </p>
              <div className="rounded-lg bg-gray-800 p-4 w-full">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Current Trust Score:</span>
                  <span className="font-medium text-white">{trustScore}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
                    style={{ width: `${(trustScore / 1000) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevStep}
            className={cn(
              "rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors",
              isFirstStep ? "invisible" : "hover:bg-gray-800"
            )}
            disabled={isFirstStep || isPending || isSubmitting}
          >
            Back
          </button>
          
          <button
            onClick={handleNextStep}
            disabled={isPending || isSubmitting || (currentStep === 0 && !address)}
            className={cn(
              "rounded-lg bg-gradient-to-r px-4 py-2 text-sm font-medium text-white transition-all",
              isPending || isSubmitting || (currentStep === 0 && !address)
                ? "from-gray-600 to-gray-700 opacity-70" 
                : "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            )}
          >
            {isPending || isSubmitting ? (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Processing...</span>
              </div>
            ) : currentStep === 0 ? (
              !address ? "Connect Wallet" : "Continue"
            ) : isLastStep ? (
              "Complete Verification"
            ) : currentStep === 1 ? (
              "Submit Verification"
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 