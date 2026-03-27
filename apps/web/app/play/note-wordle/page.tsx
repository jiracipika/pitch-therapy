'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';

type Feedback = 'correct' | 'close' | 'miss';
interface GuessRow { note: string; feedback: Feedback }

export default function NoteWordlePage() {
  const router = useRouter();
  const [targetIdx, setTargetIdx] = useState(0);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string | null>(null);
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing');
  const [copied, setCopied] = useState(false);

  const initGame = () => {
    setTargetIdx(Math.floor(Math.random() * 12));
    setGuesses([]);
    setCurrentGuess(null);
    setPhase('playing');
  };

  useEffect(() => { initGame(); }, []);

  const getFeedback = (guess: string): Feedback => {
    const guessIdx = NOTE_NAMES.indexOf(guess as typeof NOTE_NAMES[number]);
    const diff = Math.abs(guessIdx - targetIdx);
    if (diff === 0) return 'correct';
    if (diff <= 2 || diff >= 10) return 'close';
    return 'miss';
  };

  const submitGuess = () => {
    if (!currentGuess || guesses.length >= 6 || phase !== 'playing') return;
    const feedback = getFeedback(currentGuess);
    playTone(NOTE_FREQUENCIES[`${currentGuess}4`] || 261.63, 0.3);
    const newGuesses = [...guesses, { note: currentGuess, feedback }];
    setGuesses(newGuesses);
    setCurrentGuess(null);

    if (feedback === 'correct') setPhase('won');
    else if (newGuesses.length >= 6) setPhase('lost');
  };

  const handleShare = () => {
    const grid = guesses.map(g => g.feedback === 'correct' ? '🟩' : g.feedback === 'close' ? '🟨' : '🟥').join('\n');
    navigator.clipboard.writeText(`🎵 Note Wordle ${phase === 'won' ? guesses.length : 'X'}/6\n${grid}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const targetNote = NOTE_NAMES[targetIdx];

  return (
    <div className="min-h-screen px-4 pt-8">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-400 hover:text-white">← Back</button>
          <h1 className="text-lg font-bold text-green-500">🟩 Note Wordle</h1>
          <button onClick={initGame} className="text-sm text-zinc-400 hover:text-white">🔄 New</button>
        </div>

        {/* Grid */}
        <div className="mt-6 flex flex-col items-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => {
            const guess = guesses[i];
            return (
              <div key={i} className={`flex h-12 w-full items-center justify-center rounded-xl text-lg font-bold transition-all
                ${guess ? guess.feedback === 'correct' ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                  : guess.feedback === 'close' ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-400'
                  : 'bg-red-500/20 border-2 border-red-500 text-red-400'
                  : i === guesses.length ? 'bg-zinc-800 border-2 border-zinc-600 text-zinc-300' : 'bg-zinc-900 border border-zinc-800 text-zinc-700'}`}>
                {guess ? guess.note : i === guesses.length ? currentGuess ?? '?' : ''}
              </div>
            );
          })}
        </div>

        {/* Note Keyboard */}
        {phase === 'playing' && (
          <div className="mt-8">
            <div className="grid grid-cols-6 gap-2">
              {NOTE_NAMES.map((n) => (
                <button key={n} onClick={() => setCurrentGuess(n)}
                  className={`rounded-lg py-3 text-sm font-bold transition-all ${currentGuess === n ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                  {n}
                </button>
              ))}
            </div>
            <button onClick={submitGuess} disabled={!currentGuess}
              className="mt-3 w-full rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600 disabled:opacity-40">
              Submit
            </button>
          </div>
        )}

        {(phase === 'won' || phase === 'lost') && (
          <div className="mt-6 text-center animate-slide-up">
            <div className="text-4xl mb-2">{phase === 'won' ? '🎉' : '😔'}</div>
            <h2 className="text-2xl font-bold">{phase === 'won' ? 'Got it!' : `It was ${targetNote}4`}</h2>
            <div className="mt-4 flex gap-3">
              <button onClick={handleShare} className="flex-1 rounded-xl bg-zinc-800 py-3 text-sm font-medium hover:bg-zinc-700">
                {copied ? '✅ Copied!' : '📋 Share'}
              </button>
              <button onClick={initGame} className="flex-1 rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600">Play Again</button>
              <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-xl bg-zinc-800 py-3 font-medium hover:bg-zinc-700">Dashboard</button>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
          <p className="text-xs text-zinc-400">
            🟩 Correct • 🟨 Within 2 semitones • 🟥 More than 2 semitones
          </p>
          <button onClick={() => playTone(NOTE_FREQUENCIES[`${targetNote}4`] || 261.63, 0.6)}
            className="mt-2 text-xs text-green-500 hover:text-green-400">
            🔊 Play target tone
          </button>
        </div>
      </div>
    </div>
  );
}
