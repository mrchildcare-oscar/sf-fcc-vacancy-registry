// Centralized TTL logic for vacancy expiry
// 45 days default, 90 days for waitlist-only (no open spots)

export function computeVacancyTtlDays(data: {
  waitlist_available: boolean;
  infant_spots: number;
  toddler_spots: number;
  preschool_spots: number;
  school_age_spots: number;
}): number {
  const total =
    data.infant_spots + data.toddler_spots + data.preschool_spots + data.school_age_spots;
  return data.waitlist_available && total === 0 ? 90 : 45;
}

export function computeExpiresAt(data: Parameters<typeof computeVacancyTtlDays>[0]): string {
  const d = new Date();
  d.setDate(d.getDate() + computeVacancyTtlDays(data));
  return d.toISOString();
}

// Freshness tiers based on how old the last_updated timestamp is
// fresh: < 14 days — data is recent, no indicator needed
// aging: 14–30 days — show subtle hint that data may be stale
// stale: 30+ days — clear warning that availability may have changed
export type ListingFreshness = 'fresh' | 'aging' | 'stale';

export function getListingFreshness(lastUpdated: string, expiresAt?: string): ListingFreshness {
  // Expired listings are always stale
  if (expiresAt && new Date(expiresAt) < new Date()) return 'stale';
  const ageMs = Date.now() - new Date(lastUpdated).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays >= 30) return 'stale';
  if (ageDays >= 14) return 'aging';
  return 'fresh';
}
