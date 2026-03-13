-- Add missing visible_to_participants column to agenda_items
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS visible_to_participants BOOLEAN NOT NULL DEFAULT TRUE;

-- Items with sort_order >= 26 are only visible to staff
UPDATE agenda_items SET visible_to_participants = FALSE WHERE sort_order >= 26;
