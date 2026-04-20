# Jotform Intake — Translations (EN / ZH-Hant / ES)

**Jotform's translation API is non-functional for multilingual forms** — the `properties[multipleLanguages]=1` and `/translations` endpoints accept POSTs but don't persist the data. Translations must be entered in the UI:

1. Open https://www.jotform.com/build/261081404098151
2. Top bar → **Form Translations** (🌐 icon) → **Add** → pick Chinese (Traditional) / Spanish
3. For each question, paste the translation from the tables below

Terminology aligns with the existing site glossary (`fcc-translation-glossary.md`) — `托兒計畫` for program, `持牌` for licensed, `空位` for vacancy, `家庭托兒員` for FCC provider, 嬰兒/幼兒/學前/學齡 for the age groups.

## Form title

| EN | ZH-Hant | ES |
|---|---|---|
| Family Child Care SF — Provider Intake | 舊金山家庭托兒協會 — 托兒員登記 | Family Child Care SF — Registro de Proveedor |

## Fields

| # | Unique name | EN | ZH-Hant | ES |
|---|---|---|---|---|
| 1 | `intake_mode` | (keep hidden — no translation needed) | — | — |
| 2 | `license_number` | FCC License Number (9 digits) | 家庭托兒執照號碼（9 位數） | Número de licencia FCC (9 dígitos) |
| 3 | `business_name` | Program / Business Name | 托兒計畫名稱 | Nombre del programa |
| 4 | `owner_name` | Owner Name | 負責人姓名 | Nombre del propietario |
| 5 | `contact_email` | Contact Email | 聯絡電郵 | Correo electrónico de contacto |
| 6 | `phone` | Phone | 電話 | Teléfono |
| 7 | `phone_accepts_text` | Does this phone accept text messages? | 此電話可接收簡訊嗎？ | ¿Este teléfono acepta mensajes de texto? |
| 8 | `program_type` | Program Type | 托兒計畫類型 | Tipo de programa |
| 8 options | `small_family` / `large_family` | Small Family (up to 8) / Large Family (up to 14) | 小型家庭托兒（最多 8 名兒童）／ 大型家庭托兒（最多 14 名兒童） | Pequeño (hasta 8) / Grande (hasta 14) |
| 9 | `licensed_capacity` | Licensed Capacity (leave blank to use 8 or 14 based on program type) | 持牌容量（留空則依機構類型預設為 8 或 14） | Capacidad autorizada (déjelo vacío para usar 8 o 14 según el tipo) |
| 10 | `zip_code` | ZIP Code (5 digits) | 郵遞區號（5 位數） | Código postal (5 dígitos) |
| 11 | `neighborhood` | Neighborhood | 社區 | Vecindario |
| 12 | `website` | Website (optional) | 網站（選填） | Sitio web (opcional) |
| 13 | `languages` | Languages Spoken | 使用的語言 | Idiomas que se hablan |
| 14 | `vacancy_header` (title) | Current Openings | 目前空位 | Cupos actuales |
| 14 | `vacancy_header` (subtitle) | Enter 0 for age groups you aren't currently accepting. If you only have a waitlist, leave all spots at 0 and mark Waitlist Available below. | 目前不收的年齡組請填 0。只收候補名單者，請將所有空位填 0，並在下方勾選「接受候補名單」。 | Ingrese 0 para los grupos de edad que no acepta actualmente. Si solo tiene lista de espera, deje todos los cupos en 0 y marque "Acepta lista de espera" abajo. |
| 15 | `infant_spots` | Infant spots (under 2) | 嬰兒空位（2 歲以下） | Cupos para bebés (menores de 2) |
| 16 | `toddler_spots` | Toddler spots (2-3) | 幼兒空位（2–3 歲） | Cupos para niños pequeños (2–3) |
| 17 | `preschool_spots` | Preschool spots (3-5) | 學前空位（3–5 歲） | Cupos preescolares (3–5) |
| 18 | `school_age_spots` | School-age spots (6+) | 學齡空位（6 歲以上） | Cupos escolares (6+) |
| 19 | `full_time_available` | Full-time care available? | 提供全日托育？ | ¿Cuidado de tiempo completo disponible? |
| 20 | `part_time_available` | Part-time care available? | 提供兼日托育？ | ¿Cuidado de medio tiempo disponible? |
| 21 | `waitlist_available` | Accepting waitlist? | 接受候補名單？ | ¿Acepta lista de espera? |
| 22 | `notes` | Anything else families should know? (optional) | 還有什麼家庭應該知道的？（選填） | ¿Algo más que las familias deberían saber? (opcional) |
| 23 | `submit` | Submit | 提交 | Enviar |

## Neighborhood dropdown options

Keep the same values (they're stored as English strings in the DB). Only translate the **display label** in Jotform's Translate UI. The value that reaches the webhook stays English.

| EN | ZH-Hant | ES |
|---|---|---|
| Bayview | 灣景區 | Bayview |
| Bernal Heights | 伯納爾高地 | Bernal Heights |
| Castro | 卡斯楚 | Castro |
| Chinatown | 唐人街 | Chinatown |
| Excelsior | 艾思理 | Excelsior |
| Financial District | 金融區 | Distrito Financiero |
| Haight-Ashbury | 海特—阿什伯里 | Haight-Ashbury |
| Hayes Valley | 海斯谷 | Hayes Valley |
| Inner Richmond | 內列治文 | Inner Richmond |
| Inner Sunset | 內日落 | Inner Sunset |
| Marina | 濱海區 | Marina |
| Mission | 米慎區 | Misión |
| Mission Bay | 米慎灣 | Mission Bay |
| Nob Hill | 諾布山 | Nob Hill |
| Noe Valley | 諾伊谷 | Noe Valley |
| North Beach | 北灘 | North Beach |
| Outer Richmond | 外列治文 | Outer Richmond |
| Outer Sunset | 外日落 | Outer Sunset |
| Pacific Heights | 太平洋高地 | Pacific Heights |
| Portola | 波托拉 | Portola |
| Potrero Hill | 波特雷羅山 | Potrero Hill |
| Russian Hill | 俄羅斯山 | Russian Hill |
| SoMa | 市場南區 | SoMa |
| Tenderloin | 田德隆 | Tenderloin |
| Visitacion Valley | 維西塔欣谷 | Visitacion Valley |
| Western Addition | 西增區 | Western Addition |

## Languages dropdown options

| EN | ZH-Hant | ES |
|---|---|---|
| English | 英文 | Inglés |
| Spanish | 西班牙文 | Español |
| Cantonese | 粵語 | Cantonés |
| Mandarin | 國語 | Mandarín |
| Tagalog | 塔加洛語 | Tagalo |
| Vietnamese | 越南語 | Vietnamita |
| Russian | 俄語 | Ruso |
| Arabic | 阿拉伯語 | Árabe |
| Korean | 韓語 | Coreano |
| Japanese | 日語 | Japonés |

## Autoresponder email (Jotform Settings → Emails)

**Subject (EN):** We received your Family Child Care SF listing
**Subject (ZH-Hant):** 我們已收到您在舊金山家庭托兒協會的登記
**Subject (ES):** Recibimos su registro en Family Child Care SF

**Body (EN):**
> Thanks for submitting your Family Child Care listing! We've received your information. Your listing usually appears on familychildcaresf.com within a few minutes. If we need to verify anything, we'll email you.
> — Family Child Care SF

**Body (ZH-Hant):**
> 感謝您提交家庭托兒登記！我們已收到您的資料。您的資料通常會在數分鐘內顯示在 familychildcaresf.com 上。如需核實，我們會以電郵聯絡您。
> — 舊金山家庭托兒協會

**Body (ES):**
> ¡Gracias por enviar su registro de Family Child Care! Hemos recibido su información. Su publicación suele aparecer en familychildcaresf.com en unos minutos. Si necesitamos verificar algo, le enviaremos un correo.
> — Family Child Care SF
