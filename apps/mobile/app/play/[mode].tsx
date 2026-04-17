import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GAME_MODE_META, type GameMode } from '@pitch-therapy/core';
import { GameHeader } from '@/components/GameHeader';
import { colors } from '@/lib/theme';
import { playTone } from '@/lib/audio';

export default function GameScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const meta = GAME_MODE_META[mode as GameMode];

  if (!meta) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unknown game mode</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GameHeader score={0} round={1} totalRounds={10} streak={0} accent={meta.accentHex} />
      <View style={styles.content}>
        <Text style={styles.modeTitle}>{meta.label}</Text>
        <Text style={styles.modeDescription}>{meta.description}</Text>
        <Pressable
          onPress={() => playTone('A4', 440)}
          style={({ pressed }) => [
            styles.playButton,
            { backgroundColor: meta.accentHex },
            pressed && styles.playButtonPressed,
          ]}
        >
          <Text style={styles.playButtonText}>▶ Play Tone</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.muted,
  },
  backLink: {
    marginTop: 16,
  },
  backLinkText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modeTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modeDescription: {
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 32,
  },
  playButton: {
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  playButtonPressed: {
    opacity: 0.8,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  backButton: {
    marginTop: 24,
  },
  backButtonText: {
    color: colors.muted,
    fontSize: 14,
  },
});
