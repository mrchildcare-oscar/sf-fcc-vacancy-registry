import { DEFAULT_AGE_GROUPS, getAgeInMonths, getAgeGroup, getAgeGroupConfig, formatAge } from './ageGroups';

describe('getAgeInMonths', () => {
  it('returns 0 for a child born today', () => {
    const today = new Date('2025-06-15');
    expect(getAgeInMonths('2025-06-15', today)).toBe(0);
  });

  it('returns 12 for a child born exactly 1 year ago', () => {
    const today = new Date('2025-06-15');
    expect(getAgeInMonths('2024-06-15', today)).toBe(12);
  });

  it('subtracts a month when day-of-month has not been reached', () => {
    // Born on the 20th, checked on the 15th — not yet reached birthday day
    const today = new Date('2025-06-15');
    expect(getAgeInMonths('2024-06-20', today)).toBe(11);
  });

  it('does not subtract when day-of-month matches exactly', () => {
    const today = new Date('2025-06-20');
    expect(getAgeInMonths('2024-06-20', today)).toBe(12);
  });

  it('handles leap year Feb 29 birthday checked on Feb 28 non-leap year', () => {
    // Born Feb 29 2024, check on Feb 28 2025 (non-leap year)
    const asOf = new Date('2025-02-28');
    // Feb→Feb = 12 months, day 28 < 29 → subtract 1 = 11
    expect(getAgeInMonths('2024-02-29', asOf)).toBe(11);
  });

  it('handles leap year Feb 29 birthday checked on Mar 1 non-leap year', () => {
    const asOf = new Date('2025-03-01');
    // Feb→Mar = 13 months, day 1 < 29 → subtract 1 = 12
    expect(getAgeInMonths('2024-02-29', asOf)).toBe(12);
  });

  it('handles cross-year calculation', () => {
    const asOf = new Date('2025-01-15');
    expect(getAgeInMonths('2024-11-15', asOf)).toBe(2);
  });

  it('handles newborn (born yesterday)', () => {
    const today = new Date('2025-06-15');
    expect(getAgeInMonths('2025-06-14', today)).toBe(0);
  });
});

describe('getAgeGroup', () => {
  const asOf = new Date('2025-06-15');

  it('returns infant for 0 months old', () => {
    expect(getAgeGroup('2025-06-15', asOf)).toBe('infant');
  });

  it('returns infant for 23 months old', () => {
    // Born July 15, 2023 → 23 months old on Jun 15, 2025
    expect(getAgeGroup('2023-07-15', asOf)).toBe('infant');
  });

  it('returns non_infant at exactly 24 months', () => {
    // Born Jun 15, 2023 → exactly 24 months
    expect(getAgeGroup('2023-06-15', asOf)).toBe('non_infant');
  });

  it('returns non_infant for 239 months (19y 11mo)', () => {
    // 239 months before Jun 15, 2025 = Jul 15, 2005
    expect(getAgeGroup('2005-07-15', asOf)).toBe('non_infant');
  });

  it('returns null for 240 months (20 years — aged out)', () => {
    // 240 months before Jun 15, 2025 = Jun 15, 2005
    expect(getAgeGroup('2005-06-15', asOf)).toBeNull();
  });

  it('returns null for a very old date', () => {
    expect(getAgeGroup('1990-01-01', asOf)).toBeNull();
  });
});

describe('getAgeGroupConfig', () => {
  it('returns infant config', () => {
    const config = getAgeGroupConfig('infant');
    expect(config.id).toBe('infant');
    expect(config.minAgeMonths).toBe(0);
    expect(config.maxAgeMonths).toBe(24);
  });

  it('returns non_infant config', () => {
    const config = getAgeGroupConfig('non_infant');
    expect(config.id).toBe('non_infant');
    expect(config.minAgeMonths).toBe(24);
    expect(config.maxAgeMonths).toBe(240);
  });
});

describe('formatAge', () => {
  const asOf = new Date('2025-06-15');

  it('formats months-only for children under 1 year', () => {
    // 5 months old
    expect(formatAge('2025-01-15', asOf)).toBe('5mo');
  });

  it('formats years-only when months are exactly divisible', () => {
    // Exactly 2 years = 24 months
    expect(formatAge('2023-06-15', asOf)).toBe('2y');
  });

  it('formats years and months for mixed ages', () => {
    // 2y 3mo = 27 months → born Mar 15, 2023
    expect(formatAge('2023-03-15', asOf)).toBe('2y 3mo');
  });

  it('formats 0mo for newborn', () => {
    expect(formatAge('2025-06-15', asOf)).toBe('0mo');
  });

  it('formats 1y for exactly 12 months', () => {
    expect(formatAge('2024-06-15', asOf)).toBe('1y');
  });
});

describe('DEFAULT_AGE_GROUPS', () => {
  it('has exactly 2 age groups', () => {
    expect(DEFAULT_AGE_GROUPS).toHaveLength(2);
  });

  it('starts at 0 months', () => {
    expect(DEFAULT_AGE_GROUPS[0].minAgeMonths).toBe(0);
  });

  it('has no gaps between groups', () => {
    for (let i = 1; i < DEFAULT_AGE_GROUPS.length; i++) {
      expect(DEFAULT_AGE_GROUPS[i].minAgeMonths).toBe(DEFAULT_AGE_GROUPS[i - 1].maxAgeMonths);
    }
  });

  it('ends at 240 months (20 years)', () => {
    expect(DEFAULT_AGE_GROUPS[DEFAULT_AGE_GROUPS.length - 1].maxAgeMonths).toBe(240);
  });

  it('each group has required fields', () => {
    for (const group of DEFAULT_AGE_GROUPS) {
      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('label');
      expect(group).toHaveProperty('minAgeMonths');
      expect(group).toHaveProperty('maxAgeMonths');
      expect(group).toHaveProperty('color');
    }
  });
});
