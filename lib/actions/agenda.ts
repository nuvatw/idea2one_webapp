"use server";

import { revalidatePath } from "next/cache";
import { requireStaffIdentity } from "@/lib/dal/auth-check";
import { createServerSupabaseClient } from "@/lib/utils/supabase";
import { STAGE_SWITCH_ALLOWED_STAFF } from "@/lib/constants";

export interface SetCurrentAgendaResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: Set the current active agenda stage.
 * Only callable by authenticated staff with identity.
 */
export async function setCurrentAgenda(
  _prevState: SetCurrentAgendaResult | null,
  formData: FormData
): Promise<SetCurrentAgendaResult> {
  const session = await requireStaffIdentity();

  // A1: Only allowed staff can switch agenda stages
  if (!STAGE_SWITCH_ALLOWED_STAFF.includes(session.selectedStaffName)) {
    return { success: false, error: "你沒有切換階段的權限" };
  }

  const agendaItemId = formData.get("agendaItemId") as string;

  if (!agendaItemId) {
    return { success: false, error: "請選擇一個階段" };
  }

  const supabase = createServerSupabaseClient();

  // Verify the agenda item exists
  const { data: agendaItem, error: fetchError } = await supabase
    .from("agenda_items")
    .select("id")
    .eq("id", agendaItemId)
    .single();

  if (fetchError || !agendaItem) {
    return { success: false, error: "找不到指定的階段" };
  }

  // Update activity_state
  const { error: updateError } = await supabase
    .from("activity_state")
    .update({
      current_agenda_item_id: agendaItemId,
      updated_by_staff_id: session.selectedStaffId,
      updated_at: new Date().toISOString(),
    })
    .eq("singleton_key", "current");

  if (updateError) {
    console.error("Failed to update current agenda:", updateError);
    return { success: false, error: "切換失敗，請稍後再試" };
  }

  revalidatePath("/home");
  revalidatePath("/staff");

  return { success: true };
}
