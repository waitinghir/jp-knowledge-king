// ────────────────────────────────────────────────
// 題庫單字（符合規格書 1-6 的 JSON 格式）
// ────────────────────────────────────────────────
export interface Word {
  id: string;
  kanji: string;
  kana: string;
  meaning_zh: string;
  meaning_en: string;
  category: string;
  category_en: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  distractors: string[];    // 3 distractor Chinese meanings
  distractors_en: string[]; // 3 distractor English meanings
}

// ────────────────────────────────────────────────
// 一道出題（含已打亂的 4 個選項）
// ────────────────────────────────────────────────
export interface Question {
  word: Word;
  options: string[];      // 4 shuffled choices (Chinese meanings)
  correctIndex: number;   // index of the correct answer in options[]
}

// ────────────────────────────────────────────────
// 單題答題記錄
// ────────────────────────────────────────────────
export interface Answer {
  questionId: string;
  selectedIndex: number | null; // null = timed out
  isCorrect: boolean;
  timeUsed: number;  // seconds (0–10)
  score: number;
}

// ────────────────────────────────────────────────
// AI 對手
// ────────────────────────────────────────────────
export interface AIOpponent {
  name: string;
  level: number;
  avatarColor: string; // hex color for avatar background
}

// ────────────────────────────────────────────────
// 一場對戰的完整狀態
// ────────────────────────────────────────────────
export interface BattleState {
  questions: Question[];
  playerAnswers: Answer[];
  aiAnswers: Answer[];
  opponent: AIOpponent;
  startedAt: number; // Date.now() timestamp
}

// ────────────────────────────────────────────────
// 結算結果
// ────────────────────────────────────────────────
export type BattleOutcome = 'win' | 'lose' | 'draw';

export interface BattleResult {
  outcome: BattleOutcome;
  playerTotalScore: number;
  aiTotalScore: number;
  questions: Question[];
  playerAnswers: Answer[];
  aiAnswers: Answer[];
  opponent: AIOpponent;
}

// ────────────────────────────────────────────────
// 玩家持久化資料（存在 AsyncStorage）
// ────────────────────────────────────────────────
export interface PlayerData {
  totalScore: number;
  level: number;       // totalScore / 500, minimum 1
  gamesPlayed: number;
  wins: number;
  recentOutcomes: BattleOutcome[]; // last 5 results, for adaptive difficulty
  weeklyScore: number;             // score earned this week, resets every Monday
  currentWeekId: string;           // Monday date of current week, e.g. "2026-05-11"
}

export const INITIAL_PLAYER_DATA: PlayerData = {
  totalScore: 0,
  level: 1,
  gamesPlayed: 0,
  wins: 0,
  recentOutcomes: [],
  weeklyScore: 0,
  currentWeekId: '',
};

// ────────────────────────────────────────────────
// 排行榜
// ────────────────────────────────────────────────
export interface StoredFakePlayer {
  id: string;
  name: string;
  avatarColor: string;
  baseScore: number; // score at time of first leaderboard view this week
}

export interface WeeklyLeaderboardState {
  weekId: string;
  fakePlayers: StoredFakePlayer[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatarColor: string;
  score: number;
  isPlayer: boolean;
}

export const SCORE_PER_LEVEL = 500;

// ────────────────────────────────────────────────
// 難度選擇
// ────────────────────────────────────────────────
export type WordLevel = 'N4' | 'N3' | 'N2' | '生活' | 'all';
