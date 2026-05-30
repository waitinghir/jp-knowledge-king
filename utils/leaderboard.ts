import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  StoredFakePlayer,
  WeeklyLeaderboardState,
  LeaderboardEntry,
} from '../types';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const LEADERBOARD_KEY = 'jp_king_leaderboard_v1';

const TIME_SLOTS = [9, 12, 15, 18, 21]; // hours when fake scores update

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
];

const AVATAR_COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6',
  '#F39C12', '#1ABC9C', '#E67E22', '#8E44AD',
  '#E91E63', '#00BCD4',
];

// Gap ranges [min, max] for each rank relative to user score
const ABOVE_GAPS: [number, number][] = [
  [350, 500], // rank 1
  [200, 350], // rank 2
  [80, 200],  // rank 3
  [20, 80],   // rank 4
];
const BELOW_GAPS: [number, number][] = [
  [20, 80],   // rank 6
  [80, 160],  // rank 7
  [160, 250], // rank 8
  [250, 350], // rank 9
  [350, 450], // rank 10
];

// ─────────────────────────────────────────────────────────────
// Week ID — Monday-based "YYYY-MM-DD"
// ─────────────────────────────────────────────────────────────
export function getWeekId(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// Deterministic pseudo-random: seed → 0.0–1.0
// ─────────────────────────────────────────────────────────────
function seededRandom(seed: string): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) ^ seed.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash / 0xFFFFFFFF;
}

// ─────────────────────────────────────────────────────────────
// Count time slots passed since Monday 00:00 of this week
// ─────────────────────────────────────────────────────────────
export function getSlotsPassed(now: Date = new Date()): number {
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);

  const daysSinceMonday = Math.floor(
    (now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const slotsToday = TIME_SLOTS.filter(h => h <= now.getHours()).length;
  return daysSinceMonday * TIME_SLOTS.length + slotsToday;
}

// ─────────────────────────────────────────────────────────────
// Per-slot increment for a specific fake player (0–50)
// ─────────────────────────────────────────────────────────────
function getSlotIncrement(weekId: string, playerId: string, slotIndex: number): number {
  return Math.floor(seededRandom(`${weekId}-${playerId}-${slotIndex}`) * 51);
}

// ─────────────────────────────────────────────────────────────
// Calculate fake player's current score
// ─────────────────────────────────────────────────────────────
function calcCurrentScore(
  player: StoredFakePlayer,
  weekId: string,
  slotsPassed: number
): number {
  let score = player.baseScore;
  for (let i = 0; i < slotsPassed; i++) {
    score += getSlotIncrement(weekId, player.id, i);
  }
  return score;
}

// ─────────────────────────────────────────────────────────────
// Generate 9 fake players for the week
// ─────────────────────────────────────────────────────────────
function generateFakePlayers(weekId: string, userScore: number): StoredFakePlayer[] {
  // Shuffle names and colors with week seed
  const shuffledNames = [...NAME_POOL]
    .sort((a, b) => seededRandom(`${weekId}-n-${a}`) - seededRandom(`${weekId}-n-${b}`))
    .slice(0, 9);
  const shuffledColors = [...AVATAR_COLORS]
    .sort((a, b) => seededRandom(`${weekId}-c-${a}`) - seededRandom(`${weekId}-c-${b}`));

  const players: StoredFakePlayer[] = [];

  ABOVE_GAPS.forEach(([min, max], i) => {
    const gap = Math.floor(min + seededRandom(`${weekId}-ga-${i}`) * (max - min + 1));
    players.push({
      id: `above-${i}`,
      name: shuffledNames[i],
      avatarColor: shuffledColors[i % shuffledColors.length],
      baseScore: Math.max(0, userScore + gap),
    });
  });

  BELOW_GAPS.forEach(([min, max], i) => {
    const gap = Math.floor(min + seededRandom(`${weekId}-gb-${i}`) * (max - min + 1));
    players.push({
      id: `below-${i}`,
      name: shuffledNames[4 + i],
      avatarColor: shuffledColors[(4 + i) % shuffledColors.length],
      baseScore: Math.max(0, userScore - gap),
    });
  });

  return players;
}

// ─────────────────────────────────────────────────────────────
// Load or create this week's leaderboard state
// ─────────────────────────────────────────────────────────────
export async function getOrCreateLeaderboardState(
  weekId: string,
  userScore: number
): Promise<WeeklyLeaderboardState> {
  try {
    const raw = await AsyncStorage.getItem(LEADERBOARD_KEY);
    if (raw) {
      const state = JSON.parse(raw) as WeeklyLeaderboardState;
      if (state.weekId === weekId) return state;
    }
  } catch {}

  const fakePlayers = generateFakePlayers(weekId, userScore);
  const state: WeeklyLeaderboardState = { weekId, fakePlayers };
  await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(state));
  return state;
}

// ─────────────────────────────────────────────────────────────
// Build sorted leaderboard for display
// ─────────────────────────────────────────────────────────────
export function buildLeaderboard(
  state: WeeklyLeaderboardState,
  weeklyScore: number
): LeaderboardEntry[] {
  const slotsPassed = getSlotsPassed();

  const entries: LeaderboardEntry[] = state.fakePlayers.map(p => ({
    id: p.id,
    name: p.name,
    avatarColor: p.avatarColor,
    score: calcCurrentScore(p, state.weekId, slotsPassed),
    isPlayer: false,
  }));

  entries.push({
    id: 'player',
    name: '你',
    avatarColor: '#C41E3A',
    score: weeklyScore,
    isPlayer: true,
  });

  return entries.sort((a, b) => b.score - a.score);
}
