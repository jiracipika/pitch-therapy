// ─── Achievements Section (mobile) ────────────────────────────────────────────
//
// Surfaces the shared achievement/milestone tiers from @pitch-therapy/core on
// the mobile progress screen. Mirrors the web progress page: an overall
// progress bar, latest unlock callout, and a per-tier grid showing progress
// toward the next goal in each category. Uses the mobile Apple design system
// (GlassCard, SectionHeader, colors, typography) so it stays visually
// consistent with the rest of the app.

import { useMemo } from "react";
import { Text, View } from "react-native";
import {
  evaluateAchievements,
  getLatestBadges,
  getNextGoals,
  type AchievementStatus,
  type ProgressResult,
} from "@pitch-therapy/core";
import { GlassCard, SectionHeader } from "@/components/AppleUI";
import { useResponsiveLayout } from "@/lib/responsive";
import { colors, radii, typography } from "@/lib/theme";

/** Format a locked tier's progress as "current / target" for display. */
function formatMetricProgress(s: AchievementStatus): string {
  const { tier, progress } = s;
  switch (tier.category) {
    case "volume":
      return `${Math.round(progress)} / ${tier.threshold} sessions`;
    case "consistency":
      return `${Math.round(progress)} / ${tier.threshold} day streak`;
    case "accuracy":
      return `${Math.round(progress * 100)}% / ${Math.round(tier.threshold * 100)}%`;
    case "versatility":
      return `${Math.round(progress)} / ${tier.threshold} modes`;
    case "mastery":
      // Mastery counts modes drilled to a sustained standard (4+ sessions at
      // 80%+ average). Show mastered / target.
      return `${Math.round(progress)} / ${tier.threshold} mastered`;
    case "speed": {
      // Speed is inverted: lower is better. Show current / target seconds.
      const targetSec = (tier.threshold / 1000).toFixed(0);
      const currentSec =
        Number.isFinite(progress) && progress > 0 ? (progress / 1000).toFixed(1) : "—";
      return `${currentSec}s avg / under ${targetSec}s`;
    }
    default:
      return "";
  }
}

interface AchievementsSectionProps {
  results: ProgressResult[];
}

export function AchievementsSection({ results }: AchievementsSectionProps) {
  const { isDesktop } = useResponsiveLayout();
  const achievements = useMemo(() => evaluateAchievements(results), [results]);
  const nextGoals = useMemo(() => getNextGoals(results), [results]);
  const latestBadges = useMemo(() => getLatestBadges(results), [results]);

  const pct =
    achievements.totalCount > 0
      ? Math.round((achievements.unlockedCount / achievements.totalCount) * 100)
      : 0;

  const nextGoalIds = useMemo(() => new Set(nextGoals.map((g) => g.tier.id)), [nextGoals]);

  return (
    <>
      <SectionHeader
        title="Achievements"
        subtitle={`${achievements.unlockedCount} of ${achievements.totalCount} unlocked`}
      />

      <GlassCard accent={colors.green} padding={18}>
        {/* Overall progress bar */}
        <View style={{ marginBottom: 14 }}>
          <View
            style={{
              height: 8,
              borderRadius: radii.full,
              backgroundColor: colors.border,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${pct}%`,
                borderRadius: radii.full,
                backgroundColor: colors.green,
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <Text style={{ color: colors.textTertiary, ...typography.caption1 }}>
              {pct}% complete
            </Text>
            {achievements.latestUnlock ? (
              <Text
                style={{
                  color: colors.green,
                  ...typography.caption1,
                  fontWeight: "600",
                }}
              >
                {achievements.latestUnlock.icon} {achievements.latestUnlock.label}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Current badges — strongest unlocked tier per category */}
        {latestBadges.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 14,
            }}
          >
            {latestBadges.map((b) => (
              <View
                key={b.tier.id}
                accessibilityLabel={`${b.tier.label} badge: current best in ${b.tier.category}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderRadius: radii.full,
                  borderWidth: 1,
                  borderColor: colors.green + "40",
                  backgroundColor: colors.green + "14",
                }}
              >
                <Text style={{ fontSize: 12 }}>{b.tier.icon}</Text>
                <Text
                  numberOfLines={1}
                  style={{
                    color: colors.text,
                    ...typography.caption2,
                    fontWeight: "600",
                  }}
                >
                  {b.tier.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Tier grid */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {achievements.statuses.map((s) => {
            const isNext = !s.unlocked && nextGoalIds.has(s.tier.id);
            return (
              <View
                key={s.tier.id}
                accessibilityLabel={`${s.tier.label}: ${s.unlocked ? "unlocked" : "locked"}`}
                style={{
                  width: isDesktop ? "32%" : "48%",
                  padding: 10,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: isNext
                    ? colors.blue
                    : s.unlocked
                      ? colors.green + "33"
                      : colors.border,
                  backgroundColor: s.unlocked
                    ? colors.green + "14"
                    : isNext
                      ? colors.blue + "0D"
                      : "transparent",
                  opacity: s.unlocked ? 1 : 0.72,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{s.tier.icon}</Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      color: colors.text,
                      ...typography.caption1,
                      fontWeight: "600",
                    }}
                  >
                    {s.tier.label}
                  </Text>
                </View>

                <Text
                  numberOfLines={2}
                  style={{
                    color: colors.textTertiary,
                    ...typography.caption2,
                    lineHeight: 15,
                    marginBottom: 6,
                  }}
                >
                  {s.tier.description}
                </Text>

                {s.unlocked ? (
                  <Text
                    style={{
                      color: colors.green,
                      ...typography.caption2,
                      fontWeight: "600",
                    }}
                  >
                    Unlocked
                  </Text>
                ) : (
                  <>
                    <View
                      style={{
                        height: 4,
                        borderRadius: radii.full,
                        backgroundColor: colors.border,
                        overflow: "hidden",
                        marginBottom: 3,
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${Math.round(s.progressFraction * 100)}%`,
                          borderRadius: radii.full,
                          backgroundColor: isNext ? colors.blue : colors.textTertiary,
                        }}
                      />
                    </View>
                    <Text style={{ color: colors.textTertiary, ...typography.caption2 }}>
                      {formatMetricProgress(s)}
                    </Text>
                  </>
                )}
              </View>
            );
          })}
        </View>
      </GlassCard>
    </>
  );
}
