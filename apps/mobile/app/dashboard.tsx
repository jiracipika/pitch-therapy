import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  GAME_MODE_META,
  buildAdaptivePracticePlan,
  estimatePlanDuration,
} from "@pitch-therapy/core";
import { AnimatedModeCard } from "@/components/AnimatedModeCard";
import {
  AnimatedStatItem,
  GlassCard,
  Pill,
  RecommendedPath,
  SectionHeader,
} from "@/components/AppleUI";
import { StreakRing } from "@/components/StreakRing";
import { AppPage } from "@/components/AppPage";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useResponsiveLayout } from "@/lib/responsive";
import { useSessionResults } from "@/lib/sessionResults";
import { colors, radii, typography } from "@/lib/theme";

export default function DashboardScreen() {
  const router = useRouter();
  const { isTablet, isDesktop } = useResponsiveLayout();
  const { stats } = useSessionResults();
  const practicePlan = buildAdaptivePracticePlan(stats.results);
  const planDuration = estimatePlanDuration(practicePlan);
  const featuredModes = practicePlan.modeIds.map((modeId) => GAME_MODE_META[modeId]);

  return (
    <AppPage
      title="Pitch Therapy"
      subtitle="A focused ear-training studio for daily reps."
      showSwipeHint
      heroVariant="dashboard"
      heroHint="Warm up, focus, then review."
    >
      <GlassCard accent={colors.signal} padding={18} style={{ gap: 18 }}>
        <View
          style={{
            flexDirection: isTablet ? "row" : "column",
            alignItems: isTablet ? "center" : "flex-start",
            gap: 14,
          }}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              width: 66,
              height: 66,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.signal + "66",
              backgroundColor: colors.signal + "18",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.signal, fontSize: 25, fontWeight: "900", letterSpacing: -1 }}>
              PT
            </Text>
            <View
              style={{
                width: 30,
                height: 3,
                marginTop: 4,
                borderRadius: 2,
                backgroundColor: colors.coral,
              }}
            />
          </View>
          <View style={{ flex: 1, gap: 7 }}>
            <Pill label={practicePlan.personalized ? "Tuned to your progress" : "Ready for today"} color={colors.signal} />
            <Text style={{ color: colors.text, ...typography.title2 }}>
              {practicePlan.title}
            </Text>
            <Text style={{ color: colors.textSecondary, ...typography.caption1, lineHeight: 18 }}>
              {practicePlan.summary}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: isTablet ? "row" : "column", gap: 10 }}>
          <Pressable
            onPress={() => {
              void triggerSelectionHaptic();
              router.push("/play-modes");
            }}
            accessibilityRole="button"
            accessibilityLabel="Browse play modes"
            accessibilityHint="Open the full play mode catalog"
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              borderRadius: radii.md,
              backgroundColor: colors.text,
              paddingVertical: 14,
              alignItems: "center",
              opacity: pressed ? 0.82 : 1,
            })}
          >
            <Text style={{ color: colors.background, ...typography.headline }}>Browse Modes</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void triggerSelectionHaptic();
              router.push("/daily");
            }}
            accessibilityRole="button"
            accessibilityLabel="Open daily challenge"
            style={({ pressed }) => ({
              width: isTablet ? 104 : "100%",
              minHeight: 48,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              paddingVertical: 14,
              alignItems: "center",
              opacity: pressed ? 0.82 : 1,
            })}
          >
            <Text style={{ color: colors.text, ...typography.headline }}>Daily</Text>
          </Pressable>
        </View>
      </GlassCard>

      <RecommendedPath
        steps={practicePlan.steps}
        accent={colors.blue}
        compact
        onStepPress={(step) => {
          if (!step.modeId) return;
          void triggerSelectionHaptic();
          router.push(`/play/${step.modeId}`);
        }}
      />

      <GlassCard accent={colors.speedRound}>
        <View
          style={{
            flexDirection: isTablet ? "row" : "column",
            alignItems: isTablet ? "center" : "flex-start",
            gap: 14,
          }}
        >
          <View style={{ flex: 1, gap: 5 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ color: colors.textTertiary, ...typography.overline }}>
                {practicePlan.personalized ? "PERSONALIZED PLAN" : "TODAY'S PRACTICE PLAN"}
              </Text>
              {planDuration.maxMinutes > 0 && (
                <View
                  accessibilityLabel={`Estimated ${planDuration.label} total`}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: (colors.orange ?? "#FF9F0A") + "44",
                    backgroundColor: (colors.orange ?? "#FF9F0A") + "1A",
                    paddingVertical: 2,
                    paddingHorizontal: 7,
                  }}
                >
                  <Text
                    style={{
                      color: colors.orange ?? "#FF9F0A",
                      fontSize: 10,
                      fontWeight: "700",
                      letterSpacing: 0.2,
                    }}
                  >
                    ⏱ {planDuration.label}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ color: colors.text, ...typography.title2 }}>Keep the signal alive</Text>
            <Text style={{ color: colors.textSecondary, ...typography.caption1, lineHeight: 18 }}>
              {stats.streak > 0
                ? `${stats.streak} day${stats.streak === 1 ? "" : "s"} strong. Complete one focused session today.`
                : "Complete one focused session today to begin a practice streak."}
            </Text>
          </View>
          <StreakRing streak={stats.streak} size={88} pulse={stats.streak > 0} />
        </View>
      </GlassCard>

      <View style={{ flexDirection: isTablet ? "row" : "column", gap: 10 }}>
        <GlassCard style={{ flex: 1 }} padding={14} accent={colors.blue}>
          <AnimatedStatItem label="Sessions" value={stats.totalSessions} color={colors.blue} />
        </GlassCard>
        <GlassCard style={{ flex: 1 }} padding={14} accent={colors.green}>
          <AnimatedStatItem
            label="Accuracy"
            value={stats.totalSessions > 0 ? Math.round(stats.avgAccuracy * 100) : 0}
            suffix="%"
            color={colors.green}
          />
        </GlassCard>
        <GlassCard style={{ flex: 1 }} padding={14} accent={colors.pink}>
          <AnimatedStatItem label="Best" value={stats.bestScore} color={colors.pink} />
        </GlassCard>
        <GlassCard style={{ flex: 1 }} padding={14} accent={colors.orange}>
          {stats.streak > 0 ? (
            <AnimatedStatItem label="Streak" value={stats.streak} suffix="d" color={colors.orange} />
          ) : stats.bestStreak > 0 ? (
            <AnimatedStatItem label="Best" value={stats.bestStreak} suffix="d" color={colors.orange} />
          ) : (
            <AnimatedStatItem label="Streak" value="—" color={colors.orange} />
          )}
        </GlassCard>
      </View>

      <SectionHeader
        title="Featured Modes"
        subtitle="Fast drills that cover pitch, memory, and frequency."
      />
      <View style={{ flexDirection: isDesktop ? "row" : "column", flexWrap: "wrap", gap: 10 }}>
        {featuredModes.map((mode) => (
          <View key={mode.id} style={{ width: isDesktop ? "49%" : "100%" }}>
            <AnimatedModeCard mode={mode} compact />
          </View>
        ))}
      </View>
    </AppPage>
  );
}
