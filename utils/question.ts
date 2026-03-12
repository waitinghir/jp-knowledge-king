import { Word, Question } from '../types';

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
 */
function buildQuestion(word: Word): Question {
  const allOptions = [word.meaning_zh, ...word.distractors];
  const shuffled = shuffle(allOptions);
  const correctIndex = shuffled.indexOf(word.meaning_zh);
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
export function generateQuestions(words: Word[], count = 5): Question[] {
  if (words.length < count) {
    throw new Error(`Word bank has only ${words.length} words, need at least ${count}.`);
  }
  const selected = shuffle(words).slice(0, count);
  return selected.map(buildQuestion);
}

/**
 * Generate questions filtered by category.
 */
export function generateQuestionsByCategory(
  words: Word[],
  category: string,
  count = 5
): Question[] {
  const filtered = words.filter((w) => w.category === category);
  if (filtered.length < count) {
    // fallback: use all words if not enough in category
    return generateQuestions(words, count);
  }
  return generateQuestions(filtered, count);
}
