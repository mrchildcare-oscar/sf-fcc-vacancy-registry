import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computeExpiresAt } from "../_shared/vacancyTtl.ts";

const ADMIN_EMAIL = "oscar@familychildcaresf.com";
const FROM_EMAIL = "noreply@familychildcaresf.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function htmlPage(title: string, body: string, statusCode = 200): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 480px; margin: 48px auto; padding: 0 24px; color: #111827; }
  h1 { font-size: 22px; margin-bottom: 16px; }
  p { line-height: 1.6; color: #374151; }
  .ok { color: #065f46; }
  .err { color: #991b1b; }
  a { color: #1d4ed8; }
</style>
</head>
<body>
  <h1>${title}</h1>
  ${body}
  <p style="margin-top:32px;font-size:14px;color:#6b7280;">— Family Child Care SF</p>
</body>
</html>`,
    { status: statusCode, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function sendEmail(resendApiKey: string, to: string, subject: string, html: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `Family Child Care SF <${FROM_EMAIL}>`, to: [to], subject, html }),
  });
  if (!res.ok) console.error("Resend error:", res.status, await res.text());
}

interface StagedPayload {
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
  waitlist_available: boolean;
  notes?: string;
}

// Some Jotform answer fields arrive with shapes we need to normalize again.
function coercePayload(raw: unknown): StagedPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  function stripQ(key: string): string { return key.replace(/^q\d+_/, ""); }
  const answers: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r)) answers[stripQ(k)] = v;

  function toStr(v: unknown): string {
    if (typeof v === "string") return v.trim();
    if (typeof v === "number") return String(v);
    return "";
  }
  function toInt(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }
  function toBool(v: unknown): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const s = v.toLowerCase().trim();
      return s === "yes" || s === "true" || s === "1" || s === "on";
    }
    return false;
  }
  function toLangs(v: unknown): string[] {
    if (Array.isArray(v)) return v.map(toStr).filter(Boolean);
    if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
    if (v && typeof v === "object") return Object.values(v as Record<string, unknown>).map(toStr).filter(Boolean);
    return [];
  }
  function toPhone(v: unknown): string | undefined {
    if (v === undefined || v === null || v === "") return undefined;
    const collect = (x: unknown): string => {
      if (typeof x === "string") return x;
      if (typeof x === "number") return String(x);
      if (Array.isArray(x)) return x.map(collect).join(" ");
      if (x && typeof x === "object") return Object.values(x as Record<string, unknown>).map(collect).join(" ");
      return "";
    };
    const raw = collect(v);
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits.startsWith("1")) {
      const d = digits.slice(1);
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    }
    if (digits.length === 7) {
      return `(415) ${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return raw.trim() || undefined;
  }

  const program_type = toStr(answers.program_type).toLowerCase().replace(/\s/g, "_");
  const pt: "small_family" | "large_family" = program_type === "large_family" ? "large_family" : "small_family";
  const defaultCap = pt === "large_family" ? 14 : 8;

  return {
    license_number: toStr(answers.license_number),
    business_name: toStr(answers.business_name),
    owner_name: toStr(answers.owner_name),
    contact_email: toStr(answers.contact_email).toLowerCase(),
    phone: toPhone(answers.phone),
    phone_accepts_text: toBool(answers.phone_accepts_text),
    program_type: pt,
    licensed_capacity: toInt(answers.licensed_capacity) || defaultCap,
    zip_code: toStr(answers.zip_code),
    neighborhood: toStr(answers.neighborhood) || undefined,
    website: toStr(answers.website) || undefined,
    languages: toLangs(answers.languages),
    infant_spots: toInt(answers.infant_spots),
    toddler_spots: toInt(answers.toddler_spots),
    preschool_spots: toInt(answers.preschool_spots),
    school_age_spots: toInt(answers.school_age_spots),
    full_time_available: toBool(answers.full_time_available),
    part_time_available: toBool(answers.part_time_available),
    waitlist_available: toBool(answers.waitlist_available),
    notes: toStr(answers.notes) || undefined,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const action = url.searchParams.get("action") ?? "";

  if (!token || (action !== "confirm" && action !== "deny")) {
    return htmlPage("Invalid link", `<p class="err">This link is missing a token or action. If you came from an email, try the original link again.</p>`, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";

  const { data: pending, error: fetchErr } = await supabase
    .from("pending_intakes")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (fetchErr || !pending) {
    return htmlPage("Link not found", `<p class="err">We couldn't find that request. It may have already been confirmed, rejected, or expired.</p>`, 404);
  }

  if (pending.resolved_at) {
    return htmlPage(
      "Already resolved",
      `<p>This request was already ${pending.resolved_action === "applied" ? "applied" : "rejected"} on ${new Date(pending.resolved_at).toLocaleDateString()}.</p>
       <p>No further action is needed. If you think something is wrong, reply to the email that brought you here.</p>`,
      200,
    );
  }

  if (pending.token_expires_at && new Date(pending.token_expires_at) < new Date()) {
    await supabase.from("pending_intakes").update({ resolved_at: new Date().toISOString(), resolved_action: "denied" }).eq("id", pending.id);
    return htmlPage("Link expired", `<p class="err">This link has expired. Your listing was not changed.</p><p>If you want to update your information, please submit the intake form again.</p>`, 410);
  }

  if (action === "deny") {
    await supabase.from("pending_intakes").update({ resolved_at: new Date().toISOString(), resolved_action: "denied" }).eq("id", pending.id);
    if (resendApiKey) {
      await sendEmail(
        resendApiKey,
        ADMIN_EMAIL,
        `[FCCSF] Provider REJECTED suspicious intake (pending_intakes ${pending.id})`,
        `<p>The on-file provider clicked "deny" for pending_intakes ${pending.id} (license on target provider: ${pending.target_provider_id}).</p><p>No changes applied.</p>`,
      );
    }
    return htmlPage(
      "Rejected",
      `<p class="ok">Thanks. We've rejected that submission — your listing stays exactly as it was.</p>
       <p>If this looks like repeated abuse, reply to your original notification email and we'll take a closer look.</p>`,
    );
  }

  // action === "confirm" → apply the staged payload to the existing provider + vacancy.
  const payload = coercePayload(pending.payload);
  if (!payload || !pending.target_provider_id) {
    await supabase.from("pending_intakes").update({ resolved_at: new Date().toISOString(), resolved_action: "manual" }).eq("id", pending.id);
    return htmlPage("Could not apply update", `<p class="err">We couldn't parse the staged submission. An admin will review it manually.</p>`, 500);
  }

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
      is_active: true,
    })
    .eq("id", pending.target_provider_id);

  if (updErr) {
    console.error("confirm-jotform-update: provider update error", updErr);
    return htmlPage("Update failed", `<p class="err">Something went wrong while applying your update. An admin has been notified.</p>`, 500);
  }

  await supabase.from("vacancies").upsert(
    {
      provider_id: pending.target_provider_id,
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

  await supabase
    .from("pending_intakes")
    .update({ resolved_at: new Date().toISOString(), resolved_action: "applied" })
    .eq("id", pending.id);

  if (resendApiKey) {
    await sendEmail(
      resendApiKey,
      ADMIN_EMAIL,
      `[FCCSF] Provider confirmed suspicious-duplicate update (pending_intakes ${pending.id})`,
      `<p>The on-file provider confirmed and applied pending_intakes ${pending.id} → target provider ${pending.target_provider_id}.</p>`,
    );
  }

  return htmlPage(
    "Update applied",
    `<p class="ok">Thanks for confirming. Your listing has been refreshed — it's live now at <a href="https://familychildcaresf.com">familychildcaresf.com</a>.</p>
     <p>If anything looks wrong, reply to your original notification email and we'll fix it.</p>`,
  );
});
