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

## Still open (optional)

- **Language-specific cards for ES and ZH pages.** All 77 pages currently share one English card.
  Same pipeline: change the headline, capture the site in that language, output
  `og-image-es.png` / `og-image-zh.png`, and point the `public/es/**` and `public/zh/**` pages at them.
- **After deploying**, re-run LinkedIn's Post Inspector on the live URL to force a re-scrape —
  LinkedIn will otherwise keep serving the cached "no image" result.
