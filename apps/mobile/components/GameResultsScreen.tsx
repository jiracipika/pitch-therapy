import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppleButton, GlassCard } from '@/components/AppleUI';
import { colors, spacing, typography } from '@/lib/theme';

interface GameResultsScreenProps {
  title: string;
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
  score,
  accent,
  onPlayAgain,
  children,
  onExit,
  exitLabel = 'Back to Dashboard',
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
    marginBottom: spacing.lg,
  },
  scoreCard: {
    marginBottom: spacing.xl,
  },
  scoreContent: {
    alignItems: 'center',
  },
  score: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scoreLabel: {
    color: colors.textSecondary,
    ...typography.footnote,
    marginTop: spacing.xs,
  },
  details: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: 'auto',
    paddingTop: spacing.xxl,
  },
});
