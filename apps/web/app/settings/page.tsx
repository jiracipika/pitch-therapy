'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const MODES = [
  { id: 'pitch-match', label: 'Pitch Match', color: '#60A5FA' },
  { id: 'note-id', label: 'Note ID', color: '#A78BFA' },
  { id: 'frequency-guess', label: 'Frequency Guess', color: '#FBBF24' },
  { id: 'note-wordle', label: 'Note Wordle', color: '#4ADE80' },
  { id: 'frequency-wordle', label: 'Frequency Wordle', color: '#2DD4BF' },
];

type DiffMap = Record<string, 'easy' | 'medium' | 'hard'>;

const SOUND_TYPES = [
  { id: 'sine', label: 'Sine', desc: 'Pure, clean tone' },
  { id: 'triangle', label: 'Triangle', desc: 'Softer, mellow' },
  { id: 'square', label: 'Square', desc: 'Retro, buzzy' },
  { id: 'sawtooth', label: 'Sawtooth', desc: 'Bright, rich' },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className="toggle-track flex-shrink-0"
      style={{
        background: on ? '#30d158' : 'rgba(255,255,255,0.12)',
      }}
    >
      <div
        className="toggle-thumb"
        style={{ left: on ? '22px' : '2px' }}
      />
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="section-header px-1 mt-8 mb-2">{children}</p>
  );
}

export default function SettingsPage() {
  const [difficulty, setDifficulty] = useState<DiffMap>({
    'pitch-match': 'medium',
    'note-id': 'medium',
    'frequency-guess': 'medium',
    'note-wordle': 'medium',
    'frequency-wordle': 'medium',
  });
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [soundType, setSoundType] = useState('sine');
  const [volume, setVolume] = useState(70);

  return (
    <div className="min-h-screen pb-nav px-4 pt-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-lg"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white" style={{ letterSpacing: '-0.03em' }}>
            Settings
          </h1>
        </div>

        {/* ── AUDIO ── */}
        <SectionLabel>Audio</SectionLabel>
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Sound Effects</p>
                <p className="text-xs text-zinc-600">Game audio and feedback tones</p>
              </div>
            </div>
            <Toggle on={sound} onToggle={() => setSound((v) => !v)} />
          </div>

          {/* Volume slider */}
          <div className="px-5 py-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-white">Volume</p>
              </div>
              <span className="text-sm font-medium text-zinc-400 tabular-nums">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-[#A78BFA] h-1 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #A78BFA ${volume}%, rgba(255,255,255,0.08) ${volume}%)` }}
            />
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 18L12 22L16 18"/>
                  <path d="M8 6L12 2L16 6"/>
                  <line x1="12" y1="2" x2="12" y2="22"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Haptic Feedback</p>
                <p className="text-xs text-zinc-600">Vibration on answers</p>
              </div>
            </div>
            <Toggle on={haptics} onToggle={() => setHaptics((v) => !v)} />
          </div>
        </div>

        {/* ── SOUND TYPE ── */}
        <SectionLabel>Sound Type</SectionLabel>
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-2 gap-0">
            {SOUND_TYPES.map((s, idx) => {
              const active = soundType === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSoundType(s.id)}
                  className={`flex flex-col items-center gap-1 py-4 transition-all duration-200 ${idx < 3 && idx % 2 === 0 ? '' : ''} ${active ? '' : 'hover:bg-white/[0.03]'}`}
                  style={{
                    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  }}
                >
                  <div
                    className={`text-xs font-semibold transition-colors ${active ? 'text-white' : 'text-zinc-500'}`}
                  >
                    {s.label}
                  </div>
                  <div className="text-[10px] text-zinc-700">{s.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── DIFFICULTY ── */}
        <SectionLabel>Default Difficulty</SectionLabel>
        <div className="glass-card overflow-hidden">
          {MODES.map((m, idx) => (
            <div
              key={m.id}
              className={`flex items-center justify-between px-5 py-3.5 ${idx < MODES.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                <span className="text-sm font-medium text-white">{m.label}</span>
              </div>
              <div className="flex gap-1">
                {(['easy', 'medium', 'hard'] as const).map((d) => {
                  const active = difficulty[m.id] === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setDifficulty({ ...difficulty, [m.id]: d })}
                      className="rounded-full px-3 py-1 text-xs font-medium transition-all duration-200"
                      style={
                        active
                          ? { background: m.color, color: '#000', boxShadow: `0 0 8px ${m.color}40` }
                          : { background: 'rgba(255,255,255,0.05)', color: 'rgb(113,113,122)', border: '1px solid rgba(255,255,255,0.07)' }
                      }
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── APPEARANCE ── */}
        <SectionLabel>Appearance</SectionLabel>
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgb(161,161,170)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Dark Mode</p>
                <p className="text-xs text-zinc-600">Only dark mode for now</p>
              </div>
            </div>
            <div className="rounded-full px-3 py-1 text-xs font-semibold text-black" style={{ background: '#ffffff' }}>
              Active
            </div>
          </div>
        </div>

        {/* ── ABOUT ── */}
        <SectionLabel>About</SectionLabel>
        <div className="glass-card overflow-hidden mb-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <span className="text-sm font-medium text-white">Version</span>
            <span className="text-sm text-zinc-500">0.1.0</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <span className="text-sm font-medium text-white">Build</span>
            <span className="text-sm text-zinc-500 font-mono">2025-q1</span>
          </div>
          <div className="px-5 py-5 text-center">
            <p className="text-sm font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>Pitch Therapy</p>
            <p className="mt-0.5 text-xs text-zinc-600">Train Your Ear. Every Day.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
