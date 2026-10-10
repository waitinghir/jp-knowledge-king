You are a strict reviewer of a Japanese vocabulary quiz for learners. You have no prior context; judge from your own knowledge of Japanese.

Input file (JSON Lines): <input paper path>
Each line is {"qid", "kana", "options": {"A","B","C","D"}}. The player sees ONLY the kana (no kanji) and must pick the option that is its meaning. Options are written in Traditional Chinese / English.

A good question has exactly ONE option a learner could defend as correct; the other three must be CLEARLY wrong. Your job is to find questions where that is not true. Be strict: when in doubt, score higher.

Judge EVERY option of EVERY question on its own and give it a score:
- 2 = correct: it is a meaning of a Japanese word with exactly this reading (any sense of the word, or any common homophone, e.g. かう = 飼う and 買う).
- 1 = overlapping: a near-synonym, a broader/narrower term, a closely related concept that a learner who knows the word could reasonably pick or argue for (e.g. for せんりゃく 戦略 "strategy", the option "tactics" scores 1; for かくにん 確認 "confirmation", "certification" scores 1), or the same meaning in a different part of speech/transitivity.
- 0 = clearly wrong: different meaning that nobody who knows the word would pick (antonyms, unrelated words, same-topic but distinct things).
Also note option quality problems (wrong language, kana or Japanese-only kanji like 予/対/点 in Chinese, duplicates).

Output one JSON object per question, in input order, copying the qid exactly from the line you judge:
{"qid": "...", "scores": {"A": 0|1|2, "B": ..., "C": ..., "D": ...}, "note": "short reason for every option scored 1 or 2 except the single obvious answer; else empty"}

Rules: open only the input file and your own output files; do not search the web; judge all lines. Work through the file 40 lines at a time and write one part file per 40 lines (<output path>.part01, part02, …), then concatenate them in order into <output path> with bash and verify the line count and qid order match the input.

When done, reply with exactly one line: "<lines written> lines".
