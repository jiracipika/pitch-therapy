'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IconCalendar({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function IconBarChart({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}

function IconSliders({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14"/>
      <line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/>
      <line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/>
      <line x1="9" y1="8" x2="15" y2="8"/>
      <line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  );
}

const NAV = [
  { href: '/dashboard', label: 'Dashboard', Icon: IconHome },
  { href: '/daily', label: 'Daily', Icon: IconCalendar },
  { href: '/progress', label: 'Progress', Icon: IconBarChart },
  { href: '/settings', label: 'Settings', Icon: IconSliders },
];

export default function Nav() {
  const pathname = usePathname();

  if (pathname === '/') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 frosted-nav" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {NAV.map((n) => {
          const isActive = pathname === n.href || pathname.startsWith(n.href + '/');
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`relative flex flex-col items-center gap-1 px-5 py-2 transition-all duration-200 ease-out ${
                isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {isActive && (
                <div
                  className="absolute top-1 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-white"
                  style={{ boxShadow: '0 0 6px rgba(255,255,255,0.5)' }}
                />
              )}
              <span
                className={`transition-transform duration-200 ${isActive ? 'scale-[1.08]' : 'scale-100'}`}
                style={{ marginTop: isActive ? '2px' : '0px' }}
              >
                <n.Icon active={isActive} />
              </span>
              <span
                className="text-[10px] font-medium leading-none tracking-wide"
                style={{ letterSpacing: '0.02em' }}
              >
                {n.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
