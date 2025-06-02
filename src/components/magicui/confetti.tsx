"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

interface ConfettiProps {
  trigger?: boolean;
  colors?: string[];
  duration?: number;
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
  gravity?: number;
  drift?: number;
  ticks?: number;
  shapes?: ("square" | "circle")[];
  origin?: {
    x?: number;
    y?: number;
  };
  className?: string;
}

export function Confetti({
  trigger = false,
  colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
  duration = 5000,
  particleCount = 100,
  spread = 70,
  startVelocity = 30,
  decay = 0.94,
  scalar = 1,
  gravity = 1,
  drift = 0,
  ticks = 200,
  shapes,
  origin = {
    x: 0.5,
    y: 0.5,
  },
  className,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstanceRef = useRef<confetti.CreateTypes | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize confetti
    const myCanvas = canvasRef.current;
    confettiInstanceRef.current = confetti.create(myCanvas, {
      resize: true,
      useWorker: true,
    });

    return () => {
      if (confettiInstanceRef.current) {
        confettiInstanceRef.current.reset();
      }
    };
  }, []);

  useEffect(() => {
    if (trigger && confettiInstanceRef.current && !isActive) {
      setIsActive(true);

      // Start confetti
      confettiInstanceRef.current({
        particleCount,
        spread,
        startVelocity,
        decay,
        gravity,
        drift,
        ticks,
        origin,
        scalar,
        shapes,
        colors,
        disableForReducedMotion: true,
      });

      // Stop after duration
      const timeout = setTimeout(() => {
        setIsActive(false);
      }, duration);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [
    trigger,
    colors,
    duration,
    particleCount,
    spread,
    startVelocity,
    decay,
    scalar,
    gravity,
    drift,
    ticks,
    shapes,
    origin,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-50 h-full w-full ${className}`}
      style={{ position: "fixed", top: 0, left: 0, zIndex: 999 }}
    />
  );
}

export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const triggerConfetti = () => {
    setIsActive(true);
    
    // Reset after a short delay
    setTimeout(() => {
      setIsActive(false);
    }, 100);
  };

  return {
    isActive,
    triggerConfetti,
  };
} 