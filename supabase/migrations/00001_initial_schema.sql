-- Field Flow: Initial Schema Migration
-- Based on spec.md data model definitions
-- 10 tables: participants, staff_members, agenda_items, staff_agenda_assignments,
--            activity_state, knowledge_base_documents, questions, answers,
--            attendance_logs, lunch_logs, ai_logs (optional)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Custom enum types
-- ===========================================

CREATE TYPE diet_type AS ENUM ('葷', '素');
CREATE TYPE question_status AS ENUM ('pending', 'answered');
CREATE TYPE question_source AS ENUM ('manual', 'ai_handoff');
CREATE TYPE attendance_action AS ENUM ('check_in', 'undo_check_in');
CREATE TYPE ai_outcome AS ENUM ('answered', 'uncertain', 'out_of_scope', 'error');

-- ===========================================
-- 1. participants
-- ===========================================

CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_code TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  diet_type diet_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT participants_code_unique UNIQUE (participant_code)
);

-- Email stored as lower-case
COMMENT ON COLUMN participants.email IS 'Stored as lower-case after import';
COMMENT ON COLUMN participants.participant_code IS '3-char string code, unique, not numeric';

-- ===========================================
-- 2. staff_members
-- ===========================================

CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  default_role TEXT,
  default_location TEXT,
  default_note_markdown TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT staff_members_name_unique UNIQUE (name)
);

-- ===========================================
-- 3. agenda_items
-- ===========================================

CREATE TABLE agenda_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sort_order INT NOT NULL,
  time_label TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  task TEXT NOT NULL,
  description_markdown TEXT,
  notice_markdown TEXT,
  updated_by_staff_id UUID REFERENCES staff_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT agenda_items_sort_order_unique UNIQUE (sort_order)
);

-- ===========================================
-- 4. staff_agenda_assignments
-- ===========================================

CREATE TABLE staff_agenda_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agenda_item_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  duty_label TEXT,
  location TEXT,
  incident_note_markdown TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT staff_agenda_assignments_unique UNIQUE (agenda_item_id, staff_id)
);

-- ===========================================
-- 5. activity_state (singleton)
-- ===========================================

CREATE TABLE activity_state (
  singleton_key TEXT PRIMARY KEY DEFAULT 'current' CHECK (singleton_key = 'current'),
  current_agenda_item_id UUID REFERENCES agenda_items(id),
  event_start_at TIMESTAMPTZ NOT NULL,
  event_end_at TIMESTAMPTZ NOT NULL,
  updated_by_staff_id UUID REFERENCES staff_members(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE activity_state IS 'Singleton table — always exactly one row with key = current';

-- ===========================================
-- 6. knowledge_base_documents (singleton)
-- ===========================================

CREATE TABLE knowledge_base_documents (
  singleton_key TEXT PRIMARY KEY DEFAULT 'main' CHECK (singleton_key = 'main'),
  title TEXT NOT NULL DEFAULT 'activity-knowledge',
  content_markdown TEXT NOT NULL DEFAULT '',
  updated_by_staff_id UUID REFERENCES staff_members(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE knowledge_base_documents IS 'Singleton table — always exactly one row with key = main';

-- ===========================================
-- 7. questions
-- ===========================================

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_code TEXT NOT NULL,
  participant_id UUID NOT NULL REFERENCES participants(id),
  content TEXT NOT NULL,
  status question_status NOT NULL DEFAULT 'pending',
  source question_source NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT questions_code_unique UNIQUE (question_code)
);

-- ===========================================
-- 8. answers
-- ===========================================

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_by_staff_id UUID NOT NULL REFERENCES staff_members(id),
  updated_by_staff_id UUID NOT NULL REFERENCES staff_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================
-- 9. attendance_logs
-- ===========================================

CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  action attendance_action NOT NULL,
  operated_by_staff_id UUID NOT NULL REFERENCES staff_members(id),
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT attendance_logs_idempotency_unique UNIQUE (idempotency_key)
);

COMMENT ON COLUMN attendance_logs.action IS 'Current check-in status is determined by the latest log entry';

-- ===========================================
-- 10. lunch_logs
-- ===========================================

CREATE TABLE lunch_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  operated_by_staff_id UUID NOT NULL REFERENCES staff_members(id),
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT lunch_logs_participant_unique UNIQUE (participant_id),
  CONSTRAINT lunch_logs_idempotency_unique UNIQUE (idempotency_key)
);

COMMENT ON TABLE lunch_logs IS 'MVP: no undo for lunch pickup. Existence of row = picked up.';

-- ===========================================
-- 11. ai_logs (optional)
-- ===========================================

CREATE TABLE ai_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id),
  prompt TEXT NOT NULL,
  outcome ai_outcome NOT NULL,
  related_question_codes TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================
-- Seed singleton rows
-- ===========================================

INSERT INTO activity_state (singleton_key, event_start_at, event_end_at)
VALUES ('current', '2026-04-01T09:30:00+08:00', '2026-04-01T20:00:00+08:00');

INSERT INTO knowledge_base_documents (singleton_key, title, content_markdown)
VALUES ('main', 'activity-knowledge', '# 活動知識庫

活動知識內容將在此更新。');

-- ===========================================
-- Indexes for common queries
-- ===========================================

CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_participant ON questions(participant_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_attendance_participant ON attendance_logs(participant_id, created_at DESC);
CREATE INDEX idx_staff_assignments_staff ON staff_agenda_assignments(staff_id);
CREATE INDEX idx_staff_assignments_agenda ON staff_agenda_assignments(agenda_item_id);
