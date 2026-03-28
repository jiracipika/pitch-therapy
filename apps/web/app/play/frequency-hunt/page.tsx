'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { playTone } from '@/lib/audio';

const ACCENT = '#FF9F0A';
const MIN_FREQ = 100;
const MAX_FREQ = 2000;

// Log scale: map slider position [0,1] to frequency [MIN_FREQ, MAX_FREQ]
const sliderToFreq = (pos: number) => Math.round(MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, pos));
const freqToSlider = (freq: number) => Math.log(freq / MIN_FREQ) / Math.log(MAX_FREQ / MIN_FREQ);

export default function FrequencyHuntPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';

  const [phase, setPhase] = useState<'idle' | 'hunting' | 'result' | 'done'>('idle');
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(8);
  const [score, setScore] = useState(0);
  const [targetFreq, setTargetFreq] = useState(440);
  const [sliderPos, setSliderPos] = useState(0.5);
  const [results, setResults] = useState<{ round: number; target: number; guess: number; diff: number; points: number }[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  const startPreview = useCallback((freq: number) => {
    if (oscRef.current) return;
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = 0.2;
    osc.start();
    oscRef.current = osc;
    gainRef.current = gain;
    setPreviewing(true);
  }, []);

  const updatePreviewFreq = useCallback((freq: number) => {
    if (oscRef.current) oscRef.current.frequency.value = freq;
  }, []);

  const stopPreview = useCallback(() => {
    if (gainRef.current) {
      gainRef.current.gain.exponentialRampToValueAtTime(0.001, ctxRef.current?.currentTime ?? 0 + 0.1);
      setTimeout(() => {
        oscRef.current?.stop();
        oscRef.current = null;
        gainRef.current = null;
        ctxRef.current?.close();
        ctxRef.current = null;
        setPreviewing(false);
      }, 150);
    }
  }, []);

  const startRound = () => {
    const freq = Math.round(MIN_FREQ + Math.random() * (MAX_FREQ - MIN_FREQ));
    const rounded = Math.round(freq / 10) * 10;
    setTargetFreq(rounded);
    setSliderPos(freqToSlider(rounded) * 0.3 + Math.random() * 0.4);
    setPhase('hunting');
    setRound((r) => r + 1);
    playTone(rounded, 1.0);
  };

  const handleStart = () => {
    setPhase('idle'); setRound(0); setScore(0); setResults([]);
    startRound();
  };

  const handleLock = () => {
    stopPreview();
    const guess = sliderToFreq(sliderPos);
    const diff = Math.abs(guess - targetFreq);
    const points = Math.max(0, Math.round(1000 * Math.exp(-diff / 30)));
    setScore((s) => s + points);
    setResults((r) => [...r, { round, target: targetFreq, guess, diff, points }]);
    playTone(targetFreq, 0.5);
    setPhase('result');
    setTimeout(() => {
      if (round >= totalRounds) setPhase('done');
      else startRound();
    }, 2000);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pos = parseFloat(e.target.value);
    setSliderPos(pos);
    const freq = sliderToFreq(pos);
    updatePreviewFreq(freq);
    if (!previewing) startPreview(freq);
  };

  const handleSliderDown = () => {
    startPreview(sliderToFreq(sliderPos));
  };

  const handleSliderUp = () => {
    stopPreview();
  };

  if (phase === 'done') {
    const avgDiff = Math.round(results.reduce((s, r) => s + r.diff, 0) / results.length);
    return (
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 24 }}>
              Hunt Complete
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: ACCENT }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Score</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{avgDiff} Hz</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Avg Error</div>
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
            onClick={() => { stopPreview(); router.push('/dashboard'); }}
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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>Frequency Hunt</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {score} pts
          </div>
        </div>

        <div className="ios-progress-track mb-6">
          <div className="ios-progress-fill" style={{ width: `${(round / totalRounds) * 100}%`, background: ACCENT }} />
        </div>

        {phase === 'idle' && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🔍</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Frequency Hunt</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 32 }}>Find the exact frequency by ear</div>
            <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={handleStart}>Start Hunting</button>
          </div>
        )}

        {(phase === 'hunting' || phase === 'result') && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginBottom: 10 }}>
                {phase === 'result' ? 'Result' : 'Find this frequency'}
              </div>
              {phase === 'result' ? (
                <div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: ACCENT, letterSpacing: '-0.03em' }}>{targetFreq} Hz</div>
                  <div style={{ fontSize: 14, color: 'var(--ios-label3)', marginTop: 4 }}>
                    Your guess: <span style={{ color: 'var(--ios-label)' }}>{Math.round(sliderToFreq(sliderPos))} Hz</span>
                  </div>
                  <div style={{ fontSize: 14, marginTop: 4, color: (results[results.length - 1]?.points ?? 0) > 500 ? 'var(--ios-green)' : (results[results.length - 1]?.points ?? 0) > 200 ? 'var(--ios-orange)' : 'var(--ios-red)' }}>
                    {results[results.length - 1]?.points ?? 0} pts
                  </div>
                </div>
              ) : (
                <motion.button
                  onClick={() => playTone(targetFreq, 1.0)}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    borderRadius: 20, padding: '8px 16px',
                    fontSize: 13, fontWeight: 500, color: 'var(--ios-label2)',
                    background: 'var(--ios-bg2)', border: 'none', cursor: 'pointer',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Play Target Again
                </motion.button>
              )}
            </div>

            {/* Log-scale frequency bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ios-label3)', marginBottom: 8 }}>
                <span>100 Hz</span><span>447 Hz</span><span>2000 Hz</span>
              </div>
              <input
                type="range" min={0} max={1} step={0.001} value={sliderPos}
                onChange={handleSliderChange}
                onMouseDown={handleSliderDown}
                onMouseUp={handleSliderUp}
                onTouchStart={handleSliderDown}
                onTouchEnd={handleSliderUp}
                disabled={phase !== 'hunting'}
                className="w-full"
                style={{
                  height: 12, borderRadius: 6, appearance: 'none', WebkitAppearance: 'none',
                  background: `linear-gradient(to right, ${ACCENT}40, ${ACCENT})`,
                  opacity: phase === 'hunting' ? 1 : 0.5, cursor: 'pointer',
                }}
              />
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.03em' }}>
                  {Math.round(sliderToFreq(sliderPos))} Hz
                </span>
              </div>
            </div>

            {previewing && phase === 'hunting' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT, animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: 12, color: 'var(--ios-label3)' }}>Previewing...</span>
              </div>
            )}

            {phase === 'hunting' && (
              <button
                onClick={handleLock}
                className="ios-btn-primary"
                style={{ background: ACCENT }}
              >
                Lock In Guess
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
