import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileEntry[];
}

export interface RecentFile {
  path: string;
  name: string;
  opened_at: string;
}

export interface ParseResult {
  html: string;
}

export async function readFile(path: string): Promise<string> {
  return invoke<string>("read_file", { path });
}

export async function writeFile(path: string, content: string): Promise<void> {
  return invoke<void>("write_file", { path, content });
}

export async function parseMarkdown(content: string): Promise<string> {
  return invoke<string>("parse_markdown", { content });
}

export async function listDirectory(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("list_directory", { path });
}

export async function openDirectory(): Promise<string | null> {
  return invoke<string | null>("open_directory_dialog");
}

export async function openFileDialog(): Promise<string | null> {
  return invoke<string | null>("open_file_dialog");
}

export async function saveFileDialog(currentPath: string | null): Promise<string | null> {
  return invoke<string | null>("save_file_dialog", { currentPath });
}

export async function getRecentFiles(): Promise<RecentFile[]> {
  return invoke<RecentFile[]>("get_recent_files");
}

export async function watchFile(path: string): Promise<void> {
  return invoke<void>("watch_file", { path });
}

export async function unwatchFile(path: string): Promise<void> {
  return invoke<void>("unwatch_file", { path });
}

export function onFileChanged(handler: (path: string) => void): Promise<UnlistenFn> {
  return listen<string>("file-changed", (event) => handler(event.payload));
}

export async function setVibrancy(blur: boolean): Promise<void> {
  return invoke<void>("set_vibrancy", { blur });
}

export async function createFile(path: string): Promise<void> {
  return invoke<void>("create_file", { path });
}

export async function createDirectory(path: string): Promise<void> {
  return invoke<void>("create_directory", { path });
}

export async function renamePath(oldPath: string, newPath: string): Promise<void> {
  return invoke<void>("rename_path", { oldPath, newPath });
}

export async function deletePath(path: string, isDir: boolean): Promise<void> {
  return invoke<void>("delete_path", { path, isDir });
}

export async function writeBinary(path: string, data: number[]): Promise<void> {
  return invoke<void>("write_binary", { path, data });
}

export interface SearchResult {
  path: string;
  name: string;
  line: number;
  preview: string;
}

export async function searchFiles(root: string, query: string): Promise<SearchResult[]> {
  return invoke<SearchResult[]>("search_files", { root, query });
}

export interface FileTagsResult {
  path: string;
  name: string;
  tags: string[];
  created?: string;
}

export async function scanTags(root: string): Promise<FileTagsResult[]> {
  return invoke<FileTagsResult[]>("scan_tags", { root });
}

export interface Template {
  path: string;
  name: string;
  content: string;
}

export async function listTemplates(root: string): Promise<Template[]> {
  return invoke<Template[]>("list_templates", { root });
}

export async function ensureTemplatesDir(root: string): Promise<void> {
  return invoke<void>("ensure_templates_dir", { root });
}

export async function saveAsTemplate(root: string, name: string, content: string): Promise<string> {
  return invoke<string>("save_as_template", { root, name, content });
}

export async function deleteTemplate(path: string): Promise<void> {
  return invoke<void>("delete_template", { path });
}

export async function exportHtml(content: string, title: string): Promise<string> {
  return invoke<string>("export_html", { content, title });
}

export async function writeTempHtml(html: string): Promise<string> {
  return invoke<string>("write_temp_html", { html });
}

export function setWindowOpacityCss(opacity: number): void {
  const root = document.getElementById("root");
  if (root) root.style.opacity = String(opacity / 100);
}

export function setTextBrightnessCss(brightness: number): void {
  document.documentElement.style.setProperty("--text-brightness", String(brightness / 100));
}

export function setWindowBlurCss(enabled: boolean, radius: number): void {
  const val = enabled ? `blur(${radius}px)` : "";
  document.body.style.backdropFilter = val;
  (
    document.body.style as CSSStyleDeclaration & { webkitBackdropFilter: string }
  ).webkitBackdropFilter = val;

  const html = document.documentElement;
  if (enabled) {
    html.style.setProperty("--bg-alpha", "0.55");
    html.style.setProperty("--popover-alpha", "0.88");
  } else {
    html.style.setProperty("--bg-alpha", "1");
    html.style.setProperty("--popover-alpha", "1");
  }
}
