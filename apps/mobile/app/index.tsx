import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/theme';

export default function SplashScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎵</Text>
      <Text style={styles.title}>Pitch Therapy</Text>
      <Text style={styles.subtitle}>Train your ear. Every day.</Text>
      <Pressable
        onPress={() => router.replace('/dashboard')}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingHorizontal: 48,
    paddingVertical: 16,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
