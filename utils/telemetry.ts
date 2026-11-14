import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { getLang, type Lang } from './i18n';
import type { BattleResult } from '../types';

// L5 online monitoring: anonymous answer logs + "report this question".
// Fire-and-forget: a failed write must never affect the game.

const DEVICE_KEY = 'jp_king_device_id';
const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';

export type ReportReason = 'multiple_correct' | 'answer_wrong' | 'unnatural' | 'other';

// Random v4-style UUID. Only used as an anonymous per-install id, so
// Math.random is good enough (no crypto module needed).
export function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

let deviceIdPromise: Promise<string> | null = null;

function getDeviceId(): Promise<string> {
  if (!deviceIdPromise) {
    deviceIdPromise = (async () => {
      try {
        const saved = await AsyncStorage.getItem(DEVICE_KEY);
        if (saved) return saved;
        const id = newId();
        await AsyncStorage.setItem(DEVICE_KEY, id);
        return id;
      } catch {
        return newId();
      }
    })();
  }
  return deviceIdPromise;
}

/** Log all answers of a finished battle (one insert, 5 rows). */
export async function logBattleAnswers(result: BattleResult, lang: Lang, battleId: string) {
  try {
    const deviceId = await getDeviceId();
    const rows = result.questions.map((q, i) => {
      const a = result.playerAnswers[i];
      const chosen = a && a.selectedIndex !== null ? q.options[a.selectedIndex] : null;
      return {
        battle_id: battleId,
        device_id: deviceId,
        app_version: APP_VERSION,
        lang,
        question_no: i + 1,
        word_id: q.word.id,
        options: q.options,
        answer: q.options[q.correctIndex],
        chosen,
        correct: !!a?.isCorrect,
        time_used: Math.min(10, Math.max(0, a?.timeUsed ?? 10)),
      };
    });
    if (rows.length > 0) await supabase.from('answer_events').insert(rows);
  } catch {
    // ignore: monitoring must never break the game
  }
}

/** Report one question. Returns true when the report was stored. */
export async function reportQuestion(
  result: BattleResult,
  index: number,
  lang: Lang,
  battleId: string,
  reason: ReportReason,
): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();
    const q = result.questions[index];
    const a = result.playerAnswers[index];
    const { error } = await supabase.from('question_reports').insert({
      battle_id: battleId,
      device_id: deviceId,
      app_version: APP_VERSION,
      lang,
      word_id: q.word.id,
      options: q.options,
      answer: q.options[q.correctIndex],
      chosen: a && a.selectedIndex !== null ? q.options[a.selectedIndex] : null,
      reason,
    });
    return !error;
  } catch {
    return false;
  }
}

// ── 1.8.0 app events (funnel + daily loop) ─────────────────────────────────

export type AppEvent =
  | 'first_open'
  | 'home_view'
  | 'level_change'
  | 'battle_start'
  | 'battle_finish'
  | 'theme_battle_start'
  | 'reminder_ask_shown'
  | 'reminder_answer'
  | 'reminder_permission'
  | 'open_from_push'
  | 'push_delivered'
  | 'missions_completed';

/** Fire-and-forget event log; never throws, never blocks. */
export async function logEvent(name: AppEvent, props?: Record<string, string | number | boolean>) {
  try {
    const deviceId = await getDeviceId();
    const { error } = await supabase.from('app_events').insert({
      device_id: deviceId,
      app_version: APP_VERSION,
      lang: getLang(),
      name,
      props: props ?? null,
    });
    if (__DEV__) console.log('[event]', name, error ? `FAILED ${error.message}` : 'ok');
  } catch {
    // ignore
  }
}

const FIRST_OPEN_KEY = 'jp_king_first_open_logged';

/** Logged once per install (installs from before 1.8.0 log it on their first 1.8.0 launch). */
export async function logFirstOpen() {
  try {
    if (await AsyncStorage.getItem(FIRST_OPEN_KEY)) return;
    await AsyncStorage.setItem(FIRST_OPEN_KEY, '1');
    const raw = await AsyncStorage.getItem('jp_king_player');
    const gamesPlayed = raw ? (JSON.parse(raw).gamesPlayed ?? 0) : 0;
    logEvent('first_open', { returning: gamesPlayed > 0 });
  } catch {
    // ignore
  }
}
