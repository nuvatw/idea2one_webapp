# Week 10 實作週誌：Demo 硬化與交付

## 本週目標

Production 部署完成。Demo script 準備就緒。Backup plan 文件完成。所有 edge case 修補。可交付狀態。

**本週不寫新功能。**

## 本週完成項目

### 10.1 Production seed data 準備
- 確認現有 seed CSV 資料完整性（participants, staff, agenda, assignments）
- 新增 `seed/knowledge_base.md`：活動知識庫 production seed 內容，涵蓋報到須知、午餐資訊、Wi-Fi、技術問題、Demo 發表須知、緊急聯絡、注意事項

### 10.2 Production 環境設定文件
- 新增 `.env.example`：環境變數範本，供 production 設定參考
- 新增 `md_home/production_deployment_guide.md`：完整部署指南，包含：
  - Supabase production instance 建立步驟
  - Vercel 環境變數設定（6 個必要變數）
  - 部署觸發流程
  - CSV seed data 匯入順序
  - 知識庫設定步驟
  - Production 驗證清單（法法主流程 + 努努主流程 + Mobile 測試）
  - Demo branch freeze 規則
  - 常見問題排除

### 10.9 Demo script 撰寫
- 新增 `md_home/demo_script.md`：8 Part 的完整 demo 流程，約 21 分鐘
  - Part 1：努努登入與初始設定（3 分鐘）
  - Part 2：法法登入與首頁（3 分鐘）
  - Part 3：Q&A 與 AI 助手（5 分鐘）
  - Part 4：努努 Q&A 回覆（2 分鐘）
  - Part 5：報到與午餐管理（3 分鐘）
  - Part 6：跨角色同步 — Agenda 切換（2 分鐘）
  - Part 7：努努身份切換（1 分鐘）
  - Part 8：錯誤情境展示（選做，2 分鐘）
  - 含 demo 前準備清單、注意事項

### 10.10 Backup plan 撰寫
- 新增 `md_home/backup_plan.md`：4 種故障場景的人工備案
  - AI 助手不可用 → 加速人工 Q&A 回覆
  - Supabase 不可用 → 紙本報到/午餐/Q&A 流程
  - 網路完全中斷 → 完整離線紙本備案
  - Vercel 部署不可用 → 回退部署或離線備案
  - 含備案物品清單與啟動判斷流程圖

### 10.13 Edge case 檢查
- 完整審查 codebase 核心路徑：
  - `proxy.ts` route protection 邏輯正確
  - `app/api/ai/ask/route.ts` 所有 error path 正確回傳「AI 目前正在午休中」
  - `app/page.tsx` root redirector 正確
  - `app/not-found.tsx` 與 `app/global-error.tsx` 錯誤頁面就位
  - CSV import action 匯入順序依賴處理正確
- 結果：未發現需要修補的 edge case

### Codebase 完整驗證
- typecheck：✅ 通過
- lint：✅ 0 errors, 0 warnings
- unit tests：✅ 94 tests passed
- integration tests：✅ 40 tests passed
- build：✅ 通過（所有路由正確生成）

## 實際修改的檔案清單

### 新增
- `seed/knowledge_base.md` — 活動知識庫 production seed 內容
- `.env.example` — 環境變數範本
- `md_home/demo_script.md` — Demo 展示流程
- `md_home/backup_plan.md` — 備案計畫
- `md_home/production_deployment_guide.md` — Production 部署指南
- `md_home/implementation_week_10_log.md` — 本週誌

### 修改
- 無

### 刪除
- 無

## Blocking Prerequisites

無。所有 Week 1–9 的基礎設施與功能已到位。

## 偏離計畫之處

1. **10.3–10.8（Production 部署與驗證）**：這些任務需要實際操作 Vercel Dashboard、建立 Production Supabase instance、以及使用真實手機測試，為手動操作步驟。已在 `production_deployment_guide.md` 中提供完整步驟，待操作者手動執行。
2. **10.11–10.12（Branch freeze 與 Stakeholder demo）**：屬於流程管理與人員協調，非 code 工作。已在部署指南中說明 branch freeze 規則。
3. **新增 `.env.example`**：原計畫未明確要求，但為 production 部署必要的參考文件，屬 production readiness 範疇。

## 已執行的檢查

| 檢查項目 | 結果 |
|----------|------|
| typecheck (`npm run typecheck`) | ✅ 通過 |
| lint (`npm run lint`) | ✅ 0 errors, 0 warnings |
| unit tests (`npm run test:unit`) | ✅ 94 tests passed |
| integration tests (`npm run test:integration`) | ✅ 40 tests passed |
| build (`npm run build`) | ✅ 通過 |
| edge case 審查 | ✅ 未發現問題 |

**總計：134 個 Vitest 測試全部通過（94 unit + 40 integration）。**

## 目前已知問題 / 待處理項目

1. **Production 部署待手動執行**：需操作者按照 `production_deployment_guide.md` 步驟操作 Vercel Dashboard、Supabase console。
2. **正式名單 CSV**：目前 seed data 為測試用假資料（10 名學員 + 6 名努努）。正式活動前需替換為真實名單。
3. **E2E 測試**：E2E 測試腳本已在 Week 9 建立，需在 Production deployment 後於真實環境驗證。
4. **Mobile 實機測試**：需在 Production URL 上以真實 iOS + Android 裝置測試。
5. **知識庫內容**：`seed/knowledge_base.md` 為範本，正式活動前需由 PM 審核並補充場地特定資訊（Wi-Fi SSID、實際地點等）。

## 建議下一步行動

1. 按照 `production_deployment_guide.md` 執行 Production 部署
2. 匯入正式 CSV 名單（取代測試資料）
3. 在 Production URL 上跑一次 `demo_script.md` 完整流程
4. 至少兩台真實手機驗證法法主流程
5. 確認 Backup plan 備品已準備
6. 執行 Stakeholder demo
7. 啟動 Demo branch freeze
