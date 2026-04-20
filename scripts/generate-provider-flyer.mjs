#!/usr/bin/env node
// Generates a bilingual (EN + ZH) one-page PDF flyer for an individual
// licensed family child care provider, with a QR code linking to the
// provider's filtered vacancy search page on familychildcaresf.com.
//
// Output: public/downloads/flyers/{slug}-{lang}.pdf (one per language)
//
// Usage:
//   # from Supabase (requires VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY env):
//   node scripts/generate-provider-flyer.mjs --license-number=123456789
//
//   # from a local JSON file (useful offline / for testing):
//   node scripts/generate-provider-flyer.mjs --from-file=./provider.json
//
// JSON file shape (all strings; nullable fields may be omitted):
//   {
//     "slug": "me-play-school",
//     "licenseNumber": "384001234",
//     "businessName": "Me Play School",
//     "phone": "(415) 555-0123",
//     "neighborhood": "Sunset",
//     "languages": ["English", "Cantonese"],
//     "website": "https://example.com"
//   }
//
// The QR code uses a public API (goqr.me) — no extra dependency required.
// If offline, the PDF still generates without the QR code embedded (graceful fallback).

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mdToPdf } from "md-to-pdf";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "public", "downloads", "flyers");
const SITE_URL = "https://familychildcaresf.com";

function parseArgs(argv) {
  const out = {};
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
    else if (a.startsWith("--")) out[a.slice(2)] = true;
  }
  return out;
}

async function loadProviderFromFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function loadProviderFromSupabase(licenseNumber) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const SUPABASE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or pass --from-file=path.json.",
    );
  }
  const url = `${SUPABASE_URL}/rest/v1/providers?license_number=eq.${encodeURIComponent(licenseNumber)}&select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase request failed: ${res.status} ${await res.text()}`);
  }
  const rows = await res.json();
  if (!rows.length) throw new Error(`No provider found with license_number=${licenseNumber}`);
  const r = rows[0];
  return {
    slug: r.slug ?? r.license_number,
    licenseNumber: r.license_number,
    businessName: r.business_name,
    phone: r.phone,
    neighborhood: r.neighborhood,
    languages: r.languages ?? [],
    website: r.website,
  };
}

function providerPageUrl(slug) {
  return `${SITE_URL}/#public?provider=${encodeURIComponent(slug)}`;
}

function qrImageUrl(targetUrl) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=svg&data=${encodeURIComponent(targetUrl)}`;
}

function buildMarkdown(provider, lang) {
  const url = providerPageUrl(provider.slug);
  const qrUrl = qrImageUrl(url);
  const langsStr = (provider.languages ?? []).join(", ") || "—";

  if (lang === "en") {
    return `# ${provider.businessName}

**Licensed Family Child Care in ${provider.neighborhood ?? "San Francisco"}**

- **Phone:** ${provider.phone ?? "—"}
- **Neighborhood:** ${provider.neighborhood ?? "—"}
- **Languages:** ${langsStr}
- **License #:** ${provider.licenseNumber}
${provider.website ? `- **Website:** ${provider.website}` : ""}

## About Family Child Care

Licensed family child care is home-based care in a small, consistent setting — often more affordable than center-based care, and with the same provider your child will grow with over years.

**Most San Francisco families now qualify for free or reduced-cost care** through the city's Early Learning For All (ELFA) program. Ask us about ELFA.

## Scan to see current openings

![Scan this QR code](${qrUrl})

Or visit: **${url}**

## FamilyChildcareSF.com

San Francisco's trilingual registry of licensed family child care homes. Search by neighborhood, language, and age group. A service of the Family Child Care Association of San Francisco.
`;
  }
  // Traditional Chinese
  return `# ${provider.businessName}

**持牌家庭托兒所 — ${provider.neighborhood ?? "三藩市"}**

- **電話：** ${provider.phone ?? "—"}
- **社區：** ${provider.neighborhood ?? "—"}
- **語言：** ${langsStr}
- **牌照編號：** ${provider.licenseNumber}
${provider.website ? `- **網址：** ${provider.website}` : ""}

## 關於家庭托兒所

持牌家庭托兒所在家庭環境中提供小組、穩定的照護——費用通常低於托兒中心，而且您的孩子將與同一位托兒者建立多年的關係。

**大多數三藩市（舊金山）家庭現在有資格獲得免費或低費托兒服務**——透過全民早教 (ELFA) 計劃。歡迎詢問我們 ELFA 的詳情。

## 掃碼查看目前空位

![掃描 QR 碼](${qrUrl})

或造訪：**${url}**

## FamilyChildcareSF.com

三藩市三語持牌家庭托兒所登記平台。按社區、語言和年齡組搜尋。由 Family Child Care Association of San Francisco（三藩市家庭托兒協會）的合作夥伴維護。
`;
}

const CSS = `
  @page { size: Letter; margin: 18mm 16mm; }
  body {
    font-family: "Helvetica Neue", "PingFang TC", "PingFang SC", "Noto Sans CJK TC",
                 "Microsoft JhengHei", "Heiti TC", sans-serif;
    font-size: 11.5pt;
    line-height: 1.55;
    color: #1e293b;
  }
  h1 {
    font-size: 26pt;
    color: #1e40af;
    margin: 0 0 4pt;
  }
  h2 {
    font-size: 14pt;
    color: #1e40af;
    margin: 14pt 0 4pt;
    page-break-after: avoid;
  }
  ul { margin: 4pt 0 8pt 18pt; padding: 0; }
  li { margin-bottom: 3pt; }
  strong { color: #1e40af; }
  img { display: block; margin: 8pt auto; width: 40mm; height: 40mm; }
  p { margin: 5pt 0; }
`;

async function main() {
  const args = parseArgs(process.argv);
  let provider;
  if (args["from-file"]) {
    provider = await loadProviderFromFile(args["from-file"]);
  } else if (args["license-number"]) {
    provider = await loadProviderFromSupabase(args["license-number"]);
  } else {
    console.error(`Usage:
  node scripts/generate-provider-flyer.mjs --license-number=<license>
  node scripts/generate-provider-flyer.mjs --from-file=<path-to-json>`);
    process.exit(1);
  }

  if (!provider.slug) provider.slug = provider.licenseNumber;

  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const lang of ["en", "zh"]) {
    const md = buildMarkdown(provider, lang);
    const outPath = path.join(OUT_DIR, `${provider.slug}-${lang}.pdf`);
    await mdToPdf(
      { content: md },
      {
        dest: outPath,
        stylesheet_encoding: "utf-8",
        css: CSS,
        pdf_options: {
          format: "Letter",
          margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
          printBackground: true,
        },
      },
    );
    console.log(`Wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
