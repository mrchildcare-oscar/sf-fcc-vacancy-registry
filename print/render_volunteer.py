#!/usr/bin/env python3
"""A4 'two quick steps' sheet: Consent + Survey QR codes side by side.
Printer-friendly (white background, black text), 300 DPI."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
DPI = 300
MM = DPI / 25.4
PT = DPI / 72.0
W, H = round(210 * MM), round(297 * MM)

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREY = (90, 90, 90)
FAINT = (120, 120, 120)
FRAME = (160, 160, 160)

FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FM = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"

def font(p, pt): return ImageFont.truetype(p, round(pt * PT))
f_word = font(FB, 14)
f_head = font(FB, 34)
f_sub  = font(FR, 16)
f_badge= font(FB, 24)
f_lbl  = font(FB, 19)
f_lsub = font(FR, 13)
f_url  = font(FM, 12.5)
f_foot = font(FR, 12)

img = Image.new("RGB", (W, H), WHITE)
d = ImageDraw.Draw(img)
CX = W // 2

def tw(s, fnt, tr=0):
    return sum(d.textlength(c, font=fnt) for c in s) + tr * max(len(s) - 1, 0)

def center(cx, y, s, fnt, fill, tr=0, stroke=0):
    x = cx - tw(s, fnt, tr) / 2
    for c in s:
        d.text((x, y), c, font=fnt, fill=fill, stroke_width=stroke, stroke_fill=fill)
        x += d.textlength(c, font=fnt) + tr

# ---- header ----
y = round(20 * MM)
center(CX, y, "FAMILYCHILDCARESF.COM", f_word, FAINT, tr=9)
y += round(12 * MM)
center(CX, y, "Two quick steps", f_head, BLACK, stroke=1)
y += round(15 * MM)
center(CX, y, "Scan each code with your phone camera.", f_sub, GREY)
y += round(16 * MM)

# Vertically center the two-column block between header and footer
block_top = max(y, round(90 * MM))

def column(cx, number, label, sublabel, qr_path, url):
    y = block_top
    # number badge
    r = round(7 * MM)
    d.ellipse([cx - r, y, cx + r, y + 2*r], fill=BLACK)
    center(cx, y + r - f_badge.getmetrics()[0]//2 + round(0.5*MM), number, f_badge, WHITE)
    y += 2*r + round(6 * MM)
    # label + sublabel
    center(cx, y, label, f_lbl, BLACK)
    y += round(8 * MM)
    center(cx, y, sublabel, f_lsub, GREY)
    y += round(9 * MM)
    # QR with thin frame
    qr = Image.open(os.path.join(HERE, qr_path)).convert("RGB")
    modules, mod_px = 37, 24            # clean integer scale -> 888 px (~75mm)
    size = modules * mod_px
    qr = qr.resize((size, size), Image.NEAREST)
    pad = round(5 * MM)
    panel = size + 2 * pad
    x0 = cx - panel / 2
    d.rounded_rectangle([x0, y, x0 + panel, y + panel], radius=round(6*MM),
                        outline=FRAME, width=round(0.5*MM))
    img.paste(qr, (round(x0 + pad), round(y + pad)))
    y += panel + round(7 * MM)
    center(cx, y, url, f_url, BLACK, tr=1)

gutter = round(12 * MM)
half = (W - 2*round(16*MM) - gutter) / 2
left_cx = round(16*MM) + half/2
right_cx = W - round(16*MM) - half/2

column(left_cx,  "1", "CONSENT FORM",     "Complete this first.",
       "qr-consent.png", "familychildcaresf.com/go/consent")
column(right_cx, "2", "COMMUNITY SURVEY", "Then take the survey.",
       "qr-survey.png",  "familychildcaresf.com/go/survey")

# ---- footer ----
fy = H - round(18 * MM)
center(CX, fy, "No phone? Ask a volunteer for help.", f_foot, GREY)
center(CX, fy + round(6*MM), "familychildcaresf.com/go/volunteer", f_url, FAINT, tr=1)

base = os.path.join(HERE, "volunteer-2qr-a4")
img.save(base + ".png", "PNG")
img.save(base + ".pdf", "PDF", resolution=float(DPI))
print("Wrote:", base + ".pdf", "/", base + ".png")
