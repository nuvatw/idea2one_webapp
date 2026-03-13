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
const mockUpdate = vi.fn();
const mockQuestionFetch = vi.fn();
const mockAnswerFetch = vi.fn();

vi.mock("@/lib/utils/supabase", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "answers") {
        return {
          insert: (data: unknown) => {
            mockInsert(data);
            return { error: null };
          },
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: () => mockAnswerFetch(),
            })),
          })),
          update: (data: unknown) => {
            mockUpdate(data);
            return {
              eq: vi.fn(() => {
                return { error: null };
              }),
            };
          },
        };
      }
      if (table === "questions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: () => mockQuestionFetch(),
            })),
          })),
          update: (data: unknown) => {
            mockUpdate(data);
            return {
              eq: vi.fn(() => ({ error: null })),
            };
          },
        };
      }
      return { select: vi.fn() };
    }),
  })),
}));

vi.mock("@/lib/dal/auth-check", () => ({
  requireStaffIdentity: vi.fn(async () => ({
    selectedStaffId: "staff-uuid-1",
    selectedStaffName: "Staff A",
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockQuestionFetch.mockReturnValue({
    data: { id: "q-uuid-1", status: "pending" },
    error: null,
  });
  mockAnswerFetch.mockReturnValue({
    data: { id: "a-uuid-1" },
    error: null,
  });
});

describe("createAnswer action", () => {
  it("rejects missing questionId", async () => {
    const { createAnswer } = await import("@/lib/actions/answers");
    const formData = new FormData();
    formData.set("body", "This is an answer");

    const result = await createAnswer(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("缺少問題 ID");
  });

  it("rejects empty body", async () => {
    const { createAnswer } = await import("@/lib/actions/answers");
    const formData = new FormData();
    formData.set("questionId", "q-uuid-1");
    formData.set("body", "");

    const result = await createAnswer(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("請輸入回覆內容");
  });

  it("returns error when question not found", async () => {
    mockQuestionFetch.mockReturnValue({ data: null, error: { code: "PGRST116" } });

    const { createAnswer } = await import("@/lib/actions/answers");
    const formData = new FormData();
    formData.set("questionId", "nonexistent");
    formData.set("body", "Answer text");

    const result = await createAnswer(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("找不到此問題");
  });

  it("creates answer successfully", async () => {
    const { createAnswer } = await import("@/lib/actions/answers");
    const formData = new FormData();
    formData.set("questionId", "q-uuid-1");
    formData.set("body", "Here is the answer");

    const result = await createAnswer(null, formData);
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        question_id: "q-uuid-1",
        body: "Here is the answer",
        created_by_staff_id: "staff-uuid-1",
      })
    );
  });

  it("transitions question from pending to answered on first answer", async () => {
    mockQuestionFetch.mockReturnValue({
      data: { id: "q-uuid-1", status: "pending" },
      error: null,
    });

    const { createAnswer } = await import("@/lib/actions/answers");
    const formData = new FormData();
    formData.set("questionId", "q-uuid-1");
    formData.set("body", "Answer text");

    await createAnswer(null, formData);

    // Should have called update with status: "answered"
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "answered",
      })
    );
  });

  it("does not transition already-answered question", async () => {
    mockQuestionFetch.mockReturnValue({
      data: { id: "q-uuid-1", status: "answered" },
      error: null,
    });

    const { createAnswer } = await import("@/lib/actions/answers");
    const formData = new FormData();
    formData.set("questionId", "q-uuid-1");
    formData.set("body", "Supplementary answer");

    await createAnswer(null, formData);

    // Should NOT have called update for status
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("updateAnswer action", () => {
  it("rejects missing answerId", async () => {
    const { updateAnswer } = await import("@/lib/actions/answers");
    const formData = new FormData();
    formData.set("body", "Updated text");

    const result = await updateAnswer(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("缺少回覆 ID");
  });

  it("rejects empty body", async () => {
    const { updateAnswer } = await import("@/lib/actions/answers");
    const formData = new FormData();
    formData.set("answerId", "a-uuid-1");
    formData.set("body", "");

    const result = await updateAnswer(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("請輸入回覆內容");
  });

  it("returns error when answer not found", async () => {
    mockAnswerFetch.mockReturnValue({
      data: null,
      error: { code: "PGRST116" },
    });

    const { updateAnswer } = await import("@/lib/actions/answers");
    const formData = new FormData();
    formData.set("answerId", "nonexistent");
    formData.set("body", "Updated text");

    const result = await updateAnswer(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("找不到此回覆");
  });
});
