import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppTheme, CustomAppTheme } from "@/lib/appThemes";
import { APP_THEMES } from "@/lib/appThemes";

export type { AppTheme, CustomAppTheme };

export type EditorTheme =
  | "vscodeDark"
  | "oneDark"
  | "githubLight"
  | "dracula"
  | "nord"
  | "tokyoNight"
  | "material"
  | "sublime"
  | "solarizedDark"
  | "solarizedLight"
  | "gruvboxDark"
  | "monokai"
  | "aura";

export type HljsTheme = string;

export type ColorMode = "dark" | "light";

export interface CustomTheme {
  id: string;
  label: string;
  css: string;
}

interface SettingsState {
  appTheme: AppTheme;
  customAppThemeId: string;
  customAppThemes: CustomAppTheme[];
  colorMode: ColorMode;
  editorTheme: EditorTheme;
  hljsTheme: HljsTheme;
  fontSize: number;
  lineNumbers: boolean;
  lineWrapping: boolean;
  vimMode: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  settingsOpen: boolean;
  lastFolder: string | null;
  lastFilePath: string | null;
  windowOpacity: number;
  windowBlur: boolean;
  windowBlurRadius: number;
  textBrightness: number;
  hasOnboarded: boolean;
  tourActive: boolean;
  zenMode: boolean;
  sidebarWidth: number;
  customThemes: CustomTheme[];
  customEditorThemes: CustomTheme[];
  customEditorThemeId: string;

  setAppTheme: (theme: AppTheme) => void;
  setCustomAppThemeId: (id: string) => void;
  addCustomAppTheme: (theme: CustomAppTheme) => void;
  removeCustomAppTheme: (id: string) => void;
  setColorMode: (mode: ColorMode) => void;
  setEditorTheme: (theme: EditorTheme) => void;
  setHljsTheme: (theme: HljsTheme) => void;
  setFontSize: (size: number) => void;
  setLineNumbers: (v: boolean) => void;
  setLineWrapping: (v: boolean) => void;
  setVimMode: (v: boolean) => void;
  setAutoSave: (v: boolean) => void;
  setAutoSaveDelay: (ms: number) => void;
  setSettingsOpen: (v: boolean) => void;
  setLastFolder: (path: string | null) => void;
  setLastFilePath: (path: string | null) => void;
  setWindowOpacity: (v: number) => void;
  setWindowBlur: (v: boolean) => void;
  setWindowBlurRadius: (v: number) => void;
  setTextBrightness: (v: number) => void;
  setHasOnboarded: (v: boolean) => void;
  setTourActive: (v: boolean) => void;
  resetOnboarding: () => void;
  setZenMode: (v: boolean) => void;
  setSidebarWidth: (v: number) => void;
  addCustomTheme: (theme: CustomTheme) => void;
  removeCustomTheme: (id: string) => void;
  addCustomEditorTheme: (theme: CustomTheme) => void;
  removeCustomEditorTheme: (id: string) => void;
  setCustomEditorThemeId: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      appTheme: "dark",
      customAppThemeId: "",
      customAppThemes: [],
      colorMode: "dark",
      editorTheme: "vscodeDark",
      hljsTheme: "github-dark",
      fontSize: 14,
      lineNumbers: true,
      lineWrapping: true,
      vimMode: false,
      autoSave: false,
      autoSaveDelay: 1000,
      settingsOpen: false,
      lastFolder: null,
      lastFilePath: null,
      windowOpacity: 100,
      windowBlur: true,
      windowBlurRadius: 20,
      textBrightness: 100,
      hasOnboarded: false,
      tourActive: false,
      zenMode: false,
      sidebarWidth: 208,
      customThemes: [],
      customEditorThemes: [],
      customEditorThemeId: "",

      setAppTheme: (appTheme) => {
        const meta = APP_THEMES.find((t) => t.id === appTheme);
        const colorMode: ColorMode = meta?.isDark ? "dark" : "light";
        set({ appTheme, colorMode, customAppThemeId: "" });
      },
      setCustomAppThemeId: (customAppThemeId) =>
        set((s) => {
          const custom = s.customAppThemes.find((t) => t.id === customAppThemeId);
          const colorMode: ColorMode = custom?.isDark ? "dark" : "light";
          return { customAppThemeId, colorMode };
        }),
      addCustomAppTheme: (theme) =>
        set((s) => ({
          customAppThemes: [...s.customAppThemes.filter((t) => t.id !== theme.id), theme],
        })),
      removeCustomAppTheme: (id) =>
        set((s) => ({
          customAppThemes: s.customAppThemes.filter((t) => t.id !== id),
          customAppThemeId: s.customAppThemeId === id ? "" : s.customAppThemeId,
        })),
      setColorMode: (colorMode) => set({ colorMode }),
      setEditorTheme: (editorTheme) => set({ editorTheme }),
      setHljsTheme: (hljsTheme) => set({ hljsTheme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineNumbers: (lineNumbers) => set({ lineNumbers }),
      setLineWrapping: (lineWrapping) => set({ lineWrapping }),
      setVimMode: (vimMode) => set({ vimMode }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setAutoSaveDelay: (autoSaveDelay) => set({ autoSaveDelay }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setLastFolder: (lastFolder) => set({ lastFolder }),
      setLastFilePath: (lastFilePath) => set({ lastFilePath }),
      setWindowOpacity: (windowOpacity) => set({ windowOpacity }),
      setWindowBlur: (windowBlur) => set({ windowBlur }),
      setWindowBlurRadius: (windowBlurRadius) => set({ windowBlurRadius }),
      setTextBrightness: (textBrightness) => set({ textBrightness }),
      setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
      setTourActive: (tourActive) => set({ tourActive }),
      resetOnboarding: () =>
        set({ hasOnboarded: false, tourActive: false, lastFolder: null, lastFilePath: null }),
      setZenMode: (zenMode) => set({ zenMode }),
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      addCustomTheme: (theme) =>
        set((s) => ({ customThemes: [...s.customThemes.filter((t) => t.id !== theme.id), theme] })),
      removeCustomTheme: (id) =>
        set((s) => ({ customThemes: s.customThemes.filter((t) => t.id !== id) })),
      addCustomEditorTheme: (theme) =>
        set((s) => ({
          customEditorThemes: [...s.customEditorThemes.filter((t) => t.id !== theme.id), theme],
        })),
      removeCustomEditorTheme: (id) =>
        set((s) => ({ customEditorThemes: s.customEditorThemes.filter((t) => t.id !== id) })),
      setCustomEditorThemeId: (id) => set({ customEditorThemeId: id }),
    }),
    {
      name: "md-editor-settings",
      partialize: (state) => ({
        appTheme: state.appTheme,
        customAppThemeId: state.customAppThemeId,
        customAppThemes: state.customAppThemes,
        colorMode: state.colorMode,
        editorTheme: state.editorTheme,
        hljsTheme: state.hljsTheme,
        fontSize: state.fontSize,
        lineNumbers: state.lineNumbers,
        lineWrapping: state.lineWrapping,
        vimMode: state.vimMode,
        autoSave: state.autoSave,
        autoSaveDelay: state.autoSaveDelay,
        lastFolder: state.lastFolder,
        lastFilePath: state.lastFilePath,
        windowOpacity: state.windowOpacity,
        windowBlur: state.windowBlur,
        windowBlurRadius: state.windowBlurRadius,
        textBrightness: state.textBrightness,
        hasOnboarded: state.hasOnboarded,
        sidebarWidth: state.sidebarWidth,
        customThemes: state.customThemes,
        customEditorThemes: state.customEditorThemes,
        customEditorThemeId: state.customEditorThemeId,
      }),
    }
  )
);
