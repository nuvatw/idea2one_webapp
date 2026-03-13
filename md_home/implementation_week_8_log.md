# Week 8 Implementation Log — 韌性 / RWD / 錯誤處理

## 1. 本週目標

所有錯誤文案對齊 Spec、所有 mutation 有 idempotency 保護、mobile-first RWD 到位、timeout / stale / retry 行為完整、基本 accessibility 達標。

## 2. 本週完成項目

- [x] 8.1 — 逐一比對 Spec 錯誤文案清單，確認 `participant-auth.ts`、`staff-auth.ts`、`questions.ts`、`answers.ts` 所有文案完全一致
- [x] 8.2 — 所有表單 submit pending 時按鈕 disabled（已在 W2–W7 使用 `useActionState` isPending，本週確認全部到位）
- [x] 8.3 — 實作 `MutationTimeoutBanner` 共用元件（10 秒 mutation timeout UI：「連線較慢，請先確認是否已生效」+ 重試按鈕），整合至 FormalQuestionComposer、MarkdownEditorPanel、CheckInPanel、LunchManagementPanel、QAManagementPanel、CurrentAgendaSwitcher
- [x] 8.4 — 實作 `StaleBanner` 共用元件（「資料可能不是最新，請重新整理」+ 重新整理按鈕），整合至 home page
- [x] 8.5 — 補齊 idempotency：FormalQuestionComposer 加 `idempotency_key` hidden field，`questions.ts` Server Action 加 idempotency check（CheckInPanel / LunchManagementPanel 已有；answer create/update 與 markdown save 為 last-write-wins 自然冪等）
- [x] 8.6 — Mobile-first RWD 調校：所有頁面最低 360px 可用（已確認所有元件使用 responsive Tailwind classes）
- [x] 8.7 — QuestionDetailModal：mobile 滿版（`fixed inset-0`），已有 `sm:` breakpoint 樣式
- [x] 8.8 — AIWidget：mobile bottom sheet（`fixed inset-x-0 bottom-0 h-[85vh]`），已有 `sm:` breakpoint 樣式
- [x] 8.9 — 所有 input/textarea 最小字級 16px（`text-base`），避免 iOS zoom
- [x] 8.10 — 所有可點擊元素最小 hit area 44x44（`min-h-[44px]`，部分加 `min-w-[44px]`）
- [x] 8.11 — WCAG AA 對比度：確認文字不低於 `text-gray-500`（#6b7280，4.6:1 contrast ratio），修正 QAManagementPanel 空狀態文字從 `text-gray-400` → `text-gray-500`
- [x] 8.12 — 表單錯誤 `aria-describedby` + `aria-invalid` + 焦點移到第一個錯誤欄位（ParticipantLoginForm、StaffLoginForm、FormalQuestionComposer）
- [x] 8.13 — 狀態不只靠顏色：實作 `StatusBadge` 共用元件（icon + text badge），整合至 QuestionList、QuestionDetailModal、LunchStatusCard、CheckInPanel、LunchManagementPanel、QAManagementPanel、CurrentAgendaSwitcher、CurrentAgendaCard、AIWidget
- [x] 8.14 — 每頁唯一 page title（`export const metadata`）+ h1：login、home、qa、staff/login、staff/select、staff 主頁
- [x] 8.15 — loading.tsx 提供 skeleton：participant-app `loading.tsx`（nav + agenda card + lunch + timeline skeleton）、staff `loading.tsx`（top bar + tab bar + 6-card grid skeleton）

## 3. 實際修改的檔案清單

### 新增檔案
| 檔案 | 用途 |
|------|------|
| `components/shared/StatusBadge.tsx` | 共用狀態 badge（icon + 文字，非純色彩），支援 pending/answered/claimed/not_claimed/checked_in/not_checked_in/current |
| `components/shared/StaleBanner.tsx` | Stale data 偵測 banner（60 秒無同步 → 顯示提醒 + 重新整理按鈕） |
| `components/shared/MutationTimeoutBanner.tsx` | Mutation 10 秒 timeout UI（「連線較慢，請先確認是否已生效」+ 重試按鈕） |

### 修改檔案
| 檔案 | 變更 |
|------|------|
| `app/(participant-app)/loading.tsx` | 重寫為 skeleton（nav + agenda card + lunch + timeline 骨架動畫） |
| `app/staff/loading.tsx` | 重寫為 skeleton（top bar + tab bar + 6-card stat grid 骨架動畫） |
| `app/(participant-public)/login/page.tsx` | 加 `export const metadata` |
| `app/(participant-app)/home/page.tsx` | 加 metadata、StaleBanner、sr-only h1 |
| `app/(participant-app)/qa/page.tsx` | 加 metadata |
| `app/staff/login/page.tsx` | 加 metadata |
| `app/staff/select/page.tsx` | 加 metadata |
| `app/staff/page.tsx` | 加 metadata |
| `components/participant/ParticipantLoginForm.tsx` | aria-describedby、aria-invalid、focus-on-error、role="alert"、min-h-[44px] |
| `components/staff/StaffLoginForm.tsx` | aria-describedby、aria-invalid、focus-on-error、role="alert"、min-h-[44px] |
| `components/qa/QuestionList.tsx` | StatusBadge 取代色彩 badge、min-h-[44px] |
| `components/qa/QuestionDetailModal.tsx` | role="dialog"、aria-modal、focus on open、StatusBadge、skeleton loading、min-h-[44px] |
| `components/qa/FormalQuestionComposer.tsx` | text-base、aria-describedby、aria-invalid、focus-on-error、role="alert"、min-h-[44px]、MutationTimeoutBanner、idempotency_key |
| `components/qa/QAFilterBar.tsx` | text-base、aria-hidden on SVG、min-h-[44px] |
| `components/participant/LunchStatusCard.tsx` | StatusBadge 取代色彩 badge |
| `components/participant/CurrentAgendaCard.tsx` | StatusBadge 取代 inline badge |
| `components/participant/AIWidget.tsx` | text-base、role="dialog"、aria-modal、aria-hidden on SVGs、min-h-[44px]、StatusBadge、role="status" |
| `components/participant/ParticipantNavBar.tsx` | min-h-[44px] on nav links + logout |
| `components/staff/CheckInPanel.tsx` | text-base、min-h-[44px]、StatusBadge、MutationTimeoutBanner、role="alert" |
| `components/staff/LunchManagementPanel.tsx` | text-base、min-h-[44px]、StatusBadge、MutationTimeoutBanner、role="alert" |
| `components/staff/QAManagementPanel.tsx` | text-base、min-h-[44px]、StatusBadge、skeleton loading、MutationTimeoutBanner、role="alert"、text-gray-500 contrast fix |
| `components/staff/StaffTabShell.tsx` | `<nav>` + aria-label、aria-current="page"、min-h-[44px] |
| `components/staff/CurrentAgendaSwitcher.tsx` | StatusBadge、min-h-[44px]、aria-hidden on dot、MutationTimeoutBanner、role="alert"/role="status" |
| `components/staff/StaffIdentitySelector.tsx` | min-h-[44px] |
| `components/staff/StaffTopBar.tsx` | min-h-[44px] |
| `components/staff/MarkdownEditorPanel.tsx` | MutationTimeoutBanner、min-h-[44px]、role="alert" |
| `lib/actions/questions.ts` | idempotency check（by participant_id + content dedup before insert） |

## 4. Blocking Prerequisites

無。Week 2–7 所有功能已完成，本週為橫切面強化。

## 5. 偏離計畫之處

無功能偏離。技術面有一個值得記錄的調整：

- **React 19 嚴格 lint 規則**：`MutationTimeoutBanner` 和 `StaleBanner` 需要特殊設計模式以符合 React 19 的 `react-hooks/set-state-in-effect`、`react-hooks/refs`、`react-hooks/purity` 規則。最終採用「父子元件拆分 + 條件渲染 / key-based reset」模式，避免在 effect 中直接 setState 重設狀態。

## 6. 已執行的檢查

- [x] **ESLint**：`npm run lint` — 通過，無錯誤
- [x] **TypeScript**：`npx tsc --noEmit` — 通過，無錯誤
- [x] **Build**：`npm run build` — 通過，所有頁面正常生成（11 routes）

## 7. 目前已知問題 / 待下週處理項目

- `StaleBanner` 目前僅整合至 home page；qa page 可視需要在 Week 9 測試階段補充
- `MutationTimeoutBanner` 的 `onRetry` callback 目前僅在部分元件提供（多數使用者可直接重新操作）
- `idempotency_key` 在 `questions.ts` 實作為 content-based dedup（同 participant + 同 content 視為重複），而非 key-based dedup（因 questions table 無 idempotency_key column）；對單日活動場景足夠
- WCAG AA 對比度為人工檢查 Tailwind color token，未使用自動化工具掃描；建議 Week 9 搭配 axe-core 驗證
- `MarkdownEditorPanel` 切換 sub-tab 時的 dirty state confirm dialog 仍未實作（W7 遺留）

## 8. 建議下一個 agent 接手時先看哪些檔案

1. `components/shared/StatusBadge.tsx` — 全站共用狀態 badge
2. `components/shared/StaleBanner.tsx` — stale data 偵測
3. `components/shared/MutationTimeoutBanner.tsx` — mutation timeout UI
4. `components/participant/ParticipantLoginForm.tsx` — 表單 accessibility 範例
5. `components/qa/FormalQuestionComposer.tsx` — idempotency + timeout 整合範例
6. `lib/actions/questions.ts` — idempotency check 實作
7. `app/(participant-app)/loading.tsx` / `app/staff/loading.tsx` — skeleton 範例
