import type { Word } from '../types';
import localN4 from '../data/n4-words.json';
import localN3 from '../data/n3-words.json';

const SOURCES: Array<{ url: string; local: Word[] }> = [
  {
    url: 'https://raw.githubusercontent.com/waitinghir/jp-knowledge-king/main/data/n4-words.json',
    local: localN4 as Word[],
  },
  {
    url: 'https://raw.githubusercontent.com/waitinghir/jp-knowledge-king/main/data/n3-words.json',
    local: localN3 as Word[],
  },
];

// Per-source fallback: remote if available, bundled local otherwise.
async function fetchOrLocal(url: string, local: Word[]): Promise<Word[]> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json() as Word[];
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // network error — fall through
  }
  return local;
}

/**
 * Load all word sources. Each source independently falls back to its
 * bundled local JSON, so N3 words are always available even before
 * n3-words.json is pushed to GitHub.
 */
export async function loadWords(): Promise<Word[]> {
  const results = await Promise.all(SOURCES.map((s) => fetchOrLocal(s.url, s.local)));
  return results.flat();
}
