import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Word, WordLevel } from '../types';

// 1.8.0 daily review loop: per-word answer stats, question composition,
// daily missions, practised days and the monthly stamp calendar.
// Everything lives on the device (cloud sync waits for login in 1.9.0).

// ── Types ───────────────────────────────────────────────────────────────────

export type ThemeKey = 'food' | 'travel' | 'people' | 'work' | 'nature' | 'daily';
export const THEME_KEYS: ThemeKey[] = ['food', 'travel', 'people', 'work', 'nature', 'daily'];

// Word bank categories are spelled differently per level, so they are
// normalised into six themes. Words outside these (verbs, adjectives,
// abstract ideas…) only appear in normal battles.
const THEME_CATEGORIES: Record<ThemeKey, string[]> = {
  food: ['買物食事', '餐廳/點餐', '購物/藥妝'],
  travel: ['交通旅行', '交通'],
  people: ['人間關係', '人間関係', '社交', '感情', '感情・心理'],
  work: ['職場學校', '仕事', '仕事・経済', '教育', '職場', '経営'],
  nature: ['自然季節', '自然', '環境'],
  daily: ['日常生活', '健康', '時間', '医療'],
};

export interface WordStat {
  seen: number;
  correct: number;
  /** >0 = waiting for review: correct answers still needed to clear it */
  review: number;
  /** number of distinct days this word was answered correctly */
  correctDays: number;
  lastCorrectDay: string;
  /** mastered never goes back to false */
  mastered: boolean;
  lastAt: number;
}

interface DayState {
  date: string;
  /** decided at the start of the day so the missions don't change mid-day */
  kanaPlayer: boolean;
  fixVariant: 'fix' | 'newWords';
  themeBattles: number;
  kanaBattles: number;
  correct: number;
  fixed: number;
  newCorrect: number;
}

interface ProgressState {
  v: 1;
  words: Record<string, WordStat>;
  /** last 20 answers (1 = correct) per difficulty */
  recent: Record<string, number[]>;
  /** local dates (YYYY-MM-DD) with at least one finished battle */
  days: string[];
  /** local dates on which every mission was done */
  stamps: string[];
  today: DayState | null;
}

export type MissionKey = 'theme' | 'kana' | 'correct' | 'fix' | 'newWords';
export interface Mission {
  key: MissionKey;
  done: boolean;
  progress: number;
  target: number;
}

export interface DailySummary {
  theme: ThemeKey;
  missions: Mission[];
  missionsDone: number;
  daysPracticed: number;
  playedToday: boolean;
  streak: number;
  wordsMastered: number;
  reviewWaiting: number;
  /** day-of-month numbers stamped in the current month */
  stampedDaysThisMonth: number[];
}

export interface BattleSummary {
  newlyMastered: number;
  fixed: number;
  missionsBefore: number;
  missionsAfter: number;
  missionsTotal: number;
  completedToday: boolean;
  daysPracticed: number;
}

// ── Dates (always the phone's local date) ──────────────────────────────────

export function localDate(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return localDate(d);
}

/** Monday of the week the date falls in, used for the weekly streak freeze */
function weekOf(s: string): string {
  const d = parseDate(s);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return localDate(d);
}

/** Everyone shares the same theme on the same date; it rotates daily. */
export function themeFor(date: string): ThemeKey {
  const [y, m, d] = date.split('-').map(Number);
  const dayNo = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return THEME_KEYS[dayNo % THEME_KEYS.length];
}

// ── Storage ─────────────────────────────────────────────────────────────────

const KEY = 'jp_king_progress';

const EMPTY: ProgressState = { v: 1, words: {}, recent: {}, days: [], stamps: [], today: null };

async function load(): Promise<ProgressState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return structuredCloneSafe(EMPTY);
    return { ...structuredCloneSafe(EMPTY), ...(JSON.parse(raw) as ProgressState) };
  } catch {
    return structuredCloneSafe(EMPTY);
  }
}

function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

async function save(state: ProgressState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // not critical: progress for this battle is lost, the game still works
  }
  listeners.forEach((fn) => fn());
}

// Screens (home, Today tab, tab badge) refresh when progress changes.
const listeners = new Set<() => void>();
export function onProgressChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Kana questions are stored per kana, whichever way they were asked (h_ka:a / h_ka:b). */
export function statId(questionWordId: string): string {
  return questionWordId.split(':')[0];
}

const isKanaLevel = (level: WordLevel) => level === 'hiragana' || level === 'katakana';

// ── Today's missions ───────────────────────────────────────────────────────

function rollDay(state: ProgressState, level: WordLevel): DayState {
  const today = localDate();
  if (state.today?.date === today) return state.today;
  const hasReview = Object.values(state.words).some((w) => w.review > 0);
  state.today = {
    date: today,
    kanaPlayer: isKanaLevel(level),
    fixVariant: hasReview ? 'fix' : 'newWords',
    themeBattles: 0,
    kanaBattles: 0,
    correct: 0,
    fixed: 0,
    newCorrect: 0,
  };
  return state.today;
}

function missionsOf(day: DayState): Mission[] {
  const m = (key: MissionKey, progress: number, target: number): Mission => ({
    key,
    progress: Math.min(progress, target),
    target,
    done: progress >= target,
  });
  return [
    day.kanaPlayer ? m('kana', day.kanaBattles, 2) : m('theme', day.themeBattles, 1),
    m('correct', day.correct, 10),
    day.fixVariant === 'fix' ? m('fix', day.fixed, 1) : m('newWords', day.newCorrect, 3),
  ];
}

const countDone = (ms: Mission[]) => ms.filter((x) => x.done).length;

// ── Streak ──────────────────────────────────────────────────────────────────

/**
 * Consecutive practised days. Today doesn't count against the streak until
 * it is over. One missed day per week is covered automatically; two missed
 * days in a row (or a second miss in the same week) end the streak.
 */
function streakOf(days: string[]): number {
  const played = new Set(days);
  if (played.size === 0) return 0;
  const earliest = days.reduce((a, b) => (a < b ? a : b));
  let d = localDate();
  if (!played.has(d)) d = addDays(d, -1);
  const freezes = new Set<string>();
  let count = 0;
  let lastWasMiss = false;
  while (d >= earliest) {
    if (played.has(d)) {
      count++;
      lastWasMiss = false;
    } else if (!lastWasMiss && !freezes.has(weekOf(d))) {
      freezes.add(weekOf(d));
      lastWasMiss = true;
    } else {
      break;
    }
    d = addDays(d, -1);
  }
  return count;
}

// ── Reading ─────────────────────────────────────────────────────────────────

export async function loadDaily(level: WordLevel): Promise<DailySummary> {
  const state = await load();
  const rolled = state.today?.date !== localDate();
  const day = rollDay(state, level);
  // Lock today's missions as soon as they are first shown (no change event: avoids a reload loop).
  if (rolled) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  const missions = missionsOf(day);
  const today = localDate();
  const monthPrefix = today.slice(0, 8);
  const words = Object.values(state.words);
  return {
    theme: themeFor(today),
    missions,
    missionsDone: countDone(missions),
    daysPracticed: state.days.length,
    playedToday: state.days.includes(today),
    streak: streakOf(state.days),
    wordsMastered: words.filter((w) => w.mastered).length,
    reviewWaiting: words.filter((w) => w.review > 0).length,
    stampedDaysThisMonth: state.stamps
      .filter((s) => s.startsWith(monthPrefix))
      .map((s) => Number(s.slice(8))),
  };
}

// ── Question composition ───────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick `count` items for one battle, mixing words waiting for review, new
 * words and words already seen according to recent accuracy (spec table):
 *   fewer than 10 answers → review ≤1, new 4
 *   ≥85%                  → review ≤1, new 3
 *   60–85%                → review ≤2, new 2, learning words first
 *   <60%                  → review ≤2, new 1, learning words first
 * Shortfalls in one group are filled from the others.
 */
export function composeBattle<T>(
  pool: T[],
  idOf: (item: T) => string,
  words: Record<string, WordStat>,
  recent: number[],
  count: number,
): { item: T; missed: boolean }[] {
  const acc = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  let maxReview = 1;
  let newTarget = 4;
  let learningFirst = false;
  if (recent.length >= 10) {
    if (acc >= 0.85) newTarget = 3;
    else if (acc >= 0.6) { maxReview = 2; newTarget = 2; learningFirst = true; }
    else { maxReview = 2; newTarget = 1; learningFirst = true; }
  }

  const review: T[] = [];
  const fresh: T[] = [];
  const learning: T[] = [];
  const mastered: T[] = [];
  for (const item of shuffle(pool)) {
    const st = words[idOf(item)];
    if (!st || st.seen === 0) fresh.push(item);
    else if (st.review > 0) review.push(item);
    else if (st.mastered) mastered.push(item);
    else learning.push(item);
  }
  // Words one correct answer away from being cleared come first.
  review.sort((a, b) => words[idOf(a)].review - words[idOf(b)].review);

  const picked: { item: T; missed: boolean }[] = [];
  const take = (from: T[], n: number, missed = false) => {
    while (n-- > 0 && from.length > 0 && picked.length < count) {
      picked.push({ item: from.shift() as T, missed });
    }
  };
  take(review, maxReview, true);
  take(fresh, newTarget);
  const seen = learningFirst ? [...learning, ...mastered] : shuffle([...learning, ...mastered]);
  take(seen, count);
  // Not enough of something: fill with new words, then more review, then anything.
  take(fresh, count);
  take(review, count, true);
  return shuffle(picked);
}

/** Recent answers for a difficulty, plus all word stats, for composeBattle. */
export async function loadComposeInput(level: WordLevel) {
  const state = await load();
  return { words: state.words, recent: state.recent[level] ?? [] };
}

// ── Theme battle pool ──────────────────────────────────────────────────────

const LEVELS_UP_TO: Record<WordLevel, string[] | null> = {
  N5: ['N5'],
  N4: ['N5', 'N4'],
  N3: ['N5', 'N4', 'N3', '生活'],
  N2: null,
  生活: null,
  all: null,
  hiragana: ['N5'],
  katakana: ['N5'],
};

/**
 * Today's theme words at the player's level and easier levels: some themes
 * are thin within a single level (e.g. N3 has no food words).
 */
export function themePool(words: Word[], theme: ThemeKey, level: WordLevel, min = 5): Word[] {
  const cats = new Set(THEME_CATEGORIES[theme]);
  const inTheme = words.filter((w) => cats.has(w.category));
  const levels = LEVELS_UP_TO[level];
  const pool = levels ? inTheme.filter((w) => levels.includes(w.level)) : inTheme;
  if (pool.length >= min) return pool;
  return inTheme.length >= min ? inTheme : words;
}

// ── Writing ─────────────────────────────────────────────────────────────────

export async function recordBattle(input: {
  answers: { wordId: string; correct: boolean }[];
  level: WordLevel;
  isThemeBattle: boolean;
}): Promise<BattleSummary> {
  const state = await load();
  const today = localDate();
  const day = rollDay(state, input.level);
  const before = countDone(missionsOf(day));
  let newlyMastered = 0;
  let fixed = 0;

  for (const a of input.answers) {
    const id = statId(a.wordId);
    const st: WordStat = state.words[id] ?? {
      seen: 0, correct: 0, review: 0, correctDays: 0, lastCorrectDay: '', mastered: false, lastAt: 0,
    };
    const wasNew = st.seen === 0;
    st.seen++;
    st.lastAt = Date.now();
    if (a.correct) {
      st.correct++;
      day.correct++;
      if (wasNew) day.newCorrect++;
      if (st.lastCorrectDay !== today) {
        st.correctDays++;
        st.lastCorrectDay = today;
      }
      // Mastered = correct on two different days (the latest answer is this correct one).
      if (!st.mastered && st.correctDays >= 2) {
        st.mastered = true;
        newlyMastered++;
      }
      if (st.review > 0) {
        st.review--;
        if (st.review === 0) {
          fixed++;
          day.fixed++;
        }
      }
    } else {
      st.review = 2;
    }
    state.words[id] = st;
  }

  const recent = [...(state.recent[input.level] ?? []), ...input.answers.map((a) => (a.correct ? 1 : 0))];
  state.recent[input.level] = recent.slice(-20);

  if (input.isThemeBattle) day.themeBattles++;
  if (isKanaLevel(input.level)) day.kanaBattles++;
  if (!state.days.includes(today)) state.days.push(today);

  const missions = missionsOf(day);
  const after = countDone(missions);
  const completedToday = after === missions.length && before < missions.length;
  if (completedToday && !state.stamps.includes(today)) state.stamps.push(today);

  await save(state);
  return {
    newlyMastered,
    fixed,
    missionsBefore: before,
    missionsAfter: after,
    missionsTotal: missions.length,
    completedToday,
    daysPracticed: state.days.length,
  };
}

/** Developer helper: wipe all 1.8.0 progress. */
export async function resetProgress(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
  listeners.forEach((fn) => fn());
}
