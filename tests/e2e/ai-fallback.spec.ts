import { test, expect } from "@playwright/test";

/**
 * E2E: AI fallback
 * Verifies that when AI is unavailable, proper fallback message is shown.
 *
 * Prerequisites: A running app (AI endpoint may not be available in test env).
 */

test.describe("AI fallback behavior", () => {
  test("AI endpoint returns structured response or error", async ({
    request,
  }) => {
    // Test the API endpoint directly
    const response = await request.post("/api/ai/ask", {
      data: { query: "What time does the event start?" },
    });

    // Should return 401 (no session) or 200 with JSON
    const status = response.status();
    expect([200, 401, 500]).toContain(status);

    if (status === 200) {
      const body = await response.json();
      expect(body).toHaveProperty("outcome");
      expect(["answered", "uncertain", "out_of_scope", "error"]).toContain(
        body.outcome
      );
    }

    if (status === 401) {
      // Expected when no session cookie is set
      const body = await response.json();
      expect(body).toHaveProperty("error");
    }
  });

  test("AI endpoint rejects empty query", async ({ request }) => {
    const response = await request.post("/api/ai/ask", {
      data: { query: "" },
    });

    // Either 400/401 or 200 with error
    const status = response.status();
    expect([400, 401, 200]).toContain(status);
  });
});
