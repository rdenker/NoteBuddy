import { AnimatePresence, motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FileEntry, Template } from "@/lib/commands";
import {
  createDirectory,
  deletePath,
  ensureTemplatesDir,
  listDirectory,
  listTemplates,
  openDirectory,
  renamePath,
  scanTags,
  writeFile,
} from "@/lib/commands";
import { generateFrontmatter } from "@/lib/frontmatterTemplate";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useBookmarksStore } from "@/store/bookmarks";
import { useCustomIconsStore } from "@/store/customIcons";
import { type DropPosition, useDragStore } from "@/store/drag";
import { useEditorStore } from "@/store/editor";
import { useSortOrderStore } from "@/store/sortOrder";
import { useTabsStore } from "@/store/tabs";

type LucideIconMap = Record<string, LucideIcons.LucideIcon>;
const Icons = LucideIcons as unknown as LucideIconMap;

import {
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  FilePlus,
  FileText,
  FolderOpen,
  FolderPlus,
  GripVertical,
  LayoutTemplate,
  Pencil,
  Smile,
  Trash2,
  X,
} from "lucide-react";
import { FilterPanel } from "@/components/FilterPanel";
import { IconPicker } from "@/components/IconPicker";
import { NewItemDialog } from "@/components/NewItemDialog";

interface FileNodeProps {
  entry: FileEntry;
  depth: number;
  onFileClick: (path: string) => void;
  activePath: string | null;
  hiddenPaths: Set<string>;
  onRefresh: () => void;
  templates: Template[];
  onDropped: () => void;
}

function FileNode({
  entry,
  depth,
  onFileClick,
  activePath,
  hiddenPaths,
  onRefresh,
  templates,
  onDropped,
}: FileNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileEntry[]>(entry.children ?? []);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(entry.name);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [dialogMode, setDialogMode] = useState<"file" | "folder" | null>(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarksStore();
  const { setIcon, removeIcon, getIcon } = useCustomIconsStore();
  const bookmarked = isBookmarked(entry.path);
  const customIcon = getIcon(entry.path);

  const refreshChildren = useCallback(async () => {
    if (entry.is_dir) {
      const loaded = await listDirectory(entry.path);
      setChildren(loaded);
    }
  }, [entry]);

  const toggleDir = useCallback(async () => {
    if (!entry.is_dir) return;
    if (!expanded && children.length === 0) {
      const loaded = await listDirectory(entry.path);
      setChildren(loaded);
    }
    setExpanded((e) => !e);
  }, [entry, expanded, children.length]);

  const handleRename = useCallback(async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === entry.name) {
      setRenaming(false);
      return;
    }
    const parentDir = entry.path.substring(0, entry.path.lastIndexOf("/"));
    const newPath = `${parentDir}/${trimmed}`;
    await renamePath(entry.path, newPath);
    setRenaming(false);
    onRefresh();
  }, [newName, entry, onRefresh]);

  const handleDelete = useCallback(async () => {
    if (!confirm(`Delete "${entry.name}"?`)) return;
    await deletePath(entry.path, entry.is_dir);
    onRefresh();
  }, [entry, onRefresh]);

  const handleNewFile = useCallback(() => {
    if (!entry.is_dir) return;
    setContextMenu(null);
    setDialogMode("file");
  }, [entry]);

  const handleNewFolder = useCallback(() => {
    if (!entry.is_dir) return;
    setContextMenu(null);
    setDialogMode("folder");
  }, [entry]);

  const handleDialogConfirm = useCallback(
    async (name: string, template: Template | null) => {
      setDialogMode(null);
      if (dialogMode === "folder") {
        await createDirectory(`${entry.path}/${name}`);
      } else {
        const filePath = `${entry.path}/${name}`;
        if (template) {
          const today = new Date().toISOString().slice(0, 10);
          let content = template.content
            .replace(/\{\{date\}\}/g, today)
            .replace(/\{\{time\}\}/g, new Date().toTimeString().slice(0, 5))
            .replace(/\{\{datetime\}\}/g, new Date().toISOString());
          if (content.includes("{{title}}")) {
            const title = window.prompt(
              `Title for new "${template.name}":`,
              name.replace(".md", "")
            );
            if (title) content = content.replace(/\{\{title\}\}/g, title);
          }
          await writeFile(filePath, content);
        } else {
          await writeFile(filePath, generateFrontmatter(name, entry.path));
        }
        onFileClick(filePath);
      }
      const loaded = await listDirectory(entry.path);
      setChildren(loaded);
      setExpanded(true);
      onRefresh();
    },
    [dialogMode, entry, onRefresh]
  );

  const { dragging, overPath, dropPosition, startDrag, setOver, endDrag } = useDragStore();
  const { updateTabPaths } = useTabsStore();
  const { moveItem, setOrder, getOrder } = useSortOrderStore();
  const isDraggingThis = dragging?.path === entry.path;
  const isOver = overPath === entry.path && dragging !== null && dragging.path !== entry.path;
  const isDragOver =
    isOver &&
    dropPosition === "into" &&
    entry.is_dir &&
    !entry.path.startsWith(`${dragging?.path}/`);
  const isDropBefore = isOver && dropPosition === "before";
  const isDropAfter = isOver && dropPosition === "after";

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (renaming) return;
      document.body.classList.add("is-dragging");
      const startX = e.clientX;
      const startY = e.clientY;
      let dragStarted = false;

      const getDropInfo = (ev: MouseEvent): { path: string | null; pos: DropPosition } => {
        const el = document.elementFromPoint(ev.clientX, ev.clientY);

        const rootZone = el?.closest("[data-rootzone]") as HTMLElement | null;
        if (rootZone) return { path: rootZone.dataset.rootzone ?? null, pos: "root" };

        const nodeEl = el?.closest("[data-filepath]") as HTMLElement | null;
        if (!nodeEl) return { path: null, pos: null };

        const path = nodeEl.dataset.filepath ?? null;
        const isDir = nodeEl.dataset.isdir === "true";
        const rect = nodeEl.getBoundingClientRect();
        const relY = ev.clientY - rect.top;
        const pct = relY / rect.height;

        let pos: DropPosition;
        if (isDir && pct > 0.25 && pct < 0.75) {
          pos = "into";
        } else if (pct <= 0.5) {
          pos = "before";
        } else {
          pos = "after";
        }

        return { path, pos };
      };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragStarted) {
          const dx = Math.abs(ev.clientX - startX);
          const dy = Math.abs(ev.clientY - startY);
          if (dx < 5 && dy < 5) return;
          dragStarted = true;
          startDrag(entry.path, entry.name, entry.is_dir);
        }
        const { path, pos } = getDropInfo(ev);
        setOver(path, pos, ev.clientX, ev.clientY);
      };

      const onMouseUp = async (ev: MouseEvent) => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        document.body.classList.remove("is-dragging");
        if (!dragStarted) {
          endDrag();
          return;
        }

        const { path: targetPath, pos } = getDropInfo(ev);
        endDrag();

        const src = entry.path;
        const srcName = src.split("/").pop() ?? "";
        const srcParent = src.substring(0, src.lastIndexOf("/"));

        if (!targetPath || !pos) return;
        if (targetPath === src || targetPath.startsWith(`${src}/`)) return;

        if (pos === "root") {
          const dest = `${targetPath}/${srcName}`;
          if (dest === src) return;
          try {
            await renamePath(src, dest);
            updateTabPaths(src, dest);
            onDropped();
          } catch (err) {
            console.error(err);
          }
          return;
        }

        if (pos === "into") {
          if (
            !(
              (document.querySelector(`[data-filepath="${CSS.escape(targetPath)}"]`) as HTMLElement)
                ?.dataset.isdir === "true"
            )
          )
            return;
          const dest = `${targetPath}/${srcName}`;
          if (dest === src) return;
          try {
            await renamePath(src, dest);
            updateTabPaths(src, dest);
            onDropped();
          } catch (err) {
            console.error(err);
          }
          return;
        }

        if (pos === "before" || pos === "after") {
          const targetParent = targetPath.substring(0, targetPath.lastIndexOf("/"));

          if (srcParent !== targetParent) {
            const dest = `${targetParent}/${srcName}`;
            if (dest === src) return;
            try {
              await renamePath(src, dest);
              updateTabPaths(src, dest);
              const currentOrder = getOrder(targetParent);
              if (currentOrder) {
                moveItem(targetParent, dest, targetPath, pos);
              } else {
                const siblings = Array.from(
                  document.querySelectorAll(
                    `[data-filepath][data-parent="${CSS.escape(targetParent)}"]`
                  )
                )
                  .map((el) => (el as HTMLElement).dataset.filepath ?? "")
                  .filter(Boolean);
                const order = [...siblings];
                const ti = order.indexOf(targetPath);
                if (ti !== -1) order.splice(pos === "before" ? ti : ti + 1, 0, dest);
                setOrder(targetParent, order);
              }
              onDropped();
            } catch (err) {
              console.error(err);
            }
          } else {
            moveItem(srcParent, src, targetPath, pos);
            onDropped();
          }
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [
      entry,
      renaming,
      startDrag,
      setOver,
      endDrag,
      onDropped,
      updateTabPaths,
      moveItem,
      setOrder,
      getOrder,
    ]
  );

  useEffect(() => {
    if (renaming) renameRef.current?.select();
  }, [renaming]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [contextMenu]);

  if (hiddenPaths.has(entry.path)) return null;
  const isActive = entry.path === activePath;

  return (
    <div className="relative">
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1, transition: spring.snappy }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            className="absolute inset-0 rounded-md pointer-events-none z-10"
            style={{
              background: "hsl(217 91% 65% / 0.08)",
              outline: "1.5px solid hsl(217 91% 65% / 0.5)",
            }}
          />
        )}
        {isDropBefore && (
          <motion.div
            key="drop-before"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1, transition: spring.snappy }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-2 right-1 h-0.5 bg-primary rounded-full pointer-events-none z-20"
            style={{ transform: "translateY(-1px)" }}
          />
        )}
        {isDropAfter && (
          <motion.div
            key="drop-after"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1, transition: spring.snappy }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-2 right-1 h-0.5 bg-primary rounded-full pointer-events-none z-20"
            style={{ transform: "translateY(1px)" }}
          />
        )}
      </AnimatePresence>
      <div
        data-filepath={entry.path}
        data-isdir={String(entry.is_dir)}
        data-parent={entry.path.substring(0, entry.path.lastIndexOf("/"))}
        onMouseDown={handleMouseDown}
        onClick={() =>
          !useDragStore.getState().dragging &&
          (entry.is_dir ? toggleDir() : onFileClick(entry.path))
        }
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
        style={{ paddingLeft: `${6 + depth * 14}px` }}
        className={cn(
          "group relative flex items-center gap-1.5 py-[3px] pr-1 rounded-md cursor-pointer text-[13px]",
          "hover:bg-accent/60 hover:text-foreground transition-colors",
          isActive && "bg-accent text-foreground font-medium",
          isDraggingThis && "opacity-40 scale-[0.98]"
        )}
      >
        <span
          className={cn(
            "text-muted-foreground shrink-0 transition-opacity",
            "opacity-0 group-hover:opacity-40"
          )}
        >
          <GripVertical className="h-3 w-3" />
        </span>
        {entry.is_dir ? (
          <>
            <motion.span
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={spring.snappy}
              className="text-muted-foreground shrink-0 w-3.5 flex items-center justify-center"
            >
              <ChevronRight className="h-3 w-3" />
            </motion.span>
            {customIcon ? (
              (() => {
                const I = Icons[customIcon];
                return I ? (
                  <I className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                ) : (
                  <FolderOpen className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                );
              })()
            ) : (
              <FolderOpen className="h-3.5 w-3.5 text-primary/70 shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            {customIcon ? (
              (() => {
                const I = Icons[customIcon];
                return I ? (
                  <I
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground/80"
                    )}
                  />
                ) : (
                  <FileText
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground/60 group-hover:text-muted-foreground"
                    )}
                  />
                );
              })()
            ) : (
              <FileText
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/60 group-hover:text-muted-foreground"
                )}
              />
            )}
          </>
        )}

        {renaming ? (
          <input
            ref={renameRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setRenaming(false);
                setNewName(entry.name);
              }
            }}
            onBlur={handleRename}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-muted text-foreground text-[13px] rounded px-1 py-0 outline-none border border-primary/40 min-w-0"
          />
        ) : (
          <span className="flex-1 truncate text-muted-foreground group-hover:text-foreground transition-colors">
            {entry.name}
          </span>
        )}

        <div
          className="flex items-center gap-0.5 ml-auto shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {!entry.is_dir && (
            <button
              onClick={() =>
                bookmarked ? removeBookmark(entry.path) : addBookmark(entry.path, entry.name)
              }
              className={cn(
                "p-0.5 rounded transition-colors",
                bookmarked
                  ? "text-primary hover:text-primary/70"
                  : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
              )}
              title={bookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              {bookmarked ? (
                <BookmarkCheck className="h-3 w-3" />
              ) : (
                <Bookmark className="h-3 w-3" />
              )}
            </button>
          )}
          <div className="hidden group-hover:flex items-center gap-0.5">
            {entry.is_dir && (
              <>
                <button
                  onClick={handleNewFile}
                  className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <FilePlus className="h-3 w-3" />
                </button>
                <button
                  onClick={handleNewFolder}
                  className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <FolderPlus className="h-3 w-3" />
                </button>
              </>
            )}
            <button
              onClick={() => {
                setRenaming(true);
                setNewName(entry.name);
              }}
              className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={handleDelete}
              className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed z-[500] min-w-[180px] rounded-lg border border-border bg-card shadow-xl py-1 text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <CtxItem
            icon={<Smile className="h-3.5 w-3.5" />}
            label={customIcon ? "Change icon" : "Set icon"}
            onClick={() => {
              setIconPickerOpen(true);
              setContextMenu(null);
            }}
          />
          {customIcon && (
            <CtxItem
              icon={<X className="h-3.5 w-3.5" />}
              label="Reset icon"
              onClick={() => {
                removeIcon(entry.path);
                setContextMenu(null);
              }}
            />
          )}
          <div className="my-1 border-t border-border" />
          {!entry.is_dir && (
            <CtxItem
              icon={
                bookmarked ? (
                  <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )
              }
              label={bookmarked ? "Remove bookmark" : "Add bookmark"}
              onClick={() => {
                bookmarked ? removeBookmark(entry.path) : addBookmark(entry.path, entry.name);
                setContextMenu(null);
              }}
            />
          )}
          <CtxItem
            icon={<Pencil className="h-3.5 w-3.5" />}
            label="Rename"
            onClick={() => {
              setRenaming(true);
              setNewName(entry.name);
              setContextMenu(null);
            }}
          />
          {entry.is_dir && (
            <CtxItem
              icon={<FilePlus className="h-3.5 w-3.5" />}
              label="New file"
              onClick={() => {
                handleNewFile();
                setContextMenu(null);
              }}
            />
          )}
          {entry.is_dir && (
            <CtxItem
              icon={<FolderPlus className="h-3.5 w-3.5" />}
              label="New folder"
              onClick={() => {
                handleNewFolder();
                setContextMenu(null);
              }}
            />
          )}
          {entry.is_dir && templates.length > 0 && (
            <>
              <div className="my-1 border-t border-border" />
              <div className="px-3 py-1 text-[10px] text-muted-foreground uppercase tracking-widest">
                From template
              </div>
              {templates.map((tpl) => (
                <CtxItem
                  key={tpl.path}
                  icon={<LayoutTemplate className="h-3.5 w-3.5" />}
                  label={tpl.name}
                  onClick={async () => {
                    const today = new Date().toISOString().slice(0, 10);
                    const content = tpl.content.replace(/\{\{date\}\}/g, today);
                    const fileName = `${tpl.name} ${today}.md`;
                    await writeFile(`${entry.path}/${fileName}`, content);
                    onRefresh();
                    setContextMenu(null);
                  }}
                />
              ))}
            </>
          )}
          <div className="my-1 border-t border-border" />
          <CtxItem
            icon={<Trash2 className="h-3.5 w-3.5" />}
            label="Delete"
            onClick={() => {
              handleDelete();
              setContextMenu(null);
            }}
            danger
          />
        </div>
      )}

      <AnimatePresence initial={false}>
        {entry.is_dir && expanded && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: spring.snappy }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
            style={{ overflow: "hidden" }}
          >
            {children.map((child) => (
              <FileNode
                key={child.path}
                entry={child}
                depth={depth + 1}
                onFileClick={onFileClick}
                activePath={activePath}
                hiddenPaths={hiddenPaths}
                onRefresh={() => refreshChildren().then(() => onRefresh())}
                templates={templates}
                onDropped={onDropped}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <NewItemDialog
        open={dialogMode !== null}
        mode={dialogMode ?? "file"}
        parentPath={entry.path}
        templates={templates}
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialogMode(null)}
      />
      <IconPicker
        open={iconPickerOpen}
        currentIcon={customIcon}
        targetName={entry.name}
        onSelect={(name) => setIcon(entry.path, name)}
        onReset={() => removeIcon(entry.path)}
        onClose={() => setIconPickerOpen(false)}
      />
    </div>
  );
}

function CtxItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors",
        danger ? "text-destructive hover:text-destructive" : "text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

interface SidebarProps {
  onFileOpen: (path: string) => void;
  onOpenFolder: (dir: string) => void;
}

export function Sidebar({ onFileOpen, onOpenFolder }: SidebarProps) {
  const { fileTree, rootDir, setFileTree } = useEditorStore();
  const currentFilePath = useEditorStore((s) => s.currentFilePath);
  const activeTagFilter = useEditorStore((s) => s.activeTagFilter);
  const activeDateFrom = useEditorStore((s) => s.activeDateFrom);
  const activeDateTo = useEditorStore((s) => s.activeDateTo);
  const { bookmarks, removeBookmark } = useBookmarksStore();
  const { getOrder } = useSortOrderStore();
  const { dragging, overPath, dropPosition } = useDragStore();
  const [fileTags, setFileTags] = useState<Map<string, string[]>>(new Map());
  const [fileDates, setFileDates] = useState<Map<string, string>>(new Map());
  const [templates, setTemplates] = useState<Template[]>([]);
  const [treeKey, setTreeKey] = useState(0);

  const isRootDropTarget = dragging !== null && overPath === rootDir && dropPosition === "root";

  const refresh = useCallback(async () => {
    if (!rootDir) return;
    const tree = await listDirectory(rootDir);
    setFileTree(tree);
    setTreeKey((k) => k + 1);
  }, [rootDir, setFileTree]);

  useEffect(() => {
    if (!rootDir) return;
    listDirectory(rootDir).then(setFileTree).catch(console.error);
  }, [rootDir, setFileTree]);

  useEffect(() => {
    if (!rootDir) return;
    const run = async () => {
      await ensureTemplatesDir(rootDir);
      const [tagResults, tpls] = await Promise.all([scanTags(rootDir), listTemplates(rootDir)]);
      const tagMap = new Map<string, string[]>();
      const dateMap = new Map<string, string>();
      for (const r of tagResults) {
        tagMap.set(r.path, r.tags);
        if (r.created) dateMap.set(r.path, r.created);
      }
      setFileTags(tagMap);
      setFileDates(dateMap);
      setTemplates(tpls);
    };
    run().catch(console.error);
  }, [rootDir]);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tags of fileTags.values())
      for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [fileTags]);

  const hiddenPaths = useMemo<Set<string>>(() => {
    const hasFilter = activeTagFilter || activeDateFrom || activeDateTo;
    if (!hasFilter) return new Set();
    const hidden = new Set<string>();
    for (const [path, tags] of fileTags.entries()) {
      const tagOk = !activeTagFilter || tags.includes(activeTagFilter);
      const created = fileDates.get(path) ?? "";
      const dateFromOk = !activeDateFrom || created >= activeDateFrom;
      const dateToOk = !activeDateTo || created <= activeDateTo;
      if (!tagOk || !dateFromOk || !dateToOk) hidden.add(path);
    }
    return hidden;
  }, [activeTagFilter, activeDateFrom, activeDateTo, fileTags, fileDates]);

  const handleOpenFolderClick = useCallback(async () => {
    const dir = await openDirectory();
    if (dir) onOpenFolder(dir);
  }, [onOpenFolder]);

  const [rootDialogMode, setRootDialogMode] = useState<"file" | "folder" | null>(null);

  const handleRootDialogConfirm = useCallback(
    async (name: string, template: Template | null) => {
      if (!rootDir) return;
      setRootDialogMode(null);
      if (rootDialogMode === "folder") {
        await createDirectory(`${rootDir}/${name}`);
      } else {
        const filePath = `${rootDir}/${name}`;
        if (template) {
          const today = new Date().toISOString().slice(0, 10);
          let content = template.content
            .replace(/\{\{date\}\}/g, today)
            .replace(/\{\{time\}\}/g, new Date().toTimeString().slice(0, 5))
            .replace(/\{\{datetime\}\}/g, new Date().toISOString());
          if (content.includes("{{title}}")) {
            const title = window.prompt(`Title:`, name.replace(".md", ""));
            if (title) content = content.replace(/\{\{title\}\}/g, title);
          }
          await writeFile(filePath, content);
        } else {
          await writeFile(filePath, generateFrontmatter(name, rootDir));
        }
        onFileOpen(filePath);
      }
      refresh();
    },
    [rootDir, rootDialogMode, refresh]
  );

  return (
    <div
      className="flex flex-col h-full w-full bg-sidebar border-r border-sidebar-border"
      data-tour="sidebar"
    >
      <div className="flex items-center justify-between h-11 px-3 border-b border-sidebar-border shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Explorer
        </span>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRootDialogMode("file")}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                disabled={!rootDir}
              >
                <FilePlus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New file</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRootDialogMode("folder")}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                disabled={!rootDir}
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New folder</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenFolderClick}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <FolderOpen className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Open folder</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <FilterPanel allTags={allTags} fileDates={fileDates} />

      {rootDir && (
        <NewItemDialog
          open={rootDialogMode !== null}
          mode={rootDialogMode ?? "file"}
          parentPath={rootDir}
          templates={templates}
          onConfirm={handleRootDialogConfirm}
          onCancel={() => setRootDialogMode(null)}
        />
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="py-1">
          {bookmarks.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Bookmarks
                </span>
              </div>
              {bookmarks.map((bm) => (
                <div
                  key={bm.path}
                  className={cn(
                    "group flex items-center gap-1.5 py-[3px] px-2 rounded-md cursor-pointer select-none text-[13px] transition-colors",
                    "hover:bg-accent/60 hover:text-foreground",
                    currentFilePath === bm.path && "bg-accent text-foreground font-medium"
                  )}
                  onClick={() => onFileOpen(bm.path)}
                >
                  <Bookmark className="h-3 w-3 text-primary shrink-0" />
                  <span className="flex-1 truncate text-muted-foreground group-hover:text-foreground">
                    {bm.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBookmark(bm.path);
                    }}
                    className="hidden group-hover:flex p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              <Separator className="my-1.5" />
            </>
          )}

          <div className="px-1">
            {dragging && rootDir && (
              <div
                data-rootzone={rootDir}
                className={cn(
                  "mb-1 rounded-md border-2 border-dashed text-[11px] text-center py-1.5 transition-all",
                  isRootDropTarget
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border/40 text-muted-foreground/40"
                )}
              >
                {isRootDropTarget ? "↑ Move to root" : "Drop here for root"}
              </div>
            )}
            {fileTree.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                  {rootDir ? "Empty folder" : "Open a folder to get started"}
                </p>
              </div>
            ) : (
              (() => {
                const customOrder = rootDir ? getOrder(rootDir) : null;
                const sorted = customOrder
                  ? [...fileTree].sort((a, b) => {
                      const ai = customOrder.indexOf(a.path);
                      const bi = customOrder.indexOf(b.path);
                      if (ai === -1 && bi === -1) return 0;
                      if (ai === -1) return 1;
                      if (bi === -1) return -1;
                      return ai - bi;
                    })
                  : fileTree;
                return sorted.map((entry) => (
                  <FileNode
                    key={`${entry.path}-${treeKey}`}
                    entry={entry}
                    depth={0}
                    onFileClick={onFileOpen}
                    activePath={currentFilePath}
                    hiddenPaths={hiddenPaths}
                    onRefresh={refresh}
                    templates={templates}
                    onDropped={refresh}
                  />
                ));
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
