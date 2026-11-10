// TEMPORARY (1.8.0 UI mock): fake numbers so the new screens can be reviewed
// before the real word stats exist. Delete once the daily loop is wired up.
import type { Strings } from './i18n';

export type ThemeKey = keyof Strings['themes'];

export const MOCK_DAILY = {
  daysPracticed: 12,
  streak: 5,
  wordsMastered: 87,
  theme: 'food' as ThemeKey,
  missions: [
    { key: 'theme', done: true },
    { key: 'correct', done: false, progress: 6, target: 10 },
    { key: 'fix', done: false },
  ],
  // days of the current month with a "done for today" stamp
  stampedDays: [2, 3, 5, 6, 7, 9],
  // result screen
  newlyMastered: 2,
  fixedMistakes: 1,
};
