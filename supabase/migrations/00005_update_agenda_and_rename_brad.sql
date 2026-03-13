-- ===========================================
-- Migration 4: Rename Brad → 上哲, simplify participant agenda
-- ===========================================

-- 1. Rename Brad to 上哲
UPDATE staff_members SET name = '上哲' WHERE name = 'Brad';

-- 2. Hide ALL existing items from participants
UPDATE agenda_items SET visible_to_participants = FALSE;

-- 3. Insert 7 simplified participant-facing agenda items
INSERT INTO agenda_items (sort_order, time_label, stage_name, task, description_markdown, visible_to_participants) VALUES
  (101, '09:30–09:50', '報到', '報到',
   '到大安森林公園的七號公共廁所進行報到',
   TRUE),

  (102, '10:00–10:20', '分組', '分組',
   E'請找到三個隊友，總共四個人。\n\n找到四個人組隊完成之後，就可以到報到台領取今天的筆記本跟筆。',
   TRUE),

  (103, '10:20–12:00', 'Seminar', '上午場 Seminar',
   E'**第一場** — 林上哲分享「S2P — Vibe Coding 一個 Prototype 需要注意的細節」\n\n**第二場** — Jeremy 分享「How to Pitch」',
   TRUE),

  (104, '12:00–14:30', 'Idea to One', 'Idea to One',
   NULL,
   TRUE),

  (105, '14:30–16:30', 'Pitch', 'Pitch',
   E'**Round A**（14:30–15:20）\nA 組擔任新創公司，向 B 組投資人進行 Pitch\n\n**Round B**（15:30–16:20）\nB 組擔任新創公司，向 A 組投資人進行 Pitch\n\n16:20 開始進行投票',
   TRUE),

  (106, '16:30–17:20', '募資', '募資',
   '請募到最多錢的到 Center 跟大家分享你們的 Idea 跟做出來的作品',
   TRUE),

  (107, '17:20', '大合照', '大合照',
   NULL,
   TRUE);
