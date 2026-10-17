import { supabase } from './supabase';
import { loadPlayerData, savePlayerData } from './storage';
import type { PlayerData } from '../types';

// P2: anonymous account + cloud backup of PlayerData.
// The device (AsyncStorage) stays the source of truth so the game works
// offline; the cloud row is a backup that P3 (Sign in with Apple) will later
// attach to a real identity. Every function here is best-effort: on any
// failure it quietly does nothing and the next call tries again.

let sessionPromise: Promise<string | null> | null = null;

/** Returns the signed-in (anonymous) user id, creating the account if needed. */
export function ensureSession(): Promise<string | null> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) return data.session.user.id;
        const { data: signIn, error } = await supabase.auth.signInAnonymously();
        if (error || !signIn.user) return null;
        return signIn.user.id;
      } catch {
        return null;
      }
    })().then((id) => {
      if (!id) sessionPromise = null; // retry on the next call (e.g. offline at launch)
      return id;
    });
  }
  return sessionPromise;
}

type PlayerRow = {
  user_id: string;
  total_score: number;
  level: number;
  games_played: number;
  wins: number;
  recent_outcomes: PlayerData['recentOutcomes'];
  weekly_score: number;
  current_week_id: string;
};

function toRow(userId: string, d: PlayerData): PlayerRow {
  return {
    user_id: userId,
    total_score: d.totalScore,
    level: d.level,
    games_played: d.gamesPlayed,
    wins: d.wins,
    recent_outcomes: (d.recentOutcomes ?? []).slice(-5),
    weekly_score: d.weeklyScore ?? 0,
    current_week_id: d.currentWeekId ?? '',
  };
}

function fromRow(r: PlayerRow): PlayerData {
  return {
    totalScore: r.total_score,
    level: r.level,
    gamesPlayed: r.games_played,
    wins: r.wins,
    recentOutcomes: r.recent_outcomes ?? [],
    weeklyScore: r.weekly_score,
    currentWeekId: r.current_week_id,
  };
}

const listeners = new Set<(d: PlayerData) => void>();

/** Screens showing PlayerData can subscribe to hear when the cloud copy wins. */
export function onPlayerDataRestored(fn: (d: PlayerData) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Upload the given local data (after a battle). */
export async function pushPlayerData(d: PlayerData): Promise<void> {
  try {
    const userId = await ensureSession();
    if (!userId) return;
    await supabase.from('player_data').upsert(toRow(userId, d), { onConflict: 'user_id' });
  } catch {
    // best-effort
  }
}

/**
 * On app start: reconcile device and cloud. The copy with MORE games played
 * wins, so progress can only ever move forward (never rolled back by a sync).
 */
export async function syncPlayerData(): Promise<void> {
  try {
    const userId = await ensureSession();
    if (!userId) return;
    const local = await loadPlayerData();
    const { data: row, error } = await supabase
      .from('player_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<PlayerRow>();
    if (error) return;

    if (!row || local.gamesPlayed > row.games_played) {
      await supabase.from('player_data').upsert(toRow(userId, local), { onConflict: 'user_id' });
    } else if (row.games_played > local.gamesPlayed) {
      const restored = fromRow(row);
      await savePlayerData(restored);
      listeners.forEach((fn) => fn(restored));
    }
  } catch {
    // best-effort
  }
}
