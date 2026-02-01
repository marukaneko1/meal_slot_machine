/**
 * Haptic feedback utility
 * Centralized vibration patterns for consistent UX
 */

type VibrationPattern = number | number[];

/**
 * Safely triggers haptic feedback if available
 */
function vibrate(pattern: VibrationPattern): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Vibration not supported or failed silently
    }
  }
}

/**
 * Haptic feedback patterns
 */
export const haptic = {
  /** Light tap feedback - for button presses */
  tap: () => vibrate(10),
  
  /** Medium tap - for toggle actions */
  toggle: () => vibrate(15),
  
  /** Success pattern - for completed actions */
  success: () => vibrate([30, 20, 30]),
  
  /** Spin pattern - for slot machine spin */
  spin: () => vibrate([30, 20, 30]),
  
  /** Sparkle pattern - for easter egg activation */
  sparkle: () => vibrate([50, 50, 50, 50, 100]),
  
  /** Error pattern - for error feedback */
  error: () => vibrate([100, 50, 100]),
  
  /** Lock pattern - for locking items */
  lock: () => vibrate([20, 30, 20]),
  
  /** Notification pattern */
  notify: () => vibrate([50, 30, 50]),
} as const;
