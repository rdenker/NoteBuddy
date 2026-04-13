import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "@/lib/frontmatter";

describe("parseFrontmatter", () => {
  it("returns null frontmatter when no --- block", () => {
    const { frontmatter, body } = parseFrontmatter("# Hello\n\nworld");
    expect(frontmatter).toBeNull();
    expect(body).toBe("# Hello\n\nworld");
  });

  it("parses basic frontmatter", () => {
    const raw = "---\ntitle: My Note\ntype: concept\n---\n# Content";
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter?.title).toBe("My Note");
    expect(frontmatter?.type).toBe("concept");
    expect(body).toBe("# Content");
  });

  it("parses tags as array", () => {
    const raw = "---\ntags: [rust, programming]\n---\nbody";
    const { frontmatter } = parseFrontmatter(raw);
    expect(frontmatter?.tags).toEqual(["rust", "programming"]);
  });

  it("coerces single tag string to array", () => {
    const raw = "---\ntags: rust\n---\nbody";
    const { frontmatter } = parseFrontmatter(raw);
    expect(Array.isArray(frontmatter?.tags)).toBe(true);
  });

  it("coerces Date objects to YYYY-MM-DD strings", () => {
    const raw = "---\ncreated: 2026-04-11\n---\nbody";
    const { frontmatter } = parseFrontmatter(raw);
    expect(typeof frontmatter?.created).toBe("string");
    expect(frontmatter?.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns null frontmatter for malformed yaml", () => {
    const raw = "---\n: bad : yaml : here :\n---\nbody";
    const { frontmatter } = parseFrontmatter(raw);
    expect(frontmatter).toBeNull();
  });

  it("strips leading newline from body", () => {
    const raw = "---\ntitle: T\n---\nContent here";
    const { body } = parseFrontmatter(raw);
    expect(body).toBe("Content here");
  });

  it("handles missing closing --- gracefully", () => {
    const raw = "---\ntitle: No closing";
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter).toBeNull();
    expect(body).toBe(raw);
  });
});
