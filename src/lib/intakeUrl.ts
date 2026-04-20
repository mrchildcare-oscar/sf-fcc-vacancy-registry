type Language = 'en' | 'zh-TW' | 'es';

const LANG_PARAM: Record<Language, string> = {
  'en': 'en',
  'es': 'es',
  'zh-TW': 'zh',
};

export function buildIntakeUrl(base: string | undefined, language: Language): string | undefined {
  if (!base) return undefined;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}language=${LANG_PARAM[language]}`;
}
