// Generate static, crawlable "current openings" pages from public_listings.
//
// AEO surface for the live vacancy data (see docs/fable-rebuild-brief.md WP5).
// READ-ONLY: performs a single anon-key SELECT — the same access any site
// visitor has. Never writes to Supabase.
//
// PRIVACY: field exposure approved by Oscar 2026-07-01 — aggregate counts,
// neighborhood, age groups, and languages ONLY. The column allow-list below is
// the enforcement point: never add business_name, license_number, phone,
// website, zip_code, notes, or any provider-identifying field.
//
// Output: public/openings/index.html, public/es/openings/index.html,
//         public/zh/openings/index.html (+ sitemap lastmod refresh)
// Run:    npm run generate:openings   (re-run on a schedule to stay fresh —
//         cadence is Oscar's call; daily recommended)
//
// All page copy is assembled verbatim from reviewed strings in src/i18n/*.json
// and the existing static pages. Do not add prose here.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---- config -----------------------------------------------------------------

const APPROVED_COLUMNS = [
  'neighborhood',
  'languages',
  'infant_spots',
  'toddler_spots',
  'preschool_spots',
  'school_age_spots',
  'total_spots_available',
  'expires_at',
];

const LANGS = {
  en: {
    i18n: 'en',
    dir: 'public/openings',
    urlPrefix: '',
    htmlLang: 'en',
    ogLocale: 'en_US',
    ogImage: '/og-image.png',
    spaLang: '',
    scaffoldFrom: 'public/financial-assistance/index.html',
    dateLocale: 'en-US',
  },
  es: {
    i18n: 'es',
    dir: 'public/es/openings',
    urlPrefix: '/es',
    htmlLang: 'es',
    ogLocale: 'es_ES',
    ogImage: '/og-image-es.png',
    spaLang: '?lang=es',
    scaffoldFrom: 'public/es/financial-assistance/index.html',
    dateLocale: 'es-US',
  },
  zh: {
    i18n: 'zh-TW',
    dir: 'public/zh/openings',
    urlPrefix: '/zh',
    htmlLang: 'zh-Hant',
    ogLocale: 'zh_TW',
    ogImage: '/og-image-zh.png',
    spaLang: '?lang=zh-TW',
    scaffoldFrom: 'public/zh/financial-assistance/index.html',
    dateLocale: 'zh-TW',
  },
};

const SITE = 'https://familychildcaresf.com';

// ---- env + fetch ------------------------------------------------------------

function readEnv() {
  const env = {};
  for (const file of ['.env', '.env.local']) {
    try {
      for (const line of readFileSync(path.join(ROOT, file), 'utf-8').split('\n')) {
        const m = line.match(/^\s*(VITE_[A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
        if (m && !(m[1] in env)) env[m[1]] = m[2];
      }
    } catch { /* file may not exist */ }
  }
  return env;
}

async function fetchListings() {
  const env = readEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not found in .env');

  // Current (non-expired) listings only — stricter than the SPA, which also
  // shows listings expired <30 days ago in an "Older Listings" section.
  const now = new Date().toISOString();
  const qs = `select=${APPROVED_COLUMNS.join(',')}&expires_at=gt.${encodeURIComponent(now)}`;
  const res = await fetch(`${url}/rest/v1/public_listings?${qs}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`public_listings fetch failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// ---- aggregation ------------------------------------------------------------

function aggregate(listings) {
  const byHood = new Map();
  for (const l of listings) {
    const hood = (l.neighborhood || 'San Francisco').trim();
    if (!byHood.has(hood)) {
      byHood.set(hood, {
        programs: 0, infant: 0, toddler: 0, preschool: 0, schoolAge: 0, total: 0,
        languages: new Set(),
      });
    }
    const a = byHood.get(hood);
    a.programs += 1;
    a.infant += l.infant_spots || 0;
    a.toddler += l.toddler_spots || 0;
    a.preschool += l.preschool_spots || 0;
    a.schoolAge += l.school_age_spots || 0;
    a.total += l.total_spots_available || 0;
    const langs = Array.isArray(l.languages) ? l.languages : JSON.parse(l.languages || '[]');
    for (const lang of langs) a.languages.add(lang);
  }
  return [...byHood.entries()]
    .map(([hood, a]) => ({ hood, ...a, languages: [...a.languages].sort() }))
    .sort((x, y) => y.total - x.total || x.hood.localeCompare(y.hood));
}

// ---- page composition -------------------------------------------------------

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function t(i18nData, dottedKey) {
  let v = i18nData;
  for (const k of dottedKey.split('.')) v = v?.[k];
  if (typeof v !== 'string') throw new Error(`missing i18n key: ${dottedKey}`);
  return v;
}

function buildPage(langKey, cfg, rows, totals, generatedAt) {
  const i18n = JSON.parse(readFileSync(path.join(ROOT, `src/i18n/${cfg.i18n}.json`), 'utf-8'));
  const scaffold = readFileSync(path.join(ROOT, cfg.scaffoldFrom), 'utf-8');

  // verbatim scaffolding from the language's existing (reviewed) static page
  const style = scaffold.match(/(<style>[\s\S]*?<\/style>)/)[1];
  let nav = scaffold.match(/(<header>[\s\S]*?<\/header>)/)[1].replace(/ class="active-page"/g, '');
  const footer = scaffold.match(/(<footer>[\s\S]*?<\/footer>)/)[1];

  // reviewed strings (i18n)
  const title = t(i18n, 'publicListings.title');
  const subtitle = t(i18n, 'publicListings.subtitle');
  const programsLabel = t(i18n, 'insights.programsWithOpenings');
  const spotsLabel = t(i18n, 'insights.openSpots');
  const byAge = t(i18n, 'insights.byAge');
  const infant = t(i18n, 'vacancy.infant');
  const toddler = t(i18n, 'vacancy.toddler');
  const preschool = t(i18n, 'vacancy.preschool');
  const schoolAge = t(i18n, 'vacancy.schoolAge');
  const languagesLabel = t(i18n, 'publicListings.languagesSpoken');
  const lastUpdated = t(i18n, 'publicListings.lastUpdated');
  const asOf = t(i18n, 'insights.asOf').replace('{date}', generatedAt.date);
  const ctaText = t(i18n, 'publicListings.subtitle');

  const canonical = `${SITE}${cfg.urlPrefix}/openings/`;
  const pageTitle = `${title} | Family Child Care SF`;

  const rowsHtml = rows.map((r) => `          <tr>
            <td><strong>${esc(r.hood)}</strong></td>
            <td style="text-align:center;">${r.infant}</td>
            <td style="text-align:center;">${r.toddler}</td>
            <td style="text-align:center;">${r.preschool}</td>
            <td style="text-align:center;">${r.schoolAge}</td>
            <td style="text-align:center;"><strong>${r.total}</strong></td>
            <td>${esc(r.languages.join(', '))}</td>
          </tr>`).join('\n');

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description: subtitle,
    numberOfItems: rows.length,
    itemListElement: rows.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${r.hood}: ${r.total} ${spotsLabel}`,
      description: `${infant}: ${r.infant} · ${toddler}: ${r.toddler} · ${preschool}: ${r.preschool} · ${schoolAge}: ${r.schoolAge} · ${languagesLabel}: ${r.languages.join(', ')}`,
    })),
  };
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle,
    url: canonical,
    inLanguage: cfg.htmlLang,
    description: subtitle,
    dateModified: generatedAt.iso,
    isPartOf: { '@type': 'WebSite', name: 'Family Child Care SF', url: `${SITE}/` },
  };

  return `<!DOCTYPE html>
<html lang="${cfg.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(pageTitle)}</title>

  <!-- Primary Meta Tags -->
  <meta name="description" content="${esc(subtitle)}">

  <!-- Canonical URL -->
  <link rel="canonical" href="${canonical}">

  <!-- Hreflang -->
  <link rel="alternate" hreflang="en" href="${SITE}/openings/">
  <link rel="alternate" hreflang="es" href="${SITE}/es/openings/">
  <link rel="alternate" hreflang="zh-Hant" href="${SITE}/zh/openings/">
  <link rel="alternate" hreflang="x-default" href="${SITE}/openings/">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${esc(pageTitle)}">
  <meta property="og:description" content="${esc(subtitle)}">
  <meta property="og:image" content="${SITE}${cfg.ogImage}">
  <meta property="og:site_name" content="Family Child Care SF">
  <meta property="og:locale" content="${cfg.ogLocale}">

  <script type="application/ld+json">
${JSON.stringify(webPage, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(itemList, null, 2)}
  </script>

  ${style}
  <style>
    .openings-table { width: 100%; border-collapse: collapse; font-size: 15px; }
    .openings-table th, .openings-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    .openings-table th { background: #f8fafc; font-weight: 600; color: #1e40af; }
    .openings-summary { display: flex; gap: 32px; flex-wrap: wrap; margin: 16px 0 8px; }
    .openings-summary .stat { font-size: 32px; font-weight: 700; color: #1e40af; }
    .openings-summary .stat-label { font-size: 14px; color: #64748b; }
  </style>
  <link rel="stylesheet" href="/assets/audience-top-bar.css">
</head>
<body>
  <div id="audience-top-bar"></div>

  <!-- Header -->
  ${nav}

  <div class="hero">
    <div class="container">
      <h1>${esc(title)}</h1>
      <p class="subtitle">${esc(subtitle)}</p>
    </div>
  </div>

  <main>
    <div class="container">
      <div class="content-section" style="margin-top:24px;">
        <div class="openings-summary">
          <div><div class="stat">${totals.programs}</div><div class="stat-label">${esc(programsLabel)}</div></div>
          <div><div class="stat">${totals.total}</div><div class="stat-label">${esc(spotsLabel)}</div></div>
        </div>
        <p style="color:#64748b;font-size:14px;">${esc(asOf)}</p>
      </div>

      <div class="content-section">
        <h2>${esc(byAge)}</h2>
        <table class="openings-table">
          <thead>
            <tr>
              <th></th>
              <th style="text-align:center;">${esc(infant)}</th>
              <th style="text-align:center;">${esc(toddler)}</th>
              <th style="text-align:center;">${esc(preschool)}</th>
              <th style="text-align:center;">${esc(schoolAge)}</th>
              <th style="text-align:center;">Total</th>
              <th>${esc(languagesLabel)}</th>
            </tr>
          </thead>
          <tbody>
${rowsHtml}
          </tbody>
        </table>
      </div>

      <div class="cta-section">
        <p>${esc(ctaText)}</p>
        <a href="/${cfg.spaLang}#public" class="cta-button">${esc(title)}</a>
      </div>

      <div class="content-section" style="font-size:13px;color:#64748b;">
        <p>${esc(lastUpdated)}: ${generatedAt.date}</p>
      </div>
    </div>
  </main>

  ${footer}

  <script src="/assets/lang-switcher.js" defer></script>
</body>
</html>`;
}

// ---- sitemap lastmod refresh --------------------------------------------------

function refreshSitemap(dateStr) {
  const p = path.join(ROOT, 'public/sitemap.xml');
  let xml = readFileSync(p, 'utf-8');
  for (const prefix of ['', '/es', '/zh']) {
    const loc = `${SITE}${prefix}/openings/`;
    const re = new RegExp(`(<loc>${loc.replace(/\//g, '\\/')}<\\/loc>[\\s\\S]*?<lastmod>)[^<]*(<\\/lastmod>)`);
    if (re.test(xml)) xml = xml.replace(re, `$1${dateStr}$2`);
  }
  writeFileSync(p, xml);
}

// ---- main ---------------------------------------------------------------------

const listings = await fetchListings();
// hard guard: refuse to emit if a disallowed field somehow appears
for (const l of listings) {
  const extra = Object.keys(l).filter((k) => !APPROVED_COLUMNS.includes(k));
  if (extra.length) throw new Error(`Disallowed fields in response: ${extra.join(', ')}`);
}

const rows = aggregate(listings);
const totals = rows.reduce(
  (acc, r) => ({ programs: acc.programs + r.programs, total: acc.total + r.total }),
  { programs: 0, total: 0 },
);

const now = new Date();
const generatedAt = { iso: now.toISOString(), date: now.toISOString().slice(0, 10) };

for (const [langKey, cfg] of Object.entries(LANGS)) {
  const html = buildPage(langKey, cfg, rows, totals, generatedAt);
  mkdirSync(path.join(ROOT, cfg.dir), { recursive: true });
  writeFileSync(path.join(ROOT, cfg.dir, 'index.html'), html);
  console.log(`wrote ${cfg.dir}/index.html`);
}
refreshSitemap(generatedAt.date);
console.log(`openings: ${totals.programs} programs, ${totals.total} spots across ${rows.length} neighborhoods (as of ${generatedAt.date})`);
