'use client';

import { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from './splash-screen';
import { SparkleProvider } from './sparkle-provider';

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if we've shown the splash recently (within 5 minutes)
    const lastSplash = sessionStorage.getItem('lastSplashTime');
    const now = Date.now();
    
    if (lastSplash && now - parseInt(lastSplash) < 5 * 60 * 1000) {
      // Skip splash if shown recently in this session
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    sessionStorage.setItem('lastSplashTime', Date.now().toString());
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-black" />
    );
  }

  return (
    <SparkleProvider>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className={showSplash ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
        {children}
      </div>
    </SparkleProvider>
  );
}
