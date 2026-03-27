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
    'pitch-match': 'medium',
    'note-id': 'medium',
    'frequency-guess': 'medium',
    'note-wordle': 'medium',
    'frequency-wordle': 'medium',
  });
  const [sound, setSound] = useState(true);

  return (
    <div className="min-h-screen px-4 pt-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold">⚙️ Settings</h1>

        {/* Default Difficulty */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Default Difficulty</h2>
          <div className="space-y-3">
            {MODES.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{m.icon}</span>
                  <span className="font-medium">{m.label}</span>
                </div>
                <div className="flex gap-1">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button key={d} onClick={() => setDifficulty({ ...difficulty, [m.id]: d })}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${difficulty[m.id] === d ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sound */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Sound</h2>
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <span className="font-medium">🔊 Sound Effects</span>
            <button onClick={() => setSound(!sound)}
              className={`relative h-8 w-14 rounded-full transition-colors ${sound ? 'bg-blue-500' : 'bg-zinc-700'}`}>
              <div className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${sound ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Theme</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌙</span>
                <div>
                  <span className="font-medium">Dark Mode</span>
                  <p className="text-xs text-zinc-500">Only dark mode available for now</p>
                </div>
              </div>
              <div className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-950">Active</div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
          <h3 className="text-lg font-bold">🎵 Pitch Therapy</h3>
          <p className="mt-1 text-sm text-zinc-400">Train Your Ear. Every Day.</p>
          <p className="mt-2 text-xs text-zinc-600">Version 0.1.0</p>
        </div>
      </div>
    </div>
  );
}
