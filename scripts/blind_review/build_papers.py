#!/usr/bin/env python3
"""Build blind-review papers: kana + 4 shuffled options per question, answer key kept apart.

Usage: python3 scripts/blind_review/build_papers.py OUT_DIR [--ids n4_001,n3_002 ...] [--per-paper 320]
Writes OUT_DIR/papers/{zh,en}-N.jsonl (give these to reviewers) and OUT_DIR/key/answer_key.json
(never give to reviewers). Then grade with: python3 scripts/blind_review/grade.py (copy it into OUT_DIR).
"""
import glob, hashlib, json, os, random, sys

out = sys.argv[1]
ids = set(sys.argv[sys.argv.index('--ids') + 1].split(',')) if '--ids' in sys.argv else None
per = int(sys.argv[sys.argv.index('--per-paper') + 1]) if '--per-paper' in sys.argv else 320
os.makedirs(f'{out}/papers', exist_ok=True); os.makedirs(f'{out}/key', exist_ok=True)
items, key = {'zh': [], 'en': []}, {}
for f in sorted(glob.glob('data/*-words.json')):
    for w in json.load(open(f, encoding='utf-8')):
        if ids and w['id'] not in ids:
            continue
        for lang, (a, ds) in {'zh': (w['meaning_zh'], w['distractors']),
                              'en': (w['meaning_en'], w['distractors_en'])}.items():
            opts = [a] + list(ds)
            random.Random(int(hashlib.md5((w['id'] + lang).encode()).hexdigest(), 16)).shuffle(opts)
            qid = f"{lang}-{w['id']}"
            items[lang].append({'qid': qid, 'kana': w['kana'], 'options': dict(zip('ABCD', opts))})
            key[qid] = {'answer': 'ABCD'[opts.index(a)], 'id': w['id'], 'kanji': w['kanji']}
for lang, rows in items.items():
    for n, i in enumerate(range(0, len(rows), per), 1):
        with open(f'{out}/papers/{lang}-{n}.jsonl', 'w', encoding='utf-8') as fh:
            fh.writelines(json.dumps(r, ensure_ascii=False) + '\n' for r in rows[i:i + per])
json.dump(key, open(f'{out}/key/answer_key.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(f'{len(key)} questions -> {out}')
