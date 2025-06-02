"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  keyExtractor: (item: T) => string | number;
  initialDelay?: number;
  staggerDelay?: number;
  direction?: "top" | "bottom" | "left" | "right";
}

export function AnimatedList<T>({
  items,
  renderItem,
  className,
  itemClassName,
  keyExtractor,
  initialDelay = 0,
  staggerDelay = 0.05,
  direction = "top",
}: AnimatedListProps<T>) {
  const [mountedItems, setMountedItems] = useState<T[]>([]);
  const previousItemsRef = useRef<T[]>([]);

  // Animation variants based on direction
  const getAnimationVariants = () => {
    switch (direction) {
      case "left":
        return {
          hidden: { x: -20, opacity: 0 },
          visible: { x: 0, opacity: 1 },
          exit: { x: -20, opacity: 0 },
        };
      case "right":
        return {
          hidden: { x: 20, opacity: 0 },
          visible: { x: 0, opacity: 1 },
          exit: { x: 20, opacity: 0 },
        };
      case "bottom":
        return {
          hidden: { y: 20, opacity: 0 },
          visible: { y: 0, opacity: 1 },
          exit: { y: 20, opacity: 0 },
        };
      case "top":
      default:
        return {
          hidden: { y: -20, opacity: 0 },
          visible: { y: 0, opacity: 1 },
          exit: { y: -20, opacity: 0 },
        };
    }
  };

  const variants = getAnimationVariants();

  // Track changes to items array
  useEffect(() => {
    const timer = setTimeout(() => {
      setMountedItems(items);
      previousItemsRef.current = items;
    }, initialDelay * 1000);

    return () => clearTimeout(timer);
  }, [items, initialDelay]);

  return (
    <div className={cn("overflow-hidden", className)}>
      <AnimatePresence mode="sync">
        {mountedItems.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
            transition={{
              duration: 0.3,
              delay: index * staggerDelay,
            }}
            className={cn("relative", itemClassName)}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 