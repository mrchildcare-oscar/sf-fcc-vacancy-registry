# DONE — SVG OG image replaced with PNG

**Completed 2026-09-01.** (Was `public/choose/TODO-og-image.md` — moved here because anything
under `public/` is served publicly; the note was live at
`familychildcaresf.com/choose/TODO-og-image.md`, HTTP 200.)

## The problem

Every page referenced `/og-image.svg` for `og:image` and `twitter:image`. LinkedIn, Facebook and
most social platforms do not render SVG as an OG image, so every share of this site — in all three
languages, on every platform — went out with no preview image.

Confirmed before the fix with LinkedIn's Post Inspector against `https://familychildcaresf.com`:
**"Image: No image found."**

## What was done

1. **New card:** `public/og-image.png`, 1200×630, 357 KB.
   Left side: "Find family child care in San Francisco" in brand blue `#2563eb`, subhead,
   EN/ES/中文 chips, FCCASF attribution. Right side: a real screenshot of the live homepage in a
   device frame — not a drawing of the UI, so it cannot drift out of sync with the site.
   No opening count in the card copy: LinkedIn caches OG images and does not re-scrape on its own,
   so any number baked into the card would freeze and go stale.
2. **Replaced `og-image.svg` → `og-image.png`** in 77 files: `index.html` (incl. the JSON-LD
   `logo` field) and every static page under `public/`.
3. **Updated both page generators** so regenerated pages keep the fix:
   `scripts/generate-openings.mjs`, `scripts/generate-neighborhood-pages.mjs`.

`public/og-image.svg` is left in place as the original design source; nothing references it now.

## Regenerating the card

The card is produced from two files (kept outside this repo, in the session scratchpad — copy them
in if you want them versioned):

- `shot.py` — drives headless Chrome over CDP, captures `familychildcaresf.com` at a 390×844
  mobile viewport
- `og-card.html` — the 1200×630 layout that composites that screenshot into the device frame

Re-run both after any homepage UI change and the card is current again.

## Language-specific cards (added 2026-09-01, second commit)

`public/og-image-es.png` and `public/og-image-zh.png`, same layout and pipeline. The phone in each
is the live app captured at `?lang=es` / `?lang=zh` — the URL params the app already supports for
flyer QR codes.

**Every string on those two cards is copied verbatim from reviewed, shipped i18n — no new
translation was written.** Sources, all from `src/i18n/`:

| Card element | ES | ZH |
|---|---|---|
| Headline | `publicListings.title` | `publicListings.title` |
| Subhead | `publicListings.introSentence` | `publicListings.introSentence` |
| Attribution | `publicListings.footerPrefix` + `footerOrgName` | `footerPrefix` + `footerOrgName` + `footerSuffix` |

Wiring: `public/es/**` → `og-image-es.png`, `public/zh/**` → `og-image-zh.png`, English pages
unchanged. Both generators now carry an `ogImage` field per language entry (`LANGS`) and emit
`${langCfg.ogImage}` / `${cfg.ogImage}`, so regenerated pages keep the right card.

⚠ **Known naming inconsistency, not resolved here.** The ZH card uses 舊金山 for San Francisco,
because that is what the shipped `publicListings.title` and `footerOrgName` use. The translation
glossary records the association as 三藩市家庭托兒協會, and the live `/zh/` page description mixes
both. PLANNING.md already carries "decide 三藩市 vs 舊金山 site-wide" as an open item — once decided,
the card is a one-word change and a re-render.

## Image dimensions declared (added 2026-09-01, third commit)

Every `og:image` is now followed by `og:image:width` (1200), `og:image:height` (630) and
`og:image:type` (image/png) — 75 pages plus all three templates in the two generators.

Why: without declared dimensions, the **first** time a platform scrapes a URL it has to fetch and
measure the image before it can lay the card out, so that first share often renders with no image
and only later ones show it. Most of these 77 pages have never been scraped by anyone, so this is
what makes them render correctly the first time somebody shares them.

`public/fcc-fair-2026/index.html` already declared dimensions and was left alone.

## Cache invalidation is per-URL, and per-platform

Fixing the tags does not fix anything already cached. Each platform holds its own copy, keyed by
URL, and will keep serving the old result until forced:

- **Facebook** — Sharing Debugger (`developers.facebook.com/tools/debug/`), "Scrape Again"; the
  Batch Invalidator takes a list. On 2026-09-01 the homepage was still serving a cache from
  **August 18** that reported *"Unsupported Image File Extension"* against the old SVG, two weeks
  after the file stopped being referenced. Re-scraped and correct now.
- **LinkedIn** — Post Inspector (`linkedin.com/post-inspector/`).

Facebook's `Missing Properties: fb:app_id` warning is safe to ignore — it only attributes traffic
to a Facebook app for domain insights and has no effect on link previews.

## Still open
- The three `/donate` static pages are already corrected **in the working tree** (English → PNG,
  ES/ZH → their language cards) but were left out of both commits, because they also carry
  unrelated in-flight donate work. Until that work is committed and deployed, production keeps
  serving the old `og-image.svg` on those three pages only.
