"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type HeroVariant = "dashboard" | "daily" | "progress" | "settings" | "profile" | "default";
type StatusTone = "loading" | "success" | "error" | "empty";

const heroGradients: Record<HeroVariant, string> = {
  dashboard:
    "linear-gradient(135deg, rgba(183,243,74,0.15), rgba(255,120,87,0.08) 62%, rgba(244,246,236,0.02))",
  daily:
    "linear-gradient(135deg, rgba(115,232,121,0.15), rgba(183,243,74,0.07) 62%, rgba(244,246,236,0.02))",
  progress:
    "linear-gradient(135deg, rgba(214,131,242,0.15), rgba(183,243,74,0.06) 62%, rgba(244,246,236,0.02))",
  settings:
    "linear-gradient(135deg, rgba(255,129,95,0.15), rgba(183,243,74,0.06) 62%, rgba(244,246,236,0.02))",
  profile:
    "linear-gradient(135deg, rgba(155,140,255,0.16), rgba(255,120,87,0.07) 62%, rgba(244,246,236,0.02))",
  default: "linear-gradient(135deg, rgba(183,243,74,0.10), rgba(244,246,236,0.02))",
};

const heroGlow: Record<HeroVariant, string> = {
  dashboard: "rgba(183,243,74,0.22)",
  daily: "rgba(115,232,121,0.20)",
  progress: "rgba(214,131,242,0.18)",
  settings: "rgba(255,129,95,0.20)",
  profile: "rgba(155,140,255,0.20)",
  default: "rgba(183,243,74,0.14)",
};

const heroMotion: Record<
  HeroVariant,
  {
    initial: { opacity: number; y?: number; x?: number; scale?: number; rotate?: number };
    animate: { opacity: number; y?: number; x?: number; scale?: number; rotate?: number };
    glow: { x?: string[]; y?: string[]; scale?: number[]; rotate?: number[] };
    glowDuration: number;
  }
> = {
  dashboard: {
    initial: { opacity: 0, y: 14, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    glow: { x: ["-2%", "2%", "-2%"], y: ["0%", "-2%", "0%"], scale: [1, 1.03, 1] },
    glowDuration: 9,
  },
  daily: {
    initial: { opacity: 0, y: 12, x: -8, scale: 0.992 },
    animate: { opacity: 1, y: 0, x: 0, scale: 1 },
    glow: { x: ["-1%", "1%", "-1%"], y: ["1%", "-1%", "1%"], rotate: [-1, 1, -1] },
    glowDuration: 10,
  },
  progress: {
    initial: { opacity: 0, y: 16, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    glow: { x: ["-2%", "2%", "-2%"], y: ["0%", "0%", "0%"], scale: [0.98, 1.05, 0.98] },
    glowDuration: 11,
  },
  settings: {
    initial: { opacity: 0, y: 10, x: 8, scale: 0.992 },
    animate: { opacity: 1, y: 0, x: 0, scale: 1 },
    glow: { x: ["2%", "-2%", "2%"], y: ["0%", "1%", "0%"], rotate: [1.2, -1.2, 1.2] },
    glowDuration: 12,
  },
  profile: {
    initial: { opacity: 0, y: 14, scale: 0.982, rotate: -0.25 },
    animate: { opacity: 1, y: 0, scale: 1, rotate: 0 },
    glow: { x: ["-1%", "1%", "-1%"], y: ["-1%", "2%", "-1%"], scale: [0.97, 1.04, 0.97] },
    glowDuration: 10.5,
  },
  default: {
    initial: { opacity: 0, y: 12, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    glow: { x: ["-2%", "2%", "-2%"] },
    glowDuration: 9,
  },
};

const statusColor: Record<StatusTone, string> = {
  loading: "var(--ios-blue)",
  success: "var(--ios-green)",
  error: "var(--ios-red)",
  empty: "var(--ios-blue)",
};

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  variant = "default",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  variant?: HeroVariant;
}) {
  const reduce = useReducedMotion();
  const motionProfile = heroMotion[variant];

  return (
    <motion.div
      className="pt-hero pt-hero-shell mb-6"
      style={{ background: heroGradients[variant] }}
      initial={reduce ? { opacity: 1 } : motionProfile.initial}
      animate={reduce ? { opacity: 1 } : motionProfile.animate}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        aria-hidden
        className="pt-hero-glow"
        style={{
          background: `radial-gradient(circle at 40% 45%, ${heroGlow[variant]}, transparent 70%)`,
        }}
        animate={reduce ? undefined : motionProfile.glow}
        transition={{ duration: motionProfile.glowDuration, repeat: Infinity, ease: "easeInOut" }}
      />
      {eyebrow ? (
        <div
          style={{
            fontSize: 13,
            color: "var(--ios-label3)",
            letterSpacing: "-0.08px",
            marginBottom: 4,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <h1 className="ios-large-title">{title}</h1>
      {subtitle ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 15,
            color: "var(--ios-label2)",
            letterSpacing: "-0.14px",
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </motion.div>
  );
}

export function AnimatedStatCard({
  label,
  value,
  color,
  delay = 0,
}: {
  label: string;
  value: string | number;
  color: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="ios-card ios-card-lift pt-stat-card"
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      style={{ padding: "12px", textAlign: "center" }}
    >
      <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--ios-label3)", marginTop: 2 }}>{label}</div>
    </motion.div>
  );
}

export function StatusCard({
  tone,
  title,
  body,
  action,
}: {
  tone: StatusTone;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  const color = statusColor[tone];
  const reduce = useReducedMotion();
  const symbol = tone === "success" ? "✓" : tone === "error" ? "!" : tone === "empty" ? "i" : "•••";
  return (
    <motion.div
      className="ios-card pt-status-card"
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: 16,
        borderColor: `color-mix(in srgb, ${color} 22%, transparent)`,
        background: `linear-gradient(135deg, color-mix(in srgb, ${color} 7%, var(--pt-surface-1)), var(--pt-surface-1))`,
      }}
      role="status"
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <motion.span
          aria-hidden
          style={{
            width: 18,
            height: 18,
            borderRadius: 18,
            background: color,
            boxShadow: `0 0 0 6px color-mix(in srgb, ${color} 12%, transparent)`,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: "#041426",
            fontWeight: 800,
          }}
          animate={
            reduce
              ? undefined
              : tone === "loading"
                ? { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }
                : tone === "error"
                  ? { x: [0, -1.4, 1.4, -1, 1, 0] }
                  : { scale: [1, 1.08, 1] }
          }
          transition={
            tone === "loading"
              ? { duration: 1.3, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
          }
        >
          {symbol}
        </motion.span>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ios-label)" }}>{title}</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: "var(--ios-label2)", lineHeight: 1.45 }}>
        {body}
      </div>
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
      {tone === "loading" ? <div className="pt-shimmer-bar" style={{ marginTop: 12 }} /> : null}
    </motion.div>
  );
}
