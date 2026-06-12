'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function Nav() {
  const { user } = useAuth();
  const path = usePathname();
  if (!user) return null;
  const tabs = [
    { href: '/fixtures', icon: '📅', label: 'Fixtures' },
    { href: '/predictions', icon: '🎯', label: 'Predict' },
    { href: '/leaderboard', icon: '🏆', label: 'Table' },
    ...(user.is_admin ? [{ href: '/admin', icon: '⚙️', label: 'Admin' }] : []),
  ];
  return (
    <nav className="nav">
      {tabs.map(t => (
        <Link key={t.href} href={t.href} style={{ textDecoration: 'none' }}>
          <button className={`nav-btn${path.startsWith(t.href) ? ' on' : ''}`}>
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-lbl">{t.label}</span>
          </button>
        </Link>
      ))}
    </nav>
  );
}
