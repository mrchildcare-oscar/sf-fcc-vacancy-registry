# Listing Signals — keeping openings honest

Status: **design, not built.** Decisions below were made by Oscar on 2026-10-17. Nothing here is deployed.

## The problem

Listings go stale soon after a provider posts them. The first Community Insights snapshot (June 2026) found 46 of 57 programs with openings were more than 30 days old. Parents hit dead ends: they call about a spot that filled weeks ago.

The registry already has seven freshness mechanisms. Each one infers truth from *time since the last edit*:

| Mechanism | Where |
|---|---|
| 45-day expiry (90 days if waitlist-only) | `src/lib/vacancyTtl.ts`, `supabase/functions/_shared/vacancyTtl.ts`, migration `20260220_vacancy_expiry_reminders.sql` |
| Fresh / aging / stale tiers (14 / 30 days since `updated_at`) | `src/lib/vacancyTtl.ts` `getListingFreshness` |
| "Older Listings" collapsed section | `src/components/registry/PublicListings.tsx` |
| Reminder emails at 15 and 5 days before expiry (day 30 and 40 for 45-day listings; ~75 and 85 for waitlist-only), English only | `supabase/functions/send-vacancy-reminders/index.ts` |
| One-click "still accurate" token (renews only, no "filled") | `supabase/functions/confirm-vacancy/index.ts`, `confirm_vacancy` RPC |
| Jotform re-submission updates in place when license matches and email or phone matches (otherwise staged for owner confirm) | `supabase/functions/jotform-intake/index.ts` |
| Dashboard edit (only for providers whose login is linked to the listing) | `upsertVacancy` in `src/lib/supabase.ts` |

Why they don't keep listings current:

1. **The nudge arrives late.** The card shows "updated over 2 weeks ago" from day 14, but the first email comes at day 30, when the listing is already stale.
2. **Wrong language.** Reminders are English-only. Of the 76 providers in the first monthly digest, 67 get Chinese.
3. **"Still open" is the only answer.** A provider whose spots filled has no one-tap way to say so, so they ignore the email and the listing sits until it expires.
4. **No parent signal.** Contact clicks and inquiries are tracked, but no parent is ever asked whether the opening was real.
5. **[CHECK] Is the reminder cron running?** Its schedule isn't in the repo. The daily-report cron was once deleted without anyone noticing.

## The core idea

A listing is a **claim** ("I have an opening") that decays the moment it is made. The registry's job is to keep each claim honest about how true it still is.

Replace edit-time inference with one building block: **a log of confirmations.** The provider and the parent are two inputs to the same log, not two features.

## Data model

One new table, `listing_signals`:

| Column | Meaning |
|---|---|
| `provider_id` | which listing |
| `source` | `provider` or `parent` |
| `channel` | how the signal arrived: `checkin_link`, `dashboard`, `jotform`, `inquiry_followup`, `click_prompt`, `card_button` |
| `age_group` | `infant` / `toddler` / `preschool` / `school_age` (null = whole program) |
| `claim` | `open`, `full`, `no_reply` (parent only: never heard back), `reached` (parent only: got a reply) |
| `spots` | optional approximate count, provider only |
| `created_at` | when |

Everything else is derived from this log:

- **Provider claim** = the latest provider signal per age group ("Taking toddlers: yes").
- **Family column** = parent signals in the last 30 days, filtered by the display policy below.
- **Freshness** = time since the latest *provider* signal (a confirmation, not just any edit).

## Decisions (2026-10-17)

| Question | Decision |
|---|---|
| Who decides what parents see? | **Side by side.** The card shows the provider's claim *and* recent parent reports; the parent judges. |
| What is confirmed? | **Open yes/no per age group.** Spot counts are no longer the thing being confirmed. |
| Spot counts | **Optional**, entered in the "Some filled" flow ("about 3"). Shown, and counted in /insights, only when confirmed within the fresh window. The /insights headline becomes "programs taking each age group"; spots are a secondary figure. |
| Provider goes silent | **Fade honestly, then hide.** Fresh under 2 weeks; from 2 to 6 weeks it shows "Not confirmed in N weeks" and sorts lower; hidden after 6 weeks. |
| How providers respond | **One-tap links in their language**, no login: Still open / Some filled / Full. Language inferred the same way `send-community-digest` does. Login becomes a backup only, which sidesteps the account-linkage gap. |
| Who can leave a parent report | **Not decided — test it.** Collect from every channel, tag each report with `channel`, and choose what to display from real data (see below). |

## Card

> **Provider:** taking infants & toddlers · confirmed 3 days ago
> **Families (30 days):** 2 got a reply · 1 told full

The family line appears only for channels the display policy allows.

## Nudges

- **Every 2 weeks** since the last provider signal: check-in email with the three buttons.
- **Right after a parent reports `full` or `no_reply`:** the same check-in to the provider immediately.
- Tapping "Some filled" opens a short pre-filled page: which age groups are still open, plus an optional count.

## Flexible by design: settings, not code

Every threshold and policy is a value in one config row (or table), so it can change without a redeploy:

- `fresh_days` (14), `hide_days` (42), `family_window_days` (30), `checkin_every_days` (14)
- `parent_channels_collected`: all three from the start
- `parent_channels_displayed`: which channels show on the card

### The parent-report test

1. **Collect from all three channels** from day one:
   - `inquiry_followup`: email to a parent a few days after an inquiry ("Did they still have an opening?")
   - `click_prompt`: one-time in-page prompt on the next visit after a call/email click
   - `card_button`: "Was this accurate?" on every card
2. **Display nothing publicly at first.** Reports only trigger provider check-ins.
3. After ~4–6 weeks, look at, per channel:
   - volume
   - how often a parent report matched what the provider said at the next check-in
   - suspicious patterns (bursts, one device reporting many listings)
4. Pick the display rule by changing `parent_channels_displayed`.

## What this removes or replaces

- The 45/90-day expiry → `hide_days` since the last provider signal
- Both reminder slots (`reminder_30_sent_at`, `reminder_40_sent_at`) → the 2-week check-in
- Edit-date freshness tiers → confirmation-based freshness
- The "Older Listings" section → fading cards sorted lower
- The confirm-only token → three-button check-in
- Spot counts as the confirmed claim → yes/no per age group, optional count

Jotform stays the way new providers join.

## Must update alongside (mirrors)

- `src/lib/vacancyTtl.ts` **and** `supabase/functions/_shared/vacancyTtl.ts`
- `public_listings` view, plus `capture_community_snapshot()` and `CommunityInsights.tsx` (they must aggregate the same way)
- i18n: `src/i18n/en.json`, `es.json`, `zh-TW.json` (`publicListings.*`, `insights.freshness*`)
- Email copy is hardcoded per edge function; the new check-in needs EN/ES/zh-TW versions

## Open items

- [CHECK] Confirm the `send-vacancy-reminders` cron is scheduled before relying on it, or before replacing it.
- All new zh-TW copy (check-in email, buttons, card lines, parent prompts) ships flagged for Oscar's review, reusing glossary terms.
- Parent follow-up email and the new table hold parent data → Vercel preview first; privacy note on the inquiry form.
- Migrating existing listings: seed one provider signal per open age group from current `updated_at` so nothing vanishes on cutover.
