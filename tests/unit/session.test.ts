import { describe, it, expect, beforeAll, vi } from "vitest";

// Set SESSION_SECRET before importing session module
const TEST_SECRET = "test-secret-that-is-at-least-32-chars-long!!";

beforeAll(() => {
  process.env.SESSION_SECRET = TEST_SECRET;
});

// Mock next/headers since we're in a non-Next.js test environment
vi.mock("next/headers", () => {
  const store = new Map<string, { value: string }>();
  return {
    cookies: vi.fn(async () => ({
      get: (name: string) => store.get(name),
      set: (name: string, value: string) => store.set(name, { value }),
      delete: (name: string) => store.delete(name),
    })),
    __store: store,
  };
});

describe("session encode/decode", () => {
  it("encodes and verifies a participant session round-trip", async () => {
    const { encodeParticipantSession } = await import("@/lib/auth/session");
    const { jwtVerify } = await import("jose");

    const data = {
      role: "participant" as const,
      participantId: "uuid-123",
      participantCode: "001",
      name: "Test User",
    };

    const token = await encodeParticipantSession(data);
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");

    // Verify the JWT directly
    const secret = new TextEncoder().encode(TEST_SECRET);
    const { payload } = await jwtVerify(token, secret);

    expect(payload.role).toBe("participant");
    expect(payload.participantId).toBe("uuid-123");
    expect(payload.participantCode).toBe("001");
    expect(payload.name).toBe("Test User");
    expect(payload.exp).toBeDefined();
    expect(payload.iat).toBeDefined();
  });

  it("encodes participant session with 24h expiry", async () => {
    const { encodeParticipantSession } = await import("@/lib/auth/session");
    const { jwtVerify } = await import("jose");

    const data = {
      role: "participant" as const,
      participantId: "uuid-123",
      participantCode: "001",
      name: "Test",
    };

    const token = await encodeParticipantSession(data);
    const secret = new TextEncoder().encode(TEST_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const iat = payload.iat!;
    const exp = payload.exp!;
    // Should be ~24 hours (86400 seconds)
    expect(exp - iat).toBe(86400);
  });

  it("encodes and verifies a staff session round-trip", async () => {
    const { encodeStaffSession } = await import("@/lib/auth/session");
    const { jwtVerify } = await import("jose");

    const data = {
      role: "staff" as const,
      selectedStaffId: "staff-uuid",
      selectedStaffName: "努努A",
    };

    const token = await encodeStaffSession(data);
    expect(token).toBeTruthy();

    const secret = new TextEncoder().encode(TEST_SECRET);
    const { payload } = await jwtVerify(token, secret);

    expect(payload.role).toBe("staff");
    expect(payload.selectedStaffId).toBe("staff-uuid");
    expect(payload.selectedStaffName).toBe("努努A");
  });

  it("encodes staff session without identity selection", async () => {
    const { encodeStaffSession } = await import("@/lib/auth/session");
    const { jwtVerify } = await import("jose");

    const data = {
      role: "staff" as const,
    };

    const token = await encodeStaffSession(data);
    const secret = new TextEncoder().encode(TEST_SECRET);
    const { payload } = await jwtVerify(token, secret);

    expect(payload.role).toBe("staff");
    expect(payload.selectedStaffId).toBeUndefined();
  });

  it("throws when SESSION_SECRET is missing", async () => {
    const originalSecret = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;

    // Re-import to get fresh module, but the function reads env at call time
    const { encodeParticipantSession } = await import("@/lib/auth/session");

    await expect(
      encodeParticipantSession({
        role: "participant",
        participantId: "id",
        participantCode: "001",
        name: "Test",
      })
    ).rejects.toThrow("SESSION_SECRET");

    process.env.SESSION_SECRET = originalSecret;
  });

  it("throws when SESSION_SECRET is too short", async () => {
    const originalSecret = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = "short";

    const { encodeParticipantSession } = await import("@/lib/auth/session");

    await expect(
      encodeParticipantSession({
        role: "participant",
        participantId: "id",
        participantCode: "001",
        name: "Test",
      })
    ).rejects.toThrow("SESSION_SECRET");

    process.env.SESSION_SECRET = originalSecret;
  });

  it("rejects expired tokens", async () => {
    const { SignJWT, jwtVerify } = await import("jose");

    const secret = new TextEncoder().encode(TEST_SECRET);
    // Create a token that expired 1 hour ago
    const token = await new SignJWT({ role: "participant", participantId: "x", participantCode: "001" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(secret);

    await expect(jwtVerify(token, secret)).rejects.toThrow();
  });
});
