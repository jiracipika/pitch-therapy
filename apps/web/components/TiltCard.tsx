'use client';

import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

/**
 * Mouse-tracked 3D tilt wrapper. Springs keep the tilt fluid; pointer
 * position is published as --mx/--my CSS variables so pure CSS can draw
 * a cursor-following spotlight. Disabled under prefers-reduced-motion.
 */
export default function TiltCard({
  children,
  className,
  style,
  max = 6,
  lift = 0,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  max?: number;
  lift?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawX, { stiffness: 170, damping: 18, mass: 0.6 });
  const rotateY = useSpring(rawY, { stiffness: 170, damping: 18, mass: 0.6 });

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || reduce) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rawY.set((px - 0.5) * max);
    rawX.set((0.5 - py) * max);
    el.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(2)}%`);
  };

  const onPointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 950, ...style }}
      whileHover={reduce || lift <= 0 ? undefined : { y: -lift, scale: 1.012 }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </motion.div>
  );
}
