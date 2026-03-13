"use server";

import { createServerSupabaseClient } from "@/lib/utils/supabase";
import type { StaffAgendaItemDTO } from "@/types/dto";

/**
 * Fetch personalized agenda assignments for a specific staff member.
 * Joins staff_agenda_assignments with agenda_items and checks current stage.
 */
export async function getStaffAgendaAssignments(
  staffId: string
): Promise<StaffAgendaItemDTO[]> {
  const supabase = createServerSupabaseClient();

  // Get current agenda item id
  const { data: activityState } = await supabase
    .from("activity_state")
    .select("current_agenda_item_id")
    .eq("singleton_key", "current")
    .single();

  const currentAgendaItemId = activityState?.current_agenda_item_id ?? null;

  // Fetch assignments with agenda item details
  const { data: assignments, error } = await supabase
    .from("staff_agenda_assignments")
    .select(
      `
      id,
      agenda_item_id,
      duty_label,
      location,
      incident_note_markdown,
      agenda_items (
        sort_order,
        time_label,
        stage_name,
        task
      )
    `
    )
    .eq("staff_id", staffId)
    .order("agenda_items(sort_order)", { ascending: true });

  if (error) {
    console.error("Failed to fetch staff agenda assignments:", error);
    return [];
  }

  return (assignments ?? [])
    .filter((a) => a.agenda_items)
    .map((a) => {
      const agenda = a.agenda_items as unknown as {
        sort_order: number;
        time_label: string;
        stage_name: string;
        task: string;
      };
      return {
        id: a.id,
        agenda_item_id: a.agenda_item_id,
        sort_order: agenda.sort_order,
        time_label: agenda.time_label,
        stage_name: agenda.stage_name,
        task: agenda.task,
        duty_label: a.duty_label,
        location: a.location,
        incident_note_markdown: a.incident_note_markdown,
        is_current: a.agenda_item_id === currentAgendaItemId,
      };
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}
