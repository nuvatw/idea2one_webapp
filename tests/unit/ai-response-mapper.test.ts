import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase before importing the module
vi.mock("@/lib/utils/supabase", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => ({
          data: [
            {
              question_code: "Q001",
              content: "How to register?",
              status: "answered",
            },
          ],
        })),
      })),
    })),
  })),
}));

describe("mapAIResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses valid JSON response with outcome=answered", async () => {
    const { mapAIResponse } = await import("@/lib/ai/response-mapper");

    const raw = JSON.stringify({
      outcome: "answered",
      answerText: "The event starts at 10:00",
      relatedQuestionCodes: ["Q001"],
    });

    const result = await mapAIResponse(raw);
    expect(result.outcome).toBe("answered");
    expect(result.response.outcome).toBe("answered");
    expect(result.response.answerText).toBe("The event starts at 10:00");
  });

  it("parses response with outcome=uncertain and draftQuestion", async () => {
    const { mapAIResponse } = await import("@/lib/ai/response-mapper");

    const raw = JSON.stringify({
      outcome: "uncertain",
      answerText: "I'm not sure about this",
      draftQuestion: "What is the WiFi password?",
      relatedQuestionCodes: [],
    });

    const result = await mapAIResponse(raw);
    expect(result.outcome).toBe("uncertain");
    expect(result.response.draftQuestion).toBe("What is the WiFi password?");
  });

  it("strips draftQuestion when outcome is not uncertain", async () => {
    const { mapAIResponse } = await import("@/lib/ai/response-mapper");

    const raw = JSON.stringify({
      outcome: "answered",
      answerText: "Here's the answer",
      draftQuestion: "Should be stripped",
      relatedQuestionCodes: [],
    });

    const result = await mapAIResponse(raw);
    expect(result.response.draftQuestion).toBeUndefined();
  });

  it("handles out_of_scope outcome", async () => {
    const { mapAIResponse } = await import("@/lib/ai/response-mapper");

    const raw = JSON.stringify({
      outcome: "out_of_scope",
      answerText: "This is not related to the event",
      relatedQuestionCodes: [],
    });

    const result = await mapAIResponse(raw);
    expect(result.outcome).toBe("out_of_scope");
  });

  it("returns error on unparseable JSON", async () => {
    const { mapAIResponse } = await import("@/lib/ai/response-mapper");

    const result = await mapAIResponse("not valid json at all");
    expect(result.outcome).toBe("error");
    expect(result.response.outcome).toBe("error");
    expect(result.response.answerText).toBe("AI 目前正在午休中");
    expect(result.response.relatedQuestions).toEqual([]);
  });

  it("returns error for invalid outcome value", async () => {
    const { mapAIResponse } = await import("@/lib/ai/response-mapper");

    const raw = JSON.stringify({
      outcome: "invalid_value",
      answerText: "Some text",
      relatedQuestionCodes: [],
    });

    const result = await mapAIResponse(raw);
    expect(result.outcome).toBe("error");
  });

  it("strips markdown code fences from response", async () => {
    const { mapAIResponse } = await import("@/lib/ai/response-mapper");

    const raw = `\`\`\`json
${JSON.stringify({
  outcome: "answered",
  answerText: "Answer",
  relatedQuestionCodes: [],
})}
\`\`\``;

    const result = await mapAIResponse(raw);
    expect(result.outcome).toBe("answered");
    expect(result.response.answerText).toBe("Answer");
  });

  it("handles missing answerText gracefully", async () => {
    const { mapAIResponse } = await import("@/lib/ai/response-mapper");

    const raw = JSON.stringify({
      outcome: "answered",
      relatedQuestionCodes: [],
    });

    const result = await mapAIResponse(raw);
    expect(result.response.answerText).toBe("");
  });

  it("handles missing relatedQuestionCodes gracefully", async () => {
    const { mapAIResponse } = await import("@/lib/ai/response-mapper");

    const raw = JSON.stringify({
      outcome: "answered",
      answerText: "Answer",
    });

    const result = await mapAIResponse(raw);
    expect(result.response.relatedQuestions).toEqual([]);
  });
});
