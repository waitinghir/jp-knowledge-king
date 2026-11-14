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
export const strings = {
  zh: {
    // Home screen
    appName: '日文知識王',
    appTagline: '對戰學日文 · JLPT N5–N2',
    level: '等級',
    score: '總分',
    wins: '勝場',
    toNextLevel: (n: number) => `升級還差 ${n} 分`,
    startBattle: '⚔️ 開始對戰',
    battleStats: (games: number, rate: number) => `已對戰 ${games} 場 · 勝率 ${rate}%`,

    // Word level selector
    levelN5: 'N5',
    levelN4: 'N4',
    levelN3: 'N3',
    levelN2: 'N2',
    levelLife: '生活',
    levelAll: '全部',
    levelHiragana: '平假名',
    levelKatakana: '片假名',
    levelCaption: {
      hiragana: '平假名・清音、濁音、拗音',
      katakana: '片假名・清音、濁音、拗音',
      N5: 'JLPT N5 單字',
      N4: 'JLPT N4 單字',
      N3: 'JLPT N3 單字',
      N2: 'JLPT N2 單字',
      生活: '在日本生活的常用詞',
      all: '所有單字隨機出題',
    },
    kanaPickReading: '選出讀音',
    kanaPickKana: '選出假名',

    // Leaderboard
    leaderboardTab: '排行榜',
    leaderboardTitle: '本週排行榜',
    leaderboardSubtitle: '每週一重置',
    leaderboardCalculating: '排名計算中',
    leaderboardCalculatingHint: '本週打一場對戰即可上榜',
    leaderboardMe: '你',
    homeTab: '首頁',

    // Feedback
    feedbackLink: '💬 意見回饋',

    // Daily loop (1.8.0)
    todayTab: '今日',
    statDays: '練習天數',
    statMastered: '已掌握',
    daysPracticed: (n: number) => `練習 ${n} 天`,
    streakDays: (n: number) => `連續 ${n} 天`,
    wordsMastered: (n: number) => `已掌握 ${n} 個字`,
    todayTheme: (t: string) => `今日主題：${t}`,
    missionsProgress: (done: number, total: number) => `任務 ${done}/${total}`,
    themes: {
      food: '食物與購物',
      travel: '交通與旅行',
      people: '人與感情',
      work: '工作與學校',
      nature: '自然與季節',
      daily: '日常生活',
    },
    dailyTitle: '今日任務',
    dailyNote: '午夜換新，沒做完也沒關係',
    missionThemeBattle: '打 1 場今日主題戰',
    missionCorrect: (n: number) => `答對 ${n} 題`,
    missionFixMistake: '收服 1 個答錯過的字',
    missionKanaBattles: (n: number) => `打 ${n} 場假名對戰`,
    missionNewWords: (n: number) => `答對 ${n} 個新字`,
    startThemeBattle: '開始主題戰',
    monthStamps: (n: number) => `本月完成 ${n} 天`,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    todayDone: '今日完成',
    newlyMastered: (n: number) => `新掌握 ${n} 個字`,
    fixedMistakes: (n: number) => `收服 ${n} 個錯字`,
    lastMissed: '上次答錯',
    reminderAskTitle: '要不要每天提醒你練習？',
    reminderAskSub: '一天最多一則，隨時可以在設定裡關掉',
    reminderNoon: '中午 12:30',
    reminderNight: '睡前 22:00',
    reminderLater: '先不要',
    settingsTitle: '設定',
    settingsReminder: '每日提醒',
    settingsReminderTime: '提醒時間',
    settingsSound: '音效',
    feedbackWriteAnother: '再寫一則',
    themeBattle: (t: string) => `主題戰：${t}`,
    battleRecord: '對戰紀錄',
    settingsFeedback: '意見回饋',
    close: '關閉',
    feedbackTitle: '意見回饋',
    feedbackSubtitle: '說說你的想法，開發者每一則都會看',
    feedbackPlaceholder: '例如：希望增加聽力題、對戰太簡單、介面哪裡卡卡的…',
    feedbackContactLabel: '聯絡方式（選填）',
    feedbackContactPlaceholder: 'Email 或 IG，方便我回覆你',
    feedbackSubmit: '送出回饋',
    feedbackPrivacyHint: '匿名送出，不會收集個人資料',
    feedbackThanksTitle: '感謝你的回饋',
    feedbackThanksSub: '每一則都會親自看過',
    feedbackBackHome: '回首頁',
    feedbackError: '送出失敗，請檢查網路後再試一次',

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
    reportA11y: '回報這題',
    reportTitle: '這題哪裡怪怪的？',
    reportMultipleCorrect: '不只一個答案對',
    reportAnswerWrong: '答案是錯的',
    reportUnnatural: '翻譯不自然',
    reportOther: '其他',
    reportCancel: '取消',
    reportThanks: '已回報，謝謝！',
    reportFailed: '回報失敗，請檢查網路後再試一次',
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
    appTagline: 'Battle & Learn Japanese · JLPT N5–N2',
    level: 'Level',
    score: 'Score',
    wins: 'Wins',
    toNextLevel: (n: number) => `${n} pts to level up`,
    startBattle: '⚔️ Start Battle',
    battleStats: (games: number, rate: number) => `${games} battles · Win rate ${rate}%`,

    // Word level selector
    levelN5: 'N5',
    levelN4: 'N4',
    levelN3: 'N3',
    levelN2: 'N2',
    levelLife: 'Life',
    levelAll: 'All',
    levelHiragana: 'Hiragana',
    levelKatakana: 'Katakana',
    levelCaption: {
      hiragana: 'Hiragana · basic, voiced and combined',
      katakana: 'Katakana · basic, voiced and combined',
      N5: 'JLPT N5 vocabulary',
      N4: 'JLPT N4 vocabulary',
      N3: 'JLPT N3 vocabulary',
      N2: 'JLPT N2 vocabulary',
      生活: 'Everyday words for life in Japan',
      all: 'All vocabulary, mixed',
    },
    kanaPickReading: 'pick the reading',
    kanaPickKana: 'pick the kana',

    // Leaderboard
    leaderboardTab: 'Ranking',
    leaderboardTitle: 'Weekly Ranking',
    leaderboardSubtitle: 'Resets every Monday',
    leaderboardCalculating: 'Calculating...',
    leaderboardCalculatingHint: 'Play one battle to join this week\'s ranking',
    leaderboardMe: 'Me',
    homeTab: 'Home',

    // Feedback
    feedbackLink: '💬 Feedback',

    // Daily loop (1.8.0)
    todayTab: 'Today',
    statDays: 'Days',
    statMastered: 'Mastered',
    daysPracticed: (n: number) => `${n} days practiced`,
    streakDays: (n: number) => `${n}-day streak`,
    wordsMastered: (n: number) => `${n} words mastered`,
    todayTheme: (t: string) => `Today: ${t}`,
    missionsProgress: (done: number, total: number) => `Missions ${done}/${total}`,
    themes: {
      food: 'Food & shopping',
      travel: 'Getting around',
      people: 'People & feelings',
      work: 'Work & school',
      nature: 'Nature & seasons',
      daily: 'Daily life',
    },
    dailyTitle: "Today's missions",
    dailyNote: 'Resets at midnight. No pressure.',
    missionThemeBattle: 'Play 1 theme battle',
    missionCorrect: (n: number) => `Answer ${n} correctly`,
    missionFixMistake: 'Fix 1 word you missed',
    missionKanaBattles: (n: number) => `Play ${n} kana battles`,
    missionNewWords: (n: number) => `Get ${n} new words right`,
    startThemeBattle: 'Start theme battle',
    monthStamps: (n: number) => `${n} days completed this month`,
    weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    todayDone: 'Done for today',
    newlyMastered: (n: number) => `${n} new words mastered`,
    fixedMistakes: (n: number) => `${n} missed words fixed`,
    lastMissed: 'Missed last time',
    reminderAskTitle: 'Want a daily reminder to practice?',
    reminderAskSub: 'At most one a day. Turn it off any time in Settings.',
    reminderNoon: 'Lunch, 12:30',
    reminderNight: 'Before bed, 22:00',
    reminderLater: 'Not now',
    settingsTitle: 'Settings',
    settingsReminder: 'Daily reminder',
    settingsReminderTime: 'Reminder time',
    settingsSound: 'Sound effects',
    feedbackWriteAnother: 'Write another',
    themeBattle: (t: string) => `Theme battle: ${t}`,
    battleRecord: 'Battle record',
    settingsFeedback: 'Send feedback',
    close: 'Close',
    feedbackTitle: 'Feedback',
    feedbackSubtitle: 'Tell us what you think — the developer reads every message',
    feedbackPlaceholder: 'e.g. add listening questions, battles feel too easy, UI feels clunky…',
    feedbackContactLabel: 'Contact (optional)',
    feedbackContactPlaceholder: 'Email or IG, in case you want a reply',
    feedbackSubmit: 'Send Feedback',
    feedbackPrivacyHint: 'Anonymous — no personal data collected',
    feedbackThanksTitle: 'Thanks for your feedback',
    feedbackThanksSub: 'Every message gets read personally',
    feedbackBackHome: 'Back to Home',
    feedbackError: 'Failed to send. Check your connection and try again.',

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
    reportA11y: 'Report this question',
    reportTitle: "What's wrong with this question?",
    reportMultipleCorrect: 'More than one answer is right',
    reportAnswerWrong: 'The answer is wrong',
    reportUnnatural: 'Translation sounds off',
    reportOther: 'Something else',
    reportCancel: 'Cancel',
    reportThanks: 'Reported. Thanks!',
    reportFailed: "Couldn't send the report. Check your connection and try again.",
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
