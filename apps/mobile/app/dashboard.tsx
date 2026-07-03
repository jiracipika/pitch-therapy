import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GAME_MODE_META, buildPracticePlan } from "@pitch-therapy/core";
import { AnimatedModeCard } from "@/components/AnimatedModeCard";
import {
  GlassCard,
  MotionStatusCard,
  Pill,
  RecommendedPath,
  SectionHeader,
  StatItem,
} from "@/components/AppleUI";
import { StreakRing } from "@/components/StreakRing";
import { AppPage } from "@/components/AppPage";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useResponsiveLayout } from "@/lib/responsive";
import { colors, radii, typography } from "@/lib/theme";

export default function DashboardScreen() {
  const router = useRouter();
  const { isTablet, isDesktop } = useResponsiveLayout();
  const practicePlan = buildPracticePlan();
  const featuredModes = practicePlan.modeIds.map((modeId) => GAME_MODE_META[modeId]);

  return (
    <AppPage
      title="Pitch Therapy"
      subtitle="A focused ear-training studio for daily reps."
      showSwipeHint
      heroVariant="dashboard"
      heroHint="Flow: Warm-up -> Featured Mode -> Daily"
    >
      <MotionStatusCard
        tone="success"
        title="Studio is ready"
        message="Your personalized dashboard is loaded and tuned for your next session."
      />
      <GlassCard accent={colors.teal} padding={18} style={{ gap: 18 }}>
        <View
          style={{
            flexDirection: isTablet ? "row" : "column",
            alignItems: isTablet ? "center" : "flex-start",
            gap: 14,
          }}
        >
          <Image
            source={require("../assets/logo-placeholder.png")}
            style={{
              width: 66,
              height: 66,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.18)",
            }}
          />
          <View style={{ flex: 1, gap: 7 }}>
            <Pill label="Ready for today" color={colors.green} />
            <Text style={{ color: colors.text, ...typography.title2 }}>
              Train smarter, not louder.
            </Text>
            <Text style={{ color: colors.textSecondary, ...typography.caption1, lineHeight: 18 }}>
              Quick rounds, daily challenges, and precise pitch drills are all one swipe away.
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
            accessibilityLabel="Start play"
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
            <Text style={{ color: colors.background, ...typography.headline }}>Start Play</Text>
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

      <RecommendedPath steps={practicePlan.steps} accent={colors.blue} compact />

      <GlassCard accent={colors.speedRound}>
        <View
          style={{
            flexDirection: isTablet ? "row" : "column",
            alignItems: isTablet ? "center" : "flex-start",
            gap: 14,
          }}
        >
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={{ color: colors.textTertiary, ...typography.overline }}>
              TODAY'S PRACTICE PLAN
            </Text>
            <Text style={{ color: colors.text, ...typography.title2 }}>{practicePlan.title}</Text>
            <Text style={{ color: colors.textSecondary, ...typography.caption1, lineHeight: 18 }}>
              {practicePlan.summary}
            </Text>
          </View>
          <StreakRing streak={practicePlan.modeIds.length} size={88} />
        </View>
      </GlassCard>

      <View style={{ flexDirection: isTablet ? "row" : "column", gap: 10 }}>
        <GlassCard style={{ flex: 1 }} padding={14} accent={colors.blue}>
          <StatItem label="Sessions" value="0" color={colors.blue} />
        </GlassCard>
        <GlassCard style={{ flex: 1 }} padding={14} accent={colors.green}>
          <StatItem label="Accuracy" value="--" color={colors.green} />
        </GlassCard>
        <GlassCard style={{ flex: 1 }} padding={14} accent={colors.pink}>
          <StatItem label="Best" value="0" color={colors.pink} />
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
