'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { playTone } from '@/lib/audio';

type Difficulty = 'easy' | 'medium' | 'hard';

const CONFIGS: Record<Difficulty, { min: number; max: number; step: number; rounds: number }> = {
  easy: { min: 100, max: 1000, step: 10, rounds: 5 },
  medium: { min: 100, max: 2000, step: 1, rounds: 8 },
  hard: { min: 50, max: 4000, step: 1, rounds: 12 },
};

export default function FrequencyGuessPage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [phase, setPhase] = useState<'setup' | 'playing' | 'done'>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [targetFreq, setTargetFreq] = useState(0);
  const [guess, setGuess] = useState(200);
  const [showFeedback, setShowFeedback] = useState(false);
  const [errorPct, setErrorPct] = useState(0);
  const [results, setResults] = useState<{ correct: boolean; points: number; target: string; answer: string }[]>([]);
  const config = CONFIGS[difficulty];

  const generateFreq = () => Math.round((Math.random() * (config.max - config.min) + config.min) / config.step) * config.step;

  const startGame = () => { setRound(0); setScore(0); setResults([]); nextRound(); };

  const nextRound = () => {
    setTargetFreq(generateFreq());
    setGuess(Math.round((config.min + config.max) / 2));
    setShowFeedback(false);
    setPhase('playing');
    setRound((r) => r + 1);
    playTone(generateFreq(), 0.8);
  };

  const submitGuess = () => {
    const err = Math.abs(guess - targetFreq) / targetFreq * 100;
    setErrorPct(err);
    const correct = err < 5;
    const points = correct ? Math.max(Math.round(100 - err * 10), 10) : 0;
    setScore((s) => s + points);
    setResults((r) => [...r, { correct, points, target: `${targetFreq} Hz`, answer: `${guess} Hz` }]);
    setShowFeedback(true);
    setTimeout(() => {
      if (round >= config.rounds) setPhase('done');
      else nextRound();
    }, 2000);
  };

  if (phase === 'done') {
    return (
      <div className="min-h-screen px-4 pt-10">
        <div className="mx-auto max-w-md text-center">
          <div className="text-6xl">🏆</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Game Complete!</h1>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="glass-card p-4"><div className="text-2xl font-bold text-white">{score}</div><div className="text-xs text-zinc-500">Score</div></div>
            <div className="glass-card p-4"><div className="text-2xl font-bold text-white">{results.filter(r => r.correct).length}/{config.rounds}</div><div className="text-xs text-zinc-500">Within 5%</div></div>
            <div className="glass-card p-4"><div className="text-2xl font-bold text-white">{results.length ? Math.round(results.reduce((a, r) => a + (r.points > 0 ? Math.abs(parseFloat(r.answer) - parseFloat(r.target)) / parseFloat(r.target) * 100 : 20), 0) / results.length) : 0}%</div><div className="text-xs text-zinc-500">Avg Error</div></div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={startGame} className="flex-1 rounded-full bg-[#FBBF24] py-3 font-semibold text-black transition-all duration-300 ease-out hover:opacity-90">Play Again</button>
            <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-full bg-white/5 py-3 font-medium text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10">Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-screen px-4 pt-10">
        <div className="mx-auto max-w-md text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#FBBF24]">Frequency Guess</h1>
          <p className="mt-2 text-zinc-500">Guess the frequency of a tone</p>
          <div className="mt-8 flex gap-3 justify-center">
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ease-out ${difficulty === d ? 'bg-[#FBBF24] text-black' : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'}`}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-600">{config.min}–{config.max} Hz • {config.rounds} rounds</p>
          <button onClick={startGame} className="mt-8 rounded-full bg-[#FBBF24] px-6 py-2.5 font-semibold text-black transition-all duration-300 ease-out hover:opacity-90">Start Game</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-10">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-white transition-colors duration-300">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight text-[#FBBF24]">🎯 Frequency Guess</h1>
          <div className="text-sm text-zinc-500">Score: {score}</div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-[#FBBF24] transition-all duration-500" style={{ width: `${(round / config.rounds) * 100}%` }} />
        </div>

        <div className="mt-10 text-center">
          <button onClick={() => playTone(targetFreq, 0.8)}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-4xl transition-all duration-300 ease-out hover:bg-white/10">
            🔊
          </button>
          <p className="mt-3 text-sm text-zinc-500">Tap to replay</p>
        </div>

        <div className="mt-8">
          <div className="text-center text-3xl font-bold text-[#FBBF24]">{guess} Hz</div>
          <input type="range" min={config.min} max={config.max} step={config.step} value={guess}
            onChange={(e) => setGuess(Number(e.target.value))} disabled={showFeedback}
            className="mt-4 w-full accent-[#FBBF24]" />
          <div className="flex justify-between text-xs text-zinc-600">
            <span>{config.min} Hz</span><span>{config.max} Hz</span>
          </div>
        </div>

        {showFeedback && (
          <div className={`mt-4 glass-card p-4 text-center ${errorPct < 5 ? 'border-[#4ADE80]/30' : 'border-red-400/30'}`}>
            <div className="text-lg font-bold text-white">{errorPct < 5 ? '✅ Great!' : '❌'}</div>
            <div className="text-sm text-zinc-500 mt-1">Target: {targetFreq} Hz • Your guess: {guess} Hz • Error: {errorPct.toFixed(1)}%</div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={submitGuess} disabled={showFeedback}
            className="rounded-full bg-[#FBBF24] px-6 py-2.5 font-semibold text-black transition-all duration-300 ease-out hover:opacity-90 disabled:opacity-40">
            Submit Guess
          </button>
          <div className="mt-3 text-sm text-zinc-500">Round {round}/{config.rounds}</div>
        </div>
      </div>
    </div>
  );
}
