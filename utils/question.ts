import { Word, Question } from '../types';
import type { Lang } from './i18n';

/**
 * Shuffle an array in place using Fisher-Yates algorithm.
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build one Question from a Word.
 * Options: correct answer + 3 distractors, shuffled randomly.
 * Uses the appropriate language for option strings.
 */
function buildQuestion(word: Word, lang: Lang): Question {
  const correct = lang === 'en' ? word.meaning_en : word.meaning_zh;
  const distrs  = lang === 'en' ? word.distractors_en : word.distractors;
  const allOptions = [correct, ...distrs];
  const shuffled = shuffle(allOptions);
  const correctIndex = shuffled.indexOf(correct);
  return {
    word,
    options: shuffled,
    correctIndex,
  };
}

/**
 * Generate `count` random questions from the word bank.
 * Words are picked without repetition within the same round.
 */
export function generateQuestions(words: Word[], count = 5, lang: Lang = 'zh'): Question[] {
  if (words.length < count) {
    throw new Error(`Word bank has only ${words.length} words, need at least ${count}.`);
  }
  const selected = shuffle(words).slice(0, count);
  return selected.map((w) => buildQuestion(w, lang));
}

/**
 * Generate questions filtered by category.
 */
export function generateQuestionsByCategory(
  words: Word[],
  category: string,
  count = 5,
  lang: Lang = 'zh'
): Question[] {
  const filtered = words.filter((w) => w.category === category);
  if (filtered.length < count) {
    // fallback: use all words if not enough in category
    return generateQuestions(words, count, lang);
  }
  return generateQuestions(filtered, count, lang);
}
