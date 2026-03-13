# Field Flow Production 部署指南

本文件說明如何將 Field Flow 部署到 Vercel Production 環境。

---

## 1. 前置條件

### 1.1 Supabase Production Instance

- 建立獨立的 Supabase Production project（不與 dev/preview 共用）
- 執行 schema migration：`supabase/migrations/00001_initial_schema.sql`
- 記下 Production 的 `SUPABASE_URL` 與 `SUPABASE_SERVICE_ROLE_KEY`

### 1.2 OpenAI API Key

- 確認 API key 有效且額度足夠
- 建議使用 `gpt-4o-mini` model（成本較低、速度較快）

### 1.3 Session Secret

- 產生至少 32 字元的隨機字串
- 可使用：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 2. Vercel Production 環境變數設定

在 Vercel Dashboard → Project Settings → Environment Variables 中，為 **Production** 環境設定以下變數：

| 變數名稱 | 說明 | 範例 |
|----------|------|------|
| `SESSION_SECRET` | Session 加密金鑰（至少 32 字元） | `a1b2c3d4...`（64 位 hex） |
| `STAFF_PASSWORD` | 努努共用登入密碼 | `0012` |
| `SUPABASE_URL` | Production Supabase URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Supabase service role key | `eyJhbGci...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `AI_MODEL` | AI 模型名稱（選填） | `gpt-4o-mini` |

**重要**：Production 環境變數必須與 Preview/Development 使用不同的值，特別是 Supabase 連線資訊。

---

## 3. 部署步驟

### 3.1 確認 main branch 就緒

```bash
git checkout main
git pull origin main
npm run typecheck
npm run lint
npm run test
npm run build
```

所有檢查必須通過。

### 3.2 觸發 Production Deployment

```bash
git push origin main
```

Vercel 偵測到 main branch push 後自動觸發 Production Deployment。

### 3.3 確認部署成功

1. 前往 Vercel Dashboard 確認 deployment status 為 Ready
2. 記錄 Production URL

---

## 4. Production Seed Data

### 4.1 準備正式 CSV 檔案

確認以下 CSV 格式正確：

- `participants.csv`：participant_code, name, email, diet_type
- `staff.csv`：name, default_role, default_location, default_note_markdown
- `agenda.csv`：sort_order, time_label, stage_name, task, description_markdown, notice_markdown
- `assignments.csv`：agenda_sort_order, staff_name, duty_label, location, incident_note_markdown

### 4.2 匯入資料

1. 開啟 `{PRODUCTION_URL}/staff/login`
2. 使用共用密碼登入
3. 選擇任一努努身份
4. 切換到「Import」tab
5. 依序匯入（順序很重要）：
   1. **Participants** → participants.csv
   2. **Staff** → staff.csv
   3. **Agenda** → agenda.csv
   4. **Assignments** → assignments.csv（必須在 staff + agenda 之後）

### 4.3 設定知識庫

1. 切換到「Content」tab
2. 在知識庫編輯器中貼入活動知識內容（參考 `seed/knowledge_base.md`）
3. 儲存

### 4.4 設定目前階段

1. 切換到「Agenda」tab
2. 選擇初始階段（通常是「報到」）

---

## 5. Production 驗證

### 5.1 法法主流程

1. 開啟 `{PRODUCTION_URL}/login`
2. 用正式名單中的學員編號 + 信箱登入
3. 確認首頁顯示目前 agenda
4. 確認午餐狀態顯示
5. 進入 Q&A 頁面，提一個問題
6. 使用 AI 助手問一個活動相關問題

### 5.2 努努主流程

1. 開啟 `{PRODUCTION_URL}/staff/login`
2. 用共用密碼登入 + 選擇身份
3. 切換 agenda 階段
4. 回覆法法的問題
5. 報到一位學員
6. 標記一位學員午餐已領
7. 確認 Dashboard 數字正確

### 5.3 Mobile 測試

- 至少在 iOS Safari + Android Chrome 各跑一次法法主流程
- 確認首頁在手機上 3 秒內可辨識目前階段
- 確認輸入欄位在手機上操作順暢

---

## 6. Demo Branch Freeze

Production 部署驗證通過後：

1. 禁止未經審查的 merge 到 `main`
2. 只允許 hotfix merge（需至少一人 review）
3. 任何 hotfix 部署後需重新跑 Production 驗證

---

## 7. 常見問題

### 部署失敗

- 檢查 Vercel Dashboard 的 build log
- 確認所有環境變數已正確設定
- 本地 `npm run build` 是否通過

### Supabase 連線失敗

- 確認 `SUPABASE_URL` 與 `SUPABASE_SERVICE_ROLE_KEY` 是否正確
- 確認 Production Supabase project 是否有執行 migration
- 確認 Supabase project 是否 paused（免費方案超過 7 天不活動會暫停）

### AI 不回應

- 確認 `OPENAI_API_KEY` 是否有效
- 確認 API 額度是否足夠
- 查看 Vercel Function Logs 確認錯誤訊息
