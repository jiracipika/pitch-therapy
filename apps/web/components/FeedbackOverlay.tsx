'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface FeedbackOverlayProps {
  correct: boolean;
  show: boolean;
  onDone?: () => void;
  streak?: number;
}

export default function FeedbackOverlay({ correct, show, onDone, streak }: FeedbackOverlayProps) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(() => onDone?.(), 1000);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              className="text-8xl"
              animate={correct ? { rotate: [0, -10, 10, -5, 5, 0] } : { x: [0, -8, 8, -4, 0] }}
              transition={{ duration: 0.6 }}
            >
              {correct ? '✅' : '❌'}
            </motion.div>
            {correct && streak && streak > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold"
                style={{ color: '#FBBF24' }}
              >
                🔥 {streak} streak!
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
