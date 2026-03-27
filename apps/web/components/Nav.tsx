'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/daily', label: 'Daily', icon: '📅' },
  { href: '/progress', label: 'Progress', icon: '📊' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Nav() {
  const pathname = usePathname();

  // Don't show nav on landing page
  if (pathname === '/') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 frosted-nav">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2 px-4">
        {NAV.map((n) => {
          const isActive = pathname === n.href || pathname.startsWith(n.href + '/');
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 text-xs transition-all duration-300 ease-out ${
                isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className={`text-lg transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>{n.icon}</span>
              <span className={`font-medium ${isActive ? 'text-white' : ''}`}>{n.label}</span>
              {isActive && <div className="absolute -top-px h-0.5 w-8 rounded-full bg-white" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
