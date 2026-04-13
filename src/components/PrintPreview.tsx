import * as Dialog from "@radix-ui/react-dialog";
import { Printer, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

const PRINT_CSS = `
  @page { size: A4; margin: 16mm; }

  @media print {
    body > *:not(#md-print-portal) { display: none !important; }
    #md-print-portal {
      display: block !important;
      position: static !important;
      background: white !important;
      color: #1a1a1a;
      font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-print-color-adjust: exact;
    }
    #md-print-portal h1 { font-size: 1.8rem; font-weight: 700; margin: 0 0 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
    #md-print-portal h2 { font-size: 1.3rem; font-weight: 600; margin: 1.5rem 0 0.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25rem; }
    #md-print-portal h3 { font-size: 1.1rem; font-weight: 600; margin: 1.25rem 0 0.4rem; }
    #md-print-portal h4 { font-size: 1rem; font-weight: 600; margin: 1rem 0 0.35rem; }
    #md-print-portal p { margin: 0 0 0.9rem; }
    #md-print-portal ul, #md-print-portal ol { padding-left: 1.5rem; margin: 0 0 0.9rem; }
    #md-print-portal li { margin-bottom: 0.25rem; }
    #md-print-portal a { color: #2563eb; text-decoration: underline; }
    #md-print-portal code { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 3px; padding: 0.1em 0.35em; font-size: 0.85em; font-family: "JetBrains Mono", ui-monospace, monospace; color: #24292e; }
    #md-print-portal pre { background: #f6f8fa; color: #24292e; border: 1px solid #e1e4e8; border-radius: 6px; padding: 1rem; overflow-x: auto; margin: 0 0 1rem; page-break-inside: avoid; }
    #md-print-portal pre code { background: none; border: none; padding: 0; color: inherit; }
    #md-print-portal blockquote { border-left: 3px solid #2563eb; background: #eff6ff; padding: 0.5rem 1rem; margin: 0 0 1rem; border-radius: 0 4px 4px 0; }
    #md-print-portal table { width: 100%; border-collapse: collapse; margin: 0 0 1rem; page-break-inside: avoid; }
    #md-print-portal th, #md-print-portal td { border: 1px solid #e5e7eb; padding: 0.4rem 0.75rem; text-align: left; }
    #md-print-portal th { background: #f9fafb; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }
    #md-print-portal hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
    #md-print-portal img { max-width: 100%; height: auto; }
  }
`;

function getOrCreatePrintPortal(): HTMLDivElement {
  let el = document.getElementById("md-print-portal") as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "md-print-portal";
    el.style.display = "none";
    document.body.appendChild(el);
  }
  return el;
}

function getOrCreatePrintStyle(): HTMLStyleElement {
  let el = document.getElementById("md-print-style") as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = "md-print-style";
    document.head.appendChild(el);
  }
  return el;
}

const PREVIEW_CSS = `
  .print-body * { box-sizing: border-box; }
  .print-body {
    font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #1a1a1a; background: white;
    padding: 16mm; max-width: 210mm; margin: 0 auto;
  }
  .print-body h1 { font-size: 1.8rem; font-weight: 700; margin: 0 0 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
  .print-body h2 { font-size: 1.3rem; font-weight: 600; margin: 1.5rem 0 0.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25rem; }
  .print-body h3 { font-size: 1.1rem; font-weight: 600; margin: 1.25rem 0 0.4rem; }
  .print-body h4 { font-size: 1rem; font-weight: 600; margin: 1rem 0 0.35rem; }
  .print-body p { margin: 0 0 0.9rem; }
  .print-body ul, .print-body ol { padding-left: 1.5rem; margin: 0 0 0.9rem; }
  .print-body li { margin-bottom: 0.25rem; }
  .print-body a { color: #2563eb; text-decoration: underline; }
  .print-body code { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 3px; padding: 0.1em 0.35em; font-size: 0.85em; font-family: "JetBrains Mono", ui-monospace, monospace; color: #24292e; }
  .print-body pre { background: #f6f8fa; color: #24292e; border: 1px solid #e1e4e8; border-radius: 6px; padding: 1rem; overflow-x: auto; margin: 0 0 1rem; }
  .print-body pre code { background: none; border: none; padding: 0; color: inherit; }
  .print-body blockquote { border-left: 3px solid #2563eb; background: #eff6ff; padding: 0.5rem 1rem; margin: 0 0 1rem; border-radius: 0 4px 4px 0; }
  .print-body table { width: 100%; border-collapse: collapse; margin: 0 0 1rem; }
  .print-body th, .print-body td { border: 1px solid #e5e7eb; padding: 0.4rem 0.75rem; text-align: left; }
  .print-body th { background: #f9fafb; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }
  .print-body hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
  .print-body img { max-width: 100%; height: auto; }
  .print-body table tr:nth-child(even) td { background: #f9fafb; }
`;

interface PrintPreviewProps {
  open: boolean;
  onClose: () => void;
  bodyHtml: string;
  title: string;
}

export function PrintPreview({ open, onClose, bodyHtml, title }: PrintPreviewProps) {
  const previewStyleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const portal = getOrCreatePrintPortal();
    const printStyle = getOrCreatePrintStyle();

    if (open) {
      portal.innerHTML = bodyHtml;
      printStyle.textContent = PRINT_CSS;

      let previewStyle = document.getElementById("md-preview-style") as HTMLStyleElement | null;
      if (!previewStyle) {
        previewStyle = document.createElement("style");
        previewStyle.id = "md-preview-style";
        document.head.appendChild(previewStyle);
      }
      previewStyle.textContent = PREVIEW_CSS;
      previewStyleRef.current = previewStyle;
    } else {
      portal.innerHTML = "";
      printStyle.textContent = "";
      previewStyleRef.current?.remove();
      previewStyleRef.current = null;
    }
  }, [open, bodyHtml]);

  const handlePrint = () => window.print();

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-4 z-[501] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden focus:outline-none">
          <Dialog.Title className="sr-only">Print Preview — {title}</Dialog.Title>

          <div className="flex items-center justify-between px-5 h-12 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <Printer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground truncate max-w-[300px]">
                {title}
              </span>
              <span className="text-xs text-muted-foreground">· Print Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handlePrint} size="sm" className="h-7 gap-1.5 text-xs">
                <Printer className="h-3.5 w-3.5" />
                Print / Save as PDF
              </Button>
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
          </div>

          <div className="flex-1 bg-[#d8d8d8] overflow-auto p-8">
            <div
              className="print-body bg-white shadow-xl rounded-sm mx-auto"
              dangerouslySetInnerHTML={{
                __html: bodyHtml || "<p style='color:#999'>No content.</p>",
              }}
            />
          </div>

          <div className="px-5 py-2.5 border-t border-border bg-card/60 shrink-0 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Click <strong>Print / Save as PDF</strong> → choose <strong>Save as PDF</strong> as
              destination
            </p>
            <span className="text-xs text-muted-foreground">A4 · 16mm margins</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
