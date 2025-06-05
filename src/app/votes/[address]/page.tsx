"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { 
  ArrowLeft, Calendar, Clock, Users, Shield, 
  CheckCircle, AlertCircle, Loader2, Trophy, 
  Wallet, Award, Info
} from 'lucide-react';
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { AnimatedBeamsContainer } from "@/components/magicui/animated-beam";
import { Particles } from "@/components/magicui/particles";
import { Confetti } from "@/components/magicui/confetti";
import { Button } from "@/components/ui/button";
import { useVoteDetails, useVoteEligibility, useVoteCast } from '@/lib/hooks/useVoting';

export default function VoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address: userAddress } = useAccount();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Get vote address from URL params
  const voteAddress = (params?.address as string) || '';
  
  // Fetch vote details
  const { 
    voteData, 
    isLoading: isLoadingVote, 
    error: voteError 
  } = useVoteDetails(voteAddress as `0x${string}`);
  
  // Check user eligibility
  const { 
    eligibility, 
    isLoading: isLoadingEligibility, 
    error: eligibilityError 
  } = useVoteEligibility(voteAddress as `0x${string}`);
  
  // Cast vote hook
  const {
    vote,
    isVoting,
    isConfirming,
    isVoteConfirmed,
    error: voteSubmitError,
    txHash
  } = useVoteCast(voteAddress as `0x${string}`);
  
  // Show confetti on successful vote
  useEffect(() => {
    if (isVoteConfirmed) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [isVoteConfirmed]);
  
  // Format date for display
  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Check if vote is active
  const isVoteActive = () => {
    if (!voteData) return false;
    
    const now = BigInt(Math.floor(Date.now() / 1000));
    return now >= voteData.startTime && (voteData.endTime === BigInt(0) || now <= voteData.endTime);
  };
  
  // Handle vote submission
  const handleVoteSubmit = () => {
    if (selectedOption === null) return;
    
    vote(selectedOption);
  };
  
  // Calculate total votes and percentages
  const calculateStats = () => {
    if (!voteData) return { totalVotes: BigInt(0), percentages: [] };
    
    const totalVotes = voteData.totalVotes;
    const percentages = voteData.options.map(option => {
      if (totalVotes === BigInt(0)) return 0;
      return Number((option.voteCount * BigInt(100)) / totalVotes);
    });
    
    return { totalVotes, percentages };
  };
  
  const { totalVotes, percentages } = calculateStats();
  
  // Render eligibility status message
  const renderEligibilityMessage = () => {
    if (!eligibility) return null;
    
    if (eligibility.meetsAllRequirements) {
      return (
        <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <div className="flex items-start">
            <CheckCircle className="mr-3 h-5 w-5 text-green-400" />
            <div>
              <h4 className="font-medium text-green-400">You're eligible to vote</h4>
              <p className="text-sm text-green-300/70">
                You meet all requirements to participate in this vote.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    const messages: Record<string, { title: string, message: string }> = {
      'NotActivated': {
        title: 'Account not activated',
        message: 'You need to activate your Graphite account to participate.'
      },
      'InsufficientKYC': {
        title: 'KYC level too low',
        message: `Required KYC level: ${voteData?.requiredKYCLevel.toString()}, Your level: ${eligibility.userKycLevel.toString()}`
      },
      'LowTrustScore': {
        title: 'Trust score too low',
        message: `Required trust score: ${voteData?.requiredTrustScore.toString()}, Your score: ${eligibility.userTrustScore.toString()}`
      },
      'InsufficientTokenBalance': {
        title: 'Insufficient token balance',
        message: `Required balance: ${voteData?.requiredTokenBalance.toString()}, Your balance: ${eligibility.userTokenBalance.toString()}`
      },
      'GenericIneligible': {
        title: 'Not eligible',
        message: 'You do not meet the requirements to participate in this vote.'
      }
    };
    
    const { title, message } = messages[eligibility.statusReason] || messages.GenericIneligible;
    
    return (
      <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
        <div className="flex items-start">
          <AlertCircle className="mr-3 h-5 w-5 text-amber-400" />
          <div>
            <h4 className="font-medium text-amber-400">{title}</h4>
            <p className="text-sm text-amber-300/70">
              {message}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  if (isLoadingVote) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-4 text-lg text-gray-300">Loading vote details...</p>
        </div>
      </div>
    );
  }
  
  if (voteError || !voteData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold text-white">Failed to load vote</h2>
          <p className="mt-2 text-gray-400">
            {voteError?.message || "The vote could not be found or has been removed."}
          </p>
          <Link href="/votes" passHref>
            <Button className="mt-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Votes
            </Button>
          </Link>
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
      
      <Confetti trigger={showConfetti} duration={5000} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/votes" passHref>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Votes
            </Button>
          </Link>
          
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-white md:text-4xl">{voteData.description}</h1>
            
            <div className={`ml-2 rounded-full px-3 py-1 text-xs font-medium ${
              isVoteActive() 
                ? 'bg-green-500/20 text-green-400' 
                : Number(voteData.endTime) > 0 && BigInt(Math.floor(Date.now() / 1000)) > voteData.endTime
                ? 'bg-red-500/20 text-red-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {isVoteActive() 
                ? 'Active' 
                : Number(voteData.endTime) > 0 && BigInt(Math.floor(Date.now() / 1000)) > voteData.endTime
                ? 'Ended'
                : 'Upcoming'}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GlassmorphismCard className="p-6">
              <h2 className="mb-6 text-xl font-semibold text-white">Vote Options</h2>
              
              {isVoteConfirmed ? (
                <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                  <div className="flex items-start">
                    <CheckCircle className="mr-3 h-5 w-5 text-green-400" />
                    <div>
                      <h4 className="font-medium text-green-400">Vote submitted successfully!</h4>
                      <p className="text-sm text-green-300/70">
                        Your vote has been recorded on the blockchain.
                      </p>
                      {txHash && (
                        <a 
                          href={`https://etherscan.io/tx/${txHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs text-blue-400 hover:underline"
                        >
                          View transaction
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : voteData.hasUserVoted ? (
                <div className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                  <div className="flex items-start">
                    <CheckCircle className="mr-3 h-5 w-5 text-blue-400" />
                    <div>
                      <h4 className="font-medium text-blue-400">You've already voted</h4>
                      <p className="text-sm text-blue-300/70">
                        Your vote has been recorded for this proposal.
                      </p>
                    </div>
                  </div>
                </div>
              ) : !isVoteActive() ? (
                <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex items-start">
                    <Info className="mr-3 h-5 w-5 text-amber-400" />
                    <div>
                      <h4 className="font-medium text-amber-400">
                        {Number(voteData.endTime) > 0 && BigInt(Math.floor(Date.now() / 1000)) > voteData.endTime
                          ? 'Voting period has ended'
                          : 'Voting period has not started yet'}
                      </h4>
                      <p className="text-sm text-amber-300/70">
                        {Number(voteData.endTime) > 0 && BigInt(Math.floor(Date.now() / 1000)) > voteData.endTime
                          ? `This vote ended on ${formatDate(voteData.endTime)}`
                          : `This vote will start on ${formatDate(voteData.startTime)}`}
                      </p>
                    </div>
                  </div>
                </div>
              ) : userAddress ? (
                renderEligibilityMessage()
              ) : null}
              
              <div className="space-y-4">
                {voteData.options.map((option, index) => (
                  <div 
                    key={index}
                    className={`relative overflow-hidden rounded-lg border p-4 transition-all ${
                      voteData.hasUserVoted || !isVoteActive() || (eligibility && !eligibility.meetsAllRequirements)
                        ? 'border-gray-700 bg-gray-800/50'
                        : selectedOption === index
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                    onClick={() => {
                      if (!voteData.hasUserVoted && isVoteActive() && eligibility?.meetsAllRequirements) {
                        setSelectedOption(index);
                      }
                    }}
                    style={{ cursor: !voteData.hasUserVoted && isVoteActive() && eligibility?.meetsAllRequirements ? 'pointer' : 'default' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">{option.text}</h3>
                        <p className="text-sm text-gray-400">
                          {option.voteCount.toString()} vote{option.voteCount === BigInt(1) ? '' : 's'}
                        </p>
                      </div>
                      
                      {selectedOption === index && !voteData.hasUserVoted && (
                        <div className="rounded-full bg-blue-500 p-1">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-700">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600" 
                        style={{ 
                          width: `${totalVotes > BigInt(0) ? percentages[index] : 0}%`,
                          transition: 'width 0.5s ease'
                        }}
                      />
                    </div>
                    
                    <div className="mt-1 text-right text-xs text-gray-400">
                      {totalVotes > BigInt(0) ? `${percentages[index]}%` : '0%'}
                    </div>
                  </div>
                ))}
              </div>
              
              {!voteData.hasUserVoted && isVoteActive() && userAddress && eligibility?.meetsAllRequirements && (
                <Button 
                  className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  onClick={handleVoteSubmit}
                  disabled={selectedOption === null || isVoting || isConfirming}
                >
                  {isVoting || isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isVoting ? 'Submitting Vote...' : 'Confirming Vote...'}
                    </>
                  ) : (
                    'Submit Vote'
                  )}
                </Button>
              )}
              
              {voteSubmitError && (
                <div className="mt-4 text-sm text-red-400">
                  Error: {voteSubmitError.message}
                </div>
              )}
            </GlassmorphismCard>
          </div>
          
          <div>
            <GlassmorphismCard className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Vote Details</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-400">Total Votes</h3>
                  <p className="text-lg font-medium text-white">{voteData.totalVotes.toString()}</p>
                </div>
                
                <div>
                  <h3 className="text-sm text-gray-400">Voting Period</h3>
                  <p className="text-base text-white">
                    {formatDate(voteData.startTime)}
                    {Number(voteData.endTime) > 0 ? (
                      <>
                        <br />to<br />
                        {formatDate(voteData.endTime)}
                      </>
                    ) : (
                      ' - No end date'
                    )}
                  </p>
                </div>
                
                <div className="pt-2">
                  <h3 className="mb-2 text-sm text-gray-400">Requirements</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Trophy className="mr-2 h-4 w-4 text-amber-400" />
                      <span className="text-sm text-white">
                        Trust Score: {voteData.requiredTrustScore.toString()}+
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Shield className="mr-2 h-4 w-4 text-blue-400" />
                      <span className="text-sm text-white">
                        KYC Level: {voteData.requiredKYCLevel.toString()}+
                      </span>
                    </div>
                    
                    {voteData.requiredToken && (
                      <div className="flex items-center">
                        <Wallet className="mr-2 h-4 w-4 text-green-400" />
                        <span className="text-sm text-white">
                          Token Balance: {voteData.requiredTokenBalance.toString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-2">
                  <h3 className="text-sm text-gray-400">Created By</h3>
                  <p className="text-sm font-medium text-white break-all">
                    {voteData.proposalCreator}
                  </p>
                </div>
              </div>
            </GlassmorphismCard>
          </div>
        </div>
      </div>
    </div>
  );
} 