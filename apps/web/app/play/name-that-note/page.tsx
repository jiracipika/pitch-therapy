'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';

const NOTE_FREQS: Record<string, number> = {};
(NOTE_NAMES as unknown as string[]).forEach((n) => { NOTE_FREQS[`${n}4`] = NOTE_FREQUENCIES[`${n}4`] ?? 261.63; });
const ACCENT = '#0A84FF';

// Staff positions: 0 = C4 (ledger below), 1 = D4, 2 = E4, ..., 12 = C5
const STAFF_NOTES = [
  { name: 'C4', staffPos: 0, line: false },
  { name: 'D4', staffPos: 1, line: false },
  { name: 'E4', staffPos: 2, line: true },  // 1st line
  { name: 'F4', staffPos: 3, line: false },
  { name: 'G4', staffPos: 4, line: true },  // 2nd line
  { name: 'A4', staffPos: 5, line: false },
  { name: 'B4', staffPos: 6, line: true },  // 3rd line
  { name: 'C5', staffPos: 7, line: false },
  { name: 'D5', staffPos: 8, line: true },  // 4th line
  { name: 'E5', staffPos: 9, line: false },
  { name: 'F5', staffPos: 10, line: true }, // 5th line
  { name: 'G5', staffPos: 11, line: false },
];

const QUIZ_NOTES = STAFF_NOTES.filter(n => n.staffPos >= 2 && n.staffPos <= 10); // E4 to F5

type Phase = 'idle' | 'playing' | 'timed-out' | 'done';
type Clef = 'treble' | 'bass';

export default function NameThatNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';
  const isTimed = searchParams.get('timed') !== 'false';

  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(10);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetNote, setTargetNote] = useState(QUIZ_NOTES[0]);
  const [results, setResults] = useState<{ round: number; correct: boolean; points: number; target: string; answer: string }[]>([]);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const roundRef = useRef(0);

  const clef: Clef = 'treble';

  const startRound = () => {
    const note = QUIZ_NOTES[Math.floor(Math.random() * QUIZ_NOTES.length)];
    setTargetNote(note);
    roundRef.current += 1;
    setRound(roundRef.current);
    setFeedback('none');
    setPhase('playing');
    if (isTimed && !isPractice) {
      setTimeLeft(10);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(timerRef.current); setPhase('timed-out'); return 0; }
          return t - 1;
        });
      }, 1000);
    }
  };

  const handleStart = () => {
    setPhase('idle'); setRound(0); setScore(0); setStreak(0); setResults([]);
    startRound();
  };

  const handleAnswer = (noteName: string) => {
    if (phase !== 'playing') return;
    clearInterval(timerRef.current);
    const correct = noteName === targetNote.name;
    const points = correct ? (isTimed && !isPractice ? Math.max(100 - (10 - timeLeft) * 8, 20) : 100) : 0;
    setScore((s) => s + points);
    if (correct) { setStreak((s) => s + 1); setFeedback('correct'); }
    else { setStreak(0); setFeedback('wrong'); }
    setResults((r) => [...r, { round, correct, points, target: targetNote.name, answer: noteName }]);
    playTone(NOTE_FREQS[targetNote.name], 0.5);

    if (roundRef.current >= totalRounds) setTimeout(() => setPhase('done'), 1000);
    else setTimeout(startRound, 1200);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  useEffect(() => {
    if (phase !== 'timed-out') return;
    const t = setTimeout(() => {
      if (roundRef.current >= totalRounds) {
        setPhase('done');
      } else {
        startRound();
      }
    }, 1600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === 'done') {
    const correct = results.filter(r => r.correct).length;
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
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{correct}/{totalRounds}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Correct</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{streak}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Best Streak</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={handleStart}>Play Again</button>
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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>Name That Note</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {isPractice ? 'Practice' : `${score} pts`}
          </div>
        </div>

        <div className="ios-progress-track mb-6">
          <div className="ios-progress-fill" style={{ width: `${(round / totalRounds) * 100}%`, background: ACCENT }} />
        </div>

        {phase === 'idle' && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎼</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Name That Note</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 32 }}>Identify notes on the musical staff</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={handleStart}
                style={{
                  borderRadius: 14, padding: '12px 20px',
                  fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: ACCENT, color: '#fff',
                }}
              >
                Timed Mode
              </button>
              <button
                onClick={() => { router.push('/play/name-that-note?timed=false&practice=true'); }}
                style={{
                  borderRadius: 14, padding: '12px 20px',
                  fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: 'var(--ios-bg2)', color: 'var(--ios-label2)',
                }}
              >
                Practice
              </button>
            </div>
          </div>
        )}

        {(phase === 'playing' || phase === 'timed-out') && (
          <div style={{ textAlign: 'center' }}>
            {/* Timer */}
            {isTimed && !isPractice && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginBottom: 6 }}>Time: {timeLeft}s</div>
                <div className="ios-progress-track">
                  <motion.div
                    className="ios-progress-fill"
                    style={{ background: timeLeft <= 3 ? 'var(--ios-red)' : ACCENT, width: `${(timeLeft / 10) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Staff */}
            <div style={{ position: 'relative', margin: '0 auto 24px', width: 200, height: 140 }}>
              {[2, 4, 6, 8, 10].map((linePos) => (
                <div key={linePos} style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.2)', bottom: `${(linePos - 2) * 20}px` }} />
              ))}
              <div style={{ position: 'absolute', left: -4, bottom: 16, color: 'rgba(255,255,255,0.3)', fontSize: 30, fontFamily: 'serif' }}>𝄞</div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  position: 'absolute',
                  width: 20, height: 16, borderRadius: '50%',
                  backgroundColor: feedback === 'correct' ? 'var(--ios-green)' : feedback === 'wrong' ? 'var(--ios-red)' : ACCENT,
                  left: '50%',
                  bottom: `${(targetNote.staffPos - 2) * 20}px`,
                  transform: 'translateX(-50%)',
                  boxShadow: feedback === 'none' ? `0 0 10px ${ACCENT}50` : 'none',
                }}
              />
              {targetNote.staffPos <= 1 && <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.2)', bottom: '0px' }} />}
              {targetNote.staffPos >= 10 && <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.2)', bottom: '160px' }} />}
            </div>

            {phase === 'timed-out' && (
              <div style={{ fontSize: 14, color: 'var(--ios-red)', marginBottom: 16 }}>
                Time&apos;s up! It was <span style={{ fontWeight: 700 }}>{targetNote.name}</span>
                <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 4 }}>Next round starting...</div>
              </div>
            )}

            <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginBottom: 16 }}>Tap the correct note</div>

            {/* Piano keys for answer */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16 }}>
              {QUIZ_NOTES.map((note) => (
                <button
                  key={note.name}
                  onClick={() => handleAnswer(note.name)}
                  disabled={phase !== 'playing'}
                  style={{
                    width: 44, height: 80, borderRadius: 6,
                    background: 'rgba(255,255,255,0.92)',
                    border: '0.5px solid var(--ios-sep)',
                    opacity: phase === 'playing' ? 1 : 0.4,
                    cursor: phase === 'playing' ? 'pointer' : 'default',
                  }}
                >
                  <span style={{ fontSize: 9, color: 'rgba(0,0,0,0.5)' }}>{note.name.replace('4', '').replace('5', '')}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px' }}>
              <span>Round {round}/{totalRounds}</span>
              <span>🔥 {streak}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
