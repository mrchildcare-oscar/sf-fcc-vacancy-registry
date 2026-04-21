#!/usr/bin/env node
/**
 * Add 3 new Yes/No questions to the existing Jotform intake form:
 *   - weekend_available
 *   - evening_available
 *   - overnight_available
 *
 * Idempotent: skips any question whose Unique Name already exists.
 *
 * Usage:
 *   export JOTFORM_API_KEY=...
 *   node scripts/add-jotform-schedule-fields.mjs
 */
import fs from "node:fs/promises";

const API_KEY = process.env.JOTFORM_API_KEY;
if (!API_KEY) {
  console.error("ERROR: JOTFORM_API_KEY env var is required.");
  console.error("  Get it from https://www.jotform.com/myaccount/api");
  process.exit(1);
}

const STATE_FILE = new URL("../.jotform-intake.json", import.meta.url).pathname;
const BASE = "https://api.jotform.com";

const NEW_FIELDS = [
  { name: "weekend_available",   type: "control_yesno", text: "Weekend care available? (Sat/Sun)" },
  { name: "evening_available",   type: "control_yesno", text: "Evening care available? (after 6pm)" },
  { name: "overnight_available", type: "control_yesno", text: "Overnight care available?" },
];

async function api(method, path, body) {
  const url = `${BASE}${path}?apiKey=${API_KEY}`;
  const init = { method, headers: {} };
  if (body) {
    init.headers["Content-Type"] = "application/x-www-form-urlencoded";
    init.body = body.toString();
  }
  const res = await fetch(url, init);
  const json = await res.json();
  if (!res.ok || json.responseCode >= 400) {
    throw new Error(`Jotform API ${method} ${path} failed: ${JSON.stringify(json).slice(0, 400)}`);
  }
  return json;
}

async function main() {
  const state = JSON.parse(await fs.readFile(STATE_FILE, "utf8"));
  const formId = state.formId;
  if (!formId) throw new Error("No formId in .jotform-intake.json");

  console.log(`Form: ${formId}`);

  // Fetch existing questions so we can (a) skip duplicates, (b) place new
  // questions after the current maximum order.
  const existing = await api("GET", `/form/${formId}/questions`);
  const questions = Object.values(existing.content || {});
  const existingNames = new Set(questions.map((q) => q.name));
  const maxOrder = questions.reduce((m, q) => Math.max(m, parseInt(q.order || "0", 10)), 0);

  let nextOrder = maxOrder + 1;
  let added = 0;
  let skipped = 0;

  for (const field of NEW_FIELDS) {
    if (existingNames.has(field.name)) {
      console.log(`  • ${field.name} already exists — skipping`);
      skipped++;
      continue;
    }
    // POST /form/{id}/questions adds a single question; body uses the
    // `question[...]` prefix.
    const body = new URLSearchParams();
    body.set("question[type]", field.type);
    body.set("question[text]", field.text);
    body.set("question[name]", field.name);
    body.set("question[order]", String(nextOrder));
    body.set("question[required]", "No");
    await api("POST", `/form/${formId}/questions`, body);
    console.log(`  ✓ ${field.name}`);
    added++;
    nextOrder++;
  }

  console.log(`\nDone. Added ${added}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
