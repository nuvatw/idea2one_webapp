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

/**
 * Server Action: Set the current active participant (FaFa) agenda stage.
 * Independent from staff agenda.
 */
export async function setCurrentParticipantAgenda(
  _prevState: SetCurrentAgendaResult | null,
  formData: FormData
): Promise<SetCurrentAgendaResult> {
  const session = await requireStaffIdentity();

  if (!STAGE_SWITCH_ALLOWED_STAFF.includes(session.selectedStaffName)) {
    return { success: false, error: "你沒有切換階段的權限" };
  }

  const agendaItemId = formData.get("agendaItemId") as string;

  if (!agendaItemId) {
    return { success: false, error: "請選擇一個階段" };
  }

  const supabase = createServerSupabaseClient();

  const { data: agendaItem, error: fetchError } = await supabase
    .from("agenda_items")
    .select("id")
    .eq("id", agendaItemId)
    .single();

  if (fetchError || !agendaItem) {
    return { success: false, error: "找不到指定的階段" };
  }

  const { error: updateError } = await supabase
    .from("activity_state")
    .update({
      current_participant_agenda_item_id: agendaItemId,
      updated_by_staff_id: session.selectedStaffId,
      updated_at: new Date().toISOString(),
    })
    .eq("singleton_key", "current");

  if (updateError) {
    console.error("Failed to update participant agenda:", updateError);
    return { success: false, error: "切換失敗，請稍後再試" };
  }

  revalidatePath("/agenda");
  revalidatePath("/home");
  revalidatePath("/staff");

  return { success: true };
}

export interface UpdateAgendaItemResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: Update an agenda item's display fields.
 * Only callable by allowed staff (Asa/Lily/上哲).
 */
export async function updateAgendaItem(
  _prevState: UpdateAgendaItemResult | null,
  formData: FormData
): Promise<UpdateAgendaItemResult> {
  const session = await requireStaffIdentity();

  if (!STAGE_SWITCH_ALLOWED_STAFF.includes(session.selectedStaffName)) {
    return { success: false, error: "你沒有修改的權限" };
  }

  const agendaItemId = formData.get("agendaItemId") as string;
  const startTime = (formData.get("start_time") as string)?.trim() ?? "";
  const endTime = (formData.get("end_time") as string)?.trim() ?? "";
  const stageName = (formData.get("stage_name") as string)?.trim() ?? "";
  const descriptionMarkdown =
    (formData.get("description_markdown") as string)?.trim() || null;

  if (!agendaItemId) {
    return { success: false, error: "缺少行程 ID" };
  }

  if (!startTime) {
    return { success: false, error: "請填入開始時間" };
  }

  if (!stageName) {
    return { success: false, error: "請填入主旨" };
  }

  // Compose time_label from start/end
  const timeLabel = endTime ? `${startTime}–${endTime}` : startTime;

  const supabase = createServerSupabaseClient();

  const { error: updateError } = await supabase
    .from("agenda_items")
    .update({
      time_label: timeLabel,
      stage_name: stageName,
      description_markdown: descriptionMarkdown,
      updated_by_staff_id: session.selectedStaffId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agendaItemId);

  if (updateError) {
    console.error("Failed to update agenda item:", updateError);
    return { success: false, error: "儲存失敗，請稍後再試" };
  }

  revalidatePath("/agenda");
  revalidatePath("/home");
  revalidatePath("/staff");

  return { success: true };
}
