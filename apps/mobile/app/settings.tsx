import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/theme';

const tabs = [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Daily', route: '/daily' },
  { label: 'Progress', route: '/progress' },
  { label: 'Settings', route: '/settings' },
] as const;

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4 pb-24">
        <Text className="text-text text-2xl font-bold mb-6">Settings</Text>

        {[
          { label: 'Sound', value: 'On' },
          { label: 'Haptic Feedback', value: 'On' },
          { label: 'Difficulty', value: 'Medium' },
          { label: 'Reference Pitch', value: 'A4 = 440 Hz' },
        ].map((setting) => (
          <View key={setting.label} className="bg-card rounded-xl p-4 border border-border mb-2 flex-row justify-between">
            <Text className="text-text text-sm">{setting.label}</Text>
            <Text className="text-muted text-sm">{setting.value}</Text>
          </View>
        ))}

        <View className="bg-card rounded-xl p-4 border border-border mt-4">
          <Text className="text-muted text-xs text-center">Pitch Therapy v0.1.0</Text>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border flex-row">
        {tabs.map((tab) => (
          <Pressable key={tab.route} onPress={() => router.push(tab.route)} className="flex-1 py-3 items-center">
            <Text className={`text-xs font-medium ${tab.route === '/settings' ? 'text-blue-500' : 'text-muted'}`}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
