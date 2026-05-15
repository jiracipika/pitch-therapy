'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHero } from '@/components/PremiumMotion';
import { useStatsContext } from '@/components/StatsProvider';

type Diff = 'easy' | 'medium' | 'hard';
type DiffMap = Record<string, Diff>;

const MODES = [
  { id: 'pitch-match',      label: 'Pitch Match',      icon: '🎤', color: '#0A84FF' },
  { id: 'note-id',          label: 'Note ID',           icon: '🎵', color: '#BF5AF2' },
  { id: 'frequency-guess',  label: 'Freq Guess',        icon: '📡', color: '#FF9F0A' },
  { id: 'note-wordle',      label: 'Note Wordle',       icon: '🟩', color: '#30D158' },
  { id: 'frequency-wordle', label: 'Freq Wordle',       icon: '🔊', color: '#5AC8FA' },
];

const SOUND_TYPES = [
  { id: 'sine',     label: 'Sine',     desc: 'Pure, clean',     wave: '∿' },
  { id: 'triangle', label: 'Triangle', desc: 'Warm, mellow',    wave: '△' },
  { id: 'square',   label: 'Square',   desc: 'Retro, buzzy',    wave: '⊓' },
  { id: 'sawtooth', label: 'Sawtooth', desc: 'Bright, rich',    wave: '⩘' },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', position: 'relative', width: 51, height: 31, flexShrink: 0 }}
    >
      <motion.div
        animate={{
          backgroundColor: on ? '#30D158' : 'rgba(120,120,128,0.32)',
          boxShadow: on ? '0 0 8px rgba(48,209,88,0.3)' : 'none',
        }}
        transition={{ duration: 0.25 }}
        style={{ width: 51, height: 31, borderRadius: 16, position: 'relative' }}
      >
        <motion.div
          animate={{ x: on ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            width: 27, height: 27, borderRadius: 14,
            background: '#fff',
            position: 'absolute', top: 2, left: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </motion.div>
    </button>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label3)', letterSpacing: '-0.08px', textTransform: 'uppercase', padding: '24px 4px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--ios-sep), transparent)' }} />
      <span>{children}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--ios-sep), transparent)' }} />
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  minHeight: 44,
  background: 'var(--ios-bg2)',
  gap: 12,
};

export default function SettingsPage() {
  const { stats, loaded, clearStats } = useStatsContext();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [difficulty, setDifficulty] = useState<DiffMap>({
    'pitch-match': 'medium', 'note-id': 'medium',
    'frequency-guess': 'medium', 'note-wordle': 'medium', 'frequency-wordle': 'medium',
  });
  const [sound,     setSound]     = useState(true);
  const [haptics,   setHaptics]   = useState(true);
  const [soundType, setSoundType] = useState('sine');
  const [volume,    setVolume]    = useState(70);

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="pt-page-shell pt-page-settings px-4 pt-14">

        <PageHero
          variant="settings"
          eyebrow="Tune your training"
          title="Settings"
          subtitle="Shape audio, feedback, and defaults so practice feels effortless."
        />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08, duration: 0.4 }}>
          <div className="pt-settings-layout">
            <div className="pt-settings-main">

              {/* ── AUDIO ── */}
              <SectionHeader>Audio</SectionHeader>
              <div className="ios-group pt-desktop-card" style={{ overflow: 'hidden', borderRadius: 12 }}>
                {/* Sound Effects */}
                <div style={{ ...rowStyle }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(10,132,255,0.2), rgba(10,132,255,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🔊</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>Sound Effects</div>
                    <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 1 }}>Game audio and tones</div>
                  </div>
                  <Toggle on={sound} onToggle={() => setSound(v => !v)} />
                </div>

                {/* Volume */}
                <div style={{ borderTop: '0.5px solid var(--ios-sep)', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(94,92,230,0.2), rgba(94,92,230,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎚️</div>
                      <span style={{ fontSize: 17, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>Volume</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label2)', fontVariantNumeric: 'tabular-nums' }}>{volume}%</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, right: 0, height: 4, borderRadius: 2, background: 'var(--ios-bg4)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, width: `${volume}%`, height: 4, borderRadius: 2, background: 'linear-gradient(90deg, #0A84FF, #5E5CE6)', pointerEvents: 'none', transition: 'width 0.1s' }} />
                    <input
                      type="range" min="0" max="100" value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      style={{ width: '100%', position: 'relative', zIndex: 1, background: 'transparent', appearance: 'none', height: 20, cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* Haptics */}
                <div style={{ ...rowStyle, borderTop: '0.5px solid var(--ios-sep)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(255,159,10,0.2), rgba(255,159,10,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📳</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>Haptic Feedback</div>
                    <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 1 }}>Vibration on answers</div>
                  </div>
                  <Toggle on={haptics} onToggle={() => setHaptics(v => !v)} />
                </div>
              </div>

              {/* ── SOUND TYPE ── */}
              <SectionHeader>Sound Type</SectionHeader>
              <div className="ios-group pt-desktop-card" style={{ overflow: 'hidden', borderRadius: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  {SOUND_TYPES.map((s, idx) => {
                    const active = soundType === s.id;
                    return (
                      <motion.button
                        key={s.id}
                        onClick={() => setSoundType(s.id)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          padding: '18px 8px',
                          background: active ? 'linear-gradient(135deg, rgba(10,132,255,0.1), rgba(94,92,230,0.06))' : 'transparent',
                          border: 'none', cursor: 'pointer',
                          borderTop: idx >= 2 ? '0.5px solid var(--ios-sep)' : 'none',
                          borderLeft: idx % 2 === 1 ? '0.5px solid var(--ios-sep)' : 'none',
                          borderBottom: active ? '2px solid var(--ios-blue)' : '2px solid transparent',
                          transition: 'border-bottom 0.2s',
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <div style={{ fontSize: 24, marginBottom: 4, opacity: active ? 1 : 0.5, transition: 'opacity 0.2s' }}>{s.wave}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--ios-blue)' : 'var(--ios-label)', letterSpacing: '-0.23px' }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>
                          {s.desc}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* ── DIFFICULTY ── */}
              <SectionHeader>Default Difficulty</SectionHeader>
              <div className="ios-group pt-desktop-card" style={{ overflow: 'hidden', borderRadius: 12 }}>
                {MODES.map((m, idx) => (
                  <div
                    key={m.id}
                    style={{
                      ...rowStyle,
                      borderTop: idx === 0 ? 'none' : '0.5px solid var(--ios-sep)',
                      flexWrap: 'wrap', gap: 0,
                      background: idx % 2 === 0 ? 'var(--ios-bg2)' : 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${m.color}22, ${m.color}0A)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, marginRight: 12 }}>
                      {m.icon}
                    </div>
                    <div style={{ flex: 1, fontSize: 17, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>
                      {m.label}
                    </div>
                    <div className="pt-diff-segments" style={{ display: 'flex', gap: 4, background: 'var(--ios-bg3)', borderRadius: 8, padding: 2 }}>
                      {(['easy', 'medium', 'hard'] as Diff[]).map((d) => {
                        const active = difficulty[m.id] === d;
                        return (
                          <motion.button
                            key={d}
                            onClick={() => setDifficulty({ ...difficulty, [m.id]: d })}
                            style={{
                              height: 26, borderRadius: 6, padding: '0 10px',
                              fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                              background: active ? m.color : 'transparent',
                              color: active ? '#000' : 'var(--ios-label3)',
                              letterSpacing: '-0.08px',
                            }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {d.charAt(0).toUpperCase() + d.slice(1)}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            </div>
            <div className="pt-settings-side">

              {/* ── APPEARANCE ── */}
              <SectionHeader>Appearance</SectionHeader>
              <div className="ios-group pt-desktop-card" style={{ overflow: 'hidden', borderRadius: 12 }}>
                <div style={rowStyle}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🌙</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>Dark Mode</div>
                    <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 1 }}>Always on</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-green)', background: 'rgba(48,209,88,0.12)', borderRadius: 8, padding: '4px 10px' }}>
                    On
                  </div>
                </div>
              </div>

              {/* ── DATA ── */}
              <SectionHeader>Data</SectionHeader>
              <div className="ios-group pt-desktop-card" style={{ overflow: 'hidden', borderRadius: 12 }}>
                <div style={rowStyle}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(10,132,255,0.15), rgba(10,132,255,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📊</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>Game History</div>
                    <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 1 }}>
                      {loaded ? `${stats.results.length} games recorded` : 'Loading...'}
                    </div>
                  </div>
                </div>
                <div style={{ ...rowStyle, borderTop: '0.5px solid var(--ios-sep)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(255,149,0,0.15), rgba(255,149,0,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🔥</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>Current Streak</div>
                    <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 1 }}>
                      {loaded ? `${stats.streak} days (best: ${stats.bestStreak})` : 'Loading...'}
                    </div>
                  </div>
                </div>
                {showClearConfirm ? (
                  <div style={{ ...rowStyle, borderTop: '0.5px solid var(--ios-sep)', background: 'rgba(255,59,48,0.06)', gap: 8 }}>
                    <div style={{ flex: 1, fontSize: 14, color: '#FF453A', fontWeight: 500 }}>
                      Delete all data? This cannot be undone.
                    </div>
                    <button
                      onClick={() => { clearStats(); setShowClearConfirm(false); }}
                      style={{ height: 32, borderRadius: 8, padding: '0 14px', background: 'linear-gradient(135deg, #FF453A, #FF375F)', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      style={{ height: 32, borderRadius: 8, padding: '0 14px', background: 'var(--ios-bg3)', color: 'var(--ios-label)', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    style={{ ...rowStyle, borderTop: '0.5px solid var(--ios-sep)', width: '100%', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(255,59,48,0.12), rgba(255,59,48,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🗑️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 17, color: '#FF453A', letterSpacing: '-0.43px' }}>Clear All Data</div>
                      <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 1 }}>Remove all game history</div>
                    </div>
                  </button>
                )}
              </div>

              {/* ── ABOUT ── */}
              <SectionHeader>About</SectionHeader>
              <div className="ios-group pt-desktop-card" style={{ overflow: 'hidden', borderRadius: 12 }}>
                <div style={{ ...rowStyle }}>
                  <span style={{ flex: 1, fontSize: 17, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>Version</span>
                  <span style={{ fontSize: 17, color: 'var(--ios-label3)', letterSpacing: '-0.43px' }}>0.1.0</span>
                </div>
                <div style={{ ...rowStyle, borderTop: '0.5px solid var(--ios-sep)' }}>
                  <span style={{ flex: 1, fontSize: 17, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>Build</span>
                  <span style={{ fontFamily: '-apple-system, "SF Mono", monospace', fontSize: 15, color: 'var(--ios-label3)' }}>2025-q1</span>
                </div>
                <div style={{ borderTop: '0.5px solid var(--ios-sep)', padding: '20px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.23px' }}>Pitch Therapy</div>
                  <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginTop: 4 }}>Train Your Ear. Every Day.</div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
