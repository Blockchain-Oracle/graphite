import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Calendar, Check, Clock, ExternalLink, User, X, AlertTriangle, Upload, Info } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { ShineBorderCard } from "@/components/magicui/shine-border";
import { CoolMode } from "@/components/magicui/cool-mode";
import { Confetti } from "@/components/magicui/confetti";
import { Meteors } from "@/components/magicui/meteors";
import { type AirdropData } from './airdrop-card';
import { useAirdropClaim } from '@/lib/hooks/useAirdrops';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AirdropDetailViewProps {
  airdrop: AirdropData;
  onClaimSuccess?: (airdrop: AirdropData) => Promise<boolean>;
}

export function AirdropDetailView({ airdrop, onClaimSuccess }: AirdropDetailViewProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [proofError, setProofError] = useState(false);
  const [manualProof, setManualProof] = useState<string>('');
  const [showProofInput, setShowProofInput] = useState(false);
  const [showClaimConfirmDialog, setShowClaimConfirmDialog] = useState(false);
  const { address } = useAccount();
  
  // Use the airdropClaim hook to get detailed eligibility info and claim functionality
  const { 
    isActivated,
    trustScore,
    kycLevel,
    isBlacklisted,
    hasClaimedAirdrop,
    isEligible,
    claimAmount,
    isLoading,
    error,
    claimAirdrop,
    isClaimPending,
    isConfirming,
    isSuccess,
    merkleProof,
    hasMerkleProof
  } = useAirdropClaim(airdrop.id as `0x${string}`);

  // Format date helper
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

  // Handle opening the claim confirmation dialog
  const handleOpenClaimDialog = () => {
    if (!isEligible || hasClaimedAirdrop) {
      return;
    }

    // Check if Merkle proof is required but not available
    if (!hasMerkleProof && airdrop.type === "ERC20") {
      setShowProofInput(true);
    } else {
      setShowClaimConfirmDialog(true);
    }
  };
  
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

  // Handle manual proof submission
  const handleSubmitManualProof = () => {
    const parsedProof = parseManualProof();
    if (parsedProof.length === 0) {
      setErrorMessage("Invalid Merkle proof format. Please enter valid hex strings starting with 0x.");
      setShowErrorDialog(true);
      return;
    }
    
    // Set the proof and continue to claim confirmation
    setShowProofInput(false);
    setShowClaimConfirmDialog(true);
  };

  // Handle claim button click
  const handleClaim = async () => {
    if (!isEligible || hasClaimedAirdrop) {
      return;
    }

    // Close the confirmation dialog
    setShowClaimConfirmDialog(false);
    
    // Use manually entered proof if provided
    const proofToUse = showProofInput && manualProof ? parseManualProof() : merkleProof;
    
    // Check if we have a valid proof now
    if (!proofToUse.length && airdrop.type === "ERC20") {
      setProofError(true);
      setErrorMessage("Merkle proof not found or invalid. Please contact the airdrop creator to verify your eligibility.");
      setShowErrorDialog(true);
      return;
    }
    
    try {
      setErrorMessage(null);
      // Pass the manual proof if we're using it
      await claimAirdrop(showProofInput ? proofToUse : undefined);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Notify parent component of successful claim
      if (onClaimSuccess) {
        await onClaimSuccess(airdrop);
      }
    } catch (err: any) {
      console.error("Claim failed:", err);
      setErrorMessage(err?.message || "Failed to claim airdrop. Please try again later.");
      setShowErrorDialog(true);
    }
  };

  // Get status info
  const getStatusDisplay = () => {
    const now = Date.now();
    const start = new Date(airdrop.startDate).getTime();
    const end = new Date(airdrop.endDate).getTime();
    
    if (now < start) {
      return { color: 'text-blue-400 bg-blue-500/10', icon: <Clock className="mr-2 h-4 w-4" />, text: 'Starts in ' + getTimeRemaining(start - now) };
    } else if (now > end) {
      return { color: 'text-amber-400 bg-amber-500/10', icon: <X className="mr-2 h-4 w-4" />, text: 'Ended ' + getTimeRemaining(now - end) + ' ago' };
    } else {
      return { color: 'text-green-400 bg-green-500/10', icon: <Check className="mr-2 h-4 w-4" />, text: 'Active - Ends in ' + getTimeRemaining(end - now) };
    }
  };

  // Get time remaining helper
  const getTimeRemaining = (timeMs: number) => {
    const days = Math.floor(timeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      const minutes = Math.floor((timeMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
  };

  const getEligibilityInfo = () => {
    if (isLoading) {
      return {
        state: 'loading',
        content: <div className="flex items-center justify-center text-amber-400"><Clock className="mr-2 h-5 w-5" /> Checking eligibility...</div>
      };
    }
    
    if (error) {
      return {
        state: 'error',
        content: <div className="flex items-center justify-center text-red-400"><AlertCircle className="mr-2 h-5 w-5" /> Error checking eligibility</div>
      };
    }

    if (hasClaimedAirdrop) {
      return {
        state: 'claimed',
        content: <div className="flex items-center justify-center text-green-400"><Check className="mr-2 h-5 w-5" /> Successfully claimed</div>
      };
    }

    if (!isActivated) {
      return {
        state: 'not-activated',
        content: <div className="flex items-center justify-center text-amber-400"><AlertCircle className="mr-2 h-5 w-5" /> Account not activated on Graphite</div>
      };
    }

    if (isBlacklisted) {
      return {
        state: 'blacklisted',
        content: <div className="flex items-center justify-center text-red-400"><X className="mr-2 h-5 w-5" /> Address blacklisted from this airdrop</div>
      };
    }

    if (isEligible) {
      if (!hasMerkleProof && airdrop.type === "ERC20") {
        return {
          state: 'no-proof',
          content: (
            <div className="flex items-center justify-center text-amber-400">
              <AlertTriangle className="mr-2 h-5 w-5" /> Merkle proof required
            </div>
          )
        };
      }
      
      return {
        state: 'eligible',
        content: <div className="flex items-center justify-center text-green-400"><Check className="mr-2 h-5 w-5" /> Eligible to claim</div>
      };
    }

    return {
      state: 'not-eligible',
      content: <div className="flex items-center justify-center text-amber-400"><AlertCircle className="mr-2 h-5 w-5" /> Not eligible for this airdrop</div>
    };
  };

  const eligibilityInfo = getEligibilityInfo();
  const statusDisplay = getStatusDisplay();

  return (
    <div className="relative">
      {showConfetti && <Confetti trigger={showConfetti} duration={3000} />}
      
      <div className="absolute inset-0 overflow-hidden">
        <Meteors
          number={4}
          className="from-blue-500/10 to-purple-500/10"
        />
      </div>
      
      <GlassmorphismCard className="relative z-10 p-6">
        {/* Header with token info */}
        <div className="mb-6 flex items-center">
          <Avatar className="mr-4 h-16 w-16">
            <AvatarImage src={`https://effigy.im/a/${airdrop.tokenContractAddress}.svg`} alt={`${airdrop.name} logo`} />
            <AvatarFallback className="bg-neutral-700 text-neutral-300">{airdrop.symbol ? airdrop.symbol.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-white">{airdrop.name}</h2>
            <div className="flex items-center text-gray-400">
              <span>{airdrop.symbol}</span>
              <span className="mx-2">•</span>
              <span>{airdrop.type}</span>
            </div>
          </div>
        </div>
        
        {/* Status info */}
        <div className={`mb-6 flex items-center rounded-lg ${statusDisplay.color} px-4 py-2 text-sm`}>
          {statusDisplay.icon}
          <span>{statusDisplay.text}</span>
        </div>

        {/* Token and distribution details */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
            <h3 className="mb-2 text-sm font-medium text-gray-400">Amount Per Wallet</h3>
            <p className="text-xl font-bold text-white">{airdrop.amount} {airdrop.symbol}</p>
          </ShineBorderCard>
          
          <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
            <h3 className="mb-2 text-sm font-medium text-gray-400">Total Claimers</h3>
            <p className="text-xl font-bold text-white">{airdrop.claimers} / {airdrop.totalTokens}</p>
          </ShineBorderCard>
        </div>

        {/* Timeline info */}
        <div className="mb-6 space-y-3">
          <h3 className="text-sm font-medium text-gray-400">Airdrop Timeline</h3>
          <div className="flex items-center text-sm text-gray-300">
            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
            <div>
              <div>Start: {formatDate(airdrop.startDate)}</div>
              <div>End: {formatDate(airdrop.endDate)}</div>
            </div>
          </div>
        </div>

        {/* Creator info */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-gray-400">Creator</h3>
          <div className="flex items-center">
            <Avatar className="mr-2 h-6 w-6">
              <AvatarFallback className="bg-neutral-700 text-neutral-300">
                {airdrop.creatorName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <a 
              href={`https://explorer.graphite.eth/address/${airdrop.creatorAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-400 hover:text-blue-300"
            >
              {airdrop.creatorName || `${airdrop.creatorAddress.substring(0, 6)}...${airdrop.creatorAddress.substring(airdrop.creatorAddress.length - 4)}`}
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Description */}
        {airdrop.description && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-gray-400">Description</h3>
            <p className="text-sm text-gray-300">{airdrop.description}</p>
          </div>
        )}

        {/* Eligibility info & Trust score */}
        {address && (
          <div className="mb-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-400">Your Eligibility</h3>
            
            {/* Merkle proof warning if needed */}
            {isEligible && !hasClaimedAirdrop && !hasMerkleProof && airdrop.type === "ERC20" && (
              <Alert variant="warning" className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Merkle Proof Required</AlertTitle>
                <AlertDescription>
                  You need a Merkle proof to claim this airdrop. Click claim to provide it manually or contact the airdrop creator.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Trust score if available */}
            {!isLoading && !error && (
              <div className="grid gap-4 md:grid-cols-2">
                <ShineBorderCard className="p-3" borderClassName="border border-gray-700">
                  <h4 className="text-xs text-gray-400">Your Trust Score</h4>
                  <p className="text-lg font-semibold text-white">{trustScore}</p>
                </ShineBorderCard>
                
                <ShineBorderCard className="p-3" borderClassName="border border-gray-700">
                  <h4 className="text-xs text-gray-400">Your KYC Level</h4>
                  <p className="text-lg font-semibold text-white">{kycLevel}</p>
                </ShineBorderCard>
              </div>
            )}
            
            {/* Eligibility Status */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
              {eligibilityInfo.content}
            </div>
          </div>
        )}
        
        {/* Claim button */}
        {isEligible && !hasClaimedAirdrop && airdrop.status === 'active' && (
          <CoolMode colors={["#3b82f6", "#8b5cf6", "#ec4899"]}>
            <motion.button
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white shadow-lg transition-all hover:from-blue-500 hover:to-purple-500"
              onClick={handleOpenClaimDialog}
              disabled={isClaimPending || isConfirming}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isClaimPending || isConfirming ? (
                <div className="flex items-center justify-center">
                  <Clock className="mr-2 h-5 w-5 animate-spin" />
                  {isClaimPending ? "Claiming..." : "Confirming..."}
                </div>
              ) : (
                "Claim Airdrop"
              )}
            </motion.button>
          </CoolMode>
        )}

        {/* Not eligible message */}
        {(!isEligible && !hasClaimedAirdrop && airdrop.status === 'active') && (
          <div className="flex items-center justify-center rounded-lg bg-amber-500/10 px-4 py-3 text-amber-400">
            <AlertCircle className="mr-2 h-5 w-5" />
            Not Eligible to Claim
          </div>
        )}

        {/* Claimed indicator */}
        {hasClaimedAirdrop && (
          <div className="flex items-center justify-center rounded-lg bg-green-500/10 px-4 py-3 text-green-400">
            <Check className="mr-2 h-5 w-5" />
            Claimed Successfully
          </div>
        )}
      </GlassmorphismCard>
      
      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="bg-gray-900 border border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Claim Error</DialogTitle>
            <DialogDescription className="text-gray-400">
              There was an error while claiming your airdrop
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/30">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-red-400">Failed to claim airdrop</AlertTitle>
              <AlertDescription className="text-red-300">
                {proofError ? (
                  <>
                    <p className="mb-2">Merkle proof not found for your address.</p>
                    <p>This could mean:</p>
                    <ul className="list-disc pl-5 mt-1">
                      <li>You're not on the allowlist for this airdrop</li>
                      <li>The proof data hasn't been loaded correctly</li>
                      <li>There's a technical issue with the airdrop contract</li>
                    </ul>
                  </>
                ) : (
                  errorMessage || "An unknown error occurred"
                )}
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowErrorDialog(false)}
              className="bg-transparent border border-gray-700 text-white hover:bg-gray-800"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Proof Input Dialog */}
      <Dialog open={showProofInput} onOpenChange={setShowProofInput}>
        <DialogContent className="bg-gray-900 border border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Enter Merkle Proof</DialogTitle>
            <DialogDescription className="text-gray-400">
              This airdrop requires a Merkle proof to verify your eligibility. Please paste your proof below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <Alert variant="warning" className="bg-amber-500/10 border-amber-500/20 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Merkle Proof Required</AlertTitle>
              <AlertDescription>
                Contact the airdrop creator to obtain your Merkle proof if you don't have it.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Paste your Merkle Proof:</label>
              <Textarea 
                placeholder="[0x123..., 0x456...] or paste each hash on a new line"
                className="h-32 bg-gray-800 border-gray-700 text-white"
                value={manualProof}
                onChange={(e) => setManualProof(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Format: Array of hex strings or one hash per line, each starting with 0x
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowProofInput(false)}
              className="bg-transparent border border-gray-700 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitManualProof}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              Submit Proof
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Claim Confirmation Dialog */}
      <Dialog open={showClaimConfirmDialog} onOpenChange={setShowClaimConfirmDialog}>
        <DialogContent className="bg-gray-900 border border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Airdrop Claim</DialogTitle>
            <DialogDescription className="text-gray-400">
              You are about to claim {airdrop.amount} {airdrop.symbol} tokens.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
              <div className="flex justify-between items-center">
                <h4 className="text-sm text-gray-400">Amount:</h4>
                <p className="text-lg font-bold text-white">{airdrop.amount} {airdrop.symbol}</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <h4 className="text-sm text-gray-400">Token:</h4>
                <p className="text-sm text-white">{airdrop.name}</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <h4 className="text-sm text-gray-400">Network:</h4>
                <p className="text-sm text-white">Ethereum</p>
              </div>
            </ShineBorderCard>
            
            <Alert className="mt-4 bg-blue-500/10 border-blue-500/20 text-blue-400">
              <Info className="h-4 w-4" />
              <AlertTitle>Transaction Required</AlertTitle>
              <AlertDescription>
                Claiming requires a transaction. You will need to pay gas fees.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowClaimConfirmDialog(false)}
              className="bg-transparent border border-gray-700 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleClaim}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white"
            >
              Confirm Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 