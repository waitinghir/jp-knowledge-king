"""Simulate battle win rates against the AI opponent, now vs. candidate changes.

Chosen 2026-11-23: d2 (shipped in utils/ai-opponent.ts simulateAIAnswer).

Usage:
  python3 scripts/simulate_ai_difficulty.py [players_per_cell]

Mirrors utils/ai-opponent.ts (adaptiveDifficulty, simulateAIAnswer) and
utils/scoring.ts (calculateScore). Keep the CURRENT model in sync with those
files when they change.

Player model: answers each of the 5 questions correctly with probability
`acc`; takes `secs` seconds on average (+-1.5 s jitter, 1-9.9 s). The AI is
drawn after the player answers (as in app/battle/play.tsx), so a strategy may
look at the player's time on the same question.

Reported per (acc, secs):
  g1     win rate of the 1st battle
  g1-3   average win rate over battles 1-3      (target >= 50% for 50% / 7 s)
  g4-10  average win rate over battles 4-10
  g11+   average win rate over battles 11-60    (design: 50% acc -> 35-40%)
A draw counts as not a win.
"""
import random
import sys

QUESTIONS = 5
TOTAL_TIME = 10
ROOKIE_GAMES = 10
N_GAMES = 60


def score(correct, t):
    if not correct:
        return 0
    return int(100 * (max(0, TOTAL_TIME - t) / TOTAL_TIME + 0.1))


# --- current game logic (utils/ai-opponent.ts) ---------------------------------

def difficulty_current(recent, games, rnd):
    last = recent[-3:]
    streak = 0
    for o in reversed(last):
        if o != 'win':
            break
        streak += 1
    ramp = min(1, games / ROOKIE_GAMES)
    if last and last[-1] == 'lose':
        return 0.35 + 0.10 * ramp + rnd.random() * 0.15
    if streak >= 3 and ramp == 1:
        return 0.85 + rnd.random() * 0.10
    return 0.45 + 0.15 * ramp + rnd.random() * 0.15


def ai_answer_current(diff, rnd):
    correct = rnd.random() < diff
    if correct:
        t = (3 if diff < 0.65 else 2) + rnd.random() * 4
    else:
        t = min(10, 5 + rnd.random() * 4)
    return correct, round(t, 1)


# --- candidates ------------------------------------------------------------------

class Current:
    name = 'now'
    desc = '現況'

    def difficulty(self, recent, games, rnd):
        return difficulty_current(recent, games, rnd)

    def ai(self, diff, games, player_t, rnd):
        return ai_answer_current(diff, rnd)


class SlowRookie(Current):
    """(a1) rookie AI answers later: +3 s in the 1st battle, fading to +0 by battle 10."""
    name = 'a1'
    desc = '(a) 新手期 AI 答得慢：第 1 場答對多 3 秒，到第 10 場遞減為 0'

    def ai(self, diff, games, player_t, rnd):
        c, t = ai_answer_current(diff, rnd)
        if c:
            t = min(9.5, t + 3 * (1 - min(1, games / ROOKIE_GAMES)))
        return c, round(t, 1)


class WeakRookie(Current):
    """(a2) rookie AI accuracy starts lower: 0.30-0.45 (0.20-0.35 after a loss) in battle 1."""
    name = 'a2'
    desc = '(a) 新手期 AI 更弱：第 1 場正確率 0.30–0.45（輸了 0.20–0.35），到第 10 場回到原本'

    def difficulty(self, recent, games, rnd):
        last = recent[-3:]
        ramp = min(1, games / ROOKIE_GAMES)
        if ramp == 1:
            return difficulty_current(recent, games, rnd)
        if last and last[-1] == 'lose':
            return 0.20 + 0.25 * ramp + rnd.random() * 0.15
        return 0.30 + 0.30 * ramp + rnd.random() * 0.15


class SlowAndWeak(SlowRookie, WeakRookie):
    name = 'a1+a2'
    desc = '(a) 兩者都做：答得慢＋更弱'

    def difficulty(self, recent, games, rnd):
        return WeakRookie.difficulty(self, recent, games, rnd)

    def ai(self, diff, games, player_t, rnd):
        return SlowRookie.ai(self, diff, games, player_t, rnd)


class WeakFirst(Current):
    """(b) only the 1st battle: AI accuracy 0.30, answers 5-9 s."""
    name = 'b'
    desc = '(b) 只有第 1 場保證弱：正確率 0.30、答對 5–9 秒，之後照舊'

    def difficulty(self, recent, games, rnd):
        return 0.30 if games == 0 else difficulty_current(recent, games, rnd)

    def ai(self, diff, games, player_t, rnd):
        if games == 0:
            c = rnd.random() < diff
            t = 5 + rnd.random() * 4 if c else min(10, 5 + rnd.random() * 4)
            return c, round(t, 1)
        return ai_answer_current(diff, rnd)


class MirrorPace(Current):
    """(d) rookie AI answers at about the player's own pace on that question.
    AI correct time = player's time + U(-1, +2) s in battle 1, blending to the
    normal 2-7 s by battle 10. Accuracy unchanged. The AI is never quicker than
    it is now, so fast players see almost no change."""
    name = 'd'
    desc = '(d) 新手期 AI 跟著玩家的速度：答對時間 ≈ 玩家這題的秒數 −1～+2 秒，到第 10 場淡出'

    def ai(self, diff, games, player_t, rnd):
        c, t = ai_answer_current(diff, rnd)
        ramp = min(1, games / ROOKIE_GAMES)
        if c and ramp < 1:
            mirror = min(9.5, max(1, player_t + rnd.uniform(-1, 2)))
            t = max(t, (1 - ramp) * mirror + ramp * t)   # never faster than now
        return c, round(t, 1)


class MirrorPaceSlower(Current):
    """(d2) like (d) but the AI is never quicker than the player: player's time + U(0, 2.5) s."""
    name = 'd2'
    desc = '(d2) 同 (d)，但 AI 答對一定不比玩家快：玩家這題的秒數 +0～+2.5 秒'

    def ai(self, diff, games, player_t, rnd):
        c, t = ai_answer_current(diff, rnd)
        ramp = min(1, games / ROOKIE_GAMES)
        if c and ramp < 1:
            mirror = min(9.5, max(1, player_t + rnd.uniform(0, 2.5)))
            t = max(t, (1 - ramp) * mirror + ramp * t)
        return c, round(t, 1)


STRATEGIES = [Current(), SlowRookie(), WeakRookie(), SlowAndWeak(), WeakFirst(), MirrorPace(), MirrorPaceSlower()]


def play(strategy, acc, secs, rnd):
    recent, wins = [], []
    for g in range(N_GAMES):
        diff = strategy.difficulty(recent, g, rnd)
        me = ai = 0
        for _ in range(QUESTIONS):
            pt = round(min(9.9, max(1, secs + rnd.uniform(-1.5, 1.5))), 1)
            pc = rnd.random() < acc
            me += score(pc, pt)
            ac, at = strategy.ai(diff, g, pt, rnd)
            ai += score(ac, at)
        out = 'win' if me > ai else 'lose' if me < ai else 'draw'
        recent = (recent + [out])[-5:]
        wins.append(out == 'win')
    return wins


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 4000
    rnd = random.Random(42)
    accs, times = [0.25, 0.50, 0.70], [3, 5, 7]
    for s in STRATEGIES:
        print(f'\n## {s.name}: {s.desc}')
        print('| 正確率 | 秒數 | 第1場 | 第1–3場 | 第4–10場 | 第11場起 |')
        print('|---|---|---|---|---|---|')
        for a in accs:
            for t in times:
                tot = [0] * N_GAMES
                for _ in range(n):
                    for i, w in enumerate(play(s, a, t, rnd)):
                        tot[i] += w
                r = [x / n for x in tot]
                avg = lambda xs: sum(xs) / len(xs)
                print(f'| {a:.0%} | {t} | {r[0]:.0%} | {avg(r[0:3]):.0%} | {avg(r[3:10]):.0%} | {avg(r[10:]):.0%} |')


if __name__ == '__main__':
    main()
