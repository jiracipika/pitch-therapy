import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, shadows, typography } from '@/lib/theme';

interface GameHeaderProps {
  score: number;
  round: number;
  totalRounds: number;
  streak: number;
  accent?: string;
}

export function GameHeader({ score, round, totalRounds, streak, accent = colors.pitchMatch }: GameHeaderProps) {
  return (
    <LinearGradient
      colors={[accent + '22', colors.card, colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { borderColor: accent + '40' }]}
    >
      <View style={styles.metric}>
        <Text style={styles.label}>Round</Text>
        <Text style={styles.metricValue}>{round}/{totalRounds}</Text>
      </View>
      <View style={styles.scorePill}>
        <Text style={[styles.scoreText, { color: accent }]}>{score}</Text>
        <Text style={styles.scoreLabel}>Score</Text>
      </View>
      <View style={styles.metric}>
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
    marginTop: 14,
    padding: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  metric: {
    flex: 1,
    gap: 3,
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
