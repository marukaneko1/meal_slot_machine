'use client';

import { useEffect, useState } from 'react';
import { X, Download, RefreshCw } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service worker registered');

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  setWaitingWorker(newWorker);
                  setShowUpdateBanner(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service worker registration failed:', error);
        });

      // Detect controller change and refresh
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      
      // Show install banner if not already installed and not dismissed recently
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
        // Delay showing the banner for better UX
        setTimeout(() => {
          setShowInstallBanner(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      setInstallPrompt(null);
      setShowInstallBanner(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] App installed');
    }

    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage('skipWaiting');
    }
    setShowUpdateBanner(false);
  };

  return (
    <>
      {children}

      {/* Install Banner - positioned above bottom nav on mobile */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-slate-900 to-slate-800 border border-slot-gold/50 rounded-2xl p-4 shadow-2xl z-40 animate-slide-up">
          <button
            onClick={dismissInstallBanner}
            className="absolute top-3 right-3 p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-4 pr-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slot-gold to-yellow-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Download className="w-7 h-7 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg">Install Meal Slot</h3>
              <p className="text-sm text-gray-400 mt-1">
                Add to your home screen for quick access and offline use
              </p>
              <button
                onClick={handleInstall}
                className="mt-4 w-full px-4 py-3 bg-slot-gold text-black font-bold rounded-xl hover:bg-yellow-400 transition-all active:scale-95"
              >
                Install App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Banner - positioned above bottom nav on mobile */}
      {showUpdateBanner && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-blue-900 to-blue-800 border border-blue-500/50 rounded-2xl p-4 shadow-2xl z-40 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <RefreshCw className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg">Update Available</h3>
              <p className="text-sm text-blue-200 mt-1">
                A new version of Meal Slot is ready
              </p>
              <button
                onClick={handleUpdate}
                className="mt-4 w-full px-4 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-all active:scale-95"
              >
                Update Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
