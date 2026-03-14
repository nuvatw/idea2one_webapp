-- Add local development guide to knowledge base for code block testing

UPDATE knowledge_base_documents
SET content_markdown = content_markdown || E'\n\n## 怎麼在本機跑這個專案？\n\n在 Terminal 先進到這個 Project 的資料夾，然後輸入：\n\n```bash\nnpm run dev\n```\n\n執行後，Terminal 通常會出現像下面這樣的畫面：\n\n```bash\n> field-flow@0.1.0 dev\n> next dev\n\n▲ Next.js 16.1.6 (Turbopack)\n- Local:         http://localhost:3000\n- Network:       http://172.20.10.2:3000\n- Environments: .env\n```\n\n看到 `Local: http://localhost:3000`，就代表本機測試環境已經成功開起來了。\n接著開一個新的瀏覽器視窗或分頁，把 `http://localhost:3000` 複製貼上，就可以在自己的電腦上看到網站畫面。\n\n如果有正常跑起來，之後你改程式內容，畫面通常也會自動更新。\n\n如果你還沒先安裝套件，可能要先跑一次：\n\n```bash\nnpm install\n```\n\n然後再執行：\n\n```bash\nnpm run dev\n```',
    updated_at = now()
WHERE singleton_key = 'main';
