"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from "motion/react";
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  FileText,
  Settings,
  Loader2,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { AnimatedBeamsContainer } from "@/components/magicui/animated-beam";
import { Particles } from "@/components/magicui/particles";
import { Confetti } from "@/components/magicui/confetti";
import { Button } from "@/components/ui/button";
import { useCreateVote } from '@/lib/hooks/useVoting';

type VoteFormData = {
  description: string;
  options: string[];
  timing: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    hasEndDate: boolean;
  };
  requirements: {
    requiredTrustScore: string;
    requiredKYCLevel: string;
    requiredToken: string;
    requiredTokenBalance: string;
    hasTokenRequirement: boolean;
  };
};

const initialFormData: VoteFormData = {
  description: '',
  options: ['', ''],
  timing: {
    startDate: new Date().toISOString().split('T')[0],
    startTime: '12:00',
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endTime: '12:00',
    hasEndDate: true,
  },
  requirements: {
    requiredTrustScore: '0',
    requiredKYCLevel: '0',
    requiredToken: '',
    requiredTokenBalance: '0',
    hasTokenRequirement: false,
  },
};

const steps = [
  { id: 'description', title: 'Description', icon: FileText },
  { id: 'timing', title: 'Timing', icon: Calendar },
  { id: 'requirements', title: 'Requirements', icon: Settings },
];

// Vote templates for quick selection
const voteTemplates = [
  {
    name: "Governance Proposal",
    description: "Should we implement the proposed governance changes to the protocol?",
    options: ["Yes, implement the changes", "No, keep the current system", "Abstain"],
    requirements: {
      requiredTrustScore: "500",
      requiredKYCLevel: "1",
    }
  },
  {
    name: "Feature Request",
    description: "Which new feature should we prioritize for the next release?",
    options: ["Enhanced security features", "Improved user interface", "New integration options", "Performance optimizations"],
    requirements: {
      requiredTrustScore: "200",
      requiredKYCLevel: "0",
    }
  },
  {
    name: "Community Fund Allocation",
    description: "How should we allocate the community fund this quarter?",
    options: ["Developer grants", "Marketing initiatives", "User rewards", "Ecosystem partnerships"],
    requirements: {
      requiredTrustScore: "700",
      requiredKYCLevel: "2",
    }
  }
];

export default function CreateVotePage() {
  const router = useRouter();
  const { address: userAddress } = useAccount();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<VoteFormData>(initialFormData);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const {
    createVote,
    isCreating,
    isConfirming,
    isVoteCreated,
    error: createError,
    txHash,
    createdVoteAddress
  } = useCreateVote();
  
  // Handle successful vote creation
  useEffect(() => {
    if (isVoteCreated && createdVoteAddress) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [isVoteCreated, createdVoteAddress]);
  
  // Redirect to the new vote page when created
  useEffect(() => {
    if (createdVoteAddress) {
      setTimeout(() => {
        router.push(`/votes/${createdVoteAddress}`);
      }, 3000);
    }
  }, [createdVoteAddress, router]);
  
  // Handle form input changes
  const handleChange = (section: keyof VoteFormData, field: string, value: any) => {
    setFormData((prevData) => {
      const sectionData = prevData[section] as Record<string, any>;
      return {
        ...prevData,
        [section]: {
          ...sectionData,
          [field]: value,
        },
      };
    });
  };
  
  // Handle option changes
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData((prevData) => ({
      ...prevData,
      options: newOptions,
    }));
  };
  
  // Add new option
  const addOption = () => {
    setFormData((prevData) => ({
      ...prevData,
      options: [...prevData.options, ''],
    }));
  };
  
  // Remove option
  const removeOption = (index: number) => {
    if (formData.options.length <= 2) return; // Minimum 2 options
    
    const newOptions = [...formData.options];
    newOptions.splice(index, 1);
    setFormData((prevData) => ({
      ...prevData,
      options: newOptions,
    }));
  };
  
  // Navigate between steps
  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Convert form data to blockchain format
  const prepareVoteData = () => {
    // Convert dates and times to Unix timestamps
    const startDateTime = new Date(`${formData.timing.startDate}T${formData.timing.startTime}`);
    const startTimestamp = Math.floor(startDateTime.getTime() / 1000);
    
    let endTimestamp = 0; // 0 means no end date
    if (formData.timing.hasEndDate) {
      const endDateTime = new Date(`${formData.timing.endDate}T${formData.timing.endTime}`);
      endTimestamp = Math.floor(endDateTime.getTime() / 1000);
    }
    
    // Prepare token address (zero address if no token requirement)
    const tokenAddress = formData.requirements.hasTokenRequirement && isAddress(formData.requirements.requiredToken)
      ? formData.requirements.requiredToken as `0x${string}`
      : '0x0000000000000000000000000000000000000000';
    
    // Prepare token balance
    const tokenBalance = formData.requirements.hasTokenRequirement
      ? BigInt(formData.requirements.requiredTokenBalance || '0')
      : BigInt(0);
    
    return {
      description: formData.description,
      options: formData.options.filter(opt => opt.trim() !== ''),
      startTime: BigInt(startTimestamp),
      endTime: BigInt(endTimestamp),
      requiredTokenAddress: tokenAddress,
      requiredTokenBalance: tokenBalance,
      requiredTrustScore: BigInt(formData.requirements.requiredTrustScore || '0'),
      requiredKYCLevel: BigInt(formData.requirements.requiredKYCLevel || '0'),
    };
  };
  
  // Submit the vote creation
  const handleSubmit = () => {
    if (!userAddress) {
      alert('Please connect your wallet to create a vote.');
      return;
    }
    
    const voteData = prepareVoteData();
    
    createVote([
      voteData.description,
      voteData.options,
      voteData.startTime,
      voteData.endTime,
      voteData.requiredTokenAddress,
      voteData.requiredTokenBalance,
      voteData.requiredTrustScore,
      voteData.requiredKYCLevel,
    ]);
  };
  
  // Validate current step
  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Description
        return (
          formData.description.trim().length > 0 &&
          formData.options.filter(opt => opt.trim() !== '').length >= 2
        );
      case 1: // Timing
        if (!formData.timing.startDate || !formData.timing.startTime) return false;
        if (formData.timing.hasEndDate && (!formData.timing.endDate || !formData.timing.endTime)) return false;
        
        const startDateTime = new Date(`${formData.timing.startDate}T${formData.timing.startTime}`);
        
        if (formData.timing.hasEndDate) {
          const endDateTime = new Date(`${formData.timing.endDate}T${formData.timing.endTime}`);
          return endDateTime > startDateTime;
        }
        
        return true;
      case 2: // Requirements
        if (formData.requirements.hasTokenRequirement) {
          return (
            isAddress(formData.requirements.requiredToken) &&
            Number(formData.requirements.requiredTokenBalance) >= 0
          );
        }
        return true;
      default:
        return true;
    }
  };
  
  // Apply template to form data
  const applyTemplate = (template: typeof voteTemplates[number]) => {
    setFormData({
      ...formData,
      description: template.description,
      options: [...template.options],
      requirements: {
        ...formData.requirements,
        requiredTrustScore: template.requirements.requiredTrustScore,
        requiredKYCLevel: template.requirements.requiredKYCLevel,
      }
    });
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Description
        return (
          <div className="space-y-6">
            {/* Template selection */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-gray-300">Quick Templates</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {voteTemplates.map((template, index) => (
                  <motion.div
                    key={`template-${index}`}
                    className="cursor-pointer rounded-lg border border-gray-700 bg-gray-800/50 p-3 transition-all hover:border-blue-500/50 hover:bg-blue-500/10"
                    onClick={() => applyTemplate(template)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h4 className="mb-1 font-medium text-white">{template.name}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2">{template.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {template.options.map((option, idx) => (
                        <span 
                          key={idx} 
                          className="inline-block rounded-full bg-gray-700 px-2 py-1 text-xs text-gray-300"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-sm text-gray-300">Vote Description</label>
              <textarea
                className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                rows={4}
                placeholder="Describe what this vote is about..."
                value={formData.description}
                onChange={(e) => handleChange('description', '', e.target.value)}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-gray-300">Vote Options</label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addOption}
                  className="flex items-center text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Option
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="text"
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                    />
                    {formData.options.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeOption(index)}
                        className="ml-2 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {formData.options.length < 2 && (
                <p className="mt-2 text-xs text-amber-400">At least 2 options are required.</p>
              )}
            </div>
          </div>
        );
        
      case 1: // Timing
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
                <label className="mb-2 block text-sm text-gray-300">Start Time</label>
                <input
                  type="time"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.timing.startTime}
                  onChange={(e) => handleChange("timing", "startTime", e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="has-end-date"
                  className="mr-2 h-4 w-4"
                  checked={formData.timing.hasEndDate}
                  onChange={(e) => handleChange("timing", "hasEndDate", e.target.checked)}
                />
                <label htmlFor="has-end-date" className="text-sm text-gray-300">
                  Set an end date for voting
                </label>
              </div>
              
              {formData.timing.hasEndDate && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-300">End Date</label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                      value={formData.timing.endDate}
                      min={formData.timing.startDate}
                      onChange={(e) => handleChange("timing", "endDate", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm text-gray-300">End Time</label>
                    <input
                      type="time"
                      className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                      value={formData.timing.endTime}
                      onChange={(e) => handleChange("timing", "endTime", e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              {!formData.timing.hasEndDate && (
                <p className="text-xs text-gray-500">
                  Without an end date, the vote will remain open indefinitely until manually closed.
                </p>
              )}
            </div>
          </div>
        );
        
      case 2: // Requirements
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Required Trust Score (0-1000)</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  min="0"
                  max="1000"
                  placeholder="0"
                  value={formData.requirements.requiredTrustScore}
                  onChange={(e) => handleChange("requirements", "requiredTrustScore", e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum trust score required to participate in the vote.
                </p>
              </div>
              
              <div>
                <label className="mb-2 block text-sm text-gray-300">Required KYC Level (0-3)</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  min="0"
                  max="3"
                  placeholder="0"
                  value={formData.requirements.requiredKYCLevel}
                  onChange={(e) => handleChange("requirements", "requiredKYCLevel", e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum KYC level required to participate in the vote.
                </p>
              </div>
            </div>
            
            <div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="has-token-requirement"
                  className="mr-2 h-4 w-4"
                  checked={formData.requirements.hasTokenRequirement}
                  onChange={(e) => handleChange("requirements", "hasTokenRequirement", e.target.checked)}
                />
                <label htmlFor="has-token-requirement" className="text-sm text-gray-300">
                  Require token holdings to participate
                </label>
              </div>
              
              {formData.requirements.hasTokenRequirement && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-300">Token Contract Address</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                      placeholder="0x..."
                      value={formData.requirements.requiredToken}
                      onChange={(e) => handleChange("requirements", "requiredToken", e.target.value)}
                    />
                    {formData.requirements.requiredToken && !isAddress(formData.requirements.requiredToken) && (
                      <p className="mt-1 text-xs text-red-400">
                        Invalid Ethereum address format.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm text-gray-300">Minimum Token Balance</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                      placeholder="1"
                      value={formData.requirements.requiredTokenBalance}
                      onChange={(e) => handleChange("requirements", "requiredTokenBalance", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex items-start">
                <Info className="mr-3 h-5 w-5 text-amber-400" />
                <div>
                  <h4 className="font-medium text-amber-400">Important Notice</h4>
                  <p className="text-sm text-amber-300/70">
                    Creating a vote will require signing a transaction and paying gas fees.
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
  
  if (isVoteCreated && createdVoteAddress) {
    return (
      <div className="relative min-h-screen w-full bg-black">
        <div className="fixed inset-0 -z-10 opacity-30">
          <Particles
            className="absolute inset-0"
            quantity={30}
            staticity={50}
            color="#ffffff"
          />
        </div>
        
        <Confetti trigger={showConfetti} duration={5000} />
        
        <div className="container mx-auto flex flex-col items-center justify-center px-4 py-16">
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
          
          <h1 className="mt-6 text-3xl font-bold text-white">Vote Created!</h1>
          <p className="mt-2 text-center text-lg text-gray-300">
            Your vote has been successfully created. Transaction: 
            <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline ml-1">{txHash?.substring(0,10)}...</a>
          </p>
          
          <p className="mt-4 text-center text-gray-400">
            Redirecting to your vote page...
          </p>
          
          <div className="mt-8 flex space-x-4">
            <Button
              className="rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 text-white shadow-lg hover:from-green-500 hover:to-green-600"
              onClick={() => router.push(`/votes/${createdVoteAddress}`)}
            >
              View Vote
            </Button>
            
            <Button
              variant="outline"
              className="rounded-lg border border-gray-700 bg-transparent px-6 py-3 text-white shadow-lg hover:bg-gray-800"
              onClick={() => router.push('/votes')}
            >
              Back to Votes
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative min-h-screen w-full bg-black">
      <div className="fixed inset-0 -z-10 opacity-30">
        <Particles
          className="absolute inset-0"
          quantity={30}
          staticity={50}
          color="#ffffff"
        />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/votes" passHref>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Votes
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-white">Create Vote</h1>
          <p className="mt-2 text-gray-400">
            Create a new vote for the community to participate in
          </p>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-center">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="relative flex items-center"
              >
                {index > 0 && (
                  <div className={`hidden h-[2px] w-12 md:block ${index <= currentStep ? 'bg-blue-500' : 'bg-gray-700'}`} />
                )}
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
                <span className={`ml-2 hidden text-sm md:block ${
                  index <= currentStep ? 'text-white' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          <GlassmorphismCard className="p-6">
            <h2 className="mb-6 text-xl font-semibold text-white">
              {steps[currentStep].title}
            </h2>
            
            {renderStepContent()}
            
            <div className="mt-8 flex justify-between">
              <motion.button
                className={`flex items-center rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white ${
                  currentStep === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-600'
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
                <motion.button
                  className={`flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white shadow-lg ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  whileHover={isStepValid() ? { scale: 1.02 } : {}}
                  whileTap={isStepValid() ? { scale: 0.98 } : {}}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </motion.button>
              ) : (
                <motion.button
                  className={`flex items-center rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-2 text-white shadow-lg ${!isStepValid() || isCreating || isConfirming ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleSubmit}
                  disabled={!isStepValid() || isCreating || isConfirming}
                  whileHover={isStepValid() && !isCreating && !isConfirming ? { scale: 1.02 } : {}}
                  whileTap={isStepValid() && !isCreating && !isConfirming ? { scale: 0.98 } : {}}
                >
                  {isCreating || isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isCreating ? "Creating Vote..." : "Confirming Vote..."}
                    </>
                  ) : (
                    <>
                      Create Vote
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </motion.button>
              )}
            </div>
            
            {createError && (
              <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                <div className="flex items-start">
                  <AlertCircle className="mr-3 h-5 w-5 text-red-400" />
                  <div>
                    <h4 className="font-medium text-red-400">Error creating vote</h4>
                    <p className="text-sm text-red-300/70">
                      {createError.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </GlassmorphismCard>
        </div>
      </div>
    </div>
  );
} 