import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedTabBar } from '@/components/AnimatedTabBar';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { MAIN_TABS } from '@/lib/main-tabs';
import { colors, typography } from '@/lib/theme';

interface AppPageProps {
  title: string;
  subtitle?: string;
  showSwipeHint?: boolean;
  children: ReactNode;
}

export function AppPage({ title, subtitle, showSwipeHint = false, children }: AppPageProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const previousIndex = useRef<number | null>(null);

  const activeIndex = MAIN_TABS.findIndex((tab) => tab.route === pathname);
  const canSwipeTabs = activeIndex >= 0;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (!canSwipeTabs) return false;
          const awayFromBackGestureEdge = gestureState.x0 > 28 && gestureState.x0 < width - 28;
          if (!awayFromBackGestureEdge) return false;
          const dx = Math.abs(gestureState.dx);
          const dy = Math.abs(gestureState.dy);
          return dx > 20 && dx > dy * 1.2;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (!canSwipeTabs) return;
          const trigger = Math.abs(gestureState.dx) > 72 && Math.abs(gestureState.vx) > 0.12;
          if (!trigger) return;

          const targetIndex = gestureState.dx < 0 ? activeIndex + 1 : activeIndex - 1;
          const targetTab = MAIN_TABS[targetIndex];
          if (!targetTab) return;
          void triggerSelectionHaptic();
          router.replace(targetTab.route as Href);
        },
      }),
    [activeIndex, canSwipeTabs, router, width],
  );

  useEffect(() => {
    const direction =
      previousIndex.current === null || activeIndex < 0 || previousIndex.current < 0
        ? 0
        : activeIndex > previousIndex.current
          ? 1
          : -1;

    opacity.setValue(0);
    translateX.setValue(direction * 24);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        stiffness: 220,
        damping: 24,
        mass: 0.8,
      }),
    ]).start();

    previousIndex.current = activeIndex;
  }, [activeIndex, opacity, translateX]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={['#10131A', '#08090D', '#0E1016']}
        locations={[0, 0.48, 1]}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 130,
          backgroundColor: 'rgba(56,189,248,0.08)',
        }}
      />
      <Animated.View
        style={{ flex: 1, opacity, transform: [{ translateX }] }}
        {...(canSwipeTabs ? panResponder.panHandlers : {})}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: insets.top + 18,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 120,
            gap: 18,
          }}
        >
          <View style={{ gap: 7 }}>
            <Text style={{ color: colors.text, ...typography.title1 }}>{title}</Text>
            {subtitle ? (
              <Text style={{ color: colors.textSecondary, ...typography.subhead, lineHeight: 21 }}>
                {subtitle}
              </Text>
            ) : null}
            {showSwipeHint && canSwipeTabs ? (
              <Text style={{ color: colors.textTertiary, ...typography.caption1 }}>
                Swipe left or right to move between sections
              </Text>
            ) : null}
          </View>
          {children}
        </ScrollView>
      </Animated.View>
      <AnimatedTabBar />
    </View>
  );
}
