'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';

const NOTE_FREQS = NOTE_NAMES.map((n) => NOTE_FREQUENCIES[`${n}4`] ?? 261.63) as number[];
const freq = (i: number) => NOTE_FREQS[i] ?? 261.63;

const ACCENT = '#60A5FA';

export default function PitchMatchPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(5);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetNote, setTargetNote] = useState(0);
  const [cents, setCents] = useState(0);
  const [results, setResults] = useState<{ round: number; correct: boolean; points: number; target: string; answer: string; timeMs: number }[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const roundStart = useRef(0);

  const startRound = () => {
    const noteIdx = Math.floor(Math.random() * 12);
    setTargetNote(noteIdx);
    setPhase('playing');
    setRound((r) => r + 1);
    roundStart.current = Date.now();
    playTone(freq(noteIdx), 0.8);
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
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-sm text-center animate-slide-up">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, boxShadow: `0 0 40px ${ACCENT}20` }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.035em' }}>Game Complete</h1>

          <div className="mt-6 grid grid-cols-3 gap-2.5">
            <div className="stat-card">
              <div className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.03em', color: ACCENT }}>{score}</div>
              <div className="mt-1 text-[11px] text-zinc-600">Score</div>
            </div>
            <div className="stat-card">
              <div className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>{correct}/{totalRounds}</div>
              <div className="mt-1 text-[11px] text-zinc-600">Correct</div>
            </div>
            <div className="stat-card">
              <div className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>{streak}</div>
              <div className="mt-1 text-[11px] text-zinc-600">Best Streak</div>
            </div>
          </div>

          <div className="mt-6 flex gap-2.5">
            <button
              onClick={() => { setPhase('idle'); setRound(0); setScore(0); setStreak(0); setResults([]); }}
              className="flex-1 rounded-full py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-85"
              style={{ background: ACCENT }}
            >
              Play Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 rounded-full py-3 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 pt-12 pb-nav">
      <div className="mx-auto max-w-sm">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(161,161,170)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-base font-semibold" style={{ color: ACCENT, letterSpacing: '-0.01em' }}>Pitch Match</h1>
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            {score} pts
          </div>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div className="progress-bar-track mb-8">
          <div className="progress-bar-fill" style={{ width: `${(round / totalRounds) * 100}%`, backgroundColor: ACCENT }} />
        </div>

        {/* ── IDLE STATE ── */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div
              className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white" style={{ letterSpacing: '-0.025em' }}>Ready to train?</h2>
            <p className="mt-2 text-sm text-zinc-500">Sing or hum to match the target pitch</p>
            <button
              onClick={handleStart}
              className="mt-8 rounded-full px-8 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-85 active:scale-95"
              style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}40` }}
            >
              Start Training
            </button>
          </div>
        )}

        {/* ── PLAYING STATE ── */}
        {phase === 'playing' && (
          <div className="text-center animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 mb-2">Match this note</p>
            <div
              className="text-6xl font-bold"
              style={{ color: ACCENT, letterSpacing: '-0.04em' }}
            >
              {(NOTE_NAMES[targetNote] ?? 'A')}4
            </div>

            {/* Play target button */}
            <button
              onClick={() => playTone(freq(targetNote), 0.8)}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-zinc-400 transition-all duration-200 hover:text-white"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Play Target
            </button>

            {/* Cents meter */}
            <div className="mt-8">
              <div className="relative h-3 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                {/* Center marker */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: 'rgba(74,222,128,0.5)' }} />
                {/* Needle */}
                <div
                  className="absolute top-0.5 bottom-0.5 w-2 rounded-full transition-all duration-100"
                  style={{
                    backgroundColor: ACCENT,
                    left: `calc(50% + ${Math.max(-46, Math.min(46, cents))}%)`,
                    transform: 'translateX(-50%)',
                    boxShadow: `0 0 6px ${ACCENT}80`,
                  }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-zinc-700">
                <span>-100¢</span><span>0¢</span><span>+100¢</span>
              </div>
              <div
                className="mt-3 text-xl font-bold"
                style={{
                  color: Math.abs(cents) < 25 ? '#4ADE80' : Math.abs(cents) < 50 ? '#FBBF24' : '#f87171',
                  letterSpacing: '-0.02em',
                }}
              >
                {cents > 0 ? '+' : ''}{cents}¢
              </div>
            </div>

            {/* Round + streak info */}
            <div className="mt-5 flex items-center justify-center gap-6 text-xs text-zinc-600">
              <span>Round {round}/{totalRounds}</span>
              <span className="h-3 w-px bg-white/10" />
              <span>Streak: {streak}</span>
            </div>

            <div className="mt-6 flex gap-2.5 justify-center">
              <button
                onClick={submit}
                className="rounded-full px-7 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-85 active:scale-95"
                style={{ background: ACCENT }}
              >
                Submit
              </button>
              <button
                onClick={handleStop}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-zinc-400 transition-all duration-200 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
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
