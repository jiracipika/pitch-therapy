'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const ACCENT = '#F43F5E'; // rose-500
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_FREQS: Record<string, number> = {
  'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63,
  'F': 349.23, 'F#': 369.99, 'G': 392.0, 'G#': 415.3, 'A': 440.0,
  'A#': 466.16, 'B': 493.88,
};

function playTone(freq: number, dur = 0.5) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.frequency.value = freq; osc.type = 'triangle';
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
  osc.start(); osc.stop(ctx.currentTime + dur);
}

function pickRandom() { return NOTE_NAMES[Math.floor(Math.random() * NOTE_NAMES.length)]; }

type Player = { name: string; score: number; ready: boolean; lockedIn: boolean; selectedNote: string; lastCents: number };

export default function TuningBattlePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'setup' | 'ready' | 'playing' | 'roundResult' | 'done'>('setup');
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(0);
  const [targetNote, setTargetNote] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [roundWinner, setRoundWinner] = useState<null | string>(null);
  const [players, setPlayers] = useState<[Player, Player]>([
    { name: 'Player 1', score: 0, ready: false, lockedIn: false, selectedNote: '', lastCents: 0 },
    { name: 'Player 2', score: 0, ready: false, lockedIn: false, selectedNote: '', lastCents: 0 },
  ]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    }
  }, []);

  const startGame = useCallback(() => {
    setPlayers([
      { name: 'Player 1', score: 0, ready: false, lockedIn: false, selectedNote: '', lastCents: 0 },
      { name: 'Player 2', score: 0, ready: false, lockedIn: false, selectedNote: '', lastCents: 0 },
    ]);
    setCurrentRound(1);
    setTargetNote(pickRandom());
    setPhase('ready');
  }, []);

  const startRound = useCallback(() => {
    const note = pickRandom();
    setTargetNote(note);
    setPlayers(prev => prev.map(p => ({ ...p, ready: false, lockedIn: false, selectedNote: '', lastCents: 0 })));
    setRoundWinner(null);
    setPhase('playing');
    playTone(NOTE_FREQS[note] || 440, 0.8);
  }, []);

  // Ready phase
  useEffect(() => {
    if (phase !== 'ready') return;
    let c = 3;
    setCountdown(c);
    playTone(NOTE_FREQS[targetNote] || 440, 0.3);
    const interval = setInterval(() => {
      c--;
      if (c > 0) {
        setCountdown(c);
        playTone(NOTE_FREQS[targetNote] || 440, 0.3);
      } else {
        clearInterval(interval);
        startRound();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, targetNote, startRound]);

  const selectNote = (playerIdx: number, note: string) => {
    if (phase !== 'playing') return;
    setPlayers(prev => {
      const next = [...prev] as [Player, Player];
      next[playerIdx] = { ...next[playerIdx], selectedNote: note };
      return next;
    });
    playTone(NOTE_FREQS[note] || 261.63, 0.2);
  };

  const lockIn = (playerIdx: number) => {
    if (phase !== 'playing') return;
    const p = players[playerIdx];
    if (!p.selectedNote || p.lockedIn) return;

    const cents = p.selectedNote === targetNote ? 0 : (Math.random() * 8 - 4);

    // Use functional update so we always read the latest player state
    setPlayers(prev => {
      const next = [...prev] as [Player, Player];
      next[playerIdx] = { ...next[playerIdx], lockedIn: true, lastCents: cents };

      const other = next[1 - playerIdx];
      if (other.lockedIn || !other.selectedNote) {
        const myCorrect = next[playerIdx].selectedNote === targetNote;
        const otherCorrect = other.lockedIn && other.selectedNote === targetNote;

        let winner: string | null = null;
        if (myCorrect && !otherCorrect) {
          winner = next[playerIdx].name;
        } else if (otherCorrect && !myCorrect) {
          winner = other.name;
        } else if (myCorrect && otherCorrect) {
          // Use local `cents` (not stale p.lastCents) for the current player's tiebreaker
          const myCents = playerIdx === 0 ? cents : other.lastCents;
          const otherCents = playerIdx === 0 ? other.lastCents : cents;
          winner = Math.abs(myCents) <= Math.abs(otherCents) ? next[playerIdx].name : other.name;
        }

        if (winner === next[0].name) next[0] = { ...next[0], score: next[0].score + 1 };
        if (winner === next[1].name) next[1] = { ...next[1], score: next[1].score + 1 };

        // Schedule phase updates outside the setter
        setTimeout(() => {
          setRoundWinner(winner);
          setPhase('roundResult');
        }, 0);
      }

      return next;
    });
  };

  const nextRoundOrEnd = () => {
    if (currentRound >= totalRounds) {
      setPhase('done');
    } else {
      setCurrentRound(r => r + 1);
      setTargetNote(pickRandom());
      setPhase('ready');
    }
  };

  // Split keyboard for each player
  const p1Notes = NOTE_NAMES.slice(0, 6); // C-F#
  const p2Notes = NOTE_NAMES.slice(6); // G-B

  return (
    <div className="min-h-screen px-4 pt-10">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-white transition-colors">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: ACCENT }}>⚔️ Tuning Battle</h1>
          <div className="text-sm text-zinc-500">Round {currentRound}/{totalRounds}</div>
        </div>

        {/* Setup */}
        {phase === 'setup' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-12">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
              <span className="text-4xl">⚔️</span>
            </motion.div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: ACCENT }}>Tuning Battle</h1>
            <p className="mt-2 text-zinc-500">Two players, one target note. First to lock in wins!</p>

            {/* How to play */}
            <div className="mt-6 rounded-2xl p-4 text-left" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>How to Play</p>
              <ol className="space-y-1.5 text-sm text-zinc-400">
                <li>1. A target note plays on countdown — listen carefully</li>
                <li>2. Each player selects the correct note from their half</li>
                <li>3. Tap 🔒 Lock In once you&apos;re confident</li>
                <li>4. Closest correct answer wins the round</li>
              </ol>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-zinc-400 mb-3">Best of</p>
              <div className="flex gap-3 justify-center">
                {[5, 10].map(n => (
                  <button key={n} onClick={() => setTotalRounds(n)}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${totalRounds === n ? 'text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                    style={totalRounds === n ? { background: ACCENT } : {}}>{n}</button>
                ))}
              </div>
            </div>
            <button onClick={startGame} className="mt-8 rounded-full px-6 py-2.5 font-semibold text-white" style={{ background: ACCENT }}>
              Start Battle
            </button>
          </motion.div>
        )}

        {/* Ready / Countdown */}
        {phase === 'ready' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-16">
            <div className="mb-4">
              <span className="text-sm text-zinc-500">Target note:</span>
              <span className="ml-2 text-2xl font-bold text-white">{targetNote}</span>
            </div>
            <motion.div key={countdown} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="text-7xl font-bold text-white">
              {countdown > 0 ? countdown : 'GO!'}
            </motion.div>
          </motion.div>
        )}

        {/* Playing */}
        {phase === 'playing' && (
          <div className="mt-6">
            <div className="text-center mb-6">
              <span className="text-sm text-zinc-500">Target: </span>
              <span className="text-3xl font-bold" style={{ color: ACCENT }}>{targetNote}</span>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => playTone(NOTE_FREQS[targetNote] || 440)}
                className="ml-3 text-2xl">🔊</motion.button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Player 1 */}
              <div className="glass-card p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-white">P1</span>
                  <span className="text-xs text-zinc-500">Score: {players[0].score}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {p1Notes.map(note => (
                    <motion.button key={note} whileTap={{ scale: 0.9 }} onClick={() => selectNote(0, note)}
                      className={`rounded-lg py-2.5 text-xs font-bold transition-all ${players[0].selectedNote === note ? 'bg-white/20 text-white border border-white/30' : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'}`}>
                      {note}
                    </motion.button>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => lockIn(0)}
                  disabled={!players[0].selectedNote || players[0].lockedIn}
                  className={`mt-3 w-full rounded-full py-2 text-xs font-bold transition-all ${players[0].lockedIn ? 'bg-green-500/20 text-green-400 border border-green-500/30' : players[0].selectedNote ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-white/5 text-zinc-600 cursor-not-allowed'}`}>
                  {players[0].lockedIn ? '✓ Locked' : '🔒 Lock In'}
                </motion.button>
              </div>

              {/* Player 2 */}
              <div className="glass-card p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-white">P2</span>
                  <span className="text-xs text-zinc-500">Score: {players[1].score}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {p2Notes.map(note => (
                    <motion.button key={note} whileTap={{ scale: 0.9 }} onClick={() => selectNote(1, note)}
                      className={`rounded-lg py-2.5 text-xs font-bold transition-all ${players[1].selectedNote === note ? 'bg-white/20 text-white border border-white/30' : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'}`}>
                      {note}
                    </motion.button>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => lockIn(1)}
                  disabled={!players[1].selectedNote || players[1].lockedIn}
                  className={`mt-3 w-full rounded-full py-2 text-xs font-bold transition-all ${players[1].lockedIn ? 'bg-green-500/20 text-green-400 border border-green-500/30' : players[1].selectedNote ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-white/5 text-zinc-600 cursor-not-allowed'}`}>
                  {players[1].lockedIn ? '✓ Locked' : '🔒 Lock In'}
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Round result */}
        {phase === 'roundResult' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mt-16">
            {roundWinner ? (
              <>
                <div className="text-5xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-white">{roundWinner} wins the round!</h2>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">🤝</div>
                <h2 className="text-2xl font-bold text-white">Tie!</h2>
              </>
            )}
            <p className="mt-2 text-zinc-500">Target was <span className="text-white font-semibold">{targetNote}</span></p>
            <div className="mt-6 flex gap-3 justify-center">
              <span className="glass-card px-4 py-2 text-sm">P1: {players[0].score}</span>
              <span className="glass-card px-4 py-2 text-sm">P2: {players[1].score}</span>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={nextRoundOrEnd}
              className="mt-6 rounded-full px-6 py-2.5 font-semibold text-white" style={{ background: ACCENT }}>
              {currentRound >= totalRounds ? 'See Results' : 'Next Round'}
            </motion.button>
          </motion.div>
        )}

        {/* Final results */}
        {phase === 'done' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-16">
            <div className="text-6xl mb-4">{players[0].score > players[1].score ? '👑' : players[1].score > players[0].score ? '👑' : '🤝'}</div>
            <h1 className="text-3xl font-semibold text-white">
              {players[0].score > players[1].score ? 'Player 1 Wins!' : players[1].score > players[0].score ? 'Player 2 Wins!' : 'It\'s a Tie!'}
            </h1>
            <div className="mt-6 flex gap-4 justify-center">
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-bold text-white">{players[0].score}</div>
                <div className="text-sm text-zinc-500">Player 1</div>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-bold text-white">{players[1].score}</div>
                <div className="text-sm text-zinc-500">Player 2</div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={startGame} className="flex-1 rounded-full py-3 font-semibold text-white" style={{ background: ACCENT }}>Rematch</button>
              <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-full bg-white/5 py-3 font-medium text-zinc-300">Dashboard</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
