import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerData, INITIAL_PLAYER_DATA, SCORE_PER_LEVEL, BattleOutcome, WordLevel } from '../types';
import { getWeekId } from './leaderboard';

const PLAYER_KEY = 'jp_king_player';

export async function loadPlayerData(): Promise<PlayerData> {
  try {
    const raw = await AsyncStorage.getItem(PLAYER_KEY);
    if (!raw) return { ...INITIAL_PLAYER_DATA };
    const data = JSON.parse(raw) as PlayerData;
    // backward compat
    if (!data.recentOutcomes) data.recentOutcomes = [];
    if (!data.weeklyScore) data.weeklyScore = 0;
    if (!data.currentWeekId) data.currentWeekId = '';
    return data;
  } catch {
    return { ...INITIAL_PLAYER_DATA };
  }
}

export async function savePlayerData(data: PlayerData): Promise<void> {
  await AsyncStorage.setItem(PLAYER_KEY, JSON.stringify(data));
}

/**
 * Add score from a completed battle and update level.
 * Returns the updated PlayerData.
 */
export async function addBattleResult(
  earnedScore: number,
  outcome: BattleOutcome
): Promise<PlayerData> {
  const data = await loadPlayerData();
  const newTotal = data.totalScore + earnedScore;
  const recentOutcomes = [...(data.recentOutcomes ?? []), outcome].slice(-5);

  // Weekly score: reset if new week
  const thisWeekId = getWeekId();
  const isNewWeek = data.currentWeekId !== thisWeekId;
  const weeklyScore = isNewWeek ? earnedScore : (data.weeklyScore ?? 0) + earnedScore;

  const updated: PlayerData = {
    totalScore: newTotal,
    level: Math.max(1, Math.floor(newTotal / SCORE_PER_LEVEL) + 1),
    gamesPlayed: data.gamesPlayed + 1,
    wins: data.wins + (outcome === 'win' ? 1 : 0),
    recentOutcomes,
    weeklyScore,
    currentWeekId: thisWeekId,
  };
  await savePlayerData(updated);
  return updated;
}

// Last level picked on the home screen. Kept on the device only (not synced),
// so returning from a battle — or reopening the app — keeps the choice.
const WORD_LEVEL_KEY = 'jp_king_word_level';
const WORD_LEVELS: WordLevel[] = ['N5', 'N4', 'N3', 'N2', '生活', 'all', 'hiragana', 'katakana'];
// First launch starts in the middle of the ladder, so there is room to swipe both ways.
export const DEFAULT_WORD_LEVEL: WordLevel = 'N3';

export async function loadWordLevel(): Promise<WordLevel> {
  try {
    const raw = await AsyncStorage.getItem(WORD_LEVEL_KEY);
    return WORD_LEVELS.includes(raw as WordLevel) ? (raw as WordLevel) : DEFAULT_WORD_LEVEL;
  } catch {
    return DEFAULT_WORD_LEVEL;
  }
}

export async function saveWordLevel(level: WordLevel): Promise<void> {
  try {
    await AsyncStorage.setItem(WORD_LEVEL_KEY, level);
  } catch {
    // not critical: the picker just falls back to the default next time
  }
}

// The level picker nudges once on first launch to show it can be swiped.
const LEVEL_HINT_KEY = 'jp_king_level_hint_seen';

export async function shouldShowLevelHint(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(LEVEL_HINT_KEY)) === null;
  } catch {
    return false;
  }
}

export async function markLevelHintSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(LEVEL_HINT_KEY, '1');
  } catch {
    // not critical: worst case the hint plays again
  }
}
