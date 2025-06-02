"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface KycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (trustScore: number) => void;
}

const kycSteps = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Basic identity verification",
    fields: ["Full Name", "Date of Birth"],
  },
  {
    id: "contact",
    title: "Contact Details",
    description: "Verify your contact information",
    fields: ["Email", "Phone Number"],
  },
  {
    id: "address",
    title: "Address Verification",
    description: "Confirm your residential address",
    fields: ["Country", "City", "Street Address"],
  },
  {
    id: "identity",
    title: "Identity Document",
    description: "Upload a government-issued ID",
    fields: ["ID Type", "ID Number", "Document Upload"],
  },
  {
    id: "complete",
    title: "Verification Complete",
    description: "Your information is being processed",
    fields: [],
  },
];

export function KycVerificationModal({
  isOpen,
  onClose,
  onVerificationComplete,
}: KycVerificationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (currentStep < kycSteps.length - 1) {
      setCurrentStep(currentStep + 1);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleComplete = () => {
    setIsSubmitting(true);
    
    // Simulate an API call for KYC verification
    setTimeout(() => {
      // Generate a random trust score between 200 and 800
      const trustScore = Math.floor(Math.random() * 600) + 200;
      onVerificationComplete(trustScore);
      setIsSubmitting(false);
      onClose();
    }, 2000);
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
            Complete the verification process to get your trust badge
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

          {/* Form fields */}
          {step.fields.length > 0 ? (
            <div className="space-y-4">
              {step.fields.map((field) => (
                <div key={field} className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">
                    {field}
                  </label>
                  {field === "Document Upload" ? (
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-800 p-6">
                      <div className="text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-500"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12"
                          />
                        </svg>
                        <div className="mt-2 flex text-sm text-gray-400">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-gray-900 font-medium text-indigo-400 focus-within:outline-none hover:text-indigo-300"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={() => handleInputChange(field, "document-uploaded")}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, PDF up to 10MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <input
                      type={field.includes("Date") ? "date" : "text"}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={`Enter your ${field.toLowerCase()}`}
                      value={formData[field] || ""}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Final confirmation step
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 rounded-full bg-blue-500/20 p-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
                  <path d="M9 16.2L4.8 12L3.4 13.4L9 19L21 7L19.6 5.6L9 16.2Z" fill="currentColor" />
                </svg>
              </div>
              <h4 className="mb-2 text-xl font-semibold text-white">
                Processing Verification
              </h4>
              <p className="text-gray-400">
                We're verifying your information. You'll receive your trust score shortly.
              </p>
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
            disabled={isFirstStep}
          >
            Back
          </button>
          
          <button
            onClick={handleNextStep}
            disabled={isSubmitting}
            className={cn(
              "rounded-lg bg-gradient-to-r px-4 py-2 text-sm font-medium text-white transition-all",
              isSubmitting 
                ? "from-gray-600 to-gray-700 opacity-70" 
                : "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            )}
          >
            {isSubmitting ? (
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
            ) : isLastStep ? (
              "Complete Verification"
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 