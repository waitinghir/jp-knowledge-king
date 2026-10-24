# App Store 頁面文案

App Store Connect 上的文字都以這份為準。改版時先改這裡，再貼到 App Store Connect。

規則：
- 純文字，不用 emoji。
- 寫的內容必須跟 App 實際行為一致：對手和排行榜上的其他玩家都是 AI，不能寫成真人。
- 副標題、描述、關鍵字、截圖要跟新版本一起送審才能修改；宣傳文字可以隨時改。
- 名稱和副標題已出現的字，不要再放進關鍵字（Apple 會一起比對，重複等於浪費字數）。

---

## 繁體中文

**名稱**（不變，必須跟 `app.json` 的 `name` 一致）
```
日文知識王
```

**副標題**（上限 30 字）
```
日文單字對戰．JLPT N4–N2
```

**宣傳文字**（上限 170 字，可隨時修改）
```
跟 AI 對手限時搶答日文單字！搶快也搶正確，用最直覺的方式記住 JLPT 單字
```

**關鍵字**（上限 100 字元，逗號分隔、不加空格）
```
日語,日檢,N3,背單字,詞彙,測驗,考試,學習,自學,搶答,遊戲,記憶,日本語,單字卡,外語,日文檢定,能力試驗,快問快答
```

**描述**
```
挑戰你的日文單字實力！

【日文知識王】把背單字變成限時對戰：每場 5 題、每題 10 秒，和 AI 對手比誰答得又快又準。

— 怎麼玩 —
題目只顯示假名，從四個選項中選出正確的意思。答對得越快，分數越高；超過 10 秒就算超時。

— 核心特色 —
・N4、N3、N2 共 600 字，加上 40 個生活常用單字，可依程度選擇
・AI 對手會依你最近的表現調整強弱：連輸會變簡單，連勝會變難
・每週排行榜，每週一重置，和 AI 玩家比拚本週分數
・累積分數升級，看得見自己的進步
・中文、英文介面，依手機語言自動切換
・遊戲紀錄自動備份到雲端
・覺得題目有問題，可以在結算頁直接回報，題庫會持續修正

— 適合誰 —
・準備日本語能力試驗（JLPT）的考生
・想用輕鬆的方式複習單字的日文學習者
・喜歡快節奏答題遊戲的人
```

---

## English

**Name** (unchanged)
```
Nihongo Quiz King
```

**Subtitle** (max 30 characters)
```
Japanese Vocab Battle · JLPT
```

**Promotional text** (max 170 characters, editable anytime)
```
Race an AI opponent to answer Japanese vocab! Be fast, be right, and remember JLPT words the most intuitive way.
```

**Keywords** (max 100 characters, comma-separated, no spaces)
```
n4,n3,n2,words,word,learn,study,exam,test,language,trivia,game,practice,nihongo,japan
```

**Description**
```
Put your Japanese vocabulary to the test!

Nihongo Quiz King turns vocab review into a timed battle: 5 questions per match, 10 seconds each, against an AI opponent. Who's faster and more accurate?

HOW TO PLAY
Each question shows a word in kana only. Pick its meaning from four choices. The faster you answer correctly, the more points you score. Take longer than 10 seconds and it's a timeout.

FEATURES
- 600 words across JLPT N4, N3 and N2, plus 40 everyday words. Pick your level.
- The AI opponent adapts to you: lose a few in a row and it eases up, win a streak and it gets tougher.
- Weekly leaderboard against AI players, resets every Monday.
- Earn points and level up to see your progress.
- English and Traditional Chinese interface, matched to your phone's language.
- Your progress is backed up to the cloud automatically.
- Spot a question that looks wrong? Report it from the results screen and we'll fix it.

GREAT FOR
- JLPT test takers
- Japanese learners who want a fun way to review vocabulary
- Anyone who loves fast-paced quiz games
```

---

## 截圖（6.5 吋，1242 × 2688）

檔案在 `docs/appstore/screenshots/{zh,en}/`，依檔名順序上傳。用 `scripts/compose_appstore_screenshots.py` 從模擬器原始截圖合成（粉彩可愛風：每張不同淡色底、平假名泡泡；中文字型 jf open 粉圓，下載方式見腳本開頭）。

| # | 畫面 | 繁中標題 / 副標 | English headline / subline |
|---|---|---|---|
| 1 | 作答中 | 1 對 1 日文單字對戰 / 和 AI 對手限時搶答 | Japanese vocab battles / Race an AI opponent |
| 2 | 答對瞬間 | 10 秒搶答 / 越快答對，分數越高 | 10 seconds per question / Answer faster, score higher |
| 3 | 首頁 | N4 到 N2 任你選 / 640 個單字，中英雙語 | Pick your level: N4 to N2 / 640 words, English and Chinese |
| 4 | 勝利結算 | 打贏對手，累積升級 / 每一題的答案都看得到 | Win and level up / Review every answer |
| 5 | 排行榜 | 每週排行榜 / 看看你這週排第幾 | Weekly leaderboard / See where you rank this week |

截圖技巧：作答畫面要選對答案再截，可暫時把 `app/battle/play.tsx` 的 `elapsedRef.current += 0.1` 改成 `0.02`（倒數放慢 5 倍），截完務必還原、不要 commit。狀態列用 `xcrun simctl status_bar booted override --time "9:41" ...` 統一。
