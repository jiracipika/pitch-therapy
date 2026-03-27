'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { playTone, NOTE_FREQUENCIES } from '@/lib/audio';
import FeedbackOverlay from '@/components/FeedbackOverlay';

const ACCENT = '#EC4899';

const TARGET_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

export default function TuneInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';
  const [phase, setPhase] = useState<'setup' | 'playing' | 'feedback' | 'done'>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [targetNote, setTargetNote] = useState('A4');
  const [targetFreq, setTargetFreq] = useState(440);
  const [centsOff, setCentsOff] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [results, setResults] = useState<{ round: number; correct: boolean; points: number; target: string; accuracy: number; timeMs: number }[]>([]);
  const [useMidi, setUseMidi] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const roundStartRef = useRef(0);
  const holdStartRef = useRef<number | null>(null);
  const totalRounds = 5;

  const autoCorrelate = useCallback((buf: Float32Array, sampleRate: number): number | null => {
    const SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return null;

    const halfSize = Math.floor(SIZE / 2);
    let bestCorrelation = 0;
    let bestOffset = 0;

    const correlations = new Float32Array(halfSize);
    for (let offset = 1; offset < halfSize; offset++) {
      let correlation = 0;
      for (let i = 0; i < halfSize; i++) {
        correlation += Math.abs(buf[i] - buf[i + offset]);
      }
      correlations[offset] = correlation;
      if (correlation < bestCorrelation || offset === 1) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    if (bestCorrelation > rms * 1.5) return null;
    return sampleRate / bestOffset;
  }, []);

  const detectPitch = useCallback(() => {
    if (!analyserRef.current) return;
    const buf = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buf);
    const freq = autoCorrelate(buf, audioContextRef.current?.sampleRate || 44100);
    if (freq && freq > 60 && freq < 1200) {
      const semitones = 12 * Math.log2(freq / targetFreq);
      const cents = Math.round(semitones * 100);
      setCentsOff(cents);

      if (Math.abs(cents) <= 10) {
        if (!holdStartRef.current) holdStartRef.current = Date.now();
        const held = Date.now() - holdStartRef.current;
        const needed = 1500;
        setHoldProgress(Math.min(held / needed, 1));
        if (held >= needed) {
          handleSuccess();
        }
      } else {
        holdStartRef.current = null;
        setHoldProgress(0);
      }
    }
  }, [targetFreq]);

  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(detectPitch, 50);
    return () => clearInterval(interval);
  }, [isListening, detectPitch]);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      setIsListening(true);
    } catch {
      // mic not available, fall back to play-and-match
      setUseMidi(false);
    }
  };

  const stopMic = () => {
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    setIsListening(false);
    holdStartRef.current = null;
  };

  const pickTarget = () => {
    const note = TARGET_NOTES[Math.floor(Math.random() * TARGET_NOTES.length)];
    const freq = NOTE_FREQUENCIES[note] || 440;
    setTargetNote(note);
    setTargetFreq(freq);
    setCentsOff(0);
    setHoldProgress(0);
    return note;
  };

  const startGame = () => {
    setRound(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setResults([]);
    if (!useMidi) startMic(); // Microphone mode: detect pitch in real time
    nextRound();
  };

  const nextRound = () => {
    const note = pickTarget();
    playTone(NOTE_FREQUENCIES[note] || 440, 0.8);
    setFeedback(null);
    setPhase('playing');
    setRound(r => r + 1);
    roundStartRef.current = Date.now();
  };

  const handleSuccess = () => {
    stopMic();
    const elapsed = Date.now() - roundStartRef.current;
    const accuracy = 1 - Math.abs(centsOff) / 50;
    const points = Math.round(accuracy * 100 + Math.max(0, 50 - elapsed / 100));
    setScore(s => s + points);
    setStreak(s => {
      const ns = s + 1;
      setBestStreak(b => Math.max(b, ns));
      return ns;
    });
    setFeedback('correct');
    setShowFeedbackOverlay(true);
    setResults(r => [...r, { round, correct: true, points, target: targetNote, accuracy, timeMs: elapsed }]);

    setTimeout(() => {
      if (round >= totalRounds) {
        setPhase('done');
        stopMic();
      } else {
        if (!useMidi) startMic();
        nextRound();
      }
    }, isPractice ? 1000 : 1500);
  };

  const handleGiveUp = () => {
    stopMic();
    setFeedback('wrong');
    setShowFeedbackOverlay(false);
    setStreak(0);
    setResults(r => [...r, { round, correct: false, points: 0, target: targetNote, accuracy: 0, timeMs: Date.now() - roundStartRef.current }]);

    setTimeout(() => {
      if (round >= totalRounds) {
        setPhase('done');
      } else {
        if (!useMidi) startMic();
        nextRound();
      }
    }, 1500);
  };

  useEffect(() => { return () => stopMic(); }, []);

  if (phase === 'done') {
    return (
      <div className="min-h-screen px-4 pt-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-6xl">🏆</motion.div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Tune In Complete!</h1>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Score', value: score },
              { label: 'Hit', value: `${results.filter(r => r.correct).length}/${totalRounds}` },
              { label: 'Best Streak', value: `🔥 ${bestStreak}` },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="glass-card p-4">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-zinc-500">{s.label}</div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={startGame} className="flex-1 rounded-full py-3 font-semibold text-white hover:opacity-90 transition-all" style={{ background: ACCENT }}>Play Again</button>
            <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-full bg-white/5 py-3 font-medium text-zinc-300 hover:bg-white/10 transition-all">Dashboard</button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-screen px-4 pt-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md">
          <div className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }} className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
              <span className="text-4xl">🎤</span>
            </motion.div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: ACCENT }}>Tune In</h1>
            <p className="mt-2 text-zinc-500">Hit the target note with your voice or instrument</p>
          </div>

          {/* How to play */}
          <div className="mt-8 rounded-2xl p-4 text-left" style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.15)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>How to Play</p>
            <ol className="space-y-2 text-sm text-zinc-400">
              <li>1. A target note appears — tap 🔊 to hear it</li>
              <li>2. Sing or play that note into your microphone</li>
              <li>3. The tuning meter shows how close you are (±50¢)</li>
              <li>4. Hold within ±10¢ for 1.5 seconds to score</li>
            </ol>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-zinc-500 mb-3 text-center">Input Mode</h3>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setUseMidi(false)} className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${!useMidi ? 'text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`} style={!useMidi ? { background: ACCENT } : {}}>🎤 Microphone</button>
              <button onClick={() => setUseMidi(true)} className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${useMidi ? 'text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`} style={useMidi ? { background: ACCENT } : {}}>👁️ Listen Only</button>
            </div>
            <p className="mt-2 text-center text-xs text-zinc-600">
              {useMidi ? 'Practice without mic — mark rounds yourself' : 'Real-time pitch detection via microphone'}
            </p>
          </div>

          <button onClick={startGame} className="mt-8 w-full rounded-full py-3 font-semibold text-white hover:opacity-90 transition-all" style={{ background: ACCENT }}>Start Game</button>
        </motion.div>
      </div>
    );
  }

  const centsColor = Math.abs(centsOff) <= 10 ? '#4ADE80' : Math.abs(centsOff) <= 25 ? '#FBBF24' : '#F87171';

  return (
    <div className="min-h-screen px-4 pt-10">
      <FeedbackOverlay correct={feedback === 'correct'} show={showFeedbackOverlay} streak={streak} onDone={() => setShowFeedbackOverlay(false)} />

      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => { stopMic(); router.push('/dashboard'); }} className="text-sm text-zinc-500 hover:text-white transition-colors">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: ACCENT }}>🎤 Tune In</h1>
          <div className="text-sm text-zinc-500">Score: {score}</div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div className="h-full rounded-full" style={{ background: ACCENT }} animate={{ width: `${(round / totalRounds) * 100}%` }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
        </div>

        {/* Target note + replay */}
        <div className="mt-10 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-7xl font-bold" style={{ color: ACCENT }}>
            {targetNote}
          </motion.div>
          <p className="mt-2 text-sm text-zinc-500">{targetFreq.toFixed(1)} Hz</p>
          <motion.button onClick={() => playTone(targetFreq, 0.8)} whileTap={{ scale: 0.92 }} className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-all">
            🔊 Hear target
          </motion.button>
        </div>

        {useMidi ? (
          /* Listen Only mode — manual self-assessment */
          <div className="mt-10 text-center">
            <p className="text-sm text-zinc-400 mb-6">Sing or play the note, then mark your result</p>
            <div className="flex gap-3 justify-center">
              <motion.button onClick={handleSuccess} whileTap={{ scale: 0.93 }} className="flex-1 rounded-2xl py-5 font-semibold text-white" style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)' }}>
                <span className="block text-2xl mb-1">✓</span>
                <span className="text-green-400">Got it</span>
              </motion.button>
              <motion.button onClick={handleGiveUp} whileTap={{ scale: 0.93 }} className="flex-1 rounded-2xl py-5 font-semibold text-white" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
                <span className="block text-2xl mb-1">✗</span>
                <span className="text-red-400">Skip</span>
              </motion.button>
            </div>
          </div>
        ) : (
          <>
            {/* Tuning meter */}
            <div className="mt-8 relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-600">-50¢</span>
                <span className="text-[10px] text-zinc-600">0</span>
                <span className="text-[10px] text-zinc-600">+50¢</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-white/5">
                <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-600" />
                <div className="absolute left-[38%] top-0 h-full w-[24%] rounded-full" style={{ background: 'rgba(74,222,128,0.15)' }} />
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2"
                  style={{ left: `${Math.max(5, Math.min(95, 50 + (centsOff / 50) * 45))}%`, borderColor: centsColor, backgroundColor: `${centsColor}40`, boxShadow: `0 0 8px ${centsColor}60` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>
              <div className="mt-2 text-center text-lg font-bold" style={{ color: centsColor }}>{centsOff > 0 ? '+' : ''}{centsOff}¢</div>
            </div>

            {/* Hold progress */}
            {holdProgress > 0 && (
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div className="h-full rounded-full" style={{ background: '#4ADE80' }} animate={{ width: `${holdProgress * 100}%` }} />
                </div>
                <p className="mt-1 text-center text-xs text-zinc-500">Hold steady...</p>
              </div>
            )}

            {/* Controls */}
            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="text-xs text-zinc-500">Sing or play into your mic</p>
              <button onClick={handleGiveUp} className="mt-2 text-sm text-zinc-600 hover:text-zinc-400 transition-colors">Skip round</button>
            </div>
          </>
        )}

        <div className="mt-6 text-center text-sm text-zinc-500">
          🔥 {streak} streak • Round {round}/{totalRounds}
        </div>
      </div>
    </div>
  );
}
