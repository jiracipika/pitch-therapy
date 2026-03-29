'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';

const ACCENT = '#30D158';
const CENTS_RANGE = 50;

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFF_CONFIG: Record<Difficulty, { label: string; centsRange: number; rounds: number }> = {
  easy: { label: 'Easy', centsRange: 50, rounds: 6 },
  medium: { label: 'Medium', centsRange: 30, rounds: 8 },
  hard: { label: 'Hard', centsRange: 15, rounds: 10 },
};

export default function CentsDeviationPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'reveal' | 'done'>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [baseNote, setBaseNote] = useState('A4');
  const [baseFreq, setBaseFreq] = useState(440);
  const [actualCents, setActualCents] = useState(0);
  const [needlePos, setNeedlePos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ round: number; note: string; actualCents: number; guessCents: number; points: number }[]>([]);
  const meterRef = useRef<HTMLDivElement>(null);
  const roundRef = useRef(0);

  const config = DIFF_CONFIG[difficulty];
  const totalRounds = config.rounds;

  const playRefAndDeviation = useCallback((freq: number, cents: number) => {
    playTone(freq, 0.8);
    setTimeout(() => {
      const deviatedFreq = freq * Math.pow(2, cents / 1200);
      playTone(deviatedFreq, 1.2);
    }, 1000);
  }, []);

  const pickRound = () => {
    const noteIdx = Math.floor(Math.random() * 12);
    const note = NOTE_NAMES[noteIdx];
    const freq = NOTE_FREQUENCIES[`${note}4`] || 261.63;
    const cents = Math.round((Math.random() * 2 - 1) * config.centsRange);
    const clampedCents = Math.max(-config.centsRange, Math.min(config.centsRange, cents));

    setBaseNote(`${note}4`);
    setBaseFreq(freq);
    setActualCents(clampedCents);
    setNeedlePos(0);
    setSubmitted(false);

    playRefAndDeviation(freq, clampedCents);
    return { note, freq, cents: clampedCents };
  };

  const startGame = () => {
    setRound(0); setScore(0); setStreak(0); setBestStreak(0); setResults([]);
    roundRef.current = 0;
    nextRound();
  };

  const nextRound = () => {
    pickRound();
    setPhase('playing');
    roundRef.current += 1;
    setRound(roundRef.current);
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const error = Math.abs(needlePos - actualCents);
    const points = Math.max(0, Math.round((1 - error / config.centsRange) * 100));
    const correct = error <= 5;

    setScore(s => s + points);
    if (correct) setStreak(s => { const ns = s + 1; setBestStreak(b => Math.max(b, ns)); return ns; });
    else setStreak(0);
    setResults(r => [...r, { round: roundRef.current, note: baseNote, actualCents, guessCents: needlePos, points }]);
    setPhase('reveal');
  };

  const handleDrag = useCallback((clientX: number) => {
    if (!meterRef.current || submitted) return;
    const rect = meterRef.current.getBoundingClientRect();
    const pct = (clientX - rect.left) / rect.width;
    const cents = Math.round((pct - 0.5) * 2 * CENTS_RANGE);
    setNeedlePos(Math.max(-CENTS_RANGE, Math.min(CENTS_RANGE, cents)));
  }, [submitted]);

  if (phase === 'done') {
    return (
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>📐</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 24 }}>
              Cents Deviation
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: ACCENT }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Score</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{results.filter(r => Math.abs(r.guessCents - r.actualCents) <= 5).length}/{totalRounds}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Exact</div>
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
            <div style={{ fontSize: 64, marginBottom: 20 }}>📐</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Cents Deviation</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>Detect microtonal sharp/flat deviations</div>

            <div className="ios-card" style={{ padding: 16, textAlign: 'left', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>How to Play</div>
              <ol style={{ fontSize: 14, color: 'var(--ios-label3)', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>1. Hear a reference note, then a slightly detuned version</li>
                <li>2. Drag the needle to match the deviation in cents</li>
                <li>3. Within ±5¢ = correct; wider = partial credit</li>
                <li>4. Tap &quot;Play Both&quot; to replay anytime</li>
              </ol>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginBottom: 10 }}>Difficulty</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {(Object.keys(DIFF_CONFIG) as Difficulty[]).map(d => (
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
                    {DIFF_CONFIG[d].label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 8 }}>
                ±{config.centsRange} cents · {config.rounds} rounds
              </div>
            </div>

            <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  const needlePct = 50 + (needlePos / CENTS_RANGE) * 45;
  const actualPct = 50 + (actualCents / CENTS_RANGE) * 45;

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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>📐 Cents Deviation</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {score} pts
          </div>
        </div>

        <div className="ios-progress-track mb-6">
          <motion.div
            className="ios-progress-fill"
            style={{ background: ACCENT }}
            animate={{ width: `${(round / totalRounds) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Info */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--ios-label3)' }}>
            Reference note: <span style={{ fontWeight: 700, color: 'var(--ios-label)' }}>{baseNote}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ios-label4)', marginTop: 2 }}>Listen to both notes, then set the needle</div>
        </div>

        {/* Play buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <motion.button
            onClick={() => playTone(baseFreq, 0.8)}
            whileTap={{ scale: 0.92 }}
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--ios-bg2)', border: '1px solid var(--ios-sep)',
              fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            🔊
          </motion.button>
          <motion.button
            onClick={() => playRefAndDeviation(baseFreq, actualCents)}
            whileTap={{ scale: 0.92 }}
            style={{
              height: 56, borderRadius: 16, padding: '0 20px',
              background: `rgba(48,209,88,0.12)`, border: `1px solid ${ACCENT}`,
              fontSize: 14, fontWeight: 600, color: ACCENT, cursor: 'pointer',
            }}
          >
            🔊+🔊 Play Both
          </motion.button>
        </div>

        {/* Cents meter */}
        <div className="ios-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ios-label4)', marginBottom: 8 }}>
            <span>♭ Flat -{CENTS_RANGE}¢</span>
            <span>Perfect 0¢</span>
            <span>♯ Sharp +{CENTS_RANGE}¢</span>
          </div>
          <div
            ref={meterRef}
            style={{
              position: 'relative', height: 72, borderRadius: 12,
              background: 'var(--ios-bg3)', cursor: 'pointer', overflow: 'hidden',
            }}
            onPointerDown={(e) => { setIsDragging(true); handleDrag(e.clientX); }}
            onPointerMove={(e) => { if (isDragging) handleDrag(e.clientX); }}
            onPointerUp={() => setIsDragging(false)}
            onPointerLeave={() => setIsDragging(false)}
          >
            {/* Center line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'var(--ios-sep)' }} />
            {/* Zone markers */}
            {[-40, -30, -20, -10, 10, 20, 30, 40].map(c => (
              <div key={c} style={{ position: 'absolute', top: 0, bottom: 0, width: 1, background: 'var(--ios-sep)', opacity: 0.5, left: `${50 + (c / CENTS_RANGE) * 45}%` }} />
            ))}
            {/* Needle */}
            <motion.div
              style={{
                position: 'absolute', top: 8, bottom: 8, width: 3, borderRadius: 2, zIndex: 10,
                left: `${needlePct}%`, marginLeft: -1.5,
                background: ACCENT,
                boxShadow: `0 0 8px ${ACCENT}80`,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            {/* Actual (revealed) */}
            {submitted && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                style={{
                  position: 'absolute', top: 12, bottom: 12, width: 3, borderRadius: 2,
                  left: `${actualPct}%`, marginLeft: -1.5,
                  background: 'var(--ios-red)',
                }}
              />
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 20, fontWeight: 700, color: ACCENT }}>
            {needlePos > 0 ? '+' : ''}{needlePos}¢
          </div>
        </div>

        {/* Reveal */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="ios-card"
              style={{
                padding: '12px 16px', textAlign: 'center', marginBottom: 16,
                border: `1px solid ${Math.abs(needlePos - actualCents) <= 5 ? 'var(--ios-green)' : 'var(--ios-orange)'}`,
              }}
            >
              <div style={{ fontSize: 13, color: 'var(--ios-label3)' }}>
                Actual: <span style={{ fontWeight: 700, color: 'var(--ios-label)' }}>{actualCents > 0 ? '+' : ''}{actualCents}¢</span>
                {' · '}
                Your guess: <span style={{ fontWeight: 700, color: 'var(--ios-label)' }}>{needlePos > 0 ? '+' : ''}{needlePos}¢</span>
              </div>
              <div style={{
                marginTop: 6, fontSize: 18, fontWeight: 700,
                color: Math.abs(needlePos - actualCents) <= 5 ? 'var(--ios-green)' : 'var(--ios-orange)',
              }}>
                {Math.abs(needlePos - actualCents)}¢ error
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit / Next */}
        {!submitted ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className="ios-btn-primary"
            style={{ background: ACCENT }}
          >
            Lock In
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { if (roundRef.current >= totalRounds) { setPhase('done'); } else { nextRound(); } }}
            className="ios-btn-primary"
            style={{ background: ACCENT }}
          >
            {roundRef.current >= totalRounds ? 'See Results' : 'Next Round →'}
          </motion.button>
        )}

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ios-label3)', marginTop: 16 }}>
          🔥 {streak} streak · Round {round}/{totalRounds} · {config.label}
        </div>
      </div>
    </div>
  );
}
