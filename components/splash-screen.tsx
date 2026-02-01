'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'fade-in' | 'shake' | 'fade-out'>('fade-in');

  useEffect(() => {
    // Phase 1: Fade in (0-400ms)
    const shakeTimer = setTimeout(() => {
      setPhase('shake');
    }, 400);

    // Phase 2: Shake (400-1600ms)
    const fadeOutTimer = setTimeout(() => {
      setPhase('fade-out');
    }, 1600);

    // Phase 3: Fade out and complete (1600-2000ms)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(shakeTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-400',
        phase === 'fade-out' && 'opacity-0'
      )}
    >
      <div
        className={cn(
          'flex flex-col items-center transition-all',
          phase === 'fade-in' && 'animate-fade-in',
          phase === 'shake' && 'animate-slot-shake',
          phase === 'fade-out' && 'opacity-0 scale-110'
        )}
      >
        {/* Slot Machine SVG */}
        <svg
          viewBox="0 0 120 140"
          className="w-32 h-40 md:w-40 md:h-48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main body */}
          <rect
            x="10"
            y="20"
            width="100"
            height="100"
            rx="8"
            fill="url(#bodyGradient)"
            stroke="#FFD700"
            strokeWidth="3"
          />
          
          {/* Top banner */}
          <rect
            x="15"
            y="5"
            width="90"
            height="20"
            rx="4"
            fill="#DC143C"
          />
          <text
            x="60"
            y="19"
            textAnchor="middle"
            fill="#FFD700"
            fontSize="10"
            fontWeight="bold"
            fontFamily="system-ui"
          >
            MEAL SLOT
          </text>
          
          {/* Display window */}
          <rect
            x="20"
            y="30"
            width="80"
            height="50"
            rx="4"
            fill="#1a1a2e"
            stroke="#FFD700"
            strokeWidth="2"
          />
          
          {/* Reel dividers */}
          <line x1="46" y1="32" x2="46" y2="78" stroke="#FFD700" strokeWidth="1" opacity="0.5" />
          <line x1="74" y1="32" x2="74" y2="78" stroke="#FFD700" strokeWidth="1" opacity="0.5" />
          
          {/* Symbols */}
          <text x="33" y="62" textAnchor="middle" fontSize="20">🍗</text>
          <text x="60" y="62" textAnchor="middle" fontSize="20">🥩</text>
          <text x="87" y="62" textAnchor="middle" fontSize="20">🥦</text>
          
          {/* Spin button */}
          <circle
            cx="60"
            cy="100"
            r="15"
            fill="url(#buttonGradient)"
            stroke="#FFD700"
            strokeWidth="2"
          />
          <text
            x="60"
            y="104"
            textAnchor="middle"
            fill="white"
            fontSize="8"
            fontWeight="bold"
          >
            SPIN
          </text>
          
          {/* Lever */}
          <rect x="105" y="40" width="8" height="40" rx="4" fill="#8B5CF6" />
          <circle cx="109" cy="35" r="8" fill="#FFD700" />
          
          {/* Base */}
          <rect
            x="5"
            y="120"
            width="110"
            height="15"
            rx="4"
            fill="url(#baseGradient)"
          />
          
          {/* Gradients */}
          <defs>
            <linearGradient id="bodyGradient" x1="60" y1="20" x2="60" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2d2d4a" />
              <stop offset="100%" stopColor="#1a1a2e" />
            </linearGradient>
            <linearGradient id="buttonGradient" x1="60" y1="85" x2="60" y2="115" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
            <linearGradient id="baseGradient" x1="60" y1="120" x2="60" y2="135" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#b8860b" />
            </linearGradient>
          </defs>
        </svg>

        {/* Sparkle effects during shake */}
        {phase === 'shake' && (
          <>
            <div className="absolute -top-4 -left-4 text-2xl animate-ping">✨</div>
            <div className="absolute -top-2 -right-6 text-xl animate-ping delay-100">⭐</div>
            <div className="absolute -bottom-2 -left-6 text-xl animate-ping delay-200">✨</div>
            <div className="absolute -bottom-4 -right-4 text-2xl animate-ping delay-75">⭐</div>
          </>
        )}
      </div>
    </div>
  );
}
