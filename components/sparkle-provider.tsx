'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react';
import { haptic } from '@/lib/utils/haptic';

interface SparkleContextType {
  isSparkleMode: boolean;
  handleProfileClick: () => void;
}

const SparkleContext = createContext<SparkleContextType | null>(null);

export function useSparkle() {
  const context = useContext(SparkleContext);
  if (!context) {
    throw new Error('useSparkle must be used within SparkleProvider');
  }
  return context;
}

// Generate stable random values for sparkle particles
function generateParticleStyles(count: number): Array<{
  left: string;
  animationDelay: string;
  animationDuration: string;
}> {
  return Array.from({ length: count }, () => ({
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${3 + Math.random() * 4}s`,
  }));
}

export function SparkleProvider({ children }: { children: ReactNode }) {
  const [isSparkleMode, setIsSparkleMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Use refs to avoid closure issues
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate stable random values for sparkle particles once
  const particleStyles = useMemo(() => generateParticleStyles(20), []);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('sparkleMode');
      if (saved === 'true') {
        setIsSparkleMode(true);
        document.documentElement.classList.add('sparkle-mode');
      }
    } catch {
      // localStorage might not be available
    }
  }, []);

  // Apply/remove class when mode changes
  useEffect(() => {
    if (!mounted) return;
    
    if (isSparkleMode) {
      document.documentElement.classList.add('sparkle-mode');
      try {
        localStorage.setItem('sparkleMode', 'true');
      } catch {
        // localStorage might not be available
      }
      console.log('🌸 Sparkle mode activated!');
    } else {
      document.documentElement.classList.remove('sparkle-mode');
      try {
        localStorage.setItem('sparkleMode', 'false');
      } catch {
        // localStorage might not be available
      }
    }
  }, [isSparkleMode, mounted]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleProfileClick = useCallback(() => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Reset count if more than 1 second since last click
    if (timeSinceLastClick > 1000) {
      clickCountRef.current = 1;
      console.log('🌸 Click 1/3');
    } else {
      clickCountRef.current += 1;
      console.log(`🌸 Click ${clickCountRef.current}/3`);
      
      // Toggle sparkle mode on 3rd click
      if (clickCountRef.current >= 3) {
        setIsSparkleMode((prev) => !prev);
        clickCountRef.current = 0;
        
        // Haptic feedback
        haptic.sparkle();
        
        lastClickTimeRef.current = now;
        return;
      }
    }
    
    // Set a timeout to reset the count if no further clicks occur within 1 second
    timeoutRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1000);
    
    lastClickTimeRef.current = now;
  }, []);

  // Don't render particles until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <SparkleContext.Provider value={{ isSparkleMode: false, handleProfileClick }}>
        {children}
      </SparkleContext.Provider>
    );
  }

  return (
    <SparkleContext.Provider value={{ isSparkleMode, handleProfileClick }}>
      {children}
      
      {/* Sparkle particles when active - using stable random values */}
      {isSparkleMode && (
        <div 
          className="sparkle-particles pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
          aria-hidden="true"
        >
          {particleStyles.map((style, i) => (
            <div
              key={i}
              className="sparkle-particle"
              style={style}
            />
          ))}
        </div>
      )}
    </SparkleContext.Provider>
  );
}
