import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import {
  GAME_MODE_META,
  buildModeBreakdown,
  buildProgressInsights,
  type ModeTrendLabel,
  type ProgressResult,
} from '@pitch-therapy/core';
import { GlassCard, MotionStatusCard, SectionHeader, StatItem } from '@/components/AppleUI';
import { AchievementsSection } from '@/components/AchievementsSection';
import { StreakRing } from '@/components/StreakRing';
import { AppPage } from '@/components/AppPage';
import { useResponsiveLayout } from '@/lib/responsive';
import { useSessionResults, getModeStats } from '@/lib/sessionResults';
import { colors, radii, typography } from '@/lib/theme';

function formatAccuracy(value: number): string {
  return value > 0 ? `${Math.round(value * 100)}%` : '--';
}

function formatDelta(pct: number): { text: string; color: string } {
  if (pct > 5) return { text: `▲ ${Math.round(pct)}%`, color: colors.green };
  if (pct < -5) return { text: `▼ ${Math.round(Math.abs(pct))}%`, color: colors.danger };
  return { text: `${Math.round(pct)}%`, color: colors.textTertiary };
}

const TREND_DISPLAY: Record<ModeTrendLabel, { arrow: string; color: string; label: string }> = {
  improving: { arrow: '↗', color: colors.green, label: 'improving' },
  steady: { arrow: '→', color: colors.textTertiary, label: 'steady' },
  slipping: { arrow: '↘', color: colors.danger, label: 'slipping' },
};

// Compact inline trend strings for the Focus Areas list. Uses the canonical
// trendLabel from shared core (3% threshold) so a weak mode with too few
// sessions reads "steady" instead of the misleading "improving" that a naive
// trendDelta >= 0 check produced.
const WEAK_TREND_DISPLAY: Record<ModeTrendLabel, string> = {
  improving: '↗ improving',
  steady: '→ steady',
  slipping: '↘ slipping',
};

export default function ProgressScreen() {
  const { isDesktop } = useResponsiveLayout();
  const [loaded, setLoaded] = useState(false);
  const { stats } = useSessionResults();
  const sessionResults = useMemo<ProgressResult[]>(() => stats.results, [stats.results]);
  const insights = useMemo(() => buildProgressInsights(sessionResults), [sessionResults]);
  const modeBreakdown = useMemo(
    () => buildModeBreakdown(sessionResults),
    [sessionResults],
  );
  const breakdownByMode = useMemo(() => {
    const map = new Map<string, (typeof modeBreakdown)[number]>();
    for (const entry of modeBreakdown) map.set(entry.mode, entry);
    return map;
  }, [modeBreakdown]);
  const hasStats = sessionResults.length > 0;

  useEffect(() => {
    const timeout = setTimeout(() => setLoaded(true), 120);
    return () => clearTimeout(timeout);
  }, []);

  const statsCards = [
    { label: 'Sessions', value: String(stats.totalSessions), color: colors.blue },
    { label: 'Correct', value: String(stats.totalCorrect), color: colors.green },
    { label: 'Accuracy', value: formatAccuracy(stats.avgAccuracy), color: colors.speedRound },
    { label: 'Best', value: String(stats.bestScore), color: colors.pink },
  ];

  const status = !loaded
    ? {
        tone: 'loading' as const,
        title: 'Analyzing your sessions',
        message: 'Pulling mode accuracy and momentum trends.',
      }
    : hasStats
      ? {
          tone: 'success' as const,
          title: 'Tracking is active',
          message: 'Performance streams are up to date across all modes.',
        }
      : {
          tone: 'empty' as const,
          title: 'No sessions recorded yet',
          message: 'Complete one round to unlock detailed graphs and mode-level trends.',
        };

  return (
    <AppPage
      title="Progress"
      subtitle="A clean snapshot of consistency and performance."
      heroVariant="progress"
      heroHint="Watch trend quality as your repetitions stack"
    >
      <MotionStatusCard tone={status.tone} title={status.title} message={status.message} />
      <GlassCard accent={colors.purple} padding={20}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Text style={{ color: colors.textTertiary, ...typography.overline }}>BEST STREAK</Text>
          <StreakRing streak={stats.bestStreak} size={108} />
          <Text style={{ color: colors.text, ...typography.title3 }}>{stats.bestStreak} days</Text>
        </View>
      </GlassCard>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {statsCards.map((stat) => (
          <GlassCard key={stat.label} style={{ flex: 1, minWidth: '47%' }} padding={14} accent={stat.color}>
            <StatItem label={stat.label} value={stat.value} color={stat.color} />
          </GlassCard>
        ))}
      </View>

      <SectionHeader
        title="By Mode"
        subtitle={
          hasStats
            ? 'Accuracy, play count, and trend across each drill.'
            : 'Mode history will fill in as sessions are recorded.'
        }
      />
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', flexWrap: 'wrap', gap: 10 }}>
        {Object.values(GAME_MODE_META).map((mode) => {
          const modeData = getModeStats(sessionResults, mode.id);
          const played = modeData.sessions > 0;
          // Trend comes from the shared core breakdown (needs >= 4 sessions
          // to be non-steady). Falls back to "steady" for fresh modes.
          const breakdown = breakdownByMode.get(mode.id);
          const trend = breakdown ? TREND_DISPLAY[breakdown.trendLabel] : TREND_DISPLAY.steady;
          return (
            <GlassCard key={mode.id} padding={13} accent={mode.accentHex} style={{ width: isDesktop ? '49%' : '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radii.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: mode.accentHex + '20',
                    borderWidth: 1,
                    borderColor: mode.accentHex + '55',
                  }}
                >
                  <Text style={{ color: mode.accentHex, fontWeight: '900' }}>♪</Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: colors.text, ...typography.subhead }}>{mode.label}</Text>
                  <Text style={{ color: colors.textTertiary, ...typography.caption1 }}>
                    {played
                      ? `${modeData.sessions} session${modeData.sessions > 1 ? 's' : ''} played`
                      : '0 sessions played'}
                  </Text>
                </View>
                {played && (
                  <Text style={{ color: trend.color, ...typography.caption1, marginRight: 8 }}>
                    {trend.arrow} {trend.label}
                  </Text>
                )}
                <Text style={{ color: played ? colors.text : colors.textTertiary, ...typography.subhead }}>
                  {played ? formatAccuracy(modeData.avgAccuracy) : '--'}
                </Text>
              </View>
            </GlassCard>
          );
        })}
      </View>

      <AchievementsSection results={sessionResults} />

      {hasStats && (
        <>
          <SectionHeader title="7-Day Momentum" subtitle="Weekly trends in volume and accuracy." />
          <GlassCard accent={colors.indigo} padding={16}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.textTertiary, ...typography.overline }}>SESSIONS</Text>
                <Text style={{ color: colors.text, ...typography.title3 }}>
                  {insights.momentum.sessionsLast7}
                </Text>
                <Text style={{ color: formatDelta(insights.momentum.sessionDeltaPct).color, ...typography.caption1 }}>
                  {formatDelta(insights.momentum.sessionDeltaPct).text} vs prev week
                </Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.textTertiary, ...typography.overline }}>ACCURACY</Text>
                <Text style={{ color: colors.text, ...typography.title3 }}>
                  {formatAccuracy(insights.momentum.avgAccuracyLast7)}
                </Text>
                <Text style={{ color: formatDelta(insights.momentum.accuracyDeltaPct).color, ...typography.caption1 }}>
                  {formatDelta(insights.momentum.accuracyDeltaPct).text} vs prev week
                </Text>
              </View>
            </View>
          </GlassCard>
        </>
      )}

      {hasStats && insights.weakModes.length > 0 && (
        <>
          <SectionHeader title="Focus Areas" subtitle="Modes with the highest improvement potential." />
          <View style={{ gap: 8 }}>
            {insights.weakModes.map((wm) => (
              <GlassCard key={wm.mode} padding={13} accent={colors.orange}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: radii.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.orange + '20',
                      borderWidth: 1,
                      borderColor: colors.orange + '55',
                    }}
                  >
                    <Text style={{ color: colors.orange, fontWeight: '900' }}>!</Text>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ color: colors.text, ...typography.subhead }}>{wm.label}</Text>
                    <Text style={{ color: colors.textTertiary, ...typography.caption1 }}>
                      {wm.sessions} session{wm.sessions > 1 ? 's' : ''} · {formatAccuracy(wm.avgAccuracy)}
                      {`  ${WEAK_TREND_DISPLAY[wm.trendLabel]}`}
                    </Text>
                  </View>
                  <Text style={{ color: colors.text, ...typography.subhead }}>
                    {formatAccuracy(wm.avgAccuracy)}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        </>
      )}

      <GlassCard accent={colors.blue} padding={16}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.textTertiary, ...typography.overline }}>FOCUS NEXT</Text>
          <Text style={{ color: colors.text, ...typography.subhead }}>{insights.focusTip}</Text>
        </View>
      </GlassCard>
    </AppPage>
  );
}
