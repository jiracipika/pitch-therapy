"use client";

import React, { useEffect, useRef, useState } from "react";

// ─── Timer / Countdown ───────────────────────────────────────────────────────

export interface TimerProps {
  /** Duration in seconds. 0 = infinite (count up) */
  seconds: number;
  /** Called when timer reaches 0 */
  onExpire?: () => void;
  /** Called every second with remaining time */
  onTick?: (remaining: number) => void;
  /** Whether the timer is running */
  running?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  seconds,
  onExpire,
  onTick,
  running = false,
  className = "",
}) => {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expireCalled = useRef(false);

  useEffect(() => {
    setRemaining(seconds);
    expireCalled.current = false;
  }, [seconds]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!running) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = seconds === 0 ? prev + 1 : Math.max(0, prev - 1);
        onTick?.(next);

        if (next === 0 && !expireCalled.current) {
          expireCalled.current = true;
          onExpire?.();
        }

        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, seconds, onExpire, onTick]);

  const isUrgent = seconds > 0 && remaining <= 5 && remaining > 0;
  const display =
    seconds === 0
      ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
      : `${remaining}`;

  const circumference = 2 * Math.PI * 20;
  const progress = seconds > 0 ? remaining / seconds : 0;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {seconds > 0 && (
        <svg width="52" height="52" viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="rgba(148,163,184,0.2)"
            strokeWidth="3"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke={isUrgent ? "#EF4444" : "#3B82F6"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform="rotate(-90 24 24)"
            className="transition-all duration-1000"
          />
        </svg>
      )}
      <span
        className={`text-2xl font-bold tabular-nums ${
          isUrgent ? "text-red-400" : "text-slate-700"
        }`}
      >
        {display}
      </span>
      {seconds > 0 && (
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          sec
        </span>
      )}
    </div>
  );
};

export default Timer;
