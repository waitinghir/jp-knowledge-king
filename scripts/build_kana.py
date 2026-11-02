"""Build data/kana.json, the question bank for the hiragana / katakana modes.

Usage:
  python3 scripts/build_kana.py        # rewrites data/kana.json

Each entry is one kana with 3 distractor kana from the same script. The game
asks it two ways (utils/kana.ts picks one per question):
  A. show the kana, choose its romaji      (き → ki / sa / chi / ma)
  B. show the romaji, choose the kana      (ki → き / さ / ち / ま)
so the distractors must be kana that a learner could mix up with the answer:
look-alikes first (LOOK_ALIKE, hand-written), then the voiced / plain pair,
then same row or same vowel. Hepburn romaji. ぢ づ を (and ヂ ヅ ヲ) are left
out because their romaji equals じ ず お, which would give two correct options.

After changing LOOK_ALIKE, read the printed table by hand: does each row have
exactly one correct option, and are the distractors plausible?
"""
import json
import os

SEION = [
    ('あ', 'a'), ('い', 'i'), ('う', 'u'), ('え', 'e'), ('お', 'o'),
    ('か', 'ka'), ('き', 'ki'), ('く', 'ku'), ('け', 'ke'), ('こ', 'ko'),
    ('さ', 'sa'), ('し', 'shi'), ('す', 'su'), ('せ', 'se'), ('そ', 'so'),
    ('た', 'ta'), ('ち', 'chi'), ('つ', 'tsu'), ('て', 'te'), ('と', 'to'),
    ('な', 'na'), ('に', 'ni'), ('ぬ', 'nu'), ('ね', 'ne'), ('の', 'no'),
    ('は', 'ha'), ('ひ', 'hi'), ('ふ', 'fu'), ('へ', 'he'), ('ほ', 'ho'),
    ('ま', 'ma'), ('み', 'mi'), ('む', 'mu'), ('め', 'me'), ('も', 'mo'),
    ('や', 'ya'), ('ゆ', 'yu'), ('よ', 'yo'),
    ('ら', 'ra'), ('り', 'ri'), ('る', 'ru'), ('れ', 're'), ('ろ', 'ro'),
    ('わ', 'wa'), ('ん', 'n'),
]
DAKUON = [
    ('が', 'ga'), ('ぎ', 'gi'), ('ぐ', 'gu'), ('げ', 'ge'), ('ご', 'go'),
    ('ざ', 'za'), ('じ', 'ji'), ('ず', 'zu'), ('ぜ', 'ze'), ('ぞ', 'zo'),
    ('だ', 'da'), ('で', 'de'), ('ど', 'do'),
    ('ば', 'ba'), ('び', 'bi'), ('ぶ', 'bu'), ('べ', 'be'), ('ぼ', 'bo'),
    ('ぱ', 'pa'), ('ぴ', 'pi'), ('ぷ', 'pu'), ('ぺ', 'pe'), ('ぽ', 'po'),
]
YOON_BASE = [('き', 'k'), ('し', 'sh'), ('ち', 'ch'), ('に', 'n'), ('ひ', 'h'), ('み', 'm'),
             ('り', 'r'), ('ぎ', 'g'), ('じ', 'j'), ('び', 'b'), ('ぴ', 'p')]
YOON = []
for base, c in YOON_BASE:
    for small, v in (('ゃ', 'a'), ('ゅ', 'u'), ('ょ', 'o')):
        YOON.append((base + small, (c if c in ('sh', 'ch', 'j') else c + 'y') + v))

# Hand-written look-alike groups (by shape). A group that starts with the
# kana itself is used first, then the others in order.
LOOK_ALIKE = {
    'hiragana': [
        'あおめぬの', 'いりこ', 'うつら', 'るろらち', 'えんそ', 'かや', 'きさちま',
        'くへし', 'けはほに', 'こたにい', 'すむおあ', 'せやも', 'たなにけ', 'てそ', 'ちさら', 'よまほ',
        'ねれわぬ', 'はほよけ', 'ふぶぷ', 'まもほよ', 'みあむ', 'めぬあね', 'ゆよる',
        'らうろる', 'われね', 'しもつ', 'とどこ', 'ひびぴ',
    ],
    'katakana': [
        'シツミン', 'ソンリノ', 'ツシソ', 'ンソシ', 'クケタワウ', 'タクケ', 'ワウクフ',
        'フワヌラ', 'ヌスフメ', 'スヌヲ', 'ラフヲ', 'ヨユコ', 'コユヨロ', 'ユコヨ',
        'エニユ', 'ニエ', 'ナメチ', 'メナヌ', 'ノメソ', 'チテナ', 'テチ', 'セヤ',
        'ヤセ', 'マムア', 'ムマ', 'アマヤ', 'ロコ', 'イト', 'トイ', 'カヤ', 'キモ',
        'モキ', 'サセ', 'ハへ', 'ヘハ', 'ホオ', 'オホ', 'ルレ', 'レル', 'ミシ', 'ネホ',
        'ケクタ', 'ウワ', 'ヒビピ',
    ],
}

H2K = {chr(c): chr(c + 0x60) for c in range(0x3041, 0x3097)}


def kata(s):
    return ''.join(H2K.get(c, c) for c in s)


VOWELS = 'aiueo'


def vowel(r):
    return r[-1]


def consonant(r):
    return r[:-1] if r[-1] in VOWELS else r


VOICED = {'k': 'g', 'g': 'k', 's': 'z', 'z': 's', 'sh': 'j', 'j': 'sh', 't': 'd', 'd': 't',
          'h': 'b', 'b': 'p', 'p': 'b', 'f': 'b', 'ch': 'j', 'ky': 'gy', 'gy': 'ky',
          'shy': 'jy', 'hy': 'by', 'by': 'py', 'py': 'by'}


def build(script):
    conv = (lambda s: s) if script == 'hiragana' else kata
    entries = []
    for group, rows in (('seion', SEION), ('dakuon', DAKUON), ('yoon', YOON)):
        for k, r in rows:
            entries.append({'kana': conv(k), 'romaji': r, 'group': group})
    by_kana = {e['kana']: e for e in entries}
    romaji_of = {e['kana']: e['romaji'] for e in entries}
    looks = LOOK_ALIKE[script]
    # yōon rows with no look-alike or voiced partner: closest-sounding row
    yoon_extra = {'ny': 'my', 'my': 'ny', 'ry': 'ny'}

    for e in entries:
        k, r = e['kana'], e['romaji']
        picks = []

        def add(c):
            if c in by_kana and c != k and c not in picks and romaji_of[c] != r and len(picks) < 3:
                picks.append(c)

        if e['group'] == 'yoon':
            base, small = k[0], k[1]
            # same consonant, other vowels: きゃ → きゅ きょ
            for s2 in conv('ゃゅょ'):
                add(base + s2)
            # look-alike base with the same small kana: きゃ → ちゃ
            for g in looks:
                if base in g:
                    for c in g:
                        add(c + small)
            # voiced pair: きゃ → ぎゃ
            for e2 in entries:
                if e2['group'] == 'yoon' and e2['romaji'][-1] == r[-1] and \
                        VOICED.get(consonant(r)) == consonant(e2['romaji']):
                    add(e2['kana'])
            extra = yoon_extra.get(consonant(r))
            for e2 in entries:
                if extra and e2['group'] == 'yoon' and e2['romaji'] == extra + r[-1]:
                    add(e2['kana'])
        else:
            for g in sorted(looks, key=lambda g: g[0] != k):
                if k in g:
                    for c in g:
                        add(c)
            for e2 in entries:  # voiced / plain pair, same vowel
                if e2['group'] != 'yoon' and vowel(e2['romaji']) == vowel(r) and \
                        VOICED.get(consonant(r)) == consonant(e2['romaji']):
                    add(e2['kana'])
            for e2 in entries:  # same row
                if e2['group'] == e['group'] and consonant(e2['romaji']) == consonant(r):
                    add(e2['kana'])
            for e2 in entries:  # same vowel, same group
                if e2['group'] == e['group'] and vowel(e2['romaji']) == vowel(r):
                    add(e2['kana'])
        e['distractors'] = picks
        e['id'] = f"{script[0]}_{r}"
        e['script'] = script
    return [{'id': e['id'], 'kana': e['kana'], 'romaji': e['romaji'], 'script': script,
             'group': e['group'], 'distractors': e['distractors']} for e in entries]


if __name__ == '__main__':
    out = build('hiragana') + build('katakana')
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'kana.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write('\n')
    rom = {(e['script'], e['kana']): e['romaji'] for e in out}
    for e in out:
        ds = ' '.join(f"{d}({rom[(e['script'], d)]})" for d in e['distractors'])
        print(f"{e['kana']:3}{e['romaji']:5} | {ds}")
    print(len(out), 'entries')
