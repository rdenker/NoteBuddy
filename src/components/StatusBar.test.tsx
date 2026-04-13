import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { StatusBar } from "@/components/StatusBar";
import { useEditorStore } from "@/store/editor";

describe("StatusBar", () => {
  beforeEach(() => {
    useEditorStore.setState({
      content: "",
      currentFilePath: null,
      isDirty: false,
    });
  });

  it("renders without crashing", () => {
    render(<StatusBar />);
  });

  it("shows word count for content", () => {
    useEditorStore.setState({ content: "hello world foo" });
    render(<StatusBar />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("words")).toBeInTheDocument();
  });

  it("shows 0 words for empty content", () => {
    render(<StatusBar />);
    const wordCountEls = screen.getAllByText("0");
    expect(wordCountEls.length).toBeGreaterThan(0);
  });

  it("shows file path when set", () => {
    useEditorStore.setState({ currentFilePath: "/notes/test.md" });
    render(<StatusBar />);
    expect(screen.getByText(/\/notes\/test\.md/)).toBeInTheDocument();
  });

  it("shows dirty indicator when file is unsaved", () => {
    useEditorStore.setState({
      currentFilePath: "/notes/test.md",
      isDirty: true,
    });
    render(<StatusBar />);
    expect(screen.getByText(/•/)).toBeInTheDocument();
  });

  it("shows reading time", () => {
    useEditorStore.setState({ content: "word ".repeat(200) });
    render(<StatusBar />);
    expect(screen.getByText(/min read/)).toBeInTheDocument();
  });
});
