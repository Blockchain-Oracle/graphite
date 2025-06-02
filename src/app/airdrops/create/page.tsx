"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Info, Upload, Clock, Calendar, FileText, Users, Settings, Eye, Gift } from "lucide-react";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { AnimatedBeamsContainer } from "@/components/magicui/animated-beam";
import { CoolMode } from "@/components/magicui/cool-mode";
import { Particles } from "@/components/magicui/particles";
import { Confetti } from "@/components/magicui/confetti";
import { ShineBorderCard } from "@/components/magicui/shine-border";

type AirdropFormData = {
  tokenDetails: {
    tokenType: "ERC20" | "ERC721";
    tokenAddress: string;
    tokenName: string;
    tokenSymbol: string;
    tokenAmount: string;
    logoUrl: string;
  };
  distribution: {
    recipientAddresses: string[];
    hasMerkleTree: boolean;
    merkleRoot?: string;
  };
  eligibility: {
    requireKYC: boolean;
    requireTrustScore: boolean;
    minimumTrustScore?: number;
    allowedRegions?: string[];
  };
  timing: {
    startDate: string;
    endDate: string;
    claimDeadline?: string;
  };
};

const initialFormData: AirdropFormData = {
  tokenDetails: {
    tokenType: "ERC20",
    tokenAddress: "",
    tokenName: "",
    tokenSymbol: "",
    tokenAmount: "",
    logoUrl: "",
  },
  distribution: {
    recipientAddresses: [],
    hasMerkleTree: false,
  },
  eligibility: {
    requireKYC: false,
    requireTrustScore: false,
  },
  timing: {
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  },
};

const steps = [
  { id: "token-selection", title: "Token Selection", icon: Gift },
  { id: "distribution", title: "Distribution List", icon: Users },
  { id: "eligibility", title: "Eligibility", icon: Settings },
  { id: "timing", title: "Timing", icon: Calendar },
  { id: "review", title: "Review", icon: Eye },
];

export default function CreateAirdrop() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AirdropFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Handle form input changes
  const handleChange = (
    section: keyof AirdropFormData,
    field: string,
    value: any
  ) => {
    setFormData((prevData) => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value,
      },
    }));
  };

  // Handle file upload for token logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          handleChange("tokenDetails", "logoUrl", event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle recipient addresses textarea input
  const handleRecipientsInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const addresses = e.target.value.split("\n").filter(addr => addr.trim() !== "");
    handleChange("distribution", "recipientAddresses", addresses);
  };

  // Move to next step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Move to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit the form
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would be a blockchain call
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      // const signer = provider.getSigner();
      // const contract = new ethers.Contract(airdropFactoryAddress, airdropFactoryABI, signer);
      // const tx = await contract.createAirdrop(formDataParams);
      // await tx.wait();
      
      // For now, simulate success after a delay
      setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }, 2000);
    } catch (error) {
      console.error("Error creating airdrop:", error);
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Token Selection
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Token Type</label>
                <select
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.tokenDetails.tokenType}
                  onChange={(e) => handleChange("tokenDetails", "tokenType", e.target.value)}
                >
                  <option value="ERC20">ERC20 Token</option>
                  <option value="ERC721">ERC721 NFT</option>
                </select>
              </div>
              
              <div>
                <label className="mb-2 block text-sm text-gray-300">Token Contract Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.tokenDetails.tokenAddress}
                  onChange={(e) => handleChange("tokenDetails", "tokenAddress", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Token Name</label>
                <input
                  type="text"
                  placeholder="Graphite Token"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.tokenDetails.tokenName}
                  onChange={(e) => handleChange("tokenDetails", "tokenName", e.target.value)}
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm text-gray-300">Token Symbol</label>
                <input
                  type="text"
                  placeholder="GRT"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.tokenDetails.tokenSymbol}
                  onChange={(e) => handleChange("tokenDetails", "tokenSymbol", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Amount Per Wallet</label>
                <input
                  type="text"
                  placeholder="100"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.tokenDetails.tokenAmount}
                  onChange={(e) => handleChange("tokenDetails", "tokenAmount", e.target.value)}
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm text-gray-300">Token Logo</label>
                <div className="flex items-center">
                  <label className="flex w-full cursor-pointer items-center rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white">
                    <Upload className="mr-2 h-4 w-4" />
                    <span className="text-sm">
                      {formData.tokenDetails.logoUrl ? "Change Logo" : "Upload Logo"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Distribution List
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm text-gray-300">Recipient Addresses</label>
              <textarea
                placeholder="Enter wallet addresses, one per line"
                className="h-40 w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                value={formData.distribution.recipientAddresses.join("\n")}
                onChange={handleRecipientsInput}
              />
              <p className="mt-1 text-sm text-gray-400">
                {formData.distribution.recipientAddresses.length} addresses added
              </p>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="merkle-tree"
                  className="mr-2 h-4 w-4"
                  checked={formData.distribution.hasMerkleTree}
                  onChange={(e) => handleChange("distribution", "hasMerkleTree", e.target.checked)}
                />
                <label htmlFor="merkle-tree" className="text-sm text-gray-300">
                  Use Merkle Tree for gas-efficient claims
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Recommended for airdrops with many recipients to save gas costs.
              </p>
            </div>

            {formData.distribution.hasMerkleTree && (
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Merkle Root (Optional - will be generated for you)
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.distribution.merkleRoot || ""}
                  onChange={(e) => handleChange("distribution", "merkleRoot", e.target.value)}
                />
              </div>
            )}
          </div>
        );

      case 2: // Eligibility
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="require-kyc"
                  className="mr-2 h-4 w-4"
                  checked={formData.eligibility.requireKYC}
                  onChange={(e) => handleChange("eligibility", "requireKYC", e.target.checked)}
                />
                <label htmlFor="require-kyc" className="text-sm text-gray-300">
                  Require KYC Verification
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Only allow KYC verified users to claim this airdrop.
              </p>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="require-trust"
                  className="mr-2 h-4 w-4"
                  checked={formData.eligibility.requireTrustScore}
                  onChange={(e) => handleChange("eligibility", "requireTrustScore", e.target.checked)}
                />
                <label htmlFor="require-trust" className="text-sm text-gray-300">
                  Require Minimum Trust Score
                </label>
              </div>
            </div>

            {formData.eligibility.requireTrustScore && (
              <div>
                <label className="mb-2 block text-sm text-gray-300">Minimum Trust Score (0-1000)</label>
                <input
                  type="number"
                  placeholder="500"
                  min="0"
                  max="1000"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.eligibility.minimumTrustScore || ""}
                  onChange={(e) => handleChange("eligibility", "minimumTrustScore", parseInt(e.target.value))}
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm text-gray-300">Allowed Regions (Optional)</label>
              <input
                type="text"
                placeholder="US, EU, Asia (comma separated)"
                className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                value={formData.eligibility.allowedRegions?.join(", ") || ""}
                onChange={(e) => handleChange("eligibility", "allowedRegions", e.target.value.split(",").map(r => r.trim()))}
              />
              <p className="mt-1 text-xs text-gray-400">
                Leave empty to allow all regions.
              </p>
            </div>
          </div>
        );

      case 3: // Timing
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Start Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.timing.startDate}
                  onChange={(e) => handleChange("timing", "startDate", e.target.value)}
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm text-gray-300">End Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.timing.endDate}
                  onChange={(e) => handleChange("timing", "endDate", e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="claim-deadline"
                  className="mr-2 h-4 w-4"
                  checked={!!formData.timing.claimDeadline}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Set default claim deadline to 30 days after end date
                      const endDate = new Date(formData.timing.endDate);
                      endDate.setDate(endDate.getDate() + 30);
                      handleChange("timing", "claimDeadline", endDate.toISOString().split("T")[0]);
                    } else {
                      handleChange("timing", "claimDeadline", undefined);
                    }
                  }}
                />
                <label htmlFor="claim-deadline" className="text-sm text-gray-300">
                  Set Claim Deadline
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Allow claiming after the airdrop end date until this deadline.
              </p>
            </div>

            {formData.timing.claimDeadline && (
              <div>
                <label className="mb-2 block text-sm text-gray-300">Claim Deadline</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.timing.claimDeadline}
                  onChange={(e) => handleChange("timing", "claimDeadline", e.target.value)}
                />
              </div>
            )}
          </div>
        );

      case 4: // Review
        return (
          <div className="space-y-6">
            <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
              <h3 className="mb-2 flex items-center text-lg font-medium text-white">
                <Gift className="mr-2 h-5 w-5" />
                Token Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-gray-400">Token Type:</div>
                <div className="text-white">{formData.tokenDetails.tokenType}</div>
                <div className="text-gray-400">Token Address:</div>
                <div className="text-white">{formData.tokenDetails.tokenAddress || "Not specified"}</div>
                <div className="text-gray-400">Token Name:</div>
                <div className="text-white">{formData.tokenDetails.tokenName || "Not specified"}</div>
                <div className="text-gray-400">Token Symbol:</div>
                <div className="text-white">{formData.tokenDetails.tokenSymbol || "Not specified"}</div>
                <div className="text-gray-400">Amount Per Wallet:</div>
                <div className="text-white">{formData.tokenDetails.tokenAmount || "0"}</div>
              </div>
            </ShineBorderCard>

            <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
              <h3 className="mb-2 flex items-center text-lg font-medium text-white">
                <Users className="mr-2 h-5 w-5" />
                Distribution
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-gray-400">Recipients:</div>
                <div className="text-white">{formData.distribution.recipientAddresses.length} addresses</div>
                <div className="text-gray-400">Merkle Tree:</div>
                <div className="text-white">{formData.distribution.hasMerkleTree ? "Enabled" : "Disabled"}</div>
              </div>
            </ShineBorderCard>

            <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
              <h3 className="mb-2 flex items-center text-lg font-medium text-white">
                <Settings className="mr-2 h-5 w-5" />
                Eligibility Rules
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-gray-400">KYC Required:</div>
                <div className="text-white">{formData.eligibility.requireKYC ? "Yes" : "No"}</div>
                <div className="text-gray-400">Trust Score Required:</div>
                <div className="text-white">
                  {formData.eligibility.requireTrustScore ? `Yes (Min: ${formData.eligibility.minimumTrustScore})` : "No"}
                </div>
                <div className="text-gray-400">Allowed Regions:</div>
                <div className="text-white">
                  {formData.eligibility.allowedRegions?.length ? formData.eligibility.allowedRegions.join(", ") : "All regions"}
                </div>
              </div>
            </ShineBorderCard>

            <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
              <h3 className="mb-2 flex items-center text-lg font-medium text-white">
                <Calendar className="mr-2 h-5 w-5" />
                Timing
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-gray-400">Start Date:</div>
                <div className="text-white">{formData.timing.startDate}</div>
                <div className="text-gray-400">End Date:</div>
                <div className="text-white">{formData.timing.endDate}</div>
                <div className="text-gray-400">Claim Deadline:</div>
                <div className="text-white">{formData.timing.claimDeadline || "Same as end date"}</div>
              </div>
            </ShineBorderCard>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex items-start">
                <Info className="mr-3 h-5 w-5 text-amber-400" />
                <div>
                  <h4 className="font-medium text-amber-400">Important Notice</h4>
                  <p className="text-sm text-amber-300/70">
                    Creating an airdrop will require signing a transaction and paying gas fees. 
                    Please review all details carefully before proceeding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderPreviewPanel = () => {
    return (
      <div className="sticky top-8">
        <GlassmorphismCard className="overflow-hidden p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">Airdrop Preview</h3>
          
          <div className="flex flex-col items-center">
            {/* Token logo */}
            <div className="mb-3 h-16 w-16 overflow-hidden rounded-full bg-gray-800">
              {formData.tokenDetails.logoUrl ? (
                <Image
                  src={formData.tokenDetails.logoUrl}
                  alt="Token Logo"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Gift className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Token name & symbol */}
            <h4 className="mb-1 text-xl font-bold text-white">
              {formData.tokenDetails.tokenName || "Token Name"}
            </h4>
            <p className="mb-3 text-gray-400">
              {formData.tokenDetails.tokenSymbol || "SYMBOL"}
            </p>
            
            {/* Amount per wallet */}
            <div className="mb-6 w-full rounded-lg bg-gray-800/50 p-3 text-center">
              <p className="text-sm text-gray-400">Amount Per Wallet</p>
              <p className="text-xl font-bold text-white">
                {formData.tokenDetails.tokenAmount || "0"} {formData.tokenDetails.tokenSymbol || "SYMBOL"}
              </p>
            </div>
            
            {/* Key details */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Type:</span>
                <span className="text-sm text-white">{formData.tokenDetails.tokenType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Recipients:</span>
                <span className="text-sm text-white">{formData.distribution.recipientAddresses.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">KYC Required:</span>
                <span className="text-sm text-white">{formData.eligibility.requireKYC ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Duration:</span>
                <span className="text-sm text-white">
                  {new Date(formData.timing.startDate).toLocaleDateString()} - {new Date(formData.timing.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </GlassmorphismCard>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-black">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <Particles
          className="absolute inset-0"
          quantity={30}
          staticity={50}
          color="#ffffff"
        />
      </div>

      {/* Success confetti */}
      <Confetti trigger={showConfetti} duration={5000} />

      <div className="container mx-auto px-4 py-8">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AnimatedBeamsContainer
              beams={5}
              colorFrom="rgba(59, 130, 246, 0.6)"
              colorTo="rgba(236, 72, 153, 0.6)"
              className="h-32 w-32 rounded-full"
            >
              <div className="flex h-full w-full items-center justify-center">
                <CheckCircle className="h-16 w-16 text-green-400" />
              </div>
            </AnimatedBeamsContainer>
            
            <h1 className="mt-6 text-3xl font-bold text-white">Airdrop Created!</h1>
            <p className="mt-2 text-center text-lg text-gray-300">
              Your airdrop has been successfully created and is now live.
            </p>
            
            <div className="mt-8 flex space-x-4">
              <CoolMode colors={["#10b981", "#059669", "#047857"]}>
                <motion.a
                  href="/airdrops/manage"
                  className="rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 text-white shadow-lg hover:from-green-500 hover:to-green-600"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Manage Airdrops
                </motion.a>
              </CoolMode>
              
              <CoolMode colors={["#3b82f6", "#2563eb", "#1d4ed8"]}>
                <motion.a
                  href="/airdrops/explore"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-white shadow-lg hover:from-blue-500 hover:to-blue-600"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Explore Airdrops
                </motion.a>
              </CoolMode>
            </div>
          </div>
        ) : (
          <>
            <h1 className="mb-8 text-4xl font-bold text-white">Create Airdrop</h1>

            <div className="mb-8">
              <div className="flex flex-wrap justify-center">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="relative flex items-center"
                  >
                    {/* Step connector line */}
                    {index > 0 && (
                      <div className={`hidden h-[2px] w-12 md:block ${index <= currentStep ? 'bg-blue-500' : 'bg-gray-700'}`} />
                    )}
                    
                    {/* Step indicator */}
                    <div 
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        index < currentStep
                          ? 'bg-blue-500 text-white'
                          : index === currentStep
                          ? 'border-2 border-blue-500 bg-gray-900 text-blue-400'
                          : 'border border-gray-700 bg-gray-900 text-gray-400'
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    
                    {/* Step title */}
                    <span className={`ml-2 hidden text-sm md:block ${
                      index <= currentStep ? 'text-white' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <GlassmorphismCard className="p-6">
                  <h2 className="mb-6 text-xl font-semibold text-white">
                    {steps[currentStep].title}
                  </h2>
                  
                  {renderStepContent()}
                  
                  <div className="mt-8 flex justify-between">
                    <motion.button
                      className={`flex items-center rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white ${
                        currentStep === 0 ? 'opacity-50' : 'hover:border-gray-600'
                      }`}
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      whileHover={currentStep !== 0 ? { scale: 1.02 } : {}}
                      whileTap={currentStep !== 0 ? { scale: 0.98 } : {}}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </motion.button>
                    
                    {currentStep < steps.length - 1 ? (
                      <CoolMode colors={["#3b82f6", "#8b5cf6", "#ec4899"]}>
                        <motion.button
                          className="flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white shadow-lg"
                          onClick={nextStep}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </motion.button>
                      </CoolMode>
                    ) : (
                      <CoolMode colors={["#10b981", "#059669", "#047857"]}>
                        <motion.button
                          className="flex items-center rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-2 text-white shadow-lg"
                          onClick={handleSubmit}
                          disabled={isLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isLoading ? (
                            <>
                              <span className="mr-2 block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Creating...
                            </>
                          ) : (
                            <>
                              Create Airdrop
                              <CheckCircle className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </motion.button>
                      </CoolMode>
                    )}
                  </div>
                </GlassmorphismCard>
              </div>
              
              <div className="hidden lg:block">
                {renderPreviewPanel()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 