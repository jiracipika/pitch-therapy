import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/theme';

export default function SplashScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <Text className="text-5xl font-bold text-text mb-2">🎵</Text>
      <Text className="text-text text-3xl font-bold mb-1">Pitch Therapy</Text>
      <Text className="text-muted text-base mb-12">Train your ear. Every day.</Text>
      <Pressable
        onPress={() => router.replace('/dashboard')}
        className="bg-blue-500 rounded-2xl px-12 py-4 active:opacity-80"
      >
        <Text className="text-white font-bold text-lg">Get Started</Text>
      </Pressable>
    </View>
  );
}
