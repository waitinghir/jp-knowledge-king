import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { getLang, strings, type Lang } from './i18n';
import { loadDaily, localDate, themeFor } from './progress';
import {
  loadPushCopy,
  loadThemes,
  themeName,
  type PushCopy,
  type PushKind,
  type PushLine,
  type Theme,
} from './remoteData';
import { loadWordLevel } from './storage';
import { logEvent } from './telemetry';

// Daily practice reminders, scheduled on the phone only (no server).
// The next 7 days are scheduled one by one so each notification can carry
// its own copy and today's can be skipped once the player has practised.
// Re-planned on every app open and after every battle.

export type ReminderTime = 'noon' | 'night';
const TIMES: Record<ReminderTime, { hour: number; minute: number }> = {
  noon: { hour: 12, minute: 30 },
  night: { hour: 22, minute: 0 },
};

export interface ReminderSettings {
  enabled: boolean;
  times: ReminderTime[];
  /** never = card not shown yet; declined = "先不要" on the first card */
  ask: 'never' | 'answered' | 'declined' | 'declinedTwice';
  /** games played when "先不要" was chosen; asked once more two battles later */
  declinedAtGames?: number;
}

const KEY = 'jp_king_reminders';
const DEFAULT: ReminderSettings = { enabled: false, times: ['night'], ask: 'never' };
const DAYS_AHEAD = 7;

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as ReminderSettings) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

export async function saveReminderSettings(s: ReminderSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // not critical
  }
  await rescheduleReminders();
}

/** Shows the iOS permission dialog (only the first time). Returns true when allowed. */
export async function requestReminderPermission(): Promise<boolean> {
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    if (!cur.canAskAgain) return false;
    const res = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    return res.granted;
  } catch {
    return false;
  }
}

/** The answer to the ask card (first launch, or again at the 2nd battle). */
export async function answerReminderAsk(choice: ReminderTime | 'later', gamesPlayed: number): Promise<void> {
  const cur = await loadReminderSettings();
  if (choice === 'later') {
    await saveReminderSettings(
      cur.ask === 'never'
        ? { ...cur, ask: 'declined', declinedAtGames: gamesPlayed }
        : { ...cur, ask: 'declinedTwice' },
    );
    return;
  }
  const granted = await requestReminderPermission();
  logEvent('reminder_permission', { granted });
  await saveReminderSettings({ enabled: granted, times: [choice], ask: 'answered' });
}

/** Second (and last) ask: on the result screen of the 2nd battle after "先不要". */
export async function shouldAskAgain(gamesPlayed: number): Promise<boolean> {
  const cur = await loadReminderSettings();
  return cur.ask === 'declined' && gamesPlayed >= (cur.declinedAtGames ?? 0) + 2;
}

// ── Copy (data/push-copy.json, editable without an app update) ────────────

type Daily = Awaited<ReturnType<typeof loadDaily>>;

function fill(text: string, d: Daily, theme: Theme, lang: Lang): string {
  return text
    .replace(/\{n\}/g, String(Math.min(d.reviewWaiting, 5)))
    .replace(/\{theme\}/g, themeName(theme, lang))
    .replace(/\{days\}/g, String(d.daysPracticed))
    .replace(/\{streak\}/g, String(d.streak));
}

function pickLine(copy: PushCopy, dayOffset: number, slot: number, d: Daily): PushLine {
  // Rotate by date (and time slot) so the same line doesn't repeat day after day.
  const dayNo = Math.floor(Date.now() / 86400000) + dayOffset + slot;
  const from = (lines: PushLine[]) => lines[dayNo % lines.length];
  // Streak at risk today: "連續 5 天，今天還差一場" replaces today's reminder.
  if (dayOffset === 0 && d.streak >= 3 && !d.playedToday) return from(copy.streak);
  const kinds: PushKind[] = [
    ...(d.reviewWaiting > 0 ? (['review'] as const) : []),
    'theme',
    ...(d.reviewWaiting > 0 ? (['fix'] as const) : []),
    ...(d.daysPracticed > 0 ? (['days'] as const) : []),
  ];
  return from(copy[kinds[dayNo % kinds.length]]);
}

// ── Delivery tracking ──────────────────────────────────────────────────────
// Local notifications don't report delivery. Each plan is kept on the phone;
// at the next re-plan, planned reminders whose time has passed have fired
// (they were not cancelled in time), so they are reported then. Players who
// never open the app again never report, so open rates read a bit high.

const PLAN_KEY = 'jp_king_reminder_plan';
type Planned = { at: number; copy: string };

async function reportDelivered(granted: boolean) {
  try {
    const raw = await AsyncStorage.getItem(PLAN_KEY);
    const plan: Planned[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    if (granted) {
      plan.filter((p) => p.at <= now).forEach((p) => logEvent('push_delivered', { copy: p.copy }));
    }
    await AsyncStorage.setItem(PLAN_KEY, JSON.stringify([]));
  } catch {
    // ignore
  }
}

// ── Scheduling ──────────────────────────────────────────────────────────────

let running: Promise<void> | null = null;

/** Re-plan the next 7 days of reminders (serialised: launch, foreground and battle can overlap). */
export function rescheduleReminders(): Promise<void> {
  const next = (running ?? Promise.resolve()).then(planReminders);
  running = next;
  return next;
}

async function planReminders(): Promise<void> {
  try {
    const granted = (await Notifications.getPermissionsAsync()).granted;
    await reportDelivered(granted);
    await Notifications.cancelAllScheduledNotificationsAsync();
    const settings = await loadReminderSettings();
    if (!settings.enabled || settings.times.length === 0 || !granted) return;

    const lang = getLang();
    const [daily, copy, themes] = await Promise.all([
      loadWordLevel().then(loadDaily),
      loadPushCopy(),
      loadThemes(),
    ]);
    const now = new Date();
    const plan: Planned[] = [];
    const jobs: Promise<unknown>[] = [];
    for (let offset = 0; offset < DAYS_AHEAD; offset++) {
      // Already practised today: skip the rest of today's reminders.
      if (offset === 0 && daily.playedToday) continue;
      settings.times.forEach((t, slot) => {
        const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, TIMES[t].hour, TIMES[t].minute);
        if (at <= now) return;
        // A future day's reminder names that day's theme.
        const theme = themeFor(localDate(at), themes);
        const line = pickLine(copy, offset, slot, daily);
        plan.push({ at: at.getTime(), copy: line.id });
        jobs.push(
          Notifications.scheduleNotificationAsync({
            content: {
              title: strings[lang].appName,
              body: fill(line[lang], daily, theme, lang),
              data: { copy: line.id },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
          }).catch(() => {}),
        );
      });
    }
    await Promise.all(jobs);
    await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    if (__DEV__) {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      console.log('[reminders]\n' + all.map((n) => `${n.content.data?.copy} | ${n.content.body}`).join('\n'));
    }
  } catch {
    // reminders are best-effort
  }
}
