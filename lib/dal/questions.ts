"use server";

import { createServerSupabaseClient } from "@/lib/utils/supabase";
import type { QuestionSummary, QuestionDetail, AnswerDetail } from "@/types/dto";

/**
 * Fetch all questions as summaries for Q&A list.
 * Returns questions sorted by created_at desc (newest first).
 * Includes answer count and latest answer timestamp.
 */
export async function getQuestionsList(): Promise<QuestionSummary[]> {
  const supabase = createServerSupabaseClient();

  // Fetch questions with participant code via join
  const { data: questions, error } = await supabase
    .from("questions")
    .select(`
      id,
      question_code,
      participant_id,
      content,
      status,
      source,
      created_at,
      participants!inner(participant_code)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch questions:", error);
    return [];
  }

  if (!questions || questions.length === 0) {
    return [];
  }

  // Fetch answer counts and latest_answer_at per question
  const questionIds = questions.map((q) => q.id);
  const { data: answers, error: answersError } = await supabase
    .from("answers")
    .select("question_id, created_at")
    .in("question_id", questionIds);

  if (answersError) {
    console.error("Failed to fetch answer metadata:", answersError);
  }

  // Build answer metadata map
  const answerMeta: Record<string, { count: number; latest_at: string | null }> = {};
  for (const a of answers ?? []) {
    if (!answerMeta[a.question_id]) {
      answerMeta[a.question_id] = { count: 0, latest_at: null };
    }
    answerMeta[a.question_id].count += 1;
    if (
      !answerMeta[a.question_id].latest_at ||
      a.created_at > answerMeta[a.question_id].latest_at!
    ) {
      answerMeta[a.question_id].latest_at = a.created_at;
    }
  }

  return questions.map((q) => {
    const participant = q.participants as unknown as { participant_code: string };
    const meta = answerMeta[q.id] ?? { count: 0, latest_at: null };
    return {
      id: q.id,
      question_code: q.question_code,
      participant_code: participant.participant_code,
      content: q.content,
      status: q.status,
      source: q.source,
      answer_count: meta.count,
      created_at: q.created_at,
      latest_answer_at: meta.latest_at,
    };
  });
}

/**
 * Fetch a single question with full thread (all answers).
 * Returns null if question not found.
 */
export async function getQuestionDetail(
  questionCode: string
): Promise<QuestionDetail | null> {
  const supabase = createServerSupabaseClient();

  const { data: question, error } = await supabase
    .from("questions")
    .select(`
      id,
      question_code,
      content,
      status,
      source,
      created_at,
      participants!inner(participant_code)
    `)
    .eq("question_code", questionCode)
    .single();

  if (error || !question) {
    if (error) console.error("Failed to fetch question detail:", error);
    return null;
  }

  // Fetch answers with staff names and participant codes
  const { data: answers, error: answersError } = await supabase
    .from("answers")
    .select(`
      id,
      body,
      created_at,
      updated_at,
      created_by_staff_id,
      created_by_participant_id,
      created_by:staff_members!answers_created_by_staff_id_fkey(name),
      updated_by:staff_members!answers_updated_by_staff_id_fkey(name),
      comment_by:participants!answers_created_by_participant_id_fkey(participant_code)
    `)
    .eq("question_id", question.id)
    .order("created_at", { ascending: true });

  if (answersError) {
    console.error("Failed to fetch answers:", answersError);
  }

  const participant = question.participants as unknown as {
    participant_code: string;
  };

  const answerDetails: AnswerDetail[] = (answers ?? []).map((a) => {
    const createdBy = a.created_by as unknown as { name: string } | null;
    const updatedBy = a.updated_by as unknown as { name: string } | null;
    const commentBy = a.comment_by as unknown as { participant_code: string } | null;
    return {
      id: a.id,
      body: a.body,
      created_by_staff_name: createdBy?.name ?? null,
      updated_by_staff_name: updatedBy?.name ?? null,
      created_by_participant_code: commentBy?.participant_code ?? null,
      created_at: a.created_at,
      updated_at: a.updated_at,
    };
  });

  return {
    id: question.id,
    question_code: question.question_code,
    participant_code: participant.participant_code,
    content: question.content,
    status: question.status,
    source: question.source,
    created_at: question.created_at,
    answers: answerDetails,
  };
}
