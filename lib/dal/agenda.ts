"use server";

import { createServerSupabaseClient } from "@/lib/utils/supabase";
import type { AgendaItemSummary } from "@/types/dto";

/**
 * Maps a staff agenda sort_order to the corresponding participant item sort_order.
 * Used to determine which participant item should be marked "current"
 * when the activity_state points to a detailed staff item.
 */
function mapStaffSortToParticipantSort(staffSort: number): number | null {
  if (staffSort >= 7 && staffSort <= 8) return 101;   // 報到
  if (staffSort === 9) return 102;                      // 分組
  if (staffSort >= 10 && staffSort <= 13) return 103;   // Seminar
  if (staffSort >= 14 && staffSort <= 16) return 104;   // Idea to One
  if (staffSort >= 17 && staffSort <= 20) return 105;   // Pitch
  if (staffSort >= 21 && staffSort <= 23) return 106;   // 募資
  if (staffSort === 24) return 107;                      // 大合照
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
    .select("current_agenda_item_id")
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

  // For participant view: map current staff item to participant item
  if (options?.participantOnly && currentAgendaItemId) {
    // Look up the current staff item's sort_order
    const { data: currentStaffItem } = await supabase
      .from("agenda_items")
      .select("sort_order")
      .eq("id", currentAgendaItemId)
      .single();

    const targetParticipantSort = currentStaffItem
      ? mapStaffSortToParticipantSort(currentStaffItem.sort_order)
      : null;

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
