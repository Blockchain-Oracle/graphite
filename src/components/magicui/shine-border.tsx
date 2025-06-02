"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ShineBorderCardProps {
  children: React.ReactNode;
  size?: number;
  shine?: string[];
  duration?: number;
  borderWidth?: number;
  backgroundClassName?: string;
  className?: string;
  borderClassName?: string;
  containerClassName?: string;
}

export function ShineBorderCard({
  children,
  size = 500,
  shine = ["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.1)"],
  duration = 4,
  borderWidth = 1,
  backgroundClassName = "bg-black/[0.2] backdrop-blur-sm",
  className = "",
  borderClassName = "border border-white/[0.2]",
  containerClassName = "",
}: ShineBorderCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const shine = shineRef.current;

    if (!container || !shine) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = container.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;

      shine.style.setProperty("--x", `${x}px`);
      shine.style.setProperty("--y", `${y}px`);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden rounded-xl",
        containerClassName
      )}
    >
      {/* Border gradient */}
      <div
        ref={shineRef}
        className={cn(
          "absolute inset-0 z-10 h-full w-full rounded-xl",
          borderClassName
        )}
        style={{
          background: `radial-gradient(${size}px circle at var(--x, 0px) var(--y, 0px), ${shine[0]}, ${shine[1]}, transparent 40%)`,
          transition: `opacity ${duration / 4}s ease-in-out`,
        }}
      />

      {/* Content background */}
      <div
        className={cn(
          "absolute inset-[1px] z-20 flex h-[calc(100%-2px)] w-[calc(100%-2px)] rounded-xl",
          backgroundClassName
        )}
      />

      {/* Actual content */}
      <div className={cn("relative z-30 h-full w-full", className)}>
        {children}
      </div>
    </div>
  );
} 