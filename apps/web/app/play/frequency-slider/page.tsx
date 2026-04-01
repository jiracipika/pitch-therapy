'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTone } from '@/lib/audio';
import FeedbackOverlay from '@/components/FeedbackOverlay';

const ACCENT = '#0A84FF';
const MIN_FREQ = 80;
const MAX_FREQ = 1200;
const TOTAL_ROUNDS = 6;

function freqToPos(freq: number): number {
  const minLog = Math.log(MIN_FREQ);
  const maxLog = Math.log(MAX_FREQ);
  return ((Math.log(freq) - minLog) / (maxLog - minLog)) * 100;
}

function posToFreq(pos: number): number {
  const minLog = Math.log(MIN_FREQ);
  const maxLog = Math.log(MAX_FREQ);
  return Math.exp(minLog + (pos / 100) * (maxLog - minLog));
}

const REFERENCE_NOTES = [
  { name: 'C3', freq: 130.81 }, { name: 'E3', freq: 164.81 },
  { name: 'A3', freq: 220 }, { name: 'C4', freq: 261.63 },
  { name: 'E4', freq: 329.63 }, { name: 'A4', freq: 440 },
  { name: 'C5', freq: 523.25 }, { name: 'E5', freq: 659.25 },
  { name: 'A5', freq: 880 }, { name: 'C6', freq: 1046.5 },
];

export default function FrequencySliderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';
  const [phase, setPhase] = useState<'setup' | 'playing' | 'reveal' | 'done'>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [targetFreq, setTargetFreq] = useState(440);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [results, setResults] = useState<{ round: number; freq: number; answer: number; centsOff: number; points: number }[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const roundRef = useRef(0);

  const pickTarget = () => {
    const min = Math.log(MIN_FREQ);
    const max = Math.log(MAX_FREQ);
    const freq = Math.exp(min + Math.random() * (max - min));
    const rounded = Math.round(freq * 10) / 10;
    setTargetFreq(rounded);
    setSliderPos(50);
    setSubmitted(false);
    return rounded;
  };

  const startGame = () => {
    setRound(0); setScore(0); setStreak(0); setBestStreak(0); setResults([]);
    roundRef.current = 0;
    nextRound();
  };

  const nextRound = () => {
    const freq = pickTarget();
    playTone(freq, 1.0);
    setPhase('playing');
    roundRef.current += 1;
    setRound(roundRef.current);
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const answerFreq = posToFreq(sliderPos);
    const centsOff = Math.round(1200 * Math.log2(answerFreq / targetFreq));
    const accuracy = Math.max(0, 1 - Math.abs(centsOff) / 100);
    const points = Math.round(accuracy * 150);
    const correct = Math.abs(centsOff) <= 15;

    setScore(s => s + points);
    if (correct) {
      setStreak(s => { const ns = s + 1; setBestStreak(b => Math.max(b, ns)); return ns; });
      setLastCorrect(true);
      setShowFeedbackOverlay(true);
    } else {
      setStreak(0);
      setLastCorrect(false);
    }
    setResults(r => [...r, { round: roundRef.current, freq: targetFreq, answer: answerFreq, centsOff, points }]);
    setPhase('reveal');
  };

  const handleDrag = useCallback((clientX: number) => {
    if (!barRef.current || submitted) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  }, [submitted]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleDrag(e.clientX);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isDragging) handleDrag(e.clientX);
  }, [isDragging, handleDrag]);

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  if (phase === 'done') {
    const avgCents = results.length > 0 ? Math.round(results.reduce((s, r) => s + Math.abs(r.centsOff), 0) / results.length) : 0;
    const bestRound = results.length > 0 ? Math.max(...results.map(r => r.points)) : 0;
    return (
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 24 }}>
              Slider Complete!
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: ACCENT }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Score</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{avgCents}¢</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Avg Error</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>🔥 {bestStreak}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Best Streak</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{bestRound}pts</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Best Round</div>
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
            <div style={{ fontSize: 64, marginBottom: 20 }}>↔️</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Frequency Slider</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 8 }}>Drag the slider to match a hidden frequency</div>
            <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginBottom: 24 }}>80 Hz — 1,200 Hz · Logarithmic scale</div>

            <div className="ios-card" style={{ padding: 16, textAlign: 'left', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>How to Play</div>
              <ol style={{ fontSize: 14, color: 'var(--ios-label3)', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>1. A tone plays — tap 🔊 to replay it</li>
                <li>2. Drag the slider to guess its frequency</li>
                <li>3. Reference lines show note positions on the scale</li>
                <li>4. Lock in to see how close you were (±15¢ = correct)</li>
              </ol>
            </div>

            <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>
              {isPractice ? '🎓 Start Practicing' : 'Start Game'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answerFreq = posToFreq(sliderPos);
  const targetPos = freqToPos(targetFreq);

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-sm mx-auto px-4 pt-12">
        <FeedbackOverlay correct={lastCorrect} show={showFeedbackOverlay} streak={streak} onDone={() => setShowFeedbackOverlay(false)} />

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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>↔️ Frequency Slider</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {score} pts
          </div>
        </div>

        <div className="ios-progress-track mb-6">
          <motion.div
            className="ios-progress-fill"
            style={{ background: ACCENT }}
            animate={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Replay */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <motion.button
              onClick={() => playTone(targetFreq, 1.0)}
              whileTap={{ scale: 0.92 }}
              style={{
                width: 72, height: 72,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 22, background: 'var(--ios-bg2)',
                border: '1px solid var(--ios-sep)', fontSize: 32, cursor: 'pointer',
              }}
            >
              🔊
            </motion.button>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ios-label3)' }}>Target</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <motion.button
              onClick={() => playTone(posToFreq(sliderPos), 0.4)}
              whileTap={{ scale: 0.92 }}
              disabled={submitted}
              style={{
                width: 72, height: 72,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 22,
                background: submitted ? 'var(--ios-bg3)' : 'var(--ios-bg2)',
                border: '1px solid var(--ios-sep)',
                fontSize: 32, cursor: submitted ? 'default' : 'pointer',
                opacity: submitted ? 0.5 : 1,
              }}
            >
              🎵
            </motion.button>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ios-label3)' }}>Your pick</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ios-label4)', marginBottom: 20 }}>
          {answerFreq.toFixed(1)} Hz
        </div>

        {/* Slider */}
        <div className="ios-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ position: 'relative', height: 48, display: 'flex', alignItems: 'center' }}>
            <div
              ref={barRef}
              style={{
                position: 'absolute', inset: 0, borderRadius: 24,
                background: 'var(--ios-bg3)', cursor: 'pointer',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            {/* Reference lines */}
            {REFERENCE_NOTES.map(n => (
              <div
                key={n.name}
                style={{
                  position: 'absolute', top: 0, bottom: 0, width: 1,
                  background: 'var(--ios-sep)', left: `${freqToPos(n.freq)}%`,
                }}
              >
                <span style={{
                  position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 9, color: 'var(--ios-label4)', whiteSpace: 'nowrap',
                }}>{n.name}</span>
              </div>
            ))}
            {/* Handle */}
            <motion.div
              style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                zIndex: 10, width: 24, height: 24, borderRadius: 12,
                border: `2px solid ${ACCENT}`,
                backgroundColor: `${ACCENT}30`,
                boxShadow: `0 0 12px ${ACCENT}50`,
                left: `${sliderPos}%`, marginLeft: -12,
                cursor: 'grab',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            {/* Target (revealed) */}
            {submitted && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                style={{
                  position: 'absolute', top: 8, bottom: 8, width: 4, borderRadius: 2,
                  left: `${targetPos}%`, marginLeft: -2,
                  backgroundColor: 'var(--ios-green)',
                }}
              />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <span style={{ fontSize: 10, color: 'var(--ios-label4)' }}>80 Hz</span>
            <span style={{ fontSize: 10, color: 'var(--ios-label4)' }}>1,200 Hz</span>
          </div>
        </div>

        {/* Reveal */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ios-card"
              style={{ padding: '12px 16px', textAlign: 'center', marginBottom: 16 }}
            >
              <div style={{ fontSize: 13, color: 'var(--ios-label3)' }}>
                Target: <span style={{ fontWeight: 700, color: 'var(--ios-label)' }}>{targetFreq.toFixed(1)} Hz</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginTop: 2 }}>
                Your answer: <span style={{ fontWeight: 700, color: 'var(--ios-label)' }}>{answerFreq.toFixed(1)} Hz</span>
              </div>
              <div style={{
                marginTop: 8, fontSize: 18, fontWeight: 700,
                color: Math.abs(1200 * Math.log2(answerFreq / targetFreq)) <= 15 ? 'var(--ios-green)' : 'var(--ios-orange)',
              }}>
                {Math.abs(Math.round(1200 * Math.log2(answerFreq / targetFreq)))}¢ off
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
            onClick={() => { if (round >= TOTAL_ROUNDS) { setPhase('done'); } else { nextRound(); } }}
            className="ios-btn-primary"
            style={{ background: ACCENT }}
          >
            {round >= TOTAL_ROUNDS ? 'See Results' : 'Next Round →'}
          </motion.button>
        )}

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ios-label3)', marginTop: 16 }}>
          🔥 {streak} streak · Round {round}/{TOTAL_ROUNDS}
        </div>
      </div>
    </div>
  );
}
