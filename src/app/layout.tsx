// src/app/layout.tsx
import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/lib/auth';
import GlobalFooter from '@/components/site/GlobalFooter';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Nextern — Campus Career Readiness Platform', template: '%s | Nextern' },
  description:
    'Connect students with internships, employers with talent, and universities with insight. AI-powered career readiness for Bangladesh universities.',
  keywords: ['internship', 'jobs', 'campus hiring', 'Bangladesh', 'BRAC', 'NSU', 'career'],
  icons: {
    icon: [{ url: '/nextern_logo_2.png', type: 'image/png' }],
    shortcut: '/nextern_logo_2.png',
    apple: '/nextern_logo_2.png',
  },
  openGraph: {
    title: 'Nextern — Campus Career Readiness Platform',
    description: 'Smart internship matching powered by AI for Bangladesh university students.',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <SessionProvider session={session}>{children}</SessionProvider>
        <GlobalFooter />
      </body>
    </html>
  );
}
