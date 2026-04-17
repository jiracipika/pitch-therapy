import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

interface GameHeaderProps {
  score: number;
  round: number;
  totalRounds: number;
  streak: number;
  accent?: string;
}

export function GameHeader({ score, round, totalRounds, streak, accent = colors.pitchMatch }: GameHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Round</Text>
        <Text style={styles.roundText}>{round}/{totalRounds}</Text>
      </View>
      <Text style={[styles.scoreText, { color: accent }]}>{score}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>🔥</Text>
        <Text style={styles.streakText}>{streak}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: colors.muted,
    fontSize: 14,
  },
  roundText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  scoreText: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  streakText: {
    color: colors.text,
    fontWeight: 'bold',
  },
});
