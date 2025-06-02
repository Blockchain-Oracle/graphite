"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Calendar, ChevronRight, Award, Gift, Wallet, User, Activity, Shield, ArrowUpRight } from "lucide-react";
import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar";
import { AnimatedList } from "@/components/magicui/animated-list";
import { Confetti } from "@/components/magicui/confetti";
import { CoolMode } from "@/components/magicui/cool-mode";
import { Particles } from "@/components/magicui/particles";
import { ShineBorderCard } from "@/components/magicui/shine-border";
import { Meteors } from "@/components/magicui/meteors";
import { TrustBadge } from "@/components/web3/trust-badge";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";

// Mock data (to be replaced with blockchain data later)
const MOCK_USER_DATA = {
  address: "0x1234...5678",
  trustScore: 450,
  tier: "Trusted",
  achievements: [
    { id: 1, name: "First NFT Minted", date: "2023-10-15", icon: Award },
    { id: 2, name: "Completed KYC", date: "2023-10-10", icon: Shield },
    { id: 3, name: "Joined Graphite", date: "2023-10-01", icon: User },
  ],
  recentActivity: [
    { 
      id: 1, 
      type: "MINT", 
      description: "Minted Trust Badge NFT", 
      date: "2023-10-20T15:30:00Z",
      hash: "0xabc...123", 
      status: "SUCCESS" 
    },
    { 
      id: 2, 
      type: "AIRDROP", 
      description: "Created Airdrop", 
      date: "2023-10-18T12:45:00Z",
      hash: "0xdef...456", 
      status: "SUCCESS" 
    },
    { 
      id: 3, 
      type: "TRANSFER", 
      description: "Sent 10 TOKEN", 
      date: "2023-10-15T09:20:00Z",
      hash: "0xghi...789", 
      status: "SUCCESS" 
    },
    { 
      id: 4, 
      type: "VERIFICATION", 
      description: "Completed KYC", 
      date: "2023-10-10T16:15:00Z",
      hash: "", 
      status: "SUCCESS" 
    },
  ],
};

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function Dashboard() {
  const [userData, setUserData] = useState(MOCK_USER_DATA);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // In the future, this will fetch real data from the blockchain
  useEffect(() => {
    // Mock data fetch
    const fetchUserData = async () => {
      try {
        // In a real implementation, this would be a blockchain call
        // const provider = new ethers.providers.Web3Provider(window.ethereum);
        // const contract = new ethers.Contract(contractAddress, contractABI, provider);
        // const score = await contract.getTrustScore(address);
        // const recentActivities = await contract.getUserActivity(address);
        // setUserData({ ...fetchedData });
        
        // For now, just use mock data
        setUserData(MOCK_USER_DATA);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Trigger confetti when a significant achievement is unlocked
  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

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
      <Confetti trigger={showConfetti} duration={3000} />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold text-white">Dashboard</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Trust Score & Tier */}
          <div className="col-span-1">
            <div className="space-y-6">
              {/* Trust Score Meter */}
              <GlassmorphismCard className="flex flex-col items-center justify-center p-6">
                <h2 className="mb-4 text-xl font-semibold text-white">Trust Score</h2>
                <div className="relative">
                  <AnimatedCircularProgressBar
                    value={userData.trustScore}
                    maxValue={1000}
                    size={200}
                    strokeWidth={15}
                    backgroundColor="rgba(255, 255, 255, 0.1)"
                    gradientColors={["#3b82f6", "#8b5cf6", "#ec4899"]}
                    duration={2}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-bold text-white">{userData.trustScore}</span>
                      <span className="text-sm text-gray-300">/1000</span>
                    </div>
                  </AnimatedCircularProgressBar>
                </div>
              </GlassmorphismCard>

              {/* Trust Badge */}
              <GlassmorphismCard className="flex flex-col items-center justify-center p-6">
                <h2 className="mb-4 text-xl font-semibold text-white">Your Badge</h2>
                <TrustBadge trustScore={userData.trustScore} className="h-48 w-48" />
              </GlassmorphismCard>
            </div>
          </div>

          {/* Middle Column - Recent Activity */}
          <div className="col-span-1">
            <GlassmorphismCard className="h-full p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                <motion.button
                  className="text-sm text-blue-400 hover:text-blue-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View All <ChevronRight className="ml-1 inline h-4 w-4" />
                </motion.button>
              </div>

              <div className="mt-4">
                <AnimatedList
                  items={userData.recentActivity}
                  keyExtractor={(item) => item.id}
                  itemClassName="mb-3"
                  staggerDelay={0.1}
                  renderItem={(activity) => (
                    <ShineBorderCard
                      className="relative overflow-hidden p-4"
                      borderClassName="border border-gray-700"
                      backgroundClassName="bg-gray-900/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-3 rounded-full bg-blue-900/30 p-2">
                            {activity.type === "MINT" && <Gift className="h-5 w-5 text-blue-400" />}
                            {activity.type === "AIRDROP" && <Gift className="h-5 w-5 text-purple-400" />}
                            {activity.type === "TRANSFER" && <Wallet className="h-5 w-5 text-green-400" />}
                            {activity.type === "VERIFICATION" && <Shield className="h-5 w-5 text-amber-400" />}
                          </div>
                          <div>
                            <div className="font-medium text-white">{activity.description}</div>
                            <div className="text-xs text-gray-400">{formatDate(activity.date)}</div>
                          </div>
                        </div>
                        {activity.hash && (
                          <a
                            href={`https://etherscan.io/tx/${activity.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </ShineBorderCard>
                  )}
                />
              </div>
            </GlassmorphismCard>
          </div>

          {/* Right Column - Quick Actions & Achievements */}
          <div className="col-span-1 space-y-6">
            {/* Quick Actions */}
            <GlassmorphismCard className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">Quick Actions</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <CoolMode
                  colors={["#3b82f6", "#8b5cf6", "#ec4899"]}
                  particleCount={15}
                >
                  <motion.button
                    className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white shadow-lg"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Gift className="mb-1 mx-auto h-6 w-6" />
                    <div>Mint NFT</div>
                  </motion.button>
                </CoolMode>

                <CoolMode
                  colors={["#8b5cf6", "#ec4899", "#f472b6"]}
                  particleCount={15}
                >
                  <motion.button
                    className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 text-white shadow-lg"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Gift className="mb-1 mx-auto h-6 w-6" />
                    <div>Create Airdrop</div>
                  </motion.button>
                </CoolMode>

                <CoolMode
                  colors={["#10b981", "#059669", "#047857"]}
                  particleCount={15}
                >
                  <motion.button
                    className="w-full rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 text-white shadow-lg"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Activity className="mb-1 mx-auto h-6 w-6" />
                    <div>View Activity</div>
                  </motion.button>
                </CoolMode>

                <CoolMode
                  colors={["#f59e0b", "#d97706", "#b45309"]}
                  particleCount={15}
                >
                  <motion.button
                    className="w-full rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-3 text-white shadow-lg"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Shield className="mb-1 mx-auto h-6 w-6" />
                    <div>KYC Verify</div>
                  </motion.button>
                </CoolMode>
              </div>
            </GlassmorphismCard>

            {/* Achievements */}
            <GlassmorphismCard className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Achievements</h2>
                <motion.button
                  className="text-sm text-blue-400 hover:text-blue-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View All <ChevronRight className="ml-1 inline h-4 w-4" />
                </motion.button>
              </div>

              <div className="mt-4 space-y-3">
                {userData.achievements.map((achievement) => (
                  <div key={achievement.id} className="relative overflow-hidden rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                    <div className="absolute -right-6 -top-6">
                      <Meteors
                        number={2}
                        className="from-purple-400 to-purple-600"
                      />
                    </div>
                    <div className="flex items-center">
                      <div className="mr-3 rounded-full bg-purple-900/30 p-2">
                        <achievement.icon className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{achievement.name}</div>
                        <div className="text-xs text-gray-400">{achievement.date}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassmorphismCard>
          </div>
        </div>
      </div>
    </div>
  );
} 