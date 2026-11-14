import AsyncStorage from '@react-native-async-storage/async-storage';

import localThemes from '../data/themes.json';
import localPushCopy from '../data/push-copy.json';
import type { Lang } from './i18n';

// Daily themes and reminder copy are read from GitHub main (like the word
// bank), so they can change without an app update. Fallback order:
// GitHub → last good copy saved on the phone → copy bundled in the app.

const BASE = 'https://raw.githubusercontent.com/waitinghir/jp-knowledge-king/main/data/';
const TTL_MS = 60 * 60 * 1000;

export interface Theme {
  key: string;
  name_zh: string;
  name_en: string;
  categories: string[];
}

export interface PushLine {
  id: string;
  zh: string;
  en: string;
}

export type PushKind = 'streak' | 'review' | 'theme' | 'fix' | 'days';
export type PushCopy = Record<PushKind, PushLine[]>;

const PUSH_KINDS: PushKind[] = ['streak', 'review', 'theme', 'fix', 'days'];

const isLine = (l: unknown): l is PushLine => {
  const x = l as PushLine;
  return !!x && typeof x.id === 'string' && typeof x.zh === 'string' && typeof x.en === 'string' && !!x.zh && !!x.en;
};

function validThemes(d: unknown): Theme[] | null {
  const list = (d as { themes?: unknown })?.themes;
  if (!Array.isArray(list) || list.length === 0) return null;
  const ok = list.every(
    (t: Theme) =>
      typeof t?.key === 'string' && !!t.name_zh && !!t.name_en &&
      Array.isArray(t.categories) && t.categories.length > 0,
  );
  return ok ? (list as Theme[]) : null;
}

function validPushCopy(d: unknown): PushCopy | null {
  const c = d as PushCopy;
  if (!c) return null;
  // every kind needs at least one complete line
  return PUSH_KINDS.every((k) => Array.isArray(c[k]) && c[k].length > 0 && c[k].every(isLine)) ? c : null;
}

const memo: Record<string, { at: number; value: Promise<unknown> }> = {};

function load<T>(file: string, local: unknown, valid: (d: unknown) => T | null): Promise<T> {
  const hit = memo[file];
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as Promise<T>;
  const cacheKey = `jp_king_remote_${file}`;
  const value = (async () => {
    try {
      const res = await fetch(BASE + file, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const v = valid(data);
        if (v) {
          AsyncStorage.setItem(cacheKey, JSON.stringify(data)).catch(() => {});
          return v;
        }
      }
    } catch {
      // offline — fall through
    }
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      const v = raw ? valid(JSON.parse(raw)) : null;
      if (v) return v;
    } catch {
      // ignore
    }
    return valid(local) as T;
  })();
  memo[file] = { at: Date.now(), value };
  return value;
}

export const loadThemes = () => load('themes.json', localThemes, validThemes);
export const loadPushCopy = () => load('push-copy.json', localPushCopy, validPushCopy);

export const themeName = (t: Theme, lang: Lang) => (lang === 'en' ? t.name_en : t.name_zh);
