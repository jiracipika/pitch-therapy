import { View, Text, Pressable, StyleSheet } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { playFrequency } from "@/lib/audio";
import NoteComparisonStaff from "@/components/NoteComparisonStaff";
import { triggerCorrectHaptic, triggerIncorrectHaptic } from "@/lib/haptics";
import { useSessionResults } from "@/lib/sessionResults";
import { playColors as pc } from "@/lib/theme";
import { GAME_MODE_META } from "@pitch-therapy/core";
const MODE = GAME_MODE_META["name-that-note"];
const ACCENT = MODE.accentHex;
const QUIZ_NOTES = [
  { name: "E4", label: "E", frequency: 329.63 },
  { name: "F4", label: "F", frequency: 349.23 },
  { name: "G4", label: "G", frequency: 392.0 },
  { name: "A4", label: "A", frequency: 440.0 },
  { name: "B4", label: "B", frequency: 493.88 },
  { name: "C5", label: "C", frequency: 523.25 },
  { name: "D5", label: "D", frequency: 587.33 },
  { name: "E5", label: "E", frequency: 659.25 },
  { name: "F5", label: "F", frequency: 698.46 },
];
const ANSWER_LABELS = ["C", "D", "E", "F", "G", "A", "B"] as const;

type Phase = "idle" | "playing" | "timed-out" | "done";

export default function NameThatNoteScreen() {
  const router = useRouter();
  const { recordResult } = useSessionResults();
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(10);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetNote, setTargetNote] = useState(QUIZ_NOTES[0]);
  const [feedback, setFeedback] = useState<"none" | "correct" | "wrong">("none");
  const [guessedLabel, setGuessedLabel] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const roundRef = useRef(0);
  const answerLockedRef = useRef(true);
  const sessionStartRef = useRef<number>(0);
  const recordedRef = useRef(false);

  // Persist session result once when the game completes.
  useEffect(() => {
    if (phase !== "done" || recordedRef.current) return;
    recordedRef.current = true;
    recordResult({
      mode: "name-that-note",
      score,
      accuracy: totalRounds > 0 ? correctCount / totalRounds : 0,
      rounds: totalRounds,
      timeMs: Date.now() - sessionStartRef.current,
    });
  }, [phase, score, correctCount, totalRounds, recordResult]);

  const startRound = () => {
    const note = QUIZ_NOTES[Math.floor(Math.random() * QUIZ_NOTES.length)];
    const nextRound = roundRef.current + 1;
    roundRef.current = nextRound;
    answerLockedRef.current = false;
    setTargetNote(note);
    setRound(nextRound);
    setFeedback("none");
    setGuessedLabel(null);
    setPhase("playing");
    setTimeLeft(10);
    clearInterval(timerRef.current);
    clearTimeout(transitionTimerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          answerLockedRef.current = true;
          setStreak(0);
          setPhase("timed-out");
          transitionTimerRef.current = setTimeout(
            nextRound >= totalRounds ? () => setPhase("done") : startRound,
            1200,
          );
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleStart = () => {
    clearInterval(timerRef.current);
    clearTimeout(transitionTimerRef.current);
    roundRef.current = 0;
    answerLockedRef.current = true;
    setRound(0);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    sessionStartRef.current = Date.now();
    recordedRef.current = false;
    startRound();
  };

  const handleAnswer = (label: string) => {
    if (phase !== "playing" || answerLockedRef.current) return;
    answerLockedRef.current = true;
    clearInterval(timerRef.current);
    setGuessedLabel(label);
    const correct = label === targetNote.label;
    const points = correct ? Math.max(100 - (10 - timeLeft) * 8, 20) : 0;
    setScore((s) => s + points);
    if (correct) {
      void triggerCorrectHaptic();
      setCorrectCount((count) => count + 1);
      setStreak((s) => s + 1);
      setFeedback("correct");
    } else {
      void triggerIncorrectHaptic();
      setStreak(0);
      setFeedback("wrong");
    }
    void playFrequency(targetNote.frequency, 0.5);
    transitionTimerRef.current = setTimeout(
      roundRef.current >= totalRounds ? () => setPhase("done") : startRound,
      roundRef.current >= totalRounds ? 1000 : 1200,
    );
  };

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      clearTimeout(transitionTimerRef.current);
    },
    [],
  );

  const staffY = (noteName: string) => {
    const pos: Record<string, number> = {
      E4: 0,
      F4: 1,
      G4: 2,
      A4: 3,
      B4: 4,
      C5: 5,
      D5: 6,
      E5: 7,
      F5: 8,
    };
    return pos[noteName] ?? 0;
  };

  if (phase === "done") {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <View
            style={[styles.iconCircle, { borderColor: ACCENT, backgroundColor: ACCENT + "15" }]}
          >
            <Text style={{ fontSize: 36 }}>📖</Text>
          </View>
          <Text style={styles.title}>Game Complete</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: ACCENT }]}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {correctCount}/{totalRounds}
              </Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={handleStart}
            style={[styles.btnPrimary, { backgroundColor: ACCENT }]}
          >
            <Text style={styles.btnPrimaryText}>Play Again</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
            onPress={() => router.back()}
            style={styles.linkBtn}
          >
            <Text style={styles.linkBtnText}>← Dashboard</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === "idle") {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <View
            style={[styles.iconCircle, { borderColor: ACCENT, backgroundColor: ACCENT + "12" }]}
          >
            <Text style={{ fontSize: 32 }}>📖</Text>
          </View>
          <Text style={[styles.title, { fontSize: 24 }]}>Name That Note</Text>
          <Text style={styles.subtitle}>Identify notes on the staff</Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleStart}
            style={[styles.btnPrimary, { backgroundColor: ACCENT }]}
          >
            <Text style={styles.btnPrimaryText}>Start</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
            onPress={() => router.back()}
            style={styles.linkBtn}
          >
            <Text style={styles.linkBtnText}>← Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const y = staffY(targetNote.name);

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={{ color: pc.textSecondary }}>←</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: "600", color: ACCENT }}>Name That Note</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>

        {/* Timer */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: pc.textSecondary }}>Time: {timeLeft}s</Text>
          <Text style={{ fontSize: 12, color: pc.textSecondary }}>
            Round {round}/{totalRounds}
          </Text>
        </View>
        <View
          style={{ height: 4, borderRadius: 2, backgroundColor: pc.cardBorder, marginBottom: 24 }}
        >
          <View
            style={{
              height: "100%",
              borderRadius: 2,
              backgroundColor: timeLeft <= 3 ? pc.danger : ACCENT,
              width: `${(timeLeft / 10) * 100}%`,
            }}
          />
        </View>

        {/* Staff */}
        <View style={{ height: 120, position: "relative", marginBottom: 24 }}>
          {/* Staff lines */}
          {[0, 20, 40, 60, 80].map((bottom, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom,
                height: 1,
                backgroundColor: pc.cardBorder,
              }}
            />
          ))}
          {/* Treble clef */}
          <Text
            style={{
              position: "absolute",
              left: 4,
              bottom: 16,
              fontSize: 48,
              color: pc.textTertiary,
            }}
          >
            𝄞
          </Text>
          {/* Note head */}
          <View
            style={{
              position: "absolute",
              width: 20,
              height: 16,
              borderRadius: 8,
              backgroundColor:
                feedback === "correct" ? "#4ADE80" : feedback === "wrong" ? pc.danger : ACCENT,
              left: "50%",
              bottom: y * 10 + 10,
              transform: [{ translateX: -10 }],
            }}
          />
        </View>

        {phase === "timed-out" && (
          <Text style={{ textAlign: "center", color: pc.danger, fontSize: 13, marginBottom: 16 }}>
            Time&apos;s up! It was {targetNote.name}
          </Text>
        )}

        {/* Staff comparison after answer */}
        {feedback !== "none" && guessedLabel && (
          <View style={{ marginBottom: 16 }}>
            <NoteComparisonStaff
              guessedNote={guessedLabel}
              correctNote={targetNote.label}
              isCorrect={feedback === "correct"}
            />
          </View>
        )}

        <Text
          style={{ textAlign: "center", fontSize: 12, color: pc.textTertiary, marginBottom: 16 }}
        >
          Tap the correct note
        </Text>

        {/* Answer buttons */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
          {ANSWER_LABELS.map((label) => (
            <Pressable
              key={label}
              onPress={() => handleAnswer(label)}
              disabled={phase !== "playing"}
              accessibilityRole="button"
              accessibilityLabel={`Answer ${label}`}
              style={{
                width: 44,
                height: 56,
                borderRadius: 8,
                backgroundColor: pc.cardSurface,
                borderWidth: 1,
                borderColor: pc.cardBorder,
                alignItems: "center",
                justifyContent: "center",
                opacity: phase === "playing" ? 1 : 0.4,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: pc.text }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: pc.screen },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "700", color: pc.text, letterSpacing: 0 },
  subtitle: { fontSize: 14, color: pc.textSecondary, marginTop: 8, marginBottom: 40 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 24, marginBottom: 32 },
  statCard: {
    backgroundColor: pc.cardSurface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: pc.cardBorder,
    alignItems: "center",
    flex: 1,
  },
  statValue: { fontSize: 24, fontWeight: "700", color: pc.text },
  statLabel: { fontSize: 11, color: pc.textSecondary, marginTop: 4 },
  btnPrimary: { borderRadius: 14, padding: 16, alignItems: "center", marginTop: 16, width: "100%" },
  btnPrimaryText: { color: pc.text, fontWeight: "700", fontSize: 16 },
  linkBtn: { padding: 16, marginTop: 8 },
  linkBtnText: { color: pc.textSecondary, textAlign: "center", fontSize: 13 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: pc.cardAmbient,
    borderWidth: 1,
    borderColor: pc.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: pc.cardAmbient,
    borderWidth: 1,
    borderColor: pc.cardBorder,
  },
  scoreText: { fontSize: 12, fontWeight: "600", color: pc.text },
});
