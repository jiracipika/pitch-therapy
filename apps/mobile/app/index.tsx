import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { colors, radii, shadows, typography } from '@/lib/theme';

export default function SplashScreen() {
  const router = useRouter();
  const reveal = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: 1,
      duration: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: 6200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sweep, {
          toValue: 0,
          duration: 6200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reveal, sweep]);

  const sweepTranslate = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-130, 130],
  });
  const revealY = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const revealScale = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F1320', '#08090D', '#121828']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sweep,
          {
            transform: [{ translateX: sweepTranslate }, { rotate: '-6deg' }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(10,132,255,0)', 'rgba(10,132,255,0.24)', 'rgba(10,132,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={{
          alignItems: 'center',
          gap: 22,
          opacity: reveal,
          transform: [{ translateY: revealY }, { scale: revealScale }],
        }}
      >
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
      </Animated.View>
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
  sweep: {
    position: 'absolute',
    top: '30%',
    width: '150%',
    height: 180,
    opacity: 0.6,
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
