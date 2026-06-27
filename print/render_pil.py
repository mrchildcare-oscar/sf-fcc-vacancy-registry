#!/usr/bin/env python3
"""Render the A4 'Scan Me' community-survey poster at 300 DPI with PIL.
Produces two themes:
  - dark  : black background, white text  -> survey-qr-a4.pdf / .png
  - light : white background, black text (printer-friendly) -> survey-qr-a4-light.pdf / .png
The QR is always black-on-white so phone cameras lock on reliably."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
DPI = 300
MM = DPI / 25.4
PT = DPI / 72.0
W, H = round(210 * MM), round(297 * MM)        # A4 portrait: 2480 x 3508

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)

FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FM = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"

def font(path, pt):
    return ImageFont.truetype(path, round(pt * PT))

f_word = font(FB, 15)
f_kick = font(FB, 15)
f_head = font(FB, 37)
f_sub  = font(FR, 16.5)
f_url  = font(FM, 16)
f_arrow= font(FB, 34)
f_scan = font(FB, 62)
f_scsub= font(FR, 13)

THEMES = {
    "dark": dict(
        suffix="", bg=BLACK, primary=WHITE,
        secondary=(200, 200, 200), faint=(170, 170, 170), rule=WHITE,
        panel_fill=WHITE, panel_outline=None,
    ),
    "light": dict(
        suffix="-light", bg=WHITE, primary=BLACK,
        secondary=(70, 70, 70), faint=(110, 110, 110), rule=BLACK,
        panel_fill=None, panel_outline=(150, 150, 150),
    ),
}

def build(th):
    img = Image.new("RGB", (W, H), th["bg"])
    d = ImageDraw.Draw(img)
    CX = W // 2

    def text_w(s, fnt, tracking=0):
        return sum(d.textlength(ch, font=fnt) for ch in s) + tracking * max(len(s) - 1, 0)

    def draw_tracked(cx, y, s, fnt, fill, tracking=0, stroke=0):
        x = cx - text_w(s, fnt, tracking) / 2
        for ch in s:
            d.text((x, y), ch, font=fnt, fill=fill, stroke_width=stroke, stroke_fill=fill)
            x += d.textlength(ch, font=fnt) + tracking

    def wrap(s, fnt, maxw):
        words, lines, cur = s.split(), [], ""
        for wd in words:
            t = (cur + " " + wd).strip()
            if d.textlength(t, font=fnt) <= maxw:
                cur = t
            else:
                if cur:
                    lines.append(cur)
                cur = wd
        if cur:
            lines.append(cur)
        return lines

    P, S, FT, RULE = th["primary"], th["secondary"], th["faint"], th["rule"]

    # ---- top block ----
    y = round(19 * MM)
    draw_tracked(CX, y, "FAMILYCHILDCARESF.COM", f_word, FT, tracking=10)
    y += round(13 * MM)

    kick = "COMMUNITY SURVEY"
    kw = text_w(kick, f_kick, tracking=16)
    draw_tracked(CX, y, kick, f_kick, P, tracking=16, stroke=1)
    rule_y = y + f_kick.getmetrics()[0] * 0.55
    rlen, gap = round(11 * MM), round(6 * MM)
    d.line([(CX - kw/2 - gap - rlen, rule_y), (CX - kw/2 - gap, rule_y)], fill=RULE, width=round(0.7*MM))
    d.line([(CX + kw/2 + gap, rule_y), (CX + kw/2 + gap + rlen, rule_y)], fill=RULE, width=round(0.7*MM))
    y += round(15 * MM)

    head_lines = wrap("What are you looking for in child care?", f_head, W - 2*round(20*MM))
    lh = round(f_head.getmetrics()[0] * 1.18)
    for ln in head_lines:
        draw_tracked(CX, y, ln, f_head, P, stroke=1)
        y += lh
    y += round(4 * MM)

    sub = "Help us understand how families see family child care — and what matters most to you. Just a few quick questions."
    slh = round(f_sub.getmetrics()[0] * 1.42)
    for ln in wrap(sub, f_sub, W - 2*round(24*MM)):
        draw_tracked(CX, y, ln, f_sub, S)
        y += slh
    top_bottom = y

    # ---- bottom CTA block ----
    bm = round(16 * MM)
    by = H - bm - f_scsub.getmetrics()[0]
    draw_tracked(CX, by, "Open your phone camera and point it at the code", f_scsub, S, tracking=3)
    sy = by - round(8*MM) - f_scan.getmetrics()[0]
    draw_tracked(CX, sy, "SCAN ME", f_scan, P, tracking=10, stroke=3)
    ay = sy - round(2*MM) - f_arrow.getmetrics()[0]
    draw_tracked(CX, ay, "▲", f_arrow, P, stroke=1)
    bottom_top = ay

    # ---- QR panel centered between blocks ----
    qr = Image.open(os.path.join(HERE, "qr-survey.png")).convert("RGB")
    modules, mod_px = 37, 33
    qr_size = modules * mod_px
    qr = qr.resize((qr_size, qr_size), Image.NEAREST)
    pad = round(8 * MM)
    panel_w = panel_h = qr_size + 2 * pad
    radius = round(9 * MM)

    url_gap, url_h = round(6 * MM), f_url.getmetrics()[0]
    group_h = panel_h + url_gap + url_h
    gy = max(top_bottom + (bottom_top - top_bottom - group_h) / 2, top_bottom + round(4*MM))
    panel_x = CX - panel_w / 2
    box = [panel_x, gy, panel_x + panel_w, gy + panel_h]

    if th["panel_fill"]:
        d.rounded_rectangle(box, radius=radius, fill=th["panel_fill"])
    if th["panel_outline"]:
        d.rounded_rectangle(box, radius=radius, outline=th["panel_outline"], width=round(0.5*MM))
    img.paste(qr, (round(panel_x + pad), round(gy + pad)))

    draw_tracked(CX, round(gy + panel_h + url_gap), "familychildcaresf.com/go/survey", f_url, P, tracking=2)
    return img

for name, th in THEMES.items():
    img = build(th)
    base = os.path.join(HERE, "survey-qr-a4" + th["suffix"])
    img.save(base + ".png", "PNG")
    img.save(base + ".pdf", "PDF", resolution=float(DPI))
    print("Wrote:", base + ".pdf", "/", base + ".png", "(%s)" % name)
