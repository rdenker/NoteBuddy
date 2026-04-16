import { act, render } from "@testing-library/react";
import { forwardRef, useImperativeHandle } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorStore } from "@/store/editor";
import { useSettingsStore } from "@/store/settings";

const mockCm = {
  on: vi.fn(),
  off: vi.fn(),
};

const mockView = {
  state: { selection: { main: { head: 0 } } },
  dispatch: vi.fn(),
  posAtCoords: vi.fn(),
};

vi.mock("@uiw/react-codemirror", () => {
  const MockCodeMirror = forwardRef(
    (
      { onCreateEditor }: { onCreateEditor?: (view: typeof mockView) => void },
      ref: React.ForwardedRef<{ view: typeof mockView }>
    ) => {
      useImperativeHandle(ref, () => ({ view: mockView }), []);
      onCreateEditor?.(mockView);
      return <div data-testid="codemirror" />;
    }
  );

  return {
    __esModule: true,
    default: MockCodeMirror,
  };
});

vi.mock("@replit/codemirror-vim", () => ({
  vim: () => ({ name: "vim-extension" }),
  getCM: () => mockCm,
}));

vi.mock("@/lib/codeBlockCompletion", () => ({ codeBlockCompletion: vi.fn() }));
vi.mock("@/lib/emojiCompletion", () => ({ emojiCompletion: vi.fn() }));
vi.mock("@/lib/imagePaste", () => ({
  handleImageDrop: vi.fn(),
  handleImagePaste: vi.fn(),
}));
vi.mock("@/lib/searchPanel", () => ({
  CustomSearchPanel: class CustomSearchPanel {},
}));
vi.mock("@/components/EditorToolbar", () => ({
  EditorToolbar: () => <div data-testid="toolbar" />,
}));

import { EditorPane } from "@/components/EditorPane";

describe("EditorPane vim mode indicator wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useEditorStore.setState({
      content: "",
      rootDir: null,
      vimModeLabel: null,
    });

    useSettingsStore.setState({
      editorTheme: "vscodeDark",
      fontSize: 14,
      lineNumbers: true,
      lineWrapping: true,
      vimMode: true,
      customEditorThemes: [],
      customEditorThemeId: "",
    });
  });

  it("sets NORMAL on mount when vim mode enabled", async () => {
    render(<EditorPane onChange={vi.fn()} />);

    expect(mockCm.on).toHaveBeenCalledWith("vim-mode-change", expect.any(Function));
    expect(useEditorStore.getState().vimModeLabel).toBe("NORMAL");
  });

  it("updates store when vim mode changes to insert", async () => {
    render(<EditorPane onChange={vi.fn()} />);

    const handler = mockCm.on.mock.calls.find((call) => call[0] === "vim-mode-change")?.[1] as
      | ((event: { mode: string; subMode?: string }) => void)
      | undefined;

    expect(handler).toBeDefined();

    await act(async () => {
      handler?.({ mode: "insert" });
    });

    expect(useEditorStore.getState().vimModeLabel).toBe("INSERT");
  });

  it("formats visual submodes for status indicator", async () => {
    render(<EditorPane onChange={vi.fn()} />);

    const handler = mockCm.on.mock.calls.find((call) => call[0] === "vim-mode-change")?.[1] as
      | ((event: { mode: string; subMode?: string }) => void)
      | undefined;

    await act(async () => {
      handler?.({ mode: "visual", subMode: "linewise" });
    });
    expect(useEditorStore.getState().vimModeLabel).toBe("VISUAL LINE");

    await act(async () => {
      handler?.({ mode: "visual", subMode: "blockwise" });
    });
    expect(useEditorStore.getState().vimModeLabel).toBe("VISUAL BLOCK");
  });

  it("clears indicator when vim mode disabled", async () => {
    const { rerender } = render(<EditorPane onChange={vi.fn()} />);
    expect(useEditorStore.getState().vimModeLabel).toBe("NORMAL");

    await act(async () => {
      useSettingsStore.setState({ vimMode: false });
    });

    rerender(<EditorPane onChange={vi.fn()} />);

    expect(mockCm.off).toHaveBeenCalledWith("vim-mode-change", expect.any(Function));
    expect(useEditorStore.getState().vimModeLabel).toBeNull();
  });
});
