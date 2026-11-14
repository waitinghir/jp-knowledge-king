import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import type { BattleOutcome, PlayerData } from '../types';

// Ask for an App Store rating right after a WIN, at a few good moments.
// iOS decides whether the sheet actually appears (max ~3 times a year per
// user), so this never nags; it just picks good moments to ask.
//
// 1.8.0: the first ask moved from "3rd game" to "first win on the 2nd
// practised day or later", so it never lands on the same day as the
// notification ask (first launch / 2nd battle). Games 10 and 25 stay.
const MILESTONES = new Set([10, 25]);
const FIRST_ASK_KEY = 'jp_king_review_first_asked';

export async function maybeAskForReview(
  outcome: BattleOutcome,
  data: PlayerData,
  daysPracticed: number,
  otherPromptShown = false,
) {
  if (outcome !== 'win' || otherPromptShown) return;
  try {
    let ask = MILESTONES.has(data.gamesPlayed);
    if (!ask && daysPracticed >= 2 && (await AsyncStorage.getItem(FIRST_ASK_KEY)) === null) {
      await AsyncStorage.setItem(FIRST_ASK_KEY, '1');
      ask = true;
    }
    if (ask && (await StoreReview.hasAction())) {
      // small delay so the victory animation and sound play first
      setTimeout(() => StoreReview.requestReview().catch(() => {}), 1500);
    }
  } catch {
    // never block the result screen
  }
}
