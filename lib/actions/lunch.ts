"use server";

import { revalidatePath } from "next/cache";
import { requireStaffIdentity } from "@/lib/dal/auth-check";
import { createServerSupabaseClient } from "@/lib/utils/supabase";
import {
  getParticipantLunchInfo,
  type ParticipantLunchInfo,
} from "@/lib/dal/lunch";

export interface MarkLunchResult {
  success: boolean;
  error?: string;
  participant?: ParticipantLunchInfo;
  /** 'created' = newly marked, 'already' = was already claimed, 'undone' = undo success */
  outcome?: "created" | "already" | "undone";
}

/**
 * Server Action: Mark lunch as claimed for a participant by their 3-char code.
 * - Not found → error
 * - Already claimed → returns info with outcome 'already'
 * - Not yet claimed → creates lunch_log, returns success
 */
export async function markLunchClaimed(
  _prevState: MarkLunchResult | null,
  formData: FormData
): Promise<MarkLunchResult> {
  const session = await requireStaffIdentity();
  const code = (formData.get("code") as string)?.trim();
  const idempotencyKey = formData.get("idempotency_key") as string;

  if (!code) {
    return { success: false, error: "請輸入學員編號" };
  }

  const info = await getParticipantLunchInfo(code);
  if (!info) {
    return { success: false, error: "編號查詢不到" };
  }

  if (info.has_claimed) {
    return {
      success: true,
      participant: info,
      outcome: "already",
    };
  }

  // Insert lunch log
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("lunch_logs").insert({
    participant_id: info.participant_id,
    operated_by_staff_id: session.selectedStaffId,
    idempotency_key: idempotencyKey || crypto.randomUUID(),
  });

  if (error) {
    // participant_id unique constraint → already claimed (race condition)
    if (error.code === "23505") {
      return {
        success: true,
        participant: { ...info, has_claimed: true },
        outcome: "already",
      };
    }
    console.error("Failed to mark lunch:", error);
    return { success: false, error: "標記午餐失敗，請稍後再試" };
  }

  revalidatePath("/staff");
  revalidatePath("/home");

  return {
    success: true,
    participant: { ...info, has_claimed: true },
    outcome: "created",
  };
}

/**
 * Server Action: Undo lunch claim for a participant.
 * Deletes the lunch_log row for the given participant.
 */
export async function undoLunchClaim(
  _prevState: MarkLunchResult | null,
  formData: FormData
): Promise<MarkLunchResult> {
  await requireStaffIdentity();
  const participantId = formData.get("participant_id") as string;
  const code = formData.get("code") as string;

  if (!participantId) {
    return { success: false, error: "缺少學員資料" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("lunch_logs")
    .delete()
    .eq("participant_id", participantId);

  if (error) {
    console.error("Failed to undo lunch claim:", error);
    return { success: false, error: "撤回領取失敗，請稍後再試" };
  }

  revalidatePath("/staff");
  revalidatePath("/home");

  const participant = code ? await getParticipantLunchInfo(code) : null;
  return {
    success: true,
    participant: participant ?? undefined,
    outcome: "undone",
  };
}
