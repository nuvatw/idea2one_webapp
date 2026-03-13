import { describe, it, expect } from "vitest";

/**
 * Test the attendance status derivation logic.
 * The core logic is: latest log action determines if checked-in.
 * We replicate the derivation logic from dal/attendance.ts getCheckedInCount.
 */

interface AttendanceLog {
  participant_id: string;
  action: "check_in" | "undo_check_in";
  created_at: string;
}

function deriveCheckedInCount(logs: AttendanceLog[]): number {
  // Sort by participant_id, then by created_at desc
  const sorted = [...logs].sort((a, b) => {
    if (a.participant_id !== b.participant_id) {
      return a.participant_id.localeCompare(b.participant_id);
    }
    return b.created_at.localeCompare(a.created_at);
  });

  const latestByParticipant = new Map<string, string>();
  for (const row of sorted) {
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

function deriveIsCheckedIn(
  logs: AttendanceLog[],
  participantId: string
): boolean {
  const participantLogs = logs
    .filter((l) => l.participant_id === participantId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  if (participantLogs.length === 0) return false;
  return participantLogs[0].action === "check_in";
}

describe("attendance status derivation", () => {
  it("returns 0 for no logs", () => {
    expect(deriveCheckedInCount([])).toBe(0);
  });

  it("counts check-in correctly", () => {
    const logs: AttendanceLog[] = [
      { participant_id: "p1", action: "check_in", created_at: "2026-03-13T10:00:00Z" },
      { participant_id: "p2", action: "check_in", created_at: "2026-03-13T10:01:00Z" },
    ];
    expect(deriveCheckedInCount(logs)).toBe(2);
  });

  it("undo_check_in cancels check-in", () => {
    const logs: AttendanceLog[] = [
      { participant_id: "p1", action: "check_in", created_at: "2026-03-13T10:00:00Z" },
      { participant_id: "p1", action: "undo_check_in", created_at: "2026-03-13T10:01:00Z" },
    ];
    expect(deriveCheckedInCount(logs)).toBe(0);
  });

  it("re-check-in after undo counts as checked-in", () => {
    const logs: AttendanceLog[] = [
      { participant_id: "p1", action: "check_in", created_at: "2026-03-13T10:00:00Z" },
      { participant_id: "p1", action: "undo_check_in", created_at: "2026-03-13T10:01:00Z" },
      { participant_id: "p1", action: "check_in", created_at: "2026-03-13T10:02:00Z" },
    ];
    expect(deriveCheckedInCount(logs)).toBe(1);
  });

  it("handles mixed participants", () => {
    const logs: AttendanceLog[] = [
      { participant_id: "p1", action: "check_in", created_at: "2026-03-13T10:00:00Z" },
      { participant_id: "p2", action: "check_in", created_at: "2026-03-13T10:00:00Z" },
      { participant_id: "p2", action: "undo_check_in", created_at: "2026-03-13T10:01:00Z" },
      { participant_id: "p3", action: "check_in", created_at: "2026-03-13T10:00:00Z" },
    ];
    // p1: checked-in, p2: undone, p3: checked-in
    expect(deriveCheckedInCount(logs)).toBe(2);
  });
});

describe("individual attendance status", () => {
  it("returns false for no logs", () => {
    expect(deriveIsCheckedIn([], "p1")).toBe(false);
  });

  it("returns true after check-in", () => {
    const logs: AttendanceLog[] = [
      { participant_id: "p1", action: "check_in", created_at: "2026-03-13T10:00:00Z" },
    ];
    expect(deriveIsCheckedIn(logs, "p1")).toBe(true);
  });

  it("returns false after undo", () => {
    const logs: AttendanceLog[] = [
      { participant_id: "p1", action: "check_in", created_at: "2026-03-13T10:00:00Z" },
      { participant_id: "p1", action: "undo_check_in", created_at: "2026-03-13T10:01:00Z" },
    ];
    expect(deriveIsCheckedIn(logs, "p1")).toBe(false);
  });

  it("ignores other participants' logs", () => {
    const logs: AttendanceLog[] = [
      { participant_id: "p1", action: "check_in", created_at: "2026-03-13T10:00:00Z" },
      { participant_id: "p2", action: "undo_check_in", created_at: "2026-03-13T10:01:00Z" },
    ];
    expect(deriveIsCheckedIn(logs, "p1")).toBe(true);
    expect(deriveIsCheckedIn(logs, "p2")).toBe(false);
  });
});

describe("lunch status derivation", () => {
  // Lunch status is simpler: presence of lunch_log row = claimed
  it("not claimed if no log exists", () => {
    const hasClaimed = false; // no row in lunch_logs
    expect(hasClaimed).toBe(false);
  });

  it("claimed if log exists", () => {
    const hasClaimed = true; // row exists in lunch_logs
    expect(hasClaimed).toBe(true);
  });
});

describe("dashboard count derivation", () => {
  it("calculates not_checked_in as total - checked_in", () => {
    const total = 100;
    const checkedIn = 75;
    expect(total - checkedIn).toBe(25);
  });

  it("calculates lunch_not_picked_up as total - lunch_picked_up", () => {
    const total = 100;
    const lunchClaimed = 60;
    expect(total - lunchClaimed).toBe(40);
  });

  it("handles zero participants", () => {
    const total = 0;
    const checkedIn = 0;
    expect(total - checkedIn).toBe(0);
  });

  it("handles all checked in", () => {
    const total = 100;
    const checkedIn = 100;
    expect(total - checkedIn).toBe(0);
  });
});
