"use server";

import { revalidatePath } from "next/cache";
import { requireStaffIdentity } from "@/lib/dal/auth-check";
import { createServerSupabaseClient } from "@/lib/utils/supabase";
import {
  lookupParticipantByCode,
  getAttendanceStatus,
  type ParticipantLookupResult,
} from "@/lib/dal/attendance";

export interface CheckInResult {
  success: boolean;
  error?: string;
  /** Returned on success or duplicate so the UI can display the result card */
  participant?: ParticipantLookupResult;
  is_checked_in?: boolean;
  /** 'created' = newly checked-in, 'already' = was already checked-in, 'undone' = undo success */
  outcome?: "created" | "already" | "undone";
}

/**
 * Server Action: Check-in a participant by their 3-char code.
 * - Not found → error
 * - Already checked-in → returns participant info + is_checked_in true
 * - Not yet checked-in → creates attendance log, returns success
 */
export async function checkInParticipant(
  _prevState: CheckInResult | null,
  formData: FormData
): Promise<CheckInResult> {
  const session = await requireStaffIdentity();
  const code = (formData.get("code") as string)?.trim();
  const idempotencyKey = formData.get("idempotency_key") as string;

  if (!code) {
    return { success: false, error: "請輸入學員編號" };
  }

  const participant = await lookupParticipantByCode(code);
  if (!participant) {
    return { success: false, error: "編號查詢不到" };
  }

  // Check current status
  const status = await getAttendanceStatus(participant.id);

  if (status.is_checked_in) {
    return {
      success: true,
      participant,
      is_checked_in: true,
      outcome: "already",
    };
  }

  // Perform check-in
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("attendance_logs").insert({
    participant_id: participant.id,
    action: "check_in",
    operated_by_staff_id: session.selectedStaffId,
    idempotency_key: idempotencyKey || crypto.randomUUID(),
  });

  if (error) {
    // Idempotency key conflict → treat as success (duplicate submit)
    if (error.code === "23505" && error.message?.includes("idempotency")) {
      return {
        success: true,
        participant,
        is_checked_in: true,
        outcome: "created",
      };
    }
    console.error("Failed to check in:", error);
    return { success: false, error: "報到失敗，請稍後再試" };
  }

  revalidatePath("/staff");

  return {
    success: true,
    participant,
    is_checked_in: true,
    outcome: "created",
  };
}

/**
 * Server Action: Undo check-in for a participant.
 */
export async function undoCheckIn(
  _prevState: CheckInResult | null,
  formData: FormData
): Promise<CheckInResult> {
  const session = await requireStaffIdentity();
  const participantId = formData.get("participant_id") as string;
  const code = formData.get("code") as string;
  const idempotencyKey = formData.get("idempotency_key") as string;

  if (!participantId) {
    return { success: false, error: "缺少學員資料" };
  }

  // Verify current status is checked-in
  const status = await getAttendanceStatus(participantId);
  if (!status.is_checked_in) {
    return { success: false, error: "此學員尚未報到" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("attendance_logs").insert({
    participant_id: participantId,
    action: "undo_check_in",
    operated_by_staff_id: session.selectedStaffId,
    idempotency_key: idempotencyKey || crypto.randomUUID(),
  });

  if (error) {
    if (error.code === "23505" && error.message?.includes("idempotency")) {
      // Duplicate undo — retrieve participant for display
      const participant = await lookupParticipantByCode(code);
      return {
        success: true,
        participant: participant ?? undefined,
        is_checked_in: false,
        outcome: "undone",
      };
    }
    console.error("Failed to undo check-in:", error);
    return { success: false, error: "撤回報到失敗，請稍後再試" };
  }

  revalidatePath("/staff");

  const participant = await lookupParticipantByCode(code);
  return {
    success: true,
    participant: participant ?? undefined,
    is_checked_in: false,
    outcome: "undone",
  };
}
