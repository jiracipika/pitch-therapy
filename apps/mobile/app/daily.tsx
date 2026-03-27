import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { GAME_MODE_META, getDailySeed } from '@pitch-therapy/core';
import { colors } from '@/lib/theme';

const tabs = [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Daily', route: '/daily' },
  { label: 'Progress', route: '/progress' },
  { label: 'Settings', route: '/settings' },
] as const;

export default function DailyScreen() {
  const router = useRouter();
  const seed = getDailySeed();
  const modes = Object.values(GAME_MODE_META);

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4 pb-24">
        <Text className="text-text text-2xl font-bold mb-1">Daily Challenge</Text>
        <Text className="text-muted text-sm mb-6">Seed: {seed}</Text>

        <View className="bg-card rounded-2xl p-5 border border-border mb-4">
          <Text className="text-text font-bold text-lg mb-1">Today's Workout</Text>
          <Text className="text-muted text-sm">Complete all modes to earn bonus streak!</Text>
        </View>

        {modes.map((mode, i) => (
          <View key={mode.id} className="bg-card rounded-xl p-4 border border-border mb-2 flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: mode.accentHex + '20' }}>
              <Text className="text-sm font-bold" style={{ color: mode.accentHex }}>{i + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text font-medium">{mode.label}</Text>
              <Text className="text-muted text-xs">{mode.description}</Text>
            </View>
            <Text className="text-muted text-xs">--</Text>
          </View>
        ))}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border flex-row">
        {tabs.map((tab) => (
          <Pressable
            key={tab.route}
            onPress={() => router.push(tab.route)}
            className="flex-1 py-3 items-center"
          >
            <Text className={`text-xs font-medium ${tab.route === '/daily' ? 'text-blue-500' : 'text-muted'}`}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
