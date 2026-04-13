import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { FrontmatterBar } from "@/components/FrontmatterBar";
import { useEditorStore } from "@/store/editor";

describe("FrontmatterBar", () => {
  beforeEach(() => {
    useEditorStore.setState({ frontmatter: null, activeTagFilter: null });
  });

  it("renders nothing when frontmatter is null", () => {
    const { container } = render(<FrontmatterBar />);
    expect(container.firstChild).toBeNull();
  });

  it("shows title when frontmatter has title", () => {
    useEditorStore.setState({
      frontmatter: { title: "My Note", type: "concept", tags: [], created: "2026-01-01" },
    });
    render(<FrontmatterBar />);
    expect(screen.getByText("My Note")).toBeInTheDocument();
  });

  it("shows type badge", () => {
    useEditorStore.setState({ frontmatter: { type: "source", tags: [] } });
    render(<FrontmatterBar />);
    expect(screen.getByText("source")).toBeInTheDocument();
  });

  it("shows tags as clickable chips", () => {
    useEditorStore.setState({ frontmatter: { tags: ["rust", "tauri"] } });
    render(<FrontmatterBar />);
    expect(screen.getByText("#rust")).toBeInTheDocument();
    expect(screen.getByText("#tauri")).toBeInTheDocument();
  });

  it("clicking a tag sets activeTagFilter", () => {
    useEditorStore.setState({ frontmatter: { tags: ["rust"] } });
    render(<FrontmatterBar />);
    fireEvent.click(screen.getByText("#rust"));
    expect(useEditorStore.getState().activeTagFilter).toBe("rust");
  });

  it("clicking active tag clears activeTagFilter", () => {
    useEditorStore.setState({
      frontmatter: { tags: ["rust"] },
      activeTagFilter: "rust",
    });
    render(<FrontmatterBar />);
    fireEvent.click(screen.getByText("#rust"));
    expect(useEditorStore.getState().activeTagFilter).toBeNull();
  });

  it("shows created date", () => {
    useEditorStore.setState({
      frontmatter: { tags: [], created: "2026-04-11" },
    });
    render(<FrontmatterBar />);
    expect(screen.getByText("2026-04-11")).toBeInTheDocument();
  });
});
