import type { Completion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import data from "@emoji-mart/data";

interface EmojiEntry {
  id: string;
  name: string;
  keywords: string[];
  skins: { native: string }[];
}

const ALL_EMOJIS: Completion[] = Object.values(
  (data as { emojis: Record<string, EmojiEntry> }).emojis
).map((e) => ({
  label: `:${e.id}:`,
  displayLabel: `${e.skins[0].native} ${e.id}`,
  apply: e.skins[0].native,
  detail: e.name,
  type: "text",
  boost: 0,
}));

export function emojiCompletion(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/:[a-zA-Z0-9_+-]*/);
  if (!word) return null;
  if (word.from === word.to && !context.explicit) return null;

  const query = word.text.slice(1).toLowerCase();
  if (query.length === 0 && !context.explicit) return null;

  const matches =
    query.length === 0
      ? ALL_EMOJIS.slice(0, 50)
      : ALL_EMOJIS.filter(
          (e) => e.label.includes(query) || e.detail?.toLowerCase().includes(query)
        ).slice(0, 75);

  if (matches.length === 0) return null;

  return {
    from: word.from,
    options: matches,
    validFor: /^:[a-zA-Z0-9_+-]*$/,
  };
}
