import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "@/store/settings";

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({
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
    windowOpacity: 100,
    windowBlur: true,
    hasOnboarded: false,
    tourActive: false,
    zenMode: false,
    sidebarWidth: 208,
    customThemes: [],
    customEditorThemes: [],
    customEditorThemeId: "",
  });
});

describe("settings store", () => {
  it("has correct defaults", () => {
    const s = useSettingsStore.getState();
    expect(s.colorMode).toBe("dark");
    expect(s.editorTheme).toBe("vscodeDark");
    expect(s.hljsTheme).toBe("github-dark");
    expect(s.fontSize).toBe(14);
    expect(s.sidebarWidth).toBe(208);
    expect(s.customThemes).toHaveLength(0);
  });

  it("setColorMode toggles between dark and light", () => {
    useSettingsStore.getState().setColorMode("light");
    expect(useSettingsStore.getState().colorMode).toBe("light");
    useSettingsStore.getState().setColorMode("dark");
    expect(useSettingsStore.getState().colorMode).toBe("dark");
  });

  it("setEditorTheme updates theme", () => {
    useSettingsStore.getState().setEditorTheme("dracula");
    expect(useSettingsStore.getState().editorTheme).toBe("dracula");
  });

  it("setHljsTheme updates theme", () => {
    useSettingsStore.getState().setHljsTheme("monokai");
    expect(useSettingsStore.getState().hljsTheme).toBe("monokai");
  });

  it("setFontSize clamps correctly", () => {
    useSettingsStore.getState().setFontSize(18);
    expect(useSettingsStore.getState().fontSize).toBe(18);
  });

  it("setLineNumbers toggles", () => {
    useSettingsStore.getState().setLineNumbers(false);
    expect(useSettingsStore.getState().lineNumbers).toBe(false);
  });

  it("setAutoSave and setAutoSaveDelay", () => {
    useSettingsStore.getState().setAutoSave(true);
    useSettingsStore.getState().setAutoSaveDelay(2000);
    const s = useSettingsStore.getState();
    expect(s.autoSave).toBe(true);
    expect(s.autoSaveDelay).toBe(2000);
  });

  it("setVimMode toggles", () => {
    useSettingsStore.getState().setVimMode(true);
    expect(useSettingsStore.getState().vimMode).toBe(true);
  });

  it("setZenMode toggles", () => {
    useSettingsStore.getState().setZenMode(true);
    expect(useSettingsStore.getState().zenMode).toBe(true);
  });

  it("setSidebarWidth stores value", () => {
    useSettingsStore.getState().setSidebarWidth(300);
    expect(useSettingsStore.getState().sidebarWidth).toBe(300);
  });

  it("addCustomTheme appends and deduplicates by id", () => {
    const theme = { id: "t1", label: "Test", css: ".hljs{}" };
    useSettingsStore.getState().addCustomTheme(theme);
    expect(useSettingsStore.getState().customThemes).toHaveLength(1);
    useSettingsStore.getState().addCustomTheme({ ...theme, label: "Updated" });
    expect(useSettingsStore.getState().customThemes).toHaveLength(1);
    expect(useSettingsStore.getState().customThemes[0].label).toBe("Updated");
  });

  it("removeCustomTheme removes by id", () => {
    useSettingsStore.getState().addCustomTheme({ id: "t1", label: "T1", css: ".a{}" });
    useSettingsStore.getState().addCustomTheme({ id: "t2", label: "T2", css: ".b{}" });
    useSettingsStore.getState().removeCustomTheme("t1");
    const themes = useSettingsStore.getState().customThemes;
    expect(themes).toHaveLength(1);
    expect(themes[0].id).toBe("t2");
  });

  it("addCustomEditorTheme and removeCustomEditorTheme", () => {
    const t = { id: "e1", label: "Editor1", css: ".cm-editor{}" };
    useSettingsStore.getState().addCustomEditorTheme(t);
    expect(useSettingsStore.getState().customEditorThemes).toHaveLength(1);
    useSettingsStore.getState().removeCustomEditorTheme("e1");
    expect(useSettingsStore.getState().customEditorThemes).toHaveLength(0);
  });

  it("setCustomEditorThemeId stores id", () => {
    useSettingsStore.getState().setCustomEditorThemeId("e1");
    expect(useSettingsStore.getState().customEditorThemeId).toBe("e1");
  });

  it("setWindowOpacity stores value", () => {
    useSettingsStore.getState().setWindowOpacity(75);
    expect(useSettingsStore.getState().windowOpacity).toBe(75);
  });

  it("setLastFolder stores and clears", () => {
    useSettingsStore.getState().setLastFolder("/my/folder");
    expect(useSettingsStore.getState().lastFolder).toBe("/my/folder");
    useSettingsStore.getState().setLastFolder(null);
    expect(useSettingsStore.getState().lastFolder).toBeNull();
  });
});
