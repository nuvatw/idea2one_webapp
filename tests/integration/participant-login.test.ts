import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

// Track cookie operations
const cookieStore = new Map<string, { value: string }>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => cookieStore.get(name),
    set: (name: string, value: string) =>
      cookieStore.set(name, { value }),
    delete: (name: string) => cookieStore.delete(name),
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/lib/utils/supabase", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return {
              single: () => mockSingle(),
            };
          },
        };
      },
    })),
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  cookieStore.clear();
  process.env.SESSION_SECRET =
    "test-secret-that-is-at-least-32-characters-long!!";
});

describe("participantLogin action", () => {
  it("returns validation error for empty fields", async () => {
    const { participantLogin } = await import(
      "@/lib/actions/participant-auth"
    );
    const formData = new FormData();
    formData.set("participantCode", "");
    formData.set("email", "");

    const result = await participantLogin(null, formData);
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe("validation");
  });

  it("returns validation error for invalid code format", async () => {
    const { participantLogin } = await import(
      "@/lib/actions/participant-auth"
    );
    const formData = new FormData();
    formData.set("participantCode", "AB");
    formData.set("email", "test@example.com");

    const result = await participantLogin(null, formData);
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe("validation");
  });

  it("returns not_found when participant does not exist", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

    const { participantLogin } = await import(
      "@/lib/actions/participant-auth"
    );
    const formData = new FormData();
    formData.set("participantCode", "999");
    formData.set("email", "test@example.com");

    const result = await participantLogin(null, formData);
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe("not_found");
    expect(result.error?.message).toBe("編號查詢不到");
  });

  it("returns email_mismatch when email does not match", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "uuid-1",
        participant_code: "001",
        name: "Alice",
        email: "alice@example.com",
      },
      error: null,
    });

    const { participantLogin } = await import(
      "@/lib/actions/participant-auth"
    );
    const formData = new FormData();
    formData.set("participantCode", "001");
    formData.set("email", "wrong@example.com");

    const result = await participantLogin(null, formData);
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe("email_mismatch");
    expect(result.error?.message).toContain("信箱不正確");
  });

  it("redirects to /home on successful login", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "uuid-1",
        participant_code: "001",
        name: "Alice",
        email: "alice@example.com",
      },
      error: null,
    });

    const { participantLogin } = await import(
      "@/lib/actions/participant-auth"
    );
    const formData = new FormData();
    formData.set("participantCode", "001");
    formData.set("email", "alice@example.com");

    // redirect throws
    await expect(participantLogin(null, formData)).rejects.toThrow(
      "REDIRECT:/home"
    );

    // Session cookie should be set
    expect(cookieStore.has("ff_participant_session")).toBe(true);
  });

  it("performs case-insensitive email comparison", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "uuid-1",
        participant_code: "001",
        name: "Alice",
        email: "Alice@Example.COM",
      },
      error: null,
    });

    const { participantLogin } = await import(
      "@/lib/actions/participant-auth"
    );
    const formData = new FormData();
    formData.set("participantCode", "001");
    formData.set("email", "alice@example.com");

    await expect(participantLogin(null, formData)).rejects.toThrow(
      "REDIRECT:/home"
    );
  });
});

describe("participantLogout action", () => {
  it("clears session cookie and redirects to /login", async () => {
    cookieStore.set("ff_participant_session", { value: "some-token" });

    const { participantLogout } = await import(
      "@/lib/actions/participant-auth"
    );

    await expect(participantLogout()).rejects.toThrow("REDIRECT:/login");
    expect(cookieStore.has("ff_participant_session")).toBe(false);
  });
});
