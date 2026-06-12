import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'WC 2026 – The Lads 🏆',
  description: 'World Cup 2026 private prediction game',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'WC 2026' },
};
export const viewport: Viewport = { themeColor: '#080f1e', width: 'device-width', initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="pitch" />
          <div className="app">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
