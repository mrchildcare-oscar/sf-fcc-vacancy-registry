import {
  calculateProjectedOpenings,
  calculateCurrentVacancies,
  getNextOpeningByAgeGroup,
} from './projections';
import { makeChild, dobForAgeMonths, SMALL_FAMILY_CONFIG } from '../test-helpers';

const frozenDate = new Date('2025-06-15');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(frozenDate);
});

afterEach(() => {
  vi.useRealTimers();
});

// ── calculateProjectedOpenings ───────────────────────────────────────

describe('calculateProjectedOpenings', () => {
  it('returns empty array for no children', () => {
    expect(calculateProjectedOpenings([])).toEqual([]);
  });

  it('detects scheduled departure within window', () => {
    const child = makeChild({
      dateOfBirth: dobForAgeMonths(36, frozenDate),
      expectedDepartureDate: '2025-09-01',
    });
    const openings = calculateProjectedOpenings([child], 12);
    expect(openings).toHaveLength(1);
    expect(openings[0].reason).toBe('scheduled_departure');
    expect(openings[0].date).toBe('2025-09-01');
  });

  it('ignores scheduled departure before today', () => {
    const child = makeChild({
      dateOfBirth: dobForAgeMonths(36, frozenDate),
      expectedDepartureDate: '2025-01-01',
    });
    const openings = calculateProjectedOpenings([child], 12);
    expect(openings).toHaveLength(0);
  });

  it('ignores scheduled departure after projection window', () => {
    const child = makeChild({
      dateOfBirth: dobForAgeMonths(36, frozenDate),
      expectedDepartureDate: '2027-01-01',
    });
    const openings = calculateProjectedOpenings([child], 12);
    expect(openings).toHaveLength(0);
  });

  it('skips other projections when departure is scheduled', () => {
    // Infant who would also transition to non-infant, but has a departure date
    const child = makeChild({
      dateOfBirth: dobForAgeMonths(23, frozenDate), // 23mo, turns 24 in 1 month
      expectedDepartureDate: '2025-08-01',
    });
    const openings = calculateProjectedOpenings([child], 12);
    expect(openings).toHaveLength(1);
    expect(openings[0].reason).toBe('scheduled_departure');
  });

  it('detects kindergarten transition (born before Sept 1 cutoff)', () => {
    // Born March 15, 2020 → turns 5 in March 2025 → kindergarten Sept 1, 2025
    const child = makeChild({ dateOfBirth: '2020-03-15' });
    const openings = calculateProjectedOpenings([child], 12);
    expect(openings).toHaveLength(1);
    expect(openings[0].reason).toBe('kindergarten');
    expect(openings[0].date).toBe('2025-09-01');
    expect(openings[0].ageGroup).toBe('non_infant');
  });

  it('detects kindergarten transition (born after Sept 1 → next year)', () => {
    // Born Oct 1, 2019 → turns 5 in Oct 2024, but born after Sept 1 → K starts Sept 1, 2025
    const child = makeChild({ dateOfBirth: '2019-10-01' });
    const openings = calculateProjectedOpenings([child], 12);
    expect(openings).toHaveLength(1);
    expect(openings[0].reason).toBe('kindergarten');
    expect(openings[0].date).toBe('2025-09-01');
  });

  it('detects aging out at 240 months', () => {
    // Child who turns 20 within projection window
    // Born Jul 16, 2005 → addMonths(dob, 240) produces a date in the projection window
    const child = makeChild({ dateOfBirth: '2005-07-16' });
    const openings = calculateProjectedOpenings([child], 12);
    expect(openings).toHaveLength(1);
    expect(openings[0].reason).toBe('aging_out');
    // Verify the date is within our projection window
    const agingOutDate = new Date(openings[0].date);
    expect(agingOutDate.getFullYear()).toBe(2025);
  });

  it('detects infant → non-infant transition at 24 months', () => {
    // Born Jul 16, 2023 → addMonths(dob, 24) produces a date in the projection window
    const child = makeChild({ dateOfBirth: '2023-07-16' });
    const openings = calculateProjectedOpenings([child], 12);
    expect(openings).toHaveLength(1);
    expect(openings[0].reason).toBe('aging_into_next_group');
    expect(openings[0].ageGroup).toBe('infant');
    // Verify the date is within our projection window
    const transitionDate = new Date(openings[0].date);
    expect(transitionDate.getFullYear()).toBe(2025);
  });

  it('does not flag non-infant for infant transition', () => {
    // 3-year-old — already non-infant, past the 24mo transition
    const child = makeChild({ dateOfBirth: dobForAgeMonths(36, frozenDate) });
    const openings = calculateProjectedOpenings([child], 12);
    // Should not have an aging_into_next_group opening
    expect(openings.filter((o) => o.reason === 'aging_into_next_group')).toHaveLength(0);
  });

  it('sorts results by date', () => {
    const children = [
      makeChild({ dateOfBirth: '2023-12-15' }), // turns 24mo on Dec 15, 2025
      makeChild({ dateOfBirth: '2023-08-15' }), // turns 24mo on Aug 15, 2025
    ];
    const openings = calculateProjectedOpenings(children, 12);
    expect(openings.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < openings.length; i++) {
      expect(new Date(openings[i].date).getTime()).toBeGreaterThanOrEqual(
        new Date(openings[i - 1].date).getTime()
      );
    }
  });

  it('uses child name when available', () => {
    const child = makeChild({
      firstName: 'Luna',
      lastName: 'Chen',
      dateOfBirth: '2023-08-15',
    });
    const openings = calculateProjectedOpenings([child], 12);
    expect(openings[0].childName).toBe('Luna Chen');
  });

  it('falls back to "Child N" when name is missing', () => {
    const child = makeChild({
      firstName: '',
      lastName: '',
      dateOfBirth: '2023-08-15',
    });
    const openings = calculateProjectedOpenings([child], 12);
    expect(openings[0].childName).toBe('Child 1');
  });

  it('respects projectionMonths parameter', () => {
    // Infant who turns 24mo in 4 months → within 6-month window, outside 3-month window
    const child = makeChild({ dateOfBirth: '2023-10-15' }); // turns 24mo Oct 15, 2025 = 4mo away
    expect(calculateProjectedOpenings([child], 6)).toHaveLength(1);
    expect(calculateProjectedOpenings([child], 3)).toHaveLength(0);
  });

  it('prefers kindergarten over aging-out for eligible children', () => {
    // 4-year-old who will go to kindergarten before aging out
    const child = makeChild({ dateOfBirth: '2020-03-15' });
    const openings = calculateProjectedOpenings([child], 12);
    expect(openings.every((o) => o.reason !== 'aging_out')).toBe(true);
    expect(openings.some((o) => o.reason === 'kindergarten')).toBe(true);
  });
});

// ── calculateCurrentVacancies ────────────────────────────────────────

describe('calculateCurrentVacancies', () => {
  it('returns full capacity when no children enrolled', () => {
    const vacancies = calculateCurrentVacancies([], SMALL_FAMILY_CONFIG);
    const infantVacancy = vacancies.find((v) => v.ageGroup === 'infant')!;
    const nonInfantVacancy = vacancies.find((v) => v.ageGroup === 'non_infant')!;
    expect(infantVacancy.currentCount).toBe(0);
    expect(nonInfantVacancy.currentCount).toBe(0);
    expect(nonInfantVacancy.available).toBe(8);
  });

  it('counts infants and non-infants separately', () => {
    const children = [
      makeChild({ dateOfBirth: dobForAgeMonths(12, frozenDate) }), // infant
      makeChild({ dateOfBirth: dobForAgeMonths(12, frozenDate) }), // infant
      makeChild({ dateOfBirth: dobForAgeMonths(36, frozenDate) }), // non-infant
    ];
    const vacancies = calculateCurrentVacancies(children, SMALL_FAMILY_CONFIG);
    const infantVacancy = vacancies.find((v) => v.ageGroup === 'infant')!;
    const nonInfantVacancy = vacancies.find((v) => v.ageGroup === 'non_infant')!;
    expect(infantVacancy.currentCount).toBe(2);
    expect(nonInfantVacancy.currentCount).toBe(1);
  });

  it('shows zero availability at full enrollment', () => {
    const children = Array.from({ length: 8 }, () =>
      makeChild({ dateOfBirth: dobForAgeMonths(36, frozenDate) })
    );
    const vacancies = calculateCurrentVacancies(children, SMALL_FAMILY_CONFIG);
    const nonInfantVacancy = vacancies.find((v) => v.ageGroup === 'non_infant')!;
    expect(nonInfantVacancy.available).toBe(0);
  });
});

// ── getNextOpeningByAgeGroup ─────────────────────────────────────────

describe('getNextOpeningByAgeGroup', () => {
  it('returns first matching opening for age group', () => {
    const child = makeChild({ dateOfBirth: '2023-08-15' });
    const openings = calculateProjectedOpenings([child], 12);
    const next = getNextOpeningByAgeGroup(openings, 'infant');
    expect(next).not.toBeNull();
    expect(next!.ageGroup).toBe('infant');
  });

  it('returns null when no openings for age group', () => {
    const openings = calculateProjectedOpenings([], 12);
    expect(getNextOpeningByAgeGroup(openings, 'infant')).toBeNull();
  });

  it('returns null for non-matching age group', () => {
    // Only infant transitions, no non-infant openings
    const child = makeChild({ dateOfBirth: '2023-08-15' }); // infant→non_infant
    const openings = calculateProjectedOpenings([child], 12);
    // This creates an 'infant' opening (spot opens in infant group)
    expect(getNextOpeningByAgeGroup(openings, 'non_infant')).toBeNull();
  });
});
