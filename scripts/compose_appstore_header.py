"""App Store creative assets (iOS 27+): product page header, search result, universal.

Usage:
  python3 scripts/compose_appstore_header.py <raw_dir> <out_dir> <zh_font.ttf> [--guides]

- raw_dir: en/ and zh/ with 1170x2532 simulator shots home / today / missed / result .png
  (missed = a battle question with the 上次答錯 tag)
- zh_font: jf open 粉圓 (see compose_appstore_screenshots.py for the download link)
- --guides draws the art safe area in green, for checking only (don't upload)
- Writes <out_dir>/{zh,en}/header_3840x1646.png, search_3840x2560.png,
  universal_5244x2950.png

Layout rule (Apple "creative assets specifications", 2026-11):
everything that must be read (icon, name, headline, pill) sits inside the Art
Safe Area; the phones and kana bubbles are atmosphere in the Auxiliary Art Area
and can be cropped on any device.

  asset            size         art safe area (w x h at x, y)
  header 21:9      3840 x 1646  1646 x 661  at 1097, 493
  search 3:2       3840 x 2560  2168 x 1030 at  836, 765
  universal 16:9   5244 x 2950  1402 x 962  at 1921, 660   (PNG only)

No alpha, no prices, no URLs, no unverifiable claims ("必選", "No.1"...).
"""
import os
import random
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAW, OUT, ZH_FONT = sys.argv[1], sys.argv[2], sys.argv[3]
GUIDES = '--guides' in sys.argv
BG = (255, 228, 234)          # sakura pastel, same as screenshot 1
NAVY = (44, 62, 80)
RED = (226, 71, 95)
SUBTXT = (120, 100, 100)
KANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねの'
HERE = os.path.dirname(os.path.abspath(__file__))
ICON = os.path.join(HERE, '..', 'assets', 'icon.png')

TEXT = {
    'zh': ('日文知識王', ['1 對 1 ', '單字對戰'], '五十音到 N2・每日任務'),
    'en': ('Nihongo Quiz King', ['Japanese ', 'vocab battles'], 'Kana to N2 · Daily missions'),
}

# name, size, safe box (x, y, w, h), phones [(shot, centre x, centre y, width, angle)]
ASSETS = [
    ('header_3840x1646', (3840, 1646), (1097, 493, 1646, 661), [
        ('home', 300, 1000, 560, 10), ('missed', 770, 1130, 560, -4),
        ('today', 3070, 1130, 560, 4), ('result', 3540, 1000, 560, -10),
    ]),
    ('search_3840x2560', (3840, 2560), (836, 765, 2168, 1030), [
        ('missed', 330, 1500, 640, 8), ('today', 3510, 1500, 640, -8),
        ('home', 1300, 2560, 640, 6), ('result', 2540, 2560, 640, -6),
    ]),
    ('universal_5244x2950', (5244, 2950), (1921, 660, 1402, 962), [
        ('home', 520, 1350, 700, 10), ('missed', 1300, 1520, 700, -4),
        ('today', 3944, 1520, 700, 4), ('result', 4724, 1350, 700, -10),
    ]),
]


def font(lang, size):
    if lang == 'zh':
        return ImageFont.truetype(ZH_FONT, size)
    return ImageFont.truetype('/System/Library/Fonts/SFNSRounded.ttf', size)


def tsize(d, text, f):
    # works on old Pillow (no textbbox): ink width/height and the top offset
    w, h = d.textsize(text, font=f)
    ox, oy = f.getoffset(text)
    return w - ox, h - oy, oy


def rrect(draw, box, r, fill):
    x0, y0, x1, y1 = box
    draw.rectangle([x0 + r, y0, x1 - r, y1], fill=fill)
    draw.rectangle([x0, y0 + r, x1, y1 - r], fill=fill)
    for cx, cy, a in ((x0, y0, 180), (x1 - 2 * r, y0, 270), (x0, y1 - 2 * r, 90), (x1 - 2 * r, y1 - 2 * r, 0)):
        draw.pieslice([cx, cy, cx + 2 * r, cy + 2 * r], a, a + 90, fill=fill)


def bubbles(canvas, safe):
    W, H = canvas.size
    sx, sy, sw, sh = safe
    rnd = random.Random(7)
    layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    tint = tuple(c - 28 for c in BG)
    kf = ImageFont.truetype(ZH_FONT, 200)
    spots = []
    want = round(W * H / 1_400_000)
    for _ in range(5000):
        if len(spots) >= want:
            break
        x, y = rnd.randint(0, W), rnd.randint(0, H)
        if sx - 250 < x < sx + sw + 250 and sy - 250 < y < sy + sh + 250:
            continue          # keep the text area clean
        if any((x - a) ** 2 + (y - b) ** 2 < 560 ** 2 for a, b in spots):
            continue          # no overlapping bubbles
        spots.append((x, y))
    for x, y in spots:
        r = rnd.randint(130, 190)
        d.ellipse([x - r, y - r, x + r, y + r], fill=tint + (110,))
        ch = rnd.choice(KANA)
        w, h, top = tsize(d, ch, kf)
        d.text((x - w / 2, y - h / 2 - top), ch, font=kf, fill=(255, 255, 255, 200))
    for _ in range(70):
        x, y = rnd.randint(0, W), rnd.randint(0, H)
        r = rnd.randint(14, 36)
        d.ellipse([x - r, y - r, x + r, y + r], fill=tint + (80,))
    canvas.paste(layer, (0, 0), layer)


def phone(shot_path, width, angle):
    shot = Image.open(shot_path).convert('RGB')
    h = round(shot.height * width / shot.width)
    shot = shot.resize((width, h), Image.LANCZOS)
    pad, bez, r = 120, round(width * 0.05), round(width * 0.19)
    tile = Image.new('RGBA', (width + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    sh = Image.new('RGBA', tile.size, (0, 0, 0, 0))
    rrect(ImageDraw.Draw(sh), [pad - bez, pad - bez + 30, pad + width + bez, pad + h + bez + 60], r + bez, (120, 90, 90, 90))
    blur = sh.filter(ImageFilter.GaussianBlur(50))
    tile.paste(blur, (0, 0), blur)
    rrect(ImageDraw.Draw(tile), [pad - bez, pad - bez, pad + width + bez, pad + h + bez], r + bez, (255, 255, 255, 255))
    mask = Image.new('L', (width, h), 0)
    rrect(ImageDraw.Draw(mask), [0, 0, width - 1, h - 1], r, 255)
    tile.paste(shot, (pad, pad), mask)
    return tile.rotate(angle, resample=Image.BICUBIC, expand=True)


def text_block(canvas, lang, safe):
    """Icon + name, headline, pill: stacked and centred inside the safe box."""
    name, head, sub = TEXT[lang]
    d = ImageDraw.Draw(canvas)
    sx, sy, sw, sh = safe
    cx = sx + sw / 2
    maxw = sw * 0.94

    # sizes as a share of the safe box height, shrunk until each row fits the width
    isz = round(sh * 0.27)
    nsize = round(sh * 0.20)
    while True:
        nf = font(lang, nsize)
        nw, nh, ntop = tsize(d, name, nf)
        if isz + isz * 0.18 + nw <= maxw:
            break
        nsize -= 4
        isz = round(nsize * 1.35)
    hsize = round(sh * 0.24)
    while True:
        hf = font(lang, hsize)
        parts = [tsize(d, p, hf) for p in head]
        hw = sum(p[0] for p in parts)
        if hw <= maxw:
            break
        hsize -= 4
    hh = max(p[1] for p in parts)
    htop = min(p[2] for p in parts)
    ssize = round(sh * 0.095)
    while True:
        sf = font(lang, ssize)
        sw_, sh_, stop = tsize(d, sub, sf)
        if sw_ + ssize * 1.6 <= maxw:
            break
        ssize -= 2
    pill_h = round(sh_ * 1.9)

    gap1, gap2 = sh * 0.09, sh * 0.08
    total = isz + gap1 + hh + gap2 + pill_h
    y = sy + (sh - total) / 2

    # row 1: icon + name
    icon = Image.open(ICON).convert('RGBA').resize((isz, isz), Image.LANCZOS)
    m = Image.new('L', icon.size, 0)
    rrect(ImageDraw.Draw(m), [0, 0, isz - 1, isz - 1], round(isz * 0.225), 255)
    gap = isz * 0.18
    gx = cx - (isz + gap + nw) / 2
    canvas.paste(icon, (round(gx), round(y)), m)
    d.text((gx + isz + gap, y + isz / 2 - nh / 2 - ntop), name, font=nf, fill=NAVY,
           stroke_width=max(2, nsize // 60), stroke_fill=NAVY)
    y += isz + gap1

    # row 2: headline, navy + red
    x = cx - hw / 2
    for part, (pw, _, _), col in zip(head, parts, (NAVY, RED)):
        d.text((x, y - htop), part, font=hf, fill=col, stroke_width=max(3, hsize // 40), stroke_fill=col)
        x += pw
    y += hh + gap2

    # row 3: white pill
    pw = sw_ + ssize * 1.6
    rrect(d, [round(cx - pw / 2), round(y), round(cx + pw / 2), round(y + pill_h)], pill_h // 2, (255, 255, 255))
    d.text((cx - sw_ / 2, y + (pill_h - sh_) / 2 - stop), sub, font=sf, fill=SUBTXT)


for lang in TEXT:
    for name, (W, H), safe, phones in ASSETS:
        canvas = Image.new('RGB', (W, H), BG)
        bubbles(canvas, safe)
        for shot, px, py, wd, ang in phones:
            t = phone(os.path.join(RAW, lang, f'{shot}.png'), wd, ang)
            canvas.paste(t, (px - t.width // 2, py - t.height // 2), t)
        text_block(canvas, lang, safe)
        if GUIDES:
            sx, sy, sw, sh = safe
            ImageDraw.Draw(canvas).rectangle([sx, sy, sx + sw, sy + sh], outline=(0, 170, 0), width=8)
        out = os.path.join(OUT, lang)
        os.makedirs(out, exist_ok=True)
        canvas.save(os.path.join(out, f'{name}.png'))
    print(lang, 'done')
