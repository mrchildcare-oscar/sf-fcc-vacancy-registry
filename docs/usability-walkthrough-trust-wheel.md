# Trust Wheel Content Hub — Usability Walkthrough

**Date:** March 15, 2026
**Method:** Cognitive walkthrough with 3 parent personas
**Site:** staging.familychildcaresf.pages.dev
**Scope:** Homepage, Trust Wheel hub, factor pages, existing content pages

---

## Persona 1: Sarah — First-time mom, English-speaking, Mission District

**Background:** 32, expecting her first child in 4 months. Works in tech. Household income ~$180K. Googled "child care San Francisco" and landed on the homepage.

### Journey

**Step 1: Homepage (/#public)**
- **Sees:** Title "SF Family Child Care Vacancy Registry", 18 programs with openings, search bar, filter button.
- **Thinks:** "OK, this is a search tool for child care. But I don't even know what I'm looking for yet — center? Home? What's the difference?"
- **Notices:** The eligibility screener says "💰 Check Eligibility." Clicks it.
- **Action:** Enters household size 3, income $180K. Gets result: qualifies for free ELFA care. "Wait, really? Free?"
- **Emotion:** Surprised, relieved. Trust level increases significantly.

**Step 2: Scrolls down, sees "Helpful Resources"**
- **Sees:** 5 cards — Trust Wheel, SF Child Care Guide, FCC vs. Centers, Infant Care, Financial Help.
- **Thinks:** "Trust Wheel? What's that?" Clicks it.
- **Action:** Navigates to `/choose/`.

**Step 3: Trust Wheel hub**
- **Sees:** Headline "What Matters Most When Choosing Child Care?" + circular wheel visualization with 8 factors.
- **Thinks:** "Oh, this is like a framework for thinking about child care. I hadn't thought about half of these."
- **Scans the wheel:** Safety catches her eye first (67-72% ranked #1). Then "Small Group Size" — she likes the sound of 6-14 kids max vs. a big center.
- **Action:** Clicks "Safety & Licensing" on the wheel.

**Step 4: Safety & Licensing page**
- **Reads:** California licensing requirements, background checks, two license types, how to verify.
- **Thinks:** "I can actually look up any provider's license at ccld.dss.ca.gov. That's useful."
- **Key takeaway:** "Family child care homes are inspected and licensed just like centers. I didn't know that."
- **Notices:** "Related Factors" section at bottom — clicks "Small Group Size."

**Step 5: Small Group Size page**
- **Reads:** Max 8 kids in small FCC, 14 in large. California ratios. Research on benefits.
- **Thinks:** "8 kids with one caregiver vs. 20+ in a center room... that's a huge difference for a newborn."
- **Action:** Clicks CTA "Find Small-Group Providers with Openings" → goes to `/#public`. Filters by "Mission" neighborhood and "Infant" age group.

### Sarah's Summary
| Metric | Rating |
|--------|--------|
| Found what she needed | Yes |
| Time to first meaningful action | ~4 min |
| Pages visited | 4 (homepage → Trust Wheel → Safety → Small Group → back to search) |
| Key conversion | Filtered search for infant care in Mission |
| Emotional arc | Overwhelmed → Educated → Confident → Active search |
| Trust level | High — survey data + license verification info + ELFA eligibility |

### Friction Points
1. **Homepage is still dense** — eligibility screener, "Why Family Child Care" video accordion, resources, fairness notice all appear before provider listings. Sarah had to scroll past a lot to find the resources section.
2. **Trust Wheel not immediately visible** on homepage — it's one of 5 small resource cards below the eligibility screener. Could be missed.
3. **No obvious "I'm new, start here" path** — Sarah happened to find the Trust Wheel, but a first-time parent could easily jump straight to scrolling provider cards without context.

---

## Persona 2: Wei Lin (林太太) — Cantonese-speaking grandmother, Sunset District

**Background:** 63, helping her daughter find child care for a 1-year-old grandson. Speaks Cantonese primarily, reads Traditional Chinese. Searched "舊金山 托兒" (San Francisco child care) and landed on the homepage.

### Journey

**Step 1: Homepage**
- **Sees:** English interface. Looks for language switch.
- **Thinks:** "我看不懂英文..." (I can't read English...)
- **Action:** Finds the language toggle in the SPA header. Switches to 中文.
- **Friction:** The SPA language toggle works, but it only changes the app UI — not the content pages. She doesn't know about the Chinese content pages yet.

**Step 2: Homepage in Chinese**
- **Sees:** Title now in Chinese. 18 programs with openings. Resource cards below.
- **Notices:** "信任指南" (Trust Wheel) card — "選擇托兒時什麼最重要" (What matters most when choosing care).
- **Thinks:** "This sounds helpful. My daughter keeps asking me what to look for."
- **Action:** Clicks Trust Wheel card → navigates to `/zh/choose/`.

**Step 3: Trust Wheel hub (Chinese)**
- **Sees:** "選擇托兒服務時什麼最重要？" — all in natural Traditional Chinese.
- **Emotion:** Relief. "Finally, information in my language."
- **Scans the wheel:** "文化語言" (Cultural & Language Match) immediately catches her eye. Also "安全與執照" (Safety).
- **Thinks:** "我想找說粵語的托兒老師" (I want to find a Cantonese-speaking provider).
- **Action:** Clicks "文化語言" on the wheel.

**Step 4: Cultural & Language Match page (Chinese)**
- **Reads:** Over 20 languages available. Cantonese providers in Sunset, Richmond, Chinatown specifically mentioned.
- **Thinks:** "They specifically mention 粵語托兒! And they say Sunset District has Cantonese providers — that's my neighborhood."
- **Key takeaway:** FAQ answers "如何在舊金山找到說粵語的托兒老師？" directly. Mentions filtering by language in the registry.
- **Notices:** CTA links to `/?lang=zh-TW&filter=language#public`.
- **Action:** Clicks CTA → goes to registry filtered by language. Looks for Cantonese-speaking providers in Sunset.

**Step 5: Provider listings**
- **Sees:** Provider cards with Chinese language labels. Finds 3 Cantonese-speaking providers in Sunset with openings.
- **Action:** Clicks on a provider to view details. Notes the phone number to call.

### Wei Lin's Summary
| Metric | Rating |
|--------|--------|
| Found what she needed | Yes |
| Time to first meaningful action | ~5 min |
| Pages visited | 4 (homepage → Trust Wheel ZH → Cultural Match ZH → registry) |
| Key conversion | Found Cantonese providers in Sunset District |
| Emotional arc | Lost (English) → Relieved (Chinese) → Targeted → Satisfied |
| Trust level | High — content in her language, specific to her neighborhood |

### Friction Points
1. **Initial language barrier on homepage** — The SPA language toggle exists but it's a small button. A monolingual Chinese speaker might bounce before finding it.
2. **No Chinese landing page** — There's no `/zh/` homepage. The Chinese experience starts only when the user switches language in the SPA or clicks into a Chinese content page. A dedicated Chinese landing URL would help with Chinese-language search engine results.
3. **Content page ↔ SPA disconnect** — When Wei Lin clicks CTA from `/zh/choose/cultural-language-match/` to `/?lang=zh-TW&filter=language#public`, the SPA loads in Chinese (via URL param). But if she later navigates from the SPA back to a content page, the SPA resource links correctly go to `/zh/` versions. This works but the transition between static pages and SPA feels slightly disjointed.

---

## Persona 3: Carlos — Spanish-speaking father, Excelsior District

**Background:** 29, single dad with a 3-year-old. Works two jobs. Household income ~$65K. A friend told him about free child care in SF. Searched "cuidado infantil gratis san francisco" and landed on `/es/financial-assistance/`.

### Journey

**Step 1: Financial Assistance page (Spanish)**
- **Sees:** "Asistencia Financiera para Cuidado Infantil en San Francisco" — entirely in Spanish.
- **Thinks:** "Perfecto, esto es lo que necesito." (Perfect, this is what I need.)
- **Reads:** ELFA income table. At $65K for a family of 2, he's well under 110% AMI.
- **Emotion:** "FREE? Totalmente financiado?" Disbelief, then hope.
- **Key takeaway:** He needs to call Wu Yee at (844) 644-4300 — they process all ELFA tiers.
- **Action:** Saves the phone number. Then notices the header nav.

**Step 2: Explores header nav**
- **Sees:** Guía, Comparar, Bebés, Ayuda financiera (active), Guía de confianza, Buscar proveedores.
- **Thinks:** "Guía de confianza? What's that?" Clicks it.
- **Action:** Navigates to `/es/choose/`.

**Step 3: Trust Wheel hub (Spanish) — 404**
- **Sees:** Page not found or falls back to homepage.
- **Thinks:** "Hmm, broken link?"
- **Friction:** ES Trust Wheel pages don't exist yet (only EN and ZH were built). The nav link goes to `/es/choose/` which returns a 404.
- **Action:** Clicks "EN" in the lang switcher to try the English version. Gets to `/choose/`.

**Step 4: Trust Wheel hub (English)**
- **Sees:** The wheel and 8 factors. Can read enough English to navigate.
- **Scans:** "Financial Assistance" — already read about that. "Location & Convenience" — clicks it because Excelsior is far from downtown.
- **Action:** Reads the Location page. Sees Excelsior mentioned as a neighborhood with providers.

**Step 5: Back to search**
- **Action:** Clicks "Find Providers in Your Neighborhood" → `/#public`. Filters by Excelsior, Preschool age.
- **Finds:** 2 providers with openings in Excelsior, one Spanish-speaking.
- **Next step:** Will call Wu Yee on Monday to start ELFA application, then contact the Spanish-speaking provider.

### Carlos's Summary
| Metric | Rating |
|--------|--------|
| Found what he needed | Partially — ELFA info yes, Trust Wheel broken in ES |
| Time to first meaningful action | ~3 min (ELFA info found quickly) |
| Pages visited | 4 (Financial Assistance ES → Trust Wheel ES (404) → Trust Wheel EN → Location EN → registry) |
| Key conversion | ELFA phone number saved + provider search |
| Emotional arc | Hopeful → Informed → Frustrated (404) → Adapted → Active |
| Trust level | Medium-high — great financial info, but broken ES link hurts credibility |

### Friction Points
1. **CRITICAL: ES Trust Wheel pages are 404** — The header nav on all 12 ES content pages links to `/es/choose/` which doesn't exist. This is the most urgent issue. Either remove the ES Trust Wheel nav link until ES content is ready, or create placeholder ES pages that redirect to EN.
2. **Language fallback is manual** — Carlos had to manually click "EN" to get to the English Trust Wheel. There's no automatic fallback or message like "This page is not yet available in Spanish. View in English?"
3. **ELFA application process unclear** — Carlos knows to call Wu Yee, but doesn't know what documents to bring, how long the process takes, or what happens next. A "next steps" checklist would help.

---

## Cross-Persona Findings

### What Works Well
1. **Trust Wheel concept is compelling** — All 3 personas engaged with it. The survey data ("312 families") builds credibility. The visual wheel is eye-catching and the card grid below provides scannable detail.
2. **Chinese content is a differentiator** — Wei Lin found exactly what she needed in her language. Zero competitor sites offer this in Chinese for SF child care. The natural Traditional Chinese copy reads well.
3. **ELFA eligibility screener is powerful** — Both Sarah and Carlos had "wait, really?" moments discovering they qualify for free care. This is the site's strongest conversion tool.
4. **Factor pages are substantive** — Safety & Licensing gives actionable verification steps. Cultural & Language Match speaks directly to Chinese search intent. These aren't thin SEO pages — they answer real questions.
5. **Consistent header nav** — All content pages share the same nav structure, making cross-navigation intuitive.

### Critical Issues

| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| P0 | ES Trust Wheel links are 404 | Spanish-speaking users hit dead ends from every ES content page | Remove `/es/choose/` from ES nav until ES pages exist, OR create ES placeholder pages |
| P1 | Homepage is cluttered above provider listings | Users scroll through eligibility screener, video section, resources, and fairness notice before seeing a single provider | Consider moving resources below listings, or making the above-fold area more compact |
| P1 | No Chinese landing page at `/zh/` | Chinese-language Google searches can't land on a Chinese homepage | Create a minimal `/zh/index.html` that redirects to `/zh/choose/` or serves as a Chinese entry point |
| P2 | Trust Wheel is buried on homepage | It's one of 5 small resource cards — easy to miss | Consider a more prominent placement or a banner linking to Trust Wheel |
| P2 | Content page ↔ SPA transition is noticeable | Moving between static HTML pages and the React SPA feels like two different sites | Long-term: consider a unified nav component or at minimum matching the visual styling more closely |

### Recommendations (Prioritized)

**Immediate (before sharing with reviewers):**
1. Fix or remove the ES Trust Wheel nav links (currently 404)
2. Verify all cross-page links work in all 3 languages

**Short-term (before production deploy):**
3. Create ES Trust Wheel placeholder pages (even if just redirects to EN)
4. Add a `/zh/` landing page for Chinese search traffic
5. Consider a "New to child care? Start here →" banner on homepage pointing to Trust Wheel

**Medium-term (post-launch iteration):**
6. Reorganize homepage: move resources section below provider listings
7. A/B test Trust Wheel prominence on homepage
8. Add "next steps" content to Financial Assistance pages (what to bring, timeline, what to expect)
9. Track which Trust Wheel factors get the most clicks — prioritize ES translation accordingly

---

*Research conducted by walking through the staging site (staging.familychildcaresf.pages.dev) as 3 parent personas with different languages, income levels, and child care needs.*
