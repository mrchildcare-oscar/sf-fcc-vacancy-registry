import type { PublicListing } from '../types/registry';

// "Opening soon" on the public listings: available_date is in a later calendar month, at most 6 months ahead,
// and the home reported spots or age groups for it. Matches daycaresf.com's rule. (The provider dashboard,
// OrganizationDashboard.getVacancyStatus, checks spots before dates, so a home with future spots reads as
// "open" there; that page is unchanged.)
//
// This file is also imported by scripts/generate-openings.mjs (Node strips the types), so keep it free of
// runtime imports.

/** The listing fields `isUpcoming` and the age helpers read. */
type ListingTiming = Pick<
  PublicListing,
  | 'available_date' | 'total_spots_available'
  | 'infant_spots' | 'toddler_spots' | 'preschool_spots' | 'school_age_spots'
  | 'accepting_infants' | 'accepting_toddlers' | 'accepting_preschool' | 'accepting_school_age'
>;

/** The four age groups, with the listing fields and i18n keys that belong to each. */
export const AGE_GROUPS = [
  { value: 'infant', spots: 'infant_spots', accepting: 'accepting_infants', labelKey: 'vacancy.infant', ageKey: 'vacancy.infantAge' },
  { value: 'toddler', spots: 'toddler_spots', accepting: 'accepting_toddlers', labelKey: 'vacancy.toddler', ageKey: 'vacancy.toddlerAge' },
  { value: 'preschool', spots: 'preschool_spots', accepting: 'accepting_preschool', labelKey: 'vacancy.preschool', ageKey: 'vacancy.preschoolAge' },
  { value: 'school_age', spots: 'school_age_spots', accepting: 'accepting_school_age', labelKey: 'vacancy.schoolAge', ageKey: 'vacancy.schoolAgeAge' },
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];

/** Age groups the home reported: open spots for it, or the "accepting" flag. */
export function reportedAgeGroups(l: ListingTiming): AgeGroup[] {
  return AGE_GROUPS.filter(g => (l[g.spots] || 0) > 0 || l[g.accepting]);
}

/** Parse 'YYYY-MM-DD' as a local calendar date (no UTC shift). */
export function parseDay(d: string | null | undefined): Date | null {
  const m = d ? /^(\d{4})-(\d{2})-(\d{2})/.exec(d) : null;
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

export function isUpcoming(l: ListingTiming, now: Date = new Date()): boolean {
  const a = parseDay(l.available_date);
  if (!a) return false;
  const months = (a.getFullYear() - now.getFullYear()) * 12 + (a.getMonth() - now.getMonth());
  if (months <= 0 || months > 6) return false;
  return l.total_spots_available > 0 || reportedAgeGroups(l).length > 0;
}

/** Open today: has spots and is not a future-dated ("Opening soon") listing. */
export function isOpenNow(l: ListingTiming, now: Date = new Date()): boolean {
  return l.total_spots_available > 0 && !isUpcoming(l, now);
}
