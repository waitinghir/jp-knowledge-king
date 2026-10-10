#!/usr/bin/env python3
"""Grade the per-option (v2) blind review over the whole word bank.

For each question and reviewer:
  - distractor flags: a wrong option scored >= 1 (overlapping or correct)
  - answer doubt: the keyed answer scored < 2
Buckets:
  FIX      any distractor flagged by either reviewer -> replace that distractor
           (replacing a distractor is low-risk, so one reviewer is enough)
  ESCALATE a reviewer doubts the keyed answer itself -> needs a human decision
"""
import glob
import json
import os
import sys

base = os.path.dirname(os.path.abspath(__file__))
key = json.load(open(f'{base}/key/answer_key.json', encoding='utf-8'))
papers = {}
for f in glob.glob(f'{base}/papers/*.jsonl'):
    for line in open(f, encoding='utf-8'):
        q = json.loads(line)
        papers[q['qid']] = q
res = {}
for f in glob.glob(f'{base}/results/*.jsonl'):
    model = os.path.basename(f).split('-')[0]
    for line in open(f, encoding='utf-8'):
        if line.strip():
            r = json.loads(line)
            res.setdefault(model, {})[r['qid']] = r

for m, rows in sorted(res.items()):
    print(f'{m}: {len(rows)}/{len(key)} judged')

fix, escalate = [], []
for qid, k in sorted(key.items()):
    ans = k['answer']
    bad_opts, doubts, notes = {}, [], {}
    for m, rows in res.items():
        r = rows.get(qid)
        if not r:
            continue
        s = r['scores']
        if s.get(ans, 0) < 2:
            doubts.append(m)
        for L, v in s.items():
            if L != ans and v >= 1:
                bad_opts.setdefault(L, []).append(f'{m}:{v}')
        if r.get('note'):
            notes[m] = r['note']
    item = {'qid': qid, 'id': k['id'], 'kanji': k['kanji'], 'kana': papers[qid]['kana'],
            'answer': ans, 'options': papers[qid]['options'], 'bad': bad_opts,
            'doubts': doubts, 'notes': notes}
    if doubts:
        escalate.append(item)
    elif bad_opts:
        fix.append(item)

print(f'\nFIX (distractor flagged): {len(fix)}   ESCALATE (answer doubted): {len(escalate)}')
json.dump({'fix': fix, 'escalate': escalate},
          open(f'{base}/triage.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
if '-v' in sys.argv:
    for label, items in (('ESCALATE', escalate), ('FIX', fix)):
        for it in items:
            opts = ' | '.join(f'{L}{"*" if L == it["answer"] else ""}:{t}' for L, t in it['options'].items())
            print(f"\n[{label}] {it['qid']} {it['kana']}（{it['kanji']}） {opts}")
            print(f"   bad={it['bad']} doubts={it['doubts']}")
            for m, n in it['notes'].items():
                print(f'   {m}: {n}')
