import { describe, expect, it } from "vitest";

describe("pdfExport module", () => {
  it("module loads without errors", async () => {
    await expect(import("@/lib/pdfExport")).resolves.toBeDefined();
  });

  it("exportAsPdf is a function", async () => {
    const mod = await import("@/lib/pdfExport");
    expect(typeof mod.exportAsPdf).toBe("function");
  });
});

describe("welcomeContent module", () => {
  it("getWelcomeMd returns a non-empty string", async () => {
    const { getWelcomeMd } = await import("@/lib/welcomeContent");
    const md = getWelcomeMd();
    expect(typeof md).toBe("string");
    expect(md.length).toBeGreaterThan(100);
  });

  it("getWelcomeMd contains required frontmatter fields", async () => {
    const { getWelcomeMd } = await import("@/lib/welcomeContent");
    const md = getWelcomeMd();
    expect(md).toContain("title:");
    expect(md).toContain("type: source");
    expect(md).toContain("tags:");
  });

  it("getWelcomeMd contains key sections", async () => {
    const { getWelcomeMd } = await import("@/lib/welcomeContent");
    const md = getWelcomeMd();
    expect(md).toContain("# Welcome");
    expect(md).toContain("Keyboard shortcuts");
  });

  it("getWelcomeMd uses today's date", async () => {
    const { getWelcomeMd } = await import("@/lib/welcomeContent");
    const md = getWelcomeMd();
    const today = new Date().toISOString().slice(0, 10);
    expect(md).toContain(`created: ${today}`);
    expect(md).toContain(`updated: ${today}`);
  });
});
