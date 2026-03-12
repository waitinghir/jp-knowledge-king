import { AIOpponent, Question } from '../types';

// 30+ 台灣真人暱稱池
const NAME_POOL = [
  '小明', '阿華', '小美', '志明', '淑芬',
  '大雄', '靜香', '小夫', '胖虎', '小新',
  '阿嘉', '玉珍', '建宏', '淑惠', '文雄',
  '小芳', '阿強', '秀英', '志豪', '麗華',
  '阿龍', '小琪', '建國', '玉蘭', '阿明',
  '小婷', '志偉', '秀芬', '阿雄', '小鳳',
  '建志', '淑華', '阿文', '小翠', '志強',
];

const AVATAR_COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6',
  '#F39C12', '#1ABC9C', '#E67E22', '#34495E',
];

/**
 * Generate a random AI opponent near the given player level.
 */
export function generateOpponent(playerLevel: number): AIOpponent {
  const name = NAME_POOL[Math.floor(Math.random() * NAME_POOL.length)];
  const levelOffset = Math.floor(Math.random() * 7) - 3; // -3 to +3
  const level = Math.max(1, playerLevel + levelOffset);
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  return { name, level, avatarColor };
}

/**
 * Simulate the AI answering a question.
 * - Correct rate: 70–90% (random per opponent instance)
 * - Time: 2–7 seconds (correct answers lean faster, wrong lean slower)
 */
export function simulateAIAnswer(
  _question: Question,
  difficulty: number = 0.8 // 0.7 – 0.9 correct rate
): { isCorrect: boolean; timeUsed: number } {
  const isCorrect = Math.random() < difficulty;

  let timeUsed: number;
  if (isCorrect) {
    // Correct: 2–6 seconds (uniformly random, biased faster)
    timeUsed = 2 + Math.random() * 4;
  } else {
    // Incorrect: 5–9 seconds (biased slower, simulates hesitation)
    timeUsed = 5 + Math.random() * 4;
    // Clamp to 10 (timeout)
    if (timeUsed > 10) timeUsed = 10;
  }

  return { isCorrect, timeUsed: parseFloat(timeUsed.toFixed(1)) };
}

/**
 * Generate a random AI difficulty between 0.70 and 0.90.
 */
export function randomDifficulty(): number {
  return 0.7 + Math.random() * 0.2;
}
