import hljs from "highlight.js";
import renderMathInElement from "katex/contrib/auto-render";
import mermaid from "mermaid";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { FrontmatterBar } from "@/components/FrontmatterBar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getThemeCss } from "@/lib/hljsTheme";
import { useEditorStore } from "@/store/editor";
import { useSettingsStore } from "@/store/settings";
import "katex/dist/katex.min.css";
import { useFileOps } from "@/hooks/useFileOps";

mermaid.initialize({ startOnLoad: false, theme: "dark" });

function resolveImages(
  container: HTMLElement,
  currentFilePath: string | null,
  rootDir: string | null
) {
  const baseDir = currentFilePath
    ? currentFilePath.substring(0, currentFilePath.lastIndexOf("/"))
    : rootDir;
  if (!baseDir) return;

  container.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    const src = img.getAttribute("src");
    if (!src) return;
    // Already an absolute URL, asset:// URL, blob, or data URI — skip
    if (
      src.startsWith("http") ||
      src.startsWith("asset:") ||
      src.startsWith("blob:") ||
      src.startsWith("data:")
    )
      return;
    const absolutePath = src.startsWith("/") ? src : `${baseDir}/${src}`;
    img.src = convertFileSrc(absolutePath);
  });
}

function attachCopyButtons(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>("pre").forEach((pre) => {
    if (pre.querySelector(".copy-btn")) return;
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.setAttribute("aria-label", "Copy code");
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
    btn.addEventListener("click", async () => {
      const code = pre.querySelector("code");
      const text = code?.innerText ?? pre.innerText;
      await navigator.clipboard.writeText(text);
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      btn.classList.add("copied");
      setTimeout(() => {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
        btn.classList.remove("copied");
      }, 2000);
    });
    pre.style.position = "relative";
    pre.appendChild(btn);
  });
}

function prepareMermaidBlocks(container: HTMLElement) {
  container
    .querySelectorAll<HTMLElement>("pre code.language-mermaid, pre code.hljs.language-mermaid")
    .forEach((code) => {
      const pre = code.parentElement as HTMLElement;
      const src = code.innerText;
      const div = document.createElement("div");
      div.className = "mermaid not-prose my-4";
      div.textContent = src;
      pre.replaceWith(div);
    });
}

function handleWikilinks(
  container: HTMLElement,
  rootDir: string | null,
  onOpenFile: (path: string) => void
) {
  container.querySelectorAll<HTMLAnchorElement>("a[href^='wikilink://']").forEach((a) => {
    a.style.cursor = "pointer";
    a.style.textDecoration = "underline";
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const href = a.getAttribute("href") ?? "";
      const name = decodeURIComponent(href.replace("wikilink://", ""));
      if (!rootDir || !name) return;
      onOpenFile(`${rootDir}/${name}.md`);
    });
  });
}

function rehighlight(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>("pre code").forEach((block) => {
    block.removeAttribute("data-highlighted");
    hljs.highlightElement(block);
  });
}

export function PreviewPane() {
  const previewHtml = useEditorStore((s) => s.previewHtml);
  const rootDir = useEditorStore((s) => s.rootDir);
  const currentFilePath = useEditorStore((s) => s.currentFilePath);
  const hljsTheme = useSettingsStore((s) => s.hljsTheme);
  const customThemes = useSettingsStore((s) => s.customThemes);
  const containerRef = useRef<HTMLDivElement>(null);
  const { openFile } = useFileOps();

  const rootDirRef = useRef(rootDir);
  const currentFilePathRef = useRef(currentFilePath);
  const openFileRef = useRef(openFile);
  useEffect(() => {
    rootDirRef.current = rootDir;
  }, [rootDir]);
  useEffect(() => {
    currentFilePathRef.current = currentFilePath;
  }, [currentFilePath]);
  useEffect(() => {
    openFileRef.current = openFile;
  }, [openFile]);

  const custom = customThemes.find((t) => t.id === hljsTheme);
  const themeCss = getThemeCss(hljsTheme, custom?.css);

  const innerHtml = useMemo(
    () => ({
      __html: previewHtml || "<p class='preview-empty'>Start writing to see the preview…</p>",
    }),
    [previewHtml]
  );

  const renderAll = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    rehighlight(el);
    prepareMermaidBlocks(el);

    renderMathInElement(el, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
      ignoredClasses: ["mermaid"],
      throwOnError: false,
    });

    const mermaidNodes = el.querySelectorAll<HTMLElement>(".mermaid");
    if (mermaidNodes.length > 0) {
      mermaidNodes.forEach((n) => {
        n.removeAttribute("data-processed");
      });
      await mermaid.run({ nodes: Array.from(mermaidNodes), suppressErrors: true });
    }

    attachCopyButtons(el);
    handleWikilinks(el, rootDirRef.current, openFileRef.current);
    resolveImages(el, currentFilePathRef.current, rootDirRef.current);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      renderAll();
    }, 0);
    return () => clearTimeout(t);
  }, [previewHtml, renderAll]);

  useEffect(() => {
    rehighlight(containerRef.current!);
  }, [hljsTheme]);

  return (
    <div className="flex-1 h-full overflow-hidden border-l border-border flex flex-col bg-background">
      <FrontmatterBar />
      <ScrollArea className="flex-1">
        <div
          ref={containerRef}
          className="prose-preview px-8 py-6 text-sm leading-relaxed max-w-3xl mx-auto"
        >
          <style>{themeCss}</style>
          <div dangerouslySetInnerHTML={innerHtml} />
        </div>
      </ScrollArea>
    </div>
  );
}
