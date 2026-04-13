import { describe, expect, it } from "vitest";
import { ease, spring, variants } from "@/lib/motion";

describe("motion config", () => {
  it("spring variants have required fields", () => {
    for (const [_key, val] of Object.entries(spring)) {
      expect(val).toHaveProperty("type", "spring");
      expect(val).toHaveProperty("stiffness");
      expect(val).toHaveProperty("damping");
    }
  });

  it("ease curves are arrays of 4 numbers", () => {
    for (const curve of Object.values(ease)) {
      expect(Array.isArray(curve)).toBe(true);
      expect(curve).toHaveLength(4);
      for (const n of curve) expect(typeof n).toBe("number");
    }
  });

  it("variants.fadeIn has hidden, visible, exit", () => {
    expect(variants.fadeIn).toHaveProperty("hidden");
    expect(variants.fadeIn).toHaveProperty("visible");
    expect(variants.fadeIn).toHaveProperty("exit");
  });

  it("variants.slideInRight animates x to 0", () => {
    expect(variants.slideInRight.visible).toMatchObject({ x: 0, opacity: 1 });
  });
});
