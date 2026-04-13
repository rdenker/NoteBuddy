import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CustomIconsState {
  icons: Record<string, string>;
  setIcon: (path: string, iconName: string) => void;
  removeIcon: (path: string) => void;
  getIcon: (path: string) => string | undefined;
}

export const useCustomIconsStore = create<CustomIconsState>()(
  persist(
    (set, get) => ({
      icons: {},
      setIcon: (path, iconName) => set((s) => ({ icons: { ...s.icons, [path]: iconName } })),
      removeIcon: (path) =>
        set((s) => {
          const next = { ...s.icons };
          delete next[path];
          return { icons: next };
        }),
      getIcon: (path) => get().icons[path],
    }),
    { name: "md-editor-custom-icons" }
  )
);
