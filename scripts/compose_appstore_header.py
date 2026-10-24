"""App Store creative asset (product page header + search results), pastel style.

Usage:
  python3 scripts/compose_appstore_header.py <raw_dir> <out_dir> <zh_font.ttf>

- raw_dir: en/ and zh/ with 1170x2532 simulator shots battle1 / correct / result .png
- zh_font: jf open 粉圓 (see compose_appstore_screenshots.py for the download link)
- Writes <out_dir>/{zh,en}/header_universal_5244x2950.png and header_3840x1646.png

Safe area: the universal 16:9 asset is cropped to ~2.33:1 for the header (top and
bottom ~12% cut) and to ~3:2 for search results (left and right ~8% cut), so all
text and the icon stay inside the central 4400 x 2200 px.
"""
import os
import random
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAW, OUT, ZH_FONT = sys.argv[1], sys.argv[2], sys.argv[3]
W, H = 5244, 2950
BG = (255, 228, 234)          # sakura pastel, same as screenshot 1
NAVY = (44, 62, 80)
RED = (226, 71, 95)
SUBTXT = (120, 100, 100)
KANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねの'
HERE = os.path.dirname(os.path.abspath(__file__))
ICON = os.path.join(HERE, '..', 'assets', 'icon.png')

TEXT = {
    'zh': ('日文知識王', ['1 對 1 ', '日文單字對戰'], 'JLPT 考試必選 APP'),
    'en': ('Nihongo Quiz King', ['Japanese ', 'vocab battles'], 'The must-have JLPT app'),
}


def font(lang, size):
    if lang == 'zh':
        return ImageFont.truetype(ZH_FONT, size)
    return ImageFont.truetype('/System/Library/Fonts/SFNSRounded.ttf', size)


def rrect(draw, box, r, fill):
    x0, y0, x1, y1 = box
    draw.rectangle([x0 + r, y0, x1 - r, y1], fill=fill)
    draw.rectangle([x0, y0 + r, x1, y1 - r], fill=fill)
    for cx, cy, a in ((x0, y0, 180), (x1 - 2 * r, y0, 270), (x0, y1 - 2 * r, 90), (x1 - 2 * r, y1 - 2 * r, 0)):
        draw.pieslice([cx, cy, cx + 2 * r, cy + 2 * r], a, a + 90, fill=fill)


def bubbles(canvas):
    rnd = random.Random(7)
    layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    tint = tuple(c - 28 for c in BG)
    kf = ImageFont.truetype(ZH_FONT, 230)
    for x, y in [(260, 300), (4980, 260), (200, 2650), (5000, 2700), (2500, 2780), (1900, 170), (3500, 2800)]:
        r = rnd.randint(150, 220)
        d.ellipse([x - r, y - r, x + r, y + r], fill=tint + (110,))
        ch = rnd.choice(KANA)
        tw, th = d.textsize(ch, font=kf)
        d.text((x - tw / 2, y - th / 2 - 20), ch, font=kf, fill=(255, 255, 255, 200))
    for _ in range(60):
        x, y = rnd.randint(0, W), rnd.randint(0, H)
        r = rnd.randint(16, 40)
        d.ellipse([x - r, y - r, x + r, y + r], fill=tint + (80,))
    canvas.paste(layer, (0, 0), layer)


def phone(shot_path, width, angle):
    shot = Image.open(shot_path).convert('RGB')
    h = round(shot.height * width / shot.width)
    shot = shot.resize((width, h), Image.LANCZOS)
    pad, bez, r = 120, 40, 150
    tile = Image.new('RGBA', (width + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    sh = Image.new('RGBA', tile.size, (0, 0, 0, 0))
    rrect(ImageDraw.Draw(sh), [pad - bez, pad - bez + 30, pad + width + bez, pad + h + bez + 60], r + bez, (120, 90, 90, 90))
    tile.paste(sh.filter(ImageFilter.GaussianBlur(50)), (0, 0), sh.filter(ImageFilter.GaussianBlur(50)))
    rrect(ImageDraw.Draw(tile), [pad - bez, pad - bez, pad + width + bez, pad + h + bez], r + bez, (255, 255, 255, 255))
    mask = Image.new('L', (width, h), 0)
    rrect(ImageDraw.Draw(mask), [0, 0, width - 1, h - 1], r, 255)
    tile.paste(shot, (pad, pad), mask)
    return tile.rotate(angle, resample=Image.BICUBIC, expand=True)


for lang, (name, head, sub) in TEXT.items():
    canvas = Image.new('RGB', (W, H), BG)
    bubbles(canvas)
    d = ImageDraw.Draw(canvas)

    # left block: icon, app name, headline, subline (inside the safe area)
    icon = Image.open(ICON).convert('RGBA').resize((520, 520), Image.LANCZOS)
    m = Image.new('L', icon.size, 0)
    rrect(ImageDraw.Draw(m), [0, 0, 519, 519], 115, 255)
    x0 = 700
    canvas.paste(icon, (x0, 640), m)
    nsize = 200
    while d.textsize(name, font=font(lang, nsize))[0] > 1350:
        nsize -= 5
    d.text((x0 + 600, 900 - nsize * 0.7), name, font=font(lang, nsize), fill=NAVY, stroke_width=4, stroke_fill=NAVY)
    # shrink the headline until it ends before the phones (x ~2750)
    size = 250
    while True:
        hf = font(lang, size)
        if sum(d.textsize(p, font=hf)[0] for p in head) <= 2000 or size <= 120:
            break
        size -= 5
    x = x0
    for part, col in zip(head, (NAVY, RED)):
        d.text((x, 1290), part, font=hf, fill=col, stroke_width=6, stroke_fill=col)
        x += d.textsize(part, font=hf)[0]
    sf = font(lang, 130)
    sw = d.textsize(sub, font=sf)[0]
    rrect(d, [x0 - 10, 1700, x0 + sw + 150, 1930], 115, (255, 255, 255))
    d.text((x0 + 70, 1735), sub, font=sf, fill=SUBTXT)

    # right block: three phones fanned out, kept inside the central height
    shots = [os.path.join(RAW, lang, f'{n}.png') for n in ('battle1', 'correct', 'result')]
    for path, cx, cy, ang, wd in [(shots[2], 4280, 1500, -8, 680), (shots[0], 3330, 1500, 8, 680), (shots[1], 3800, 1440, 0, 780)]:
        t = phone(path, wd, ang)
        canvas.paste(t, (cx - t.width // 2, cy - t.height // 2), t)

    out = os.path.join(OUT, lang)
    os.makedirs(out, exist_ok=True)
    canvas.save(os.path.join(out, 'header_universal_5244x2950.png'))
    # header-only version: crop to 3840x1646's aspect from the centre, then resize
    ch = round(W * 1646 / 3840)
    top = (H - ch) // 2
    canvas.crop((0, top, W, top + ch)).resize((3840, 1646), Image.LANCZOS).save(os.path.join(out, 'header_3840x1646.png'))
    print(lang, 'done')
