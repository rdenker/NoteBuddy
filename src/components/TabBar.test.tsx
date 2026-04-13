import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { TabBar } from "@/components/TabBar";
import { useTabsStore } from "@/store/tabs";

function makeTab(id: string, name: string, isDirty = false) {
  return {
    id,
    path: `/${name}`,
    name,
    content: "",
    savedContent: "",
    isDirty,
    previewHtml: "",
    frontmatter: null,
  };
}

describe("TabBar", () => {
  beforeEach(() => {
    const tab = makeTab("t1", "note1.md");
    useTabsStore.setState({ tabs: [tab], activeTabId: "t1" });
  });

  it("renders tab names", () => {
    render(<TabBar />);
    expect(screen.getByText("note1.md")).toBeInTheDocument();
  });

  it("renders multiple tabs", () => {
    useTabsStore.setState({
      tabs: [makeTab("t1", "a.md"), makeTab("t2", "b.md")],
      activeTabId: "t1",
    });
    render(<TabBar />);
    expect(screen.getByText("a.md")).toBeInTheDocument();
    expect(screen.getByText("b.md")).toBeInTheDocument();
  });

  it("renders + button for new tab", () => {
    render(<TabBar />);
    const plusBtn = screen.getByTitle("New tab");
    expect(plusBtn).toBeInTheDocument();
  });

  it("clicking + button creates a new tab", () => {
    render(<TabBar />);
    fireEvent.click(screen.getByTitle("New tab"));
    expect(useTabsStore.getState().tabs).toHaveLength(2);
  });

  it("switching tabs updates activeTabId", () => {
    useTabsStore.setState({
      tabs: [makeTab("t1", "a.md"), makeTab("t2", "b.md")],
      activeTabId: "t1",
    });
    render(<TabBar />);
    fireEvent.click(screen.getByText("b.md"));
    expect(useTabsStore.getState().activeTabId).toBe("t2");
  });
});
