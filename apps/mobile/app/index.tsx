import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/theme';

export default function SplashScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.logoShell}>
        <Image source={require('../assets/logo-placeholder.png')} style={styles.logo} />
      </View>
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
  logoShell: {
    width: 140,
    height: 140,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 14,
  },
  logo: {
    width: 128,
    height: 128,
    borderRadius: 999,
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
