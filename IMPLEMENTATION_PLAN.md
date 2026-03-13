# 三週 Implementation Plan — Field Flow → nuva 改版

> 產出日期：2026-03-13
> 基於完整 codebase audit，涵蓋專案結構、路由、元件、資料流、權限、UI 行為

---

## 目錄

1. [專案結構理解摘要](#一專案結構理解摘要)
2. [受影響範圍盤點](#二受影響範圍盤點)
3. [需求歧義 / 風險 / 待確認](#三需求歧義--風險--待確認)
4. [實作策略](#四實作策略)
5. [三週排程](#五三週排程)
6. [任務拆解清單](#六任務拆解清單)
7. [驗收標準](#七驗收標準definition-of-done)
8. [MVP 與建議優先順序](#八mvp-與建議優先順序)

---

## 一、專案結構理解摘要

### 架構

- **框架**：Next.js 16.1.6 (App Router)，TypeScript 5，單一應用（非 monorepo）
- **資料庫**：Supabase (PostgreSQL)，11 張資料表
- **認證**：自製 JWT session（`jose` 庫），兩種 cookie：`ff_participant_session` / `ff_staff_session`
- **UI**：Tailwind CSS 4 + 全手寫元件（無 shadcn / MUI / Chakra）
- **狀態管理**：無全域 store，Server Actions + `useActionState` + `revalidatePath`
- **測試**：Vitest（unit / integration）+ Playwright（E2E）

### 前台 / 後台切分

| 面向 | Route Group | Layout Guard |
|------|------------|-------------|
| 法法登入 | `(participant-public)/login` | 無（已登入則 redirect `/home`） |
| 法法功能 | `(participant-app)/home, /agenda, /qa` | `requireParticipantSession()` |
| 努努登入 | `staff/login` | 無 |
| 努努選身份 | `staff/select` | `requireStaffAuth()` |
| 努努後台 | `staff`（主頁） | `requireStaffIdentity()` |

### 權限模型

目前只有二元角色：`participant` vs `staff`。所有 12 位工作人員權限完全相同，**Lily 與 Asa 無任何特殊權限機制**。工作人員登入使用共用密碼（env `STAFF_PASSWORD`），再選擇身份。

### 資料模型重點

| 表 | 重點 |
|----|------|
| `activity_state`（singleton） | `current_agenda_item_id` + `event_start_at` + `event_end_at` — **已有 `event_start_at` 欄位**，可直接用於倒數計時 target |
| `attendance_logs` | 以最新一筆 log 的 `action` 判斷報到狀態（`check_in` / `undo_check_in`） |
| `lunch_logs` | 以 `participant_id` unique constraint 判斷（已領 / 未領），**無 undo** |
| `agenda_items` | 有 `visible_to_participants` 欄位，**但 DAL 從未使用此欄位做篩選** |

### 與本次需求直接相關的模組

- Auth / session：`lib/auth/session.ts`, `lib/dal/auth-check.ts`
- Agenda：`lib/dal/agenda.ts`, `lib/actions/agenda.ts`, `components/staff/CurrentAgendaSwitcher.tsx`, `components/participant/AgendaTimelineAccordion.tsx`
- Attendance：`lib/dal/attendance.ts`, `lib/actions/attendance.ts`, `components/staff/CheckInPanel.tsx`
- Lunch：`lib/dal/lunch.ts`, `lib/actions/lunch.ts`, `components/staff/LunchManagementPanel.tsx`
- Q&A：`components/qa/QAFilterBar.tsx`, `components/qa/QAPageClient.tsx`, `components/staff/QAManagementPanel.tsx`
- Navigation：`components/participant/BottomNavBar.tsx`, `components/participant/AIAssistantModal.tsx`
- Layout：`app/(participant-app)/layout.tsx`, `app/layout.tsx`

---

## 二、受影響範圍盤點

### 頁面

| 頁面 | 路徑 | 需求 |
|------|------|------|
| 法法登入 | `app/(participant-public)/login/page.tsx` | B7 logo 替換 |
| 法法首頁 | `app/(participant-app)/home/page.tsx` | B6 gated flow |
| 法法議程 | `app/(participant-app)/agenda/page.tsx` | B1-B3 卡片預覽 / 展開 / 聚焦 |
| 法法 Q&A | `app/(participant-app)/qa/page.tsx` | B5 filter 調整 |
| 法法 Layout | `app/(participant-app)/layout.tsx` | B4 navbar / B6 route guard |
| 努努後台 | `app/staff/page.tsx` | A1-A6 多項改動 |
| 努努選身份 | `app/staff/select/page.tsx` | A7 返回登入 |
| Root | `app/layout.tsx` | B7 metadata |
| Root redirect | `app/page.tsx` | B6 gated flow |

### 元件

| 元件 | 影響需求 |
|------|---------|
| `BottomNavBar.tsx` | B4（新增第 4 格「問 AI」） |
| `AIAssistantModal.tsx` | B4（移除浮動按鈕，改 navbar 觸發） |
| `AgendaTimelineAccordion.tsx` | B1-B3（卡片預覽 / 展開 / 聚焦 / scroll） |
| `CurrentAgendaSwitcher.tsx` | A1（權限控管）、A2（確認 dialog） |
| `StaffAgendaPanel.tsx` | A3（左右切換） |
| `CheckInPanel.tsx` | A5（全面重寫：dashboard + list + search + number pad） |
| `LunchManagementPanel.tsx` | A6（全面重寫，比照報到） |
| `QAManagementPanel.tsx` | A4（filter 改為全部 / 待回答） |
| `QAFilterBar.tsx` | B5（status filter 改為 all / answered） |
| `StaffIdentitySelector.tsx` | A7（新增返回登入按鈕） |
| `ParticipantLoginForm.tsx` | A8（numeric-only 強化） |
| **新增** `PreCheckInScreen.tsx` | B6（YouTube + 倒數 + 地圖） |
| **新增** `NumberPad.tsx` | A5 / A6 共用 |
| **新增** `StatusListPanel.tsx` | A5 / A6 共用（dashboard + 列表 + 搜尋） |
| **新增** `ConfirmDialog.tsx` | A2 共用 |

### DAL / Actions / Constants

| 檔案 | 影響 |
|------|------|
| `lib/dal/agenda.ts` | 需加 `visible_to_participants` filter |
| `lib/dal/attendance.ts` | 需新增 `getAllParticipantsWithStatus()` |
| `lib/dal/lunch.ts` | 需新增 `getAllParticipantsWithLunchStatus()` |
| `lib/dal/auth-check.ts` | 需新增 check-in gating logic |
| `lib/actions/agenda.ts` | 需加 Lily / Asa 權限檢查 |
| `lib/constants/index.ts` | 需加 `STAGE_SWITCH_ALLOWED_STAFF` |

### Schema / Types

| 項目 | 影響 |
|------|------|
| `activity_state.event_start_at` | 已存在，用於倒數 target（需確認後台可編輯） |
| `types/dto.ts` | 新增 `ParticipantWithStatus`, `PreCheckInPayload` 等 |
| 新增 config | Lily / Asa 的 staff name allowlist |

---

## 三、需求歧義 / 風險 / 待確認

### 歧義盤點

| 項目 | 分析 | 建議 |
|------|------|------|
| **「雪人」角色** | Codebase 中不存在 "雪人" 概念。根據上下文推斷 = 尚未報到的 participant（`attendance_logs` 中無 `check_in` 記錄的使用者） | 確認：「雪人」= participant where `is_checked_in === false` |
| **Q&A vs 常見問題** | Codebase 中只有**一個模組** `questions` 表。法法端叫「常見問題」(`/qa`)，努努端叫「Q&A 管理」。**是同一資料、不同視圖** | 不需新增模組 |
| **Agenda 權限綁定方式** | 目前無任何 staff 權限機制。建議用 **staff name allowlist**（`["Lily", "Asa"]`）存在 constants 中，比對 `session.selectedStaffName` | 比 role / permission 簡單，符合當前二元架構 |
| **報到 ↔ 午餐 ↔ 首頁解鎖的資料依賴** | 報到影響 gated flow（B6）；午餐獨立於報到；首頁解鎖僅依賴報到狀態 | 午餐與報到無直接依賴 |
| **開放時間設定** | `activity_state` 表已有 `event_start_at` 欄位。可直接作為「開放報到時間」使用，無需新增欄位 | 需新增後台 edit UI + action |
| **`Flow` 品牌範圍** | 目前出現在：`APP_NAME`、login 頁 h1、metadata title、各頁 metadata。`public/nuvaLogo.png` **尚未存在**（需由使用者提供） | 先替換 UI logo + title，不做全面品牌 rename |
| **已報到改回未報到** | 已有 `undoCheckIn` action 與 UI（CheckInPanel 中的「撤回報到」按鈕）。在新的列表模式下是否保留？ | **待確認**：列表中是否要支援雙向切換 |
| **法法端 Q&A status filter** | 需求 B5 要「全部狀態 / 已回答」。現有是「全部 / 待回答」 | 需改 filter 邏輯：`pending` → `answered` |
| **Timezone** | 未在 codebase 中明確設定。Supabase 預設 UTC，`event_start_at` 為 `TIMESTAMPTZ` 類型 | 假設 Asia/Taipei (UTC+8)。存入 DB 時需帶 timezone offset |

### Open Questions（需 PM / 設計確認）

1. `public/nuvaLogo.png` 是否已準備好？尺寸與格式？
2. 努努後台的「開放時間」編輯 UI 要做多精細？（date picker vs 簡單 input）
3. 報到列表中「已報到」的人是否可改回「未報到」？
4. 法法 pre-check-in 畫面的視覺設計稿？
5. Agenda 左右切換的設計稿？
6. Number pad 的設計稿（尤其是尺寸、佈局）？

### 技術風險判斷

| 類別 | 影響項目 | 風險等級 |
|------|---------|---------|
| **UI-only** | B1-B3 卡片預覽 / 展開 / 聚焦、B4 navbar、B7 logo、A7 返回登入、A8 numeric input | 低 |
| **資料流 / API** | A5 / A6 報到午餐列表（需新 DAL query）、A9 開放時間設定 | 中 |
| **Auth / Navigation / Guard** | B6 gated flow（最大風險：需改 layout guard + 新增 check-in status 到 server fetch） | **高** |
| **Mobile UX** | A5 number pad、A3 左右切換、B3 auto-scroll | 中 |
| **測試範圍** | B6 gating（影響所有 participant 路由）、A1 權限（影響 agenda action） | 中 |
| **最容易超出三週** | A5 / A6 報到 + 午餐完整重寫（dashboard + list + search + number pad + status update + refresh） | **高** |

---

## 四、實作策略

### 優先做的事與原因

1. **A8 numeric-only** → 盤點後發現**已實作**（`inputMode="numeric"` + `replace(/\D/g,"")` 在 `ParticipantLoginForm.tsx:39` 和 `CheckInPanel.tsx:69`）。只需確認無遺漏。
2. **A7 返回登入** → 極小改動，5 分鐘完成。
3. **B6 gated flow** → 優先度最高，因為它改變整個法法端的 navigation 邏輯。必須先建立「取得 participant check-in status」的 DAL 函式，後續 A5 / A6 也會用到。
4. **A5 / A6 報到午餐** → 工作量最大，需先設計共用元件（NumberPad + StatusListPanel），再分別套用。
5. **A1-A3 agenda** → 中等工作量，無外部依賴。

### 可共用 Pattern / 元件

| 共用項目 | 使用場景 | 建議 |
|---------|---------|------|
| **StatusListPanel** | A5 報到 + A6 午餐 | 抽成共用元件：dashboard stats + 搜尋 + status filter + participant 列表 + 快速操作 |
| **NumberPad** | A5 報到 + A6 午餐 | 共用 0-9 大按鍵 + 清除 + 確認 |
| **ConfirmDialog** | A2 agenda 切換確認 + 其他確認場景 | 簡單 modal overlay + confirm / cancel |
| **GatedLayout** | B6 情境一 + 情境二 | pre-check-in screen 作為 reusable gate wrapper |
| **Agenda 卡片** | B1-B3 | 沿用現有 `AgendaTimelineAccordion`，擴充 auto-scroll + visual emphasis |
| **品牌 config** | B7 | 統一 logo / app name 從 constants 載入 |

### 報到成功後 refresh 設計

使用 `revalidatePath("/staff")` 在 server action 中觸發。列表使用 SSR + server component，每次 action 完成後頁面會 re-render。不需要 optimistic update，因為 check-in 操作需要 DB 確認。

### Mobile Number Pad 設計

```
┌─────┬─────┬─────┐
│  1  │  2  │  3  │
├─────┼─────┼─────┤
│  4  │  5  │  6  │
├─────┼─────┼─────┤
│  7  │  8  │  9  │
├─────┼─────┼─────┤
│ 清除 │  0  │ 報到 │
└─────┴─────┴─────┘
```

- 每個按鈕 min-height 64px，min-width 根據 1/3 容器寬度
- 數字顯示在上方大字型 input（readOnly，由按鈕控制）
- 輸入滿 3 碼後自動 focus 到「報到」按鈕

### Agenda 聚焦進行中實作

在 `AgendaTimelineAccordion` 中：
- 為 current item 加 `ref`
- mount 後用 `scrollIntoView({ block: "center" })` 定位
- current item 加 `scale-[1.02]` + `ring-2 ring-primary-300` 視覺強調
- current item 預設 expanded

### Agenda 權限控管

```typescript
// lib/constants/index.ts
export const STAGE_SWITCH_ALLOWED_STAFF = ["Lily", "Asa"];
```

在 `setCurrentAgenda` action 中檢查 `session.selectedStaffName`。在 `CurrentAgendaSwitcher` 中傳入 `canSwitch` prop 控制 UI。

### 工作任務左右切換

將 `StaffAgendaPanel` 改為 horizontal snap scroll：
- CSS：`overflow-x: auto; scroll-snap-type: x mandatory;` 每個 assignment card `scroll-snap-align: start;`
- 加上當前 stage indicator dot pagination

### Pre-check-in gated flow

在 `(participant-app)/layout.tsx` 中：
1. `requireParticipantSession()` 取得 session
2. `getAttendanceStatus(session.participantId)` 查報到狀態
3. `getActivityStartTime()` 取得 `event_start_at`
4. 若未報到 → render `PreCheckInScreen`（根據時間顯示情境一或二）
5. 若已報到 → render children

### 問 AI 移到 Navbar

`BottomNavBar` 從 3 項改為 4 項：首頁、活動議程、常見問題、**問 AI**。第 4 項不使用 `Link`（不是路由），而是 `button` + `onClick` 開啟 AIAssistantModal。需透過 AIModalProvider（React Context）讓 navbar 按鈕控制 modal 開關。

### Flow → nuvaLogo 替換範圍

| 位置 | 現況 | 改動 |
|------|------|------|
| `app/(participant-public)/login/page.tsx` | SVG icon + h1 "Field Flow" | `<Image src="/nuvaLogo.png">` |
| `app/layout.tsx` metadata | `title: "Field Flow"` | `title: "nuva"` |
| `lib/constants/index.ts` | `APP_NAME = "Field Flow"` | `APP_NAME = "nuva"` |
| 各頁 metadata | `— Field Flow` suffix | `— nuva` suffix |
| favicon / PWA | Next.js 預設 | 本輪不處理（Nice-to-have） |

---

## 五、三週排程

### Week 1：基礎建設 + Gated Flow + 小項

**本週目標**：完成法法端 gated flow（B6）、所有低風險小項（A7 / A8 / B7 / B4 / B5）、共用元件骨架。

#### Day 1-2：基礎建設 + 小項

| 任務 | 檔案 | 備註 | 可平行 |
|------|------|------|--------|
| A7 返回登入按鈕 | `app/staff/select/page.tsx` | 新增 `<a href="/login">` 按鈕 | Yes |
| A8 確認 numeric 已實作 | `ParticipantLoginForm.tsx`, `CheckInPanel.tsx`, `LunchManagementPanel.tsx` | 盤點確認，可能已完成 | Yes |
| B7 品牌替換 | `app/layout.tsx`, `app/(participant-public)/login/page.tsx`, `lib/constants/index.ts` | 替換 Field Flow → nuva, SVG icon → `<Image src="/nuvaLogo.png">` | Yes |
| B5 法法 Q&A filter 調整 | `components/qa/QAFilterBar.tsx`, `components/qa/QAPageClient.tsx` | status toggle: `pending` → `answered` | Yes |
| A4 確認努努 Q&A filter | `components/staff/QAManagementPanel.tsx` | 確認已有 all / pending，加上 UI 確認 | Yes |

#### Day 3-4：Gated Flow 核心（B6）

| 任務 | 檔案 | 備註 | 前置依賴 |
|------|------|------|---------|
| 新增 `getActivityStartTime()` DAL | `lib/dal/activity-state.ts`（新增） | 取 `event_start_at` from `activity_state` | 無 |
| 新增 participant check-in status 查詢 | `lib/dal/attendance.ts` | 新增 `isParticipantCheckedIn(participantId)` | 無 |
| 修改 participant layout guard | `app/(participant-app)/layout.tsx` | 加入 check-in status + `event_start_at` 判斷 | 上面兩項 |
| 新增 `PreCheckInScreen` 元件 | `components/participant/PreCheckInScreen.tsx`（新增） | YouTube embed + countdown + 地圖按鈕 | 無 |
| 新增 `CountdownTimer` 元件 | `components/participant/CountdownTimer.tsx`（新增） | client component, target = `event_start_at` | 無 |

#### Day 5：Navbar + AI 入口（B4）

| 任務 | 檔案 | 備註 | 前置依賴 |
|------|------|------|---------|
| BottomNavBar 加第 4 格 | `components/participant/BottomNavBar.tsx` | 新增「問 AI」按鈕 | 無 |
| AIAssistantModal 移除浮動按鈕 | `components/participant/AIAssistantModal.tsx` | 移除 floating trigger，改為 props / context 控制 | 無 |
| AIModalProvider context | `app/(participant-app)/layout.tsx` | 串接 navbar ↔ modal | 上面兩項 |

#### Week 1 預期產出

- 法法登入後根據報到狀態顯示 gated 畫面或正常首頁
- YouTube + countdown + 地圖導航頁面可用
- Navbar 4 格、AI 從 navbar 開啟
- Q&A filter 法法端改為 all / answered
- 品牌替換完成
- 努努選身份有返回登入

#### Week 1 測試

- [ ] 未報到 + 時間未到 → 顯示 YouTube 頁
- [ ] 未報到 + 時間已到 → 顯示報到提示
- [ ] 已報到 → 正常首頁
- [ ] Navbar 4 格正確顯示、AI modal 從 navbar 開啟
- [ ] Q&A filter 正確篩選
- [ ] 品牌 logo / title 正確顯示

#### Week 1 風險與緩解

| 風險 | 緩解 |
|------|------|
| B6 layout guard 中加 DB query，影響每次頁面載入效能 | 用 Next.js server component 資料 fetch + cache，或考慮把 check-in status 加到 session JWT 中（需 trade-off：session 會 stale） |
| `public/nuvaLogo.png` 尚未提供 | 先用 placeholder，B7 改動保持可替換 |

---

### Week 2：報到 / 午餐頁面重寫 + Agenda 改善

**本週目標**：完成報到頁面全面重寫（A5）、午餐頁面（A6）、Agenda 權限（A1-A2）。

#### Day 1-2：共用元件 + DAL

| 任務 | 檔案 | 備註 | 可平行 |
|------|------|------|--------|
| 新增 `NumberPad` 共用元件 | `components/shared/NumberPad.tsx`（新增） | 0-9 大按鍵 + 清除 + 確認，min-height 64px | Yes |
| 新增 `ConfirmDialog` 共用元件 | `components/shared/ConfirmDialog.tsx`（新增） | 半透明 overlay + title + message + 確認 / 取消 | Yes |
| 新增 `getAllParticipantsWithStatus()` | `lib/dal/attendance.ts` | 查全部 participant + 報到狀態 | Yes |
| 新增 `getAllParticipantsWithLunchStatus()` | `lib/dal/lunch.ts` | 查全部 participant + 午餐領取狀態 | Yes |

#### Day 3-4：報到頁面重寫（A5）

| 任務 | 檔案 | 備註 | 前置依賴 |
|------|------|------|---------|
| 重寫 `CheckInPanel` — dashboard 區 | `components/staff/CheckInPanel.tsx` | 上方 dashboard（已報到 / 未報到統計） | `getAllParticipantsWithStatus` |
| 報到列表 + 搜尋 + filter | 同上 | 「尚未報到」/「已報到」tab + 搜尋號碼 | 同上 |
| NumberPad 報到模式 | 同上 | 點報到 → 顯示 NumberPad → 輸入 → 確認 | `NumberPad` 元件 |
| 列表狀態更新 | 同上 | 點擊列表中的人 → 直接報到 / 撤回 | 同上 |
| 報到成功 refresh | `lib/actions/attendance.ts` | `revalidatePath("/staff")` 已有 | 無 |

#### Day 5：午餐頁面重寫（A6）+ Agenda 權限（A1-A2）

| 任務 | 檔案 | 備註 | 前置依賴 |
|------|------|------|---------|
| 重寫 `LunchManagementPanel` | `components/staff/LunchManagementPanel.tsx` | 沿用報到頁結構，共用 StatusListPanel / NumberPad | A5 共用元件 |
| A1 權限 allowlist | `lib/constants/index.ts`, `lib/actions/agenda.ts` | `STAGE_SWITCH_ALLOWED_STAFF` + action 權限檢查 | 無 |
| A1 UI disable | `components/staff/CurrentAgendaSwitcher.tsx` | `canSwitch` prop，非授權人員隱藏切換按鈕 | 同上 |
| A2 確認 dialog | `components/staff/CurrentAgendaSwitcher.tsx` | 使用 `ConfirmDialog`，顯示目標 section 名稱 | `ConfirmDialog` 元件 |

#### Week 2 預期產出

- 報到頁面：dashboard + 列表 + 搜尋 + number pad + 快速狀態更新
- 午餐頁面：同報到頁面結構
- 只有 Lily / Asa 可切換 Agenda 階段
- 切換前有確認 dialog

#### Week 2 測試

- [ ] 報到頁面 dashboard 數字正確
- [ ] 搜尋號碼可找到人
- [ ] number pad 輸入 3 碼後報到
- [ ] 列表狀態即時更新（報到後 refresh）
- [ ] 午餐同上
- [ ] 非 Lily / Asa 看不到切換按鈕
- [ ] Lily / Asa 切換時有確認 dialog
- [ ] 確認後切換成功，取消則不動

#### Week 2 風險與緩解

| 風險 | 緩解 |
|------|------|
| `getAllParticipantsWithStatus()` 需 63 筆 participant join attendance_logs，效能需注意 | 用 Supabase view 或 CTE 優化查詢；或 client-side derive status from pre-fetched logs |
| A5 / A6 重寫範圍大，一天完成午餐可能太趕 | 午餐頁面最大化重用報到頁元件，差異只有 action 與 label |

---

### Week 3：Agenda UX + 開放時間設定 + 測試 + 收尾

**本週目標**：完成 Agenda UX 改善（A3 / B3）、開放時間後台設定（A9）、整體測試與修正。

#### Day 1-2：Agenda UX

| 任務 | 檔案 | 備註 | 可平行 |
|------|------|------|--------|
| B3 議程聚焦進行中 | `components/participant/AgendaTimelineAccordion.tsx` | auto-scroll + 視覺強調 + 進行中卡片放大 | Yes |
| B1-B2 確認已實作 | 同上 | 卡片預覽 / 展開已存在，無需改動 | — |
| A3 工作任務左右切換 | `components/staff/StaffAgendaPanel.tsx` | horizontal snap scroll + dot pagination | Yes |
| Agenda `visible_to_participants` 篩選 | `lib/dal/agenda.ts` | 法法端只看 `visible_to_participants = true` 的項目 | Yes |

#### Day 3：開放時間設定（A9）

| 任務 | 檔案 | 備註 | 前置依賴 |
|------|------|------|---------|
| 新增 `updateEventStartTime` action | `lib/actions/activity-state.ts`（新增） | 更新 `activity_state.event_start_at` | 無 |
| 努努後台設定 UI | `components/staff/EventSettingsPanel.tsx`（新增）或加入 dashboard tab | datetime-local input + 儲存按鈕 | 同上 |
| StaffTabShell 新增 tab（若需要） | `components/staff/StaffTabShell.tsx` | 考慮加入「設定」tab 或放在 dashboard 內 | 同上 |

#### Day 4-5：整體測試 + 收尾

| 任務 | 檔案 | 備註 |
|------|------|------|
| Unit tests | `tests/unit/` | gating logic, permission check, countdown |
| Integration tests | `tests/integration/` | check-in list, lunch list, agenda permission |
| E2E tests | `tests/e2e/` | 完整 gated flow, staff permission |
| Bug fixes + polish | 全專案 | responsive 調整, edge cases |
| Mobile QA | — | number pad 手感, scroll 行為, safe area |

#### Week 3 預期產出

- 法法端議程自動聚焦進行中項目
- 努努端工作任務可左右切換
- 後台可調整開放報到時間
- `visible_to_participants` 正確過濾
- 全面測試通過

#### Week 3 測試

- [ ] 議程頁 auto-scroll 到進行中項目
- [ ] 進行中項目視覺放大 + 自動展開
- [ ] 工作任務左右滑動流暢
- [ ] 修改開放時間後，法法端倒數更新
- [ ] 法法端看不到 `visible_to_participants = false` 的 agenda items
- [ ] 全部 E2E 場景通過

#### Week 3 風險與緩解

| 風險 | 緩解 |
|------|------|
| Week 1-2 bug 回歸佔用時間 | Day 4-5 預留為 buffer |
| A3 左右切換在不同裝置表現不一 | CSS snap scroll 相容性佳，降級為可滑動 horizontal scroll |

---

## 六、任務拆解清單

### 前端 UI（共 15 項）

| # | 任務 | Week | 備註 |
|---|------|------|------|
| 1 | B7 — 替換 login 頁 logo + title | W1 | `login/page.tsx`, `layout.tsx`, `constants` |
| 2 | B4 — BottomNavBar 加第 4 格「問 AI」 | W1 | `BottomNavBar.tsx` |
| 3 | B4 — AIAssistantModal 移除浮動按鈕，改 context 控制 | W1 | `AIAssistantModal.tsx` |
| 4 | B4 — AIModalProvider context | W1 | `layout.tsx` |
| 5 | B5 — QAFilterBar status toggle `pending` → `answered` | W1 | `QAFilterBar.tsx`, `QAPageClient.tsx` |
| 6 | B6 — PreCheckInScreen（YouTube + countdown + 地圖） | W1 | 新增 |
| 7 | B6 — CountdownTimer client component | W1 | 新增 |
| 8 | A7 — 返回登入按鈕 | W1 | `staff/select/page.tsx` |
| 9 | A5 — CheckInPanel 重寫 | W2 | dashboard + list + search + number pad |
| 10 | A6 — LunchManagementPanel 重寫 | W2 | 比照 A5 |
| 11 | A1 — CurrentAgendaSwitcher 加 `canSwitch` prop | W2 | disabled UI |
| 12 | A2 — ConfirmDialog + 切換確認 | W2 | `CurrentAgendaSwitcher.tsx` |
| 13 | A3 — StaffAgendaPanel horizontal snap scroll | W3 | dot pagination |
| 14 | B3 — AgendaTimelineAccordion auto-scroll + 視覺強調 | W3 | `scrollIntoView` |
| 15 | A9 — EventSettingsPanel（開放時間 edit UI） | W3 | datetime-local input |

### 共用元件（共 3 項）

| # | 任務 | Week |
|---|------|------|
| 16 | NumberPad 共用元件 | W2 |
| 17 | ConfirmDialog 共用元件 | W2 |
| 18 | StatusListPanel 共用元件（dashboard + 列表 + 搜尋 + filter + action） | W2 |

### State / Data Flow（共 6 項）

| # | 任務 | Week |
|---|------|------|
| 19 | `isParticipantCheckedIn()` DAL 函式 | W1 |
| 20 | `getActivityStartTime()` DAL 函式 | W1 |
| 21 | `getAllParticipantsWithStatus()` DAL 函式 | W2 |
| 22 | `getAllParticipantsWithLunchStatus()` DAL 函式 | W2 |
| 23 | 修改 `getAgendaWithCurrentStage()` 加 `visible_to_participants` filter | W3 |
| 24 | AIModalProvider state management | W1 |

### Backend / Action / Config（共 4 項）

| # | 任務 | Week |
|---|------|------|
| 25 | `STAGE_SWITCH_ALLOWED_STAFF` constant | W2 |
| 26 | `setCurrentAgenda` action 加權限檢查 | W2 |
| 27 | `updateEventStartTime` server action | W3 |
| 28 | `revalidatePath` 確保報到 / 午餐操作後 refresh | W2 |

### Auth / Permission / Route Guard（共 2 項）

| # | 任務 | Week |
|---|------|------|
| 29 | Participant layout guard 加 check-in gating | W1 |
| 30 | Agenda action 加 staff name allowlist 權限檢查 | W2 |

### 測試（共 6 項）

| # | 任務 | Week |
|---|------|------|
| 31 | Unit: gating logic（時間判斷、報到狀態判斷） | W3 |
| 32 | Unit: permission check（Lily / Asa allowlist） | W3 |
| 33 | Unit: countdown timer（target time 計算） | W3 |
| 34 | Integration: 報到列表 + 狀態更新 | W3 |
| 35 | Integration: 午餐列表 + 狀態更新 | W3 |
| 36 | E2E: 完整 gated flow（三種情境） | W3 |

### Content / Asset（共 2 項）

| # | 任務 | Week |
|---|------|------|
| 37 | YouTube embed `https://www.youtube.com/watch?v=wHeS6sOhyC8` | W1 |
| 38 | Google Maps 連結 `https://maps.app.goo.gl/ah4pGnHs388N8caF8` | W1 |

---

## 七、驗收標準（Definition of Done）

### Agenda 權限（A1-A2）

- [ ] 以 Lily 身份登入 → 可看到並點擊 Agenda 切換按鈕
- [ ] 以 Asa 身份登入 → 同上
- [ ] 以其他人身份登入 → 可看到目前階段，**切換按鈕不可點擊或不顯示**
- [ ] 點擊切換下一個 section → 彈出確認 dialog「確定要切換到 [section name] 嗎？」
- [ ] 按「確認」→ 切換成功；按「取消」→ 不切換

### 工作任務左右切換（A3）

- [ ] 努努後台 Agenda tab 中，工作任務區可左右滑動
- [ ] 有視覺指示器（dot / page indicator）標示目前位置
- [ ] 不需垂直滑動即可瀏覽不同 stage 的工作任務

### 努努 Q&A（A4）

- [ ] 努努端 Q&A 有「全部」與「待回答」filter
- [ ] 篩選結果正確

### 報到頁面（A5）

- [ ] 頁面上方顯示 dashboard（已報到 N / 未報到 N）
- [ ] 可切換「尚未報到」/「已報到」列表
- [ ] 兩邊都可搜尋號碼
- [ ] 搜尋後可直接點擊報到
- [ ] 點「報到」→ 顯示 number pad（0-9 大按鍵）
- [ ] 輸入 3 碼後按確認 → 報到成功
- [ ] 報到成功後列表自動 refresh
- [ ] 列表中可直接點擊狀態做更新

### 午餐領取頁面（A6）

- [ ] 頁面結構與報到頁面一致
- [ ] 有 dashboard（已領取 N / 未領取 N）
- [ ] 有列表 + 搜尋 + 快速更新

### 努努選身份返回登入（A7）

- [ ] 選身份頁面有「返回登入」按鈕
- [ ] 點擊後回到法法登入畫面（`/login`）

### 學員編號輸入（A8）

- [ ] 手機上自動喚起數字鍵盤
- [ ] 無法輸入非數字字元

### 開放時間設定（A9）

- [ ] 努努後台可看到目前開放報到時間
- [ ] 可修改時間並儲存
- [ ] 修改後法法端倒數時間同步更新

### 議程卡片預覽 / 展開（B1-B2）

- [ ] 預覽狀態只顯示時間 + 標題
- [ ] 點擊展開顯示說明內容

### 議程聚焦進行中（B3）

- [ ] 進入議程頁時，進行中項目自動 scroll 到畫面中央附近
- [ ] 進行中項目自動展開
- [ ] 進行中項目有視覺強調（邊框 / 尺寸 / 動畫）

### 問 AI 入口（B4）

- [ ] 右下角浮動按鈕已移除
- [ ] 下方 navbar 第 4 格顯示「問 AI」
- [ ] 點擊第 4 格開啟 AI 助手 modal

### 法法 Q&A Filter（B5）

- [ ] 有「全部問題」/「我的問題」scope toggle
- [ ] 有「全部狀態」/「已回答」status toggle
- [ ] **沒有「待回答」filter**

### 未報到 Gated Flow（B6）

- [ ] 登入成功但未報到 + 時間未到 → 顯示 YouTube 影片 + 倒數計時 + 報到地點 + 導航按鈕
- [ ] 倒數時間預設 2026-03-14 09:30，可由努努後台調整
- [ ] YouTube 影片為 `https://www.youtube.com/watch?v=wHeS6sOhyC8`
- [ ] 導航按鈕開啟 `https://maps.app.goo.gl/ah4pGnHs388N8caF8`
- [ ] 地點文案：「大安森林公園 7 號公共廁所」
- [ ] 導航按鈕文案：「前往導航」
- [ ] 登入成功但未報到 + 時間已到 → 顯示「請先至大安森林公園 7 號公共廁所進行報到」
- [ ] 未報到時不能存取首頁、活動議程、常見問題
- [ ] 已報到 → 正常解鎖所有功能

### 品牌替換（B7）

- [ ] 登入頁 logo 從 SVG icon 改為 `public/nuvaLogo.png`
- [ ] 登入頁標題從「Field Flow」改為「nuva」（或由 logo 取代）
- [ ] 頁面 title metadata 更新

---

## 八、MVP 與建議優先順序

### Must-have（MVP，三週內必須完成）

| 優先序 | 項目 | 原因 |
|--------|------|------|
| 1 | B6 gated flow | 活動核心流程，若無此功能學員可繞過報到直接使用全站 |
| 2 | A5 報到頁面重寫 | 工作人員操作效率直接影響活動進行 |
| 3 | A1-A2 Agenda 權限 + 確認 | 防止誤操作影響全場 |
| 4 | B4 AI navbar | UI 結構性改動 |
| 5 | A7 返回登入 | 小改動但影響 UX flow |
| 6 | B7 品牌替換 | 品牌識別 |
| 7 | B5 Q&A filter | 小改動 |

### Should-have（盡量完成）

| 優先序 | 項目 | 原因 |
|--------|------|------|
| 8 | A6 午餐頁面 | 與 A5 共用元件，邊際成本低 |
| 9 | B3 議程聚焦 | UX 提升 |
| 10 | A9 開放時間後台設定 | 目前可先 hardcode，後續再加 UI |

### Nice-to-have（可延後）

| 優先序 | 項目 | 原因 |
|--------|------|------|
| 11 | A3 工作任務左右切換 | UX 優化，不影響功能 |
| 12 | A4 努努 Q&A | 現況已接近需求 |
| 13 | A8 numeric | 現況已實作 |
| 14 | B1-B2 卡片預覽 / 展開 | 現況已符合 |

### 建議實作順序

```
Week 1: B6 → B7 → A7 → B5 → B4
Week 2: A5 → A6 → A1 → A2
Week 3: B3 → A3 → A9 → 測試 → 收尾
```

### 主要 Blocker

1. **`public/nuvaLogo.png`** 必須由使用者 / 設計師提供
2. **B6 視覺設計**（YouTube 嵌入 + 倒數計時頁面）若無設計稿，需靠工程師自行排版
3. **A5 / A6 number pad + 列表設計**若無設計稿，需靠工程師自行設計
4. **已報到改回未報到**（undo）在新列表模式下的行為需 PM 確認
