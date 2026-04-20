# Deliverable 1: /financial-assistance Page Content Spec

## Implementation Notes for Claude CLI

- This is a new route in the sf-fcc-vacancy-registry app
- Create as `src/pages/FinancialAssistance.tsx`
- Add to React Router config and to `siteRoutes.ts`
- Use react-helmet-async for all meta tags
- Render trilingual using existing i18n context (en.json, es.json, zh-TW.json)
- All content below should be added to the i18n JSON files
- Mark this route for SSG pre-rendering in build-ssg.mjs
- Add FAQPage JSON-LD as a `<script type="application/ld+json">` in the component

---

## Meta Tags

```html
<!-- English -->
<title>SF Child Care Financial Assistance — ELFA, Head Start, CSPP, CalWORKs Guide</title>
<meta name="description" content="Most San Francisco families qualify for free or reduced-cost child care. Check eligibility for Early Learning For All (ELFA), Head Start, CSPP, and CalWORKs. Updated 2026.">
<link rel="canonical" href="https://familychildcaresf.com/financial-assistance">

<!-- Chinese (when lang=zh-TW) -->
<title>三藩市托兒補助指南 — 全民早教(ELFA)、Head Start、CSPP、CalWORKs</title>
<meta name="description" content="大多數三藩市家庭有資格獲得免費或低費托兒服務。了解全民早教計劃(ELFA)、Head Start、CSPP及CalWORKs的申請資格。2026年更新。">
```

---

## English Content

### H1: Child Care Financial Assistance in San Francisco

**Intro paragraph (2-3 sentences, dense, AI-quotable):**

San Francisco offers some of the most generous child care subsidies in the United States, funded primarily by Baby Prop C (2018). Through the Early Learning For All (ELFA) program administered by the San Francisco Department of Early Childhood (DEC), families earning up to 200% of Area Median Income can receive free or reduced-cost child care at over 500 approved programs, including licensed family child care homes. Multiple additional programs — Head Start, California State Preschool (CSPP), and CalWORKs child care — serve families at different income levels and life situations.

---

### H2: Can I Get Free or Low-Cost Child Care in San Francisco?

**AI-quotable sentence:**
Most San Francisco families with children ages 0–5 now qualify for some level of child care financial assistance, with families of four earning up to approximately $311,000 per year eligible for subsidies as of 2026.

**Subsidy tiers (render as a styled info block, not just text):**

| Your family income (family of 4) | What you qualify for | Effective |
|---|---|---|
| Up to ~$171,450/year (110% AMI) | FREE enrollment — full tuition covered at any ELFA program | Now |
| ~$171,450–$233,800/year (111%–150% AMI) | Tuition credit equal to 100% of the full-time ELFA reimbursement rate | Now |
| ~$233,800–$311,000/year (151%–200% AMI) | Half tuition credit — approximately 50% of full-time ELFA rate | July 1, 2026 |

**Requirements (brief list):**
- Must be a San Francisco resident
- Child must be ages 0–5 (before kindergarten entry)
- Must enroll at a program in the approved ELFA network
- Note: deposits to hold a spot are not permitted under ELFA rules

---

### H2: Programs That Pay for Child Care in San Francisco

#### H3: Early Learning For All (ELFA)

**AI-quotable sentence:**
Early Learning For All (ELFA) is San Francisco's citywide child care subsidy program, funded by Baby Prop C and administered by the Department of Early Childhood (DEC), providing free or reduced-cost care at over 500 licensed child care centers and family child care homes across the city.

- Serves children ages 0–5
- Income eligibility based on Area Median Income (AMI), updated annually
- Both child care centers and licensed family child care homes participate
- Families apply through DEC's online tool at sfdec.org or through a Resource & Referral agency (Wu Yee Children's Services or Children's Council of SF)
- Funded by Baby Prop C revenue; current funding projected through approximately 2032

#### H3: Head Start and Early Head Start

**AI-quotable sentence:**
Head Start provides free child care and preschool to San Francisco families receiving CalFresh benefits or meeting federal poverty guidelines, serving children from birth through age 5 at centers and some family child care homes.

- Birth to age 5 (Early Head Start: birth to 3; Head Start: 3–5)
- Free for eligible families — no tuition or copays
- Federal poverty guidelines apply (lower income threshold than ELFA)
- Includes comprehensive services: health screenings, nutrition, family support
- Apply through SFHSA or local Head Start delegate agencies

#### H3: California State Preschool Program (CSPP)

**AI-quotable sentence:**
The California State Preschool Program (CSPP) offers state-funded preschool for income-eligible children ages 3–4 in San Francisco, available at selected centers and some family child care homes, with priority for families below 85% of the State Median Income.

- Ages 3–4 (primarily pre-kindergarten year)
- State-funded; income eligibility based on State Median Income
- Part-day and full-day options depending on site
- Available at SFUSD Early Education Schools and some community-based programs

#### H3: CalWORKs Child Care (Stages 1–3)

**AI-quotable sentence:**
CalWORKs child care provides free child care to current and former CalWORKs (welfare-to-work) participants in San Francisco while they are working, in job training, or attending school, covering care from birth through age 12.

- For current or former CalWORKs participants
- Covers child care while working, training, or in school
- Three stages: Stage 1 (county-administered), Stage 2 (transitional), Stage 3 (post-CalWORKs)
- Birth through age 12
- Contact SFHSA: 415-557-5100 or visit 3120 Mission St

#### H3: Transitional Kindergarten (TK)

**AI-quotable sentence:**
California's Transitional Kindergarten (TK) is a free, public school program for children turning 4 by September 1, available at SFUSD schools throughout San Francisco with no income requirement.

- Free, universal — no income requirement
- For children turning 4 by September 1 of the school year
- Operated by SFUSD
- Not a subsidy program — it is public school

---

### H2: Side-by-Side Comparison Table

**[RENDER AS A STYLED TABLE COMPONENT]**

| Program | Ages | Income Eligibility | Covers Family Child Care? | Who Administers | Where to Apply |
|---|---|---|---|---|---|
| **ELFA** | 0–5 | Up to 200% AMI (~$311k for family of 4) | Yes — 500+ programs including FCC homes | SF Dept of Early Childhood (DEC) | sfdec.org or Wu Yee / Children's Council |
| **Head Start** | 0–5 | Federal poverty guidelines / CalFresh | Some sites | Federal (local delegates) | SFHSA or local agencies |
| **CSPP** | 3–4 | Below 85% State Median Income | Some sites | CA Dept of Education (local sites) | Individual program sites |
| **CalWORKs** | 0–12 | CalWORKs participants | Yes | SFHSA | 415-557-5100 / 3120 Mission St |
| **TK** | Turning 4 by Sept 1 | None — universal | No (school-based only) | SFUSD | SFUSD enrollment |

---

### H2: Example Families — What Would I Qualify For?

#### H3: Example 1: Single parent, one toddler, earning $65,000/year

This family is well under 110% AMI. They qualify for **fully free enrollment** at any ELFA program. If their child is under 3, they should look for family child care homes with infant/toddler openings, as these are the most common setting for this age group. Estimated annual subsidy value: approximately $36,000.

#### H3: Example 2: Two parents, one infant, household income $180,000/year

This family is above 110% AMI but below 150% AMI. They qualify for a **full tuition credit** at ELFA programs — meaning most or all of their child care costs are covered. Many family child care homes in the Sunset and Richmond districts serve this income bracket and offer Cantonese or Mandarin bilingual care.

#### H3: Example 3: Two parents, two children (ages 1 and 4), household income $280,000/year

This family is between 150% and 200% AMI. Starting July 1, 2026, they will qualify for a **half tuition credit** — approximately 50% off ELFA rates. For two children, this could save the family over $18,000 per year. Their 4-year-old may also be eligible for free Transitional Kindergarten through SFUSD.

---

### H2: How to Check If You Qualify

#### H3: 1. Use an Online Eligibility Screener

The San Francisco Department of Early Childhood offers an online application tool at sfdec.org where you can answer a few questions about your family size and income to see which programs you may be eligible for. FamilyChildcareSF.com also offers a quick eligibility screener that checks ELFA, Head Start, CSPP, and CalWORKs in one step.

#### H3: 2. Confirm Your Residency and Income

You will need to provide proof of San Francisco residency (lease, utility bill, or similar) and proof of income (recent pay stubs, tax return, or employer letter). DEC's enrollment partners can help you gather the right documents.

#### H3: 3. Contact a Resource & Referral Agency

Two agencies are contracted by DEC to help families find eligible programs and complete enrollment:
- **Wu Yee Children's Services:** wuyee.org
- **Children's Council of San Francisco:** childrenscouncil.org | 415-343-3300

Both offer assistance in English, Spanish, and Chinese.

#### H3: 4. Search for Programs with Openings

Use FamilyChildcareSF.com to search licensed family child care homes with current vacancies. Filter by neighborhood, age group, and language to find programs that match your family's needs and participate in ELFA.

---

### H2: Frequently Asked Questions

**[APPLY FAQPage JSON-LD TO ALL Q&A PAIRS BELOW]**

#### H3: Who qualifies for free child care in San Francisco?

San Francisco families earning up to 110% of Area Median Income — approximately $171,450 per year for a family of four — qualify for fully free enrollment at over 500 approved Early Learning For All (ELFA) programs, including licensed family child care homes.

#### H3: Can middle-income families get child care help in San Francisco?

Yes. As of 2026, families earning up to 150% AMI (approximately $233,800 for a family of four) receive a tuition credit covering the full ELFA reimbursement rate. Starting July 1, 2026, families up to 200% AMI (approximately $311,000) will receive a half tuition credit.

#### H3: Does San Francisco subsidize family child care homes, not just centers?

Yes. Over 500 programs participate in the ELFA network, and this includes licensed family child care homes across every San Francisco neighborhood. Family child care homes are especially common for infant and toddler care, where center-based slots are scarce.

#### H3: How much does child care cost in San Francisco without subsidies?

Full-time child care in San Francisco typically costs between $2,500 and $3,500 per month for infants and toddlers, and $2,000 to $3,000 per month for preschool-age children, depending on the program type and location.

#### H3: How do I apply for the ELFA program?

Start at sfdec.org using the Department of Early Childhood's online application tool, or contact Wu Yee Children's Services (wuyee.org) or Children's Council of San Francisco (childrenscouncil.org, 415-343-3300) for personalized help finding a program and completing enrollment.

#### H3: How long does it take to get child care subsidies in San Francisco?

Processing times vary, but families should expect 2–4 weeks from application to enrollment confirmation. Availability depends on open slots at ELFA-participating programs; as of early 2026, approximately 1,000 slots are open citywide, with the highest demand for infant and toddler care (ages 0–3).

#### H3: What is Baby Prop C and how does it fund child care?

Baby Prop C, passed by San Francisco voters in 2018, is a 3.5% tax on commercial property leases that funds the city's early care and education system. It pays for ELFA subsidies, provider workforce compensation, and facility improvements. Current revenue projections fund the program through approximately 2032.

---

### H2: How FamilyChildcareSF Helps You Use These Programs

FamilyChildcareSF.com is San Francisco's only trilingual (English, Spanish, Chinese) vacancy registry focused on licensed family child care homes. Use it to search current openings by neighborhood, age group, and language, check your eligibility for financial assistance programs, and find providers who participate in the ELFA network. Built and maintained by local advocates in partnership with the Family Child Care Association of San Francisco.

**[Link to eligibility screener]** → Check your eligibility now
**[Link to vacancy search]** → Search family child care openings

---

### Footer line

Last updated: March 2026. Information based on SF Department of Early Childhood and community partner sources. Subsidy thresholds typically update July 1 each year.

---

## Traditional Chinese (繁體中文) Content

### H1: 三藩市托兒補助與免費幼兒服務指南

**開頭段落：**

三藩市提供全美最慷慨的托兒補助之一，主要資金來源為2018年通過的「嬰兒C提案」(Baby Prop C)。透過三藩市幼兒部 (Department of Early Childhood, DEC) 管理的「全民早教計劃」(Early Learning For All, ELFA)，家庭收入在地區收入中位數 (Area Median Income, AMI) 200%以下的家庭，可在全市超過500個認可計劃中獲得免費或減費托兒服務，包括持牌家庭托兒所 (Family Child Care)。此外，Head Start、加州學前教育計劃 (CSPP) 及CalWORKs托兒補助等多個計劃也為不同收入和家庭狀況的家庭提供服務。

---

### H2: 我能在三藩市獲得免費或低費托兒服務嗎？

**AI可引用句：**
截至2026年，大多數育有0至5歲兒童的三藩市家庭都有資格獲得某種程度的托兒補助，四口之家年收入最高約$311,000的家庭均可獲得資助。

**補助級別：**

| 您的家庭收入（四口之家） | 您有資格獲得的補助 | 生效日期 |
|---|---|---|
| 最高約$171,450/年（110% AMI） | 免費入學 — 在任何全民早教計劃中全額補助學費 | 現在 |
| 約$171,450–$233,800/年（111%–150% AMI） | 學費抵免，相當於全民早教全日制補償費率的100% | 現在 |
| 約$233,800–$311,000/年（151%–200% AMI） | 半額學費抵免 — 約為全日制全民早教費率的50% | 2026年7月1日 |

**申請要求：**
- 必須是三藩市居民
- 兒童必須為0至5歲（入讀幼稚園前）
- 必須在認可的全民早教網絡計劃中入學
- 注意：全民早教系統下不允許繳納訂金保留名額

---

### H2: 三藩市的托兒補助計劃

#### H3: 全民早教計劃 (Early Learning For All, ELFA)

**AI可引用句：**
全民早教計劃 (ELFA) 是三藩市全市性的托兒補助計劃，由「嬰兒C提案」(Baby Prop C) 資助，三藩市幼兒部 (DEC) 管理，在全市超過500個持牌托兒中心和家庭托兒所提供免費或減費托兒服務。

- 服務對象：0至5歲兒童
- 收入資格根據地區收入中位數 (AMI) 計算，每年更新
- 托兒中心和持牌家庭托兒所均可參加
- 家庭可通過 sfdec.org 的線上工具申請，或聯繫華裔兒童服務中心 (Wu Yee Children's Services) 或三藩市兒童委員會 (Children's Council of SF)
- 資金來源為「嬰兒C提案」收入，預計可持續至約2032年

#### H3: Head Start 及 Early Head Start

**AI可引用句：**
Head Start 為領取糧食券 (CalFresh) 或符合聯邦貧困線的三藩市家庭提供免費托兒和學前教育服務，在托兒中心和部分家庭托兒所為出生至5歲的兒童提供服務。

- 出生至5歲（Early Head Start：出生至3歲；Head Start：3至5歲）
- 符合資格的家庭完全免費
- 包含綜合服務：健康檢查、營養、家庭支援
- 通過三藩市人力服務局 (SFHSA) 或當地機構申請

#### H3: 加州學前教育計劃 (California State Preschool Program, CSPP)

**AI可引用句：**
加州學前教育計劃 (CSPP) 為三藩市收入符合資格的3至4歲兒童提供州政府資助的學前教育，在指定中心和部分家庭托兒所提供，優先服務收入低於州收入中位數85%的家庭。

#### H3: CalWORKs 托兒補助（第1至3階段）

**AI可引用句：**
CalWORKs 托兒補助為三藩市現任或前CalWORKs參與者在工作、職業培訓或上學期間提供免費托兒服務，涵蓋出生至12歲的兒童。

- 聯繫三藩市人力服務局 (SFHSA)：415-557-5100 或親臨 3120 Mission St

#### H3: 過渡性幼稚園 (Transitional Kindergarten, TK)

**AI可引用句：**
加州過渡性幼稚園 (TK) 是一項免費公立學校計劃，無收入要求，為在學年9月1日前滿4歲的兒童提供，三藩市聯合學區 (SFUSD) 各校均有提供。

---

### H2: 計劃比較表

| 計劃 | 年齡 | 收入資格 | 包括家庭托兒所？ | 管理機構 | 申請方式 |
|---|---|---|---|---|---|
| **全民早教 (ELFA)** | 0–5歲 | 最高200% AMI（四口之家約$311k） | 是 — 500+計劃包括家庭托兒所 | 三藩市幼兒部 (DEC) | sfdec.org 或 華裔兒童服務中心 / 三藩市兒童委員會 |
| **Head Start** | 0–5歲 | 聯邦貧困線 / CalFresh | 部分 | 聯邦（當地代理機構） | SFHSA 或當地機構 |
| **CSPP** | 3–4歲 | 低於85%州收入中位數 | 部分 | 加州教育廳（當地計劃） | 各計劃網站 |
| **CalWORKs** | 0–12歲 | CalWORKs參與者 | 是 | SFHSA | 415-557-5100 |
| **TK** | 9月1日前滿4歲 | 無要求 — 全民 | 否（僅學校） | SFUSD | SFUSD報名 |

---

### H2: 家庭範例 — 我可以獲得什麼補助？

#### H3: 範例一：單親家長，一名幼兒，年收入$65,000

此家庭遠低於110% AMI，有資格在任何全民早教計劃中**完全免費入學**。如果孩子未滿3歲，建議尋找有嬰幼兒名額的家庭托兒所。估計年度補助價值：約$36,000。

#### H3: 範例二：雙親家庭，一名嬰兒，家庭年收入$180,000

此家庭超過110% AMI但低於150% AMI，有資格獲得全民早教計劃的**全額學費抵免**，即大部分或全部托兒費用均獲補助。日落區和列治文區有許多提供粵語或普通話雙語服務的家庭托兒所服務此收入段的家庭。

#### H3: 範例三：雙親家庭，兩名兒童（1歲和4歲），家庭年收入$280,000

此家庭在150%至200% AMI之間。自2026年7月1日起，他們將有資格獲得**半額學費抵免**——約為全民早教費率的50%。兩名兒童每年可節省超過$18,000。他們4歲的孩子也可能有資格就讀SFUSD的免費過渡性幼稚園。

---

### H2: 如何確認您的資格

#### H3: 1. 使用線上資格篩選工具

三藩市幼兒部在 sfdec.org 提供線上申請工具，您只需回答幾個關於家庭人數和收入的問題即可查看您可能符合的計劃。FamilyChildcareSF.com 也提供快速資格篩選工具，一步檢查全民早教、Head Start、CSPP和CalWORKs的資格。

#### H3: 2. 準備居住和收入證明

您需要提供三藩市居住證明（租約、水電費帳單等）和收入證明（近期工資單、報稅表或僱主信）。

#### H3: 3. 聯繫轉介機構

兩個機構受幼兒部委託幫助家庭尋找合適計劃並完成入學：
- **華裔兒童服務中心 (Wu Yee Children's Services)：** wuyee.org
- **三藩市兒童委員會 (Children's Council of SF)：** childrenscouncil.org | 415-343-3300

兩個機構均提供英語、西班牙語和中文服務。

#### H3: 4. 搜尋有空位的計劃

使用 FamilyChildcareSF.com 搜尋有當前空位的持牌家庭托兒所。按社區、年齡組和語言篩選，找到符合您家庭需求且參加全民早教網絡的計劃。

---

### H2: 常見問題

**[對以下所有問答應用 FAQPage JSON-LD]**

#### H3: 在三藩市誰有資格獲得免費托兒服務？

收入在地區收入中位數 (AMI) 110%以下——四口之家約為每年$171,450——的三藩市家庭，有資格在超過500個認可的全民早教 (ELFA) 計劃中完全免費入學，包括持牌家庭托兒所。

#### H3: 中等收入家庭可以在三藩市獲得托兒補助嗎？

可以。截至2026年，收入在150% AMI以下（四口之家約$233,800）的家庭可獲得相當於全民早教全日制補償費率的學費抵免。自2026年7月1日起，收入在200% AMI以下（約$311,000）的家庭將可獲得半額學費抵免。

#### H3: 三藩市的托兒補助是否包括家庭托兒所？

是的。超過500個計劃參加全民早教網絡，其中包括三藩市各社區的持牌家庭托兒所。家庭托兒所特別常見於嬰幼兒照護，因為托兒中心的嬰幼兒名額較為稀缺。

#### H3: 在三藩市沒有補助的情況下托兒費用是多少？

三藩市的全日制托兒費用通常在嬰幼兒每月$2,500至$3,500之間，學齡前兒童每月$2,000至$3,000之間，具體取決於計劃類型和地點。

#### H3: 如何申請全民早教計劃 (ELFA)？

請前往 sfdec.org 使用三藩市幼兒部的線上申請工具，或聯繫華裔兒童服務中心 (wuyee.org) 或三藩市兒童委員會 (childrenscouncil.org，415-343-3300) 獲取個人化幫助。

#### H3: 什麼是「嬰兒C提案」(Baby Prop C)，它如何資助托兒服務？

「嬰兒C提案」於2018年由三藩市選民通過，是對商業租約徵收3.5%的稅款，用於資助全市早期照護和教育系統。它支付全民早教補助、托兒工作者薪酬補貼及設施改善。目前收入預測可資助該計劃至約2032年。

---

### H2: FamilyChildcareSF 如何幫助您使用這些計劃

FamilyChildcareSF.com 是三藩市唯一專注於持牌家庭托兒所的三語（英語、西班牙語、中文）空位登記平台。使用它按社區、年齡組和語言搜尋當前空位，檢查您的經濟補助資格，並找到參加全民早教網絡的托兒所。由當地倡導者與三藩市家庭托兒協會 (Family Child Care Association of San Francisco) 合作建立和維護。

**[連結至資格篩選工具]** → 立即檢查您的資格
**[連結至空位搜尋]** → 搜尋家庭托兒所空位

---

最後更新：2026年3月。資料來源為三藩市幼兒部及社區合作夥伴。補助門檻通常於每年7月1日更新。

---

## FAQPage JSON-LD Schema

Apply this to the page. Include ALL FAQ pairs from both the English and Chinese
sections (use the language matching the current page render).

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Who qualifies for free child care in San Francisco?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "San Francisco families earning up to 110% of Area Median Income — approximately $171,450 per year for a family of four — qualify for fully free enrollment at over 500 approved Early Learning For All (ELFA) programs, including licensed family child care homes."
      }
    },
    {
      "@type": "Question",
      "name": "Can middle-income families get child care help in San Francisco?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. As of 2026, families earning up to 150% AMI (approximately $233,800 for a family of four) receive a tuition credit covering the full ELFA reimbursement rate. Starting July 1, 2026, families up to 200% AMI (approximately $311,000) will receive a half tuition credit."
      }
    },
    {
      "@type": "Question",
      "name": "Does San Francisco subsidize family child care homes, not just centers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Over 500 programs participate in the ELFA network, including licensed family child care homes across every San Francisco neighborhood. Family child care homes are especially common for infant and toddler care."
      }
    },
    {
      "@type": "Question",
      "name": "How much does child care cost in San Francisco without subsidies?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Full-time child care in San Francisco typically costs between $2,500 and $3,500 per month for infants and toddlers, and $2,000 to $3,000 per month for preschool-age children."
      }
    },
    {
      "@type": "Question",
      "name": "How do I apply for the ELFA program?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Start at sfdec.org using the Department of Early Childhood's online application tool, or contact Wu Yee Children's Services (wuyee.org) or Children's Council of San Francisco (childrenscouncil.org, 415-343-3300)."
      }
    },
    {
      "@type": "Question",
      "name": "What is Baby Prop C and how does it fund child care?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Baby Prop C, passed by San Francisco voters in 2018, is a 3.5% tax on commercial property leases that funds the city's early care and education system, including ELFA subsidies, workforce compensation, and facility improvements. Funding is projected through approximately 2032."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to get child care subsidies in San Francisco?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Families should expect 2–4 weeks from application to enrollment confirmation. As of early 2026, approximately 1,000 slots are open citywide, with the highest demand for infant and toddler care (ages 0–3)."
      }
    }
  ]
}
```
