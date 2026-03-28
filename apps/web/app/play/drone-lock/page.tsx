'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';

const ACCENT = '#30D158';
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
  const [droneNote, setDroneNote] = useState(0);
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
    const noteIdx = Math.floor(Math.random() * 7) + 3;
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
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 24 }}>
              Session Complete
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: ACCENT }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Score</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{avgCents}¢</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Avg Error</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{results.length}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Rounds</div>
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
            onClick={() => { stopMic(); stopDrone(); router.push('/dashboard'); }}
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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>Drone Lock</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {score} pts
          </div>
        </div>

        <div className="ios-progress-track mb-6">
          <div className="ios-progress-fill" style={{ width: `${(round / totalRounds) * 100}%`, background: ACCENT }} />
        </div>

        {phase === 'idle' && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎤</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Drone Lock</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 32 }}>Sing to match intervals relative to a drone</div>
            <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={handleStart}>Start Session</button>
          </div>
        )}

        {(phase === 'listening' || phase === 'locking' || phase === 'scored') && (
          <div style={{ textAlign: 'center' }}>
            {/* Drone indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT }} />
              <span style={{ fontSize: 13, color: 'var(--ios-label3)' }}>Drone: <span style={{ color: 'var(--ios-label)', fontWeight: 600 }}>{NOTE_NAMES[droneNote]}4</span></span>
            </div>

            {/* Target interval */}
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginBottom: 8 }}>Sing this interval</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: ACCENT, letterSpacing: '-0.03em' }}>{targetInterval.name}</div>
            </motion.div>

            {/* Play target button */}
            <motion.button
              onClick={() => playTone(NOTE_FREQS[droneNote] * Math.pow(2, targetInterval.semitones / 12), 1.0)}
              whileTap={{ scale: 0.92 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                borderRadius: 20, padding: '8px 16px', marginBottom: 24,
                fontSize: 13, fontWeight: 500, color: 'var(--ios-label2)',
                background: 'var(--ios-bg2)', border: 'none', cursor: 'pointer',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Hear Target
            </motion.button>

            {/* Tuning meter */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'var(--ios-bg3)', overflow: 'visible', margin: '0 4px' }}>
                <div style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1.5, background: 'var(--ios-green)', transform: 'translateX(-50%)' }} />
                <div style={{
                  position: 'absolute', top: 0, width: 12, height: 8, borderRadius: 4,
                  background: Math.abs(cents) < 10 ? 'var(--ios-green)' : Math.abs(cents) < 25 ? 'var(--ios-orange)' : 'var(--ios-red)',
                  left: `calc(50% + ${Math.max(-45, Math.min(45, cents * 0.48))}%)`,
                  transform: 'translateX(-50%)',
                  transition: 'left 0.1s ease',
                }} />
              </div>
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ios-label3)' }}>
                <span>-100¢</span><span>-50¢</span><span style={{ color: 'var(--ios-green)' }}>0¢</span><span>+50¢</span><span>+100¢</span>
              </div>
              <div style={{
                marginTop: 10, fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em',
                color: Math.abs(cents) < 10 ? 'var(--ios-green)' : Math.abs(cents) < 25 ? 'var(--ios-orange)' : Math.abs(cents) < 50 ? 'var(--ios-orange)' : 'var(--ios-red)',
              }}>
                {cents > 0 ? '+' : ''}{cents}¢
              </div>
              {phase === 'scored' && (
                <div style={{ marginTop: 8, fontSize: 15, fontWeight: 600, color: Math.abs(cents) < 10 ? 'var(--ios-green)' : Math.abs(cents) < 25 ? 'var(--ios-orange)' : 'var(--ios-red)' }}>
                  {Math.abs(cents) < 10 ? '🎯 Perfect Lock!' : Math.abs(cents) < 25 ? '👍 Great!' : Math.abs(cents) < 50 ? '👌 Close' : '🔄 Try again'}
                </div>
              )}
            </div>

            {phase === 'listening' && (
              <button
                onClick={handleLock}
                className="ios-btn-primary"
                style={{ background: ACCENT }}
              >
                Lock In
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, fontSize: 13, color: 'var(--ios-label3)' }}>
              Round {round}/{totalRounds}
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
