# TODO: Replace SVG OG image with PNG

All 39 content pages + homepage reference `/og-image.svg` for `og:image` and `twitter:image`.

Facebook, LinkedIn, Twitter, and most social platforms do NOT render SVG as OG images. Shares currently show no preview image.

## What to do

1. Create a PNG or JPG image at 1200x630px (recommended OG dimensions)
2. Save as `public/og-image.png`
3. Find-and-replace across all HTML files:
   - `og-image.svg` → `og-image.png`
4. Consider language-specific OG images for ZH/ES pages (optional but recommended)

## Files affected

- `index.html` (homepage)
- All 39 files under `public/` (content pages)
