# Week 9 實作週誌：測試 / CI 強化

## 本週目標

Unit / Integration / E2E 測試覆蓋核心邏輯與主流程。CI pipeline 完整（typecheck + lint + test + build）。

## 本週完成項目

### 9.1 Vitest + Testing Library 設定
- 安裝 `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@vitejs/plugin-react`
- 建立 `vitest.config.ts`（使用 node 環境，支援 `@/` 路徑別名）
- 新增 npm scripts: `test`, `test:watch`, `test:unit`, `test:integration`, `test:e2e`

### 9.2–9.11 Unit Tests（8 個測試檔案，共 94 個測試案例）
| 任務 | 檔案 | 測試數 | 狀態 |
|------|------|--------|------|
| 9.2 participant_code 驗證 | `tests/unit/participant-login-validation.test.ts` | 14 | ✅ |
| 9.3 email normalization + exact match | （含在 9.2 中） | — | ✅ |
| 9.4 session encode/decode/expiry | `tests/unit/session.test.ts` | 7 | ✅ |
| 9.5 question code formatter | `tests/unit/question-code.test.ts` | 5 | ✅ |
| 9.6 question status transition | （含在 9.5 中） | 2 | ✅ |
| 9.7 attendance/lunch status derivation | `tests/unit/attendance-status.test.ts` | 13 | ✅ |
| 9.8 dashboard count derivation | （含在 9.7 中） | 4 | ✅ |
| 9.9 CSV row validation | `tests/unit/csv-validation.test.ts` | 28 | ✅ |
| 9.10 AI response mapper | `tests/unit/ai-response-mapper.test.ts` | 9 | ✅ |
| 9.11 markdown sanitize | `tests/unit/markdown-sanitize.test.ts` | 7 | ✅ |
| — truncate utility | `tests/unit/truncate.test.ts` | 5 | ✅ |

### 9.12–9.17 Integration Tests（6 個測試檔案，共 40 個測試案例）
| 任務 | 檔案 | 測試數 | 狀態 |
|------|------|--------|------|
| 9.12 participant login action + DB + cookie | `tests/integration/participant-login.test.ts` | 7 | ✅ |
| 9.13 staff login + identity selection | `tests/integration/staff-login.test.ts` | 6 | ✅ |
| 9.14 question create + code gen + status | `tests/integration/question-create.test.ts` | 6 | ✅ |
| 9.15 answer create + status update | `tests/integration/answer-create.test.ts` | 8 | ✅ |
| 9.16 check-in / undo + dashboard counts | `tests/integration/checkin.test.ts` | 7 | ✅ |
| 9.17 lunch mark + participant status | `tests/integration/lunch.test.ts` | 5 | ✅ |

### 9.18 Playwright 設定
- 安裝 `@playwright/test` + Chromium
- 建立 `playwright.config.ts`（Desktop Chrome + Mobile Chrome）

### 9.19–9.22 E2E Tests（4 個測試檔案）
| 任務 | 檔案 | 狀態 |
|------|------|------|
| 9.19 法法主流程 | `tests/e2e/participant-flow.spec.ts` | ✅ 已建立 |
| 9.20 努努主流程 | `tests/e2e/staff-flow.spec.ts` | ✅ 已建立 |
| 9.21 跨角色同步 | `tests/e2e/cross-role-sync.spec.ts` | ✅ 已建立 |
| 9.22 AI fallback | `tests/e2e/ai-fallback.spec.ts` | ✅ 已建立 |

> 注意：E2E 測試需要 running app + seeded test data 才能完整執行。目前已編寫可在 Preview deployment 上驗證的測試腳本。

### 9.23 CI pipeline 完整化
- 更新 `.github/workflows/ci.yml`，加入 unit + integration tests 步驟
- CI 流程：checkout → install → typecheck → lint → unit tests → integration tests → build

### 9.24 環境分離
- CI 配置中設定必要環境變數（SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY placeholder）

## 實際修改的檔案清單

### 新增
- `vitest.config.ts`
- `playwright.config.ts`
- `tests/unit/participant-login-validation.test.ts`
- `tests/unit/session.test.ts`
- `tests/unit/question-code.test.ts`
- `tests/unit/csv-validation.test.ts`
- `tests/unit/ai-response-mapper.test.ts`
- `tests/unit/truncate.test.ts`
- `tests/unit/attendance-status.test.ts`
- `tests/unit/markdown-sanitize.test.ts`
- `tests/integration/participant-login.test.ts`
- `tests/integration/staff-login.test.ts`
- `tests/integration/question-create.test.ts`
- `tests/integration/answer-create.test.ts`
- `tests/integration/checkin.test.ts`
- `tests/integration/lunch.test.ts`
- `tests/e2e/participant-flow.spec.ts`
- `tests/e2e/staff-flow.spec.ts`
- `tests/e2e/cross-role-sync.spec.ts`
- `tests/e2e/ai-fallback.spec.ts`

### 修改
- `package.json` — 新增 test dependencies + scripts
- `.github/workflows/ci.yml` — 加入 test steps + env vars

### 刪除
- `tests/unit/.gitkeep`
- `tests/integration/.gitkeep`
- `tests/e2e/.gitkeep`

## Blocking Prerequisites

無。所有 Week 1–8 的基礎設施已到位。

## 偏離計畫之處

1. **Vitest 環境改為 node**：原計畫可能預期使用 jsdom，但因 `jose` JWT 函式庫在 jsdom 環境下 `Uint8Array` 類型不相容，改用 node 環境。此變更不影響測試覆蓋範圍。
2. **Markdown 測試方式**：原計畫可能預期測試完整的 React 組件渲染，改為直接驗證 `rehype-sanitize` 的 schema 配置（安全性白名單），避免引入額外依賴。
3. **部分 unit tests 合併**：email normalization（9.3）併入 participant_code 驗證（9.2）；question status transition（9.6）併入 question code（9.5）；dashboard count（9.8）併入 attendance status（9.7）。

## 已執行的檢查

| 檢查項目 | 結果 |
|----------|------|
| lint (`npm run lint`) | ✅ 0 errors, 0 warnings |
| typecheck (`npm run typecheck`) | ✅ 通過 |
| unit tests (`npm run test:unit`) | ✅ 94 tests passed |
| integration tests (`npm run test:integration`) | ✅ 40 tests passed |
| build (`npm run build`) | ✅ 通過 |

**總計：134 個 Vitest 測試全部通過（94 unit + 40 integration）。**

## 目前已知問題 / 待下週處理項目

1. **E2E 測試執行**：E2E 測試已編寫但需要 running app + seeded test data。建議 Week 10 在 Preview deployment 上驗證。
2. **E2E seed data**：需要準備 test fixtures / seed script 供 E2E 測試使用。
3. **CI 中的 E2E**：E2E 測試未加入 CI（需要 running app），建議 Week 10 設定 Preview deployment 後加入。

## 建議下一個 agent 接手時先看哪些檔案

1. `md_home/implementation_plan_v1.md` — Week 10 目標（Demo 硬化與交付）
2. `vitest.config.ts` + `playwright.config.ts` — 測試配置
3. `tests/e2e/*.spec.ts` — E2E 測試腳本，需在 Preview deployment 上驗證
4. `.github/workflows/ci.yml` — CI pipeline，確認推送後是否通過
5. `package.json` — 確認 scripts 與 dependencies
