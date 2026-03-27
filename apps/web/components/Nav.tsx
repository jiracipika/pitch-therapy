'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Home', icon: '🎵' },
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/daily', label: 'Daily', icon: '📅' },
  { href: '/progress', label: 'Progress', icon: '📊' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
              pathname === n.href ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="text-lg">{n.icon}</span>
            <span>{n.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
