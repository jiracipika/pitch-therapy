'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useStatsContext } from '@/components/StatsProvider';
import { useSettingsContext } from '@/components/SettingsProvider';
import { GAME_MODE_META } from '@pitch-therapy/core';
import type { Difficulty } from '@/lib/useSettings';

type Diff = 'easy' | 'medium' | 'hard';

// Mode ids that support per-mode difficulty in the settings panel.
// Kept as a local constant (not GAME_MODES) because not every play mode
// has a difficulty selector — only the core five.
const DIFFICULTY_MODE_IDS = [
  'pitch-match',
  'note-id',
  'frequency-guess',
  'note-wordle',
  'frequency-wordle',
] as const;

const MODES = DIFFICULTY_MODE_IDS.map((id) => {
  const meta = GAME_MODE_META[id];
  return { id: meta.id, label: meta.label, icon: meta.icon, color: meta.accentHex };
});

const SOUND_TYPES = [
  { id: 'sine',     label: 'Sine',     desc: 'Pure, clean' },
  { id: 'triangle', label: 'Triangle', desc: 'Warm, mellow' },
  { id: 'square',   label: 'Square',   desc: 'Retro, buzzy' },
  { id: 'sawtooth', label: 'Sawtooth', desc: 'Bright, rich' },
] as const;

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="ios-toggle-wrap"
      style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
    >
      <div className={`ios-toggle-track ${on ? 'on' : 'off'}`} />
      <div className={`ios-toggle-thumb ${on ? 'on' : 'off'}`} />
    </button>
  );
}

const PRESETS = [
  { id: 'focus', label: 'Focus Practice', sub: 'Balanced cues for longer sessions' },
  { id: 'coach', label: 'Coach Mode', sub: 'Louder guidance + tactile feedback' },
  { id: 'quiet', label: 'Quiet Session', sub: 'Low-volume, distraction-free setup' },
] as const;

export default function SettingsPage() {
  const { stats, loaded, clearStats } = useStatsContext();
  const {
    settings,
    setSound,
    setHaptics,
    setSoundType,
    setVolume,
    setDifficulty,
    applyPreset,
  } = useSettingsContext();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const reduce = useReducedMotion();

  const { sound, haptics, soundType, volume, difficulty } = settings;

  const handleDifficulty = (mode: string, diff: Difficulty) => setDifficulty(mode, diff);

  const fade = (delay: number) => (reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.42 } });

  return (
    <div className="studio-page">
      <div className="pt-page-shell studio-dashboard">
        <motion.header className="studio-inner-header" {...fade(0)}>
          <div>
            <span className="studio-overline">SETTINGS / LISTENING STUDIO</span>
            <h1>Tune the<br /><em>instrument.</em></h1>
            <p>Shape audio, feedback, and defaults so every session feels effortless.</p>
          </div>
          <div className="studio-header-chip">
            <span>VERSION</span>
            <b style={{ fontSize: 22 }}>0.1.0</b>
            <small>2025-Q1</small>
          </div>
        </motion.header>

        <section className="studio-inner-grid">
          <div className="studio-inner-main">
            {/* ── AUDIO ── */}
            <motion.section className="studio-panel" {...fade(0.05)}>
              <div className="studio-panel-heading"><div><span>AUDIO</span><h2>Sound & feedback</h2></div></div>
              <div className="studio-row-list">
                <div className="studio-control-row">
                  <span className="studio-control-icon" style={{ background: 'color-mix(in srgb, var(--ios-blue) 12%, transparent)' }}>🔊</span>
                  <div>
                    <b>Sound Effects</b>
                    <small>Game audio and tones</small>
                  </div>
                  <Toggle on={sound} onToggle={() => setSound(!sound)} label="Sound effects" />
                </div>
                <div className="studio-control-row">
                  <span className="studio-control-icon" style={{ background: 'color-mix(in srgb, var(--ios-purple) 12%, transparent)' }}>🎚️</span>
                  <div>
                    <b>Volume</b>
                    <small>{volume}% — slider below</small>
                  </div>
                  <b style={{ color: 'var(--ios-blue)', font: '700 13px/1 ui-monospace, SFMono-Regular, Menlo, monospace' }}>{volume}%</b>
                </div>
                <div style={{ padding: '2px 2px 12px 54px' }}>
                  <input
                    type="range" min="0" max="100" value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    aria-label="Volume"
                    className="studio-range"
                    style={{ '--range-fill': `${volume}%` } as React.CSSProperties}
                  />
                </div>
                <div className="studio-control-row">
                  <span className="studio-control-icon" style={{ background: 'color-mix(in srgb, var(--ios-orange) 12%, transparent)' }}>📳</span>
                  <div>
                    <b>Haptic Feedback</b>
                    <small>Vibration on answers</small>
                  </div>
                  <Toggle on={haptics} onToggle={() => setHaptics(!haptics)} label="Haptic feedback" />
                </div>
              </div>
            </motion.section>

            {/* ── SOUND TYPE ── */}
            <motion.section className="studio-panel" {...fade(0.1)}>
              <div className="studio-panel-heading"><div><span>WAVEFORM</span><h2>Sound type</h2></div></div>
              <div className="studio-wave-grid">
                {SOUND_TYPES.map((s) => {
                  const active = soundType === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSoundType(s.id)}
                      className={active ? 'is-active' : ''}
                      aria-pressed={active}
                    >
                      <b>{s.label}</b>
                      <small>{s.desc}</small>
                    </button>
                  );
                })}
              </div>
            </motion.section>

            {/* ── DIFFICULTY ── */}
            <motion.section className="studio-panel" {...fade(0.15)}>
              <div className="studio-panel-heading"><div><span>DIFFICULTY</span><h2>Default per mode</h2></div></div>
              <div className="studio-row-list">
                {MODES.map((m) => (
                  <div key={m.id} className="studio-control-row" style={{ gridTemplateColumns: '40px 1fr auto' }}>
                    <span className="studio-control-icon" style={{ background: `color-mix(in srgb, ${m.color} 14%, transparent)` }}>{m.icon}</span>
                    <div>
                      <b>{m.label}</b>
                      <small>Applies on new sessions</small>
                    </div>
                    <div className="studio-segment" role="group" aria-label={`${m.label} difficulty`}>
                      {(['easy', 'medium', 'hard'] as Diff[]).map((d) => {
                        const active = (difficulty[m.id] ?? 'medium') === d;
                        return (
                          <button
                            key={d}
                            onClick={() => handleDifficulty(m.id, d)}
                            className={active ? 'is-active' : ''}
                            aria-pressed={active}
                          >
                            {d.charAt(0).toUpperCase() + d.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          <aside className="studio-inner-side">
            {/* ── PRESETS ── */}
            <motion.section className="studio-panel" {...fade(0.1)}>
              <div className="studio-panel-heading"><div><span>PRESETS</span><h2>Quick setup</h2></div></div>
              <div className="studio-row-list">
                {PRESETS.map((profile) => (
                  <button key={profile.id} className="studio-preset-row" onClick={() => applyPreset(profile.id)}>
                    <span>
                      <b>{profile.label}</b>
                      <small>{profile.sub}</small>
                    </span>
                    <span>APPLY →</span>
                  </button>
                ))}
              </div>
            </motion.section>

            {/* ── DATA ── */}
            <motion.section className="studio-panel" {...fade(0.15)}>
              <div className="studio-panel-heading"><div><span>DATA</span><h2>Your training data</h2></div></div>
              <div className="studio-row-list">
                <div className="studio-history-row" style={{ minHeight: 52 }}>
                  <span>Games recorded</span>
                  <strong style={{ color: 'var(--ios-label)', font: '700 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace' }}>{loaded ? stats.results.length : '—'}</strong>
                </div>
                <div className="studio-history-row" style={{ minHeight: 52 }}>
                  <span>Current streak</span>
                  <strong style={{ color: 'var(--ios-label)', font: '700 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace' }}>{loaded ? `${stats.streak} D · BEST ${stats.bestStreak}` : '—'}</strong>
                </div>
                {showClearConfirm ? (
                  <div style={{ display: 'grid', gap: 10, padding: '14px 2px' }}>
                    <p style={{ color: 'var(--ios-red)', fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>Delete all data? This cannot be undone.</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="studio-danger-btn is-solid" onClick={() => { clearStats(); setShowClearConfirm(false); }}>Delete everything</button>
                      <button className="studio-quiet-btn" onClick={() => setShowClearConfirm(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px 2px', minHeight: 52, display: 'flex', alignItems: 'center' }}>
                    <button className="studio-danger-btn" onClick={() => setShowClearConfirm(true)}>Clear all training data</button>
                  </div>
                )}
              </div>
            </motion.section>

            {/* ── ABOUT ── */}
            <motion.section className="studio-panel studio-daily-panel" {...fade(0.2)}>
              <div className="studio-panel-heading"><div><span>ABOUT</span><h2>Pitch Therapy</h2></div></div>
              <p>Train your ear. Every day. Built as a listening studio — short, focused sessions for sharper hearing.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '5px 10px', border: '1px solid var(--pt-stroke)', borderRadius: 999, color: 'var(--ios-label2)', font: '600 9px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace' }}>V 0.1.0</span>
                <span style={{ padding: '5px 10px', border: '1px solid var(--pt-stroke)', borderRadius: 999, color: 'var(--ios-label2)', font: '600 9px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace' }}>BUILD 2025-Q1</span>
              </div>
            </motion.section>
          </aside>
        </section>
      </div>
    </div>
  );
}
