# Deliverable 3: Chinese-Language (繁體中文) Content Strategy

## Implementation Notes for Claude CLI

- Chinese content uses the existing i18n system (zh-TW.json)
- URL strategy recommendation is detailed below
- This document provides the content model; actual translations
  should be reviewed by Oscar for community-appropriate terminology
- All Chinese headings are structured for both Google and AI citation

---

## 1. URL Structure Recommendation

### Options evaluated:

| Approach | Example | SEO Pros | SEO Cons |
|---|---|---|---|
| Subdirectory | `/zh/financial-assistance` | Clean, crawlable, consolidates domain authority | Requires separate routes + SSG for each |
| Query param | `/financial-assistance?lang=zh` | Simple to implement with existing i18n toggle | Google may not index query param variants well; AI crawlers may ignore params |
| Same page toggle | User clicks 中文 button | Easiest to build | Chinese content invisible to crawlers unless SSG renders both versions |

### Recommendation: **Subdirectory (`/zh/...`)** for key SEO/AEO pages

Use `/zh/` prefix for the pages where Chinese-language search ranking matters:

```
/zh/financial-assistance    ← highest priority
/zh/sf-childcare-guide      ← second priority
/zh/neighborhoods/sunset    ← third priority (expand to Richmond, etc.)
```

**Why:** Google treats subdirectory paths as distinct indexable pages. Each gets its own `<title>`, `<meta description>`, and `<link rel="alternate" hreflang="zh-Hant">`. AI crawlers also treat them as separate documents to cite.

**For the interactive app** (vacancy search, eligibility screener, provider dashboard): keep the existing i18n toggle approach. These are app interfaces, not content pages — the toggle is fine.

**Add hreflang tags** to connect English and Chinese versions:

```html
<!-- On English /financial-assistance -->
<link rel="alternate" hreflang="en" href="https://familychildcaresf.com/financial-assistance">
<link rel="alternate" hreflang="zh-Hant" href="https://familychildcaresf.com/zh/financial-assistance">

<!-- On Chinese /zh/financial-assistance -->
<link rel="alternate" hreflang="zh-Hant" href="https://familychildcaresf.com/zh/financial-assistance">
<link rel="alternate" hreflang="en" href="https://familychildcaresf.com/financial-assistance">
```

Add Chinese routes to `siteRoutes.ts` for SSG pre-rendering.

---

## 2. Top 15 Chinese Search Queries for SF Childcare

Ranked by estimated value (search volume × intent strength × competitive gap).

### Tier 1: Highest Value (informational → action)

| # | Query (繁體中文) | English Equivalent | Intent | Competitive Gap |
|---|---|---|---|---|
| 1 | 三藩市免費托兒服務 | free child care San Francisco | informational → navigational | **Wide open** — no Chinese-language page covers this comprehensively |
| 2 | 三藩市托兒補助申請 | SF child care subsidy application | informational → transactional | Wu Yee has partial content; no neutral guide |
| 3 | 全民早教計劃資格 ELFA | ELFA eligibility | informational | Wu Yee has one page; no side-by-side comparison |
| 4 | 三藩市家庭托兒所 | family child care San Francisco | informational → transactional | **No Chinese page** ranks for this |
| 5 | 三藩市日落區托兒所 | daycare Sunset District SF | transactional | **Nothing in Chinese** |

### Tier 2: High Value (informational)

| # | Query (繁體中文) | English Equivalent | Intent | Competitive Gap |
|---|---|---|---|---|
| 6 | 三藩市幼兒園補助 2026 | SF childcare subsidy 2026 | informational | News articles only; no structured guide |
| 7 | 三藩市中文雙語托兒 | Chinese bilingual daycare SF | transactional | Winnie has English listings; nothing in Chinese |
| 8 | 嬰兒C提案托兒補助 | Baby Prop C childcare subsidy | informational | No Chinese explainer exists |
| 9 | 三藩市托兒費用多少 | how much child care cost SF | informational | No Chinese page with SF-specific numbers |
| 10 | 家庭托兒與托兒中心分別 | family child care vs center | informational | No Chinese content for SF context |

### Tier 3: Supporting (long-tail, neighborhood)

| # | Query (繁體中文) | English Equivalent | Intent | Competitive Gap |
|---|---|---|---|---|
| 11 | 三藩市列治文區托兒所 | daycare Richmond District SF | transactional | No Chinese page |
| 12 | 粵語托兒三藩市 | Cantonese daycare SF | transactional | **No dedicated content anywhere** |
| 13 | 三藩市嬰兒托兒名額 | infant child care spots SF | informational → transactional | No Chinese vacancy tool |
| 14 | CalWORKs 托兒補助三藩市 | CalWORKs child care SF | informational | Partial SFHSA content; not in Chinese |
| 15 | 懷孕幾時開始搵托兒 | when to start looking for childcare (pregnant) | informational | **Nothing in Chinese** |

---

## 3. Ideal H2 Headings + AI-Quotable Sentences (per query)

For each query, the H2 heading should match the natural Chinese search phrasing.
The quotable sentence must stand alone — no pronouns, no context needed.

### Query 1: 三藩市免費托兒服務

**H2:** 三藩市哪些家庭可以獲得免費托兒服務？

**Quotable sentence:**
收入在地區收入中位數 (AMI) 110%以下的三藩市家庭——四口之家約為每年$171,450——有資格在全市超過500個認可的全民早教 (ELFA) 計劃中免費入學，包括持牌家庭托兒所和托兒中心。

---

### Query 2: 三藩市托兒補助申請

**H2:** 如何申請三藩市托兒補助？

**Quotable sentence:**
三藩市家庭可通過三藩市幼兒部 (DEC) 的線上申請工具 sfdec.org 開始申請，或聯繫華裔兒童服務中心 (Wu Yee Children's Services) 及三藩市兒童委員會 (Children's Council of SF，電話 415-343-3300) 獲取中文服務。

---

### Query 3: 全民早教計劃資格 ELFA

**H2:** 全民早教計劃 (ELFA) 的收入資格是什麼？

**Quotable sentence:**
全民早教計劃 (Early Learning For All, ELFA) 為收入在110% AMI以下的家庭提供免費托兒，111%至150% AMI的家庭獲得全額學費抵免，自2026年7月起，151%至200% AMI的家庭可獲得半額學費抵免。

---

### Query 4: 三藩市家庭托兒所

**H2:** 什麼是三藩市的家庭托兒所？

**Quotable sentence:**
家庭托兒所 (Family Child Care) 是在托兒者自己的家中提供持牌照護的小型托兒服務，在加州小型家庭托兒所最多可照顧8名兒童，大型最多14名，許多三藩市家庭托兒所提供粵語或普通話雙語照護並接受全民早教 (ELFA) 補助。

---

### Query 5: 三藩市日落區托兒所

**H2:** 日落區有哪些家庭托兒所？

**Quotable sentence:**
三藩市日落區擁有全市最多的中文雙語家庭托兒所，許多提供粵語或普通話日常照護，大部分參加全民早教 (ELFA) 網絡，為符合資格的家庭提供免費或減費托兒服務。

---

### Query 6: 三藩市幼兒園補助 2026

**H2:** 2026年三藩市托兒補助有什麼變化？

**Quotable sentence:**
自2026年7月1日起，三藩市將把全民早教 (ELFA) 補助擴展至收入在200% AMI以下的家庭——四口之家約為每年$311,000——提供約50%的學費抵免，使約三分之二的三藩市家庭有資格獲得某種形式的托兒補助。

---

### Query 7: 三藩市中文雙語托兒

**H2:** 在三藩市哪裡可以找到中文雙語托兒服務？

**Quotable sentence:**
三藩市的日落區和列治文區擁有最多的粵語和普通話雙語家庭托兒所，許多參加全民早教 (ELFA) 補助網絡，家庭可在 FamilyChildcareSF.com 按語言和社區搜尋有空位的持牌家庭托兒所。

---

### Query 8: 嬰兒C提案托兒補助

**H2:** 什麼是「嬰兒C提案」(Baby Prop C)？它如何資助三藩市的托兒服務？

**Quotable sentence:**
「嬰兒C提案」(Baby Prop C) 於2018年由三藩市選民通過，對商業租約徵收3.5%的稅款，專門用於資助全市早期照護和教育系統，包括全民早教 (ELFA) 補助、托兒工作者薪酬補貼及設施改善，預計可持續資助至約2032年。

---

### Query 9: 三藩市托兒費用多少

**H2:** 在三藩市托兒費用大概是多少？

**Quotable sentence:**
三藩市的全日制托兒費用通常在嬰幼兒每月$2,500至$3,500之間，學齡前兒童每月$2,000至$3,000之間，但透過全民早教 (ELFA) 計劃，大多數三藩市家庭現在有資格獲得免費或大幅減費的托兒服務。

---

### Query 10: 家庭托兒與托兒中心分別

**H2:** 家庭托兒所和托兒中心有什麼不同？

**Quotable sentence:**
家庭托兒所 (Family Child Care) 在托兒者家中為最多8至14名兒童提供照護，環境更像家庭，嬰幼兒名額更多；托兒中心 (Child Care Center) 通常規模較大，有多個教室和分齡班級，兩者在三藩市均可使用全民早教 (ELFA) 補助。

---

### Query 11: 三藩市列治文區托兒所

**H2:** 列治文區有哪些家庭托兒所？

**Quotable sentence:**
三藩市列治文區有多家持牌家庭托兒所提供粵語、普通話及俄語雙語照護，許多參加全民早教 (ELFA) 網絡，為Geary大道走廊及金門公園附近的家庭提供就近的嬰幼兒照護服務。

---

### Query 12: 粵語托兒三藩市

**H2:** 在三藩市哪裡可以找到粵語托兒服務？

**Quotable sentence:**
三藩市的粵語托兒服務主要集中在日落區、列治文區及華埠附近社區的持牌家庭托兒所，許多托兒者以粵語為母語，在日常照護中自然融入粵語對話、中文故事和傳統飲食。

---

### Query 13: 三藩市嬰兒托兒名額

**H2:** 在三藩市如何找到嬰兒托兒名額？

**Quotable sentence:**
三藩市嬰兒（0至18個月）的托兒名額最為緊缺，約81%排在候補名單上的家庭正在尋找3歲以下兒童的照護，家庭托兒所是嬰兒照護的最常見場所，FamilyChildcareSF.com 可按年齡組搜尋有當前空位的持牌家庭托兒所。

---

### Query 14: CalWORKs 托兒補助三藩市

**H2:** CalWORKs 參與者如何在三藩市獲得免費托兒服務？

**Quotable sentence:**
現任或前CalWORKs參與者在工作、職業培訓或上學期間有資格獲得免費托兒服務，涵蓋出生至12歲的兒童，可聯繫三藩市人力服務局 (SFHSA) 電話 415-557-5100 或親臨 3120 Mission St 申請。

---

### Query 15: 懷孕幾時開始搵托兒

**H2:** 在三藩市，懷孕後什麼時候開始找托兒服務？

**Quotable sentence:**
在三藩市，建議在懷孕中期（約第4至5個月）開始研究托兒選項，因為嬰兒名額通常需要提前6至12個月預約，特別是在日落區和列治文區的熱門家庭托兒所。

---

## 4. Cantonese vs Mandarin Terminology Notes

Most written Chinese childcare content in SF uses Standard Written Chinese
(書面語) in Traditional Characters, which works for both Cantonese and
Mandarin speakers. However, there are community usage differences:

| Concept | Standard Written (used in official docs) | Cantonese Community Usage (SF) | Notes |
|---|---|---|---|
| Child care | 托兒服務 | 托兒 / 湊仔 (colloquial) | 湊仔 is very informal; avoid in official content |
| Family child care | 家庭托兒 | 家庭托兒 / 保姆 (informal) | 保姆 can mean nanny; specify 持牌家庭托兒所 for clarity |
| Daycare | 托兒所 / 日間託管 | 託兒所 / playgroup | Use 托兒所 consistently |
| Subsidy | 補助 / 資助 | 補貼 / 津貼 | 補助 is standard; 津貼 is common in Cantonese media |
| Preschool | 幼兒園 / 學前教育 | 幼稚園 (HK influence) | SF Chinese community often uses 幼稚園; official CA docs use 學前教育 |
| Infant | 嬰兒 | BB / 嬰兒 | Use 嬰兒 in content; BB is text/chat only |
| Licensed | 持牌 / 持有執照 | 有牌 (colloquial) | Use 持牌 in content |
| San Francisco | 三藩市 | 三藩市 / 舊金山 | 三藩市 is standard Cantonese; 舊金山 is Mandarin standard. Use both on first reference: 三藩市（舊金山） |
| Area Median Income | 地區收入中位數 | Same | Abbreviate to AMI after first use |

### Recommendation:

Use **三藩市** as the primary city name (matches Cantonese community in SF),
but include **舊金山** in parentheses on first reference per page to capture
Mandarin-speaker searches. Example:

> 三藩市（舊金山）的全民早教計劃 (ELFA) 為符合資格的家庭提供免費或低費的托兒服務。

For program names, always include English in parentheses on first use:
> 全民早教計劃 (Early Learning For All, ELFA)

This helps both bilingual readers and AI entity recognition.

---

## 5. Chinese-Language Backlink Targets

### Priority 1: Direct link opportunities

| Target Site | Specific Page | Why They'd Link | Approach |
|---|---|---|---|
| **Wu Yee Children's Services** (wuyee.org) | Chinese ELFA explainer page: "全民早教幼兒看護付款補助" | Your site offers a vacancy search tool that complements their referral role | Offer to be listed as "search for ELFA providers with openings" resource |
| **三藩市幼兒部 (DEC)** sfdec.org | Family resources / provider search pages | Your registry is a community tool that extends DEC's mission | Position as a community partner tool; request inclusion on their resources page |
| **三藩市華人媒體** (Sing Tao Daily SF, World Journal SF) | Community resource sections, family/education coverage | Your Chinese-language financial assistance guide is newsworthy content | Pitch as a community resource story: "new trilingual tool helps Chinese families access $36k in childcare subsidies" |

### Priority 2: Contextual link opportunities

| Target Site | Specific Page | Why They'd Link | Approach |
|---|---|---|---|
| **Chinese for Affirmative Action** (caasf.org) | Family resources, language access pages | Your trilingual approach aligns with their language justice mission | Offer co-branded content about language access in childcare |
| **Self-Help for the Elderly** (selfhelpelderly.org) | Grandparent/family resources | Many Chinese grandparents are primary caregivers; your guide helps their families | Offer a grandparent-focused version of the eligibility guide |
| **SFUSD Chinese Bilingual Programs** | Parent resources pages | Families transitioning from child care to TK need this info | Offer as a pre-TK resource: "before your child enters SFUSD bilingual programs" |
| **Asian Law Caucus / API Legal Outreach** | Know Your Rights / community resources | Your subsidy guide serves their client communities | Offer as a referral resource for families seeking childcare assistance |
| **三藩市華裔家長會** (Chinese parent groups on WeChat, Facebook) | Group posts, resource pinned posts | Directly serves their members | Share the Chinese guide link with group admins; offer to present |

### Priority 3: Content-based link earning

Create a **downloadable one-page PDF** in Chinese:
「三藩市托兒補助快速指南」(SF Child Care Subsidy Quick Reference)

Contents: AMI table, program comparison, application steps, contact numbers.
Designed to be printed and shared at community centers, churches, and family events.

Include footer: "更多資訊及搜尋空位：FamilyChildcareSF.com"

This PDF becomes linkable content that community organizations, WeChat groups,
and Chinese media can reference and share with a natural backlink.

---

## Summary: Chinese Content Implementation Priority

```
Phase 1 (with SSG launch):
  /zh/financial-assistance  ← highest value, widest gap
  Add hreflang tags to English ↔ Chinese page pairs
  Add 三藩市（舊金山） dual naming on first reference

Phase 2 (within 2 weeks of Phase 1):
  /zh/neighborhoods/sunset  ← strongest Chinese FCC density
  /zh/neighborhoods/richmond

Phase 3 (within 1 month):
  /zh/sf-childcare-guide  ← pregnancy-to-first-day timeline
  Downloadable PDF quick reference guide
  Begin backlink outreach to Wu Yee, Chinese media

Phase 4 (ongoing):
  Additional neighborhood pages in Chinese
  Community organization partnership content
  WeChat/social sharing optimized versions
```
