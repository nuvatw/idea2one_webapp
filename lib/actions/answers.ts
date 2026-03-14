"use server";

import { revalidatePath } from "next/cache";
import { requireStaffIdentity, requireParticipantSession } from "@/lib/dal/auth-check";
import { createServerSupabaseClient } from "@/lib/utils/supabase";

export interface CreateAnswerResult {
  success: boolean;
  error?: string;
}

export interface UpdateAnswerResult {
  success: boolean;
  error?: string;
}

export interface DeleteAnswerResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: Create a new answer on a question.
 * Only callable by authenticated staff with identity.
 * Automatically sets question status to 'answered' on first answer.
 */
export async function createAnswer(
  _prevState: CreateAnswerResult | null,
  formData: FormData
): Promise<CreateAnswerResult> {
  const session = await requireStaffIdentity();
  const questionId = formData.get("questionId") as string;
  const body = (formData.get("body") as string)?.trim();

  if (!questionId) {
    return { success: false, error: "缺少問題 ID" };
  }

  if (!body) {
    return { success: false, error: "請輸入回覆內容" };
  }

  const supabase = createServerSupabaseClient();

  // Verify question exists
  const { data: question, error: fetchError } = await supabase
    .from("questions")
    .select("id, status")
    .eq("id", questionId)
    .single();

  if (fetchError || !question) {
    return { success: false, error: "找不到此問題" };
  }

  // Insert answer
  const { error: insertError } = await supabase.from("answers").insert({
    question_id: questionId,
    body,
    created_by_staff_id: session.selectedStaffId,
    updated_by_staff_id: session.selectedStaffId,
  });

  if (insertError) {
    console.error("Failed to create answer:", insertError);
    return { success: false, error: "回覆失敗，請稍後再試" };
  }

  // Auto-transition: pending → answered on first answer
  if (question.status === "pending") {
    const { error: updateError } = await supabase
      .from("questions")
      .update({
        status: "answered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionId);

    if (updateError) {
      console.error("Failed to update question status:", updateError);
      // Non-fatal: answer was created, status update can be retried
    }
  }

  revalidatePath("/qa");
  revalidatePath("/staff");

  return { success: true };
}

/**
 * Server Action: Update an existing answer.
 * Only callable by authenticated staff with identity.
 */
export async function updateAnswer(
  _prevState: UpdateAnswerResult | null,
  formData: FormData
): Promise<UpdateAnswerResult> {
  const session = await requireStaffIdentity();
  const answerId = formData.get("answerId") as string;
  const body = (formData.get("body") as string)?.trim();

  if (!answerId) {
    return { success: false, error: "缺少回覆 ID" };
  }

  if (!body) {
    return { success: false, error: "請輸入回覆內容" };
  }

  const supabase = createServerSupabaseClient();

  // Verify answer exists
  const { data: answer, error: fetchError } = await supabase
    .from("answers")
    .select("id")
    .eq("id", answerId)
    .single();

  if (fetchError || !answer) {
    return { success: false, error: "找不到此回覆" };
  }

  const { error: updateError } = await supabase
    .from("answers")
    .update({
      body,
      updated_by_staff_id: session.selectedStaffId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", answerId);

  if (updateError) {
    console.error("Failed to update answer:", updateError);
    return { success: false, error: "更新失敗，請稍後再試" };
  }

  revalidatePath("/qa");
  revalidatePath("/staff");

  return { success: true };
}

/**
 * Server Action: Delete an answer.
 * Only callable by authenticated staff.
 * If this is the last answer on a question, resets question status to 'pending'.
 */
export async function deleteAnswer(
  answerId: string
): Promise<DeleteAnswerResult> {
  await requireStaffIdentity();

  if (!answerId) {
    return { success: false, error: "缺少回覆 ID" };
  }

  const supabase = createServerSupabaseClient();

  // Get the answer to find its question_id
  const { data: answer, error: fetchError } = await supabase
    .from("answers")
    .select("id, question_id")
    .eq("id", answerId)
    .single();

  if (fetchError || !answer) {
    return { success: false, error: "找不到此回覆" };
  }

  // Delete the answer
  const { error: deleteError } = await supabase
    .from("answers")
    .delete()
    .eq("id", answerId);

  if (deleteError) {
    console.error("Failed to delete answer:", deleteError);
    return { success: false, error: "刪除失敗，請稍後再試" };
  }

  // Check if there are remaining answers; if none, revert question to pending
  const { count } = await supabase
    .from("answers")
    .select("*", { count: "exact", head: true })
    .eq("question_id", answer.question_id);

  if (count === 0) {
    await supabase
      .from("questions")
      .update({
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", answer.question_id);
  }

  revalidatePath("/qa");
  revalidatePath("/staff");

  return { success: true };
}

/**
 * Server Action: Create a participant comment on a question.
 * Callable by authenticated participants (法法).
 */
export async function createParticipantComment(
  _prevState: CreateAnswerResult | null,
  formData: FormData
): Promise<CreateAnswerResult> {
  const session = await requireParticipantSession();
  const questionId = formData.get("questionId") as string;
  const body = (formData.get("body") as string)?.trim();

  if (!questionId) {
    return { success: false, error: "缺少問題 ID" };
  }

  if (!body) {
    return { success: false, error: "請輸入留言內容" };
  }

  if (body.length > 2000) {
    return { success: false, error: "留言內容不可超過 2000 字" };
  }

  const supabase = createServerSupabaseClient();

  // Verify question exists
  const { data: question, error: fetchError } = await supabase
    .from("questions")
    .select("id")
    .eq("id", questionId)
    .single();

  if (fetchError || !question) {
    return { success: false, error: "找不到此問題" };
  }

  // Insert comment as participant
  const { error: insertError } = await supabase.from("answers").insert({
    question_id: questionId,
    body,
    created_by_participant_id: session.participantId,
    updated_by_participant_id: session.participantId,
  });

  if (insertError) {
    console.error("Failed to create participant comment:", insertError);
    return { success: false, error: "留言失敗，請稍後再試" };
  }

  revalidatePath("/qa");
  revalidatePath("/staff");

  return { success: true };
}
