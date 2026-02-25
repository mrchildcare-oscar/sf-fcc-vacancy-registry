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
