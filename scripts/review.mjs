// Pre-deploy review harness: `npm run review`.
//
// Runs every check that should pass before a preview is shown to Oscar or promoted to production, and prints
// PASS / WARN / FAIL per check. Exit code 1 if anything FAILs. WARN = known, open item that needs a decision
// (listed in CHANGELOG.md "Parked and open"), not a blocker.
//
// Each check exists because something drifted before. When a new drift is found, add a check here rather than
// remembering to look for it. Read-only: never writes to the repo (generator checks run in a temp copy) and
// never touches Supabase or Vercel.
//
// Usage: npm run review            all checks
//        npm run review -- --fast  skip tsc / vitest (content checks only)

import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, cpSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FAST = process.argv.includes('--fast');
const read = rel => readFileSync(path.join(ROOT, rel), 'utf-8');

// ---- config: values that must never come back --------------------------------------------------------------
// Each entry: where to look, what to look for, why it is wrong. Add to this list when a stale value is fixed.

const BANNED = [
  // Citywide facility counts, hard-coded March 2026 and replaced by commit 7d45fc7 / 95f29ce (state licensing
  // data of Sept. 20, 2026: 1,252 facilities, 400 centers, 852 FCC homes).
  { dirs: ['public'], re: /\b892 (licensed|centros|instalaciones)|892個|\b370 (child care centers|centros)|370個|~900 family|約900|大約900/,
    why: 'stale citywide facility count (now 1,252 / 400 / 852, Sept. 2026)' },
  // FY 2025-26 SMI family-of-4 value; FY 2026-27 tables replaced it (commit da2319f).
  { dirs: ['public', 'src/i18n'], re: /311,700|311700/, why: 'FY 2025-26 income ceiling' },
  // zh-TW glossary (memory fcc-translation-glossary.md, 2026-04-19): provider = 家庭托兒者, FCC home = 家庭托兒所.
  { dirs: ['public/zh', 'src/i18n/zh-TW.json'], re: /服務提供者|托兒園/, why: 'zh glossary: use 家庭托兒者 / 家庭托兒所' },
];

// Older terms still present on REVIEWED pages: reported as a count (WARN), not a failure, until Oscar decides.
const LEGACY_TERMS = [
  { dirs: ['public/zh', 'src/i18n/zh-TW.json'], re: /托兒員/g, why: 'older zh term for "provider" (glossary prefers 家庭托兒者)' },
];

// ---- helpers -----------------------------------------------------------------------------------------------

const results = [];
const record = (name, status, detail = '') => results.push({ name, status, detail });

function walk(rel, exts = ['.html', '.json', '.js', '.ts', '.tsx', '.mjs', '.xml', '.txt']) {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isFile()) return [rel];
  const out = [];
  for (const name of readdirSync(abs)) {
    const r = path.join(rel, name);
    const s = statSync(path.join(ROOT, r));
    if (s.isDirectory()) out.push(...walk(r, exts));
    else if (exts.includes(path.extname(name))) out.push(r);
  }
  return out;
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf-8', shell: false });
  return { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}` };
}

const lastLines = (s, n = 6) => s.trim().split('\n').slice(-n).join('\n');

// ---- 1. build + tests --------------------------------------------------------------------------------------

if (!FAST) {
  const tsc = run('npx', ['tsc', '-b']);
  record('TypeScript (tsc -b)', tsc.ok ? 'PASS' : 'FAIL', tsc.ok ? '' : lastLines(tsc.out, 15));

  const vt = run('npx', ['vitest', 'run']);
  const m = vt.out.replace(/\x1b\[[0-9;]*m/g, '').match(/Tests\s+(.+)/);
  record('Unit tests (vitest)', vt.ok ? 'PASS' : 'FAIL', vt.ok ? (m ? m[1].trim() : '') : lastLines(vt.out, 15));
}

// ---- 2. search-engine markup (existing harness) -------------------------------------------------------------

{
  const r = run('node', ['scripts/verify-aeo.mjs']);
  const why = r.out.split('\n').filter(l => /✗|fail|missing|error|expected/i.test(l)).slice(0, 12).join('\n');
  record('AEO markup (verify-aeo)', r.ok ? 'PASS' : 'FAIL', r.ok ? lastLines(r.out, 1) : why || lastLines(r.out, 12));
}

// ---- 3. i18n key parity ------------------------------------------------------------------------------------

{
  const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
  const keys = Object.fromEntries(['en', 'es', 'zh-TW'].map(l => [l, new Set(flat(JSON.parse(read(`src/i18n/${l}.json`))))]));
  const problems = [];
  for (const l of ['es', 'zh-TW']) {
    const missing = [...keys.en].filter(k => !keys[l].has(k));
    const extra = [...keys[l]].filter(k => !keys.en.has(k));
    if (missing.length) problems.push(`${l} missing ${missing.length}: ${missing.slice(0, 5).join(', ')}`);
    if (extra.length) problems.push(`${l} extra ${extra.length}: ${extra.slice(0, 5).join(', ')}`);
  }
  record('i18n key parity (en/es/zh-TW)', problems.length ? 'FAIL' : 'PASS',
    problems.length ? problems.join('\n') : `${keys.en.size} keys each`);
}

// ---- 4. ELFA license list mirrored x3 ----------------------------------------------------------------------

{
  const files = ['src/lib/elfa.ts', 'supabase/functions/_shared/elfa.ts', 'supabase/functions/refresh-elfa/index.ts'];
  const sets = files.map(f => new Set(read(f).match(/'(\d{9})'/g)?.map(s => s.slice(1, -1)) || []));
  const [a, ...rest] = sets;
  const diffs = rest.flatMap((s, i) => {
    const onlyA = [...a].filter(x => !s.has(x));
    const onlyB = [...s].filter(x => !a.has(x));
    return onlyA.length || onlyB.length ? [`${files[0]} vs ${files[i + 1]}: ${onlyA.length} only in first, ${onlyB.length} only in second`] : [];
  });
  record('ELFA list identical in 3 copies', diffs.length ? 'FAIL' : 'PASS', diffs.length ? diffs.join('\n') : `${a.size} licenses`);
}

// ---- 5. income ceilings: app vs embeddable widget ----------------------------------------------------------

{
  const table = (src, name) => {
    const m = src.match(new RegExp(`${name}[^=]*=\\s*\\{([\\s\\S]*?)\\};`));
    return m ? Object.fromEntries([...m[1].matchAll(/(\d+):\s*([\d_]+)/g)].map(([, k, v]) => [k, Number(v.replace(/_/g, ''))])) : null;
  };
  const app = read('src/lib/eligibility.ts');
  const widget = read('public/ca-eligibility-widget.js');
  const problems = [];
  for (const name of ['SMI_FY2627', 'SMI85_FY2627']) {
    const a = table(app, name), w = table(widget, name);
    if (!a || !w) { problems.push(`${name}: table not found in ${!a ? 'eligibility.ts' : 'widget'}`); continue; }
    for (const k of new Set([...Object.keys(a), ...Object.keys(w)])) {
      if (a[k] !== w[k]) problems.push(`${name}[${k}]: app ${a[k]} vs widget ${w[k]}`);
    }
  }
  record('Income ceilings: app = widget', problems.length ? 'FAIL' : 'PASS', problems.join('\n'));
}

// ---- 6. banned / stale values ------------------------------------------------------------------------------

{
  const hits = [];
  for (const rule of BANNED) {
    for (const f of rule.dirs.flatMap(d => walk(d))) {
      if (/\.test\.ts$/.test(f)) continue; // regression tests quote old values on purpose
      read(f).split('\n').forEach((line, i) => {
        const m = line.match(rule.re);
        if (m) hits.push(`${f}:${i + 1}  "${m[0]}"  (${rule.why})`);
      });
    }
  }
  record('No stale or banned values', hits.length ? 'FAIL' : 'PASS', hits.slice(0, 15).join('\n') + (hits.length > 15 ? `\n…and ${hits.length - 15} more` : ''));

  for (const rule of LEGACY_TERMS) {
    const perFile = rule.dirs.flatMap(d => walk(d)).map(f => [f, (read(f).match(rule.re) || []).length]).filter(([, n]) => n);
    const total = perFile.reduce((s, [, n]) => s + n, 0);
    record(`Legacy term ${rule.re.source}`, total ? 'WARN' : 'PASS',
      total ? `${total} uses in ${perFile.length} files: ${rule.why}` : '');
  }
}

// ---- 7. generators still reproduce their committed pages ---------------------------------------------------
// Runs each generator in a temp copy and diffs its output against the repo. A difference means someone edited
// the generated pages by hand (or the generator changed), and the next regeneration would silently undo it.
// sitemap.xml is skipped: generators stamp today's lastmod. generate-openings is skipped: it reads live data.

const GENERATORS = [
  { script: 'scripts/generate-neighborhood-pages.mjs', outputs: ['public/neighborhoods', 'public/es/neighborhoods', 'public/zh/neighborhoods'],
    knownDrift: 'Pages hand-edited after generation (top bar, header, language links). Open decision: update the generator or retire it.' },
  { script: 'scripts/build-go-links.mjs', outputs: ['public/links.html'] },
];

{
  const tmp = mkdtempSync(path.join(tmpdir(), 'fccsf-review-'));
  try {
    for (const name of ['scripts', 'src', 'public', 'vercel.json', 'package.json']) {
      cpSync(path.join(ROOT, name), path.join(tmp, name), { recursive: true });
    }
    for (const g of GENERATORS) {
      const r = spawnSync('node', [g.script], { cwd: tmp, encoding: 'utf-8' });
      if (r.status !== 0) { record(`Generator in sync: ${path.basename(g.script)}`, 'FAIL', lastLines(`${r.stdout}${r.stderr}`)); continue; }
      const changed = g.outputs.flatMap(o => walk(o)).filter(f => {
        const fresh = path.join(tmp, f);
        return !existsSync(fresh) || readFileSync(fresh, 'utf-8') !== read(f);
      });
      const status = changed.length ? (g.knownDrift ? 'WARN' : 'FAIL') : 'PASS';
      record(`Generator in sync: ${path.basename(g.script)}`, status,
        changed.length ? `${changed.length} committed files differ from fresh output${g.knownDrift ? `. ${g.knownDrift}` : ` (e.g. ${changed.slice(0, 3).join(', ')})`}` : '');
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// ---- report ------------------------------------------------------------------------------------------------

const icon = { PASS: '✓ PASS', WARN: '! WARN', FAIL: '✗ FAIL' };
console.log('\nfamilychildcaresf.com review\n');
for (const r of results) {
  console.log(`${icon[r.status]}  ${r.name}`);
  if (r.detail) console.log(r.detail.split('\n').map(l => `         ${l}`).join('\n'));
}
const fails = results.filter(r => r.status === 'FAIL').length;
const warns = results.filter(r => r.status === 'WARN').length;
console.log(`\n${fails ? 'FAIL' : 'PASS'}: ${results.length} checks, ${fails} failed, ${warns} warnings${FAST ? ' (--fast: tsc/vitest skipped)' : ''}\n`);
process.exit(fails ? 1 : 0);
