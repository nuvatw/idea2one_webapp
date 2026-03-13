-- ===========================================
-- Migration 6: Add independent participant current agenda pointer
-- ===========================================

-- Add a separate column for tracking the current participant-facing agenda item,
-- independent of the staff agenda progression.
ALTER TABLE activity_state
  ADD COLUMN current_participant_agenda_item_id UUID REFERENCES agenda_items(id);

COMMENT ON COLUMN activity_state.current_participant_agenda_item_id
  IS 'Independent pointer for participant (FaFa) current agenda stage';
