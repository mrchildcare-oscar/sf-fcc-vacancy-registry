import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, MapPin, Languages as LanguagesIcon, Baby, Clock } from 'lucide-react';
import { PublicListing, CommunitySnapshot } from '../../types/registry';
import { getListingFreshness } from '../../lib/vacancyTtl';
import { getCommunitySnapshots } from '../../lib/supabase';
import { useLanguage } from '../../i18n/LanguageContext';

interface CommunityInsightsProps {
  listings: PublicListing[];
  loading: boolean;
}

// Age-range labels reuse the trilingual reporting-form keys (vacancy.*) so the page
// agrees with what providers actually entered, in every language. All other copy lives
// under the `insights.*` namespace in i18n/*.json.
const AGE_LABELS: { key: 'infant_spots' | 'toddler_spots' | 'preschool_spots' | 'school_age_spots'; labelKey: string; subKey: string }[] = [
  { key: 'infant_spots', labelKey: 'vacancy.infant', subKey: 'vacancy.infantAge' },
  { key: 'toddler_spots', labelKey: 'vacancy.toddler', subKey: 'vacancy.toddlerAge' },
  { key: 'preschool_spots', labelKey: 'vacancy.preschool', subKey: 'vacancy.preschoolAge' },
  { key: 'school_age_spots', labelKey: 'vacancy.schoolAge', subKey: 'vacancy.schoolAgeAge' },
];

const LOCALE_MAP: Record<string, string> = { en: 'en-US', es: 'es-ES', 'zh-TW': 'zh-TW' };

function Bar({ label, sub, value, max }: { label: string; sub?: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className={`w-32 shrink-0 text-sm text-gray-600 ${sub ? '' : 'truncate'}`} title={sub ? `${label} · ${sub}` : label}>
        {label}
        {sub ? <span className="ml-1 text-xs text-gray-400">{sub}</span> : null}
      </div>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-gray-900">{value}</div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
        <span className="text-teal-600">{icon}</span>
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

// Dependency-free sparkline (no chart lib in this project, and one page doesn't justify adding one).
function Sparkline({ title, points }: { title: string; points: { month: string; value: number }[] }) {
  const w = 320;
  const h = 72;
  const pad = 8;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: pad + i * stepX,
    y: h - pad - ((p.value - min) / span) * (h - pad * 2),
  }));
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const latest = points[points.length - 1];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-sm font-medium text-gray-700">{title}</div>
        <div className="text-2xl font-bold tabular-nums text-gray-900">{latest.value}</div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-16 w-full">
        <path d={path} fill="none" stroke="#14b8a6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={2.5} fill="#14b8a6" />)}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-gray-400">
        <span>{points[0].month}</span>
        <span>{latest.month}</span>
      </div>
    </div>
  );
}

export function CommunityInsights({ listings, loading }: CommunityInsightsProps) {
  const { t, language } = useLanguage();
  const locale = LOCALE_MAP[language] || 'en-US';

  const stats = useMemo(() => {
    const totalPrograms = listings.length;
    const totalSpots = listings.reduce((s, l) => s + (l.total_spots_available || 0), 0);
    const elfa = listings.filter((l) => l.is_elfa_network).length;
    const beyondElfa = totalPrograms - elfa;
    const waitlistOnly = listings.filter((l) => (l.total_spots_available || 0) === 0 && l.waitlist_available).length;

    const byAge = AGE_LABELS.map((a) => ({
      labelKey: a.labelKey,
      subKey: a.subKey,
      value: listings.reduce((s, l) => s + (l[a.key] || 0), 0),
    }));

    const neighborhoodMap = new Map<string, number>();
    for (const l of listings) {
      const key = (l.neighborhood && l.neighborhood.trim()) || 'Unlisted';
      neighborhoodMap.set(key, (neighborhoodMap.get(key) || 0) + 1);
    }
    const byNeighborhood = [...neighborhoodMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const languageMap = new Map<string, number>();
    for (const l of listings) {
      for (const lang of l.languages || []) {
        const key = (lang && lang.trim()) || 'Other';
        languageMap.set(key, (languageMap.get(key) || 0) + 1);
      }
    }
    const byLanguage = [...languageMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    let fresh = 0;
    let aging = 0;
    let stale = 0;
    for (const l of listings) {
      const f = getListingFreshness(l.last_updated, l.expires_at);
      if (f === 'fresh') fresh++;
      else if (f === 'aging') aging++;
      else stale++;
    }

    return { totalPrograms, totalSpots, elfa, beyondElfa, waitlistOnly, byAge, byNeighborhood, byLanguage, freshness: { fresh, aging, stale } };
  }, [listings]);

  const [snapshots, setSnapshots] = useState<CommunitySnapshot[]>([]);
  useEffect(() => {
    let alive = true;
    getCommunitySnapshots().then((s) => { if (alive) setSnapshots(s); });
    return () => { alive = false; };
  }, []);

  const trendPoints = snapshots.map((s) => ({
    month: new Date(`${s.snapshot_month}T00:00:00`).toLocaleDateString(locale, { month: 'short', year: '2-digit' }),
    programs: s.programs_with_openings,
    spots: s.open_spots,
  }));

  const today = new Date().toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  const maxAge = Math.max(1, ...stats.byAge.map((a) => a.value));
  const maxNbhd = Math.max(1, ...stats.byNeighborhood.map((n) => n.value));
  const maxLang = Math.max(1, ...stats.byLanguage.map((l) => l.value));
  const total = Math.max(1, stats.totalPrograms);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="mb-8">
          <a href="#public" className="mb-4 inline-flex items-center gap-1 text-sm text-teal-700 hover:underline">
            ← {t('insights.backToListings')}
          </a>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{t('insights.title')}</h1>
          <p className="mt-2 max-w-2xl text-gray-600">{t('insights.subtitle')}</p>
          <p className="mt-3 text-xs text-gray-400">{t('insights.asOf', { date: today })}</p>
        </div>

        {stats.totalPrograms === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            {t('insights.empty')}
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="text-4xl font-bold tabular-nums text-gray-900">{stats.totalPrograms}</div>
                <div className="mt-1 text-sm text-gray-600">{t('insights.programsWithOpenings')}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="text-4xl font-bold tabular-nums text-gray-900">{stats.totalSpots}</div>
                <div className="mt-1 text-sm text-gray-600">
                  {t('insights.openSpots')}{stats.waitlistOnly > 0 ? ` · ${t('insights.waitlistOnly', { count: stats.waitlistOnly })}` : ''}
                </div>
              </div>
            </div>

            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-3 text-sm font-medium text-gray-700">{t('insights.networkSection')}</div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full bg-teal-500" style={{ width: `${(stats.elfa / total) * 100}%` }} />
                <div className="h-full bg-indigo-400" style={{ width: `${(stats.beyondElfa / total) * 100}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                  <span className="text-gray-700">{t('insights.elfaNetwork')}</span>
                  <span className="font-semibold text-gray-900">{stats.elfa}</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
                  <span className="text-gray-700">{t('insights.beyondElfa')}</span>
                  <span className="font-semibold text-gray-900">{stats.beyondElfa}</span>
                </span>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Section icon={<Baby size={16} />} title={t('insights.byAge')}>
                {stats.byAge.map((a) => <Bar key={a.labelKey} label={t(a.labelKey)} sub={t(a.subKey)} value={a.value} max={maxAge} />)}
              </Section>
              <Section icon={<Clock size={16} />} title={t('insights.freshnessSection')}>
                <Bar label={t('insights.freshnessFresh')} value={stats.freshness.fresh} max={total} />
                <Bar label={t('insights.freshnessAging')} value={stats.freshness.aging} max={total} />
                <Bar label={t('insights.freshnessStale')} value={stats.freshness.stale} max={total} />
              </Section>
              <Section icon={<MapPin size={16} />} title={t('insights.neighborhoodSection')}>
                {stats.byNeighborhood.map((n) => (
                  <Bar key={n.label} label={n.label === 'Unlisted' ? t('insights.unlisted') : n.label} value={n.value} max={maxNbhd} />
                ))}
              </Section>
              <Section icon={<LanguagesIcon size={16} />} title={t('insights.languageSection')}>
                {stats.byLanguage.map((l) => <Bar key={l.label} label={l.label} value={l.value} max={maxLang} />)}
              </Section>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl bg-teal-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold">{t('insights.ctaTitle')}</div>
                <div className="text-sm text-teal-50">{t('insights.ctaBody')}</div>
              </div>
              <a
                href="#list-your-vacancy"
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-white px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
              >
                {t('insights.ctaButton')} <ArrowRight size={16} />
              </a>
            </div>
          </>
        )}

        <div className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{t('insights.overTime')}</h2>
          {trendPoints.length < 2 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
              {t('insights.trendEmpty')}{trendPoints.length === 1 ? ` ${t('insights.trendFirst', { month: trendPoints[0].month })}` : ''}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Sparkline title={t('insights.trendPrograms')} points={trendPoints.map((p) => ({ month: p.month, value: p.programs }))} />
              <Sparkline title={t('insights.trendSpots')} points={trendPoints.map((p) => ({ month: p.month, value: p.spots }))} />
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-gray-400">{t('insights.footnote')}</p>
      </div>
    </div>
  );
}
