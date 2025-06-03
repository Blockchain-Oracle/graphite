"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Import MagicUI components
import { ShineBorderCard } from "@/components/magicui/shine-border";
import { Meteors } from "@/components/magicui/meteors";
import { Skeleton } from "@/components/ui/skeleton";

interface TrustBadgeProps {
  trustScore: number;
  className?: string;
  address?: string;
  kycVerified?: boolean;
  isLoading?: boolean;
}

const trustTiers = [
  {
    name: "Newcomer",
    range: [0, 200],
    color: "from-blue-400 to-blue-500",
    baseColor: "bg-blue-900/20",
    borderColor: "border-blue-500/50",
    shadowColor: "rgba(59, 130, 246, 0.5)",
    iconUrl: "/trust-badges/tier-1.svg",
    glowIntensity: "opacity-20",
    meteorColor: "from-blue-400 to-blue-600",
    gradientColors: ["rgba(59, 130, 246, 0.2)", "rgba(37, 99, 235, 0.1)"],
  },
  {
    name: "Established",
    range: [201, 400],
    color: "from-green-400 to-green-500",
    baseColor: "bg-green-900/20",
    borderColor: "border-green-500/50",
    shadowColor: "rgba(52, 211, 153, 0.5)",
    iconUrl: "/trust-badges/tier-2.svg",
    glowIntensity: "opacity-30",
    meteorColor: "from-green-400 to-green-600",
    gradientColors: ["rgba(52, 211, 153, 0.2)", "rgba(16, 185, 129, 0.1)"],
  },
  {
    name: "Trusted",
    range: [401, 600],
    color: "from-purple-400 to-purple-500",
    baseColor: "bg-purple-900/20",
    borderColor: "border-purple-500/50",
    shadowColor: "rgba(139, 92, 246, 0.5)",
    iconUrl: "/trust-badges/tier-3.svg",
    glowIntensity: "opacity-40",
    meteorColor: "from-purple-400 to-purple-600",
    gradientColors: ["rgba(139, 92, 246, 0.2)", "rgba(124, 58, 237, 0.1)"],
  },
  {
    name: "Influencer",
    range: [601, 800],
    color: "from-amber-400 to-amber-500",
    baseColor: "bg-amber-900/20",
    borderColor: "border-amber-500/50",
    shadowColor: "rgba(245, 158, 11, 0.5)",
    iconUrl: "/trust-badges/tier-4.svg",
    glowIntensity: "opacity-50",
    meteorColor: "from-amber-400 to-amber-600",
    gradientColors: ["rgba(245, 158, 11, 0.2)", "rgba(217, 119, 6, 0.1)"],
  },
  {
    name: "Authority",
    range: [801, 1000],
    color: "from-pink-400 to-pink-500",
    baseColor: "bg-pink-900/20",
    borderColor: "border-pink-500/50",
    shadowColor: "rgba(236, 72, 153, 0.5)",
    iconUrl: "/trust-badges/tier-5.svg",
    glowIntensity: "opacity-60",
    meteorColor: "from-pink-400 to-pink-600",
    gradientColors: ["rgba(236, 72, 153, 0.2)", "rgba(219, 39, 119, 0.1)"],
  },
];

function getTrustTier(score: number) {
  return (
    trustTiers.find(
      (tier) => score >= tier.range[0] && score <= tier.range[1]
    ) || trustTiers[0]
  );
}

export function TrustBadge({ trustScore, className, isLoading }: TrustBadgeProps) {
  const [isHovering, setIsHovering] = useState(false);
  const tier = getTrustTier(trustScore);

  if (isLoading) {
    return (
      <div className={cn("relative z-10 h-60 w-60", className)}>
        <Skeleton className="h-full w-full rounded-full bg-gray-700/50" />
      </div>
    );
  }

  return (
    <motion.div
      className={cn("relative z-10 h-60 w-60", className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ShineBorderCard
        className={cn(
          "relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-full",
          tier.baseColor,
          tier.borderColor
        )}
        borderClassName={`border-2 ${tier.borderColor} bg-opacity-10`}
        backgroundClassName="bg-black/5 backdrop-blur-sm"
        duration={isHovering ? 2 : 4}
        size={isHovering ? 800 : 500}
        shine={tier.gradientColors}
        containerClassName="rounded-full"
      >
        {/* Badge glow effect */}
        <div
          className={`absolute inset-0 -z-10 rounded-full ${tier.glowIntensity} blur-2xl`}
          style={{
            background: `radial-gradient(circle at center, ${tier.shadowColor}, transparent 70%)`,
          }}
        />

        {/* Animated meteors */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <Meteors
            number={isHovering ? 6 : 2}
            className={`${tier.meteorColor}`}
          />
        </div>

        <motion.div
          className="z-10 flex h-full w-full flex-col items-center justify-center p-6"
          initial={{ scale: 0.95, opacity: 0.8 }}
          animate={{
            scale: isHovering ? 1.05 : 1,
            opacity: 1,
            y: isHovering ? -5 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Badge shape - using actual SVG badge */}
          <motion.div 
            className="mb-2 flex h-28 w-28 items-center justify-center overflow-hidden"
            animate={{ 
              rotateY: isHovering ? 360 : 0,
              scale: isHovering ? 1.1 : 1
            }}
            transition={{ 
              rotateY: { duration: 1.5 },
              scale: { duration: 0.5 }
            }}
          >
            <Image
              src={tier.iconUrl}
              alt={`${tier.name} Badge`}
              width={112}
              height={112}
              className="h-full w-full object-contain"
              priority
            />
          </motion.div>

          {/* Trust Score */}
          <motion.div 
            className="mb-1 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent"
            style={{ 
              backgroundImage: `linear-gradient(to right, ${tier.gradientColors[0]}, ${tier.gradientColors[1].replace('0.1', '0.9')})` 
            }}
            animate={{
              backgroundPosition: isHovering ? ["0% 50%", "100% 50%", "0% 50%"] : "0% 50%"
            }}
            transition={{
              duration: 3,
              repeat: isHovering ? Infinity : 0
            }}
          >
            {trustScore}
          </motion.div>
          
          <motion.div 
            className="text-xl font-medium text-white"
            animate={{
              scale: isHovering ? [1, 1.05, 1] : 1
            }}
            transition={{
              duration: 1.5,
              repeat: isHovering ? Infinity : 0
            }}
          >
            {tier.name}
          </motion.div>
        </motion.div>
      </ShineBorderCard>
    </motion.div>
  );
}

export function TrustBadgeCard({
  trustScore,
  address,
  kycVerified,
  className,
  isLoading,
}: TrustBadgeProps) {
  console.log('[TrustBadgeCard] Props Received:', { trustScore, address, kycVerified, isLoading });

  const tier = getTrustTier(trustScore);
  const [isHovering, setIsHovering] = useState(false);

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return "";
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    console.log('[TrustBadgeCard] Rendering Skeleton because isLoading is true.');
    return (
      <div className={cn("group relative overflow-hidden rounded-xl bg-black/30 p-6 backdrop-blur-lg", className)}>
        <Skeleton className="h-[350px] w-full rounded-lg bg-gray-700/50" />
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-xl bg-black/30 p-6 backdrop-blur-lg",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Animated border */}
      <div
        className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
          isHovering ? "opacity-100" : "opacity-30"
        }`}
        style={{
          background: `linear-gradient(45deg, transparent, ${tier.shadowColor}, transparent)`,
          backgroundSize: "200% 200%",
          animation: isHovering
            ? "gradient-animation 2s ease infinite"
            : "none",
        }}
      />

      {/* Inner content with subtle gradient background */}
      <div className="relative z-10 flex flex-col items-center space-y-6 rounded-lg p-4">
        <TrustBadge trustScore={trustScore} isLoading={isLoading} />

        <div className="text-center">
          {address && (
            <div className="mb-2 text-sm text-gray-400">
              {formatAddress(address)}
            </div>
          )}
          {(kycVerified && console.log('[TrustBadgeCard] kycVerified is true, attempting to render KYC status.'), null)}
          {kycVerified && (
            <div className="flex items-center justify-center space-x-1 text-green-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-xs font-medium">KYC Verified</span>
            </div>
          )}
        </div>

        <motion.button
          className={cn(
            "mt-4 w-full rounded-md bg-gradient-to-r px-4 py-2 text-sm font-medium text-white shadow-lg",
            `${tier.color}`
          )}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <h3 className="mb-2 text-xl font-semibold text-white">Create Your Identity</h3>
          <p className="text-sm text-white/80">
            Complete KYC to increase your trust score
          </p>
        </motion.button>
      </div>
      
      {/* Subtle meteors in the background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Meteors 
          number={isHovering ? 5 : 2} 
          className={`${tier.meteorColor}`}
        />
      </div>
      
      <style jsx global>{`
        @keyframes gradient-animation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </motion.div>
  );
} 