import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AirdropData } from './airdrop-card';
import { AirdropDetailView } from './airdrop-detail-view';
import { Confetti } from "@/components/magicui/confetti";
import { Particles } from "@/components/magicui/particles";
import { Info, Activity, Award, CheckCircle, AlertTriangle } from "lucide-react";
import { useAirdropClaim } from '@/lib/hooks/useAirdrops';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ShineBorderCard } from "@/components/magicui/shine-border";
import { Button } from "@/components/ui/button";

interface AirdropModalProps {
  airdrop: AirdropData | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimSuccess?: (airdrop: AirdropData) => Promise<boolean>;
}

export function AirdropModal({ airdrop, isOpen, onClose, onClaimSuccess }: AirdropModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  if (!airdrop) return null;
  
  const handleClaimSuccess = async (claimedAirdrop: AirdropData): Promise<boolean> => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    if (onClaimSuccess) {
      return await onClaimSuccess(claimedAirdrop);
    }
    return true;
  };

  return (
    <>
      {showConfetti && <Confetti trigger={showConfetti} duration={3000} />}
      
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl bg-gray-900/95 border border-gray-800 p-0 overflow-hidden">
          <div className="relative">
            {/* Background particles */}
            <div className="absolute inset-0 -z-10">
              <Particles
                className="absolute inset-0"
                quantity={20}
                staticity={50}
                color="#ffffff"
              />
            </div>
            
            {/* Header with token info */}
            <DialogHeader className="p-6 border-b border-gray-800">
              <div className="flex items-center">
                <Avatar className="mr-4 h-14 w-14">
                  <AvatarImage src={`https://effigy.im/a/${airdrop.tokenContractAddress}.svg`} alt={`${airdrop.name} logo`} />
                  <AvatarFallback className="bg-neutral-700 text-neutral-300">{airdrop.symbol ? airdrop.symbol.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">{airdrop.name}</DialogTitle>
                  <div className="flex items-center text-gray-400">
                    <span>{airdrop.symbol}</span>
                    <span className="mx-2">•</span>
                    <span>{airdrop.type}</span>
                  </div>
                </div>
              </div>
            </DialogHeader>
            
            {/* Tabs */}
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-800">
                <TabsList className="h-14 w-full bg-transparent">
                  <TabsTrigger 
                    value="details" 
                    className="data-[state=active]:bg-gray-800/50 data-[state=active]:text-white text-gray-400 hover:text-gray-300 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 transition-all duration-200 flex items-center"
                  >
                    <Info className="mr-2 h-4 w-4" /> Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="claim" 
                    className="data-[state=active]:bg-gray-800/50 data-[state=active]:text-white text-gray-400 hover:text-gray-300 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 transition-all duration-200 flex items-center"
                  >
                    <Award className="mr-2 h-4 w-4" /> Claim
                  </TabsTrigger>
                  <TabsTrigger 
                    value="eligibility" 
                    className="data-[state=active]:bg-gray-800/50 data-[state=active]:text-white text-gray-400 hover:text-gray-300 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 transition-all duration-200 flex items-center"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Eligibility
                  </TabsTrigger>
                  <TabsTrigger 
                    value="activity" 
                    className="data-[state=active]:bg-gray-800/50 data-[state=active]:text-white text-gray-400 hover:text-gray-300 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 transition-all duration-200 flex items-center"
                  >
                    <Activity className="mr-2 h-4 w-4" /> Activity
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6">
                {/* Details Tab */}
                <TabsContent value="details" className="mt-0">
                  <DetailTabContent airdrop={airdrop} />
                </TabsContent>
                
                {/* Claim Tab */}
                <TabsContent value="claim" className="mt-0">
                  <ClaimTabContent 
                    airdrop={airdrop} 
                    onClaimSuccess={handleClaimSuccess} 
                  />
                </TabsContent>
                
                {/* Eligibility Tab */}
                <TabsContent value="eligibility" className="mt-0">
                  <EligibilityTabContent airdrop={airdrop} />
                </TabsContent>
                
                {/* Activity Tab */}
                <TabsContent value="activity" className="mt-0">
                  <ActivityTabContent airdrop={airdrop} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailTabContent({ airdrop }: { airdrop: AirdropData }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* About */}
      <div>
        <h3 className="mb-2 text-lg font-semibold text-white">About</h3>
        <p className="text-gray-300">{airdrop.description || `${airdrop.name} token airdrop created by ${airdrop.creatorName}.`}</p>
      </div>

      {/* Token Information */}
      <div>
        <h3 className="mb-2 text-lg font-semibold text-white">Token Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400">Amount Per Wallet</h4>
            <p className="text-xl font-bold text-white">{airdrop.amount} {airdrop.symbol}</p>
          </ShineBorderCard>
          
          <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400">Total Supply</h4>
            <p className="text-xl font-bold text-white">{airdrop.totalTokens}</p>
          </ShineBorderCard>
          
          <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400">Contract Address</h4>
            <p className="text-sm text-blue-400 truncate hover:underline">
              <a 
                href={`https://test.atgraphite.com/address/${airdrop.tokenContractAddress}`}
                target="_blank" 
                rel="noopener noreferrer"
              >
                {airdrop.tokenContractAddress}
              </a>
            </p>
          </ShineBorderCard>
          
          <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400">Token Type</h4>
            <p className="text-lg font-semibold text-white">{airdrop.type}</p>
          </ShineBorderCard>
        </div>
      </div>
      
      {/* Timeline */}
      <div>
        <h3 className="mb-2 text-lg font-semibold text-white">Timeline</h3>
        <div className="space-y-2">
          <div className="flex justify-between rounded-lg border border-gray-700 bg-gray-800/50 p-3">
            <span className="text-gray-400">Start Date</span>
            <span className="font-medium text-white">{formatDate(airdrop.startDate)}</span>
          </div>
          <div className="flex justify-between rounded-lg border border-gray-700 bg-gray-800/50 p-3">
            <span className="text-gray-400">End Date</span>
            <span className="font-medium text-white">{formatDate(airdrop.endDate)}</span>
          </div>
        </div>
      </div>
      
      {/* Creator Info */}
      <div>
        <h3 className="mb-2 text-lg font-semibold text-white">Creator</h3>
        <div className="flex items-center rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <Avatar className="mr-2 h-10 w-10">
            <AvatarFallback className="bg-neutral-700 text-neutral-300">
              {airdrop.creatorName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-white">{airdrop.creatorName}</p>
            <a 
              href={`https://test.atgraphite.com/address/${airdrop.creatorAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:underline"
            >
              {airdrop.creatorAddress}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClaimTabContent({ airdrop, onClaimSuccess }: { airdrop: AirdropData, onClaimSuccess?: (airdrop: AirdropData) => Promise<boolean> }) {
  const [manualProof, setManualProof] = useState<string>("");
  const [showProofInput, setShowProofInput] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  
  const { 
    isActivated,
    trustScore,
    kycLevel,
    isBlacklisted,
    hasClaimedAirdrop,
    isEligible,
    isLoading,
    error,
    claimAirdrop,
    isClaimPending,
    isConfirming,
    isSuccess,
    hasMerkleProof
  } = useAirdropClaim(airdrop.id as `0x${string}`);

  // Parse manually entered proof
  const parseManualProof = (): `0x${string}`[] => {
    try {
      // Try parsing as JSON array first
      const proofText = manualProof.trim();
      if (proofText.startsWith('[') && proofText.endsWith(']')) {
        const proofArray = JSON.parse(proofText) as string[];
        return proofArray.map(p => p as `0x${string}`);
      }
      
      // Otherwise, split by commas, newlines, or spaces
      return proofText
        .split(/[\s,]+/)
        .filter(p => p.startsWith('0x') && p.length === 66)
        .map(p => p as `0x${string}`);
    } catch (err) {
      console.error("Failed to parse manual proof:", err);
      return [];
    }
  };

  const handleClaim = async () => {
    if (!isEligible || hasClaimedAirdrop) return;
    
    try {
      // Check if we need to use manually entered proof
      if (!hasMerkleProof && airdrop.type === "ERC20") {
        if (!showProofInput) {
          setShowProofInput(true);
          return;
        }
        
        // Use manually entered proof if available
        const parsedProof = parseManualProof();
        if (parsedProof.length === 0) {
          setProofError("Invalid Merkle proof format. Please enter valid hex strings starting with 0x.");
          return;
        }
        
        await claimAirdrop(parsedProof);
      } else {
        // Use proof from localStorage
        await claimAirdrop();
      }
      
      if (onClaimSuccess) await onClaimSuccess(airdrop);
      setShowProofInput(false);
    } catch (err) {
      console.error("Failed to claim:", err);
      setProofError("Failed to claim with the provided proof. Please verify it's correct.");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading eligibility data...</div>;
  }

  if (hasClaimedAirdrop) {
    return (
      <div className="text-center p-8 space-y-4">
        <div className="inline-flex items-center justify-center p-2 rounded-full bg-green-500/20 text-green-400">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold text-white">Airdrop Successfully Claimed!</h3>
        <p className="text-gray-400">You have already claimed {airdrop.amount} {airdrop.symbol} tokens from this airdrop.</p>
      </div>
    );
  }

  if (!isEligible) {
    return (
      <div className="text-center p-8 space-y-4">
        <div className="inline-flex items-center justify-center p-2 rounded-full bg-amber-500/20 text-amber-400">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold text-white">Not Eligible</h3>
        <p className="text-gray-400">You are not eligible to claim this airdrop. This could be due to:</p>
        
        <div className="space-y-2 max-w-md mx-auto text-left">
          {!isActivated && (
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Your account is not activated on Graphite</span>
            </div>
          )}
          
          {isBlacklisted && (
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Your address is blacklisted from this airdrop</span>
            </div>
          )}
          
          {!isBlacklisted && isActivated && (
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>You don't meet the eligibility criteria</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-white">You are eligible to claim:</h3>
        <p className="text-3xl font-bold text-white">{airdrop.amount} {airdrop.symbol}</p>
      </div>
      
      {!hasMerkleProof && airdrop.type === "ERC20" && !showProofInput && (
        <Alert variant="warning" className="bg-amber-500/10 border-amber-500/20 text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Merkle Proof Required</AlertTitle>
          <AlertDescription>
            You need a Merkle proof to claim this airdrop. Click 'Claim' to enter your proof manually or contact the airdrop creator to obtain it.
          </AlertDescription>
        </Alert>
      )}
      
      {!hasMerkleProof && airdrop.type === "ERC20" && showProofInput && (
        <div className="space-y-4">
          <Alert variant="warning" className="bg-amber-500/10 border-amber-500/20 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Enter Your Merkle Proof</AlertTitle>
            <AlertDescription>
              Paste your proof as a JSON array or as individual hashes separated by commas, spaces, or newlines.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <textarea 
              className="w-full h-32 px-3 py-2 text-white bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. [0x1234...5678, 0xabcd...efgh] or paste each hash on a separate line"
              value={manualProof}
              onChange={(e) => setManualProof(e.target.value)}
            />
          </div>
          
          {proofError && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/30 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{proofError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      <div className="pt-4">
        <Button 
          onClick={handleClaim} 
          disabled={isClaimPending || isConfirming || (!hasMerkleProof && airdrop.type === "ERC20" && showProofInput && manualProof.trim() === "")}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-6 text-lg font-medium"
        >
          {isClaimPending ? "Claiming..." : 
           isConfirming ? "Confirming..." : 
           (!hasMerkleProof && airdrop.type === "ERC20" && !showProofInput) ? "Input Merkle Proof" :
           "Claim Airdrop"}
        </Button>
      </div>
    </div>
  );
}

function EligibilityTabContent({ airdrop }: { airdrop: AirdropData }) {
  const { 
    isActivated,
    trustScore,
    kycLevel,
    isBlacklisted,
    hasClaimedAirdrop,
    isEligible,
    isLoading,
    error,
  } = useAirdropClaim(airdrop.id as `0x${string}`);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading eligibility data...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Eligibility Requirements</h3>
      
      <div className="space-y-4">
        <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Trust Score</span>
            <span className="text-sm font-medium text-white">Your score: {trustScore}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">0</span>
              <span className="text-xs text-gray-500">1000</span>
            </div>
            <Progress value={(trustScore / 1000) * 100} className="h-2" />
          </div>
        </ShineBorderCard>

        <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">KYC Level</span>
            <span className="text-sm font-medium text-white">Your level: {kycLevel}</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div 
                key={level}
                className={`h-2 rounded ${
                  kycLevel >= level ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </ShineBorderCard>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        <h4 className="mb-3 font-medium text-white">Current Status</h4>
        <div className="space-y-2">
          <div className="flex items-center">
            <span className={`mr-2 h-2 w-2 rounded-full ${isActivated ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-300">Account Activated: {isActivated ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center">
            <span className={`mr-2 h-2 w-2 rounded-full ${!isBlacklisted ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-300">Blacklisted: {isBlacklisted ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center">
            <span className={`mr-2 h-2 w-2 rounded-full ${isEligible ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-300">Eligible: {isEligible ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center">
            <span className={`mr-2 h-2 w-2 rounded-full ${hasClaimedAirdrop ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span className="text-sm text-gray-300">Claimed: {hasClaimedAirdrop ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTabContent({ airdrop }: { airdrop: AirdropData }) {
  // This would ideally fetch on-chain data for recent claims
  // For now, just show placeholder data
  const recentActivity = [
    { address: "0x1234...5678", time: "2 hours ago", amount: airdrop.amount },
    { address: "0xabcd...efgh", time: "5 hours ago", amount: airdrop.amount },
    { address: "0x9876...5432", time: "1 day ago", amount: airdrop.amount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recent Claims</h3>
        <div className="text-sm text-gray-400">
          {airdrop.claimers} / {airdrop.totalTokens} claimed
        </div>
      </div>
      
      <div className="space-y-2">
        {recentActivity.map((activity, index) => (
          <div 
            key={index}
            className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 p-3"
          >
            <div className="flex items-center">
              <Avatar className="mr-2 h-8 w-8">
                <AvatarFallback className="bg-neutral-700 text-neutral-300">
                  {activity.address.substring(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white">{activity.address}</p>
                <p className="text-xs text-gray-400">{activity.time}</p>
              </div>
            </div>
            <div className="text-sm font-medium text-white">
              {activity.amount} {airdrop.symbol}
            </div>
          </div>
        ))}
      </div>
      
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        <h4 className="mb-3 font-medium text-white">Distribution Progress</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-white">{((airdrop.claimers / airdrop.totalTokens) * 100).toFixed(1)}%</span>
          </div>
          <Progress value={(airdrop.claimers / airdrop.totalTokens) * 100} className="h-2" />
        </div>
      </div>
    </div>
  );
} 