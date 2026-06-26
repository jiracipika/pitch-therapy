'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

const MODES = [
  { id: 'pitch-match',      label: 'Pitch Match',       color: '#0A84FF', icon: '🎤', desc: 'Match pitches with your voice',         href: '/play/pitch-match' },
  { id: 'note-id',          label: 'Note ID',            color: '#BF5AF2', icon: '🎵', desc: 'Identify notes by ear',                 href: '/play/note-id' },
  { id: 'frequency-guess',  label: 'Freq Guess',         color: '#FF9F0A', icon: '📡', desc: 'Guess the exact frequency',             href: '/play/frequency-guess' },
  { id: 'note-wordle',      label: 'Note Wordle',        color: '#30D158', icon: '🟩', desc: 'Wordle meets ear training',             href: '/play/note-wordle' },
  { id: 'frequency-wordle', label: 'Freq Wordle',        color: '#5AC8FA', icon: '🔊', desc: 'Hunt for a hidden frequency',           href: '/play/frequency-wordle' },
  { id: 'pitch-memory',     label: 'Pitch Memory',       color: '#FF375F', icon: '🧠', desc: 'Reproduce note sequences',             href: '/play/pitch-memory' },
  { id: 'name-that-note',   label: 'Name That Note',     color: '#32ADE6', icon: '🎼', desc: 'Read the musical staff',               href: '/play/name-that-note' },
  { id: 'frequency-hunt',   label: 'Freq Hunt',          color: '#FF9F0A', icon: '🔍', desc: 'Scrub to find exact frequency',        href: '/play/frequency-hunt' },
  { id: 'drone-lock',       label: 'Drone Lock',         color: '#63E6E2', icon: '🔒', desc: 'Sing intervals over a drone',          href: '/play/drone-lock' },
  { id: 'speed-round',      label: 'Speed Round',        color: '#FF9F0A', icon: '⚡', desc: 'Rapid-fire note identification',       href: '/play/speed-round' },
  { id: 'chord-detective',  label: 'Chord Detective',    color: '#FF375F', icon: '🕵️', desc: 'Identify chord quality',               href: '/play/chord-detective' },
  { id: 'waveform-match',   label: 'Waveform Match',     color: '#5E5CE6', icon: '〰️', desc: 'Align waveforms by ear',              href: '/play/waveform-match' },
  { id: 'tuning-battle',    label: 'Tuning Battle',      color: '#FF453A', icon: '⚔️', desc: '2-player race to lock the note',      href: '/play/tuning-battle' },
  { id: 'tune-in',          label: 'Tune In',            color: '#FF375F', icon: '📻', desc: 'Hit target notes with tuning meter',  href: '/play/tune-in' },
  { id: 'piano-tap',        label: 'Piano Tap',          color: '#5E5CE6', icon: '🎹', desc: 'Tap correct piano keys',              href: '/play/piano-tap' },
  { id: 'frequency-slider', label: 'Freq Slider',        color: '#5AC8FA', icon: '🎚️', desc: 'Drag to match hidden frequencies',    href: '/play/frequency-slider' },
  { id: 'cents-deviation',  label: 'Cents Deviation',    color: '#30D158', icon: '📐', desc: 'Detect microtonal shifts',            href: '/play/cents-deviation' },
  { id: 'interval-archer',  label: 'Interval Archer',    color: '#BF5AF2', icon: '🏹', desc: 'Identify musical intervals',          href: '/play/interval-archer' },
];

const CATEGORIES = [
  { label: 'Voice', ids: ['pitch-match', 'drone-lock', 'tune-in'], color: '#0A84FF' },
  { label: 'Pitch', ids: ['note-id', 'note-wordle', 'name-that-note', 'pitch-memory', 'speed-round', 'piano-tap'], color: '#BF5AF2' },
  { label: 'Frequency', ids: ['frequency-guess', 'frequency-wordle', 'frequency-hunt', 'frequency-slider'], color: '#FF9F0A' },
  { label: 'Advanced', ids: ['chord-detective', 'waveform-match', 'tuning-battle', 'cents-deviation', 'interval-archer'], color: '#FF375F' },
];

const QUICK_FLOWS = [
  { href: '/play-modes', title: 'Explore Modes', subtitle: 'Browse all 18 training experiences', icon: '◫' },
  { href: '/daily', title: 'Play Daily', subtitle: 'One curated challenge for today', icon: '◷' },
  { href: '/progress', title: 'Track Progress', subtitle: 'Review streaks and trend lines', icon: '▥' },
];

export default function Home() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [isSafari, setIsSafari] = useState(false);
  const [leavingTo, setLeavingTo] = useState<string | null>(null);
  const transitionTimeout = useRef<number | null>(null);
  const motionLite = reduceMotion || isSafari;

  useEffect(() => {
    const ua = navigator.userAgent;
    const safari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS/i.test(ua);
    setIsSafari(safari);
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimeout.current) {
        window.clearTimeout(transitionTimeout.current);
      }
    };
  }, []);

  const transitionTo = useCallback((href: string) => {
    if (leavingTo) return;
    setLeavingTo(href);
    transitionTimeout.current = window.setTimeout(() => {
      router.push(href);
    }, 420);
  }, [leavingTo, router]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--ios-bg)' }}>
      <AnimatePresence>
        {leavingTo && (
          <motion.div
            key="page-leave-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionLite ? 0.16 : 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-0 z-[120]"
            style={{
              background: 'radial-gradient(140% 100% at 50% 50%, rgba(8, 16, 36, 0.82) 0%, rgba(0, 0, 0, 0.94) 58%, #000 100%)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.78, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: motionLite ? 0.16 : 0.34, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: 74,
                height: 74,
                borderRadius: 18,
                background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 16px 48px rgba(10, 132, 255, 0.28)',
              }}
            >
              <span style={{ fontSize: 34 }}>🎵</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating note symbols */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden select-none" aria-hidden>
        <span className="animate-note-1 absolute left-[8%]  top-[18%] text-6xl font-serif" style={{ color: 'rgba(255,255,255,0.04)' }}>♪</span>
        <span className="animate-note-2 absolute left-[75%] top-[12%] text-5xl font-serif" style={{ color: 'rgba(255,255,255,0.03)' }}>♫</span>
        <span className="animate-note-3 absolute left-[20%] top-[55%] text-7xl font-serif" style={{ color: 'rgba(255,255,255,0.03)' }}>♬</span>
        <span className="animate-note-2 absolute left-[65%] top-[45%] text-5xl font-serif" style={{ color: 'rgba(255,255,255,0.03)' }}>♩</span>
        <span className="animate-note-1 absolute left-[45%] top-[72%] text-4xl font-serif" style={{ color: 'rgba(255,255,255,0.03)' }}>♪</span>

        <motion.div
          className="absolute inset-x-[-10%] top-[14%] h-44"
          animate={motionLite ? undefined : { x: ['-3%', '3%', '-3%'] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(10,132,255,0.08) 18%, rgba(94,92,230,0.1) 52%, rgba(90,200,250,0.08) 86%, transparent 100%)',
            filter: `blur(${motionLite ? 16 : 24}px)`,
          }}
        />
        <motion.div
          className="absolute inset-x-[-12%] top-[52%] h-40"
          animate={motionLite ? undefined : { x: ['4%', '-4%', '4%'] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(191,90,242,0.07) 20%, rgba(10,132,255,0.08) 50%, rgba(48,209,88,0.06) 82%, transparent 100%)',
            filter: `blur(${motionLite ? 14 : 22}px)`,
          }}
        />
      </div>

      {/* ── HERO ── */}
      <section className="pt-home-hero relative flex min-h-[100dvh] flex-col items-center justify-center px-6 pb-16 pt-14">
        <div className="pt-home-hero-inner">
          <div className="pt-home-hero-main text-center">
            <motion.div
              initial={motionLite ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="mb-6"
            >
              <div
                className="ios-app-icon mx-auto"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '21.6px',
                  background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 24px 64px rgba(10, 132, 255, 0.35), 0 8px 24px rgba(10, 132, 255, 0.2)',
                }}
              >
                <span style={{ fontSize: 44 }}>🎵</span>
              </div>
            </motion.div>

            <motion.div
              initial={motionLite ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mb-2"
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(10, 132, 255, 0.15)',
                  border: '1px solid rgba(10, 132, 255, 0.25)',
                  borderRadius: 20,
                  padding: '4px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '-0.08px',
                  color: 'var(--ios-blue)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--ios-blue)', display: 'inline-block' }} />
                18 Training Modes
              </span>
            </motion.div>

            <motion.h1
              initial={motionLite ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="ios-large-title mb-3"
              style={{ fontSize: 52, letterSpacing: '-0.5px', lineHeight: 1.05 }}
            >
              Pitch Therapy
            </motion.h1>

            <motion.p
              initial={motionLite ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="ios-callout mb-10 max-w-xs"
              style={{ color: 'var(--ios-label2)', lineHeight: 1.5 }}
            >
              A daily gym for your ears. Train pitch, frequency, intervals, and more.
            </motion.p>

            <motion.div
              initial={motionLite ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48, duration: 0.45 }}
              className="flex flex-col gap-3 w-full max-w-xs"
            >
              <motion.button
                whileHover={{ scale: 1.015, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => transitionTo('/dashboard')}
                className="ios-btn-primary"
                style={{ fontSize: 17 }}
              >
                Start Training
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.012 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => transitionTo('/daily')}
                className="ios-btn-secondary"
                style={{ fontSize: 17 }}
              >
                Daily Challenge
              </motion.button>
            </motion.div>
          </div>

          <motion.aside
            initial={motionLite ? { opacity: 1, y: 0 } : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pt-home-hero-side ios-card"
          >
            <div className="pt-home-side-header">
              <span className="pt-home-side-title">Today&apos;s Training Flow</span>
            </div>
            <div className="pt-home-side-list">
              {QUICK_FLOWS.map((item) => (
                <Link key={item.href} href={item.href} className="pt-home-side-link">
                  <span className="pt-home-side-icon">{item.icon}</span>
                  <span className="pt-home-side-copy">
                    <span className="pt-home-side-link-title">{item.title}</span>
                    <span className="pt-home-side-link-subtitle">{item.subtitle}</span>
                  </span>
                </Link>
              ))}
            </div>
            <div className="pt-home-category-strip">
              {CATEGORIES.map((cat) => (
                <div key={cat.label} className="pt-home-category-row">
                  <span className="pt-home-category-dot" style={{ background: cat.color }} />
                  <span className="pt-home-category-name">{cat.label}</span>
                  <span className="pt-home-category-count">{cat.ids.length}</span>
                </div>
              ))}
            </div>
          </motion.aside>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="pt-home-scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <span style={{ fontSize: 11, color: 'var(--ios-label3)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Scroll</span>
          <motion.svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--ios-label3)"
            strokeWidth="2"
            strokeLinecap="round"
            animate={motionLite ? undefined : { y: [0, 5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </motion.svg>
        </motion.div>
      </section>

      {/* ── MODE GRID ── */}
      <section className="pt-home-modes px-4 pb-20 max-w-6xl mx-auto">
        {CATEGORIES.map((cat, ci) => {
          const catModes = MODES.filter((m) => cat.ids.includes(m.id));
          return (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ci * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="pt-home-category-block mb-8"
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <div style={{ width: 3, height: 16, borderRadius: 2, background: cat.color }} />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--ios-label2)' }}>
                  {cat.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {catModes.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -3 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <Link href={m.href} className="ios-game-card ios-card-lift block h-full" style={{ textDecoration: 'none' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '10px',
                          background: `${m.color}18`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 10,
                          fontSize: 22,
                        }}
                      >
                        {m.icon}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.23px', color: 'var(--ios-label)', marginBottom: 3 }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ios-label3)', letterSpacing: '-0.08px', lineHeight: 1.4 }}>
                        {m.desc}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* CTA block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="pt-home-cta ios-card p-6 text-center mt-4"
          style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.12) 0%, rgba(94,92,230,0.12) 100%)', border: '1px solid rgba(10,132,255,0.15)', borderRadius: 16 }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔥</div>
          <div className="ios-title3 mb-2">Daily Challenge</div>
          <div style={{ fontSize: 15, color: 'var(--ios-label2)', marginBottom: 18, letterSpacing: '-0.23px' }}>
            A new challenge every day. Keep your streak alive.
          </div>
          <Link href="/daily" className="ios-btn-tonal" style={{ display: 'inline-flex', width: 'auto' }}>
            Play Today&apos;s Challenge
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
