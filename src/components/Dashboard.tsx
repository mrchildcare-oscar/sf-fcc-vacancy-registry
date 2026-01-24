import { Child, CapacityConfig, ProjectedOpening } from '../types';
import { calculateProjectedOpenings, getNextOpeningByAgeGroup } from '../utils/projections';
import { calculateComplianceStatus, getCapacityRuleDescription } from '../utils/compliance';
import { getAgeGroupConfig } from '../utils/ageGroups';
import { format, formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle, Users, Calendar, Clock, XCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface DashboardProps {
  children: Child[];
  capacityConfig: CapacityConfig;
}

export function Dashboard({ children, capacityConfig }: DashboardProps) {
  const { t } = useLanguage();
  const compliance = calculateComplianceStatus(children, capacityConfig);
  const projections = calculateProjectedOpenings(children, 12);

  return (
    <div className="space-y-6">
      {/* Compliance Status Banner */}
      {!compliance.isCompliant && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="font-semibold text-red-800">{t('projections.complianceViolation')}</h3>
              <ul className="mt-1 text-sm text-red-700 space-y-1">
                {compliance.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {compliance.warnings.length > 0 && compliance.isCompliant && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-medium text-amber-800">{t('projections.capacityNotices')}</h3>
              <ul className="mt-1 text-sm text-amber-700 space-y-1">
                {compliance.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('projections.totalEnrolled')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {compliance.totalChildren}
                <span className="text-sm font-normal text-gray-500"> / {compliance.maxTotalAllowed}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${compliance.isCompliant ? 'bg-green-100' : 'bg-red-100'}`}>
              {compliance.isCompliant ? (
                <CheckCircle size={24} className="text-green-600" />
              ) : (
                <XCircle size={24} className="text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('projections.infantsUnder2')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {compliance.infantCount}
                <span className="text-sm font-normal text-gray-500"> / {compliance.maxInfantsAllowed} {t('projections.max')}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${compliance.totalSpotsAvailable > 0 ? 'bg-emerald-100' : 'bg-gray-100'}`}>
              <Calendar size={24} className={compliance.totalSpotsAvailable > 0 ? 'text-emerald-600' : 'text-gray-400'} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('projections.spotsAvailable')}</p>
              <p className="text-2xl font-bold text-gray-900">{compliance.totalSpotsAvailable}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('projections.upcomingChanges')}</p>
              <p className="text-2xl font-bold text-gray-900">{projections.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Availability */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('projections.currentCapacityStatus')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Infant Status */}
          <div className={`border-2 rounded-lg p-4 ${
            compliance.infantCount > compliance.maxInfantsAllowed
              ? 'border-red-300 bg-red-50'
              : compliance.infantCount === compliance.maxInfantsAllowed
              ? 'border-amber-300 bg-amber-50'
              : 'border-pink-200'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-pink-600">{t('projections.infantUnder2')}</h4>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  compliance.infantSpotsAvailable > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {compliance.infantSpotsAvailable > 0
                  ? t('projections.canAdd', { count: compliance.infantSpotsAvailable })
                  : t('projections.cannotAddMore')}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {t('projections.enrolledMaxAllowed', { enrolled: compliance.infantCount, max: compliance.maxInfantsAllowed })}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {getCapacityRuleDescription(capacityConfig.programType, compliance.totalChildren)}
            </p>
            {compliance.infantSpotsAvailable <= 0 && (
              <NextOpeningInfo projections={projections} ageGroup="infant" label={t('projections.nextInfantSpotOpens')} />
            )}
          </div>

          {/* Non-Infant Status */}
          <div className="border-2 border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-blue-600">{t('projections.nonInfant2Plus')}</h4>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  compliance.totalSpotsAvailable > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {compliance.totalSpotsAvailable > 0
                  ? t('projections.spotsCount', { count: compliance.totalSpotsAvailable })
                  : t('projections.full')}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {t('projections.enrolledCount', { count: compliance.nonInfantCount })}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {t('projections.totalOfCapacity', { total: compliance.totalChildren, capacity: compliance.maxTotalAllowed })}
            </p>
            {compliance.totalSpotsAvailable <= 0 && (
              <NextOpeningInfo projections={projections} ageGroup="non_infant" label={t('projections.nextSpotOpens')} />
            )}
          </div>
        </div>

        {/* Capacity Rules Reference */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {t('projections.caRegTitle', { type: capacityConfig.programType === 'small_family' ? t('projections.smallFamily') : t('projections.largeFamily') })}
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            {capacityConfig.programType === 'small_family' ? (
              <>
                <p><strong>{t('projections.rule1to4')}:</strong> {t('projections.rule1to4Desc')}</p>
                <p><strong>{t('projections.rule5to6')}:</strong> {t('projections.rule5to6Desc')}</p>
                <p><strong>{t('projections.rule7to8')}:</strong> {t('projections.rule7to8Desc')}</p>
              </>
            ) : (
              <>
                <p><strong>{t('projections.rule1to12')}:</strong> {t('projections.rule1to12Desc')}</p>
                <p><strong>{t('projections.rule13to14')}:</strong> {t('projections.rule13to14Desc')}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Projected Changes Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('projections.projectedChanges12Months')}</h3>

        {projections.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t('projections.noProjectedChanges')}
          </p>
        ) : (
          <div className="space-y-3">
            {projections.map((opening, index) => {
              const groupConfig = getAgeGroupConfig(opening.ageGroup);
              const reasonLabels: Record<ProjectedOpening['reason'], string> = {
                aging_into_next_group: t('projections.reasonTurns2'),
                aging_out: t('projections.reasonAgingOut'),
                kindergarten: t('projections.reasonKindergarten'),
                scheduled_departure: t('projections.reasonScheduledDeparture'),
              };

              return (
                <div
                  key={`${opening.childId}-${opening.date}-${index}`}
                  className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
                >
                  <div className="w-24 text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(opening.date), 'MMM d')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(opening.date), 'yyyy')}
                    </p>
                  </div>

                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: groupConfig.color }}
                  />

                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {opening.childName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {reasonLabels[opening.reason]}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(opening.date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function NextOpeningInfo({
  projections,
  ageGroup,
  label,
}: {
  projections: ProjectedOpening[];
  ageGroup: 'infant' | 'non_infant';
  label: string;
}) {
  const nextOpening = getNextOpeningByAgeGroup(projections, ageGroup);

  if (!nextOpening) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-xs text-gray-500">{label}:</p>
      <p className="text-sm font-medium text-gray-700">
        {format(new Date(nextOpening.date), 'MMM d, yyyy')}
      </p>
      <p className="text-xs text-gray-500">
        ({formatDistanceToNow(new Date(nextOpening.date), { addSuffix: true })})
      </p>
    </div>
  );
}
