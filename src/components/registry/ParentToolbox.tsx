import { useEffect, useState } from 'react';
import { Calculator, Search, BookOpen, HelpCircle, X, Baby, Home, DollarSign, MapPin } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { PublicListing } from '../../types/registry';
import { EligibilityScreener } from './EligibilityScreener';
import { LicenseLookup } from './LicenseLookup';
import { WhyFamilyChildCare } from './WhyFamilyChildCare';

type Tool = 'eligibility' | 'license' | 'evaluate' | 'aboutFcc' | null;

interface ElfaStats {
  elfaPrograms: number;
  elfaTotalSlots: number;
  elfaInfantSlots: number;
  elfaToddlerSlots: number;
  elfaPreschoolSlots: number;
  elfaSchoolAgeSlots: number;
}

interface ParentToolboxProps {
  listings: PublicListing[];
  vacancyStats: ElfaStats;
  onListingClick: (providerId: string) => void;
}

const EVALUATE_LINKS = [
  { key: 'childCareGuide', href: '/child-care-san-francisco/', icon: BookOpen },
  { key: 'fccVsCenters', href: '/family-child-care-vs-centers/', icon: Home },
  { key: 'infantCare', href: '/infant-care-san-francisco/', icon: Baby },
  { key: 'financialAssistance', href: '/financial-assistance/', icon: DollarSign },
  { key: 'neighborhoods', href: '/neighborhoods/', icon: MapPin },
] as const;

function hashToTool(hash: string): Tool {
  if (hash.startsWith('#verify-license')) return 'license';
  if (hash.startsWith('#check-eligibility') || hash.startsWith('#eligibility-screener')) return 'eligibility';
  if (hash.startsWith('#evaluate')) return 'evaluate';
  if (hash.startsWith('#about-fcc')) return 'aboutFcc';
  return null;
}

export function ParentToolbox({ listings, vacancyStats, onListingClick }: ParentToolboxProps) {
  const { t, language } = useLanguage();
  const [active, setActive] = useState<Tool>(() =>
    typeof window !== 'undefined' ? hashToTool(window.location.hash) : null,
  );

  useEffect(() => {
    const onHash = () => setActive(hashToTool(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const TOOLS: Array<{ id: Exclude<Tool, null>; icon: typeof Calculator; labelKey: string; descKey: string }> = [
    { id: 'eligibility', icon: Calculator, labelKey: 'toolbox.eligibility.label', descKey: 'toolbox.eligibility.desc' },
    { id: 'license', icon: Search, labelKey: 'toolbox.license.label', descKey: 'toolbox.license.desc' },
    { id: 'evaluate', icon: BookOpen, labelKey: 'toolbox.evaluate.label', descKey: 'toolbox.evaluate.desc' },
    { id: 'aboutFcc', icon: HelpCircle, labelKey: 'toolbox.aboutFcc.label', descKey: 'toolbox.aboutFcc.desc' },
  ];

  const handleToggle = (id: Exclude<Tool, null>) => {
    setActive((prev) => (prev === id ? null : id));
  };

  const activeColor: Record<Exclude<Tool, null>, string> = {
    eligibility: 'border-emerald-500 bg-emerald-50',
    license: 'border-blue-500 bg-blue-50',
    evaluate: 'border-indigo-500 bg-indigo-50',
    aboutFcc: 'border-amber-500 bg-amber-50',
  };

  const iconColor: Record<Exclude<Tool, null>, string> = {
    eligibility: 'text-emerald-600',
    license: 'text-blue-600',
    evaluate: 'text-indigo-600',
    aboutFcc: 'text-amber-600',
  };

  return (
    <section className="mb-6" aria-label={t('toolbox.heading')}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        {t('toolbox.heading')}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = active === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => handleToggle(tool.id)}
              aria-expanded={isActive}
              aria-controls="toolbox-panel"
              className={
                'flex flex-col items-start gap-1 p-3 border rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ' +
                (isActive
                  ? activeColor[tool.id] + ' shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300')
              }
            >
              <Icon size={20} className={isActive ? iconColor[tool.id] : 'text-gray-500'} />
              <span className="text-sm font-semibold text-gray-900 leading-tight">
                {t(tool.labelKey)}
              </span>
              <span className="text-xs text-gray-500 leading-snug line-clamp-2">
                {t(tool.descKey)}
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <div
          id="toolbox-panel"
          className="mt-3 bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative"
        >
          <button
            onClick={() => setActive(null)}
            aria-label={t('common.close')}
            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <X size={18} />
          </button>

          {active === 'eligibility' && (
            <EligibilityScreener isOpen={true} onToggle={() => setActive(null)} elfaStats={vacancyStats} />
          )}

          {active === 'license' && (
            <LicenseLookup listings={listings} onListingClick={onListingClick} />
          )}

          {active === 'evaluate' && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{t('toolbox.evaluate.heading')}</h3>
              <p className="text-sm text-gray-600 mb-4">{t('toolbox.evaluate.body')}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {EVALUATE_LINKS.map(({ key, href, icon: Icon }) => (
                  <a
                    key={key}
                    href={`${language === 'zh-TW' ? '/zh' : language === 'es' ? '/es' : ''}${href}`}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
                  >
                    <Icon size={18} className="text-indigo-600 mb-1.5" />
                    <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 block">
                      {t(`publicListings.resources.${key}.title`)}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {t(`publicListings.resources.${key}.desc`)}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {active === 'aboutFcc' && <WhyFamilyChildCare />}
        </div>
      )}
    </section>
  );
}
