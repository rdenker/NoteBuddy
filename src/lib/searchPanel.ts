import {
  closeSearchPanel,
  findNext,
  findPrevious,
  getSearchQuery,
  replaceAll,
  replaceNext,
  SearchQuery,
  setSearchQuery,
} from "@codemirror/search";
import type { EditorView } from "@codemirror/view";

function el<T extends HTMLElement>(
  tag: string,
  attrs: Record<string, string> = {},
  ...children: (HTMLElement | Text | string)[]
): T {
  const e = document.createElement(tag) as T;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else e.setAttribute(k, v);
  }
  for (const child of children) {
    e.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return e;
}

function icon(svg: string): HTMLElement {
  const span = document.createElement("span");
  span.innerHTML = svg;
  return span;
}

const CLOSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const UP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`;
const DOWN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

export class CustomSearchPanel {
  dom: HTMLElement;
  private findInput: HTMLInputElement;
  private replaceInput: HTMLInputElement;
  private caseToggle: HTMLButtonElement;
  private regexToggle: HTMLButtonElement;
  private wordToggle: HTMLButtonElement;
  private matchCount: HTMLElement;
  private replaceRow: HTMLElement;
  private showReplace = false;

  constructor(private view: EditorView) {
    this.dom = el("div", { class: "cm-custom-search-panel" });

    this.findInput = el<HTMLInputElement>("input", {
      class: "cm-search-input",
      placeholder: "Find…",
      "aria-label": "Find",
      "main-field": "true",
    });

    this.replaceInput = el<HTMLInputElement>("input", {
      class: "cm-search-input",
      placeholder: "Replace…",
      "aria-label": "Replace",
    });

    this.matchCount = el("span", { class: "cm-search-count" }, "");

    this.caseToggle = el<HTMLButtonElement>(
      "button",
      { class: "cm-search-toggle", title: "Case sensitive", "aria-label": "Case sensitive" },
      "Aa"
    );
    this.regexToggle = el<HTMLButtonElement>(
      "button",
      { class: "cm-search-toggle", title: "Use regex", "aria-label": "Use regex" },
      ".*"
    );
    this.wordToggle = el<HTMLButtonElement>(
      "button",
      { class: "cm-search-toggle", title: "Whole word", "aria-label": "Whole word" },
      "W"
    );

    const prevBtn = el<HTMLButtonElement>(
      "button",
      { class: "cm-search-btn", title: "Previous (Shift+Enter)" },
      icon(UP_SVG)
    );
    const nextBtn = el<HTMLButtonElement>(
      "button",
      { class: "cm-search-btn", title: "Next (Enter)" },
      icon(DOWN_SVG)
    );
    const replaceOneBtn = el<HTMLButtonElement>(
      "button",
      { class: "cm-search-btn cm-search-btn-text", title: "Replace" },
      "Replace"
    );
    const replaceAllBtn = el<HTMLButtonElement>(
      "button",
      { class: "cm-search-btn cm-search-btn-text", title: "Replace all" },
      "All"
    );
    const expandBtn = el<HTMLButtonElement>(
      "button",
      { class: "cm-search-btn cm-search-btn-text cm-search-expand" },
      "→ Replace"
    );
    const closeBtn = el<HTMLButtonElement>(
      "button",
      { class: "cm-search-close", title: "Close (Esc)" },
      icon(CLOSE_SVG)
    );

    const findRow = el(
      "div",
      { class: "cm-search-row" },
      el(
        "div",
        { class: "cm-search-input-wrap" },
        this.findInput,
        el(
          "div",
          { class: "cm-search-toggles" },
          this.caseToggle,
          this.regexToggle,
          this.wordToggle
        )
      ),
      this.matchCount,
      prevBtn,
      nextBtn,
      expandBtn,
      closeBtn
    );

    this.replaceRow = el(
      "div",
      { class: "cm-search-row cm-search-replace-row" },
      el("div", { class: "cm-search-input-wrap" }, this.replaceInput),
      replaceOneBtn,
      replaceAllBtn
    );
    this.replaceRow.style.display = "none";

    this.dom.appendChild(findRow);
    this.dom.appendChild(this.replaceRow);

    this.findInput.addEventListener("input", () => this.commit());
    this.findInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) findPrevious(this.view);
        else findNext(this.view);
      }
      if (e.key === "Escape") closeSearchPanel(this.view);
    });
    this.replaceInput.addEventListener("input", () => this.commit());
    this.replaceInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        replaceNext(this.view);
      }
    });

    prevBtn.addEventListener("click", () => findPrevious(this.view));
    nextBtn.addEventListener("click", () => findNext(this.view));
    replaceOneBtn.addEventListener("click", () => {
      replaceNext(this.view);
      this.updateCount();
    });
    replaceAllBtn.addEventListener("click", () => {
      replaceAll(this.view);
      this.updateCount();
    });
    closeBtn.addEventListener("click", () => closeSearchPanel(this.view));

    expandBtn.addEventListener("click", () => {
      this.showReplace = !this.showReplace;
      this.replaceRow.style.display = this.showReplace ? "flex" : "none";
      expandBtn.textContent = this.showReplace ? "↑ Replace" : "→ Replace";
      if (this.showReplace) this.replaceInput.focus();
    });

    this.caseToggle.addEventListener("click", () => this.toggleOption("caseSensitive"));
    this.regexToggle.addEventListener("click", () => this.toggleOption("regexp"));
    this.wordToggle.addEventListener("click", () => this.toggleOption("wholeWord"));

    this.syncToggles();
  }

  private getQuery(): SearchQuery {
    return getSearchQuery(this.view.state);
  }

  private commit() {
    const q = this.getQuery();
    this.view.dispatch({
      effects: setSearchQuery.of(
        new SearchQuery({
          search: this.findInput.value,
          replace: this.replaceInput.value,
          caseSensitive: q.caseSensitive,
          regexp: q.regexp,
          wholeWord: q.wholeWord,
        })
      ),
    });
    this.updateCount();
  }

  private toggleOption(opt: "caseSensitive" | "regexp" | "wholeWord") {
    const q = this.getQuery();
    this.view.dispatch({
      effects: setSearchQuery.of(
        new SearchQuery({
          search: this.findInput.value,
          replace: this.replaceInput.value,
          caseSensitive: opt === "caseSensitive" ? !q.caseSensitive : q.caseSensitive,
          regexp: opt === "regexp" ? !q.regexp : q.regexp,
          wholeWord: opt === "wholeWord" ? !q.wholeWord : q.wholeWord,
        })
      ),
    });
    this.syncToggles();
    this.updateCount();
  }

  private syncToggles() {
    const q = this.getQuery();
    this.caseToggle.dataset.active = String(q.caseSensitive);
    this.regexToggle.dataset.active = String(q.regexp);
    this.wordToggle.dataset.active = String(q.wholeWord);
  }

  private updateCount() {
    try {
      const q = this.getQuery();
      if (!q.valid || !this.findInput.value) {
        this.matchCount.textContent = "";
        return;
      }
      const cursor = q.getCursor(this.view.state);
      let count = 0;
      while (!cursor.next().done) count++;
      this.matchCount.textContent =
        count === 0 ? "No results" : `${count} match${count !== 1 ? "es" : ""}`;
      this.matchCount.style.color = count === 0 ? "hsl(0 62% 54%)" : "";
    } catch {
      this.matchCount.textContent = "";
    }
  }

  mount() {
    const q = this.getQuery();
    this.findInput.value = q.search ?? "";
    this.replaceInput.value = q.replace ?? "";
    this.syncToggles();
    setTimeout(() => this.findInput.focus(), 10);
  }

  update() {
    this.syncToggles();
    this.updateCount();
  }
}
