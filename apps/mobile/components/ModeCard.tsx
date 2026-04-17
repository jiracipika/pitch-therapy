import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { GameModeMeta } from '@pitch-therapy/core';
import { colors } from '@/lib/theme';

interface ModeCardProps {
  mode: GameModeMeta;
}

export function ModeCard({ mode }: ModeCardProps) {
  const router = useRouter();
  const route = `/play/${mode.id}` as const;

  return (
    <Pressable
      onPress={() => router.push(route)}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[styles.dot, { backgroundColor: mode.accentHex }]}
        />
        <Text style={styles.label}>{mode.label}</Text>
      </View>
      <Text style={styles.description}>{mode.description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  description: {
    color: colors.muted,
    fontSize: 14,
  },
});
