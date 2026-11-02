import type { KanaEntry, Question, Word } from '../types';
import { strings } from './i18n';
import localKana from '../data/kana.json';

const KANA_URL = 'https://raw.githubusercontent.com/waitinghir/jp-knowledge-king/main/data/kana.json';

// Same fallback as wordBank: remote if available, bundled local otherwise.
export async function loadKana(): Promise<KanaEntry[]> {
  try {
    const res = await fetch(KANA_URL, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json() as KanaEntry[];
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // network error — fall through
  }
  return localKana as KanaEntry[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * One kana question, asked one of two ways at random:
 *   A. card shows the kana, options are romaji   (き → ki / sa / chi / ma)
 *   B. card shows the romaji, options are kana   (ki → き / さ / ち / ま)
 * It is wrapped in a Word so play / result / telemetry work unchanged:
 * the card shows word.kana and the answer is word.meaning_*.
 */
function buildKanaQuestion(e: KanaEntry, romajiOf: Map<string, string>): Question {
  const pickReading = Math.random() < 0.5;
  const prompt = pickReading ? e.kana : e.romaji;
  const answer = pickReading ? e.romaji : e.kana;
  const distractors = pickReading ? e.distractors.map((d) => romajiOf.get(d) ?? d) : e.distractors;
  const script = e.script === 'hiragana' ? 'levelHiragana' : 'levelKatakana';
  const mode = pickReading ? 'kanaPickReading' : 'kanaPickKana';
  const word: Word = {
    id: `${e.id}:${pickReading ? 'a' : 'b'}`,
    kanji: prompt,
    kana: prompt,
    meaning_zh: answer,
    meaning_en: answer,
    category: `${strings.zh[script]}・${strings.zh[mode]}`,
    category_en: `${strings.en[script]} · ${strings.en[mode]}`,
    level: 'N5',
    distractors,
    distractors_en: distractors,
  };
  const options = shuffle([answer, ...distractors]);
  return { word, options, correctIndex: options.indexOf(answer) };
}

export function generateKanaQuestions(
  entries: KanaEntry[],
  script: KanaEntry['script'],
  count = 5,
): Question[] {
  const pool = entries.filter((e) => e.script === script);
  const romajiOf = new Map(pool.map((e) => [e.kana, e.romaji]));
  return shuffle(pool).slice(0, count).map((e) => buildKanaQuestion(e, romajiOf));
}
