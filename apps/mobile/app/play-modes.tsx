import { Text, View } from "react-native";
import { GAME_MODE_META, GAME_MODES, MODE_CATEGORIES, type GameMode } from "@pitch-therapy/core";
import { AnimatedModeCard } from "@/components/AnimatedModeCard";
import { GlassCard, Pill, RecommendedPath, SectionHeader } from "@/components/AppleUI";
import { AppPage } from "@/components/AppPage";
import { useResponsiveLayout } from "@/lib/responsive";
import { colors, typography } from "@/lib/theme";

const MODE_PICKER_STEPS = [
  { label: "Start simple", detail: "Use foundational modes when you want accuracy reps." },
  { label: "Add pressure", detail: "Move into puzzles or speed work when the basics feel easy." },
  {
    label: "Go advanced",
    detail: "Use intervals, waveform, cents, and chords for precision work.",
  },
];

const MODES_BY_CATEGORY = MODE_CATEGORIES.map((category) => ({
  ...category,
  modes: GAME_MODES.filter((modeId) => GAME_MODE_META[modeId].category === category.id),
})).filter((category) => category.modes.length > 0);

function modeCountLabel(count: number) {
  return `${count} ${count === 1 ? "mode" : "modes"}`;
}

export default function PlayModesScreen() {
  const { isTablet, isDesktop } = useResponsiveLayout();
  const featuredModes = ["note-id", "pitch-match", "speed-round"] satisfies GameMode[];

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
            <Text style={{ color: colors.textSecondary, ...typography.caption1, lineHeight: 18 }}>
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
                    style={{ color: mode.accentHex, ...typography.caption2, fontWeight: "800" }}
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

      <RecommendedPath steps={MODE_PICKER_STEPS} accent={colors.green} compact />

      {MODES_BY_CATEGORY.map((category) => (
        <View key={category.id} style={{ gap: 10 }}>
          <SectionHeader
            title={`${category.icon} ${category.label}`}
            subtitle={`${category.description} • ${modeCountLabel(category.modes.length)}`}
          />
          <View style={{ flexDirection: isDesktop ? "row" : "column", flexWrap: "wrap", gap: 10 }}>
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
