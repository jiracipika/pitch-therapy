'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';

const NOTE_FREQS = NOTE_NAMES.map((n) => NOTE_FREQUENCIES[`${n}4`] ?? 261.63) as number[];
const ACCENT = '#FF453A';

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
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>💔</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>
              Game Over
            </div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>You reached level {level}!</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: ACCENT }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Score</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{level}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Max Level</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>Play Again</button>
              <button className="ios-btn-secondary" onClick={() => router.push('/dashboard')}>Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-sm mx-auto px-4 pt-12">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, minHeight: 44 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              width: 36, height: 36, borderRadius: 18,
              background: 'var(--ios-bg2)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
              <path d="M8.5 1.5L1.5 8.5L8.5 15.5" stroke="var(--ios-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>Pitch Memory</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} style={{ fontSize: 14 }}>{i < lives ? '❤️' : '🖤'}</span>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
              {score} pts
            </div>
          </div>
        </div>

        {/* Level progress */}
        <div className="ios-progress-track mb-4">
          <div className="ios-progress-fill" style={{ width: `${Math.min(level * 10, 100)}%`, background: ACCENT }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ios-label3)', marginBottom: 24 }}>
          <span>Level {level}</span>
          <span>Sequence: {sequence.length} notes</span>
          <span>🔥 {streak}</span>
        </div>

        {/* IDLE */}
        {phase === 'idle' && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎵</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Pitch Memory</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 32 }}>Listen to the sequence, then reproduce it on the piano</div>
            <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>
              Start Game
            </button>
          </div>
        )}

        {/* PLAYING / INPUT / FEEDBACK */}
        {(phase === 'playing' || phase === 'input' || phase === 'feedback') && (
          <div>
            {/* Sequence dots */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {sequence.map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8 }}
                  animate={{
                    scale: playingIdx === i ? 1.4 : 1,
                    backgroundColor: phase === 'feedback' && feedback === 'wrong' && i === playerInput.length - 1
                      ? 'var(--ios-red)'
                      : i < playerInput.length
                        ? ACCENT
                        : playingIdx === i
                          ? ACCENT
                          : 'rgba(255,255,255,0.1)',
                  }}
                  style={{ width: 12, height: 12, borderRadius: '50%' }}
                />
              ))}
            </div>

            <div style={{ textAlign: 'center', fontSize: 15, color: 'var(--ios-label3)', marginBottom: 20 }}>
              {phase === 'playing' ? '🎵 Listen carefully...' : phase === 'feedback' ? (feedback === 'correct' ? '✅ Correct!' : '❌ Wrong! Replaying...') : `Tap notes (${playerInput.length}/${sequence.length})`}
            </div>

            {/* Piano */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 20 }}>
              {NOTE_NAMES.map((name, i) => {
                const isBlack = name.includes('#');
                return (
                  <button
                    key={name}
                    onClick={() => handlePianoTap(i)}
                    disabled={phase !== 'input'}
                    style={{
                      width: 'calc((100% - 13px) / 12)',
                      maxWidth: 36,
                      height: 100,
                      borderRadius: '0 0 6px 6px',
                      background: isBlack ? 'var(--ios-bg4)' : 'rgba(255,255,255,0.92)',
                      border: '0.5px solid var(--ios-sep)',
                      opacity: phase === 'input' ? 1 : 0.4,
                      cursor: phase === 'input' ? 'pointer' : 'default',
                      position: 'relative',
                      transition: 'all 0.1s',
                    }}
                  >
                    <span style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: isBlack ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>{name}</span>
                  </button>
                );
              })}
            </div>

            {phase === 'input' && (
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ios-label3)' }}>
                Your progress: {playerInput.length} / {sequence.length}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
