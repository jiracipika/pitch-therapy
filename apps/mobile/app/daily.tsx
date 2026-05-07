import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GAME_MODE_META, getDailySeed } from '@pitch-therapy/core';
import { AnimatedModeCard } from '@/components/AnimatedModeCard';
import { GlassCard, Pill, SectionHeader } from '@/components/AppleUI';
import { AppPage } from '@/components/AppPage';
import { useResponsiveLayout } from '@/lib/responsive';
import { colors, typography } from '@/lib/theme';

const DAILY_MODES = ['note-wordle', 'frequency-wordle'] as const;

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export default function DailyScreen() {
  const { isDesktop } = useResponsiveLayout();
  const seed = getDailySeed();
  const [timeRemaining, setTimeRemaining] = useState(getTimeUntilMidnight);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <AppPage title="Daily Challenge" subtitle="Two fresh runs reset at midnight.">
      <GlassCard accent={colors.speedRound} padding={20}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Pill label="Next reset" color={colors.speedRound} />
          <Text style={{ color: colors.text, ...typography.largeTitle, fontVariant: ['tabular-nums'] }}>
            {timeRemaining}
          </Text>
          <Text style={{ color: colors.textSecondary, ...typography.caption1 }}>Seed note: {seed.note}</Text>
        </View>
      </GlassCard>

      <SectionHeader title="Today's Modes" subtitle="Complete both for the daily streak." />
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 10 }}>
        {DAILY_MODES.map((modeId) => {
          const mode = GAME_MODE_META[modeId];
          return (
            <View key={modeId} style={{ width: isDesktop ? '49%' : '100%' }}>
              <AnimatedModeCard mode={mode} />
            </View>
          );
        })}
      </View>

      <GlassCard accent={colors.purple}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.text, ...typography.headline }}>Streak Bonus</Text>
          <Text style={{ color: colors.textSecondary, ...typography.caption1, lineHeight: 18 }}>
            Finish the daily pair to keep your streak alive and sharpen both note and frequency recall.
          </Text>
        </View>
      </GlassCard>
    </AppPage>
  );
}
