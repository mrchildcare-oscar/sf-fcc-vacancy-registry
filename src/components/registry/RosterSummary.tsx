import { useState } from 'react';
import { Child, CapacityConfig } from '../../types';
import { calculateProjectedOpenings } from '../../utils/projections';
import { Users, TrendingUp, Wand2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../../i18n/LanguageContext';

interface RosterSummaryProps {
  children: Child[];
  capacityConfig: CapacityConfig;
  onAutoFill?: (data: {
    infant_spots: number;
    toddler_spots: number;
    preschool_spots: number;
    school_age_spots: number;
  }) => void;
}

// Get age in months from DOB
function getAgeInMonths(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  return (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
}

// Get age in years from DOB
function getAgeInYears(dob: string): number {
  return getAgeInMonths(dob) / 12;
}

// Detailed age group for vacancy form (different from regulatory groups)
function getDetailedAgeGroup(dob: string): 'infant' | 'toddler' | 'preschool' | 'school_age' {
  const months = getAgeInMonths(dob);
  if (months < 24) return 'infant';      // Under 2
  if (months < 36) return 'toddler';     // 2-3 years
  if (months < 72) return 'preschool';   // 3-6 years
  return 'school_age';                    // 6+ years
}

/**
 * CA Regulation 102416.5 - School-age criteria for extended capacity
 *
 * Small Family (7-8 children) and Large Family (13-14 children) require:
 * - At least 1 child enrolled in K-12 (kindergarten starts ~age 5)
 * - At least 1 child age 6 or older
 *
 * These can be the same child (e.g., a 6-year-old in 1st grade)
 */
function checkSchoolAgeCriteria(children: Child[]): {
  hasK12Child: boolean;
  hasAge6Plus: boolean;
  qualifies: boolean;
} {
  let hasK12Child = false;   // At least 1 child in K-12 (typically age 5+)
  let hasAge6Plus = false;   // At least 1 child age 6+

  for (const child of children) {
    const ageYears = getAgeInYears(child.dateOfBirth);
    if (ageYears >= 5) hasK12Child = true;  // Kindergarten eligible
    if (ageYears >= 6) hasAge6Plus = true;
  }

  return {
    hasK12Child,
    hasAge6Plus,
    qualifies: hasK12Child && hasAge6Plus,
  };
}

/**
 * Get effective capacity based on school-age criteria
 * Without qualifying school-age children:
 * - Small Family: max 6 children (not 8)
 * - Large Family: max 12 children (not 14)
 */
function getEffectiveCapacity(
  programType: 'small_family' | 'large_family',
  licensedCapacity: number,
  qualifiesForExtended: boolean
): number {
  if (programType === 'small_family') {
    // Can only have 7-8 children if school-age criteria met
    return qualifiesForExtended ? licensedCapacity : Math.min(licensedCapacity, 6);
  } else {
    // Can only have 13-14 children if school-age criteria met
    return qualifiesForExtended ? licensedCapacity : Math.min(licensedCapacity, 12);
  }
}

/**
 * Get max infants allowed based on total children
 * This follows CA Regulation 102416.5
 */
function getMaxInfantsForTotal(
  programType: 'small_family' | 'large_family',
  totalChildren: number
): number {
  if (programType === 'small_family') {
    if (totalChildren <= 4) return 4;
    if (totalChildren <= 6) return 3;
    return 2; // 7-8 children
  } else {
    if (totalChildren <= 12) return 4;
    return 3; // 13-14 children
  }
}

/**
 * Calculate available infant spots by simulating progressive enrollment
 * This accounts for the fact that infant limits change as total enrollment increases
 */
function calculateInfantSpotsAvailable(
  programType: 'small_family' | 'large_family',
  currentInfants: number,
  currentTotal: number,
  effectiveCapacity: number
): number {
  const spotsLeft = effectiveCapacity - currentTotal;
  if (spotsLeft <= 0) return 0;

  let maxNewInfants = 0;

  // Simulate adding infants one by one
  for (let newInfants = 1; newInfants <= spotsLeft; newInfants++) {
    const newTotal = currentTotal + newInfants;
    const newInfantCount = currentInfants + newInfants;
    const maxAllowed = getMaxInfantsForTotal(programType, newTotal);

    if (newInfantCount <= maxAllowed) {
      maxNewInfants = newInfants;
    } else {
      break;
    }
  }

  return maxNewInfants;
}

type VacancyData = {
  infant_spots: number;
  toddler_spots: number;
  preschool_spots: number;
  school_age_spots: number;
};

export function RosterSummary({ children, capacityConfig, onAutoFill }: RosterSummaryProps) {
  const { t } = useLanguage();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<VacancyData | null>(null);
  const projections = calculateProjectedOpenings(children, 6);
  const programType = capacityConfig.programType;

  // Count children by detailed age groups
  const ageCounts = {
    infant: children.filter(c => getDetailedAgeGroup(c.dateOfBirth) === 'infant').length,
    toddler: children.filter(c => getDetailedAgeGroup(c.dateOfBirth) === 'toddler').length,
    preschool: children.filter(c => getDetailedAgeGroup(c.dateOfBirth) === 'preschool').length,
    school_age: children.filter(c => getDetailedAgeGroup(c.dateOfBirth) === 'school_age').length,
  };

  const totalEnrolled = children.length;
  const licensedCapacity = capacityConfig.totalCapacity;

  // Check if roster qualifies for extended capacity (7-8 for small, 13-14 for large)
  const schoolAgeStatus = checkSchoolAgeCriteria(children);

  // Calculate effective capacity based on school-age criteria
  // Without qualifying school-age children, capacity is limited:
  // - Small Family: max 6 (not 8)
  // - Large Family: max 12 (not 14)
  const effectiveCapacity = getEffectiveCapacity(
    programType,
    licensedCapacity,
    schoolAgeStatus.qualifies
  );

  const totalAvailable = Math.max(0, effectiveCapacity - totalEnrolled);

  // Calculate infant spots using progressive simulation
  const infantAvailable = calculateInfantSpotsAvailable(
    programType,
    ageCounts.infant,
    totalEnrolled,
    effectiveCapacity
  );

  const handleAutoFill = () => {
    if (!onAutoFill) return;

    // When auto-filling to capacity, we need to calculate max infants
    // based on the FINAL total enrollment, not progressive addition.
    //
    // Example: 0 enrolled, 6 capacity
    // - Progressive logic says "you can add 4 infants" (if adding only infants)
    // - But if filling to 6 total, max infants at 6 children is 3
    // - So auto-fill should suggest 3 infants + 3 non-infants

    const finalTotal = totalEnrolled + totalAvailable; // = effectiveCapacity
    const maxInfantsAtFinal = getMaxInfantsForTotal(programType, finalTotal);
    const currentInfants = ageCounts.infant;

    // Infant spots = max allowed at final total - current infants (capped at available)
    const infantSpotsForAutoFill = Math.max(0, Math.min(
      maxInfantsAtFinal - currentInfants,
      totalAvailable
    ));

    // Remaining spots go to non-infant age groups
    const remainingSpots = totalAvailable - infantSpotsForAutoFill;
    const spotsPerGroup = Math.floor(remainingSpots / 3);
    const extraSpots = remainingSpots % 3;

    // Distribute evenly: toddler gets extras first, then preschool
    const data: VacancyData = {
      infant_spots: infantSpotsForAutoFill,
      toddler_spots: spotsPerGroup + (extraSpots >= 1 ? 1 : 0),
      preschool_spots: spotsPerGroup + (extraSpots >= 2 ? 1 : 0),
      school_age_spots: spotsPerGroup,
    };

    // Show confirmation dialog instead of immediately submitting
    setPendingData(data);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (pendingData && onAutoFill) {
      onAutoFill(pendingData);
    }
    setShowConfirmation(false);
    setPendingData(null);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setPendingData(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users size={24} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('rosterSummary.title')}</h2>
            <p className="text-sm text-gray-500">{t('rosterSummary.subtitle')}</p>
          </div>
        </div>
        {children.length === 0 && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            {t('rosterSummary.noChildren')}
          </span>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-900">{totalEnrolled}</p>
          <p className="text-xs text-gray-500">{t('rosterSummary.enrolled')}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-900">{licensedCapacity}</p>
          <p className="text-xs text-gray-500">{t('rosterSummary.capacity')}</p>
        </div>
        <div className={`p-3 rounded-lg text-center ${totalAvailable > 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
          <p className={`text-2xl font-bold ${totalAvailable > 0 ? 'text-green-600' : 'text-gray-400'}`}>
            {totalAvailable}
          </p>
          <p className="text-xs text-gray-500">{t('rosterSummary.available')}</p>
        </div>
      </div>

      {/* School-age criteria warning */}
      {!schoolAgeStatus.qualifies && effectiveCapacity < licensedCapacity && (
        <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded mb-4 border border-amber-200">
          <span className="font-medium">{t('rosterSummary.capacityLimited')}:</span>{' '}
          {t('rosterSummary.needSchoolAge', { effective: effectiveCapacity, licensed: licensedCapacity })}
        </div>
      )}

      {/* Breakdown by age group - matches vacancy form */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="p-2 bg-pink-50 rounded-lg text-center border border-pink-200">
          <p className="text-lg font-bold text-pink-700">{ageCounts.infant}</p>
          <p className="text-xs text-pink-600">{t('vacancy.infant')}</p>
          <p className="text-xs text-pink-400">{t('vacancy.infantAge')}</p>
        </div>
        <div className="p-2 bg-orange-50 rounded-lg text-center border border-orange-200">
          <p className="text-lg font-bold text-orange-700">{ageCounts.toddler}</p>
          <p className="text-xs text-orange-600">{t('vacancy.toddler')}</p>
          <p className="text-xs text-orange-400">{t('vacancy.toddlerAge')}</p>
        </div>
        <div className="p-2 bg-green-50 rounded-lg text-center border border-green-200">
          <p className="text-lg font-bold text-green-700">{ageCounts.preschool}</p>
          <p className="text-xs text-green-600">{t('vacancy.preschool')}</p>
          <p className="text-xs text-green-400">{t('vacancy.preschoolAge')}</p>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg text-center border border-blue-200">
          <p className="text-lg font-bold text-blue-700">{ageCounts.school_age}</p>
          <p className="text-xs text-blue-600">{t('vacancy.schoolAge')}</p>
          <p className="text-xs text-blue-400">{t('vacancy.schoolAgeAge')}</p>
        </div>
      </div>

      {/* Infant compliance note */}
      {infantAvailable > 0 && (
        <div className="text-xs text-pink-600 bg-pink-50 p-2 rounded mb-4">
          <span className="font-medium">{t('rosterSummary.infantSpots')}:</span> {infantAvailable} ({t('rosterSummary.perRegulations')})
        </div>
      )}

      {/* Upcoming openings */}
      {projections.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-700">{t('rosterSummary.upcomingOpenings')}</span>
          </div>
          <div className="space-y-1">
            {projections.slice(0, 3).map((p, i) => (
              <div key={i} className="text-sm text-gray-600 flex justify-between">
                <span>{p.childName} ({p.reason.replace(/_/g, ' ')})</span>
                <span className="text-gray-400">{format(new Date(p.date), 'MMM d, yyyy')}</span>
              </div>
            ))}
            {projections.length > 3 && (
              <p className="text-xs text-gray-400">{t('rosterSummary.moreOpenings', { count: projections.length - 3 })}</p>
            )}
          </div>
        </div>
      )}

      {/* Auto-fill button */}
      {onAutoFill && (
        <div className="border-t pt-4 mt-4">
          <button
            onClick={handleAutoFill}
            disabled={totalAvailable === 0}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
              totalAvailable > 0
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Wand2 size={16} />
            {totalAvailable > 0
              ? t('rosterSummary.autoFill')
              : t('rosterSummary.noSpots')}
          </button>
          {totalAvailable > 0 && (
            <p className="text-xs text-gray-500 text-center mt-2">
              {t('rosterSummary.autoFillHelp')}
            </p>
          )}
        </div>
      )}

      {children.length === 0 && (
        <div className="text-center py-2 text-gray-500 text-sm border-t mt-4 pt-4">
          <p>{t('rosterSummary.addChildrenHelp')}</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && pendingData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {t('rosterSummary.confirmTitle')}
              </h3>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {t('rosterSummary.confirmMessage')}
            </p>

            <div className="space-y-2 mb-6">
              {pendingData.infant_spots > 0 && (
                <div className="flex justify-between items-center p-2 bg-pink-50 rounded-lg">
                  <span className="text-sm text-pink-700">{t('vacancy.infant')}</span>
                  <span className="font-bold text-pink-700">{pendingData.infant_spots} {pendingData.infant_spots === 1 ? t('rosterSummary.spot') : t('rosterSummary.spots')}</span>
                </div>
              )}
              {pendingData.toddler_spots > 0 && (
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
                  <span className="text-sm text-orange-700">{t('vacancy.toddler')}</span>
                  <span className="font-bold text-orange-700">{pendingData.toddler_spots} {pendingData.toddler_spots === 1 ? t('rosterSummary.spot') : t('rosterSummary.spots')}</span>
                </div>
              )}
              {pendingData.preschool_spots > 0 && (
                <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                  <span className="text-sm text-green-700">{t('vacancy.preschool')}</span>
                  <span className="font-bold text-green-700">{pendingData.preschool_spots} {pendingData.preschool_spots === 1 ? t('rosterSummary.spot') : t('rosterSummary.spots')}</span>
                </div>
              )}
              {pendingData.school_age_spots > 0 && (
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">{t('vacancy.schoolAge')}</span>
                  <span className="font-bold text-blue-700">{pendingData.school_age_spots} {pendingData.school_age_spots === 1 ? t('rosterSummary.spot') : t('rosterSummary.spots')}</span>
                </div>
              )}
              {pendingData.infant_spots === 0 && pendingData.toddler_spots === 0 &&
               pendingData.preschool_spots === 0 && pendingData.school_age_spots === 0 && (
                <div className="text-center text-gray-500 py-2">
                  {t('rosterSummary.noVacancies')}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                {t('rosterSummary.confirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
