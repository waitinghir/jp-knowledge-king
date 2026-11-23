import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BattleOutcome, WordLevel } from '../types';

// "Try hiragana" hint on the result screen (1.9.x).
// A player who loses two battles in a row with under 40% right answers over
// those two battles is most likely guessing — the words are too hard for now.
// Suggest hiragana once, ever; the rookie AI pacing can't help someone who
// can't read the question yet.

const SHOWN_KEY = 'jp_king_kana_hint_shown';
const LAST_KEY = 'jp_king_last_battle_acc';
const MAX_ACC = 0.4;

interface Acc {
  correct: number;
  total: number;
}

/**
 * Call once per finished battle. Remembers this battle's right answers for the
 * next call and returns true when the hint should be shown now.
 */
export async function shouldShowKanaHint(
  level: WordLevel,
  recentOutcomes: BattleOutcome[],
  correct: number,
  total: number,
): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(LAST_KEY);
    const prev: Acc | null = raw ? JSON.parse(raw) : null;
    await AsyncStorage.setItem(LAST_KEY, JSON.stringify({ correct, total }));

    if (level === 'hiragana') return false;
    const last2 = recentOutcomes.slice(-2);
    if (last2.length < 2 || last2.some((o) => o !== 'lose')) return false;
    if (!prev || prev.total + total === 0) return false;
    if ((prev.correct + correct) / (prev.total + total) >= MAX_ACC) return false;

    if ((await AsyncStorage.getItem(SHOWN_KEY)) !== null) return false;
    await AsyncStorage.setItem(SHOWN_KEY, '1');
    return true;
  } catch {
    return false;
  }
}
