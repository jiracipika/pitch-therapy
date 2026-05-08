'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type HeroVariant = 'dashboard' | 'daily' | 'progress' | 'settings' | 'profile' | 'default';
type StatusTone = 'loading' | 'success' | 'error' | 'empty';

const heroGradients: Record<HeroVariant, string> = {
  dashboard: 'linear-gradient(135deg, rgba(10,132,255,0.16), rgba(94,92,230,0.10) 60%, rgba(255,255,255,0.02))',
  daily: 'linear-gradient(135deg, rgba(48,209,88,0.16), rgba(90,200,250,0.10) 60%, rgba(255,255,255,0.02))',
  progress: 'linear-gradient(135deg, rgba(10,132,255,0.14), rgba(191,90,242,0.11) 60%, rgba(255,255,255,0.02))',
  settings: 'linear-gradient(135deg, rgba(255,159,10,0.15), rgba(10,132,255,0.08) 60%, rgba(255,255,255,0.02))',
  profile: 'linear-gradient(135deg, rgba(191,90,242,0.17), rgba(10,132,255,0.10) 60%, rgba(255,255,255,0.02))',
  default: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
};

const heroGlow: Record<HeroVariant, string> = {
  dashboard: 'rgba(10,132,255,0.24)',
  daily: 'rgba(48,209,88,0.22)',
  progress: 'rgba(191,90,242,0.20)',
  settings: 'rgba(255,159,10,0.22)',
  profile: 'rgba(191,90,242,0.22)',
  default: 'rgba(255,255,255,0.16)',
};

const statusColor: Record<StatusTone, string> = {
  loading: 'var(--ios-blue)',
  success: 'var(--ios-green)',
  error: 'var(--ios-red)',
  empty: 'var(--ios-label3)',
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
  variant = 'default',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  variant?: HeroVariant;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="mb-6 pt-hero pt-hero-shell"
      style={{ background: heroGradients[variant] }}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.99 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        aria-hidden
        className="pt-hero-glow"
        style={{ background: `radial-gradient(circle at 40% 45%, ${heroGlow[variant]}, transparent 70%)` }}
        animate={reduce ? undefined : { x: ['-2%', '2%', '-2%'] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      {eyebrow ? (
        <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', marginBottom: 4 }}>
          {eyebrow}
        </div>
      ) : null}
      <h1 className="ios-large-title">{title}</h1>
      {subtitle ? (
        <div style={{ marginTop: 8, fontSize: 15, color: 'var(--ios-label2)', letterSpacing: '-0.14px' }}>
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
      style={{ padding: '12px', textAlign: 'center' }}
    >
      <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>{label}</div>
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
  return (
    <motion.div
      className="ios-card pt-status-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ borderColor: `${color}33` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          aria-hidden
          style={{
            width: 9,
            height: 9,
            borderRadius: 9,
            background: color,
            boxShadow: `0 0 0 6px ${color}1F`,
            flexShrink: 0,
          }}
        />
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)' }}>{title}</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ios-label2)', lineHeight: 1.45 }}>{body}</div>
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
      {tone === 'loading' ? <div className="pt-shimmer-bar" style={{ marginTop: 12 }} /> : null}
    </motion.div>
  );
}

