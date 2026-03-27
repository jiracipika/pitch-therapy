'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';

const NOTE_FREQS = NOTE_NAMES.map((n) => NOTE_FREQUENCIES[`${n}4`] ?? 261.63) as number[];
const freq = (i: number) => NOTE_FREQS[i] ?? 261.63;

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

  if (phase === 'done') {
    return (
      <div className="min-h-screen px-4 pt-10">
        <div className="mx-auto max-w-md text-center">
          <div className="text-6xl">🏆</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Game Complete!</h1>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="glass-card p-4"><div className="text-2xl font-bold text-white">{score}</div><div className="text-xs text-zinc-500">Score</div></div>
            <div className="glass-card p-4"><div className="text-2xl font-bold text-white">{results.filter(r => r.correct).length}/{totalRounds}</div><div className="text-xs text-zinc-500">Correct</div></div>
            <div className="glass-card p-4"><div className="text-2xl font-bold text-white">🔥 {streak}</div><div className="text-xs text-zinc-500">Best Streak</div></div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => router.push('/play/pitch-match')} className="flex-1 rounded-full bg-[#60A5FA] py-3 font-semibold text-white transition-all duration-300 ease-out hover:opacity-90">Play Again</button>
            <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-full bg-white/5 py-3 font-medium text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10">Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-10">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-white transition-colors duration-300">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight text-[#60A5FA]">🎤 Pitch Match</h1>
          <div className="text-sm text-zinc-500">Score: {score}</div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-[#60A5FA] transition-all duration-500" style={{ width: `${(round / totalRounds) * 100}%` }} />
        </div>

        {phase === 'idle' && (
          <div className="mt-20 text-center">
            <div className="text-6xl mb-4">🎤</div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Ready to train?</h2>
            <p className="mt-2 text-zinc-500">Match the target pitch with your voice</p>
            <button onClick={handleStart} className="mt-6 rounded-full bg-[#60A5FA] px-6 py-2.5 font-semibold text-white transition-all duration-300 ease-out hover:opacity-90">
              Start Training
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div className="mt-10 text-center">
            <p className="text-sm text-zinc-500">Match this note</p>
            <div className="mt-2 text-5xl font-bold text-[#60A5FA]">{(NOTE_NAMES[targetNote] ?? 'A')}4</div>
            <button onClick={() => playTone(freq(targetNote), 0.8)} className="mt-3 rounded-full bg-white/5 border border-white/10 px-5 py-2 text-sm font-medium text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10">
              🔊 Play Target
            </button>

            <div className="mt-8 relative">
              <div className="h-4 rounded-full bg-white/5 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center">
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#4ADE80]/50" />
                  <div
                    className="absolute top-0 bottom-0 w-2 rounded-full bg-[#60A5FA] transition-all duration-100"
                    style={{ left: `calc(50% + ${Math.max(-50, Math.min(50, cents))}%)`, transform: 'translateX(-50%)' }}
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-zinc-600">
                <span>-100¢</span><span>0¢</span><span>+100¢</span>
              </div>
              <div className={`mt-2 text-lg font-bold ${Math.abs(cents) < 25 ? 'text-[#4ADE80]' : Math.abs(cents) < 50 ? 'text-[#FBBF24]' : 'text-red-400'}`}>
                {cents > 0 ? '+' : ''}{cents} cents {Math.abs(cents) < 25 ? '🎵' : ''}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="text-sm text-zinc-500">🔥 Streak: {streak}</div>
              <div className="text-sm text-zinc-500">Round {round}/{totalRounds}</div>
            </div>

            <div className="mt-6 flex gap-3 justify-center">
              <button onClick={submit} className="rounded-full bg-[#60A5FA] px-6 py-2.5 font-semibold text-white transition-all duration-300 ease-out hover:opacity-90">✓ Submit</button>
              <button onClick={handleStop} className="rounded-full bg-white/5 px-6 py-2.5 font-medium text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10">Stop</button>
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
