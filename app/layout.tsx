import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navigation } from '@/components/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { PWAProvider } from '@/components/pwa-provider';
import { AppWrapper } from '@/components/app-wrapper';

export const metadata: Metadata = {
  title: 'Meal Slot — Weekly Meal Planning',
  description: 'Generate thoughtful meal plans with a spin',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Meal Slot',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Meal Slot — Weekly Meal Planning',
    description: 'Generate thoughtful meal plans with a spin',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0C0A09',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Meal Slot" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="antialiased">
        <AppWrapper>
          <PWAProvider>
            <Navigation />
            <main className="min-h-screen pt-0 md:pt-14 pb-20 md:pb-0">
              {children}
            </main>
            <BottomNav />
          </PWAProvider>
        </AppWrapper>
      </body>
    </html>
  );
}
