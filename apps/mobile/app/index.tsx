import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useReducedMotionPreference } from '@/lib/motion';
import { colors, typography } from '@/lib/theme';

const BARS = [26, 48, 72, 42, 88, 58, 96, 38, 68, 46, 82, 32, 62, 50, 76, 36];

export default function HomeScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotionPreference();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(20)).current;
  const meter = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const calibrateWidth = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const barScales = useRef(BARS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (reducedMotion) {
      fade.setValue(1);
      rise.setValue(0);
      meter.setValue(1);
      logoScale.setValue(1);
      logoRotate.setValue(1);
      titleSlide.setValue(0);
      titleOpacity.setValue(1);
      calibrateWidth.setValue(1);
      glowOpacity.setValue(0.15);
      glowScale.setValue(1);
      barScales.forEach((v) => v.setValue(1));
    } else {
      // Phase 1: Logo entrance + glow burst (0–450ms)
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 12,
          stiffness: 200,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.22,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(glowScale, {
          toValue: 1.15,
          damping: 18,
          stiffness: 120,
          useNativeDriver: true,
        }),
      ]).start();

      // Phase 2: Staggered meter bars (120ms offset from phase 1)
      Animated.stagger(
        35,
        barScales.map((v) =>
          Animated.spring(v, {
            toValue: 1,
            damping: 16,
            stiffness: 200,
            mass: 0.7,
            useNativeDriver: true,
          }),
        ),
      ).start();

      // Phase 3: Hero text reveal (350ms in)
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(titleSlide, {
          toValue: 0,
          damping: 18,
          stiffness: 160,
          useNativeDriver: true,
        }),
      ]).start();

      // Phase 4: Calibration bar sweep (500ms)
      Animated.timing(calibrateWidth, {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Overall container fade + rise
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(rise, { toValue: 0, damping: 18, stiffness: 160, useNativeDriver: true }),
        Animated.timing(meter, {
          toValue: 1,
          duration: 680,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }

    const timeout = setTimeout(() => router.replace('/dashboard'), reducedMotion ? 500 : 1850);
    return () => clearTimeout(timeout);
  }, [
    barScales,
    calibrateWidth,
    fade,
    glowOpacity,
    glowScale,
    logoRotate,
    logoScale,
    meter,
    reducedMotion,
    rise,
    router,
    titleOpacity,
    titleSlide,
  ]);

  const logoRotateDeg = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-12deg', '0deg'],
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.background, '#0C0C11', '#12101A']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', inset: 0 }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.18,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      />

      <Animated.View
        style={{
          flex: 1,
          paddingHorizontal: 28,
          paddingTop: 72,
          paddingBottom: 54,
          justifyContent: 'space-between',
          opacity: fade,
          transform: [{ translateY: rise }],
        }}
      >
        {/* Top row: animated logo + status */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Animated.View
            style={{
              width: 58,
              height: 58,
              backgroundColor: colors.signal,
              borderWidth: 1,
              borderColor: colors.cream,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.coral,
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.32,
              shadowRadius: 8,
              elevation: 5,
              transform: [{ scale: logoScale }, { rotate: logoRotateDeg }],
            }}
          >
            <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '900', letterSpacing: -1 }}>
              PT
            </Text>
          </Animated.View>
          {/* Ambient glow that bursts on entrance */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: -8,
              top: -8,
              width: 74,
              height: 74,
              borderRadius: 999,
              backgroundColor: colors.signal,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            }}
          />
          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            <Text style={{ color: colors.signal, ...typography.caption2, letterSpacing: 1.2 }}>
              LISTENING STUDIO
            </Text>
            <Text style={{ color: colors.textTertiary, ...typography.caption2 }}>
              LIVE INPUT / A4
            </Text>
          </View>
        </View>

        {/* Hero text with spring slide-in */}
        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleSlide }] }}>
          <Text style={{ color: colors.signal, ...typography.caption1, letterSpacing: 1.4, marginBottom: 16 }}>
            EAR TRAINING, RECOMPOSED
          </Text>
          <Text style={{ color: colors.text, fontSize: 62, fontWeight: '900', lineHeight: 57, letterSpacing: -4.2 }}>
            Hear what{`\n`}others miss.
          </Text>
          <Text style={{ color: colors.textSecondary, ...typography.body, marginTop: 20, maxWidth: 330 }}>
            A sharper musical ear through focused drills for pitch, intervals, frequency, and memory.
          </Text>

          {/* Staggered animated meter bars */}
          <View style={{ height: 112, marginTop: 42, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {BARS.map((height, index) => {
              const barScale = barScales[index];
              return (
                <Animated.View
                  key={`${height}-${index}`}
                  style={{
                    flex: 1,
                    height: `${height}%`,
                    backgroundColor: index % 3 === 0 ? colors.coral : colors.signal,
                    transform: [{ scaleY: barScale }],
                    transformOrigin: 'center',
                  }}
                />
              );
            })}
          </View>
        </Animated.View>

        {/* Calibration bar with animated sweep fill */}
        <View style={{ borderTopWidth: 1, borderTopColor: colors.borderStrong, paddingTop: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: colors.textTertiary, ...typography.caption2, letterSpacing: 1 }}>
              SIGNAL LOCKED
            </Text>
            <Animated.Text
              style={{
                color: colors.signal,
                ...typography.caption2,
                opacity: calibrateWidth,
              }}
            >
              440.0 HZ
            </Animated.Text>
          </View>
          <View style={{ height: 4, backgroundColor: colors.surfaceElevated, overflow: 'hidden' }}>
            <Animated.View
              style={{
                height: '100%',
                width: '100%',
                backgroundColor: colors.coral,
                transform: [{ scaleX: calibrateWidth }],
                transformOrigin: 'left',
              }}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
