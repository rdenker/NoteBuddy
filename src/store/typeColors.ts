import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TypeColorEntry {
  type: string;
  color: string;
}

export const PRESET_COLORS: { label: string; value: string; preview: string }[] = [
  { label: "Blue", value: "blue", preview: "hsl(217 91% 65%)" },
  { label: "Violet", value: "violet", preview: "hsl(263 70% 70%)" },
  { label: "Purple", value: "purple", preview: "hsl(280 65% 68%)" },
  { label: "Pink", value: "pink", preview: "hsl(330 80% 70%)" },
  { label: "Rose", value: "rose", preview: "hsl(349 80% 66%)" },
  { label: "Red", value: "red", preview: "hsl(0 72% 65%)" },
  { label: "Orange", value: "orange", preview: "hsl(24 90% 63%)" },
  { label: "Amber", value: "amber", preview: "hsl(45 90% 58%)" },
  { label: "Yellow", value: "yellow", preview: "hsl(55 85% 60%)" },
  { label: "Lime", value: "lime", preview: "hsl(82 70% 58%)" },
  { label: "Green", value: "green", preview: "hsl(142 60% 55%)" },
  { label: "Emerald", value: "emerald", preview: "hsl(160 65% 52%)" },
  { label: "Teal", value: "teal", preview: "hsl(174 65% 50%)" },
  { label: "Cyan", value: "cyan", preview: "hsl(190 75% 58%)" },
  { label: "Sky", value: "sky", preview: "hsl(199 80% 60%)" },
  { label: "Slate", value: "slate", preview: "hsl(215 20% 62%)" },
];

export const COLOR_HUES: Record<string, string> = {
  blue: "217 91% 65%",
  violet: "263 70% 70%",
  purple: "280 65% 68%",
  pink: "330 80% 70%",
  rose: "349 80% 66%",
  red: "0 72% 65%",
  orange: "24 90% 63%",
  amber: "45 90% 58%",
  yellow: "55 85% 60%",
  lime: "82 70% 58%",
  green: "142 60% 55%",
  emerald: "160 65% 52%",
  teal: "174 65% 50%",
  cyan: "190 75% 58%",
  sky: "199 80% 60%",
  slate: "215 20% 62%",
};

export const DEFAULT_TYPE_COLORS: TypeColorEntry[] = [
  { type: "source", color: "blue" },
  { type: "concept", color: "violet" },
  { type: "entity", color: "emerald" },
  { type: "topic", color: "amber" },
];

interface TypeColorsState {
  entries: TypeColorEntry[];
  setColor: (type: string, color: string) => void;
  removeColor: (type: string) => void;
  getColor: (type: string) => string | null;
}

export const useTypeColorsStore = create<TypeColorsState>()(
  persist(
    (set, get) => ({
      entries: DEFAULT_TYPE_COLORS,

      setColor: (type, color) =>
        set((s) => {
          const rest = s.entries.filter((e) => e.type !== type);
          return { entries: [...rest, { type, color }] };
        }),

      removeColor: (type) => set((s) => ({ entries: s.entries.filter((e) => e.type !== type) })),

      getColor: (type) => {
        const entry = get().entries.find((e) => e.type === type);
        return entry?.color ?? null;
      },
    }),
    { name: "md-editor-type-colors" }
  )
);

export function typeColorStyles(color: string): { border: string; text: string; bg: string } {
  const hsl = COLOR_HUES[color];
  if (!hsl)
    return {
      border: "hsl(var(--color-border))",
      text: "hsl(var(--color-muted-foreground))",
      bg: "transparent",
    };
  return {
    border: `hsl(${hsl} / 0.4)`,
    text: `hsl(${hsl})`,
    bg: `hsl(${hsl} / 0.1)`,
  };
}
