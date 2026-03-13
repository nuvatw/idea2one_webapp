# Week 6 Implementation Log — AI 助手

## 1. 本週目標

法法可以透過右下角 AI Widget 詢問活動相關問題。AI 回答基於 agenda / 活動知識庫 / 既有 Q&A。AI 不確定時引導轉正式提問。AI 失敗時顯示 fallback。

## 2. 本週完成項目

- [x] `/api/ai/ask` Route Handler (POST) — 完整實作 AI 問答 endpoint
- [x] `lib/ai/retrieval.ts` — 收集 agenda / KB / answered Q&A 作為 AI prompt context
- [x] `lib/ai/prompt.ts` — system prompt shaping，注入 retrieval context，要求 JSON 回應格式
- [x] `lib/ai/response-mapper.ts` — 解析 AI 回應，分類為 answered / uncertain / out_of_scope / error，enrichment related questions
- [x] `AIWidget` client component — floating button + bottom sheet panel，支援所有 spec 定義狀態
- [x] `HomeAIWidget` wrapper — /home 頁面的 AI widget，handoff 導航至 /qa 並帶 prefill
- [x] AI → 正式提問 handoff 流程 — uncertain 時帶 draftQuestion 到 FormalQuestionComposer
- [x] Related questions 顯示（最多 3 筆）
- [x] AI failure fallback —「AI 目前正在午休中」
- [x] out_of_scope 回應 — 非活動問題回覆範圍控制
- [x] AIWidget 掛載到 `/home` 與 `/qa`
- [x] AI interaction logging to `ai_logs` table
- [x] FormalQuestionComposer 支援 `source` prop（ai_handoff badge）
- [x] QAPageClient 支援 `initialPrefill` 與 `initialSource` for AI handoff

## 3. 實際修改的檔案清單

### 新增
| 檔案 | 用途 |
|------|------|
| `lib/ai/retrieval.ts` | AI 知識檢索（agenda / KB / Q&A） |
| `lib/ai/prompt.ts` | Prompt engineering + system prompt |
| `lib/ai/response-mapper.ts` | AI 回應解析 + related questions enrichment |
| `components/participant/AIWidget.tsx` | AI 浮動按鈕 + 問答面板 |
| `components/participant/HomeAIWidget.tsx` | /home 頁專用 AI widget wrapper |

### 修改
| 檔案 | 變更內容 |
|------|---------|
| `app/api/ai/ask/route.ts` | 從 stub 實作為完整 Route Handler |
| `app/(participant-app)/home/page.tsx` | 加入 HomeAIWidget |
| `app/(participant-app)/qa/page.tsx` | 支援 prefill / source URL params |
| `components/qa/QAPageClient.tsx` | 加入 AI handoff + AIWidget 整合 |
| `components/qa/FormalQuestionComposer.tsx` | 支援 source prop + ai_handoff badge |
| `types/dto.ts` | 新增 AIAskResponse type |
| `package.json` | 新增 openai dependency |

## 4. Blocking Prerequisites

無。Week 1-5 的基礎建設已完整就位：
- Supabase schema 包含 `ai_logs` 與 `knowledge_base_documents` 表
- 認證 session 已完成
- Q&A CRUD 已完成
- Agenda DAL 已完成

## 5. 偏離計畫之處

無。

## 6. 已執行的檢查

- [x] **typecheck** — `tsc --noEmit` 通過
- [x] **lint** — `eslint` 通過
- [x] **build** — `next build` 通過，所有路由正確生成

## 7. 目前已知問題 / 待下週處理項目

1. **OPENAI_API_KEY 未設定**：.env 中 API key 仍為註解狀態，部署前需設定實際 key
2. **knowledge_base_documents 可能無 seed data**：若 KB 表為空，AI 知識庫區塊會顯示「無活動知識庫資料」，不影響功能但影響回答品質
3. **Markdown 編輯器**：Week 7 負責，本週未觸碰
4. **AI 回答品質**：高度依賴 prompt + 知識庫內容品質，需在有實際 API key 後測試調整 prompt

## 8. 建議下一個 agent 接手時先看哪些檔案

1. `lib/ai/prompt.ts` — prompt 調整的起點
2. `lib/ai/retrieval.ts` — KB 整合驗證（Week 7 KB CRUD 後需確認 AI 使用最新內容）
3. `components/participant/AIWidget.tsx` — AI UI 元件
4. `app/api/ai/ask/route.ts` — AI endpoint 完整邏輯
5. `types/dto.ts` — AIAskResponse 定義
