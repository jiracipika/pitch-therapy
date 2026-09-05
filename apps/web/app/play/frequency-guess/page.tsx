"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { playTone, stopAllTones } from "@/lib/audio";
import WaveVisualizer from "@/components/WaveVisualizer";
import FeedbackOverlay from "@/components/FeedbackOverlay";
import { useStatsContext } from "@/components/StatsProvider";
import TrainingShell from "@/components/training/TrainingShell";
import {
  StudioSetup,
  StudioDifficulty,
  StudioStartButton,
  StudioListenPad,
  StudioResults,
  studioModeMeta,
} from "@/components/training/StudioScreen";
import { useTrackedTimeouts } from "@/lib/useTrackedTimeouts";

type Difficulty = "easy" | "medium" | "hard";

const CONFIGS: Record<Difficulty, { min: number; max: number; step: number; rounds: number }> = {
  easy: { min: 100, max: 1000, step: 10, rounds: 5 },
  medium: { min: 100, max: 2000, step: 1, rounds: 8 },
  hard: { min: 50, max: 4000, step: 1, rounds: 12 },
};

const ACCENT = "#FF9F0A";

export default function FrequencyGuessPage() {
  const { recordResult } = useStatsContext();
  const recordedRef = useRef(false);

  const router = useRouter();
  const { trackTimeout, clearAllTimeouts } = useTrackedTimeouts();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get("practice") === "true";
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [phase, setPhase] = useState<"setup" | "playing" | "done">("setup");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [targetFreq, setTargetFreq] = useState(0);
  const [guess, setGuess] = useState(200);
  const [showFeedback, setShowFeedback] = useState(false);
  const [errorPct, setErrorPct] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [results, setResults] = useState<
    { correct: boolean; points: number; target: string; answer: string }[]
  >([]);
  const config = CONFIGS[difficulty];

  const generateFreq = () =>
    Math.round((Math.random() * (config.max - config.min) + config.min) / config.step) *
    config.step;

  const startGame = () => {
    setRound(0);
    setScore(0);
    setResults([]);
    nextRound();
  };

  const nextRound = () => {
    const freq = generateFreq();
    setTargetFreq(freq);
    setGuess(Math.round((config.min + config.max) / 2));
    setShowFeedback(false);
    setPhase("playing");
    setRound((r) => r + 1);
    setIsPlaying(true);
    playTone(freq, 0.8);
    trackTimeout(() => setIsPlaying(false), 800);
  };

  const submitGuess = () => {
    const err = (Math.abs(guess - targetFreq) / targetFreq) * 100;
    setErrorPct(err);
    const correct = err < 5;
    const points = isPractice ? 0 : correct ? Math.max(Math.round(100 - err * 10), 10) : 0;
    setScore((s) => s + points);
    setResults((r) => [
      ...r,
      { correct, points, target: `${targetFreq} Hz`, answer: `${guess} Hz` },
    ]);
    setShowFeedback(true);
    if (!isPractice) setShowFeedbackOverlay(correct);
    trackTimeout(() => {
      if (isPractice) nextRound();
      else if (round >= config.rounds) setPhase("done");
      else nextRound();
    }, 2000);
  };

  useEffect(() => {
    if (!(phase === "done")) {
      recordedRef.current = false;
      return;
    }
    if (!recordedRef.current) {
      recordedRef.current = true;
      recordResult({
        mode: "frequency-guess",
        score: score,
        accuracy: results.length > 0 ? results.filter((r) => r.correct).length / results.length : 0,
        rounds: config.rounds,
        date: new Date().toISOString(),
        timeMs: config.rounds * 5000,
      });
    }
  }, [phase, recordResult, results, score, config.rounds]);

  // Clear pending timers and audio on unmount (back navigation).
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
        headline="Frequency found."
        accent={ACCENT}
        stats={[
          { value: score, label: "SCORE", accentValue: true },
          { value: `${results.filter((r) => r.correct).length}/${results.length}`, label: "WITHIN 5%" },
          { value: Math.round(score / Math.max(results.length, 1)), label: "AVG / ROUND" },
        ]}
        primaryAction={{ label: "Play Again", onClick: startGame }}
        secondaryAction={{ label: "Dashboard", onClick: () => router.push("/dashboard") }}
      />
    );
  }

  if (phase === "setup") {
    return (
      <TrainingShell
        title="🎯 Frequency Guess"
        round={0}
        totalRounds={config.rounds}
        scoreLabel={null}
        accent={ACCENT}
        exitHref="/dashboard"
      >
        <StudioSetup
          icon="📡"
          eyebrow={studioModeMeta("frequency-guess").eyebrow}
          title="Frequency Guess"
          description="Guess the frequency of a tone"
          accent={ACCENT}
        >
          <StudioDifficulty
            options={["easy", "medium", "hard"]}
            value={difficulty}
            onChange={(d) => setDifficulty(d as Difficulty)}
            accent={ACCENT}
            hint={`${config.min}–${config.max} Hz · ${config.rounds} rounds`}
          />
          <StudioStartButton onClick={startGame} accent={ACCENT}>
            Start Game
          </StudioStartButton>
        </StudioSetup>
      </TrainingShell>
    );
  }

  return (
    <TrainingShell
      title="🎯 Frequency Guess"
      round={round}
      totalRounds={config.rounds}
      scoreLabel={isPractice ? "Practice" : `${score} pts`}
      accent={ACCENT}
      confirmExit={phase === "playing"}
      exitHref="/dashboard"
    >
      <div>
        <FeedbackOverlay
          correct={showFeedback && errorPct < 5}
          show={showFeedbackOverlay}
          onDone={() => setShowFeedbackOverlay(false)}
        />

        <div style={{ marginBottom: 16 }}>
          <WaveVisualizer active={isPlaying} color={ACCENT} height={40} />
          <div style={{ marginTop: 16 }}>
            <StudioListenPad
              onClick={() => {
                setIsPlaying(true);
                playTone(targetFreq, 0.8);
                trackTimeout(() => setIsPlaying(false), 800);
              }}
              label="TAP TO REPLAY"
              accent={ACCENT}
              ariaLabel="Replay target tone"
            >
              🔊
            </StudioListenPad>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              textAlign: "center",
              fontSize: 32,
              fontWeight: 700,
              color: ACCENT,
              letterSpacing: "-0.03em",
              marginBottom: 12,
            }}
          >
            {guess} Hz
          </div>
          <input
            type="range"
            min={config.min}
            max={config.max}
            step={config.step}
            value={guess}
            onChange={(e) => setGuess(Number(e.target.value))}
            disabled={showFeedback}
            className="w-full"
            style={{ accentColor: ACCENT }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "var(--ios-label3)",
              marginTop: 4,
            }}
          >
            <span>{config.min} Hz</span>
            <span>{config.max} Hz</span>
          </div>
        </div>

        {showFeedback && (
          <div
            className="ios-card"
            style={{
              padding: 16,
              textAlign: "center",
              marginBottom: 16,
              border: `1px solid ${errorPct < 5 ? "var(--ios-green)" : "var(--ios-red)"}`,
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ios-label)" }}>
              {errorPct < 5 ? "✅ Great!" : "❌"}
            </div>
            <div style={{ fontSize: 13, color: "var(--ios-label3)", marginTop: 4 }}>
              Target: {targetFreq} Hz • Your guess: {guess} Hz • Error: {errorPct.toFixed(1)}%
            </div>
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <button
            onClick={submitGuess}
            disabled={showFeedback}
            className="ios-btn-tonal"
            style={{ background: ACCENT, color: "#000", opacity: showFeedback ? 0.4 : 1 }}
          >
            Submit Guess
          </button>
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--ios-label3)" }}>
            Round {round}/{config.rounds}
          </div>
        </div>
      </div>
    </TrainingShell>
  );
}
