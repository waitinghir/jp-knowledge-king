import { SCORE_PER_LEVEL } from '../types';

const TOTAL_TIME = 10; // seconds per question
const BASE_SCORE = 100;

/**
 * Calculate score for a single answer.
 * Formula: isCorrect ? floor(100 × (remainingTime/totalTime + 0.1)) : 0
 *
 * Examples:
 *   1s used (9s remaining) → 100 × (0.9 + 0.1) = 100
 *   5s used (5s remaining) → 100 × (0.5 + 0.1) = 60
 *   9s used (1s remaining) → 100 × (0.1 + 0.1) = 20
 *   timeout (10s)          → 0
 */
export function calculateScore(isCorrect: boolean, timeUsed: number, totalTime = TOTAL_TIME): number {
  if (!isCorrect) return 0;
  const remaining = Math.max(0, totalTime - timeUsed);
  const multiplier = remaining / totalTime + 0.1;
  return Math.floor(BASE_SCORE * multiplier);
}

/**
 * Calculate the player level from total score.
 * Level = floor(totalScore / SCORE_PER_LEVEL) + 1, minimum 1.
 */
export function calculateLevel(totalScore: number): number {
  return Math.max(1, Math.floor(totalScore / SCORE_PER_LEVEL) + 1);
}

/**
 * Determine battle outcome.
 */
export function determineBattleOutcome(
  playerTotal: number,
  aiTotal: number
): 'win' | 'lose' | 'draw' {
  if (playerTotal > aiTotal) return 'win';
  if (playerTotal < aiTotal) return 'lose';
  return 'draw';
}
