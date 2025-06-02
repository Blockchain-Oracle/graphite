"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface GlobeProps {
  className?: string;
  config?: any;
}

// A simplified globe implementation that works with React 19
export function Globe({ className, config = {} }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      return { width, height };
    };

    const { width, height } = resizeCanvas();
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;

    // Colors from config or defaults
    const baseColor = config.baseColor || [0.3, 0.2, 0.8];
    const glowColor = config.glowColor || [0.2, 0.2, 0.8];

    // Convert RGB arrays to CSS colors
    const getColor = (colorArr: number[], alpha: number) => {
      return `rgba(${colorArr[0] * 255}, ${colorArr[1] * 255}, ${colorArr[2] * 255}, ${alpha})`;
    };

    // Draw the globe
    let animationId: number;
    let rotation = 0;

    const drawGlobe = () => {
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Scale everything for devicePixelRatio
      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      // Draw glow
      const gradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.85,
        centerX, centerY, radius * 1.5
      );
      gradient.addColorStop(0, getColor(glowColor, 0.3));
      gradient.addColorStop(1, getColor(glowColor, 0));
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw globe
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      
      // Create sphere gradient
      const sphereGradient = ctx.createLinearGradient(
        centerX - radius, centerY - radius,
        centerX + radius, centerY + radius
      );
      sphereGradient.addColorStop(0, getColor(baseColor, 0.7));
      sphereGradient.addColorStop(0.5, getColor(baseColor, 0.9));
      sphereGradient.addColorStop(1, getColor(baseColor, 0.5));
      
      ctx.fillStyle = sphereGradient;
      ctx.fill();
      
      // Draw grid lines (latitude)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      
      for (let i = 1; i < 8; i++) {
        const lineRadius = radius * (i / 8);
        ctx.beginPath();
        ctx.arc(centerX, centerY, lineRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Draw longitude lines
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + rotation;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius);
        ctx.quadraticCurveTo(
          centerX + Math.cos(angle) * radius * 0.5,
          centerY,
          centerX,
          centerY + radius
        );
        ctx.stroke();
      }

      // Draw connection points (markers)
      if (config.markers && Array.isArray(config.markers)) {
        config.markers.forEach((marker: any) => {
          if (!marker.location || !Array.isArray(marker.location) || marker.location.length < 2) return;
          
          const size = (marker.size || 0.05) * radius;
          
          // Convert lat/long to position on sphere (simplified)
          const lat = (marker.location[0] * Math.PI) / 180;
          const long = (marker.location[1] * Math.PI) / 180 + rotation * 2;
          
          // Simple mapping of lat/long to x,y on circle (not accurate for a sphere but simpler)
          const x = centerX + Math.cos(long) * Math.cos(lat) * radius * 0.9;
          const y = centerY + Math.sin(lat) * radius * 0.9;
          
          // Only show points on the "visible" half of the sphere
          if (Math.cos(long) > -0.1) {
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = config.markerColor ? 
              getColor(config.markerColor, 0.8) : 
              'rgba(255, 255, 255, 0.8)';
            ctx.fill();
            
            // Add glow
            ctx.beginPath();
            ctx.arc(x, y, size * 2, 0, Math.PI * 2);
            const pointGlow = ctx.createRadialGradient(
              x, y, size,
              x, y, size * 2
            );
            pointGlow.addColorStop(0, config.markerColor ? 
              getColor(config.markerColor, 0.5) : 
              'rgba(255, 255, 255, 0.5)');
            pointGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = pointGlow;
            ctx.fill();
          }
        });
      }

      ctx.restore();
      
      // Slow rotation
      rotation += 0.002;
      
      animationId = requestAnimationFrame(drawGlobe);
    };

    // Handle window resize
    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    drawGlobe();

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [config]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          contain: "layout paint size",
          opacity: 0.95,
        }}
      />
    </div>
  );
}
