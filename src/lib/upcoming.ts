import type { PublicListing } from '../types/registry';

// "Opening soon" on the public listings: available_date is in a later calendar month, at most 6 months ahead,
// and the home reported spots or age groups for it. Matches daycaresf.com's rule. (The provider dashboard,
// OrganizationDashboard.getVacancyStatus, checks spots before dates, so a home with future spots reads as
// "open" there; that page is unchanged.)

/** Parse 'YYYY-MM-DD' as a local calendar date (no UTC shift). */
export function parseDay(d: string | null | undefined): Date | null {
  const m = d ? /^(\d{4})-(\d{2})-(\d{2})/.exec(d) : null;
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

export function isUpcoming(l: PublicListing, now: Date = new Date()): boolean {
  const a = parseDay(l.available_date);
  if (!a) return false;
  const months = (a.getFullYear() - now.getFullYear()) * 12 + (a.getMonth() - now.getMonth());
  if (months <= 0 || months > 6) return false;
  return l.total_spots_available > 0 || l.accepting_infants || l.accepting_toddlers || l.accepting_preschool || l.accepting_school_age;
}
