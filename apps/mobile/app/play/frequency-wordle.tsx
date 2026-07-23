import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  FREQUENCY_WORDLE_MAX_GUESSES,
  GAME_MODE_META,
  buildFrequencyWordleResult,
  buildFrequencyWordleShareText,
  formatFrequency,
  getFrequencyWordleFeedback,
  parseFrequencyGuess,
  type FrequencyWordleDirection,
  type FrequencyWordleFeedback,
} from "@pitch-therapy/core";
import { playFrequency } from "@/lib/audio";
import { triggerCorrectHaptic, triggerIncorrectHaptic } from "@/lib/haptics";
import { useSessionResults } from "@/lib/sessionResults";
import { colors } from "@/lib/theme";

const MODE = GAME_MODE_META["frequency-wordle"];
const ACCENT = MODE.accentHex;

interface GuessRow {
  frequency: number;
  feedback: FrequencyWordleFeedback;
  direction?: FrequencyWordleDirection;
}

const FEEDBACK_LABELS: Record<FrequencyWordleFeedback, string> = {
  correct: "Correct",
  close: "Within 10%",
  miss: "More than 10% away",
};

function randomTarget(): number {
  return Math.round((Math.random() * 800 + 200) * 10) / 10;
}

export default function FrequencyWordleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordResult } = useSessionResults();
  const [targetFrequency, setTargetFrequency] = useState(randomTarget);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [phase, setPhase] = useState<"playing" | "won" | "lost">("playing");
  const sessionStartRef = useRef(Date.now());
  const recordedRef = useRef(false);

  const initGame = () => {
    setTargetFrequency(randomTarget());
    setGuesses([]);
    setInputValue("");
    setInputError("");
    setPhase("playing");
    recordedRef.current = false;
    sessionStartRef.current = Date.now();
    AccessibilityInfo.announceForAccessibility(
      "New puzzle ready. Play the target tone, then enter a frequency.",
    );
  };

  useEffect(() => {
    if (phase === "playing" || recordedRef.current) return;
    recordedRef.current = true;
    recordResult({
      mode: "frequency-wordle",
      ...buildFrequencyWordleResult(phase, guesses.length),
      timeMs: Date.now() - sessionStartRef.current,
    });
  }, [guesses.length, phase, recordResult]);

  const submitGuess = () => {
    if (phase !== "playing" || guesses.length >= FREQUENCY_WORDLE_MAX_GUESSES) return;

    const parsed = parseFrequencyGuess(inputValue);
    if (parsed.value === null) {
      const message = parsed.error ?? "Enter a valid frequency.";
      setInputError(message);
      AccessibilityInfo.announceForAccessibility(message);
      return;
    }

    setInputError("");
    void playFrequency(parsed.value, 0.3);
    const result = getFrequencyWordleFeedback(parsed.value, targetFrequency);
    const nextGuesses = [...guesses, { frequency: parsed.value, ...result }];
    setGuesses(nextGuesses);
    setInputValue("");

    if (result.feedback === "correct") {
      void triggerCorrectHaptic();
      setPhase("won");
      AccessibilityInfo.announceForAccessibility(
        `Correct. Puzzle solved in ${nextGuesses.length} ${nextGuesses.length === 1 ? "guess" : "guesses"}.`,
      );
      return;
    }

    void triggerIncorrectHaptic();
    if (nextGuesses.length === FREQUENCY_WORDLE_MAX_GUESSES) {
      setPhase("lost");
      AccessibilityInfo.announceForAccessibility(
        `No guesses remaining. The target was ${formatFrequency(targetFrequency)}.`,
      );
      return;
    }

    AccessibilityInfo.announceForAccessibility(
      `${formatFrequency(parsed.value)} is ${FEEDBACK_LABELS[result.feedback].toLowerCase()}. Try ${result.direction}. ${FREQUENCY_WORDLE_MAX_GUESSES - nextGuesses.length} guesses remaining.`,
    );
  };

  const shareResult = async () => {
    try {
      await Share.share({
        message: buildFrequencyWordleShareText(guesses.map((guess) => guess.feedback)),
      });
    } catch {
      AccessibilityInfo.announceForAccessibility(
        "The result could not be shared. Please try again.",
      );
    }
  };

  const rowStyle = (guess?: GuessRow, isCurrent?: boolean) => {
    if (!guess && !isCurrent) return styles.rowEmpty;
    if (!guess) return styles.rowCurrent;
    if (guess.feedback === "correct") return [styles.rowFilled, styles.rowCorrect];
    if (guess.feedback === "close") return [styles.rowFilled, styles.rowClose];
    return [styles.rowFilled, styles.rowMiss];
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.headerAction}
        >
          <Text style={styles.headerButton}>‹ Back</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          Frequency Wordle
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New puzzle"
          hitSlop={8}
          onPress={initGame}
          style={styles.headerAction}
        >
          <Text style={styles.headerButton}>New</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Find the mystery frequency</Text>
          <Text style={styles.instructionsText}>
            Listen, estimate in hertz, and follow the higher or lower hint. You have six attempts.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Play target tone"
            accessibilityHint="Plays the mystery frequency"
            onPress={() => void playFrequency(targetFrequency, 0.7)}
            style={styles.listenButton}
          >
            <Text style={styles.listenButtonText}>▶ Play target tone</Text>
          </Pressable>
        </View>

        <View accessibilityRole="summary" style={styles.guessList}>
          {Array.from({ length: FREQUENCY_WORDLE_MAX_GUESSES }).map((_, index) => {
            const guess = guesses[index];
            const isCurrent = phase === "playing" && index === guesses.length;
            const directionText = guess?.direction === "higher"
              ? "Try higher"
              : guess?.direction === "lower"
                ? "Try lower"
                : "Correct";
            const feedbackColor = guess
              ? guess.feedback === "correct"
                ? colors.success
                : guess.feedback === "close"
                  ? colors.warning
                  : colors.danger
              : colors.textSecondary;
            const label = guess
              ? `Guess ${index + 1}: ${formatFrequency(guess.frequency)}. ${FEEDBACK_LABELS[guess.feedback]}. ${directionText}.`
              : `Guess ${index + 1}: ${isCurrent ? inputValue ? `${inputValue} hertz entered` : "current guess" : "empty"}`;

            return (
              <View key={index} accessible accessibilityLabel={label} style={rowStyle(guess, isCurrent)}>
                {guess ? (
                  <>
                    <Text style={[styles.guessFrequency, { color: feedbackColor }]}>
                      {formatFrequency(guess.frequency)}
                    </Text>
                    <Text style={[styles.feedbackText, { color: feedbackColor }]}>
                      {FEEDBACK_LABELS[guess.feedback]} · {directionText}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.currentGuess}>{isCurrent && inputValue ? `${inputValue} Hz` : ""}</Text>
                )}
              </View>
            );
          })}
        </View>

        {phase === "playing" ? (
          <View>
            <Text nativeID="frequency-input-label" style={styles.sectionLabel}>
              Your estimate (Hz)
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                accessibilityLabelledBy="frequency-input-label"
                accessibilityHint="Enter a number from 20 to 20,000"
                accessibilityState={{ disabled: false }}
                value={inputValue}
                onChangeText={(value) => {
                  setInputValue(value);
                  if (inputError) setInputError("");
                }}
                keyboardType="decimal-pad"
                returnKeyType="done"
                placeholder="e.g. 440"
                placeholderTextColor={colors.textTertiary}
                onSubmitEditing={submitGuess}
                style={[styles.input, inputError ? styles.inputError : null]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Checks your frequency estimate"
                onPress={submitGuess}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </Pressable>
            </View>
            <Text style={styles.inputHint}>Accepted range: 20–20,000 Hz.</Text>
            <Text accessibilityLiveRegion="polite" style={styles.errorText}>
              {inputError}
            </Text>
          </View>
        ) : (
          <View style={styles.resultCard}>
            <Text accessibilityElementsHidden style={styles.resultEmoji}>
              {phase === "won" ? "🎉" : "🎧"}
            </Text>
            <Text accessibilityLiveRegion="polite" accessibilityRole="header" style={styles.resultTitle}>
              {phase === "won" ? `Solved in ${guesses.length}!` : "Keep calibrating"}
            </Text>
            <Text style={styles.resultSubtitle}>
              The target was {formatFrequency(targetFrequency)}.
              {phase === "won"
                ? ` Score ${buildFrequencyWordleResult("won", guesses.length).score}.`
                : " Listen once more, compare your final estimate, then try again."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void playFrequency(targetFrequency, 0.7)}
              style={styles.replayButton}
            >
              <Text style={styles.listenButtonText}>▶ Replay target</Text>
            </Pressable>
            <View style={styles.resultActions}>
              <Pressable accessibilityRole="button" onPress={shareResult} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Share result</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={initGame} style={styles.playAgainButton}>
                <Text style={styles.submitButtonText}>Play again</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View
          accessible
          accessibilityLabel="Hint legend. Correct within two percent, close within ten percent, or try higher or lower."
          style={styles.legend}
        >
          <Text style={styles.legendText}>✓ Within 2% · ≈ Within 10% · ↑↓ Direction to target</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  headerAction: { minHeight: 48, minWidth: 64, alignItems: "center", justifyContent: "center" },
  headerButton: { color: colors.blue, fontSize: 15, fontWeight: "600" },
  headerTitle: { color: ACCENT, fontSize: 17, fontWeight: "700" },
  content: { width: "100%", maxWidth: 560, alignSelf: "center", padding: 20, paddingBottom: 40 },
  instructions: { alignItems: "center", marginBottom: 20 },
  instructionsTitle: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: 6 },
  instructionsText: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, textAlign: "center" },
  listenButton: {
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  listenButtonText: { color: ACCENT, fontSize: 15, fontWeight: "700" },
  guessList: { gap: 8, marginBottom: 20 },
  rowEmpty: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCurrent: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  rowFilled: { minHeight: 52, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  rowCorrect: { borderColor: colors.success, backgroundColor: "rgba(48,209,88,0.12)" },
  rowClose: { borderColor: colors.warning, backgroundColor: "rgba(255,159,10,0.12)" },
  rowMiss: { borderColor: colors.danger, backgroundColor: "rgba(255,69,58,0.10)" },
  guessFrequency: { fontSize: 17, fontWeight: "700" },
  feedbackText: { fontSize: 11, fontWeight: "600", marginTop: 1 },
  currentGuess: { color: colors.textSecondary, fontSize: 16, fontWeight: "700" },
  sectionLabel: { color: colors.text, fontSize: 15, fontWeight: "700", marginBottom: 8 },
  inputRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 17,
    fontWeight: "500",
  },
  inputError: { borderColor: colors.danger, borderWidth: 2 },
  submitButton: {
    minWidth: 96,
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
  },
  submitButtonText: { color: "#001A24", fontWeight: "800", fontSize: 16 },
  inputHint: { color: colors.textSecondary, fontSize: 12, marginTop: 7 },
  errorText: { minHeight: 22, color: colors.danger, fontSize: 13, marginTop: 4 },
  resultCard: {
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultEmoji: { fontSize: 38, marginBottom: 8 },
  resultTitle: { fontSize: 22, fontWeight: "700", color: colors.text, textAlign: "center" },
  resultSubtitle: { marginTop: 6, color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: "center" },
  replayButton: {
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceElevated,
  },
  resultActions: { width: "100%", flexDirection: "row", gap: 10, marginTop: 12 },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  secondaryButtonText: { color: colors.text, fontSize: 14, fontWeight: "700" },
  playAgainButton: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: ACCENT },
  legend: {
    minHeight: 48,
    marginTop: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: "center" },
});
