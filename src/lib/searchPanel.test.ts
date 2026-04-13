import { describe, expect, it, vi } from "vitest";

vi.mock("@codemirror/search", () => ({
  SearchQuery: class SearchQuery {
    search = "";
    replace = "";
    caseSensitive = false;
    regexp = false;
    wholeWord = false;
    valid = false;
    constructor(opts: Record<string, unknown> = {}) {
      Object.assign(this, opts);
    }
    getCursor() {
      return { next: () => ({ done: true, value: null }) };
    }
  },
  getSearchQuery: () => ({
    search: "",
    replace: "",
    caseSensitive: false,
    regexp: false,
    wholeWord: false,
    valid: false,
  }),
  setSearchQuery: { of: vi.fn() },
  findNext: vi.fn(),
  findPrevious: vi.fn(),
  replaceNext: vi.fn(),
  replaceAll: vi.fn(),
  closeSearchPanel: vi.fn(),
}));

import { CustomSearchPanel } from "@/lib/searchPanel";

function makeMockView() {
  return {
    state: {},
    dispatch: vi.fn(),
  } as never;
}

describe("CustomSearchPanel", () => {
  it("creates a DOM element on construction", () => {
    const panel = new CustomSearchPanel(makeMockView());
    expect(panel.dom).toBeInstanceOf(HTMLElement);
  });

  it("dom contains a search input", () => {
    const panel = new CustomSearchPanel(makeMockView());
    const inputs = panel.dom.querySelectorAll("input");
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it("dom contains exactly 3 toggle buttons", () => {
    const panel = new CustomSearchPanel(makeMockView());
    expect(panel.dom.querySelectorAll("button.cm-search-toggle").length).toBe(3);
  });

  it("dom contains navigation and action buttons", () => {
    const panel = new CustomSearchPanel(makeMockView());
    expect(panel.dom.querySelectorAll("button.cm-search-btn").length).toBeGreaterThanOrEqual(2);
  });

  it("dom contains a close button", () => {
    const panel = new CustomSearchPanel(makeMockView());
    expect(panel.dom.querySelector("button.cm-search-close")).toBeTruthy();
  });

  it("dom contains a replace row (initially hidden)", () => {
    const panel = new CustomSearchPanel(makeMockView());
    const replaceRow = panel.dom.querySelector(".cm-search-replace-row") as HTMLElement | null;
    expect(replaceRow).toBeTruthy();
    expect(replaceRow?.style.display).toBe("none");
  });

  it("has mount and update methods", () => {
    const panel = new CustomSearchPanel(makeMockView());
    expect(typeof panel.mount).toBe("function");
    expect(typeof panel.update).toBe("function");
  });

  it("expand button toggles replace row visibility", () => {
    const panel = new CustomSearchPanel(makeMockView());
    const expandBtn = panel.dom.querySelector("button.cm-search-expand") as HTMLButtonElement;
    const replaceRow = panel.dom.querySelector(".cm-search-replace-row") as HTMLElement;
    expect(replaceRow.style.display).toBe("none");
    expandBtn.click();
    expect(replaceRow.style.display).toBe("flex");
    expandBtn.click();
    expect(replaceRow.style.display).toBe("none");
  });
});
