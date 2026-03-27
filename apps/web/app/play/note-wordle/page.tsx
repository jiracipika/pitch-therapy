'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';
import WaveVisualizer from '@/components/WaveVisualizer';

type Feedback = 'correct' | 'close' | 'miss';
interface GuessRow { note: string; feedback: Feedback }

export default function NoteWordlePage() {
  const router = useRouter();
  const [targetIdx, setTargetIdx] = useState(0);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string | null>(null);
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing');
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const initGame = () => {
    setTargetIdx(Math.floor(Math.random() * 12));
    setGuesses([]); setCurrentGuess(null); setPhase('playing');
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
    setIsPlaying(true);
    playTone(NOTE_FREQUENCIES[`${currentGuess}4`] || 261.63, 0.3);
    setTimeout(() => setIsPlaying(false), 300);
    const newGuesses = [...guesses, { note: currentGuess, feedback }];
    setGuesses(newGuesses); setCurrentGuess(null);
    if (feedback === 'correct') setPhase('won');
    else if (newGuesses.length >= 6) setPhase('lost');
  };

  const handleShare = () => {
    const grid = guesses.map(g => g.feedback === 'correct' ? '🟩' : g.feedback === 'close' ? '🟨' : '🟥').join('\n');
    navigator.clipboard.writeText(`🎵 Note Wordle ${phase === 'won' ? guesses.length : 'X'}/6\n${grid}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const targetNote = NOTE_NAMES[targetIdx];

  return (
    <div className="min-h-screen px-4 pt-10">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-white transition-colors duration-300">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight text-[#4ADE80]">🟩 Note Wordle</h1>
          <button onClick={initGame} className="text-sm text-zinc-500 hover:text-white transition-colors duration-300">🔄 New</button>
        </div>

        <div className="mt-3">
          <WaveVisualizer active={isPlaying} color="#4ADE80" height={35} />
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => {
            const guess = guesses[i];
            return (
              <div key={i} className={`flex h-12 w-full items-center justify-center rounded-2xl text-lg font-semibold transition-all duration-300 ease-out
                ${guess ? guess.feedback === 'correct' ? 'bg-[#4ADE80]/10 border-2 border-[#4ADE80] text-[#4ADE80]'
                  : guess.feedback === 'close' ? 'bg-[#FBBF24]/10 border-2 border-[#FBBF24] text-[#FBBF24]'
                  : 'bg-red-400/10 border-2 border-red-400 text-red-400'
                  : i === guesses.length ? 'glass-card border-2 border-white/10 text-zinc-300' : 'bg-white/[0.02] border border-white/5 text-zinc-700'}`}>
                {guess ? guess.note : i === guesses.length ? currentGuess ?? '?' : ''}
              </div>
            );
          })}
        </div>

        {phase === 'playing' && (
          <div className="mt-8">
            <div className="grid grid-cols-6 gap-2">
              {NOTE_NAMES.map((n) => (
                <button key={n} onClick={() => setCurrentGuess(n)}
                  className={`rounded-2xl py-3 text-sm font-semibold transition-all duration-300 ease-out ${currentGuess === n ? 'bg-[#4ADE80] text-black' : 'glass-card text-zinc-300 hover:bg-white/[0.08]'}`}>
                  {n}
                </button>
              ))}
            </div>
            <button onClick={submitGuess} disabled={!currentGuess}
              className="mt-3 w-full rounded-full bg-[#4ADE80] py-3 font-semibold text-black transition-all duration-300 ease-out hover:opacity-90 disabled:opacity-30">
              Submit
            </button>
          </div>
        )}

        {(phase === 'won' || phase === 'lost') && (
          <div className="mt-6 text-center animate-slide-up">
            <div className="text-4xl mb-2">{phase === 'won' ? '🎉' : '😔'}</div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">{phase === 'won' ? 'Got it!' : `It was ${targetNote}4`}</h2>
            <div className="mt-4 flex gap-3">
              <button onClick={handleShare} className="flex-1 rounded-full bg-white/5 py-3 text-sm font-medium text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10">
                {copied ? '✅ Copied!' : '📋 Share'}
              </button>
              <button onClick={initGame} className="flex-1 rounded-full bg-[#4ADE80] py-3 font-semibold text-black transition-all duration-300 ease-out hover:opacity-90">Play Again</button>
              <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-full bg-white/5 py-3 font-medium text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10">Dashboard</button>
            </div>
          </div>
        )}

        <div className="mt-6 glass-card p-4 text-center">
          <p className="text-xs text-zinc-500">
            🟩 Correct • 🟨 Within 2 semitones • 🟥 More than 2 semitones
          </p>
          <button onClick={() => playTone(NOTE_FREQUENCIES[`${targetNote}4`] || 261.63, 0.6)}
            className="mt-2 text-xs text-[#4ADE80] hover:text-[#4ADE80]/80 transition-colors duration-300">
            🔊 Play target tone
          </button>
        </div>
      </div>
    </div>
  );
}
