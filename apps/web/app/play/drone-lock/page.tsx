'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';

const ACCENT = '#10B981';
const INTERVALS = [
  { name: 'Unison', semitones: 0 },
  { name: 'Minor 2nd', semitones: 1 },
  { name: 'Major 2nd', semitones: 2 },
  { name: 'Minor 3rd', semitones: 3 },
  { name: 'Major 3rd', semitones: 4 },
  { name: 'Perfect 4th', semitones: 5 },
  { name: 'Tritone', semitones: 6 },
  { name: 'Perfect 5th', semitones: 7 },
  { name: 'Minor 6th', semitones: 8 },
  { name: 'Major 6th', semitones: 9 },
  { name: 'Minor 7th', semitones: 10 },
  { name: 'Octave', semitones: 12 },
];

type Phase = 'idle' | 'listening' | 'locking' | 'scored' | 'done';

export default function DroneLockPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(8);
  const [score, setScore] = useState(0);
  const [droneNote, setDroneNote] = useState(0); // index into NOTE_NAMES
  const [targetInterval, setTargetInterval] = useState(INTERVALS[0]);
  const [cents, setCents] = useState(0);
  const [detectedFreq, setDetectedFreq] = useState(0);
  const [results, setResults] = useState<{ round: number; interval: string; cents: number; points: number }[]>([]);
  const [locked, setLocked] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const droneCtxRef = useRef<AudioContext | null>(null);

  const NOTE_FREQS = NOTE_NAMES.map((n) => NOTE_FREQUENCIES[`${n}4`] ?? 261.63) as number[];

  const startDrone = useCallback((noteIdx: number) => {
    stopDrone();
    const ctx = new AudioContext();
    droneCtxRef.current = ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = NOTE_FREQS[noteIdx];
    osc.type = 'sine';
    gain.gain.value = 0.15;
    osc.start();
    droneOscRef.current = osc;
    droneGainRef.current = gain;
  }, []);

  const stopDrone = useCallback(() => {
    if (droneGainRef.current) {
      droneGainRef.current.gain.exponentialRampToValueAtTime(0.001, droneCtxRef.current?.currentTime ?? 0 + 0.3);
      setTimeout(() => {
        droneOscRef.current?.stop();
        droneOscRef.current = null;
        droneGainRef.current = null;
        droneCtxRef.current?.close();
        droneCtxRef.current = null;
      }, 400);
    }
  }, []);

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
        const freq = autoCorrelate(data, ctx.sampleRate);
        if (freq > 0) {
          setDetectedFreq(freq);
          const targetHz = NOTE_FREQS[droneNote] * Math.pow(2, targetInterval.semitones / 12);
          const measuredCents = Math.round(1200 * Math.log2(freq / targetHz));
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

  const startRound = () => {
    const noteIdx = Math.floor(Math.random() * 7) + 3; // D4 to B4
    const intervalIdx = Math.floor(Math.random() * INTERVALS.length);
    const interval = INTERVALS[intervalIdx];
    setDroneNote(noteIdx);
    setTargetInterval(interval);
    setCents(0);
    setDetectedFreq(0);
    setLocked(false);
    setPhase('listening');
    setRound((r) => r + 1);
    startDrone(noteIdx);
    playTone(NOTE_FREQS[noteIdx] * Math.pow(2, interval.semitones / 12), 1.0);
  };

  const handleStart = async () => {
    setPhase('idle'); setRound(0); setScore(0); setResults([]);
    startRound();
    await startMic();
  };

  const handleLock = () => {
    setLocked(true);
    setPhase('scored');
    const absCents = Math.abs(cents);
    const points = absCents < 10 ? 200 : absCents < 25 ? 150 : absCents < 50 ? 100 : absCents < 100 ? 50 : 20;
    setScore((s) => s + points);
    setResults((r) => [...r, { round, interval: targetInterval.name, cents, points }]);
    setTimeout(() => {
      if (round >= totalRounds) {
        stopMic();
        stopDrone();
        setPhase('done');
      } else startRound();
    }, 2000);
  };

  useEffect(() => () => { stopMic(); stopDrone(); }, []);

  if (phase === 'done') {
    const avgCents = Math.round(results.reduce((s, r) => s + Math.abs(r.cents), 0) / results.length);
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-sm text-center animate-slide-up">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.035em' }}>Session Complete</h1>
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            <div className="stat-card"><div className="text-2xl font-bold" style={{ color: ACCENT }}>{score}</div><div className="mt-1 text-[11px] text-zinc-600">Score</div></div>
            <div className="stat-card"><div className="text-2xl font-bold text-white">{avgCents}¢</div><div className="mt-1 text-[11px] text-zinc-600">Avg Error</div></div>
            <div className="stat-card"><div className="text-2xl font-bold text-white">{results.length}</div><div className="mt-1 text-[11px] text-zinc-600">Rounds</div></div>
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
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => { stopMic(); stopDrone(); router.push('/'); }} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(161,161,170)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-base font-semibold" style={{ color: ACCENT }}>Drone Lock</h1>
          <div className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>{score} pts</div>
        </div>

        <div className="progress-bar-track mb-8">
          <div className="progress-bar-fill" style={{ width: `${(round / totalRounds) * 100}%`, backgroundColor: ACCENT }} />
        </div>

        {phase === 'idle' && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white" style={{ letterSpacing: '-0.025em' }}>Drone Lock</h2>
            <p className="mt-2 text-sm text-zinc-500">Sing to match intervals relative to a drone</p>
            <button onClick={handleStart} className="mt-8 rounded-full px-8 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-85 active:scale-95" style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}40` }}>Start Session</button>
          </div>
        )}

        {(phase === 'listening' || phase === 'locking' || phase === 'scored') && (
          <div className="animate-fade-in text-center">
            {/* Drone indicator */}
            <div className="mb-4 flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />
              <span className="text-xs text-zinc-500">Drone: <span className="text-white font-medium">{NOTE_NAMES[droneNote]}4</span></span>
            </div>

            {/* Target interval */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 mb-2">Sing this interval</p>
              <div className="text-3xl font-bold" style={{ color: ACCENT, letterSpacing: '-0.03em' }}>{targetInterval.name}</div>
            </motion.div>

            {/* Play target button */}
            <motion.button
              onClick={() => playTone(NOTE_FREQS[droneNote] * Math.pow(2, targetInterval.semitones / 12), 1.0)}
              whileTap={{ scale: 0.92 }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-zinc-400 transition-all duration-200 hover:text-white mb-6"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Hear Target
            </motion.button>

            {/* Tuning meter */}
            <div className="mb-6">
              <div className="relative h-4 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                {/* Zone markers */}
                <div className="absolute left-[45%] top-0 bottom-0 w-[10%] rounded-full" style={{ background: 'rgba(74,222,128,0.15)' }} />
                <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: 'rgba(74,222,128,0.5)' }} />
                {/* Needle */}
                <motion.div
                  className="absolute top-0.5 bottom-0.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: Math.abs(cents) < 10 ? '#4ADE80' : Math.abs(cents) < 25 ? '#FBBF24' : '#f87171',
                    left: `calc(50% + ${Math.max(-48, Math.min(48, cents * 0.48))}%)`,
                    transform: 'translateX(-50%)',
                    boxShadow: `0 0 8px ${Math.abs(cents) < 10 ? '#4ADE80' : '#FBBF24'}60`,
                  }}
                  animate={{ left: `calc(50% + ${Math.max(-48, Math.min(48, cents * 0.48))}%)` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-zinc-700">
                <span>-100¢</span><span>-50¢</span><span style={{ color: '#4ADE80' }}>0¢</span><span>+50¢</span><span>+100¢</span>
              </div>
              <div
                className="mt-3 text-3xl font-bold"
                style={{
                  color: Math.abs(cents) < 10 ? '#4ADE80' : Math.abs(cents) < 25 ? '#FBBF24' : Math.abs(cents) < 50 ? '#f97316' : '#f87171',
                  letterSpacing: '-0.03em',
                }}
              >
                {cents > 0 ? '+' : ''}{cents}¢
              </div>
              {phase === 'scored' && (
                <div className="mt-2 text-sm font-medium" style={{ color: Math.abs(cents) < 10 ? '#4ADE80' : Math.abs(cents) < 25 ? '#FBBF24' : '#f87171' }}>
                  {Math.abs(cents) < 10 ? '🎯 Perfect Lock!' : Math.abs(cents) < 25 ? '👍 Great!' : Math.abs(cents) < 50 ? '👌 Close' : '🔄 Try again'}
                </div>
              )}
            </div>

            {phase === 'listening' && (
              <button
                onClick={handleLock}
                className="w-full rounded-full py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-85 active:scale-95"
                style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}40` }}
              >
                Lock In
              </button>
            )}

            <div className="flex items-center justify-center gap-6 text-xs text-zinc-600 mt-4">
              <span>Round {round}/{totalRounds}</span>
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
