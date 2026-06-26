import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout(reducedMotion = false) {
  const { width, height, fontScale } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isDesktop = width >= 1100;
  const prefersRailNav = isDesktop || (isTablet && isLandscape);
  const contentMaxWidth = isDesktop ? 1180 : isTablet ? 980 : 640;
  const pagePadding = isDesktop ? 28 : isTablet ? 22 : 16;
  const compactForLargeText = fontScale >= 1.2;
  const splitColumns = isDesktop ? 3 : isTablet ? 2 : 1;
  const motionProfile = reducedMotion
    ? {
        routeDuration: 120,
        heroDuration: 0,
        ambientA: 0,
        ambientB: 0,
        staggerDelay: 0,
      }
    : isDesktop
      ? {
          routeDuration: 280,
          heroDuration: 6200,
          ambientA: 19000,
          ambientB: 23000,
          staggerDelay: 46,
        }
      : isTablet
        ? {
            routeDuration: 250,
            heroDuration: 5600,
            ambientA: 17000,
            ambientB: 21000,
            staggerDelay: 50,
          }
        : {
            routeDuration: 210,
            heroDuration: 5000,
            ambientA: 14000,
            ambientB: 17000,
            staggerDelay: 56,
          };

  return {
    width,
    height,
    fontScale,
    isLandscape,
    isTablet,
    isDesktop,
    prefersRailNav,
    contentMaxWidth,
    pagePadding: compactForLargeText ? Math.max(12, pagePadding - 2) : pagePadding,
    splitColumns,
    compactForLargeText,
    motionProfile,
  };
}
