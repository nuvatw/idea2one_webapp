-- AI Conversation History
-- Stores persistent chat history for each participant's AI interactions.

-- ===========================================
-- ai_conversations — one conversation per participant
-- ===========================================

CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ai_conversations_participant_unique UNIQUE (participant_id)
);

COMMENT ON TABLE ai_conversations IS 'One conversation per participant for the event AI assistant.';

-- ===========================================
-- ai_messages — individual messages in a conversation
-- ===========================================

CREATE TYPE ai_message_role AS ENUM ('user', 'assistant');

CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role ai_message_role NOT NULL,
  content TEXT NOT NULL,
  outcome ai_outcome,
  related_question_codes TEXT[],
  draft_question TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE ai_messages IS 'Chat messages within an AI conversation. Ordered by created_at.';

-- ===========================================
-- Indexes
-- ===========================================

CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id, created_at ASC);
