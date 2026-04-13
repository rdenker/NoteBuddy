import { beforeEach, describe, expect, it } from "vitest";
import { useBookmarksStore } from "@/store/bookmarks";

beforeEach(() => {
  localStorage.clear();
  useBookmarksStore.setState({ bookmarks: [] });
});

describe("bookmarks store", () => {
  it("addBookmark stores a bookmark", () => {
    useBookmarksStore.getState().addBookmark("/notes/a.md", "a.md");
    expect(useBookmarksStore.getState().bookmarks).toHaveLength(1);
    expect(useBookmarksStore.getState().bookmarks[0].path).toBe("/notes/a.md");
  });

  it("addBookmark deduplicates", () => {
    useBookmarksStore.getState().addBookmark("/notes/a.md", "a.md");
    useBookmarksStore.getState().addBookmark("/notes/a.md", "a.md");
    expect(useBookmarksStore.getState().bookmarks).toHaveLength(1);
  });

  it("removeBookmark removes by path", () => {
    useBookmarksStore.getState().addBookmark("/notes/a.md", "a.md");
    useBookmarksStore.getState().addBookmark("/notes/b.md", "b.md");
    useBookmarksStore.getState().removeBookmark("/notes/a.md");
    const paths = useBookmarksStore.getState().bookmarks.map((b) => b.path);
    expect(paths).not.toContain("/notes/a.md");
    expect(paths).toContain("/notes/b.md");
  });

  it("isBookmarked returns correct boolean", () => {
    useBookmarksStore.getState().addBookmark("/notes/a.md", "a.md");
    expect(useBookmarksStore.getState().isBookmarked("/notes/a.md")).toBe(true);
    expect(useBookmarksStore.getState().isBookmarked("/notes/b.md")).toBe(false);
  });
});
