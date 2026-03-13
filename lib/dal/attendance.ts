"use server";

import { createServerSupabaseClient } from "@/lib/utils/supabase";
import type { AttendanceAction, DietType } from "@/types/domain";

export interface ParticipantLookupResult {
  id: string;
  participant_code: string;
  name: string;
  email: string;
  diet_type: DietType;
}

export interface AttendanceStatus {
  participant: ParticipantLookupResult;
  is_checked_in: boolean;
  latest_action: AttendanceAction | null;
  latest_at: string | null;
}

/**
 * Lookup a participant by their 3-char code.
 * Returns null if not found.
 */
export async function lookupParticipantByCode(
  code: string
): Promise<ParticipantLookupResult | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("participants")
    .select("id, participant_code, name, email, diet_type")
    .eq("participant_code", code)
    .maybeSingle();

  if (error) {
    console.error("Failed to lookup participant:", error);
    return null;
  }

  return data as ParticipantLookupResult | null;
}

/**
 * Get the current attendance status for a participant.
 * Status is derived from the latest attendance_log entry.
 */
export async function getAttendanceStatus(
  participantId: string
): Promise<{ is_checked_in: boolean; latest_action: AttendanceAction | null; latest_at: string | null }> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("attendance_logs")
    .select("action, created_at")
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch attendance status:", error);
    return { is_checked_in: false, latest_action: null, latest_at: null };
  }

  if (!data) {
    return { is_checked_in: false, latest_action: null, latest_at: null };
  }

  return {
    is_checked_in: data.action === "check_in",
    latest_action: data.action as AttendanceAction,
    latest_at: data.created_at,
  };
}

/**
 * Get full attendance status including participant info.
 */
export async function getFullAttendanceStatus(
  code: string
): Promise<AttendanceStatus | null> {
  const participant = await lookupParticipantByCode(code);
  if (!participant) return null;

  const status = await getAttendanceStatus(participant.id);

  return {
    participant,
    ...status,
  };
}

export interface ParticipantWithAttendanceStatus {
  id: string;
  participant_code: string;
  name: string;
  diet_type: DietType;
  is_checked_in: boolean;
  checked_in_at: string | null;
}

/**
 * Get all participants with their attendance status.
 * Used by the staff check-in management panel.
 */
export async function getAllParticipantsWithStatus(): Promise<ParticipantWithAttendanceStatus[]> {
  const supabase = createServerSupabaseClient();

  const [participantsResult, logsResult] = await Promise.all([
    supabase
      .from("participants")
      .select("id, participant_code, name, diet_type")
      .order("participant_code"),
    supabase
      .from("attendance_logs")
      .select("participant_id, action, created_at")
      .order("created_at", { ascending: false }),
  ]);

  if (participantsResult.error) {
    console.error("Failed to fetch participants:", participantsResult.error);
    return [];
  }

  // Build latest action map per participant
  const latestByParticipant = new Map<string, { action: string; created_at: string }>();
  if (logsResult.data) {
    for (const log of logsResult.data) {
      if (!latestByParticipant.has(log.participant_id)) {
        latestByParticipant.set(log.participant_id, {
          action: log.action,
          created_at: log.created_at,
        });
      }
    }
  }

  return (participantsResult.data ?? []).map((p) => {
    const latest = latestByParticipant.get(p.id);
    const isCheckedIn = latest?.action === "check_in";
    return {
      id: p.id,
      participant_code: p.participant_code,
      name: p.name,
      diet_type: p.diet_type as DietType,
      is_checked_in: isCheckedIn,
      checked_in_at: isCheckedIn ? latest!.created_at : null,
    };
  });
}

/**
 * Count checked-in participants (for dashboard).
 * A participant is checked-in if their latest attendance log action is 'check_in'.
 */
export async function getCheckedInCount(): Promise<number> {
  const supabase = createServerSupabaseClient();

  // Use a distinct on participant_id, ordered by created_at desc, to get latest log per participant
  const { data, error } = await supabase
    .from("attendance_logs")
    .select("participant_id, action, created_at")
    .order("participant_id")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to count checked-in:", error);
    return 0;
  }

  if (!data || data.length === 0) return 0;

  // Derive: for each participant, take the latest log
  const latestByParticipant = new Map<string, string>();
  for (const row of data) {
    if (!latestByParticipant.has(row.participant_id)) {
      latestByParticipant.set(row.participant_id, row.action);
    }
  }

  let count = 0;
  for (const action of latestByParticipant.values()) {
    if (action === "check_in") count++;
  }

  return count;
}
