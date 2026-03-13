"use server";

import { createServerSupabaseClient } from "@/lib/utils/supabase";

/**
 * Get the event start time from activity_state.
 * Used for pre-check-in countdown timer.
 */
export async function getActivityStartTime(): Promise<string | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("activity_state")
    .select("event_start_at")
    .eq("singleton_key", "current")
    .single();

  if (error) {
    console.error("Failed to fetch activity start time:", error);
    return null;
  }

  return data?.event_start_at ?? null;
}
