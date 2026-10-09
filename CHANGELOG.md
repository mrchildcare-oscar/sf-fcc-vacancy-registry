# Changelog: familychildcaresf.com

What changed on the live site, newest first. For the team and for Oscar: one place to see what was added,
changed or removed, which commit and deployment it shipped in, what still needs a human review, and how to roll
back. Audience-facing announcements live in `docs/release-notes/`; the July search rebuild has its own notes in
`docs/rebuild-changelog.md`. Entries start 2026-10-01; earlier history is in `git log`.

Dates are Pacific time. "Prod" = the Vercel production deployment aliased to familychildcaresf.com.

## How to add an entry

One entry per production deploy, at the top. Copy this block:

```
## YYYY-MM-DD: short title
Prod deployment `dpl_...` (commit `abc1234`, deployed HH:MM). Roll back to: `dpl_...`.

Added / Changed / Removed / Fixed: one line each, with the file or page and the numbers.
Needs review: copy that went live without Oscar's review, unverified claims, open questions.
```

Rules: facts come from a source (state licensing data, sf.gov, DEC sheets), and the entry names it. New Spanish
or Chinese wording is always listed under "Needs review" until Oscar signs it off.

## Things that must change together

- **ELFA license list:** `src/lib/elfa.ts`, `supabase/functions/_shared/elfa.ts` and
  `supabase/functions/refresh-elfa/index.ts` must hold the identical set (381 licenses as of 2026-10-01).
- **Income ceilings (SMI, 85% SMI, AMI), reissued every July by SF DEC:** `src/lib/eligibility.ts`,
  `public/ca-eligibility-widget.js`, the family-of-2/4/6 lines in `src/i18n/*.json`, the static pages in
  `public/**` (financial-assistance, choose, infant-care, child-care, home, and the family-size doc pages that
  quote MONTHLY caps), and `scripts/generate-zh-subsidy-pdf.mjs`. Check the live site afterward; the repo can be
  ahead of production.
- **Tuition credit amounts (FY 2026-27, DEC rate sheet and sf.gov):** the age-group table on the
  financial-assistance, choose and infant-care pages in three languages.
- **Citywide facility counts:** the stat blocks on `family-child-care-vs-centers`, `child-care-san-francisco`
  and `infant-care-san-francisco`, in three languages. These were hard-coded in March 2026 and drifted; refresh
  from state licensing data.

## Parked and open (not shipped)

- Branch `fair-2026-wip` (`b1846ca`): Fair 2026 page edits (Jotform RSVP, per-language QR codes, partner logos).
  The Fair is over; contains unreviewed Chinese. Not merged.
- 13 family child care license numbers on DEC's CARES 3.0 list are closed and replaced; the draft message to
  DEC's stipend team has not been sent. Doc: https://claude.ai/artifact/CQnUyXxEU9raHb1z87aJax
- Hidden `?redesign=1` mockup screen (`src/redesign/screens/EligibilityScreen.tsx`) still says "ELFA covers your
  full tuition" with a made-up "$0/mo" and "About $400/mo". Not linked from the site.

## 2026-10-09: corrected citywide facility counts
Prod deployment `dpl_7TWJHb1hxBmxoGLsuMFKKg5bWEDD` (commit `7d45fc7`, deployed 2026-10-09 00:33). Roll back to:
`dpl_FTvNsbfJYvq7ubmrhR7mpHeVyBCy`.

- **Fixed:** the stat blocks said 892 licensed facilities, ~900 homes and 370 centers, which cannot all be true.
  Now 1,252 licensed facilities, 852 family child care homes (297 large + 555 small) and 400 centers, labeled
  "Sept. 2026". Source: California Community Care Licensing download of 20 Sep 2026 (centers, large homes) plus
  the small-home count from the records request and the dashboard's small-home total.
- **Changed:** pages `family-child-care-vs-centers`, `child-care-san-francisco` (including its FAQ data),
  `infant-care-san-francisco`, in English, Spanish and Chinese. The Spanish child-care page said "892 centros"
  for all facilities; it now says "instalaciones".
- **Needs review:** whether showing the 555 small-home count publicly is OK. "Over 500 providers in the ELFA
  network" still appears on several pages and has not been re-verified (it reads like a family-child-care-only
  figure on the comparison page).

## 2026-10-07: the tuition credit explained
Prod deployment `dpl_FTvNsbfJYvq7ubmrhR7mpHeVyBCy` (commit `9f74fe2`, deployed 2026-10-07 12:48). Roll back to:
`dpl_cofvxFqLpNupJQKicoGaK2Mp9nNm` (Vercel no longer flags it as a rollback candidate; redeploying commit
`db1d069` from a clean checkout does the same).

- **Changed:** parents read "100% tuition credit" as 100% of their program's price. The pages now say the credit
  is a fixed monthly dollar amount equal to 100% (full) or 50% (half) of DEC's full-time ELFA rate for the
  child's age group, and the family pays the balance. Only up to 110% AMI is called free.
- **Added:** a "How the tuition credit works" block with the FY 2026-27 amounts (full credit infant $3,027,
  toddler $2,306, preschool $2,115 a month; half credit $1,514, $1,153, $1,058), a labeled hypothetical example
  ($2,500 program: $385 or $1,442 left for the family) and a new FAQ, on the financial-assistance, choose and
  infant-care pages in three languages. Source: DEC rate sheet FY 2026-27 and sf.gov (updated July 1, 2026).
- **Changed:** the eligibility tool no longer lists the 111-150% AMI tier under "FREE childcare"; the credit cards
  use the rate-based wording and the "coming soon" flag is gone. The family-size doc pages quoted last year's
  monthly caps ($15,587 and $22,600); now the FY 2026-27 150% AMI caps ($16,213 and $23,509), citing sf.gov.
- **Removed:** "effectively free", "fully covered", "at no extra cost", "50% off", the unsourced "$18,000 per
  year" savings claim, and the stale "Starting July 2026" wording for the half credit.
- **Needs review:** all new Spanish and Chinese wording; mixed 三藩市 and 舊金山 on the Chinese pages; the
  unsourced "approximately $36,000" subsidy line and "Covers full-time and part-time care" on the
  financial-assistance page (both left as they were); the English-language FAQ data on the Spanish and Chinese
  infant-care pages.

## 2026-10-01: FY 2026-27 income ceilings, sf.gov source line, ELFA list, Zeffy donations
Prod deployment `dpl_cofvxFqLpNupJQKicoGaK2Mp9nNm` (commit `db1d069`, deployed 2026-10-01 18:31). Roll back to:
`dpl_4ekXMSVGZWKiKAob2UyTXVr6HAaS` (the 2026-09-01 deployment).

- **Fixed:** the live site still served the FY 2025-26 income ceilings (family of four at 110% AMI: $171,450 shown
  vs $178,300 published), so families near a ceiling were told they did not qualify. The fix had been made in code
  on 2026-09-08 but never committed or deployed. Updated from DEC's combined eligibility sheet in
  `src/lib/eligibility.ts`, the embeddable widget, the i18n ceilings and the static pages (commit `da2319f`).
  85% SMI is now an explicit published table (115,632 for a family of four), not derived.
- **Added:** a source line under the eligibility tool, "Income limits come from the SF Department of Early
  Childhood, FY 2026-27 (updated July 1, 2026)", linking the sf.gov page (commit `d4527c0`).
- **Added:** five ELFA licenses confirmed on SFDEC's live directory: 384004639, 384004888, 384004825, 384005192
  and 384005252; the list went from 376 to 381 in all three copies (commits `e3d0717`, `99edd2f`). Found by
  cross-checking DEC's CARES 3.0 list: 13 of its family child care rows carry closed license numbers that were
  replaced by new ones.
- **Changed:** the donate page moved from the Join It widget to the Zeffy donation form, with the nonprofit
  disclosure (legal name, 501(c)(3), EIN 71-0958628) and `legalName`/`taxID` in the page data, in English,
  Spanish and Chinese; static donate pages use the 1200x630 PNG for `og:image` (commit `db1d069`).
- **Removed:** the Join It widget and its attribution link.
- **Needs review:** a test donation through Zeffy (the form URLs returned 403 to automated checks, so loading was
  never verified); the new Spanish and Chinese disclosure sentences; the source line is English-only on the
  Spanish and Chinese pages.
