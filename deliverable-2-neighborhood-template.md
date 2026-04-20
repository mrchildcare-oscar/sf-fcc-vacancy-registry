# Deliverable 2: Neighborhood Landing Page Template + Sunset Sample

## Implementation Notes for Claude CLI

- Create a reusable component: `src/pages/Neighborhood.tsx`
- Use dynamic routing: `/neighborhoods/:slug`
- Content stored in a data file: `src/data/neighborhoods.ts`
- Each neighborhood gets its own entry with unique content fields
- Add all neighborhood routes to `siteRoutes.ts` for SSG pre-rendering
- Use react-helmet-async for per-neighborhood meta tags
- Include ChildCare + LocalBusiness JSON-LD per page
- Priority neighborhoods to build first: Sunset, Richmond, Excelsior, Bayview, Mission

---

## Template Structure (with variables)

### Meta Tags

```html
<title>Child Care in [Neighborhood], San Francisco — Family Child Care Homes</title>
<meta name="description" content="Find licensed family child care in [Neighborhood], San Francisco. [Primary Languages] spoken. Search current openings and check financial assistance eligibility.">
<link rel="canonical" href="https://familychildcaresf.com/neighborhoods/[slug]">
```

### Page Structure

```
H1: Child Care in [Neighborhood], San Francisco

  [Intro paragraph — UNIQUE per neighborhood, 3-4 sentences]
  Must mention: neighborhood name, demographic/language context,
  number of licensed FCC homes (if known), and ELFA participation.

H2: Find Licensed Family Child Care in [Neighborhood]

  [2 paragraphs — SEMI-UNIQUE per neighborhood]
  Describe typical offerings: hours, mixed-age groups, common languages.
  Mention proximity to schools, parks, transit if relevant.

  Structured data block:
  - Common languages offered: [Language List]
  - Typical hours: [Hours]
  - License types: Small FCC (up to 8 children), Large FCC (up to 14 children)
  - Age groups commonly served: [Age Groups]

H2: [Primary Language] Bilingual Child Care in [Neighborhood]
    (ONLY include if neighborhood has significant bilingual FCC presence)

  [1-2 paragraphs — UNIQUE]
  Explain what bilingual care actually looks like in this neighborhood.
  Name the languages, describe the cultural context.

  H3: "Where can I find [Language] bilingual daycare in [Neighborhood]?"
  [Direct answer, 2-3 sentences — this is the AEO target]

H2: Financial Assistance for [Neighborhood] Families

  [1 paragraph — SHARED template with neighborhood name inserted]
  ELFA, Head Start, CSPP, CalWORKs are citywide programs available
  to all SF residents. Many [Neighborhood] family child care homes
  participate in the ELFA network.

  → Full guide: /financial-assistance
  → Check eligibility: /eligibility

H2: Current Openings in [Neighborhood]

  [CTA block — SHARED component]
  Link to vacancy search pre-filtered by neighborhood.
  "Search [N] licensed family child care homes in [Neighborhood]"
  → Link to vacancy search with neighborhood filter applied

H2: About Family Child Care in San Francisco

  [1 paragraph — SHARED across all neighborhood pages]
  Brief explanation of what family child care is, California licensing,
  and how it differs from center-based care. Link to /sf-childcare-guide.
```

### Content Classification

| Section | Unique or Shared? | Notes |
|---|---|---|
| Meta title/description | Unique per neighborhood | Include neighborhood name + primary languages |
| H1 | Unique | "[Neighborhood], San Francisco" |
| Intro paragraph | **Unique** | Demographics, languages, FCC density, character |
| Find Licensed FCC | Semi-unique | Customize languages, transit, school references |
| Bilingual section | **Unique** (conditional) | Only for neighborhoods with significant bilingual FCC |
| Financial Assistance | Shared template | Insert [Neighborhood] name, link to /financial-assistance |
| Current Openings CTA | Shared component | Pre-filtered search link |
| About FCC | Shared | Same on all pages |

### Required Internal Links (5-8 per page)

1. `/financial-assistance` — from the financial assistance section
2. `/eligibility` — from the financial assistance section ("Check eligibility")
3. `/` (homepage/search) — from the openings CTA, filtered by neighborhood
4. `/sf-childcare-guide` — from the "About FCC" section
5. `/neighborhoods/[adjacent-neighborhood]` — cross-link to 1-2 nearby neighborhoods
6. At least one link to a provider subdomain if one exists in that neighborhood (e.g., `meplayschool.familychildcaresf.com`)
7. External: link to sfdec.org (eligibility tool)
8. External: link to relevant R&R agency (Wu Yee or Children's Council)

---

## Neighborhood Data Model

```ts
// src/data/neighborhoods.ts

export interface NeighborhoodData {
  slug: string;
  name: string;
  nameZh: string;
  primaryLanguages: string[];
  primaryLanguagesZh: string[];
  estimatedFCCCount: string; // "approximately X" — use ranges if exact unknown
  typicalAgeGroups: string;
  typicalHours: string;
  hasBilingualSection: boolean;
  bilingualLanguage?: string;
  bilingualLanguageZh?: string;
  nearbyNeighborhoods: string[]; // slugs for cross-linking
  transitNotes?: string;
  uniqueCharacter: string; // 1-2 sentence neighborhood description
  introContent: string; // full intro paragraph (English)
  introContentZh: string; // full intro paragraph (Chinese)
  bilingualContent?: string; // bilingual section content (English)
  bilingualContentZh?: string; // bilingual section content (Chinese)
  fccDescription: string; // "Find Licensed FCC" section (English)
  fccDescriptionZh: string;
}

export const neighborhoods: NeighborhoodData[] = [
  // Sunset District entry (fully written below)
  // Richmond, Excelsior, Bayview, Mission entries (to be filled)
];
```

---

## Sample: Sunset District (Fully Written)

### Meta Tags

```html
<title>Child Care in the Sunset District, San Francisco — Family Child Care Homes</title>
<meta name="description" content="Find licensed family child care in the Sunset District, San Francisco. Many Cantonese and Mandarin bilingual providers. Search openings and check ELFA eligibility.">
<link rel="canonical" href="https://familychildcaresf.com/neighborhoods/sunset">
```

---

### H1: Child Care in the Sunset District, San Francisco

The Sunset District is home to one of the highest concentrations of licensed family child care homes in San Francisco, with many providers offering bilingual care in Cantonese, Mandarin, and English. The neighborhood's residential character — quiet blocks, proximity to Golden Gate Park, and strong public transit along the N-Judah and L-Taraval lines — makes it a natural fit for home-based child care. Many Sunset family child care providers participate in the ELFA network, meaning most families in this neighborhood can access free or reduced-cost care. Whether you are looking for infant care, toddler spots, or a bilingual preschool-age program, the Sunset has more family child care options per block than almost any other San Francisco neighborhood.

---

### H2: Find Licensed Family Child Care in the Sunset District

Family child care homes in the Sunset typically serve mixed-age groups of up to 8 children (small FCC) or up to 14 children (large FCC), with a home-like environment that many families prefer for infants and toddlers. Providers in this area commonly offer full-day care from approximately 7:30 AM to 5:30 PM, Monday through Friday, though hours vary by provider.

The Sunset's family child care homes often reflect the neighborhood's strong Chinese-American community. Cantonese is the most commonly spoken second language among providers here, followed by Mandarin. Many providers also serve English-speaking families in a bilingual or English-primary setting. Meals and daily routines frequently incorporate Chinese cultural practices, including home-cooked meals with traditional ingredients.

**At a glance:**
- Common languages offered: Chinese (Cantonese), Chinese (Mandarin), English
- Typical hours: Monday–Friday, 7:30 AM – 5:30 PM
- License types: Small FCC (up to 8 children), Large FCC (up to 14 children)
- Age groups commonly served: Infants (0–18 months), Toddlers (18 months–3 years), Preschool (3–5 years)
- Transit access: N-Judah, L-Taraval, 28-19th Ave, 29-Sunset bus lines

---

### H2: Chinese Bilingual Child Care in the Sunset District

The Sunset District has the highest density of Chinese-speaking family child care providers in San Francisco. For families who want their child to grow up hearing Cantonese or Mandarin alongside English, this neighborhood offers something that few center-based programs can match: daily immersion in a bilingual home environment where the provider's native language is woven into meals, play, songs, and conversation throughout the day.

This is not the same as a "bilingual curriculum" at a large center. In a Sunset family child care home, a Cantonese-speaking provider may read stories in Cantonese, cook Chinese meals with the children, celebrate Lunar New Year and Mid-Autumn Festival as part of the daily rhythm, and communicate with Chinese-speaking grandparents who do pick-up and drop-off. For families maintaining heritage language at home, this continuity is hard to replicate elsewhere.

#### H3: Where can I find Chinese bilingual daycare in the Sunset?

The Sunset District has dozens of licensed family child care homes where Cantonese or Mandarin is spoken daily alongside English. Many of these providers participate in San Francisco's ELFA subsidy network, so bilingual care can be free or low-cost for most families. Use FamilyChildcareSF.com to search current openings in the Sunset filtered by Chinese language.

---

### H2: Financial Assistance for Sunset District Families

All San Francisco child care financial assistance programs — including Early Learning For All (ELFA), Head Start, CSPP, and CalWORKs — are available to families in the Sunset District. Many Sunset family child care homes are part of the ELFA network, which means families earning up to 200% of Area Median Income can receive free or reduced-cost care right in their neighborhood without needing to travel to a center-based program elsewhere in the city.

→ [Full guide to SF child care financial assistance](/financial-assistance)
→ [Check your eligibility now](/eligibility)

---

### H2: Current Openings in the Sunset District

Search licensed family child care homes with current vacancies in the Sunset District. Filter by age group and language to find a program that matches your family.

**[CTA BUTTON]** → Search openings in the Sunset District
*[Link to: /?neighborhood=sunset or appropriate filtered search URL]*

---

### H2: About Family Child Care in San Francisco

Family child care is licensed, home-based child care where a provider cares for a small group of children in their own home. In California, a small family child care home can serve up to 8 children, and a large family child care home can serve up to 14 children, with specific limits on the number of infants based on total enrollment. Family child care homes are regulated by the California Department of Social Services and must meet health, safety, and training requirements. For many San Francisco families — especially those with infants and toddlers — family child care offers a more intimate, consistent, and culturally aligned care option than center-based programs.

→ [Read the full SF Child Care Guide](/sf-childcare-guide)

---

## JSON-LD Schema Template

Apply this to every neighborhood page, filling in the variables:

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Child Care in [Neighborhood], San Francisco",
  "description": "Find licensed family child care in [Neighborhood], San Francisco.",
  "url": "https://familychildcaresf.com/neighborhoods/[slug]",
  "about": {
    "@type": "ChildCare",
    "name": "Family Child Care in [Neighborhood], San Francisco",
    "description": "Licensed family child care homes in the [Neighborhood] neighborhood of San Francisco, California.",
    "areaServed": {
      "@type": "City",
      "name": "San Francisco",
      "containedInPlace": {
        "@type": "State",
        "name": "California"
      }
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "San Francisco",
      "addressRegion": "CA",
      "addressCountry": "US"
    }
  },
  "isPartOf": {
    "@type": "WebSite",
    "name": "FamilyChildcareSF",
    "url": "https://familychildcaresf.com"
  }
}
```

For the bilingual question sections, add FAQ schema:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Where can I find Chinese bilingual daycare in the Sunset?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Sunset District has dozens of licensed family child care homes where Cantonese or Mandarin is spoken daily alongside English. Many participate in San Francisco's ELFA subsidy network, so bilingual care can be free or low-cost for most families."
      }
    }
  ]
}
```

---

## Neighborhood Stubs (For Future Content)

### Richmond District
- Slug: `richmond`
- Languages: Cantonese, Mandarin, Russian, English
- Character: Second-highest Chinese FCC density after Sunset; also Russian-speaking providers near Geary corridor
- Bilingual section: Yes (Chinese + Russian angle)
- Cross-links: Sunset, Chinatown-adjacent

### Excelsior District
- Slug: `excelsior`
- Languages: Spanish, Cantonese, Tagalog, English
- Character: Diverse, affordable; strong Filipino and Latino FCC community
- Bilingual section: Yes (Spanish + Tagalog angle)
- Cross-links: Bayview, Mission, Visitacion Valley

### Bayview-Hunters Point
- Slug: `bayview`
- Languages: English, Spanish
- Character: Growing ELFA participation; historically underserved; strong community organizations
- Bilingual section: Conditional (Spanish if significant FCC presence)
- Cross-links: Excelsior, Visitacion Valley

### Mission District
- Slug: `mission`
- Languages: Spanish, English
- Character: Highest concentration of Spanish-speaking FCC providers; strong community ties
- Bilingual section: Yes (Spanish)
- Cross-links: Excelsior, Bernal Heights

### Chinatown / North Beach
- Slug: `chinatown`
- Languages: Cantonese, Mandarin, English
- Character: Dense, center-heavy; fewer FCC homes but important cultural hub
- Bilingual section: Yes (Chinese)
- Cross-links: Richmond, Sunset

### Visitacion Valley
- Slug: `visitacion-valley`
- Languages: Cantonese, Tagalog, English
- Character: Quiet residential; underrecognized FCC area
- Bilingual section: Yes (Chinese + Tagalog)
- Cross-links: Bayview, Excelsior
