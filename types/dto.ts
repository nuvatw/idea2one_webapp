/**
 * DTO types — server-to-client data transfer objects.
 * These shape the data that pages and components receive.
 * Implemented progressively as features are built.
 */

import type {
  DietType,
  QuestionStatus,
  QuestionSource,
} from "./domain";

// --- Participant DTOs ---

export interface ParticipantSessionPayload {
  participant_id: string;
  participant_code: string;
  name: string;
}

// --- Staff DTOs ---

export interface StaffSessionPayload {
  authenticated: true;
  staff_id?: string;
  staff_name?: string;
}

// --- Agenda DTOs ---

export interface AgendaItemSummary {
  id: string;
  sort_order: number;
  time_label: string;
  stage_name: string;
  task: string;
  description_markdown: string | null;
  notice_markdown: string | null;
  is_current: boolean;
}

// --- Q&A DTOs ---

export interface QuestionSummary {
  id: string;
  question_code: string;
  participant_code: string;
  content: string;
  status: QuestionStatus;
  source: QuestionSource;
  answer_count: number;
  created_at: string;
  latest_answer_at: string | null;
}

export interface QuestionDetail {
  id: string;
  question_code: string;
  participant_code: string;
  content: string;
  status: QuestionStatus;
  source: QuestionSource;
  created_at: string;
  answers: AnswerDetail[];
}

export interface AnswerDetail {
  id: string;
  body: string;
  created_by_staff_name: string;
  updated_by_staff_name: string;
  created_at: string;
  updated_at: string;
}

// --- Dashboard DTOs ---

export interface DashboardStats {
  checked_in_count: number;
  not_checked_in_count: number;
  lunch_picked_up_count: number;
  lunch_not_picked_up_count: number;
  total_questions: number;
  pending_questions: number;
}

// --- Participant Status DTOs ---

export interface ParticipantLunchStatus {
  has_picked_up: boolean;
  diet_type: DietType;
}

// --- Staff Agenda DTOs ---

export interface StaffAgendaItemDTO {
  id: string;
  agenda_item_id: string;
  sort_order: number;
  time_label: string;
  stage_name: string;
  task: string;
  duty_label: string | null;
  location: string | null;
  incident_note_markdown: string | null;
  is_current: boolean;
}

// --- AI DTOs ---

export interface AIAskResponse {
  outcome: "answered" | "uncertain" | "out_of_scope" | "error";
  answerText: string;
  relatedQuestions: Array<{
    code: string;
    status: "pending" | "answered";
    contentPreview: string;
  }>;
  draftQuestion?: string;
}

// --- Participant Home Payload ---

export type LunchDisplayStatus = "claimed" | "not_claimed" | "unknown";

export interface ParticipantHomePayload {
  currentAgenda: AgendaItemSummary | null;
  agenda: AgendaItemSummary[];
  lunchStatus: LunchDisplayStatus;
  lastSyncedAt: string;
}
