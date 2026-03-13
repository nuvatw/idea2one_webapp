import { describe, it, expect, vi, beforeEach } from "vitest";

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

beforeEach(() => {
  vi.clearAllMocks();
  cookieStore.clear();
  process.env.SESSION_SECRET =
    "test-secret-that-is-at-least-32-characters-long!!";
  process.env.STAFF_PASSWORD = "0012";
});

describe("staffLogin action", () => {
  it("returns validation error for empty password", async () => {
    const { staffLogin } = await import("@/lib/actions/staff-auth");
    const formData = new FormData();
    formData.set("password", "");

    const result = await staffLogin(null, formData);
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe("validation");
    expect(result.error?.message).toBe("請輸入密碼");
  });

  it("returns wrong_password for incorrect password", async () => {
    const { staffLogin } = await import("@/lib/actions/staff-auth");
    const formData = new FormData();
    formData.set("password", "wrong");

    const result = await staffLogin(null, formData);
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe("wrong_password");
    expect(result.error?.message).toBe("密碼不正確");
  });

  it("redirects to /staff/select on correct password", async () => {
    const { staffLogin } = await import("@/lib/actions/staff-auth");
    const formData = new FormData();
    formData.set("password", "0012");

    await expect(staffLogin(null, formData)).rejects.toThrow(
      "REDIRECT:/staff/select"
    );
    expect(cookieStore.has("ff_staff_session")).toBe(true);
  });

  it("uses env var for password", async () => {
    process.env.STAFF_PASSWORD = "custom-pass";

    const { staffLogin } = await import("@/lib/actions/staff-auth");
    const formData = new FormData();
    formData.set("password", "custom-pass");

    await expect(staffLogin(null, formData)).rejects.toThrow(
      "REDIRECT:/staff/select"
    );
  });

  it("defaults to 0012 when STAFF_PASSWORD is not set", async () => {
    delete process.env.STAFF_PASSWORD;

    const { staffLogin } = await import("@/lib/actions/staff-auth");
    const formData = new FormData();
    formData.set("password", "0012");

    await expect(staffLogin(null, formData)).rejects.toThrow(
      "REDIRECT:/staff/select"
    );
  });
});

describe("staffLogout action", () => {
  it("clears cookie and redirects to /staff/login", async () => {
    cookieStore.set("ff_staff_session", { value: "some-token" });

    const { staffLogout } = await import("@/lib/actions/staff-auth");

    await expect(staffLogout()).rejects.toThrow("REDIRECT:/staff/login");
    expect(cookieStore.has("ff_staff_session")).toBe(false);
  });
});
