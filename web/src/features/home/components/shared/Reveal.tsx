import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Reveal
 * Lightweight reveal-on-scroll wrapper complying with prefers-reduced-motion.
 * Clamps y-displacement and transition duration when reduced motion is preferred (S07 Motion Polish).
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  duration = 0.35,
  yOffset = 12,
  style = {},
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const hasIntersectionObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window;

  if (shouldReduceMotion || !hasIntersectionObserver) {
    return (
      <div style={style} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
