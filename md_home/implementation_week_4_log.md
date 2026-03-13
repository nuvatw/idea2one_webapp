# Week 4 Implementation Log — Q&A 核心功能

## 本週目標

法法可以瀏覽公開問題、搜尋問題、發問；努努可以看到所有問題、篩選待回答、回覆問題。問題狀態可從 pending → answered 流轉。

## 本週完成項目

### 法法端

- [x] `/qa` 完整頁面（SSR 初始資料 + client-side filter/search）
- [x] `QAFilterBar`：搜尋（關鍵字 / Q code）+ 篩選（全部 / 我的問題）+ 狀態（全部 / 待回答）
- [x] `QuestionList`：問題卡片清單，顯示 Q code、內容預覽、狀態、回覆數、發問者、時間
- [x] `FormalQuestionComposer`：正式提問表單，送出後自動取得 Q code
- [x] `QuestionDetailModal`：問題詳情滿版 popup（mobile 全螢幕 / desktop modal），顯示完整 thread
- [x] `QAPageClient`：client wrapper 管理篩選、URL sync、modal 開關
- [x] URL search params 同步：`q` / `scope` / `status` / `question`

### 努努端

- [x] `QAManagementPanel`：Q&A 管理面板（左右分割：問題列表 + 詳情/回覆）
- [x] 全部 / 待回答篩選 + 搜尋
- [x] 問題詳情檢視 + 回覆 thread
- [x] 新增回覆：回覆顯示回覆者姓名
- [x] 編輯既有回覆
- [x] 整合 Q&A tab 到 `/staff` page（取代 placeholder）
- [x] 支援 `?question=Q001` deep link 直接打開該問題

### DAL / Actions

- [x] `lib/dal/questions.ts`：getQuestionsList / getQuestionDetail
- [x] `lib/actions/questions.ts`：createQuestion（含 question code 自動產生 + 唯一性重試）
- [x] `lib/actions/answers.ts`：createAnswer / updateAnswer
- [x] 自動狀態流轉：首次回覆時 pending → answered

## 實際修改的檔案清單

### 新增

| 檔案 | 用途 |
|------|------|
| `lib/dal/questions.ts` | Q&A 資料讀取 DAL |
| `lib/actions/questions.ts` | 正式提問 Server Action |
| `lib/actions/answers.ts` | 回覆 / 編輯回覆 Server Action |
| `components/qa/QAFilterBar.tsx` | 搜尋 + 篩選 UI |
| `components/qa/QuestionList.tsx` | 問題卡片清單 |
| `components/qa/FormalQuestionComposer.tsx` | 正式提問表單 |
| `components/qa/QuestionDetailModal.tsx` | 問題詳情滿版 popup |
| `components/qa/QAPageClient.tsx` | 法法 Q&A 頁 client wrapper |
| `components/staff/QAManagementPanel.tsx` | 努努 Q&A 管理面板 |

### 修改

| 檔案 | 變更 |
|------|------|
| `app/(participant-app)/qa/page.tsx` | 從 placeholder 改為完整 Q&A 頁（SSR + QAPageClient） |
| `app/staff/page.tsx` | 加入 Q&A 資料 fetch + QAManagementPanel 取代 placeholder |

### 刪除

| 檔案 | 原因 |
|------|------|
| `components/qa/.gitkeep` | 目錄已有實際檔案 |

## Blocking Prerequisites

無。Week 1–3 的基礎設施（Supabase schema、auth、route protection、CSV 匯入、agenda）皆已到位。

## 偏離計畫之處

無。

## 已執行的檢查

| 檢查項目 | 結果 |
|----------|------|
| TypeScript (`tsc --noEmit`) | ✅ 通過 |
| ESLint (`npm run lint`) | ✅ 通過 |
| Build (`npm run build`) | ✅ 通過 |
| Test | 本週未要求 test（按計畫 Week 9 為測試週，unit test 可從 Week 4 開始逐步加入但非本週必須） |

## 目前已知問題 / 待下週處理項目

1. Dashboard / 報到 / 午餐管理 tab 仍為 placeholder（Week 5 範圍）
2. Content / Markdown 編輯器為 placeholder（Week 7 範圍）
3. AI 助手浮動按鈕尚未實作（Week 6 範圍）
4. idempotency_key 尚未加在 question creation 上（Week 5 規劃中涵蓋 idempotency）
5. Q&A 頁面尚無 auto-refresh / polling 機制（spec 中以頁面 refresh 為主，非 realtime）
6. 法法 LunchStatusCard 連接真實資料待 Week 5
7. `QuestionDetailModal` 在 RWD 切換的細節打磨待 Week 8

## 建議下一個 agent 接手時先看哪些檔案

1. `md_home/implementation_plan_v1.md` — Week 5 的任務拆解
2. `app/staff/page.tsx` — Week 5 要整合報到 / 午餐 / Dashboard tab
3. `lib/dal/questions.ts` — 本週建立的 DAL 模式，Week 5 可參考建立 `lib/dal/attendance.ts` / `lib/dal/dashboard.ts`
4. `lib/actions/answers.ts` — 本週建立的 action 模式，Week 5 可參考建立 `lib/actions/attendance.ts` / `lib/actions/lunch.ts`
5. `components/staff/QAManagementPanel.tsx` — 了解 panel 結構以便建立報到/午餐 panel
6. `types/dto.ts` — 已有的 DashboardStats DTO，Week 5 直接使用
