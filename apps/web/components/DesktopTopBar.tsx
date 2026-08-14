'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/daily': 'Daily Challenge',
  '/progress': 'Progress',
  '/profile': 'Ear Profile',
  '/settings': 'Settings',
  '/play-modes': 'Play Modes',
};

export default function DesktopTopBar() {
  const pathname = usePathname();
  const hidden =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/onboarding');

  const title = useMemo(() => {
    if (routeTitles[pathname]) return routeTitles[pathname];
    const prefixed = Object.keys(routeTitles).find((route) => pathname.startsWith(`${route}/`));
    if (prefixed) return routeTitles[prefixed]!;
    return 'Pitch Therapy';
  }, [pathname]);

  const dateLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  if (hidden) return null;

  return (
    <div className="pt-desktop-topbar-wrap">
      <div className="pt-desktop-topbar">
        <div className="pt-desktop-title">
          <span>{title}</span>
          <span className="pt-desktop-date">{dateLabel}</span>
        </div>
      </div>
    </div>
  );
}
