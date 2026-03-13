-- ===========================================
-- Migration 8: Make participant stage_name more lively & unique
-- ===========================================

UPDATE agenda_items SET stage_name = 'Seminar 1'        WHERE sort_order = 103;
UPDATE agenda_items SET stage_name = 'Seminar 2'        WHERE sort_order = 104;
UPDATE agenda_items SET stage_name = 'Pitch Round A'    WHERE sort_order = 107;
UPDATE agenda_items SET stage_name = 'Pitch Round B'    WHERE sort_order = 108;
UPDATE agenda_items SET stage_name = 'Showcase'         WHERE sort_order = 110;
UPDATE agenda_items SET stage_name = 'Congratulations!' WHERE sort_order = 111;
