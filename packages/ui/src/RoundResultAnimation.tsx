"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Round Result Animation ──────────────────────────────────────────────────

export interface RoundResultAnimationProps {
  /** Whether the answer was correct */
  correct: boolean;
  /** Points awarded */
  points?: number;
  /** Time taken in ms */
  timeMs?: number;
  /** Show the animation */
  show: boolean;
  /** Called when animation completes */
  onComplete?: () => void;
  /** Additional CSS class */
  className?: string;
}

export const RoundResultAnimation: React.FC<RoundResultAnimationProps> = ({
  correct,
  points = 0,
  timeMs,
  show,
  onComplete,
  className = "",
}) => {
  const [phase, setPhase] = useState<"idle" | "show" | "done">("idle");

  useEffect(() => {
    if (show) {
      setPhase("show");
      const t = setTimeout(() => {
        setPhase("done");
        onComplete?.();
      }, 1500);
      return () => clearTimeout(t);
    } else {
      setPhase("idle");
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {phase === "show" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`flex flex-col items-center gap-2 ${className}`}
        >
          {/* Big icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: correct ? 0 : 15 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            className={`
              text-5xl
              ${correct ? "drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]" : "drop-shadow-[0_0_12px_rgba(248,113,113,0.5)]"}
            `}
          >
            {correct ? "✅" : "❌"}
          </motion.div>

          {/* Label */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-lg font-semibold ${
              correct ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {correct ? "Correct!" : "Try Again"}
          </motion.span>

          {/* Points */}
          {points > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 text-sm text-slate-400"
            >
              <span className="text-amber-400 font-bold">+{points} pts</span>
              {timeMs !== undefined && (
                <span>{(timeMs / 1000).toFixed(1)}s</span>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RoundResultAnimation;
