import { createServerSupabaseClient } from "@/lib/utils/supabase";
import type { AiOutcome } from "@/types/domain";

export interface AiMessageRow {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  outcome: AiOutcome | null;
  related_question_codes: string[] | null;
  draft_question: string | null;
  created_at: string;
}

/**
 * Get or create a conversation for a participant.
 * Each participant has exactly one conversation.
 */
export async function getOrCreateConversation(
  participantId: string
): Promise<string> {
  const supabase = createServerSupabaseClient();

  // Try to find existing conversation
  const { data: existing } = await supabase
    .from("ai_conversations")
    .select("id")
    .eq("participant_id", participantId)
    .single();

  if (existing) return existing.id;

  // Create new conversation
  const { data: created, error } = await supabase
    .from("ai_conversations")
    .insert({ participant_id: participantId })
    .select("id")
    .single();

  if (error) {
    // Race condition: another request created it first
    const { data: retry } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("participant_id", participantId)
      .single();
    if (retry) return retry.id;
    throw error;
  }

  return created.id;
}

/**
 * Save a message to the conversation.
 */
export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  options?: {
    outcome?: AiOutcome;
    relatedQuestionCodes?: string[];
    draftQuestion?: string;
  }
): Promise<AiMessageRow> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("ai_messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      outcome: options?.outcome ?? null,
      related_question_codes:
        options?.relatedQuestionCodes && options.relatedQuestionCodes.length > 0
          ? options.relatedQuestionCodes
          : null,
      draft_question: options?.draftQuestion ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AiMessageRow;
}

/**
 * Get all messages in a conversation, ordered by creation time.
 */
export async function getConversationMessages(
  conversationId: string
): Promise<AiMessageRow[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AiMessageRow[];
}

/**
 * Get recent messages for OpenAI context (last N messages).
 */
export async function getRecentMessages(
  conversationId: string,
  limit: number = 20
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Reverse to get chronological order
  return ((data ?? []) as Array<{ role: "user" | "assistant"; content: string }>).reverse();
}

/**
 * Update the conversation's updated_at timestamp.
 */
export async function touchConversation(conversationId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}
