/**
 * Animation timing constants
 * Centralized animation values for consistent behavior across components
 */

/**
 * Slot machine animation timing configuration
 */
export const SLOT_ANIMATION = {
  /** Delay before each reel starts spinning (in ms) */
  START_DELAY_PER_REEL: 200,
  
  /** Base delay before first reel stops (in ms) */
  STOP_DELAY_BASE: 1800,
  
  /** Additional delay for each subsequent reel to stop (in ms) */
  STOP_DELAY_PER_REEL: 350,
  
  /** Duration of the slowing phase before stop (in ms) */
  SLOWING_DURATION: 400,
  
  /** Buffer time after last reel stops before resetting (in ms) */
  END_BUFFER: 250,
} as const;

/**
 * Calculate total animation duration for a given number of reels
 * @param reelCount - Number of reels
 * @returns Total duration in milliseconds
 */
export function calculateTotalAnimationDuration(reelCount: number): number {
  const lastReelIndex = reelCount - 1;
  const lastReelStopTime = SLOT_ANIMATION.STOP_DELAY_BASE + (lastReelIndex * SLOT_ANIMATION.STOP_DELAY_PER_REEL);
  return lastReelStopTime + SLOT_ANIMATION.END_BUFFER;
}

/**
 * Calculate start delay for a specific reel
 * @param reelIndex - Index of the reel (0-based)
 * @returns Start delay in milliseconds
 */
export function getReelStartDelay(reelIndex: number): number {
  return reelIndex * SLOT_ANIMATION.START_DELAY_PER_REEL;
}

/**
 * Calculate stop delay for a specific reel
 * @param reelIndex - Index of the reel (0-based)
 * @returns Stop delay in milliseconds
 */
export function getReelStopDelay(reelIndex: number): number {
  return SLOT_ANIMATION.STOP_DELAY_BASE + (reelIndex * SLOT_ANIMATION.STOP_DELAY_PER_REEL);
}

/**
 * General transition durations (matching CSS design tokens)
 */
export const TRANSITIONS = {
  fast: 150,
  default: 200,
  slow: 300,
  slower: 500,
} as const;

/**
 * Toast/notification display durations
 */
export const TOAST_DURATION = {
  short: 2000,
  default: 3000,
  long: 5000,
  undo: 15000,
} as const;
