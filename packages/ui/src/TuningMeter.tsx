"use client";

import React from "react";

// ─── Tuning Meter ────────────────────────────────────────────────────────────

export interface TuningMeterProps {
  /** Cents deviation from target. Positive = sharp, negative = flat. */
  cents: number;
  /** Max cents to display (default 50) */
  maxCents?: number;
  /** Threshold for "in tune" in cents (default ±5) */
  tolerance?: number;
  /** Show numeric cents display */
  showCents?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const TuningMeter: React.FC<TuningMeterProps> = ({
  cents,
  maxCents = 50,
  tolerance = 5,
  showCents = true,
  className = "",
}) => {
  const clamped = Math.max(-maxCents, Math.min(maxCents, cents));
  const percent = (clamped / maxCents) * 50; // -50% to +50%

  const isInTune = Math.abs(cents) <= tolerance;
  const isSharp = cents > 0;

  const indicatorColor = isInTune
    ? "bg-emerald-400"
    : isSharp
      ? "bg-orange-400"
      : "bg-orange-400";

  const labelColor = isInTune
    ? "text-emerald-400"
    : "text-orange-400";

  return (
    <div className={`w-full ${className}`}>
      {/* Labels */}
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>♭ Flat</span>
        <span className={`${labelColor} font-medium`}>
          {isInTune ? "In Tune" : isSharp ? `+${Math.round(cents)}¢` : `${Math.round(cents)}¢`}
        </span>
        <span>Sharp ♯</span>
      </div>

      {/* Meter bar */}
      <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        {/* Tolerance zone */}
        <div
          className="absolute top-0 h-full bg-emerald-100 rounded-full"
          style={{
            left: `${50 - (tolerance / maxCents) * 50}%`,
            width: `${(tolerance / maxCents) * 100}%`,
          }}
        />

        {/* Center line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-slate-300 rounded-full z-10" />

        {/* Indicator */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${indicatorColor} shadow-md transition-all duration-100 z-20`}
          style={{
            left: `calc(50% + ${percent}% - 8px)`,
          }}
        />
      </div>

      {/* Numeric display */}
      {showCents && (
        <div className="text-center mt-2 text-2xl font-bold tabular-nums">
          <span className={labelColor}>
            {cents >= 0 ? "+" : ""}
            {Math.round(cents)}
          </span>
          <span className="text-slate-400 text-sm ml-1">cents</span>
        </div>
      )}
    </div>
  );
};

export default TuningMeter;
