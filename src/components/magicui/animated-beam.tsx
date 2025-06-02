"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedBeamProps {
  className?: string;
  size?: number;
  glowSize?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  children?: React.ReactNode;
  infinite?: boolean;
  intensity?: number;
}

export function AnimatedBeam({
  className,
  size = 100,
  glowSize = 20,
  duration = 2,
  delay = 0,
  colorFrom = "rgba(120, 119, 198, 0.8)",
  colorTo = "rgba(236, 72, 153, 0.8)",
  children,
  infinite = true,
  intensity = 1,
}: AnimatedBeamProps) {
  const [randomOffset] = useState(() => Math.random() * 1000);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay]);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ opacity: isVisible ? 1 : 0, transition: `opacity ${duration}s ease-in-out` }}
    >
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, intensity, 0],
        }}
        transition={{
          duration: duration,
          repeat: infinite ? Infinity : 0,
          delay: delay + randomOffset / 1000,
          ease: "easeInOut",
        }}
      />

      {/* Animated beam */}
      <motion.div
        className="absolute inset-0 z-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [1, 1, 1],
          opacity: [0, 1, 0],
        }}
        style={{
          background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
        }}
        transition={{
          duration: duration,
          repeat: infinite ? Infinity : 0,
          delay: delay,
          ease: "easeInOut",
        }}
      />

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 z-0 blur-xl"
        style={{
          background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
          filter: `blur(${glowSize}px)`,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: duration * 1.2,
          repeat: infinite ? Infinity : 0,
          delay: delay,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      {children && (
        <div className="relative z-20 h-full w-full">{children}</div>
      )}
    </div>
  );
}

interface AnimatedBeamsContainerProps {
  className?: string;
  beams?: number;
  children?: React.ReactNode;
  colorFrom?: string;
  colorTo?: string;
  duration?: number;
  infinite?: boolean;
  intensity?: number;
}

export function AnimatedBeamsContainer({
  className,
  beams = 3,
  children,
  colorFrom = "rgba(120, 119, 198, 0.8)",
  colorTo = "rgba(236, 72, 153, 0.8)",
  duration = 2,
  infinite = true,
  intensity = 0.5,
}: AnimatedBeamsContainerProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Generate multiple beams */}
      {Array.from({ length: beams }).map((_, index) => (
        <AnimatedBeam
          key={index}
          colorFrom={colorFrom}
          colorTo={colorTo}
          duration={duration}
          delay={index * (duration / beams)}
          infinite={infinite}
          intensity={intensity}
          className="absolute inset-0"
        />
      ))}

      {/* Content */}
      {children && <div className="relative z-20">{children}</div>}
    </div>
  );
}
