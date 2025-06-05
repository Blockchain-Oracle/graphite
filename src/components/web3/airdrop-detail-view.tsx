import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Calendar, Check, Clock, ExternalLink, User, X } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { ShineBorderCard } from "@/components/magicui/shine-border";
import { CoolMode } from "@/components/magicui/cool-mode";
import { Confetti } from "@/components/magicui/confetti";
import { Meteors } from "@/components/magicui/meteors";
import { type AirdropData } from './airdrop-card';
import { useAirdropClaim } from '@/lib/hooks/useAirdrops';

interface AirdropDetailViewProps {
  airdrop: AirdropData;
  onClaimSuccess?: (airdrop: AirdropData) => Promise<boolean>;
}

export function AirdropDetailView({ airdrop, onClaimSuccess }: AirdropDetailViewProps) {
  const [showConfetti, setShowConfetti] = useState(false);
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
    isSuccess
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

  // Handle claim button click
  const handleClaim = async () => {
    if (!isEligible || hasClaimedAirdrop) {
      return;
    }
    
    try {
      await claimAirdrop();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Notify parent component of successful claim
      if (onClaimSuccess) {
        await onClaimSuccess(airdrop);
      }
    } catch (err) {
      console.error("Claim failed:", err);
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
            
            <div className="rounded-lg bg-gray-800/50 p-4">
              {eligibilityInfo.content}
            </div>
          </div>
        )}

        {/* Claim button */}
        {address ? (
          <>
            {isEligible && !hasClaimedAirdrop && airdrop.status === 'active' && (
              <CoolMode colors={["#3b82f6", "#8b5cf6", "#ec4899"]}>
                <motion.button
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white shadow-lg transition-all hover:from-blue-500 hover:to-purple-500 disabled:opacity-50"
                  onClick={handleClaim}
                  disabled={isClaimPending || isConfirming}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isClaimPending || isConfirming
                    ? "Processing claim..."
                    : `Claim ${airdrop.amount} ${airdrop.symbol}`}
                </motion.button>
              </CoolMode>
            )}

            {hasClaimedAirdrop && (
              <div className="flex items-center justify-center rounded-lg bg-green-500/10 px-4 py-3 text-green-400">
                <Check className="mr-2 h-5 w-5" />
                Claimed Successfully
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-center text-blue-400">
            Connect your wallet to check eligibility
          </div>
        )}
      </GlassmorphismCard>
    </div>
  );
} 