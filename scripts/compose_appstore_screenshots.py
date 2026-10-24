"""Compose App Store screenshots (1242x2688, 6.5") in the cute pastel style.

Usage:
  python3 scripts/compose_appstore_screenshots.py <raw_dir> <out_dir> pastel <zh_font.ttf>

- raw_dir has en/ and zh/ with 1170x2532 simulator shots named
  battle1 / correct / home / result / rank .png
- zh_font: jf open 粉圓 (SIL OFL, free for commercial use), not stored in the repo:
  https://github.com/justfont/open-huninn-font/releases/download/v2.1/jf-openhuninn-2.1.ttf
- English uses the macOS system SF Rounded font.
- Captions live in CAPTIONS below; keep them in sync with docs/appstore/listing.md.
- Style "pastel": one pastel background per screen, navy + soft red headline,
  white pill subline, white bezel phone with soft shadow, floating kana bubbles.
"""
import os
import random
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

RAW, OUT, STYLE = sys.argv[1], sys.argv[2], sys.argv[3]
ZH_FONT = sys.argv[4] if len(sys.argv) > 4 else '/System/Library/Fonts/STHeiti Medium.ttc'
W, H = 1242, 2688
NAVY = (44, 62, 80)
RED = (226, 71, 95)        # softer than the app's #C41E3A

PASTELS = [(255, 228, 234), (223, 245, 236), (255, 243, 204), (236, 230, 255), (224, 240, 255)]
CREAM = (255, 246, 238)

CAPTIONS = {
    'zh': [
        ('battle1', ['1 對 1 ', '日文單字對戰'], '和對手限時搶答'),
        ('correct', ['10 秒', '搶答'], '越快答對，分數越高'),
        ('home', ['N4 到 N2 ', '任你選'], '中英雙語，隨時練習'),
        ('result', ['打贏對手，', '累積升級'], '每一題的答案都看得到'),
        ('rank', ['每週', '排行榜'], '看看你這週排第幾'),
    ],
    'en': [
        ('battle1', ['Japanese ', 'vocab battles'], 'Race an opponent'),
        ('correct', ['10 seconds ', 'per question'], 'Answer faster, score higher'),
        ('home', ['Pick your level: ', 'N4 to N2'], 'English and Chinese, practice anytime'),
        ('result', ['Win and ', 'level up'], 'Review every answer'),
        ('rank', ['Weekly ', 'leaderboard'], 'See where you rank this week'),
    ],
}
KANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねの'


def fonts(lang, size):
    if lang == 'zh':
        return ImageFont.truetype(ZH_FONT, size)
    return ImageFont.truetype('/System/Library/Fonts/SFNSRounded.ttf', size)


def rrect(draw, box, r, fill):
    x0, y0, x1, y1 = box
    draw.rectangle([x0 + r, y0, x1 - r, y1], fill=fill)
    draw.rectangle([x0, y0 + r, x1, y1 - r], fill=fill)
    for cx, cy, a in ((x0, y0, 180), (x1 - 2 * r, y0, 270), (x0, y1 - 2 * r, 90), (x1 - 2 * r, y1 - 2 * r, 0)):
        draw.pieslice([cx, cy, cx + 2 * r, cy + 2 * r], a, a + 90, fill=fill)


def decorate(canvas, bg, seed):
    """Soft floating kana bubbles and dots."""
    rnd = random.Random(seed)
    layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    tint = tuple(max(0, c - 28) for c in bg)
    kana_font = ImageFont.truetype(ZH_FONT, 90)
    spots = [(70, 80), (1090, 60), (40, 560), (1130, 520), (60, 2450), (1110, 2400), (980, 2560), (200, 2580)]
    for x, y in spots:
        r = rnd.randint(55, 85)
        d.ellipse([x - r, y - r, x + r, y + r], fill=tint + (110,))
        ch = rnd.choice(KANA)
        tw, th = d.textsize(ch, font=kana_font)
        d.text((x - tw / 2, y - th / 2 - 8), ch, font=kana_font, fill=(255, 255, 255, 200))
    for _ in range(26):
        x, y = rnd.randint(0, W), rnd.choice([rnd.randint(0, 600), rnd.randint(2300, H)])
        r = rnd.randint(8, 18)
        d.ellipse([x - r, y - r, x + r, y + r], fill=tint + (90,))
    canvas.paste(layer, (0, 0), layer)


def headline(draw, y, parts, lang, max_w=1120):
    size = 112 if lang == 'zh' else 104
    while True:
        f = fonts(lang, size)
        widths = [draw.textsize(p, font=f)[0] for p in parts]
        if sum(widths) <= max_w or size <= 50:
            break
        size -= 2
    x = (W - sum(widths)) / 2
    for p, w, col in zip(parts, widths, (NAVY, RED)):
        draw.text((x, y), p, font=f, fill=col, stroke_width=3 if lang == 'zh' else 2, stroke_fill=col)
        x += w


def sub(draw, y, text, lang):
    f = fonts(lang, 60)
    w = draw.textsize(text, font=f)[0]
    pad = 36
    rrect(draw, [(W - w) / 2 - pad, y - 14, (W + w) / 2 + pad, y + 80], 47, (255, 255, 255))
    draw.text(((W - w) / 2, y), text, font=f, fill=(120, 100, 100))


def phone(canvas, shot, top):
    sw = 960
    sh = round(shot.height * sw / shot.width)
    shot = shot.resize((sw, sh), Image.LANCZOS)
    mask = Image.new('L', (sw, sh), 0)
    rrect(ImageDraw.Draw(mask), [0, 0, sw - 1, sh - 1], 72, 255)
    x = (W - sw) // 2
    # soft shadow + white bezel
    shadow = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    rrect(ImageDraw.Draw(shadow), [x - 18, top + 6, x + sw + 18, top + sh + 40], 92, (120, 90, 90, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    canvas.paste(shadow, (0, 0), shadow)
    bezel = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    rrect(ImageDraw.Draw(bezel), [x - 18, top - 18, x + sw + 18, top + sh + 18], 90, (255, 255, 255, 255))
    canvas.paste(bezel, (0, 0), bezel)
    canvas.paste(shot, (x, top), mask)


for lang, items in CAPTIONS.items():
    os.makedirs(os.path.join(OUT, lang), exist_ok=True)
    for n, (name, parts, subtext) in enumerate(items, 1):
        bg = PASTELS[n - 1] if STYLE == 'pastel' else CREAM
        canvas = Image.new('RGB', (W, H), bg)
        decorate(canvas, bg if STYLE == 'pastel' else (255, 214, 222), n)
        d = ImageDraw.Draw(canvas)
        headline(d, 140, parts, lang)
        sub(d, 300, subtext, lang)
        phone(canvas, Image.open(os.path.join(RAW, lang, f'{name}.png')).convert('RGB'), 470)
        canvas.save(os.path.join(OUT, lang, f'{n}_{name}.png'))

for lang in ('zh', 'en'):
    files = sorted(f for f in os.listdir(os.path.join(OUT, lang)) if f.endswith('.png'))
    ims = [Image.open(os.path.join(OUT, lang, f)).resize((248, 538)) for f in files]
    sheet = Image.new('RGB', (258 * 5 - 10, 538), (40, 40, 40))
    for i, im in enumerate(ims):
        sheet.paste(im, (i * 258, 0))
    sheet.save(os.path.join(OUT, f'preview_{lang}.png'))
print('done', STYLE)
