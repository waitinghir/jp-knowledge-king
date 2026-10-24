"""Compose App Store screenshots (1242x2688, 6.5") from raw simulator shots.

Usage: python3 scripts/compose_appstore_screenshots.py <raw_dir with en/ zh/> <out_dir>
Raw shots: 1170x2532 simulator screenshots named battle1/correct/home/result/rank.png.
Captions live in CAPTIONS below; keep them in sync with docs/appstore/listing.md.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

SRC = sys.argv[1]   # dir with en/ and zh/ raw shots
OUT = sys.argv[2]
W, H = 1242, 2688
BG = (196, 30, 58)          # brand red #C41E3A
WHITE = (255, 255, 255)
SUB = (255, 225, 230)

FONTS = {
    'zh': {'head': ('/System/Library/Fonts/STHeiti Medium.ttc', 0, 104),
           'sub': ('/System/Library/Fonts/STHeiti Medium.ttc', 0, 58)},
    'en': {'head': ('/System/Library/Fonts/Avenir Next.ttc', 8, 100),
           'sub': ('/System/Library/Fonts/Avenir Next.ttc', 2, 58)},
}

CAPTIONS = {
    'zh': [
        ('battle1', '1 對 1 日文單字對戰', '和 AI 對手限時搶答'),
        ('correct', '10 秒搶答', '越快答對，分數越高'),
        ('home', 'N4 到 N2 任你選', '640 個單字，中英雙語'),
        ('result', '打贏對手，累積升級', '每一題的答案都看得到'),
        ('rank', '每週排行榜', '看看你這週排第幾'),
    ],
    'en': [
        ('battle1', 'Japanese vocab battles', 'Race an AI opponent'),
        ('correct', '10 seconds per question', 'Answer faster, score higher'),
        ('home', 'Pick your level: N4 to N2', '640 words, English and Chinese'),
        ('result', 'Win and level up', 'Review every answer'),
        ('rank', 'Weekly leaderboard', 'See where you rank this week'),
    ],
}


def font(spec):
    path, idx, size = spec
    return ImageFont.truetype(path, size, index=idx)


def rrect(draw, box, r, fill):
    x0, y0, x1, y1 = box
    draw.rectangle([x0 + r, y0, x1 - r, y1], fill=fill)
    draw.rectangle([x0, y0 + r, x1, y1 - r], fill=fill)
    for cx, cy, a in ((x0, y0, 180), (x1 - 2 * r, y0, 270), (x0, y1 - 2 * r, 90), (x1 - 2 * r, y1 - 2 * r, 0)):
        draw.pieslice([cx, cy, cx + 2 * r, cy + 2 * r], a, a + 90, fill=fill)


def rounded(img, r):
    mask = Image.new('L', img.size, 0)
    rrect(ImageDraw.Draw(mask), [0, 0, img.size[0] - 1, img.size[1] - 1], r, 255)
    out = Image.new('RGBA', img.size)
    out.paste(img, (0, 0), mask)
    return out


def centered(draw, y, text, spec, fill, max_w=1120):
    path, idx, size = spec
    while True:
        f = ImageFont.truetype(path, size, index=idx)
        w = draw.textsize(text, font=f)[0]
        if w <= max_w or size <= 40:
            break
        size -= 2
    draw.text(((W - w) / 2, y), text, font=f, fill=fill)


for lang, items in CAPTIONS.items():
    os.makedirs(os.path.join(OUT, lang), exist_ok=True)
    for n, (name, head, sub) in enumerate(items, 1):
        canvas = Image.new('RGB', (W, H), BG)
        d = ImageDraw.Draw(canvas)
        centered(d, 150, head, FONTS[lang]['head'], WHITE)
        centered(d, 300, sub, FONTS[lang]['sub'], SUB)
        shot = Image.open(os.path.join(SRC, lang, f'{name}.png')).convert('RGB')
        sw = 1000
        sh = round(shot.height * sw / shot.width)
        shot = rounded(shot.resize((sw, sh), Image.LANCZOS), 70)
        # thin white frame for contrast against the red background
        frame = Image.new('RGBA', (sw + 16, sh + 16))
        rrect(ImageDraw.Draw(frame), [0, 0, sw + 15, sh + 15], 78, (255, 255, 255, 60))
        top = 470
        canvas.paste(frame, ((W - sw - 16) // 2, top - 8), frame)
        canvas.paste(shot, ((W - sw) // 2, top), shot)
        canvas.save(os.path.join(OUT, lang, f'{n}_{name}.png'))
        print(lang, n, name, canvas.size)
