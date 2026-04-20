#!/usr/bin/env python3
"""Idempotently inject a "Neighborhoods" link into the header nav of all
static HTML pages under public/. Run once after adding the neighborhoods
landing pages. Safe to re-run — skips files that already have the link."""

import re
from pathlib import Path

PUBLIC = Path("public")
LABELS = {"en": "Neighborhoods", "es": "Barrios", "zh": "\u793e\u5340"}
HREFS = {"en": "/neighborhoods/", "es": "/es/neighborhoods/", "zh": "/zh/neighborhoods/"}

FIND_PROVIDERS_RE = re.compile(
    r'^(\s*)<a href="[^"]*#public"[^>]*>[^<]+</a>\s*$',
    re.MULTILINE,
)


def lang_for(path):
    parts = path.parts
    if "zh" in parts:
        return "zh"
    if "es" in parts:
        return "es"
    return "en"


def already_has_link(html, href):
    return f'href="{href}"' in html


changed = 0
skipped = 0
nomatch = 0
for p in PUBLIC.rglob("index.html"):
    html = p.read_text(encoding="utf-8")
    if "header-links" not in html:
        continue
    lang = lang_for(p)
    href = HREFS[lang]
    if already_has_link(html, href):
        skipped += 1
        continue

    m = FIND_PROVIDERS_RE.search(html)
    if not m:
        print(f"NO MATCH: {p}")
        nomatch += 1
        continue
    indent = m.group(1)
    new_link = f'{indent}<a href="{href}">{LABELS[lang]}</a>\n'
    start = m.start()
    new_html = html[:start] + new_link + html[start:]
    p.write_text(new_html, encoding="utf-8")
    changed += 1
    print(f"UPDATED: {p}")

print(f"\nchanged={changed}, skipped={skipped}, no_match={nomatch}")
