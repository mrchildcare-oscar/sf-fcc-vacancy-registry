import { computeVacancyTtlDays, computeExpiresAt, getListingFreshness } from './vacancyTtl';

const baseData = {
  waitlist_available: false,
  infant_spots: 0,
  toddler_spots: 0,
  preschool_spots: 0,
  school_age_spots: 0,
};

// ── computeVacancyTtlDays ────────────────────────────────────────────

describe('computeVacancyTtlDays', () => {
  it('returns 45 when no waitlist and no spots', () => {
    expect(computeVacancyTtlDays({ ...baseData })).toBe(45);
  });

  it('returns 90 when waitlist + zero spots', () => {
    expect(computeVacancyTtlDays({ ...baseData, waitlist_available: true })).toBe(90);
  });

  it('returns 45 when waitlist + infant spots > 0', () => {
    expect(computeVacancyTtlDays({ ...baseData, waitlist_available: true, infant_spots: 1 })).toBe(45);
  });

  it('returns 45 when waitlist + toddler spots > 0', () => {
    expect(computeVacancyTtlDays({ ...baseData, waitlist_available: true, toddler_spots: 1 })).toBe(45);
  });

  it('returns 45 when waitlist + preschool spots > 0', () => {
    expect(computeVacancyTtlDays({ ...baseData, waitlist_available: true, preschool_spots: 1 })).toBe(45);
  });

  it('returns 45 when waitlist + school_age spots > 0', () => {
    expect(computeVacancyTtlDays({ ...baseData, waitlist_available: true, school_age_spots: 1 })).toBe(45);
  });

  it('returns 45 when no waitlist but has spots', () => {
    expect(computeVacancyTtlDays({ ...baseData, infant_spots: 2 })).toBe(45);
  });

  it('returns 45 when waitlist + multiple spot types > 0', () => {
    expect(
      computeVacancyTtlDays({
        waitlist_available: true,
        infant_spots: 1,
        toddler_spots: 1,
        preschool_spots: 0,
        school_age_spots: 0,
      })
    ).toBe(45);
  });
});

// ── computeExpiresAt ─────────────────────────────────────────────────

describe('computeExpiresAt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns ISO string 45 days from now for default case', () => {
    const result = computeExpiresAt({ ...baseData });
    const expected = new Date('2025-06-15');
    expected.setDate(expected.getDate() + 45);
    expect(result).toBe(expected.toISOString());
  });

  it('returns ISO string 90 days from now for waitlist-only', () => {
    const result = computeExpiresAt({ ...baseData, waitlist_available: true });
    const expected = new Date('2025-06-15');
    expected.setDate(expected.getDate() + 90);
    expect(result).toBe(expected.toISOString());
  });

  it('returns a valid ISO date string', () => {
    const result = computeExpiresAt({ ...baseData });
    expect(new Date(result).toISOString()).toBe(result);
  });
});

// ── getListingFreshness ──────────────────────────────────────────────

describe('getListingFreshness', () => {
  function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  }

  it('returns fresh for listings updated < 14 days ago', () => {
    expect(getListingFreshness(daysAgo(5))).toBe('fresh');
    expect(getListingFreshness(daysAgo(0))).toBe('fresh');
    expect(getListingFreshness(daysAgo(13))).toBe('fresh');
  });

  it('returns aging for listings updated 14-29 days ago', () => {
    expect(getListingFreshness(daysAgo(15))).toBe('aging');
    expect(getListingFreshness(daysAgo(20))).toBe('aging');
    expect(getListingFreshness(daysAgo(29))).toBe('aging');
  });

  it('returns stale for listings updated 31+ days ago', () => {
    expect(getListingFreshness(daysAgo(31))).toBe('stale');
    expect(getListingFreshness(daysAgo(45))).toBe('stale');
  });

  it('returns stale for expired listings regardless of last_updated', () => {
    expect(getListingFreshness(daysAgo(1), daysAgo(1))).toBe('stale');
    expect(getListingFreshness(daysAgo(0), daysAgo(5))).toBe('stale');
  });

  it('respects last_updated age when not expired', () => {
    const futureExpiry = new Date();
    futureExpiry.setDate(futureExpiry.getDate() + 10);
    expect(getListingFreshness(daysAgo(5), futureExpiry.toISOString())).toBe('fresh');
    expect(getListingFreshness(daysAgo(20), futureExpiry.toISOString())).toBe('aging');
  });
});
