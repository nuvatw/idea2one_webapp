import { describe, it, expect } from "vitest";
import { validateParticipantLogin } from "@/lib/validations/participant-login";

describe("validateParticipantLogin", () => {
  // --- participant_code ---

  it("accepts valid 3-digit codes", () => {
    const result = validateParticipantLogin({
      participantCode: "001",
      email: "test@example.com",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("accepts code with leading zeros", () => {
    const result = validateParticipantLogin({
      participantCode: "007",
      email: "a@b.com",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects empty code", () => {
    const result = validateParticipantLogin({
      participantCode: "",
      email: "test@example.com",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.participantCode).toBe("請輸入學員編號");
  });

  it("rejects whitespace-only code", () => {
    const result = validateParticipantLogin({
      participantCode: "   ",
      email: "test@example.com",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.participantCode).toBe("請輸入學員編號");
  });

  it("rejects code with fewer than 3 digits", () => {
    const result = validateParticipantLogin({
      participantCode: "01",
      email: "test@example.com",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.participantCode).toBe("學員編號為 3 碼數字");
  });

  it("rejects code with more than 3 digits", () => {
    const result = validateParticipantLogin({
      participantCode: "0011",
      email: "test@example.com",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.participantCode).toBe("學員編號為 3 碼數字");
  });

  it("rejects code with letters", () => {
    const result = validateParticipantLogin({
      participantCode: "A01",
      email: "test@example.com",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.participantCode).toBe("學員編號為 3 碼數字");
  });

  it("trims code before validation", () => {
    const result = validateParticipantLogin({
      participantCode: " 001 ",
      email: "test@example.com",
    });
    expect(result.valid).toBe(true);
  });

  // --- email ---

  it("rejects empty email", () => {
    const result = validateParticipantLogin({
      participantCode: "001",
      email: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("請輸入信箱");
  });

  it("rejects whitespace-only email", () => {
    const result = validateParticipantLogin({
      participantCode: "001",
      email: "   ",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("請輸入信箱");
  });

  it("rejects email without @", () => {
    const result = validateParticipantLogin({
      participantCode: "001",
      email: "testexample.com",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("請輸入有效的信箱格式");
  });

  it("rejects email without domain", () => {
    const result = validateParticipantLogin({
      participantCode: "001",
      email: "test@",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("請輸入有效的信箱格式");
  });

  it("rejects email with spaces", () => {
    const result = validateParticipantLogin({
      participantCode: "001",
      email: "test @example.com",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("請輸入有效的信箱格式");
  });

  it("accepts valid email formats", () => {
    const validEmails = [
      "user@example.com",
      "user.name@domain.org",
      "user+tag@domain.co.jp",
    ];
    for (const email of validEmails) {
      const result = validateParticipantLogin({
        participantCode: "001",
        email,
      });
      expect(result.valid).toBe(true);
    }
  });

  it("trims email before validation", () => {
    const result = validateParticipantLogin({
      participantCode: "001",
      email: " test@example.com ",
    });
    expect(result.valid).toBe(true);
  });

  // --- Both fields invalid ---

  it("returns errors for both fields when both are invalid", () => {
    const result = validateParticipantLogin({
      participantCode: "",
      email: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.participantCode).toBeDefined();
    expect(result.errors.email).toBeDefined();
  });
});
