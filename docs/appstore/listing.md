# App Store 頁面文案

App Store Connect 上的文字都以這份為準。改版時先改這裡，再貼到 App Store Connect。

規則：
- 純文字，不用 emoji。
- 寫的內容必須跟 App 實際行為一致：對手和排行榜上的其他玩家都是 AI，不能寫成真人。
- 副標題、描述、關鍵字、截圖要跟新版本一起送審才能修改；宣傳文字可以隨時改。
- 名稱和副標題已出現的字，不要再放進關鍵字（Apple 會一起比對，重複等於浪費字數）。
- 級數要用空格分開寫（N2 N3 N4），「N4–N2」可能被當成一個詞，搜「N4單字」找不到。
- 不放沒人搜的詞（1.6.4 拿掉「搶答」：App Store 上搜尋結果是 0）。選詞前可用 iTunes Search API（itunes.apple.com/search?term=…&country=tw&entity=software&limit=200）查排名與競爭；順序跟手機上的搜尋不完全相同，只當參考。
- 還沒做的功能不能寫進關鍵字（審查指南 2.3.7）。

---

## 繁體中文

**名稱**（不變，必須跟 `app.json` 的 `name` 一致）
```
日文知識王
```

**副標題**（上限 30 字）
```
日檢單字對戰．JLPT N5 N4 N3 N2
```

**宣傳文字**（上限 170 字，可隨時修改）
```
跟 AI 對手限時搶答日文單字！搶快也搶正確，用最直覺的方式記住 JLPT 單字
```

**關鍵字**（上限 100 字元，逗號分隔、不加空格）
```
日文,日語,學日文,日文檢定,背單字,挑戰,測驗,快問快答,日本語,語言學習,益智,學習遊戲,記憶,五十音,平假名,片假名,考試,練習,問答,詞彙,單字卡,自學,學習,能力試驗,外語,題庫,知識
```

**描述**（1.8.0 送審時貼上；1.7.0 線上仍是舊描述）
```
挑戰你的日文實力！

【日文知識王】把背單字變成限時對戰：每場 5 題、每題 10 秒，和 AI 對手比誰答得又快又準。從五十音到 N2，選一個適合你的難度就能開始。

— 怎麼玩 —
左右滑動選難度，按下開始對戰。
・單字：題目只顯示假名，從四個選項中選出正確的意思
・五十音：看假名選讀音，或看讀音選假名
答對得越快，分數越高；超過 10 秒就算超時。

— 核心特色 —
・每日任務：每天 3 個小目標和一個今日主題戰，完成就在月曆上蓋章
・答錯的字會在之後的對戰再出現，答對了才算收服；在不同的兩天都答對，就算「已掌握」
・首頁看得到練習天數和已掌握的字數
・可以設定每日練習提醒，中午或睡前
・五十音練習：平假名、片假名各一個難度，包含濁音、半濁音和拗音
・JLPT N5 到 N2 單字，加上在日本生活的常用詞，可依程度選擇
・結算頁把讀音標在漢字上方，答完馬上複習
・AI 對手會依你最近的表現調整強弱：輸了會變簡單，連勝才會變難
・每週排行榜，每週一重置，和 AI 玩家比拚本週分數
・累積分數升級，看得見自己的進步
・中文、英文介面，依手機語言自動切換
・遊戲紀錄自動備份到雲端
・覺得題目有問題，可以在結算頁直接回報，題庫會持續修正

— 適合誰 —
・剛開始學日文、想把五十音記熟的初學者
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
n5,n4,n3,n2,hiragana,katakana,words,learn,study,exam,language,trivia,game,practice,nihongo,japan
```

**Description** (paste with 1.8.0; 1.7.0 still has the old text)
```
Put your Japanese to the test!

Nihongo Quiz King turns study into a timed battle: 5 questions per match, 10 seconds each, against an AI opponent. Who's faster and more accurate? Start anywhere from kana to JLPT N2.

HOW TO PLAY
Swipe to pick your level, then start a battle.
- Vocabulary: each question shows a word in kana only. Pick its meaning from four choices.
- Kana: see a kana and pick its reading, or see a reading and pick the kana.
The faster you answer correctly, the more points you score. Take longer than 10 seconds and it's a timeout.

FEATURES
- Daily missions: three small goals and a daily theme battle each day. Finish them to stamp your calendar.
- Words you miss come back in later battles until you get them right. Get a word right on two different days and it counts as mastered.
- See your practice days and mastered words on the home screen.
- Optional daily practice reminder, at noon or before bed.
- Kana practice: separate hiragana and katakana levels, including voiced sounds and combinations.
- JLPT N5 to N2 vocabulary, plus everyday words for life in Japan.
- The results screen shows each word's reading above the kanji, so you can review right away.
- The AI opponent adapts to you: it eases up after you lose and only gets tougher on a win streak.
- Weekly leaderboard against AI players, resets every Monday.
- Earn points and level up to see your progress.
- English and Traditional Chinese interface, matched to your phone's language.
- Your progress is backed up to the cloud automatically.
- Spot a question that looks wrong? Report it from the results screen and we'll fix it.

GREAT FOR
- Beginners learning hiragana and katakana
- JLPT test takers
- Japanese learners who want a fun way to review vocabulary
- Anyone who loves fast-paced quiz games
```

---

## 1.8.0 版本更新說明

**繁體中文**
```
・新增「今日」分頁：每天 3 個任務、今日主題戰，完成就在月曆上蓋章
・答錯的字會在之後的對戰再出現，答對了才算收服；兩天都答對就算掌握
・首頁顯示練習天數和已掌握的字數
・可以設定每日練習提醒，中午或睡前
・設定和意見回饋移到首頁右上角
```

**English**
```
- New Today tab: three daily missions and a daily theme battle. Finish them to stamp your calendar.
- Words you miss come back in later battles until you get them right. Get a word right on two different days to master it.
- The home screen now shows your practice days and mastered words.
- Optional daily practice reminder, at noon or before bed.
- Settings and feedback moved to the top-right corner of the home screen.
```

---

## 截圖

檔案在 `docs/appstore/screenshots/<尺寸>/{zh,en}/`，依檔名順序上傳。**上傳前先看 App Store Connect 那一格寫的支援尺寸**，Apple 會隨新機型調整：

| 資料夾 | 尺寸 | 對應 App Store Connect 欄位 |
|---|---|---|
| `6.3in_1179x2556` | 1179 × 2556 | iPhone 6.1／6.3 吋 |
| `6.9in_1320x2868` | 1320 × 2868 | iPhone 6.9 吋 |
| `6.5in_1242x2688` | 1242 × 2688 | iPhone 6.5 吋 |

原稿以 1242 × 2688 合成，其他尺寸是等比縮放後裁掉邊緣幾個像素（長寬比差不到 1%）。用 `scripts/compose_appstore_screenshots.py` 從模擬器原始截圖合成（粉彩可愛風：每張不同淡色底、平假名泡泡；中文字型 jf open 粉圓，下載方式見腳本開頭）。

| # | 畫面 | 繁中標題 / 副標 | English headline / subline |
|---|---|---|---|
| 1 | 作答中 | 1 對 1 日文單字對戰 / 和對手限時搶答 | Japanese vocab battles / Race an opponent |
| 2 | 答對瞬間 | 10 秒搶答 / 越快答對，分數越高 | 10 seconds per question / Answer faster, score higher |
| 3 | 五十音（1.7.0 新增） | 從五十音開始 / 平假名、片假名也能對戰 | Start with kana / Hiragana and katakana battles |
| 4 | 首頁 | N5 到 N2 任你選 / 左右滑動，挑你的難度 | Pick your level: N5 to N2 / Swipe to choose your level |
| 5 | 勝利結算 | 打贏對手，累積升級 / 每題都附讀音與答案 | Win and level up / Every answer, with its reading |
| 6 | 排行榜 | 每週排行榜 / 看看你這週排第幾 | Weekly leaderboard / See where you rank this week |

截圖技巧：作答畫面要選對答案再截，可暫時把 `app/battle/play.tsx` 的 `elapsedRef.current += 0.1` 改成 `0.02`（倒數放慢 5 倍），截完務必還原、不要 commit。狀態列用 `xcrun simctl status_bar booted override --time "9:41" ...` 統一。
