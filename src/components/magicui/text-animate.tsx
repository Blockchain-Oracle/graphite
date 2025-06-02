"use client";

import { useEffect, useState, createElement, ElementType } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type AnimationType = "fade" | "bounce" | "wave" | "sparkle";

interface TextAnimateProps {
  text: string;
  className?: string;
  el?: ElementType;
  animationType?: AnimationType;
  delay?: number;
  duration?: number;
  staggerChildren?: number;
}

export function TextAnimate({
  text,
  className,
  el = "span",
  animationType = "fade",
  delay = 0,
  duration = 0.5,
  staggerChildren = 0.05,
}: TextAnimateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return createElement(el, { className }, text);
  }

  const letters = text.split("");

  const animations = {
    fade: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: (i: number) => ({
        delay: delay + i * staggerChildren,
        duration,
      }),
    },
    bounce: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: (i: number) => ({
        delay: delay + i * staggerChildren,
        duration,
        type: "spring",
        stiffness: 400,
        damping: 15,
      }),
    },
    wave: {
      initial: { opacity: 0, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: (i: number) => ({
        delay: delay + i * staggerChildren,
        duration,
        repeat: Infinity,
        repeatType: "mirror" as const,
        repeatDelay: 5,
        y: {
          duration: 0.4,
          repeat: Infinity,
          repeatType: "mirror" as const,
          ease: "easeInOut",
          type: "keyframes",
          keyframes: [0, -10, 0],
        },
      }),
    },
    sparkle: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      transition: (i: number) => ({
        delay: delay + i * staggerChildren,
        duration,
        repeat: 1,
        repeatType: "reverse" as const,
        repeatDelay: Math.random() * 2 + 3,
      }),
    },
  };

  const { initial, animate, transition } = animations[animationType];

  return createElement(
    el,
    { className },
    letters.map((letter, i) => (
      <motion.span
        key={`${letter}-${i}`}
        initial={initial}
        animate={animate}
        transition={transition(i)}
        className={cn(
          "inline-block",
          animationType === "sparkle" && "relative"
        )}
      >
        {letter === " " ? "\u00A0" : letter}
        {animationType === "sparkle" && (
          <motion.span
            className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 -translate-y-full rounded-full bg-blue-400 opacity-0"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: -10,
            }}
            transition={{
              delay: delay + i * staggerChildren + duration / 2,
              duration: duration * 1.5,
              repeat: 1,
              repeatDelay: Math.random() * 2 + 3,
              repeatType: "loop",
            }}
          />
        )}
      </motion.span>
    ))
  );
} 