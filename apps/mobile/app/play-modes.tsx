import { Text, View } from 'react-native';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { AnimatedModeCard } from '@/components/AnimatedModeCard';
import { GlassCard, Pill, SectionHeader } from '@/components/AppleUI';
import { AppPage } from '@/components/AppPage';
import { useResponsiveLayout } from '@/lib/responsive';
import { colors, typography } from '@/lib/theme';

const MODE_CATEGORIES = [
  { id: 'foundational', label: 'Foundational', tone: colors.blue, modes: ['note-id', 'frequency-guess', 'pitch-match'] as const },
  { id: 'wordle', label: 'Wordle Style', tone: colors.green, modes: ['note-wordle', 'frequency-wordle'] as const },
  { id: 'pitch', label: 'Pitch Training', tone: colors.pink, modes: ['pitch-memory', 'interval-archer', 'name-that-note'] as const },
  { id: 'advanced', label: 'Advanced', tone: colors.purple, modes: ['cents-deviation', 'chord-detective', 'waveform-match', 'tuning-battle'] as const },
  { id: 'interactive', label: 'Interactive', tone: colors.teal, modes: ['piano-tap', 'frequency-slider', 'frequency-hunt', 'drone-lock', 'tune-in'] as const },
  { id: 'speed', label: 'Speed & Challenge', tone: colors.orange, modes: ['speed-round'] as const },
] as const;

export default function PlayModesScreen() {
  const { isTablet, isDesktop } = useResponsiveLayout();

  return (
    <AppPage title="Play Modes" subtitle="Choose a track, then jump straight into a focused drill.">
      <GlassCard accent={colors.green}>
        <View style={{ gap: 9 }}>
          <Pill label="18 modes" color={colors.green} />
          <Text style={{ color: colors.text, ...typography.title2 }}>Every game is still here.</Text>
          <Text style={{ color: colors.textSecondary, ...typography.caption1, lineHeight: 18 }}>
            Modes are grouped by training intent so it is easier to pick what your ear needs today.
          </Text>
        </View>
      </GlassCard>

      {MODE_CATEGORIES.map((category) => (
        <View key={category.id} style={{ gap: 10 }}>
          <SectionHeader title={category.label} />
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', flexWrap: 'wrap', gap: 10 }}>
            {category.modes.map((modeId) => {
              const mode = GAME_MODE_META[modeId];
              return (
                <View key={modeId} style={{ width: isDesktop ? '49%' : isTablet ? '100%' : '100%' }}>
                  <AnimatedModeCard mode={{ ...mode, accentHex: mode.accentHex || category.tone }} compact />
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </AppPage>
  );
}
