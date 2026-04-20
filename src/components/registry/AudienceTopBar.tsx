import { useEffect, useState } from 'react';
import { useLanguage, LanguageSwitcher } from '../../i18n/LanguageContext';
import { trackListProgramClicked } from '../../lib/analytics';

const PROVIDER_HASHES = ['#list-your-vacancy', '#auth', '#vacancies', '#inquiries', '#roster', '#projections', '#settings', '#org'];

export function AudienceTopBar() {
  const { t } = useLanguage();
  const [hash, setHash] = useState<string>(typeof window !== 'undefined' ? window.location.hash : '');

  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const isProviderView = PROVIDER_HASHES.some((h) => hash.startsWith(h));
  const isParentView = !isProviderView;

  const handleParent = () => {
    window.location.hash = '#public';
  };

  const handleProvider = () => {
    trackListProgramClicked('top_bar');
    window.location.hash = '#list-your-vacancy';
  };

  const tabBase =
    'flex items-center justify-center font-bold text-[11px] normal-case sm:text-[10px] sm:uppercase sm:tracking-[0.15em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-1';

  return (
    <div
      role="tablist"
      aria-label="Audience"
      className="fixed top-0 left-0 right-0 z-[60] h-11 grid grid-cols-[1fr_1fr_auto] items-stretch"
    >
      <button
        role="tab"
        aria-selected={isParentView}
        onClick={handleParent}
        className={
          tabBase + ' border-r border-gray-200 ' +
          (isParentView ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50')
        }
      >
        {t('audienceBar.parent')}
      </button>
      <button
        role="tab"
        aria-selected={isProviderView}
        onClick={handleProvider}
        className={
          tabBase + ' border-r border-gray-200 ' +
          (isProviderView ? 'bg-amber-500 text-white' : 'bg-white text-amber-700 hover:bg-amber-50')
        }
      >
        {t('audienceBar.provider')}
      </button>
      <div className="flex items-center px-2 bg-white">
        <LanguageSwitcher compact />
      </div>
    </div>
  );
}
