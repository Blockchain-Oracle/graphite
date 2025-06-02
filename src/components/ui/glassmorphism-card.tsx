"use client";

import { motion, HTMLMotionProps } from "motion/react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface GlassmorphismCardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  color?: "blue" | "green" | "purple" | "gold";
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassmorphismCard({ 
  title, 
  description, 
  icon, 
  color = "blue", 
  children, 
  className,
  onClick
}: GlassmorphismCardProps) {
  const colorVariants = {
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
    green: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
    gold: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
  };

  const iconColorVariants = {
    blue: "text-blue-400",
    green: "text-emerald-400",
    purple: "text-purple-400",
    gold: "text-amber-400",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "overflow-hidden rounded-xl border bg-gradient-to-b backdrop-blur-lg p-6",
        colorVariants[color],
        className
      )}
      onClick={onClick}
    >
      {children ? (
        children
      ) : (
        <div className="relative z-10 flex flex-col gap-4">
          {icon && <div className={cn("text-3xl", iconColorVariants[color])}>{icon}</div>}
          {title && <h3 className="text-xl font-bold text-white">{title}</h3>}
          {description && <p className="text-gray-300">{description}</p>}
        </div>
      )}
    </motion.div>
  );
} 