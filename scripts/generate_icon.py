#!/usr/bin/env python3
"""Generate app icon for JP Knowledge King."""

from PIL import Image, ImageDraw, ImageFont
import os

SIZE = 1024
OUT_DIR = os.path.join(os.path.dirname(__file__), "../assets")

RED = (188, 0, 45)      # 日本國旗紅
WHITE = (255, 255, 255)
DARK = (30, 30, 30)


def make_icon():
    img = Image.new("RGB", (SIZE, SIZE), WHITE)
    draw = ImageDraw.Draw(img)

    # --- 左邊紅色半圓 ---
    # 圓心在左邊緣，半徑 460 → 右半圓填滿左側
    r = 460
    draw.ellipse([-r, SIZE // 2 - r, r, SIZE // 2 + r], fill=RED)

    # --- 右邊「あ」---
    font = None
    font_candidates = [
        "/System/Library/Fonts/ヒラギノ角ゴシック W8.ttc",
        "/System/Library/Fonts/ヒラギノ明朝 ProN W6.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/PingFang.ttc",
    ]
    for path in font_candidates:
        if os.path.exists(path):
            try:
                font = ImageFont.truetype(path, 580)
                break
            except Exception:
                continue

    char = "あ"
    if font:
        tw, th = draw.textsize(char, font=font)
        # 右半區中央
        tx = (SIZE // 2 + SIZE) // 2 - tw // 2 + 30
        ty = SIZE // 2 - th // 2 - 20
        draw.text((tx, ty), char, font=font, fill=DARK)
    else:
        # fallback: 畫個方塊代替
        draw.rectangle([600, 300, 900, 700], fill=DARK)

    # --- 輸出 ---
    icon_path = os.path.join(OUT_DIR, "icon.png")
    img.save(icon_path, "PNG")
    print(f"✅ icon.png → {icon_path}")

    # adaptive-icon (Android)
    adaptive = Image.new("RGB", (SIZE, SIZE), WHITE)
    inner = img.resize((int(SIZE * 0.8), int(SIZE * 0.8)), Image.LANCZOS)
    offset = (SIZE - inner.size[0]) // 2
    adaptive.paste(inner, (offset, offset))
    adaptive.save(os.path.join(OUT_DIR, "adaptive-icon.png"), "PNG")
    print("✅ adaptive-icon.png")

    # favicon
    img.resize((48, 48), Image.LANCZOS).save(
        os.path.join(OUT_DIR, "favicon.png"), "PNG")
    print("✅ favicon.png")


def make_splash():
    W, H = 1242, 2688  # portrait, fits all iPhones
    img = Image.new("RGB", (W, H), WHITE)
    draw = ImageDraw.Draw(img)

    # 同樣設計，縮放到 splash 尺寸中央
    # 在垂直中央畫一個正方形區塊（800x800）
    box = 800
    cx, cy = W // 2, H // 2

    # 左半圓（相對 box 的圓心）
    r = int(box * 0.45)
    lx = cx - box // 2  # box 左邊緣的 x
    draw.ellipse([lx - r, cy - r, lx + r, cy + r], fill=RED)

    # 右邊「あ」
    font = None
    font_candidates = [
        "/System/Library/Fonts/ヒラギノ角ゴシック W8.ttc",
        "/System/Library/Fonts/ヒラギノ明朝 ProN W6.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/PingFang.ttc",
    ]
    for path in font_candidates:
        if os.path.exists(path):
            try:
                font = ImageFont.truetype(path, int(box * 0.57))
                break
            except Exception:
                continue

    if font:
        char = "あ"
        tw, th = draw.textsize(char, font=font)
        rx = cx + box // 2  # box 右邊緣
        tx = (cx + rx) // 2 - tw // 2 + 20
        ty = cy - th // 2 - 10
        draw.text((tx, ty), char, font=font, fill=DARK)

    splash_path = os.path.join(OUT_DIR, "splash-icon.png")
    img.save(splash_path, "PNG")
    print(f"✅ splash-icon.png → {splash_path}")


if __name__ == "__main__":
    make_icon()
    make_splash()
