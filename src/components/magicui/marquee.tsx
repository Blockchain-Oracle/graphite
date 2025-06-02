"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, useAnimationControls, useScroll, useTransform } from "motion/react";

interface MarqueeProps {
  children: React.ReactNode;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  speed?: number;
  className?: string;
  containerClassName?: string;
  reverse?: boolean;
  autoFill?: boolean;
  inverted?: boolean;
  pauseAtStart?: boolean;
}

export function Marquee({
  children,
  direction = "left",
  pauseOnHover = false,
  speed = 40,
  className,
  containerClassName,
  reverse = false,
  autoFill = false,
  inverted = false,
  pauseAtStart = false,
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [duplicates, setDuplicates] = useState(1);
  const [isPaused, setIsPaused] = useState(pauseAtStart);
  const controls = useAnimationControls();
  const shouldReverseDirection = reverse ? direction !== "left" : direction === "left";

  // Calculate animation duration based on container width and speed
  const duration = containerWidth / speed;

  // Calculate how many duplicates we need if autoFill is enabled
  useEffect(() => {
    if (!autoFill || !containerRef.current) return;

    const calculateDuplicates = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const childrenWidth = containerRef.current.scrollWidth;
      
      // Ensure we have enough duplicates to fill the screen plus some extra
      const duplicatesNeeded = Math.ceil((containerWidth * 2) / childrenWidth) + 1;
      setDuplicates(Math.max(duplicatesNeeded, 1));
      setContainerWidth(containerWidth);
    };

    calculateDuplicates();
    window.addEventListener("resize", calculateDuplicates);

    return () => {
      window.removeEventListener("resize", calculateDuplicates);
    };
  }, [autoFill, children]);

  useEffect(() => {
    if (isPaused) {
      controls.stop();
    } else {
      controls.start("animate");
    }
  }, [isPaused, controls]);

  return (
    <div
      className={cn("flex overflow-hidden", containerClassName)}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      style={{
        maskImage: inverted
          ? "linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 1) 10%, rgba(0, 0, 0, 1) 90%, transparent 100%)"
          : undefined,
      }}
    >
      <motion.div
        ref={containerRef}
        className={cn("flex flex-nowrap", className)}
        variants={{
          animate: {
            x: shouldReverseDirection
              ? [0, -containerWidth]
              : [-containerWidth, 0],
          },
        }}
        initial={isPaused ? "animate" : "initial"}
        animate={controls}
        transition={{
          duration,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        }}
      >
        {React.Children.map(children, (child, i) => (
          <div key={`original-${i}`} className="flex-shrink-0">
            {child}
          </div>
        ))}

        {autoFill &&
          Array.from({ length: duplicates }).map((_, duplicateIndex) =>
            React.Children.map(children, (child, childIndex) => (
              <div
                key={`duplicate-${duplicateIndex}-${childIndex}`}
                className="flex-shrink-0"
              >
                {child}
              </div>
            ))
          )}
      </motion.div>
    </div>
  );
} 