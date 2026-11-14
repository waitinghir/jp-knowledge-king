import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { getLang, strings } from './i18n';
import { loadDaily, localDate, themeFor } from './progress';
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

// ── Copy ────────────────────────────────────────────────────────────────────

function pickBody(dayOffset: number, slot: number, d: Awaited<ReturnType<typeof loadDaily>>): string {
  const s = strings[getLang()];
  // Streak at risk today: "連續 5 天，今天還差一場" replaces today's reminder.
  if (dayOffset === 0 && d.streak >= 3 && !d.playedToday) return s.pushStreak(d.streak);
  const options = [
    d.reviewWaiting > 0 ? s.pushReview(Math.min(d.reviewWaiting, 5)) : null,
    s.pushTheme(s.themes[d.theme]),
    d.reviewWaiting > 0 ? s.pushFixYesterday : null,
    d.daysPracticed > 0 ? s.pushDays(d.daysPracticed) : null,
  ].filter((x): x is string => !!x);
  // Rotate by date so the same line doesn't repeat day after day.
  const dayNo = Math.floor(Date.now() / 86400000) + dayOffset + slot;
  return options[dayNo % options.length];
}

export async function rescheduleReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const settings = await loadReminderSettings();
    if (!settings.enabled || settings.times.length === 0) return;
    if (!(await Notifications.getPermissionsAsync()).granted) return;

    const daily = await loadDaily(await loadWordLevel());
    const s = strings[getLang()];
    const now = new Date();
    const jobs: Promise<unknown>[] = [];
    for (let offset = 0; offset < DAYS_AHEAD; offset++) {
      // Already practised today: skip the rest of today's reminders.
      if (offset === 0 && daily.playedToday) continue;
      settings.times.forEach((t, slot) => {
        const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, TIMES[t].hour, TIMES[t].minute);
        if (at <= now) return;
        // A future day's reminder names that day's theme.
        const day = { ...daily, theme: themeFor(localDate(at)) };
        jobs.push(
          Notifications.scheduleNotificationAsync({
            content: { title: s.appName, body: pickBody(offset, slot, day) },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
          }).catch(() => {}),
        );
      });
    }
    await Promise.all(jobs);
    if (__DEV__) {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      console.log('[reminders]', all.map((n) => `${JSON.stringify((n.trigger as { date?: unknown }).date ?? n.trigger)} ${n.content.body}`).join('\n'));
    }
  } catch {
    // reminders are best-effort
  }
}
