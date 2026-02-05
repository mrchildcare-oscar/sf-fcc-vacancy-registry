/**
 * User-specific daily random ordering for listings
 * - Each user sees a different order (fairness to providers)
 * - Same user sees same order all day (consistent UX)
 * - Order changes daily (rotates visibility)
 */

// Get or create persistent anonymous user ID
function getAnonymousUserId(): string {
  const key = 'fcc_user_id';
  let userId = localStorage.getItem(key);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(key, userId);
  }
  return userId;
}

// Get today's date string (YYYY-MM-DD)
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// Simple hash function to create numeric seed
function hashToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Seeded random number generator (mulberry32 algorithm)
function seededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle with seeded random
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  const random = seededRandom(seed);

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// Main export: shuffle listings for current user/day
export function shuffleListingsForUser<T>(listings: T[]): T[] {
  const userId = getAnonymousUserId();
  const today = getTodayString();
  const seed = hashToSeed(userId + today);
  return seededShuffle(listings, seed);
}
