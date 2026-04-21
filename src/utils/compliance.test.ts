import {
  getMaxInfantsAllowed,
  getAvailableInfantSpots,
  calculateComplianceStatus,
  getCapacityRuleDescription,
} from './compliance';
import { makeChild, dobForAgeMonths, SMALL_FAMILY_CONFIG, LARGE_FAMILY_CONFIG } from '../test-helpers';

// ── getMaxInfantsAllowed ─────────────────────────────────────────────

describe('getMaxInfantsAllowed — small family', () => {
  it('allows 4 infants for 1 child', () => {
    expect(getMaxInfantsAllowed('small_family', 1)).toBe(4);
  });

  it('allows 4 infants for 4 children', () => {
    expect(getMaxInfantsAllowed('small_family', 4)).toBe(4);
  });

  it('allows 3 infants for 5 children', () => {
    expect(getMaxInfantsAllowed('small_family', 5)).toBe(3);
  });

  it('allows 3 infants for 6 children', () => {
    expect(getMaxInfantsAllowed('small_family', 6)).toBe(3);
  });

  it('allows 2 infants for 7 children', () => {
    expect(getMaxInfantsAllowed('small_family', 7)).toBe(2);
  });

  it('allows 2 infants for 8 children', () => {
    expect(getMaxInfantsAllowed('small_family', 8)).toBe(2);
  });
});

describe('getMaxInfantsAllowed — large family', () => {
  it('allows 4 infants for 1 child', () => {
    expect(getMaxInfantsAllowed('large_family', 1)).toBe(4);
  });

  it('allows 4 infants for 12 children', () => {
    expect(getMaxInfantsAllowed('large_family', 12)).toBe(4);
  });

  it('allows 3 infants for 13 children', () => {
    expect(getMaxInfantsAllowed('large_family', 13)).toBe(3);
  });

  it('allows 3 infants for 14 children', () => {
    expect(getMaxInfantsAllowed('large_family', 14)).toBe(3);
  });
});

// ── getAvailableInfantSpots ──────────────────────────────────────────

describe('getAvailableInfantSpots', () => {
  it('returns 0 when at full capacity', () => {
    expect(getAvailableInfantSpots('small_family', 8, 2, 6)).toBe(0);
  });

  it('returns max infants when roster is empty (small family)', () => {
    // Empty roster, cap 8 → can add up to 4 infants (all-infant bracket)
    expect(getAvailableInfantSpots('small_family', 8, 0, 0)).toBe(4);
  });

  it('returns max infants when roster is empty (large family)', () => {
    expect(getAvailableInfantSpots('large_family', 14, 0, 0)).toBe(4);
  });

  it('accounts for infant ratio changes as enrollment grows', () => {
    // Small family, cap 8, currently 4 non-infants, 0 infants → 4 spots left
    // Adding 1 infant → 5 total, max 3 infants: 1 ≤ 3 ✓
    // Adding 2 infants → 6 total, max 3 infants: 2 ≤ 3 ✓
    // Adding 3 infants → 7 total, max 2 infants: 3 > 2 ✗
    expect(getAvailableInfantSpots('small_family', 8, 0, 4)).toBe(2);
  });

  it('returns 0 when already at infant limit', () => {
    // 3 infants + 3 non-infants = 6 total, max 3 infants for 6 kids → already at limit
    // Adding 1 infant → 7 total, max 2 infants: 4 > 2 ✗
    expect(getAvailableInfantSpots('small_family', 8, 3, 3)).toBe(0);
  });

  it('handles mixed enrollment in large family', () => {
    // Large, cap 14, 2 infants + 8 non-infants = 10 total, 4 spots left
    // Adding 1 infant → 11 total, max 4: 3 ≤ 4 ✓
    // Adding 2 infants → 12 total, max 4: 4 ≤ 4 ✓
    // Adding 3 infants → 13 total, max 3: 5 > 3 ✗
    expect(getAvailableInfantSpots('large_family', 14, 2, 8)).toBe(2);
  });
});

// ── calculateComplianceStatus ────────────────────────────────────────

describe('calculateComplianceStatus', () => {
  const frozenDate = new Date('2025-06-15');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(frozenDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports compliant for empty roster', () => {
    const status = calculateComplianceStatus([], SMALL_FAMILY_CONFIG);
    expect(status.isCompliant).toBe(true);
    expect(status.totalChildren).toBe(0);
    expect(status.errors).toHaveLength(0);
  });

  it('reports compliant with mixed enrollment under limits', () => {
    const children = [
      makeChild({ dateOfBirth: dobForAgeMonths(12, frozenDate) }), // infant
      makeChild({ dateOfBirth: dobForAgeMonths(36, frozenDate) }), // non-infant
    ];
    const status = calculateComplianceStatus(children, SMALL_FAMILY_CONFIG);
    expect(status.isCompliant).toBe(true);
    expect(status.infantCount).toBe(1);
    expect(status.nonInfantCount).toBe(1);
  });

  it('errors when over total capacity', () => {
    const children = Array.from({ length: 9 }, () =>
      makeChild({ dateOfBirth: dobForAgeMonths(36, frozenDate) })
    );
    const status = calculateComplianceStatus(children, SMALL_FAMILY_CONFIG);
    expect(status.isCompliant).toBe(false);
    expect(status.errors.some((e) => e.includes('Over capacity'))).toBe(true);
  });

  it('errors when infant ratio violated', () => {
    // 5 infants + 1 non-infant = 6 total → max 3 infants
    const children = [
      ...Array.from({ length: 5 }, () =>
        makeChild({ dateOfBirth: dobForAgeMonths(12, frozenDate) })
      ),
      makeChild({ dateOfBirth: dobForAgeMonths(36, frozenDate) }),
    ];
    const status = calculateComplianceStatus(children, SMALL_FAMILY_CONFIG);
    expect(status.isCompliant).toBe(false);
    expect(status.errors.some((e) => e.includes('Infant ratio violation'))).toBe(true);
  });

  it('warns at full capacity', () => {
    const children = Array.from({ length: 8 }, () =>
      makeChild({ dateOfBirth: dobForAgeMonths(36, frozenDate) })
    );
    const status = calculateComplianceStatus(children, SMALL_FAMILY_CONFIG);
    expect(status.isCompliant).toBe(true);
    expect(status.warnings.some((w) => w.includes('full capacity'))).toBe(true);
  });

  it('warns near full capacity', () => {
    const children = Array.from({ length: 7 }, () =>
      makeChild({ dateOfBirth: dobForAgeMonths(36, frozenDate) })
    );
    const status = calculateComplianceStatus(children, SMALL_FAMILY_CONFIG);
    expect(status.warnings.some((w) => w.includes('Near full capacity'))).toBe(true);
  });

  it('warns about school-age requirement for small family 7-8 children', () => {
    const children = Array.from({ length: 7 }, () =>
      makeChild({ dateOfBirth: dobForAgeMonths(36, frozenDate) })
    );
    const status = calculateComplianceStatus(children, SMALL_FAMILY_CONFIG);
    expect(status.warnings.some((w) => w.includes('K-12'))).toBe(true);
  });

  it('warns about school-age requirement for large family 13-14 children', () => {
    const children = Array.from({ length: 13 }, () =>
      makeChild({ dateOfBirth: dobForAgeMonths(36, frozenDate) })
    );
    const status = calculateComplianceStatus(children, LARGE_FAMILY_CONFIG);
    expect(status.warnings.some((w) => w.includes('K-12'))).toBe(true);
  });

  it('warns at max infant capacity', () => {
    // 3 infants + 3 non-infants = 6 total → max 3 infants, at limit
    const children = [
      ...Array.from({ length: 3 }, () =>
        makeChild({ dateOfBirth: dobForAgeMonths(12, frozenDate) })
      ),
      ...Array.from({ length: 3 }, () =>
        makeChild({ dateOfBirth: dobForAgeMonths(36, frozenDate) })
      ),
    ];
    const status = calculateComplianceStatus(children, SMALL_FAMILY_CONFIG);
    expect(status.isCompliant).toBe(true);
    expect(status.warnings.some((w) => w.includes('maximum infant capacity'))).toBe(true);
  });

  it('does not count aged-out children', () => {
    const children = [
      makeChild({ dateOfBirth: dobForAgeMonths(250, frozenDate) }), // aged out (>240 mo)
    ];
    const status = calculateComplianceStatus(children, SMALL_FAMILY_CONFIG);
    expect(status.totalChildren).toBe(0);
  });

  it('calculates correct spotsAvailable', () => {
    const children = [
      makeChild({ dateOfBirth: dobForAgeMonths(36, frozenDate) }),
      makeChild({ dateOfBirth: dobForAgeMonths(36, frozenDate) }),
    ];
    const status = calculateComplianceStatus(children, SMALL_FAMILY_CONFIG);
    expect(status.totalSpotsAvailable).toBe(6);
  });
});

// ── getCapacityRuleDescription ───────────────────────────────────────

describe('getCapacityRuleDescription', () => {
  it('describes small family 1-4 bracket', () => {
    expect(getCapacityRuleDescription('small_family', 3)).toContain('max 4 infants');
  });

  it('describes small family 5-6 bracket', () => {
    expect(getCapacityRuleDescription('small_family', 5)).toContain('max 3');
  });

  it('describes small family 7-8 bracket', () => {
    const desc = getCapacityRuleDescription('small_family', 7);
    expect(desc).toContain('max 2');
    expect(desc).toContain('school-age');
  });

  it('describes large family 1-12 bracket', () => {
    expect(getCapacityRuleDescription('large_family', 10)).toContain('max 4');
  });

  it('describes large family 13-14 bracket', () => {
    const desc = getCapacityRuleDescription('large_family', 13);
    expect(desc).toContain('max 3');
    expect(desc).toContain('school-age');
  });
});
