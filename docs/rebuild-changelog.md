# AEO Rebuild — Changelog & Review Notes

**Branch:** `feat/aeo-rebuild` (off `staging`) · **Run date:** 2026-07-01/02 · **Spec:** `docs/fable-rebuild-brief.md`
**Status:** WP1–WP6 executed autonomously. Build ✓ · tests ✓ · `node scripts/verify-aeo.mjs` ✓ · visual checks ✓ (Windows-Chrome headless screenshots of built output). **Nothing deployed; no Supabase writes; no data mutations.**

---

## What changed, by work package

### WP2 — Localized "typical hours" (was English in zh/es neighborhood pages)
- `src/data/neighborhoods.mjs`: `typicalHours` split into `typicalHoursEn/Es/Zh` (follows the file's existing suffix idiom), per-neighborhood times preserved.
- `scripts/generate-neighborhood-pages.mjs`: new `hoursFor(n, lang)` helper (matches `agesFor`/`langsFor`).
- All 10 committed `public/{es,zh}/neighborhoods/*/index.html` hand-edited (`<dd>` values only):
  - zh: `週一至週五，7:30 AM – 5:30 PM` — AM/PM kept in English **matching the reviewed prose style already in the zh pages** (週一至週五7:30 AM至5:30 PM), not the 上午/下午 style.
  - es: `Lunes a viernes, 7:30 AM – 5:30 PM` (matches reviewed "de 7:30 AM a 5:30 PM" prose style).
- **Why hand-edit instead of regenerate:** the generator is stale vs committed output (see "Latent issues" below).

### WP3 addendum — hidden ELFA variants + drifted JSON-LD in `public/zh/financial-assistance/index.html`
The FAQPage/Breadcrumb/Article JSON-LD in this one file stored text as `\uXXXX` escapes (invisible to the original WP3 grep) and had **drifted from the visible reviewed text**: old term 全民早期學習計畫, variant chars 託兒 (visible text uses 托兒), and the Japanese glyph 収 (typo for 收).
- FAQPage JSON-LD `name`/`text` **replaced verbatim with the visible on-page FAQ text** (the reviewed source of truth) — 8 Q&As synced.
- Breadcrumb/Article strings mechanically normalized (託兒→托兒, 収入→收入, old ELFA term→全民早期教育計劃).
- Blocks re-serialized as raw UTF-8 (no more escape-hiding from grep).
- **12 strings changed — zh copy, please eyeball the diff on this file.** (Reviewed by Oscar 2026-07-02.)
- Post-review, per Oscar: `mainEntity[4]` answer keeps the deep link `mychildcareplan.org/zh-tw/resource/child-care-subsidy-programs/` — an intentional divergence from the visible text (which shows the short domain as anchor text). The dropped bare domains in `mainEntity[1]` (childrenscouncil.org / wuyee.org) stay dropped, faithful to visible text.
- Bonus: the sync fixed a latent typo in the hidden JSON-LD — 嘰兒 → 嬰兒.
- Repo-wide decode-aware rescan: zero old variants remain anywhere (raw or escaped).

### WP1 — Localized crawlable homepages
- **New:** `public/es/index.html`, `public/zh/index.html`. Every visible string is verbatim from reviewed sources: h1/subtitle from `src/i18n/{es,zh-TW}.json` (`publicListings.title/subtitle`), nav + CTA section + footer + `<style>` cloned from that language's committed `financial-assistance` page, FAQ (3 Q&As) verbatim from the same page's visible FAQ, resource links = the committed nav labels. **Zero invented es/zh sentences.**
- JSON-LD per page: `WebSite` (with `inLanguage`), `Organization`, `FAQPage`.
- **Fixes an existing site-wide broken link:** the language switcher on every committed static page already pointed at `/es/` and `/zh/`, which 404'd until now.
- **Root `index.html`:** hreflang now points to the path homepages (`/es/`, `/zh/`) instead of `?lang=` URLs; added top-level `Organization` JSON-LD; the `<noscript>` block became **pre-hydration content inside `#root`** — crawlers/answer engines now get real HTML at `/`; React replaces it on mount (verified: SPA renders identically, 68 programs).
- `public/sitemap.xml`: homepage entry got its hreflang group; `/es/`, `/zh/` added. `public/robots.txt`: explicit Allow lines.
- Meta descriptions are two reviewed sentences joined (`publicListings.subtitle` + financial-assistance hero subtitle) — flagged since assembly ≠ verbatim single string.

### WP4 — Schema depth (no new prose)
- `financial-assistance/docs/family-size/` ×3 langs: FAQPage expanded 1→3 Q&As by wrapping the two existing section headings + their existing body text ("Who counts toward family size" / "Who does NOT count"). **Note:** question forms add a `?` and, for the second one, the noun "family size" (en/es/zh: 家庭人數) for standalone readability — slightly more than pure punctuation; listed for review.
- `Organization` schema now on all three homepages (see WP1).
- **HowTo: NOT added — TODO(oscar).** No financial-assistance page (any language) contains an actual step sequence; the "How do I apply?" section is agency contact cards. Adding HowTo would mean authoring step copy → yours. Suggested shape: 4 steps (screener → documents → contact R&R → search), EN first, then reviewed es/zh.
- **Neighborhood FAQ expansion: NOT done — TODO(oscar).** Each neighborhood page has exactly one genuine question ("Where can I find [language] daycare in X?"); other headings are statements. 2–3 new Q&As per page need your voice (then es/zh).
- residency-proof / self-employed-income docs pages: headings are elliptical ("What doesn't count") — skipped for the same reason.
- og:image per-page: skipped (brief marks it low priority).

### WP5 — Live-openings AEO surface
- **New:** `scripts/generate-openings.mjs` (+ `npm run generate:openings`) → `public/{,es/,zh/}openings/index.html`.
- **Privacy enforced in code:** PostgREST select is an explicit column allow-list (counts + neighborhood + age groups + languages **only** — per your 2026-07-01 approval); a hard guard throws if the response ever contains other fields; output audited (no phones/licenses/addresses/names).
- Read-only anon SELECT (same access as any visitor); counts **non-expired listings only** (stricter than the SPA, which also shows <30-day-expired "older listings").
- Trilingual with 100% i18n strings (incl. the reviewed `insights.asOf` freshness explainer). Language values shown raw (English), exactly as the SPA renders them.
- JSON-LD: `WebPage` (with `dateModified`) + `ItemList` per language. Pages added to sitemap; generator refreshes its own sitemap `lastmod` on every run.
- First run: **45 programs, 195 spots, 19 neighborhoods.**
- **TODO(oscar): scheduling.** Re-run cadence is yours — recommended: daily (`npm run generate:openings` + deploy). Until scheduled, the page is a static snapshot dated on-page.

### WP6 — Hygiene / verification
- **New:** `scripts/verify-aeo.mjs` — permanent check: JSON-LD validity, hreflang (4 alternates, self-referential, reciprocal), sitemap↔file parity, schema-count regression guard (baseline: FAQPage 63 / Breadcrumb 66 / Article 39 / ChildCare 15 / ItemList 6). Mutation-tested (correctly flags corrupted JSON-LD and broken hreflang). Current: **78 pages, all pass**; counts grew to FAQPage 65 / ItemList 9 / Organization 74 / WebSite 21.
- Vestigial components (`ProgramForm`, `ProgramSelector`, `AllProgramsSummary`, `CapacitySettings`): **left in place** — build is green with them; removal is low-value risk per brief.
- **TODO(oscar): Cloudflare** — confirm "Block AI Scrapers" is OFF in the Cloudflare Pages dashboard (`familychildcaresf` project), else the robots.txt AI allow-list is moot. Not verifiable from the repo.

---

## Latent issues found (not fixed — need your call)

1. **`generate-neighborhood-pages.mjs` is stale vs committed HTML.** Regenerating overwrites manual post-generation edits: the audience-top-bar include, `lang-switcher.js`, the 三藩市 footer (generator still emits 舊金山家庭托兒協會), and newer nav labels. **Do not run `npm run generate:neighborhoods` until the template is reconciled** — I updated the hours + ELFA term in the generator source so the *content* is right, but the scaffolding drift remains.
2. **zh nav labels differ between page families:** neighborhood pages say 比較/嬰兒照護/信任之輪; choose/financial pages say 了解選擇/嬰兒托兒/信任指南. One set should win (glossary suggests the latter).
3. **計畫 vs 計劃 variance** remains site-wide outside ELFA contexts (e.g. Article description 托兒計畫 vs body 托兒計劃; glossary memory says "Program = 托兒計畫" while your ELFA term uses 計劃). Glossary decision, not mine.
4. **舊金山 vs 三藩市** mixed across zh pages (homepage h1 uses reviewed 舊金山家庭托兒空缺 from i18n; some newer pages standardize on 三藩市).
5. **`insights.asOf` missing from `en.json`/`es.json`?** No — key parity held; en/es equivalents were used. (zh sample: 資料截至 {date}…)
6. Openings data quirks visible in the table: neighborhoods "Other (not listed)" and a bare "San Francisco" fallback row. Cosmetic; from free-form DB values.

## TODO(oscar) summary (copy/voice/ops — intentionally left for you)
1. HowTo step copy for financial-assistance (EN → reviewed es/zh), then wrap in HowTo schema.
2. 2–3 new FAQ Q&As per neighborhood page (EN → reviewed es/zh).
3. Review the WP3-addendum zh diff (`public/zh/financial-assistance/index.html`, 12 strings) and the two family-size question reformulations per language.
4. Schedule `npm run generate:openings` (daily recommended) as part of deploy.
5. Cloudflare "Block AI Scrapers" check.
6. Decisions on latent issues 1–4 above.

## How to re-verify
```
npm run build && npm test && node scripts/verify-aeo.mjs
npm run generate:openings   # refreshes /openings/ from live public_listings (read-only)
```
