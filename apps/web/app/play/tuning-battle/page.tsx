'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const ACCENT = '#FF453A';
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
          const myCents = playerIdx === 0 ? cents : other.lastCents;
          const otherCents = playerIdx === 0 ? other.lastCents : cents;
          winner = Math.abs(myCents) <= Math.abs(otherCents) ? next[playerIdx].name : other.name;
        }

        if (winner === next[0].name) next[0] = { ...next[0], score: next[0].score + 1 };
        if (winner === next[1].name) next[1] = { ...next[1], score: next[1].score + 1 };

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

  const p1Notes = NOTE_NAMES.slice(0, 6);
  const p2Notes = NOTE_NAMES.slice(6);

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-sm mx-auto px-4 pt-12">

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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>⚔️ Tuning Battle</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {currentRound}/{totalRounds}
          </div>
        </div>

        {/* Setup */}
        {phase === 'setup' && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>⚔️</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Tuning Battle</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>Two players, one target note. First to lock in wins!</div>

            <div className="ios-card" style={{ padding: 16, textAlign: 'left', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>How to Play</div>
              <ol style={{ fontSize: 14, color: 'var(--ios-label3)', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>1. A target note plays on countdown — listen carefully</li>
                <li>2. Each player selects the correct note from their half</li>
                <li>3. Tap 🔒 Lock In once you&apos;re confident</li>
                <li>4. Closest correct answer wins the round</li>
              </ol>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginBottom: 10 }}>Best of</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {[5, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setTotalRounds(n)}
                    style={{
                      height: 34, borderRadius: 17, padding: '0 20px',
                      fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: totalRounds === n ? ACCENT : 'var(--ios-bg2)',
                      color: totalRounds === n ? '#fff' : 'var(--ios-label3)',
                      transition: 'background 0.15s',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>
              Start Battle
            </button>
          </div>
        )}

        {/* Ready / Countdown */}
        {phase === 'ready' && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: 'var(--ios-label3)' }}>Target note:</span>
              <span style={{ marginLeft: 8, fontSize: 24, fontWeight: 700, color: 'var(--ios-label)' }}>{targetNote}</span>
            </div>
            <motion.div
              key={countdown}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{ fontSize: 72, fontWeight: 800, color: 'var(--ios-label)' }}
            >
              {countdown > 0 ? countdown : 'GO!'}
            </motion.div>
          </div>
        )}

        {/* Playing */}
        {phase === 'playing' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 14, color: 'var(--ios-label3)' }}>Target: </span>
              <span style={{ fontSize: 28, fontWeight: 700, color: ACCENT }}>{targetNote}</span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => playTone(NOTE_FREQS[targetNote] || 440)}
                style={{ marginLeft: 10, fontSize: 24, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                🔊
              </motion.button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Player 1 */}
              <div className="ios-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>P1</span>
                  <span style={{ fontSize: 12, color: 'var(--ios-label3)' }}>{players[0].score} pts</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 10 }}>
                  {p1Notes.map(note => (
                    <motion.button
                      key={note}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => selectNote(0, note)}
                      style={{
                        borderRadius: 8, padding: '8px 4px', fontSize: 12, fontWeight: 700,
                        background: players[0].selectedNote === note ? 'rgba(255,255,255,0.2)' : 'var(--ios-bg3)',
                        border: players[0].selectedNote === note ? '1px solid rgba(255,255,255,0.4)' : '1px solid var(--ios-sep)',
                        color: 'var(--ios-label)', cursor: 'pointer',
                      }}
                    >
                      {note}
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => lockIn(0)}
                  disabled={!players[0].selectedNote || players[0].lockedIn}
                  style={{
                    width: '100%', borderRadius: 10, padding: '8px 0', fontSize: 12, fontWeight: 700,
                    background: players[0].lockedIn ? 'rgba(48,209,88,0.2)' : players[0].selectedNote ? 'rgba(255,69,58,0.2)' : 'var(--ios-bg3)',
                    border: players[0].lockedIn ? '1px solid var(--ios-green)' : players[0].selectedNote ? '1px solid var(--ios-red)' : '1px solid var(--ios-sep)',
                    color: players[0].lockedIn ? 'var(--ios-green)' : players[0].selectedNote ? 'var(--ios-red)' : 'var(--ios-label3)',
                    cursor: !players[0].selectedNote || players[0].lockedIn ? 'default' : 'pointer',
                  }}
                >
                  {players[0].lockedIn ? '✓ Locked' : '🔒 Lock In'}
                </motion.button>
              </div>

              {/* Player 2 */}
              <div className="ios-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-label)' }}>P2</span>
                  <span style={{ fontSize: 12, color: 'var(--ios-label3)' }}>{players[1].score} pts</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 10 }}>
                  {p2Notes.map(note => (
                    <motion.button
                      key={note}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => selectNote(1, note)}
                      style={{
                        borderRadius: 8, padding: '8px 4px', fontSize: 12, fontWeight: 700,
                        background: players[1].selectedNote === note ? 'rgba(255,255,255,0.2)' : 'var(--ios-bg3)',
                        border: players[1].selectedNote === note ? '1px solid rgba(255,255,255,0.4)' : '1px solid var(--ios-sep)',
                        color: 'var(--ios-label)', cursor: 'pointer',
                      }}
                    >
                      {note}
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => lockIn(1)}
                  disabled={!players[1].selectedNote || players[1].lockedIn}
                  style={{
                    width: '100%', borderRadius: 10, padding: '8px 0', fontSize: 12, fontWeight: 700,
                    background: players[1].lockedIn ? 'rgba(48,209,88,0.2)' : players[1].selectedNote ? 'rgba(255,69,58,0.2)' : 'var(--ios-bg3)',
                    border: players[1].lockedIn ? '1px solid var(--ios-green)' : players[1].selectedNote ? '1px solid var(--ios-red)' : '1px solid var(--ios-sep)',
                    color: players[1].lockedIn ? 'var(--ios-green)' : players[1].selectedNote ? 'var(--ios-red)' : 'var(--ios-label3)',
                    cursor: !players[1].selectedNote || players[1].lockedIn ? 'default' : 'pointer',
                  }}
                >
                  {players[1].lockedIn ? '✓ Locked' : '🔒 Lock In'}
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Round result */}
        {phase === 'roundResult' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', paddingTop: 60 }}
          >
            {roundWinner ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)' }}>{roundWinner} wins!</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)' }}>Tie!</div>
              </>
            )}
            <div style={{ fontSize: 14, color: 'var(--ios-label3)', marginTop: 8 }}>
              Target was <span style={{ color: 'var(--ios-label)', fontWeight: 600 }}>{targetNote}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, marginBottom: 20 }}>
              <div className="ios-card" style={{ padding: '12px 20px' }}>
                <div style={{ fontSize: 14, color: 'var(--ios-label3)' }}>P1: {players[0].score}</div>
              </div>
              <div className="ios-card" style={{ padding: '12px 20px' }}>
                <div style={{ fontSize: 14, color: 'var(--ios-label3)' }}>P2: {players[1].score}</div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={nextRoundOrEnd}
              className="ios-btn-tonal"
              style={{ background: ACCENT, color: '#fff' }}
            >
              {currentRound >= totalRounds ? 'See Results' : 'Next Round'}
            </motion.button>
          </motion.div>
        )}

        {/* Final results */}
        {phase === 'done' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', paddingTop: 40 }}
          >
            <div style={{ fontSize: 60, marginBottom: 12 }}>
              {players[0].score > players[1].score ? '👑' : players[1].score > players[0].score ? '👑' : '🤝'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 24 }}>
              {players[0].score > players[1].score ? 'Player 1 Wins!' : players[1].score > players[0].score ? 'Player 2 Wins!' : "It's a Tie!"}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
              <div className="ios-card" style={{ padding: '20px 32px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--ios-label)' }}>{players[0].score}</div>
                <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginTop: 4 }}>Player 1</div>
              </div>
              <div className="ios-card" style={{ padding: '20px 32px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--ios-label)' }}>{players[1].score}</div>
                <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginTop: 4 }}>Player 2</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>Rematch</button>
              <button className="ios-btn-secondary" onClick={() => router.push('/dashboard')}>Dashboard</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
