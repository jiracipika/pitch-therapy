'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';
import FeedbackOverlay from '@/components/FeedbackOverlay';

const ACCENT = '#FF9F0A';
const DURATION_OPTIONS = [30, 60];

const ALL_NOTES = NOTE_NAMES;

function pickRandom() {
  return ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
}

export default function SpeedRoundPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'done'>('setup');
  const [duration, setDuration] = useState(30);
  const [currentNote, setCurrentNote] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextNote = useCallback(() => {
    const n = pickRandom();
    setCurrentNote(n);
    return n;
  }, []);

  const startGame = () => {
    setScore(0); setCorrect(0); setTotal(0); setStreak(0); setBestStreak(0);
    setTimeLeft(duration);
    setFeedback(null);
    nextNote();
    setPhase('playing');
    playTone(NOTE_FREQUENCIES['A4'] || 440, 0.1);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase('done');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleKeyTap = (note: string) => {
    if (phase !== 'playing') return;
    const isCorrect = note === currentNote;
    setTotal((t) => t + 1);

    if (isCorrect) {
      setCorrect((c) => c + 1);
      setScore((s) => s + 10 + streak * 2);
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => Math.max(b, ns));
        return ns;
      });
      setFeedback('correct');
      setShowOverlay(true);
    } else {
      setStreak(0);
      setFeedback('wrong');
    }

    nextNote();
    playTone(NOTE_FREQUENCIES[`${note}4`] || 261.63, 0.15);

    setTimeout(() => setFeedback(null), 300);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (phase === 'done') {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>⚡</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 24 }}>
              Time&apos;s Up!
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: ACCENT }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Score</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{accuracy}%</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Accuracy</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{correct}/{total}</div>
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
            <div style={{ fontSize: 64, marginBottom: 20 }}>⚡</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Speed Round</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 32 }}>Identify notes as fast as you can</div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', marginBottom: 10 }}>Duration</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    style={{
                      height: 34, borderRadius: 17, padding: '0 20px',
                      fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: duration === d ? ACCENT : 'var(--ios-bg2)',
                      color: duration === d ? '#000' : 'var(--ios-label3)',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
            <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>
              Start Sprint
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-sm mx-auto px-4 pt-12">
        <FeedbackOverlay correct={feedback === 'correct'} show={showOverlay} streak={streak} onDone={() => setShowOverlay(false)} />

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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>⚡ Speed Round</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {score} pts
          </div>
        </div>

        {/* Timer bar */}
        <div className="ios-progress-track mb-6">
          <motion.div
            className="ios-progress-fill"
            style={{ background: timeLeft < 5 ? 'var(--ios-red)' : ACCENT }}
            animate={{ width: `${(timeLeft / duration) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Flashcard */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNote}
              initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              transition={{ duration: 0.2 }}
              style={{
                width: 128, height: 128,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 28, fontSize: 48, fontWeight: 800,
                color: feedback === 'correct' ? 'var(--ios-green)' : feedback === 'wrong' ? 'var(--ios-red)' : 'var(--ios-label)',
                background: 'var(--ios-bg2)', border: '1.5px solid var(--ios-sep)',
              }}
            >
              {currentNote}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Piano keyboard */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex' }}>
            {ALL_NOTES.map((note, i) => {
              const isBlack = note.includes('#');
              if (isBlack) return null;
              const blackKey = i < 11 && ALL_NOTES[i + 1]?.includes('#');
              return (
                <div key={note} style={{ position: 'relative', marginRight: 2 }}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleKeyTap(note)}
                    style={{
                      width: 44, height: 144, borderRadius: '0 0 8px 8px',
                      background: 'rgba(255,255,255,0.92)', border: '0.5px solid var(--ios-sep)',
                      color: 'rgba(0,0,0,0.7)', fontWeight: 700, fontSize: 12,
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                      paddingBottom: 10, cursor: 'pointer',
                    }}
                  >
                    {note}
                  </motion.button>
                  {blackKey && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleKeyTap(ALL_NOTES[i + 1])}
                      style={{
                        position: 'absolute', top: -16, left: 28,
                        width: 32, height: 88, borderRadius: '0 0 5px 5px',
                        background: 'var(--ios-bg4)', border: '0.5px solid var(--ios-sep)',
                        color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 10,
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                        paddingBottom: 8, zIndex: 10, cursor: 'pointer',
                      }}
                    >
                      {ALL_NOTES[i + 1]}
                    </motion.button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ios-label3)' }}>
          🔥 {streak} • {correct}/{total} correct • {timeLeft}s left
        </div>
      </div>
    </div>
  );
}
