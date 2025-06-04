"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Gift, Wallet, Activity, Shield, ArrowUpRight } from "lucide-react";
import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar";
import { AnimatedList } from "@/components/magicui/animated-list";
import { Confetti } from "@/components/magicui/confetti";
import { CoolMode } from "@/components/magicui/cool-mode";
import { Particles } from "@/components/magicui/particles";
import { ShineBorderCard } from "@/components/magicui/shine-border";
import { Meteors } from "@/components/magicui/meteors";
import { TrustBadge } from "@/components/web3/trust-badge";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { useUserProfileData } from "@/lib/hooks/useUserProfileData";
import { useUserAchievements, type Achievement } from "@/lib/hooks/useUserAchievements";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data for sections not yet connected to live data
const MOCK_RECENT_ACTIVITY = [
  { 
    id: 1, 
    type: "MINT", 
    description: "Minted Trust Badge NFT", 
    status: "SUCCESS" 
  },
  { 
    id: 2, 
    type: "AIRDROP", 
    description: "Created Airdrop", 
    status: "SUCCESS" 
  },
  {
    id: 3,
    type: "VERIFICATION",
    description: "Completed KYC",
    status: "SUCCESS"
  },
  // {
  //   id: 4,
  //   type: "TRANSFER",
  //   description: "Sent Tokens",
  //   status: "SUCCESS"
  // }
];

export default function Dashboard() {
  const router = useRouter();
  const { address: connectedAddress, isConnected } = useAccount();
  const { 
    trustScore, 
    isTrustScoreLoading, 
    trustScoreError, 
    kycLevel, 
    isKycLevelLoading, 
    kycLevelError,
    isLoading: isProfileDataLoading,
  } = useUserProfileData(connectedAddress);

  const {
    achievements,
    isLoading: isAchievementsLoading,
    error: achievementsError,
  } = useUserAchievements({
    userAddress: connectedAddress,
    kycLevel: kycLevel,
    isKycLevelLoading: isKycLevelLoading,
  });

  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    const kycCompletedNow = kycLevel && kycLevel > 0;
    if (kycCompletedNow) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [kycLevel]);
  
  const recentActivity = MOCK_RECENT_ACTIVITY;
  const displayedAchievements = achievements.filter(ach => ach.achieved);

  return (
    <div className="relative min-h-screen w-full bg-black">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <Particles
          className="absolute inset-0"
          quantity={50}
          staticity={30}
          color="#ffffff"
        />
      </div>

      {/* Achievement Confetti */}
      <Confetti trigger={showConfetti} duration={4000} />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold text-white">Dashboard</h1>
        
        {!isConnected && (
          <GlassmorphismCard className="mb-8 p-6 text-center">
            <p className="text-xl text-white">Please connect your wallet to view your dashboard.</p>
          </GlassmorphismCard>
        )}

        {isConnected && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column - Trust Score & Badge */}
            <div className="col-span-1">
              <div className="space-y-6">
                <GlassmorphismCard className="flex flex-col items-center justify-center p-6">
                  <h2 className="mb-4 text-xl font-semibold text-white">Trust Score</h2>
                  {isProfileDataLoading ? (
                    <div className="flex flex-col items-center">
                      <Skeleton className="h-[200px] w-[200px] rounded-full" />
                      <Skeleton className="mt-2 h-8 w-24" />
                      <Skeleton className="mt-1 h-4 w-16" />
                    </div>
                  ) : trustScoreError ? (
                    <p className="text-red-400">Error: {trustScoreError.message}</p>
                  ) : (
                    <div className="relative">
                      <AnimatedCircularProgressBar
                        value={trustScore ?? 0}
                        maxValue={1000}
                        size={200}
                        strokeWidth={15}
                        backgroundColor="rgba(255, 255, 255, 0.1)"
                        gradientColors={["#3b82f6", "#8b5cf6", "#ec4899"]}
                        duration={2}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-4xl font-bold text-white">{trustScore ?? 'N/A'}</span>
                          <span className="text-sm text-gray-300">/1000</span>
                        </div>
                      </AnimatedCircularProgressBar>
                    </div>
                  )}
                </GlassmorphismCard>

                <GlassmorphismCard className="flex flex-col items-center justify-center p-6">
                  <h2 className="mb-4 text-xl font-semibold text-white">Your Badge</h2>
                  {isProfileDataLoading ? (
                     <Skeleton className="h-48 w-48 rounded-md" />
                  ) : trustScoreError ? (
                    <p className="text-red-400">Could not load badge.</p>
                  ) : (
                    <TrustBadge trustScore={trustScore ?? 0} className="h-48 w-48" />
                  )}
                </GlassmorphismCard>
              </div>
            </div>

            {/* Middle Column - Recent Activity (Still Mock) */}
            <div className="col-span-1">
              <GlassmorphismCard className="h-full p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">Full on-chain activity requires an indexer.</p>

                <div className="mt-4">
                  <AnimatedList
                    items={recentActivity}
                    keyExtractor={(item) => item.id}
                    itemClassName="mb-3"
                    staggerDelay={0.1}
                    renderItem={(activityItem) => (
                      <ShineBorderCard
                        className="relative overflow-hidden p-4"
                        borderClassName="border border-gray-700"
                        backgroundClassName="bg-gray-900/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="mr-3 rounded-full bg-blue-900/30 p-2">
                              {activityItem.type === "MINT" && <Gift className="h-5 w-5 text-blue-400" />}
                              {activityItem.type === "AIRDROP" && <Gift className="h-5 w-5 text-purple-400" />}
                              {activityItem.type === "TRANSFER" && <Wallet className="h-5 w-5 text-green-400" />}
                              {activityItem.type === "VERIFICATION" && <Shield className="h-5 w-5 text-amber-400" />}
                            </div>
                            <div>
                              <div className="font-medium text-white">{activityItem.description}</div>
                            </div>
                          </div>
                        </div>
                      </ShineBorderCard>
                    )}
                  />
                </div>
              </GlassmorphismCard>
            </div>

            {/* Right Column - Quick Actions & Achievements */}
            <div className="col-span-1 space-y-6">
              <GlassmorphismCard className="p-6">
                <h2 className="mb-4 text-xl font-semibold text-white">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                  <CoolMode colors={["#3b82f6", "#8b5cf6", "#ec4899"]} particleCount={15}>
                    <motion.button className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white shadow-lg" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/nfts/mint')} >
                      <Gift className="mb-1 mx-auto h-6 w-6" />
                      <div>Mint NFT</div>
                    </motion.button>
                  </CoolMode>
                  <CoolMode colors={["#8b5cf6", "#ec4899", "#f472b6"]} particleCount={15}>
                    <motion.button className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 text-white shadow-lg" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/airdrops/create')} >
                      <Gift className="mb-1 mx-auto h-6 w-6" />
                      <div>Create Airdrop</div>
                    </motion.button>
                  </CoolMode>
                  <CoolMode colors={["#10b981", "#059669", "#047857"]} particleCount={15}>
                    <motion.button className="w-full rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 text-white shadow-lg" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => connectedAddress && window.open(`https://explorer.graphite.network/address/${connectedAddress}`, '_blank')} >
                      <Activity className="mb-1 mx-auto h-6 w-6" />
                      <div>View Activity</div>
                    </motion.button>
                  </CoolMode>
                  <CoolMode colors={["#f59e0b", "#d97706", "#b45309"]} particleCount={15}>
                    <motion.button className="w-full rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-3 text-white shadow-lg" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/profile')} >
                      <Shield className="mb-1 mx-auto h-6 w-6" />
                      <div>Manage Profile</div>
                    </motion.button>
                  </CoolMode>
                </div>
              </GlassmorphismCard>

              <GlassmorphismCard className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">My Achievements</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {isAchievementsLoading ? (
                    <>
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </>
                  ) : achievementsError ? (
                    <p className="text-red-400">Error loading achievements: {achievementsError.message}</p>
                  ) : displayedAchievements.length === 0 ? (
                     <p className="text-gray-400">No achievements unlocked yet. Mint an NFT or complete KYC to get started!</p>
                  ) : (
                    displayedAchievements.map((achievement: Achievement) => (
                      <div key={achievement.id} className={`relative overflow-hidden rounded-lg border border-gray-700 p-3 ${achievement.achieved ? 'bg-gray-900/80' : 'bg-gray-800/50 opacity-70'}`}>
                        {achievement.achieved && (
                          <div className="absolute -right-6 -top-6">
                            <Meteors number={2} className="from-purple-400 to-purple-600" />
                          </div>
                        )}
                        <div className="flex items-center">
                          <div className={`mr-3 rounded-full p-2 ${achievement.achieved ? 'bg-purple-900/30' : 'bg-gray-700/30'}`}>
                            <achievement.icon className={`h-5 w-5 ${achievement.achieved ? 'text-purple-400' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <div className={`font-medium ${achievement.achieved ? 'text-white' : 'text-gray-400'}`}>{achievement.name}</div>
                            <div className={`text-xs ${achievement.achieved ? 'text-gray-400' : 'text-gray-500'}`}>{achievement.date}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassmorphismCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 