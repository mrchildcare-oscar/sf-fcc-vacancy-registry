import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  checkEligibility,
  getThresholds,
  SF_RR_AGENCIES,
  EligibilityResult,
} from '../../lib/eligibility';

export function EligibilityScreener() {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [householdSize, setHouseholdSize] = useState<number>(0);
  const [income, setIncome] = useState<string>('');
  const [incomeType, setIncomeType] = useState<'monthly' | 'annual'>('annual');
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleCheck = () => {
    if (!householdSize || !income) return;

    const incomeNum = parseFloat(income.replace(/,/g, ''));
    if (isNaN(incomeNum)) return;

    const annualIncome = incomeType === 'monthly' ? incomeNum * 12 : incomeNum;
    setResult(checkEligibility(householdSize, annualIncome));
    setShowResult(true);
  };

  const handleReset = () => {
    setHouseholdSize(0);
    setIncome('');
    setResult(null);
    setShowResult(false);
  };

  const scrollToListings = () => {
    const listingsSection = document.getElementById('provider-listings');
    if (listingsSection) {
      listingsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Format income input with commas
  const handleIncomeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue) {
      const formatted = parseInt(numericValue).toLocaleString();
      setIncome(formatted);
    } else {
      setIncome('');
    }
  };

  const thresholds = householdSize ? getThresholds(householdSize) : null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 mb-6 overflow-hidden">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <div className="text-left">
            <div className="font-semibold text-gray-800">
              {t('eligibility.title')}
            </div>
            <div className="text-sm text-gray-600">
              {t('eligibility.subtitle')}
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-green-200">
          {!showResult ? (
            /* Input Form */
            <div className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Household Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('eligibility.householdSize')}
                  </label>
                  <select
                    value={householdSize}
                    onChange={(e) => setHouseholdSize(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value={0}>{t('eligibility.selectSize')}</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                      <option key={size} value={size}>
                        {size} {size === 1 ? t('eligibility.person') : t('eligibility.people')}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{t('eligibility.householdHint')}</p>
                </div>

                {/* Income */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('eligibility.yourIncome')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="text"
                      value={income}
                      onChange={(e) => handleIncomeChange(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="radio"
                        name="incomeType"
                        checked={incomeType === 'monthly'}
                        onChange={() => setIncomeType('monthly')}
                        className="text-green-600"
                      />
                      {t('eligibility.monthly')}
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="radio"
                        name="incomeType"
                        checked={incomeType === 'annual'}
                        onChange={() => setIncomeType('annual')}
                        className="text-green-600"
                      />
                      {t('eligibility.annual')}
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('eligibility.incomeHint')}</p>
                </div>
              </div>

              <button
                onClick={handleCheck}
                disabled={!householdSize || !income}
                className="w-full md:w-auto px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {t('eligibility.checkButton')}
              </button>

              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('eligibility.disclaimer')}
              </p>
            </div>
          ) : (
            /* Results */
            <div className="pt-4">
              <ResultsDisplay
                result={result!}
                thresholds={thresholds!}
                onReset={handleReset}
                onFindProviders={scrollToListings}
                language={language}
                t={t}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ResultsDisplayProps {
  result: EligibilityResult;
  thresholds: ReturnType<typeof getThresholds>;
  onReset: () => void;
  onFindProviders: () => void;
  language: 'en' | 'zh-TW';
  t: (key: string, params?: Record<string, string | number>) => string;
}

function ResultsDisplay({ result, onReset, onFindProviders, language, t }: ResultsDisplayProps) {
  // Determine which banner to show
  const hasFreeBenefit = result.elfaFree || result.elfaCredit100 || result.headStart || result.generalSubsidy || result.statePreschool;
  const hasDiscountOnly = !hasFreeBenefit && result.elfaDiscount50;
  const noPrograms = !result.anyProgram;

  return (
    <div className="space-y-4">
      {/* Banner */}
      {hasFreeBenefit && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
            <span>✅</span> {t('eligibility.results.eligible')}
          </h3>
          <p className="text-green-700 text-sm mt-1">{t('eligibility.results.eligibleDesc')}</p>
        </div>
      )}

      {hasDiscountOnly && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
            <span>💙</span> {t('eligibility.results.discount')}
          </h3>
          <p className="text-blue-700 text-sm mt-1">{t('eligibility.results.discountDesc')}</p>
        </div>
      )}

      {noPrograms && (
        <div className="bg-amber-100 border border-amber-300 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
            <span>⚠️</span> {t('eligibility.results.overIncome')}
          </h3>
          <p className="text-amber-700 text-sm mt-1">{t('eligibility.results.overIncomeDesc')}</p>
        </div>
      )}

      {/* Programs List */}
      {result.anyProgram && (
        <div className="space-y-2">
          {result.elfaFree && (
            <ProgramCard
              icon="🌟"
              title={t('eligibility.programs.elfaFree.title')}
              description={t('eligibility.programs.elfaFree.desc')}
              highlight
            />
          )}
          {result.elfaCredit100 && (
            <ProgramCard
              icon="🌟"
              title={t('eligibility.programs.elfaCredit100.title')}
              description={t('eligibility.programs.elfaCredit100.desc')}
              highlight
            />
          )}
          {result.elfaDiscount50 && (
            <ProgramCard
              icon="🌟"
              title={t('eligibility.programs.elfaDiscount50.title')}
              description={t('eligibility.programs.elfaDiscount50.desc')}
              comingSoon
            />
          )}
          {result.statePreschool && (
            <ProgramCard
              icon="📚"
              title={t('eligibility.programs.cspp.title')}
              description={t('eligibility.programs.cspp.desc')}
            />
          )}
          {result.generalSubsidy && (
            <ProgramCard
              icon="🎯"
              title={t('eligibility.programs.generalSubsidy.title')}
              description={t('eligibility.programs.generalSubsidy.desc')}
            />
          )}
          {result.headStart && (
            <ProgramCard
              icon="🌈"
              title={t('eligibility.programs.headStart.title')}
              description={t('eligibility.programs.headStart.desc')}
            />
          )}
        </div>
      )}

      {/* R&R Agencies */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span>📞</span> {t('eligibility.nextStep')}
        </h4>
        <p className="text-sm text-gray-600 mb-3">{t('eligibility.nextStepDesc')}</p>

        <div className="space-y-3">
          {SF_RR_AGENCIES.map((agency, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="font-medium text-gray-800">
                {language === 'zh-TW' ? agency.nameZh : agency.name}
              </div>
              <div className="text-sm text-gray-600">
                <a href={`tel:${agency.phone.replace(/[^0-9]/g, '')}`} className="text-blue-600 hover:underline">
                  {agency.phone}
                </a>
                {' • '}
                <a href={`https://${agency.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {agency.website}
                </a>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {language === 'zh-TW' ? agency.languagesZh.join(', ') : agency.languages.join(', ')}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-3">{t('eligibility.agencyNote')}</p>
      </div>

      {/* Other Options for Over-Income */}
      {noPrograms && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">{t('eligibility.otherOptions.title')}</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• {t('eligibility.otherOptions.sliding')}</li>
            <li>• {t('eligibility.otherOptions.employer')}</li>
            <li>• {t('eligibility.otherOptions.fsa')}</li>
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={onReset}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {t('eligibility.startOver')}
        </button>
        <button
          onClick={onFindProviders}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          {t('eligibility.findProviders')}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface ProgramCardProps {
  icon: string;
  title: string;
  description: string;
  highlight?: boolean;
  comingSoon?: boolean;
}

function ProgramCard({ icon, title, description, highlight, comingSoon }: ProgramCardProps) {
  return (
    <div className={`rounded-lg p-3 border ${
      highlight
        ? 'bg-green-50 border-green-200'
        : comingSoon
          ? 'bg-blue-50 border-blue-200'
          : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start gap-2">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="font-medium text-gray-800 flex items-center gap-2">
            {title}
            {comingSoon && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                July 2026
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>
      </div>
    </div>
  );
}
