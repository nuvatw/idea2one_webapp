# Week 1 Implementation Log — 地基搭建

## 本週目標

所有開發基礎設施就位。`npm install` → `npm run dev` → 可看到 Next.js app 運作，專案結構符合 Spec 定義，Supabase schema migration 已撰寫，CI pipeline 可通過。

## 本週完成項目

1. **Next.js 16 App Router 專案初始化**
   - Next.js 16.1.6 + TypeScript + Tailwind CSS 4 + ESLint
   - `@/*` import alias 已設定

2. **所有路由空殼頁面建立**
   - `/` → 進站 redirector（導向 `/login`，Week 2 補 session check）
   - `/login` → 法法登入頁骨架
   - `/home` → 法法首頁骨架
   - `/qa` → 法法 Q&A 頁骨架
   - `/staff/login` → 努努登入頁骨架
   - `/staff/select` → 努努身份選擇頁骨架
   - `/staff` → 努努後台主頁骨架
   - `/api/ai/ask` → AI Route Handler（回傳 503 fallback）

3. **Route Groups 按 Spec 結構設定**
   - `(participant-public)/login` — 公開登入區
   - `(participant-app)/home`, `(participant-app)/qa` — 法法認證區
   - `staff/` — 努努區

4. **proxy.ts 骨架**
   - Next.js 16 proxy.ts 路由保護骨架
   - 法法受保護路由：`/home`, `/qa`
   - 努努受保護路由：`/staff`, `/staff/select`（排除 `/staff/login`）
   - 僅做 cookie 存在檢查，不做 DB query

5. **Supabase Schema Migration SQL**
   - 11 張 table：participants, staff_members, agenda_items, staff_agenda_assignments, activity_state, knowledge_base_documents, questions, answers, attendance_logs, lunch_logs, ai_logs
   - 所有 enum types：diet_type, question_status, question_source, attendance_action, ai_outcome
   - 所有 constraints (unique, FK, check) 按 Spec 定義
   - Singleton rows 初始化（activity_state, knowledge_base_documents）
   - 常用查詢 indexes

6. **Types 定義**
   - `types/domain.ts` — 所有 DB entity types + enums
   - `types/dto.ts` — server-to-client DTO types
   - `types/db.ts` — Supabase 型別 placeholder

7. **Lib 目錄結構**
   - `lib/auth/session.ts` — session cookie 常數定義
   - `lib/constants/index.ts` — 應用常數
   - `lib/utils/supabase.ts` — Supabase client placeholder
   - `lib/dal/`, `lib/actions/`, `lib/ai/`, `lib/csv/`, `lib/markdown/`, `lib/validations/` — .gitkeep

8. **Components 目錄結構**
   - `components/participant/`, `components/qa/`, `components/staff/`, `components/shared/` — .gitkeep

9. **App Router 必要檔案**
   - `app/not-found.tsx` — 404 頁面
   - `app/global-error.tsx` — 全域錯誤頁面
   - `app/(participant-app)/loading.tsx` — 法法端 loading
   - `app/staff/loading.tsx` — 努努端 loading

10. **ESLint + Prettier 設定**
    - ESLint: eslint-config-next
    - Prettier: `.prettierrc` + `.prettierignore`
    - Scripts: `lint`, `format`, `format:check`, `typecheck`

11. **GitHub Actions CI**
    - `.github/workflows/ci.yml`
    - Steps: checkout → node setup → npm ci → typecheck → lint → build

12. **環境變數文件**
    - `.env.example` — 列出所有必要環境變數
    - `.gitignore` — 含 .env, node_modules, .next 等

## 實際修改的檔案清單

### 新建檔案
- `app/page.tsx` (重寫)
- `app/layout.tsx` (修改 metadata + lang)
- `app/not-found.tsx`
- `app/global-error.tsx`
- `app/(participant-public)/login/page.tsx`
- `app/(participant-app)/home/page.tsx`
- `app/(participant-app)/qa/page.tsx`
- `app/(participant-app)/loading.tsx`
- `app/(participant-app)/_components/.gitkeep`
- `app/staff/page.tsx`
- `app/staff/login/page.tsx`
- `app/staff/select/page.tsx`
- `app/staff/loading.tsx`
- `app/staff/_components/.gitkeep`
- `app/api/ai/ask/route.ts`
- `proxy.ts`
- `types/domain.ts`
- `types/dto.ts`
- `types/db.ts`
- `lib/auth/session.ts`
- `lib/constants/index.ts`
- `lib/utils/supabase.ts`
- `lib/dal/.gitkeep`
- `lib/actions/.gitkeep`
- `lib/ai/.gitkeep`
- `lib/csv/.gitkeep`
- `lib/markdown/.gitkeep`
- `lib/validations/.gitkeep`
- `components/participant/.gitkeep`
- `components/qa/.gitkeep`
- `components/staff/.gitkeep`
- `components/shared/.gitkeep`
- `tests/unit/.gitkeep`
- `tests/integration/.gitkeep`
- `tests/e2e/.gitkeep`
- `supabase/migrations/00001_initial_schema.sql`
- `.github/workflows/ci.yml`
- `.prettierrc`
- `.prettierignore`
- `.env.example`
- `.gitignore`

### 修改檔案
- `package.json` (新增 scripts: format, format:check, typecheck)
- `app/layout.tsx` (metadata 改為 Field Flow, lang 改為 zh-Hant)

## Blocking Prerequisites

無。Week 1 為起始週，無前置依賴。

## 偏離計畫之處

1. **Vercel project 與 Supabase project 未實際建立**：這些需要用戶手動在 Vercel Dashboard 和 Supabase Dashboard 操作。已產出 migration SQL 和 `.env.example` 供後續使用。
2. **技術 spike（session cookie sign/verify、Supabase server-side client）**：proxy.ts 已驗證可在 Next.js 16 正常運作。Session 和 Supabase 實際整合需在安裝相關 library（jose / iron-session、@supabase/supabase-js）後於 Week 2 完成。
3. **PM 拍板 Spec 五項待確認事項**：屬 PM 工作，非工程實作範圍，此處不處理。

## 已執行的檢查

- **typecheck**: ✅ 通過（`tsc --noEmit`）
- **lint**: ✅ 通過（`eslint`）
- **build**: ✅ 通過（`next build`，Next.js 16.1.6 Turbopack）

Build 輸出確認所有路由正確：
```
Route (app)
├ ○ /
├ ○ /_not-found
├ ƒ /api/ai/ask
├ ○ /home
├ ○ /login
├ ○ /qa
├ ○ /staff
├ ○ /staff/login
└ ○ /staff/select
ƒ Proxy (Middleware)
```

## 目前已知問題 / 待下週處理項目

1. **Week 2 必須完成**：
   - 安裝 `@supabase/supabase-js` 並實作 server-side client
   - 安裝 session library (jose 或 iron-session) 並實作 cookie encode/decode/verify
   - 實作法法登入 Server Action + UI
   - 實作努努登入 + 身份選擇 Server Action + UI
   - 實作 CSV 匯入功能
   - 實作 proxy.ts 中的實際 session 驗證邏輯
   - 建立 dev seed data

2. **需用戶手動操作**：
   - 建立 GitHub remote repo 並 push
   - 建立 Vercel project 並連結 GitHub
   - 建立 Supabase project 並執行 migration SQL
   - 設定各環境的 env vars

## 建議下一個 agent 接手時先看哪些檔案

1. `md_home/implementation_plan_v1.md` — Week 2 計畫
2. `md_home/spec.md` — 登入驗證流程、session 規格、CSV 匯入規格
3. `proxy.ts` — 需補實際 session 驗證
4. `lib/auth/session.ts` — 需實作 session 邏輯
5. `lib/utils/supabase.ts` — 需實作 Supabase client
6. `types/domain.ts` — 已定義所有 entity types
7. `supabase/migrations/00001_initial_schema.sql` — 已定義完整 schema
8. `app/(participant-public)/login/page.tsx` — 需填入 ParticipantLoginForm
9. `app/staff/login/page.tsx` — 需填入 StaffLoginForm
