import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { DAILY_CHALLENGE_MODES, GAME_MODE_META, getDailyChallengeCompletion } from '@pitch-therapy/core';
import { AnimatedModeCard } from '@/components/AnimatedModeCard';
import { AnimatedProgressBar } from '@/lib/motion';
import { GlassCard, MotionStatusCard, Pill, SectionHeader } from '@/components/AppleUI';
import { AppPage } from '@/components/AppPage';
import { useResponsiveLayout } from '@/lib/responsive';
import { useSessionResults } from '@/lib/sessionResults';
import { colors, typography } from '@/lib/theme';

function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

function formatTimeUntilMidnight(): string {
  const diff = getSecondsUntilMidnight();
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function DailyScreen() {
  const { isDesktop } = useResponsiveLayout();
  const { stats } = useSessionResults();
  const [timeRemaining, setTimeRemaining] = useState('');
  const completion = getDailyChallengeCompletion(stats.results);

  useEffect(() => {
    // Battery-efficient countdown: tick every second only in the final
    // minute, otherwise every 30 seconds — avoids waking the CPU 60x/min
    // for hours on end while showing a countdown the user rarely watches.
    let intervalId: ReturnType<typeof setInterval>;
    const tick = () => {
      setTimeRemaining(formatTimeUntilMidnight());
      const totalSeconds = getSecondsUntilMidnight();
      // If under 60 seconds, keep 1s updates; otherwise slow down to 30s.
      clearInterval(intervalId);
      intervalId = setInterval(tick, totalSeconds < 60 ? 1000 : 30_000);
    };
    tick();

    return () => clearInterval(intervalId);
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
          <Text
            style={{
              color: colors.text,
              ...typography.largeTitle,
              fontVariant: ['tabular-nums'],
              fontSize: 48,
            }}
          >
            {timeRemaining}
          </Text>
          <Text style={{ color: colors.textSecondary, ...typography.caption1 }}>
            Daily target stays hidden until you enter the puzzles.
          </Text>
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
          <AnimatedProgressBar
            progress={completion.completedCount / DAILY_CHALLENGE_MODES.length}
            color={completion.isComplete ? colors.green : colors.blue}
            trackColor={colors.surfaceElevated}
            height={7}
            duration={1000}
          />
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
