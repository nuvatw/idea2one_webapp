# Field Flow 十週實作計畫

---

## 1. 文件資訊

| 項目       | 內容                                                        |
| ---------- | ----------------------------------------------------------- |
| 文件名稱   | `implementation_plan_v1.md`                                 |
| 版本       | v1.0.0                                                      |
| 狀態       | Draft — 待關鍵技術決策拍板後可進入 Build                    |
| 最後更新   | 2026-03-13                                                  |
| 來源文件   | `md_home/spot.md`、`md_home/prd.md`、`md_home/spec.md`      |
| 校正依據   | Next.js v16 官方文件（App Router / proxy.ts / Auth / Server Actions）、Vercel 官方文件（Git Integration / Environments / Preview Deployments） |

---

## 2. 專案摘要

### 2.1 專案目標

為一場 **單日制戶外 coding 工作坊**（約 100 位學員、12 位工作人員、09:30–20:00）建立一個即時活動 Web App「**Field Flow**」。
核心要解決的問題：學員不知道現在要做什麼、工作人員被大量重複問題淹沒、報到與午餐狀態缺乏集中管理。

### 2.2 專案性質

**Prototype / 單次活動專用產品**。
不做多活動平台、不做正式帳號系統、不做完整離線模式。所有設計以「這場活動能順利跑完」為最高優先。

### 2.3 核心交付物

- 法法端（學員）：輕登入、即時 Agenda、公開 Q&A、AI 助手、個人午餐狀態
- 努努端（工作人員）：共用密碼登入 + 身份選擇、個人化工作 Agenda、Agenda 階段切換、Q&A 管理、報到管理、午餐管理、Dashboard、Markdown 編輯（Agenda / 知識庫）、CSV 匯入
- 系統面：Supabase 資料層、Session cookie 認證、弱網 fallback、AI failure fallback、Vercel 部署

### 2.4 十週後預期成果

- 可在真實手機瀏覽器上 demo 完整主流程
- 可部署至 Vercel Production
- 法法打開首頁 3 秒內辨識目前要做什麼
- 努努可在同一後台完成所有現場操作
- AI 助手可回答活動相關問題，失敗時有明確 fallback
- 所有核心 mutation 有 idempotency 保護
- 最小 CI 通過（typecheck + lint + unit tests + build）

---

## 3. 實作策略總覽

### 3.1 為什麼這樣排順序

本計畫遵循以下原則排序：

1. **基礎設施先行**：Week 1 建立 repo / Vercel / Supabase / 專案骨架，所有後續工作才有地方落地
2. **認證是 gate**：幾乎所有頁面都需要 session，Week 2 必須完成認證與資料匯入
3. **主流程由外而內**：先做學員最先看到的 Agenda 首頁（Week 3），再做 Q&A（Week 4），再做營運操作（Week 5）
4. **第 5 週設 demo checkpoint**：確保 5 週時主流程可跑通，降低後半段風險
5. **AI 與內容管理靠後**：AI 助手依賴 Agenda + Q&A + 知識庫資料都到位後才有意義（Week 6–7）
6. **韌性與測試收尾**：Week 8–9 專注在錯誤處理、RWD、測試，避免過早打磨細節
7. **最後一週不寫新功能**：Week 10 只做 demo 硬化與交付

### 3.2 哪些先做

| 優先序 | 項目                           | 原因                                |
| ------ | ------------------------------ | ----------------------------------- |
| 1      | Repo / Vercel / Supabase 搭建 | 所有開發的前提                      |
| 2      | 法法 / 努努認證 + CSV 匯入    | 認證是 route protection gate        |
| 3      | Agenda 顯示 + 階段切換        | 解決核心痛點：「現在要做什麼」      |
| 4      | Q&A 核心                      | 解決核心痛點：「重複問答」          |
| 5      | 報到 / 午餐 / Dashboard       | 解決營運管理需求                    |

### 3.3 哪些後做

| 項目                        | 原因                                      |
| --------------------------- | ----------------------------------------- |
| AI 助手                     | 需 Agenda + Q&A + KB 都有資料才有意義     |
| Markdown 編輯器             | 初期可用 CSV + seed 替代                  |
| 韌性（stale/timeout/retry） | 主流程穩定後再補強                        |
| 完整測試套件                | 功能 code freeze 後再大規模補測試         |

### 3.4 哪些可以並行

- Week 3：法法 Agenda 首頁 vs 努努後台 shell + tab 結構（獨立頁面，無依賴）
- Week 5：報到 / 午餐 / Dashboard 三個 panel 彼此獨立
- Week 8：錯誤處理 vs RWD polish vs Accessibility（不同面向，可分工）
- Week 9：Unit tests vs Integration tests vs E2E tests（不同層級，可分工）

### 3.5 哪些不能太早做

| 項目               | 理由                                                              |
| ------------------ | ----------------------------------------------------------------- |
| AI prompt tuning   | 知識庫與 Q&A 尚未有真實內容前，調 prompt 沒有意義                |
| Demo hardening     | 功能未完成前做 demo 修補是浪費                                   |
| Production 部署    | 測試未通過前不應上 production                                    |
| RWD 精修           | UI 元件尚未完成前做 responsive 調整會重工                        |

### 3.6 哪些地方要先做技術驗證

| 技術驗證項目                     | 最晚時間 | 說明                                                         |
| -------------------------------- | -------- | ------------------------------------------------------------ |
| Session cookie sign/verify       | Week 1   | 在 Week 2 實作認證前，必須確認 cookie sign 方案可行          |
| Supabase 連線 + 基本 CRUD       | Week 1   | 確認 server-side Supabase client 在 Next.js 16 可正常運作    |
| proxy.ts routing                 | Week 1   | 確認 Next.js 16 的 proxy.ts 行為符合預期                     |
| AI provider API call             | Week 5   | 在 Week 6 全面整合前，先驗證 API 可通、回應格式、token 限制  |
| Markdown editor library          | Week 6   | 在 Week 7 實作前，先確認 library 在 mobile 的可用性          |

---

## 4. Workstreams

### WS-1: Product / PM Alignment

- **目標**：確保 PRD 模糊處在開發前拍板
- **內容**：確認 Spec 五項待確認事項、Q&A 排序規則、CSV 欄位格式、活動結束後行為
- **依賴**：無
- **時程**：Week 1 內完成

### WS-2: Design / UI Finalization

- **目標**：確認核心頁面 UI 方向，避免開發中途大改
- **內容**：法法首頁、Q&A 頁、努努後台（含 7 個 tab）、AI Widget、login 頁面的 wireframe 或 mockup
- **依賴**：WS-1 拍板結果
- **時程**：Week 1–2 產出主要頁面方向，Week 3–4 隨開發微調

### WS-3: Frontend Architecture

- **目標**：搭建 Next.js 16 App Router 專案骨架，確立 server/client 邊界
- **內容**：專案結構、route groups、layout、loading/error/not-found、Tailwind 設定、TypeScript 設定、import alias
- **依賴**：GitHub repo 建立
- **時程**：Week 1

### WS-4: Route & Navigation

- **目標**：完成所有路由定義、導頁邏輯、route protection
- **內容**：`/`、`/login`、`/home`、`/qa`、`/staff/login`、`/staff/select`、`/staff`、`/api/ai/ask`、proxy.ts
- **依賴**：WS-3、WS-5（session）
- **時程**：Week 2 完成 route 骨架 + protection，Week 3–4 逐步填入頁面內容

### WS-5: Auth / Session / Guard

- **目標**：完成法法 + 努努兩套 demo auth flow
- **內容**：participant login（3 碼 + email）、staff login（共用密碼）、staff identity select、session cookie encode/decode/verify、cookie 規格（HttpOnly / SameSite / Secure / Expires）、route protection（page + DAL + action 層）
- **依賴**：WS-3、Supabase schema
- **時程**：Week 2

### WS-6: Data / State / Supabase

- **目標**：建立 Supabase schema、DAL、Server Actions、DTO
- **內容**：9 張 table（participants, staff_members, agenda_items, staff_agenda_assignments, activity_state, knowledge_base_documents, questions, answers, attendance_logs, lunch_logs）+ ai_logs（可選）、DAL 層、Server Actions、domain types / DTO
- **依賴**：Supabase project 建立
- **時程**：Week 1 schema + migration，Week 2–7 逐步補齊各功能的 DAL / Action

### WS-7: Core Page Implementation

- **目標**：完成所有頁面與核心元件
- **內容**：
  - 法法端：`ParticipantLoginForm`、`CurrentAgendaCard`、`AgendaTimelineAccordion`、`LunchStatusCard`、`QAFilterBar`、`QuestionList`、`QuestionDetailModal`、`FormalQuestionComposer`、`AIWidget`
  - 努努端：`StaffLoginForm`、`StaffIdentitySelector`、`StaffDashboardStatGrid`、`CurrentAgendaSwitcher`、`StaffAgendaPanel`、`QAManagementPanel`、`CheckInPanel`、`LunchManagementPanel`、`MarkdownEditorPanel`、`CsvImportPanel`
- **依賴**：WS-5（auth）、WS-6（data）
- **時程**：Week 3–7

### WS-8: AI Integration

- **目標**：完成 AI 助手端到端流程
- **內容**：`/api/ai/ask` Route Handler、prompt shaping、knowledge retrieval、related questions、uncertain handoff、failure fallback
- **依賴**：Q&A 資料、Agenda 資料、知識庫資料
- **時程**：Week 6

### WS-9: QA / Test Readiness

- **目標**：建立 unit / integration / e2e 測試，確保核心流程正確
- **內容**：Vitest + Testing Library（unit/integration）、Playwright（e2e）、Manual QA checklist
- **依賴**：功能基本完成
- **時程**：Week 8–9（unit/integration 可從 Week 4 開始逐步加入）

### WS-10: GitHub / Vercel / CI/CD

- **目標**：建立從 commit 到 deploy 的完整流程
- **內容**：GitHub repo、Vercel project、preview/production 分離、env vars 分離、CI workflow（typecheck + lint + test + build）
- **依賴**：無（Week 1 即可開始）
- **時程**：Week 1 基礎建立，Week 9 CI 強化

### WS-11: Demo Hardening

- **目標**：確保最終 demo 順暢、可交付
- **內容**：seed data 準備、demo script、edge case 修補、mobile 實機驗證、backup plan 文件
- **依賴**：所有功能完成
- **時程**：Week 10

---

## 5. 十週總覽

| 週次     | 主題                                | 核心里程碑                                                |
| -------- | ----------------------------------- | --------------------------------------------------------- |
| Week 1   | 地基搭建                            | Repo + Vercel + Supabase + 專案骨架就位                   |
| Week 2   | 認證與資料匯入                      | 法法/努努登入可用、CSV 匯入可用、route protection 就位    |
| Week 3   | Agenda 顯示與切換                   | 法法首頁可看 current agenda、努努可切換階段                |
| Week 4   | Q&A 核心功能                        | 法法可發問/瀏覽、努努可回覆、問題狀態可流轉               |
| Week 5   | 報到 / 午餐 / Dashboard + Demo #1  | 營運三件套完成、第一次可 demo 主流程                      |
| Week 6   | AI 助手                             | AI 問答可用、fallback 就位、handoff 到正式提問             |
| Week 7   | 內容管理                            | Markdown 編輯器（Agenda + KB）可用、AI 使用最新 KB 內容   |
| Week 8   | 韌性 / RWD / 錯誤處理              | 所有錯誤文案對齊 Spec、mobile RWD 到位、stale/timeout 就位 |
| Week 9   | 測試 / CI 強化                      | Unit + Integration + E2E 通過、CI pipeline 完整            |
| Week 10  | Demo 硬化與交付                     | Production 部署、demo script 就緒、可交付                  |

---

## 6. Detailed Weekly Plan

---

### Week 1：地基搭建

#### 本週目標

所有開發基礎設施就位。任何 developer 在 Week 1 結束後可以 `git clone` → `npm install` → `npm run dev` → 看到可運作的 Next.js app，連到 Supabase dev instance，且 push 到 GitHub 後 Vercel 自動部署 preview。

#### 本週核心產出

- GitHub repo 已建立且可 push
- Next.js 16 App Router 專案跑得起來
- Vercel project 已連結 GitHub，preview deployment 可運作
- Supabase project 已建立，schema migration 已套用
- 專案結構符合 Spec 定義
- 基本 CI（typecheck + lint）通過
- 技術 spike 結果記錄

#### 主要工作項目與任務拆解

| #   | 任務                                                  | 目的                                          | 依賴     | 可並行 |
| --- | ----------------------------------------------------- | --------------------------------------------- | -------- | ------ |
| 1.1 | 建立 GitHub repo（單一 repo，含 README）              | 版控起點                                      | 無       | 是     |
| 1.2 | `create-next-app` 初始化（TS, Tailwind, App Router, `@/*` alias） | 專案骨架                                      | 1.1      | 否     |
| 1.3 | 建立 `app/` 路由骨架：所有 route 的空 page.tsx + layout.tsx | 確認路由結構正確                              | 1.2      | 否     |
| 1.4 | 建立 `proxy.ts` 骨架（空 function，確認 Next.js 16 啟動正常） | 驗證 proxy.ts 在 v16 的行為                   | 1.2      | 是（與 1.3 並行） |
| 1.5 | 建立 Vercel project，連結 GitHub repo                 | 自動部署基礎                                  | 1.1      | 是     |
| 1.6 | 設定 Vercel env vars（dev / preview / production 分離） | 環境變數管理                                  | 1.5      | 否     |
| 1.7 | 建立 Supabase project（dev instance）                 | 資料層基礎                                    | 無       | 是     |
| 1.8 | 撰寫並執行 Supabase schema migration（9 張 table + constraints） | 資料模型落地                                  | 1.7      | 否     |
| 1.9 | 建立 `lib/` 目錄結構（auth / dal / actions / ai / csv / validations / constants / utils） | 程式碼組織                                    | 1.2      | 是     |
| 1.10 | 建立 `types/` 目錄（domain.ts / dto.ts / db.ts）      | 型別定義起點                                  | 1.2      | 是     |
| 1.11 | 建立 `components/` 目錄結構（participant / qa / staff / shared） | 元件組織                                      | 1.2      | 是     |
| 1.12 | 建立 `app/not-found.tsx` + `app/global-error.tsx`     | App Router error boundary                     | 1.2      | 是     |
| 1.13 | 設定 ESLint + Prettier                               | 程式碼品質                                    | 1.2      | 是     |
| 1.14 | 建立 GitHub Actions CI（typecheck + lint + build）    | 最小 CI                                       | 1.1, 1.2 | 否     |
| 1.15 | 技術 spike：session cookie sign/verify 方案驗證       | 確認 jose / iron-session / 自建方案可行       | 1.2      | 是     |
| 1.16 | 技術 spike：Supabase server-side client 在 Next.js 16 Route Handler / Server Action 中的使用方式 | 確認連線方式                                  | 1.7, 1.2 | 是     |
| 1.17 | PM 拍板：Spec 五項待確認事項                          | 消除規格模糊                                  | 無       | 是     |

#### 本週交付物

- [ ] GitHub repo 可 clone + dev server 可啟動
- [ ] 所有路由空殼頁面存在（`/`、`/login`、`/home`、`/qa`、`/staff/login`、`/staff/select`、`/staff`）
- [ ] Vercel preview deployment 成功
- [ ] Supabase schema 已套用（可用 Supabase Studio 確認）
- [ ] CI pipeline 綠燈（typecheck + lint + build）
- [ ] 技術 spike 結論記錄

#### 本週驗收方式

1. `git clone` → `npm install` → `npm run dev` → 瀏覽器可看到首頁
2. Push 到 feature branch → Vercel 自動產生 preview URL
3. Supabase Studio 可看到所有 table
4. GitHub Actions CI 綠燈
5. Spec 五項待確認事項已有書面結論

#### 本週風險與注意事項

- Next.js 16 proxy.ts 行為若與文件不符，需立即調整或降級到前一個穩定做法
- Supabase 免費方案的 rate limit 需確認是否足夠 dev 使用
- PM 若無法在 Week 1 拍板，Week 2 認證實作可能需要 rework

---

### Week 2：認證與資料匯入

#### 本週目標

法法可以用 3 碼編號 + email 登入；努努可以用共用密碼登入並選擇身份；CSV 匯入可用於 seed 開發資料；所有受保護路由有 route protection。

#### 本週核心產出

- 法法登入完整流程（含所有錯誤文案）
- 努努登入 + 身份選擇完整流程
- Session cookie 機制（兩套 cookie：`ff_participant_session`、`ff_staff_session`）
- proxy.ts route protection
- Page-level + DAL-level auth check
- CSV 匯入功能（participants / staff / agenda / assignments）
- Dev seed data

#### 主要工作項目與任務拆解

| #   | 任務                                                        | 目的                              | 依賴              | 可並行 |
| --- | ----------------------------------------------------------- | --------------------------------- | ----------------- | ------ |
| 2.1 | 實作 `lib/auth/session.ts`（encode / decode / verify / cookie 設定） | Session 核心                      | W1 spike 結論     | 否     |
| 2.2 | 實作 `lib/validations/participant-login.ts`                 | 登入欄位驗證                      | 2.1               | 是     |
| 2.3 | 實作 `lib/actions/participant-auth.ts`（Server Action）     | 法法登入 action                   | 2.1, 2.2          | 否     |
| 2.4 | 實作 `/login` 頁面 + `ParticipantLoginForm` client component | 法法登入 UI                       | 2.3               | 否     |
| 2.5 | 實作法法登出 action                                         | 清除 cookie                       | 2.1               | 是     |
| 2.6 | 實作 `lib/actions/staff-auth.ts`（Server Action）           | 努努登入 action                   | 2.1               | 是（與 2.3 並行） |
| 2.7 | 實作 `/staff/login` 頁面 + `StaffLoginForm` client component | 努努登入 UI                       | 2.6               | 否     |
| 2.8 | 實作 `lib/actions/staff-identity.ts`（Server Action）       | 努努身份選擇 action               | 2.1               | 是     |
| 2.9 | 實作 `/staff/select` 頁面 + `StaffIdentitySelector`         | 努努身份選擇 UI                   | 2.8               | 否     |
| 2.10 | 實作 proxy.ts route protection 邏輯                        | 粗粒度 cookie check + redirect    | 2.1               | 是     |
| 2.11 | 實作 `/` redirector 頁面                                    | 入口導向                          | 2.1               | 是     |
| 2.12 | 實作 `lib/dal/auth-check.ts`（page / action 層 session 驗證） | 細粒度授權                        | 2.1               | 是     |
| 2.13 | 實作 `lib/csv/parser.ts` + schema 驗證                      | CSV 解析基礎                      | W1 types          | 是     |
| 2.14 | 實作 `CsvImportPanel` client component                      | CSV 匯入 UI                       | 2.13              | 否     |
| 2.15 | 實作 `lib/actions/csv-import.ts`（Server Action：validate + commit） | CSV 寫入 Supabase                 | 2.13              | 否     |
| 2.16 | 準備 dev seed CSV 檔（participants / staff / agenda / assignments） | 開發測試資料                      | W1 schema         | 是     |
| 2.17 | 實作努努登出 action                                         | 清除 cookie                       | 2.1               | 是     |

#### 本週交付物

- [ ] 法法可用正確編號 + email 登入，看到 `/home`（空殼即可）
- [ ] 法法編號不存在 / email 不符時看到正確錯誤文案 + Gmail 按鈕
- [ ] 努努可用 `0012` 登入，看到姓名選擇頁
- [ ] 努努選擇身份後進入 `/staff`（空殼即可）
- [ ] 未登入直接訪問受保護路由會被 redirect
- [ ] CSV 匯入可成功寫入 Supabase
- [ ] CSV 格式錯誤時顯示 row-level error

#### 本週驗收方式

1. 手動測試法法登入：正確 / 編號不存在 / email 不符 三條路徑
2. 手動測試努努登入：正確 / 密碼錯誤
3. 直接訪問 `/home` 無 session → 被導回 `/login`
4. 直接訪問 `/staff` 無 session → 被導回 `/staff/login`
5. CSV 匯入 → Supabase Studio 確認資料已寫入
6. CSV 故意缺欄位 → 看到 row-level error，不寫入

#### 本週風險與注意事項

- Session cookie sign 方案必須在 Week 1 spike 中確認，否則本週會卡住
- `STAFF_SHARED_PASSWORD` 必須從 env var 讀取，不可 hardcode
- CSV 匯入需處理 duplicate participant_code，拒絕整批寫入
- 法法 participant_code 必須保留前導 0（字串處理，不可轉 number）

---

### Week 3：Agenda 顯示與切換

#### 本週目標

法法打開 `/home` 可以看到「現在正在進行哪個階段」，並可展開查看完整 agenda。努努可以在後台手動切換目前活動階段，切換後法法端在下次 refresh / focus regain / 30 秒自動刷新時看到新階段。

#### 本週核心產出

- 法法 `/home` 完整頁面
- 努努 `/staff` 頁面 shell + tab 結構
- 當前階段顯示 + 自動刷新機制
- 努努切換 current agenda

#### 主要工作項目與任務拆解

| #   | 任務                                                        | 目的                              | 依賴              | 可並行 |
| --- | ----------------------------------------------------------- | --------------------------------- | ----------------- | ------ |
| 3.1 | 實作 `lib/dal/agenda.ts`（讀取 agenda list / current stage） | Agenda 資料讀取                   | W1 schema         | 是     |
| 3.2 | 實作 `lib/dal/lunch.ts`（讀取個人午餐狀態）                 | LunchStatus 資料讀取              | W1 schema         | 是     |
| 3.3 | 實作 `CurrentAgendaCard` server → client component          | 首屏核心：「現在要做什麼」        | 3.1               | 否     |
| 3.4 | 實作 `AgendaTimelineAccordion` client component             | 完整 agenda 展開/收合             | 3.1               | 是（與 3.3 並行） |
| 3.5 | 實作 `LunchStatusCard` component                            | 個人午餐狀態顯示                  | 3.2               | 是     |
| 3.6 | 實作 `CurrentAgendaAutoRefresh` client leaf                 | 30 秒 polling + focus regain      | 3.3               | 否     |
| 3.7 | 組裝 `/home` page.tsx（SSR 初始資料 + client leaves）       | 法法首頁完整頁面                  | 3.3–3.6           | 否     |
| 3.8 | 實作法法端頂部導覽（首頁 / Q&A / 登出）                     | 頁面導覽                          | W2 auth           | 是     |
| 3.9 | 實作 `/staff` page.tsx shell + sticky tab bar               | 努努後台骨架                      | W2 auth           | 是     |
| 3.10 | 實作 `lib/actions/agenda.ts`（Server Action：set current agenda） | 切換目前階段                      | 3.1               | 是     |
| 3.11 | 實作 `CurrentAgendaSwitcher` client component               | 努努切換 UI                       | 3.10              | 否     |
| 3.12 | 實作 `StaffAgendaPanel` component                           | 努努個人化工作 agenda             | 3.1               | 是（與 3.11 並行） |
| 3.13 | 實作 `lib/dal/staff-agenda.ts`（讀取個人 assignment）        | Staff assignment 資料讀取         | W1 schema         | 是     |

#### 本週交付物

- [ ] 法法 `/home` 首屏顯示 current agenda（時間 / 階段名稱 / 任務 / 說明 / 注意事項）
- [ ] 法法可展開其他 agenda 階段
- [ ] 法法可看到午餐狀態（此時為 `未領取`）
- [ ] 30 秒自動刷新 + focus regain refresh 可運作
- [ ] 努努 `/staff` 有 tab 切換結構（dashboard / agenda / qna / attendance / lunch / content / import）
- [ ] 努努可切換 current agenda，法法端可在刷新後看到新階段
- [ ] 努努可看到個人化工作 agenda（含負責任務 / 位置 / 突發注意）

#### 本週驗收方式

1. 法法登入後首頁可看到 current agenda
2. 努努切換 agenda 階段 → 法法手動 refresh → 看到新階段
3. 法法 30 秒後自動看到最新階段（可縮短 interval 測試）
4. 努努切換身份後看到不同的個人 agenda
5. 手機瀏覽器基本可用（不需完美 RWD，但可讀可操作）

#### 本週風險與注意事項

- `activity_state` table 必須有 seed data（初始 current agenda item）
- 若 staff_agenda_assignments 為空，`StaffAgendaPanel` 需 fallback 顯示
- 30 秒 polling 需在頁面不可見時暫停，避免浪費請求

---

### Week 4：Q&A 核心功能

#### 本週目標

法法可以瀏覽公開問題、搜尋問題、發問；努努可以看到所有問題、篩選待回答、回覆問題。問題狀態可從 pending → answered 流轉。

#### 本週核心產出

- 法法 `/qa` 完整頁面
- 努努 Q&A 管理 tab
- 正式提問 + 自動產生 question code
- 回覆 / 補充 / 編輯

#### 主要工作項目與任務拆解

| #   | 任務                                                        | 目的                              | 依賴              | 可並行 |
| --- | ----------------------------------------------------------- | --------------------------------- | ----------------- | ------ |
| 4.1 | 實作 `lib/dal/questions.ts`（讀取 question list / thread）  | Q&A 資料讀取                      | W1 schema         | 是     |
| 4.2 | 實作 `lib/actions/questions.ts`（create question）          | 正式提問 action                   | 4.1               | 否     |
| 4.3 | 實作 question code 產生邏輯（Q001, Q002...）                | 唯一問題編號                      | 4.1               | 是     |
| 4.4 | 實作 `QuestionList` client component                        | 問題清單 UI                       | 4.1               | 是     |
| 4.5 | 實作 `QAFilterBar` client component                         | 搜尋 + 篩選 UI                    | 無                | 是     |
| 4.6 | 實作 `FormalQuestionComposer` client component              | 發問 UI                           | 4.2               | 否     |
| 4.7 | 實作 `QuestionDetailModal` client component                 | 問題詳情滿版 popup                | 4.1               | 是（與 4.4 並行） |
| 4.8 | 組裝 `/qa` page.tsx（SSR + client filter/search）           | 法法 Q&A 頁面                     | 4.4–4.7           | 否     |
| 4.9 | 實作 URL search params 同步（q / scope / status / question） | 篩選狀態可分享                    | 4.8               | 否     |
| 4.10 | 實作 `lib/actions/answers.ts`（create / update answer）     | 回覆 action                       | 4.1               | 是     |
| 4.11 | 實作 question status 自動更新（first answer → status = answered） | 狀態流轉                          | 4.10              | 否     |
| 4.12 | 實作 `QAManagementPanel` client component（努努端）         | 努努 Q&A 管理 UI                  | 4.10              | 否     |
| 4.13 | 整合努努 Q&A tab 到 `/staff` page                           | 努努後台 Q&A 區                   | 4.12, W3 tab 結構 | 否     |

#### 本週交付物

- [ ] 法法可在 `/qa` 看到所有公開問題
- [ ] 法法可搜尋問題（關鍵字 / Q code）
- [ ] 法法可篩選（全部 / 我的問題 / 待回答）
- [ ] 法法可發問，問題立即公開，取得 Q code
- [ ] 法法可點開問題詳情（mobile 滿版 popup）
- [ ] 努努可看到所有問題 + 篩選待回答
- [ ] 努努可回覆問題，回覆顯示回覆者姓名
- [ ] 努努回覆後問題狀態變為 `已回答`
- [ ] URL search params 正確同步

#### 本週驗收方式

1. 法法發問 → 看到新問題出現在列表頂端 → 問題編號正確
2. 努努在 Q&A tab 看到待回答問題 → 回覆 → 狀態變更
3. 法法重新進入 `/qa` → 看到問題已有回覆
4. 搜尋 `Q001` → 正確顯示
5. 篩選「我的問題」→ 只顯示自己的問題
6. 問題詳情 popup → 顯示完整 thread

#### 本週風險與注意事項

- Question code 產生需考慮並行發問的唯一性（建議 DB sequence 或 count + 1 with lock）
- `QuestionDetailModal` 在 mobile 必須是滿版，desktop 是 modal（需注意 RWD 切換）
- URL search params 變更不應觸發不必要的 server round trip（client-side filter）
- 努努端「all」tab 排序：最新發問在前；「pending」tab 排序：FIFO

---

### Week 5：報到 / 午餐 / Dashboard + Demo #1

#### 本週目標

努努可以完成報到、午餐標記、Dashboard 查看。法法 LunchStatusCard 連接真實資料。Week 5 結束時進行第一次 demo，主流程跑通。

#### 本週核心產出

- 報到管理（check-in + undo）
- 午餐管理（mark claimed）
- Dashboard 六項指標
- 法法午餐狀態真實資料
- Demo #1 完成

#### 主要工作項目與任務拆解

| #   | 任務                                                        | 目的                              | 依賴              | 可並行 |
| --- | ----------------------------------------------------------- | --------------------------------- | ----------------- | ------ |
| 5.1 | 實作 `lib/dal/attendance.ts`（check-in / undo / current status） | 報到資料讀寫                      | W1 schema         | 是     |
| 5.2 | 實作 `lib/actions/attendance.ts`（Server Action）           | 報到 action                       | 5.1               | 否     |
| 5.3 | 實作 `CheckInPanel` client component                        | 報到 UI                           | 5.2               | 否     |
| 5.4 | 實作 `lib/dal/lunch.ts` 完整版（mark claimed / current status） | 午餐資料讀寫                      | W1 schema         | 是（與 5.1 並行） |
| 5.5 | 實作 `lib/actions/lunch.ts`（Server Action）                | 午餐 action                       | 5.4               | 否     |
| 5.6 | 實作 `LunchManagementPanel` client component                | 午餐管理 UI                       | 5.5               | 否     |
| 5.7 | 實作 `lib/dal/dashboard.ts`（六項指標派生查詢）             | Dashboard 資料                    | W1 schema         | 是（與 5.1 並行） |
| 5.8 | 實作 `StaffDashboardStatGrid` component                     | Dashboard UI                      | 5.7               | 否     |
| 5.9 | 更新 `LunchStatusCard` 連接真實 lunch status                | 法法午餐狀態真實化                | 5.4               | 是     |
| 5.10 | 整合報到 / 午餐 / Dashboard tab 到 `/staff` page            | 努努後台完整營運區                | 5.3, 5.6, 5.8     | 否     |
| 5.11 | idempotency_key 實作（報到 / 午餐操作）                     | 防重複送出                        | 5.2, 5.5          | 否     |
| 5.12 | Demo #1 準備：seed data / demo script / 快速 bug fix        | 第一次 demo                       | 5.1–5.10          | 否     |

#### 本週交付物

- [ ] 努努可用學員編號報到 / 撤回報到
- [ ] 努努可用學員編號標記午餐已領取
- [ ] 報到結果卡顯示姓名 / email / 飲食別 / 報到狀態
- [ ] 午餐結果卡顯示姓名 / 飲食別 / 午餐狀態
- [ ] Dashboard 顯示六項指標（已報到 / 未報到 / 已領午餐 / 未領午餐 / 問題總數 / 待回答數）
- [ ] 法法 LunchStatusCard 顯示真實午餐狀態
- [ ] 重複報到 / 重複午餐標記有正確提示
- [ ] Demo #1 完成，主流程可跑通

#### 本週驗收方式

1. 努努輸入學員編號 → 報到成功 → Dashboard 已報到 +1
2. 努努對同一學員再報到 → 顯示已報到狀態 + 撤回選項
3. 努努標記午餐 → Dashboard 已領午餐 +1
4. 法法登入 → 看到午餐狀態為「已領取」
5. Demo script 跑通：法法登入 → 看 agenda → 發問 → 努努回覆 → 努努報到 → 努努標記午餐 → Dashboard 數字正確

#### 本週風險與注意事項

- idempotency_key 必須在 client 生成、server 驗證，避免弱網重複送出
- attendance_logs 以最新一筆 log 推導狀態，需確認 query 正確性
- lunch_logs 以 row 存在與否判斷，unique constraint on participant_id
- Dashboard 數字需在操作後即時更新（revalidate）

---

### Week 6：AI 助手

#### 本週目標

法法可以透過右下角 AI Widget 詢問活動相關問題。AI 回答基於 agenda / 活動知識庫 / 既有 Q&A。AI 不確定時引導轉正式提問。AI 失敗時顯示 fallback。

#### 本週核心產出

- `/api/ai/ask` Route Handler
- AI prompt shaping + retrieval context
- `AIWidget` 前端元件
- AI → 正式提問 handoff 流程

#### 主要工作項目與任務拆解

| #   | 任務                                                        | 目的                              | 依賴              | 可並行 |
| --- | ----------------------------------------------------------- | --------------------------------- | ----------------- | ------ |
| 6.1 | 技術 spike：AI provider API call 驗證（格式 / token / latency） | 確認 AI 可用性                    | 無                | 是     |
| 6.2 | 實作 `lib/ai/retrieval.ts`（收集 agenda / KB / answered Q&A 作為 context） | AI 知識來源                       | W3 agenda, W4 Q&A | 否     |
| 6.3 | 實作 `lib/ai/prompt.ts`（prompt shaping + system prompt）   | Prompt 工程                       | 6.2               | 否     |
| 6.4 | 實作 `lib/ai/response-mapper.ts`（answered / uncertain / out_of_scope / error） | 回應分類                          | 6.3               | 否     |
| 6.5 | 實作 `/api/ai/ask/route.ts` Route Handler（POST）           | API endpoint                      | 6.2–6.4           | 否     |
| 6.6 | 實作 `AIWidget` client component（floating button + panel） | AI 前端 UI                        | 6.5               | 否     |
| 6.7 | 實作 related questions 顯示（最多 3 筆）                    | 關聯問題推薦                      | 6.5               | 是（與 6.6 並行） |
| 6.8 | 實作 uncertain → handoff：帶 draftQuestion 到 `FormalQuestionComposer` | AI 轉正式提問                     | 6.6, W4 composer  | 否     |
| 6.9 | 實作 AI failure fallback（`AI 目前正在午休中`）             | 容錯                              | 6.6               | 是     |
| 6.10 | 實作 out_of_scope 回應（非活動問題）                        | 範圍控制                          | 6.4               | 是     |
| 6.11 | 將 AIWidget 掛載到 `/home` 與 `/qa`                         | 入口整合                          | 6.6               | 否     |

#### 本週交付物

- [ ] 法法點擊右下角 AI 按鈕 → 打開 AI widget
- [ ] AI 可回答活動相關問題（基於 agenda / KB / Q&A）
- [ ] AI 找到相似問題時顯示 related questions（最多 3 筆）
- [ ] AI 不確定時明確表達 + 顯示「轉正式提問」按鈕
- [ ] 點擊「轉正式提問」→ 帶入 draft 到 `/qa` composer
- [ ] AI API 失敗時顯示 `AI 目前正在午休中`
- [ ] 非活動問題回覆 `out_of_scope`

#### 本週驗收方式

1. 問「現在要做什麼」→ AI 基於 current agenda 回答
2. 問已有 Q&A 回答的問題 → AI 提供既有答案 + related questions
3. 問不確定的問題 → AI 顯示 uncertain + handoff button
4. 問「今天天氣如何」→ AI 回覆 out_of_scope
5. 模擬 AI API timeout → 前端顯示「AI 目前正在午休中」
6. 點 handoff → 跳到 `/qa` 且 composer 預填 draft

#### 本週風險與注意事項

- AI provider API key 必須設在 server env，不可洩漏到 client
- AI call 只做 server-side（Route Handler），不在 client 直接呼叫
- Prompt 長度需控制，避免 token 爆掉（agenda + KB + Q&A context 需 truncate）
- AI 回答品質高度依賴知識庫與 Q&A 內容品質，本週需有足夠 seed data
- `/api/ai/ask` 需驗證 participant session，不開放匿名呼叫

---

### Week 7：內容管理（Markdown 編輯器）

#### 本週目標

努努可以在後台直接編輯 agenda 內容與活動知識庫（Markdown），保存後 AI 問答使用最新內容。

#### 本週核心產出

- `MarkdownEditorPanel`（共用元件，兩種 mode：agenda / knowledge）
- Markdown renderer + sanitizer
- KB CRUD
- Dirty state / unsaved changes confirm

#### 主要工作項目與任務拆解

| #   | 任務                                                        | 目的                              | 依賴              | 可並行 |
| --- | ----------------------------------------------------------- | --------------------------------- | ----------------- | ------ |
| 7.1 | 選定 Markdown editor library（或決定 textarea fallback）     | 技術決策                          | W6 spike          | 否     |
| 7.2 | 實作 `lib/dal/knowledge.ts`（讀取 / 更新 KB）               | KB 資料讀寫                       | W1 schema         | 是     |
| 7.3 | 實作 `lib/actions/knowledge.ts`（Server Action：save KB）   | KB 保存 action                    | 7.2               | 否     |
| 7.4 | 實作 `lib/actions/agenda-content.ts`（Server Action：save agenda item description/notice） | Agenda 內容保存                   | W3 dal            | 是（與 7.3 並行） |
| 7.5 | 實作 `MarkdownEditorPanel` client component                 | 編輯器 UI                         | 7.1               | 否     |
| 7.6 | 實作 Markdown renderer + sanitizer（不允許 raw HTML 注入）  | 安全顯示                          | 7.1               | 是     |
| 7.7 | 實作 dirty state 偵測 + 離頁確認                            | 防遺失編輯                        | 7.5               | 否     |
| 7.8 | 整合 content tab 到 `/staff`（agenda editor + KB editor）   | 努努後台 content 區               | 7.5               | 否     |
| 7.9 | 驗證 AI retrieval 使用最新 KB 內容                          | AI + KB 整合                      | 7.3, W6 retrieval | 否     |
| 7.10 | 更新法法端 agenda detail 使用 Markdown renderer             | 法法端 agenda Markdown 顯示       | 7.6               | 是     |

#### 本週交付物

- [ ] 努努可在 content tab 編輯 agenda 內容（Markdown）
- [ ] 努努可在 content tab 編輯活動知識庫（Markdown）
- [ ] 保存成功顯示「已儲存」+ 最後儲存者與時間
- [ ] 保存失敗不清空編輯內容
- [ ] 切 tab / 切身份 / 離頁時 dirty state 有離開確認
- [ ] AI 問答使用最新 KB 內容
- [ ] 法法端 agenda detail 顯示 Markdown 渲染結果

#### 本週驗收方式

1. 努努編輯 KB → 保存 → AI 問相關問題 → 回答基於新內容
2. 努努編輯 agenda → 保存 → 法法看到新內容
3. 努努編輯中切 tab → 彈出離開確認
4. 模擬保存失敗 → 編輯器內容不被清空
5. Markdown 中插入 `<script>` → renderer 不執行（sanitize 有效）

#### 本週風險與注意事項

- Markdown editor library 若在 mobile 體驗不佳，可降級為 textarea + preview 模式
- Markdown sanitize 是安全需求，不可省略
- Last-write-wins 意味著兩位努努同時編輯會覆蓋，顯示最後儲存者作為提醒即可

---

### Week 8：韌性 / RWD / 錯誤處理

#### 本週目標

所有錯誤文案對齊 Spec、所有 mutation 有 idempotency 保護、mobile-first RWD 到位、timeout / stale / retry 行為完整、基本 accessibility 達標。

#### 本週核心產出

- 全部錯誤文案對齊
- Timeout / stale banner
- RWD 調校
- Accessibility 基本合規

#### 主要工作項目與任務拆解

| #   | 任務                                                        | 目的                              | 依賴              | 可並行 |
| --- | ----------------------------------------------------------- | --------------------------------- | ----------------- | ------ |
| 8.1 | 逐一比對 Spec 錯誤文案清單，確認每個 UI 位置文案完全一致    | 文案正確性                        | W2–W7 功能        | 是     |
| 8.2 | 實作所有表單 submit pending disabled                        | 防重複點擊                        | W2–W7 功能        | 是     |
| 8.3 | 實作 10 秒 mutation timeout UI（顯示「連線較慢」+ 重試按鈕） | Timeout 體驗                      | W2–W7 功能        | 是     |
| 8.4 | 實作 stale data banner（`資料可能不是最新，請重新整理`）     | 資料過時提示                      | W3 polling        | 是     |
| 8.5 | 補齊所有 idempotency_key（正式提問 / answer create/update / markdown save） | 防重複寫入                        | W4–W7 功能        | 是     |
| 8.6 | Mobile-first RWD 調校：所有頁面最低 360px 可用              | Mobile 體驗                       | W2–W7 UI          | 是     |
| 8.7 | QuestionDetailModal：mobile 滿版 / desktop modal            | Modal RWD                         | 8.6               | 否     |
| 8.8 | AIWidget：mobile bottom sheet / desktop floating panel      | AI Widget RWD                     | 8.6               | 是     |
| 8.9 | 所有 input 最小字級 16px（避免 iOS zoom）                   | iOS 體驗                          | 8.6               | 是     |
| 8.10 | 所有可點擊元素最小 hit area 44x44                           | 點擊體驗                          | 8.6               | 是     |
| 8.11 | WCAG AA 對比度檢查                                          | Accessibility                     | 8.6               | 是     |
| 8.12 | 表單錯誤 `aria-describedby` + 焦點移到第一個錯誤欄位        | 表單可及性                        | 8.6               | 是     |
| 8.13 | 狀態不只靠顏色（pending/answered / claimed/not_claimed 加 icon + badge） | 色覺友善                          | 8.6               | 是     |
| 8.14 | 每頁唯一 page title + h1                                    | App Router route announcer        | W2–W7 pages       | 是     |
| 8.15 | loading.tsx 提供 skeleton（非空 spinner）                    | 載入體驗                          | W2–W7 pages       | 是     |

#### 本週交付物

- [ ] 所有錯誤文案與 Spec 完全一致
- [ ] 所有表單 submit pending 時按鈕 disabled
- [ ] Mutation 超過 10 秒顯示 timeout UI
- [ ] Stale data banner 在適當時機出現
- [ ] 所有頁面在 360px 寬度可正常使用
- [ ] QuestionDetailModal mobile 滿版
- [ ] AIWidget mobile bottom sheet
- [ ] Input 16px / hit area 44x44 / WCAG AA 對比
- [ ] 表單錯誤有 aria 綁定 + 焦點管理

#### 本週驗收方式

1. Spec 錯誤文案清單逐一比對（checklist）
2. 所有表單快速連點 → 只送出一次
3. 模擬慢網路 → 10 秒後看到 timeout UI
4. Chrome DevTools 360px viewport → 所有頁面可操作
5. Lighthouse accessibility audit 基本通過

#### 本週風險與注意事項

- 本週為打磨週，可能發現大量小 bug，需有 buffer
- 不在本週加新功能，只修補與對齊
- RWD 問題可能連帶需要調整元件結構，預留足夠時間

---

### Week 9：測試 / CI 強化

#### 本週目標

Unit / Integration / E2E 測試覆蓋核心邏輯與主流程。CI pipeline 完整（typecheck + lint + test + build）。Preview deployment 驗證流程就位。

#### 本週核心產出

- Unit tests（validation / session / status derivation / CSV parsing）
- Integration tests（login / Q&A / check-in / lunch）
- E2E tests（法法主流程 / 努努主流程 / 跨角色同步 / AI fallback）
- CI pipeline 完整化

#### 主要工作項目與任務拆解

| #   | 任務                                                        | 目的                              | 依賴              | 可並行 |
| --- | ----------------------------------------------------------- | --------------------------------- | ----------------- | ------ |
| 9.1 | 設定 Vitest + Testing Library                               | Unit / Integration 測試基礎       | W1 專案           | 否     |
| 9.2 | Unit tests：participant_code 驗證                            | 驗證 3 碼字串邏輯                 | W2 validations    | 是     |
| 9.3 | Unit tests：email normalization + exact match               | 驗證 email 邏輯                   | W2 validations    | 是     |
| 9.4 | Unit tests：session encode / decode / expiry check          | 驗證 session 邏輯                 | W2 auth           | 是     |
| 9.5 | Unit tests：question code formatter                         | 驗證 Q001 格式                    | W4 questions      | 是     |
| 9.6 | Unit tests：question status transition                      | 驗證 pending → answered           | W4 questions      | 是     |
| 9.7 | Unit tests：attendance / lunch status derivation            | 驗證狀態推導                      | W5 dal            | 是     |
| 9.8 | Unit tests：dashboard count derivation                      | 驗證指標計算                      | W5 dal            | 是     |
| 9.9 | Unit tests：CSV row validation                              | 驗證 CSV 解析                     | W2 csv            | 是     |
| 9.10 | Unit tests：AI response mapper                              | 驗證 AI 回應分類                  | W6 ai             | 是     |
| 9.11 | Unit tests：markdown sanitize                               | 驗證 XSS 防護                     | W7 markdown       | 是     |
| 9.12 | Integration tests：participant login action + DB + cookie   | 驗證登入完整流程                  | W2                | 是     |
| 9.13 | Integration tests：staff login + identity selection          | 驗證努努登入流程                  | W2                | 是     |
| 9.14 | Integration tests：question create + code gen + status      | 驗證 Q&A 寫入流程                 | W4                | 是     |
| 9.15 | Integration tests：answer create + status update            | 驗證回覆流程                      | W4                | 是     |
| 9.16 | Integration tests：check-in / undo + dashboard counts       | 驗證報到流程                      | W5                | 是     |
| 9.17 | Integration tests：lunch mark + participant status           | 驗證午餐流程                      | W5                | 是     |
| 9.18 | 設定 Playwright                                             | E2E 測試基礎                      | W1 專案           | 是     |
| 9.19 | E2E：法法主流程（login → home → qa → AI → 正式提問）       | 端到端驗證                        | 全功能            | 否     |
| 9.20 | E2E：努努主流程（login → select → staff → 切 agenda → 回答 → check-in → lunch → dashboard） | 端到端驗證                        | 全功能            | 否     |
| 9.21 | E2E：跨角色同步（努努切 stage → 法法 refresh 看新 stage）   | 跨角色驗證                        | 全功能            | 是     |
| 9.22 | E2E：AI fallback（mock provider failure → 顯示午休文案）    | AI 容錯驗證                       | W6                | 是     |
| 9.23 | 更新 CI：加入 unit + integration test 到 GitHub Actions     | CI 完整化                         | 9.1–9.17          | 否     |
| 9.24 | 環境分離驗證：dev / preview / production env vars 正確      | 部署正確性                        | W1 Vercel         | 是     |

#### 本週交付物

- [ ] 所有 unit tests 通過
- [ ] 所有 integration tests 通過
- [ ] E2E 四條主流程通過
- [ ] CI pipeline 包含 typecheck + lint + unit/integration tests + build
- [ ] Preview deployment 上可跑通主流程

#### 本週驗收方式

1. `npm run test` 全部綠燈
2. `npx playwright test` 四條 E2E 通過
3. Push PR → CI 自動執行 → 全部通過
4. Preview URL 上手動跑一次主流程

#### 本週風險與注意事項

- E2E 測試需要 seed data 與可預測的環境，需提前準備 test fixtures
- Integration tests 可能需要 test Supabase instance（避免污染 dev data）
- 測試中發現的 bug 需在本週修復，不可推遲到 Week 10

---

### Week 10：Demo 硬化與交付

#### 本週目標

Production 部署完成。Demo script 準備就緒。所有 edge case 修補。Mobile 實機驗證。可交付狀態。

**本週不寫新功能。**

#### 本週核心產出

- Production deployment
- Production seed data
- Demo script
- Backup plan 文件
- 最終 stakeholder demo

#### 主要工作項目與任務拆解

| #    | 任務                                                        | 目的                              | 依賴              | 可並行 |
| ---- | ----------------------------------------------------------- | --------------------------------- | ----------------- | ------ |
| 10.1 | 準備 production seed data（CSV 正式名單 + agenda + KB）     | 正式資料                          | 正式名單提供      | 否     |
| 10.2 | 設定 production env vars（SESSION_SECRET / STAFF_SHARED_PASSWORD / Supabase prod / AI key） | 正式環境                          | 10.1              | 否     |
| 10.3 | merge 到 `main` → 觸發 production deployment               | 正式部署                          | 10.2              | 否     |
| 10.4 | Production 上跑一次完整 seed（CSV 匯入）                    | 正式資料上線                      | 10.3              | 否     |
| 10.5 | Production 上跑一次法法主流程                                | 驗證正式環境                      | 10.4              | 否     |
| 10.6 | Production 上跑一次努努主流程                                | 驗證正式環境                      | 10.4              | 是（與 10.5 並行） |
| 10.7 | Mobile 實機測試（至少 iOS Safari + Android Chrome）          | 真機驗證                          | 10.3              | 是     |
| 10.8 | 法法首屏 3 秒內辨識 current agenda 驗證                     | KPI 驗證                          | 10.7              | 是     |
| 10.9 | 撰寫 demo script（step-by-step、含截圖位置）                | demo 準備                         | 10.5, 10.6        | 否     |
| 10.10 | 撰寫 backup plan 文件（AI 掛掉 / Supabase 掛掉 / 網路掛掉的人工備案） | 容災準備                          | 無                | 是     |
| 10.11 | Demo branch freeze（禁止未經審查的 merge 到 main）          | 穩定性保護                        | 10.3              | 否     |
| 10.12 | 最終 stakeholder demo                                       | 正式交付                          | 10.9              | 否     |
| 10.13 | Edge case 修補 buffer（預留 2 天）                          | 最後修補                          | 10.5–10.8         | 否     |

#### 本週交付物

- [ ] Production URL 可正常使用
- [ ] Production 上法法 / 努努完整流程跑通
- [ ] Mobile 實機（iOS + Android）跑通
- [ ] 法法首屏 ≤ 3 秒
- [ ] Demo script 文件完成
- [ ] Backup plan 文件完成
- [ ] Demo branch freeze 啟動
- [ ] Stakeholder demo 完成

#### 本週驗收方式

1. Production URL 上完整 demo script 跑通
2. 至少兩台真實手機跑通法法主流程
3. Lighthouse Performance audit 首頁 ≥ 80
4. Backup plan 有書面文件
5. Stakeholder 簽收

#### 本週風險與注意事項

- 正式名單 CSV 必須提前準備好，不可在 Week 10 才開始整理
- Production Supabase 應為獨立 instance，不與 dev/preview 共用
- Demo branch freeze 後只允許 hotfix merge
- 若 AI provider 有 rate limit，需確認 production quota 足夠

---

## 7. 關鍵技術決策點

| #  | 決策內容                                      | 最晚拍板 | 若不拍板的後果                                   | 建議保守方案                                      |
| -- | --------------------------------------------- | -------- | ------------------------------------------------ | ------------------------------------------------- |
| D1 | Session cookie sign 方案（jose / iron-session / 自建） | Week 1   | Week 2 認證實作無法開始                          | `jose` JWS（成熟、輕量、Next.js 官方示例常用）    |
| D2 | `staff_agenda_assignments.csv` 最終欄位格式    | Week 1   | CSV 匯入與 staff agenda 功能無法驗收             | 按 Spec 定義：agenda_sort_order / staff_name / duty_label / location / incident_note |
| D3 | Markdown editor library（或 textarea fallback） | Week 6   | Week 7 編輯器實作需 rework                       | 先用 textarea + preview（最穩定），後續可升級      |
| D4 | Markdown renderer + sanitize library           | Week 6   | Markdown 顯示有 XSS 風險                        | `react-markdown` + `rehype-sanitize`               |
| D5 | CSV parser library                             | Week 1   | CSV 匯入功能延遲                                 | `papaparse`（成熟、瀏覽器 + Node 皆可用）          |
| D6 | AI provider（ChatGPT API / Claude API）        | Week 5   | Week 6 AI 整合無法開始                           | 依 PRD 指定 ChatGPT API；需確認 API key + model    |
| D7 | AI prompt contract（system prompt 結構）       | Week 6   | AI 回答品質不穩定                                | 固定 system prompt template + retrieval context 注入 |
| D8 | idempotency_key 生成方式                       | Week 4   | 重複送出問題在 Week 5 營運功能中浮現              | Client-side UUID v4 + server unique constraint      |
| D9 | Participant current agenda refresh cadence      | Week 3   | 體驗不確定                                       | 30 秒（Spec 建議值），可依效能調整                  |
| D10 | 活動結束後是否關閉登入                          | Week 1   | Session 過期行為不確定                            | 活動結束即關閉（Spec 保守假設）                     |

---

## 8. GitHub / Vercel / CI/CD 里程碑

| 週次    | 里程碑                                                            |
| ------- | ----------------------------------------------------------------- |
| Week 1  | 建立 GitHub repo                                                  |
| Week 1  | 建立 Vercel project，連結 GitHub repo                             |
| Week 1  | 第一次 preview deployment 成功                                    |
| Week 1  | 基本 CI（typecheck + lint + build）建立                           |
| Week 1  | 設定 dev / preview / production env vars（Vercel Dashboard）      |
| Week 2  | Preview deployment 上可看到登入頁                                 |
| Week 3  | Preview deployment 上法法可看到 agenda 首頁                       |
| Week 5  | Preview deployment 上主流程可跑通（Demo #1 使用 preview URL）     |
| Week 9  | CI 加入 unit + integration tests                                  |
| Week 9  | Preview deployment 上 E2E 驗證通過                                |
| Week 10 | Demo branch freeze：`main` 只接受 hotfix merge                   |
| Week 10 | Production deployment：merge 到 `main` 觸發正式部署              |
| Week 10 | Production env vars 全部設定完成                                  |
| Week 10 | Production 上完整主流程驗證通過                                   |

---

## 9. Definition of Done

### 9.1 功能層

- 所有 Spec 定義的法法端功能可用（輕登入、Agenda、Q&A、AI 助手、午餐狀態）
- 所有 Spec 定義的努努端功能可用（登入、身份選擇、7 個 tab 全部可操作）
- 所有 Spec 錯誤文案完全一致
- 所有 Spec 成功文案完全一致

### 9.2 UI 層

- Mobile-first，最低 360px 可用
- Input 16px / hit area 44x44
- WCAG AA 對比度
- 狀態不只靠顏色
- Current agenda 首屏高辨識度

### 9.3 路由與互動層

- 所有 route protection 就位（proxy.ts + page-level + DAL-level）
- Session 過期正確 redirect
- 表單 submit pending disabled
- Mutation timeout UI 就位
- Stale data banner 就位
- URL search params 同步

### 9.4 測試層

- Unit tests 覆蓋所有 Spec 列出的邏輯點
- Integration tests 覆蓋 login / Q&A / check-in / lunch 流程
- E2E 覆蓋法法主流程 / 努努主流程 / 跨角色同步 / AI fallback
- CI 全部通過

### 9.5 部署層

- Vercel production deployment 成功
- Production env vars 全部設定
- Preview / Production 資料隔離
- Production seed data 已匯入

### 9.6 Prototype 限制說明

以下為本版已知限制，非 bug：

- 共用密碼登入安全性有限
- 不做正式帳號系統
- 不做 realtime websocket（30 秒 polling + focus refresh）
- 不做問題審核 / 刪除 / 排序
- 不做 Markdown 版本還原
- 不做多活動平台
- 不做完整離線模式
- Last-write-wins for concurrent edits
- Dashboard / Q&A list 不做 pagination（預估 ≤ 300 題）

---

## 10. Demo Readiness Checklist（第 5 週 Demo 前）

- [ ] 法法可用正確編號 + email 登入
- [ ] 法法登入錯誤文案三條路徑皆正確
- [ ] 法法首頁顯示 current agenda + 完整 agenda
- [ ] 法法 30 秒 / focus regain 自動刷新 current agenda
- [ ] 法法可在 `/qa` 瀏覽、搜尋、篩選問題
- [ ] 法法可正式發問，取得 Q code
- [ ] 法法可查看問題詳情 popup
- [ ] 努努可用共用密碼登入 + 選擇身份
- [ ] 努努可切換 current agenda（法法端可在 refresh 後看到）
- [ ] 努努可回覆問題（狀態變 answered）
- [ ] 努努可報到 / 撤回報到
- [ ] 努努可標記午餐已領取
- [ ] Dashboard 六項指標正確
- [ ] 法法午餐狀態顯示正確
- [ ] 手機瀏覽器基本可用（不需完美 RWD）
- [ ] Preview deployment URL 可正常使用
- [ ] Seed data 已準備（至少 10 名學員 + 3 名努努 + 5 個 agenda）

---

## 11. 風險清單與對策

| #  | 風險類型         | 風險描述                                                      | 影響                                   | 對策                                                                    |
| -- | ---------------- | ------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| R1 | PRD/Spec 模糊    | Spec 五項待確認事項（agenda 權威來源、CSV 格式、Q&A 排序、Markdown 版本、re-import）未拍板 | 多項功能實作方向不確定                 | Week 1 強制 PM 拍板；若無法拍板，採 Spec 保守假設並記錄                 |
| R2 | 技術風險         | Next.js 16 proxy.ts 行為與預期不符                             | Route protection 需改做法              | Week 1 spike 驗證；backup：在 page component 層做所有 auth check        |
| R3 | 技術風險         | Supabase 免費方案 rate limit 不足                               | Dev / testing 受阻                     | 升級 Supabase plan 或使用 local Supabase                                |
| R4 | 技術風險         | AI provider API token limit / rate limit                       | AI 功能不穩定                          | 設定 server-side caching for repeated queries；控制 prompt token 長度    |
| R5 | 設計延遲         | UI mockup 未在 Week 2 前完成                                   | 前端開發需猜測 UI                      | 先用 Spec 元件表實作功能性 UI，設計到位後再調整；不 block 開發           |
| R6 | 資料風險         | 正式名單 CSV 延遲提供或格式錯誤                                 | Week 10 production seed 受阻           | Week 8 前取得名單初稿；CSV parser 需有清楚的 row-level error report      |
| R7 | Mock data 風險   | AI 回答品質依賴知識庫與 Q&A 內容品質                            | Demo 時 AI 回答不佳                    | 準備充足的 KB 內容與預設 Q&A seed；demo 前 dry run AI 問答               |
| R8 | 認知風險         | Demo auth 被誤當正式方案                                        | 上線後安全問題                         | 在 Spec / README / 程式碼註解中明確標示「demo auth」；交付文件列出未來替換路徑 |
| R9 | 時程風險         | 前 5 週功能開發超時                                             | 後 5 週 AI / 測試 / demo 被壓縮       | Week 5 Demo checkpoint 為硬性里程碑；若 Week 4 嚴重落後需立即調整 scope  |
| R10 | 時程風險         | 測試中發現大量 bug                                              | Week 10 demo 品質不足                  | Week 4 起逐步加 unit test（不等到 Week 9）；Week 8 預留 bug fix buffer   |
| R11 | 環境風險         | Preview / Production 共用 Supabase 導致資料污染                  | 正式活動資料被測試覆蓋                 | Preview 與 Production 使用不同 Supabase project / schema                 |
| R12 | 弱網風險         | 戶外場地網路不穩定                                              | 使用者體驗下降                         | 預載靜態內容；mutation fallback 清楚；backup plan 文件（人工備案流程）     |

---

## 12. 執行紀律

### 12.1 後續每週寫 code 時要怎麼遵守這份計畫

1. **每週開始前**：對照本計畫確認本週目標與任務清單
2. **每日結束前**：檢查進度是否符合本週預期
3. **每週結束時**：用本週交付物 checklist 逐項驗收
4. **所有新功能**：必須對應到 Spec 定義的元件 / 路由 / 行為，不可自行發明需求
5. **不做 Spec 明確不做的事**：參考 Spec「不做事項」與「build 階段不能自行超做」清單
6. **錯誤文案**：必須 copy-paste Spec 定義的文案，不可自行改寫
7. **每週至少一次 preview deployment 驗證**：確保 deploy 不會在最後一刻爆掉

### 12.2 什麼情況可偏離

- **技術 spike 結果**顯示原方案不可行 → 可調整技術方案，但需記錄原因
- **PM 拍板結果**與 Spec 保守假設不同 → 依 PM 決定調整，但需更新 Spec
- **提早完成**某週任務 → 可提前開始下一週任務，但不可跳過驗收
- **外部依賴**（設計 / 名單 / AI API）延遲 → 可重排優先序，但需記錄影響

### 12.3 什麼情況不可偏離

- **不可新增 Spec 不存在的功能**（例如偷加問題按讚、推播通知）
- **不可跳過 Week 5 Demo checkpoint**
- **不可在 Week 10 寫新功能**
- **不可共用 Preview / Production Supabase**
- **不可省略 idempotency 保護**
- **不可把全頁面 client 化**
- **不可在 browser 直接寫 Supabase 權威資料**
- **不可省略 Markdown sanitize**

### 12.4 偏離時要如何紀錄

建立 `md_home/deviation_log.md`，每筆偏離紀錄包含：

| 欄位         | 說明                              |
| ------------ | --------------------------------- |
| 日期         | 偏離發生日期                      |
| 週次         | 對應哪一週                        |
| 原計畫       | 原本計畫做什麼                    |
| 實際做法     | 實際做了什麼                      |
| 偏離原因     | 為什麼偏離                        |
| 影響範圍     | 影響哪些後續任務                  |
| 補救措施     | 如何在後續週次補回                |
| 核准         | 誰核准了這個偏離（PM / Tech Lead）|
