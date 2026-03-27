'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';

const NOTE_FREQS: Record<string, number> = {};
(NOTE_NAMES as unknown as string[]).forEach((n) => { NOTE_FREQS[`${n}4`] = NOTE_FREQUENCIES[`${n}4`] ?? 261.63; });
const ACCENT = '#0EA5E9';

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

  const clef: Clef = 'treble';

  const startRound = () => {
    const note = QUIZ_NOTES[Math.floor(Math.random() * QUIZ_NOTES.length)];
    setTargetNote(note);
    setRound((r) => r + 1);
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

    if (round >= totalRounds) setTimeout(() => setPhase('done'), 1000);
    else setTimeout(startRound, 1200);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  if (phase === 'done') {
    const correct = results.filter(r => r.correct).length;
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-sm text-center animate-slide-up">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              <path d="M8 7h8M8 11h6"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.035em' }}>Game Complete</h1>
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            <div className="stat-card"><div className="text-2xl font-bold" style={{ color: ACCENT }}>{score}</div><div className="mt-1 text-[11px] text-zinc-600">Score</div></div>
            <div className="stat-card"><div className="text-2xl font-bold text-white">{correct}/{totalRounds}</div><div className="mt-1 text-[11px] text-zinc-600">Correct</div></div>
            <div className="stat-card"><div className="text-2xl font-bold text-white">{streak}</div><div className="mt-1 text-[11px] text-zinc-600">Best Streak</div></div>
          </div>
          <div className="mt-6 flex gap-2.5">
            <button onClick={handleStart} className="flex-1 rounded-full py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-85" style={{ background: ACCENT }}>Play Again</button>
            <button onClick={() => router.push('/')} className="flex-1 rounded-full py-3 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-white/10" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>Home</button>
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
          <h1 className="text-base font-semibold" style={{ color: ACCENT }}>Name That Note</h1>
          <div className="flex items-center gap-2">
            {isPractice && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${ACCENT}20`, color: ACCENT }}>Practice</span>}
            <div className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>{score} pts</div>
          </div>
        </div>

        <div className="progress-bar-track mb-8">
          <div className="progress-bar-fill" style={{ width: `${(round / totalRounds) * 100}%`, backgroundColor: ACCENT }} />
        </div>

        {phase === 'idle' && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white" style={{ letterSpacing: '-0.025em' }}>Name That Note</h2>
            <p className="mt-2 text-sm text-zinc-500">Identify notes on the musical staff</p>
            <div className="mt-4 flex gap-2">
              <button onClick={handleStart} className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-85 active:scale-95" style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}40` }}>Timed Mode</button>
              <button onClick={() => { router.push('/play/name-that-note?timed=false&practice=true'); }} className="rounded-full px-6 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-white/10" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>Practice</button>
            </div>
          </div>
        )}

        {(phase === 'playing' || phase === 'timed-out') && (
          <div className="animate-fade-in text-center">
            {/* Timer */}
            {isTimed && !isPractice && (
              <div className="mb-4">
                <div className="text-xs text-zinc-600 mb-1">Time: {timeLeft}s</div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: timeLeft <= 3 ? '#f87171' : ACCENT, width: `${(timeLeft / 10) * 100}%` }} />
                </div>
              </div>
            )}

            {/* Staff */}
            <div className="relative mx-auto mb-6" style={{ width: 200, height: 140 }}>
              {/* Staff lines */}
              {[2, 4, 6, 8, 10].map((linePos) => (
                <div key={linePos} className="absolute left-0 right-0 h-px bg-white/20" style={{ bottom: `${(linePos - 2) * 20}px` }} />
              ))}
              {/* Treble clef indicator */}
              <div className="absolute -left-1 bottom-4 text-white/30 text-3xl font-serif">𝄞</div>
              {/* Note head */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute w-5 h-4 rounded-full"
                style={{
                  backgroundColor: feedback === 'correct' ? '#4ADE80' : feedback === 'wrong' ? '#f87171' : ACCENT,
                  left: '50%',
                  bottom: `${(targetNote.staffPos - 2) * 20}px`,
                  transform: 'translateX(-50%)',
                  boxShadow: feedback === 'none' ? `0 0 10px ${ACCENT}50` : 'none',
                }}
              />
              {/* Ledger line for C4 or D5 */}
              {targetNote.staffPos <= 1 && <div className="absolute left-0 right-0 h-px bg-white/20" style={{ bottom: '0px' }} />}
              {targetNote.staffPos >= 10 && <div className="absolute left-0 right-0 h-px bg-white/20" style={{ bottom: '160px' }} />}
            </div>

            {phase === 'timed-out' && (
              <p className="text-sm text-red-400 mb-4">Time&apos;s up! It was {targetNote.name}</p>
            )}

            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 mb-4">Tap the correct note</p>

            {/* Piano keys for answer */}
            <div className="flex justify-center gap-1 mb-4">
              {QUIZ_NOTES.map((note) => (
                <button
                  key={note.name}
                  onClick={() => handleAnswer(note.name)}
                  disabled={phase !== 'playing'}
                  className="transition-all duration-100 active:scale-95"
                  style={{
                    width: 44,
                    height: 80,
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.1)',
                    border: `1px solid rgba(255,255,255,0.1)`,
                    opacity: phase === 'playing' ? 1 : 0.4,
                    cursor: phase === 'playing' ? 'pointer' : 'default',
                  }}
                >
                  <span className="text-[9px] text-zinc-500">{note.name.replace('4', '').replace('5', '')}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-zinc-600 mt-4">
              <span>Round {round}/{totalRounds}</span>
              <span className="h-3 w-px bg-white/10" />
              <span>Streak: {streak}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
