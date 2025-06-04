"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Check, Clock, Calendar, User, AlertCircle, X, ChevronRight } from "lucide-react";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { Confetti } from "@/components/magicui/confetti";
import { CoolMode } from "@/components/magicui/cool-mode";
import { ShineBorderCard } from "@/components/magicui/shine-border";
import { Meteors } from "@/components/magicui/meteors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface AirdropData {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  logoUrl: string;
  tokenContractAddress: string;
  creatorName: string;
  creatorAddress: string;
  startDate: string;
  endDate: string;
  claimers: number;
  totalTokens: number;
  isEligible?: boolean;
  hasClaimed?: boolean;
  description?: string;
  type: "ERC20" | "ERC721";
  status: "upcoming" | "active" | "expired" | "completed";
}

interface AirdropCardProps {
  airdrop: AirdropData;
  onClaim?: (airdrop: AirdropData) => void;
  className?: string;
  isDetailed?: boolean;
  isClickable?: boolean;
  onClick?: () => void;
}

export function AirdropCard({
  airdrop,
  onClaim,
  className,
  isDetailed = false,
  isClickable = true,
  onClick,
}: AirdropCardProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click when claiming
    if (onClaim && airdrop.isEligible && !airdrop.hasClaimed) {
      setIsClaiming(true);
      try {
        await onClaim(airdrop);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } catch (error) {
        console.error("Error claiming airdrop:", error);
      } finally {
        setIsClaiming(false);
      }
    }
  };

  const handleCardClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getStatusColor = (status: AirdropData['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-400';
      case 'active':
        return 'bg-green-500/10 text-green-400';
      case 'expired':
        return 'bg-amber-500/10 text-amber-400';
      case 'completed':
        return 'bg-gray-500/10 text-gray-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const getStatusIcon = (status: AirdropData['status']) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="h-3 w-3" />;
      case 'active':
        return <Check className="h-3 w-3" />;
      case 'expired':
        return <X className="h-3 w-3" />;
      case 'completed':
        return <Check className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getEligibilityIndicator = () => {
    if (airdrop.hasClaimed) {
      return (
        <div className="flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-400">
          <Check className="mr-1 h-3 w-3" />
          Claimed
        </div>
      );
    }

    if (airdrop.isEligible) {
      return (
        <div className="flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
          <Check className="mr-1 h-3 w-3" />
          Eligible
        </div>
      );
    }

    return (
      <div className="flex items-center rounded-full bg-gray-500/10 px-2 py-1 text-xs text-gray-400">
        <AlertCircle className="mr-1 h-3 w-3" />
        Not Eligible
      </div>
    );
  };

  return (
    <>
      {showConfetti && <Confetti trigger={showConfetti} duration={3000} />}
      
      <GlassmorphismCard 
        className={cn(
          "relative overflow-hidden transition-all",
          isClickable && "cursor-pointer hover:scale-[1.01]",
          className
        )}
        onClick={handleCardClick}
      >
        {/* Status indicator with meteors for active airdrops */}
        <div className="absolute right-2 top-2 z-10">
          <div className={cn("flex items-center rounded-full px-2 py-1 text-xs", getStatusColor(airdrop.status))}>
            {getStatusIcon(airdrop.status)}
            <span className="ml-1 capitalize">{airdrop.status}</span>
          </div>
        </div>

        {/* Background effects */}
        {airdrop.status === 'active' && airdrop.isEligible && !airdrop.hasClaimed && (
          <div className="absolute inset-0 overflow-hidden">
            <Meteors
              number={4}
              className="from-blue-500/20 to-purple-500/20"
            />
          </div>
        )}

        <div className="p-5">
          {/* Header with token info */}
          <div className="mb-4 flex items-center">
            <Avatar className="relative mr-3 h-12 w-12 overflow-hidden rounded-full">
              <AvatarImage src={`https://effigy.im/a/${airdrop.tokenContractAddress}.svg`} alt={`${airdrop.name} logo`} />
              <AvatarFallback className="bg-neutral-700 text-neutral-300">{airdrop.symbol ? airdrop.symbol.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col">
              <h3 className="text-lg font-semibold text-white">{airdrop.name}</h3>
              <div className="flex items-center text-sm text-gray-400">
                <span className="mr-1">{airdrop.symbol}</span>
                <span>•</span>
                <span className="ml-1">{airdrop.type}</span>
              </div>
            </div>
            {getEligibilityIndicator()}
          </div>

          {/* Airdrop details */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center text-sm text-gray-300">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              {formatDate(airdrop.startDate)} - {formatDate(airdrop.endDate)}
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <User className="mr-2 h-4 w-4 text-gray-400" />
              {airdrop.claimers} claimers
            </div>
            {isDetailed && airdrop.description && (
              <p className="mt-3 text-sm text-gray-300">{airdrop.description}</p>
            )}
          </div>

          {/* Token amount */}
          <div className="mb-4">
            <ShineBorderCard
              className="p-3"
              borderClassName="border border-gray-700"
            >
              <div className="text-center">
                <div className="text-xs text-gray-400">Amount Per Wallet</div>
                <div className="text-xl font-bold text-white">
                  {airdrop.amount} {airdrop.symbol}
                </div>
              </div>
            </ShineBorderCard>
          </div>

          {/* Claim button */}
          {airdrop.isEligible && !airdrop.hasClaimed && airdrop.status === 'active' && (
            <CoolMode colors={["#3b82f6", "#8b5cf6", "#ec4899"]}>
              <motion.button
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white shadow-lg transition-all hover:from-blue-500 hover:to-purple-500"
                onClick={handleClaim}
                disabled={isClaiming}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isClaiming ? "Claiming..." : "Claim Airdrop"}
              </motion.button>
            </CoolMode>
          )}

          {/* Claimed indicator */}
          {airdrop.hasClaimed && (
            <div className="flex items-center justify-center rounded-lg bg-green-500/10 px-4 py-3 text-green-400">
              <Check className="mr-2 h-5 w-5" />
              Claimed Successfully
            </div>
          )}
          
          {/* Details button for non-detailed view */}
          {!isDetailed && isClickable && (
            <div className="mt-3 flex items-center justify-center">
              <motion.button
                className="flex items-center text-sm text-blue-400 hover:text-blue-300"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClick) onClick();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Details <ChevronRight className="ml-1 h-4 w-4" />
              </motion.button>
            </div>
          )}
        </div>
      </GlassmorphismCard>
    </>
  );
} 