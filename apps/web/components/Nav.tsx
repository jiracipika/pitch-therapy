'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ── SF Symbol–equivalent SVG icons ── */

function IconHome({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.55 2.533a2.25 2.25 0 0 1 2.9 0l6.75 5.695A2.25 2.25 0 0 1 21 10.03V20.25A1.75 1.75 0 0 1 19.25 22H15.5a.75.75 0 0 1-.75-.75v-5a.75.75 0 0 0-.75-.75h-4a.75.75 0 0 0-.75.75v5a.75.75 0 0 1-.75.75H4.75A1.75 1.75 0 0 1 3 20.25V10.03a2.25 2.25 0 0 1 .8-1.73z" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  );
}

function IconCalendar({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 2a.75.75 0 0 1 .75.75V4h6.5V2.75a.75.75 0 0 1 1.5 0V4h1.5A2.75 2.75 0 0 1 21 6.75v11.5A2.75 2.75 0 0 1 18.25 21H5.75A2.75 2.75 0 0 1 3 18.25V6.75A2.75 2.75 0 0 1 5.75 4h1.5V2.75A.75.75 0 0 1 8 2zm-2.25 7a.25.25 0 0 0-.25.25v9c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-9a.25.25 0 0 0-.25-.25z" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2.5"/>
      <path d="M8 2v3M16 2v3M3 10h18"/>
    </svg>
  );
}

function IconChart({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.25 13A.75.75 0 0 0 5.5 13.75v5.5a.75.75 0 0 0 1.5 0v-5.5A.75.75 0 0 0 6.25 13zM12 8.75a.75.75 0 0 0-1.5 0v10.5a.75.75 0 0 0 1.5 0zM17.75 4a.75.75 0 0 0-1.5 0v15.25a.75.75 0 0 0 1.5 0z" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="12" y1="20" x2="12" y2="9"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
    </svg>
  );
}

function IconGear({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm-5 3.5a5 5 0 1 1 10 0 5 5 0 0 1-10 0z" clipRule="evenodd" />
      <path d="M9.77 2.44a.75.75 0 0 1 .73-.44h3a.75.75 0 0 1 .73.44l.8 1.87c.36.08.72.18 1.06.32l1.78-.9a.75.75 0 0 1 .84.14l2.12 2.12a.75.75 0 0 1 .14.84l-.9 1.78c.14.34.24.7.32 1.06l1.87.8a.75.75 0 0 1 .44.73v3a.75.75 0 0 1-.44.73l-1.87.8c-.08.36-.18.72-.32 1.06l.9 1.78a.75.75 0 0 1-.14.84l-2.12 2.12a.75.75 0 0 1-.84.14l-1.78-.9c-.34.14-.7.24-1.06.32l-.8 1.87a.75.75 0 0 1-.73.44h-3a.75.75 0 0 1-.73-.44l-.8-1.87a8.23 8.23 0 0 1-1.06-.32l-1.78.9a.75.75 0 0 1-.84-.14L3.17 19.3a.75.75 0 0 1-.14-.84l.9-1.78a8.23 8.23 0 0 1-.32-1.06l-1.87-.8A.75.75 0 0 1 1.3 14v-3a.75.75 0 0 1 .44-.73l1.87-.8c.08-.36.18-.72.32-1.06l-.9-1.78a.75.75 0 0 1 .14-.84L5.29 3.67a.75.75 0 0 1 .84-.14l1.78.9c.34-.14.7-.24 1.06-.32z" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

const TABS = [
  { href: '/dashboard', label: 'Home',     Icon: IconHome },
  { href: '/daily',     label: 'Daily',    Icon: IconCalendar },
  { href: '/profile',   label: 'Profile',  Icon: IconChart },
  { href: '/settings',  label: 'Settings', Icon: IconGear },
] as const;

export default function Nav() {
  const pathname = usePathname();

  /* Hide nav on landing, onboarding, and auth pages */
  if (
    pathname === '/' ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/auth')
  ) return null;

  return (
    <nav className="ios-tab-bar">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        const color = active ? 'var(--ios-blue)' : 'var(--ios-label3)';

        return (
          <Link key={href} href={href} className="ios-tab-item" style={{ textDecoration: 'none' }}>
            <span style={{ color, transition: 'color 0.15s ease' }}>
              <Icon filled={active} />
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: active ? 600 : 500,
                letterSpacing: '0.01em',
                color,
                transition: 'color 0.15s ease',
                lineHeight: 1,
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
