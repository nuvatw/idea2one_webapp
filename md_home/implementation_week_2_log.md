# Week 2 實作週誌：認證與資料匯入

## 1. 本週目標

法法可以用 3 碼編號 + email 登入；努努可以用共用密碼登入並選擇身份；CSV 匯入可用於 seed 開發資料；所有受保護路由有 route protection。

## 2. 本週完成項目

### 認證核心
- [x] `lib/auth/session.ts` — 完整 session encode/decode/verify（使用 jose JWT）
- [x] 兩套 cookie：`ff_participant_session`、`ff_staff_session`
- [x] Cookie 規格：HttpOnly, SameSite=Lax, Secure(prod), Path=/, 24h expiry

### 法法登入
- [x] `lib/validations/participant-login.ts` — 欄位驗證（3 碼數字、email 格式）
- [x] `lib/actions/participant-auth.ts` — Server Action（login + logout）
- [x] `components/participant/ParticipantLoginForm.tsx` — Client component
- [x] `/login` 頁面完整流程
- [x] 錯誤文案：編號不存在、信箱不符、系統錯誤
- [x] Gmail 按鈕（僅 email mismatch 時顯示）
- [x] 已登入自動導向 `/home`

### 努努登入
- [x] `lib/actions/staff-auth.ts` — Server Action（login + logout）
- [x] `components/staff/StaffLoginForm.tsx` — Client component
- [x] `/staff/login` 頁面完整流程
- [x] 密碼來源：`process.env.STAFF_PASSWORD`
- [x] 已登入自動導向 `/staff/select` 或 `/staff`

### 努努身份選擇
- [x] `lib/actions/staff-identity.ts` — Server Action
- [x] `components/staff/StaffIdentitySelector.tsx` — Client component
- [x] `/staff/select` 頁面（顯示所有努努姓名）
- [x] 選擇後 session 更新含 selectedStaffId + selectedStaffName

### Route Protection
- [x] `proxy.ts` — cookie 存在性檢查（粗粒度）
- [x] `lib/dal/auth-check.ts` — page-level session 驗證（細粒度）
  - `requireParticipantSession()`
  - `requireStaffAuth()`
  - `requireStaffIdentity()`
- [x] `/` root redirector — 依 participant session 導向

### CSV 匯入
- [x] `lib/csv/parser.ts` — CSV 解析 + row-level schema 驗證
  - participants / staff / agenda / assignments 四種 kind
  - 重複 participant_code / staff name / sort_order 檢查
- [x] `lib/actions/csv-import.ts` — Server Action（validate + commit to Supabase）
- [x] `components/staff/CsvImportPanel.tsx` — Client component
  - kind 選擇、file upload、row-level error 顯示

### Auth 整合到既有頁面
- [x] `/home` — 加入 auth check + 顯示姓名 + 登出按鈕
- [x] `/qa` — 加入 auth check
- [x] `/staff` — 加入 identity check + 顯示身份 + 切換身份 + 登出

### Dev Seed Data
- [x] `seed/participants.csv` — 10 筆測試學員
- [x] `seed/staff.csv` — 6 筆測試努努
- [x] `seed/agenda.csv` — 10 筆測試議程
- [x] `seed/assignments.csv` — 13 筆測試任務分配

### 基礎設施
- [x] `lib/utils/supabase.ts` — server-side Supabase client（使用 service role key）
- [x] 安裝依賴：`@supabase/supabase-js`、`jose`、`papaparse`、`@types/papaparse`

## 3. 實際修改的檔案清單

### 新增
- `lib/auth/session.ts`（覆寫）
- `lib/utils/supabase.ts`（覆寫）
- `lib/dal/auth-check.ts`
- `lib/validations/participant-login.ts`
- `lib/actions/participant-auth.ts`
- `lib/actions/staff-auth.ts`
- `lib/actions/staff-identity.ts`
- `lib/actions/csv-import.ts`
- `lib/csv/parser.ts`
- `components/participant/ParticipantLoginForm.tsx`
- `components/staff/StaffLoginForm.tsx`
- `components/staff/StaffIdentitySelector.tsx`
- `components/staff/CsvImportPanel.tsx`
- `seed/participants.csv`
- `seed/staff.csv`
- `seed/agenda.csv`
- `seed/assignments.csv`

### 修改
- `app/page.tsx` — root redirector 加入 session check
- `app/(participant-public)/login/page.tsx` — 填入 ParticipantLoginForm
- `app/(participant-app)/home/page.tsx` — 加入 auth check + logout
- `app/(participant-app)/qa/page.tsx` — 加入 auth check
- `app/staff/login/page.tsx` — 填入 StaffLoginForm + 導向邏輯
- `app/staff/select/page.tsx` — 填入 StaffIdentitySelector + 從 DB 讀取 staff list
- `app/staff/page.tsx` — 加入 identity check + top bar
- `package.json` / `package-lock.json` — 新增依賴

## 4. Blocking prerequisites

無。Week 1 已完成所有 Week 2 前置工作：
- Supabase schema migration 已套用
- 專案結構已建立
- proxy.ts 骨架已存在
- 路由骨架頁面已建立

## 5. 偏離計畫之處

無。

## 6. 已執行的檢查

- **typecheck**: ✅ 通過（`npm run typecheck`）
- **lint**: ✅ 通過（`npm run lint`）
- **build**: ✅ 通過（`npm run build`）
  - 所有需要 auth 的路由正確標記為 Dynamic（`ƒ`）
  - 靜態頁面正確標記為 Static（`○`）
- **test**: 本週計畫未要求 automated tests（Week 9）

## 7. 目前已知問題 / 待下週處理項目

- CsvImportPanel 尚未整合進 `/staff` 頁面的 tab 結構（Week 3 建立 tab 結構時整合）
- 法法端頂部導覽（首頁 / Q&A / 登出）完整結構待 Week 3 實作
- 努努切換身份時回到 `/staff/select`，頁面重新讀取 staff list（正常行為）
- seed CSV 為開發測試資料，非正式活動資料

## 8. 建議下一個 agent 接手時先看哪些檔案

1. `lib/auth/session.ts` — 理解 session 機制
2. `lib/dal/auth-check.ts` — 理解 page-level auth pattern
3. `app/staff/page.tsx` — Week 3 需在此建立 tab 結構
4. `app/(participant-app)/home/page.tsx` — Week 3 需填入 Agenda 元件
5. `lib/csv/parser.ts` — 理解 CSV 匯入格式
6. `seed/` 目錄 — 開發測試資料
7. `types/dto.ts` — DTO 定義供後續 DAL 使用
