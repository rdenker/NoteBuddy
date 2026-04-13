import type { EditorView } from "@codemirror/view";
import {
  Bold,
  Code,
  FileCode,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Strikethrough,
  Table,
  TextQuote,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { editorView } from "@/lib/editorRef";
import { editorCmd } from "@/lib/editorCommands";

function Btn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function cmd(fn: (v: EditorView) => void) {
  return () => {
    const view = editorView.current;
    if (view) fn(view);
  };
}

export function EditorToolbar() {
  return (
    <div className="shrink-0 flex items-center h-9 px-3 gap-0.5 border-b border-border bg-card/60">
      <Btn label="Bold" onClick={cmd(editorCmd.bold)}>
        <Bold className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Italic" onClick={cmd(editorCmd.italic)}>
        <Italic className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Strikethrough" onClick={cmd(editorCmd.strikethrough)}>
        <Strikethrough className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Inline code" onClick={cmd(editorCmd.inlineCode)}>
        <Code className="h-3.5 w-3.5" />
      </Btn>

      <Separator orientation="vertical" className="h-4 mx-1" />

      <Btn label="Heading 1" onClick={cmd(editorCmd.h1)}>
        <Heading1 className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Heading 2" onClick={cmd(editorCmd.h2)}>
        <Heading2 className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Heading 3" onClick={cmd(editorCmd.h3)}>
        <Heading3 className="h-3.5 w-3.5" />
      </Btn>

      <Separator orientation="vertical" className="h-4 mx-1" />

      <Btn label="Blockquote" onClick={cmd(editorCmd.blockquote)}>
        <TextQuote className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Bullet list" onClick={cmd(editorCmd.bulletList)}>
        <List className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Ordered list" onClick={cmd(editorCmd.orderedList)}>
        <ListOrdered className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Task list" onClick={cmd(editorCmd.taskList)}>
        <ListChecks className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Code block" onClick={cmd(editorCmd.codeBlock)}>
        <FileCode className="h-3.5 w-3.5" />
      </Btn>

      <Separator orientation="vertical" className="h-4 mx-1" />

      <Btn label="Link" onClick={cmd(editorCmd.link)}>
        <Link className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Image" onClick={cmd(editorCmd.image)}>
        <Image className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Table" onClick={cmd(editorCmd.table)}>
        <Table className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Horizontal rule" onClick={cmd(editorCmd.hr)}>
        <Minus className="h-3.5 w-3.5" />
      </Btn>
    </div>
  );
}
