import { invoke } from "@tauri-apps/api/core";
import { writeTempHtml } from "@/lib/commands";

function buildPrintHtml(bodyHtml: string, title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      background: white !important;
      color: #1a1a1a;
      margin: 0; padding: 0;
      font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-print-color-adjust: exact;
    }
    .page { max-width: 210mm; margin: 0 auto; }
    h1 { font-size: 1.8rem; font-weight: 700; margin: 0 0 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
    h2 { font-size: 1.3rem; font-weight: 600; margin: 1.5rem 0 0.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25rem; }
    h3 { font-size: 1.1rem; font-weight: 600; margin: 1.25rem 0 0.4rem; }
    h4 { font-size: 1rem; font-weight: 600; margin: 1rem 0 0.35rem; }
    p { margin: 0 0 0.9rem; }
    ul, ol { padding-left: 1.5rem; margin: 0 0 0.9rem; }
    li { margin-bottom: 0.25rem; }
    a { color: #2563eb; text-decoration: underline; }
    code {
      background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 3px;
      padding: 0.1em 0.35em; font-size: 0.85em;
      font-family: "JetBrains Mono", ui-monospace, monospace;
    }
    pre {
      background: #1e1e2e; color: #cdd6f4; border-radius: 6px;
      padding: 1rem; overflow-x: auto; margin: 0 0 1rem; page-break-inside: avoid;
    }
    pre code { background: none; border: none; padding: 0; font-size: 0.85rem; color: inherit; }
    blockquote {
      border-left: 3px solid #2563eb; background: #eff6ff;
      padding: 0.5rem 1rem; margin: 0 0 1rem; border-radius: 0 4px 4px 0;
    }
    table { width: 100%; border-collapse: collapse; margin: 0 0 1rem; page-break-inside: avoid; }
    th, td { border: 1px solid #e5e7eb; padding: 0.4rem 0.75rem; text-align: left; }
    th { background: #f9fafb; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
    img { max-width: 100%; height: auto; }
    @media screen {
      body { background: #f0f0f0 !important; padding-top: 60px; }
      .page { background: white; padding: 16mm; box-shadow: 0 2px 12px rgba(0,0,0,0.12); border-radius: 4px; margin: 24px auto; }
      .print-bar {
        position: fixed; top: 0; left: 0; right: 0; z-index: 100;
        background: #1e1e2e; color: #cdd6f4;
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 20px; font-family: ui-sans-serif, sans-serif; font-size: 13px;
      }
      .print-bar button {
        background: #4a9eff; color: white; border: none; border-radius: 6px;
        padding: 7px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
      }
      .print-bar button:hover { background: #2563eb; }
    }
    @media print {
      .print-bar { display: none !important; }
      body { padding: 0; background: white !important; }
      .page { box-shadow: none; max-width: none; padding: 0; border-radius: 0; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span style="opacity:0.7">${title}</span>
    <button onclick="window.print()">🖨 Save as PDF / Print</button>
  </div>
  <main class="page">${bodyHtml}</main>
</body>
</html>`;
}

export async function exportAsPdf(bodyHtml: string, title: string): Promise<void> {
  const html = buildPrintHtml(bodyHtml, title);
  const tmpPath = await writeTempHtml(html);
  await invoke("plugin:opener|open_path", { path: tmpPath });
}
