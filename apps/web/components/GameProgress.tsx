"use client";

import { motion } from "framer-motion";

/**
 * Standard animated progress bar used in game playing screens.
 *
 * Renders an `.ios-progress-track` with a framer-motion fill bar that animates
 * to `current / total * 100%`.
 *
 * Extracted from the identical progress-bar block in every
 * game mode page's playing phase.
 */
export default function GameProgress({
  current,
  total,
  accentColor,
  className = "mb-6",
}: {
  /** Current round / completed count (0-based or 1-based — caller decides). */
  current: number;
  /** Total rounds or full-scale value. */
  total: number;
  /** Fill colour (hex or CSS var). */
  accentColor: string;
  /** Optional extra class on the track (default "mb-6"). */
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;

  return (
    <div className={`ios-progress-track ${className}`}>
      <motion.div
        className="ios-progress-fill"
        style={{ background: accentColor }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
