import { describe, it, expect } from "vitest";

/**
 * The truncate function is private in retrieval.ts.
 * We replicate it here for unit testing.
 * If it were exported, we'd import it directly.
 */
function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastNewline = truncated.lastIndexOf("\n");
  if (lastNewline > maxChars * 0.8) {
    return truncated.slice(0, lastNewline) + "\n...（已截斷）";
  }
  return truncated + "...（已截斷）";
}

describe("truncate", () => {
  it("returns text as-is when under maxChars", () => {
    const text = "Hello world";
    expect(truncate(text, 100)).toBe("Hello world");
  });

  it("returns text as-is when exactly at maxChars", () => {
    const text = "abc";
    expect(truncate(text, 3)).toBe("abc");
  });

  it("truncates text exceeding maxChars", () => {
    const text = "a".repeat(200);
    const result = truncate(text, 100);
    expect(result).toContain("...（已截斷）");
    expect(result.length).toBeLessThan(200);
  });

  it("breaks at newline when near the end (>80% of maxChars)", () => {
    // Build text: 85 chars + newline + more text (total > 100)
    const text = "a".repeat(85) + "\n" + "b".repeat(50);
    const result = truncate(text, 100);
    // Should break at newline (position 85)
    expect(result).toBe("a".repeat(85) + "\n...（已截斷）");
  });

  it("does not break at newline when too early (<80% of maxChars)", () => {
    // Build text: 10 chars + newline + 200 more chars
    const text = "a".repeat(10) + "\n" + "b".repeat(200);
    const result = truncate(text, 100);
    // Newline at position 10 is < 80 (80% of 100), so no line-break truncation
    expect(result).toBe("a".repeat(10) + "\n" + "b".repeat(89) + "...（已截斷）");
  });

  it("appends suffix marker", () => {
    const text = "x".repeat(200);
    const result = truncate(text, 50);
    expect(result.endsWith("...（已截斷）")).toBe(true);
  });
});
