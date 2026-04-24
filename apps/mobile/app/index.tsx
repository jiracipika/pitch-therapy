import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { colors, radii, shadows, typography } from '@/lib/theme';

export default function SplashScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10131A', '#08090D', '#111827']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.logoShell}>
        <Image source={require('../assets/logo-placeholder.png')} style={styles.logo} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Pitch Therapy</Text>
        <Text style={styles.subtitle}>Train your ear with focused daily reps.</Text>
      </View>
      <Pressable
        onPress={() => {
          void triggerSelectionHaptic();
          router.replace('/dashboard');
        }}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
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
    gap: 22,
  },
  logoShell: {
    width: 154,
    height: 154,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    ...shadows.elevated,
  },
  logo: {
    width: 138,
    height: 138,
    borderRadius: radii.lg,
  },
  copy: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: colors.text,
    ...typography.largeTitle,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    ...typography.callout,
    textAlign: 'center',
  },
  button: {
    minWidth: 210,
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingHorizontal: 34,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  buttonText: {
    color: colors.background,
    ...typography.headline,
  },
});
