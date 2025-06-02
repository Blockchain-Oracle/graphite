"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const Meteors = ({
  number = 20,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const meteors = new Array(number).fill(null).map((_, idx) => {
    const size = Math.floor(Math.random() * 3) + 1; // Size between 1px and 3px
    const top = Math.floor(Math.random() * 100);
    const left = Math.floor(Math.random() * 100);
    const animationDuration = Math.floor(Math.random() * 10) + 5; // Between 5-15s
    const animationDelay = Math.floor(Math.random() * 10) + 1; // Between 1-11s

    return (
      <span
        key={idx}
        className={cn(
          "absolute top-0 left-0 h-0.5 w-0.5 rotate-[215deg] animate-meteor bg-gradient-to-r",
          className || "from-white to-transparent"
        )}
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${size}px`,
          height: `${size * 30}px`, // Trail length
          animationDelay: `${animationDelay}s`,
          animationDuration: `${animationDuration}s`,
        }}
      />
    );
  });

  return (
    <>
      {meteors}
      <style jsx global>{`
        @keyframes meteor {
          0% {
            transform: rotate(215deg) translateX(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: rotate(215deg) translateX(-200px);
            opacity: 0;
          }
        }
        .animate-meteor {
          animation: meteor linear infinite;
        }
      `}</style>
    </>
  );
}; 