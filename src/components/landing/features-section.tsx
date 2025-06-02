"use client";

import { motion } from "motion/react";
import { GlassmorphismCard } from "../ui/glassmorphism-card";
import { 
  UserRoundCheck, 
  AreaChart, 
  Layers, 
  Shield 
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      title: "Dynamic NFT Avatars",
      description: "Personalized NFT avatars that evolve and gain new visual effects as your trust score increases.",
      icon: <Layers strokeWidth={1.5} className="h-10 w-10" />,
      color: "blue",
    },
    {
      title: "Trust Score System",
      description: "A comprehensive trust scoring system based on on-chain activity and community participation.",
      icon: <AreaChart strokeWidth={1.5} className="h-10 w-10" />,
      color: "green",
    },
    {
      title: "Sybil-resistant Airdrops",
      description: "Create token distributions restricted by trust tiers to prevent farming and ensure fair allocation.",
      icon: <UserRoundCheck strokeWidth={1.5} className="h-10 w-10" />,
      color: "purple",
    },
    {
      title: "Secure Ecosystem",
      description: "Built on secure, audited smart contracts with seamless wallet integration and user experience.",
      icon: <Shield strokeWidth={1.5} className="h-10 w-10" />,
      color: "gold",
    },
  ];

  return (
    <section id="features" className="bg-black px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <motion.h2 
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Powering the Next Generation of Web3
          </motion.h2>
          <motion.p 
            className="mx-auto mt-4 max-w-2xl text-xl text-gray-400"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Our ecosystem provides the tools you need to build trust and reward genuine participation.
          </motion.p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.8, 
                delay: 0.2 + index * 0.1 
              }}
            >
              <GlassmorphismCard
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                color={feature.color as "blue" | "green" | "purple" | "gold"}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 