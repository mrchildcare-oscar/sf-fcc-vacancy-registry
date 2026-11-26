// One lookup for everything that differs by site language, so components don't repeat
// `language === 'zh-TW' ? … : language === 'es' ? … : …` cascades.

export type Language = 'en' | 'zh-TW' | 'es';

interface LanguageInfo {
  /** Short code used by the static pages and NEIGHBORHOOD_ARTICLES labels. */
  short: 'en' | 'es' | 'zh';
  /** Path prefix of the static page set ('' for English at the root). */
  pathPrefix: '' | '/es' | '/zh';
  /** Locale for toLocaleDateString / Intl. */
  locale: string;
}

export const LANGUAGES: Record<Language, LanguageInfo> = {
  'en': { short: 'en', pathPrefix: '', locale: 'en-US' },
  'es': { short: 'es', pathPrefix: '/es', locale: 'es' },
  'zh-TW': { short: 'zh', pathPrefix: '/zh', locale: 'zh-TW' },
};
