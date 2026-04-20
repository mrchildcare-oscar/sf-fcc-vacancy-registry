#!/usr/bin/env node
// Provision the FCCSF New Provider Intake form on Jotform via their REST API.
//
// Usage:
//   export JOTFORM_API_KEY=...                 # from https://www.jotform.com/myaccount/api
//   export SUPABASE_PROJECT_REF=egaecoxcpwqldktxlmvi
//   export JOTFORM_WEBHOOK_SECRET=$(openssl rand -hex 32)    # save this — you'll need it as a Supabase secret
//   node scripts/provision-jotform-intake.mjs
//
// Output:
//   - Creates the form
//   - Registers the webhook pointing at supabase /functions/v1/jotform-intake?secret=...
//   - Prints the form ID + public URL
//   - Writes a summary to .jotform-intake.json so re-runs can update instead of duplicating
//
// To re-run with edits, pass --update and the script will PUT changed fields.
// Regenerate from scratch: delete .jotform-intake.json, or pass --force.

import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.JOTFORM_API_KEY;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "egaecoxcpwqldktxlmvi";
const WEBHOOK_SECRET = process.env.JOTFORM_WEBHOOK_SECRET;
const JOTFORM_API_BASE = process.env.JOTFORM_API_BASE ?? "https://api.jotform.com";
const STATE_FILE = path.join(process.cwd(), ".jotform-intake.json");

if (!API_KEY) {
  console.error("ERROR: JOTFORM_API_KEY env var is required.");
  console.error("Get yours at https://www.jotform.com/myaccount/api");
  process.exit(1);
}
if (!WEBHOOK_SECRET) {
  console.error("ERROR: JOTFORM_WEBHOOK_SECRET env var is required.");
  console.error("Generate with: openssl rand -hex 32");
  process.exit(1);
}

const WEBHOOK_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/jotform-intake?secret=${WEBHOOK_SECRET}`;

// ---------- Field specification ----------
// Order matters — it's the order users see.
// Each field becomes a Jotform "question". `name` is the Unique Name that the
// jotform-intake edge function dispatches on (after stripping any q{N}_ prefix).
const FIELDS = [
  // Hidden routing field
  {
    name: "intake_mode",
    type: "control_textbox",
    text: "intake_mode (hidden)",
    defaultValue: "new",
    hidden: "Yes",
  },

  { name: "license_number", type: "control_textbox", text: "FCC License Number (9 digits)", required: "Yes", validation: "Numeric", maxsize: "9" },
  { name: "business_name",  type: "control_textbox", text: "Program / Business Name", required: "Yes" },
  { name: "owner_name",     type: "control_textbox", text: "Owner Name", required: "Yes" },

  { name: "contact_email",  type: "control_email",   text: "Contact Email", required: "Yes" },
  { name: "phone",          type: "control_phone",   text: "Phone", required: "No" },
  { name: "phone_accepts_text", type: "control_yesno", text: "Does this phone accept text messages?" },

  {
    name: "program_type",
    type: "control_radio",
    text: "Program Type",
    required: "Yes",
    options: ["small_family", "large_family"],
    special: "None",
    description: "small_family = up to 8 children. large_family = up to 14 children.",
  },
  {
    name: "licensed_capacity",
    type: "control_number",
    text: "Licensed Capacity (leave blank to use 8 or 14 based on program type)",
    required: "No",
    validation: "Numeric",
  },

  { name: "zip_code",      type: "control_textbox", text: "ZIP Code (5 digits)", required: "Yes", validation: "Numeric", maxsize: "5" },
  {
    name: "neighborhood",
    type: "control_dropdown",
    text: "Neighborhood",
    options: [
      "Bayview","Bernal Heights","Castro","Chinatown","Excelsior","Financial District",
      "Haight-Ashbury","Hayes Valley","Inner Richmond","Inner Sunset","Marina","Mission",
      "Mission Bay","Nob Hill","Noe Valley","North Beach","Outer Richmond","Outer Sunset",
      "Pacific Heights","Portola","Potrero Hill","Russian Hill","SoMa","Tenderloin",
      "Visitacion Valley","Western Addition",
    ],
  },
  { name: "website", type: "control_textbox", text: "Website (optional)" },
  {
    name: "languages",
    type: "control_checkbox",
    text: "Languages Spoken",
    required: "Yes",
    options: [
      "English","Spanish","Cantonese","Mandarin","Tagalog","Vietnamese",
      "Russian","Arabic","Korean","Japanese",
    ],
  },

  // Section header (pagebreak-ish using control_head)
  { name: "vacancy_header", type: "control_head", text: "Current Openings", subHeader: "Enter 0 for age groups you aren't currently accepting. If you only have a waitlist, leave all spots at 0 and mark Waitlist Available below." },

  { name: "infant_spots",     type: "control_number", text: "Infant spots (under 2)", validation: "Numeric", defaultValue: "0" },
  { name: "toddler_spots",    type: "control_number", text: "Toddler spots (2-3)",     validation: "Numeric", defaultValue: "0" },
  { name: "preschool_spots",  type: "control_number", text: "Preschool spots (3-5)",   validation: "Numeric", defaultValue: "0" },
  { name: "school_age_spots", type: "control_number", text: "School-age spots (6+)",   validation: "Numeric", defaultValue: "0" },

  { name: "full_time_available",  type: "control_yesno", text: "Full-time care available?" },
  { name: "part_time_available",  type: "control_yesno", text: "Part-time care available?" },
  { name: "waitlist_available",   type: "control_yesno", text: "Accepting waitlist?" },

  { name: "notes", type: "control_textarea", text: "Anything else families should know? (optional)" },

  { name: "submit", type: "control_button", text: "Submit", buttonAlign: "Auto" },
];

// Jotform's API wants form params encoded as indexed POST body:
//   questions[<order>][type]=control_textbox
//   questions[<order>][text]=License Number
//   questions[<order>][name]=license_number
// Options for radio/checkbox/dropdown are pipe-delimited: "A|B|C".
function buildFormParams(title, fields) {
  const params = new URLSearchParams();
  params.set("properties[title]", title);
  params.set("properties[height]", "600");

  fields.forEach((f, i) => {
    const order = i + 1;
    params.set(`questions[${order}][type]`, f.type);
    params.set(`questions[${order}][text]`, f.text);
    params.set(`questions[${order}][name]`, f.name);
    params.set(`questions[${order}][order]`, String(order));
    if (f.required) params.set(`questions[${order}][required]`, f.required);
    if (f.hidden)   params.set(`questions[${order}][hidden]`, f.hidden);
    if (f.validation) params.set(`questions[${order}][validation]`, f.validation);
    if (f.maxsize) params.set(`questions[${order}][maxsize]`, f.maxsize);
    if (f.defaultValue !== undefined) params.set(`questions[${order}][defaultValue]`, f.defaultValue);
    if (f.options) params.set(`questions[${order}][options]`, f.options.join("|"));
    if (f.description) params.set(`questions[${order}][description]`, f.description);
    if (f.subHeader) params.set(`questions[${order}][subHeader]`, f.subHeader);
    if (f.special) params.set(`questions[${order}][special]`, f.special);
    if (f.buttonAlign) params.set(`questions[${order}][buttonAlign]`, f.buttonAlign);
  });

  return params;
}

async function api(method, endpoint, body) {
  const url = new URL(`${JOTFORM_API_BASE}${endpoint}`);
  url.searchParams.set("apiKey", API_KEY);

  const init = { method, headers: {} };
  if (body) {
    init.headers["Content-Type"] = "application/x-www-form-urlencoded";
    init.body = body.toString();
  }

  const res = await fetch(url, init);
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
  if (!res.ok || parsed?.responseCode >= 400) {
    console.error(`Jotform API ${method} ${endpoint} → ${res.status}`);
    console.error(parsed);
    throw new Error(`Jotform API error: ${parsed?.message ?? res.statusText}`);
  }
  return parsed;
}

async function loadState() {
  try { return JSON.parse(await fs.readFile(STATE_FILE, "utf8")); }
  catch { return null; }
}
async function saveState(state) {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const existing = args.has("--force") ? null : await loadState();

  let formId;
  if (existing?.formId && !args.has("--force")) {
    console.log(`Reusing existing form ${existing.formId} (pass --force to recreate).`);
    formId = existing.formId;
  } else {
    console.log("Creating new form...");
    const params = buildFormParams("Family Child Care SF — Provider Intake", FIELDS);
    const created = await api("POST", "/user/forms", params);

    // Jotform returns {content: {id: "<formId>", title: "...", ...}}
    formId = created.content?.id;
    if (!formId || formId === "id") {
      console.error("Unexpected API response:", JSON.stringify(created).slice(0, 800));
      throw new Error("Could not parse form ID from Jotform response");
    }
    console.log(`✓ Form created. ID = ${formId}`);
  }

  // Register the webhook (idempotent — Jotform de-dupes by URL)
  console.log("Registering webhook...");
  const webhookBody = new URLSearchParams({ webhookURL: WEBHOOK_URL });
  await api("POST", `/form/${formId}/webhooks`, webhookBody);
  console.log(`✓ Webhook registered → ${WEBHOOK_URL.replace(/secret=.+/, "secret=***")}`);

  // Fetch the public form URL
  const formInfo = await api("GET", `/form/${formId}`);
  const publicUrl = formInfo.content?.url || `https://form.jotform.com/${formId}`;

  await saveState({ formId, publicUrl, webhookUrl: "redacted", provisionedAt: new Date().toISOString() });

  console.log("");
  console.log("==============================================================");
  console.log("Jotform provisioned.");
  console.log(`  Form ID:    ${formId}`);
  console.log(`  Public URL: ${publicUrl}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  1. supabase secrets set \\`);
  console.log(`       JOTFORM_WEBHOOK_SECRET=$JOTFORM_WEBHOOK_SECRET \\`);
  console.log(`       JOTFORM_NEW_INTAKE_FORM_ID=${formId}`);
  console.log(`  2. supabase functions deploy jotform-intake`);
  console.log(`  3. Add to Vercel env: VITE_JOTFORM_NEW_INTAKE_URL=${publicUrl}`);
  console.log(`  4. Visit the form in WeChat / Safari / Chrome and verify a test submission`);
  console.log("     lands as an approved row in the providers table.");
  console.log("==============================================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
