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
const mockSelectCount = vi.fn();

vi.mock("@/lib/utils/supabase", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "questions") {
        return {
          select: vi.fn((_sel: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) {
              return mockSelectCount();
            }
            return {
              eq: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn(() => ({ data: null })),
                })),
              })),
            };
          }),
          insert: (data: unknown) => {
            mockInsert(data);
            return {
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: { question_code: "Q001" },
                  error: null,
                })),
              })),
            };
          },
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
          })),
        })),
      };
    }),
  })),
}));

// Mock auth check
vi.mock("@/lib/dal/auth-check", () => ({
  requireParticipantSession: vi.fn(async () => ({
    participantId: "participant-uuid-1",
    participantCode: "001",
    name: "TestUser",
  })),
  requireStaffIdentity: vi.fn(async () => ({
    selectedStaffId: "staff-uuid-1",
    selectedStaffName: "Staff A",
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectCount.mockReturnValue({ count: 0, error: null });
});

describe("createQuestion action", () => {
  it("rejects empty content", async () => {
    const { createQuestion } = await import("@/lib/actions/questions");
    const formData = new FormData();
    formData.set("content", "");

    const result = await createQuestion(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("請輸入問題內容");
  });

  it("rejects content exceeding 2000 characters", async () => {
    const { createQuestion } = await import("@/lib/actions/questions");
    const formData = new FormData();
    formData.set("content", "a".repeat(2001));

    const result = await createQuestion(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("2000");
  });

  it("creates question and returns question code", async () => {
    const { createQuestion } = await import("@/lib/actions/questions");
    const formData = new FormData();
    formData.set("content", "How do I register?");

    const result = await createQuestion(null, formData);
    expect(result.success).toBe(true);
    expect(result.question_code).toBe("Q001");
  });

  it("inserts with correct participant_id", async () => {
    const { createQuestion } = await import("@/lib/actions/questions");
    const formData = new FormData();
    formData.set("content", "Test question");

    await createQuestion(null, formData);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        participant_id: "participant-uuid-1",
        content: "Test question",
        status: "pending",
        source: "manual",
      })
    );
  });

  it("handles ai_handoff source", async () => {
    const { createQuestion } = await import("@/lib/actions/questions");
    const formData = new FormData();
    formData.set("content", "AI suggested question");
    formData.set("source", "ai_handoff");

    await createQuestion(null, formData);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "ai_handoff",
      })
    );
  });

  it("generates correct question code from count", async () => {
    mockSelectCount.mockReturnValue({ count: 5, error: null });

    const { createQuestion } = await import("@/lib/actions/questions");
    const formData = new FormData();
    formData.set("content", "Another question");

    // The generated code should be Q006 (count 5 + 1)
    await createQuestion(null, formData);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        question_code: "Q006",
      })
    );
  });
});
