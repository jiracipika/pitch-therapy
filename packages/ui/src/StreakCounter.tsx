"use client";

import React, { useEffect, useRef } from "react";

// ─── Streak Counter ──────────────────────────────────────────────────────────

export interface StreakCounterProps {
  /** Current streak count */
  streak: number;
  /** Best streak (for display) */
  bestStreak?: number;
  /** Additional CSS class */
  className?: string;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  streak,
  bestStreak = 0,
  className = "",
}) => {
  const prevStreak = useRef(streak);
  const [animate, setAnimate] = React.useState(false);

  useEffect(() => {
    if (streak > prevStreak.current) {
      setAnimate(true);
      const t = setTimeout(() => setAnimate(false), 300);
      prevStreak.current = streak;
      return () => clearTimeout(t);
    }
    prevStreak.current = streak;
  }, [streak]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`
          text-3xl font-bold tabular-nums transition-transform duration-300
          ${animate ? "scale-125" : "scale-100"}
          ${streak >= 10 ? "text-amber-400" : streak >= 5 ? "text-blue-400" : "text-slate-700"}
        `}
      >
        {streak}
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <span>🔥</span>
        <span>streak</span>
      </div>
      {bestStreak > 0 && (
        <div className="text-[10px] text-slate-300 mt-0.5">
          best: {bestStreak}
        </div>
      )}
    </div>
  );
};

export default StreakCounter;
