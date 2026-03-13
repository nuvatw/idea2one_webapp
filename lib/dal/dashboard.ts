"use server";

import { createServerSupabaseClient } from "@/lib/utils/supabase";
import type { DashboardStats } from "@/types/dto";
import { getCheckedInCount } from "@/lib/dal/attendance";
import { getLunchClaimedCount } from "@/lib/dal/lunch";

/**
 * Fetch all six dashboard stats in parallel.
 * - checked_in / not_checked_in: derived from attendance_logs
 * - lunch_picked_up / lunch_not_picked_up: derived from lunch_logs count vs total participants
 * - total_questions / pending_questions: from questions table
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createServerSupabaseClient();

  const [
    totalParticipantsResult,
    checkedInCount,
    lunchClaimedCount,
    totalQuestionsResult,
    pendingQuestionsResult,
  ] = await Promise.all([
    supabase
      .from("participants")
      .select("*", { count: "exact", head: true }),
    getCheckedInCount(),
    getLunchClaimedCount(),
    supabase
      .from("questions")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const totalParticipants = totalParticipantsResult.count ?? 0;
  const totalQuestions = totalQuestionsResult.count ?? 0;
  const pendingQuestions = pendingQuestionsResult.count ?? 0;

  return {
    checked_in_count: checkedInCount,
    not_checked_in_count: totalParticipants - checkedInCount,
    lunch_picked_up_count: lunchClaimedCount,
    lunch_not_picked_up_count: totalParticipants - lunchClaimedCount,
    total_questions: totalQuestions,
    pending_questions: pendingQuestions,
  };
}
