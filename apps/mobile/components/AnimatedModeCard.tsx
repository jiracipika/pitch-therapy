import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getModeTrainingCue, type GameModeMeta } from "@pitch-therapy/core";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { colors, radii, shadows, typography } from "@/lib/theme";

interface AnimatedModeCardProps {
  mode: GameModeMeta;
  compact?: boolean;
}

export function AnimatedModeCard({ mode, compact = false }: AnimatedModeCardProps) {
  const router = useRouter();
  const route = `/play/${mode.id}` as const;
  const cue = getModeTrainingCue(mode.id);
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(reveal, {
      toValue: 1,
      useNativeDriver: true,
      stiffness: 170,
      damping: 22,
      mass: 0.9,
    }).start();
  }, [reveal]);

  const translateY = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const opacity = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={() => {
          void triggerSelectionHaptic();
          router.push(route);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Open ${mode.label}`}
        accessibilityHint={`${mode.description}. ${cue.durationLabel}. ${cue.skillLabel}.`}
        style={({ pressed }) => ({
          minHeight: 48,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <LinearGradient
          colors={[mode.accentHex + "24", colors.card, colors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: mode.accentHex + "40",
            padding: compact ? 14 : 16,
            gap: compact ? 8 : 10,
            ...shadows.card,
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 34,
              borderTopLeftRadius: radii.lg,
              borderTopRightRadius: radii.lg,
              backgroundColor: mode.accentHex + "16",
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: compact ? 38 : 44,
                height: compact ? 38 : 44,
                borderRadius: radii.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: mode.accentHex + "22",
                borderWidth: 1,
                borderColor: mode.accentHex + "55",
              }}
            >
              <Text style={{ fontSize: compact ? 17 : 19 }}>{mode.icon}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: colors.text, ...typography.headline }} numberOfLines={1}>
                {mode.label}
              </Text>
              <Text
                style={{ color: colors.textSecondary, ...typography.caption1, lineHeight: 17 }}
                numberOfLines={2}
              >
                {mode.description}
              </Text>
            </View>
            <Text style={{ color: mode.accentHex, fontSize: 22, fontWeight: "700" }}>›</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              paddingTop: compact ? 2 : 4,
            }}
          >
            <Text
              style={{
                color: mode.accentHex,
                ...typography.caption2,
                fontWeight: "800",
                backgroundColor: mode.accentHex + "18",
                borderRadius: 999,
                overflow: "hidden",
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              {cue.durationLabel}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                ...typography.caption2,
                fontWeight: "700",
                backgroundColor: colors.surfaceElevated,
                borderRadius: 999,
                overflow: "hidden",
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              {cue.skillLabel}
            </Text>
          </View>
          {!compact && (
            <Text
              style={{ color: colors.textTertiary, ...typography.caption1, lineHeight: 17 }}
              numberOfLines={2}
            >
              {cue.sessionGoal}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
