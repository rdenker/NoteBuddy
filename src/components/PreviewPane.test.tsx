import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorStore } from "@/store/editor";
import { useSettingsStore } from "@/store/settings";

vi.mock("highlight.js", () => ({
  default: {
    highlightElement: vi.fn((el: HTMLElement) => {
      el.setAttribute("data-highlighted", "yes");
      el.className = "hljs language-ts";
    }),
  },
}));
vi.mock("mermaid", () => ({ default: { initialize: vi.fn(), run: vi.fn() } }));
vi.mock("katex/contrib/auto-render", () => ({ default: vi.fn() }));
vi.mock("katex/dist/katex.min.css", () => ({}));
vi.mock("@/hooks/useFileOps", () => ({ useFileOps: () => ({ openFile: vi.fn() }) }));
vi.mock("@/components/FrontmatterBar", () => ({ FrontmatterBar: () => null }));
vi.mock("@/lib/hljsTheme", () => ({
  getThemeCss: (id: string) => `.hljs { background: ${id === "monokai" ? "#272822" : "#0d1117"}; }`,
  HLJS_THEMES: [
    { id: "github-dark", label: "GitHub Dark", css: ".hljs { background: #0d1117; }" },
    { id: "monokai", label: "Monokai", css: ".hljs { background: #272822; }" },
  ],
  HLJS_THEME_MAP: {
    "github-dark": ".hljs { background: #0d1117; }",
    monokai: ".hljs { background: #272822; }",
  },
}));

import { PreviewPane } from "@/components/PreviewPane";

const CODE_HTML = `<pre><code class="language-typescript">const x = 1</code></pre>`;

function setup() {
  useEditorStore.setState({ previewHtml: CODE_HTML, rootDir: "/notes" });
  useSettingsStore.setState({ hljsTheme: "github-dark", customThemes: [], settingsOpen: false });
}

describe("PreviewPane - highlighting and copy buttons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup();
  });

  it("highlights code blocks on initial render", async () => {
    const { container } = render(<PreviewPane />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    const code = container.querySelector("pre code");
    expect(code?.getAttribute("data-highlighted")).toBe("yes");
  });

  it("attaches copy buttons on initial render", async () => {
    const { container } = render(<PreviewPane />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(container.querySelector(".copy-btn")).toBeTruthy();
  });

  it("copy buttons survive hljsTheme change", async () => {
    const { container } = render(<PreviewPane />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(container.querySelector(".copy-btn")).toBeTruthy();

    await act(async () => {
      useSettingsStore.setState({ hljsTheme: "monokai" });
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(container.querySelector(".copy-btn")).toBeTruthy();
  });

  it("copy buttons survive settingsOpen toggling", async () => {
    const { container } = render(<PreviewPane />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(container.querySelector(".copy-btn")).toBeTruthy();

    await act(async () => {
      useSettingsStore.setState({ settingsOpen: true });
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(container.querySelector(".copy-btn")).toBeTruthy();
  });

  it("highlighting survives hljsTheme change", async () => {
    const hljs = (await import("highlight.js")).default;
    const { container: _ } = render(<PreviewPane />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    const callsBefore = (hljs.highlightElement as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(callsBefore).toBeGreaterThan(0);

    await act(async () => {
      useSettingsStore.setState({ hljsTheme: "monokai" });
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const callsAfter = (hljs.highlightElement as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(callsAfter).toBeGreaterThan(callsBefore);
  });

  it("theme CSS tag exists in container with correct content", async () => {
    const { container } = render(<PreviewPane />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    const styles = container.querySelectorAll("style");
    const hljsStyle = Array.from(styles).find((s) => s.textContent?.includes(".hljs"));
    expect(hljsStyle).toBeTruthy();
    expect(hljsStyle?.textContent).toContain("#0d1117");
  });

  it("theme CSS updates when hljsTheme changes", async () => {
    const { container } = render(<PreviewPane />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const styles = () =>
      Array.from(container.querySelectorAll("style")).find((s) => s.textContent?.includes(".hljs"));
    expect(styles()?.textContent).toContain("#0d1117");

    await act(async () => {
      useSettingsStore.setState({ hljsTheme: "monokai" });
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(styles()?.textContent).toContain("#272822");
  });

  it("highlighting does not disappear after previewHtml changes", async () => {
    const { container } = render(<PreviewPane />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(container.querySelector(".copy-btn")).toBeTruthy();

    await act(async () => {
      useEditorStore.setState({
        previewHtml: `<pre><code class="language-typescript">const y = 2</code></pre>`,
      });
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(container.querySelector(".copy-btn")).toBeTruthy();
    expect(container.querySelector("pre code")?.getAttribute("data-highlighted")).toBe("yes");
  });
});

it("TRACE copy button after theme change", async () => {
  const { container } = render(<PreviewPane />);
  await act(async () => {
    await new Promise((r) => setTimeout(r, 100));
  });

  const pre1 = container.querySelector("pre");
  console.log("[T] pre exists:", !!pre1);
  console.log("[T] copy-btn before:", !!container.querySelector(".copy-btn"));
  console.log("[T] pre innerHTML before:", pre1?.innerHTML?.slice(0, 300));

  await act(async () => {
    useSettingsStore.setState({ hljsTheme: "monokai" });
  });

  const pre2 = container.querySelector("pre");
  console.log("[T] same pre node:", pre1 === pre2);
  console.log("[T] copy-btn after setState sync:", !!container.querySelector(".copy-btn"));
  console.log("[T] pre innerHTML after setState:", pre2?.innerHTML?.slice(0, 300));

  await act(async () => {
    await new Promise((r) => setTimeout(r, 100));
  });

  const pre3 = container.querySelector("pre");
  console.log("[T] same pre node after wait:", pre1 === pre3);
  console.log("[T] copy-btn after 100ms:", !!container.querySelector(".copy-btn"));
  console.log("[T] pre innerHTML after 100ms:", pre3?.innerHTML?.slice(0, 300));
});
