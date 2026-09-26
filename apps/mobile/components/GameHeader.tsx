import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadows, typography } from '@/lib/theme';

interface GameHeaderProps {
  score: number;
  round: number;
  totalRounds: number;
  streak: number;
  accent?: string;
  /** Renders a back chevron — for screens whose playing phase has no other exit. */
  onBack?: () => void;
}

export function GameHeader({ score, round, totalRounds, streak, accent = colors.pitchMatch, onBack }: GameHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[accent + '22', colors.card, colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { borderColor: accent + '40', marginTop: Math.max(14, insets.top + 8) }]}
    >
      <View style={styles.metric}>
        <View style={styles.metricInner}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Back to dashboard"
              hitSlop={10}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>‹</Text>
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Round</Text>
            <Text style={styles.metricValue}>{totalRounds > 0 ? `${round}/${totalRounds}` : round}</Text>
          </View>
        </View>
      </View>
      <View style={styles.scorePill} accessibilityLabel={`Score ${score}`}>
        <Text style={[styles.scoreText, { color: accent }]}>{score}</Text>
        <Text style={styles.scoreLabel}>Score</Text>
      </View>
      <View style={[styles.metric, styles.metricRight]}>
        <Text style={styles.label}>Streak</Text>
        <Text style={styles.metricValue}>{streak}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 14,
    padding: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  metric: {
    flex: 1,
    gap: 3,
  },
  metricInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 22,
    fontWeight: '600',
    marginTop: -2,
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  label: {
    color: colors.textTertiary,
    ...typography.caption1,
  },
  metricValue: {
    color: colors.text,
    ...typography.headline,
    fontVariant: ['tabular-nums'],
  },
  scorePill: {
    minWidth: 96,
    alignItems: 'center',
    gap: 1,
  },
  scoreText: {
    ...typography.title2,
    fontVariant: ['tabular-nums'],
  },
  scoreLabel: {
    color: colors.textTertiary,
    ...typography.caption2,
  },
});
