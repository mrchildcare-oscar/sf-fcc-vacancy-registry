import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkElfaStatus } from "../_shared/elfa.ts";
import { computeExpiresAt } from "../_shared/vacancyTtl.ts";
import { isSfZip } from "../_shared/sfZips.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "oscar@familychildcaresf.com";
const FROM_EMAIL = "noreply@familychildcaresf.com";
const CONFIRM_TOKEN_TTL_DAYS = 7;

type IntakeMode = "new" | "update";

interface ProviderPayload {
  intake_mode: IntakeMode;
  license_number: string;
  business_name: string;
  owner_name: string;
  contact_email: string;
  phone?: string;
  phone_accepts_text?: boolean;
  program_type: "small_family" | "large_family";
  licensed_capacity: number;
  zip_code: string;
  neighborhood?: string;
  website?: string;
  languages: string[];
  infant_spots: number;
  toddler_spots: number;
  preschool_spots: number;
  school_age_spots: number;
  full_time_available: boolean;
  part_time_available: boolean;
  weekend_available: boolean;
  evening_available: boolean;
  overnight_available: boolean;
  waitlist_available: boolean;
  notes?: string;
  provider_id?: string;
  confirmation_token?: string;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Jotform answer keys can be "q3_license_number" OR "license_number" depending on whether
// the form uses Unique Name. Normalize by stripping any leading "q\d+_".
function stripQPrefix(key: string): string {
  return key.replace(/^q\d+_/, "");
}

function parseLanguages(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (value && typeof value === "object") {
    // Jotform checkbox sometimes serializes as {"English":"English","Spanish":"Spanish"}
    return Object.values(value as Record<string, unknown>).map(String).filter(Boolean);
  }
  return [];
}

function parseBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    return v === "true" || v === "yes" || v === "1" || v === "on";
  }
  return false;
}

function parseInt0(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function normalizeEmail(e?: string | null): string {
  return (e ?? "").trim().toLowerCase();
}

// Strip non-digits so "(415) 794-2513" and "4157942513" compare equal.
function normalizePhone(p?: string | null): string {
  return (p ?? "").replace(/\D/g, "");
}

// Jotform US phone widget sends {full, area, phone} (sometimes a weird 2+8 split
// instead of 3+7). Intl widget sends {country, phone}. Handle all shapes by
// extracting every digit and reformatting to (XXX) XXX-XXXX.
function parsePhone(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const collect = (v: unknown): string => {
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (Array.isArray(v)) return v.map(collect).join(" ");
    if (v && typeof v === "object") return Object.values(v as Record<string, unknown>).map(collect).join(" ");
    return "";
  };
  const raw = collect(value);
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    const d = digits.slice(1);
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  // 7-digit input = missing area code. Default to 415 (SF) since we're an
  // SF-only registry. Rare real-world risk: 628 overlay — but SF providers
  // almost always use 415 and this is safer than saving a broken 7-digit
  // number. If wrong, admin can correct.
  if (digits.length === 7) {
    return `(415) ${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return raw.trim() || undefined;
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function normalizeAnswers(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) out[stripQPrefix(k)] = v;
  return out;
}

function buildPayload(answers: Record<string, unknown>): ProviderPayload {
  const program_type = String(answers.program_type ?? "small_family")
    .toLowerCase()
    .replace(/\s/g, "_") as ProviderPayload["program_type"];

  const defaultCapacity = program_type === "large_family" ? 14 : 8;
  const licensed_capacity = parseInt0(answers.licensed_capacity) || defaultCapacity;

  const infant_spots = parseInt0(answers.infant_spots);
  const toddler_spots = parseInt0(answers.toddler_spots);
  const preschool_spots = parseInt0(answers.preschool_spots);
  const school_age_spots = parseInt0(answers.school_age_spots);

  return {
    intake_mode: (String(answers.intake_mode ?? "new").toLowerCase() as IntakeMode) || "new",
    license_number: String(answers.license_number ?? "").trim(),
    business_name: String(answers.business_name ?? "").trim(),
    owner_name: String(answers.owner_name ?? "").trim(),
    contact_email: String(answers.contact_email ?? "").trim().toLowerCase(),
    phone: parsePhone(answers.phone),
    phone_accepts_text: parseBool(answers.phone_accepts_text),
    program_type: program_type === "large_family" ? "large_family" : "small_family",
    licensed_capacity,
    zip_code: String(answers.zip_code ?? "").trim(),
    neighborhood: answers.neighborhood ? String(answers.neighborhood).trim() : undefined,
    website: answers.website ? String(answers.website).trim() : undefined,
    languages: parseLanguages(answers.languages),
    infant_spots,
    toddler_spots,
    preschool_spots,
    school_age_spots,
    full_time_available: parseBool(answers.full_time_available),
    part_time_available: parseBool(answers.part_time_available),
    weekend_available: parseBool(answers.weekend_available),
    evening_available: parseBool(answers.evening_available),
    overnight_available: parseBool(answers.overnight_available),
    waitlist_available: parseBool(answers.waitlist_available),
    notes: answers.notes ? String(answers.notes).trim() : undefined,
    provider_id: answers.provider_id ? String(answers.provider_id).trim() : undefined,
    confirmation_token: answers.confirmation_token
      ? String(answers.confirmation_token).trim()
      : undefined,
  };
}

function validateNew(p: ProviderPayload): string | null {
  if (!/^\d{9}$/.test(p.license_number)) return "license_number must be 9 digits";
  if (!p.business_name) return "business_name required";
  if (!p.owner_name) return "owner_name required";
  if (!/^\S+@\S+\.\S+$/.test(p.contact_email)) return "contact_email invalid";
  if (!/^\d{5}$/.test(p.zip_code)) return "zip_code must be 5 digits";
  if (p.languages.length === 0) return "at least one language required";
  return null;
}

async function sendEmail(
  resendApiKey: string,
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Family Child Care SF <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error("Resend error:", res.status, await res.text());
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // --- Webhook auth: shared-secret query param ---
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret") ?? "";
  const expected = Deno.env.get("JOTFORM_WEBHOOK_SECRET") ?? "";
  if (!expected || !constantTimeEqual(secret, expected)) {
    console.warn("jotform-intake: bad or missing secret");
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  // --- Parse Jotform's form-encoded POST ---
  let formID = "";
  let rawRequest: Record<string, unknown> = {};
  let submissionID = "";
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      formID = String(body.formID ?? "");
      submissionID = String(body.submissionID ?? "");
      rawRequest =
        typeof body.rawRequest === "string" ? JSON.parse(body.rawRequest) : (body.rawRequest ?? {});
    } else {
      const form = await req.formData();
      formID = String(form.get("formID") ?? "");
      submissionID = String(form.get("submissionID") ?? "");
      const rawStr = String(form.get("rawRequest") ?? "{}");
      rawRequest = JSON.parse(rawStr);
    }
  } catch (err) {
    console.error("jotform-intake: parse error", err);
    return new Response("Bad Request", { status: 400, headers: corsHeaders });
  }

  // --- Form-ID allowlist ---
  const allowedNewId = Deno.env.get("JOTFORM_NEW_INTAKE_FORM_ID") ?? "";
  const allowedUpdateId = Deno.env.get("JOTFORM_UPDATE_FORM_ID") ?? "";
  const isNewForm = allowedNewId && formID === allowedNewId;
  const isUpdateForm = allowedUpdateId && formID === allowedUpdateId;
  if (!isNewForm && !isUpdateForm) {
    console.warn("jotform-intake: formID not in allowlist:", formID);
    return new Response("Unknown form", { status: 403, headers: corsHeaders });
  }

  const answers = normalizeAnswers(rawRequest);
  const payload = buildPayload(answers);

  // Phase 1: only handle new-mode intake. Update mode is added in Phase 3.
  if (payload.intake_mode === "update" || isUpdateForm) {
    console.log("jotform-intake: update mode not yet implemented, submission:", submissionID);
    return new Response(
      JSON.stringify({ ok: false, error: "Update mode not yet enabled" }),
      { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const validationError = validateNew(payload);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey);

  // --- Handle validation failure: log to pending_intakes if the table exists, email admin ---
  if (validationError) {
    console.warn("jotform-intake: validation failed:", validationError);
    await logPending(supabase, formID, submissionID, `validation: ${validationError}`, rawRequest);
    if (resendApiKey) {
      await sendEmail(
        resendApiKey,
        ADMIN_EMAIL,
        "[FCCSF] Jotform intake validation error",
        `<p>A Jotform submission (${submissionID}) failed validation: <b>${validationError}</b>.</p>
         <p>Review in Supabase <code>pending_intakes</code> table.</p>`,
      );
    }
    return new Response(
      JSON.stringify({ ok: false, error: validationError }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // --- Duplicate license → returning-provider policy ---
  const { data: existing, error: selectErr } = await supabase
    .from("providers")
    .select("id, business_name, contact_email, email, phone")
    .eq("license_number", payload.license_number)
    .maybeSingle();

  if (selectErr) {
    console.error("jotform-intake: provider lookup error", selectErr);
    return new Response("DB error", { status: 500, headers: corsHeaders });
  }

  if (existing) {
    const submittedEmail = normalizeEmail(payload.contact_email);
    const onFileEmails = [normalizeEmail(existing.contact_email), normalizeEmail(existing.email)].filter(Boolean);
    const emailMatches = submittedEmail && onFileEmails.includes(submittedEmail);
    const phoneMatches =
      !!payload.phone && !!existing.phone && normalizePhone(payload.phone) === normalizePhone(existing.phone);

    // Tier 1 / Tier 2: contact matches → trust it, update in place.
    if (emailMatches || phoneMatches) {
      const isElfa = checkElfaStatus(payload.license_number);
      const { error: updErr } = await supabase
        .from("providers")
        .update({
          business_name: payload.business_name,
          owner_name: payload.owner_name,
          contact_email: payload.contact_email,
          email: payload.contact_email,
          phone: payload.phone ?? null,
          phone_accepts_text: payload.phone_accepts_text ?? false,
          program_type: payload.program_type,
          licensed_capacity: payload.licensed_capacity,
          zip_code: payload.zip_code,
          neighborhood: payload.neighborhood ?? null,
          website: payload.website ?? null,
          languages: payload.languages,
          is_elfa_network: isElfa,
          is_active: true,
        })
        .eq("id", existing.id);

      if (updErr) {
        console.error("jotform-intake: provider update error", updErr);
        return new Response("Update failed", { status: 500, headers: corsHeaders });
      }

      await supabase.from("vacancies").upsert(
        {
          provider_id: existing.id,
          infant_spots: payload.infant_spots,
          toddler_spots: payload.toddler_spots,
          preschool_spots: payload.preschool_spots,
          school_age_spots: payload.school_age_spots,
          accepting_infants: payload.infant_spots > 0,
          accepting_toddlers: payload.toddler_spots > 0,
          accepting_preschool: payload.preschool_spots > 0,
          accepting_school_age: payload.school_age_spots > 0,
          full_time_available: payload.full_time_available,
          part_time_available: payload.part_time_available,
          weekend_available: payload.weekend_available,
          evening_available: payload.evening_available,
          overnight_available: payload.overnight_available,
          waitlist_available: payload.waitlist_available,
          notes: payload.notes ?? null,
          reported_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          confirmation_token: null,
          token_expires_at: null,
          reminder_30_sent_at: null,
          reminder_40_sent_at: null,
          expires_at: computeExpiresAt({
            waitlist_available: payload.waitlist_available,
            infant_spots: payload.infant_spots,
            toddler_spots: payload.toddler_spots,
            preschool_spots: payload.preschool_spots,
            school_age_spots: payload.school_age_spots,
          }),
        },
        { onConflict: "provider_id" },
      );

      // Notify the on-file email (in case this was a rival with a guessed email — we caught the mismatch above,
      // so this path is only reached when the trust signal matched; still CC for auditability).
      if (resendApiKey && onFileEmails[0]) {
        await sendEmail(
          resendApiKey,
          onFileEmails[0],
          "Your Family Child Care SF listing was updated",
          `<p>Hi ${existing.business_name},</p>
           <p>Your listing at familychildcaresf.com was just updated via our intake form. If you submitted this, no action is needed — your listing is refreshed for the next 45 days.</p>
           <p><b>If you did NOT submit this update</b>, reply to this email right away and we'll investigate.</p>
           <p>Summary of changes:<br>
             Business: ${payload.business_name}<br>
             Contact: ${payload.contact_email} / ${payload.phone ?? "—"}<br>
             Openings: infant ${payload.infant_spots}, toddler ${payload.toddler_spots}, preschool ${payload.preschool_spots}, school-age ${payload.school_age_spots}<br>
             Waitlist: ${payload.waitlist_available ? "Yes" : "No"}
           </p>
           <p>— Family Child Care SF</p>`,
        );
      }

      await logPending(supabase, formID, submissionID, "auto_update_applied", rawRequest, existing.id, null, null);

      return new Response(
        JSON.stringify({ ok: true, status: "updated", provider_id: existing.id, match: emailMatches ? "email" : "phone" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Tier 3: license matches, but neither email nor phone does → possible impersonation.
    // Stage submission, email on-file provider with confirm/deny links.
    const token = randomToken();
    const tokenExpires = new Date(Date.now() + CONFIRM_TOKEN_TTL_DAYS * 86400 * 1000).toISOString();
    await logPending(
      supabase,
      formID,
      submissionID,
      "suspicious_duplicate",
      rawRequest,
      existing.id,
      token,
      tokenExpires,
    );

    if (resendApiKey && onFileEmails[0]) {
      const fnBase = supabaseUrl.replace(/\/$/, "");
      const confirmUrl = `${fnBase}/functions/v1/confirm-jotform-update?token=${token}&action=confirm`;
      const denyUrl = `${fnBase}/functions/v1/confirm-jotform-update?token=${token}&action=deny`;
      await sendEmail(
        resendApiKey,
        onFileEmails[0],
        "Action needed: someone submitted an update to your FCC listing",
        `<p>Hi ${existing.business_name},</p>
         <p>Someone just submitted our intake form claiming to update your FCC listing (license ${payload.license_number}). The email and phone they provided don't match what we have on file, so we're holding the update until you confirm.</p>
         <p>Submitted info:<br>
           Business: ${payload.business_name}<br>
           Owner: ${payload.owner_name}<br>
           Email: ${payload.contact_email}<br>
           Phone: ${payload.phone ?? "—"}</p>
         <p>
           <a href="${confirmUrl}">✅ Yes, that was me — apply the update</a><br>
           <a href="${denyUrl}">🚫 No, I didn't submit this — reject it</a>
         </p>
         <p>This link expires in ${CONFIRM_TOKEN_TTL_DAYS} days. If you ignore it, nothing happens and your listing stays as-is.</p>
         <p>— Family Child Care SF</p>`,
      );
    }
    // CC admin so you have awareness without waiting for provider reaction.
    if (resendApiKey) {
      await sendEmail(
        resendApiKey,
        ADMIN_EMAIL,
        `[FCCSF] Suspicious-duplicate intake for ${existing.business_name}`,
        `<p>Submission ${submissionID}: license ${payload.license_number} exists as <b>${existing.business_name}</b> (${onFileEmails[0]}), but the submitter used ${payload.contact_email} / ${payload.phone ?? "—"}.</p>
         <p>Email sent to on-file provider; nothing applied to DB until they confirm. <code>pending_intakes.token</code> = ${token}.</p>`,
      );
    }

    return new Response(
      JSON.stringify({ ok: true, status: "pending_confirmation", reason: "suspicious_duplicate" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // --- Moderation: auto-approve if license is ELFA OR zip is SF ---
  const isElfa = checkElfaStatus(payload.license_number);
  const zipOk = isSfZip(payload.zip_code);
  const autoApprove = isElfa || zipOk;

  const providerId = crypto.randomUUID();
  const { error: providerErr } = await supabase.from("providers").insert({
    id: providerId,
    email: payload.contact_email,
    license_number: payload.license_number,
    license_verified: true,
    business_name: payload.business_name,
    owner_name: payload.owner_name,
    program_type: payload.program_type,
    licensed_capacity: payload.licensed_capacity,
    zip_code: payload.zip_code,
    neighborhood: payload.neighborhood ?? null,
    phone: payload.phone ?? null,
    phone_accepts_text: payload.phone_accepts_text ?? false,
    contact_email: payload.contact_email,
    website: payload.website ?? null,
    languages: payload.languages,
    is_elfa_network: isElfa,
    is_active: true,
    is_approved: autoApprove,
    intake_source: "jotform",
  });

  if (providerErr) {
    console.error("jotform-intake: provider insert error", providerErr);
    await logPending(supabase, formID, submissionID, `insert_error: ${providerErr.message}`, rawRequest);
    return new Response("Insert failed", { status: 500, headers: corsHeaders });
  }

  const { error: vacancyErr } = await supabase.from("vacancies").insert({
    provider_id: providerId,
    infant_spots: payload.infant_spots,
    toddler_spots: payload.toddler_spots,
    preschool_spots: payload.preschool_spots,
    school_age_spots: payload.school_age_spots,
    accepting_infants: payload.infant_spots > 0,
    accepting_toddlers: payload.toddler_spots > 0,
    accepting_preschool: payload.preschool_spots > 0,
    accepting_school_age: payload.school_age_spots > 0,
    full_time_available: payload.full_time_available,
    part_time_available: payload.part_time_available,
    weekend_available: payload.weekend_available,
    evening_available: payload.evening_available,
    overnight_available: payload.overnight_available,
    waitlist_available: payload.waitlist_available,
    notes: payload.notes ?? null,
    expires_at: computeExpiresAt({
      waitlist_available: payload.waitlist_available,
      infant_spots: payload.infant_spots,
      toddler_spots: payload.toddler_spots,
      preschool_spots: payload.preschool_spots,
      school_age_spots: payload.school_age_spots,
    }),
  });

  if (vacancyErr) {
    console.error("jotform-intake: vacancy insert error", vacancyErr);
  }

  // --- Admin notification ---
  if (resendApiKey) {
    const status = autoApprove ? "Auto-approved" : "Pending review";
    await sendEmail(
      resendApiKey,
      ADMIN_EMAIL,
      `[FCCSF] New intake: ${payload.business_name} (${status})`,
      `<p><b>${payload.business_name}</b> — ${payload.owner_name}</p>
       <p>License ${payload.license_number} ${isElfa ? "(ELFA)" : ""}, ZIP ${payload.zip_code}${zipOk ? "" : " (not SF)"}</p>
       <p>Contact: ${payload.contact_email} / ${payload.phone ?? "—"}</p>
       <p>Status: <b>${status}</b>${autoApprove ? "" : " — open the admin dashboard to review."}</p>
       <p>Submission ${submissionID}.</p>`,
    );
  }

  return new Response(
    JSON.stringify({ ok: true, provider_id: providerId, approved: autoApprove }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

async function logPending(
  supabase: ReturnType<typeof createClient>,
  formID: string,
  submissionID: string,
  reason: string,
  payload: unknown,
  targetProviderId?: string | null,
  token?: string | null,
  tokenExpiresAt?: string | null,
): Promise<void> {
  const { error } = await supabase.from("pending_intakes").insert({
    form_id: formID,
    submission_id: submissionID,
    reason,
    payload,
    target_provider_id: targetProviderId ?? null,
    token: token ?? null,
    token_expires_at: tokenExpiresAt ?? null,
  });
  if (error && error.code !== "42P01") {
    // 42P01 = undefined_table; the pending_intakes table is added in migration 20260419.
    console.error("logPending error:", error);
  }
}
