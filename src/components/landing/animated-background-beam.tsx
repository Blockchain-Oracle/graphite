"use client";

import { motion } from "motion/react";

interface AnimatedBackgroundBeamProps {
  beamColor?: "blue" | "green" | "emerald" | "purple" | "rose";
}

export function AnimatedBackgroundBeam({
  beamColor = "blue",
}: AnimatedBackgroundBeamProps) {
  // Color mapping for gradient stops
  const colorMap = {
    blue: ["#0036C6", "#5E89FB"],
    green: ["#00632C", "#48BB78"],
    emerald: ["#064E3B", "#34D399"],
    purple: ["#581C87", "#A855F7"],
    rose: ["#9D174D", "#EC4899"],
  };

  const [colorStart, colorEnd] = colorMap[beamColor];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-full bg-black/20 opacity-60">
      <motion.div
        initial={{ rotate: 0 }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0"
        style={{
          background: `conic-gradient(from 90deg at 50% 50%, ${colorStart} 0%, ${colorEnd} 25%, transparent 50%)`,
        }}
      />
    </div>
  );
} 