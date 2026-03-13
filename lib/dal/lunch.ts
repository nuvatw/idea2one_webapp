"use server";

import { createServerSupabaseClient } from "@/lib/utils/supabase";
import type { LunchDisplayStatus } from "@/types/dto";
import type { DietType } from "@/types/domain";

/**
 * Get lunch pickup status for a participant (used by 法法 home page).
 * Presence of a row in lunch_logs = picked up.
 */
export async function getParticipantLunchStatus(
  participantId: string
): Promise<LunchDisplayStatus> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("lunch_logs")
      .select("id")
      .eq("participant_id", participantId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch lunch status:", error);
      return "unknown";
    }

    return data ? "claimed" : "not_claimed";
  } catch (err) {
    console.error("Unexpected error fetching lunch status:", err);
    return "unknown";
  }
}

export interface ParticipantLunchInfo {
  participant_id: string;
  participant_code: string;
  name: string;
  diet_type: DietType;
  has_claimed: boolean;
}

/**
 * Lookup participant + lunch status by code (used by 努努 LunchManagementPanel).
 */
export async function getParticipantLunchInfo(
  code: string
): Promise<ParticipantLunchInfo | null> {
  const supabase = createServerSupabaseClient();

  const { data: participant, error: pError } = await supabase
    .from("participants")
    .select("id, participant_code, name, diet_type")
    .eq("participant_code", code)
    .maybeSingle();

  if (pError || !participant) {
    if (pError) console.error("Failed to lookup participant for lunch:", pError);
    return null;
  }

  const { data: lunchLog, error: lError } = await supabase
    .from("lunch_logs")
    .select("id")
    .eq("participant_id", participant.id)
    .maybeSingle();

  if (lError) {
    console.error("Failed to check lunch status:", lError);
  }

  return {
    participant_id: participant.id,
    participant_code: participant.participant_code,
    name: participant.name,
    diet_type: participant.diet_type as DietType,
    has_claimed: !!lunchLog,
  };
}

export interface ParticipantWithLunchStatus {
  id: string;
  participant_code: string;
  name: string;
  diet_type: DietType;
  has_claimed: boolean;
  claimed_at: string | null;
}

/**
 * Get all participants with their lunch pickup status.
 * Used by the staff lunch management panel.
 */
export async function getAllParticipantsWithLunchStatus(): Promise<ParticipantWithLunchStatus[]> {
  const supabase = createServerSupabaseClient();

  const [participantsResult, lunchResult] = await Promise.all([
    supabase
      .from("participants")
      .select("id, participant_code, name, diet_type")
      .order("participant_code"),
    supabase
      .from("lunch_logs")
      .select("participant_id, created_at"),
  ]);

  if (participantsResult.error) {
    console.error("Failed to fetch participants:", participantsResult.error);
    return [];
  }

  const lunchMap = new Map<string, string>();
  if (lunchResult.data) {
    for (const log of lunchResult.data) {
      lunchMap.set(log.participant_id, log.created_at);
    }
  }

  return (participantsResult.data ?? []).map((p) => {
    const claimedAt = lunchMap.get(p.id) ?? null;
    return {
      id: p.id,
      participant_code: p.participant_code,
      name: p.name,
      diet_type: p.diet_type as DietType,
      has_claimed: !!claimedAt,
      claimed_at: claimedAt,
    };
  });
}

/**
 * Count participants who have picked up lunch (for dashboard).
 */
export async function getLunchClaimedCount(): Promise<number> {
  const supabase = createServerSupabaseClient();

  const { count, error } = await supabase
    .from("lunch_logs")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Failed to count lunch claims:", error);
    return 0;
  }

  return count ?? 0;
}
