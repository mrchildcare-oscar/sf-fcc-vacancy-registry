// Childcare Financial Assistance Eligibility Calculator
// Updated January 2026 with Mayor Lurie's ELFA expansion announcement

// Federal Poverty Level 2026 - for Head Start (200% FPL)
const FPL_2026 = {
  base: 15960,      // 1 person
  perPerson: 5680,  // additional per person
};

// California State Median Income 2025-26 (100% SMI values)
// Source: California Department of Education
const SMI_2025: Record<number, number> = {
  1: 96854,
  2: 96854,   // 1-2 persons same
  3: 109904,
  4: 127338,
  5: 147712,
  6: 168086,
  7: 171906,
  8: 175726,
  9: 179547,
  10: 183367,
  11: 187187,
  12: 191007,
};

// SF Area Median Income 2025-26 - ELFA Program
// Source: SF MOHCD, HUD median family income for SF HMFA
const SF_AMI_2025: Record<number, { ami110: number; ami150: number; ami200: number }> = {
  1: { ami110: 137150, ami150: 187050, ami200: 249400 },
  2: { ami110: 137150, ami150: 187050, ami200: 249400 },
  3: { ami110: 154300, ami150: 210400, ami200: 280500 },
  4: { ami110: 171450, ami150: 233800, ami200: 311700 },
  5: { ami110: 185150, ami150: 252450, ami200: 336600 },
  6: { ami110: 198900, ami150: 271200, ami200: 361600 },
  7: { ami110: 212600, ami150: 289900, ami200: 386500 },
  8: { ami110: 226250, ami150: 308550, ami200: 411400 },
  9: { ami110: 240000, ami150: 327300, ami200: 436400 },
  10: { ami110: 253700, ami150: 346000, ami200: 461300 },
};

export interface EligibilityResult {
  headStart: boolean;         // 200% FPL
  generalSubsidy: boolean;    // 85% SMI (CalWORKs, CCTR, CAPP)
  statePreschool: boolean;    // 100% SMI (CSPP)
  elfaFree: boolean;          // ≤110% AMI (fully funded)
  elfaCredit100: boolean;     // 111-150% AMI (100% credit = FREE/nearly free)
  elfaDiscount50: boolean;    // 151-200% AMI (50% discount, starting July 2026)
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
  const amiSize = Math.max(1, Math.min(householdSize, 10));

  const fpl100 = FPL_2026.base + (clampedSize - 1) * FPL_2026.perPerson;
  const smi100 = SMI_2025[clampedSize] || SMI_2025[12];
  const ami = SF_AMI_2025[amiSize] || SF_AMI_2025[10];

  return {
    fpl200: fpl100 * 2,
    smi85: Math.round(smi100 * 0.85),
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
    website: "childcaresf.org",
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
  }

  // Always show Compass for homeless families (at the end)
  agencies.push(SF_RR_AGENCIES.find(a => a.id === 'compass')!);

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
