# Week 3 Implementation Log — Agenda 顯示與切換

## 本週目標

法法打開 `/home` 可以看到「現在正在進行哪個階段」，並可展開查看完整 agenda。努努可以在後台手動切換目前活動階段，切換後法法端在下次 refresh / focus regain / 30 秒自動刷新時看到新階段。

## 本週完成項目

### 法法端

- [x] `/home` 完整首頁（SSR 初始資料）
- [x] `CurrentAgendaCard`：顯示當前階段（時間、名稱、任務、說明、注意事項、同步時間）
- [x] `AgendaTimelineAccordion`：完整 agenda 展開/收合，當前階段預設展開
- [x] `LunchStatusCard`：顯示已領取/未領取/無法取得
- [x] `CurrentAgendaAutoRefresh`：30 秒可見狀態 polling + focus regain refresh + 隱藏時暫停
- [x] `ParticipantNavBar`：頂部導覽（首頁 / Q&A / 登出），路由高亮
- [x] `/qa` 頁面加入導覽列

### 努努端

- [x] `/staff` 頁面 shell 重構
- [x] `StaffTopBar`：顯示身份、切換身份、登出、同步時間
- [x] `StaffTabShell`：7 個 tab 的 sticky tab bar（dashboard / agenda / qna / attendance / lunch / content / import）
- [x] `CurrentAgendaSwitcher`：選擇並切換目前活動階段，使用 Server Action
- [x] `StaffAgendaPanel`：個人化工作 agenda（負責任務、位置、突發注意）
- [x] Agenda tab 整合 switcher + personal panel
- [x] Import tab 保留原有 `CsvImportPanel`
- [x] 其他 tab（dashboard / qna / attendance / lunch / content）顯示 placeholder

### DAL / Actions / Types

- [x] `lib/dal/agenda.ts`：getAgendaWithCurrentStage / getCurrentAgendaItem
- [x] `lib/dal/lunch.ts`：getParticipantLunchStatus
- [x] `lib/dal/staff-agenda.ts`：getStaffAgendaAssignments（含 join + sort）
- [x] `lib/actions/agenda.ts`：setCurrentAgenda Server Action
- [x] `types/dto.ts`：新增 StaffAgendaItemDTO / LunchDisplayStatus / ParticipantHomePayload

## 實際修改的檔案清單

### 新增

| 檔案 | 用途 |
|------|------|
| `lib/dal/agenda.ts` | Agenda 資料讀取 DAL |
| `lib/dal/lunch.ts` | 午餐狀態 DAL |
| `lib/dal/staff-agenda.ts` | Staff assignment DAL |
| `lib/actions/agenda.ts` | 切換目前階段 Server Action |
| `components/participant/ParticipantNavBar.tsx` | 法法端導覽列 |
| `components/participant/CurrentAgendaCard.tsx` | 當前階段卡片 |
| `components/participant/AgendaTimelineAccordion.tsx` | Agenda 時間軸手風琴 |
| `components/participant/LunchStatusCard.tsx` | 午餐狀態卡片 |
| `components/participant/CurrentAgendaAutoRefresh.tsx` | 自動刷新 client leaf |
| `components/staff/StaffTopBar.tsx` | 努努頂部列 |
| `components/staff/StaffTabShell.tsx` | Tab 切換 shell |
| `components/staff/CurrentAgendaSwitcher.tsx` | 階段切換 UI |
| `components/staff/StaffAgendaPanel.tsx` | 個人工作 agenda |

### 修改

| 檔案 | 變更 |
|------|------|
| `app/(participant-app)/home/page.tsx` | 從 placeholder 改為完整首頁 |
| `app/(participant-app)/qa/page.tsx` | 加入 ParticipantNavBar |
| `app/staff/page.tsx` | 從 placeholder 改為 tab shell 結構 |
| `types/dto.ts` | 新增 StaffAgendaItemDTO / LunchDisplayStatus / ParticipantHomePayload |

## Blocking Prerequisites

無。Week 1–2 的基礎設施（Supabase schema、auth、route protection、CSV 匯入）皆已到位。

## 偏離計畫之處

無。

## 已執行的檢查

| 檢查項目 | 結果 |
|----------|------|
| TypeScript (`tsc --noEmit`) | ✅ 通過 |
| ESLint (`npm run lint`) | ✅ 通過 |
| Build (`npm run build`) | ✅ 通過 |
| Test | 本週未要求 test（按計畫 Week 9 為測試週） |

## 目前已知問題 / 待下週處理項目

1. Q&A 頁面尚為 placeholder（Week 4 範圍）
2. Dashboard / 報到 / 午餐管理 tab 為 placeholder（Week 5 範圍）
3. Content / Markdown 編輯器為 placeholder（Week 7 範圍）
4. 法法端 `description_markdown` / `notice_markdown` 目前以純文字渲染，若需 Markdown 渲染可在後續補上
5. StaffTabShell 的 sticky top 位置（57px）是基於 StaffTopBar 高度估計，實際 RWD 調整在 Week 8

## 建議下一個 agent 接手時先看哪些檔案

1. `md_home/implementation_plan_v1.md` — Week 4 的任務拆解
2. `app/(participant-app)/qa/page.tsx` — Week 4 要填充的法法 Q&A 頁
3. `app/staff/page.tsx` — Week 4 要整合的努努 Q&A tab
4. `types/dto.ts` — 已有的 QuestionSummary / QuestionDetail DTO
5. `lib/dal/agenda.ts` — 本週建立的 DAL 模式，Week 4 可參考建立 `lib/dal/questions.ts`
6. `components/staff/StaffTabShell.tsx` — 了解 tab 結構以便加入 Q&A 管理 panel
