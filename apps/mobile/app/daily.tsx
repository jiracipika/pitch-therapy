import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { DAILY_CHALLENGE_MODES, GAME_MODE_META, getDailyChallengeCompletion } from '@pitch-therapy/core';
import { AnimatedModeCard } from '@/components/AnimatedModeCard';
import { GlassCard, MotionStatusCard, Pill, SectionHeader } from '@/components/AppleUI';
import { AppPage } from '@/components/AppPage';
import { useResponsiveLayout } from '@/lib/responsive';
import { useSessionResults } from '@/lib/sessionResults';
import { colors, typography } from '@/lib/theme';

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
  const { stats } = useSessionResults();
  const [timeRemaining, setTimeRemaining] = useState('');
  const completion = getDailyChallengeCompletion(stats.results);

  useEffect(() => {
    setTimeRemaining(getTimeUntilMidnight());
    const timer = setInterval(() => {
      setTimeRemaining(getTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <AppPage
      title="Daily Challenge"
      subtitle="Two fresh runs reset at midnight."
      heroVariant="daily"
      heroHint="Keep your streak by clearing both drills"
    >
      <MotionStatusCard
        tone={!timeRemaining ? 'loading' : completion.isComplete ? 'success' : 'empty'}
        title={!timeRemaining ? 'Preparing today’s challenge' : completion.isComplete ? 'Daily complete' : 'Daily challenge active'}
        message={!timeRemaining ? 'Loading timer and challenge seed...' : completion.isComplete ? 'Both drills are complete. Your daily practice is locked in.' : `${completion.completedCount} of ${DAILY_CHALLENGE_MODES.length} drills complete before reset.`}
      />
      <GlassCard accent={colors.speedRound} padding={20}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Pill label="Next reset" color={colors.speedRound} />
          <Text style={{ color: colors.text, ...typography.largeTitle, fontVariant: ['tabular-nums'] }}>
            {timeRemaining}
          </Text>
          <Text style={{ color: colors.textSecondary, ...typography.caption1 }}>Daily target stays hidden until you enter the puzzles.</Text>
        </View>
      </GlassCard>

      <GlassCard accent={completion.isComplete ? colors.green : colors.blue} padding={16}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.text, ...typography.subhead }}>Today’s progress</Text>
            <Text style={{ color: colors.textSecondary, ...typography.caption1 }}>
              {completion.completedCount}/{DAILY_CHALLENGE_MODES.length}
            </Text>
          </View>
          <View style={{ height: 7, borderRadius: 999, overflow: 'hidden', backgroundColor: colors.surfaceElevated }}>
            <View
              style={{
                width: `${(completion.completedCount / DAILY_CHALLENGE_MODES.length) * 100}%`,
                height: '100%',
                borderRadius: 999,
                backgroundColor: completion.isComplete ? colors.green : colors.blue,
              }}
            />
          </View>
        </View>
      </GlassCard>

      <SectionHeader title="Today's Modes" subtitle="Complete both for the daily streak." />
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 10 }}>
        {DAILY_CHALLENGE_MODES.map((modeId) => {
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
