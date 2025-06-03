"use client";

import { motion } from "framer-motion";
import { Particles } from "../magicui/particles";
import { SparklesText } from "../magicui/sparkles-text";
import { CustomConnectButton } from "../web3/connect-wallet-button";
import { AnimatedBackgroundBeam } from "./animated-background-beam";
import { useState, useEffect } from "react";
import { TrustBadgeCard } from "../web3/trust-badge";
import { KycVerificationModal } from "../web3/kyc-verification-modal";
import { useKYC } from "@/lib/hooks/useKYC";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const { 
    reputationScore,
    isKycVerified,
    isReputationLoading,
    address: kycHookAddress,
    kycLevel 
  } = useKYC();
  const { address: connectedAddress, isConnected } = useAccount();

  const displayAddress = connectedAddress || kycHookAddress || "";
  const actualTrustScore = reputationScore ?? 0;
  const actualIsKycVerified = isKycVerified ?? (kycLevel != null && kycLevel > BigInt(0));

  const handleStartKyc = () => {
    setIsKycModalOpen(true);
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
            {isConnected && (
              <motion.div
                animate={!actualIsKycVerified ? { 
                  scale: [1, 1.05, 1, 1.05, 1],
                  boxShadow: ["0 0 0px #6366f1", "0 0 20px #6366f1", "0 0 0px #6366f1", "0 0 20px #6366f1", "0 0 0px #6366f1"],
                } : {}}
                transition={!actualIsKycVerified ? {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut"
                } : {}}
                className="rounded-full"
              >
                <Button 
                  onClick={handleStartKyc}
                  className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white transition-transform hover:scale-105"
                  disabled={isReputationLoading}
                >
                  {isReputationLoading
                    ? "Loading Status..."
                    : actualIsKycVerified
                    ? "KYC Verified!"
                    : "Complete KYC"}
                </Button>
              </motion.div>
            )}
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
            trustScore={actualTrustScore}
            kycVerified={actualIsKycVerified}
            address={displayAddress}
            isLoading={isReputationLoading}
            className="w-[350px]"
          />
        </motion.div>
      </div>

      {/* KYC verification modal */}
      {isConnected && (
        <KycVerificationModal 
          isOpen={isKycModalOpen}
          onClose={() => setIsKycModalOpen(false)}
        />
      )}
    </section>
  );
} 