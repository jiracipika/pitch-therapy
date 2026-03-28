'use client';

import { motion } from 'framer-motion';

const MODES = [
  { id: 'pitch-match',      label: 'Pitch Match',      icon: '🎤', color: '#0A84FF' },
  { id: 'note-id',          label: 'Note ID',           icon: '🎵', color: '#BF5AF2' },
  { id: 'frequency-guess',  label: 'Freq Guess',        icon: '📡', color: '#FF9F0A' },
  { id: 'note-wordle',      label: 'Note Wordle',       icon: '🟩', color: '#30D158' },
  { id: 'frequency-wordle', label: 'Freq Wordle',       icon: '🔊', color: '#5AC8FA' },
  { id: 'pitch-memory',     label: 'Pitch Memory',      icon: '🧠', color: '#FF375F' },
  { id: 'name-that-note',   label: 'Name That Note',    icon: '🎼', color: '#32ADE6' },
  { id: 'frequency-hunt',   label: 'Freq Hunt',         icon: '🔍', color: '#FF9F0A' },
  { id: 'drone-lock',       label: 'Drone Lock',        icon: '🔒', color: '#63E6E2' },
  { id: 'speed-round',      label: 'Speed Round',       icon: '⚡', color: '#FF9F0A' },
];

const WEEKS = 5;
const DAYS  = 7;
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const STATS = [
  { label: 'Games', value: '0' },
  { label: 'Best Streak', value: '0' },
  { label: 'Avg Accuracy', value: '—' },
];

export default function ProgressPage() {
  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-lg mx-auto px-4 pt-14">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', marginBottom: 2 }}>
            Your journey
          </div>
          <h1 className="ios-large-title">Progress</h1>
        </motion.div>

        {/* ── SUMMARY STATS ── */}
        <motion.div
          className="grid grid-cols-3 gap-2.5 mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="ios-card"
              style={{ padding: '14px 12px', textAlign: 'center' }}
            >
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4, letterSpacing: '-0.08px', lineHeight: 1.3 }}>
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── ACTIVITY CALENDAR ── */}
        <div style={{ fontSize: 13, color: 'var(--ios-label3)', textTransform: 'uppercase', letterSpacing: '-0.08px', padding: '20px 4px 8px' }}>
          Activity
        </div>

        <motion.div
          className="ios-card"
          style={{ padding: '16px' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4 }}
        >
          {/* Day labels */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            {DAY_LABELS.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--ios-label3)', letterSpacing: 0.3 }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Array.from({ length: WEEKS }).map((_, w) => (
              <div key={w} style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: DAYS }).map((_, d) => (
                  <div
                    key={d}
                    className="ios-activity-cell"
                    style={{ flex: 1, aspectRatio: '1 / 1', minHeight: 10 }}
                  />
                ))}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: 'var(--ios-label3)', textAlign: 'right', marginTop: 10 }}>
            Play to fill this in
          </div>
        </motion.div>

        {/* ── PER MODE ── */}
        <div style={{ fontSize: 13, color: 'var(--ios-label3)', textTransform: 'uppercase', letterSpacing: '-0.08px', padding: '24px 4px 8px' }}>
          Per Mode
        </div>

        <motion.div
          className="ios-group"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {MODES.map((m, idx) => (
            <div
              key={m.id}
              className="ios-row"
              style={{
                padding: '14px 16px',
                borderTop: idx === 0 ? 'none' : '0.5px solid var(--ios-sep)',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 0,
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
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
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--ios-label)', letterSpacing: '-0.32px' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 1 }}>
                    0 games · — accuracy
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label2)' }}>—</div>
                  <div style={{ fontSize: 11, color: 'var(--ios-label3)' }}>Best</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="ios-progress-track">
                <div
                  className="ios-progress-fill"
                  style={{ width: '0%', background: m.color }}
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── EMPTY STATE ── */}
        <motion.div
          className="ios-card"
          style={{ padding: '32px 20px', textAlign: 'center', marginTop: 12, marginBottom: 8 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.23px', marginBottom: 6 }}>
            No data yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px' }}>
            Play games to see your progress charts here.
          </div>
        </motion.div>

      </div>
    </div>
  );
}
