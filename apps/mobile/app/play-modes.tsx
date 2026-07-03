import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import {
  GAME_MODE_META,
  GAME_MODES,
  MODE_CATEGORIES,
  buildPracticePlan,
  getModeTrainingCue,
  getModesByCategory,
  type GameMode,
} from "@pitch-therapy/core";
import { AnimatedModeCard } from "@/components/AnimatedModeCard";
import { AppleInput, GlassCard, Pill, RecommendedPath, SectionHeader } from "@/components/AppleUI";
import { AppPage } from "@/components/AppPage";
import { useResponsiveLayout } from "@/lib/responsive";
import { colors, typography } from "@/lib/theme";

const MODES_BY_CATEGORY = MODE_CATEGORIES.map((category) => ({
  ...category,
  modes: getModesByCategory(category.id),
})).filter((category) => category.modes.length > 0);

const SEARCHABLE_MODE_TEXT = GAME_MODES.reduce<Record<GameMode, string>>(
  (acc, modeId) => {
    const mode = GAME_MODE_META[modeId];
    const cue = getModeTrainingCue(modeId);
    acc[modeId] = [
      mode.label,
      mode.description,
      mode.category,
      cue.durationLabel,
      cue.skillLabel,
      cue.sessionGoal,
    ]
      .join(" ")
      .toLowerCase();
    return acc;
  },
  {} as Record<GameMode, string>,
);

function modeCountLabel(count: number) {
  return `${count} ${count === 1 ? "mode" : "modes"}`;
}

export default function PlayModesScreen() {
  const { isTablet, isDesktop } = useResponsiveLayout();
  const [modeSearch, setModeSearch] = useState("");
  const practicePlan = buildPracticePlan();
  const featuredModes = practicePlan.modeIds;
  const normalizedSearch = modeSearch.trim().toLowerCase();
  const filteredModeCount = useMemo(() => {
    if (!normalizedSearch) return GAME_MODES.length;
    return GAME_MODES.filter((modeId) => SEARCHABLE_MODE_TEXT[modeId].includes(normalizedSearch))
      .length;
  }, [normalizedSearch]);
  const filteredCategories = useMemo(() => {
    if (!normalizedSearch) return MODES_BY_CATEGORY;
    return MODES_BY_CATEGORY.map((category) => ({
      ...category,
      modes: category.modes.filter((modeId) =>
        SEARCHABLE_MODE_TEXT[modeId].includes(normalizedSearch),
      ),
    })).filter((category) => category.modes.length > 0);
  }, [normalizedSearch]);

  return (
    <AppPage
      title="Play Modes"
      subtitle="Choose a track, then jump straight into a focused drill."
      heroVariant="play"
      heroHint="Swipe from here into daily drills or progress when you are ready"
    >
      <GlassCard accent={colors.green}>
        <View style={{ gap: 14 }}>
          <View style={{ gap: 9 }}>
            <Pill label={modeCountLabel(GAME_MODES.length)} color={colors.green} />
            <Text style={{ color: colors.text, ...typography.title2 }}>
              Every game is still here.
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                ...typography.caption1,
                lineHeight: 18,
              }}
            >
              Modes are grouped from the shared game catalog, so mobile stays in sync with web as
              new drills ship.
            </Text>
          </View>

          <View style={{ flexDirection: isTablet ? "row" : "column", gap: 8 }}>
            {featuredModes.map((modeId) => {
              const mode = GAME_MODE_META[modeId];
              return (
                <View
                  key={mode.id}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: mode.accentHex + "35",
                    backgroundColor: mode.accentHex + "14",
                    padding: 10,
                    gap: 3,
                  }}
                >
                  <Text
                    style={{
                      color: mode.accentHex,
                      ...typography.caption2,
                      fontWeight: "800",
                    }}
                  >
                    {mode.icon} Featured
                  </Text>
                  <Text style={{ color: colors.text, ...typography.footnote }} numberOfLines={1}>
                    {mode.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </GlassCard>

      <RecommendedPath steps={practicePlan.steps} accent={colors.green} compact />

      <GlassCard accent={colors.blue} padding={14} style={{ gap: 10 }}>
        <View
          style={{
            flexDirection: isTablet ? "row" : "column",
            alignItems: isTablet ? "center" : "flex-start",
            gap: 10,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: colors.text, ...typography.headline }}>Find the right drill</Text>
            <Text
              style={{
                color: colors.textSecondary,
                ...typography.caption1,
                lineHeight: 17,
              }}
            >
              Search by skill, cue, or game name. Try "pitch", "frequency", "memory", or "fast".
            </Text>
          </View>
          <Pill
            label={normalizedSearch ? modeCountLabel(filteredModeCount) : "All drills"}
            color={colors.blue}
          />
        </View>
        <AppleInput
          value={modeSearch}
          onChangeText={setModeSearch}
          placeholder="Search all play modes"
          accessibilityLabel="Search play modes"
          accessibilityHint="Filter drills by skill, cue, or game name"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: colors.backgroundRaised,
            borderColor: colors.borderStrong,
          }}
        />
      </GlassCard>

      {filteredCategories.length === 0 ? (
        <GlassCard accent={colors.orange} padding={16}>
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.text, ...typography.headline }}>No matching drills</Text>
            <Text
              style={{
                color: colors.textSecondary,
                ...typography.caption1,
                lineHeight: 18,
              }}
            >
              Try a broader skill like pitch, note, chord, frequency, rhythm, or speed.
            </Text>
          </View>
        </GlassCard>
      ) : null}

      {filteredCategories.map((category) => (
        <View key={category.id} style={{ gap: 10 }}>
          <SectionHeader
            title={`${category.icon} ${category.label}`}
            subtitle={`${category.description} • ${modeCountLabel(category.modes.length)}`}
          />
          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {category.modes.map((modeId) => {
              const mode = GAME_MODE_META[modeId];
              return (
                <View key={modeId} style={{ width: isDesktop ? "49%" : "100%" }}>
                  <AnimatedModeCard mode={mode} compact />
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </AppPage>
  );
}
