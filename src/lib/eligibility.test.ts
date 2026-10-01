import {
  getThresholds,
  checkEligibility,
  getRelevantAgencies,
  formatCurrency,
} from './eligibility';

// ── getThresholds ────────────────────────────────────────────────────

describe('getThresholds', () => {
  it('calculates FPL correctly for household of 1', () => {
    const t = getThresholds(1);
    // FPL for 1 person = $15,960 × 2 = $31,920
    expect(t.fpl200).toBe(31920);
  });

  it('calculates FPL correctly for household of 4', () => {
    const t = getThresholds(4);
    // FPL = (15960 + 3 × 5680) × 2 = (15960 + 17040) × 2 = 33000 × 2 = 66000
    expect(t.fpl200).toBe(66000);
  });

  it('uses the published 85% SMI ceiling for household of 4', () => {
    const t = getThresholds(4);
    // FY26-27 CCTR ceiling as published by SF DEC. Deliberately NOT 0.85 * smi100, which would
    // give 115,637 - eligibility turns on the published figure, not our arithmetic.
    expect(t.smi85).toBe(115632);
    expect(t.smi85).not.toBe(Math.round(t.smi100 * 0.85));
  });

  it('returns 100% SMI for household of 4', () => {
    const t = getThresholds(4);
    expect(t.smi100).toBe(136044);
  });

  it('returns AMI thresholds for household of 4', () => {
    const t = getThresholds(4);
    expect(t.ami110).toBe(178300);
    expect(t.ami150).toBe(243150);
    expect(t.ami200).toBe(324200);
  });

  it('clamps SMI lookup to max 12', () => {
    const t12 = getThresholds(12);
    const t15 = getThresholds(15);
    expect(t15.smi100).toBe(t12.smi100);
  });

  it('mirrors the 11-person ELFA row into 12, per DEC, and clamps above that', () => {
    const t11 = getThresholds(11);
    const t12 = getThresholds(12);
    const t15 = getThresholds(15);
    // DEC's own note: its ELFA source data stops at 11 people, so 12 repeats 11.
    expect(t12.ami110).toBe(t11.ami110);
    expect(t12.ami200).toBe(t11.ami200);
    // and a 10-person household is genuinely lower than a 12-person one
    expect(getThresholds(10).ami110).toBeLessThan(t12.ami110);
    expect(t15.ami110).toBe(t12.ami110);
  });

  it('clamps household size minimum to 1', () => {
    const t0 = getThresholds(0);
    const t1 = getThresholds(1);
    expect(t0.fpl200).toBe(t1.fpl200);
  });

  it('returns different FPL for different sizes', () => {
    expect(getThresholds(1).fpl200).not.toBe(getThresholds(4).fpl200);
  });
});

// ── checkEligibility ─────────────────────────────────────────────────

describe('FY2026-27 schedule', () => {
  // This change exists because the site shipped FY2025-26 ceilings, every one of them lower than
  // the current figure - which told families they did not qualify when they did. Guard the
  // direction, so a stale table cannot come back silently.
  const FY2526 = { smi85: 108237, smi100: 127338, ami110: 171450, ami150: 233800, ami200: 311700 };

  it('is strictly more generous than the schedule it replaced', () => {
    const t = getThresholds(4);
    expect(t.smi85).toBeGreaterThan(FY2526.smi85);
    expect(t.smi100).toBeGreaterThan(FY2526.smi100);
    expect(t.ami110).toBeGreaterThan(FY2526.ami110);
    expect(t.ami150).toBeGreaterThan(FY2526.ami150);
    expect(t.ami200).toBeGreaterThan(FY2526.ami200);
  });

  it('admits a family the old table turned away', () => {
    // A family of four on $175,000 was told no under FY25-26; they qualify for free tuition now.
    const result = checkEligibility(4, 175000);
    expect(result.elfaFree).toBe(true);
  });

  it('keeps the tiers ordered', () => {
    for (const size of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      const t = getThresholds(size);
      expect(t.smi85).toBeLessThan(t.smi100);
      expect(t.ami110).toBeLessThan(t.ami150);
      expect(t.ami150).toBeLessThan(t.ami200);
    }
  });
});

describe('checkEligibility', () => {
  // Household of 4 thresholds:
  // FY 2026-27, from SF DEC's combined eligibility sheet. Reissued every July.
  // fpl200 = 66,000
  // smi85  = 115,632
  // smi100 = 136,044
  // ami110 = 178,300
  // ami150 = 243,150
  // ami200 = 324,200

  it('qualifies for all programs at very low income', () => {
    const result = checkEligibility(4, 30000);
    expect(result.headStart).toBe(true);
    expect(result.generalSubsidy).toBe(true);
    expect(result.statePreschool).toBe(true);
    expect(result.elfaFree).toBe(true);
    expect(result.elfaCredit100).toBe(false);
    expect(result.elfaDiscount50).toBe(false);
    expect(result.anyProgram).toBe(true);
  });

  it('qualifies for Head Start at exactly FPL 200%', () => {
    const result = checkEligibility(4, 66000);
    expect(result.headStart).toBe(true);
  });

  it('does not qualify for Head Start just above FPL 200%', () => {
    const result = checkEligibility(4, 66001);
    expect(result.headStart).toBe(false);
  });

  it('qualifies for general subsidy at exactly 85% SMI', () => {
    const smi85 = getThresholds(4).smi85;
    const result = checkEligibility(4, smi85);
    expect(result.generalSubsidy).toBe(true);
  });

  it('does not qualify for general subsidy just above 85% SMI', () => {
    const smi85 = getThresholds(4).smi85;
    const result = checkEligibility(4, smi85 + 1);
    expect(result.generalSubsidy).toBe(false);
  });

  it('qualifies for state preschool at exactly 100% SMI', () => {
    const result = checkEligibility(4, 136044);
    expect(result.statePreschool).toBe(true);
  });

  it('does not qualify for state preschool just above 100% SMI', () => {
    const result = checkEligibility(4, 136045);
    expect(result.statePreschool).toBe(false);
  });

  it('qualifies for ELFA free at exactly 110% AMI', () => {
    const result = checkEligibility(4, 178300);
    expect(result.elfaFree).toBe(true);
    expect(result.elfaCredit100).toBe(false);
  });

  it('gets ELFA credit 100 between 110% and 150% AMI', () => {
    const result = checkEligibility(4, 200000);
    expect(result.elfaFree).toBe(false);
    expect(result.elfaCredit100).toBe(true);
    expect(result.elfaDiscount50).toBe(false);
  });

  it('gets ELFA discount 50 between 150% and 200% AMI', () => {
    const result = checkEligibility(4, 250000);
    expect(result.elfaFree).toBe(false);
    expect(result.elfaCredit100).toBe(false);
    expect(result.elfaDiscount50).toBe(true);
  });

  it('qualifies for no programs above 200% AMI', () => {
    const result = checkEligibility(4, 330000);
    expect(result.anyProgram).toBe(false);
    expect(result.headStart).toBe(false);
    expect(result.generalSubsidy).toBe(false);
    expect(result.elfaFree).toBe(false);
    expect(result.elfaCredit100).toBe(false);
    expect(result.elfaDiscount50).toBe(false);
  });

  it('handles household size 1', () => {
    const result = checkEligibility(1, 31920);
    expect(result.headStart).toBe(true);
  });

  it('handles household size 12', () => {
    const t = getThresholds(12);
    const result = checkEligibility(12, t.fpl200);
    expect(result.headStart).toBe(true);
  });
});

// ── getRelevantAgencies ──────────────────────────────────────────────

describe('getRelevantAgencies', () => {
  it("returns Children's Council + Wu Yee for elfaFree", () => {
    const result = checkEligibility(4, 100000);
    const agencies = getRelevantAgencies(result);
    const ids = agencies.map((a) => a.id);
    expect(ids).toContain('childrens-council');
    expect(ids).toContain('wu-yee');
  });

  it('returns Wu Yee only for elfaCredit100', () => {
    const result = checkEligibility(4, 200000);
    const agencies = getRelevantAgencies(result);
    const ids = agencies.map((a) => a.id);
    expect(ids).not.toContain('childrens-council');
    expect(ids).toContain('wu-yee');
  });

  it('returns Wu Yee only for elfaDiscount50', () => {
    const result = checkEligibility(4, 250000);
    const agencies = getRelevantAgencies(result);
    const ids = agencies.map((a) => a.id);
    expect(ids).toContain('wu-yee');
    expect(ids).not.toContain('compass');
  });

  it('Compass is only for homeless tier', () => {
    const result = checkEligibility(4, 999999);
    const agencies = getRelevantAgencies(result);
    expect(agencies.some((a) => a.id === 'compass')).toBe(false);
  });
});

// ── formatCurrency ───────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats whole dollars without cents', () => {
    expect(formatCurrency(50000)).toBe('$50,000');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formats large amounts', () => {
    expect(formatCurrency(324200)).toBe('$324,200');
  });

  it('rounds fractional amounts', () => {
    // maximumFractionDigits: 0 means no decimals
    expect(formatCurrency(50000.75)).toBe('$50,001');
  });
});
