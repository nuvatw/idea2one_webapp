"use server";

import { createServerSupabaseClient } from "@/lib/utils/supabase";
import type { AgendaItemSummary } from "@/types/dto";

/**
 * Maps a staff agenda sort_order to the corresponding participant item sort_order.
 * Used to determine which participant item should be marked "current"
 * when the activity_state points to a detailed staff item.
 */
function mapStaffSortToParticipantSort(staffSort: number): number | null {
  if (staffSort >= 7 && staffSort <= 8) return 101;    // 報到
  if (staffSort === 9) return 102;                      // 分組
  if (staffSort >= 10 && staffSort <= 11) return 103;   // 上哲 S2P + 休息
  if (staffSort >= 12 && staffSort <= 13) return 104;   // Jeremy How to Pitch + 遊戲規則
  if (staffSort === 14) return 105;                     // 領午餐
  if (staffSort >= 15 && staffSort <= 16) return 106;   // Prototype 衝刺
  if (staffSort >= 17 && staffSort <= 18) return 107;   // Pitch Round A + 休息
  if (staffSort >= 19 && staffSort <= 20) return 108;   // Pitch Round B + 投票
  if (staffSort === 21) return 109;                     // 投資時間
  if (staffSort === 22) return 110;                     // 優秀作品舞台分享
  if (staffSort >= 23 && staffSort <= 24) return 111;   // 活動收尾
  return null; // Before event or after event — no participant item current
}

/**
 * Fetch all agenda items with current stage info.
 * Returns items sorted by sort_order, with is_current flag.
 * @param participantOnly - if true, only return items where visible_to_participants = true
 */
export async function getAgendaWithCurrentStage(
  options?: { participantOnly?: boolean }
): Promise<{
  items: AgendaItemSummary[];
  currentAgendaItemId: string | null;
}> {
  const supabase = createServerSupabaseClient();

  // Fetch activity state to get current agenda item id
  const { data: activityState, error: stateError } = await supabase
    .from("activity_state")
    .select("current_agenda_item_id, current_participant_agenda_item_id")
    .eq("singleton_key", "current")
    .single();

  if (stateError) {
    console.error(
      "Failed to fetch activity state:",
      stateError.message,
      stateError.code
    );
  }

  const currentAgendaItemId = activityState?.current_agenda_item_id ?? null;

  // Fetch agenda items (optionally filtered by visible_to_participants)
  let query = supabase
    .from("agenda_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (options?.participantOnly) {
    query = query.eq("visible_to_participants", true);
  }

  const { data: agendaItems, error: agendaError } = await query;

  if (agendaError) {
    console.error(
      "Failed to fetch agenda items:",
      agendaError.message,
      agendaError.code,
      agendaError.details,
      agendaError.hint
    );
    return { items: [], currentAgendaItemId: null };
  }

  // For participant view: use independent participant agenda pointer if set,
  // otherwise fall back to mapping from staff item
  if (options?.participantOnly) {
    const participantAgendaId =
      activityState?.current_participant_agenda_item_id ?? null;

    let targetParticipantSort: number | null = null;

    if (participantAgendaId) {
      // Direct participant pointer — find its sort_order
      const match = (agendaItems ?? []).find((i) => i.id === participantAgendaId);
      targetParticipantSort = match?.sort_order ?? null;
    } else if (currentAgendaItemId) {
      // Fallback: map from staff item
      const { data: currentStaffItem } = await supabase
        .from("agenda_items")
        .select("sort_order")
        .eq("id", currentAgendaItemId)
        .single();

      targetParticipantSort = currentStaffItem
        ? mapStaffSortToParticipantSort(currentStaffItem.sort_order)
        : null;
    }

    const items: AgendaItemSummary[] = (agendaItems ?? []).map((item) => ({
      id: item.id,
      sort_order: item.sort_order,
      time_label: item.time_label,
      stage_name: item.stage_name,
      task: item.task,
      description_markdown: item.description_markdown,
      notice_markdown: item.notice_markdown,
      is_current: item.sort_order === targetParticipantSort,
    }));

    const currentParticipantId =
      items.find((i) => i.is_current)?.id ?? null;

    return { items, currentAgendaItemId: currentParticipantId };
  }

  const items: AgendaItemSummary[] = (agendaItems ?? []).map((item) => ({
    id: item.id,
    sort_order: item.sort_order,
    time_label: item.time_label,
    stage_name: item.stage_name,
    task: item.task,
    description_markdown: item.description_markdown,
    notice_markdown: item.notice_markdown,
    is_current: item.id === currentAgendaItemId,
  }));

  return { items, currentAgendaItemId };
}

/**
 * Fetch the current participant agenda item ID from activity_state.
 */
export async function getCurrentParticipantAgendaItemId(): Promise<string | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("activity_state")
    .select("current_participant_agenda_item_id")
    .eq("singleton_key", "current")
    .single();

  if (error) {
    console.error("Failed to fetch participant agenda state:", error);
    return null;
  }

  return data?.current_participant_agenda_item_id ?? null;
}

/**
 * Fetch only the current agenda item (for auto-refresh).
 * Lighter query than getAgendaWithCurrentStage.
 */
export async function getCurrentAgendaItem(): Promise<AgendaItemSummary | null> {
  const supabase = createServerSupabaseClient();

  const { data: activityState, error: stateError } = await supabase
    .from("activity_state")
    .select("current_agenda_item_id")
    .eq("singleton_key", "current")
    .single();

  if (stateError || !activityState?.current_agenda_item_id) {
    return null;
  }

  const { data: item, error: itemError } = await supabase
    .from("agenda_items")
    .select("*")
    .eq("id", activityState.current_agenda_item_id)
    .single();

  if (itemError || !item) {
    return null;
  }

  return {
    id: item.id,
    sort_order: item.sort_order,
    time_label: item.time_label,
    stage_name: item.stage_name,
    task: item.task,
    description_markdown: item.description_markdown,
    notice_markdown: item.notice_markdown,
    is_current: true,
  };
}
