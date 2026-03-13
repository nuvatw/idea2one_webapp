
# 文件資訊

* 文件名稱：`Field Flow` 前端／BFF 實作規格（MVP）
* 文件版本：v1.0.0
* 文件狀態：Draft（待關鍵待確認事項拍板後可進入 Build Plan）
* 最後更新日期：2026-03-13
* 文件目的：將 Spot 與 PRD 轉成可直接供前端工程、後端對接、QA、AI coding agent 執行的實作規格
* 來源（Spot / PRD）：

  * Spot：單日戶外 coding 工作坊現場資訊分散、重複問答、營運狀態不透明
  * PRD：戶外工作坊即時活動 Web App
* 參考依據（官方 Next.js / 官方 Vercel，若有）：

  * 本文件技術方向以官方最新 App Router / Version 16 / Authentication / Forms / Route Handlers / Project Structure / Deploying / Vercel Git / Environments / Environment Variables 文件為對齊基準，不採舊式 Pages Router 思維、`middleware.ts` 命名，亦不採 experimental auth interrupts 相關做法。 ([Next.js][1])

# 前言

## Spec 目的

本文件定義 MVP 的：

* 頁面與路由
* 角色與 session 規則
* UI 區塊與互動
* Server / Client 邊界
* 資料模型與狀態流轉
* 錯誤處理與測試掛鉤
* GitHub / Vercel 部署前提

## 文件定位

本文件是實作規格，不是產品願景文件，也不是 PRD 重寫版。
本文件應被視為前端、BFF、Supabase schema、QA、AI coding agent 的共同契約。

## 與 PRD 的關係

* PRD 定義：做什麼、為什麼做、哪些功能是 MVP
* 本文件定義：怎麼切頁、怎麼切 component、怎麼保護路由、資料怎麼落地、錯誤怎麼顯示、測試怎麼掛鉤

## 本文件適用範圍

適用於本次單一活動、單次部署、單一資料集的 MVP 實作，不適用於多活動平台化設計。

# 開發範圍與限制

## 本次實作範圍

本次必做範圍如下：

### 法法端

* 輕登入（3 碼學員編號 + 信箱）
* 首頁顯示目前進行中 agenda
* 完整 agenda 展開檢視
* 公開 Q&A 瀏覽
* Q&A 搜尋（問題編號 / 關鍵字）
* Q&A 篩選（全部 / 我的問題 / 待回答）
* 正式提問
* 問題詳情滿版 popup
* AI 助手
* 個人午餐領取狀態

### 努努端

* 共用密碼登入
* 姓名選擇與身份切換
* 同一後台頁面完成營運操作
* 個人化工作 agenda 顯示
* 手動切換目前 agenda 階段
* Q&A 回覆 / 補充 / 編輯
* 報到 / 撤回報到
* 午餐已領取標記
* Dashboard 六項指標
* Agenda 內容 Markdown 編輯
* 活動知識內容 Markdown 編輯
* CSV 匯入（participants / staff / agenda / staff assignments）

### 系統面

* Supabase 作為活動資料保存
* Session cookie 驗證
* 弱網基本預載與 fallback 提示
* AI failure fallback 文案
* 1 週資料保留需求的資料層前提

## 不在本次範圍

以下不做：

* 多活動平台化
* 正式帳號系統
* 努努權限分級
* 晚餐追蹤
* QR Code 報到
* 推播 / 簡訊
* 地圖導航 / 場地導覽
* 社群互動 / 照片牆
* 問題按讚 / 熱門排序
* 問題審核
* 多語系
* 完整離線模式
* 活動後問卷
* AI 對話紀錄後台查詢頁
* 即時 websocket / realtime subscription 作為 MVP 必要條件
* Markdown 版本還原 / 協作編輯
* Question / Answer 刪除功能

## 風險提醒

* 上線時間緊，主流程可用性高於設計完整度。
* 努努端採共用密碼，安全性有限但屬本版可接受取捨。
* 匯入資料正確性直接影響登入與現場操作。
* AI 回答品質依賴 agenda / 知識庫 / 既有 Q&A 完整度。
* 弱網環境下，寫入操作需以 idempotency 與清楚 fallback 優先，而非追求即時雙向同步。
* 本版不做完整 realtime；跨使用者同步以頁面 refresh、focus regain refresh、局部 polling 為主。

# 技術基準

* **Next.js**：採官方最新穩定做法，以 App Router 與 Version 16 文件為對齊基準；App Router 預設使用 Server Components，不採 Pages Router。Next.js 16 已將舊 `middleware` 命名改為 `proxy`，本規格僅使用 `proxy.ts` 名稱。 ([Next.js][1])
* **App Router**：所有 route/page/layout/route handler 皆在 `app/` 之下；自訂 HTTP 入口使用 Route Handlers，不混用 Pages Router API Routes。 ([Next.js][2])
* **TypeScript**：全專案以 TypeScript 為預設；本版視為強型別專案，domain / DTO / action input schema 皆需型別化。官方安裝文件亦將 TypeScript 納入建議預設。 ([Next.js][3])
* **Tailwind CSS**：採 Tailwind CSS 作為唯一樣式基準；不引入第二套 UI framework。依官方 Next.js CSS / Tailwind 整合方式配置。 ([Next.js][4])
* **GitHub**：單一 repo 管理前端與 BFF；Vercel 與 GitHub 直接整合，自動依 branch / PR 產生部署。 ([Vercel][5])
* **Vercel**：部署目標為 Vercel 的 Node.js server 模式，不採 static export；原因是本案需要 cookies、Server Actions、Route Handlers、動態資料與 AI server-side call。官方部署文件明確指出 Node.js server 支援全部 Next.js 功能，而 static export 為 limited。 ([Next.js][6])
* **Preview / Production 邏輯**：

  * `main` 為 Production Branch
  * 非 production branch push 與 PR 一律產生 Preview Deployment
  * Preview / Production / Development 的 env vars 分開管理
  * Preview env vars 允許 branch-specific override
  * 本版不額外定義 custom staging environment，除非 implementation plan 明確追加 ([Vercel][5])
* **Server-first 原則**：頁面、layout、資料讀取預設 server-first；只有需要 state、event handler、browser API、polling、rich editor 的區塊 client 化。 ([Next.js][7])
* **表單與異動**：登入、正式提問、回覆、切換 agenda、報到、午餐、內容儲存，優先使用 Server Actions；AI 問答採 Route Handler（JSON request/response）。 ([Next.js][8])
* **Session 與 route protection**：

  * Session cookie 只在 server 讀寫
  * 授權檢查做在 page component / DAL / action / route handler
  * `proxy.ts` 若使用，只做 optimistic cookie check 與 redirect，不做 DB query
  * 不採用 experimental `unauthorized()` / `forbidden()` / `authInterrupts` 做法 ([Next.js][9])
* **快取與動態資料**：

  * 本案的 authenticated / operational routes 視為動態資料頁
  * 不假設隱式快取，live operational data 以 request-time 讀取為主
  * mutation 後需 refresh / revalidate 受影響區塊或頁面
  * 若後續對穩定內容（例如 KB 摘要）做顯式 cache，必須在 action 後明確更新相關 tag/path ([Next.js][10])

# 專案結構建議

建議結構如下：

```txt
/
├─ app/
│  ├─ page.tsx
│  ├─ layout.tsx
│  ├─ not-found.tsx
│  ├─ global-error.tsx
│  ├─ (participant-public)/
│  │  └─ login/
│  │     └─ page.tsx
│  ├─ (participant-app)/
│  │  ├─ home/
│  │  │  └─ page.tsx
│  │  ├─ qa/
│  │  │  └─ page.tsx
│  │  ├─ loading.tsx
│  │  └─ _components/
│  ├─ staff/
│  │  ├─ login/
│  │  │  └─ page.tsx
│  │  ├─ select/
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ loading.tsx
│  │  └─ _components/
│  └─ api/
│     └─ ai/
│        └─ ask/
│           └─ route.ts
├─ components/
│  ├─ participant/
│  ├─ qa/
│  ├─ staff/
│  └─ shared/
├─ lib/
│  ├─ auth/
│  ├─ dal/
│  ├─ actions/
│  ├─ ai/
│  ├─ csv/
│  ├─ markdown/
│  ├─ validations/
│  ├─ constants/
│  └─ utils/
├─ types/
│  ├─ domain.ts
│  ├─ dto.ts
│  └─ db.ts
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ proxy.ts
└─ spec.md
```

切分原則如下：

* `app/`：只放 route entry、layout、loading/error file、Route Handlers。這符合 App Router 的檔案系統 routing 與 file conventions。 ([Next.js][11])
* `route groups`：用 `(participant-public)`、`(participant-app)` 做組織，不改 URL。這可在不改 path 的前提下分開 public/login 與 authenticated 區塊。 ([Next.js][12])
* `app/**/_components`、`app/**/_lib`：放 route-local code，避免所有小元件都塞進全域 `components/`。官方 project structure 建議 private folders `_folder` 來存放不可路由化的檔案。 ([Next.js][11])
* `components/`：跨 route 可重用 UI，例如 `QuestionList`、`LunchStatusCard`、`DashboardStatCard`。
* `lib/dal/`：集中資料存取與授權驗證。DAL 是本案的必要切分，因為 participant / staff 都有 server-side session 驗證與授權邏輯。 ([Next.js][13])
* `lib/actions/`：Server Actions 集中定義 mutation 邊界，不讓 page component 直接夾雜過多寫入邏輯。
* `lib/validations/`：所有表單、CSV 欄位、session payload schema 集中。
* `lib/csv/`：解析、欄位檢查、row-level error formatting 集中，避免 import UI 與 parser 綁死。
* `types/`：domain types 與 UI DTO 分開，避免 DB row shape 直接外露到 client component。
* `tests/`：unit / integration / e2e 分層，避免測試類型混雜。
* `proxy.ts`：若使用 request-time 粗粒度保護，只放 cookie-based redirect。不得在此做 Supabase query。 ([Next.js][13])

# 路由與頁面規格

## `/`

* **路由**：`/`
* **頁面目的**：進站 redirector，不承載正式 UI
* **使用者**：所有人
* **When**：使用者直接打開活動主網址
* **What**：

  * 若有有效法法 session，導向 `/home`
  * 若無有效法法 session，導向 `/login`
* **How**：

  * server page
  * 只讀 participant session cookie
  * 不讀 staff session
* **Where**：活動對外公開網址入口
* **頁面區塊**：無；此 route 不應長時間停留
* **導頁規則**：

  * participant session valid → `/home`
  * participant session missing / expired / tampered → `/login`
* **未授權 / 過期 / 錯誤時怎麼處理**：

  * 不顯示 401/403 頁
  * 直接清 cookie（若可判斷為 invalid）並導 `/login`

## `/login`

* **路由**：`/login`
* **頁面目的**：法法登入入口
* **使用者**：法法
* **When**：

  * 首次進站
  * session 過期
  * 主動登出後
* **What**：

  * 學員編號輸入框（固定 3 碼）
  * 信箱輸入框
  * 送出按鈕
  * 錯誤提示區
  * Gmail 開啟按鈕（僅 email mismatch 時顯示）
* **How**：

  * page 為 server component
  * `ParticipantLoginForm` 為 client component
  * 送出使用 Server Action
  * server 先驗證編號，再驗證 email
* **Where**：由 `/` 導入；參與者對外入口
* **頁面區塊**：

  1. 活動名稱 / 簡短說明
  2. 登入表單
  3. 錯誤提示區
  4. Gmail 按鈕區
  5. 現場協助提示
* **導頁規則**：

  * 成功 → `/home`
  * 已登入 participant session → `/home`
* **未授權 / 過期 / 錯誤時怎麼處理**：

  * 格式錯誤：顯示欄位錯誤，不送 server
  * 編號不存在：顯示 `編號查詢不到`
  * 編號存在但信箱不符：顯示 `信箱不正確，請確認行前信收件信箱或洽現場努努`，並顯示 Gmail 按鈕
  * 系統錯誤：顯示 `系統暫時無法登入，請稍後再試或洽現場努努`
  * 若活動已結束且本版採關閉登入：顯示 `活動已結束，登入已關閉`

## `/home`

* **路由**：`/home`
* **頁面目的**：法法首頁，第一時間回答「現在要做什麼」
* **使用者**：已登入法法
* **When**：登入成功後第一頁
* **What**：

  * 目前進行中的 agenda 完整資訊
  * 完整 agenda 列表
  * 個人午餐狀態
  * 前往 Q&A 快速入口
  * AI 助手浮動入口
* **How**：

  * page 為 server component
  * current agenda / full agenda / lunch status 初始資料 SSR
  * `CurrentAgendaAutoRefresh` client leaf 每 30 秒在可見狀態下 refresh current stage；頁面 regain focus 時也 refresh
  * agenda 展開/收合為 client state
* **Where**：登入成功後進入；participant nav 主頁
* **頁面區塊**：

  1. 頂部導覽（首頁 / Q&A / 登出）
  2. `CurrentAgendaCard`（當前階段）
  3. `LunchStatusCard`
  4. `AgendaTimelineAccordion`
  5. AI 浮動按鈕
* **導頁規則**：

  * 無 session / session invalid → `/login`
  * 點 Q&A → `/qa`
* **未授權 / 過期 / 錯誤時怎麼處理**：

  * session 過期：清 cookie，導 `/login?reason=expired`
  * 無 agenda：顯示 `活動資訊尚未準備完成`
  * current stage 未設定：顯示 `目前階段尚未設定，請以現場公告為準`
  * lunch status 讀取失敗：顯示 `午餐狀態暫時無法取得`
  * stale 提示：顯示 `資料可能不是最新，請重新整理`

## `/qa`

* **路由**：`/qa`
* **頁面目的**：法法 Q&A 中心
* **使用者**：已登入法法
* **When**：法法想查問題、看公開答覆、正式發問、從 AI handoff 轉正式提問時
* **What**：

  * 公開問題清單
  * 搜尋（關鍵字 / 問題編號）
  * 篩選（全部 / 我的問題 / 待回答）
  * 正式提問 composer
  * 問題詳情 popup
  * AI 助手浮動入口
* **How**：

  * page 為 server component，初始載入一次 questions thread summary
  * 問題清單由 client component 做本地 filter / search
  * URL search params 與 UI state 同步：`q`、`scope`、`status`、`question`
  * 正式提問用 Server Action
  * 問題詳情以 modal 呈現；mobile 為滿版，desktop 為 modal
* **Where**：由 `/home` 導入；由 AI uncertain handoff 導入
* **頁面區塊**：

  1. 頂部導覽（首頁 / Q&A / 登出）
  2. `QAFilterBar`
  3. `QuestionList`
  4. `FormalQuestionComposer`
  5. `QuestionDetailModal`
  6. AI 浮動按鈕
* **導頁規則**：

  * 無 session / session invalid → `/login`
  * 發問成功：保留在 `/qa`，更新清單，並自動打開新問題 modal
* **未授權 / 過期 / 錯誤時怎麼處理**：

  * session 過期：清 cookie，導 `/login?reason=expired`
  * 無問題：顯示 `目前還沒有公開問題`
  * 搜尋無結果：顯示 `找不到符合條件的問題`
  * 發問失敗：保留表單內容並顯示錯誤
  * stale 提示：顯示 `資料可能不是最新，請重新整理`

### `/qa` 查詢參數規格

* `q`: string，搜尋字串
* `scope`: `all | mine`
* `status`: `all | pending`
* `question`: `Q001` 形式，存在時自動開 modal

## `/staff/login`

* **路由**：`/staff/login`
* **頁面目的**：努努登入入口
* **使用者**：努努
* **When**：努努進入後台、staff session 過期、主動登出後
* **What**：

  * 共用密碼輸入框
  * 送出按鈕
  * 錯誤提示區
* **How**：

  * page 為 server component
  * `StaffLoginForm` 為 client component
  * Server Action 驗證密碼
  * 密碼來源為 server env，不硬寫在 repo
* **Where**：努努專用後台入口
* **頁面區塊**：

  1. 後台標題
  2. 密碼表單
  3. 錯誤提示
* **導頁規則**：

  * 驗證成功 → `/staff/select`
  * 已有 valid staff session 且已選身份 → `/staff`
  * 已有 valid staff session 但未選身份 → `/staff/select`
* **未授權 / 過期 / 錯誤時怎麼處理**：

  * 密碼錯誤：顯示 `密碼不正確`
  * 系統錯誤：顯示 `後台暫時無法登入，請稍後再試`

## `/staff/select`

* **路由**：`/staff/select`
* **頁面目的**：努努選擇目前身份
* **使用者**：已通過共用密碼驗證的努努
* **When**：

  * staff login 成功後
  * staff 主動切換身份
* **What**：

  * 努努姓名清單
  * 選擇後寫入 session
* **How**：

  * page 為 server component
  * `StaffIdentitySelector` 為 client component
  * 送出用 Server Action
* **Where**：由 `/staff/login` 導入；由後台 top bar 切換身份導入
* **頁面區塊**：

  1. 身份選擇標題
  2. 名單按鈕清單
* **導頁規則**：

  * 無 staff session → `/staff/login`
  * 選定身份成功 → `/staff`
  * 已有有效 staff identity → `/staff`
* **未授權 / 過期 / 錯誤時怎麼處理**：

  * staff list 為空：顯示 `尚未匯入努努名單`
  * 選擇的 staff 不存在：顯示 `找不到此努努身份，請重新整理`

## `/staff`

* **路由**：`/staff`
* **頁面目的**：努努後台唯一主操作面
* **使用者**：已登入且已選擇身份的努努
* **When**：日常現場操作
* **What**：

  * Dashboard 六項指標
  * 個人化工作 agenda
  * 目前階段切換
  * Q&A 管理
  * 報到操作
  * 午餐操作
  * Agenda Markdown 編輯
  * Knowledge Markdown 編輯
  * CSV 匯入
* **How**：

  * page 為 server component，初始資料 SSR
  * tabs / filters / editors / quick action forms 為 client components
  * mutation 一律經 Server Actions
  * `tab` query param 控制當前可見區塊
* **Where**：努努唯一後台頁
* **頁面區塊**：

  1. Top bar（當前努努身份、切換身份、登出、最後同步時間）
  2. Sticky tab bar：`dashboard | agenda | qna | attendance | lunch | content | import`
  3. `DashboardStatGrid`
  4. `CurrentAgendaSwitcher`
  5. `StaffAgendaPanel`
  6. `QAManagementPanel`
  7. `CheckInPanel`
  8. `LunchManagementPanel`
  9. `AgendaEditorPanel`
  10. `KnowledgeBaseEditorPanel`
  11. `CsvImportPanel`
* **導頁規則**：

  * 無 staff session → `/staff/login`
  * 有 staff session 但無 selected identity → `/staff/select`
* **未授權 / 過期 / 錯誤時怎麼處理**：

  * session 過期：清 cookie，導 `/staff/login?reason=expired`
  * staff identity 不存在：清 selected identity，導 `/staff/select`
  * dashboard 讀取失敗：該區塊顯示錯誤卡，不阻塞其他 tab
  * content save 失敗：保留草稿與 dirty state，不清空
  * import 失敗：顯示 row-level validation errors，不部分寫入

### `/staff` 查詢參數規格

* `tab`: `dashboard | agenda | qna | attendance | lunch | content | import`
* `question`: 問題代碼；若存在則直接打開該問題 thread 面板

## `/api/ai/ask`

* **路由**：`/api/ai/ask`
* **頁面目的**：AI 助手 internal JSON endpoint
* **使用者**：法法前端 widget
* **When**：AI widget 提交活動相關問題時
* **What**：

  * 讀 participant session
  * 以 current agenda / full agenda / knowledge base / 已回答 Q&A 做回答
  * 傳回 related questions 與 uncertain handoff draft
* **How**：

  * Route Handler `POST`
  * server-only call AI provider
  * 不開放匿名呼叫
* **Where**：由 `/home`、`/qa` 右下角 AI widget 觸發
* **導頁規則**：無
* **未授權 / 過期 / 錯誤時怎麼處理**：

  * 無 participant session：回 401 JSON
  * AI provider failure / timeout：回 503 JSON，前端固定顯示 `AI 目前正在午休中`
  * 非活動相關問題：回 `out_of_scope`

# Server / Client 邊界

## Server-first 原則

以下頁面或區塊應優先採 server-first：

* `/login` page shell
* `/home` page shell 與初始資料
* `/qa` page shell 與初始 question summary dataset
* `/staff/login`
* `/staff/select`
* `/staff` page shell 與初始 dashboard / agenda / content
* Markdown render（agenda / knowledge 顯示）
* session 驗證與 redirect 判斷
* DAL 層所有 Supabase read/write
* AI provider call
* CSV parse commit 前的 server 驗證

理由：

* App Router 預設即為 Server Components
* server render 可降低 client JS
* operational data 不應依賴瀏覽器持有權威狀態 ([Next.js][7])

## 必須是 Client Component 的區塊

以下互動一定 client 化：

* 所有表單輸入元件
* agenda accordion 展開/收合
* Q&A filter / search UI
* 問題詳情 modal
* AI widget 開關與對話視圖
* staff tab 切換
* Markdown editor
* CSV file picker / drag-drop
* polling / focus refresh leaf
* unsaved changes confirm
* success / error toast

## 只存在前端的狀態

以下狀態只存在前端，不存 DB：

* modal 開關
* accordion open ids
* AI widget 開關
* tab 選中狀態
* 搜尋輸入暫態
* editor dirty state
* submit pending / timeout banner
* optimistic local highlight（例如剛建立的 question 被高亮）

## 不該不必要 client 化的區塊

以下避免整頁 client 化：

* `/home` 整頁
* `/qa` 整頁
* `/staff` 整頁
* 所有 session provider / global app state store 作為主資料來源
* dashboard SSR data block
* participant lunch status
* current stage 初始顯示

## Auth / Session 邊界規則

* auth check 不可只放在 layout；官方 auth guide 明確提醒 layout 因 partial rendering 不會在每次 navigation 重新驗證。授權檢查要靠近 data source、page component、leaf component、Server Action、Route Handler。 ([Next.js][13])
* `proxy.ts` 若使用，只做 cookie-based optimistic redirect；不得在 proxy 做 Supabase query。 ([Next.js][13])
* cookie 透過 `cookies()` 在 Server Components 讀取、在 Server Functions / Route Handlers 讀寫。 ([Next.js][9])

# 畫面區塊與元件規格

## 法法端重要元件

| 元件名稱                      | 用途          | 顯示內容                                  | 輸入 / 輸出                                           | 狀態                                                                   | Props / data contract                                       |
| ------------------------- | ----------- | ------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `ParticipantLoginForm`    | 法法登入        | 編號欄、信箱欄、送出按鈕、錯誤區                      | 輸入：`activityCode`, `email`；輸出：login action result | idle / field error / submitting / success / server error             | `initialCode?: string`, `initialEmail?: string`             |
| `CurrentAgendaCard`       | 首屏顯示當前要做什麼  | 時間、階段名稱、任務、任務說明、注意事項、最後同步時間           | 輸入：`currentAgenda` DTO；輸出：無                       | loading skeleton / ready / no-current-stage / stale / error          | `agendaItem: AgendaItemDTO \| null`, `lastSyncedAt: string` |
| `AgendaTimelineAccordion` | 顯示完整 agenda | 所有 agenda item，當前階段預設展開               | 輸入：agenda array；輸出：前端展開 state                     | ready / empty                                                        | `items: AgendaItemDTO[]`, `currentAgendaId?: string`        |
| `LunchStatusCard`         | 顯示個人午餐狀態    | `已領取` / `未領取` badge                   | 輸入：status；輸出：無                                    | ready / error                                                        | `status: 'claimed' \| 'not_claimed' \| 'unknown'`           |
| `QAFilterBar`             | Q&A 搜尋與篩選   | 搜尋框、scope toggle、status toggle        | 輸入：目前 query state；輸出：URL / local state 更新         | idle / typing                                                        | `q`, `scope`, `status`, `onChange`                          |
| `QuestionList`            | 公開問題列表      | question cards                        | 輸入：question summaries；輸出：open modal               | ready / empty / filtered empty / stale                               | `items: QuestionSummaryDTO[]`, `onOpenQuestion(code)`       |
| `QuestionDetailModal`     | 顯示問題 thread | 問題全文、狀態、回答列表、回覆者、時間                   | 輸入：question thread；輸出：close                       | loading / ready / no-answer / error                                  | `thread: QuestionThreadDTO`, `open: boolean`                |
| `FormalQuestionComposer`  | 正式提問        | textarea、送出按鈕                         | 輸入：`content`；輸出：建立 question                       | idle / validating / submitting / success / failure                   | `prefill?: string`                                          |
| `AIWidget`                | AI 問答入口     | 問答視窗、related questions、handoff button | 輸入：`query`；輸出：ask AI / prefill formal question    | closed / open / asking / answered / uncertain / out_of_scope / error | `onHandoff(draft)`                                          |

### `ParticipantLoginForm` 詳細規則

* 編號欄只接受 3 位數字字串，不可轉 number，不可去掉前導 0。
* email 比對前先 `trim().toLowerCase()`。
* `編號不存在` 與 `信箱不符` 必須是不同錯誤分支。
* Gmail 按鈕只在 `信箱不符` 顯示。
* submit pending 時按鈕 disabled。
* 成功後不可停留在 `/login`。

### `QuestionDetailModal` 詳細規則

* mobile：全螢幕覆蓋
* desktop：居中 modal，max-width 768px
* 無回答時顯示 `尚未收到回覆`
* 需顯示：

  * 問題編號
  * 發問者編號
  * 問題內容
  * 狀態
  * 回覆內容
  * 回覆者姓名
  * 回覆時間
* 若回覆曾被不同努努編輯，可加顯示 `最後編輯：姓名`，但不影響 MVP 驗收核心

### `AIWidget` 詳細規則

* 固定右下角浮動入口
* mobile 以 bottom sheet 呈現；desktop 可為浮動 panel
* 只處理活動相關問題
* 回答來源優先順序：

  1. 已回答 Q&A
  2. 目前 agenda
  3. 活動知識庫
  4. 完整 agenda
* related questions 最多 3 筆
* uncertain 時：

  * 明確顯示不確定
  * 顯示 `轉正式提問`
  * 帶入 `draftQuestion`
* provider failure / timeout 時固定顯示：`AI 目前正在午休中`

## 努努端重要元件

| 元件名稱                     | 用途                | 顯示內容                                                    | 輸入 / 輸出                                                | 狀態                                                                       | Props / data contract                                          |
| ------------------------ | ----------------- | ------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `StaffLoginForm`         | 努努登入              | 共用密碼欄、送出、錯誤區                                            | 輸入：`password`；輸出：login action result                   | idle / submitting / success / error                                      | 無複雜 props                                                      |
| `StaffIdentitySelector`  | 選擇目前身份            | 努努姓名按鈕清單                                                | 輸入：staff list；輸出：select identity                       | ready / empty / submitting / error                                       | `staffs: StaffSummaryDTO[]`                                    |
| `StaffDashboardStatGrid` | 顯示六項指標            | 已報到 / 未報到 / 已領午餐 / 未領午餐 / 問題總數 / 待回答                    | 輸入：stats                                               | ready / partial error                                                    | `stats: DashboardStatsDTO`                                     |
| `CurrentAgendaSwitcher`  | 切換目前階段            | agenda list、當前標示、切換按鈕                                   | 輸入：agenda items；輸出：set current agenda                  | idle / switching / success / failure                                     | `items`, `currentAgendaId`                                     |
| `StaffAgendaPanel`       | 顯示個人化工作 agenda    | 當前階段高亮、負責任務、位置、突發注意                                     | 輸入：staff assignments                                   | ready / no assignment / error                                            | `assignments: StaffAgendaItemDTO[]`                            |
| `QAManagementPanel`      | 努努管理 Q&A          | 全部 / 待回答切換、thread view、回答區                              | 輸入：questions + selected thread；輸出：create/update answer | ready / empty / saving / error                                           | `threads`, `selectedQuestionCode?`                             |
| `CheckInPanel`           | 報到與撤回             | 編號輸入、結果卡、操作按鈕                                           | 輸入：participant code；輸出：check-in / undo                 | idle / lookup / success / duplicate / not found / error                  | 無複雜 props                                                      |
| `LunchManagementPanel`   | 午餐標記              | 編號輸入、飲食別、結果卡                                            | 輸入：participant code；輸出：mark lunch claimed              | idle / lookup / success / duplicate / not found / error                  | 無複雜 props                                                      |
| `MarkdownEditorPanel`    | 編輯 agenda / 知識庫內容 | editor、preview（可選）、save button、last saved meta          | 輸入：markdown text；輸出：save content                       | clean / dirty / saving / saved / error                                   | `mode: 'agenda' \| 'knowledge'`, `value`, `meta`               |
| `CsvImportPanel`         | 匯入 CSV            | file input、validation summary、row errors、confirm import | 輸入：csv file；輸出：import commit                           | idle / parsing / invalid / ready_to_import / importing / success / error | `kind: 'participants' \| 'staff' \| 'agenda' \| 'assignments'` |

### `CheckInPanel` 詳細規則

* 以 3 碼編號作為唯一查找入口。
* submit 後 server lookup：

  * 找不到：顯示 `編號查詢不到`
  * 找到且尚未報到：立即執行報到，顯示成功結果卡
  * 找到且已報到：顯示目前狀態與 `撤回報到` 按鈕
* 結果卡至少顯示：

  * 姓名
  * 信箱
  * 飲食別
  * 報到狀態
* 報到成功文案：`已完成報到`
* 撤回成功文案：`已撤回報到`

### `LunchManagementPanel` 詳細規則

* 以 3 碼編號作為唯一查找入口。
* submit 後 server lookup：

  * 找不到：顯示 `編號查詢不到`
  * 找到且未領：立即標記已領取，顯示成功結果卡與飲食別
  * 找到且已領：顯示 `此學員已領取午餐`
* 結果卡至少顯示：

  * 姓名
  * 飲食別
  * 午餐狀態

### `MarkdownEditorPanel` 詳細規則

* agenda editor 與 knowledge editor 共用行為規格
* 必須支援：

  * 純文字貼上
  * Markdown 原文編輯
  * 保存
* 可不做：

  * 版本還原
  * 同步多人協作
  * rich text WYSIWYG
* save failure 不可清空編輯內容
* 切換 tab / identity / 離頁時，如 dirty，需跳出離開確認

# 資料規格

## data 放置方式

* **權威資料來源**：Supabase
* **前端暫態**：只保留互動 UI state，不保留業務權威資料
* **session**：HttpOnly signed cookie
* **Markdown**：原始 markdown string 存 DB；render 時需 sanitize，不允許 raw HTML 直接注入
* **CSV 原始檔**：MVP 不要求保存原檔；只要求 parse + validation + commit
* **AI log**：若實作，為 server-side log，不提供後台查詢頁

## 檔案位置建議

* `lib/dal/*.ts`：資料讀取 / 寫入 / derived status
* `lib/auth/*.ts`：session encode / decode / verify
* `lib/actions/*.ts`：Server Actions
* `lib/ai/*.ts`：prompt shaping / related question selection / uncertainty mapping
* `lib/csv/*.ts`：CSV schema / parse / row errors
* `lib/validations/*.ts`：form / CSV / query param schema
* `types/domain.ts`：DB domain type
* `types/dto.ts`：server-to-client DTO

## 資料模型

### `participants`

| 欄位                 | 型別            | 必填 | 說明                  |
| ------------------ | ------------- | -: | ------------------- |
| `id`               | uuid          |  是 | PK                  |
| `participant_code` | text(3)       |  是 | 3 碼字串，唯一，不可轉 number |
| `name`             | text          |  是 | 學員姓名                |
| `email`            | text          |  是 | 匯入後 lower-case 儲存   |
| `diet_type`        | enum(`葷`,`素`) |  是 | 飲食別                 |
| `created_at`       | timestamptz   |  是 | 建立時間                |
| `updated_at`       | timestamptz   |  是 | 更新時間                |

約束：

* unique(`participant_code`)
* 不以姓名作為登入或查找依據
* participant login 不等於 check-in

### `staff_members`

| 欄位                      | 型別          | 必填 | 說明          |
| ----------------------- | ----------- | -: | ----------- |
| `id`                    | uuid        |  是 | PK          |
| `name`                  | text        |  是 | 努努姓名，唯一     |
| `default_role`          | text        |  否 | 預設角色 / 任務名稱 |
| `default_location`      | text        |  否 | 預設位置        |
| `default_note_markdown` | text        |  否 | 預設注意事項      |
| `created_at`            | timestamptz |  是 | 建立時間        |
| `updated_at`            | timestamptz |  是 | 更新時間        |

約束：

* unique(`name`)

### `agenda_items`

| 欄位                     | 型別          | 必填 | 說明              |
| ---------------------- | ----------- | -: | --------------- |
| `id`                   | uuid        |  是 | PK              |
| `sort_order`           | int         |  是 | 唯一排序            |
| `time_label`           | text        |  是 | 例：`09:30-10:00` |
| `stage_name`           | text        |  是 | 階段名稱            |
| `task`                 | text        |  是 | 任務摘要            |
| `description_markdown` | text        |  否 | 任務說明            |
| `notice_markdown`      | text        |  否 | 注意事項            |
| `updated_by_staff_id`  | uuid        |  否 | 最後更新者           |
| `created_at`           | timestamptz |  是 | 建立時間            |
| `updated_at`           | timestamptz |  是 | 更新時間            |

約束：

* unique(`sort_order`)

### `staff_agenda_assignments`

| 欄位                       | 型別          | 必填 | 說明                 |
| ------------------------ | ----------- | -: | ------------------ |
| `id`                     | uuid        |  是 | PK                 |
| `agenda_item_id`         | uuid        |  是 | FK → agenda_items  |
| `staff_id`               | uuid        |  是 | FK → staff_members |
| `duty_label`             | text        |  否 | 該階段負責任務            |
| `location`               | text        |  否 | 該階段位置              |
| `incident_note_markdown` | text        |  否 | 該階段突發狀況提醒          |
| `created_at`             | timestamptz |  是 | 建立時間               |
| `updated_at`             | timestamptz |  是 | 更新時間               |

約束：

* unique(`agenda_item_id`, `staff_id`)

### `activity_state`

| 欄位                       | 型別          | 必填 | 說明             |
| ------------------------ | ----------- | -: | -------------- |
| `singleton_key`          | text        |  是 | 固定 `'current'` |
| `current_agenda_item_id` | uuid        |  否 | 目前進行中 agenda   |
| `event_start_at`         | timestamptz |  是 | 活動開始時間         |
| `event_end_at`           | timestamptz |  是 | 活動結束時間         |
| `updated_by_staff_id`    | uuid        |  否 | 最後切換者          |
| `updated_at`             | timestamptz |  是 | 最後更新時間         |

說明：

* current agenda 的來源以此 table 為準
* 不以時間自動推算作為 MVP 權威來源

### `knowledge_base_documents`

| 欄位                    | 型別          | 必填 | 說明                      |
| --------------------- | ----------- | -: | ----------------------- |
| `singleton_key`       | text        |  是 | 固定 `'main'`             |
| `title`               | text        |  是 | 預設 `activity-knowledge` |
| `content_markdown`    | text        |  是 | 活動知識全文                  |
| `updated_by_staff_id` | uuid        |  否 | 最後更新者                   |
| `updated_at`          | timestamptz |  是 | 最後更新時間                  |

### `questions`

| 欄位               | 型別                          | 必填 | 說明                |
| ---------------- | --------------------------- | -: | ----------------- |
| `id`             | uuid                        |  是 | PK                |
| `question_code`  | text                        |  是 | `Q001` 起，唯一       |
| `participant_id` | uuid                        |  是 | FK → participants |
| `content`        | text                        |  是 | 問題內容              |
| `status`         | enum(`pending`,`answered`)  |  是 | 初始 `pending`      |
| `source`         | enum(`manual`,`ai_handoff`) |  是 | 問題來源              |
| `created_at`     | timestamptz                 |  是 | 建立時間              |
| `updated_at`     | timestamptz                 |  是 | 更新時間              |

規則：

* question create 後立即公開
* first answer create 成功後，server 將 `status` 更新為 `answered`
* MVP 不提供 delete / archive

### `answers`

| 欄位                    | 型別          | 必填 | 說明             |
| --------------------- | ----------- | -: | -------------- |
| `id`                  | uuid        |  是 | PK             |
| `question_id`         | uuid        |  是 | FK → questions |
| `body`                | text        |  是 | 回覆內容           |
| `created_by_staff_id` | uuid        |  是 | 初始回覆者          |
| `updated_by_staff_id` | uuid        |  是 | 最後編輯者          |
| `created_at`          | timestamptz |  是 | 建立時間           |
| `updated_at`          | timestamptz |  是 | 最後更新時間         |

規則：

* 一題可多答
* 編輯 answer 為原 answer 更新，不新開 revision table
* 所有人權限相同，可編輯既有 answer
* last-write-wins

### `attendance_logs`

| 欄位                     | 型別                               | 必填 | 說明                |
| ---------------------- | -------------------------------- | -: | ----------------- |
| `id`                   | uuid                             |  是 | PK                |
| `participant_id`       | uuid                             |  是 | FK → participants |
| `action`               | enum(`check_in`,`undo_check_in`) |  是 | 動作                |
| `operated_by_staff_id` | uuid                             |  是 | 努努                |
| `idempotency_key`      | text                             |  是 | 防重複送出             |
| `created_at`           | timestamptz                      |  是 | 時間                |

規則：

* 當前報到狀態以「最新一筆 log」為準

### `lunch_logs`

| 欄位                     | 型別          | 必填 | 說明                |
| ---------------------- | ----------- | -: | ----------------- |
| `id`                   | uuid        |  是 | PK                |
| `participant_id`       | uuid        |  是 | FK → participants |
| `operated_by_staff_id` | uuid        |  是 | 努努                |
| `idempotency_key`      | text        |  是 | 防重複送出             |
| `created_at`           | timestamptz |  是 | 時間                |

約束：

* unique(`participant_id`)
  說明：
* MVP 不做午餐撤回
* 是否已領午餐，以 row 是否存在為準

### `ai_logs`（可選）

| 欄位                       | 型別                                                  | 必填 | 說明   |
| ------------------------ | --------------------------------------------------- | -: | ---- |
| `id`                     | uuid                                                |  是 | PK   |
| `participant_id`         | uuid                                                |  否 | 發問者  |
| `prompt`                 | text                                                |  是 | 問題   |
| `outcome`                | enum(`answered`,`uncertain`,`out_of_scope`,`error`) |  是 | 結果   |
| `related_question_codes` | text[]                                              |  否 | 建議問題 |
| `created_at`             | timestamptz                                         |  是 | 建立時間 |

## 初始資料量

* participants：約 100
* staff_members：約 12
* agenda_items：約 10–20
* staff_agenda_assignments：約 50–150
* knowledge_base_documents：1
* questions：預估 0–300
* answers：預估 0–600

MVP 不做 pagination，預設前端可載入全部 question summary dataset。
若問題數量顯著超過 300，才在下一版改為 server-side search/pagination。

## 狀態變化方式

* participant session：cookie
* staff session：cookie
* current agenda：`activity_state.current_agenda_item_id`
* question status：`pending -> answered`
* attendance current status：latest attendance log
* lunch current status：lunch log exists
* dashboard：server 派生查詢
* UI filter/search/modal/editor dirty：前端 state

## 前端狀態更新說明

以下目前只做前端狀態更新，不寫 DB：

* Q&A 搜尋字串
* Q&A 篩選
* modal 開關
* accordion 展開狀態
* tab 選擇
* unsaved editor dirty state
* AI widget 開關

## DTO 建議

```ts
type AgendaItemDTO = {
  id: string
  sortOrder: number
  timeLabel: string
  stageName: string
  task: string
  descriptionMarkdown: string | null
  noticeMarkdown: string | null
  isCurrent: boolean
}

type ParticipantHomePayload = {
  currentAgenda: AgendaItemDTO | null
  agenda: AgendaItemDTO[]
  lunchStatus: 'claimed' | 'not_claimed' | 'unknown'
  lastSyncedAt: string
}

type QuestionSummaryDTO = {
  code: string
  askerParticipantCode: string
  contentPreview: string
  status: 'pending' | 'answered'
  answerCount: number
  createdAt: string
  latestAnsweredAt?: string
  latestResponderName?: string
  isMine: boolean
}

type AnswerDTO = {
  id: string
  body: string
  createdByName: string
  updatedByName: string
  createdAt: string
  updatedAt: string
}

type QuestionThreadDTO = {
  code: string
  askerParticipantCode: string
  content: string
  status: 'pending' | 'answered'
  createdAt: string
  answers: AnswerDTO[]
  isMine: boolean
}

type DashboardStatsDTO = {
  checkedInCount: number
  notCheckedInCount: number
  lunchClaimedCount: number
  lunchNotClaimedCount: number
  questionCount: number
  pendingQuestionCount: number
}

type AIAskResponse = {
  outcome: 'answered' | 'uncertain' | 'out_of_scope' | 'error'
  answerText: string
  relatedQuestions: Array<{
    code: string
    status: 'pending' | 'answered'
    contentPreview: string
  }>
  draftQuestion?: string
}
```

# 驗證 / 權限 / Session Flow

## 法法 session flow

* **進入條件**：訪問 `/login`
* **驗證條件**：

  1. `participant_code` 為 3 位數字字串
  2. 先 lookup 編號
  3. 再比對該編號對應 email（`trim().toLowerCase()`）
* **失敗條件**：

  * 格式錯誤
  * 編號不存在
  * email mismatch
  * session tampered
  * event 已結束（若採關閉登入）
* **過期條件**：

  * 到達 `activity_state.event_end_at`
  * 使用者主動登出
  * session cookie 驗證失敗
* **route protection 規則**：

  * `/home`、`/qa` 必須有 valid participant session
  * `/login` 若已有 valid participant session，直接導 `/home`
* **重新登入條件**：

  * session expired / invalid
  * logout 後
* **demo 做法**：

  * custom stateless signed cookie
  * payload 至少含：`role=participant`、`participantId`、`participantCode`、`exp`
  * cookie 名稱：`ff_participant_session`
* **正式產品未來應如何替換**：

  * 改為真正 auth provider（例如 Supabase Auth / enterprise SSO / magic link）
  * session 可升級為 database session 或 refresh token flow
  * participant identity 不再只靠編號 + email

## 努努 session flow

* **進入條件**：訪問 `/staff/login`
* **驗證條件**：

  * 共用密碼正確
  * 密碼來源為 server env `STAFF_SHARED_PASSWORD`
* **失敗條件**：

  * 密碼錯誤
  * session tampered
* **過期條件**：

  * 到達 `activity_state.event_end_at`
  * logout
  * session invalid
* **route protection 規則**：

  * `/staff/select`：需 valid staff auth session
  * `/staff`：需 valid staff auth session + selected staff identity
  * `/staff/login`：已登入則 redirect
* **重新登入條件**：

  * staff auth session 過期
  * logout
* **demo 做法**：

  * custom stateless signed cookie
  * payload 至少含：`role=staff`、`selectedStaffId?`、`exp`
  * cookie 名稱：`ff_staff_session`
* **正式產品未來應如何替換**：

  * per-staff account
  * RBAC
  * hashed password / SSO / audit trail

## cookie 規格

* cookie 必須 server-side 設定，不可由 client JS 自行寫入授權 cookie。 ([Next.js][13])
* 建議屬性：

  * `HttpOnly`
  * `SameSite=Lax`
  * `Path=/`
  * `Secure=true`（Preview / Production）
  * `Expires=activity_state.event_end_at`
* local dev 可因非 HTTPS 調整 `Secure=false`。

## route protection 實作原則

* 以 page / DAL 二次驗證為主，不以 layout-only check 取代。 ([Next.js][13])
* 若使用 `proxy.ts`：

  * 只做 cookie existence / decode / optimistic redirect
  * 不做 Supabase query
  * 不做精細角色授權判斷 ([Next.js][13])
* 不使用 experimental `unauthorized()` / `forbidden()` / `authInterrupts`。 ([Next.js][14])

# 狀態與互動規格

## 表單狀態

所有 form 遵循同一狀態模型：

* `idle`
* `validating`
* `submitting`
* `success`
* `field_error`
* `server_error`
* `timeout_warning`

規則：

* submit pending 時按鈕 disabled
* field error 優先顯示在欄位下方
* submit 成功後才清空欄位
* server error 時保留使用者輸入內容

## 清單狀態

Q&A list / agenda list / staff assignment list 需支援：

* `loading`
* `ready`
* `empty`
* `filtered_empty`
* `stale`
* `error`

## 篩選 / 排序

### 法法 Q&A

* 搜尋：

  * 問題編號：支援 `Q001` 類型
  * 關鍵字：`content` case-insensitive contains
* 篩選：

  * `scope=all|mine`
  * `status=all|pending`
* 排序（本版保守假設）：

  * 預設：最新發問在前（`created_at desc`）
* query param 必須同步至 URL

### 努努 Q&A

* 篩選：

  * `all`
  * `pending`
* 排序（本版保守假設）：

  * `pending` tab：最早未回答在前（FIFO）
  * `all` tab：最新發問在前

## 儲存 / 更新

* 正式提問成功：

  * question 立即公開
  * prepend 到本地 list
  * 自動打開 detail modal
* answer 成功：

  * thread 立即更新
  * question status 更新為 `answered`
  * pending count 更新
* current agenda 切換成功：

  * 後台當前階段立即更新
  * participant `/home` 在下次 refresh / focus regain / 30 秒自動刷新時顯示新階段
* markdown save 成功：

  * 顯示 `已儲存`
  * 清除 dirty state
  * 顯示最後儲存者與時間

## 錯誤提示

必須使用具體文案，不可只用 `Something went wrong`。
建議固定文案：

* `編號查詢不到`
* `信箱不正確，請確認行前信收件信箱或洽現場努努`
* `密碼不正確`
* `目前還沒有公開問題`
* `找不到符合條件的問題`
* `AI 目前正在午休中`
* `資料可能不是最新，請重新整理`
* `系統暫時無法連線，請稍後再試；若持續發生請改走人工備案`

## 成功提示

* `登入成功`
* `已送出問題`
* `已完成報到`
* `已撤回報到`
* `已標記為已領午餐`
* `已儲存`

成功提示採 toast 或 inline banner 皆可，但不得阻塞主流程。

## 重複提交處理

所有 mutation 必須處理重複提交：

* client 端：pending disable
* server 端：帶 `idempotency_key`
* 適用操作：

  * 正式提問
  * 報到
  * 撤回報到
  * 午餐標記
  * answer create / update
  * markdown save
* timeout 後若使用者重試，server 應避免重複寫入

## timeout / failure UI 行為

* 若 mutation 超過 10 秒未完成：

  * 顯示 `連線較慢，請先確認是否已生效`
  * 顯示 `重試` 按鈕
* question submit timeout：

  * 不清空 textarea
  * 提示使用者先檢查列表是否已出現該題
* check-in / lunch timeout：

  * 顯示可能已生效，請重新查詢該學員編號
* AI timeout：

  * 直接轉成 `AI 目前正在午休中`

# RWD / UX / Accessibility 規格

## mobile first 要求

* 以 mobile first 為基準
* 最低支援寬度：`360px`
* participant 首要體驗以手機為主
* staff 後台需同時可在手機與筆電可用

## 文字層級

* 主標題：每頁 1 個 `h1`
* 區塊標題：`h2`
* 內層內容：`h3` / body
* body 最小字級：`14px`
* input 文字建議最小：`16px`（避免 iOS zoom）

## 點擊區域

* 所有可點擊元素最小 hit area：`44x44`
* 行動裝置上的 tab / button / list item 必須可單手操作

## 對比與可讀性

* 達到至少 WCAG AA 對比
* 不使用灰底淺灰字作為主要資訊
* current agenda 區塊必須高辨識度

## 狀態不能只靠顏色

* `pending` / `answered`
* `claimed` / `not claimed`
* `current` / `other`
  都必須同時有：
* 文字
* icon 或 badge
* 不只靠顏色

## 表單錯誤可辨識

* 欄位錯誤文字需和欄位綁定（`aria-describedby`）
* submit 後若有錯誤，焦點移到第一個錯誤欄位
* 錯誤區不可只顯示在 toast

## 窄螢幕 / 長內容 / 多資料量時的處理

* `/home`：current agenda 卡需盡量在首屏可見
* agenda 長內容：detail markdown 區可捲動，但不影響整頁操作
* question detail：mobile 用滿版 popup，避免小 modal
* Q&A list：不做 table，採 card list
* staff backend mobile：單頁多 tab，但一次只顯示一個主要區塊
* Markdown 長文：支援垂直滾動，保留 sticky save bar
* 問題數量較多時：

  * 保留 sticky filter bar
  * 不做虛擬捲動
  * 不做 pagination（MVP）

## Next.js 可及性相關前提

* 每頁必須有唯一且明確的 page title 與 `h1`，因為 App Router client-side transitions 的 route announcer 會以 `document.title` / `h1` / pathname 作為宣告來源。 ([Next.js][15])
* `loading.tsx` 應提供 skeleton 或可理解的 loading UI，而非只有不具語意的 spinner。 ([Next.js][16])
* 需提供 `app/global-error.tsx` 與 `app/not-found.tsx`；不採 experimental `global-not-found`。 ([Next.js][17])

# 錯誤與例外處理

| 情境                | 觸發條件                                       | UI / 系統行為                      | 恢復方式           |
| ----------------- | ------------------------------------------ | ------------------------------ | -------------- |
| 空 agenda          | 尚未匯入或讀取失敗                                  | 顯示 `活動資訊尚未準備完成`                | 努努匯入或修正資料      |
| current stage 未設定 | `activity_state.current_agenda_item_id` 為空 | 顯示提示卡                          | 努努手動設定         |
| 編號格式錯誤            | 非 3 碼數字                                    | 欄位錯誤                           | 修正輸入           |
| 編號不存在             | participant lookup miss                    | 顯示 `編號查詢不到`                    | 修正輸入或洽現場       |
| 信箱不符              | 編號存在但 email mismatch                       | 顯示指定文案與 Gmail 按鈕               | 修正 email 或洽現場  |
| staff 密碼錯誤        | password mismatch                          | 顯示 `密碼不正確`                     | 重新輸入           |
| session 過期        | `exp < now`                                | 清 cookie、導回登入                  | 重新登入           |
| 權限不足              | 無對應 session 進受保護頁                          | redirect，不停留在頁面                | 重新登入或切身份       |
| 問題列表為空            | 尚無公開問題                                     | empty state                    | 等待或發問          |
| 搜尋無結果             | q / filters 無匹配                            | filtered empty state           | 清除篩選           |
| 重複送出正式提問          | 雙擊 / timeout retry                         | server 以 idempotency 去重        | 回傳既有成功結果       |
| 多位努努同時編輯回答        | answer update collision                    | MVP 採 last-write-wins，顯示最後更新時間 | 日後再升級 revision |
| 已報到再報到            | current status = checked in                | 顯示狀態與撤回選項                      | 不重複寫入          |
| 未報到卻撤回            | latest status 非 checked in                 | 顯示 `此學員尚未報到`                   | 無              |
| 已領午餐再標記           | lunch log 已存在                              | 顯示 `此學員已領取午餐`                  | 無              |
| AI 不確定            | model / retrieval confidence low           | 顯示 uncertain + handoff button  | 轉正式提問          |
| AI API failure    | provider 5xx / timeout                     | 顯示 `AI 目前正在午休中`                | 改正式提問或找努努      |
| Supabase failure  | DB / network 失敗                            | 顯示 server error 區塊             | 重試或人工備案        |
| 弱網 stale          | 前端察覺過久未同步                                  | 顯示 `資料可能不是最新，請重新整理`            | refresh        |
| import row error  | CSV 欄位缺失 / 重複 / FK miss                    | row-level error 清單，禁止 commit   | 修正 CSV 重傳      |
| 活動結束後登入           | `now > event_end_at`                       | 若本版採關閉登入，顯示登入關閉                | 不提供 read-only  |

與 route error handling 相關的 App Router file conventions：

* `app/not-found.tsx`：處理找不到 route / resource
* `app/global-error.tsx`：處理未捕捉錯誤 ([Next.js][17])

# 測試掛鉤需求

## 哪些邏輯適合 Unit Test

* `participant_code` 驗證（必須為 3 位字串）
* email normalization / exact match logic
* session payload encode / decode / expiry check
* question code formatter（`Q001`、`Q010`、`Q1000`）
* question status transition（pending → answered）
* attendance current status derivation（由 logs 推導）
* lunch current status derivation
* Q&A filter / search / sort functions
* dashboard count derivation
* CSV row validation
* markdown sanitize pipeline
* AI response mapper（answered / uncertain / out_of_scope / error）

## 哪些流程適合 Integration Test

* participant login action + DB lookup + cookie set
* staff login action + cookie set
* staff identity selection + cookie update
* participant question create + list prepend + code generation
* answer create / update + question status update
* current agenda switch + participant `/home` payload 變更
* check-in / undo check-in + dashboard counts
* lunch mark + participant lunch status
* knowledge base save 後 AI retrieval 使用最新內容
* import dry-run validation + commit

## 哪些 user journey 應由 E2E 驗證

1. **法法主流程**

   * `/login`
   * 成功登入
   * `/home` 看 current agenda
   * 進 `/qa`
   * 搜尋問題
   * 問 AI
   * uncertain → 正式提問
   * 問題立即公開並取得 Q code

2. **努努主流程**

   * `/staff/login`
   * `/staff/select`
   * `/staff`
   * 切換 current agenda
   * 回答 pending question
   * check-in 一名學員
   * 標記午餐
   * dashboard 數字更新

3. **跨角色同步流程**

   * 努努切 stage
   * 法法 `/home` refresh / focus regain / 30 秒內看見新 stage

4. **AI fallback 流程**

   * AI endpoint failure
   * 前端顯示 `AI 目前正在午休中`
   * 使用者仍可轉正式提問

## 哪些 UI / 文案 / RWD 要留給 Manual QA

* participant 首屏是否能在 3 秒內辨識目前要做什麼
* 手機單手操作是否順暢
* Q&A modal 在 mobile 是否真為滿版
* sticky nav / sticky save bar 是否遮擋內容
* 錯誤文案是否與 PRD 完全一致
* 午餐 / 報到操作在手機輸入場景是否足夠快
* 弱網情況下 stale banner / retry 行為是否清楚
* keyboard navigation / focus trap / screen reader 基本可用性
* markdown 顯示可讀性

## 哪些 edge cases 必須被測

* `001` 這種有前導 0 的 participant code
* participant email 大小寫差異
* Q&A question code 超過 `Q999`
* duplicate submit
* activity end 後 session expiry
* 未匯入 staff assignments 時的 staff agenda fallback
* import CSV 中 duplicate participant code
* import CSV 中 agenda sort order 重複
* answer 被不同 staff 編輯
* stale data 提示出現與消失時機

## 測試工具前提

官方 Next.js testing guides 同時涵蓋 Vitest / Jest / Playwright / Cypress。
本規格建議：

* Unit / Integration：Vitest + Testing Library
* E2E：Playwright
* Manual QA：實機手機瀏覽器 + 桌機瀏覽器 ([Next.js][18])

# 部署與環境規格（高層）

## GitHub repo 前提

* 單一 GitHub repo
* `main` 為 production branch
* feature branch / bugfix branch 皆可產生 preview
* repo 需包含：

  * app code
  * migration / schema 定義
  * `spec.md`
  * CI workflow

## branch / preview / production 基本邏輯

* push 到非 production branch：產生 Preview Deployment
* 建立 PR：產生 Preview Deployment URL
* merge 到 `main`：觸發 Production Deployment
* Vercel 與 GitHub 直接整合，預設每次 push 都會部署。 ([Vercel][5])

## Vercel 部署假設

* 部署模式：Node.js server
* 不採 static export
* Preview / Production 使用不同 env vars
* `VERCEL_ENV` / `VERCEL_GIT_COMMIT_REF` 可供 debug / build meta 使用，但不作業務邏輯權威來源
* 若要顯示環境標識，只能用於 staff 非正式 debug 區，不得顯示於 participant 主畫面 ([Next.js][6])

## 最低 CI/CD 要求

每個 PR 至少需通過：

* typecheck
* lint
* unit / integration tests
* production build
* preview deployment success

Production merge 前至少需確認：

* participant login
* staff login
* current agenda switch
* question create / answer
* check-in / lunch mark
* AI fallback 文案

## 環境變數最低需求

* `SESSION_SECRET`
* `STAFF_SHARED_PASSWORD`
* `SUPABASE_URL`
* `SUPABASE_SERVICE_ROLE_KEY`
* `AI_PROVIDER_API_KEY`（或等價名稱）
* `AI_MODEL`（選填）
* `NEXT_PUBLIC_APP_NAME`
* `EVENT_START_AT`
* `EVENT_END_AT`

## 開發 / Preview / Production 資料前提

* Development：可使用本地 / dev Supabase
* Preview：必須使用獨立 preview 資料集，不得直連 production event data
* Production：正式活動資料集
* Preview env 可有 branch-specific override，避免多人同時測試污染同一資料。 ([Vercel][19])

## Node / 專案初始化前提

* Node.js 版本至少符合官方安裝文件最低要求
* 以 Next.js 官方預設啟動：TypeScript、ESLint、Tailwind、App Router
* import alias 採 `@/*` ([Next.js][3])

# 不做事項

本版明確不做以下事項，避免 scope creep：

* 多活動 / 多租戶抽象
* 帳號註冊、忘記密碼、magic link
* participant / staff 角色分級
* websocket / realtime subscription 作為必要依賴
* 問題按讚、收藏、熱門排序
* 問題審核、刪除、封存
* answer revision history
* markdown 版本還原
* CSV 自訂欄位 mapping UI
* participant 以姓名搜尋
* QR Code check-in
* 晚餐狀態
* 推播、通知中心、簡訊
* 地圖導航
* 離線佇列 / offline-first
* 直接從 browser 以 Supabase client 寫權威資料
* AI 對話歷史管理頁
* analytics / BI / 活動後報表
* staff backend 多頁拆分成獨立產品管理系統

# 假設與待確認事項

## 關鍵待確認五題

1. **目前進行中的 agenda，權威來源是否以「努努手動切換」為主，而非依時間自動推算？**

   * 本規格暫採：**手動切換為唯一權威來源**；初始 current stage 預設為 `sort_order` 最小的 agenda item。

2. **努努個人化工作 agenda 的匯入格式，是否確認採「獨立 `staff_agenda_assignments.csv`」拆表？**

   * 本規格暫採：**是**。若沒有 assignment CSV，則無法宣稱「個人化工作 agenda」功能完整。

3. **Q&A 排序規則是否確認為：法法端最新發問優先、努努端待回答最早優先？**

   * 本規格暫採：

     * 法法 `all`：`created_at desc`
     * 努努 `pending`：FIFO
     * 努努 `all`：`created_at desc`

4. **Agenda / 知識庫 Markdown 編輯，是否只需即時覆蓋，不需要版本還原、比對、衝突合併？**

   * 本規格暫採：**只做即時覆蓋 + last-write-wins**，顯示最後儲存者與時間，不做版本歷史。

5. **活動開始後，是否允許以 CSV 再次覆蓋 participants / staff / agenda master data？**

   * 本規格暫採：**不允許 destructive re-import**。活動開始後若已產生 operational logs，bulk 覆蓋匯入不屬 MVP；僅允許 agenda / knowledge inline edit。

## 其餘本版保守假設

* 活動結束後不提供 read-only 模式；session 到 `event_end_at` 即失效。
* Gmail 按鈕僅作為開啟 Gmail Web 的輔助，不做 inbox 搜尋自動化。
* related questions 以最多 3 筆簡單列表呈現，不做卡片瀑布式 UI。
* question content 本版不做複雜富文本，只做純文字 textarea。
* participant email 比對只做 `trim + lower-case`，不做 Gmail alias 正規化。

# 給 Build / Test 的交接備註

## 哪些地方 build 階段不能自行超做

* 不要把單活動做成多活動平台
* 不要把共用密碼 flow 擴成正式帳號系統
* 不要引入 realtime websocket 當必要依賴
* 不要加 question ranking / moderation / delete
* 不要把 staff backend 拆成多個產品後台
* 不要在 browser 直接寫 Supabase 權威資料
* 不要採用 experimental `unauthorized()` / `forbidden()` / `authInterrupts`
* 不要把 route protection 只做在 layout
* 不要把全部頁面 client 化

## 哪些技術決策在 implementation plan 要先拍板

* `staff_agenda_assignments.csv` 的最終欄位格式
* session encode / sign 方案
* markdown renderer / sanitize library
* markdown editor library（或 textarea fallback）
* CSV parser library
* AI provider adapter 介面與 prompt contract
* idempotency key 生成與儲存方式
* participant current agenda refresh cadence（本規格建議 30 秒）
* activity end 後是否直接關閉登入

## 哪些規格 testing plan 必須優先覆蓋

* 法法登入錯誤文案完全一致
* 努努切換 current agenda 後 participant `/home` 能在可接受時間內看到新階段
* 發問後 question 立即公開且 question code 唯一
* 努努回答後 question status 變更為 `answered`
* check-in / undo / lunch mark 的狀態推導正確
* dashboard 六項指標正確
* AI failure 時固定顯示 `AI 目前正在午休中`
* mobile 實機操作順手，尤其 `/home`、`/qa`、`/staff`
* stale / timeout / retry UI 不造成重複寫入