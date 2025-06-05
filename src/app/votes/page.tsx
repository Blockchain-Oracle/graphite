"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from "motion/react";
import { useAccount } from 'wagmi';
import { 
  Calendar, Clock, Users, Check, AlertTriangle, 
  ChevronRight, Plus, Loader2
} from 'lucide-react';
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { Particles } from "@/components/magicui/particles";
import { Button } from "@/components/ui/button";
import { useVotes, type VoteData } from '@/lib/hooks/useVoting';

export default function VotesPage() {
  const { votes, isLoading: isLoadingVotes, voteCount } = useVotes();
  const [voteDetails, setVoteDetails] = useState<VoteData[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const { address: userAddress } = useAccount();
  
  // Fetch details for each vote
  useEffect(() => {
    const fetchAllVoteDetails = async () => {
      if (!votes.length) return;
      
      setIsLoadingDetails(true);
      
      try {
        const details = await Promise.all(
          votes.map(address => 
            fetch(`/api/votes/details?address=${address}${userAddress ? `&userAddress=${userAddress}` : ''}`)
              .then(res => res.json())
              .catch(err => {
                console.error(`Error fetching details for vote ${address}:`, err);
                return null;
              })
          )
        );
        
        setVoteDetails(details.filter(Boolean));
      } catch (err) {
        console.error("Error fetching vote details:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    };
    
    fetchAllVoteDetails();
  }, [votes, userAddress]);
  
  // Format date for display
  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };
  
  // Check if vote is active
  const isVoteActive = (vote: VoteData) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return now >= vote.startTime && (vote.endTime === BigInt(0) || now <= vote.endTime);
  };
  
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
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Votes</h1>
            <p className="mt-2 text-gray-400">
              Participate in governance decisions with your trust score
            </p>
          </div>
          
          <Link href="/votes/create" passHref>
            <Button className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="mr-2 h-4 w-4" />
              Create New Vote
            </Button>
          </Link>
        </div>
        
        {(isLoadingVotes || isLoadingDetails) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-lg text-gray-300">Loading votes...</span>
          </div>
        )}
        
        {!isLoadingVotes && !isLoadingDetails && voteDetails.length === 0 && (
          <GlassmorphismCard className="p-8 text-center">
            <h2 className="text-2xl font-semibold text-white">No votes found</h2>
            <p className="mt-2 text-gray-400">
              Be the first to create a vote for the community
            </p>
            <Link href="/votes/create" passHref>
              <Button className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="mr-2 h-4 w-4" />
                Create New Vote
              </Button>
            </Link>
          </GlassmorphismCard>
        )}
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {voteDetails.map((vote) => (
            <Link key={vote.address} href={`/votes/${vote.address}`} passHref>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-full"
              >
                <GlassmorphismCard className="h-full p-6 transition-all hover:border-blue-500/50">
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isVoteActive(vote) 
                        ? 'bg-green-500/20 text-green-400' 
                        : Number(vote.endTime) > 0 && BigInt(Math.floor(Date.now() / 1000)) > vote.endTime
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {isVoteActive(vote) 
                        ? 'Active' 
                        : Number(vote.endTime) > 0 && BigInt(Math.floor(Date.now() / 1000)) > vote.endTime
                        ? 'Ended'
                        : 'Upcoming'}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  </div>
                  
                  <h2 className="mb-3 text-xl font-bold text-white line-clamp-2">
                    {vote.description}
                  </h2>
                  
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-400">
                      <Users className="mr-2 h-4 w-4" />
                      <span>{vote.totalVotes.toString()} votes</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-400">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>
                        {formatDate(vote.startTime)}
                        {Number(vote.endTime) > 0 ? ` - ${formatDate(vote.endTime)}` : ' - No end date'}
                      </span>
                    </div>
                  </div>
                  
                  {vote.hasUserVoted && (
                    <div className="flex items-center text-sm text-green-400">
                      <Check className="mr-1 h-4 w-4" />
                      <span>You've voted</span>
                    </div>
                  )}
                  
                  {userAddress && !vote.hasUserVoted && vote.userEligibility && !vote.userEligibility.meetsAllRequirements && (
                    <div className="flex items-center text-sm text-amber-400">
                      <AlertTriangle className="mr-1 h-4 w-4" />
                      <span>Eligibility requirements not met</span>
                    </div>
                  )}
                </GlassmorphismCard>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 