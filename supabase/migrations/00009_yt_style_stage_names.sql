-- ===========================================
-- Migration 9: YT-style participant stage_name overhaul
-- ===========================================

UPDATE agenda_items SET stage_name = '你的冒險從這裡開始'          WHERE sort_order = 101;
UPDATE agenda_items SET stage_name = '四個人就夠了'                WHERE sort_order = 102;
UPDATE agenda_items SET stage_name = '90% 的人都踩過這些坑'       WHERE sort_order = 103;
UPDATE agenda_items SET stage_name = '投資人的前 30 秒就決定了'    WHERE sort_order = 104;
UPDATE agenda_items SET stage_name = '最好的會議室是一棵樹'        WHERE sort_order = 105;
UPDATE agenda_items SET stage_name = '兩小時後你會有一個產品'      WHERE sort_order = 106;
UPDATE agenda_items SET stage_name = '說服他們投資你'              WHERE sort_order = 107;
UPDATE agenda_items SET stage_name = '這次換你當投資人'            WHERE sort_order = 108;
UPDATE agenda_items SET stage_name = '你手上有 5,000 萬'          WHERE sort_order = 109;
UPDATE agenda_items SET stage_name = '誰拿到最多錢？'             WHERE sort_order = 110;
UPDATE agenda_items SET stage_name = '恭喜，你做到了！'            WHERE sort_order = 111;
