'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playTone } from '@/lib/audio';
import WaveVisualizer from '@/components/WaveVisualizer';

type Feedback = 'correct' | 'close' | 'miss';
interface GuessRow { freq: number; feedback: Feedback; direction?: 'up' | 'down' }

export default function FrequencyWordlePage() {
  const router = useRouter();
  const [targetFreq, setTargetFreq] = useState(0);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing');
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const initGame = () => {
    setTargetFreq(Math.round((Math.random() * 800 + 200) * 10) / 10);
    setGuesses([]); setInputVal(''); setPhase('playing');
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
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 300);
    const { feedback, direction } = getFeedback(freq);
    const newGuesses = [...guesses, { freq, feedback, direction }];
    setGuesses(newGuesses); setInputVal('');
    if (feedback === 'correct') setPhase('won');
    else if (newGuesses.length >= 6) setPhase('lost');
  };

  const handleShare = () => {
    const grid = guesses.map(g => g.feedback === 'correct' ? '🟩' : g.feedback === 'close' ? '🟨' : '🟥').join('\n');
    navigator.clipboard.writeText(`🎵 Frequency Wordle ${phase === 'won' ? guesses.length : 'X'}/6\n${grid}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen px-4 pt-10">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-white transition-colors duration-300">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight text-[#2DD4BF]">🔵 Frequency Wordle</h1>
          <button onClick={initGame} className="text-sm text-zinc-500 hover:text-white transition-colors duration-300">🔄 New</button>
        </div>

        <div className="mt-3">
          <WaveVisualizer active={isPlaying} color="#2DD4BF" height={35} />
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => {
            const guess = guesses[i];
            return (
              <div key={i} className={`flex h-12 w-full items-center justify-center rounded-2xl text-lg font-semibold transition-all duration-300 ease-out
                ${guess ? guess.feedback === 'correct' ? 'bg-[#2DD4BF]/10 border-2 border-[#2DD4BF] text-[#2DD4BF]'
                  : guess.feedback === 'close' ? 'bg-[#FBBF24]/10 border-2 border-[#FBBF24] text-[#FBBF24]'
                  : 'bg-red-400/10 border-2 border-red-400 text-red-400'
                  : i === guesses.length ? 'glass-card border-2 border-white/10 text-zinc-300' : 'bg-white/[0.02] border border-white/5 text-zinc-700'}`}>
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
                className="focus-glow flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-zinc-600 focus:border-[#2DD4BF]/50 focus:outline-none transition-all duration-300" />
              <button onClick={submitGuess} disabled={!inputVal}
                className="rounded-full bg-[#2DD4BF] px-6 py-3 font-semibold text-black transition-all duration-300 ease-out hover:opacity-90 disabled:opacity-30">
                Go
              </button>
            </div>
          </div>
        )}

        {(phase === 'won' || phase === 'lost') && (
          <div className="mt-6 text-center animate-slide-up">
            <div className="text-4xl mb-2">{phase === 'won' ? '🎉' : '😔'}</div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">{phase === 'won' ? 'Got it!' : `It was ${targetFreq} Hz`}</h2>
            <div className="mt-4 flex gap-3">
              <button onClick={handleShare} className="flex-1 rounded-full bg-white/5 py-3 text-sm font-medium text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10">
                {copied ? '✅ Copied!' : '📋 Share'}
              </button>
              <button onClick={initGame} className="flex-1 rounded-full bg-[#2DD4BF] py-3 font-semibold text-black transition-all duration-300 ease-out hover:opacity-90">Play Again</button>
              <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-full bg-white/5 py-3 font-medium text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10">Dashboard</button>
            </div>
          </div>
        )}

        <div className="mt-6 glass-card p-4 text-center">
          <p className="text-xs text-zinc-500">
            🟩 Within 2% • 🟨 Within 10% (+ ▲▼ direction) • 🟥 More than 10%
          </p>
          <button onClick={() => playTone(targetFreq, 0.6)}
            className="mt-2 text-xs text-[#2DD4BF] hover:text-[#2DD4BF]/80 transition-colors duration-300">
            🔊 Play target tone
          </button>
        </div>
      </div>
    </div>
  );
}
