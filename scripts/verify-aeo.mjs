// AEO verification harness (docs/fable-rebuild-brief.md §5).
// Checks, across every static page in public/ + the root SPA shell:
//   B. every <script type="application/ld+json"> parses and has @context/@type
//   C. hreflang: 4 alternates (en/es/zh-Hant/x-default), self-referential + reciprocal
//   D. sitemap <-> file-inventory parity (both directions)
//   G. schema-type counts never regress below the recorded baseline
// Exits non-zero on any violation. Run: node scripts/verify-aeo.mjs

import { readFileSync, existsSync } from 'fs';
import { globSync } from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://familychildcaresf.com';

// Utility/one-off pages: not in the sitemap, exempt from hreflang rules.
const SITEMAP_EXEMPT = [
  'public/404.html', 'public/counter.html', 'public/links.html',
  'public/volunteer.html', 'public/ca-widget-test.html',
  'public/fcc-fair-2026/index.html',
];
const HREFLANG_EXEMPT = [...SITEMAP_EXEMPT];

// Baseline schema-type counts (pre-rebuild, 2026-07-01). Counts may grow, never shrink.
const BASELINE = { FAQPage: 63, BreadcrumbList: 66, Article: 39, ChildCare: 15, ItemList: 6 };

const errors = [];
const pages = globSync('public/**/*.html', { cwd: ROOT }).map((p) => p.replaceAll('\\', '/'));
const contentPages = pages.filter((p) => !SITEMAP_EXEMPT.includes(p));

// Map a file path to its canonical URL.
function urlFor(p) {
  if (p === 'index.html') return `${SITE}/`;
  return `${SITE}/` + p.replace(/^public\//, '').replace(/index\.html$/, '');
}

// ---- B. JSON-LD validity + G. type counts ------------------------------------
const typeCounts = {};
for (const p of [...pages, 'index.html']) {
  const html = readFileSync(path.join(ROOT, p), 'utf-8');
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let d;
    try { d = JSON.parse(m[1]); } catch (e) { errors.push(`[jsonld] ${p}: ${e.message}`); continue; }
    if (!d['@context']) errors.push(`[jsonld] ${p}: missing @context`);
    if (!d['@type']) errors.push(`[jsonld] ${p}: missing @type`);
    for (const t of JSON.stringify(d).matchAll(/"@type":\s*"([^"]+)"/g)) {
      typeCounts[t[1]] = (typeCounts[t[1]] || 0) + 1;
    }
  }
}
for (const [t, min] of Object.entries(BASELINE)) {
  if ((typeCounts[t] || 0) < min) {
    errors.push(`[regression] schema type ${t}: ${typeCounts[t] || 0} < baseline ${min}`);
  }
}

// ---- C. hreflang --------------------------------------------------------------
const LANG_CODES = ['en', 'es', 'zh-Hant', 'x-default'];
function alternatesOf(html) {
  const alts = {};
  for (const m of html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\s*\/?>/g)) {
    alts[m[1]] = m[2];
  }
  return alts;
}
for (const p of ['index.html', ...contentPages]) {
  if (HREFLANG_EXEMPT.includes(p)) continue;
  const html = readFileSync(path.join(ROOT, p), 'utf-8');
  const alts = alternatesOf(html);
  if (Object.keys(alts).length === 0) { errors.push(`[hreflang] ${p}: no alternates`); continue; }
  for (const code of LANG_CODES) if (!alts[code]) errors.push(`[hreflang] ${p}: missing ${code}`);
  const own = urlFor(p);
  if (!Object.values(alts).includes(own)) errors.push(`[hreflang] ${p}: not self-referential (${own})`);
  // reciprocity: each named alternate page must list the same URL set
  for (const [code, href] of Object.entries(alts)) {
    if (code === 'x-default') continue;
    const rel = href.replace(`${SITE}/`, '');
    const target = rel === '' ? 'index.html' : `public/${rel}index.html`;
    if (!existsSync(path.join(ROOT, target))) { errors.push(`[hreflang] ${p}: alternate ${href} has no file (${target})`); continue; }
    const talts = alternatesOf(readFileSync(path.join(ROOT, target), 'utf-8'));
    for (const c of ['en', 'es', 'zh-Hant']) {
      if (talts[c] !== alts[c]) errors.push(`[hreflang] ${p} vs ${target}: ${c} mismatch (${alts[c]} != ${talts[c]})`);
    }
  }
}

// ---- D. sitemap parity ----------------------------------------------------------
const sitemap = readFileSync(path.join(ROOT, 'public/sitemap.xml'), 'utf-8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const locSet = new Set(locs);
for (const p of contentPages) {
  if (!p.endsWith('index.html')) continue; // non-index html is utility
  if (!locSet.has(urlFor(p))) errors.push(`[sitemap] file not in sitemap: ${p} (${urlFor(p)})`);
}
for (const loc of locs) {
  const rel = loc.replace(`${SITE}/`, '');
  const f = rel === '' ? 'index.html' : `public/${rel}index.html`;
  if (!existsSync(path.join(ROOT, f))) errors.push(`[sitemap] loc has no file: ${loc}`);
}
const dupes = locs.filter((l, i) => locs.indexOf(l) !== i);
for (const d of dupes) errors.push(`[sitemap] duplicate loc: ${d}`);

// ---- report ---------------------------------------------------------------------
console.log(`pages scanned: ${pages.length + 1} (incl. root index.html)`);
console.log('schema counts:', Object.entries(typeCounts)
  .filter(([t]) => t in BASELINE || ['Organization', 'WebSite', 'HowTo', 'Question'].includes(t))
  .map(([t, n]) => `${t}=${n}`).join(' '));
if (errors.length) {
  console.error(`\n${errors.length} violations:`);
  for (const e of errors) console.error('  ✗', e);
  process.exit(1);
}
console.log('AEO checks: all pass ✓');
