import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isDesktop = width >= 1100;
  const prefersRailNav = isDesktop || (isTablet && isLandscape);
  const contentMaxWidth = isDesktop ? 1180 : isTablet ? 980 : 640;
  const pagePadding = isDesktop ? 28 : isTablet ? 22 : 16;
  const splitColumns = isDesktop ? 3 : isTablet ? 2 : 1;
  const motionProfile = isDesktop
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
    isLandscape,
    isTablet,
    isDesktop,
    prefersRailNav,
    contentMaxWidth,
    pagePadding,
    splitColumns,
    motionProfile,
  };
}
