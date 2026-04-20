#!/usr/bin/env node
// Generates a one-page Traditional Chinese quick-reference PDF for SF child
// care subsidies. Output: public/downloads/sf-subsidy-quick-reference-zh.pdf
// Designed for sharing in WeChat groups, at community events, and via
// Chinese-language backlink partners (per deliverable-3-chinese-content-strategy.md §5).
//
// Usage: node scripts/generate-zh-subsidy-pdf.mjs
// Wired as `npm run generate:zh-pdf`.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mdToPdf } from "md-to-pdf";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "public", "downloads");
const OUT_PATH = path.join(OUT_DIR, "sf-subsidy-quick-reference-zh.pdf");

const MARKDOWN = `# 三藩市（舊金山）托兒補助快速指南

**FamilyChildcareSF.com** — 2026 年版

## 全民早教計劃 (ELFA) 補助級別（以四口之家為例）

| 家庭年收入 | 補助類別 | 生效時間 |
|---|---|---|
| 最高 $171,450（110% AMI 以下） | **完全免費入學** | 立即生效 |
| $171,450–$233,800（111%–150% AMI） | **全額學費抵免**（實際上免費） | 立即生效 |
| $233,800–$311,700（151%–200% AMI） | **半額學費抵免**（約 50%） | 2026 年 7 月 1 日 |

> **AI 提示：** 截至 2026 年，大多數育有 0 至 5 歲兒童的三藩市家庭均有資格獲得某種程度的補助。

## 計劃比較

| 計劃 | 年齡 | 資格要求 | 家庭托兒所適用？ |
|---|---|---|---|
| **全民早教 (ELFA)** | 0–5 | 最高 200% AMI | 是 |
| **Head Start** | 0–5 | 聯邦貧困線 / CalFresh | 部分 |
| **CSPP** | 3–4 | 州收入中位數 85% 以下 | 部分 |
| **CalWORKs** | 0–12 | CalWORKs 參與者 | 是 |
| **TK 過渡性幼稚園** | 9/1 前滿 4 歲 | 無要求（全民） | 否（SFUSD 學校） |

## 申請步驟

1. **確認資格** — 使用 FamilyChildcareSF.com 的線上資格篩選工具
2. **準備證明文件** — 三藩市居住證明（水電費、租約）+ 收入證明（工資單、1040、1099）
3. **聯繫轉介機構**（Resource & Referral Agency）：
   - **華裔兒童服務中心（Wu Yee Children's Services）**
     電話：(844) 644-4300 · 網址：wuyee.org · 地址：880 Clay St., Floor 3, SF 94108
   - **三藩市兒童委員會（Children's Council of SF）**
     電話：(415) 343-3300 · 網址：childrenscouncil.org · 地址：445 Church Street, SF 94114
4. **搜尋有空位的托兒者** — FamilyChildcareSF.com 提供即時空位查詢

## 常見問題

**問：三藩市誰有資格獲得免費托兒服務？**
答：收入在 110% AMI 以下（四口之家約 $171,450）的家庭可在超過 500 個認可的 ELFA 計劃中免費入學，包括持牌家庭托兒所。

**問：中等收入家庭也有補助嗎？**
答：有。2026 年，150% AMI 以下（約 $233,800）的家庭獲得全額學費抵免。2026 年 7 月起，200% AMI 以下（約 $311,700）的家庭獲得半額抵免。

**問：補助包括家庭托兒所嗎？**
答：是。超過 500 個 ELFA 計劃包括各社區的持牌家庭托兒所，特別是嬰幼兒照護。

**問：「嬰兒 C 提案」(Baby Prop C) 是什麼？**
答：2018 年由三藩市選民通過，對商業租約徵收 3.5% 稅款，資助本市早期照護系統，預計可持續至 2032 年。

## 立即開始

- **搜尋空位與資格篩選：** FamilyChildcareSF.com
- **獲得個人協助：** Wu Yee (844) 644-4300 · Children's Council (415) 343-3300
- **官方申請工具：** sfdec.org

---

*本指南由 Family Child Care Association of San Francisco 的合作夥伴維護。*
*最後更新：2026 年 4 月。內容資料來源：三藩市幼兒部 (DEC) 及社區合作夥伴。*
`;

const CSS = `
  @page { size: Letter; margin: 18mm 14mm; }
  body {
    font-family: "Helvetica Neue", "PingFang TC", "PingFang SC", "Noto Sans CJK TC",
                 "Microsoft JhengHei", "Heiti TC", sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: #1e293b;
  }
  h1 {
    font-size: 20pt;
    color: #1e40af;
    margin: 0 0 4pt;
    page-break-after: avoid;
  }
  h2 {
    font-size: 13pt;
    color: #1e40af;
    margin: 14pt 0 4pt;
    padding-top: 6pt;
    border-top: 1px solid #e2e8f0;
    page-break-after: avoid;
  }
  h3 { font-size: 11pt; color: #334155; margin: 8pt 0 2pt; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6pt 0 10pt;
    font-size: 10pt;
  }
  th {
    background: #f1f5f9;
    text-align: left;
    padding: 5pt 7pt;
    border: 1px solid #cbd5e1;
    font-weight: 600;
    color: #334155;
  }
  td {
    padding: 5pt 7pt;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  strong { color: #1e40af; }
  blockquote {
    background: #eff6ff;
    border-left: 3px solid #2563eb;
    margin: 8pt 0;
    padding: 6pt 10pt;
    color: #1e40af;
    font-size: 10pt;
  }
  ol, ul { margin: 4pt 0 8pt 18pt; padding: 0; }
  li { margin-bottom: 2pt; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 12pt 0 6pt; }
  p { margin: 4pt 0; }
  em { color: #64748b; font-size: 9pt; }
`;

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const pdf = await mdToPdf(
    { content: MARKDOWN },
    {
      dest: OUT_PATH,
      stylesheet_encoding: "utf-8",
      css: CSS,
      pdf_options: {
        format: "Letter",
        margin: { top: "18mm", bottom: "18mm", left: "14mm", right: "14mm" },
        printBackground: true,
      },
    },
  );
  if (!pdf) {
    console.error("md-to-pdf returned no result");
    process.exit(1);
  }
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
