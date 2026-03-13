"use server";

import { revalidatePath } from "next/cache";
import { requireStaffIdentity } from "@/lib/dal/auth-check";
import { createServerSupabaseClient } from "@/lib/utils/supabase";
import { STAGE_SWITCH_ALLOWED_STAFF } from "@/lib/constants";

export interface UpdateEventStartTimeResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: Update the event start time in activity_state.
 * Only Lily/Asa can update this setting.
 */
export async function updateEventStartTime(
  _prevState: UpdateEventStartTimeResult | null,
  formData: FormData
): Promise<UpdateEventStartTimeResult> {
  const session = await requireStaffIdentity();

  if (!STAGE_SWITCH_ALLOWED_STAFF.includes(session.selectedStaffName)) {
    return { success: false, error: "你沒有修改設定的權限" };
  }

  const eventStartAt = formData.get("event_start_at") as string;
  if (!eventStartAt) {
    return { success: false, error: "請選擇開放時間" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("activity_state")
    .update({
      event_start_at: new Date(eventStartAt).toISOString(),
      updated_by_staff_id: session.selectedStaffId,
      updated_at: new Date().toISOString(),
    })
    .eq("singleton_key", "current");

  if (error) {
    console.error("Failed to update event start time:", error);
    return { success: false, error: "儲存失敗，請稍後再試" };
  }

  revalidatePath("/staff");
  revalidatePath("/home");

  return { success: true };
}
