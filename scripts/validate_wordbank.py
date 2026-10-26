#!/usr/bin/env python3
"""
Word bank validator — checks BOTH the zh and en versions of every entry.

Usage:
  python3 scripts/validate_wordbank.py            # errors + warning summary
  python3 scripts/validate_wordbank.py -v         # also list every warning
  python3 scripts/validate_wordbank.py data/n2-words.json   # specific files

Exit code 1 if any ERROR is found (used by the pre-commit hook).

ERRORS (must fix):
  - missing / empty fields, wrong number of distractors
  - duplicate ids across files
  - a distractor equals the correct answer, or equals one of its parts
    (e.g. answer "補助、援助", distractor "援助")
  - duplicate distractors
  - zh: Japanese kana or Japanese-only kanji (shinjitai), or Latin letters
  - en: CJK characters or kana
  - kanji field cannot be read as the kana (e.g. 口罩 / マスク): catches Chinese
    written into the Japanese field. Uses the jōyō + jinmeiyō readings in
    scripts/kanji_readings.json (KANJIDIC2, © EDRDG, CC BY-SA 4.0); special
    readings such as 真面目 / まじめ go in READING_EXCEPTIONS

WARNINGS (review by hand — scripts cannot judge meaning):
  - zh distractor shares a character with the answer
  - en distractor shares a content word with the answer

Passing this script does NOT mean the options are good. Every change must
still be read entry by entry, in both languages: "would a learner see two
or more correct options?"
"""
import functools
import glob
import json
import os
import re
import sys

REQUIRED = ['id', 'kanji', 'kana', 'meaning_zh', 'meaning_en',
            'category', 'category_en', 'level', 'distractors', 'distractors_en']

KANA = re.compile(r'[぀-ヿ]')
CJK = re.compile(r'[㐀-鿿]')
LATIN = re.compile(r'[A-Za-z]')

# Japanese-only kanji forms (shinjitai) whose Traditional Chinese form differs.
# Characters also in normal Taiwanese use (e.g. 台) are deliberately excluded.
SHINJITAI = set(
    '対区点仮黒独当説権変広済経験関続帰図応価発単実売読様歴労戦伝転辺数歳総断駅鉄営栄'
    '塩桜薬隠圧囲医縁奥横穏絵拡覚楽勧巻歓観陥気戯犠旧拠挙峡狭暁駆勲径茎恵掲渓継蛍軽鶏'
    '倹剣圏検献険顕厳効鉱国砕斎剤雑参惨桟蚕賛残歯児辞湿写釈寿収従渋獣縦粛処叙奨将焼称'
    '証乗剰壌嬢条浄畳譲醸触嘱寝尽粋酔随髄枢静斉摂窃専浅潜繊践銭禅壮荘捜挿巣装騒増臓蔵'
    '属堕帯滞滝択沢担胆団弾遅昼鋳庁徴聴灯党盗稲闘徳届縄弐悩脳覇廃麦髪抜蛮浜払仏弁舗歩'
    '穂宝豊没毎黙訳予誉揺謡来頼乱覧竜両猟緑涙塁励礼隷霊齢恋炉楼録湾'
)

STOPWORDS = {'to', 'be', 'the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'at',
             'for', 'with', 'one', 'get', 'have', 'make', 'do', 'something',
             'someone', 'sth', 'sb', 'up', 'out', 'off', 'into', 'about'}

# kanji/kana pairs that are correct but cannot be split per character:
# whole-word readings (jukujikun) and kanji outside jōyō + jinmeiyō.
READING_EXCEPTIONS = {('景色', 'けしき'), ('お土産', 'おみやげ'), ('真面目', 'まじめ'),
                      ('躊躇', 'ちゅうちょ')}

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kanji_readings.json'),
          encoding='utf-8') as _f:
    KANJI_READINGS = json.load(_f)

DAKUTEN = dict(zip('かきくけこさしすせそたちつてとはひふへほ', 'がぎぐげござじずぜぞだぢづでどばびぶべぼ'))
HANDAKUTEN = dict(zip('はひふへほ', 'ぱぴぷぺぽ'))


def hira(s):
    return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)


@functools.lru_cache(None)
def reading_variants(c):
    """Readings of one kanji, plus sound changes inside compounds (連濁, 促音便)."""
    out = set()
    for r in KANJI_READINGS.get(c, []):
        out.add(r)
        if r[0] in DAKUTEN:
            out.add(DAKUTEN[r[0]] + r[1:])
        if r[0] in HANDAKUTEN:
            out.add(HANDAKUTEN[r[0]] + r[1:])
        if len(r) >= 2 and r[-1] in 'つちくき':
            out.add(r[:-1] + 'っ')
    return out


def kanji_matches_kana(kanji, kana):
    kanji, kana = hira(kanji), hira(kana)

    @functools.lru_cache(None)
    def go(i, j):
        if i == len(kanji):
            return j == len(kana)
        c = kanji[i]
        if not CJK.search(c) and c != '々':
            return kana.startswith(c, j) and go(i + 1, j + 1)
        rs = reading_variants(kanji[i - 1] if c == '々' and i else c)
        return any(kana.startswith(r, j) and go(i + 1, j + len(r)) for r in rs)

    return go(0, 0)


def zh_parts(s):
    return {p.strip() for p in re.split(r'[、/／,，;；]', s) if p.strip()}


def en_parts(s):
    return {p.strip().lower() for p in re.split(r'[/,;]', s) if p.strip()}


def en_words(s):
    return {w for w in re.split(r'[^a-z]+', s.lower()) if w and w not in STOPWORDS}


def check_entry(w, errors, warnings):
    wid = w.get('id', '?')
    for k in REQUIRED:
        if k not in w or w[k] in ('', None, []):
            errors.append(f'{wid}: missing field "{k}"')
    if errors and errors[-1].startswith(f'{wid}: missing'):
        return

    if (w['kanji'], w['kana']) not in READING_EXCEPTIONS and not kanji_matches_kana(w['kanji'], w['kana']):
        errors.append(f'{wid}: kanji "{w["kanji"]}" cannot be read as "{w["kana"]}" '
                      '(Chinese in the Japanese field? special reading -> READING_EXCEPTIONS)')

    for lang, ans_key, ds_key in (('zh', 'meaning_zh', 'distractors'),
                                  ('en', 'meaning_en', 'distractors_en')):
        ans = w[ans_key]
        ds = w[ds_key]
        if not isinstance(ds, list) or len(ds) != 3:
            errors.append(f'{wid} [{lang}]: needs exactly 3 distractors, got {ds!r}')
            continue

        norm = (lambda s: s.strip()) if lang == 'zh' else (lambda s: s.strip().lower())
        parts = zh_parts if lang == 'zh' else en_parts
        ans_parts = parts(ans)

        if len({norm(d) for d in ds}) < 3:
            errors.append(f'{wid} [{lang}]: duplicate distractors {ds}')

        for d in ds:
            if not d.strip():
                errors.append(f'{wid} [{lang}]: empty distractor')
                continue
            if norm(d) == norm(ans) or parts(d) & ans_parts:
                errors.append(f'{wid} [{lang}]: distractor "{d}" matches answer "{ans}"')

            if lang == 'zh':
                if KANA.search(d):
                    errors.append(f'{wid} [zh]: kana in distractor "{d}"')
                bad = sorted(set(d) & SHINJITAI)
                if bad:
                    errors.append(f'{wid} [zh]: Japanese kanji {"".join(bad)} in "{d}"')
                if LATIN.search(d):
                    errors.append(f'{wid} [zh]: Latin letters in "{d}"')
                shared = sorted(set(d) & set(re.sub(r'[、/（）()]', '', ans)))
                if shared:
                    warnings.append(f'{wid} [zh]: "{d}" shares {"".join(shared)} with "{ans}"')
            else:
                if CJK.search(d) or KANA.search(d):
                    errors.append(f'{wid} [en]: CJK/kana in distractor "{d}"')
                shared = sorted(en_words(d) & en_words(ans))
                if shared:
                    warnings.append(f'{wid} [en]: "{d}" shares "{", ".join(shared)}" with "{ans}"')

        # The correct answer itself must also be in the right script.
        if lang == 'zh' and (KANA.search(ans) or set(ans) & SHINJITAI):
            errors.append(f'{wid} [zh]: answer "{ans}" contains Japanese characters')
        if lang == 'en' and (CJK.search(ans) or KANA.search(ans)):
            errors.append(f'{wid} [en]: answer "{ans}" contains CJK/kana')


def main(argv):
    verbose = '-v' in argv
    files = [a for a in argv if not a.startswith('-')] or sorted(glob.glob('data/*-words.json'))
    errors, warnings, seen = [], [], {}
    for f in files:
        try:
            data = json.load(open(f, encoding='utf-8'))
        except Exception as e:  # noqa: BLE001
            errors.append(f'{f}: invalid JSON ({e})')
            continue
        if not isinstance(data, list) or not data:
            errors.append(f'{f}: must be a non-empty JSON array')
            continue
        for w in data:
            wid = w.get('id')
            if wid in seen:
                errors.append(f'{wid}: duplicate id (in {seen[wid]} and {f})')
            seen[wid] = f
            check_entry(w, errors, warnings)
        print(f'checked {f}: {len(data)} entries')

    for e in errors:
        print('ERROR  ', e)
    if verbose:
        for w in warnings:
            print('warn   ', w)
    print(f'\n{len(errors)} error(s), {len(warnings)} warning(s)'
          + ('' if verbose else ' (use -v to list warnings)'))
    print('Reminder: also read every changed entry by hand, in BOTH zh and en.')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
