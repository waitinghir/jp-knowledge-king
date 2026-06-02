# 🇯🇵 日文知識王 — 對戰學日文

把背日文單字變成即時對戰遊戲。每場 5 題、每題 10 秒倒數，跟 AI 對手比誰更快更準。

> **核心假設：**「跟對手比賽」的緊張感，會讓背日文單字從枯燥變上癮。

**目前版本：v1.4.0**

---

## 技術棧

| 項目 | 選擇 |
|------|------|
| 框架 | React Native (Expo SDK 54) |
| 語言 | TypeScript |
| 導航 | expo-router 6（file-based routing）|
| 動畫 | React Native Reanimated 4 |
| 音效 | expo-av |
| 本機儲存 | @react-native-async-storage/async-storage |
| 國際化 | expo-localization（繁中 / 英文自動切換）|

---

## 快速開始

```bash
cd jp-knowledge-king
npm install --legacy-peer-deps
npx expo start --ios   # iOS 模擬器快速測試
```

---

## 專案結構

```
jp-knowledge-king/
├── app/
│   ├── _layout.tsx              # Root layout (Stack navigator)
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab layout（首頁 + 排行榜）
│   │   ├── index.tsx            # 首頁
│   │   └── leaderboard.tsx      # 週排行榜
│   └── battle/
│       ├── matching.tsx         # 配對頁（假裝找對手 1-2 秒）
│       ├── play.tsx             # 對戰頁（出題 + 倒數 + 選項）
│       └── result.tsx           # 結算頁（勝負 + 分數統計）
├── components/
│   ├── Timer.tsx                # 環形倒數計時器
│   └── OptionButton.tsx         # 選項按鈕（含動畫）
├── data/
│   ├── n4-words.json            # N4 題庫（200 個高頻單字）
│   └── n3-words.json            # N3 題庫（40 個單字）
├── utils/
│   ├── ai-opponent.ts           # AI 對手邏輯 + 橡皮筋難度
│   ├── leaderboard.ts           # 週排行榜邏輯（假玩家生成）
│   ├── scoring.ts               # 計分邏輯
│   ├── question.ts              # 出題 / 選項生成邏輯
│   ├── storage.ts               # AsyncStorage 存取
│   ├── wordBank.ts              # 題庫載入（remote + local fallback）
│   └── i18n.ts                  # 多語字串
└── types/
    └── index.ts                 # TypeScript 型別定義
```

---

## 遊戲規則

1. 首頁選擇難度（N4 / N3 / 全部），點「開始對戰」
2. 配對動畫（1-2 秒）→ 顯示 AI 對手
3. 5 題連續作答，每題 10 秒倒數
4. 每題計分：答對 = `floor(100 × (剩餘秒數/10 + 0.1))`，答錯 = 0 分
5. 5 題結束 → 戰績結算（勝 / 敗 / 平手）
6. 累計分數存入 AsyncStorage，每 500 分升一級

### 計分公式

```
score = isCorrect ? floor(100 × (remainingTime / 10 + 0.1)) : 0
```

| 用時 | 剩餘 | 得分 |
|------|------|------|
| 1 秒 | 9 秒 | 100 分 |
| 5 秒 | 5 秒 | 60 分 |
| 9 秒 | 1 秒 | 20 分 |
| 超時 | 0 秒 | 0 分 |

---

## AI 對手設計

- 暱稱：從 65 個名字隨機抽取（台灣風格 + 英文 + 遊戲感暱稱）
- 等級：玩家等級 ±3 範圍內隨機
- **橡皮筋難度**：依近期勝負自動調整答對率
  - 連輸 2 場以上 → 50–65%（變簡單）
  - 正常 → 70–85%
  - 連贏 2 場以上 → 85–95%（變難）
- 答題速度：答對 2–6 秒、答錯 5–9 秒（模擬真人猶豫感）

---

## 週排行榜設計

- 每週一重置，顯示 10 人榜單（玩家 + 9 個假玩家）
- 假玩家分數以玩家首次看榜的 weeklyScore 為基準，上下各有差距
- 假玩家每天 5 個時段（9am / 12pm / 3pm / 6pm / 9pm）各自增加 0–50 分
- 增量為確定性生成（seed = 週次 + 玩家ID + 時段），重開 APP 結果一致

---

## App Store 上架

```bash
# 雲端打包 iOS
eas build --platform ios --profile production --non-interactive

# 提交到 App Store Connect
eas submit --platform ios --latest
```

---

## UI 設計規格

- **主色調：** 日本紅 `#C41E3A`、深藍灰 `#2C3E50`、白 `#FFFFFF`
- **字體：** 系統字體，日文單字超大顯示（≥48px）
- **動畫：** 倒數最後 3 秒紅色加速、答對綠色縮放、答錯紅色震動

---

## 版本歷史

| 版本 | 內容 |
|------|------|
| v1.4.0 | 週排行榜、智慧配對（橡皮筋難度）、名字池擴充至 65 個 |
| v1.3.0 | N3 題庫、難度選擇器（N4 / N3 / 全部） |
| v1.1.0 | 雙語 i18n（繁中 / 英文）、英文題庫補齊 |
| v1.0.0 | 初版上架：N4 對戰、計分、等級系統 |

---

## Phase 2 預想功能

- [ ] 真人即時對戰（WebSocket）
- [ ] 更多題型（中翻日、讀音、文法填空）
- [ ] 擴充題庫（N2–N1）
- [ ] 帳號系統（Apple / Google 登入）
- [ ] 聽力題（TTS 語音）
- [ ] 錯題複習系統
