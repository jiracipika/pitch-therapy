'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playTone } from '@/lib/audio';

type Feedback = 'correct' | 'close' | 'miss';
interface GuessRow { freq: number; feedback: Feedback; direction?: 'up' | 'down' }

export default function FrequencyWordlePage() {
  const router = useRouter();
  const [targetFreq, setTargetFreq] = useState(0);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing');
  const [copied, setCopied] = useState(false);

  const initGame = () => {
    setTargetFreq(Math.round((Math.random() * 800 + 200) * 10) / 10);
    setGuesses([]);
    setInputVal('');
    setPhase('playing');
  };

  useEffect(() => { initGame(); }, []);

  const getFeedback = (guess: number): { feedback: Feedback; direction?: 'up' | 'down' } => {
    const err = Math.abs(guess - targetFreq) / targetFreq * 100;
    if (err <= 2) return { feedback: 'correct' };
    if (err <= 10) return { feedback: 'close', direction: guess < targetFreq ? 'up' : 'down' };
    return { feedback: 'miss', direction: guess < targetFreq ? 'up' : 'down' };
  };

  const submitGuess = () => {
    const freq = parseFloat(inputVal);
    if (isNaN(freq) || freq <= 0 || guesses.length >= 6 || phase !== 'playing') return;
    playTone(freq, 0.3);
    const { feedback, direction } = getFeedback(freq);
    const newGuesses = [...guesses, { freq, feedback, direction }];
    setGuesses(newGuesses);
    setInputVal('');
    if (feedback === 'correct') setPhase('won');
    else if (newGuesses.length >= 6) setPhase('lost');
  };

  const handleShare = () => {
    const grid = guesses.map(g => g.feedback === 'correct' ? '🟩' : g.feedback === 'close' ? '🟨' : '🟥').join('\n');
    navigator.clipboard.writeText(`🎵 Frequency Wordle ${phase === 'won' ? guesses.length : 'X'}/6\n${grid}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen px-4 pt-8">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-400 hover:text-white">← Back</button>
          <h1 className="text-lg font-bold text-teal-500">🔵 Frequency Wordle</h1>
          <button onClick={initGame} className="text-sm text-zinc-400 hover:text-white">🔄 New</button>
        </div>

        {/* Grid */}
        <div className="mt-6 flex flex-col items-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => {
            const guess = guesses[i];
            return (
              <div key={i} className={`flex h-12 w-full items-center justify-center rounded-xl text-lg font-bold transition-all
                ${guess ? guess.feedback === 'correct' ? 'bg-teal-500/20 border-2 border-teal-500 text-teal-400'
                  : guess.feedback === 'close' ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-400'
                  : 'bg-red-500/20 border-2 border-red-500 text-red-400'
                  : i === guesses.length ? 'bg-zinc-800 border-2 border-zinc-600 text-zinc-300' : 'bg-zinc-900 border border-zinc-800 text-zinc-700'}`}>
                {guess ? `${guess.freq} Hz ${guess.direction === 'up' ? '▲' : guess.direction === 'down' ? '▼' : '✓'}` : i === guesses.length && inputVal ? `${inputVal} Hz` : ''}
              </div>
            );
          })}
        </div>

        {phase === 'playing' && (
          <div className="mt-8">
            <div className="flex gap-2">
              <input type="number" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
                placeholder="Frequency in Hz"
                className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none" />
              <button onClick={submitGuess} disabled={!inputVal}
                className="rounded-xl bg-teal-500 px-6 py-3 font-bold text-white hover:bg-teal-600 disabled:opacity-40">
                Go
              </button>
            </div>
          </div>
        )}

        {(phase === 'won' || phase === 'lost') && (
          <div className="mt-6 text-center animate-slide-up">
            <div className="text-4xl mb-2">{phase === 'won' ? '🎉' : '😔'}</div>
            <h2 className="text-2xl font-bold">{phase === 'won' ? 'Got it!' : `It was ${targetFreq} Hz`}</h2>
            <div className="mt-4 flex gap-3">
              <button onClick={handleShare} className="flex-1 rounded-xl bg-zinc-800 py-3 text-sm font-medium hover:bg-zinc-700">
                {copied ? '✅ Copied!' : '📋 Share'}
              </button>
              <button onClick={initGame} className="flex-1 rounded-xl bg-teal-500 py-3 font-bold text-white hover:bg-teal-600">Play Again</button>
              <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-xl bg-zinc-800 py-3 font-medium hover:bg-zinc-700">Dashboard</button>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
          <p className="text-xs text-zinc-400">
            🟩 Within 2% • 🟨 Within 10% (+ ▲▼ direction) • 🟥 More than 10%
          </p>
          <button onClick={() => playTone(targetFreq, 0.6)}
            className="mt-2 text-xs text-teal-500 hover:text-teal-400">
            🔊 Play target tone
          </button>
        </div>
      </div>
    </div>
  );
}
