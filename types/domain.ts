/**
 * Domain types — maps to Supabase table schemas.
 * These represent the core data structures used across the application.
 */

// --- Enums ---

export type DietType = "葷" | "素";

export type QuestionStatus = "pending" | "answered";

export type QuestionSource = "manual" | "ai_handoff";

export type AttendanceAction = "check_in" | "undo_check_in";

export type AiOutcome = "answered" | "uncertain" | "out_of_scope" | "error";

// --- Entities ---

export interface Participant {
  id: string;
  participant_code: string;
  name: string;
  email: string;
  diet_type: DietType;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  name: string;
  default_role: string | null;
  default_location: string | null;
  default_note_markdown: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgendaItem {
  id: string;
  sort_order: number;
  time_label: string;
  stage_name: string;
  task: string;
  description_markdown: string | null;
  notice_markdown: string | null;
  updated_by_staff_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffAgendaAssignment {
  id: string;
  agenda_item_id: string;
  staff_id: string;
  duty_label: string | null;
  location: string | null;
  incident_note_markdown: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityState {
  singleton_key: "current";
  current_agenda_item_id: string | null;
  current_participant_agenda_item_id: string | null;
  event_start_at: string;
  event_end_at: string;
  updated_by_staff_id: string | null;
  updated_at: string;
}

export interface KnowledgeBaseDocument {
  singleton_key: "main";
  title: string;
  content_markdown: string;
  updated_by_staff_id: string | null;
  updated_at: string;
}

export interface Question {
  id: string;
  question_code: string;
  participant_id: string;
  content: string;
  status: QuestionStatus;
  source: QuestionSource;
  created_at: string;
  updated_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  body: string;
  created_by_staff_id: string | null;
  updated_by_staff_id: string | null;
  created_by_participant_id: string | null;
  updated_by_participant_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: string;
  participant_id: string;
  action: AttendanceAction;
  operated_by_staff_id: string;
  idempotency_key: string;
  created_at: string;
}

export interface LunchLog {
  id: string;
  participant_id: string;
  operated_by_staff_id: string;
  idempotency_key: string;
  created_at: string;
}

export interface AiLog {
  id: string;
  participant_id: string | null;
  prompt: string;
  outcome: AiOutcome;
  related_question_codes: string[] | null;
  created_at: string;
}

export type AiMessageRole = "user" | "assistant";

export interface AiConversation {
  id: string;
  participant_id: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: AiMessageRole;
  content: string;
  outcome: AiOutcome | null;
  related_question_codes: string[] | null;
  draft_question: string | null;
  created_at: string;
}
