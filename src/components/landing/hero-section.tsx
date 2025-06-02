"use client";

import { motion } from "motion/react";
import { Particles } from "../magicui/particles";
import { SparklesText } from "../magicui/sparkles-text";
import { CustomConnectButton } from "../web3/connect-wallet-button";
import { AnimatedBackgroundBeam } from "./animated-background-beam";
import { useState } from "react";
import { TrustBadgeCard } from "../web3/trust-badge";
import { KycVerificationModal } from "../web3/kyc-verification-modal";

export function HeroSection() {
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [trustScore, setTrustScore] = useState(0);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  
  const handleStartKyc = () => {
    setIsKycModalOpen(true);
  };
  
  const handleKycCompleted = (score: number) => {
    setTrustScore(score);
    setIsKycVerified(true);
    // In a real implementation, we would get the user's address from their wallet
    setUserAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <Particles
          className="absolute inset-0 z-0"
          quantity={100}
          color="#4F46E5"
          vy={-0.2}
          vx={0.1}
        />
      </div>

      <div className="absolute left-1/4 top-1/3 h-[30rem] w-[30rem] rotate-[35deg] transform">
        <AnimatedBackgroundBeam beamColor="blue" />
      </div>

      <div className="absolute right-1/4 bottom-1/3 h-[30rem] w-[30rem] rotate-[75deg] transform">
        <AnimatedBackgroundBeam beamColor="emerald" />
      </div>

      {/* Hero content */}
      <div className="relative z-10 grid w-full max-w-7xl gap-12 lg:grid-cols-2">
        {/* Left column - Text content */}
        <motion.div
          className="flex flex-col items-center text-center lg:items-start lg:text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <SparklesText className="text-5xl font-extrabold leading-tight sm:text-6xl md:text-7xl">
              Graphite Ecosystem
            </SparklesText>
          </motion.h1>

          <motion.p
            className="mb-8 max-w-2xl text-xl text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Building the next generation of Web3 with trust-based identity verification,
            sybil-resistant airdrops, and tiered trust scores.
          </motion.p>

          <motion.div
            className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <CustomConnectButton className="px-8 py-3 text-lg" />
            <button 
              onClick={handleStartKyc}
              className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white transition-transform hover:scale-105"
            >
              Complete KYC
            </button>
          </motion.div>
        </motion.div>

        {/* Right column - Trust Badge Card */}
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <TrustBadgeCard
            trustScore={trustScore}
            kycVerified={isKycVerified}
            address={userAddress}
            className="w-[350px]"
          />
        </motion.div>
      </div>

      {/* KYC verification modal */}
      <KycVerificationModal 
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        onVerificationComplete={handleKycCompleted}
      />
    </section>
  );
} 