'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStatsContext } from '@/components/StatsProvider';

const MODES = [
  { id: 'pitch-match',      label: 'Pitch Match',      icon: '🎤', color: '#0A84FF', desc: 'Match pitches with your voice',         href: '/play/pitch-match' },
  { id: 'note-id',          label: 'Note ID',           icon: '🎵', color: '#BF5AF2', desc: 'Identify notes by ear',                href: '/play/note-id' },
  { id: 'frequency-guess',  label: 'Freq Guess',        icon: '📡', color: '#FF9F0A', desc: 'Guess the exact frequency',            href: '/play/frequency-guess' },
  { id: 'note-wordle',      label: 'Note Wordle',       icon: '🟩', color: '#30D158', desc: 'Wordle meets ear training',            href: '/play/note-wordle' },
  { id: 'frequency-wordle', label: 'Freq Wordle',       icon: '🔊', color: '#5AC8FA', desc: 'Hunt for a hidden frequency',          href: '/play/frequency-wordle' },
  { id: 'pitch-memory',     label: 'Pitch Memory',      icon: '🧠', color: '#FF375F', desc: 'Reproduce note sequences',            href: '/play/pitch-memory' },
  { id: 'name-that-note',   label: 'Name That Note',    icon: '🎼', color: '#32ADE6', desc: 'Read the musical staff',              href: '/play/name-that-note' },
  { id: 'frequency-hunt',   label: 'Freq Hunt',         icon: '🔍', color: '#FF9F0A', desc: 'Scrub to find exact frequency',       href: '/play/frequency-hunt' },
  { id: 'drone-lock',       label: 'Drone Lock',        icon: '🔒', color: '#63E6E2', desc: 'Sing intervals over a drone',         href: '/play/drone-lock' },
  { id: 'speed-round',      label: 'Speed Round',       icon: '⚡', color: '#FF9F0A', desc: 'Rapid-fire note identification',      href: '/play/speed-round' },
  { id: 'chord-detective',  label: 'Chord Detective',   icon: '🕵️', color: '#FF375F', desc: 'Identify chord quality',              href: '/play/chord-detective' },
  { id: 'waveform-match',   label: 'Waveform Match',    icon: '〰️', color: '#5E5CE6', desc: 'Align waveforms by ear',             href: '/play/waveform-match' },
  { id: 'tuning-battle',    label: 'Tuning Battle',     icon: '⚔️', color: '#FF453A', desc: '2-player race to lock the note',     href: '/play/tuning-battle' },
  { id: 'tune-in',          label: 'Tune In',           icon: '📻', color: '#FF375F', desc: 'Hit target notes with tuning meter', href: '/play/tune-in' },
  { id: 'piano-tap',        label: 'Piano Tap',         icon: '🎹', color: '#5E5CE6', desc: 'Tap correct piano keys',             href: '/play/piano-tap' },
  { id: 'frequency-slider', label: 'Freq Slider',       icon: '🎚️', color: '#5AC8FA', desc: 'Drag to match hidden frequencies',   href: '/play/frequency-slider' },
  { id: 'cents-deviation',  label: 'Cents Deviation',   icon: '📐', color: '#30D158', desc: 'Detect microtonal shifts',           href: '/play/cents-deviation' },
  { id: 'interval-archer',  label: 'Interval Archer',   icon: '🏹', color: '#BF5AF2', desc: 'Identify musical intervals',         href: '/play/interval-archer' },
];

function StreakRing({ streak, size = 80 }: { streak: number; size?: number }) {
  const sw = 3;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const progress = Math.min(streak / 7, 1);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="ios-streak-ring" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke="var(--ios-orange)" strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.7s ease-out', filter: progress > 0 ? 'drop-shadow(0 0 4px rgba(255,159,10,0.5))' : 'none' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontSize: 22 }}>🔥</span>
      </div>
    </div>
  );
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);

      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span style={{ fontFamily: '-apple-system, "SF Mono", monospace', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)', fontVariantNumeric: 'tabular-nums' }}>
      {timeLeft}
    </span>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};
const rowItem = {
  hidden:  { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export default function Dashboard() {
  const { stats, loaded } = useStatsContext();

  // Recently played modes (last 3 unique)
  const recentModes = [...new Set(stats.results.slice(-10).reverse().map((r) => r.mode))].slice(0, 3);
  const totalGames = stats.results.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayGames = stats.results.filter((r) => r.date.startsWith(todayStr)).length;

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-lg mx-auto px-4 pt-14">

        {/* ── GREETING ── */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', marginBottom: 2 }}>
            {greeting()}
          </div>
          <h1 className="ios-large-title">Ready to train?</h1>
        </motion.div>

        {/* ── STREAK + DAILY ROW ── */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Streak card */}
          <div className="ios-card ios-card-lift flex items-center gap-4 p-4" style={{ minHeight: 96 }}>
            <StreakRing streak={stats.streak} />
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-1px', color: 'var(--ios-label)', lineHeight: 1 }}>
                {loaded ? stats.streak : '—'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginTop: 2, letterSpacing: '-0.08px' }}>
                Day Streak{stats.bestStreak > 0 ? ` · Best: ${stats.bestStreak}` : ''}
              </div>
            </div>
          </div>

          {/* Daily card */}
          <div className="ios-card ios-card-lift flex flex-col justify-between p-4" style={{ minHeight: 96 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--ios-label3)', marginBottom: 4 }}>
                Daily Reset
              </div>
              <CountdownTimer />
            </div>
            <Link
              href="/daily"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 32,
                borderRadius: 8,
                background: 'var(--ios-blue)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '-0.08px',
                textDecoration: 'none',
                marginTop: 8,
              }}
            >
              Play Today
            </Link>
          </div>
        </motion.div>

        {/* ── TODAY'S SUMMARY ── */}
        {loaded && totalGames > 0 && (
          <motion.div
            className="grid grid-cols-3 gap-2 mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="ios-card ios-card-lift" style={{ padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ios-blue)', letterSpacing: '-0.5px' }}>{todayGames}</div>
              <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>Today</div>
            </div>
            <div className="ios-card ios-card-lift" style={{ padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ios-purple)', letterSpacing: '-0.5px' }}>{totalGames}</div>
              <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>All Time</div>
            </div>
            <div className="ios-card ios-card-lift" style={{ padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ios-green)', letterSpacing: '-0.5px' }}>
                {totalGames > 0 ? Math.round(stats.results.reduce((s, r) => s + r.accuracy, 0) / totalGames * 100) : 0}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>Avg Acc</div>
            </div>
          </motion.div>
        )}

        {/* ── RECENTLY PLAYED ── */}
        {loaded && recentModes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
            className="mb-6"
          >
            <div style={{ fontSize: 13, fontWeight: 400, letterSpacing: '-0.08px', textTransform: 'uppercase', color: 'var(--ios-label3)', marginBottom: 8, marginTop: 16, paddingLeft: 4 }}>
              Recently Played
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {recentModes.map((modeId) => {
                const m = MODES.find((mode) => mode.id === modeId);
                if (!m) return null;
                return (
                  <Link key={m.id} href={m.href} className="ios-game-card" style={{ textDecoration: 'none', padding: 12 }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.2px', lineHeight: 1.3 }}>{m.label}</div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── QUICK PLAY (fallback when no recent) ── */}
        {loaded && recentModes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.4 }}
            className="mb-6"
          >
            <div style={{ fontSize: 13, fontWeight: 400, letterSpacing: '-0.08px', textTransform: 'uppercase', color: 'var(--ios-label3)', marginBottom: 8, marginTop: 20, paddingLeft: 4 }}>
              Quick Play
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MODES.slice(0, 2).map((m) => (
                <Link key={m.id} href={m.href} className="ios-game-card" style={{ textDecoration: 'none', padding: 14 }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{m.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.23px' }}>{m.label}</div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── ALL MODES ── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 400, letterSpacing: '-0.08px', textTransform: 'uppercase', color: 'var(--ios-label3)', marginBottom: 8, paddingLeft: 4 }}>
            All Modes
          </div>
          <div className="ios-group">
            <motion.div variants={stagger} initial="hidden" animate="visible">
              {MODES.map((m, idx) => {
                const modeStats = loaded ? (
                  stats.results.filter((r) => r.mode === m.id)
                ) : [];
                const gamesPlayed = modeStats.length;
                const bestScore = gamesPlayed > 0 ? Math.max(...modeStats.map((r) => r.score)) : null;

                return (
                  <motion.div key={m.id} variants={rowItem}>
                    <Link
                      href={m.href}
                      className="ios-row"
                      style={{
                        textDecoration: 'none',
                        borderTop: idx === 0 ? 'none' : '0.5px solid var(--ios-sep)',
                        padding: '11px 16px',
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9,
                          background: `${m.color}18`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          marginRight: 12,
                          flexShrink: 0,
                        }}
                      >
                        {m.icon}
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--ios-label)', letterSpacing: '-0.32px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {gamesPlayed > 0 ? `${gamesPlayed} games · Best: ${bestScore}` : m.desc}
                        </div>
                      </div>

                      {/* Chevron */}
                      <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}>
                        <path d="M1 1l5 5-5 5" stroke="var(--ios-label4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
}
