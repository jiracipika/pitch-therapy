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
  };
}
