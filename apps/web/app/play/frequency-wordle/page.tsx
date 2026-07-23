"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FREQUENCY_WORDLE_MAX_GUESSES,
  buildFrequencyWordleResult,
  buildFrequencyWordleShareText,
  formatFrequency,
  getFrequencyWordleFeedback,
  parseFrequencyGuess,
  type FrequencyWordleDirection,
  type FrequencyWordleFeedback,
} from "@pitch-therapy/core";
import WaveVisualizer from "@/components/WaveVisualizer";
import { useStatsContext } from "@/components/StatsProvider";
import { playTone } from "@/lib/audio";

interface GuessRow {
  frequency: number;
  feedback: FrequencyWordleFeedback;
  direction?: FrequencyWordleDirection;
}

const ACCENT = "#0A84FF";
const FEEDBACK_LABELS: Record<FrequencyWordleFeedback, string> = {
  correct: "Correct",
  close: "Within 10%",
  miss: "More than 10% away",
};

function randomTarget(): number {
  return Math.round((Math.random() * 800 + 200) * 10) / 10;
}

export default function FrequencyWordlePage() {
  const router = useRouter();
  const { recordResult } = useStatsContext();
  // Keep the server and first client render deterministic; replace this seed
  // after hydration so React never reconciles two different random targets.
  const [targetFrequency, setTargetFrequency] = useState(440);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [phase, setPhase] = useState<"playing" | "won" | "lost">("playing");
  const [shareStatus, setShareStatus] = useState("");
  const [announcement, setAnnouncement] = useState("Puzzle ready. Play the target tone, then enter a frequency.");
  const [isPlaying, setIsPlaying] = useState(false);
  const recordedRef = useRef(false);
  const sessionStartRef = useRef(Date.now());
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
  }, []);

  useEffect(() => {
    setTargetFrequency(randomTarget());
    sessionStartRef.current = Date.now();
  }, []);

  const startPlaybackIndicator = (durationMs: number) => {
    if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    setIsPlaying(true);
    playbackTimerRef.current = setTimeout(() => setIsPlaying(false), durationMs);
  };

  const playTarget = () => {
    playTone(targetFrequency, 0.7);
    startPlaybackIndicator(700);
  };

  const initGame = () => {
    setTargetFrequency(randomTarget());
    setGuesses([]);
    setInputValue("");
    setInputError("");
    setPhase("playing");
    setShareStatus("");
    setAnnouncement("New puzzle ready. Play the target tone, then enter a frequency.");
    recordedRef.current = false;
    sessionStartRef.current = Date.now();
  };

  useEffect(() => {
    if (phase === "playing" || recordedRef.current) return;
    recordedRef.current = true;
    recordResult({
      mode: "frequency-wordle",
      ...buildFrequencyWordleResult(phase, guesses.length),
      date: new Date().toISOString(),
      timeMs: Date.now() - sessionStartRef.current,
    });
  }, [guesses.length, phase, recordResult]);

  const submitGuess = (event?: FormEvent) => {
    event?.preventDefault();
    if (phase !== "playing" || guesses.length >= FREQUENCY_WORDLE_MAX_GUESSES) return;

    const parsed = parseFrequencyGuess(inputValue);
    if (parsed.value === null) {
      setInputError(parsed.error ?? "Enter a valid frequency.");
      return;
    }

    setInputError("");
    playTone(parsed.value, 0.3);
    startPlaybackIndicator(300);
    const result = getFrequencyWordleFeedback(parsed.value, targetFrequency);
    const nextGuesses = [...guesses, { frequency: parsed.value, ...result }];
    setGuesses(nextGuesses);
    setInputValue("");

    if (result.feedback === "correct") {
      setPhase("won");
      setAnnouncement(`Correct. Puzzle solved in ${nextGuesses.length} ${nextGuesses.length === 1 ? "guess" : "guesses"}.`);
      return;
    }

    if (nextGuesses.length === FREQUENCY_WORDLE_MAX_GUESSES) {
      setPhase("lost");
      setAnnouncement(`No guesses remaining. The target was ${formatFrequency(targetFrequency)}.`);
      return;
    }

    setAnnouncement(
      `${formatFrequency(parsed.value)} is ${FEEDBACK_LABELS[result.feedback].toLowerCase()}. Try ${result.direction}. ${FREQUENCY_WORDLE_MAX_GUESSES - nextGuesses.length} guesses remaining.`,
    );
  };

  const handleShare = async () => {
    const text = buildFrequencyWordleShareText(guesses.map((guess) => guess.feedback));
    const canUseShareSheet = typeof navigator.share === "function";
    try {
      if (canUseShareSheet) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setShareStatus(canUseShareSheet ? "Shared" : "Copied");
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return;
      setShareStatus("Could not share. Try again.");
    }
    window.setTimeout(() => setShareStatus(""), 2500);
  };

  return (
    <div className="pb-tab" style={{ background: "var(--ios-bg)", minHeight: "100dvh" }}>
      <div className="mx-auto max-w-sm px-4 pt-12 md:max-w-lg">
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, minHeight: 44 }}>
          <button
            aria-label="Back to dashboard"
            onClick={() => router.push("/dashboard")}
            style={{ width: 44, height: 44, borderRadius: 18, background: "var(--ios-bg2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <svg aria-hidden="true" width="10" height="17" viewBox="0 0 10 17" fill="none">
              <path d="M8.5 1.5L1.5 8.5L8.5 15.5" stroke="var(--ios-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 600, color: "var(--ios-label)", letterSpacing: "-0.43px", margin: 0 }}>
            Frequency Wordle
          </h1>
          <button aria-label="New puzzle" onClick={initGame} style={{ fontSize: 13, fontWeight: 600, color: "var(--ios-blue)", background: "none", border: "none", cursor: "pointer", minWidth: 44, minHeight: 44 }}>
            New
          </button>
        </header>

        <section aria-labelledby="frequency-instructions" style={{ textAlign: "center", marginBottom: 16 }}>
          <h2 id="frequency-instructions" style={{ color: "var(--ios-label)", fontSize: 22, margin: "0 0 6px" }}>
            Find the mystery frequency
          </h2>
          <p style={{ color: "var(--ios-label2)", fontSize: 15, lineHeight: 1.5, margin: "0 0 12px" }}>
            Listen, estimate in hertz, and follow the higher or lower hint. You have six attempts.
          </p>
          <button className="ios-btn-secondary" onClick={playTarget} style={{ color: ACCENT, minHeight: 48 }}>
            ▶ Play target tone
          </button>
        </section>

        <div aria-hidden="true" style={{ marginBottom: 12 }}>
          <WaveVisualizer active={isPlaying} color={ACCENT} height={35} />
        </div>

        <div role="list" aria-label="Frequency Wordle guesses" style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {Array.from({ length: FREQUENCY_WORDLE_MAX_GUESSES }).map((_, index) => {
            const guess = guesses[index];
            const isCurrent = phase === "playing" && index === guesses.length;
            const statusColor = guess?.feedback === "correct" ? "var(--ios-green)" : guess?.feedback === "close" ? "var(--ios-orange)" : guess ? "var(--ios-red)" : "var(--ios-label3)";
            const background = guess?.feedback === "correct" ? "rgba(48,209,88,0.15)" : guess?.feedback === "close" ? "rgba(255,159,10,0.15)" : guess ? "rgba(255,69,58,0.12)" : "var(--ios-bg2)";
            const directionText = guess?.direction === "higher" ? "Try higher" : guess?.direction === "lower" ? "Try lower" : "Correct";
            return (
              <div
                key={index}
                role="listitem"
                aria-label={guess ? `Guess ${index + 1}: ${formatFrequency(guess.frequency)}. ${FEEDBACK_LABELS[guess.feedback]}. ${directionText}.` : `Guess ${index + 1}: ${isCurrent ? "current guess" : "empty"}`}
                style={{ minHeight: 52, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 16, fontWeight: 700, background, border: `${guess || isCurrent ? 2 : 1}px solid ${guess ? statusColor : "var(--ios-sep)"}`, color: statusColor, transition: "transform 0.2s ease, opacity 0.2s ease" }}
              >
                {guess ? <><span>{formatFrequency(guess.frequency)}</span><span style={{ fontSize: 12 }}>{directionText}</span></> : isCurrent && inputValue ? `${inputValue} Hz` : ""}
              </div>
            );
          })}
        </div>

        {phase === "playing" ? (
          <form onSubmit={submitGuess} noValidate>
            <label htmlFor="frequency-guess" style={{ display: "block", color: "var(--ios-label)", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              Your estimate (Hz)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="frequency-guess"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={inputValue}
                onChange={(event) => { setInputValue(event.target.value); if (inputError) setInputError(""); }}
                aria-describedby="frequency-hint frequency-error"
                aria-invalid={Boolean(inputError)}
                placeholder="e.g. 440"
                style={{ flex: 1, minWidth: 0, minHeight: 48, borderRadius: 12, padding: "12px 16px", background: "var(--ios-bg2)", border: `1px solid ${inputError ? "var(--ios-red)" : "var(--ios-sep)"}`, color: "var(--ios-label)", fontSize: 16 }}
              />
              <button type="submit" style={{ minWidth: 88, minHeight: 48, borderRadius: 12, padding: "0 20px", background: ACCENT, color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>
                Submit
              </button>
            </div>
            <p id="frequency-hint" style={{ color: "var(--ios-label2)", fontSize: 12, margin: "7px 0 0" }}>Accepted range: 20–20,000 Hz.</p>
            <p id="frequency-error" role={inputError ? "alert" : undefined} style={{ color: "var(--ios-red)", fontSize: 13, minHeight: 20, margin: "4px 0 0" }}>{inputError}</p>
          </form>
        ) : (
          <section className="ios-card" style={{ textAlign: "center", padding: 20 }}>
            <div aria-hidden="true" style={{ fontSize: 40, marginBottom: 8 }}>{phase === "won" ? "🎉" : "🎧"}</div>
            <h2 style={{ fontSize: 22, color: "var(--ios-label)", margin: "0 0 6px" }}>{phase === "won" ? `Solved in ${guesses.length}!` : "Keep calibrating"}</h2>
            <p style={{ color: "var(--ios-label2)", margin: "0 0 16px" }}>The target was {formatFrequency(targetFrequency)}.</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button onClick={handleShare} className="ios-btn-secondary" style={{ flex: 1 }}>{shareStatus === "Shared" ? "Shared" : shareStatus === "Copied" ? "Copied" : "Share result"}</button>
              <button onClick={initGame} className="ios-btn-primary" style={{ flex: 1, background: ACCENT }}>Play again</button>
            </div>
            <button className="ios-btn-secondary" onClick={() => router.push("/dashboard")}>Dashboard</button>
            <p aria-live="polite" style={{ minHeight: 20, margin: "8px 0 0", color: "var(--ios-red)", fontSize: 13 }}>{shareStatus.startsWith("Could not") ? shareStatus : ""}</p>
          </section>
        )}

        <div className="ios-card" style={{ padding: 16, textAlign: "center", marginTop: 16 }}>
          <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ios-label2)", margin: 0 }}>✓ Within 2% · ≈ Within 10% · ↑↓ Direction to the target</p>
        </div>
        <div role="status" aria-live="polite" className="sr-only">{announcement}</div>
      </div>
    </div>
  );
}
