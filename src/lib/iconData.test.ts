import { describe, expect, it } from "vitest";
import { ALL_ICONS_DEDUPLICATED, ICON_CATEGORIES } from "@/lib/iconData";

describe("iconData", () => {
  it("has at least 10 categories", () => {
    expect(ICON_CATEGORIES.length).toBeGreaterThanOrEqual(10);
  });

  it("every category has a non-empty label and icons", () => {
    for (const cat of ICON_CATEGORIES) {
      expect(cat.label.length).toBeGreaterThan(0);
      expect(cat.icons.length).toBeGreaterThan(0);
    }
  });

  it("ALL_ICONS_DEDUPLICATED has no duplicates", () => {
    const seen = new Set(ALL_ICONS_DEDUPLICATED);
    expect(seen.size).toBe(ALL_ICONS_DEDUPLICATED.length);
  });

  it("all icon names are PascalCase strings", () => {
    for (const name of ALL_ICONS_DEDUPLICATED) {
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
      expect(name[0]).toBe(name[0].toUpperCase());
    }
  });

  it("Files & Folders category contains File and Folder", () => {
    const cat = ICON_CATEGORIES.find((c) => c.label === "Files & Folders");
    expect(cat?.icons).toContain("File");
    expect(cat?.icons).toContain("Folder");
  });
});
