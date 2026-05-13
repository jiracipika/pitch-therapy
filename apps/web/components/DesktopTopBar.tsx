'use client';

import Link from 'next/link';
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

const quickLinks = [
  { href: '/dashboard', label: 'Home', icon: '⌂' },
  { href: '/play-modes', label: 'Modes', icon: '◫' },
  { href: '/daily', label: 'Daily', icon: '◷' },
  { href: '/progress', label: 'Stats', icon: '▥' },
] as const;

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
        <div className="pt-desktop-actions">
          {quickLinks.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="pt-desktop-action"
                style={{
                  borderColor: active ? 'rgba(10,132,255,0.45)' : 'rgba(255,255,255,0.08)',
                  background: active ? 'rgba(10,132,255,0.16)' : 'rgba(255,255,255,0.03)',
                  color: active ? 'var(--ios-blue)' : 'var(--ios-label2)',
                }}
              >
                <span className="pt-desktop-action-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

