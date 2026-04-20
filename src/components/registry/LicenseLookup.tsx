import { useState } from 'react';
import { Search, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { checkElfaStatus } from '../../lib/elfa';
import { PublicListing } from '../../types/registry';

type Result =
  | { kind: 'elfa'; hasListing: PublicListing | null }
  | { kind: 'notElfa' }
  | { kind: 'invalid' }
  | null;

interface LicenseLookupProps {
  listings: PublicListing[];
  onListingClick?: (providerId: string) => void;
}

export function LicenseLookup({ listings, onListingClick }: LicenseLookupProps) {
  const { t, language } = useLanguage();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Result>(null);
  const [checking, setChecking] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = input.trim();
    if (!/^\d{9}$/.test(cleaned)) {
      setResult({ kind: 'invalid' });
      return;
    }
    setChecking(true);
    const isElfa = await checkElfaStatus(cleaned);
    const match = listings.find((l) => l.license_number === cleaned) ?? null;
    setResult(isElfa ? { kind: 'elfa', hasListing: match } : { kind: 'notElfa' });
    setChecking(false);
  };

  const cdssUrl = 'https://www.cdss.ca.gov/inforesources/community-care-licensing/child-care-licensing';
  const elfaSourceUrl = 'https://www.sf.gov/department-san-francisco-department-of-early-childhood/elfa';
  const elfaInfoUrl =
    language === 'zh-TW'
      ? 'https://www.sf.gov/zh-hant/early-learning-for-all'
      : language === 'es'
      ? 'https://www.sf.gov/es/early-learning-for-all'
      : 'https://www.sf.gov/early-learning-for-all';

  return (
    <section
      id="verify-license"
      className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
      aria-labelledby="verify-license-heading"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Search size={18} className="text-blue-600" />
        </div>
        <div>
          <h2 id="verify-license-heading" className="text-base font-semibold text-gray-900">
            {t('licenseLookup.heading')}
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">{t('licenseLookup.helpText')}</p>
        </div>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{9}"
          maxLength={9}
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 9))}
          placeholder={t('licenseLookup.placeholder')}
          aria-label={t('licenseLookup.placeholder')}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
        />
        <button
          type="submit"
          disabled={checking || input.length !== 9}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checking ? '…' : t('licenseLookup.button')}
        </button>
      </form>

      {result?.kind === 'invalid' && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-gray-50 text-gray-700 rounded-lg text-sm">
          <XCircle size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
          <span>{t('licenseLookup.results.invalid')}</span>
        </div>
      )}

      {result?.kind === 'elfa' && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-emerald-900">{t('licenseLookup.results.elfa')}</p>
              <p className="text-xs text-emerald-800 mt-1">{t('licenseLookup.results.elfaBody')}</p>
              <a
                href={elfaSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:text-emerald-900 underline"
              >
                {t('licenseLookup.results.elfaSource')}
                <ExternalLink size={12} />
              </a>
              {result.hasListing && (
                <button
                  onClick={() => onListingClick?.(result.hasListing!.provider_id)}
                  className="mt-2 ml-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900 underline"
                >
                  {t('licenseLookup.results.viewListing')} →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {result?.kind === 'notElfa' && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">{t('licenseLookup.results.notElfa')}</p>
              <p className="text-xs text-amber-800 mt-1">{t('licenseLookup.results.notElfaBody')}</p>
              <a
                href={cdssUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:text-amber-900 underline"
              >
                {t('licenseLookup.cdssLink')}
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
        {t('licenseLookup.disclaimer')}{' '}
        <a href={elfaInfoUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
          {t('licenseLookup.elfaInfoLink')}
        </a>
        .
      </p>
    </section>
  );
}
