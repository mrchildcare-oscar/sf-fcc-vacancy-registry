# Changelog: familychildcaresf.com

What changed on the live site, newest first. For the team and for Oscar: one place to see what was added,
changed or removed, which commit and deployment it shipped in, what still needs a human review, and how to roll
back. Audience-facing announcements live in `docs/release-notes/`; the July search rebuild has its own notes in
`docs/rebuild-changelog.md`. Entries start 2026-10-01; earlier history is in `git log`.

Dates are Pacific time. "Prod" = the Vercel production deployment aliased to familychildcaresf.com.

## How to add an entry

Before any preview or production deploy, run `npm run review` (`scripts/review.mjs`). It must end in PASS;
WARN lines are open decisions listed below. When you fix a drift, add a check for it there.

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
- **"Open today" vs "Opening soon":** one rule, `isOpenNow` / `isUpcoming` in `src/lib/upcoming.ts`, used by the
  listings page, the inquiry form and `scripts/generate-openings.mjs`. Change it there, not in a copy.
- **Citywide facility counts:** the stat blocks on `family-child-care-vs-centers`, `child-care-san-francisco`
  and `infant-care-san-francisco`, in three languages. These were hard-coded in March 2026 and drifted; refresh
  from state licensing data.

## Parked and open (not shipped)

- On `staging`, not deployed: commit `2efca61` (`npm run review` harness, and the `/go/links` page now lists
  `/go/donate`). Ships with the next production deploy.
- Branch `fair-2026-wip` (`b1846ca`): Fair 2026 page edits (Jotform RSVP, per-language QR codes, partner logos).
  The Fair is over; contains unreviewed Chinese. Not merged.
- 13 family child care license numbers on DEC's CARES 3.0 list are closed and replaced; the draft message to
  DEC's stipend team has not been sent. Doc: https://claude.ai/artifact/CQnUyXxEU9raHb1z87aJax
- Hidden `?redesign=1` mockup screen (`src/redesign/screens/EligibilityScreen.tsx`) still says "ELFA covers your
  full tuition" with a made-up "$0/mo" and "About $400/mo". Not linked from the site.

## 2026-11-26: code-review fixes (zh counts, one "open today" rule, zh donate wording)
Prod deployment `dpl_Cp15MBviYaDFBVFWveXmhVXkGjWQ` (commit `95f29ce`, built from GitHub, deployed 11:56).
Roll back to: `dpl_FoGwu7pHJqBibtnNra7KtznEhwnh`. Preview reviewed by Oscar (`sf-fcc-vacancy-registry-bq08jhpm8`);
`npm run review` PASS (0 failed, 2 warnings).

- **Fixed:** the zh child-care page said 892 facilities / 370 centers. It now says 1,252（2026年9月）/ 400, the same
  as en/es (state licensing data of Sept. 20, 2026, per commit `7d45fc7`). Checked live: no 892 left.
- **Fixed:** `/openings/` counted homes opening in a later month, and waitlist-only homes, as current openings. It
  now uses the listings page's rule (`isOpenNow` in `src/lib/upcoming.ts`). Regenerated 2026-11-26: 20 programs,
  84 spots (the old rule gave 26 and 86). Checked live.
- **Fixed:** the inquiry form offers the same age groups the listing card shows (spots or "accepting" flag).
- **Changed:** zh donate copy uses the glossary terms 家庭托兒者 and 家庭托兒所 (`src/i18n/zh-TW.json`,
  `public/zh/donate/`).
- **Removed:** the unused `language.spanish` key from `es.json`; en/es/zh are back to 534 keys each.
- **Needs review:** new Chinese tax line 「在法律允許的範圍內，您的捐款可以用作扣稅。」 ("to the extent allowed by
  law", which the English had and the Chinese dropped). Live since this deploy; not yet signed off word for word.

## 2026-11-25: "Opening soon" section on the listings
Prod deployment `dpl_FoGwu7pHJqBibtnNra7KtznEhwnh` (commits `1979bee`, `5869209`; clean export, deployed 2026-11-25).
Roll back to: `dpl_7TWJHb1hxBmxoGLsuMFKKg5bWEDD`. Preview reviewed by Oscar (`sf-fcc-vacancy-registry-pfry6f3zg`).

- **Added:** an "Opening soon" group on the public listings, between homes open now and "Currently full". A home
  lands there when its available date is in a later month, at most 6 months ahead, and it reported spots or age
  groups. Cards say "Opening <Mon YYYY>" with the age groups. Rule in `src/lib/upcoming.ts`, tests in
  `src/components/registry/isUpcoming.test.ts`.
- **Changed:** homes with future-dated spots no longer count as open today (MEFC Sunset's 2 January toddler spots;
  ME Playschool moved out of "Currently full"). The open-now totals, ELFA count and nearby fallback count only homes
  open today. The inquiry form for an upcoming home offers only the age groups it reported.
- **Needs review:** new Spanish ("Próximas vacantes", "Vacante en {month}", hint and info lines) and Chinese
  (即將開放, 未來6個月內預計開放的名額, {month}開放, the info line) strings. Open questions: spots dated more than
  6 months out still count as open (Lijun Ma, June 2027); the provider dashboard and Community Insights still
  count future-dated spots as open; the dashboard reads dates as UTC (a date on the 1st can show the prior month).

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
