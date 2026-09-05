"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { playTone, stopAllTones, NOTE_NAMES, NOTE_FREQUENCIES } from "@/lib/audio";
import { useStatsContext } from "@/components/StatsProvider";
import TrainingShell from "@/components/training/TrainingShell";
import {
  StudioSetup,
  StudioStartButton,
  StudioResults,
  studioModeMeta,
} from "@/components/training/StudioScreen";
import { useTrackedTimeouts } from "@/lib/useTrackedTimeouts";

const NOTE_FREQS = NOTE_NAMES.map((n) => NOTE_FREQUENCIES[`${n}4`] ?? 261.63) as number[];
const ACCENT = "#FF453A";

type Phase = "idle" | "playing" | "input" | "feedback" | "done";

export default function PitchMemoryPage() {
  const { recordResult } = useStatsContext();
  const recordedRef = useRef(false);

  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [playingIdx, setPlayingIdx] = useState(-1);
  const [feedback, setFeedback] = useState<"correct" | "wrong">("correct");
  const [lives, setLives] = useState(3);

  const { trackTimeout, clearAllTimeouts } = useTrackedTimeouts();

  const generateSequence = useCallback((len: number) => {
    const seq: number[] = [];
    for (let i = 0; i < len; i++) seq.push(Math.floor(Math.random() * 12));
    return seq;
  }, []);

  const playSequence = useCallback(
    (seq: number[], startFrom = 0) => {
      const tempo = Math.max(0.3, 0.6 - level * 0.03);
      const gap = Math.max(0.15, 0.4 - level * 0.02);
      seq.forEach((noteIdx, i) => {
        if (i < startFrom) return;
        trackTimeout(
          () => {
            setPlayingIdx(i);
            playTone(NOTE_FREQS[noteIdx], tempo);
            trackTimeout(() => setPlayingIdx(-1), tempo * 1000 - 50);
          },
          (i - startFrom) * (tempo + gap) * 1000,
        );
      });
      const totalTime = (seq.length - startFrom) * (tempo + gap) * 1000 + 300;
      trackTimeout(() => setPhase("input"), totalTime);
    },
    [level, trackTimeout],
  );

  const startGame = () => {
    clearAllTimeouts();
    const seq = generateSequence(2);
    setSequence(seq);
    setPlayerInput([]);
    setLevel(1);
    setScore(0);
    setStreak(0);
    setLives(3);
    setPhase("playing");
    trackTimeout(() => playSequence(seq), 500);
  };

  const nextLevel = () => {
    const newSeq = [...sequence, Math.floor(Math.random() * 12)];
    setSequence(newSeq);
    setPlayerInput([]);
    setLevel((l) => l + 1);
    setPhase("playing");
    trackTimeout(() => playSequence(newSeq), 400);
  };

  const handlePianoTap = (noteIdx: number) => {
    if (phase !== "input") return;
    playTone(NOTE_FREQS[noteIdx], 0.3);
    const newInput = [...playerInput, noteIdx];
    setPlayerInput(newInput);

    const currentIdx = newInput.length - 1;
    if (newInput[currentIdx] !== sequence[currentIdx]) {
      setFeedback("wrong");
      setPhase("feedback");
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        trackTimeout(() => setPhase("done"), 1500);
      } else {
        trackTimeout(() => {
          setPlayerInput([]);
          setPhase("playing");
          playSequence(sequence);
        }, 1500);
      }
      return;
    }

    if (newInput.length === sequence.length) {
      const points = sequence.length * 50 + level * 20;
      setScore((s) => s + points);
      setStreak((s) => s + 1);
      setFeedback("correct");
      setPhase("feedback");
      trackTimeout(nextLevel, 1200);
    }
  };

  /* ── DONE ── */
  useEffect(() => {
    if (!(phase === "done")) {
      recordedRef.current = false;
      return;
    }
    if (!recordedRef.current) {
      recordedRef.current = true;
      recordResult({
        mode: "pitch-memory",
        score: score,
        accuracy: score > 0 ? Math.min(1, (level - 1) / Math.max(level, 1)) : 0,
        rounds: Math.max(level - 1, 1),
        date: new Date().toISOString(),
        timeMs: Math.max(level - 1, 1) * 5000,
      });
    }
  }, [phase, recordResult, level, score]);

  // Clean up all pending timeouts and audio on unmount (back navigation).
  useEffect(() => {
    return () => {
      clearAllTimeouts();
      stopAllTones();
    };
  }, [clearAllTimeouts]);

  if (phase === "done") {
    return (
      <StudioResults
        eyebrow="SESSION COMPLETE"
        headline="Session logged."
        accent={ACCENT}
        stats={[
          { value: score, label: "SCORE", accentValue: true },
          { value: level, label: "MAX LEVEL" },
          { value: streak, label: "STREAK" },
        ]}
        primaryAction={{ label: "Play Again", onClick: startGame }}
        secondaryAction={{ label: "Dashboard", onClick: () => router.push("/dashboard") }}
      />
    );
  }

  return (
    <TrainingShell
        title="Pitch Memory"
        round={level}
        totalRounds={10}
        scoreLabel={null}
        accent={ACCENT}
        confirmExit={phase === "input"}
        exitHref="/dashboard"
      >
        {/* Screen-reader announcement for round results */}
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {phase === "feedback" ? (feedback === "correct" ? "Correct." : "Not quite. Replaying the sequence.") : ""}
        </span>

        {/* Level progress */}
        <div className="ios-progress-track mb-4">
          <div
            className="ios-progress-fill"
            style={{ width: `${Math.min(level * 10, 100)}%`, background: ACCENT }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            color: "var(--ios-label3)",
            marginBottom: 24,
          }}
        >
          <span>Level {level}</span>
          <span>Sequence: {sequence.length} notes</span>
          <span>🔥 {streak}</span>
        </div>

        {/* IDLE */}
        {phase === "idle" && (
          <StudioSetup
            icon="🧠"
            eyebrow={studioModeMeta("pitch-memory").eyebrow}
            title="Pitch Memory"
            description="Listen to the sequence, then reproduce it on the piano"
            accent={ACCENT}
          >
            <StudioStartButton onClick={startGame} accent={ACCENT}>
              Start Game
            </StudioStartButton>
          </StudioSetup>
        )}

        {/* PLAYING / INPUT / FEEDBACK */}
        {(phase === "playing" || phase === "input" || phase === "feedback") && (
          <div>
            {/* Sequence dots */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              {sequence.map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8 }}
                  animate={{
                    scale: playingIdx === i ? 1.4 : 1,
                    backgroundColor:
                      phase === "feedback" && feedback === "wrong" && i === playerInput.length - 1
                        ? "var(--ios-red)"
                        : i < playerInput.length
                          ? ACCENT
                          : playingIdx === i
                            ? ACCENT
                            : "rgba(255,255,255,0.1)",
                  }}
                  style={{ width: 12, height: 12, borderRadius: "50%" }}
                />
              ))}
            </div>

            <div
              style={{
                textAlign: "center",
                fontSize: 15,
                color: "var(--ios-label3)",
                marginBottom: 20,
              }}
            >
              {phase === "playing"
                ? "🎵 Listen carefully..."
                : phase === "feedback"
                  ? feedback === "correct"
                    ? "✅ Correct!"
                    : "❌ Wrong! Replaying..."
                  : `Tap notes (${playerInput.length}/${sequence.length})`}
            </div>

            {/* Piano */}
            <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 20 }}>
              {NOTE_NAMES.map((name, i) => {
                const isBlack = name.includes("#");
                return (
                  <button
                    key={name}
                    onClick={() => handlePianoTap(i)}
                    disabled={phase !== "input"}
                    style={{
                      width: "calc((100% - 13px) / 12)",
                      maxWidth: 36,
                      height: 100,
                      borderRadius: "0 0 6px 6px",
                      background: isBlack ? "var(--ios-bg4)" : "rgba(255,255,255,0.92)",
                      border: "0.5px solid var(--ios-sep)",
                      opacity: phase === "input" ? 1 : 0.4,
                      cursor: phase === "input" ? "pointer" : "default",
                      position: "relative",
                      transition: "all 0.1s",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        bottom: 6,
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: 8,
                        color: isBlack ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
                      }}
                    >
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>

            {phase === "input" && (
              <div style={{ textAlign: "center", fontSize: 12, color: "var(--ios-label3)" }}>
                Your progress: {playerInput.length} / {sequence.length}
              </div>
            )}
          </div>
        )}
    </TrainingShell>
  );
}
