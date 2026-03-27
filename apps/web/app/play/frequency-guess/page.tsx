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

  const generateFreq = () => {
    const f = Math.round((Math.random() * (config.max - config.min) + config.min) / config.step) * config.step;
    return f;
  };

  const startGame = () => {
    setRound(0); setScore(0); setResults([]);
    nextRound();
  };

  const nextRound = () => {
    const f = generateFreq();
    setTargetFreq(f);
    setGuess(Math.round((config.min + config.max) / 2));
    setShowFeedback(false);
    setPhase('playing');
    setRound((r) => r + 1);
    playTone(f, 0.8);
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
      <div className="min-h-screen px-4 pt-8">
        <div className="mx-auto max-w-md text-center">
          <div className="text-6xl">🏆</div>
          <h1 className="mt-4 text-3xl font-bold">Game Complete!</h1>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
              <div className="text-2xl font-bold">{score}</div>
              <div className="text-xs text-zinc-400">Score</div>
            </div>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
              <div className="text-2xl font-bold">{results.filter(r => r.correct).length}/{config.rounds}</div>
              <div className="text-xs text-zinc-400">Within 5%</div>
            </div>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
              <div className="text-2xl font-bold">{results.length ? Math.round(results.reduce((a, r) => a + (r.points > 0 ? Math.abs(parseFloat(r.answer) - parseFloat(r.target)) / parseFloat(r.target) * 100 : 20), 0) / results.length) : 0}%</div>
              <div className="text-xs text-zinc-400">Avg Error</div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={startGame} className="flex-1 rounded-xl bg-amber-500 py-3 font-bold text-white hover:bg-amber-600">Play Again</button>
            <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-xl bg-zinc-800 py-3 font-medium hover:bg-zinc-700">Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-screen px-4 pt-8">
        <div className="mx-auto max-w-md text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold text-amber-500">Frequency Guess</h1>
          <p className="mt-2 text-zinc-400">Guess the frequency of a tone</p>
          <div className="mt-8 flex gap-3 justify-center">
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${difficulty === d ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">{config.min}–{config.max} Hz • {config.rounds} rounds</p>
          <button onClick={startGame} className="mt-8 rounded-xl bg-amber-500 px-8 py-3 font-bold text-white hover:bg-amber-600">Start Game</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-8">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-400 hover:text-white">← Back</button>
          <h1 className="text-lg font-bold text-amber-500">🎯 Frequency Guess</h1>
          <div className="text-sm text-zinc-400">Score: {score}</div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${(round / config.rounds) * 100}%` }} />
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => playTone(targetFreq, 0.8)}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-500 text-4xl hover:bg-amber-500/30 transition-colors">
            🔊
          </button>
          <p className="mt-3 text-sm text-zinc-400">Tap to replay</p>
        </div>

        <div className="mt-8">
          <div className="text-center text-3xl font-bold text-amber-500">{guess} Hz</div>
          <input type="range" min={config.min} max={config.max} step={config.step} value={guess}
            onChange={(e) => setGuess(Number(e.target.value))} disabled={showFeedback}
            className="mt-4 w-full accent-amber-500" />
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{config.min} Hz</span>
            <span>{config.max} Hz</span>
          </div>
        </div>

        {showFeedback && (
          <div className={`mt-4 rounded-xl p-4 text-center ${errorPct < 5 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            <div className="text-lg font-bold">{errorPct < 5 ? '✅ Great!' : '❌'}</div>
            <div className="text-sm text-zinc-400 mt-1">Target: {targetFreq} Hz • Your guess: {guess} Hz • Error: {errorPct.toFixed(1)}%</div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={submitGuess} disabled={showFeedback}
            className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-white hover:bg-amber-600 disabled:opacity-50">
            Submit Guess
          </button>
          <div className="mt-3 text-sm text-zinc-400">Round {round}/{config.rounds}</div>
        </div>
      </div>
    </div>
  );
}
