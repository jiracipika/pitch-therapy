'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

type IconName = 'home' | 'modes' | 'daily' | 'progress' | 'settings';

const iconPaths: Record<IconName, ReactNode> = {
  home: <><path d="M3.5 10.7 12 3.6l8.5 7.1"/><path d="M5.4 9.6v10.1h13.2V9.6M9.2 19.7v-6.2h5.6v6.2"/></>,
  modes: <><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.4"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.4"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.4"/><path d="M14 17.25h6.5M17.25 14v6.5"/></>,
  daily: <><path d="M7 3v3M17 3v3M4 9h16"/><rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="m8.3 14 2.2 2.2 5.2-5.2"/></>,
  progress: <><path d="M4 20V11M10 20V6M16 20v-7M22 20V3"/><path d="m4 8 6-5 6 7 6-8"/></>,
  settings: <><circle cx="12" cy="12" r="3.2"/><path d="M19.3 13.6a7.8 7.8 0 0 0 0-3.2l2-1.5-2-3.4-2.5 1a8.3 8.3 0 0 0-2.8-1.6L13.7 2H10l-.4 2.9a8.3 8.3 0 0 0-2.8 1.6l-2.5-1-2 3.4 2 1.5a7.8 7.8 0 0 0 0 3.2l-2 1.5 2 3.4 2.5-1a8.3 8.3 0 0 0 2.8 1.6l.4 2.9h3.7l.4-2.9a8.3 8.3 0 0 0 2.8-1.6l2.5 1 2-3.4z"/></>,
};

function Icon({ name, active }: { name: IconName; active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

const TABS: { href: string; label: string; kicker: string; icon: IconName }[] = [
  { href: '/dashboard', label: 'Studio', kicker: 'Your session', icon: 'home' },
  { href: '/play-modes', label: 'Exercises', kicker: '18 modes', icon: 'modes' },
  { href: '/daily', label: 'Daily', kicker: 'Fresh drill', icon: 'daily' },
  { href: '/progress', label: 'Insights', kicker: 'Hear growth', icon: 'progress' },
  { href: '/settings', label: 'Settings', kicker: 'Tune the app', icon: 'settings' },
];

export default function Nav() {
  const pathname = usePathname();
  const hideNav = pathname === '/' || pathname.startsWith('/onboarding') || pathname.startsWith('/auth');

  useEffect(() => {
    document.body.classList.toggle('pt-has-nav', !hideNav);
    return () => document.body.classList.remove('pt-has-nav');
  }, [hideNav]);

  if (hideNav) return null;

  return (
    <>
      <nav className="pt-nav-mobile" aria-label="Main navigation">
        {TABS.map((tab) => {
          const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href));
          return (
            <Link key={tab.href} href={tab.href} className={`pt-mobile-nav-item ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon name={tab.icon} active={active} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <aside className="pt-nav-rail" aria-label="Main navigation">
        <Link href="/dashboard" className="pt-rail-brand" aria-label="Pitch Therapy studio home">
          <span className="pt-rail-brand-mark" aria-hidden="true">
            <i /><i /><i /><i /><i />
          </span>
          <span>
            <b className="pt-rail-brand-text">Pitch Therapy</b>
            <small className="pt-rail-brand-sub">LISTENING STUDIO</small>
          </span>
        </Link>

        <div className="pt-rail-session-label">WORKSPACE</div>
        <div className="pt-rail-list">
          {TABS.map((tab, index) => {
            const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href));
            return (
              <Link key={tab.href} href={tab.href} className={`pt-rail-item ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                <span className="pt-rail-index">0{index + 1}</span>
                <span className="pt-rail-icon"><Icon name={tab.icon} active={active} /></span>
                <span className="pt-rail-copy"><b>{tab.label}</b><small>{tab.kicker}</small></span>
              </Link>
            );
          })}
        </div>

        <div className="pt-rail-footer">
          <span className="pt-rail-live"><i /> AUDIO READY</span>
          <small>SHORT SESSIONS.<br />SHARPER EARS.</small>
        </div>
      </aside>
    </>
  );
}
