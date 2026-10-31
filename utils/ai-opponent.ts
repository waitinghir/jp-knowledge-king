import { AIOpponent, BattleOutcome, Question } from '../types';

// 65 暱稱池（台灣 + 英文 + 遊戲感）
const NAME_POOL = [
  '小明', '阿華', '小美', '志明', '淑芬',
  '大雄', '靜香', '小夫', '胖虎', '小新',
  '阿嘉', '玉珍', '建宏', '淑惠', '文雄',
  '小芳', '阿強', '秀英', '志豪', '麗華',
  '阿龍', '小琪', '建國', '玉蘭', '阿明',
  '小婷', '志偉', '秀芬', '阿雄', '小鳳',
  '建志', '淑華', '阿文', '小翠', '志強',
  'Alex', 'Amy', 'Brian', 'Cindy', 'Daniel',
  'Emily', 'Frank', 'Grace', 'Henry', 'Iris',
  'Jason', 'Kelly', 'Leo', 'Maggie', 'Nathan',
  'Olivia', 'Peter', 'Rachel', 'Sam', 'Tina',
  'QuizKing', 'ProGamer', 'NinjaMode', 'DragonFist', 'ShadowFox',
  '日文王', '天才', '影武者', '強', '龍二',
];

const AVATAR_COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6',
  '#F39C12', '#1ABC9C', '#E67E22', '#8E44AD',
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
    // Correct: 2–6 seconds (uniformly random, biased faster);
    // easier opponents (< 0.65) also answer a bit slower: 3–7 seconds
    timeUsed = (difficulty < 0.65 ? 3 : 2) + Math.random() * 4;
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

/** New players face a weaker AI that ramps up to full strength over this many battles. */
export const ROOKIE_GAMES = 10;

/**
 * Rubber-band difficulty: adjust AI strength based on recent outcomes.
 * Ranges below are at full strength; during the first ROOKIE_GAMES battles they
 * start lower and rise in even steps, so a new player can win early and the
 * AI does not jump in strength from one battle to the next.
 * - 2+ consecutive losses → easy mode (0.50–0.65; 0.35–0.50 in the first battle)
 * - 2+ consecutive wins  → hard mode (0.85–0.95), only after ROOKIE_GAMES
 * - otherwise            → normal (0.70–0.85; 0.45–0.60 in the first battle)
 */
export function adaptiveDifficulty(recentOutcomes: BattleOutcome[], gamesPlayed = ROOKIE_GAMES): number {
  const last = recentOutcomes.slice(-3);
  const consecutiveLosses = [...last].reverse().findIndex((o) => o !== 'lose');
  const consecutiveWins  = [...last].reverse().findIndex((o) => o !== 'win');
  const loseStreak = consecutiveLosses === -1 ? last.length : consecutiveLosses;
  const winStreak  = consecutiveWins  === -1 ? last.length : consecutiveWins;

  const ramp = Math.min(1, gamesPlayed / ROOKIE_GAMES); // 0 → 1 over the first battles

  if (loseStreak >= 2) return 0.35 + 0.15 * ramp + Math.random() * 0.15;
  if (winStreak  >= 2 && ramp === 1) return 0.85 + Math.random() * 0.10;
  return 0.45 + 0.25 * ramp + Math.random() * 0.15;
}
