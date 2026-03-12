import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerData, INITIAL_PLAYER_DATA, SCORE_PER_LEVEL } from '../types';

const PLAYER_KEY = 'jp_king_player';

export async function loadPlayerData(): Promise<PlayerData> {
  try {
    const raw = await AsyncStorage.getItem(PLAYER_KEY);
    if (!raw) return { ...INITIAL_PLAYER_DATA };
    return JSON.parse(raw) as PlayerData;
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
  didWin: boolean
): Promise<PlayerData> {
  const data = await loadPlayerData();
  const newTotal = data.totalScore + earnedScore;
  const updated: PlayerData = {
    totalScore: newTotal,
    level: Math.max(1, Math.floor(newTotal / SCORE_PER_LEVEL) + 1),
    gamesPlayed: data.gamesPlayed + 1,
    wins: data.wins + (didWin ? 1 : 0),
  };
  await savePlayerData(updated);
  return updated;
}
