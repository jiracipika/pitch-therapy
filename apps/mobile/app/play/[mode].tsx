import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GAME_MODE_META, type GameMode } from '@pitch-therapy/core';
import { GameHeader } from '@/components/GameHeader';
import { GlassCard } from '@/components/AppleUI';
import { colors, radii, typography } from '@/lib/theme';
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
      <LinearGradient colors={['#10131A', '#08090D']} style={StyleSheet.absoluteFill} />
      <GameHeader score={0} round={1} totalRounds={10} streak={0} accent={meta.accentHex} />
      <View style={styles.content}>
        <GlassCard accent={meta.accentHex} style={{ width: '100%' }}>
          <View style={{ alignItems: 'center', gap: 12 }}>
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
              <Text style={styles.playButtonText}>Play Tone</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back to Dashboard</Text>
            </Pressable>
          </View>
        </GlassCard>
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
    color: colors.blue,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modeTitle: {
    color: colors.text,
    ...typography.title1,
    textAlign: 'center',
  },
  modeDescription: {
    color: colors.textSecondary,
    textAlign: 'center',
    ...typography.callout,
    lineHeight: 22,
  },
  playButton: {
    borderRadius: radii.md,
    paddingHorizontal: 32,
    paddingVertical: 16,
    minWidth: 180,
    alignItems: 'center',
  },
  playButtonPressed: {
    opacity: 0.8,
  },
  playButtonText: {
    color: colors.background,
    ...typography.headline,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: colors.textSecondary,
    ...typography.caption1,
  },
});
