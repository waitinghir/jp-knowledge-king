#!/usr/bin/env python3
"""Generate WAV sound effects for JP Knowledge King."""

import wave, struct, math, os

OUT = os.path.join(os.path.dirname(__file__), "../assets/sounds")
os.makedirs(OUT, exist_ok=True)

RATE = 22050

def sine(freq, duration, volume=0.5, fade_ms=20):
    """Generate a single sine tone."""
    n = int(RATE * duration)
    fade = int(RATE * fade_ms / 1000)
    samples = []
    for i in range(n):
        s = math.sin(2 * math.pi * freq * i / RATE)
        # fade in/out to avoid clicks
        env = 1.0
        if i < fade:
            env = i / fade
        elif i > n - fade:
            env = (n - i) / fade
        samples.append(s * volume * env)
    return samples

def concat(*parts):
    result = []
    for p in parts:
        result.extend(p)
    return result

def save(filename, samples):
    path = os.path.join(OUT, filename)
    with wave.open(path, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        for s in samples:
            val = max(-32767, min(32767, int(s * 32767)))
            f.writeframes(struct.pack('<h', val))
    print(f"✅ {filename}")

# tap: short click (80ms, 600Hz)
save("tap.wav", sine(600, 0.08, 0.3))

# correct: ascending two-tone chime (C5 → E5)
save("correct.wav", concat(
    sine(523, 0.12, 0.5),
    sine(659, 0.20, 0.5),
))

# incorrect: descending buzz (220Hz, slight wobble)
def buzz(duration):
    n = int(RATE * duration)
    fade = int(RATE * 0.03)
    samples = []
    for i in range(n):
        freq = 220 - 40 * (i / n)   # descend
        s = math.sin(2 * math.pi * freq * i / RATE)
        # add slight harmonic
        s += 0.3 * math.sin(2 * math.pi * freq * 2 * i / RATE)
        env = 1.0
        if i < fade:
            env = i / fade
        elif i > n - fade:
            env = (n - i) / fade
        samples.append(s * 0.35 * env)
    return samples

save("incorrect.wav", buzz(0.35))

# timeout: descending alarm (A4 → F4)
save("timeout.wav", concat(
    sine(440, 0.15, 0.4),
    sine(349, 0.25, 0.35),
))

# win: victory jingle C-E-G-C5 (quick ascending)
save("win.wav", concat(
    sine(262, 0.10, 0.5),  # C4
    sine(330, 0.10, 0.5),  # E4
    sine(392, 0.10, 0.5),  # G4
    sine(523, 0.35, 0.55), # C5 long
))

# lose: sad descending E-D-C
save("lose.wav", concat(
    sine(330, 0.18, 0.4),  # E4
    sine(294, 0.18, 0.38), # D4
    sine(262, 0.35, 0.35), # C4 long
))

print(f"\n音效檔儲存在 assets/sounds/")
