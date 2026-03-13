import { describe, it, expect } from "vitest";

/**
 * Unit tests for A1 Agenda permission check.
 * Tests the staff name allowlist logic.
 */

const STAGE_SWITCH_ALLOWED_STAFF = ["Lily", "Asa"];

function canSwitchAgenda(staffName: string): boolean {
  return STAGE_SWITCH_ALLOWED_STAFF.includes(staffName);
}

describe("agenda permission check", () => {
  it("allows Lily to switch agenda", () => {
    expect(canSwitchAgenda("Lily")).toBe(true);
  });

  it("allows Asa to switch agenda", () => {
    expect(canSwitchAgenda("Asa")).toBe(true);
  });

  it("denies other staff members", () => {
    expect(canSwitchAgenda("John")).toBe(false);
    expect(canSwitchAgenda("Alice")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(canSwitchAgenda("lily")).toBe(false);
    expect(canSwitchAgenda("LILY")).toBe(false);
    expect(canSwitchAgenda("asa")).toBe(false);
  });

  it("denies empty string", () => {
    expect(canSwitchAgenda("")).toBe(false);
  });
});
