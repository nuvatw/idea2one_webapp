import { describe, it, expect } from "vitest";

/**
 * Unit tests for B6 gating logic.
 * Tests the time-based and check-in status logic used in the participant layout guard.
 */

function determineGateState(
  isCheckedIn: boolean,
  eventStartTime: string | null
): "unlocked" | "pre_event" | "check_in_prompt" {
  if (isCheckedIn) return "unlocked";

  const targetTime = eventStartTime || "2026-03-14T09:30:00+08:00";
  const now = Date.now();
  const target = new Date(targetTime).getTime();

  if (now < target) return "pre_event";
  return "check_in_prompt";
}

describe("gating logic", () => {
  it("unlocks when participant is checked in", () => {
    expect(
      determineGateState(true, "2026-03-14T09:30:00+08:00")
    ).toBe("unlocked");
  });

  it("unlocks even if event time hasn't arrived but checked in", () => {
    expect(
      determineGateState(true, "2099-12-31T23:59:00+08:00")
    ).toBe("unlocked");
  });

  it("shows pre_event when not checked in and time not arrived", () => {
    expect(
      determineGateState(false, "2099-12-31T23:59:00+08:00")
    ).toBe("pre_event");
  });

  it("shows check_in_prompt when not checked in and time arrived", () => {
    expect(
      determineGateState(false, "2020-01-01T00:00:00+08:00")
    ).toBe("check_in_prompt");
  });

  it("uses default time when eventStartTime is null", () => {
    // Default is 2026-03-14T09:30:00+08:00
    const result = determineGateState(false, null);
    // Since today is 2026-03-13, the default time is in the future
    expect(result).toBe("pre_event");
  });
});
