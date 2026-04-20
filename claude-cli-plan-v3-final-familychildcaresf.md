# Claude CLI Plan v3 (Final): SEO + AEO for familychildcaresf.com Ecosystem

## Architecture (Confirmed)

```
familychildcaresf.com ──┐
                        ├── SAME APP (sf-fcc-vacancy-registry)
beta.familychildcaresf.com ──┘
    │
    │   React 18 + TypeScript + Vite + Supabase + Tailwind
    │   Trilingual: EN / ES / 繁體中文
    │   Deployed on BOTH Vercel AND Cloudflare Pages
    │   Pure client-side SPA — NO SSR/SSG currently
    │   Already has: eligibility screener (ELFA, Head Start, CSPP, CalWORKs)
    │
    └── Repo: github.com/mrchildcare-oscar/sf-fcc-vacancy-registry

meplayschool.familychildcaresf.com
    │   Lovable-generated template (separate codebase)
    │   React + Vite on Vercel
    │   Returns <title>Lovable App</title> to crawlers
    │
    └── Repo: (separate, TBD)
```

### Key Insight

The eligibility screener already contains the financial assistance content —
ELFA thresholds, Head Start, CSPP, CalWORKs. This is high-value SEO/AEO
content that is currently invisible to every crawler. The job is NOT to
write new content. The job is to SURFACE what's already built.

---

## Problem 1: Domain Split

familychildcaresf.com and beta.familychildcaresf.com serve the same app
from two different hosts. This creates SEO problems:

- Search engines may index both, splitting authority
- No canonical tag tells crawlers which one is primary
- Backlinks may point to either domain

### Fix

Pick ONE canonical domain. Recommendation: **familychildcaresf.com**
(shorter, cleaner, no "beta" signal to search engines).

```
familychildcaresf.com        → canonical (primary)
beta.familychildcaresf.com   → 301 redirect to familychildcaresf.com
                                OR: add <link rel="canonical" href="https://familychildcaresf.com/...">
```

If you're not ready to retire the beta subdomain, at minimum add a
canonical tag on every page of beta pointing to familychildcaresf.com.

Claude CLI task:
```bash
# In index.html, add:
<link rel="canonical" href="https://familychildcaresf.com">

# Or dynamically in React with react-helmet-async:
<Helmet>
  <link rel="canonical" href={`https://familychildcaresf.com${location.pathname}`} />
</Helmet>
```

---

## Problem 2: Empty HTML Shell

This is the #1 blocker. The app returns an empty <div id="root"></div>
to crawlers. All content — vacancy listings, eligibility screener,
provider search — only appears after JavaScript execution.

### Fix: Add SSG Build Step

Since this is Vite + React Router, add static pre-rendering at build time.

Claude CLI tasks (in order):

### 2a. Install dependencies

```bash
npm install react-helmet-async react-router-dom
# react-router-dom may already be installed — check package.json
# Also need: react-dom/server (comes with react-dom)
```

### 2b. Add react-helmet-async to the app

Wrap the app with HelmetProvider (once, at the top level).
Add <Helmet> to every route/page with unique title + description.

```tsx
// src/App.tsx (or wherever the app root is)
import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <HelmetProvider>
      {/* existing app content */}
    </HelmetProvider>
  );
}
```

Per-page example:
```tsx
import { Helmet } from 'react-helmet-async';

function PublicListings() {
  return (
    <>
      <Helmet>
        <title>Find Family Child Care in San Francisco — Current Openings</title>
        <meta name="description" content="Search licensed family child care providers with current vacancies in San Francisco. Filter by neighborhood, age group, and language." />
      </Helmet>
      {/* existing component */}
    </>
  );
}
```

Key pages to tag (audit src/ routes to find all):

| Route | Title | Description focus |
|-------|-------|------------------|
| `/` | Find Family Child Care in San Francisco — Current Openings | Search vacancies, neighborhood, age, language |
| `/eligibility` (or wherever screener lives) | SF Child Care Financial Assistance — Check Your Eligibility | ELFA, Head Start, free/reduced care |
| `/provider/*` | Provider Dashboard (noindex — behind auth) | N/A |

### 2c. Create route registry

```ts
// src/data/siteRoutes.ts
export const siteRoutes = [
  {
    path: '/',
    title: 'Find Family Child Care in San Francisco — Current Openings',
    description: 'Search licensed family child care providers with current vacancies in San Francisco. Filter by neighborhood, age group, language, and schedule.',
    priority: 1.0,
    changefreq: 'daily',
  },
  {
    path: '/eligibility', // adjust to actual route
    title: 'SF Child Care Financial Assistance — Check Your Eligibility',
    description: 'Most SF families qualify for free or reduced-cost child care. Check eligibility for Early Learning For All, Head Start, CSPP, and CalWORKs.',
    priority: 0.9,
    changefreq: 'monthly',
  },
  // Add all public-facing routes
  // Do NOT include auth-protected routes (provider dashboard, roster, etc.)
];
```

### 2d. Create server entry point

```tsx
// src/entry-server.tsx
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

export function render(url: string) {
  const helmetContext = {} as any;

  // Polyfill browser globals that components might reference
  if (typeof window === 'undefined') {
    (global as any).window = {};
    (global as any).localStorage = { getItem: () => null, setItem: () => {} };
  }

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </HelmetProvider>
  );

  const { helmet } = helmetContext;
  return { html, helmet };
}
```

**Important:** The app uses Supabase for data. During SSG, Supabase calls
will fail or return empty. That's OK — the SSG output provides the page
shell, meta tags, headings, and static text. Dynamic data (vacancy listings)
hydrates on the client after JS loads. This is the standard pattern.

Components that fetch data should handle the SSR case gracefully:
- Show loading states or placeholder text in the initial render
- Fetch actual data in useEffect (client-only)

### 2e. Create SSG build script

```js
// scripts/build-ssg.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Import the route registry
// (this needs to be built first by Vite SSR build)

async function buildSSG() {
  // 1. Read the built index.html template
  const template = readFileSync(resolve(__dirname, '../dist/index.html'), 'utf-8');

  // 2. Import the server entry (built by Vite SSR)
  const { render } = await import(resolve(__dirname, '../dist-server/entry-server.js'));

  // 3. Routes to pre-render (from siteRoutes)
  const routes = ['/', '/eligibility']; // expand as needed

  for (const route of routes) {
    const { html, helmet } = render(route);

    // 4. Inject rendered HTML and head tags into template
    let page = template;

    // Replace <div id="root"></div> with rendered content
    page = page.replace(
      '<div id="root"></div>',
      `<div id="root">${html}</div>`
    );

    // Inject helmet tags into <head>
    if (helmet) {
      page = page.replace(
        '</head>',
        `${helmet.title?.toString() || ''}
         ${helmet.meta?.toString() || ''}
         ${helmet.link?.toString() || ''}
         </head>`
      );
    }

    // 5. Write to dist
    const outDir = route === '/'
      ? resolve(__dirname, '../dist')
      : resolve(__dirname, `../dist${route}`);

    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      resolve(outDir, 'index.html'),
      page
    );

    console.log(`Pre-rendered: ${route}`);
  }
}

buildSSG().catch(console.error);
```

### 2f. Update Vite config for SSR build

```ts
// Add to vite.config.ts or create a separate vite.config.ssr.ts
// The SSR build compiles entry-server.tsx for Node.js

// In package.json, add build scripts:
// "build:client": "vite build",
// "build:server": "vite build --ssr src/entry-server.tsx --outDir dist-server",
// "build:ssg": "node scripts/build-ssg.mjs",
// "build": "npm run build:client && npm run build:server && npm run build:ssg"
```

### 2g. Update main.tsx for hydration

```tsx
// src/main.tsx
import { hydrateRoot, createRoot } from 'react-dom/client';

const container = document.getElementById('root')!;

// If server-rendered content exists, hydrate; otherwise create fresh
if (container.innerHTML.trim().length > 0) {
  hydrateRoot(container, <App />);
} else {
  createRoot(container).render(<App />);
}
```

### 2h. Handle Supabase in SSR gracefully

The biggest gotcha: components that call Supabase on mount will break
during server-side rendering. Claude CLI should audit all components for:

```tsx
// Pattern to find:
useEffect(() => {
  supabase.from('...').select('...')  // This is fine — useEffect is client-only
}, []);

// Pattern that WILL break in SSR:
const { data } = useSWR(...)  // If data fetching happens during render
// or top-level await/fetch outside useEffect
```

**Rule:** All Supabase calls must be inside useEffect or event handlers.
If any are at the component top level, wrap them in useEffect.

### 2i. Verify

```bash
# After build:
cat dist/index.html | grep -E "<title>|<meta name=\"description\""
# Should show real title and description, not "Lovable App" or empty

cat dist/index.html | grep -c "<h1\|<h2\|<p>"
# Should be > 0

# After deploy:
curl -s https://familychildcaresf.com | head -80
# Should show rendered HTML content in the body
```

---

## Problem 3: No robots.txt or sitemap

### Fix

```
# public/robots.txt
User-agent: *
Allow: /

# Block auth-protected routes from crawling
Disallow: /provider/
Disallow: /dashboard/
Disallow: /roster/
Disallow: /login
Disallow: /signup

Sitemap: https://familychildcaresf.com/sitemap.xml

# Explicitly allow AI crawlers
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
```

### Sitemap generation

Create a build-time script that reads siteRoutes.ts and outputs sitemap.xml
to the `dist/` directory. Include only public routes.

---

## Problem 4: Navigation Not Crawlable

Claude CLI should search the codebase for programmatic navigation:

```bash
grep -rn "navigate(" src/ --include="*.tsx" --include="*.ts"
grep -rn "useNavigate" src/ --include="*.tsx" --include="*.ts"
grep -rn "window.location" src/ --include="*.tsx" --include="*.ts"
```

Convert public-facing navigation to <Link> components:

```tsx
// BEFORE (invisible to crawlers)
<button onClick={() => navigate('/eligibility')}>
  Check Eligibility
</button>

// AFTER (crawlable)
<Link to="/eligibility">Check Eligibility</Link>
```

Auth-protected routes (provider dashboard, roster) can stay as navigate().

---

## Problem 5: Eligibility Screener Content is AEO Gold — But Trapped

The eligibility screener already has the answers to high-intent questions:
- "Who qualifies for free child care in San Francisco?"
- "How much does child care cost in SF?"
- "How do I apply for ELFA?"

Right now this content only appears after JS execution AND user interaction
with the screener UI. Crawlers and AI systems never see it.

### Fix: Create a Static Content Version

Add a `/financial-assistance` route that presents the same information
as static, crawlable HTML — not behind an interactive form.

This is NOT a replacement for the screener. It's a parallel page:
- `/eligibility` → interactive screener tool (existing, keeps working)
- `/financial-assistance` → static content page (new, for SEO/AEO)

Content structure (answer-first, Q&A format for AEO):

```tsx
// src/pages/FinancialAssistance.tsx

<Helmet>
  <title>SF Child Care Financial Assistance — Early Learning For All Guide</title>
  <meta name="description" content="Most San Francisco families qualify for free or reduced-cost child care. Check eligibility for ELFA, Head Start, CSPP, and CalWORKs." />
</Helmet>

<h1>Child Care Financial Assistance in San Francisco</h1>

<h2>Who qualifies for free child care in San Francisco?</h2>
<p>Families earning up to 110% of Area Median Income (~$171,450/year
for a family of four) qualify for free enrollment at approved
Early Learning For All (ELFA) programs.</p>

<h2>What if my family earns more?</h2>
<p>111%–150% AMI (~$233,800/year for a family of four): tuition credit
equal to 100% of the full-time ELFA reimbursement rate.</p>
<p>Starting July 1, 2026: 151%–200% AMI (~$311,000/year for a family
of four) will receive a half tuition credit.</p>

<h2>How do I apply?</h2>
<p>Start at sfdec.org. Or contact Wu Yee Children's Services (wuyee.org)
or Children's Council of SF (childrenscouncil.org, 415-343-3300).</p>

<h2>Requirements</h2>
<ul>
  <li>Must be San Francisco resident</li>
  <li>Must enroll at an approved ELFA network provider (500+ programs)</li>
  <li>Deposits to hold spots not permitted under ELFA</li>
</ul>

<h2>Other programs</h2>
<h3>CalWORKs</h3>
<p>Free child care for current/former CalWORKs participants. SFHSA: 415-557-5100</p>
<h3>Head Start</h3>
<p>Free for CalFresh-eligible families.</p>
<h3>CA State Preschool (CSPP)</h3>
<p>State-funded preschool for income-eligible 3-4 year olds.</p>

<!-- CTA to interactive screener -->
<Link to="/eligibility">→ Check your eligibility now</Link>

<!-- Trilingual: same content in ES and ZH-TW -->
```

This page should be:
- In siteRoutes.ts (gets pre-rendered by SSG)
- Linked from the homepage
- Linked from provider template pages
- Included in sitemap.xml

### Add FAQ structured data

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Who qualifies for free child care in San Francisco?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "San Francisco families earning up to 110% of Area Median Income (~$171,450/year for a family of four) qualify for free enrollment at approved Early Learning For All programs."
      }
    },
    {
      "@type": "Question",
      "name": "How do I apply for child care assistance in San Francisco?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Start at sfdec.org or contact Wu Yee Children's Services or Children's Council of San Francisco (415-343-3300)."
      }
    },
    {
      "@type": "Question",
      "name": "How much does child care cost in San Francisco?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Full-time child care in SF typically costs $2,500–$3,000+ per month. However, most families now qualify for free or reduced-cost care through the city's Early Learning For All program."
      }
    }
  ]
}
</script>
```

---

## Problem 6: meplayschool Template (Parallel Track)

While fixing the main domain, simultaneously:

### 6a. Clean Lovable residue

```bash
# In the meplayschool repo:
grep -r "Lovable" . --include="*.html" --include="*.tsx" --include="*.json"
# Replace <title>Lovable App</title> with real title
# Remove any Lovable tracking/analytics
```

### 6b. Add real meta tags

```html
<title>Me Playschool — Family Child Care in San Francisco</title>
<meta name="description" content="Licensed family child care in San Francisco.
Most SF families qualify for free or reduced tuition through Early Learning For All.">
<link rel="canonical" href="https://meplayschool.familychildcaresf.com">
```

### 6c. Add provider-specific content (crawlable HTML)

- Ages served, neighborhood, hours, languages, ELFA status, openings
- Short subsidy summary (< 100 words) linking to
  familychildcaresf.com/financial-assistance

### 6d. Add ChildCare JSON-LD

### 6e. Apply same SSG approach if template has multiple routes
      (or just fix the index.html if it's a single page)

### 6f. Add robots.txt + sitemap.xml

---

## Problem 7: Internal Linking (Connects the Ecosystem)

After both sites have crawlable content:

```
familychildcaresf.com
  ├── / (vacancy search) → links to /financial-assistance
  │                      → links to /eligibility
  ├── /financial-assistance (static guide) → links to /eligibility
  │                                        → links to provider sites
  ├── /eligibility (interactive screener)
  └── footer: link to meplayschool.familychildcaresf.com (and future providers)

meplayschool.familychildcaresf.com
  ├── links to familychildcaresf.com/financial-assistance
  └── links to familychildcaresf.com (directory/search)
```

---

## Cloudflare Pages Consideration

Since the app is deployed on BOTH Vercel and Cloudflare Pages:

1. **Check Cloudflare "Block AI Scrapers and Crawlers" setting** —
   if enabled, it blocks GPTBot, ClaudeBot, etc. even if robots.txt allows them.
   This setting overrides everything else. Turn it OFF.

2. **Ensure the SSG output works on both platforms.** Vite's dist/ folder
   should deploy identically to both. Verify with curl on both domains
   after deploy.

3. **Long term:** Consider consolidating to one host to simplify deployment.
   Vercel has native Vite support and analytics already integrated.

---

## Claude CLI Execution Sequence

```
# PHASE A: Audit & Setup (30 min)
1.  Clone sf-fcc-vacancy-registry
2.  Read package.json — confirm dependencies
3.  Read vite.config.ts — check for any existing SSR config
4.  Read src/ route structure — map all public vs auth routes
5.  Read index.html — confirm empty shell
6.  Find where eligibility screener content lives (components, i18n JSON)

# PHASE B: Crawlability Fix — Main Domain (2-3 hours)
7.  Install react-helmet-async
8.  Add HelmetProvider to app root
9.  Add <Helmet> with unique title/description to each public route
10. Add <link rel="canonical"> pointing to familychildcaresf.com
11. Create src/data/siteRoutes.ts
12. Create src/entry-server.tsx
13. Create scripts/build-ssg.mjs
14. Update package.json build scripts
15. Update src/main.tsx for hydration
16. Audit all components for SSR-unsafe patterns (top-level Supabase calls)
17. Add public/robots.txt
18. Add sitemap generation to build
19. Convert public navigate() calls to <Link>
20. Build and verify locally: check dist/index.html for real content

# PHASE C: Content — Financial Assistance Page (1-2 hours)
21. Create /financial-assistance route and component
22. Pull content from existing eligibility screener + i18n files
23. Structure as answer-first Q&A (trilingual)
24. Add FAQPage JSON-LD
25. Add to siteRoutes.ts
26. Link from homepage and eligibility screener

# PHASE D: meplayschool Template (1-2 hours, parallel)
27. Clone meplayschool repo
28. Clean Lovable residue (title, analytics, manifest)
29. Add real meta tags
30. Add provider-specific content
31. Add short subsidy summary linking to hub
32. Add ChildCare JSON-LD
33. Add robots.txt + sitemap.xml
34. Apply SSG if multi-page, or fix index.html if single-page

# PHASE E: Linking & Launch (1 hour)
35. Add internal links between main domain and provider template
36. Deploy both sites
37. Verify with curl on both domains
38. Check Cloudflare AI bot blocking setting
39. Submit sitemaps to Google Search Console
40. Submit to Bing Webmaster Tools
41. Request indexing for priority pages
```

---

## Expected Outcomes

### Immediate (after deploy)
- Crawlers see real HTML content on both domains
- Real <title> and <meta description> on every page
- Sitemaps submitted and indexing requested

### 2-4 weeks
- Pages begin appearing in Google/Bing index
- Social sharing shows real previews (OG tags)
- Google Search Console shows impressions

### 2-3 months
- /financial-assistance ranks for "SF child care financial assistance"
- Homepage ranks for "family child care San Francisco"
- AI systems begin citing familychildcaresf.com for SF childcare queries

### Long term
- Each provider subdomain ranks for "[provider name] child care SF"
- AI tools cite the vacancy registry and financial assistance guide
- The ecosystem outranks Yelp/Winnie for specific SF FCC queries

---

## What This Plan Does NOT Cover (Future Work)

- Next.js migration (not needed now; revisit when provider network > 10 sites)
- Dynamic SSR for vacancy data (ISR would keep listings fresh for crawlers —
  worth doing later but SSG + client hydration works for now)
- Google Business Profile integration
- Backlink acquisition strategy
- Provider onboarding workflow for the template service
- Pricing page for Mr Childcare LLC
