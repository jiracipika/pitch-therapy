import { Children, type ReactNode, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, PanResponder, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedTabBar } from '@/components/AnimatedTabBar';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { MAIN_TABS } from '@/lib/main-tabs';
import { colors, typography } from '@/lib/theme';
import { useResponsiveLayout } from '@/lib/responsive';
import { useAppSettings } from '@/lib/settings';
import { useReducedMotionPreference } from '@/lib/motion';

interface AppPageProps {
  title: string;
  subtitle?: string;
  showSwipeHint?: boolean;
  heroVariant?: 'dashboard' | 'daily' | 'progress' | 'settings' | 'play';
  heroHint?: string;
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}

function getHeroSpec(variant: NonNullable<AppPageProps['heroVariant']>) {
  switch (variant) {
    case 'dashboard':
      return {
        gradient: ['rgba(199,255,74,0.16)', 'rgba(155,140,255,0.10)', 'rgba(5,5,7,0.98)'] as const,
        ribbonA: ['rgba(199,255,74,0)', 'rgba(199,255,74,0.16)', 'rgba(199,255,74,0)'] as const,
        ribbonB: ['rgba(155,140,255,0)', 'rgba(155,140,255,0.13)', 'rgba(155,140,255,0)'] as const,
      };
    case 'daily':
      return {
        gradient: ['rgba(98,230,167,0.16)', 'rgba(199,255,74,0.08)', 'rgba(5,5,7,0.98)'] as const,
        ribbonA: ['rgba(98,230,167,0)', 'rgba(98,230,167,0.15)', 'rgba(98,230,167,0)'] as const,
        ribbonB: ['rgba(255,122,89,0)', 'rgba(255,122,89,0.12)', 'rgba(255,122,89,0)'] as const,
      };
    case 'play':
      return {
        gradient: ['rgba(199,255,74,0.15)', 'rgba(102,220,255,0.08)', 'rgba(5,5,7,0.98)'] as const,
        ribbonA: ['rgba(199,255,74,0)', 'rgba(199,255,74,0.14)', 'rgba(199,255,74,0)'] as const,
        ribbonB: ['rgba(102,220,255,0)', 'rgba(102,220,255,0.12)', 'rgba(102,220,255,0)'] as const,
      };
    case 'progress':
      return {
        gradient: ['rgba(155,140,255,0.17)', 'rgba(199,255,74,0.07)', 'rgba(5,5,7,0.98)'] as const,
        ribbonA: ['rgba(155,140,255,0)', 'rgba(155,140,255,0.14)', 'rgba(155,140,255,0)'] as const,
        ribbonB: ['rgba(199,255,74,0)', 'rgba(199,255,74,0.10)', 'rgba(199,255,74,0)'] as const,
      };
    case 'settings':
      return {
        gradient: ['rgba(255,122,89,0.17)', 'rgba(199,255,74,0.06)', 'rgba(5,5,7,0.98)'] as const,
        ribbonA: ['rgba(255,122,89,0)', 'rgba(255,122,89,0.14)', 'rgba(255,122,89,0)'] as const,
        ribbonB: ['rgba(199,255,74,0)', 'rgba(199,255,74,0.09)', 'rgba(199,255,74,0)'] as const,
      };
    default:
      return {
        gradient: ['rgba(199,255,74,0.12)', 'rgba(247,246,242,0.04)', 'rgba(5,5,7,0.98)'] as const,
        ribbonA: ['rgba(199,255,74,0)', 'rgba(199,255,74,0.12)', 'rgba(199,255,74,0)'] as const,
        ribbonB: ['rgba(255,122,89,0)', 'rgba(255,122,89,0.10)', 'rgba(255,122,89,0)'] as const,
      };
  }
}

function reduceRgbaAlpha(value: string, alpha: string) {
  return value.replace(/,\s*0\.\d+\)$/, `,${alpha})`);
}

// ─── Swipe constants ─────────────────────────────────────────────────────────

/** Distance (px) the finger must travel to trigger a tab switch — 20% of screen width. */
const SWIPE_THRESHOLD_RATIO = 0.20;
/** Maximum translateX for live drag feedback, prevents over-dragging (px). */
const MAX_DRAG_DISTANCE = 140;
/** Horizontal-to-vertical ratio required to claim the gesture as a horizontal swipe. */
const HORIZONTAL_DOMINANCE = 1.6;
/** Minimum horizontal movement before we start caring about the gesture (px). */
const CLAIM_THRESHOLD = 14;

export function AppPage({
  title,
  subtitle,
  showSwipeHint = false,
  heroVariant = 'dashboard',
  heroHint,
  children,
  onRefresh,
  refreshing = false,
}: AppPageProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();
  const reducedMotion = useReducedMotionPreference();
  const { contentMaxWidth, pagePadding, prefersRailNav, isDesktop, motionProfile } = useResponsiveLayout(reducedMotion);
  const { glassMode } = useAppSettings();
  const reducedGlass = glassMode === 'reduced';

  // ── Animation values ──
  const opacity = useRef(new Animated.Value(0)).current;
  const enterTranslate = useRef(new Animated.Value(0)).current;
  const dragTranslate = useRef(new Animated.Value(0)).current;     // live drag offset
  const dragScale = useRef(new Animated.Value(1)).current;          // subtle scale during drag
  const ambientShiftA = useRef(new Animated.Value(0)).current;
  const ambientShiftB = useRef(new Animated.Value(0)).current;
  const heroShift = useRef(new Animated.Value(0)).current;
  const childAnimationsRef = useRef<Animated.Value[]>([]);

  // ── Navigation tracking ──
  const previousIndex = useRef<number | null>(null);
  const lastDirection = useRef<1 | -1 | 0>(0);     // tracks swipe direction for enter animation
  const isNavigating = useRef(false);               // lock during exit animation
  const childArray = useMemo(() => Children.toArray(children), [children]);

  if (childAnimationsRef.current.length !== childArray.length) {
    childAnimationsRef.current = childArray.map(
      (_, index) => childAnimationsRef.current[index] ?? new Animated.Value(0),
    );
  }

  const activeIndex = MAIN_TABS.findIndex((tab) => tab.route === pathname);
  const canSwipeTabs = activeIndex >= 0 && !prefersRailNav && !reducedMotion;
  const swipeThreshold = width * SWIPE_THRESHOLD_RATIO;

  // ── PanResponder: live drag + snap-back/commit ──
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (!canSwipeTabs || isNavigating.current) return false;
          // Don't claim gestures that start too close to the screen edge
          // (those are iOS back-gesture territory)
          if (gestureState.x0 < 24 || gestureState.x0 > width - 24) return false;
          const dx = Math.abs(gestureState.dx);
          const dy = Math.abs(gestureState.dy);
          // Need enough movement to distinguish from a tap
          if (dx < CLAIM_THRESHOLD) return false;
          // Must be clearly horizontal — strict ratio avoids stealing scroll gestures
          return dx > dy * HORIZONTAL_DOMINANCE;
        },

        onPanResponderMove: (_, gestureState) => {
          // Resist at edges (can't swipe past the first/last tab)
          let rawDx = gestureState.dx;
          if (activeIndex === 0 && rawDx > 0) {
            // Swiping right on the leftmost tab — rubber-band
            rawDx = rawDx * 0.3;
          }
          if (activeIndex === MAIN_TABS.length - 1 && rawDx < 0) {
            // Swiping left on the rightmost tab — rubber-band
            rawDx = rawDx * 0.3;
          }
          // Clamp to max drag distance
          const clamped = Math.max(-MAX_DRAG_DISTANCE, Math.min(MAX_DRAG_DISTANCE, rawDx));
          dragTranslate.setValue(clamped);

          // Subtle scale-down as you drag (depth effect)
          const dragRatio = Math.min(Math.abs(clamped) / MAX_DRAG_DISTANCE, 1);
          dragScale.setValue(1 - dragRatio * 0.04);

          // Fade slightly during drag
          opacity.setValue(1 - dragRatio * 0.25);
        },

        onPanResponderRelease: (_, gestureState) => {
          const dx = gestureState.dx;
          const vx = gestureState.vx;
          const distance = Math.abs(dx);
          const fastFlick = Math.abs(vx) > 0.6;

          // Trigger if: traveled past threshold OR a fast flick past half-threshold
          const shouldCommit = distance > swipeThreshold || (fastFlick && distance > swipeThreshold * 0.4);

          if (shouldCommit) {
            const targetIndex = dx < 0 ? activeIndex + 1 : activeIndex - 1;
            const targetTab = MAIN_TABS[targetIndex];
            if (!targetTab) {
              // Rubber-banded past edge — snap back
              snapBack();
              return;
            }

            // Lock and animate the exit
            isNavigating.current = true;
            const exitDirection = dx < 0 ? -1 : 1;
            lastDirection.current = exitDirection as 1 | -1;

            const exitDistance = width;
            Animated.parallel([
              Animated.timing(dragTranslate, {
                toValue: exitDirection * exitDistance,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
              }),
              Animated.timing(dragScale, {
                toValue: 0.92,
                duration: 220,
                useNativeDriver: true,
              }),
            ]).start(() => {
              void triggerSelectionHaptic();
              router.replace(targetTab.route as Href);
              // Reset isNavigating on next tick (new screen mounts)
              setTimeout(() => { isNavigating.current = false; }, 50);
            });
          } else {
            snapBack();
          }
        },

        onPanResponderTerminate: () => {
          snapBack();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIndex, canSwipeTabs, router, width, swipeThreshold],
  );

  function snapBack() {
    Animated.parallel([
      Animated.spring(dragTranslate, {
        toValue: 0,
        useNativeDriver: true,
        stiffness: 320,
        damping: 28,
        mass: 0.8,
      }),
      Animated.spring(dragScale, {
        toValue: 1,
        useNativeDriver: true,
        stiffness: 320,
        damping: 28,
        mass: 0.8,
      }),
      Animated.spring(opacity, {
        toValue: 1,
        useNativeDriver: true,
        stiffness: 320,
        damping: 28,
        mass: 0.8,
      }),
    ]).start();
  }

  // ── Enter animation when route changes ──
  useEffect(() => {
    const direction =
      previousIndex.current === null || activeIndex < 0 || previousIndex.current < 0
        ? 0
        : activeIndex > previousIndex.current
          ? 1
          : -1;

    // If the swipe handler already set a direction, use that for consistency
    const effectiveDirection = lastDirection.current || direction;

    // Reset drag state (fresh screen)
    dragTranslate.setValue(0);
    dragScale.setValue(1);
    opacity.setValue(0);
    enterTranslate.setValue(effectiveDirection * 28);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motionProfile.routeDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(enterTranslate, {
        toValue: 0,
        useNativeDriver: true,
        stiffness: 260,
        damping: 26,
        mass: 0.85,
      }),
    ]).start();

    previousIndex.current = activeIndex;
    lastDirection.current = 0;
  }, [activeIndex, motionProfile.routeDuration, opacity, enterTranslate, dragTranslate, dragScale]);

  // ── Ambient ribbons ──
  useEffect(() => {
    if (reducedMotion) {
      ambientShiftA.setValue(0.5);
      ambientShiftB.setValue(0.5);
      return;
    }

    const loopA = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientShiftA, {
          toValue: 1,
          duration: motionProfile.ambientA,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ambientShiftA, {
          toValue: 0,
          duration: motionProfile.ambientA,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const loopB = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientShiftB, {
          toValue: 1,
          duration: motionProfile.ambientB,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ambientShiftB, {
          toValue: 0,
          duration: motionProfile.ambientB,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loopA.start();
    loopB.start();
    return () => {
      loopA.stop();
      loopB.stop();
    };
  }, [ambientShiftA, ambientShiftB, motionProfile.ambientA, motionProfile.ambientB, reducedMotion]);

  // ── Hero parallax ──
  useEffect(() => {
    if (reducedMotion) {
      heroShift.setValue(0.5);
      return;
    }

    const heroLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroShift, {
          toValue: 1,
          duration: motionProfile.heroDuration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heroShift, {
          toValue: 0,
          duration: motionProfile.heroDuration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    heroLoop.start();
    return () => heroLoop.stop();
  }, [heroShift, motionProfile.heroDuration, reducedMotion]);

  // ── Child stagger ──
  useEffect(() => {
    if (reducedMotion) {
      childAnimationsRef.current.forEach((value) => value.setValue(1));
      return;
    }

    childAnimationsRef.current.forEach((value) => value.setValue(0));
    const stagger = Animated.stagger(
      motionProfile.staggerDelay,
      childAnimationsRef.current.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    );
    stagger.start();
  }, [childArray.length, motionProfile.staggerDelay, pathname, reducedMotion]);

  // ── Derived interpolations ──
  const ambientTranslateAX = ambientShiftA.interpolate({
    inputRange: [0, 1],
    outputRange: [-48, 48],
  });
  const ambientTranslateBX = ambientShiftB.interpolate({
    inputRange: [0, 1],
    outputRange: [40, -40],
  });
  const heroTranslateX = heroShift.interpolate({
    inputRange: [0, 1],
    outputRange:
      heroVariant === 'progress'
        ? [-18, 18]
        : heroVariant === 'settings'
          ? [-10, 10]
          : heroVariant === 'play'
            ? [-12, 16]
          : [-14, 14],
  });
  const heroTranslateY = heroShift.interpolate({
    inputRange: [0, 1],
    outputRange:
      heroVariant === 'daily'
        ? [-8, 8]
        : heroVariant === 'play'
          ? [3, -9]
        : heroVariant === 'dashboard'
          ? [0, -7]
          : [0, -5],
  });
  const heroScale = heroShift.interpolate({
    inputRange: [0, 1],
    outputRange:
      heroVariant === 'settings'
        ? [0.995, 1.005]
        : [0.985, 1.015],
  });
  const heroSpec = getHeroSpec(heroVariant);

  // Combined translate: enter offset + live drag
  const contentTranslate = Animated.add(enterTranslate, dragTranslate);

  // Accessibility actions for VoiceOver: swipe up/down to cycle tabs
  const accessibilityActions = useMemo(
    () =>
      canSwipeTabs
        ? [
            { name: 'increment', label: 'Next tab' },
            { name: 'decrement', label: 'Previous tab' },
          ]
        : undefined,
    [canSwipeTabs],
  );

  const handleAccessibilityAction = useMemo(
    () =>
      canSwipeTabs
        ? (event: { nativeEvent: { actionName: string } }) => {
            if (event.nativeEvent.actionName === 'increment' && activeIndex < MAIN_TABS.length - 1) {
              void triggerSelectionHaptic();
              router.replace(MAIN_TABS[activeIndex + 1].route as Href);
            } else if (event.nativeEvent.actionName === 'decrement' && activeIndex > 0) {
              void triggerSelectionHaptic();
              router.replace(MAIN_TABS[activeIndex - 1].route as Href);
            }
          }
        : undefined,
    [canSwipeTabs, activeIndex, router],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.background, '#0C0C11', '#12101A']}
        locations={[0, 0.52, 1]}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          width: width * 1.4,
          height: reducedGlass ? 132 : 180,
          top: 76,
          left: -width * 0.2,
          transform: [{ translateX: ambientTranslateAX }, { rotate: '-4deg' }],
          opacity: reducedGlass ? 0.28 : 0.62,
        }}
      >
        <LinearGradient
          colors={heroSpec.ribbonA}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          width: width * 1.28,
          height: reducedGlass ? 118 : 160,
          top: 174,
          left: -width * 0.14,
          transform: [{ translateX: ambientTranslateBX }, { rotate: '3deg' }],
          opacity: reducedGlass ? 0.24 : 0.55,
        }}
      >
        <LinearGradient
          colors={heroSpec.ribbonB}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <View style={{ flex: 1, flexDirection: prefersRailNav ? 'row' : 'column' }}>
        {prefersRailNav ? (
          <View
            style={{
              width: isDesktop ? 116 : 96,
              borderRightWidth: 1,
              borderRightColor: colors.divider,
              paddingTop: insets.top + 14,
              paddingBottom: insets.bottom + 12,
              paddingHorizontal: 8,
              gap: 12,
              backgroundColor: 'rgba(12,12,17,0.96)',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: colors.textSecondary, ...typography.caption1, fontWeight: '800' }}>PT</Text>
            </View>
            {MAIN_TABS.map((tab) => {
              const active = pathname === tab.route || (pathname === '/' && tab.route === '/dashboard');
              return (
                <View key={tab.route} style={{ alignItems: 'center' }}>
                  <Pressable
                    onPress={() => {
                      if (!active) {
                        void triggerSelectionHaptic();
                        router.replace(tab.route as Href);
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${tab.label}`}
                    accessibilityState={{ selected: active }}
                    style={{
                      width: 64,
                      minHeight: 48,
                      paddingVertical: 10,
                      borderRadius: 4,
                      backgroundColor: active ? tab.color + '24' : 'transparent',
                      borderWidth: 1,
                      borderColor: active ? tab.color + '66' : 'transparent',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: active ? colors.text : colors.textSecondary }}>{tab.icon}</Text>
                  </Pressable>
                  <Text style={{ color: active ? colors.text : colors.textTertiary, ...typography.caption2, marginTop: 4 }}>
                    {tab.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <Animated.View
          // Accessibility: VoiceOver users can navigate tabs with custom actions
          accessibilityActions={accessibilityActions}
          onAccessibilityAction={handleAccessibilityAction}
          style={{
            flex: 1,
            opacity,
            transform: [{ translateX: contentTranslate }, { scale: dragScale }],
          }}
          {...(canSwipeTabs ? panResponder.panHandlers : {})}
        >
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: insets.top + 18,
              paddingHorizontal: pagePadding,
              paddingBottom: insets.bottom + (prefersRailNav ? 28 : 120),
            }}
            scrollEventThrottle={16}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.signal}
                  colors={[colors.signal]}
                  progressBackgroundColor={colors.surfaceElevated}
                />
              ) : undefined
            }
          >
            <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 18 }}>
              <LinearGradient
                colors={
                  reducedGlass
                    ? [reduceRgbaAlpha(heroSpec.gradient[0], '0.12'), 'rgba(12,12,17,0.90)', 'rgba(255,255,255,0.015)']
                    : heroSpec.gradient
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  paddingHorizontal: 17,
                  paddingVertical: 16,
                  borderWidth: 1,
                  borderColor: reducedGlass ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.13)',
                  gap: 7,
                  overflow: 'hidden',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: reducedGlass ? 0.22 : 0.32,
                  shadowRadius: 14,
                  elevation: reducedGlass ? 4 : 7,
                }}
              >
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: 180,
                    height: 180,
                    borderRadius: 180,
                    top: -80,
                    right: -40,
                    opacity: reducedMotion ? 0.2 : 0.4,
                    backgroundColor: reducedGlass ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.08)',
                    transform: [{ translateX: heroTranslateX }, { translateY: heroTranslateY }, { scale: heroScale }],
                  }}
                />
                <Text style={{ color: colors.text, ...typography.title1 }}>{title}</Text>
                {subtitle ? (
                  <Text style={{ color: colors.textSecondary, ...typography.subhead, lineHeight: 21 }}>
                    {subtitle}
                  </Text>
                ) : null}
                {heroHint ? (
                  <Text style={{ color: colors.textTertiary, ...typography.caption1 }}>
                    {heroHint}
                  </Text>
                ) : null}
                {showSwipeHint && canSwipeTabs ? (
                  <Text style={{ color: colors.textTertiary, ...typography.caption1 }}>
                    Swipe left or right to move between sections
                  </Text>
                ) : null}
              </LinearGradient>
              {childArray.map((child, index) => {
                const animatedValue = childAnimationsRef.current[index];
                const translateY = animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                });
                const scale = animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.985, 1],
                });
                return (
                  <Animated.View
                    key={`section-${index}`}
                    style={{
                      opacity: animatedValue,
                      transform: [{ translateY }, { scale }],
                    }}
                  >
                    {child}
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
      {!prefersRailNav ? <AnimatedTabBar /> : null}
    </View>
  );
}
