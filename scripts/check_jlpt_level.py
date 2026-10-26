"""Compare each word's level in data/*.json with the Waller (tanos) JLPT lists.

Usage:
  python3 scripts/check_jlpt_level.py <ref_dir>

- ref_dir holds n1.csv … n5.csv from
  https://github.com/stephenmk/yomitan-jlpt-vocab/tree/main/original_data
  (CC BY-SA 4.0, not stored in the repo). Columns: jmdict_seq,kana,kanji,waller_definition
- The JLPT has published no official word list since 2010; the Waller lists are
  the common reference, so treat results as flags for human review, not verdicts.

Output, per word whose bank level differs from the reference:
  HARDER  ref level is harder than the bank level (e.g. bank N4, ref N2)
  EASIER  ref level is easier by 2+ levels (e.g. bank N2, ref N4/N5)
  MISSING not found in any list (match by kanji, then kana for kana-only words)
Words in the 生活 category have no JLPT level and are only checked for MISSING.
"""
import csv
import glob
import json
import os
import sys
from collections import defaultdict

REF = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
RANK = {'N5': 5, 'N4': 4, 'N3': 3, 'N2': 2, 'N1': 1}

by_kanji, by_kana, by_pair = defaultdict(set), defaultdict(set), defaultdict(set)
for n in range(1, 6):
    for row in csv.DictReader(open(os.path.join(REF, f'n{n}.csv'), encoding='utf-8')):
        lvl = f'N{n}'
        kana = row['kana'].strip()
        by_kana[kana].add(lvl)
        for k in filter(None, (x.strip() for x in row['kanji'].split(';'))):
            by_kanji[k].add(lvl)
            by_pair[(k, kana)].add(lvl)


def ref_levels(w):
    kanji, kana = w.get('kanji', ''), w.get('kana', '')
    if (kanji, kana) in by_pair:
        return by_pair[(kanji, kana)], 'kanji+kana'
    if kanji and kanji != kana and kanji in by_kanji:
        return by_kanji[kanji], 'kanji'
    if kana in by_kana and (not kanji or kanji == kana):
        return by_kana[kana], 'kana'
    if kana in by_kana:
        return by_kana[kana], 'kana-only (homophone risk)'
    return set(), ''


rows = []
for path in sorted(glob.glob(os.path.join(HERE, '..', 'data', 'n*-words.json'))):
    for w in json.load(open(path, encoding='utf-8')):
        refs, how = ref_levels(w)
        lvl = w['level']
        ref_str = '/'.join(sorted(refs, key=lambda x: -RANK[x]))
        if not refs:
            rows.append(('MISSING', w, ref_str, how))
            continue
        if lvl not in RANK:
            continue
        easiest = max(RANK[r] for r in refs)
        if easiest < RANK[lvl]:
            rows.append(('HARDER', w, ref_str, how))
        elif easiest - RANK[lvl] >= 2:
            rows.append(('EASIER', w, ref_str, how))

for tag in ('HARDER', 'EASIER', 'MISSING'):
    sel = [r for r in rows if r[0] == tag]
    print(f'\n== {tag} ({len(sel)}) ==')
    for _, w, ref, how in sel:
        print(f"{w['id']:12} bank={w['level']:3} ref={ref or '-':8} {w.get('kanji','')}（{w['kana']}）{w['meaning_zh']}  [{how}]")
