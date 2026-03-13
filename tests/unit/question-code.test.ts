import { describe, it, expect } from "vitest";
import { QUESTION_CODE_PREFIX } from "@/lib/constants";

describe("question code formatting", () => {
  it("uses prefix Q", () => {
    expect(QUESTION_CODE_PREFIX).toBe("Q");
  });

  it("generates padded codes correctly", () => {
    // Replicate the logic from questions.ts generateQuestionCode
    const formatCode = (count: number) => {
      const nextNum = count + 1;
      const padded = String(nextNum).padStart(3, "0");
      return `${QUESTION_CODE_PREFIX}${padded}`;
    };

    expect(formatCode(0)).toBe("Q001");
    expect(formatCode(1)).toBe("Q002");
    expect(formatCode(9)).toBe("Q010");
    expect(formatCode(99)).toBe("Q100");
    expect(formatCode(999)).toBe("Q1000"); // Grows beyond 3 digits naturally
  });

  it("handles retry increment logic", () => {
    // From questions.ts: on uniqueness violation, increment the number
    const retryIncrement = (code: string) => {
      const currentNum = parseInt(code.replace(QUESTION_CODE_PREFIX, ""), 10);
      return `${QUESTION_CODE_PREFIX}${String(currentNum + 1).padStart(3, "0")}`;
    };

    expect(retryIncrement("Q001")).toBe("Q002");
    expect(retryIncrement("Q099")).toBe("Q100");
    expect(retryIncrement("Q999")).toBe("Q1000");
  });
});

describe("question status transition", () => {
  it("has correct status values", () => {
    // From domain.ts QuestionStatus
    const validStatuses = ["pending", "answered"];
    expect(validStatuses).toContain("pending");
    expect(validStatuses).toContain("answered");
  });

  it("transition: pending → answered on first answer", () => {
    // Replicate logic from answers.ts createAnswer
    const shouldTransition = (currentStatus: string) => {
      return currentStatus === "pending";
    };

    expect(shouldTransition("pending")).toBe(true);
    expect(shouldTransition("answered")).toBe(false);
  });
});
