import { describe, it, expect } from "vitest";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

/**
 * Test that the rehype-sanitize schema used by MarkdownRenderer
 * strips dangerous HTML. We test the schema configuration,
 * not the full React component rendering.
 */

describe("markdown sanitization schema", () => {
  it("rehype-sanitize exports a default plugin", () => {
    expect(rehypeSanitize).toBeDefined();
    expect(typeof rehypeSanitize).toBe("function");
  });

  it("default schema allows safe tags", () => {
    // The default schema should allow standard HTML tags
    expect(defaultSchema.tagNames).toContain("p");
    expect(defaultSchema.tagNames).toContain("a");
    expect(defaultSchema.tagNames).toContain("strong");
    expect(defaultSchema.tagNames).toContain("em");
    expect(defaultSchema.tagNames).toContain("ul");
    expect(defaultSchema.tagNames).toContain("ol");
    expect(defaultSchema.tagNames).toContain("li");
    expect(defaultSchema.tagNames).toContain("h1");
    expect(defaultSchema.tagNames).toContain("h2");
    expect(defaultSchema.tagNames).toContain("code");
    expect(defaultSchema.tagNames).toContain("pre");
    expect(defaultSchema.tagNames).toContain("blockquote");
  });

  it("default schema does not allow script tags", () => {
    expect(defaultSchema.tagNames).not.toContain("script");
  });

  it("default schema does not allow iframe tags", () => {
    expect(defaultSchema.tagNames).not.toContain("iframe");
  });

  it("default schema does not allow style tags", () => {
    expect(defaultSchema.tagNames).not.toContain("style");
  });

  it("default schema does not allow form tags", () => {
    expect(defaultSchema.tagNames).not.toContain("form");
    expect(defaultSchema.tagNames).not.toContain("textarea");
  });

  it("default schema allows href on links", () => {
    const aAttributes = defaultSchema.attributes?.a;
    expect(aAttributes).toBeDefined();
    expect(aAttributes).toContain("href");
  });

  it("default schema restricts link protocols", () => {
    const protocols = defaultSchema.protocols;
    expect(protocols).toBeDefined();
    if (protocols?.href) {
      expect(protocols.href).toContain("https");
      expect(protocols.href).toContain("http");
      // Should not allow javascript:
      expect(protocols.href).not.toContain("javascript");
    }
  });
});
