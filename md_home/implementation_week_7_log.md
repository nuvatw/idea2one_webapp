# Week 7 Implementation Log — 內容管理（Markdown 編輯器）

## 1. 本週目標

努努可以在後台直接編輯 agenda 內容與活動知識庫（Markdown），保存後 AI 問答使用最新內容。法法端 agenda 顯示 Markdown 渲染結果。

## 2. 本週完成項目

- [x] 技術決策：textarea + preview 模式（D3 建議），`react-markdown` + `rehype-sanitize` 做渲染與安全過濾（D4 建議）
- [x] 安裝 `react-markdown`、`rehype-sanitize`、`@tailwindcss/typography`
- [x] 實作 `lib/markdown/renderer.tsx`（Markdown renderer + sanitizer，防 `<script>` 注入）
- [x] 實作 `lib/dal/knowledge.ts`（讀取 KB singleton）
- [x] 實作 `lib/actions/knowledge.ts`（Server Action：save KB，last-write-wins）
- [x] 實作 `lib/actions/agenda-content.ts`（Server Action：save agenda item description + notice）
- [x] 實作 `MarkdownEditorPanel` client component（共用元件，支援 agenda / knowledge 兩種 mode）
- [x] 實作 `ContentManagementPanel`（content tab wrapper，含 knowledge / agenda sub-tab 切換）
- [x] Dirty state 偵測 + `beforeunload` 離頁確認
- [x] 保存成功顯示「已儲存」+ 最後儲存者與時間
- [x] 保存失敗不清空編輯內容
- [x] Content tab 整合到 `/staff` page（替換 placeholder）
- [x] AI retrieval 驗證：`lib/ai/retrieval.ts` 每次 request 直接讀 DB，保存 KB 後下一次 AI query 即使用最新內容
- [x] 法法端 `CurrentAgendaCard` 使用 `MarkdownRenderer` 渲染 description 和 notice
- [x] 法法端 `AgendaTimelineAccordion` 使用 `MarkdownRenderer` 渲染展開內容

## 3. 實際修改的檔案清單

### 新增檔案
| 檔案 | 用途 |
|------|------|
| `lib/markdown/renderer.tsx` | Markdown renderer component（react-markdown + rehype-sanitize） |
| `lib/dal/knowledge.ts` | KB 讀取 DAL |
| `lib/actions/knowledge.ts` | KB 保存 Server Action |
| `lib/actions/agenda-content.ts` | Agenda 內容保存 Server Action |
| `components/staff/MarkdownEditorPanel.tsx` | 共用 Markdown 編輯器（textarea + preview） |
| `components/staff/ContentManagementPanel.tsx` | Content tab wrapper（KB + Agenda sub-tabs） |

### 修改檔案
| 檔案 | 變更 |
|------|------|
| `app/staff/page.tsx` | 新增 KB 與 staff list 資料取得、替換 content tab placeholder 為 `ContentManagementPanel` |
| `components/participant/CurrentAgendaCard.tsx` | description/notice 改用 `MarkdownRenderer` |
| `components/participant/AgendaTimelineAccordion.tsx` | description/notice 改用 `MarkdownRenderer` |
| `app/globals.css` | 新增 `@plugin "@tailwindcss/typography"` |
| `package.json` | 新增 `react-markdown`, `rehype-sanitize`, `@tailwindcss/typography` |

## 4. Blocking Prerequisites

無。Week 6 已完成 AI retrieval，KB schema 已在 Week 1 建立。

## 5. 偏離計畫之處

無。所有實作均按 implementation plan 與 spec 執行。

## 6. 已執行的檢查

- [x] **TypeScript**：`npx tsc --noEmit` — 通過，無錯誤
- [x] **ESLint**：`npx eslint . --ext .ts,.tsx` — 通過，無錯誤
- [x] **Build**：`npx next build` — 通過，所有頁面正常生成

## 7. 目前已知問題 / 待下週處理項目

- Markdown 的 `prose` class 在 dark mode 下未調整（本版不要求 dark mode，不影響）
- `MarkdownEditorPanel` 的 dirty state 僅偵測 `beforeunload`；切換 staff tab 或 sub-tab 時尚未實作 confirm dialog（切 agenda item 時因 `key` prop 會 remount，但切 sub-tab 時未擋）— 可在 Week 8 RWD 整合時補強
- 兩位努努同時編輯 KB 會 last-write-wins 覆蓋，目前只顯示最後儲存者作為提醒（符合 spec 保守做法）
- `@tailwindcss/typography` 的 prose 樣式可能需要在 mobile 上微調（Week 8 RWD 調校範圍）

## 8. 建議下一個 agent 接手時先看哪些檔案

1. `components/staff/MarkdownEditorPanel.tsx` — 核心編輯器元件
2. `components/staff/ContentManagementPanel.tsx` — content tab wrapper
3. `lib/actions/knowledge.ts` / `lib/actions/agenda-content.ts` — 保存邏輯
4. `lib/markdown/renderer.tsx` — Markdown 渲染 + sanitize
5. `app/staff/page.tsx` — staff 主頁資料取得流程
6. `components/participant/CurrentAgendaCard.tsx` / `AgendaTimelineAccordion.tsx` — 法法端 Markdown 渲染
