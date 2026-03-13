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

const mockGetLunchInfo = vi.fn();

vi.mock("@/lib/dal/lunch", () => ({
  getParticipantLunchInfo: (...args: unknown[]) => mockGetLunchInfo(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetLunchInfo.mockResolvedValue({
    participant_id: "p-uuid-1",
    participant_code: "001",
    name: "Alice",
    diet_type: "葷",
    has_claimed: false,
  });
});

describe("markLunchClaimed action", () => {
  it("rejects empty code", async () => {
    const { markLunchClaimed } = await import("@/lib/actions/lunch");
    const formData = new FormData();
    formData.set("code", "");

    const result = await markLunchClaimed(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("請輸入學員編號");
  });

  it("returns error when participant not found", async () => {
    mockGetLunchInfo.mockResolvedValue(null);

    const { markLunchClaimed } = await import("@/lib/actions/lunch");
    const formData = new FormData();
    formData.set("code", "999");

    const result = await markLunchClaimed(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("編號查詢不到");
  });

  it("returns already when lunch already claimed", async () => {
    mockGetLunchInfo.mockResolvedValue({
      participant_id: "p-uuid-1",
      participant_code: "001",
      name: "Alice",
      diet_type: "葷",
      has_claimed: true,
    });

    const { markLunchClaimed } = await import("@/lib/actions/lunch");
    const formData = new FormData();
    formData.set("code", "001");

    const result = await markLunchClaimed(null, formData);
    expect(result.success).toBe(true);
    expect(result.outcome).toBe("already");
  });

  it("marks lunch as claimed successfully", async () => {
    const { markLunchClaimed } = await import("@/lib/actions/lunch");
    const formData = new FormData();
    formData.set("code", "001");
    formData.set("idempotency_key", "lunch-idem-1");

    const result = await markLunchClaimed(null, formData);
    expect(result.success).toBe(true);
    expect(result.outcome).toBe("created");
    expect(result.participant?.has_claimed).toBe(true);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        participant_id: "p-uuid-1",
        idempotency_key: "lunch-idem-1",
      })
    );
  });

  it("returns participant info with diet_type", async () => {
    const { markLunchClaimed } = await import("@/lib/actions/lunch");
    const formData = new FormData();
    formData.set("code", "001");

    const result = await markLunchClaimed(null, formData);
    expect(result.participant?.diet_type).toBe("葷");
    expect(result.participant?.name).toBe("Alice");
  });
});
