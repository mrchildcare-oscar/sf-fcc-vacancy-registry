# Jotform Intake Setup

The site supports a form-based provider intake path so that new providers can list
themselves without creating an account or dealing with WeChat in-app browser quirks,
email confirmation, password resets, etc. The existing sign-in / dashboard path
remains available for multi-location operators and tech-comfortable providers.

## Architecture

```
Jotform (provider-facing form)
        │
        ▼  POST x-www-form-urlencoded webhook
        │  (secret + form_id allowlist verified)
        │
Supabase Edge Function:  jotform-intake
        │
        ▼
providers + vacancies tables
        │
        ▼
public_listings view → familychildcaresf.com
```

## Environment variables

### Frontend (`.env` / Vercel project)
| Var | Purpose |
|---|---|
| `VITE_JOTFORM_NEW_INTAKE_URL` | Full public URL of the Jotform. When set, the "List your program" CTA on the public site and the banner on the `/#auth` screen both point here. Opens in a new tab. |

### Edge function secrets (`supabase secrets set ...`)
| Var | Purpose |
|---|---|
| `JOTFORM_WEBHOOK_SECRET` | Shared secret appended to the webhook URL as `?secret=…`. Constant-time compared on every call. Generate with `openssl rand -hex 32`. |
| `JOTFORM_NEW_INTAKE_FORM_ID` | Jotform form ID (numeric, visible in the form URL). Webhook 403s any other form. |
| `JOTFORM_UPDATE_FORM_ID` | Phase 3 — the vacancy-update form. Unused in Phase 1. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Already present for other functions. |
| `RESEND_API_KEY` | Already present. Used for admin notification + duplicate/validation alerts. |

## Field mapping

Jotform fields should have **Unique Name** set to match the DB column exactly. The
webhook also tolerates Jotform's default `q{N}_{name}` keys — it strips the `q{N}_`
prefix automatically.

| Jotform field (Unique Name) | Required | DB column(s) | Notes |
|---|---|---|---|
| `license_number` | ✅ | `providers.license_number` | Regex `^\d{9}$` |
| `business_name` | ✅ | `providers.business_name` | |
| `owner_name` | ✅ | `providers.owner_name` | |
| `contact_email` | ✅ | `providers.contact_email`, `providers.email` | |
| `phone` | | `providers.phone` | |
| `phone_accepts_text` | | `providers.phone_accepts_text` | Yes/No → boolean |
| `program_type` | ✅ | `providers.program_type` | Values: `small_family` / `large_family` |
| `licensed_capacity` | | `providers.licensed_capacity` | Defaults to 8 / 14 based on `program_type` if blank |
| `zip_code` | ✅ | `providers.zip_code` | 5 digits |
| `neighborhood` | | `providers.neighborhood` | Dropdown from `SF_NEIGHBORHOODS` |
| `website` | | `providers.website` | |
| `languages` | ✅ | `providers.languages` | Multi-select; webhook coerces comma-string / array / object |
| `infant_spots`, `toddler_spots`, `preschool_spots`, `school_age_spots` | | `vacancies.*_spots` | Non-negative integers |
| `full_time_available`, `part_time_available`, `waitlist_available` | | `vacancies.*` | booleans |
| `notes` | | `vacancies.notes` | |
| `intake_mode` (hidden) | | — | `new` for the new-intake form. Phase 3 adds `update`. |

## Moderation logic

On every submission the function:

1. Validates required fields + license format.
2. Checks for duplicate `license_number`. If it matches an existing row → logged to
   `pending_intakes` (Phase 2) with `reason='duplicate_license'`, admin emailed, no
   row is created or modified.
3. If license is in the ELFA network (`supabase/functions/_shared/elfa.ts`) **or**
   the ZIP is a known SF zip (`_shared/sfZips.ts`) → `is_approved = true` and the
   listing appears publicly within seconds.
4. Otherwise → `is_approved = false`; row is created but hidden. Admin receives an
   email to review.

## Jotform form setup — automated (recommended)

Use the provisioning script. It creates the form with all fields, unique names,
validation rules, and registers the webhook in one shot.

```bash
# 1. Get an API key from https://www.jotform.com/myaccount/api
export JOTFORM_API_KEY=...

# 2. Generate a webhook secret. Save this — you'll also set it as a Supabase secret.
export JOTFORM_WEBHOOK_SECRET=$(openssl rand -hex 32)

# 3. Run the provisioner. It writes state to .jotform-intake.json so re-runs
#    update instead of duplicating.
node scripts/provision-jotform-intake.mjs
```

The script prints the form ID + public URL and the exact follow-up commands
(Supabase secrets, function deploy, Vercel env). To recreate from scratch,
delete `.jotform-intake.json` or pass `--force`.

Still manual after the script runs:

- [ ] Set the autoresponder email in Jotform settings (the API doesn't cover this
      reliably). Add a bilingual thank-you note: "Your listing may take up to one
      business day to appear."
- [ ] Add language variants (ZH-TW, ES) in Jotform's **Form Builder → Translate**.
      The API creates the English baseline; translations are a UI step.
- [ ] Optional conditional logic — hide `*_spots` fields until "Do you have
      openings?" is Yes. The edge function tolerates 0s either way, so this is
      polish, not functional.

## Jotform form setup — manual fallback

If you can't use the API, create the form by hand in the Jotform UI. Each field's
**Unique Name** must match the column in the table above. Webhook URL format:

`https://<project>.supabase.co/functions/v1/jotform-intake?secret=<JOTFORM_WEBHOOK_SECRET>`

## Verifying end-to-end

1. **Happy path**: submit the form with a valid 9-digit license that's in the ELFA
   list. Check `providers` has the row with `is_approved=true`, matching
   `vacancies` row, listing visible on the public site.
2. **Queue path**: submit with an unknown license + non-SF ZIP. Row `is_approved=false`,
   admin email sent, listing not public.
3. **Duplicate path**: resubmit with an existing license. No new row, admin email,
   provider gets the Jotform autoresponder.
4. **Secret rotation**: change `JOTFORM_WEBHOOK_SECRET` without updating Jotform.
   Next submission returns 401.

## Roadmap

- **Phase 2** — add `pending_intakes` table + `providers.intake_source` column +
  admin review UI for the queue.
- **Phase 3** — add a second Jotform ("Update vacancy") with prefilled fields,
  modify `send-vacancy-reminders` to email a tokenized link to that form. Update
  mode dispatch in `jotform-intake`.
- **Phase 4** — admin tool to link a form-intake provider row to a new
  `auth.users` account if they later want dashboard access.
