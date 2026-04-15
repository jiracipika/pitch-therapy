'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';
import WaveVisualizer from '@/components/WaveVisualizer';
import FeedbackOverlay from '@/components/FeedbackOverlay';
import NoteComparisonStaff from '@/components/NoteComparisonStaff';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: Record<Difficulty, { options: number; rounds: number; timeLimit: number }> = {
  easy: { options: 4, rounds: 5, timeLimit: 0 },
  medium: { options: 6, rounds: 10, timeLimit: 15 },
  hard: { options: 12, rounds: 15, timeLimit: 8 },
};

const ACCENT = '#BF5AF2';

export default function NoteIdPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [phase, setPhase] = useState<'setup' | 'playing' | 'feedback' | 'done'>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [targetNote, setTargetNote] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [results, setResults] = useState<{ round: number; correct: boolean; points: number; target: string; answer: string; timeMs: number }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundRef = useRef(0);
  const timedOutRef = useRef(false);

  const config = DIFFICULTIES[difficulty];

  const pickNotes = useCallback((count: number) => {
    const shuffled = [...Array(12).keys()].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, count).sort((a, b) => a - b);
    const target = picked[Math.floor(Math.random() * picked.length)] ?? 0;
    return { picked, target };
  }, []);

  const startGame = () => {
    setRound(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setResults([]);
    startRound();
  };

  const startRound = () => {
    const { picked, target } = pickNotes(config.options);
    setOptions(picked);
    setTargetNote(target);
    setFeedback(null);
    setPhase('playing');
    roundRef.current += 1;
    setRound(roundRef.current);
    playToneWithVisual(NOTE_FREQUENCIES[`${NOTE_NAMES[target]}4`] || 261.63, 0.6);

    if (!isPractice && config.timeLimit > 0) {
      setTimeLeft(config.timeLimit);
      timedOutRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            timedOutRef.current = true;
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  };

  const playToneWithVisual = (freq: number, dur: number) => {
    setIsPlaying(true);
    playTone(freq, dur);
    setTimeout(() => setIsPlaying(false), dur * 1000);
  };

  const handleAnswer = (noteIdx: number, timeout = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = noteIdx === targetNote;
    const points = isPractice ? 0 : correct ? (config.timeLimit > 0 ? 100 + timeLeft * 5 : 100) : 0;
    if (!isPractice) setScore((s) => s + points);
    if (correct) {
      setStreak((s) => {
        const newStreak = s + 1;
        setBestStreak((b) => Math.max(b, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }
    setFeedback(correct ? 'correct' : 'wrong');
    if (!isPractice) {
      setShowFeedbackOverlay(true);
    }
    setResults((r) => [...r, {
      round, correct, points,
      target: NOTE_NAMES[targetNote] ?? 'A',
      answer: noteIdx >= 0 ? (NOTE_NAMES[noteIdx] ?? 'A') : 'timeout',
      timeMs: (config.timeLimit > 0 ? config.timeLimit - timeLeft : 0) * 1000,
    }]);
    setPhase('feedback');

    if (!timeout) {
      playToneWithVisual(NOTE_FREQUENCIES[`${NOTE_NAMES[noteIdx]}4`] || 261.63, 0.3);
    }

    const nextDelay = isPractice ? 2000 : 1200;
    setTimeout(() => {
      if (isPractice) {
        startRound();
      } else if (roundRef.current >= config.rounds) {
        setPhase('done');
      } else {
        startRound();
      }
    }, nextDelay);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (timedOutRef.current && timeLeft === 0 && phase === 'playing') {
      timedOutRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      const correct = false;
      setFeedback('wrong');
      setResults((r) => [...r, {
        round: roundRef.current, correct, points: 0,
        target: NOTE_NAMES[targetNote] ?? 'A',
        answer: 'timeout',
        timeMs: config.timeLimit * 1000,
      }]);
      setPhase('feedback');
      setTimeout(() => {
        if (roundRef.current >= config.rounds) {
          setPhase('done');
        } else {
          startRound();
        }
      }, 1200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  if (phase === 'done') {
    return (
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 24 }}>
              Game Complete
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: ACCENT }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Score</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{results.filter(r => r.correct).length}/{config.rounds}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Correct</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>🔥 {bestStreak}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Best Streak</div>
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

  if (phase === 'setup') {
    return (
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎵</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Note ID</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 32 }}>Identify notes by ear</div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', marginBottom: 10 }}>Select Difficulty</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    style={{
                      height: 34, borderRadius: 17, padding: '0 16px',
                      fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: difficulty === d ? ACCENT : 'var(--ios-bg2)',
                      color: difficulty === d ? '#000' : 'var(--ios-label3)',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 8 }}>
                {config.options} notes • {config.rounds} rounds{config.timeLimit ? ` • ${config.timeLimit}s timer` : ''}
              </div>
            </div>
            <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>
              {isPractice ? '🎓 Start Practicing' : 'Start Game'}
            </button>
            {isPractice && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ios-label3)' }}>Practice mode — no scores, just learn</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-sm mx-auto px-4 pt-12">
        <FeedbackOverlay correct={feedback === 'correct'} show={showFeedbackOverlay} streak={streak} onDone={() => setShowFeedbackOverlay(false)} />

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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>🎵 Note ID</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {isPractice ? 'Practice' : `${score} pts`}
          </div>
        </div>

        <div className="ios-progress-track mb-6">
          <motion.div
            className="ios-progress-fill"
            style={{ background: ACCENT }}
            animate={{ width: isPractice ? '100%' : `${(round / config.rounds) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {!isPractice && config.timeLimit > 0 && (
          <div className="ios-progress-track mb-4">
            <motion.div
              className="ios-progress-fill"
              style={{ background: timeLeft < 3 ? 'var(--ios-red)' : ACCENT, width: `${(timeLeft / config.timeLimit) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <WaveVisualizer active={isPlaying} color={ACCENT} height={50} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <motion.button
            onClick={() => playToneWithVisual(NOTE_FREQUENCIES[`${NOTE_NAMES[targetNote]}4`] || 261.63, 0.6)}
            whileTap={{ scale: 0.92 }}
            style={{
              width: 80, height: 80,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto', borderRadius: 20,
              background: 'var(--ios-bg2)', border: '1px solid var(--ios-sep)',
              fontSize: 36, cursor: 'pointer',
            }}
          >
            🔊
          </motion.button>
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ios-label3)' }}>Tap to replay</div>
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={targetNote}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}
          >
            {options.map((idx) => {
              const name = NOTE_NAMES[idx];
              const isTarget = idx === targetNote;
              let bg = 'var(--ios-bg2)';
              let border = '1.5px solid transparent';
              let color = 'var(--ios-label)';
              if (feedback) {
                if (isTarget) {
                  bg = 'rgba(48,209,88,0.15)';
                  border = '1.5px solid var(--ios-green)';
                  color = 'var(--ios-green)';
                } else if (!isTarget && feedback === 'wrong') {
                  bg = 'var(--ios-bg2)';
                  color = 'var(--ios-label3)';
                }
              }
              return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => phase === 'playing' && handleAnswer(idx)}
                  style={{
                    padding: '16px 8px', borderRadius: 12,
                    background: bg, border, color,
                    fontSize: 17, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  disabled={phase === 'feedback'}
                >
                  {name}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Staff comparison — shown after guess */}
        {feedback && results.length > 0 && (() => {
          const last = results[results.length - 1];
          return (
            <NoteComparisonStaff
              guessedNote={last.answer === 'timeout' ? '?' : last.answer}
              correctNote={last.target}
              isCorrect={feedback === 'correct'}
            />
          );
        })()}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px' }}>
          {!isPractice && <span>Round {round}/{config.rounds}</span>}
          {!isPractice && <span>🔥 {streak}</span>}
          {isPractice && <span>🎓 Practice • Round {round}</span>}
        </div>
      </div>
    </div>
  );
}
