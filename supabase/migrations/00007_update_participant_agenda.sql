-- ===========================================
-- Migration 7: Update participant-facing agenda to final schedule
-- ===========================================

-- 1. Clear activity_state FK reference to old participant item
UPDATE activity_state SET current_participant_agenda_item_id = NULL WHERE current_participant_agenda_item_id IS NOT NULL;

-- 2. Remove old participant agenda items (sort_order 101–107)
DELETE FROM agenda_items WHERE sort_order BETWEEN 101 AND 107;

-- 2. Insert updated participant-facing agenda items (101–111)
INSERT INTO agenda_items (sort_order, time_label, stage_name, task, description_markdown, notice_markdown, visible_to_participants) VALUES

  (101, '09:30–09:50', '報到', '報到／入場',
   E'歡迎來到 Idea to One！\n\n請至 **大安森林公園 7 號公共廁所出口旁** 進行報到，出示確認信領取識別證。',
   '請提早抵達，報到後可先在周圍逛逛、認識其他參加者',
   TRUE),

  (102, '10:00–10:20', '分組', '找夥伴 · 四人一組',
   E'請在現場找到 **三位夥伴**，組成四人小組。\n\n完成組隊後，到報到台領取小組道具（筆記本＆筆），再帶一張野餐墊找一棵喜歡的樹，準備開始今天的旅程！',
   '找不到組員？別擔心，現場工作人員會協助你配對',
   TRUE),

  (103, '10:20–11:00', 'Seminar', 'nuva 創辦人 林上哲：S2P 與 Prototype',
   E'**從 Spot 到 Product 會遇到的挑戰與常見原型雷區**\n\n- 如何避免原型階段常踩的坑\n- 實作可用的 Vibe Coding 核心邏輯\n- 把想法快速變成看得見、摸得著的東西',
   NULL,
   TRUE),

  (104, '11:10–11:50', 'Seminar', 'Plug and Play Jeremy：How to Pitch?',
   E'**如何讓投資人聽見你？**\n\n- 如何跟投資人講話？用什麼節奏、什麼語言？\n- 如何對應到市場？怎麼證明你的 Idea 有人買單？\n- 前期商業模式怎麼安排？從零到一的策略思維',
   NULL,
   TRUE),

  (105, '12:00–12:10', '午餐', '領午餐',
   E'四人一組前往領取午餐，然後回到你們的創業基地（那棵樹下），邊吃邊討論接下來的 Prototype 方向。\n\n這棵樹，就是你們今天的創業總部！',
   '請確認飲食別（葷/素）再領取',
   TRUE),

  (106, '12:10–14:30', 'Idea to One', 'Antigravity Prototype 衝刺',
   E'最重要的環節來了——四個人、一個 Idea、兩個多小時。\n\n把上午學到的 S2P 邏輯和 Pitch 心法化為行動，將你們的想法雕磨成一個 **可試驗的 Prototype**。\n\n不需要完美，但要能讓人看懂、願意投資。',
   '善用 AI 助手與現場工作人員，有問題就問！',
   TRUE),

  (107, '14:30–15:20', 'Pitch', 'Pitch Round A',
   E'**A 組擔任新創公司** — 向 B 組投資人進行 Pitch\n\nA 組各隊帶著你們的 Prototype，向 B 組投資人展示作品、說明商業模式，說服他們投資你！',
   '每組限時 Pitch，注意時間控制',
   TRUE),

  (108, '15:30–16:20', 'Pitch', 'Pitch Round B',
   E'**B 組擔任新創公司** — 向 A 組投資人進行 Pitch\n\n攻守交換！B 組各隊輪流上場，向 A 組投資人展示你們的成果。',
   '每組限時 Pitch，注意時間控制',
   TRUE),

  (109, '16:30–16:40', '募資', '投資時間：你要如何用這 5,000 萬？',
   E'每位投資人手上有 **5,000 萬**的資金。\n\n思考一下：如果你是投資人，你會如何分配這筆錢到你看過的三個組別？哪個團隊最有潛力？\n\n把你的籌碼投出去吧！',
   NULL,
   TRUE),

  (110, '16:40–17:00', 'Stage', '優秀作品舞台分享',
   E'募資金額最高的前三組，恭喜你們！\n\n請到舞台區，透過 Google Meet 螢幕分享，向全場展示你們的 Idea 與 Prototype。讓大家看看今天最亮眼的作品！',
   NULL,
   TRUE),

  (111, '17:00–17:10', 'Stage', '活動收尾',
   E'恭喜完成 Idea to One！\n\n一起回顧今天學到的技巧、觀察到的亮點，以及你和夥伴們共同創造的成果。帶著今天的經驗，繼續把你的 Idea 變成現實吧！',
   '請確認個人物品帶齊，感謝你的參與！',
   TRUE);
