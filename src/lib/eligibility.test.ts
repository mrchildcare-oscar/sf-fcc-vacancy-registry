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

  it('calculates 85% SMI for household of 4', () => {
    const t = getThresholds(4);
    // SMI_100 for 4 = 127338, 85% = 108237 (rounded)
    expect(t.smi85).toBe(Math.round(127338 * 0.85));
  });

  it('returns 100% SMI for household of 4', () => {
    const t = getThresholds(4);
    expect(t.smi100).toBe(127338);
  });

  it('returns AMI thresholds for household of 4', () => {
    const t = getThresholds(4);
    expect(t.ami110).toBe(171450);
    expect(t.ami150).toBe(233800);
    expect(t.ami200).toBe(311700);
  });

  it('clamps SMI lookup to max 12', () => {
    const t12 = getThresholds(12);
    const t15 = getThresholds(15);
    expect(t15.smi100).toBe(t12.smi100);
  });

  it('clamps AMI lookup to max 10', () => {
    const t10 = getThresholds(10);
    const t12 = getThresholds(12);
    expect(t12.ami110).toBe(t10.ami110);
    expect(t12.ami150).toBe(t10.ami150);
    expect(t12.ami200).toBe(t10.ami200);
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

describe('checkEligibility', () => {
  // Household of 4 thresholds:
  // fpl200 = 66,000
  // smi85  = 108,237
  // smi100 = 127,338
  // ami110 = 171,450
  // ami150 = 233,800
  // ami200 = 311,700

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
    const result = checkEligibility(4, 127338);
    expect(result.statePreschool).toBe(true);
  });

  it('does not qualify for state preschool just above 100% SMI', () => {
    const result = checkEligibility(4, 127339);
    expect(result.statePreschool).toBe(false);
  });

  it('qualifies for ELFA free at exactly 110% AMI', () => {
    const result = checkEligibility(4, 171450);
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
    const result = checkEligibility(4, 320000);
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
  it("returns Children's Council + Wu Yee + Compass for elfaFree", () => {
    const result = checkEligibility(4, 100000);
    const agencies = getRelevantAgencies(result);
    const ids = agencies.map((a) => a.id);
    expect(ids).toContain('childrens-council');
    expect(ids).toContain('wu-yee');
    expect(ids).toContain('compass');
  });

  it('returns Wu Yee + Compass for elfaCredit100', () => {
    const result = checkEligibility(4, 200000);
    const agencies = getRelevantAgencies(result);
    const ids = agencies.map((a) => a.id);
    expect(ids).not.toContain('childrens-council');
    expect(ids).toContain('wu-yee');
    expect(ids).toContain('compass');
  });

  it('returns Wu Yee + Compass for elfaDiscount50', () => {
    const result = checkEligibility(4, 250000);
    const agencies = getRelevantAgencies(result);
    const ids = agencies.map((a) => a.id);
    expect(ids).toContain('wu-yee');
    expect(ids).toContain('compass');
  });

  it('always includes Compass (homeless services)', () => {
    const result = checkEligibility(4, 999999);
    const agencies = getRelevantAgencies(result);
    expect(agencies.some((a) => a.id === 'compass')).toBe(true);
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
    expect(formatCurrency(311700)).toBe('$311,700');
  });

  it('rounds fractional amounts', () => {
    // maximumFractionDigits: 0 means no decimals
    expect(formatCurrency(50000.75)).toBe('$50,001');
  });
});
