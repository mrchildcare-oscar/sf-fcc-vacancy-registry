import { Child, CapacityConfig } from './types';

let childIdCounter = 0;

/**
 * Create a Child object with sensible defaults, overridable.
 */
export function makeChild(overrides: Partial<Child> = {}): Child {
  childIdCounter++;
  return {
    id: `child-${childIdCounter}`,
    firstName: `Child`,
    lastName: `${childIdCounter}`,
    dateOfBirth: '2023-01-15',
    enrollmentDate: '2024-01-15',
    ...overrides,
  };
}

/**
 * Create multiple children from an array of birth dates.
 */
export function makeChildren(birthDates: string[]): Child[] {
  return birthDates.map((dob) => makeChild({ dateOfBirth: dob }));
}

/**
 * Compute a date-of-birth string for a child who is exactly `ageMonths` months old
 * as of `asOf` (defaults to 2025-06-15, the frozen test date).
 */
export function dobForAgeMonths(ageMonths: number, asOf: Date = new Date('2025-06-15')): string {
  const d = new Date(asOf);
  d.setMonth(d.getMonth() - ageMonths);
  return d.toISOString().split('T')[0];
}

/** Small Family Child Care Home — max 8 children */
export const SMALL_FAMILY_CONFIG: CapacityConfig = {
  programType: 'small_family',
  totalCapacity: 8,
};

/** Large Family Child Care Home — max 14 children */
export const LARGE_FAMILY_CONFIG: CapacityConfig = {
  programType: 'large_family',
  totalCapacity: 14,
};
