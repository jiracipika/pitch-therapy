"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

interface FeedbackOverlayProps {
  correct: boolean;
  show: boolean;
  onDone?: () => void;
  streak?: number;
}

export default function FeedbackOverlay({ correct, show, onDone, streak }: FeedbackOverlayProps) {
  const reduceMotion = useReducedMotion();
  const announcement = show
    ? correct
      ? streak && streak > 1
        ? `Correct. ${streak} answer streak.`
        : "Correct."
      : "Not quite."
    : "";

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onDone?.(), 1000);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  return (
    <>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            transition={
              reduceMotion
                ? { duration: 0.01 }
                : { duration: 0.3, type: "spring", stiffness: 300, damping: 25 }
            }
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            aria-hidden="true"
          >
            <motion.div
              initial={reduceMotion ? false : { scale: 0 }}
              animate={reduceMotion ? undefined : { scale: [0, 1.2, 1] }}
              transition={reduceMotion ? undefined : { duration: 0.5, times: [0, 0.6, 1] }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                className="text-8xl"
                animate={
                  reduceMotion
                    ? undefined
                    : correct
                      ? { rotate: [0, -10, 10, -5, 5, 0] }
                      : { x: [0, -8, 8, -4, 0] }
                }
                transition={reduceMotion ? undefined : { duration: 0.6 }}
              >
                {correct ? "✅" : "❌"}
              </motion.div>
              {correct && streak && streak > 1 && (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduceMotion ? { duration: 0.01 } : { delay: 0.3 }}
                  className="text-xl font-bold"
                  style={{ color: "#FBBF24" }}
                >
                  🔥 {streak} streak!
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
