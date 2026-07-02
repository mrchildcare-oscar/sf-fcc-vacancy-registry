# Fable 5 Execution Brief — familychildcaresf.com AEO / Multilingual Rebuild

**Written:** 2026-07-01 · **For:** a fresh autonomous session with no memory of the scoping chat.
**Repo:** `/home/oscar/Projects/websites/sf-fcc-vacancy-registry` · **Branch:** `staging` (work here; never commit straight to a prod branch).
**Owner:** Oscar Tang. He reviews Chinese personally and owns all brand voice.

> **Read this whole file before touching anything.** It is self-contained. The "STOP and ask Oscar" section and the guardrails override every work package. When in doubt, do the smaller, reversible thing and leave a clearly-marked `TODO(oscar)` rather than inventing content.

---

## 0. TL;DR — the actual problem

The site is a **hybrid**: a hash-routed React 18 + Vite 6 SPA (the interactive vacancy registry) **plus** an already-excellent trilingual layer of **prebuilt static HTML** in `public/` (en at root, `/es/`, `/zh/`). The static content tier is strong for AEO (rich JSON-LD, good headings, correct hreflang, 507-key i18n parity, warm conversational Chinese).

**This is a rendering-architecture fix, not a content rebuild.** Two structural holes:

1. The **homepage (`/`) is a pure SPA shell** — only a `<noscript>` fallback. There is **no `/es/index.html` and no `/zh/index.html`** at all; the Spanish/Chinese homepage exists only as a `?lang=` query-param SPA variant. So the top entry point and the entire Chinese-search opportunity are invisible to answer engines.
2. The **live vacancy + community-insights data** (the site's unique moat) is client-rendered only — no crawlable structured representation.

The recommended approach is to **extend the existing static-HTML pattern** (prebuilt pages + a small prerender script), **not** introduce react-helmet/SSR/hydration. Lower risk, reuses the pipeline, ships incrementally. Tradeoff: static snapshots of live data can go stale → refresh on a schedule.

---

## 1. Ground-truth repo facts (verified 2026-07-01)

**Stack:** React 18.3, TypeScript ~5.6 (strict, `noUnusedLocals`/`noUnusedParameters` ON), Vite 6, Tailwind 3, Supabase JS 2.90, posthog-js, Vercel Analytics. No React Router — the SPA uses manual hash routing.

**Build / dev / test:**
- `npm run build` → `tsc -b && vite build` (TypeScript strict build **must** pass — unused vars fail the build).
- `npm run dev` → Vite; a custom `serveStaticPages` plugin in `vite.config.ts` serves `public/**/index.html` at pretty URLs before the SPA fallback.
- `npm test` → `vitest run` (existing suites: `src/lib/*.test.ts`, `src/utils/*.test.ts`).
- Deploy is **Oscar's job**, staging first (`vercel` preview → verify → `vercel --prod`). **Do not deploy.**

**Static content tier — all 6 families exist in en (root) / `/es/` / `/zh/`:**
- `child-care-san-francisco/` (2026 Parent Guide)
- `family-child-care-vs-centers/`
- `infant-care-san-francisco/`
- `financial-assistance/` + `financial-assistance/docs/{family-size,residency-proof,self-employed-income}/`
- `choose/` (Trust Wheel hub) + 8 factors: `safety-licensing`, `small-group-size`, `cultural-language-match`, `educational-quality`, `financial-assistance-programs`, `location-convenience`, `personal-connection`, `warmth-family-feel`
- `neighborhoods/` (hub) + `bayview`, `excelsior`, `mission`, `richmond`, `sunset`
- Utility (single-language): `fcc-fair-2026/`, `links.html`, `counter.html`, `volunteer.html`, `404.html`, `ca-widget-test.html`

**Generators (Node ESM, `.mjs`):**
- `scripts/generate-neighborhood-pages.mjs` (the big one) reads `src/data/neighborhoods.mjs` → writes the neighborhood static HTML. **The untranslated-hours bug lives here.** Run: `npm run generate:neighborhoods`.
- `scripts/build-go-links.mjs`, `scripts/generate-zh-subsidy-pdf.mjs`, `scripts/generate-provider-flyer.mjs`.

**SPA routing (hash-based, in `src/components/registry/RegistryApp.tsx`):**
- Public: `#public` (PublicListings), `#insights` (CommunityInsights), `#check-eligibility` (EligibilityScreener), `#verify-license` (LicenseLookup), `#list-your-vacancy`/`#auth` (ProviderAuth).
- Auth-gated: onboarding, vacancies, inquiries, roster, projections (Dashboard), settings, org dashboard, `?admin` (AdminAddProvider).
- Parked: `src/redesign/RedesignApp.tsx` behind `?redesign=1` / `#redesign` (lazy). **Do not modify or ship the redesign.**
- Vestigial (imported in RegistryApp but not rendered): `ProgramForm`, `ProgramSelector`, `AllProgramsSummary`, `CapacitySettings`.

**i18n (SPA runtime):** `src/i18n/{en,es,zh-TW}.json` (507 keys each, full parity) via `src/i18n/LanguageContext.tsx`. `?lang=` param maps `zh`/`zh-TW`/`zh-tw`→`zh-TW`. This is the canonical source of **reviewed** translated UI strings.

**Supabase:** tables `providers`, `vacancies`, `public_listings` (the public, parent-facing view the SPA reads), `parent_inquiries`, `community_snapshots`, `organizations`, `page_views`. Edge functions incl. `verify-license`, `refresh-elfa`, `confirm-vacancy`, `send-*`, `jotform-intake`, `delete-account`, `sync-instagram-gallery`. Client init in `src/lib/supabase.ts`. **Env keys are in `.env` — never print, commit, or exfiltrate them.**

**Existing AEO baseline (don't regress it):** 63 FAQPage, 66 BreadcrumbList, 39 Article, 15 `ChildCare` (valid `LocalBusiness` subtype), 6 ItemList, 210 Q&A pairs, 67/72 HTML with JSON-LD. `public/sitemap.xml` (68 URLs, hreflang + lastmod). `public/robots.txt` allow-lists GPTBot/ClaudeBot/PerplexityBot/Google-Extended.

**Canonical static-page `<head>` shape** (copy this exactly for new pages — see `public/financial-assistance/index.html`): `<html lang="…">` (`en`/`es`/`zh-Hant`) → charset/viewport → `<title>` → `meta description` → `link canonical` → 4× `link hreflang` (`en`, `es`, `zh-Hant`, `x-default`) → OG (`og:locale` = `en_US`/`es_ES`/`zh_TW`) → Twitter → JSON-LD blocks (BreadcrumbList, then page-specific).

---

## 2. Hard guardrails (override everything below)

1. **Never touch production data.** Reads of `public_listings` are fine; **no writes/migrations/edge-function deploys.** Don't run `supabase db push`, `apply_migration`, or deploy functions.
2. **Ask before anything irreversible or outward-facing.** No `git push`, no `vercel`/`vercel --prod`, no Supabase mutations, no Cloudflare/DNS changes.
3. **Deploy is Oscar's, staging-first.** You may build locally to verify; you may not deploy.
4. **Reuse reviewed translations — never invent Chinese or Spanish copy.** Pull zh/es strings *only* from `src/i18n/{zh-TW,es}.json` or existing `/zh/` `/es/` static pages. If a needed string has no reviewed equivalent, insert the **English** text wrapped in `<!-- TODO(oscar): needs reviewed es/zh copy -->` and list it in your final report. Chinese must read **conversational/warm** (正在招生, 近況, 家庭托兒), never formal/官腔/翻譯腔.
5. **Brand voice is human-owned.** Do not author or "improve" Trust Wheel copy, hero/marketing lines, the 312-family survey narrative, or any net-new persuasive prose in any language.
6. **Don't expose PII you weren't told to.** Provider home addresses / phone numbers are sensitive; exposing them in crawlable schema needs Oscar's explicit sign-off (see WP5).
7. **Keep the strict build green.** Any `.ts/.tsx` edit must compile under `tsc` strict with no unused locals/params. Prefer editing `.mjs`/HTML/JSON over adding SPA runtime code.
8. **Work in small, verifiable increments.** After each work package: run the self-verification (§5), and leave the tree buildable.

---

## 3. Delegated work packages

Execute **all of WP1–WP6** autonomously — both prior gates are resolved (WP3 term and WP5 fields decided by Oscar 2026-07-01). Remaining human handoffs only: Oscar eyeballs the WP3 Chinese diff, Oscar owns WP5 refresh scheduling, and any `TODO(oscar)` copy gaps. Order: WP2 → WP1 → WP4 → WP3 → WP5 → WP6.

### WP1 — Localized, crawlable homepages (`/es/index.html`, `/zh/index.html`, enrich `/index.html`)
**Goal:** Give Spanish and Chinese search/answer engines a real, path-based, content-bearing homepage; strengthen the English one. The live SPA still owns interactivity — these pages carry the *answer content* and link one click into the app.

**Why:** Highest-leverage gap. `/es/` and `/zh/` have **no** crawlable homepage today; `/` is an empty shell for crawlers.

**Files:**
- New: `public/es/index.html`, `public/zh/index.html`.
- Edit: root `index.html` (add top-level Organization JSON-LD + a small real-content block; keep the existing SPA mount + `<noscript>`).
- Edit: `public/sitemap.xml` (add the two new URLs with hreflang), `public/robots.txt` (Allow `/es/` `/zh/` roots if not covered).

**Steps:**
1. Model the new pages on an existing static page's `<head>` (§1). Set `<html lang="es">` / `lang="zh-Hant"`; correct canonical (`https://familychildcaresf.com/es/` and `/zh/`); 4 reciprocal hreflang alternates across `/`, `/es/`, `/zh/` with `x-default` → `/`.
2. Body content = a compact hero + "most SF families qualify for free care (ELFA)" answer block + links to that language's existing content pages (guide, financial-assistance, choose, neighborhoods) + a primary CTA into the SPA in that language (`/?lang=es#public`, `/?lang=zh-TW#public`).
3. **Copy sourcing (critical):** assemble *only* from reviewed strings in `src/i18n/{es,zh-TW}.json` and the matching existing `/es/`,`/zh/` static pages. Do **not** write new Spanish/Chinese sentences. Anything without a reviewed source → English + `TODO(oscar)` comment + report it.
4. JSON-LD per page: `WebSite` (with `inLanguage`), `Organization` (name, url, logo `og-image.svg`, `areaServed` = San Francisco), and a small `FAQPage` reusing 2–3 Q&As already present on that language's financial-assistance page (reuse verbatim, don't rewrite).
5. Update root `/index.html` hreflang so `es`/`zh-Hant` point to the **new path-based** URLs (`/es/`, `/zh/`) instead of `?lang=` (that's the WP4 hreflang fix, do it here since the URLs now exist).

**Acceptance criteria:**
- `public/es/index.html` and `public/zh/index.html` exist, serve real localized content, `<html lang>` correct.
- All three homepages have mutually reciprocal, self-referential hreflang (en/es/zh-Hant/x-default).
- Each new page has valid `WebSite` + `Organization` (+ reused `FAQPage`) JSON-LD that `JSON.parse`s.
- No net-new zh/es prose (every non-English string traces to a reviewed source, or is an English `TODO(oscar)`).
- Both URLs added to `sitemap.xml` with hreflang; `npm run build` passes.

**Self-verify:** run §5 A–D. Manually confirm zero invented zh/es sentences (grep for `TODO(oscar)` and list them).

---

### WP2 — Fix untranslated hours in neighborhood pages (zh + es)
**Goal:** Kill the `<dd>Monday–Friday, 7:00 AM – 6:00 PM</dd>` English-leftover in all 5 zh and 5 es neighborhood pages.

**Why:** Trust/quality defect; violates the glossary/localization standard. It's a **generator** bug, so fix at the source and regenerate (don't hand-edit the HTML).

**Files:** `scripts/generate-neighborhood-pages.mjs`, `src/data/neighborhoods.mjs` (data may hold the hours string), then regenerate `public/{,es/,zh/}neighborhoods/*/index.html`.

**Steps:**
1. Locate where the hours string is emitted. Determine if it's a hardcoded English literal in the template or a field in `neighborhoods.mjs`.
2. Localize it using the **reviewed format pattern** (mechanical, date/time only — not prose):
   - zh-Hant: `週一至週五，上午 7:00 – 下午 6:00` (adjust the times per each neighborhood's actual values — Mission 7:30–6:00, Richmond/Sunset 7:30–5:30, etc.).
   - es: `Lunes a viernes, 7:00 a. m. – 6:00 p. m.` (match each neighborhood's times).
   - Keep transit route names (14-Mission, N-Judah, BART) in English — proper nouns, correct as-is.
   - If a `zh`/`es` reviewed time format already appears anywhere in the repo, match it exactly instead.
3. Regenerate: `npm run generate:neighborhoods`. Confirm en output is unchanged.

**Acceptance criteria:** no `Monday–Friday` / `AM`/`PM` English literals remain in any `public/zh/**` or `public/es/**` file (`grep -rn "Monday\|AM –\|PM –" public/zh public/es` → empty, excluding intended English proper nouns). English pages byte-stable except intended. `npm run build` passes.

---

### WP3 — Standardize the ELFA term repo-wide  ✅ DECIDED
**Goal:** One canonical Traditional-Chinese rendering of "Early Learning For All (ELFA)" everywhere.

**Canonical term — Oscar's decision, 2026-07-01: `全民早期教育計劃`.** Replace every other variant with this exact string. (Note: this differs from all variants currently in the repo — it is a replace-all, not a pick-one.)

**Why:** Currently inconsistent — 全民幼兒學習 / 全民幼兒學習計畫 (SPA i18n) vs 全民早期學習計劃 / 全民托兒計劃 (static pages). Violates Oscar's glossary-consistency rule.

**Files:** `src/i18n/zh-TW.json`, `public/zh/**`, and any zh generator source (`src/data/neighborhoods.mjs`, template literals in `scripts/*.mjs`).

**Steps:**
1. Occurrence list: `grep -rn "全民" src/i18n/zh-TW.json public/zh src/data scripts` — capture each hit with surrounding context.
2. Replace variants → `全民早期教育計劃`, **longest-match-first** to avoid partial/dangling replacements: `全民幼兒學習計畫`, `全民早期學習計劃`, `全民托兒計劃`, then the bare `全民幼兒學習` (only where it names the program). **Watch for doubling** — if adjacent text already supplies 計畫/計劃, don't produce `全民早期教育計劃計畫`; verify each hit in context.
3. Fix at the generator source where pages are generated, then regenerate (`npm run generate:neighborhoods`) rather than hand-editing output.
4. ELFA's *English acronym* stays as-is. Don't touch es pages unless an es inconsistency surfaces (none flagged in audit — check, don't assume).
5. This is Chinese copy → list the changed strings in the final report so **Oscar can eyeball the diff** (his review rule).

**Acceptance criteria:** exactly one zh rendering (`全民早期教育計劃`) remains for ELFA; `grep -rn "全民幼兒學習\|全民早期學習\|全民托兒計劃" src public` → empty; no other zh text altered; build passes.

---

### WP4 — Schema depth on existing pages
**Goal:** Add high-value structured data *around content that already exists* — no new prose.

**Why:** Cheap AEO citation surface; pages are already built.

**Files:** `public/financial-assistance/index.html` (+ es/zh), `scripts/generate-neighborhood-pages.mjs` (for neighborhood FAQ/schema), root `index.html` (Organization — may already be added in WP1), page templates for `og:image`.

**Steps:**
1. **HowTo** on `financial-assistance` (all 3 langs): wrap the *existing* "how to apply / check eligibility" steps in a `HowTo` JSON-LD block. Use the existing step text verbatim; for es/zh use the existing translated step text on those pages. Add nothing new.
2. **Organization** site-wide: ensure one `Organization` node (name, url, logo, `areaServed`, contact if already public) — on the homepages (WP1) and, if trivial, referenced from key pages. Don't duplicate conflicting Organization nodes.
3. **Neighborhood/docs FAQ depth:** these pages have ~1 Q&A. **Only** wrap *existing on-page* question-like prose into additional `FAQPage` entries. If a page genuinely lacks 3+ real Q&As in the body, **do not invent them** — emit `TODO(oscar): needs 2–3 more FAQ Q&As (EN source, then reviewed es/zh)` and report it. (New Q&A *answers* are content voice → Oscar's.)
4. **og:image:** optional/low-priority. If cheap, allow per-page override in the generator; otherwise leave the shared `og-image.svg`.

**Acceptance criteria:** new JSON-LD blocks all `JSON.parse`; `HowTo` present on financial-assistance ×3; no net-new human-readable sentences added (only markup wrapping existing text, or `TODO(oscar)`); existing schema counts do not decrease; build passes.

---

### WP5 — Live-openings AEO surface (prerender `public_listings`)  ✅ FIELDS APPROVED
**Goal:** Make the real-time openings crawlable/citable — a static `/openings/` page (and/or current-opening counts injected into neighborhood pages) carrying `ItemList` + per-item `ChildCare`/`LocalBusiness` schema, refreshed on a schedule.

**Why:** The site's unique moat is invisible to answer engines.

**Approved field exposure — Oscar, 2026-07-01: counts + neighborhood + age-group + languages ONLY. NO address, NO phone, NO exact provider location, NO business name tied to a location.** Emit nothing outside this set into crawlable HTML/JSON-LD; keep it aggregate/anonymized.

**Steps:**
1. Add `scripts/generate-openings.mjs` that reads **only** the approved fields from `public_listings` (read-only; anon/public client, same as the SPA; **no writes to Supabase**).
2. Emit an `ItemList` + per-item schema limited to the approved fields — e.g. "N infant openings in the Sunset, Cantonese/English." Add the page(s) to `sitemap.xml`.
3. **Freshness:** this needs a scheduled rebuild. Do NOT wire cron/deploy yourself — ship the generator + a `package.json` script, document a recommended cadence (e.g. daily), and hand scheduling to Oscar.

**Acceptance criteria:** script is read-only; only approved fields appear anywhere in output (grep the output for any address/phone-like strings → none); JSON-LD valid; page in sitemap; build passes. Scheduling left to Oscar with a one-line recommendation.

---

### WP6 — Hygiene
**Goal:** Correctness cleanups.

**Steps & acceptance:**
1. **Sitemap freshness:** add/adjust a build step (or extend a generator) so `sitemap.xml` reflects the actual `public/**/index.html` inventory with current `lastmod`. Acceptance: every built static page appears in sitemap and vice-versa (§5 D).
2. **hreflang homepage:** already handled in WP1 (root points to `/es/`,`/zh/`). Verify.
3. **Vestigial code:** optionally remove unused `ProgramForm`, `ProgramSelector`, `AllProgramsSummary`, `CapacitySettings` imports/files **only if** the strict build stays green and tests pass. If any is referenced, leave it. Low priority — skip if risky.
4. **Cloudflare "Block AI Scrapers":** cannot verify from the repo. Emit a note asking Oscar to confirm it's OFF in the Cloudflare Pages dashboard (else robots.txt AI allow-list is moot). Don't attempt dashboard changes.

---

## 4. STOP and ask Oscar (human-in-loop)

Do **not** proceed on these without an explicit answer:
- **WP3 diff review:** apply the decided term (`全民早期教育計劃`) autonomously, but surface the changed Chinese strings for Oscar's review.
- **WP5 scheduling:** build the openings generator, but hand the refresh cadence / deploy wiring to Oscar.
- **Any net-new copy** flagged `TODO(oscar)` — Spanish/Chinese especially, but also new English Q&A answers, hero/marketing lines, or Trust Wheel text.
- Anything touching the **redesign**, brand voice, layout direction, or the 312-family survey narrative.
- Anything requiring **deploy, git push, Supabase writes, or Cloudflare/DNS**.

---

## 5. Global self-verification (run after every WP; all must pass)

**A. Build & typecheck**
```
cd /home/oscar/Projects/websites/sf-fcc-vacancy-registry
npm run build        # tsc -b && vite build — must exit 0
npm test             # vitest — existing suites stay green
```

**B. JSON-LD validity** — extract every `<script type="application/ld+json">` from `public/**/*.html` and `JSON.parse` each; assert `@context` + `@type` present. Write a throwaway `scripts/_verify-jsonld.mjs` (Node, no deps) that globs the files, regex-pulls the blocks, parses them, and prints any file+error. Zero parse errors required. Delete the throwaway when done.

**C. hreflang correctness** — for every content page (and the 3 homepages), assert exactly 4 alternates (`en`, `es`, `zh-Hant`, `x-default`), that the page's own URL appears among them (self-referential), and that alternates are reciprocal (the es/zh counterparts point back). Script it similarly and require zero violations.

**D. Sitemap ↔ inventory parity** — every `public/**/index.html` (excluding utility/one-off pages: 404, counter, links, volunteer, ca-widget-test, fcc-fair-2026 unless intended) has a `<loc>` in `sitemap.xml`, and every content `<loc>` resolves to a real file. Zero orphans either direction.

**E. No invented localized copy** — `grep -rn "TODO(oscar)" public src` and include the full list in the final report. Confirm no new zh/es sentence exists without a reviewed source.

**F. AEO/Lighthouse (if network available)** — optionally run Lighthouse SEO on a built page and/or paste a page's JSON-LD into Google's Rich Results test. If offline, B–D are the binding checks. Do not block on F.

**G. Regression guard** — schema type counts (FAQPage/BreadcrumbList/Article/ChildCare/ItemList) must be **≥** the pre-change baseline in §1. Never a net decrease.

---

## 6. Definition of done

- WP1, WP2, WP4, WP6 complete; WP3/WP5 prepped and blocked on Oscar's decisions.
- §5 A–E and G all pass; F attempted if online.
- Tree builds, tests green, nothing deployed, no Supabase writes, no secrets touched.
- A final report to Oscar containing: what changed (files), every `TODO(oscar)` needing reviewed copy, the WP3 ELFA variant list awaiting his choice, the WP5 field-exposure question, and the Cloudflare AI-scraper reminder.
