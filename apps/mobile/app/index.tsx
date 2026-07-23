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
  const rise = useRef(new Animated.Value(16)).current;
  const meter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      fade.setValue(1);
      rise.setValue(0);
      meter.setValue(1);
    } else {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(rise, { toValue: 0, damping: 18, stiffness: 160, useNativeDriver: true }),
        Animated.timing(meter, { toValue: 1, duration: 680, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }

    const timeout = setTimeout(() => router.replace('/dashboard'), reducedMotion ? 500 : 1450);
    return () => clearTimeout(timeout);
  }, [fade, meter, reducedMotion, rise, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.background, '#151B11', colors.ink]}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View
            style={{
              width: 58,
              height: 58,
              backgroundColor: colors.signal,
              borderWidth: 1,
              borderColor: colors.cream,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `5px 5px 0 ${colors.coral}`,
            }}
          >
            <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '900', letterSpacing: -1 }}>PT</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            <Text style={{ color: colors.signal, ...typography.caption2, letterSpacing: 1.2 }}>SYSTEM ONLINE</Text>
            <Text style={{ color: colors.textTertiary, ...typography.caption2 }}>AUDIO / INPUT 01</Text>
          </View>
        </View>

        <View>
          <Text style={{ color: colors.signal, ...typography.caption1, letterSpacing: 1.4, marginBottom: 16 }}>
            LIVE EAR TRAINING SYSTEM
          </Text>
          <Text style={{ color: colors.text, fontSize: 62, fontWeight: '900', lineHeight: 57, letterSpacing: -4.2 }}>
            Hear it.{`\n`}Lock it in.
          </Text>
          <Text style={{ color: colors.textSecondary, ...typography.body, marginTop: 20, maxWidth: 330 }}>
            Precision practice for pitch, frequency, intervals, and musical memory.
          </Text>

          <View style={{ height: 112, marginTop: 42, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {BARS.map((height, index) => (
              <Animated.View
                key={`${height}-${index}`}
                style={{
                  flex: 1,
                  height: `${height}%`,
                  backgroundColor: colors.signal,
                  transform: [{ scaleY: meter }],
                  transformOrigin: 'center',
                }}
              />
            ))}
          </View>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: colors.borderStrong, paddingTop: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: colors.textTertiary, ...typography.caption2, letterSpacing: 1 }}>CALIBRATING</Text>
            <Text style={{ color: colors.signal, ...typography.caption2 }}>440.0 HZ</Text>
          </View>
          <View style={{ height: 4, backgroundColor: colors.surfaceElevated, overflow: 'hidden' }}>
            <Animated.View
              style={{
                height: '100%',
                width: '100%',
                backgroundColor: colors.coral,
                transform: [{ scaleX: meter }],
                transformOrigin: 'left',
              }}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
