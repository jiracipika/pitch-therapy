export const MAIN_TABS = [
  { label: 'Home', route: '/dashboard', icon: '◈' },
  { label: 'Play', route: '/play-modes', icon: '▶' },
  { label: 'Daily', route: '/daily', icon: '◎' },
  { label: 'Progress', route: '/progress', icon: '◔' },
  { label: 'Settings', route: '/settings', icon: '⚙︎' },
] as const;

export type MainTabRoute = (typeof MAIN_TABS)[number]['route'];
