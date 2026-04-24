export const MAIN_TABS = [
  { label: 'Home', route: '/dashboard', icon: '⌂', color: '#38BDF8' },
  { label: 'Play', route: '/play-modes', icon: '▶', color: '#4ADE80' },
  { label: 'Daily', route: '/daily', icon: '◎', color: '#FBBF24' },
  { label: 'Progress', route: '/progress', icon: '◒', color: '#A78BFA' },
  { label: 'Settings', route: '/settings', icon: '⚙', color: '#FB7185' },
] as const;

export type MainTabRoute = (typeof MAIN_TABS)[number]['route'];
