import { beforeEach, describe, expect, it } from "vitest";
import { useSortOrderStore } from "@/store/sortOrder";

beforeEach(() => {
  localStorage.clear();
  useSortOrderStore.setState({ order: {} });
});

describe("sortOrder store", () => {
  it("setOrder stores order for a dir", () => {
    useSortOrderStore.getState().setOrder("/root", ["/root/b.md", "/root/a.md"]);
    expect(useSortOrderStore.getState().getOrder("/root")).toEqual(["/root/b.md", "/root/a.md"]);
  });

  it("getOrder returns null for unknown dir", () => {
    expect(useSortOrderStore.getState().getOrder("/unknown")).toBeNull();
  });

  it("clearDir removes order for a dir", () => {
    useSortOrderStore.getState().setOrder("/root", ["/root/a.md"]);
    useSortOrderStore.getState().clearDir("/root");
    expect(useSortOrderStore.getState().getOrder("/root")).toBeNull();
  });

  it("moveItem inserts before target", () => {
    useSortOrderStore.getState().setOrder("/root", ["/root/a.md", "/root/b.md", "/root/c.md"]);
    useSortOrderStore.getState().moveItem("/root", "/root/c.md", "/root/a.md", "before");
    expect(useSortOrderStore.getState().getOrder("/root")).toEqual([
      "/root/c.md",
      "/root/a.md",
      "/root/b.md",
    ]);
  });

  it("moveItem inserts after target", () => {
    useSortOrderStore.getState().setOrder("/root", ["/root/a.md", "/root/b.md", "/root/c.md"]);
    useSortOrderStore.getState().moveItem("/root", "/root/a.md", "/root/b.md", "after");
    expect(useSortOrderStore.getState().getOrder("/root")).toEqual([
      "/root/b.md",
      "/root/a.md",
      "/root/c.md",
    ]);
  });

  it("moveItem is a no-op when target not found", () => {
    useSortOrderStore.getState().setOrder("/root", ["/root/a.md"]);
    useSortOrderStore.getState().moveItem("/root", "/root/a.md", "/root/missing.md", "before");
    expect(useSortOrderStore.getState().getOrder("/root")).toEqual(["/root/a.md"]);
  });
});
