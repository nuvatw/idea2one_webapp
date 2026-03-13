"use server";

import { revalidatePath } from "next/cache";
import { requireStaffIdentity } from "@/lib/dal/auth-check";
import { createServerSupabaseClient } from "@/lib/utils/supabase";

export interface SaveAgendaContentResult {
  success: boolean;
  error?: string;
  updatedAt?: string;
  updatedByName?: string;
}

/**
 * Server Action: Save agenda item markdown content (description + notice).
 * Last-write-wins — no version history.
 */
export async function saveAgendaContent(
  _prevState: SaveAgendaContentResult | null,
  formData: FormData
): Promise<SaveAgendaContentResult> {
  const session = await requireStaffIdentity();
  const agendaItemId = formData.get("agenda_item_id") as string;
  const descriptionMarkdown = formData.get("description_markdown") as string;
  const noticeMarkdown = formData.get("notice_markdown") as string;

  if (!agendaItemId) {
    return { success: false, error: "缺少 agenda 項目 ID" };
  }

  const supabase = createServerSupabaseClient();
  const now = new Date().toISOString();

  // Verify the agenda item exists
  const { data: existing, error: fetchError } = await supabase
    .from("agenda_items")
    .select("id")
    .eq("id", agendaItemId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "找不到指定的 agenda 項目" };
  }

  const { error: updateError } = await supabase
    .from("agenda_items")
    .update({
      description_markdown: descriptionMarkdown || null,
      notice_markdown: noticeMarkdown || null,
      updated_by_staff_id: session.selectedStaffId,
      updated_at: now,
    })
    .eq("id", agendaItemId);

  if (updateError) {
    console.error("Failed to save agenda content:", updateError);
    return { success: false, error: "儲存失敗，請稍後再試" };
  }

  revalidatePath("/staff");
  revalidatePath("/home");

  return {
    success: true,
    updatedAt: now,
    updatedByName: session.selectedStaffName,
  };
}
