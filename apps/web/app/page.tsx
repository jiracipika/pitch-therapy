'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GAME_MODE_META, GAME_MODES, MODE_CATEGORIES } from '@pitch-therapy/core';
import './globals.css';

const FEATURE_CARDS = [
  {
    icon: '🎯',
    title: 'Train the exact skill you need',
    body: 'Start with note and frequency recognition, then branch into pitch memory, tuning, intervals, chords, and speed drills.',
    accent: 'var(--ios-blue)',
  },
  {
    icon: '📈',
    title: 'Progress that reflects real sessions',
    body: 'Scores, streaks, and per-mode history are built into the app shell so practice can become a habit instead of a one-off toy.',
    accent: 'var(--ios-green)',
  },
  {
    icon: '🧩',
    title: 'Daily puzzles plus focused modes',
    body: 'Wordle-style challenges give you a repeatable daily loop while individual modes let you isolate weak spots.',
    accent: 'var(--ios-purple)',
  },
  {
    icon: '🎧',
    title: 'Made for musicians, not generic quizzes',
    body: 'Every mode maps to a concrete listening task: identify notes, find frequencies, hear cents, lock drones, and react under pressure.',
    accent: 'var(--ios-orange)',
  },
];

function tint(color: string, amount = 12) {
  return `color-mix(in srgb, ${color} ${amount}%, transparent)`;
}

export default function Home() {
  const reduceMotion = useReducedMotion();
  const particles = useMemo(
    () => Array.from({ length: 16 }, (_, i) => {
      const seed = (i + 1) * 9301 + 49297;
      const rand = (n: number) => ((Math.sin(seed * n) + 1) / 2);
      return {
        left: `${Math.round(rand(1) * 100)}%`,
        top: `${Math.round(rand(2) * 100)}%`,
        size: `${Math.round(rand(3) * 4 + 3)}px`,
        delay: `${(rand(4) * 4).toFixed(2)}s`,
        duration: `${(rand(5) * 10 + 14).toFixed(2)}s`,
        opacity: rand(6) * 0.45 + 0.16,
      };
    }),
    [],
  );

  const modes = GAME_MODES.map((id) => GAME_MODE_META[id]);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--ios-bg)', color: 'var(--ios-label)' }}>
      <section className="pt-hero-premium relative overflow-hidden" style={{ minHeight: 'min(820px, 92dvh)' }}>
        <div className="pt-particles absolute inset-0 pointer-events-none" aria-hidden="true">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="pt-particle"
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
                opacity: particle.opacity,
                color: 'var(--ios-blue)',
              }}
            >
              ♩
            </div>
          ))}
        </div>

        <div className="relative z-10 px-6 pt-20 pb-20 max-w-6xl mx-auto text-center">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--ios-sep)',
              borderRadius: 999,
              padding: '8px 12px',
              background: 'var(--ios-glass-bg)',
              backdropFilter: 'blur(20px) saturate(160%)',
              color: 'var(--ios-label2)',
              fontSize: 13,
              fontWeight: 650,
              marginBottom: 20,
            }}
          >
            <span>🎧</span>
            <span>18 ear-training games in one practice system</span>
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
            className="pt-gradient-text text-5xl md:text-7xl lg:text-8xl font-bold leading-tight"
            style={{ letterSpacing: '-0.06em', marginBottom: 18 }}
          >
            Pitch Therapy
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            style={{
              color: 'var(--ios-label2)',
              fontSize: 'clamp(18px, 2.4vw, 24px)',
              lineHeight: 1.35,
              maxWidth: 760,
              margin: '0 auto 30px',
              letterSpacing: '-0.03em',
            }}
          >
            A premium ear-training gym for note recognition, frequency intuition, pitch control, intervals, chords, and daily listening practice.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap justify-center gap-3"
          >
            <Link className="ios-btn-primary" href="/onboarding" style={{ minWidth: 156, textDecoration: 'none' }}>
              Get Started
            </Link>
            <Link
              href="/play-modes"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 156,
                height: 48,
                padding: '0 18px',
                borderRadius: 14,
                border: '1px solid var(--ios-sep)',
                background: 'var(--ios-glass-bg)',
                color: 'var(--ios-label)',
                textDecoration: 'none',
                fontWeight: 700,
                backdropFilter: 'blur(20px) saturate(160%)',
              }}
            >
              Browse Modes
            </Link>
          </motion.div>
        </div>
      </section>

      <section id="features" className="px-6 pt-16 pb-12 max-w-6xl mx-auto">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FEATURE_CARDS.map((feature, i) => (
            <motion.article
              key={feature.title}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: Math.min(i * 0.04, 0.16), duration: 0.4 }}
              className="ios-card pt-desktop-card"
              style={{ padding: 20, borderColor: tint(feature.accent, 20) }}
            >
              <div style={{ fontSize: 30, width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center', background: tint(feature.accent, 14), marginBottom: 14 }}>
                {feature.icon}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 750, letterSpacing: '-0.03em', marginBottom: 8 }}>{feature.title}</h2>
              <p style={{ color: 'var(--ios-label2)', lineHeight: 1.55, fontSize: 14 }}>{feature.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="px-6 py-14 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p style={{ color: 'var(--ios-blue)', textTransform: 'uppercase', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', marginBottom: 8 }}>Training categories</p>
            <h2 style={{ color: 'var(--ios-label)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.055em' }}>Choose a skill lane</h2>
          </div>
          <Link href="/dashboard" style={{ color: 'var(--ios-blue)', textDecoration: 'none', fontWeight: 700 }}>
            Open dashboard →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODE_CATEGORIES.map((category, i) => (
            <motion.div
              key={category.id}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: Math.min(i * 0.04, 0.18), duration: 0.4 }}
              className="ios-card ios-card-lift"
              style={{ padding: 20, borderColor: tint(category.accentHex, 22), background: `linear-gradient(135deg, ${tint(category.accentHex, 10)} 0%, var(--ios-bg2) 78%)` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 28, width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center', background: tint(category.accentHex, 16) }}>{category.icon}</div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 760, letterSpacing: '-0.03em' }}>{category.label}</h3>
                  <p style={{ color: 'var(--ios-label3)', fontSize: 13, marginTop: 2 }}>{modes.filter((m) => m.category === category.id).length} modes</p>
                </div>
              </div>
              <p style={{ color: 'var(--ios-label2)', lineHeight: 1.5, marginTop: 14 }}>{category.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 py-14 max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <p style={{ color: 'var(--ios-purple)', textTransform: 'uppercase', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', marginBottom: 8 }}>All modes</p>
          <h2 style={{ color: 'var(--ios-label)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.055em' }}>Real games, real links</h2>
          <p style={{ color: 'var(--ios-label2)', maxWidth: 640, margin: '10px auto 0', lineHeight: 1.55 }}>No placeholder marketing grid. Every card below points to a working training route.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modes.map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: Math.min(i * 0.025, 0.22), duration: 0.35 }}
            >
              <Link
                href={`/play/${mode.id}`}
                className="ios-game-card pt-card-glow"
                style={{
                  minHeight: 172,
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  padding: 18,
                  background: `linear-gradient(135deg, ${tint(mode.accentHex, 12)} 0%, var(--ios-bg2) 72%)`,
                  borderColor: tint(mode.accentHex, 24),
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontSize: 32, width: 56, height: 56, borderRadius: 17, display: 'grid', placeItems: 'center', background: tint(mode.accentHex, 16) }}>{mode.icon}</div>
                  <span style={{ color: mode.accentHex, fontWeight: 800 }}>→</span>
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <h3 style={{ color: 'var(--ios-label)', fontSize: 18, fontWeight: 760, letterSpacing: '-0.03em', marginBottom: 6 }}>{mode.label}</h3>
                  <p style={{ color: 'var(--ios-label2)', fontSize: 14, lineHeight: 1.45 }}>{mode.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--ios-sep)', marginTop: 40 }}>
        <div className="px-6 py-10 max-w-6xl mx-auto text-center">
          <p style={{ color: 'var(--ios-label3)', fontSize: 14 }}>Pitch Therapy © {new Date().getFullYear()} — made for focused daily musicianship.</p>
        </div>
      </footer>
    </div>
  );
}
