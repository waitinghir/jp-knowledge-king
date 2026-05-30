import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerData, INITIAL_PLAYER_DATA, SCORE_PER_LEVEL, BattleOutcome } from '../types';

const PLAYER_KEY = 'jp_king_player';

export async function loadPlayerData(): Promise<PlayerData> {
  try {
    const raw = await AsyncStorage.getItem(PLAYER_KEY);
    if (!raw) return { ...INITIAL_PLAYER_DATA };
    const data = JSON.parse(raw) as PlayerData;
    // backward compat: old saves may not have recentOutcomes
    if (!data.recentOutcomes) data.recentOutcomes = [];
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
  const updated: PlayerData = {
    totalScore: newTotal,
    level: Math.max(1, Math.floor(newTotal / SCORE_PER_LEVEL) + 1),
    gamesPlayed: data.gamesPlayed + 1,
    wins: data.wins + (outcome === 'win' ? 1 : 0),
    recentOutcomes,
  };
  await savePlayerData(updated);
  return updated;
}
