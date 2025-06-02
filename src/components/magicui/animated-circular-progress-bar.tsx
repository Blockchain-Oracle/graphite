"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AnimatedCircularProgressBarProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  foregroundColor?: string;
  gradientColors?: string[];
  label?: React.ReactNode;
  className?: string;
  animate?: boolean;
  duration?: number;
  children?: React.ReactNode;
}

export function AnimatedCircularProgressBar({
  value,
  maxValue = 100,
  size = 200,
  strokeWidth = 15,
  backgroundColor = "#1e293b",
  foregroundColor = "#3b82f6",
  gradientColors,
  label,
  className,
  animate = true,
  duration = 1.5,
  children,
}: AnimatedCircularProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(Math.max(value, 0), maxValue);
  const percentage = (normalizedValue / maxValue) * 100;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  // Gradient setup
  const gradientId = `progress-gradient-${Math.random().toString(36).substring(2, 9)}`;
  const hasGradient = Array.isArray(gradientColors) && gradientColors.length >= 2;

  useEffect(() => {
    if (animate) {
      setProgress(0);
      const timeout = setTimeout(() => {
        setProgress(percentage);
      }, 100);
      return () => clearTimeout(timeout);
    } else {
      setProgress(percentage);
    }
  }, [percentage, animate]);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* SVG for circular progress */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Define gradient if colors are provided */}
        {hasGradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {gradientColors.map((color, index) => (
                <stop
                  key={index}
                  offset={`${(index / (gradientColors.length - 1)) * 100}%`}
                  stopColor={color}
                />
              ))}
            </linearGradient>
          </defs>
        )}

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />

        {/* Foreground circle (progress) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={hasGradient ? `url(#${gradientId})` : foregroundColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : 0}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ 
            duration, 
            ease: "easeInOut" 
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
} 