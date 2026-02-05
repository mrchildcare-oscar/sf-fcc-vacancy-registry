import { useState, useEffect } from 'react';
import { Baby, Clock, Calendar, Save, AlertCircle, CheckCircle, AlertTriangle, ClipboardList, Code, Copy, Check, ChevronDown, ChevronUp, Shuffle } from 'lucide-react';
import { getMaxInfantsAllowed } from '../../utils/compliance';
import { useLanguage } from '../../i18n/LanguageContext';

interface VacancyFormProps {
  initialData?: VacancyFormData;
  onSubmit: (data: VacancyFormData) => Promise<{ error?: string }>;
  programType: 'small_family' | 'large_family';
  currentEnrollment?: {
    total: number;
    infants: number;
  };
  licenseNumber?: string;
}

export interface VacancyFormData {
  infant_spots: number;
  toddler_spots: number;
  preschool_spots: number;
  school_age_spots: number;
  accepting_infants: boolean;
  accepting_toddlers: boolean;
  accepting_preschool: boolean;
  accepting_school_age: boolean;
  available_date: string;
  full_time_available: boolean;
  part_time_available: boolean;
  waitlist_available: boolean;
  notes: string;
}

const DEFAULT_DATA: VacancyFormData = {
  infant_spots: 0,
  toddler_spots: 0,
  preschool_spots: 0,
  school_age_spots: 0,
  accepting_infants: false,
  accepting_toddlers: false,
  accepting_preschool: false,
  accepting_school_age: false,
  available_date: new Date().toISOString().split('T')[0],
  full_time_available: true,
  part_time_available: false,
  waitlist_available: false,
  notes: '',
};

export function VacancyForm({ initialData, onSubmit, programType, currentEnrollment, licenseNumber }: VacancyFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<VacancyFormData>(initialData || DEFAULT_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync form data when initialData changes (e.g., from auto-fill)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const totalSpots = formData.infant_spots + formData.toddler_spots +
    formData.preschool_spots + formData.school_age_spots;

  const maxCapacity = programType === 'small_family' ? 8 : 14;

  // Compliance check for infant limits
  // IMPORTANT: Must calculate based on PROJECTED total (current + reported spots)
  // not just current enrollment. CA Reg 102416.5 limits change with total count.
  const complianceWarning = (() => {
    if (!currentEnrollment) return null;

    const availableSpots = maxCapacity - currentEnrollment.total;

    // Check if reporting more spots than actually available
    if (totalSpots > availableSpots) {
      return {
        type: 'error' as const,
        message: t('vacancy.complianceCapacityError', {
          enrolled: currentEnrollment.total,
          capacity: maxCapacity,
          available: availableSpots,
          reporting: totalSpots,
        }),
      };
    }

    // Calculate infant limit based on PROJECTED total after filling spots
    // Example: 0 enrolled + 7 spots = 7 total → max 2 infants (not 4!)
    const projectedTotal = currentEnrollment.total + totalSpots;
    const maxInfantsAtProjectedTotal = getMaxInfantsAllowed(programType, projectedTotal);
    const projectedInfants = currentEnrollment.infants + formData.infant_spots;

    // Check if projected infant count would violate regulations
    if (projectedInfants > maxInfantsAtProjectedTotal) {
      return {
        type: 'error' as const,
        message: t('vacancy.complianceInfantWarning', {
          total: projectedTotal,
          infants: projectedInfants,
          allowed: maxInfantsAtProjectedTotal,
          reporting: formData.infant_spots,
        }),
      };
    }

    return null;
  })();

  const handleSpotChange = (field: keyof VacancyFormData, value: number) => {
    const newValue = Math.max(0, value);
    setFormData(prev => ({ ...prev, [field]: newValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Auto-set accepting flags based on spots > 0
    const dataToSubmit: VacancyFormData = {
      ...formData,
      accepting_infants: formData.infant_spots > 0,
      accepting_toddlers: formData.toddler_spots > 0,
      accepting_preschool: formData.preschool_spots > 0,
      accepting_school_age: formData.school_age_spots > 0,
    };

    setLoading(true);
    const result = await onSubmit(dataToSubmit);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Baby size={24} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('vacancy.title')}</h2>
          <p className="text-sm text-gray-500">{t('vacancy.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Age Group Spots */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('vacancy.availableSpotsByAge')}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Infant */}
            <div className="p-4 border border-pink-200 rounded-lg bg-pink-50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-pink-700">{t('vacancy.infant')}</span>
                <span className="text-xs text-pink-500">{t('vacancy.infantAge')}</span>
              </div>
              <input
                type="number"
                min="0"
                max="4"
                value={formData.infant_spots}
                onChange={e => handleSpotChange('infant_spots', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-pink-300 rounded-lg text-center text-lg font-bold"
              />
            </div>

            {/* Toddler */}
            <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-orange-700">{t('vacancy.toddler')}</span>
                <span className="text-xs text-orange-500">{t('vacancy.toddlerAge')}</span>
              </div>
              <input
                type="number"
                min="0"
                max={maxCapacity}
                value={formData.toddler_spots}
                onChange={e => handleSpotChange('toddler_spots', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-orange-300 rounded-lg text-center text-lg font-bold"
              />
            </div>

            {/* Preschool */}
            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-green-700">{t('vacancy.preschool')}</span>
                <span className="text-xs text-green-500">{t('vacancy.preschoolAge')}</span>
              </div>
              <input
                type="number"
                min="0"
                max={maxCapacity}
                value={formData.preschool_spots}
                onChange={e => handleSpotChange('preschool_spots', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-green-300 rounded-lg text-center text-lg font-bold"
              />
            </div>

            {/* School Age */}
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-blue-700">{t('vacancy.schoolAge')}</span>
                <span className="text-xs text-blue-500">{t('vacancy.schoolAgeAge')}</span>
              </div>
              <input
                type="number"
                min="0"
                max={maxCapacity}
                value={formData.school_age_spots}
                onChange={e => handleSpotChange('school_age_spots', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-center text-lg font-bold"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-500">
              {totalSpots === 0 ? (
                <span className="text-amber-600">{t('vacancy.reportingAsFull')}</span>
              ) : (
                <>{t('vacancy.totalSpotsReported')}: <strong>{totalSpots}</strong></>
              )}
            </p>
            {totalSpots > 0 && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  infant_spots: 0,
                  toddler_spots: 0,
                  preschool_spots: 0,
                  school_age_spots: 0,
                }))}
                className="text-xs text-gray-500 hover:text-red-600 underline"
              >
                {t('common.clearAll')}
              </button>
            )}
          </div>

          {complianceWarning && (
            <div className={`flex items-start gap-2 mt-3 p-3 rounded-lg ${
              complianceWarning.type === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>{complianceWarning.type === 'error' ? t('vacancy.violation') : t('vacancy.warning')}:</strong>{' '}
                {complianceWarning.message}
              </div>
            </div>
          )}
        </div>

        {/* Availability Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar size={14} className="inline mr-1" />
            {t('vacancy.whenAvailable')}
          </label>
          <input
            type="date"
            value={formData.available_date}
            onChange={e => setFormData(prev => ({ ...prev, available_date: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock size={14} className="inline mr-1" />
            {t('vacancy.scheduleOptions')}
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.full_time_available}
                onChange={e => setFormData(prev => ({ ...prev, full_time_available: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">{t('vacancy.fullTime')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.part_time_available}
                onChange={e => setFormData(prev => ({ ...prev, part_time_available: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">{t('vacancy.partTime')}</span>
            </label>
          </div>
        </div>

        {/* Waitlist */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.waitlist_available}
              onChange={e => setFormData(prev => ({ ...prev, waitlist_available: e.target.checked }))}
              className="rounded"
            />
            <ClipboardList size={14} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{t('vacancy.waitlistAvailable')}</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            {t('vacancy.waitlistHelp')}
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('vacancy.additionalNotes')}
          </label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            placeholder={t('vacancy.notesPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
            <CheckCircle size={16} />
            <span>{t('vacancy.successMessage')}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
        >
          <Save size={18} />
          {loading ? t('common.saving') : t('vacancy.updateVacancies')}
        </button>

        <p className="text-xs text-gray-500 text-center">
          {t('vacancy.visibilityNote')}
          <br />
          {t('vacancy.keepUpdatedNote')}
        </p>

        {/* Listing Order Info */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start gap-2.5">
            <Shuffle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                {t('vacancy.listingOrderTitle')}
              </h4>
              <p className="text-xs text-blue-700 mt-0.5">
                {t('vacancy.listingOrderDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Embed Code Section */}
        {licenseNumber && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowEmbedCode(!showEmbedCode)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Code size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {t('vacancy.embedOnWebsite')}
                </span>
              </div>
              {showEmbedCode ? (
                <ChevronUp size={18} className="text-gray-400" />
              ) : (
                <ChevronDown size={18} className="text-gray-400" />
              )}
            </button>

            {showEmbedCode && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-gray-500">
                  {t('vacancy.embedDescription')}
                </p>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`<div id="fcc-vacancy-widget" data-provider="${licenseNumber}"></div>
<script src="https://beta.familychildcaresf.com/widget.js"></script>`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
`<div id="fcc-vacancy-widget" data-provider="${licenseNumber}"></div>
<script src="https://beta.familychildcaresf.com/widget.js"></script>`
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  {t('vacancy.embedNote')}
                </p>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
