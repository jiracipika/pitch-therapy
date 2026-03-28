'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';
import WaveVisualizer from '@/components/WaveVisualizer';

const NOTE_FREQS = NOTE_NAMES.map((n) => NOTE_FREQUENCIES[`${n}4`] ?? 261.63) as number[];
const freq = (i: number) => NOTE_FREQS[i] ?? 261.63;

const ACCENT = '#0A84FF';

export default function PitchMatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(5);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetNote, setTargetNote] = useState(0);
  const [cents, setCents] = useState(0);
  const [results, setResults] = useState<{ round: number; correct: boolean; points: number; target: string; answer: string; timeMs: number }[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const roundStart = useRef(0);

  const startRound = () => {
    const noteIdx = Math.floor(Math.random() * 12);
    setTargetNote(noteIdx);
    setPhase('playing');
    setRound((r) => r + 1);
    roundStart.current = Date.now();
    setIsPlaying(true);
    playTone(freq(noteIdx), 0.8);
    setTimeout(() => setIsPlaying(false), 800);
  };

  const startMic = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 2048;
    const data = new Float32Array(analyser.fftSize);
    const detect = () => {
      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) { const v = data[i] ?? 0; sum += v * v; }
      const rms = Math.sqrt(sum / data.length);
      if (rms > 0.01) {
        const detectedFreq = autoCorrelate(data, ctx.sampleRate);
        if (detectedFreq > 0) {
          const targetFreq = freq(targetNote);
          const measuredCents = Math.round(1200 * Math.log2(detectedFreq / targetFreq));
          setCents(measuredCents);
        }
      }
      rafRef.current = requestAnimationFrame(detect);
    };
    detect();
  };

  const stopMic = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const submit = () => {
    const correct = Math.abs(cents) < 50;
    const points = correct ? Math.max(100 - Math.abs(cents) * 2, 10) : 0;
    const targetName = (NOTE_NAMES[targetNote] ?? 'A');
    setScore((s) => s + points);
    if (correct) setStreak((s) => s + 1); else setStreak(0);
    setResults((r) => [...r, { round, correct, points, target: targetName, answer: `${cents} cents`, timeMs: Date.now() - roundStart.current }]);
    stopMic();
    if (round >= totalRounds) setPhase('done');
    else setTimeout(startRound, 1500);
  };

  const handleStart = async () => {
    setPhase('idle'); setRound(0); setScore(0); setStreak(0); setResults([]);
    startRound();
    await startMic();
  };

  const handleStop = () => { stopMic(); setPhase('idle'); };

  useEffect(() => { return () => { stopMic(); }; }, []);

  /* ── RESULTS SCREEN ── */
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
              <button
                className="ios-btn-primary"
                style={{ background: ACCENT }}
                onClick={() => { setPhase('idle'); setRound(0); setScore(0); setStreak(0); setResults([]); }}
              >
                Play Again
              </button>
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

        {/* ── HEADER ── */}
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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>Pitch Match</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {isPractice ? 'Practice' : `${score} pts`}
          </div>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div className="ios-progress-track mb-6">
          <div className="ios-progress-fill" style={{ width: `${(round / totalRounds) * 100}%`, background: ACCENT }} />
        </div>

        {/* ── IDLE STATE ── */}
        {phase === 'idle' && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎤</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Ready to train?</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 32 }}>Sing or hum to match the target pitch</div>
            <button
              onClick={handleStart}
              className="ios-btn-primary"
              style={{ background: ACCENT }}
            >
              Start Training
            </button>
          </div>
        )}

        {/* ── PLAYING STATE ── */}
        {phase === 'playing' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', marginBottom: 8 }}>Match this note</div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ fontSize: 72, fontWeight: 800, color: ACCENT, letterSpacing: '-2px', lineHeight: 1, marginBottom: 12 }}
            >
              {(NOTE_NAMES[targetNote] ?? 'A')}4
            </motion.div>

            <div style={{ marginBottom: 12 }}>
              <WaveVisualizer active={isPlaying} color={ACCENT} height={40} />
            </div>

            <motion.button
              onClick={() => { setIsPlaying(true); playTone(freq(targetNote), 0.8); setTimeout(() => setIsPlaying(false), 800); }}
              whileTap={{ scale: 0.92 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                borderRadius: 20, padding: '6px 14px',
                fontSize: 13, fontWeight: 500, color: 'var(--ios-label2)',
                background: 'var(--ios-bg2)', border: 'none', cursor: 'pointer',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Play Target
            </motion.button>

            {/* Cents meter */}
            <div style={{ marginTop: 28 }}>
              <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'var(--ios-bg3)', overflow: 'visible', margin: '0 4px' }}>
                <div style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1.5, background: 'var(--ios-green)', transform: 'translateX(-50%)' }} />
                <div style={{
                  position: 'absolute', top: 0, width: 12, height: 8, borderRadius: 4,
                  background: ACCENT, left: `calc(50% + ${Math.max(-45, Math.min(45, cents / 2))}%)`,
                  transform: 'translateX(-50%)',
                  transition: 'left 0.1s ease',
                  boxShadow: `0 0 8px ${ACCENT}60`
                }} />
              </div>
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ios-label3)' }}>
                <span>-100¢</span><span>0¢</span><span>+100¢</span>
              </div>
              <div
                style={{
                  marginTop: 10, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em',
                  color: Math.abs(cents) < 25 ? 'var(--ios-green)' : Math.abs(cents) < 50 ? 'var(--ios-orange)' : 'var(--ios-red)',
                }}
              >
                {cents > 0 ? '+' : ''}{cents}¢
              </div>
            </div>

            {/* Round + streak info */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', marginTop: 16 }}>
              <span>Round {round}/{totalRounds}</span>
              <span>🔥 {streak}</span>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={submit}
                className="ios-btn-tonal"
                style={{ background: ACCENT, color: '#fff' }}
              >
                Submit
              </button>
              <button
                onClick={handleStop}
                style={{
                  height: 34, borderRadius: 17, padding: '0 16px',
                  fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: 'var(--ios-bg2)', color: 'var(--ios-label3)',
                }}
              >
                Stop
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) { const v = buf[i] ?? 0; rms += v * v; }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;
  const HALF = Math.floor(SIZE / 2);
  let bestOffset = -1, bestCorrelation = 0, foundGoodCorrelation = false;
  for (let offset = 20; offset < HALF; offset++) {
    let correlation = 0;
    for (let i = 0; i < HALF; i++) correlation += Math.abs((buf[i] ?? 0) - (buf[i + offset] ?? 0));
    correlation = 1 - correlation / HALF;
    if (correlation > 0.9 && !foundGoodCorrelation) foundGoodCorrelation = true;
    if (foundGoodCorrelation) {
      if (correlation > bestCorrelation) { bestCorrelation = correlation; bestOffset = offset; }
      else if (correlation < bestCorrelation - 0.01) break;
    }
  }
  return bestCorrelation > 0.01 && bestOffset > 0 ? sampleRate / bestOffset : -1;
}
