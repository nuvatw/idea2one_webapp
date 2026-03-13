import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () => ({ value: "mock-token" }),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockInsert = vi.fn();

vi.mock("@/lib/utils/supabase", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: (data: unknown) => {
        mockInsert(data);
        return { error: null };
      },
    })),
  })),
}));

vi.mock("@/lib/dal/auth-check", () => ({
  requireStaffIdentity: vi.fn(async () => ({
    selectedStaffId: "staff-uuid-1",
    selectedStaffName: "Staff A",
  })),
}));

const mockLookup = vi.fn();
const mockGetStatus = vi.fn();

vi.mock("@/lib/dal/attendance", () => ({
  lookupParticipantByCode: (...args: unknown[]) => mockLookup(...args),
  getAttendanceStatus: (...args: unknown[]) => mockGetStatus(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockLookup.mockResolvedValue({
    id: "p-uuid-1",
    participant_code: "001",
    name: "Alice",
    email: "alice@example.com",
    diet_type: "葷",
  });
  mockGetStatus.mockResolvedValue({
    is_checked_in: false,
    latest_action: null,
    latest_at: null,
  });
});

describe("checkInParticipant action", () => {
  it("rejects empty code", async () => {
    const { checkInParticipant } = await import("@/lib/actions/attendance");
    const formData = new FormData();
    formData.set("code", "");

    const result = await checkInParticipant(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("請輸入學員編號");
  });

  it("returns error when participant not found", async () => {
    mockLookup.mockResolvedValue(null);

    const { checkInParticipant } = await import("@/lib/actions/attendance");
    const formData = new FormData();
    formData.set("code", "999");

    const result = await checkInParticipant(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("編號查詢不到");
  });

  it("returns already when participant is already checked in", async () => {
    mockGetStatus.mockResolvedValue({
      is_checked_in: true,
      latest_action: "check_in",
      latest_at: "2026-03-13T10:00:00Z",
    });

    const { checkInParticipant } = await import("@/lib/actions/attendance");
    const formData = new FormData();
    formData.set("code", "001");

    const result = await checkInParticipant(null, formData);
    expect(result.success).toBe(true);
    expect(result.outcome).toBe("already");
    expect(result.is_checked_in).toBe(true);
  });

  it("checks in participant successfully", async () => {
    const { checkInParticipant } = await import("@/lib/actions/attendance");
    const formData = new FormData();
    formData.set("code", "001");
    formData.set("idempotency_key", "idem-1");

    const result = await checkInParticipant(null, formData);
    expect(result.success).toBe(true);
    expect(result.outcome).toBe("created");
    expect(result.is_checked_in).toBe(true);
    expect(result.participant?.name).toBe("Alice");

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        participant_id: "p-uuid-1",
        action: "check_in",
        idempotency_key: "idem-1",
      })
    );
  });
});

describe("undoCheckIn action", () => {
  it("rejects missing participant_id", async () => {
    const { undoCheckIn } = await import("@/lib/actions/attendance");
    const formData = new FormData();

    const result = await undoCheckIn(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("缺少學員資料");
  });

  it("returns error when not checked in", async () => {
    mockGetStatus.mockResolvedValue({
      is_checked_in: false,
      latest_action: null,
      latest_at: null,
    });

    const { undoCheckIn } = await import("@/lib/actions/attendance");
    const formData = new FormData();
    formData.set("participant_id", "p-uuid-1");
    formData.set("code", "001");

    const result = await undoCheckIn(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("此學員尚未報到");
  });

  it("undoes check-in successfully", async () => {
    mockGetStatus.mockResolvedValue({
      is_checked_in: true,
      latest_action: "check_in",
      latest_at: "2026-03-13T10:00:00Z",
    });

    const { undoCheckIn } = await import("@/lib/actions/attendance");
    const formData = new FormData();
    formData.set("participant_id", "p-uuid-1");
    formData.set("code", "001");
    formData.set("idempotency_key", "undo-1");

    const result = await undoCheckIn(null, formData);
    expect(result.success).toBe(true);
    expect(result.outcome).toBe("undone");
    expect(result.is_checked_in).toBe(false);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        participant_id: "p-uuid-1",
        action: "undo_check_in",
        idempotency_key: "undo-1",
      })
    );
  });
});
