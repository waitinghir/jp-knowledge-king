import * as Localization from 'expo-localization';

export type Lang = 'zh' | 'en';

// Detect once and cache
let _lang: Lang | null = null;

export function getLang(): Lang {
  if (_lang !== null) return _lang;
  const locales = Localization.getLocales();
  const primary = locales[0]?.languageCode ?? 'en';
  // zh, zh-Hant, zh-Hans → use Chinese
  _lang = primary.startsWith('zh') ? 'zh' : 'en';
  return _lang;
}

// ─────────────────────────────────────────────────────────────
// All UI strings (zh / en)
// ─────────────────────────────────────────────────────────────
const strings = {
  zh: {
    // Home screen
    appName: '日文知識王',
    appTagline: '對戰學日文 · JLPT N4',
    level: '等級',
    score: '總分',
    wins: '勝場',
    toNextLevel: (n: number) => `升級還差 ${n} 分`,
    startBattle: '⚔️ 開始對戰',
    battleStats: (games: number, rate: number) => `已對戰 ${games} 場 · 勝率 ${rate}%`,

    // Word level selector
    levelN4: 'N4',
    levelN3: 'N3',
    levelAll: '全部',

    // Leaderboard
    leaderboardTab: '排行榜',
    leaderboardTitle: '本週排行榜',
    leaderboardSubtitle: '每週一重置',
    leaderboardCalculating: '排名計算中',
    leaderboardCalculatingHint: '本週打一場對戰即可上榜',
    homeTab: '首頁',

    // Matching screen
    searching: (dots: string) => `尋找對手中${dots}`,
    matchingWait: '正在配對中，請稍候',
    foundLabel: '找到對手！',
    readyLabel: '準備開戰！',

    // Play screen
    loading: '載入中...',
    aiCorrect: '✓ 答對',
    aiWrong: '✗ 答錯',
    aiIndicator: (name: string, correct: boolean, time: string) =>
      `${name}：${correct ? '✓ 答對' : '✗ 答錯'} (${time}s)`,

    // Result screen
    timeout: '超時',
    questionDetails: '各題詳情',
    you: '你',
    winTitle: '勝利！',
    winSub: '太厲害了！繼續保持！',
    loseTitle: '惜敗！',
    loseSub: '再來一場，這次一定贏！',
    drawTitle: '平手！',
    drawSub: '勢均力敵，再分勝負！',
    thisRound: (n: number) => `本場 +${n} 分`,
    cumulative: (total: number, lv: number) => `累計 ${total} 分 · Lv.${lv}`,
    playAgain: '⚔️ 再戰一場',
    goHome: '🏠 回首頁',
  },

  en: {
    // Home screen
    appName: 'Nihongo\nQuiz King',
    appTagline: 'Battle & Learn Japanese · JLPT N4',
    level: 'Level',
    score: 'Score',
    wins: 'Wins',
    toNextLevel: (n: number) => `${n} pts to level up`,
    startBattle: '⚔️ Start Battle',
    battleStats: (games: number, rate: number) => `${games} battles · Win rate ${rate}%`,

    // Word level selector
    levelN4: 'N4',
    levelN3: 'N3',
    levelAll: 'All',

    // Leaderboard
    leaderboardTab: 'Ranking',
    leaderboardTitle: 'Weekly Ranking',
    leaderboardSubtitle: 'Resets every Monday',
    leaderboardCalculating: 'Calculating...',
    leaderboardCalculatingHint: 'Play one battle to join this week\'s ranking',
    homeTab: 'Home',

    // Matching screen
    searching: (dots: string) => `Finding opponent${dots}`,
    matchingWait: 'Matching in progress, please wait',
    foundLabel: 'Opponent found!',
    readyLabel: 'Ready to battle!',

    // Play screen
    loading: 'Loading...',
    aiCorrect: '✓ Correct',
    aiWrong: '✗ Wrong',
    aiIndicator: (name: string, correct: boolean, time: string) =>
      `${name}: ${correct ? '✓ Correct' : '✗ Wrong'} (${time}s)`,

    // Result screen
    timeout: 'Timeout',
    questionDetails: 'QUESTION DETAILS',
    you: 'You',
    winTitle: 'Victory!',
    winSub: 'Amazing! Keep it up!',
    loseTitle: 'So Close!',
    loseSub: "Try again, you'll win next time!",
    drawTitle: 'Draw!',
    drawSub: 'Evenly matched, battle again!',
    thisRound: (n: number) => `+${n} pts this round`,
    cumulative: (total: number, lv: number) => `Total ${total} pts · Lv.${lv}`,
    playAgain: '⚔️ Play Again',
    goHome: '🏠 Home',
  },
};

export type Strings = typeof strings.zh;

/** Return the full strings object for the current language. */
export function useStrings(): Strings {
  return strings[getLang()];
}
