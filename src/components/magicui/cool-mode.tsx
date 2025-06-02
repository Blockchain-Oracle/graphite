"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CoolModeProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  size?: number;
  colors?: string[];
  particleCount?: number;
  particleSize?: number;
}

export function CoolMode({
  children,
  className,
  duration = 1000,
  size = 100,
  colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
  particleCount = 20,
  particleSize = 8,
}: CoolModeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [particles, setParticles] = useState<
    {
      id: number;
      x: number;
      y: number;
      size: number;
      color: string;
      velocity: { x: number; y: number };
      opacity: number;
    }[]
  >([]);
  const animationRef = useRef<number | null>(null);

  // Generate a random number between min and max
  const random = (min: number, max: number) => Math.random() * (max - min) + min;

  // Generate particles on click
  const generateParticles = (x: number, y: number) => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => {
      const angle = random(0, Math.PI * 2);
      const speed = random(1, 5);
      return {
        id: Date.now() + i,
        x,
        y,
        size: random(particleSize * 0.5, particleSize * 1.5),
        color: colors[Math.floor(random(0, colors.length))],
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        opacity: 1,
      };
    });

    setParticles(newParticles);
    setIsClicked(true);

    // Reset after animation
    setTimeout(() => {
      setIsClicked(false);
    }, duration);
  };

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;

    let start: number;
    const animate = (timestamp: number) => {
      if (start === undefined) start = timestamp;
      const elapsed = timestamp - start;

      if (elapsed < duration) {
        setParticles((prevParticles) =>
          prevParticles.map((particle) => ({
            ...particle,
            x: particle.x + particle.velocity.x,
            y: particle.y + particle.velocity.y,
            opacity: 1 - elapsed / duration,
            velocity: {
              x: particle.velocity.x,
              y: particle.velocity.y + 0.1, // Add gravity
            },
          }))
        );
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setParticles([]);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles, duration]);

  // Handle click
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    generateParticles(x, y);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="pointer-events-none absolute z-50 rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            transform: `scale(${isClicked ? 1 : 0})`,
            transition: `transform ${isClicked ? 0 : duration / 1000}s ease-out`,
          }}
        />
      ))}

      {/* Glow effect on hover */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity"
        style={{
          opacity: isHovered ? 0.15 : 0,
          background: `radial-gradient(circle at center, ${
            colors[0]
          }, transparent 70%)`,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Content */}
      <div className="relative z-20">{children}</div>
    </div>
  );
} 