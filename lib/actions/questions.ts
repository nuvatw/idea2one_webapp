"use server";

import { revalidatePath } from "next/cache";
import { requireParticipantSession } from "@/lib/dal/auth-check";
import { createServerSupabaseClient } from "@/lib/utils/supabase";
import { QUESTION_CODE_PREFIX } from "@/lib/constants";

export interface CreateQuestionResult {
  success: boolean;
  question_code?: string;
  error?: string;
}

/**
 * Generate the next question code (Q001, Q002, ...).
 * Uses count of existing questions + 1.
 * The unique constraint on question_code handles race conditions.
 */
async function generateQuestionCode(
  supabase: ReturnType<typeof createServerSupabaseClient>
): Promise<string> {
  const { count, error } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Failed to count questions:", error);
  }

  const nextNum = (count ?? 0) + 1;
  // Pad to at least 3 digits: Q001, Q010, Q100, Q1000
  const padded = String(nextNum).padStart(3, "0");
  return `${QUESTION_CODE_PREFIX}${padded}`;
}

/**
 * Server Action: Create a new question (formal ask).
 * Only callable by authenticated participants.
 */
export async function createQuestion(
  _prevState: CreateQuestionResult | null,
  formData: FormData
): Promise<CreateQuestionResult> {
  const session = await requireParticipantSession();
  const content = (formData.get("content") as string)?.trim();

  if (!content) {
    return { success: false, error: "請輸入問題內容" };
  }

  if (content.length > 2000) {
    return { success: false, error: "問題內容不可超過 2000 字" };
  }

  const supabase = createServerSupabaseClient();
  const source = (formData.get("source") as string) || "manual";
  const idempotencyKey = (formData.get("idempotency_key") as string) || null;

  // Idempotency check: if a question with the same idempotency_key exists, return it
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from("questions")
      .select("question_code")
      .eq("participant_id", session.participantId)
      .eq("content", content)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return { success: true, question_code: existing.question_code };
    }
  }

  // Generate question code with retry for uniqueness
  let questionCode = await generateQuestionCode(supabase);
  let retries = 3;

  while (retries > 0) {
    const { data, error } = await supabase
      .from("questions")
      .insert({
        question_code: questionCode,
        participant_id: session.participantId,
        content,
        status: "pending",
        source: source === "ai_handoff" ? "ai_handoff" : "manual",
      })
      .select("question_code")
      .single();

    if (!error && data) {
      revalidatePath("/qa");
      revalidatePath("/staff");
      return { success: true, question_code: data.question_code };
    }

    // If uniqueness violation, retry with incremented code
    if (error?.code === "23505") {
      retries--;
      const currentNum = parseInt(questionCode.replace(QUESTION_CODE_PREFIX, ""), 10);
      questionCode = `${QUESTION_CODE_PREFIX}${String(currentNum + 1).padStart(3, "0")}`;
      continue;
    }

    console.error("Failed to create question:", error);
    return { success: false, error: "發問失敗，請稍後再試" };
  }

  return { success: false, error: "發問失敗，請稍後再試" };
}
