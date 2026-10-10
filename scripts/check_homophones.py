#!/usr/bin/env python3
"""
L2 homophone check — the quiz card shows ONLY kana, so a distractor that is
the meaning of another word with the same reading is actually a correct answer
(e.g. かう: 飼う "to keep (animal)" vs 買う "to buy").

For every entry, look up all JMdict words with the same kana reading (other
than the entry itself) and flag English distractors that match one of their
glosses. Chinese distractors cannot be checked against JMdict (English-only),
so every flagged entry goes to the blind reviewers (L3) for both languages.

Usage:
  curl -L -o JMdict_e.gz http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz && gunzip JMdict_e.gz
  python3 scripts/check_homophones.py path/to/JMdict_e [--all-entries] [--json out.json]

By default only "common" JMdict words (those with a priority tag) are used as
homophones; rare words would mostly be noise. --all-entries uses every word.

JMdict is © the Electronic Dictionary Research and Development Group, CC BY-SA 4.0.
"""
import glob
import json
import re
import sys
import xml.etree.ElementTree as ET

STOPWORDS = {'to', 'be', 'the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'at',
             'for', 'with', 'one', 'one\'s', 'get', 'have', 'make', 'do', 'something',
             'someone', 'sth', 'sb', 'up', 'out', 'off', 'into', 'about', 'is', 'as',
             'by', 'from', 'that', 'it', 'its', 'not', 'very'}


def norm_phrase(s):
    s = re.sub(r'\([^)]*\)', '', s.lower())
    s = re.sub(r'^\s*to\s+', '', s.strip())
    return re.sub(r'\s+', ' ', s).strip(' .,;')


def content_words(s):
    return {w for w in re.split(r'[^a-z]+', s.lower()) if len(w) > 2 and w not in STOPWORDS}


def load_jmdict(path, common_only):
    """reading -> list of (headword, [glosses])"""
    by_reading = {}
    for _, el in ET.iterparse(path, events=('end',)):
        if el.tag != 'entry':
            continue
        kebs = [k.findtext('keb') for k in el.findall('k_ele')]
        rels = el.findall('r_ele')
        common = any(k.find('ke_pri') is not None for k in el.findall('k_ele')) or \
            any(r.find('re_pri') is not None for r in rels)
        if common_only and not common:
            el.clear()
            continue
        glosses = [g.text for s in el.findall('sense') for g in s.findall('gloss') if g.text]
        head = kebs[0] if kebs else rels[0].findtext('reb')
        for r in rels:
            by_reading.setdefault(r.findtext('reb'), []).append((head, set(kebs), glosses))
        el.clear()
    return by_reading


def main(argv):
    if not argv or argv[0].startswith('-'):
        sys.exit(__doc__)
    jm_path = argv[0]
    common_only = '--all-entries' not in argv
    out_json = argv[argv.index('--json') + 1] if '--json' in argv else None

    by_reading = load_jmdict(jm_path, common_only)
    flagged = []
    for f in sorted(glob.glob('data/*-words.json')):
        for w in json.load(open(f, encoding='utf-8')):
            kana = w['kana']
            # Skip the entry's own JMdict word: matched by kanji, or by kana when
            # the bank stores a kana-only word (e.g. うるさい).
            others = [(h, kebs, gl) for h, kebs, gl in by_reading.get(kana, [])
                      if w['kanji'] not in kebs and h != w['kanji'] and w['kanji'] != kana]
            if not others:
                continue
            hits = []
            for d in w['distractors_en']:
                d_parts = [norm_phrase(p) for p in d.split('/')]
                d_words = content_words(d)
                for head, _, glosses in others:
                    for g in glosses:
                        g_n = norm_phrase(g)
                        if g_n in d_parts or (d_words and d_words <= content_words(g)):
                            hits.append({'distractor': d, 'homophone': head, 'gloss': g})
                            break
            homophones = sorted({h for h, _, _ in others})
            flagged.append({'id': w['id'], 'kana': kana, 'kanji': w['kanji'],
                            'homophones': homophones, 'en_hits': hits})

    with_hits = [x for x in flagged if x['en_hits']]
    for x in with_hits:
        for h in x['en_hits']:
            print(f"HIT  {x['id']} {x['kana']}（{x['kanji']}）: \"{h['distractor']}\" "
                  f"= {h['homophone']} \"{h['gloss']}\"")
    print(f"\n{len(with_hits)} entr(ies) with an English distractor matching a homophone;"
          f" {len(flagged)} entr(ies) have homophones at all (send all to L3 review).")
    if out_json:
        json.dump(flagged, open(out_json, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return 1 if with_hits else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
