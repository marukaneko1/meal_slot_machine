/**
 * Mulberry32 - A simple seedable PRNG
 * Provides reproducible random numbers when given the same seed
 */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates a seeded random number generator from a string seed
 */
export function createSeededRNG(seed: string): () => number {
  // Convert string seed to number using simple hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return mulberry32(Math.abs(hash));
}

/**
 * Generates a random seed string
 */
export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Shuffles an array using Fisher-Yates algorithm with seeded RNG
 */
export function shuffleArray<T>(array: T[], rng: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Picks a random item from array using seeded RNG
 */
export function pickRandom<T>(array: T[], rng: () => number): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(rng() * array.length)];
}

/**
 * Picks n random items from array without replacement using seeded RNG
 */
export function pickRandomN<T>(array: T[], n: number, rng: () => number): T[] {
  const shuffled = shuffleArray(array, rng);
  return shuffled.slice(0, Math.min(n, array.length));
}
