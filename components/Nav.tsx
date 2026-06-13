'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function Nav() {
  const { user, logout } = useAuth();
  const path = usePathname();
  const router = useRouter();
  if (!user) return null;

  const tabs = [
    { href: '/fixtures', icon: '📅', label: 'Fixtures' },
    { href: '/predictions', icon: '🎯', label: 'Predict' },
    { href: '/leaderboard', icon: '🏆', label: 'Table' },
    ...(user.is_admin ? [{ href: '/admin', icon: '⚙️', label: 'Admin' }] : []),
  ];

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

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
      {user.is_admin && (
        <button className="nav-btn" onClick={handleLogout} title="Sign out">
          <span className="nav-icon">🚪</span>
          <span className="nav-lbl">Sign out</span>
        </button>
      )}
    </nav>
  );
}
