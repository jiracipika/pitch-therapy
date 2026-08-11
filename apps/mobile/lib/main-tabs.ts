import { colors } from '@/lib/theme';

export const MAIN_TABS = [
  { label: 'Home', route: '/dashboard', icon: '⌂', color: colors.blue },
  { label: 'Play', route: '/play-modes', icon: '▶', color: colors.green },
  { label: 'Daily', route: '/daily', icon: '◎', color: colors.speedRound },
  { label: 'Progress', route: '/progress', icon: '◒', color: colors.purple },
  { label: 'Settings', route: '/settings', icon: '⚙', color: colors.coral },
] as const;

export type MainTabRoute = (typeof MAIN_TABS)[number]['route'];
