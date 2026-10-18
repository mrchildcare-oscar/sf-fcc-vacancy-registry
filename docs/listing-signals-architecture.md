# Listing signals: architecture

Status: **design, not built.** Synthesized 2026-10-17 from two candidate designs. Product decisions live in `docs/listing-signals-design.md` and are not reopened here.

## Problem

A listing is a claim that starts going stale the moment it is made. Today, seven mechanisms guess how true it still is from *edit time*: `vacancies.expires_at`, two copies of `vacancyTtl.ts`, SQL `compute_vacancy_ttl_days`, the RLS `expires_at > now()` check, the `public_listings` WHERE clause, `getListingFreshness` tiers, and the reminder columns. The decided model replaces all of them with one log of confirmations. The shape is not obvious because of these constraints, all checked in the code:

- **Writers that must keep working.** Dashboard `upsertVacancy` (`src/lib/supabase.ts:170`), org `updateProviderVacancy` (`:413`), `AdminAddProvider.tsx:89,117` (browser inserts a provider *and* a vacancy), `jotform-intake/index.ts:354` (update) and `:506` (insert), `confirm-jotform-update/index.ts:251`, and `confirm-vacancy`.
- **No login for most providers.** Jotform and admin providers have no auth user.
- **Four aggregate paths must agree.** `capture_community_snapshot()`, `CommunityInsights.tsx` (client-side reduce, `:92+`), `send-community-digest` (reads snapshots), and `send-daily-report` (reads `vacancies` and `expires_at` directly, `index.ts:165-172`).
- **An external embed reads listing state.** `public/widget.js:144,162` calls `get_provider_vacancy` and `get_org_vacancies` (`20260201000828_remote_schema.sql:125,152`). Providers paste it onto their own sites (the snippet is in `VacancyForm.tsx:447`). Both functions return raw spot counts, ignore expiry, and skip the `is_approved` check.
- **Open write holes today.** `"Allow insert vacancies"` and `"Allow insert providers"` are `with check (true)` (`remote_schema.sql:463-468, 382-387`), so anyone holding the public key can insert. Admin is checked only in the browser (`VITE_ADMIN_EMAILS`, `RegistryApp.tsx:45,206`). `AdminAddProvider` relies on the open provider-insert policy to work at all.
- **`public_listings` is `security_invoker`** (`20260304_fix_security_definer_views.sql:15`).
- **Known failure modes.** Oscar maintains this part-time. Hand-synced copies (`elfa.ts` ×3, `vacancyTtl` ×2) and silently deleted crons have both caused problems before. The reminder cron's schedule is not in the repo (only the snapshot cron is, `20260531:99-103`).

## Usage (caller's view)

> Listing state has **one log and one reader**. Providers write with `save_listing` (details + claim) or `record_provider_claim` (claim only). Parents write with `record_parent_signal`. Every write carries an idempotency key. Everyone reads `listing_state()` or a view built on it. Nothing else stores or computes freshness. To change a threshold: `update listing_policy set fresh_days = 10;`

**1. Card** (`PublicListings.tsx`, redesign `ListingScreen.tsx`):
```tsx
import { getPublicListings } from '../../lib/listings';
const listings = await getPublicListings();            // PublicListing[]; hidden listings never arrive
<ListingStatusLine status={l.status} family={l.family} />
// fresh  -> "Provider: taking infants & toddlers (about 3) · confirmed 3 days ago"
// fading -> "Provider: taking toddlers · not confirmed in 3 weeks"   (no spots field exists on this variant)
// family === null -> no family line (launch state: no channel displayed)
const ordered = groupBySortRank(listings).flatMap(shuffleListingsForUser); // rank 0 fresh, 1 fading
```

**2. One-tap check-in.** Email link → frontend `#checkin?t=<token>&a=open|full|some`. The page load changes nothing. The page's JavaScript then POSTs to the `signal-link` edge function:
```ts
const tok = await verifySignalToken(body.t);           // HMAC; throws on bad or expired
if (tok.kind === 'provider_checkin') {
  const action = parseCheckinAction(body);             // still_open | full | some_filled{open, spots}
  const r = await svc.rpc('record_provider_claim', {
    ...toClaimArgs(tok.providerId, action), p_channel: 'checkin_link',
    p_idempotency_key: `checkin:${body.nonce}`,        // nonce minted once per page load: a double-tap is a no-op
  });                                                  // r = { status: 'applied' | 'duplicate' }
}
```

**3. Parent report** (card button or click prompt from the browser; inquiry follow-up only through `signal-link`):
```ts
await recordParentSignal({ providerId, channel: 'card_button', claim: 'full', ageGroup: null });
// Returns void whether the report was stored, rate-limited, de-duplicated or ignored. The caller never learns which.
```

**4. Provider save** (dashboard, org dashboard, admin; Jotform from the edge):
```ts
await saveListing(providerId, details, { open: ['toddler'], spots: { toddler: 3 } }, formNonce);
// Jotform: svc.rpc('save_listing', {..., p_channel: 'jotform', p_observed_at: submittedAt,
//                                   p_idempotency_key: `jotform:${submissionID}`})
```

**5. Insights** (all four paths call one aggregator):
```ts
const stats = await getCommunityStats();               // rpc('community_stats'), used by CommunityInsights.tsx
// capture_community_snapshot(): insert ... select ... from community_stats()
// send-daily-report: rpc('community_stats') + rpc('signal_health')   // signal_health = the "cron died" alarm
```

## Shape

**Stored data.** Three append-only logs, one config row, and one details table. None of them holds derived state.
- **`listing_signals`** is the only stored claim and confirmation data.
  - Provider writes are always a **complete batch**: one row per age group, sharing `batch_id` and `observed_at`. "Current provider claim" is simply the newest batch, so no per-group merging is needed.
  - `source` is a **generated column** computed from `channel`, so a `card_button` row can't claim to be from a provider.
  - CHECKs tie each claim to its source.
  - `idempotency_key` is unique per (key, age group), so retries and double-taps insert nothing.
- **`outbound_messages`** logs check-in and follow-up emails sent. "Due" is derived from this log plus the signals.
- **`listing_policy`** is a single row holding every threshold, the channel lists, and the cutover `hide_grace_until`.
- **`registry_admins`** (user ids) is the server-side admin list.
- **`vacancies` is renamed `program_details`.** All claim, TTL and token columns are dropped. Every stale reference then fails loudly, either at `tsc` or as a missing column.

**Derivation: one function.** `listing_state(p_now)`, SECURITY DEFINER and STABLE, is the **only** place these rules exist:
- fresh / fading / hidden
- spots shown only while fresh
- which parent channels are displayed
- sort rank
- when a check-in is due

The newest batch is chosen by `observed_at`, the time the provider made the statement. A delayed Jotform webhook or a staged update confirmed days later therefore never overrides a newer answer. It is still logged (out-of-order signals are ignored by construction).

Everything else reads through `listing_state()`: `public_listing_state()` (drops hidden rows and due logic; granted to anon), the `public_listings` security_invoker view over it, `community_stats()`, the widget RPCs, and the service-role-only `checkins_due` / `followups_due` views.

With about a hundred listings, deriving state on every read costs nothing measurable.

**Writes.** Every write goes through a SECURITY DEFINER RPC. No role has INSERT/UPDATE/DELETE grants on `listing_signals`, `outbound_messages` or `program_details`. All the old open insert policies on `vacancies` are dropped with the table rename. Authorization lives in one private helper, `assert_can_write_listing`:
- service role → any provider channel
- `auth.uid()` = provider, or org owner (the existing `"Org owners can manage provider vacancies"` predicate) → `dashboard`
- `registry_admins` → `admin`

Parent rows **cannot** change a claim, because the claim derivation reads only `source = 'provider'`. "One actor can't take a listing down" is therefore a structural fact, not a rate limit.

**Nudges.** One sender, `send-signal-emails`, runs on one pg_cron job every 15 minutes:
- It reads `checkins_due` and `followups_due`.
- It sends trilingual email (`pickLang` moves to `_shared/lang.ts`).
- It appends to `outbound_messages`.

"Immediately after a parent report" means within 15 minutes. Two caps apply to parent-triggered check-ins:
- one per listing per `checkin_trigger_cooldown_hours`
- none if the provider has confirmed since the report

`signal_health()` raises an alarm, shown in the daily report, in either case:
- check-ins were due but nothing was sent in 24h
- the sender's row is missing from `cron.job`

**Tokens.** Tokens are stateless HMAC: `{kind, providerId | inquiryId, lang, exp}`, 21 days. No token table or columns. A replayed link from a new page load appends a fresh batch, which is the same as the provider re-confirming.

**Interface depth.** The frontend sees four functions: `getPublicListings`, `getCommunityStats`, `saveListing` and `recordParentSignal`. Edge functions see two RPCs. Hidden behind them: tiering, display policy, spot suppression, authorization, idempotency, ordering, rate limits, cooldowns and due logic. Callers never pass a threshold or a "now".

**Deliberately not done:** no projection or materialized view, no stored tier, no compatibility view mimicking the old `vacancies` columns, no TypeScript freshness arithmetic, no client-side insights aggregation.

## Synthesis decision

**Base: candidate A.** The log is the only stored claim data, and all state is derived at read time by one SQL function. At about 100 listings derivation is free, and with no projection there is nothing to keep in sync, no drift check, and no rebuild function.

**Grafted from B:**
1. **Closing the write holes.** The `vacancies` write policies, including `"Allow insert vacancies" with check (true)`, go away. Only definer RPCs write. *Why:* a log the public can append to is not a source of truth.
2. **`registry_admins` table** checked inside `assert_can_write_listing`. `AdminAddProvider` moves to an `admin_add_provider` RPC. `VITE_ADMIN_EMAILS` is deleted, and the UI asks `is_registry_admin()`, which leaves one admin list instead of two. *Why:* the browser check stops nobody.
3. **Idempotency key on every write**, with keys per path: check-in page nonce, dashboard form nonce, Jotform `submissionID`, follow-up `inquiry_id`, deterministic seed key. *Why:* A's "replay = harmless extra batch" didn't cover Jotform webhook retries or double-taps inflating the parent dataset.
4. **Out-of-order provider signals are ignored**, implemented A-style. An `observed_at` column orders the batches, so no "ignore" branch is needed in the writer.
5. **Per-listing cooldown on parent-triggered check-ins.** A already had this; B's framing is kept.
6. **Tier computed at read time.** A deleted cron can't freeze listings as fresh. A already did this.
7. **Two-step cutover (B, strictly better).** Migration 1 is additive: new tables and RPCs, a new view name, and the seed. Code ships and is verified on a Vercel preview against real data. Migration 2 is destructive: it renames, drops columns and old functions, and re-seeds edits made in the gap. *Why:* A's single migration drops columns the live site still reads, so it can't be staged-first.
8. **Shared TS enum file (B).** `supabase/functions/_shared/listingTypes.ts` is imported by both Deno and Vite, plus a test that compares it with the SQL enums. *Why:* this removes a TS-to-TS hand-synced list.
9. **Cutover grace window (B)** instead of A's clamp. See below.

**Cutover seed: B's `hide_grace_until` + immediate check-in to everyone, not A's 35-day clamp.**
- The product's principle is "fade honestly". A's clamp writes a false `observed_at`, so a card would say "not confirmed in 5 weeks" when the truth is 9. The false date would also skew the 4–6 week parent-report analysis and the freshness trend.
- B's grace keeps the log truthful. It costs one condition in `listing_state()`: a seed batch stays at worst fading while `now() < hide_grace_until`. It expires by itself, with no cleanup step.
- Both candidates send a day-0 check-in to every seeded provider. That is kept.

**Rejected from B:**
- The stored projection (`listing_age_claims`, `listing_state` table, `listing_family_tally`), `_apply`, `rebuild_listing_projection` and `projection_drift`. These are a second store plus the machinery to detect its drift.
- Stored hashed `signal_tokens`. That is extra state, and the HMAC carries the same facts.
- `provider_lang` in SQL. Both email senders are Deno, so `_shared/lang.ts` is one copy.
- The separate immediate-send path. That would make two senders.
- Turnstile. It adds a dependency, and parents can't change claims anyway.

**Rejected from A:**
- The 35-day clamp (above).
- The single migration (above).
- The "no in-repo callers, maybe delete" stance on the org/widget RPCs. That claim is **false**: `public/widget.js` calls them.
- Relying on the inquiry unique index for de-duplication. It is folded into the idempotency key, so there is one mechanism.

## Tradeoffs accepted

- We accept recomputing state on every read in exchange for nothing ever being out of sync.
- We accept a SECURITY DEFINER read path in exchange for raw signals, device hashes and due logic being unreachable from anon.
- We accept "immediate" check-ins arriving within 15 minutes in exchange for one sender and one cron.
- We accept that a crash between sending and logging sends one duplicate email (never a missed one) in exchange for no locking protocol.
- We accept that a forwarded check-in email lets its recipient answer for the provider until the token expires, in exchange for one-tap with no login.
- We accept a visible break in the insights trend at cutover (`programs_by_age` new; `freshness` keys go from fresh/aging/stale to fresh/fading; `open_spots` becomes fresh-only) instead of a fudged series.
- We accept up to `hide_grace_until` of honestly labeled old listings at cutover in exchange for nothing vanishing on day one.

## Alternatives considered

- **Current-state table updated on write (B's base).** Reads are cheaper, but fresh/fading/hidden still depends on `now()` and must be computed at read time anyway. The table adds a second owner of claim state, plus drift detection and rebuild tooling. That is split ownership for no gain at this scale.
- **Materialized view refreshed by cron.** A projection with a staleness window, and one more cron that can be silently deleted.
- **RLS on raw `listing_signals` + `security_invoker` views.** The display policy would live in an RLS predicate, anyone could read the full claim history, and private columns would depend on everyone remembering column grants.

---

## Type sketch: SQL

Migration 1 (`2026xxxx_listing_signals.sql`, additive; the old site keeps working):

```sql
create type age_group      as enum ('infant','toddler','preschool','school_age');
create type signal_channel as enum ('checkin_link','dashboard','jotform','admin','seed',     -- provider
                                    'inquiry_followup','click_prompt','card_button');       -- parent
create type signal_claim   as enum ('open','full','no_reply','reached');
create type listing_tier   as enum ('fresh','fading','hidden');

create table listing_policy (                                   -- singleton; edit in table editor
  id boolean primary key default true check (id),
  fresh_days int not null default 14,  hide_days int not null default 42,
  family_window_days int not null default 30,  checkin_every_days int not null default 14,
  checkin_trigger_cooldown_hours int not null default 72,       -- per listing [Q4]
  checkin_token_days int not null default 21,
  followup_after_days int not null default 4,                   -- [Q6]
  click_prompt_after_hours int not null default 12,
  parent_cooldown_hours int not null default 72,                -- per device x listing
  parent_max_per_device_day int not null default 5,  parent_max_per_ip_day int not null default 20,
  parent_channels_collected signal_channel[] not null default '{inquiry_followup,click_prompt,card_button}',
  parent_channels_displayed signal_channel[] not null default '{}',
  hide_grace_until timestamptz,                                 -- cutover only; self-expiring [Q1]
  check (fresh_days < hide_days)
);  -- RLS: select to anon/authenticated; no write grants (service role / SQL editor only)

create table registry_admins (user_id uuid primary key references auth.users(id) on delete cascade);
-- seeded from the emails now in VITE_ADMIN_EMAILS; RLS on, no policies

create table listing_signals (
  id bigint generated always as identity primary key,
  provider_id uuid not null references providers(id) on delete cascade,
  channel signal_channel not null,
  source text generated always as (case when channel in
    ('checkin_link','dashboard','jotform','admin','seed') then 'provider' else 'parent' end) stored,
  age_group age_group,                        -- provider: never null; parent: null = whole program
  claim signal_claim not null,
  spots smallint check (spots between 1 and 14),
  batch_id uuid,                              -- provider: one batch = all 4 groups
  observed_at timestamptz not null default now(),  -- when the statement was made (Jotform: submission time)
  idempotency_key text not null,
  inquiry_id uuid,                            -- inquiry_followup only; FK to parent_inquiries [CHECK: table not in repo migrations]
  device_hash text, ip_hash text,             -- parent only; never leave the DB
  created_at timestamptz not null default now(),   -- when it arrived (audit)
  check ((source = 'provider') = (batch_id is not null and age_group is not null)),
  check (source = 'parent' or claim in ('open','full')),
  check (spots is null or (source = 'provider' and claim = 'open')),
  check (observed_at <= created_at + interval '5 minutes')     -- callers can backdate, never future-date
);
create unique index on listing_signals (idempotency_key, age_group) nulls not distinct;
create index on listing_signals (provider_id, source, observed_at desc);
-- RLS on, no policies; revoke all from anon, authenticated, service_role (definer fns run as owner)

create table outbound_messages (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('provider_checkin','inquiry_followup')),
  provider_id uuid references providers(id) on delete cascade,
  inquiry_id uuid,
  trigger text not null check (trigger in ('schedule','parent_report','cutover','followup')),
  lang text not null, sent_at timestamptz not null default now()
);  -- RLS on, no policies; written only by send-signal-emails via service role

create function listing_state(p_now timestamptz default now())
returns table (provider_id uuid, confirmed_at timestamptz, tier listing_tier, weeks_unconfirmed int,
               open_groups age_group[], spots jsonb, family jsonb, sort_rank int, due_reason text)
language sql stable security definer set search_path = public as $$
  -- NOT IMPLEMENTED. Pseudocode:
  -- latest := distinct on (provider_id) batch_id, observed_at, channel from listing_signals
  --           where source='provider' order by provider_id, observed_at desc, id desc
  -- open_groups := array_agg(age_group) filter (claim='open') over that batch
  -- age := p_now - latest.observed_at
  -- tier := fresh  if age < fresh_days
  --         fading if age < hide_days
  --                   or (latest.channel='seed' and p_now < hide_grace_until)
  --         hidden otherwise; no batch at all -> hidden
  -- spots := jsonb_object_agg(age_group, spots) filter (claim='open' and spots not null), ONLY if tier='fresh'
  -- family := null if parent_channels_displayed = '{}'; else counts by claim of parent rows with
  --           channel = any(displayed) and created_at > p_now - family_window_days
  -- due_reason := 'parent_report' if parent full/no_reply after latest.observed_at
  --                  and no provider_checkin sent in checkin_trigger_cooldown_hours
  --               'schedule' if greatest(latest.observed_at, last checkin sent) < p_now - checkin_every_days
  --               null if tier='hidden' and no parent report [Q7]
$$;
revoke all on function listing_state(timestamptz) from public, anon, authenticated;

create function public_listing_state() returns table (/* listing_state minus due_reason */)
  language sql stable security definer as $$ /* NOT IMPLEMENTED: select ... where tier <> 'hidden' */ $$;
grant execute on function public_listing_state() to anon, authenticated;

create view listing_cards with (security_invoker = true) as          -- renamed back to public_listings in migration 2
  select /* public provider columns (as public_listings today) */, d.* /* details */,
         s.confirmed_at, s.tier, s.weeks_unconfirmed, s.open_groups, s.spots, s.family, s.sort_rank
  from public_listing_state() s join providers p on p.id = s.provider_id
  left join vacancies d on d.provider_id = p.id                     -- program_details after migration 2
  where p.is_active and p.is_approved
    and (cardinality(s.open_groups) > 0 or coalesce(d.waitlist_available, false));

create function community_stats() returns table (programs_with_openings int, programs_by_age jsonb,
  open_spots int, spots_by_age jsonb, waitlist_only int, elfa_programs int, beyond_elfa_programs int,
  programs_by_neighborhood jsonb, programs_by_language jsonb, freshness jsonb)
  language sql stable as $$ /* NOT IMPLEMENTED: aggregates listing_cards; spots from s.spots (fresh only) */ $$;
alter table community_snapshots add column programs_by_age jsonb not null default '{}';
-- capture_community_snapshot(): insert into community_snapshots select v_month, now(), s.* from community_stats() s

-- Widget (public/widget.js): new names; old ones dropped in migration 2. Read public state only.
create function get_provider_listing(license_num text) returns table (business_name text, neighborhood text,
  zip_code text, tier listing_tier, open_groups age_group[], spots jsonb, waitlist_available boolean,
  available_date date, confirmed_at timestamptz) language sql stable security definer as $$ /* NOT IMPLEMENTED */ $$;
create function get_org_listings(org_slug text) returns table (/* same + organization_slug */)
  language sql stable security definer as $$ /* NOT IMPLEMENTED */ $$;

create function assert_can_write_listing(p_provider_id uuid, p_channel signal_channel) returns void
  language plpgsql security definer as $$
  -- NOT IMPLEMENTED: service_role -> any provider channel;
  -- auth.uid() = p_provider_id or org owner -> 'dashboard'; registry_admins -> 'admin'; else raise.
$$;
revoke all on function assert_can_write_listing from public, anon, authenticated;

create function record_provider_claim(p_provider_id uuid, p_channel signal_channel,
  p_mode text,                               -- 'reconfirm' (Still open) | 'set'
  p_idempotency_key text,
  p_open age_group[] default null,           -- required for 'set'
  p_spots jsonb default null,                -- {"toddler":3}; keys must be in p_open
  p_observed_at timestamptz default now())   -- honored only for service_role; clamped to <= now()
returns jsonb                                -- {status:'applied'|'duplicate', batch_id}
language plpgsql security definer as $$
  -- NOT IMPLEMENTED: assert_can_write_listing; reconfirm copies latest batch (none -> raise);
  -- insert 4 rows, one batch_id, keys (p_idempotency_key, age_group); on conflict do nothing -> 'duplicate'.
$$;

create function save_listing(p_provider_id uuid, p_channel signal_channel, p_details jsonb,
  p_open age_group[], p_idempotency_key text, p_spots jsonb default null,
  p_observed_at timestamptz default now()) returns jsonb
language plpgsql security definer as $$
  -- NOT IMPLEMENTED: one transaction: assert; upsert details (vacancies -> program_details in mig 2);
  -- perform record_provider_claim(..., 'set', ...). Duplicate key -> details untouched too.
$$;
grant execute on function save_listing, record_provider_claim to authenticated;  -- assert gates channel

create function admin_add_provider(p_provider jsonb, p_details jsonb, p_open age_group[],
  p_spots jsonb, p_idempotency_key text) returns uuid
  language plpgsql security definer as $$ /* NOT IMPLEMENTED: require registry_admins; insert provider; save_listing('admin') */ $$;
create function is_registry_admin() returns boolean language sql stable security definer as $$ /* NOT IMPLEMENTED */ $$;

create function record_parent_signal(p_provider_id uuid, p_channel signal_channel, p_claim signal_claim,
  p_idempotency_key text, p_age_group age_group default null,
  p_client_id uuid default null, p_inquiry_id uuid default null) returns void
language plpgsql security definer as $$
  -- NOT IMPLEMENTED:
  -- reject unless channel is parent-side and in parent_channels_collected
  -- inquiry_followup: service_role only; key = 'followup:'||inquiry_id (one report per inquiry)
  -- device_hash := sha256(client_id || salt); ip_hash := sha256(x-forwarded-for || daily salt)
  -- silently return if: device+listing within parent_cooldown_hours, device or ip over daily cap,
  --   listing not currently visible, or duplicate key
$$;
grant execute on function record_parent_signal to anon, authenticated;

create view checkins_due  as /* listing_state() where due_reason is not null, + email, lang */;   -- service_role
create view followups_due as /* parent_inquiries older than followup_after_days, none sent, listing visible */;
create function signal_health() returns jsonb  -- due counts, sends 24h, parent reports by channel 24h,
  language sql stable security definer as $$ /* NOT IMPLEMENTED; also: sender present in cron.job? */ $$;

-- Seed (inside migration 1): for each vacancies row with expires_at > now(): one complete batch,
-- channel 'seed', open where accepting_x or x_spots > 0 (spots = x_spots if > 0), else full;
-- observed_at = updated_at (truthful); key 'seed:'||provider_id||':'||updated_at.
-- Waitlist-only rows seed all-full; waitlist_available keeps them visible.
-- update listing_policy set hide_grace_until = now() + interval '21 days';   -- [Q1]
-- Assert: count(listing_cards) = count(public_listings) or raise exception.
-- cron.schedule('send-signal-emails', '*/15 * * * *', ...)
```

Migration 2 (`2026xxxx_listing_signals_cutover.sql`, run after the new code is on prod):

```sql
-- 1. Re-seed rows edited between migration 1 and code deploy (same deterministic key -> no-op otherwise).
-- 2. alter table vacancies rename to program_details; drop the *_spots, accepting_*, expires_at, reported_at,
--    confirmation_token, token_expires_at, reminder_30/40_sent_at columns and idx_vacancies_confirmation_token.
-- 3. Drop ALL vacancies write policies (incl. "Allow insert vacancies" with check (true), own-row insert/update,
--    org-owner FOR ALL); replace the public select policy with "provider is_active and is_approved".
--    Keep the own-row and org-owner SELECT policies.
-- 4. Recreate save_listing / listing_cards against program_details; drop old public_listings,
--    rename listing_cards -> public_listings.
-- 5. Drop compute_vacancy_ttl_days, generate_confirmation_token, confirm_vacancy,
--    get_provider_vacancy, get_org_vacancies, public_org_vacancies (no callers: checked by grep).
-- 6. cron.unschedule any job whose command mentions send-vacancy-reminders or confirm-vacancy (guarded).
-- 7. [Q8] drop policy "Allow insert providers" (admin add now goes through admin_add_provider).
```

## Type sketch: TypeScript

```ts
// supabase/functions/_shared/listingTypes.ts — dependency-free; imported by Deno AND Vite
// (tsconfig "include" + alias '@shared'). The only TS copy. src/lib/sqlEnums.test.ts parses the
// migration's `create type` lines and fails when these disagree.
export const AGE_GROUPS = ['infant','toddler','preschool','school_age'] as const;
export type AgeGroup = typeof AGE_GROUPS[number];
export const PROVIDER_CHANNELS = ['checkin_link','dashboard','jotform','admin','seed'] as const;
export const PARENT_CHANNELS = ['inquiry_followup','click_prompt','card_button'] as const;
export type ParentClaim = 'open' | 'full' | 'no_reply' | 'reached';
export type CheckinAction =
  | { kind: 'still_open' } | { kind: 'full' }
  | { kind: 'some_filled'; open: AgeGroup[]; spots?: Partial<Record<AgeGroup, number>> };

// src/lib/listings.ts — replaces vacancy functions in supabase.ts and all of vacancyTtl.ts
export type ListingStatus =
  | { tier: 'fresh';  confirmedAt: Date; open: AgeGroup[]; spots: Partial<Record<AgeGroup, number>> }
  | { tier: 'fading'; confirmedAt: Date; open: AgeGroup[]; weeksUnconfirmed: number };  // no spots, by type
export type FamilySummary = { windowDays: number; reached: number; noReply: number; full: number; open: number } | null;
export interface ProgramDetails { fullTime: boolean; partTime: boolean; weekend: boolean; evening: boolean;
  overnight: boolean; waitlist: boolean; availableDate: string | null; notes: string | null }
export interface PublicListing { providerId: string; businessName: string; /* ...public provider fields */
  details: ProgramDetails; status: ListingStatus; family: FamilySummary; sortRank: 0 | 1 }
export type ClaimInput = { open: AgeGroup[]; spots?: Partial<Record<AgeGroup, number>> };
export type SaveResult = { status: 'applied' | 'duplicate' } | { error: string };

export async function getPublicListings(): Promise<PublicListing[]> { throw new Error('not implemented'); }
export async function getMyListing(providerId: string):
  Promise<{ details: ProgramDetails; status: ListingStatus | { tier: 'hidden' } } | null> { throw new Error('not implemented'); }
/** Dashboard + org dashboard. Channel is decided server-side from caller identity. */
export async function saveListing(providerId: string, details: ProgramDetails, claim: ClaimInput,
  idempotencyKey: string): Promise<SaveResult> { throw new Error('not implemented'); }
export async function adminAddProvider(p: NewProvider, details: ProgramDetails, claim: ClaimInput,
  idempotencyKey: string): Promise<{ providerId: string } | { error: string }> { throw new Error('not implemented'); }
export async function isRegistryAdmin(): Promise<boolean> { throw new Error('not implemented'); }
export async function recordParentSignal(i: { providerId: string; channel: 'click_prompt' | 'card_button';
  claim: ParentClaim; ageGroup: AgeGroup | null }): Promise<void> { throw new Error('not implemented'); }
export async function getCommunityStats(): Promise<CommunityStats> { throw new Error('not implemented'); }
// parseListingRow is module-private (not exported).

// src/lib/parentPrompt.ts: rememberContactClick(providerId), takePendingPrompt(): string | null, clientId()
//   (all localStorage access in try/catch; prompt shown once)

// supabase/functions/_shared/signalToken.ts — the only token code
export type SignalToken =
  | { kind: 'provider_checkin'; providerId: string; lang: Lang; exp: number }
  | { kind: 'inquiry_followup'; inquiryId: string; providerId: string; lang: Lang; exp: number };
export async function signSignalToken(t: SignalToken): Promise<string> { throw new Error('not implemented'); }
export async function verifySignalToken(raw: string): Promise<SignalToken> { throw new Error('not implemented'); }
// _shared/lang.ts: pickLang(languages): Lang  (moved from send-community-digest/index.ts:30-35)
// _shared/signalEmails.ts: checkinEmail(lang, links), followupEmail(lang, links) -> {subject, html, text}
```

## Module map

| File | Status |
|---|---|
| `supabase/migrations/2026xxxx_listing_signals.sql` (additive + seed + cron) | **new** |
| `supabase/migrations/2026xxxx_listing_signals_cutover.sql` (rename, drops, re-seed) | **new**, applied after prod deploy |
| `supabase/functions/_shared/{listingTypes,signalToken,lang,signalEmails}.ts` | **new** |
| `supabase/functions/signal-link/` (verify token, record; `peek` returns current claim for the Some-filled form) | **new** |
| `supabase/functions/send-signal-emails/` (the one sender: check-ins, follow-ups, `?mode=cutover`) | **new** |
| `src/lib/listings.ts`, `src/lib/parentPrompt.ts`, `src/lib/sqlEnums.test.ts`, `listings.test.ts` | **new** |
| `ListingStatusLine.tsx`, `CheckinPage.tsx` (`#checkin`), `ParentReportButton.tsx`, `ClickPrompt.tsx` | **new** |
| `PublicListings.tsx` (drop Older Listings + `renderLastUpdated`), `CommunityInsights.tsx` (drop client reduce), `VacancyForm.tsx` (open toggle + optional "about N" per group), `OrganizationDashboard.tsx`, `AdminAddProvider.tsx` (→ `adminAddProvider`), `RegistryApp.tsx` (`isRegistryAdmin`, `#checkin` route), `redesign/useListings.ts`, `ListingScreen.tsx`, `src/types/registry.ts`, `src/lib/supabase.ts` (vacancy fns removed), `tsconfig.json` + `vite.config.ts` (`@shared` alias) | changed |
| `public/widget.js` (new RPC names; show "taking toddlers" instead of a spot total) | changed |
| `jotform-intake`, `confirm-jotform-update` (→ `save_listing`, key `jotform:<submissionID>`), `send-daily-report` (→ `community_stats` + `signal_health`), `send-community-digest` (import `pickLang`) | changed |
| i18n `en/es/zh-TW.json`: status/family/checkin/parentPrompt/insights.byAge keys; drop aging/stale/older-listings keys | changed; **all new zh-TW flagged for Oscar's review** |
| `src/lib/vacancyTtl.ts` + test, `_shared/vacancyTtl.ts`, `confirm-vacancy/`, `send-vacancy-reminders/` | **deleted** |
| `VITE_ADMIN_EMAILS` env var (Vercel + `.env`) | **deleted** (after `registry_admins` seeded) |

**Mirrors to update:** the widget snippet docs (`docs/Database-Design.md:386`, `Provider-Guide-EN.md:95`, `Provider-Guide-ZH-TW.md:95`). The snippet itself is unchanged; check any text there that describes spot counts.

## Red-flag screen

- **Shallow module.** Clean. Four frontend functions and two edge RPCs hide tiering, display, spot suppression, authorization, idempotency, ordering, rate limits and due logic.
- **Information leakage.** Handled. Thresholds and tier rules exist only in `listing_state()` and `listing_policy`. Wire rows are parsed privately in `listings.ts`. The residual contract is the `public_listings` column list ↔ `parseListingRow`: one view, one parser.
- **Temporal decomposition.** Clean. Modules are grouped by knowledge (listing state, tokens, emails), not pipeline stage.
- **Pass-through method.** Watch item. `saveListing` → `save_listing` is a thin hop that adds parsing and a nonce. `public_listings` over `public_listing_state()` exists only to keep the security_invoker rule and the `.from('public_listings')` call shape.
- **Split ownership.** Handled, which is the main reason A was the base. Claim rows are written only by `record_provider_claim`, parent rows only by `record_parent_signal`, details only by `save_listing`, sends only by `send-signal-emails`. There is no projection.
- **Two ways to do one task.** Handled. The old upserts, `confirm_vacancy`, reminders, `getListingFreshness`, the old widget RPCs and the browser admin check are all deleted in the change. Still open, Full and Some filled are modes of one RPC, and the dashboard and org dashboard share one call.
- **Importable internals.** Mostly handled. `listing_state`, `assert_can_write_listing` and the logs are revoked from clients, and `parseListingRow` is unexported. The gap is that any edge function can import any `_shared` file, which is acceptable at this size.
- **Hand-synced list.** Handled with guards. The enums live in SQL and in one TS file shared by Deno and Vite, and `sqlEnums.test.ts` fails on drift. The admin list lives only in `registry_admins`. `pickLang` has one copy.

## Open questions for Oscar

1. **Cutover grace length.** Should listings visible at cutover stay visible, as "not confirmed in N weeks" with their true age, for **21 days** after cutover while the day-0 check-in reaches them? *Default: 21 days, which allows two check-in emails before anything hides.*
2. **Link scanners.** Email links open a page, and the page's JavaScript submits the answer, so Outlook and Gmail safe-link scanners can't "tap" for the provider. Should **Full** also ask "Are you sure?" (two taps)? *Default: one tap for all three, with an "Undo" button on the confirmation page.* We test on Gmail, Outlook and a WeChat-forwarded email before cutover either way.
3. **Waitlist.** When every group is full but the waitlist is open, should the listing keep showing in "Full, waitlist open" without fading, or should "waitlist open" become a confirmed claim that fades like the others? *Default: it stays a descriptive field that doesn't fade (today's behavior).*
4. **Parent-triggered check-in cooldown.** After a parent reports full or no reply, how soon may another parent report trigger another check-in to the same provider? *Default: 72 hours.* The other candidate proposed 24.
5. **New channel names.** `admin` and `seed` aren't in the design doc's channel list. Is it OK to add them, so admin edits and migrated listings stay distinguishable in the parent-report analysis? *Default: yes.*
6. **Parent follow-up delay.** How many days after an inquiry should the "Did they still have an opening?" email go out? *Default: 4 days.*
7. **Hidden listings.** Should a hidden listing (silent 6+ weeks) keep getting the every-2-weeks check-in, or stop? *Default: keep sending every 2 weeks for 3 more emails, then stop until the provider acts. A parent report still triggers one.*
8. **Open provider-insert hole.** Today anyone with the public key can create an approved provider row (`"Allow insert providers" with check (true)`). Admin add moves to a server RPC in this change, so the policy has no remaining legitimate user. Signup uses its own "insert own provider" policy. Drop it in the same change? *Default: yes.* (Under the new model a spam provider is hidden anyway: it has no provider signal.)
9. **Embed widget display.** Providers' own sites show "N spots open" today. Under the new model, counts are optional and shown only while fresh. Should the widget show "Taking infants & toddlers · confirmed 3 days ago" (plus "about N" when fresh), and hide fading or hidden listings? *Default: yes, same rules as the card.*
10. **Old reminder links.** `confirm-vacancy` links already in inboxes (valid up to 21 days) will stop working after migration 2. Is a friendly "this link has been replaced, check your new email" page enough? *Default: yes. The day-0 check-in supersedes them.*
11. **Insights trend break.** Should the trend chart show a visible "method changed" marker at the cutover month, or compare only `programs_with_openings` across the break? *Default: marker, plus the new "programs by age group" headline from cutover onward.*
12. **Privacy.** Parent device and IP hashes are kept for the 4–6 week analysis. Should they be deleted after the display decision, e.g. hashes nulled after 90 days? *Default: yes, 90 days, plus a one-line privacy note on the inquiry form, shipped on a Vercel preview first.*

## Next implementation step

Write migration 1's schema part (enums, the three logs, `listing_policy`, `registry_admins`, `listing_state(p_now)`), together with SQL fixture tests that pin the tier, spots-when-fresh, grace and out-of-order rules at fixed `p_now`, before touching any writer.
