import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navigation } from '@/components/navigation';
import { PWAProvider } from '@/components/pwa-provider';

export const metadata: Metadata = {
  title: 'Meal Slot - Spin Your Meals',
  description: 'Generate meal plans with a slot machine interface',
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
    title: 'Meal Slot - Spin Your Meals',
    description: 'Generate meal plans with a slot machine interface',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#FFD700',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Meal Slot" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        
        {/* Splash screens for iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/icon-512.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
        />
      </head>
      <body className="antialiased">
        <PWAProvider>
          <Navigation />
          <main className="pt-16">{children}</main>
        </PWAProvider>
      </body>
    </html>
  );
}
