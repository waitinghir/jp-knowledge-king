# 🇯🇵 日文知識王 — 對戰學日文

把背日文單字變成即時對戰遊戲。每場 5 題、每題 10 秒倒數，跟 AI 對手比誰更快更準。

> **核心假設：**「跟對手比賽」的緊張感，會讓背日文單字從枯燥變上癮。

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

---

## 快速開始

```bash
cd jp-knowledge-king
npm start          # 啟動 Expo Dev Server
npm run ios        # 在 iOS 模擬器執行
npm run android    # 在 Android 模擬器執行
```

---

## 專案結構

```
jp-knowledge-king/
├── app/
│   ├── _layout.tsx              # Root layout (Stack navigator)
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab layout
│   │   └── index.tsx            # 首頁
│   └── battle/
│       ├── matching.tsx         # 配對頁（假裝找對手 1-2 秒）
│       ├── play.tsx             # 對戰頁（出題 + 倒數 + 選項）
│       └── result.tsx           # 結算頁（勝負 + 分數統計）
├── components/
│   ├── Timer.tsx                # 環形倒數計時器
│   ├── OptionButton.tsx         # 選項按鈕（含動畫）
│   ├── ScoreBoard.tsx           # 頂部雙方分數顯示
│   └── BattleResult.tsx         # 勝負結果動畫
├── data/
│   └── n4-words.json            # N4 題庫（200 個高頻單字）
├── utils/
│   ├── ai-opponent.ts           # AI 對手邏輯
│   ├── scoring.ts               # 計分邏輯
│   └── question.ts              # 出題 / 選項生成邏輯
└── types/
    └── index.ts                 # TypeScript 型別定義
```

---

## 遊戲規則

1. 首頁點「開始對戰」
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

- 暱稱：從 35 個台灣風格名字隨機抽取
- 等級：玩家等級 ±3 範圍內隨機
- 答對率：70–90%（每場隨機決定難度）
- 答題速度：答對 2–6 秒、答錯 5–9 秒（模擬真人猶豫感）

---

## App Store 上架

```bash
# 安裝 EAS CLI
npm install -g eas-cli

# 登入
eas login

# 設定
eas build:configure

# 雲端打包 iOS
eas build --platform ios

# 提交到 App Store Connect
eas submit --platform ios
```

---

## UI 設計規格

- **主色調：** 日本紅 `#C41E3A`、深藍灰 `#2C3E50`、白 `#FFFFFF`
- **字體：** 系統字體，日文單字超大顯示（≥48px）
- **動畫：** 倒數最後 3 秒紅色加速、答對綠色縮放、答錯紅色震動

---

## Phase 2 預想功能（驗證 MVP 後）

- [ ] 真人即時對戰（WebSocket）
- [ ] 更多題型（中翻日、讀音、文法填空）
- [ ] 擴充題庫（N3–N1）
- [ ] 全服排行榜
- [ ] 帳號系統（Apple / Google 登入）
- [ ] 聽力題（TTS 語音）
- [ ] 錯題複習系統
