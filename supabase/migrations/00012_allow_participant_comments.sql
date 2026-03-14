-- Allow participants (法法) to leave comments on questions
-- Previously only staff (努努) could create answers

-- Make staff columns nullable
ALTER TABLE answers ALTER COLUMN created_by_staff_id DROP NOT NULL;
ALTER TABLE answers ALTER COLUMN updated_by_staff_id DROP NOT NULL;

-- Add participant columns
ALTER TABLE answers ADD COLUMN created_by_participant_id UUID REFERENCES participants(id);
ALTER TABLE answers ADD COLUMN updated_by_participant_id UUID REFERENCES participants(id);

-- Ensure exactly one author type is set
ALTER TABLE answers ADD CONSTRAINT answers_author_check
  CHECK (
    (created_by_staff_id IS NOT NULL AND created_by_participant_id IS NULL)
    OR
    (created_by_staff_id IS NULL AND created_by_participant_id IS NOT NULL)
  );
