"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { playTone, stopAllTones, NOTE_NAMES, NOTE_FREQUENCIES } from "@/lib/audio";
import FeedbackOverlay from "@/components/FeedbackOverlay";
import { useStatsContext } from "@/components/StatsProvider";
import TrainingShell from "@/components/training/TrainingShell";
import {
  StudioSetup,
  StudioHowTo,
  StudioDifficulty,
  StudioStartButton,
  StudioResults,
  studioModeMeta,
} from "@/components/training/StudioScreen";
import { useTrackedTimeouts } from "@/lib/useTrackedTimeouts";

const ACCENT = "#30D158";

type Difficulty = "easy" | "medium" | "hard";

const DIFF_CONFIG: Record<Difficulty, { label: string; centsRange: number; rounds: number }> = {
  easy: { label: "Easy", centsRange: 50, rounds: 6 },
  medium: { label: "Medium", centsRange: 30, rounds: 8 },
  hard: { label: "Hard", centsRange: 15, rounds: 10 },
};

/**
 * Tick marks drawn inside the cents meter, expressed in cents relative to the
 * per-difficulty range. Values are filtered to those that fit inside the
 * current range, so the meter always shows evenly-distributed tick lines
 * scaled to the active difficulty (±50/±30/±15).
 */
const METER_TICK_VALUES = [50, 40, 30, 25, 20, 15, 10, 5];

export default function CentsDeviationPage() {
  const { recordResult } = useStatsContext();
  const recordedRef = useRef(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get("practice") === "true";
  const [phase, setPhase] = useState<"setup" | "playing" | "reveal" | "done">("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [baseNote, setBaseNote] = useState("A4");
  const [baseFreq, setBaseFreq] = useState(440);
  const [actualCents, setActualCents] = useState(0);
  const [needlePos, setNeedlePos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [results, setResults] = useState<
    { round: number; note: string; actualCents: number; guessCents: number; points: number }[]
  >([]);
  const meterRef = useRef<HTMLDivElement>(null);
  const roundRef = useRef(0);
  const { trackTimeout, clearAllTimeouts } = useTrackedTimeouts();

  const config = DIFF_CONFIG[difficulty];
  const totalRounds = config.rounds;

  const playRefAndDeviation = useCallback((freq: number, cents: number) => {
    playTone(freq, 0.8);
    trackTimeout(() => {
      const deviatedFreq = freq * Math.pow(2, cents / 1200);
      playTone(deviatedFreq, 1.2);
    }, 1000);
  }, [trackTimeout]);

  const pickRound = () => {
    const noteIdx = Math.floor(Math.random() * 12);
    const note = NOTE_NAMES[noteIdx];
    const freq = NOTE_FREQUENCIES[`${note}4`] || 261.63;
    const cents = Math.round((Math.random() * 2 - 1) * config.centsRange);
    const clampedCents = Math.max(-config.centsRange, Math.min(config.centsRange, cents));

    setBaseNote(`${note}4`);
    setBaseFreq(freq);
    setActualCents(clampedCents);
    setNeedlePos(0);
    setSubmitted(false);

    playRefAndDeviation(freq, clampedCents);
    return { note, freq, cents: clampedCents };
  };

  const startGame = () => {
    setRound(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setResults([]);
    roundRef.current = 0;
    nextRound();
  };

  const nextRound = () => {
    pickRound();
    setPhase("playing");
    roundRef.current += 1;
    setRound(roundRef.current);
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const error = Math.abs(needlePos - actualCents);
    const points = Math.max(0, Math.round((1 - error / config.centsRange) * 100));
    const correct = error <= 5;

    setScore((s) => s + points);
    if (correct) {
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => Math.max(b, ns));
        return ns;
      });
      setLastCorrect(true);
      setShowFeedbackOverlay(true);
    } else {
      setStreak(0);
      setLastCorrect(false);
    }
    setResults((r) => [
      ...r,
      { round: roundRef.current, note: baseNote, actualCents, guessCents: needlePos, points },
    ]);
    setPhase("reveal");
  };

  const handleDrag = useCallback(
    (clientX: number) => {
      if (!meterRef.current || submitted) return;
      const rect = meterRef.current.getBoundingClientRect();
      const pct = (clientX - rect.left) / rect.width;
      const cents = Math.round((pct - 0.5) * 2 * config.centsRange);
      setNeedlePos(Math.max(-config.centsRange, Math.min(config.centsRange, cents)));
    },
    [submitted, config.centsRange],
  );

  useEffect(() => {
    if (!(phase === "done")) {
      recordedRef.current = false;
      return;
    }
    if (!recordedRef.current) {
      recordedRef.current = true;
      recordResult({
        mode: "cents-deviation",
        score: score,
        accuracy:
          results.length > 0
            ? results.filter((r) => Math.abs(r.actualCents - r.guessCents) <= 25).length /
              results.length
            : 0,
        rounds: totalRounds,
        date: new Date().toISOString(),
        timeMs: totalRounds * 5000,
      });
    }
  }, [phase, recordResult, results, score, totalRounds]);

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
        headline="Fine-tuned."
        accent={ACCENT}
        stats={[
          { value: score, label: "SCORE", accentValue: true },
          { value: `${results.filter((r) => Math.abs(r.actualCents - r.guessCents) <= 25).length}/${totalRounds}`, label: "WITHIN 25¢" },
          { value: bestStreak, label: "BEST STREAK" },
        ]}
        primaryAction={{ label: "Play Again", onClick: startGame }}
        secondaryAction={{ label: "Dashboard", onClick: () => router.push("/dashboard") }}
      />
    );
  }

  if (phase === "setup") {
    return (
      <TrainingShell
        title="Cents Deviation"
        round={0}
        totalRounds={totalRounds}
        scoreLabel={null}
        accent={ACCENT}
        confirmExit={false}
        exitHref="/dashboard"
      >
        <StudioSetup
          icon="📐"
          eyebrow={studioModeMeta("cents-deviation").eyebrow}
          title="Cents Deviation"
          description="Detect microtonal sharp/flat deviations"
          accent={ACCENT}
        >
          <StudioHowTo
            steps={[
              "1. Hear a reference note, then a slightly detuned version",
              "2. Drag the needle to match the deviation in cents",
              "3. Within ±5¢ = correct; wider = partial credit",
              '4. Tap "Play Both" to replay anytime',
            ]}
          />
          <StudioDifficulty
            options={Object.keys(DIFF_CONFIG)}
            value={difficulty}
            onChange={(d) => setDifficulty(d as Difficulty)}
            accent={ACCENT}
            renderOption={(d) => DIFF_CONFIG[d as Difficulty].label}
            hint={`±${config.centsRange} cents · ${config.rounds} rounds`}
          />
          <StudioStartButton onClick={startGame} accent={ACCENT}>
            {isPractice ? "🎓 Start Practicing" : "Start Game"}
          </StudioStartButton>
        </StudioSetup>
      </TrainingShell>
    );
  }

  const needlePct = 50 + (needlePos / config.centsRange) * 45;
  const actualPct = 50 + (actualCents / config.centsRange) * 45;

  return (
    <TrainingShell
        title="Cents Deviation"
        round={round}
        totalRounds={totalRounds}
        scoreLabel={null}
        accent={ACCENT}
        confirmExit={phase === "playing"}
        exitHref="/dashboard"
      >
        <FeedbackOverlay
          correct={lastCorrect}
          show={showFeedbackOverlay}
          streak={streak}
          onDone={() => setShowFeedbackOverlay(false)}
        />
        <div className="ios-progress-track mb-6">
          <motion.div
            className="ios-progress-fill"
            style={{ background: ACCENT }}
            animate={{ width: `${(round / totalRounds) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Info */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "var(--ios-label3)" }}>
            Reference note:{" "}
            <span style={{ fontWeight: 700, color: "var(--ios-label)" }}>{baseNote}</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--ios-label4)", marginTop: 2 }}>
            Listen to both notes, then set the needle
          </div>
        </div>

        {/* Play buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24 }}>
          <motion.button
            onClick={() => playTone(baseFreq, 0.8)}
            whileTap={{ scale: 0.92 }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "var(--ios-bg2)",
              border: "1px solid var(--ios-sep)",
              fontSize: 24,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🔊
          </motion.button>
          <motion.button
            onClick={() => playRefAndDeviation(baseFreq, actualCents)}
            whileTap={{ scale: 0.92 }}
            style={{
              height: 56,
              borderRadius: 16,
              padding: "0 20px",
              background: `rgba(48,209,88,0.12)`,
              border: `1px solid ${ACCENT}`,
              fontSize: 14,
              fontWeight: 600,
              color: ACCENT,
              cursor: "pointer",
            }}
          >
            🔊+🔊 Play Both
          </motion.button>
          <motion.button
            onClick={() => {
              const guessFreq = baseFreq * Math.pow(2, needlePos / 1200);
              playTone(baseFreq, 0.6);
              trackTimeout(() => playTone(guessFreq, 0.8), 800);
            }}
            whileTap={{ scale: 0.92 }}
            disabled={submitted}
            style={{
              height: 56,
              borderRadius: 16,
              padding: "0 14px",
              background: submitted ? "var(--ios-bg3)" : "rgba(48,209,88,0.06)",
              border: `1px solid ${submitted ? "var(--ios-sep)" : "var(--ios-sep)"}`,
              fontSize: 14,
              fontWeight: 600,
              color: submitted ? "var(--ios-label4)" : "var(--ios-label2)",
              cursor: submitted ? "default" : "pointer",
              opacity: submitted ? 0.5 : 1,
            }}
          >
            🎵 Your guess
          </motion.button>
        </div>

        {/* Cents meter */}
        <div className="ios-card" style={{ padding: 16, marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "var(--ios-label4)",
              marginBottom: 8,
            }}
          >
            <span>♭ Flat −{config.centsRange}¢</span>
            <span>Perfect 0¢</span>
            <span>♯ Sharp +{config.centsRange}¢</span>
          </div>
          <div
            ref={meterRef}
            style={{
              position: "relative",
              height: 72,
              borderRadius: 12,
              background: "var(--ios-bg3)",
              cursor: "pointer",
              overflow: "hidden",
            }}
            role="slider"
            tabIndex={0}
            aria-label={`Cents deviation meter, current guess: ${needlePos} cents out of ${config.centsRange}`}
            aria-valuemin={-config.centsRange}
            aria-valuemax={config.centsRange}
            aria-valuenow={needlePos}
            onKeyDown={(e) => {
              if (phase !== "playing" || submitted) return;
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                setNeedlePos((p) => Math.max(-config.centsRange, p - 2));
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                setNeedlePos((p) => Math.min(config.centsRange, p + 2));
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onPointerDown={(e) => {
              setIsDragging(true);
              handleDrag(e.clientX);
            }}
            onPointerMove={(e) => {
              if (isDragging) handleDrag(e.clientX);
            }}
            onPointerUp={() => setIsDragging(false)}
            onPointerLeave={() => setIsDragging(false)}
          >
            {/* Center line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "50%",
                width: 1,
                background: "var(--ios-sep)",
              }}
            />
            {/* Zone markers — scaled to the active difficulty range */}
            {[...METER_TICK_VALUES, ...METER_TICK_VALUES.map((v) => -v)]
              .filter((c) => Math.abs(c) < config.centsRange)
              .map((c) => (
                <div
                  key={c}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: "var(--ios-sep)",
                    opacity: 0.5,
                    left: `${50 + (c / config.centsRange) * 45}%`,
                  }}
                />
            ))}
            {/* Needle */}
            <motion.div
              style={{
                position: "absolute",
                top: 8,
                bottom: 8,
                width: 3,
                borderRadius: 2,
                zIndex: 10,
                left: `${needlePct}%`,
                marginLeft: -1.5,
                background: ACCENT,
                boxShadow: `0 0 8px ${ACCENT}80`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            {/* Actual (revealed) */}
            {submitted && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                style={{
                  position: "absolute",
                  top: 12,
                  bottom: 12,
                  width: 3,
                  borderRadius: 2,
                  left: `${actualPct}%`,
                  marginLeft: -1.5,
                  background: "var(--ios-red)",
                }}
              />
            )}
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 10,
              fontSize: 20,
              fontWeight: 700,
              color: ACCENT,
            }}
          >
            {needlePos > 0 ? "+" : ""}
            {needlePos}¢
          </div>
        </div>

        {/* Reveal */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="ios-card"
              style={{
                padding: "12px 16px",
                textAlign: "center",
                marginBottom: 16,
                border: `1px solid ${Math.abs(needlePos - actualCents) <= 5 ? "var(--ios-green)" : "var(--ios-orange)"}`,
                background:
                  Math.abs(needlePos - actualCents) <= 5
                    ? "rgba(48,209,88,0.08)"
                    : "rgba(255,159,10,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color:
                    Math.abs(needlePos - actualCents) <= 5
                      ? "var(--ios-green)"
                      : "var(--ios-orange)",
                }}
              >
                {Math.abs(needlePos - actualCents) <= 5
                  ? "✓ Excellent ear!"
                  : Math.abs(needlePos - actualCents) <= 15
                    ? "~ Close"
                    : "✗ Off"}{" "}
                — {Math.abs(needlePos - actualCents)}¢ error
              </div>
              <div style={{ fontSize: 12, color: "var(--ios-label3)", marginTop: 4 }}>
                Actual: {actualCents > 0 ? "+" : ""}
                {actualCents}¢ · Your guess: {needlePos > 0 ? "+" : ""}
                {needlePos}¢
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit / Next */}
        {!submitted ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className="ios-btn-primary"
            style={{ background: ACCENT }}
          >
            Lock In
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (roundRef.current >= totalRounds) {
                setPhase("done");
              } else {
                nextRound();
              }
            }}
            className="ios-btn-primary"
            style={{ background: ACCENT }}
          >
            {roundRef.current >= totalRounds ? "See Results" : "Next Round →"}
          </motion.button>
        )}

        <div
          style={{ textAlign: "center", fontSize: 13, color: "var(--ios-label3)", marginTop: 16 }}
        >
          🔥 {streak} streak · Round {round}/{totalRounds} · {config.label}
          {isPractice && <span style={{ marginLeft: 8, color: ACCENT }}>Practice</span>}
        </div>
    </TrainingShell>
  );
}
