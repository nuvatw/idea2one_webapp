import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Unit tests for CountdownTimer time calculation logic.
 */

function calcTimeLeft(targetTime: string) {
  const diff = new Date(targetTime).getTime() - Date.now();
  if (diff <= 0) return { total: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    total: diff,
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

describe("countdown timer calculation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns zeros when target time is in the past", () => {
    vi.setSystemTime(new Date("2026-03-14T10:00:00+08:00"));
    const result = calcTimeLeft("2026-03-14T09:30:00+08:00");
    expect(result.total).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });

  it("returns zeros when target time equals now", () => {
    vi.setSystemTime(new Date("2026-03-14T09:30:00+08:00"));
    const result = calcTimeLeft("2026-03-14T09:30:00+08:00");
    expect(result.total).toBe(0);
  });

  it("calculates 1 hour correctly", () => {
    vi.setSystemTime(new Date("2026-03-14T08:30:00+08:00"));
    const result = calcTimeLeft("2026-03-14T09:30:00+08:00");
    expect(result.hours).toBe(1);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });

  it("calculates hours, minutes, seconds correctly", () => {
    vi.setSystemTime(new Date("2026-03-14T07:15:30+08:00"));
    const result = calcTimeLeft("2026-03-14T09:30:00+08:00");
    expect(result.hours).toBe(2);
    expect(result.minutes).toBe(14);
    expect(result.seconds).toBe(30);
  });

  it("handles large time differences", () => {
    vi.setSystemTime(new Date("2026-03-13T09:30:00+08:00"));
    const result = calcTimeLeft("2026-03-14T09:30:00+08:00");
    expect(result.hours).toBe(24);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });

  it("handles sub-second precision", () => {
    vi.setSystemTime(new Date("2026-03-14T09:29:59.500+08:00"));
    const result = calcTimeLeft("2026-03-14T09:30:00+08:00");
    expect(result.total).toBeGreaterThan(0);
    expect(result.seconds).toBe(0); // 500ms rounds down to 0 seconds
  });
});
