import { describe, it, expect } from 'vitest';
import { isUpcoming } from '../../lib/upcoming';
import type { PublicListing } from '../../types/registry';

// "Opening soon" = available_date in a later calendar month, at most 6 months ahead, with spots or age groups
// reported. Cases mirror real records on 2026-11-23 (ME Playschool in the Portola, MEFC Sunset, MEFC SoMa).
const base = {
  total_spots_available: 0, infant_spots: 0, toddler_spots: 0, preschool_spots: 0, school_age_spots: 0,
  accepting_infants: false, accepting_toddlers: false, accepting_preschool: false, accepting_school_age: false,
} as unknown as PublicListing;
const L = (o: Partial<PublicListing>) => ({ ...base, ...o }) as PublicListing;
const now = new Date(2026, 10, 23); // Nov 23, 2026

describe('isUpcoming', () => {
  it('ME Playschool: no spots yet, toddler/preschool accepting, opening Jan 4 2027', () => {
    expect(isUpcoming(L({ available_date: '2027-01-04', accepting_toddlers: true, accepting_preschool: true }), now)).toBe(true);
  });
  it('Sunset: 2 toddler spots reported for Jan 17 2027 are not open today', () => {
    expect(isUpcoming(L({ available_date: '2027-01-17', total_spots_available: 2, toddler_spots: 2 }), now)).toBe(true);
  });
  it('SoMa: spots with a past date are open now', () => {
    expect(isUpcoming(L({ available_date: '2026-11-06', total_spots_available: 2, infant_spots: 1, toddler_spots: 1 }), now)).toBe(false);
  });
  it('a later day in the same month counts as open now (same rule as the dashboard)', () => {
    expect(isUpcoming(L({ available_date: '2026-11-28', total_spots_available: 1, toddler_spots: 1 }), now)).toBe(false);
  });
  it('more than 6 months ahead is not "soon"', () => {
    expect(isUpcoming(L({ available_date: '2027-09-01', accepting_infants: true }), now)).toBe(false);
  });
  it('a future date with nothing reported is not an opening', () => {
    expect(isUpcoming(L({ available_date: '2027-01-04' }), now)).toBe(false);
  });
  it('no date is not upcoming', () => {
    expect(isUpcoming(L({ available_date: '' as unknown as string, total_spots_available: 1 }), now)).toBe(false);
  });
});
