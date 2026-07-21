import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppleButton, GlassCard } from "@/components/AppleUI";
import { colors, spacing, typography } from "@/lib/theme";

interface GameResultsScreenProps {
  title: string;
  subtitle?: string;
  score: number;
  accent: string;
  onPlayAgain: () => void;
  children?: ReactNode;
  onExit?: () => void;
  exitLabel?: string;
}

/** Shared, safe-area-aware results shell for mobile training modes. */
export function GameResultsScreen({
  title,
  subtitle,
  score,
  accent,
  onPlayAgain,
  children,
  onExit,
  exitLabel = "Back to Dashboard",
}: GameResultsScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        contentInsetAdjustmentBehavior="never"
      >
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <GlassCard accent={accent} padding={spacing.xl} style={styles.scoreCard}>
          <View accessible accessibilityLabel={`${score} points`} style={styles.scoreContent}>
            <Text maxFontSizeMultiplier={1.4} style={[styles.score, { color: accent }]}>
              {score}
            </Text>
            <Text style={styles.scoreLabel}>points</Text>
          </View>
        </GlassCard>

        {children ? <View style={styles.details}>{children}</View> : null}

        <View style={styles.actions}>
          <AppleButton
            title="Play Again"
            color={accent}
            onPress={onPlayAgain}
            accessibilityHint="Starts a new session with the same settings"
          />
          {onExit ? <AppleButton title={exitLabel} variant="text" onPress={onExit} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}

export interface GameResultStat {
  label: string;
  value: string;
}

/** Compact, screen-reader-friendly summary cards for completed sessions. */
export function GameResultStats({ items }: { items: GameResultStat[] }) {
  return (
    <View style={styles.stats}>
      {items.map((item) => (
        <View
          key={item.label}
          accessible
          accessibilityLabel={`${item.label}: ${item.value}`}
          style={styles.statCard}
        >
          <Text maxFontSizeMultiplier={1.4} style={styles.statValue}>
            {item.value}
          </Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

interface GameResultRowProps {
  label: string;
  detail: string;
  outcome: string;
  success: boolean;
}

/** Consistent per-round row with both icon and color success cues. */
export function GameResultRow({ label, detail, outcome, success }: GameResultRowProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}. ${detail}. ${outcome}`}
      style={styles.resultRow}
    >
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultDetail}>{detail}</Text>
      <Text style={[styles.resultOutcome, { color: success ? colors.success : colors.danger }]}>
        {success ? "✓ " : "✗ "}
        {outcome}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: colors.text,
    ...typography.title1,
  },
  subtitle: {
    color: colors.textSecondary,
    ...typography.subhead,
    marginTop: spacing.xs,
  },
  scoreCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  scoreContent: {
    alignItems: "center",
  },
  score: {
    fontSize: 48,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  scoreLabel: {
    color: colors.textSecondary,
    ...typography.footnote,
    marginTop: spacing.xs,
  },
  details: {
    gap: spacing.md,
  },
  stats: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statValue: {
    color: colors.text,
    ...typography.title3,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    color: colors.textSecondary,
    ...typography.caption1,
    marginTop: spacing.xs,
  },
  resultRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  resultLabel: {
    width: 64,
    color: colors.textSecondary,
    ...typography.caption1,
  },
  resultDetail: {
    flex: 1,
    color: colors.text,
    ...typography.footnote,
    fontWeight: "600",
  },
  resultOutcome: {
    ...typography.caption1,
    fontWeight: "600",
    textAlign: "right",
  },
  actions: {
    gap: spacing.sm,
    marginTop: "auto",
    paddingTop: spacing.xxl,
  },
});
