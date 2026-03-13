# Week 5 Implementation Log — 報到 / 午餐 / Dashboard + Demo #1

## 本週目標

努努可以完成報到、午餐標記、Dashboard 查看。法法 LunchStatusCard 連接真實資料。Week 5 結束時進行第一次 demo，主流程跑通。

## 本週完成項目

### 報到管理

- [x] `lib/dal/attendance.ts`：lookupParticipantByCode / getAttendanceStatus / getFullAttendanceStatus / getCheckedInCount
- [x] `lib/actions/attendance.ts`：checkInParticipant / undoCheckIn（含 idempotency_key 防重複送出）
- [x] `components/staff/CheckInPanel.tsx`：完整報到 UI
  - 3 碼編號輸入
  - 結果卡顯示姓名 / email / 飲食別 / 報到狀態
  - 已報到 → 顯示撤回報到按鈕
  - 重複報到 → 顯示「此學員已報到」+ 撤回選項
  - 編號不存在 → 顯示「編號查詢不到」

### 午餐管理

- [x] `lib/dal/lunch.ts` 擴充：getParticipantLunchInfo / getLunchClaimedCount
- [x] `lib/actions/lunch.ts`：markLunchClaimed（含 idempotency_key + unique constraint 防重複）
- [x] `components/staff/LunchManagementPanel.tsx`：完整午餐管理 UI
  - 3 碼編號輸入
  - 結果卡顯示姓名 / 飲食別 / 午餐狀態
  - 已領取 → 顯示「此學員已領取午餐」
  - MVP 不做午餐撤回（per spec）

### Dashboard

- [x] `lib/dal/dashboard.ts`：getDashboardStats（六項指標並行查詢）
- [x] `components/staff/StaffDashboardStatGrid.tsx`：六格指標 UI
  - 已報到 / 未報到 / 已領午餐 / 未領午餐 / 問題總數 / 待回答數
  - 2×3 grid layout（mobile 2 col, sm 3 col）

### 整合

- [x] `app/staff/page.tsx`：三個 placeholder tab 替換為真實元件
  - dashboard → StaffDashboardStatGrid
  - attendance → CheckInPanel
  - lunch → LunchManagementPanel
- [x] Dashboard 資料在 staff page SSR 時一併 fetch（Promise.all）

### 法法午餐狀態

- [x] LunchStatusCard 已在 Week 3 連接真實 `getParticipantLunchStatus` DAL，本週不需修改

### Idempotency

- [x] 報到 / 撤回報到 / 午餐標記皆使用 idempotency_key（client 端 UUID，server 端 unique constraint）
- [x] 重複 key → server 返回成功（不重複寫入）
- [x] client 端 pending disable 防止快速雙擊

## 實際修改的檔案清單

### 新增

| 檔案 | 用途 |
|------|------|
| `lib/dal/attendance.ts` | 報到資料讀寫 DAL |
| `lib/dal/dashboard.ts` | Dashboard 六項指標查詢 DAL |
| `lib/actions/attendance.ts` | 報到 / 撤回報到 Server Action |
| `lib/actions/lunch.ts` | 午餐標記 Server Action |
| `components/staff/CheckInPanel.tsx` | 報到管理 UI |
| `components/staff/LunchManagementPanel.tsx` | 午餐管理 UI |
| `components/staff/StaffDashboardStatGrid.tsx` | Dashboard 六項指標 UI |

### 修改

| 檔案 | 變更 |
|------|------|
| `lib/dal/lunch.ts` | 擴充 getParticipantLunchInfo / getLunchClaimedCount |
| `app/staff/page.tsx` | 整合 Dashboard / CheckIn / Lunch 三個 tab + 新增 import |

## Blocking Prerequisites

無。Week 1–4 的基礎設施皆已到位。

## 偏離計畫之處

- idempotency_key 改為在 client-side action wrapper 中即時產生（而非 hidden input + useState/useEffect），以符合 React 19 嚴格 lint 規則（`react-hooks/refs` 與 `react-hooks/set-state-in-effect`）。功能不變，仍為每次 submit 產生唯一 key、server 端 unique constraint 保護。

## 已執行的檢查

| 檢查項目 | 結果 |
|----------|------|
| TypeScript (`tsc --noEmit`) | ✅ 通過 |
| ESLint (`npm run lint`) | ✅ 通過 |
| Build (`npm run build`) | ✅ 通過 |
| Test | 本週未要求 test（按計畫 Week 9 為測試週） |

## 目前已知問題 / 待下週處理項目

1. Content / Markdown 編輯器仍為 placeholder（Week 7 範圍）
2. AI 助手浮動按鈕尚未實作（Week 6 範圍）
3. Dashboard 數字在操作後依賴 `revalidatePath` 刷新，不是即時推送（spec 可接受）
4. `QuestionDetailModal` RWD 細節打磨待 Week 8
5. Demo #1 建議用 seed data 跑通完整流程：法法登入 → 看 agenda → 發問 → 努努回覆 → 努努報到 → 努努標記午餐 → Dashboard 數字正確

## 建議下一個 agent 接手時先看哪些檔案

1. `md_home/implementation_plan_v1.md` — Week 6 的任務拆解（AI 助手）
2. `app/api/ai/ask/route.ts` — 目前為 503 fallback，Week 6 需實作
3. `lib/dal/attendance.ts` / `lib/dal/lunch.ts` — 若 AI 需要回答報到/午餐相關問題
4. `types/dto.ts` — AI 相關 DTO（AIAskResponse）待 Week 6 新增
5. `components/staff/StaffTabShell.tsx` — 了解 tab 結構
6. `lib/dal/dashboard.ts` — Dashboard 查詢模式可供參考
