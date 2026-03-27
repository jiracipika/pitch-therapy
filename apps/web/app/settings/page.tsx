'use client';

import { useState } from 'react';

const MODES = [
  { id: 'pitch-match', label: 'Pitch Match', icon: '🎤' },
  { id: 'note-id', label: 'Note ID', icon: '🎵' },
  { id: 'frequency-guess', label: 'Frequency Guess', icon: '🎯' },
  { id: 'note-wordle', label: 'Note Wordle', icon: '🟩' },
  { id: 'frequency-wordle', label: 'Frequency Wordle', icon: '🔵' },
];

type DiffMap = Record<string, 'easy' | 'medium' | 'hard'>;

export default function SettingsPage() {
  const [difficulty, setDifficulty] = useState<DiffMap>({
    'pitch-match': 'medium', 'note-id': 'medium', 'frequency-guess': 'medium',
    'note-wordle': 'medium', 'frequency-wordle': 'medium',
  });
  const [sound, setSound] = useState(true);

  return (
    <div className="min-h-screen px-4 pt-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white">⚙️ Settings</h1>

        <div className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-white mb-4">Default Difficulty</h2>
          <div className="space-y-3">
            {MODES.map((m) => (
              <div key={m.id} className="glass-card flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <span className="text-xl">{m.icon}</span>
                  <span className="font-medium text-white">{m.label}</span>
                </div>
                <div className="flex gap-1">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button key={d} onClick={() => setDifficulty({ ...difficulty, [m.id]: d })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-out ${difficulty[m.id] === d ? 'bg-white text-black' : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'}`}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-white mb-4">Sound</h2>
          <div className="glass-card flex items-center justify-between p-5">
            <span className="font-medium text-white">🔊 Sound Effects</span>
            <button onClick={() => setSound(!sound)}
              className={`relative h-8 w-14 rounded-full transition-all duration-300 ease-out ${sound ? 'bg-[#60A5FA]' : 'bg-white/10'}`}>
              <div className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all duration-300 ease-out ${sound ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-white mb-4">Theme</h2>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xl">🌙</span>
                <div>
                  <span className="font-medium text-white">Dark Mode</span>
                  <p className="text-xs text-zinc-600">Only dark mode available for now</p>
                </div>
              </div>
              <div className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black">Active</div>
            </div>
          </div>
        </div>

        <div className="mt-8 glass-card p-8 text-center">
          <h3 className="text-lg font-semibold tracking-tight text-white">🎵 Pitch Therapy</h3>
          <p className="mt-1 text-sm text-zinc-500">Train Your Ear. Every Day.</p>
          <p className="mt-2 text-xs text-zinc-700">Version 0.1.0</p>
        </div>
      </div>
    </div>
  );
}
