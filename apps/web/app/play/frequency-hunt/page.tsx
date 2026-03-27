'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { playTone } from '@/lib/audio';

const ACCENT = '#F97316';
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
    // Round to nearest 10
    const rounded = Math.round(freq / 10) * 10;
    setTargetFreq(rounded);
    setSliderPos(freqToSlider(rounded) * 0.3 + Math.random() * 0.4); // Start somewhere random
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
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-sm text-center animate-slide-up">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.035em' }}>Hunt Complete</h1>
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <div className="stat-card"><div className="text-2xl font-bold" style={{ color: ACCENT }}>{score}</div><div className="mt-1 text-[11px] text-zinc-600">Score</div></div>
            <div className="stat-card"><div className="text-2xl font-bold text-white">{avgDiff} Hz</div><div className="mt-1 text-[11px] text-zinc-600">Avg Error</div></div>
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
          <button onClick={() => { stopPreview(); router.push('/'); }} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(161,161,170)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-base font-semibold" style={{ color: ACCENT }}>Frequency Hunt</h1>
          <div className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>{score} pts</div>
        </div>

        <div className="progress-bar-track mb-8">
          <div className="progress-bar-fill" style={{ width: `${(round / totalRounds) * 100}%`, backgroundColor: ACCENT }} />
        </div>

        {phase === 'idle' && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white" style={{ letterSpacing: '-0.025em' }}>Frequency Hunt</h2>
            <p className="mt-2 text-sm text-zinc-500">Find the exact frequency by ear</p>
            <button onClick={handleStart} className="mt-8 rounded-full px-8 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-85 active:scale-95" style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}40` }}>Start Hunting</button>
          </div>
        )}

        {(phase === 'hunting' || phase === 'result') && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 mb-2">
                {phase === 'result' ? 'Result' : 'Find this frequency'}
              </p>
              {phase === 'result' ? (
                <div>
                  <div className="text-3xl font-bold" style={{ color: ACCENT }}>{targetFreq} Hz</div>
                  <div className="text-sm text-zinc-500 mt-1">Your guess: <span className="text-white">{Math.round(sliderToFreq(sliderPos))} Hz</span></div>
                  <div className="text-sm mt-1" style={{ color: results[results.length - 1]?.points ?? 0 > 500 ? '#4ADE80' : results[results.length - 1]?.points ?? 0 > 200 ? '#FBBF24' : '#f87171' }}>
                    {results[results.length - 1]?.points ?? 0} pts
                  </div>
                </div>
              ) : (
                <motion.button
                  onClick={() => playTone(targetFreq, 1.0)}
                  whileTap={{ scale: 0.92 }}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-zinc-400 transition-all duration-200 hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Play Target Again
                </motion.button>
              )}
            </div>

            {/* Log-scale frequency bar */}
            <div className="mb-4">
              <div className="relative">
                {/* Frequency labels */}
                <div className="flex justify-between text-[10px] text-zinc-700 mb-2">
                  <span>100 Hz</span><span>447 Hz</span><span>2000 Hz</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.001}
                  value={sliderPos}
                  onChange={handleSliderChange}
                  onMouseDown={handleSliderDown}
                  onMouseUp={handleSliderUp}
                  onTouchStart={handleSliderDown}
                  onTouchEnd={handleSliderUp}
                  disabled={phase !== 'hunting'}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${ACCENT}40, ${ACCENT})`,
                    WebkitAppearance: 'none',
                    opacity: phase === 'hunting' ? 1 : 0.5,
                  }}
                />
                <div className="mt-2 text-center">
                  <span className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
                    {Math.round(sliderToFreq(sliderPos))} Hz
                  </span>
                </div>
              </div>
            </div>

            {/* Audio preview indicator */}
            {previewing && phase === 'hunting' && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />
                <span className="text-xs text-zinc-500">Previewing...</span>
              </div>
            )}

            {phase === 'hunting' && (
              <button
                onClick={handleLock}
                className="w-full rounded-full py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-85 active:scale-95"
                style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}40` }}
              >
                Lock In Guess
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
