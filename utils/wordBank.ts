import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Word } from '../types';
import localWords from '../data/n4-words.json';

const REMOTE_URL =
  'https://raw.githubusercontent.com/waitinghir/jp-knowledge-king/main/data/n4-words.json';
const CACHE_KEY = 'jp_king_words_cache';

/**
 * Load word bank with three-layer fallback:
 * 1. Fetch from remote (GitHub raw) — always latest
 * 2. AsyncStorage cache — last successful fetch
 * 3. Bundled local JSON — guaranteed fallback
 */
export async function loadWords(): Promise<Word[]> {
  // Layer 1: remote
  try {
    const res = await fetch(REMOTE_URL, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json() as Word[];
      if (Array.isArray(data) && data.length > 0) {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch {
    // network error — fall through
  }

  // Layer 2: cached
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as Word[];
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // corrupt cache — fall through
  }

  // Layer 3: bundled local
  return localWords as Word[];
}
