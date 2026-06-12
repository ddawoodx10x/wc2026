'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const tabs = [
    { href: '/fixtures', icon: '📅', label: 'Fixtures' },
    { href: '/predictions', icon: '🎯', label: 'Predict' },
    { href: '/leaderboard', icon: '🏆', label: 'Table' },
    ...(user.is_admin ? [{ href: '/admin', icon: '⚙️', label: 'Admin' }] : []),
  ];

  return (
    <nav className="nav-bar">
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {tabs.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '6px 16px',
                borderRadius: '12px',
                textDecoration: 'none',
                transition: 'all 0.2s',
                background: active ? 'rgba(45,138,78,0.2)' : 'transparent',
              }}
            >
              <span style={{ fontSize: '22px', lineHeight: 1 }}>{tab.icon}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: active ? 700 : 400,
                  color: active ? '#3aad63' : 'rgba(255,255,255,0.45)',
                  letterSpacing: '0.3px',
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
