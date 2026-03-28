'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

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

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--ios-bg)' }}>

      {/* Floating note symbols */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden select-none" aria-hidden>
        <span className="animate-note-1 absolute left-[8%]  top-[18%] text-6xl font-serif" style={{ color: 'rgba(255,255,255,0.04)' }}>♪</span>
        <span className="animate-note-2 absolute left-[75%] top-[12%] text-5xl font-serif" style={{ color: 'rgba(255,255,255,0.03)' }}>♫</span>
        <span className="animate-note-3 absolute left-[20%] top-[55%] text-7xl font-serif" style={{ color: 'rgba(255,255,255,0.03)' }}>♬</span>
        <span className="animate-note-2 absolute left-[65%] top-[45%] text-5xl font-serif" style={{ color: 'rgba(255,255,255,0.03)' }}>♩</span>
        <span className="animate-note-1 absolute left-[45%] top-[72%] text-4xl font-serif" style={{ color: 'rgba(255,255,255,0.03)' }}>♪</span>
      </div>

      {/* ── HERO ── */}
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center pb-16">
        {/* App icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
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
              boxShadow: '0 20px 60px rgba(10, 132, 255, 0.3)',
            }}
          >
            <span style={{ fontSize: 44 }}>🎵</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="ios-large-title mb-3"
          style={{ fontSize: 52, letterSpacing: '-0.5px', lineHeight: 1.05 }}
        >
          Pitch Therapy
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="ios-callout mb-10 max-w-xs"
          style={{ color: 'var(--ios-label2)', lineHeight: 1.5 }}
        >
          A daily gym for your ears. Train pitch, frequency, intervals, and more.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.45 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <Link href="/dashboard" className="ios-btn-primary" style={{ fontSize: 17 }}>
            Start Training
          </Link>
          <Link href="/daily" className="ios-btn-secondary" style={{ fontSize: 17 }}>
            Daily Challenge
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <span style={{ fontSize: 11, color: 'var(--ios-label3)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Scroll</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ios-label3)" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </motion.div>
      </section>

      {/* ── MODE GRID ── */}
      <section className="px-4 pb-20 max-w-lg mx-auto">
        {CATEGORIES.map((cat, ci) => {
          const catModes = MODES.filter((m) => cat.ids.includes(m.id));
          return (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ci * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8"
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
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <Link href={m.href} className="ios-game-card block h-full" style={{ textDecoration: 'none' }}>
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
          className="ios-card p-6 text-center mt-4"
          style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.12) 0%, rgba(94,92,230,0.12) 100%)', border: '1px solid rgba(10,132,255,0.15)', borderRadius: 16 }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔥</div>
          <div className="ios-title3 mb-2">Daily Challenge</div>
          <div style={{ fontSize: 15, color: 'var(--ios-label2)', marginBottom: 18, letterSpacing: '-0.23px' }}>
            A new challenge every day. Keep your streak alive.
          </div>
          <Link href="/daily" className="ios-btn-tonal" style={{ display: 'inline-flex', width: 'auto' }}>
            Play Today's Challenge
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
