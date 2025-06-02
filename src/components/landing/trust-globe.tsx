"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { TrustBadgeCloud } from "../magicui/trust-badge-cloud";
import { cn } from "@/lib/utils";

const trustTiers = [
  {
    id: 1,
    name: "Newcomer",
    description: "Enter the network with basic verification and begin building your trust score.",
    scoreRange: [0, 200],
    color: "bg-blue-500",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/50",
  },
  {
    id: 2,
    name: "Established",
    description: "Gain access to exclusive airdrops and ecosystem benefits with consistent activity.",
    scoreRange: [201, 400],
    color: "bg-green-500",
    textColor: "text-green-400",
    borderColor: "border-green-500/50",
  },
  {
    id: 3,
    name: "Trusted",
    description: "Unlock advanced features and gain priority access across integrated platforms.",
    scoreRange: [401, 600],
    color: "bg-purple-500",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/50",
  },
  {
    id: 4,
    name: "Influencer",
    description: "Become a node in the trust network, with the ability to vouch for others.",
    scoreRange: [601, 800],
    color: "bg-amber-500", 
    textColor: "text-amber-400",
    borderColor: "border-amber-500/50",
  },
  {
    id: 5,
    name: "Authority",
    description: "Gain governance rights and help shape the future of the Graphite ecosystem.",
    scoreRange: [801, 1000],
    color: "bg-pink-500",
    textColor: "text-pink-400",
    borderColor: "border-pink-500/50",
  },
];

export function TrustGlobeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTier, setActiveTier] = useState<number>(0);

  return (
    <section id="network" className="relative overflow-hidden bg-gradient-to-b from-black via-blue-950/20 to-black px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            The Graphite Trust Network
          </motion.h2>
          <motion.p 
            className="mx-auto mt-4 max-w-2xl text-xl text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Explore trust badges across the global Web3 ecosystem
          </motion.p>
        </div>
        
        {/* Tier filter buttons */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <button 
            className={cn(
              "rounded-full px-4 py-1 text-sm font-medium transition-colors",
              activeTier === 0 ? "bg-white text-black" : "bg-black/30 text-white hover:bg-black/50"
            )}
            onClick={() => setActiveTier(0)}
          >
            All Tiers
          </button>
          {trustTiers.map((tier) => (
            <button
              key={tier.id}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-1 text-sm font-medium transition-colors",
                activeTier === tier.id ? 
                  cn("bg-gradient-to-r text-white", 
                    tier.color.replace("bg-", "from-").replace("500", "600"), 
                    tier.color.replace("bg-", "to-").replace("500", "400")
                  ) : 
                  cn("bg-black/30 hover:bg-black/50", tier.textColor)
              )}
              onClick={() => setActiveTier(tier.id)}
            >
              <Image 
                src={`/trust-badges/tier-${tier.id}.svg`} 
                alt={`Tier ${tier.id}`}
                width={16}
                height={16}
                className="h-4 w-4"
              />
              {tier.name}
            </button>
          ))}
        </div>
        
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div 
            className="order-2 lg:order-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="mb-6 text-2xl font-bold text-white">
              Trust Tiers & Network Effects
            </h3>
            
            <div className="space-y-6">
              {trustTiers.map((tier) => (
                <div 
                  key={tier.id}
                  className="flex items-start gap-4 group cursor-pointer transition-all"
                  onClick={() => setActiveTier(tier.id)}
                >
                  <div className="relative mt-1">
                    <Image 
                      src={`/trust-badges/tier-${tier.id}.svg`} 
                      alt={`Tier ${tier.id} Badge`}
                      width={48}
                      height={48}
                      className={cn(
                        "h-12 w-12 transition-all duration-300",
                        activeTier === tier.id ? "scale-110" : "group-hover:scale-105"
                      )}
                    />
                    
                    {/* Highlight glow when active */}
                    {activeTier === tier.id && (
                      <motion.div 
                        className="absolute -inset-1 -z-10 rounded-full blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          background: `radial-gradient(circle, ${tier.color.replace('bg-', '')}80 0%, transparent 70%)`
                        }}
                      />
                    )}
                  </div>
                  
                  <div>
                    <h4 className={cn(
                      "text-xl font-medium transition-colors",
                      activeTier === tier.id ? tier.textColor : "text-white group-hover:underline"
                    )}>
                      Tier {tier.id}: {tier.name}
                    </h4>
                    <p className={cn(
                      "text-gray-400 transition-opacity",
                      activeTier === tier.id ? "opacity-100" : "opacity-80"
                    )}>
                      {tier.description}
                    </p>
                    
                    {/* Only show score range when active */}
                    {activeTier === tier.id && (
                      <motion.div 
                        className="mt-1 text-sm text-gray-500"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                      >
                        Score range: <span className={tier.textColor}>{tier.scoreRange[0]} - {tier.scoreRange[1]}</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            ref={containerRef} 
            className="order-1 lg:order-2 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <TrustBadgeCloud />
          </motion.div>
        </div>
      </div>
    </section>
  );
} 