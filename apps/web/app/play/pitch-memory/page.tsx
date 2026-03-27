'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';

const NOTE_FREQS = NOTE_NAMES.map((n) => NOTE_FREQUENCIES[`${n}4`] ?? 261.63) as number[];
const ACCENT = '#F43F5E';

type Phase = 'idle' | 'playing' | 'input' | 'feedback' | 'done';

export default function PitchMemoryPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [playingIdx, setPlayingIdx] = useState(-1);
  const [feedback, setFeedback] = useState<'correct' | 'wrong'>('correct');
  const [lives, setLives] = useState(3);

  const generateSequence = useCallback((len: number) => {
    const seq: number[] = [];
    for (let i = 0; i < len; i++) seq.push(Math.floor(Math.random() * 12));
    return seq;
  }, []);

  const playSequence = useCallback((seq: number[], startFrom = 0) => {
    const tempo = Math.max(0.3, 0.6 - level * 0.03);
    const gap = Math.max(0.15, 0.4 - level * 0.02);
    seq.forEach((noteIdx, i) => {
      if (i < startFrom) return;
      setTimeout(() => {
        setPlayingIdx(i);
        playTone(NOTE_FREQS[noteIdx], tempo);
        setTimeout(() => setPlayingIdx(-1), tempo * 1000 - 50);
      }, (i - startFrom) * (tempo + gap) * 1000);
    });
    const totalTime = (seq.length - startFrom) * (tempo + gap) * 1000 + 300;
    setTimeout(() => setPhase('input'), totalTime);
  }, [level]);

  const startGame = () => {
    const seq = generateSequence(2);
    setSequence(seq);
    setPlayerInput([]);
    setLevel(1);
    setScore(0);
    setStreak(0);
    setLives(3);
    setPhase('playing');
    setTimeout(() => playSequence(seq), 500);
  };

  const nextLevel = () => {
    const newLen = Math.min(sequence.length + 1, 12);
    const newSeq = [...sequence, Math.floor(Math.random() * 12)];
    setSequence(newSeq);
    setPlayerInput([]);
    setLevel((l) => l + 1);
    setPhase('playing');
    setTimeout(() => playSequence(newSeq), 400);
  };

  const handlePianoTap = (noteIdx: number) => {
    if (phase !== 'input') return;
    playTone(NOTE_FREQS[noteIdx], 0.3);
    const newInput = [...playerInput, noteIdx];
    setPlayerInput(newInput);

    const currentIdx = newInput.length - 1;
    if (newInput[currentIdx] !== sequence[currentIdx]) {
      setFeedback('wrong');
      setPhase('feedback');
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => setPhase('done'), 1500);
      } else {
        setTimeout(() => {
          setPlayerInput([]);
          setPhase('playing');
          playSequence(sequence);
        }, 1500);
      }
      return;
    }

    if (newInput.length === sequence.length) {
      const points = sequence.length * 50 + level * 20;
      setScore((s) => s + points);
      setStreak((s) => s + 1);
      setFeedback('correct');
      setPhase('feedback');
      setTimeout(nextLevel, 1200);
    }
  };

  /* ── DONE ── */
  if (phase === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-sm text-center animate-slide-up">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.035em' }}>Game Over</h1>
          <p className="mt-2 text-zinc-500 text-sm">You reached level {level}!</p>
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <div className="stat-card">
              <div className="text-2xl font-bold" style={{ color: ACCENT, letterSpacing: '-0.03em' }}>{score}</div>
              <div className="mt-1 text-[11px] text-zinc-600">Score</div>
            </div>
            <div className="stat-card">
              <div className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>{level}</div>
              <div className="mt-1 text-[11px] text-zinc-600">Max Level</div>
            </div>
          </div>
          <div className="mt-6 flex gap-2.5">
            <button onClick={startGame} className="flex-1 rounded-full py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-85" style={{ background: ACCENT }}>
              Play Again
            </button>
            <button onClick={() => router.push('/')} className="flex-1 rounded-full py-3 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-white/10" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 pt-12 pb-nav">
      <div className="mx-auto max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => router.push('/')} className="flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(161,161,170)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-base font-semibold" style={{ color: ACCENT }}>Pitch Memory</h1>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">{Array.from({ length: 3 }).map((_, i) => <span key={i} className="text-sm">{i < lives ? '❤️' : '🖤'}</span>)}</div>
            <div className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>{score} pts</div>
          </div>
        </div>

        {/* Level + streak */}
        <div className="progress-bar-track mb-4">
          <div className="progress-bar-fill" style={{ width: `${Math.min(level * 10, 100)}%`, backgroundColor: ACCENT }} />
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-600 mb-8">
          <span>Level {level}</span>
          <span>Sequence: {sequence.length} notes</span>
          <span>Streak: {streak}</span>
        </div>

        {/* IDLE */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white" style={{ letterSpacing: '-0.025em' }}>Pitch Memory</h2>
            <p className="mt-2 text-sm text-zinc-500">Listen to the sequence, then reproduce it on the piano</p>
            <button onClick={startGame} className="mt-8 rounded-full px-8 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-85 active:scale-95" style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}40` }}>
              Start Game
            </button>
          </div>
        )}

        {/* PLAYING / INPUT / FEEDBACK */}
        {(phase === 'playing' || phase === 'input' || phase === 'feedback') && (
          <div className="animate-fade-in">
            {/* Sequence dots */}
            <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
              {sequence.map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8 }}
                  animate={{
                    scale: playingIdx === i ? 1.4 : 1,
                    backgroundColor: phase === 'feedback' && feedback === 'wrong' && i === playerInput.length - 1
                      ? '#f87171'
                      : i < playerInput.length
                        ? ACCENT
                        : playingIdx === i
                          ? ACCENT
                          : 'rgba(255,255,255,0.1)',
                  }}
                  className="h-3 w-3 rounded-full"
                  style={{ transition: 'background-color 0.2s' }}
                />
              ))}
            </div>

            <p className="text-center text-sm text-zinc-500 mb-6">
              {phase === 'playing' ? '🎵 Listen carefully...' : phase === 'feedback' ? (feedback === 'correct' ? '✅ Correct!' : '❌ Wrong! Replaying...') : `Tap notes (${playerInput.length}/${sequence.length})`}
            </p>

            {/* Piano */}
            <div className="flex justify-center gap-0.5 mb-6">
              {NOTE_NAMES.map((name, i) => (
                <button
                  key={name}
                  onClick={() => handlePianoTap(i)}
                  disabled={phase !== 'input'}
                  className="relative transition-all duration-100 active:scale-95"
                  style={{
                    width: 'calc((100% - 13px) / 12)',
                    maxWidth: 36,
                    height: 100,
                    borderRadius: 6,
                    background: name.includes('#') ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
                    border: `1px solid ${name.includes('#') ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
                    opacity: phase === 'input' ? 1 : 0.4,
                    cursor: phase === 'input' ? 'pointer' : 'default',
                  }}
                >
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] text-zinc-600">{name}</span>
                </button>
              ))}
            </div>

            {phase === 'input' && (
              <div className="text-center">
                <p className="text-xs text-zinc-600 mb-3">Your progress: {playerInput.length} / {sequence.length}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
