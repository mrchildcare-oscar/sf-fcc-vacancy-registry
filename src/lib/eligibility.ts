// Childcare Financial Assistance Eligibility Calculator
// Income ceilings: FY 2026-27, from SF DEC's combined eligibility sheet (all five standards on
// one table). DEC REISSUES IT EVERY JULY and has amended it mid-year before, so check the
// fiscal year on the sheet before trusting these. Superseded FY 2025-26 on 2026-09-07; every
// old ceiling was lower, which told families they did not qualify when they did.

// Federal Poverty Level 2026 - for Head Start (200% FPL)
const FPL_2026 = {
  base: 15960,      // 1 person
  perPerson: 5680,  // additional per person
};

// California State Median Income, FY 2026-27 (100% SMI, annual, by family size)
// Source: SF DEC "FY 2026-2027 San Francisco Family Income Eligibility"; CSPP column, which cites
// CDE Management Bulletin 26-03 off the 2024 ACS PUMS. DEC reissues this sheet every July.
const SMI_FY2627: Record<number, number> = {
  1: 100510,
  2: 100510,  // DEC combines 1- and 2-person households on the 2-person figure
  3: 113708,
  4: 136044,
  5: 157811,
  6: 179578,
  7: 183659,
  8: 187741,
  9: 191822,
  10: 195903,
  11: 199985,
  12: 204066,
};

// 85% SMI - the CCTR / CalWORKs ceiling, as PUBLISHED. Do not derive this from the 100% column:
// 0.85 x 136,044 = 115,637, but the published family-of-four ceiling is 115,632, and eligibility
// turns on the published figure rather than our arithmetic.
// Source: same sheet, CCTR column, citing CDSS via Dept of Finance, March 2026.
const SMI85_FY2627: Record<number, number> = {
  1: 85428,
  2: 85428,
  3: 96648,
  4: 115632,
  5: 134136,
  6: 152640,
  7: 156108,
  8: 159576,
  9: 163044,
  10: 166512,
  11: 169992,
  12: 173460,
};

// SF Area Median Income, FY 2026-27 - the three ELFA tiers, annual, by family size.
// Source: same sheet, citing HUD published 2026-05-01 via sf.gov/find-your-area-median-income-ami-level.
// DEC's note: its source data stops at 11 people, so the 12-person row mirrors the 11-person row.
const SF_AMI_FY2627: Record<number, { ami110: number; ami150: number; ami200: number }> = {
  1: { ami110: 142650, ami150: 194550, ami200: 259400 },
  2: { ami110: 142650, ami150: 194550, ami200: 259400 },
  3: { ami110: 160500, ami150: 218850, ami200: 291800 },
  4: { ami110: 178300, ami150: 243150, ami200: 324200 },
  5: { ami110: 192550, ami150: 262600, ami200: 350100 },
  6: { ami110: 206850, ami150: 282100, ami200: 376100 },
  7: { ami110: 221100, ami150: 301500, ami200: 402000 },
  8: { ami110: 235350, ami150: 320950, ami200: 427900 },
  9: { ami110: 249650, ami150: 340450, ami200: 453900 },
  10: { ami110: 263900, ami150: 359850, ami200: 479800 },
  11: { ami110: 278200, ami150: 379350, ami200: 505800 },
  12: { ami110: 278200, ami150: 379350, ami200: 505800 },
};

export interface EligibilityResult {
  headStart: boolean;         // 200% FPL
  generalSubsidy: boolean;    // 85% SMI (CalWORKs, CCTR, CAPP)
  statePreschool: boolean;    // 100% SMI (CSPP)
  elfaFree: boolean;          // ≤110% AMI (fully funded)
  elfaCredit100: boolean;     // 111-150% AMI (100% credit = FREE/nearly free)
  elfaDiscount50: boolean;    // 151-200% AMI (tuition credit, starting July 2026)
  anyProgram: boolean;
}

export interface IncomeThresholds {
  fpl200: number;
  smi85: number;
  smi100: number;
  ami110: number;
  ami150: number;
  ami200: number;
}

/**
 * Get the income thresholds for a given household size
 */
export function getThresholds(householdSize: number): IncomeThresholds {
  const clampedSize = Math.max(1, Math.min(householdSize, 12));

  const fpl100 = FPL_2026.base + (clampedSize - 1) * FPL_2026.perPerson;
  const smi100 = SMI_FY2627[clampedSize] || SMI_FY2627[12];
  const smi85 = SMI85_FY2627[clampedSize] || SMI85_FY2627[12];
  const ami = SF_AMI_FY2627[clampedSize] || SF_AMI_FY2627[12];

  return {
    fpl200: fpl100 * 2,
    smi85: smi85,
    smi100: smi100,
    ami110: ami.ami110,
    ami150: ami.ami150,
    ami200: ami.ami200,
  };
}

/**
 * Check eligibility for all childcare assistance programs
 * @param householdSize Number of people in household
 * @param annualIncome Total annual household income (before taxes)
 */
export function checkEligibility(
  householdSize: number,
  annualIncome: number
): EligibilityResult {
  const thresholds = getThresholds(householdSize);

  return {
    headStart: annualIncome <= thresholds.fpl200,
    generalSubsidy: annualIncome <= thresholds.smi85,
    statePreschool: annualIncome <= thresholds.smi100,
    elfaFree: annualIncome <= thresholds.ami110,
    elfaCredit100: annualIncome > thresholds.ami110 && annualIncome <= thresholds.ami150,
    elfaDiscount50: annualIncome > thresholds.ami150 && annualIncome <= thresholds.ami200,
    anyProgram: annualIncome <= thresholds.ami200,
  };
}

// R&R Agency Information
export interface RRAgency {
  id: string;
  name: string;
  nameZh: string;
  phone: string;
  email: string;
  address: string;
  addressZh: string;
  website: string;
  forTiers: ('free' | 'credit100' | 'credit50' | 'homeless')[];
  description: string;
  descriptionZh: string;
}

export const SF_RR_AGENCIES: RRAgency[] = [
  {
    id: 'childrens-council',
    name: "Children's Council of San Francisco",
    nameZh: "舊金山兒童議會",
    phone: "415-343-3300",
    email: "rr@childrenscouncil.org",
    address: "445 Church Street, San Francisco, CA 94114",
    addressZh: "445 Church Street, San Francisco, CA 94114",
    website: "childrenscouncil.org",
    forTiers: ['free'],
    description: "For Fully-Funded ELFA applications (≤110% AMI)",
    descriptionZh: "適用於全額補助 ELFA 申請（≤110% AMI）",
  },
  {
    id: 'wu-yee',
    name: "Wu Yee Children's Services",
    nameZh: "護兒兒童服務",
    phone: "844-644-4300",
    email: "randr@wuyee.org",
    address: "880 Clay St., Floor 3, San Francisco, CA 94108",
    addressZh: "880 Clay St., 3樓, San Francisco, CA 94108",
    website: "wuyee.org",
    forTiers: ['free', 'credit100', 'credit50'],
    description: "For Tuition Credit AND Fully-Funded ELFA applications (all income tiers)",
    descriptionZh: "適用於學費抵免和全額補助 ELFA 申請（所有收入等級）",
  },
  {
    id: 'compass',
    name: "Compass Family Services",
    nameZh: "Compass 家庭服務",
    phone: "415-644-0504 x 2330",
    email: "access@compass-sf.org",
    address: "37 Grove Street, San Francisco, CA 94102",
    addressZh: "37 Grove Street, San Francisco, CA 94102",
    website: "compass-sf.org",
    forTiers: ['homeless'],
    description: "For families currently experiencing homelessness",
    descriptionZh: "適用於目前正在經歷無家可歸的家庭",
  },
];

/**
 * Get relevant R&R agencies based on eligibility result
 */
export function getRelevantAgencies(result: EligibilityResult): RRAgency[] {
  const agencies: RRAgency[] = [];

  if (result.elfaFree) {
    // For fully-funded: show both Children's Council and Wu Yee
    agencies.push(SF_RR_AGENCIES.find(a => a.id === 'childrens-council')!);
    agencies.push(SF_RR_AGENCIES.find(a => a.id === 'wu-yee')!);
  } else if (result.elfaCredit100 || result.elfaDiscount50) {
    // For tuition credit tiers: Wu Yee only
    agencies.push(SF_RR_AGENCIES.find(a => a.id === 'wu-yee')!);
  } else {
    // Over income: R&R agencies can still help find care
    agencies.push(SF_RR_AGENCIES.find(a => a.id === 'childrens-council')!);
    agencies.push(SF_RR_AGENCIES.find(a => a.id === 'wu-yee')!);
  }

  return agencies;
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
