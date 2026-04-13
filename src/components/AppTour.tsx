import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settings";

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement: "bottom" | "bottom-start" | "right" | "left" | "top";
  padding?: number;
  beforeEnter?: () => void;
  afterLeave?: () => void;
}

function buildSteps(openSettings: () => void, closeSettings: () => void): TourStep[] {
  return [
    {
      target: "[data-tour='toolbar']",
      title: "Toolbar",
      content:
        "Create, open, and save files. Switch between editor-only, split view, and preview-only with the panel buttons on the right. The gear icon opens Settings.",
      placement: "bottom",
      beforeEnter: closeSettings,
    },
    {
      target: "[data-tour='cmd-k']",
      title: "Command palette ⌘K",
      content:
        "The fastest way to navigate. Type anything to full-text search across all your notes. Type > to filter commands: new file, save, switch view, export HTML, export PDF, open settings.",
      placement: "bottom",
      beforeEnter: closeSettings,
    },
    {
      target: "[data-tour='sidebar']",
      title: "File explorer",
      content:
        "Browse your folder here. Hover any file or folder to see inline rename/delete buttons — or right-click for a context menu. The tag panel filters files by frontmatter tags.",
      placement: "right",
      beforeEnter: closeSettings,
    },
    {
      target: "[data-tour='editor']",
      title: "Editor",
      content:
        "Full markdown editing with smart autocomplete. Ctrl+Space for snippets and keywords. Type : for emoji. ⌘F opens find & replace. Paste or drag images — saved to assets/ automatically.",
      placement: "right",
      beforeEnter: closeSettings,
    },
    {
      target: "[data-tour='preview']",
      title: "Live preview",
      content:
        "Renders instantly — Mermaid diagrams, KaTeX math ($E=mc^2$), syntax-highlighted code with copy buttons, and [[Wikilinks]] you can click to open linked notes.",
      placement: "left",
      beforeEnter: closeSettings,
    },
    {
      target: "[data-tour='settings-btn']",
      title: "Settings & export",
      content:
        "Change editor/preview themes, font size, window opacity and blur. Use ⌘P or ⌘K → > export pdf to print or save as PDF or HTML.",
      placement: "bottom-start",
      beforeEnter: closeSettings,
    },
    {
      target: "[data-tour='settings-panel']",
      title: "Settings panel",
      content:
        "Four tabs: Appearance (themes, opacity, blur), Editor (line numbers, auto-save), Tags (browse all tags with counts — click to filter the file tree), About (shortcuts + restart this tour).",
      placement: "left",
      padding: 0,
      beforeEnter: openSettings,
      afterLeave: closeSettings,
    },
  ];
}

function waitForElement(selector: string, timeoutMs = 1500): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) {
      resolve(el);
      return;
    }
    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

function TooltipCard({
  step,
  stepIndex,
  total,
  rect,
  onNext,
  onPrev,
  onClose,
}: {
  step: TourStep;
  stepIndex: number;
  total: number;
  rect: DOMRect;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const GAP = 14;
  const CARD_W = 310;

  let top = 0;
  let left = 0;

  switch (step.placement) {
    case "bottom":
    case "bottom-start":
      top = rect.bottom + GAP;
      left =
        step.placement === "bottom-start" ? rect.left : rect.left + rect.width / 2 - CARD_W / 2;
      break;
    case "top":
      top = rect.top - GAP - 170;
      left = rect.left + rect.width / 2 - CARD_W / 2;
      break;
    case "right":
      top = rect.top + rect.height / 2 - 90;
      left = rect.right + GAP;
      break;
    case "left":
      top = rect.top + rect.height / 2 - 90;
      left = rect.left - CARD_W - GAP;
      break;
  }

  top = Math.max(8, Math.min(top, window.innerHeight - 210));
  left = Math.max(8, Math.min(left, window.innerWidth - CARD_W - 8));

  return (
    <div
      className="tour-card fixed z-[300] rounded-xl border border-border bg-card shadow-2xl p-5 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ top, left, width: CARD_W }}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary block mb-1">
            Step {stepIndex + 1} of {total}
          </span>
          <h3 className="text-sm font-semibold text-foreground leading-snug">{step.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors -mt-0.5 -mr-1 shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{step.content}</p>

      <div className="flex items-center gap-2">
        {stepIndex > 0 && (
          <Button variant="outline" size="sm" onClick={onPrev} className="h-7 px-2.5 text-xs gap-1">
            <ArrowLeft className="h-3 w-3" /> Back
          </Button>
        )}
        <div className="flex-1 flex justify-end">
          {stepIndex < total - 1 ? (
            <Button size="sm" onClick={onNext} className="h-7 px-3 text-xs gap-1">
              Next <ArrowRight className="h-3 w-3" />
            </Button>
          ) : (
            <Button size="sm" onClick={onClose} className="h-7 px-3 text-xs gap-1">
              Done ✓
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mt-3.5 justify-center">
        {Array.from({ length: total }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: pagination dots have no other stable identity
            key={`dot-${i}`}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === stepIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/25"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function AppTour() {
  const { tourActive, setTourActive, setSettingsOpen } = useSettingsStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const stepsRef = useRef<TourStep[]>([]);

  const openSettings = useCallback(() => setSettingsOpen(true), [setSettingsOpen]);
  const closeSettings = useCallback(() => setSettingsOpen(false), [setSettingsOpen]);

  useEffect(() => {
    stepsRef.current = buildSteps(openSettings, closeSettings);
  }, [openSettings, closeSettings]);

  const goToStep = useCallback(async (index: number) => {
    const steps = stepsRef.current;
    if (index < 0 || index >= steps.length) return;
    setTransitioning(true);
    setRect(null);

    const step = steps[index];
    if (step.beforeEnter) step.beforeEnter();

    const el = await waitForElement(step.target);
    if (!el) {
      setTransitioning(false);
      return;
    }

    const r = el.getBoundingClientRect();
    setRect(r);
    setStepIndex(index);
    setTransitioning(false);
  }, []);

  useEffect(() => {
    if (!tourActive) return;
    const steps = stepsRef.current;
    if (steps.length === 0) return;
    goToStep(0);
  }, [tourActive, goToStep]);

  useEffect(() => {
    if (!tourActive || !stepsRef.current[stepIndex]) return;
    const step = stepsRef.current[stepIndex];
    const updateRect = () => {
      const el = document.querySelector(step.target);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [tourActive, stepIndex]);

  const handleClose = useCallback(() => {
    const steps = stepsRef.current;
    const step = steps[stepIndex];
    if (step?.afterLeave) step.afterLeave();
    setTourActive(false);
    setStepIndex(0);
    setRect(null);
  }, [setTourActive, stepIndex]);

  const handleNext = useCallback(() => {
    const steps = stepsRef.current;
    const current = steps[stepIndex];
    if (current?.afterLeave && stepIndex < steps.length - 1) current.afterLeave();
    if (stepIndex < steps.length - 1) goToStep(stepIndex + 1);
    else handleClose();
  }, [stepIndex, goToStep, handleClose]);

  const handlePrev = useCallback(() => {
    const steps = stepsRef.current;
    const current = steps[stepIndex];
    if (current?.afterLeave) current.afterLeave();
    if (stepIndex > 0) goToStep(stepIndex - 1);
  }, [stepIndex, goToStep]);

  if (!tourActive || transitioning || !rect) return null;

  const currentStep = stepsRef.current[stepIndex];
  if (!currentStep) return null;

  const PAD = currentStep.padding ?? 6;

  return createPortal(
    <>
      <svg
        aria-hidden="true"
        className="fixed inset-0 z-[290] pointer-events-none"
        width="100%"
        height="100%"
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={rect.left - PAD}
              y={rect.top - PAD}
              width={rect.width + PAD * 2}
              height={rect.height + PAD * 2}
              rx="6"
              fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-mask)" />
        <rect
          x={rect.left - PAD}
          y={rect.top - PAD}
          width={rect.width + PAD * 2}
          height={rect.height + PAD * 2}
          rx="6"
          fill="none"
          stroke="hsl(217 91% 65%)"
          strokeWidth="1.5"
          opacity="0.7"
        />
      </svg>

      <div className="fixed inset-0 z-[295] pointer-events-auto" />

      <TooltipCard
        step={currentStep}
        stepIndex={stepIndex}
        total={stepsRef.current.length}
        rect={rect}
        onNext={handleNext}
        onPrev={handlePrev}
        onClose={handleClose}
      />
    </>,
    document.body
  );
}
