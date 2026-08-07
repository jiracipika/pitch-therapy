import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View, type TextProps, type ViewStyle } from 'react-native';
import { useAppSettings } from '@/lib/settings';

// ─── Reduced-motion hooks ───────────────────────────────────────────────────

export function useSystemReduceMotion() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) {
          setEnabled(value);
        }
      })
      .catch(() => {
        if (active) {
          setEnabled(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      setEnabled(value);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}

export function useReducedMotionPreference() {
  const systemReduceMotion = useSystemReduceMotion();
  const { glassMode } = useAppSettings();
  return systemReduceMotion || glassMode === 'reduced';
}

// ─── AnimatedCounter ────────────────────────────────────────────────────────
//
// Counts up from 0 to `value` on mount using a spring-eased animation.
// Renders plain text when reduced-motion is active (instant value, no animation).
// Supports integers and percentages (suffix).

interface AnimatedCounterProps extends Omit<TextProps, 'style'> {
  value: number;
  /** Duration in ms (default 900). */
  duration?: number;
  /** Suffix appended after the number, e.g. '%' or 'd'. */
  suffix?: string;
  /** Prefix prepended before the number, e.g. '▲ '. */
  prefix?: string;
  /** Number of decimal places (default 0). */
  decimals?: number;
  /** Style for the text. */
  style?: TextProps['style'];
}

export function AnimatedCounter({
  value,
  duration = 900,
  suffix = '',
  prefix = '',
  decimals = 0,
  style,
  ...textProps
}: AnimatedCounterProps): React.ReactElement {
  const reducedMotion = useReducedMotionPreference();
  const display = useCountUp(value, { duration, enabled: !reducedMotion });
  const formatted = prefix + display.toFixed(decimals) + suffix;

  return (
    <Text style={style} {...textProps}>
      {formatted}
    </Text>
  );
}

// ─── useCountUp hook ────────────────────────────────────────────────────────

interface CountUpOptions {
  duration?: number;
  enabled?: boolean;
}

export function useCountUp(
  target: number,
  { duration = 900, enabled = true }: CountUpOptions = {},
) {
  const [display, setDisplay] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled || target === 0) {
      setDisplay(target);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (target - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);

  return display;
}

// ─── AnimatedProgressBar ────────────────────────────────────────────────────
//
// Animated fill bar: animates width from 0 to `progress` (0-1) on mount.
// Collapses to static fill when reduced-motion is active.

interface AnimatedProgressBarProps {
  /** Fill fraction 0..1. */
  progress: number;
  color: string;
  trackColor?: string;
  height?: number;
  duration?: number;
  style?: ViewStyle;
}

export function AnimatedProgressBar({
  progress,
  color,
  trackColor,
  height = 7,
  duration = 800,
  style,
}: AnimatedProgressBarProps) {
  const reducedMotion = useReducedMotionPreference();
  const fill = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    if (reducedMotion) {
      fill.setValue(clamped);
      return;
    }
    Animated.timing(fill, {
      toValue: clamped,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [clamped, duration, fill, reducedMotion]);

  return (
    <View
      style={[
        {
          height,
          borderRadius: 999,
          backgroundColor: trackColor ?? 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: '100%',
          width: '100%',
          borderRadius: 999,
          backgroundColor: color,
          transform: [{ scaleX: fill }],
          transformOrigin: 'left',
        }}
      />
    </View>
  );
}
