import * as StoreReview from 'expo-store-review';
import type { BattleOutcome, PlayerData } from '../types';

// Ask for an App Store rating right after a WIN, at a few milestones.
// iOS decides whether the sheet actually appears (max ~3 times a year per
// user), so this never nags; it just picks good moments to ask.
const MILESTONES = new Set([3, 10, 25]);

export async function maybeAskForReview(outcome: BattleOutcome, data: PlayerData) {
  if (outcome !== 'win' || !MILESTONES.has(data.gamesPlayed)) return;
  try {
    if (await StoreReview.hasAction()) {
      // small delay so the victory animation and sound play first
      setTimeout(() => StoreReview.requestReview().catch(() => {}), 1500);
    }
  } catch {
    // never block the result screen
  }
}
