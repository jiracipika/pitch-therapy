import { useEffect, useRef } from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotionPreference } from '@/lib/motion';
import { colors } from '@/lib/theme';

// ─── SkeletonBlock ───────────────────────────────────────────────────────────
// A single shimmering placeholder block. Pulses opacity when motion is allowed,
// static dim fill when reduced-motion is active.

interface SkeletonBlockProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

function SkeletonBlock({ width = '100%', height = 14, borderRadius = 4, style }: SkeletonBlockProps) {
  const reducedMotion = useReducedMotionPreference();
  const opacity = useRef(new Animated.Value(0.38)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(0.38);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.72,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.38,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: colors.surfaceElevated,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── SkeletonCard ────────────────────────────────────────────────────────────
// A card-shaped skeleton that mimics the GlassCard layout.

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <View style={{ gap: 10, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <SkeletonBlock width={44} height={44} borderRadius={6} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBlock width="60%" height={16} />
          <SkeletonBlock width="85%" height={12} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} width={i === lines - 1 ? '70%' : '100%'} height={12} />
      ))}
    </View>
  );
}

// ─── SkeletonStatGrid ────────────────────────────────────────────────────────
// A 2x2 stat card skeleton grid.

export function SkeletonStatGrid() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            minWidth: '47%',
            padding: 14,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 8,
          }}
        >
          <SkeletonBlock width={40} height={28} borderRadius={4} />
          <SkeletonBlock width="50%" height={11} />
        </View>
      ))}
    </View>
  );
}

// ─── SkeletonList ────────────────────────────────────────────────────────────
// A list-style skeleton for mode lists, recent results, etc.

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            padding: 13,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <SkeletonBlock width={38} height={38} borderRadius={6} />
          <View style={{ flex: 1, gap: 5 }}>
            <SkeletonBlock width="40%" height={14} />
            <SkeletonBlock width="65%" height={11} />
          </View>
          <SkeletonBlock width={36} height={16} />
        </View>
      ))}
    </View>
  );
}

export { SkeletonBlock };
