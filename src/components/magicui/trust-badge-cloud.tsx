"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { IconCloud } from "@/components/magicui/icon-cloud";
import { Lens } from "@/components/magicui/lens";
import { ScratchToReveal } from "@/components/magicui/scratch-to-reveal";
import { cn } from "@/lib/utils";

// Trust tiers data
const trustTiers = [
  {
    id: 1,
    name: "Newcomer",
    description: "Enter the network with basic verification and begin building your trust score.",
    scoreRange: [0, 200],
    color: "from-blue-400 to-blue-500",
    baseColor: "#3B82F6",
    textColor: "text-blue-400",
  },
  {
    id: 2,
    name: "Established",
    description: "Gain access to exclusive airdrops and ecosystem benefits with consistent activity.",
    scoreRange: [201, 400],
    color: "from-green-400 to-green-500",
    baseColor: "#22C55E",
    textColor: "text-green-400",
  },
  {
    id: 3,
    name: "Trusted",
    description: "Unlock advanced features and gain priority access across integrated platforms.",
    scoreRange: [401, 600],
    color: "from-purple-400 to-purple-500",
    baseColor: "#8B5CF6",
    textColor: "text-purple-400",
  },
  {
    id: 4,
    name: "Influencer",
    description: "Become a node in the trust network, with the ability to vouch for others.",
    scoreRange: [601, 800],
    color: "from-amber-400 to-amber-500",
    baseColor: "#F59E0B",
    textColor: "text-amber-400",
  },
  {
    id: 5,
    name: "Authority",
    description: "Gain governance rights and help shape the future of the Graphite ecosystem.",
    scoreRange: [801, 1000],
    color: "from-pink-400 to-pink-500",
    baseColor: "#EC4899",
    textColor: "text-pink-400",
  },
];

// Network user profile data
const networkProfiles = [
  {
    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    name: "San Francisco Hub",
    tier: 5,
    trustScore: 950,
  },
  {
    address: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    name: "New York Hub",
    tier: 5, 
    trustScore: 920,
  },
  {
    address: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
    name: "London Hub",
    tier: 5,
    trustScore: 910,
  },
  {
    address: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
    name: "Tokyo Hub",
    tier: 4,
    trustScore: 780,
  },
  {
    address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    name: "Singapore Hub",
    tier: 4,
    trustScore: 760,
  },
  {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    name: "Zug (Crypto Valley)",
    tier: 4,
    trustScore: 720,
  },
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    name: "Sydney Node",
    tier: 3,
    trustScore: 580,
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    name: "Toronto Node",
    tier: 3,
    trustScore: 550,
  },
  {
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    name: "Berlin Node",
    tier: 3,
    trustScore: 520,
  },
  {
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    name: "Paris Node",
    tier: 2,
    trustScore: 380,
  },
  {
    address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    name: "Moscow Node",
    tier: 2,
    trustScore: 340,
  },
  {
    address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    name: "São Paulo Node",
    tier: 2,
    trustScore: 320,
  },
  {
    address: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    name: "New Delhi Node",
    tier: 1,
    trustScore: 180,
  },
  {
    address: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    name: "Barcelona Node",
    tier: 1,
    trustScore: 160,
  },
  {
    address: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    name: "Ottawa Node",
    tier: 1,
    trustScore: 150,
  },
];

// Trust Badge component for the cloud
const TrustBadge = ({ tier }: { tier: number }) => (
  <div className="relative h-20 w-20 overflow-hidden">
    <Image
      src={`/trust-badges/tier-${tier}.svg`}
      alt={`Tier ${tier} Badge`}
      width={80}
      height={80}
      className="h-full w-full"
    />
  </div>
);

interface TrustBadgeCloudProps {
  className?: string;
}

export function TrustBadgeCloud({ className }: TrustBadgeCloudProps) {
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [badgePositions, setBadgePositions] = useState<Array<{x: number, y: number}>>([]);
  const [isProfileRevealed, setIsProfileRevealed] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

  // Generate badge images for the cloud
  const generateBadgeImages = () => {
    return networkProfiles.map((profile) => `/trust-badges/tier-${profile.tier}.svg`);
  };

  // Calculate badge positions when container dimensions change
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerDimensions({ width, height });
      
      // Generate positions for the clickable areas
      const newPositions = networkProfiles.map(() => {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        
        return {
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance
        };
      });
      
      setBadgePositions(newPositions);
      
      // Set initial lens position to center
      setLensPosition({ x: width / 2, y: height / 2 });
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width, height });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle badge click in the cloud
  const handleBadgeClick = (index: number) => {
    setSelectedProfile(networkProfiles[index % networkProfiles.length]);
    
    // Set lens position to the clicked badge position
    if (badgePositions[index]) {
      setLensPosition(badgePositions[index]);
    }
  };

  useEffect(() => {
    if (selectedProfile) {
      setProfileVisible(true);
      setIsProfileRevealed(false); // Reset reveal state when new profile selected
    }
  }, [selectedProfile]);

  // Helper function to get color based on tier
  const getTierColor = (tier: number): string => {
    switch(tier) {
      case 1: return "#3B82F6"; // blue
      case 2: return "#22C55E"; // green
      case 3: return "#8B5CF6"; // purple
      case 4: return "#F59E0B"; // amber
      case 5: return "#EC4899"; // pink
      default: return "#3B82F6";
    }
  };
  
  // Format wallet address
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleClose = () => {
    setProfileVisible(false);
    setTimeout(() => {
      setSelectedProfile(null);
      setIsProfileRevealed(false);
    }, 300);
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative flex h-[600px] w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 to-slate-900",
        className
      )}
    >
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <Lens
          isStatic={!!selectedProfile}
          position={lensPosition}
          lensSize={280}
          zoomFactor={1.2}
          lensColor="white"
          duration={0.3}
        >
          <div className="relative h-full w-full flex items-center justify-center">
            <IconCloud
              images={generateBadgeImages()}
            />
            
            {/* Overlay points of light for ambiance */}
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-1 w-1 rounded-full bg-white"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.5 + 0.2,
                    animation: `twinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </Lens>
      </div>

      {/* Clickable zones for each badge */}
      <div className="absolute inset-0 z-20 pointer-events-auto">
        {badgePositions.map((position, index) => (
          <button
            key={index}
            className="absolute h-20 w-20 cursor-pointer transition-transform hover:scale-110"
            style={{
              left: `${position.x - 40}px`,
              top: `${position.y - 40}px`,
              opacity: 0.01, // Almost invisible but clickable
              border: "1px dashed rgba(255,255,255,0.1)"
            }}
            onClick={() => handleBadgeClick(index)}
            aria-label={`Select profile ${index + 1}`}
          />
        ))}
      </div>

      {/* Selected profile info */}
      {selectedProfile && (
        <motion.div 
          className="absolute inset-x-0 bottom-0 z-30 overflow-hidden rounded-t-2xl bg-black/80 backdrop-blur-lg"
          initial={{ y: "100%" }}
          animate={{ y: profileVisible ? "0%" : "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <div className="relative px-6 pb-8 pt-6">
            <button 
              onClick={handleClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              ✕
            </button>
            
            {isProfileRevealed ? (
              <ProfileContent profile={selectedProfile} />
            ) : (
              <div className="flex justify-center items-center py-12">
                <ScratchToReveal
                  width={300}
                  height={200}
                  minScratchPercentage={30}
                  onComplete={() => setIsProfileRevealed(true)}
                  gradientColors={[
                    getTierColor(selectedProfile.tier),
                    "#1e293b",
                    "#0f172a"
                  ]}
                >
                  <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 rounded-lg p-4">
                    <ProfileContent profile={selectedProfile} />
                  </div>
                </ScratchToReveal>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Instruction tooltip */}
      {!selectedProfile && (
        <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white backdrop-blur-sm">
          Click on badges in the cloud to reveal trust profiles
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 z-20 h-20 bg-gradient-to-b from-slate-950 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-slate-950 to-transparent" />

      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// Profile content component
function ProfileContent({ profile }: { profile: any }) {
  const tier = trustTiers[profile.tier - 1];
  
  return (
    <div className="w-full">
      <div className="flex items-start gap-4">
        <div className="relative">
          <Image
            src={`/trust-badges/tier-${profile.tier}.svg`}
            alt={`Tier ${profile.tier} Badge`}
            width={80}
            height={80}
            className="h-20 w-20"
          />
          <motion.div 
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 1.4] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatType: "loop" 
            }}
            style={{
              background: `radial-gradient(circle, ${tier.baseColor}40 0%, transparent 70%)`,
            }}
          />
        </div>
        
        <div>
          <motion.h3 
            className="text-2xl font-bold text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {profile.name}
          </motion.h3>
          
          <motion.div
            className={cn("mb-1 text-sm", tier.textColor)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {tier.name} (Tier {profile.tier})
          </motion.div>
          
          <motion.div 
            className="text-xs text-gray-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {profile.address.substring(0, 6)}...{profile.address.substring(profile.address.length - 4)}
          </motion.div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <motion.div 
          className="rounded-lg bg-white/10 p-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-sm text-gray-400">Trust Score</div>
          <div className="text-xl font-bold text-white">{profile.trustScore}</div>
          <div className="mt-1 h-2 rounded-full bg-gray-700">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r"
              style={{
                width: `${profile.trustScore / 10}%`,
                backgroundImage: `linear-gradient(to right, ${tier.color.replace('from-', '').replace('to-', '')})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${profile.trustScore / 10}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </div>
        </motion.div>
        
        <motion.div 
          className="rounded-lg bg-white/10 p-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-sm text-gray-400">Score Range</div>
          <div className="text-xl font-bold text-white">
            {tier.scoreRange[0]} - {tier.scoreRange[1]}
          </div>
          <div className="mt-1 flex items-center gap-1">
            <div className={cn("h-2 w-2 rounded-full", tier.textColor)} />
            <span className="text-xs text-gray-400">{tier.name} tier</span>
          </div>
        </motion.div>
      </div>
      
      <motion.p 
        className="mt-4 text-sm text-gray-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {tier.description}
      </motion.p>
    </div>
  );
} 