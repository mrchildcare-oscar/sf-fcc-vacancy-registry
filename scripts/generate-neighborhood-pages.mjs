#!/usr/bin/env node
// Generates trilingual neighborhood landing pages into public/.
// Reads neighborhoods from src/data/neighborhoods.mjs, writes:
//   public/neighborhoods/{slug}/index.html          (English)
//   public/es/neighborhoods/{slug}/index.html       (Spanish)
//   public/zh/neighborhoods/{slug}/index.html       (Traditional Chinese)
//
// Usage: node scripts/generate-neighborhood-pages.mjs
// Wired as `npm run generate:neighborhoods`.
//
// See deliverable-2-neighborhood-template.md for the content spec.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neighborhoods, getNeighborhoodBySlug } from "../src/data/neighborhoods.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
const SITE_URL = "https://familychildcaresf.com";

const LANGS = [
  { key: "en", htmlLang: "en", ogLocale: "en_US", ogImage: "/og-image.png", pathPrefix: "", zhDualName: "" },
  { key: "es", htmlLang: "es", ogLocale: "es_ES", ogImage: "/og-image-es.png", pathPrefix: "/es", zhDualName: "" },
  { key: "zh", htmlLang: "zh-Hant", ogLocale: "zh_TW", ogImage: "/og-image-zh.png", pathPrefix: "/zh", zhDualName: "（舊金山）" },
];

const STRINGS = {
  en: {
    brand: "Family Child Care SF",
    navGuide: "Guide",
    navCompare: "Compare",
    navInfant: "Infant Care",
    navFinancial: "Financial Help",
    navChoose: "Trust Wheel",
    navNeighborhoods: "Neighborhoods",
    navFind: "Find Providers",
    breadcrumbHome: "Home",
    breadcrumbChildCareSF: "Child Care in SF",
    breadcrumbNeighborhoods: "Neighborhoods",
    breadcrumbNeighborhoodsFull: "Neighborhoods",
    // Section titles
    findFccTitle: (n) => `Find Licensed Family Child Care in the ${n.nameEn}`,
    atAGlance: "At a glance:",
    commonLanguages: "Common languages offered:",
    typicalHours: "Typical hours:",
    licenseTypes: "License types:",
    licenseTypesValue: "Small FCC (up to 8 children), Large FCC (up to 14 children)",
    ageGroups: "Age groups commonly served:",
    transitAccess: "Transit access:",
    bilingualTitle: (n) => `${n.bilingual.languageEn} Bilingual Child Care in the ${n.nameEn}`,
    financialTitle: (n) => `Financial Assistance for ${n.nameEn} Families`,
    financialBody: (n) =>
      `All San Francisco child care financial assistance programs — including Early Learning For All (ELFA), Head Start, CSPP, and CalWORKs — are available to families in the ${n.nameEn}. Many ${n.nameEn} family child care homes are part of the ELFA network, which means families earning up to 200% of Area Median Income can receive free or reduced-cost care in their neighborhood.`,
    seeFullGuide: "See the full guide to SF child care financial assistance",
    checkEligibility: "Check your eligibility now",
    openingsTitle: (n) => `Current Openings in the ${n.nameEn}`,
    openingsBody: (n) =>
      `Search licensed family child care homes with current vacancies in the ${n.nameEn}. Filter by age group and language to find a program that matches your family.`,
    openingsCta: (n) => `Search openings in the ${n.nameEn}`,
    aboutFccTitle: "About Family Child Care in San Francisco",
    aboutFccBody:
      "Family child care is licensed, home-based child care where a provider cares for a small group of children in their own home. In California, a small family child care home can serve up to 8 children, and a large family child care home can serve up to 14 children, with specific limits on the number of infants. Family child care homes are regulated by the California Department of Social Services and must meet health, safety, and training requirements.",
    aboutFccReadMore: "Read the full SF Child Care Guide",
    nearbyTitle: "Nearby Neighborhoods",
    footerTagline: "A service of the",
    footerOrg: "Family Child Care Association of San Francisco",
  },
  es: {
    brand: "Family Child Care SF",
    navGuide: "Guía",
    navCompare: "Comparar",
    navInfant: "Cuidado para Bebés",
    navFinancial: "Ayuda Financiera",
    navChoose: "Rueda de Confianza",
    navNeighborhoods: "Barrios",
    navFind: "Encontrar Proveedores",
    breadcrumbHome: "Inicio",
    breadcrumbChildCareSF: "Cuidado Infantil en SF",
    breadcrumbNeighborhoods: "Barrios",
    breadcrumbNeighborhoodsFull: "Barrios",
    findFccTitle: (n) => `Encuentre cuidado infantil familiar con licencia en el ${n.nameEs}`,
    atAGlance: "De un vistazo:",
    commonLanguages: "Idiomas comúnmente ofrecidos:",
    typicalHours: "Horas típicas:",
    licenseTypes: "Tipos de licencia:",
    licenseTypesValue: "FCC pequeño (hasta 8 niños), FCC grande (hasta 14 niños)",
    ageGroups: "Grupos de edad comúnmente atendidos:",
    transitAccess: "Acceso al transporte:",
    bilingualTitle: (n) => `Cuidado infantil bilingüe en ${n.bilingual.languageEs} en el ${n.nameEs}`,
    financialTitle: (n) => `Ayuda financiera para familias del ${n.nameEs}`,
    financialBody: (n) =>
      `Todos los programas de ayuda financiera para cuidado infantil de San Francisco — incluyendo Early Learning For All (ELFA), Head Start, CSPP y CalWORKs — están disponibles para las familias del ${n.nameEs}. Muchos hogares FCC del ${n.nameEs} forman parte de la red ELFA, lo que significa que las familias que ganan hasta el 200% del ingreso medio del área (AMI) pueden recibir cuidado gratuito o de bajo costo en su barrio.`,
    seeFullGuide: "Ver la guía completa de ayuda financiera para cuidado infantil en SF",
    checkEligibility: "Verifique su elegibilidad ahora",
    openingsTitle: (n) => `Aperturas actuales en el ${n.nameEs}`,
    openingsBody: (n) =>
      `Busque hogares FCC con licencia con vacantes actuales en el ${n.nameEs}. Filtre por grupo de edad e idioma para encontrar un programa que coincida con su familia.`,
    openingsCta: (n) => `Buscar aperturas en el ${n.nameEs}`,
    aboutFccTitle: "Sobre el cuidado infantil familiar en San Francisco",
    aboutFccBody:
      "El cuidado infantil familiar es cuidado con licencia basado en el hogar, donde un proveedor cuida a un pequeño grupo de niños en su propia casa. En California, un hogar FCC pequeño puede atender hasta 8 niños, y un hogar FCC grande hasta 14 niños, con límites específicos sobre el número de bebés. Los hogares FCC están regulados por el Departamento de Servicios Sociales de California.",
    aboutFccReadMore: "Leer la guía completa de cuidado infantil en SF",
    nearbyTitle: "Barrios cercanos",
    footerTagline: "Un servicio de la",
    footerOrg: "Asociación de Cuidado Infantil Familiar de San Francisco",
  },
  zh: {
    brand: "Family Child Care SF",
    navGuide: "指南",
    navCompare: "比較",
    navInfant: "嬰兒照護",
    navFinancial: "財務援助",
    navChoose: "信任之輪",
    navNeighborhoods: "社區",
    navFind: "尋找托兒者",
    breadcrumbHome: "首頁",
    breadcrumbChildCareSF: "三藩市托兒服務",
    breadcrumbNeighborhoods: "社區",
    breadcrumbNeighborhoodsFull: "社區",
    findFccTitle: (n) => `在${n.nameZh}尋找持牌家庭托兒所`,
    atAGlance: "簡介：",
    commonLanguages: "常見提供語言：",
    typicalHours: "常見時段：",
    licenseTypes: "牌照類型：",
    licenseTypesValue: "小型FCC（最多8名兒童）、大型FCC（最多14名兒童）",
    ageGroups: "常見服務年齡組：",
    transitAccess: "公共交通：",
    bilingualTitle: (n) => `${n.nameZh}的${n.bilingual.languageZh}雙語托兒服務`,
    financialTitle: (n) => `${n.nameZh}家庭的財務援助`,
    financialBody: (n) =>
      `所有三藩市（舊金山）托兒財務援助計劃——包括全民早期教育計劃 (ELFA)、Head Start、CSPP 及 CalWORKs——均適用於${n.nameZh}的家庭。${n.nameZh}許多家庭托兒所是 ELFA 網絡的一部分，意味著收入在地區收入中位數 200% 以下的家庭可在本社區獲得免費或減費托兒服務。`,
    seeFullGuide: "查看三藩市托兒財務援助完整指南",
    checkEligibility: "立即檢查您的資格",
    openingsTitle: (n) => `${n.nameZh}目前的空位`,
    openingsBody: (n) =>
      `搜尋${n.nameZh}有當前空位的持牌家庭托兒所。按年齡組和語言篩選，找到適合您家庭的計劃。`,
    openingsCta: (n) => `搜尋${n.nameZh}的空位`,
    aboutFccTitle: "關於三藩市的家庭托兒所",
    aboutFccBody:
      "家庭托兒所是托兒者在自己家中為小組兒童提供的持牌家庭式照護。在加州，小型家庭托兒所最多可照顧8名兒童，大型家庭托兒所最多可照顧14名兒童，並對嬰兒數量有具體限制。家庭托兒所受加州社會服務部監管，必須符合健康、安全及培訓要求。",
    aboutFccReadMore: "閱讀完整的三藩市托兒指南",
    nearbyTitle: "鄰近社區",
    footerTagline: "由",
    footerOrg: "三藩市家庭托兒協會 (Family Child Care Association of San Francisco)",
  },
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nameFor(n, lang) {
  if (lang === "es") return n.nameEs;
  if (lang === "zh") return n.nameZh;
  return n.nameEn;
}

function introFor(n, lang) {
  if (lang === "es") return n.introEs;
  if (lang === "zh") return n.introZh;
  return n.introEn;
}

function fccDescFor(n, lang) {
  if (lang === "es") return n.fccDescriptionEs;
  if (lang === "zh") return n.fccDescriptionZh;
  return n.fccDescriptionEn;
}

function langsFor(n, lang) {
  if (lang === "es") return n.primaryLanguagesEs;
  if (lang === "zh") return n.primaryLanguagesZh;
  return n.primaryLanguagesEn;
}

function agesFor(n, lang) {
  if (lang === "es") return n.typicalAgeGroupsEs;
  if (lang === "zh") return n.typicalAgeGroupsZh;
  return n.typicalAgeGroupsEn;
}

function hoursFor(n, lang) {
  if (lang === "es") return n.typicalHoursEs;
  if (lang === "zh") return n.typicalHoursZh;
  return n.typicalHoursEn;
}

function bilingualFor(n, lang) {
  if (!n.bilingual) return null;
  const b = n.bilingual;
  if (lang === "es") {
    return {
      language: b.languageEs,
      content: b.contentEs,
      question: b.directAnswerQuestionEs,
      answer: b.directAnswerTextEs,
    };
  }
  if (lang === "zh") {
    return {
      language: b.languageZh,
      content: b.contentZh,
      question: b.directAnswerQuestionZh,
      answer: b.directAnswerTextZh,
    };
  }
  return {
    language: b.languageEn,
    content: b.contentEn,
    question: b.directAnswerQuestionEn,
    answer: b.directAnswerTextEn,
  };
}

function canonicalUrl(slug, lang) {
  const prefix = lang === "en" ? "" : `/${lang}`;
  return `${SITE_URL}${prefix}/neighborhoods/${slug}/`;
}

function hreflangBlock(slug) {
  return [
    `<link rel="alternate" hreflang="en" href="${canonicalUrl(slug, "en")}">`,
    `<link rel="alternate" hreflang="es" href="${canonicalUrl(slug, "es")}">`,
    `<link rel="alternate" hreflang="zh-Hant" href="${canonicalUrl(slug, "zh")}">`,
    `<link rel="alternate" hreflang="x-default" href="${canonicalUrl(slug, "en")}">`,
  ].join("\n  ");
}

function buildBreadcrumbJsonLd(n, lang) {
  const t = STRINGS[lang];
  const name = nameFor(n, lang);
  const prefix = lang === "en" ? "" : `/${lang}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: `${SITE_URL}${prefix}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: t.breadcrumbNeighborhoodsFull,
        item: `${SITE_URL}${prefix}/neighborhoods/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name,
        item: canonicalUrl(n.slug, lang),
      },
    ],
  };
}

function buildChildCareJsonLd(n, lang) {
  const name = nameFor(n, lang);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: lang === "en"
      ? `Child Care in ${name}, San Francisco`
      : lang === "es"
        ? `Cuidado infantil en el ${name}, San Francisco`
        : `${name}托兒服務，三藩市`,
    url: canonicalUrl(n.slug, lang),
    inLanguage: lang === "zh" ? "zh-Hant" : lang,
    about: {
      "@type": "ChildCare",
      name:
        lang === "en"
          ? `Family Child Care in ${name}, San Francisco`
          : lang === "es"
            ? `Cuidado Infantil Familiar en el ${name}, San Francisco`
            : `${name}家庭托兒所`,
      description:
        lang === "en"
          ? `Licensed family child care homes in the ${name} neighborhood of San Francisco, California.`
          : lang === "es"
            ? `Hogares de cuidado infantil familiar con licencia en el barrio ${name} de San Francisco, California.`
            : `位於加州三藩市${name}的持牌家庭托兒所。`,
      areaServed: {
        "@type": "City",
        name: "San Francisco",
        containedInPlace: { "@type": "State", name: "California" },
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "San Francisco",
        addressRegion: "CA",
        addressCountry: "US",
      },
    },
    isPartOf: {
      "@type": "WebSite",
      name: "FamilyChildcareSF",
      url: SITE_URL,
    },
  };
}

function buildFaqJsonLd(n, lang) {
  const b = bilingualFor(n, lang);
  if (!b) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: b.question,
        acceptedAnswer: { "@type": "Answer", text: b.answer },
      },
    ],
  };
}

function renderJsonLd(obj) {
  if (!obj) return "";
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
}

function renderHead(n, lang) {
  const t = STRINGS[lang];
  const langCfg = LANGS.find((l) => l.key === lang);
  const name = nameFor(n, lang);
  const canonical = canonicalUrl(n.slug, lang);

  const title =
    lang === "en"
      ? `Child Care in the ${name}, San Francisco — Family Child Care Homes`
      : lang === "es"
        ? `Cuidado Infantil en el ${name}, San Francisco — Hogares FCC`
        : `${name}托兒服務，三藩市（舊金山）— 家庭托兒所`;

  const description =
    lang === "en"
      ? `Find licensed family child care in the ${name}, San Francisco. ${n.primaryLanguagesEn.slice(0, 2).join(" and ")} commonly spoken. Search current openings and check ELFA eligibility.`
      : lang === "es"
        ? `Encuentre cuidado infantil familiar con licencia en el ${name}, San Francisco. ${n.primaryLanguagesEs.slice(0, 2).join(" y ")} comúnmente hablados. Busque aperturas y verifique elegibilidad ELFA.`
        : `在三藩市${name}尋找持牌家庭托兒所。常見語言：${n.primaryLanguagesZh.slice(0, 2).join("、")}。搜尋當前空位並檢查 ELFA 資格。`;

  const breadcrumb = renderJsonLd(buildBreadcrumbJsonLd(n, lang));
  const childCare = renderJsonLd(buildChildCareJsonLd(n, lang));
  const faq = renderJsonLd(buildFaqJsonLd(n, lang));

  return `<!DOCTYPE html>
<html lang="${langCfg.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  ${hreflangBlock(n.slug)}
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${SITE_URL}${langCfg.ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="og:site_name" content="Family Child Care SF">
  <meta property="og:locale" content="${langCfg.ogLocale}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${SITE_URL}${langCfg.ogImage}">
  ${breadcrumb}
  ${childCare}
  ${faq}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.7; color: #1e293b; background: #ffffff; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 1152px; margin: 0 auto; padding: 0 20px; }
    header { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 16px 0; }
    header .container { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .site-title { font-size: 18px; font-weight: 700; color: #1e40af; }
    .header-links { display: flex; gap: 16px; font-size: 14px; flex-wrap: wrap; }
    .header-links a.active-page { color: #1e40af; font-weight: 600; }
    .lang-switcher { display: flex; gap: 8px; font-size: 13px; }
    .lang-switcher span.active { background: #2563eb; color: #fff; border: 1px solid #2563eb; border-radius: 4px; padding: 4px 10px; font-size: 13px; }
    .lang-switcher a { background: none; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 10px; font-size: 13px; color: #475569; }
    .lang-switcher a:hover { background: #f1f5f9; text-decoration: none; }
    .hero { background: #fff; padding: 32px 0 24px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .hero h1 { font-size: 32px; font-weight: 800; margin-bottom: 12px; line-height: 1.2; color: #111827; }
    .hero .subtitle { font-size: 18px; color: #6b7280; max-width: 720px; margin: 0 auto; }
    .breadcrumb { font-size: 14px; color: #64748b; padding: 12px 0 0; }
    .breadcrumb a { color: #64748b; }
    .breadcrumb a:hover { color: #2563eb; }
    main { padding: 40px 0 60px; }
    .content-section { margin-bottom: 40px; }
    h2 { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 16px; padding-top: 8px; }
    h3 { font-size: 18px; font-weight: 600; color: #1e40af; margin-bottom: 8px; margin-top: 20px; }
    p { margin-bottom: 12px; }
    .glance-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 16px; }
    .glance-card dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 16px; font-size: 15px; }
    .glance-card dt { font-weight: 600; color: #334155; }
    .glance-card dd { color: #475569; }
    .direct-answer { background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 16px 0; }
    .direct-answer h3 { margin-top: 0; color: #1e40af; }
    .financial-links { list-style: none; padding-left: 0; }
    .financial-links li { margin-bottom: 8px; }
    .financial-links a { font-weight: 600; }
    .cta-section { text-align: center; padding: 40px 20px; background: #eff6ff; border-radius: 12px; margin: 40px 0; }
    .cta-button { display: inline-block; background: #2563eb; color: #fff; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 16px; }
    .cta-button:hover { background: #1d4ed8; text-decoration: none; }
    .nearby-list { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
    .nearby-list a { background: #f1f5f9; padding: 8px 14px; border-radius: 20px; font-size: 14px; color: #334155; }
    .nearby-list a:hover { background: #e2e8f0; text-decoration: none; }
    footer { background: #fff; color: #6b7280; border-top: 1px solid #e5e7eb; padding: 24px 0; text-align: center; font-size: 14px; }
    footer a { color: #2563eb; }
    @media (max-width: 640px) {
      .hero h1 { font-size: 24px; }
      .hero .subtitle { font-size: 16px; }
      h2 { font-size: 20px; }
      .glance-card dl { grid-template-columns: 1fr; gap: 4px 0; }
      .glance-card dt { margin-top: 8px; }
    }
  </style>
</head>`;
}

function renderHeader(n, lang) {
  const t = STRINGS[lang];
  const prefix = lang === "en" ? "" : `/${lang}`;
  const mk = (active) => (key) => {
    const isActive = active === key ? ' class="active-page"' : "";
    return { key, isActive };
  };
  const linkHref = (p) => `${prefix}${p}`;

  // Language switcher — fixed order EN → ES → 中文 regardless of active language
  const switcherItems = LANGS.map((l) => {
    const label = l.key === "en" ? "EN" : l.key === "es" ? "ES" : "中文";
    if (l.key === lang) return `<span class="active">${label}</span>`;
    return `<a href="${l.pathPrefix}/neighborhoods/${n.slug}/">${label}</a>`;
  });
  const switcherHtml = `
        <div class="lang-switcher">
          ${switcherItems.join("\n          ")}
        </div>`;

  return `<body>
  <header>
    <div class="container">
      <a href="${prefix}/" class="site-title">${t.brand}</a>
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
        <div class="header-links">
          <a href="${linkHref("/child-care-san-francisco/")}">${t.navGuide}</a>
          <a href="${linkHref("/family-child-care-vs-centers/")}">${t.navCompare}</a>
          <a href="${linkHref("/infant-care-san-francisco/")}">${t.navInfant}</a>
          <a href="${linkHref("/financial-assistance/")}">${t.navFinancial}</a>
          <a href="${linkHref("/choose/")}">${t.navChoose}</a>
          <a href="${linkHref("/neighborhoods/")}" class="active-page">${t.navNeighborhoods}</a>
          <a href="/#public">${t.navFind}</a>
        </div>
        ${switcherHtml}
      </div>
    </div>
  </header>`;
}

function renderHero(n, lang) {
  const t = STRINGS[lang];
  const name = nameFor(n, lang);
  const title =
    lang === "en"
      ? `Child Care in the ${name}, San Francisco`
      : lang === "es"
        ? `Cuidado Infantil en el ${name}, San Francisco`
        : `${name}托兒服務，三藩市`;
  const subtitle =
    lang === "en"
      ? `Licensed family child care homes serving ${name} families — bilingual options and ELFA-covered care available.`
      : lang === "es"
        ? `Hogares FCC con licencia que sirven a familias del ${name} — opciones bilingües y cuidado cubierto por ELFA disponibles.`
        : `為${name}家庭服務的持牌家庭托兒所——提供雙語選擇及 ELFA 補助。`;

  const prefix = lang === "en" ? "" : `/${lang}`;

  return `
  <div class="hero">
    <div class="container">
      <h1>${escapeHtml(title)}</h1>
      <p class="subtitle">${escapeHtml(subtitle)}</p>
    </div>
  </div>
  <main>
    <div class="container">
      <div class="breadcrumb">
        <a href="${prefix}/">${t.breadcrumbHome}</a> &rsaquo; <a href="${prefix}/child-care-san-francisco/">${t.breadcrumbChildCareSF}</a> &rsaquo; ${t.breadcrumbNeighborhoods} &rsaquo; ${escapeHtml(name)}
      </div>`;
}

function renderIntro(n, lang) {
  return `
      <div class="content-section" style="margin-top:24px;">
        <p>${escapeHtml(introFor(n, lang))}</p>
      </div>`;
}

function renderFccSection(n, lang) {
  const t = STRINGS[lang];
  const glanceRows = [
    { label: t.commonLanguages, value: langsFor(n, lang).join(", ") },
    { label: t.typicalHours, value: hoursFor(n, lang) },
    { label: t.licenseTypes, value: t.licenseTypesValue },
    { label: t.ageGroups, value: agesFor(n, lang) },
  ];
  if (n.transitNotes) glanceRows.push({ label: t.transitAccess, value: n.transitNotes });

  const dl = glanceRows
    .map(
      (r) => `          <dt>${escapeHtml(r.label)}</dt>\n          <dd>${escapeHtml(r.value)}</dd>`,
    )
    .join("\n");

  return `
      <div class="content-section">
        <h2>${escapeHtml(t.findFccTitle(n))}</h2>
        <p>${escapeHtml(fccDescFor(n, lang))}</p>
        <div class="glance-card">
          <strong>${escapeHtml(t.atAGlance)}</strong>
          <dl style="margin-top:8px;">
${dl}
          </dl>
        </div>
      </div>`;
}

function renderBilingualSection(n, lang) {
  const b = bilingualFor(n, lang);
  if (!b) return "";
  const t = STRINGS[lang];
  return `
      <div class="content-section">
        <h2>${escapeHtml(t.bilingualTitle(n))}</h2>
        <p>${escapeHtml(b.content)}</p>
        <div class="direct-answer">
          <h3>${escapeHtml(b.question)}</h3>
          <p>${escapeHtml(b.answer)}</p>
        </div>
      </div>`;
}

function renderFinancialSection(n, lang) {
  const t = STRINGS[lang];
  const prefix = lang === "en" ? "" : `/${lang}`;
  return `
      <div class="content-section">
        <h2>${escapeHtml(t.financialTitle(n))}</h2>
        <p>${escapeHtml(t.financialBody(n))}</p>
        <ul class="financial-links">
          <li><a href="${prefix}/financial-assistance/">→ ${escapeHtml(t.seeFullGuide)}</a></li>
          <li><a href="/#check-eligibility">→ ${escapeHtml(t.checkEligibility)}</a></li>
        </ul>
      </div>`;
}

function renderOpeningsCta(n, lang) {
  const t = STRINGS[lang];
  return `
      <div class="cta-section">
        <h2 style="color:#1e40af;padding-top:0;">${escapeHtml(t.openingsTitle(n))}</h2>
        <p>${escapeHtml(t.openingsBody(n))}</p>
        <a href="/#public?neighborhood=${encodeURIComponent(n.slug)}" class="cta-button">${escapeHtml(t.openingsCta(n))}</a>
      </div>`;
}

function renderNearbySection(n, lang) {
  if (!n.nearbyNeighborhoods || n.nearbyNeighborhoods.length === 0) return "";
  const t = STRINGS[lang];
  const prefix = lang === "en" ? "" : `/${lang}`;
  const items = n.nearbyNeighborhoods
    .map((slug) => {
      const other = getNeighborhoodBySlug(slug);
      if (!other) return null;
      const otherName = nameFor(other, lang);
      return `<a href="${prefix}/neighborhoods/${slug}/">${escapeHtml(otherName)}</a>`;
    })
    .filter(Boolean);
  if (items.length === 0) return "";
  return `
      <div class="content-section">
        <h2>${escapeHtml(t.nearbyTitle)}</h2>
        <div class="nearby-list">
          ${items.join("\n          ")}
        </div>
      </div>`;
}

function renderAboutFcc(n, lang) {
  const t = STRINGS[lang];
  const prefix = lang === "en" ? "" : `/${lang}`;
  return `
      <div class="content-section">
        <h2>${escapeHtml(t.aboutFccTitle)}</h2>
        <p>${escapeHtml(t.aboutFccBody)}</p>
        <p><a href="${prefix}/child-care-san-francisco/">→ ${escapeHtml(t.aboutFccReadMore)}</a></p>
      </div>`;
}

function renderFooter(lang) {
  const t = STRINGS[lang];
  return `
    </div>
  </main>
  <footer>
    <div class="container">
      <p>${escapeHtml(t.footerTagline)} <a href="https://fccasf.com" target="_blank" rel="noopener">${escapeHtml(t.footerOrg)}</a></p>
    </div>
  </footer>
</body>
</html>`;
}

function renderPage(n, lang) {
  return [
    renderHead(n, lang),
    renderHeader(n, lang),
    renderHero(n, lang),
    renderIntro(n, lang),
    renderFccSection(n, lang),
    renderBilingualSection(n, lang),
    renderFinancialSection(n, lang),
    renderOpeningsCta(n, lang),
    renderNearbySection(n, lang),
    renderAboutFcc(n, lang),
    renderFooter(lang),
  ].join("\n");
}

// ---------- Index page (/neighborhoods/) ----------

const INDEX_STRINGS = {
  en: {
    title: "Find Child Care by Neighborhood — San Francisco Family Child Care",
    description:
      "Browse licensed family child care homes by San Francisco neighborhood. Find bilingual providers, ELFA-covered care, and current vacancies in Sunset, Richmond, Excelsior, Bayview, Mission, and more.",
    h1: "Find Child Care by Neighborhood",
    subtitle:
      "Licensed family child care homes across San Francisco — bilingual options, ELFA-covered care, and current openings in every major neighborhood.",
    exploreTitle: "Explore San Francisco Neighborhoods",
    teaser: (n) =>
      `Licensed family child care homes in the ${n.nameEn} — ${n.primaryLanguagesEn.slice(0, 2).join(" and ")} commonly spoken. View neighborhood guide →`,
    cta: "View neighborhood guide",
    bottomCtaTitle: "Search openings citywide",
    bottomCtaBody:
      "Prefer to search across all neighborhoods at once? Use the live vacancy registry to filter by age group, language, and ELFA network status.",
    bottomCtaBtn: "Browse Providers with Openings",
  },
  es: {
    title: "Encuentre Cuidado Infantil por Barrio — Cuidado Familiar de San Francisco",
    description:
      "Explore hogares FCC con licencia por barrio de San Francisco. Encuentre proveedores bilingües, cuidado cubierto por ELFA y vacantes actuales en Sunset, Richmond, Excelsior, Bayview, Mission y más.",
    h1: "Encuentre cuidado infantil por barrio",
    subtitle:
      "Hogares de cuidado infantil familiar con licencia en todo San Francisco — opciones bilingües, cuidado cubierto por ELFA y aperturas actuales en cada barrio principal.",
    exploreTitle: "Explore los barrios de San Francisco",
    teaser: (n) =>
      `Hogares FCC con licencia en el ${n.nameEs} — ${n.primaryLanguagesEs.slice(0, 2).join(" y ")} comúnmente hablados. Ver guía del barrio →`,
    cta: "Ver guía del barrio",
    bottomCtaTitle: "Buscar aperturas en toda la ciudad",
    bottomCtaBody:
      "¿Prefiere buscar en todos los barrios a la vez? Use el registro de vacantes en vivo para filtrar por grupo de edad, idioma y estado de la red ELFA.",
    bottomCtaBtn: "Explorar proveedores con aperturas",
  },
  zh: {
    title: "按社區尋找托兒服務 — 三藩市（舊金山）家庭托兒所",
    description:
      "按三藩市社區瀏覽持牌家庭托兒所。在 Sunset（日落區）、Richmond（列治文區）、Excelsior、Bayview、Mission 等社區尋找雙語托兒者、ELFA 補助照護及當前空位。",
    h1: "按社區尋找托兒服務",
    subtitle:
      "遍佈三藩市的持牌家庭托兒所——雙語選擇、ELFA 補助照護，以及每個主要社區的當前空位。",
    exploreTitle: "探索三藩市各社區",
    teaser: (n) =>
      `${n.nameZh}的持牌家庭托兒所——常見語言：${n.primaryLanguagesZh.slice(0, 2).join("、")}。查看社區指南 →`,
    cta: "查看社區指南",
    bottomCtaTitle: "搜尋全市空位",
    bottomCtaBody:
      "想一次過搜尋所有社區？使用即時空位登記系統，按年齡組、語言和 ELFA 網絡狀態篩選。",
    bottomCtaBtn: "瀏覽有空位的托兒者",
  },
};

function canonicalIndexUrl(lang) {
  const prefix = lang === "en" ? "" : `/${lang}`;
  return `${SITE_URL}${prefix}/neighborhoods/`;
}

function hreflangIndexBlock() {
  return [
    `<link rel="alternate" hreflang="en" href="${canonicalIndexUrl("en")}">`,
    `<link rel="alternate" hreflang="es" href="${canonicalIndexUrl("es")}">`,
    `<link rel="alternate" hreflang="zh-Hant" href="${canonicalIndexUrl("zh")}">`,
    `<link rel="alternate" hreflang="x-default" href="${canonicalIndexUrl("en")}">`,
  ].join("\n  ");
}

function renderIndexPage(lang) {
  const t = STRINGS[lang];
  const it = INDEX_STRINGS[lang];
  const langCfg = LANGS.find((l) => l.key === lang);
  const prefix = lang === "en" ? "" : `/${lang}`;
  const canonical = canonicalIndexUrl(lang);

  // Breadcrumb JSON-LD
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: `${SITE_URL}${prefix}/` },
      { "@type": "ListItem", position: 2, name: t.breadcrumbChildCareSF, item: `${SITE_URL}${prefix}/child-care-san-francisco/` },
      { "@type": "ListItem", position: 3, name: t.breadcrumbNeighborhoodsFull, item: canonical },
    ],
  };

  // ItemList JSON-LD — lists the 5 neighborhoods
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: it.h1,
    itemListElement: neighborhoods.map((n, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: nameFor(n, lang),
      url: canonicalUrl(n.slug, lang),
    })),
  };

  // Language switcher
  const otherLangs = LANGS.filter((l) => l.key !== lang);
  const switcherHtml = `
        <div class="lang-switcher">
          <span class="active">${lang === "en" ? "EN" : lang === "es" ? "ES" : "中文"}</span>
          ${otherLangs
            .map((l) => {
              const label = l.key === "en" ? "EN" : l.key === "es" ? "ES" : "中文";
              return `<a href="${l.pathPrefix}/neighborhoods/">${label}</a>`;
            })
            .join("\n          ")}
        </div>`;

  const cards = neighborhoods
    .map((n) => {
      const name = nameFor(n, lang);
      return `
        <a href="${prefix}/neighborhoods/${n.slug}/" class="neighborhood-card">
          <h3>${escapeHtml(name)}</h3>
          <p>${escapeHtml(it.teaser(n))}</p>
        </a>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="${langCfg.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(it.title)}</title>
  <meta name="description" content="${escapeHtml(it.description)}">
  <link rel="canonical" href="${canonical}">
  ${hreflangIndexBlock()}
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escapeHtml(it.title)}">
  <meta property="og:description" content="${escapeHtml(it.description)}">
  <meta property="og:image" content="${SITE_URL}${langCfg.ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="og:site_name" content="Family Child Care SF">
  <meta property="og:locale" content="${langCfg.ogLocale}">
  ${renderJsonLd(breadcrumb)}
  ${renderJsonLd(itemList)}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.7; color: #1e293b; background: #ffffff; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 1152px; margin: 0 auto; padding: 0 20px; }
    header { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 16px 0; }
    header .container { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .site-title { font-size: 18px; font-weight: 700; color: #1e40af; }
    .header-links { display: flex; gap: 16px; font-size: 14px; flex-wrap: wrap; }
    .header-links a.active-page { color: #1e40af; font-weight: 600; }
    .lang-switcher { display: flex; gap: 8px; font-size: 13px; }
    .lang-switcher span.active { background: #2563eb; color: #fff; border: 1px solid #2563eb; border-radius: 4px; padding: 4px 10px; font-size: 13px; }
    .lang-switcher a { background: none; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 10px; font-size: 13px; color: #475569; }
    .lang-switcher a:hover { background: #f1f5f9; text-decoration: none; }
    .hero { background: #fff; padding: 40px 0 24px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .hero h1 { font-size: 36px; font-weight: 800; margin-bottom: 12px; line-height: 1.2; color: #111827; }
    .hero .subtitle { font-size: 18px; color: #6b7280; max-width: 720px; margin: 0 auto; }
    main { padding: 48px 0 60px; }
    .content-section { margin-bottom: 48px; }
    h2 { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 20px; text-align: center; }
    .neighborhood-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
    .neighborhood-card { display: block; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px; text-decoration: none; transition: all 0.15s ease; }
    .neighborhood-card:hover { border-color: #2563eb; box-shadow: 0 2px 12px rgba(37,99,235,0.08); text-decoration: none; transform: translateY(-1px); }
    .neighborhood-card h3 { font-size: 20px; font-weight: 700; color: #1e40af; margin-bottom: 8px; }
    .neighborhood-card p { color: #475569; font-size: 15px; line-height: 1.5; }
    .cta-section { text-align: center; padding: 40px 20px; background: #eff6ff; border-radius: 12px; margin-top: 48px; }
    .cta-button { display: inline-block; background: #2563eb; color: #fff; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 16px; }
    .cta-button:hover { background: #1d4ed8; text-decoration: none; }
    footer { background: #fff; color: #6b7280; border-top: 1px solid #e5e7eb; padding: 24px 0; text-align: center; font-size: 14px; }
    footer a { color: #2563eb; }
    @media (max-width: 640px) {
      .hero h1 { font-size: 26px; }
      .hero .subtitle { font-size: 16px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <a href="${prefix}/" class="site-title">${t.brand}</a>
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
        <div class="header-links">
          <a href="${prefix}/child-care-san-francisco/">${t.navGuide}</a>
          <a href="${prefix}/family-child-care-vs-centers/">${t.navCompare}</a>
          <a href="${prefix}/infant-care-san-francisco/">${t.navInfant}</a>
          <a href="${prefix}/financial-assistance/">${t.navFinancial}</a>
          <a href="${prefix}/choose/">${t.navChoose}</a>
          <a href="${prefix}/neighborhoods/" class="active-page">${t.navNeighborhoods}</a>
          <a href="/#public">${t.navFind}</a>
        </div>
        ${switcherHtml}
      </div>
    </div>
  </header>
  <div class="hero">
    <div class="container">
      <h1>${escapeHtml(it.h1)}</h1>
      <p class="subtitle">${escapeHtml(it.subtitle)}</p>
    </div>
  </div>
  <main>
    <div class="container">
      <div class="content-section">
        <h2>${escapeHtml(it.exploreTitle)}</h2>
        <div class="neighborhood-grid">${cards}
        </div>
      </div>
      <div class="cta-section">
        <h2 style="color:#1e40af;margin-bottom:8px;">${escapeHtml(it.bottomCtaTitle)}</h2>
        <p>${escapeHtml(it.bottomCtaBody)}</p>
        <a href="/#public" class="cta-button">${escapeHtml(it.bottomCtaBtn)}</a>
      </div>
    </div>
  </main>
  <footer>
    <div class="container">
      <p>${escapeHtml(t.footerTagline)} <a href="https://fccasf.com" target="_blank" rel="noopener">${escapeHtml(t.footerOrg)}</a></p>
    </div>
  </footer>
</body>
</html>`;
}

async function main() {
  const generated = [];
  for (const n of neighborhoods) {
    for (const { key } of LANGS) {
      const prefix = key === "en" ? "" : `/${key}`;
      const outDir = path.join(PUBLIC_DIR, prefix.slice(1), "neighborhoods", n.slug);
      await fs.mkdir(outDir, { recursive: true });
      const outPath = path.join(outDir, "index.html");
      const html = renderPage(n, key);
      await fs.writeFile(outPath, html, "utf8");
      generated.push(outPath.replace(PUBLIC_DIR, "public"));
    }
  }

  // Also emit /neighborhoods/ index pages in each language
  for (const { key } of LANGS) {
    const prefix = key === "en" ? "" : `/${key}`;
    const outDir = path.join(PUBLIC_DIR, prefix.slice(1), "neighborhoods");
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, "index.html");
    await fs.writeFile(outPath, renderIndexPage(key), "utf8");
    generated.push(outPath.replace(PUBLIC_DIR, "public"));
  }

  console.log(`Generated ${generated.length} neighborhood pages:`);
  for (const p of generated) console.log(`  ${p}`);

  // Print sitemap URL block for manual paste into public/sitemap.xml
  console.log("\n--- Sitemap URLs (paste into public/sitemap.xml) ---");
  const today = new Date().toISOString().slice(0, 10);
  for (const n of neighborhoods) {
    for (const { key } of LANGS) {
      const loc = canonicalUrl(n.slug, key);
      console.log(`  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${canonicalUrl(n.slug, "en")}"/>
    <xhtml:link rel="alternate" hreflang="es" href="${canonicalUrl(n.slug, "es")}"/>
    <xhtml:link rel="alternate" hreflang="zh-Hant" href="${canonicalUrl(n.slug, "zh")}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${canonicalUrl(n.slug, "en")}"/>
    <lastmod>${today}</lastmod>
    <priority>0.8</priority>
  </url>`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
