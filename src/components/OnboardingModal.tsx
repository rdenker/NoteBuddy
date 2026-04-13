import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Command,
  FileCode2,
  FolderOpen,
  Hash,
  Sigma,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { listDirectory, openDirectory, writeFile } from "@/lib/commands";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { getWelcomeMd } from "@/lib/welcomeContent";
import { useEditorStore } from "@/store/editor";
import { useSettingsStore } from "@/store/settings";

const FEATURES = [
  {
    icon: BookOpen,
    label: "Live preview",
    desc: "Editor + rendered markdown side-by-side",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
  },
  {
    icon: Zap,
    label: "Autocomplete",
    desc: "Snippets, keywords, emoji & local symbols",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    icon: FileCode2,
    label: "Syntax highlighting",
    desc: "20+ languages in code blocks",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: Hash,
    label: "Wikilinks & tags",
    desc: "[[Note Name]] links + tag filtering",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
  },
  {
    icon: Sigma,
    label: "KaTeX math",
    desc: "Inline $...$ and display $$...$$ blocks",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
  {
    icon: Command,
    label: "Command palette",
    desc: "⌘K — full-text search + commands",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: spring.snappy },
};

type Step = "welcome" | "pick-folder" | "done";

interface OnboardingModalProps {
  onComplete: (folder: string) => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const { setHasOnboarded, setLastFolder, setTourActive } = useSettingsStore();
  const { setRootDir, setFileTree } = useEditorStore();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickFolder = useCallback(async () => {
    const dir = await openDirectory();
    if (!dir) return;
    setSelectedFolder(dir);
  }, []);

  const handleFinish = useCallback(async () => {
    if (!selectedFolder) return;
    setLoading(true);
    try {
      const welcomePath = `${selectedFolder}/WELCOME.md`;
      await writeFile(welcomePath, getWelcomeMd());
      const tree = await listDirectory(selectedFolder);
      setRootDir(selectedFolder);
      setFileTree(tree);
      setLastFolder(selectedFolder);
      setHasOnboarded(true);
      setStep("done");
      setTimeout(() => {
        onComplete(selectedFolder);
        setTourActive(true);
      }, 800);
    } finally {
      setLoading(false);
    }
  }, [
    selectedFolder,
    setRootDir,
    setFileTree,
    setLastFolder,
    setHasOnboarded,
    setTourActive,
    onComplete,
  ]);

  const STEPS: Step[] = ["welcome", "pick-folder", "done"];
  const currentStepIndex = STEPS.indexOf(step);

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <motion.div
          className="fixed inset-0 z-50"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(217 91% 65% / 0.07) 0%, transparent 70%), hsl(222 20% 5% / 0.85)",
            backdropFilter: "blur(12px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        />

        <style>{`
          @keyframes nb-breathe {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.65; transform: scale(1.02); }
          }
          @keyframes nb-spin-slow {
            to { transform: rotate(360deg); }
          }
          @keyframes nb-ring-expand {
            0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.8; }
            100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
          }
          @keyframes nb-shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          .nb-shimmer {
            background: linear-gradient(90deg, hsl(210 17% 92%) 0%, hsl(217 91% 80%) 40%, hsl(210 17% 92%) 60%, hsl(217 91% 75%) 80%, hsl(210 17% 92%) 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: nb-shimmer 4s linear infinite;
          }
          .nb-breathe { animation: nb-breathe 3s ease-in-out infinite; }
          .nb-ring { animation: nb-ring-expand 0.8s ease-out forwards; }
          .nb-orbit-a { animation: nb-spin-slow 18s linear infinite; }
          .nb-orbit-b { animation: nb-spin-slow 12s linear infinite reverse; }
          .nb-spin { animation: nb-spin-slow 0.7s linear infinite; }
        `}</style>

        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[620px] focus:outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <motion.div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "hsl(222 16% 9%)",
              border: "1px solid hsl(220 10% 16%)",
              boxShadow:
                "0 0 0 1px hsl(217 91% 65% / 0.06), 0 32px 80px hsl(222 20% 3% / 0.8), 0 8px 24px hsl(217 91% 65% / 0.06)",
            }}
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0, transition: spring.smooth }}
          >
            <AnimatePresence mode="wait">
              {step === "welcome" && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0, transition: spring.snappy }}
                  exit={{ opacity: 0, x: -28, transition: { duration: 0.18 } }}
                >
                  <WelcomeStep onNext={() => setStep("pick-folder")} />
                </motion.div>
              )}
              {step === "pick-folder" && (
                <motion.div
                  key="pick"
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0, transition: spring.snappy }}
                  exit={{ opacity: 0, x: -28, transition: { duration: 0.18 } }}
                >
                  <PickFolderStep
                    selectedFolder={selectedFolder}
                    onPick={handlePickFolder}
                    onFinish={handleFinish}
                    loading={loading}
                  />
                </motion.div>
              )}
              {step === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1, transition: spring.bounce }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <DoneStep />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-2 pb-6">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s}
                  animate={{
                    width: i === currentStepIndex ? 20 : 6,
                    opacity: i <= currentStepIndex ? 1 : 0.25,
                  }}
                  transition={spring.snappy}
                  className="h-1.5 rounded-full bg-primary"
                />
              ))}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="nb-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="hsl(217 91% 65%)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nb-grid)" />
        </svg>

        <div
          className="absolute inset-0 nb-breathe"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 10%, hsl(217 91% 65% / 0.18) 0%, transparent 70%)",
          }}
        />

        <div
          className="absolute"
          style={{
            left: "50%",
            top: "50%",
            width: 180,
            height: 180,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="absolute inset-0 rounded-full nb-orbit-a"
            style={{ border: "1px solid hsl(217 91% 65% / 0.12)" }}
          />
          <div
            className="absolute rounded-full nb-orbit-b"
            style={{ inset: 22, border: "1px solid hsl(217 91% 65% / 0.08)" }}
          />
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{
              background: "hsl(222 16% 9%)",
              border: "1px solid hsl(217 91% 65% / 0.3)",
              boxShadow: "0 0 32px hsl(217 91% 65% / 0.25), inset 0 1px 0 hsl(217 91% 80% / 0.1)",
            }}
          >
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />
      </div>

      <div className="px-10 pt-6 pb-4">
        <div className="text-center mb-8">
          <h1
            className="nb-shimmer mb-2"
            style={{
              fontFamily: "'New York', 'Iowan Old Style', Georgia, serif",
              fontSize: "2rem",
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}
          >
            NoteBuddy
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(215 10% 52%)" }}>
            A fast, local-first markdown editor. Your notes live on your machine —{" "}
            <span style={{ color: "hsl(210 17% 75%)" }}>no cloud, no accounts.</span>
          </p>
        </div>

        <motion.div
          className="grid grid-cols-3 gap-2.5 mb-8"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {FEATURES.map(({ icon: Icon, label, desc, color, bg }) => (
            <motion.div
              key={label}
              variants={itemVariants}
              className="flex flex-col gap-2 rounded-xl p-3.5 cursor-default select-none"
              style={{
                background: "hsl(220 12% 11%)",
                border: "1px solid hsl(220 10% 16%)",
              }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
            >
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", bg)}>
                <Icon className={cn("h-3.5 w-3.5", color)} />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: "hsl(210 17% 88%)" }}>
                  {label}
                </div>
                <div
                  className="text-[10px] leading-snug mt-0.5"
                  style={{ color: "hsl(215 10% 48%)" }}
                >
                  {desc}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { ...spring.gentle, delay: 0.5 } }}
        >
          <Button
            onClick={onNext}
            className="w-full gap-2 h-11 text-sm font-semibold"
            style={{
              background: "hsl(217 91% 65%)",
              color: "hsl(222 13% 9%)",
              boxShadow: "0 0 24px hsl(217 91% 65% / 0.35)",
            }}
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function PickFolderStep({
  selectedFolder,
  onPick,
  onFinish,
  loading,
}: {
  selectedFolder: string | null;
  onPick: () => void;
  onFinish: () => void;
  loading: boolean;
}) {
  const folderName = selectedFolder?.split("/").pop() ?? selectedFolder?.split("\\").pop();

  return (
    <div className="px-10 pt-10 pb-4">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: spring.snappy }}
      >
        <h2
          className="mb-2"
          style={{
            fontFamily: "'New York', 'Iowan Old Style', Georgia, serif",
            fontSize: "1.65rem",
            lineHeight: 1.2,
            color: "hsl(210 17% 92%)",
            letterSpacing: "-0.01em",
          }}
        >
          Choose your notes folder
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(215 10% 52%)" }}>
          All your notes will live here. A{" "}
          <code
            className="px-1.5 py-0.5 rounded-md text-xs"
            style={{
              background: "hsl(220 10% 14%)",
              color: "hsl(217 91% 65%)",
              border: "1px solid hsl(220 10% 20%)",
            }}
          >
            WELCOME.md
          </code>{" "}
          guide is created automatically.
        </p>
      </motion.div>

      <motion.button
        onClick={onPick}
        className="w-full text-left rounded-2xl transition-all relative overflow-hidden"
        style={{
          padding: "1.5rem",
          border: selectedFolder
            ? "1.5px solid hsl(217 91% 65% / 0.4)"
            : "1.5px dashed hsl(220 10% 22%)",
          background: selectedFolder ? "hsl(217 91% 65% / 0.04)" : "hsl(220 12% 11%)",
        }}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.998 }}
        transition={spring.snappy}
      >
        {selectedFolder && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 30% 50%, hsl(217 91% 65% / 0.06) 0%, transparent 70%)",
            }}
          />
        )}

        <div className="flex items-center gap-4 relative">
          <motion.div
            animate={{
              background: selectedFolder ? "hsl(217 91% 65% / 0.15)" : "hsl(220 10% 14%)",
            }}
            transition={{ duration: 0.3 }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          >
            <FolderOpen
              className="h-5 w-5 transition-colors"
              style={{ color: selectedFolder ? "hsl(217 91% 65%)" : "hsl(215 10% 42%)" }}
            />
          </motion.div>

          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              {selectedFolder ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: spring.snappy }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.1 } }}
                >
                  <div
                    className="text-sm font-semibold truncate"
                    style={{ color: "hsl(210 17% 92%)" }}
                  >
                    {folderName}
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{ color: "hsl(215 10% 44%)" }}>
                    {selectedFolder}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: spring.snappy }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.1 } }}
                >
                  <div className="text-sm font-medium" style={{ color: "hsl(210 17% 80%)" }}>
                    Browse for folder
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "hsl(215 10% 44%)" }}>
                    Click to open the system folder picker
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedFolder && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, transition: spring.bounce }}
              className="shrink-0 text-xs px-2.5 py-1 rounded-lg"
              style={{
                background: "hsl(220 10% 16%)",
                color: "hsl(215 10% 52%)",
                border: "1px solid hsl(220 10% 20%)",
              }}
            >
              Change
            </motion.div>
          )}
        </div>
      </motion.button>

      <AnimatePresence>
        {selectedFolder && (
          <motion.div
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto", transition: spring.smooth }}
            exit={{ opacity: 0, y: 8, height: 0, transition: { duration: 0.18 } }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              <Button
                className="w-full gap-2 h-11 text-sm font-semibold"
                disabled={loading}
                onClick={onFinish}
                style={{
                  background: loading ? "hsl(217 91% 65% / 0.5)" : "hsl(217 91% 65%)",
                  color: "hsl(222 13% 9%)",
                  boxShadow: loading ? "none" : "0 0 24px hsl(217 91% 65% / 0.3)",
                  transition: "all 0.2s",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent inline-block nb-spin" />
                    Setting up…
                  </span>
                ) : (
                  <>
                    Create workspace <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-center text-[11px] mt-2.5" style={{ color: "hsl(215 10% 40%)" }}>
                You can change this later in Settings
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedFolder && <div className="h-6" />}
    </div>
  );
}

function DoneStep() {
  return (
    <div className="px-10 py-16 text-center">
      <div className="relative inline-flex items-center justify-center mb-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full nb-ring pointer-events-none"
            style={{
              width: 56,
              height: 56,
              border: "1.5px solid hsl(142 71% 55% / 0.5)",
              animationDelay: `${i * 0.18}s`,
              animationDuration: "1s",
            }}
          />
        ))}
        <div
          className="flex items-center justify-center w-14 h-14 rounded-2xl relative z-10"
          style={{
            background: "hsl(142 71% 55% / 0.1)",
            border: "1px solid hsl(142 71% 55% / 0.3)",
            boxShadow: "0 0 32px hsl(142 71% 55% / 0.2)",
          }}
        >
          <Sparkles className="h-6 w-6" style={{ color: "hsl(142 71% 60%)" }} />
        </div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { ...spring.snappy, delay: 0.1 } }}
        style={{
          fontFamily: "'New York', 'Iowan Old Style', Georgia, serif",
          fontSize: "1.65rem",
          lineHeight: 1.2,
          color: "hsl(210 17% 92%)",
          marginBottom: "0.5rem",
        }}
      >
        You're all set!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.25 } }}
        className="text-sm"
        style={{ color: "hsl(215 10% 52%)" }}
      >
        Starting your guided tour…
      </motion.p>
    </div>
  );
}
