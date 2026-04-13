import {
  type Completion,
  type CompletionContext,
  type CompletionResult,
  snippetCompletion,
} from "@codemirror/autocomplete";
import { cssCompletionSource } from "@codemirror/lang-css";
import { localCompletionSource as goLocal, snippets as goSnippets } from "@codemirror/lang-go";
import { htmlCompletionSource } from "@codemirror/lang-html";
import {
  localCompletionSource as jsLocal,
  snippets as jsSnippets,
  scopeCompletionSource,
  typescriptSnippets,
} from "@codemirror/lang-javascript";
import { globalCompletion as pyGlobal } from "@codemirror/lang-python";
import { keywordCompletionSource, StandardSQL } from "@codemirror/lang-sql";
import { syntaxTree } from "@codemirror/language";

type LangSource = (
  ctx: CompletionContext
) => CompletionResult | null | Promise<CompletionResult | null>;

function kw(keywords: string[], detail = "keyword"): Completion[] {
  return keywords.map((label) => ({ label, type: "keyword", detail }));
}

function snip(label: string, template: string, detail?: string): Completion {
  return snippetCompletion(template, { label, detail, type: "function" });
}

const RUST_COMPLETIONS: Completion[] = [
  ...kw([
    "as",
    "async",
    "await",
    "break",
    "const",
    "continue",
    "crate",
    "dyn",
    "else",
    "enum",
    "extern",
    "false",
    "fn",
    "for",
    "if",
    "impl",
    "in",
    "let",
    "loop",
    "match",
    "mod",
    "move",
    "mut",
    "pub",
    "ref",
    "return",
    "self",
    "Self",
    "static",
    "struct",
    "super",
    "trait",
    "true",
    "type",
    "union",
    "unsafe",
    "use",
    "where",
    "while",
    "i8",
    "i16",
    "i32",
    "i64",
    "i128",
    "isize",
    "u8",
    "u16",
    "u32",
    "u64",
    "u128",
    "usize",
    "f32",
    "f64",
    "bool",
    "char",
    "str",
    "String",
    "Vec",
    "Option",
    "Result",
    "Box",
    "Some",
    "None",
    "Ok",
    "Err",
    "println!",
    "eprintln!",
    "format!",
    "panic!",
    "assert!",
    "assert_eq!",
    "todo!",
    "unimplemented!",
    "unreachable!",
    "vec!",
    "dbg!",
  ]),
  snip("fn", "fn ${name}(${params}) -> ${ReturnType} {\n\t${}\n}", "function"),
  snip("fn void", "fn ${name}(${params}) {\n\t${}\n}", "function"),
  snip("struct", "struct ${Name} {\n\t${field}: ${Type},\n}", "struct"),
  snip("enum", "enum ${Name} {\n\t${Variant},\n}", "enum"),
  snip("impl", "impl ${Type} {\n\t${}\n}", "impl"),
  snip("trait", "trait ${Name} {\n\t${}\n}", "trait"),
  snip("match", "match ${expr} {\n\t${pattern} => ${},\n\t_ => ${},\n}", "match"),
  snip("if let", "if let ${Some(x)} = ${expr} {\n\t${}\n}", "if let"),
  snip("while let", "while let ${Some(x)} = ${expr} {\n\t${}\n}", "while let"),
  snip("for in", "for ${item} in ${iter} {\n\t${}\n}", "for"),
  snip("let", "let ${name} = ${value};", "let"),
  snip("let mut", "let mut ${name} = ${value};", "let mut"),
  snip("use", "use ${crate}::${module};", "use"),
  snip("derive", "#[derive(${Debug, Clone})]", "attribute"),
  snip("Vec::new", "Vec::new()", "Vec"),
  snip("HashMap::new", "HashMap::new()", "HashMap"),
  snip("Option<T>", "Option<${T}>", "Option"),
  snip("Result<T,E>", "Result<${T}, ${E}>", "Result"),
];

const CPP_COMPLETIONS: Completion[] = [
  ...kw([
    "auto",
    "bool",
    "break",
    "case",
    "catch",
    "char",
    "class",
    "const",
    "constexpr",
    "continue",
    "default",
    "delete",
    "do",
    "double",
    "else",
    "enum",
    "explicit",
    "extern",
    "false",
    "float",
    "for",
    "friend",
    "goto",
    "if",
    "inline",
    "int",
    "long",
    "mutable",
    "namespace",
    "new",
    "noexcept",
    "nullptr",
    "operator",
    "override",
    "private",
    "protected",
    "public",
    "return",
    "short",
    "signed",
    "sizeof",
    "static",
    "static_cast",
    "struct",
    "switch",
    "template",
    "this",
    "throw",
    "true",
    "try",
    "typedef",
    "typename",
    "union",
    "unsigned",
    "using",
    "virtual",
    "void",
    "volatile",
    "while",
    "std::string",
    "std::vector",
    "std::map",
    "std::unordered_map",
    "std::cout",
    "std::cin",
    "std::endl",
    "std::make_shared",
    "std::make_unique",
  ]),
  snip("class", "class ${Name} {\npublic:\n\t${}\n};", "class"),
  snip("struct", "struct ${Name} {\n\t${}\n};", "struct"),
  snip("function", "${ReturnType} ${name}(${params}) {\n\t${}\n}", "function"),
  snip("for", "for (${int i = 0}; ${i < n}; ${i++}) {\n\t${}\n}", "for"),
  snip("for range", "for (auto& ${item} : ${container}) {\n\t${}\n}", "range-for"),
  snip("while", "while (${condition}) {\n\t${}\n}", "while"),
  snip("if", "if (${condition}) {\n\t${}\n}", "if"),
  snip("if else", "if (${condition}) {\n\t${}\n} else {\n\t${}\n}", "if-else"),
  snip(
    "switch",
    "switch (${expr}) {\n\tcase ${value}:\n\t\t${}\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}",
    "switch"
  ),
  snip("template", "template<typename ${T}>\n${}", "template"),
  snip("namespace", "namespace ${name} {\n\t${}\n}", "namespace"),
  snip("try catch", "try {\n\t${}\n} catch (const std::exception& e) {\n\t${}\n}", "try-catch"),
  snip("#include", "#include <${header}>", "include"),
];

const JAVA_COMPLETIONS: Completion[] = [
  ...kw([
    "abstract",
    "assert",
    "boolean",
    "break",
    "byte",
    "case",
    "catch",
    "char",
    "class",
    "const",
    "continue",
    "default",
    "do",
    "double",
    "else",
    "enum",
    "extends",
    "final",
    "finally",
    "float",
    "for",
    "goto",
    "if",
    "implements",
    "import",
    "instanceof",
    "int",
    "interface",
    "long",
    "native",
    "new",
    "package",
    "private",
    "protected",
    "public",
    "return",
    "short",
    "static",
    "strictfp",
    "super",
    "switch",
    "synchronized",
    "this",
    "throw",
    "throws",
    "transient",
    "true",
    "false",
    "null",
    "try",
    "void",
    "volatile",
    "while",
    "String",
    "Integer",
    "Double",
    "Boolean",
    "List",
    "Map",
    "Set",
    "ArrayList",
    "HashMap",
    "Optional",
    "Stream",
    "System.out.println",
    "Override",
    "Deprecated",
  ]),
  snip("class", "public class ${Name} {\n\t${}\n}", "class"),
  snip("interface", "public interface ${Name} {\n\t${}\n}", "interface"),
  snip("enum", "public enum ${Name} {\n\t${VALUE}\n}", "enum"),
  snip("method", "public ${void} ${name}(${params}) {\n\t${}\n}", "method"),
  snip("main", "public static void main(String[] args) {\n\t${}\n}", "main"),
  snip("for", "for (int ${i} = 0; ${i} < ${n}; ${i}++) {\n\t${}\n}", "for"),
  snip("for each", "for (${Type} ${item} : ${collection}) {\n\t${}\n}", "for-each"),
  snip("while", "while (${condition}) {\n\t${}\n}", "while"),
  snip("if", "if (${condition}) {\n\t${}\n}", "if"),
  snip("if else", "if (${condition}) {\n\t${}\n} else {\n\t${}\n}", "if-else"),
  snip(
    "switch",
    "switch (${expr}) {\n\tcase ${value}:\n\t\t${}\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}",
    "switch"
  ),
  snip("try catch", "try {\n\t${}\n} catch (${Exception} e) {\n\t${}\n}", "try-catch"),
  snip("try finally", "try {\n\t${}\n} finally {\n\t${}\n}", "try-finally"),
  snip("@Override", "@Override\n${}", "annotation"),
  snip("sysout", "System.out.println(${});", "print"),
];

const PYTHON_SNIPPETS: Completion[] = [
  snip("def", "def ${name}(${params}):\n\t${}", "function"),
  snip("async def", "async def ${name}(${params}):\n\t${}", "async function"),
  snip("class", "class ${Name}:\n\tdef __init__(self):\n\t\t${}", "class"),
  snip("if", "if ${condition}:\n\t${}", "if"),
  snip("if else", "if ${condition}:\n\t${}\nelse:\n\t${}", "if-else"),
  snip("elif", "elif ${condition}:\n\t${}", "elif"),
  snip("for", "for ${item} in ${iterable}:\n\t${}", "for"),
  snip("while", "while ${condition}:\n\t${}", "while"),
  snip("try except", "try:\n\t${}\nexcept ${Exception} as e:\n\t${}", "try-except"),
  snip("try finally", "try:\n\t${}\nfinally:\n\t${}", "try-finally"),
  snip("with", "with ${context} as ${name}:\n\t${}", "with"),
  snip("lambda", "lambda ${params}: ${}", "lambda"),
  snip("list comp", "[${expr} for ${item} in ${iterable}]", "list comprehension"),
  snip("dict comp", "{${k}: ${v} for ${k}, ${v} in ${items}}", "dict comprehension"),
  snip("import", "import ${module}", "import"),
  snip("from import", "from ${module} import ${name}", "from import"),
  snip("dataclass", "@dataclass\nclass ${Name}:\n\t${field}: ${type}", "dataclass"),
  snip("__main__", 'if __name__ == "__main__":\n\t${main()}', "__main__"),
  snip("print", "print(${value})", "print"),
  snip("f-string", 'f"${}"', "f-string"),
];

const BASH_COMPLETIONS: Completion[] = [
  ...kw([
    "if",
    "then",
    "else",
    "elif",
    "fi",
    "for",
    "in",
    "do",
    "done",
    "while",
    "until",
    "case",
    "esac",
    "function",
    "return",
    "exit",
    "break",
    "continue",
    "local",
    "export",
    "readonly",
    "declare",
    "unset",
    "shift",
    "set",
    "echo",
    "printf",
    "read",
    "test",
    "true",
    "false",
    "source",
    "eval",
    "exec",
    "trap",
    "wait",
    "kill",
    "sleep",
    "mkdir",
    "rm",
    "cp",
    "mv",
    "ls",
    "cat",
    "grep",
    "sed",
    "awk",
    "find",
    "xargs",
    "sort",
    "uniq",
    "wc",
    "head",
    "tail",
    "cut",
    "tr",
    "chmod",
    "chown",
    "pwd",
    "cd",
    "pushd",
    "popd",
    "$?",
    "$$",
    "$!",
    "$0",
    "$@",
    "$*",
    "$#",
    "${VAR}",
    "$(cmd)",
    "$((expr))",
  ]),
  snip("function", "${name}() {\n\t${}\n}", "function"),
  snip("if", "if [[ ${condition} ]]; then\n\t${}\nfi", "if"),
  snip("if else", "if [[ ${condition} ]]; then\n\t${}\nelse\n\t${}\nfi", "if-else"),
  snip("for", "for ${item} in ${list}; do\n\t${}\ndone", "for"),
  snip("while", "while [[ ${condition} ]]; do\n\t${}\ndone", "while"),
  snip(
    "case",
    "case ${var} in\n\t${pattern})\n\t\t${}\n\t\t;;\n\t*)\n\t\t${}\n\t\t;;\nesac",
    "case"
  ),
  snip("read", "read -r ${var}", "read"),
  snip("$(...)", "$(${command})", "subshell"),
  snip("[[ ]]", "[[ ${condition} ]]", "test"),
];

const GO_SNIPPETS: Completion[] = [
  ...kw([
    "break",
    "case",
    "chan",
    "const",
    "continue",
    "default",
    "defer",
    "else",
    "fallthrough",
    "for",
    "func",
    "go",
    "goto",
    "if",
    "import",
    "interface",
    "map",
    "package",
    "range",
    "return",
    "select",
    "struct",
    "switch",
    "type",
    "var",
    "nil",
    "true",
    "false",
    "iota",
    "int",
    "int8",
    "int16",
    "int32",
    "int64",
    "uint",
    "uint8",
    "uint16",
    "uint32",
    "uint64",
    "float32",
    "float64",
    "complex64",
    "complex128",
    "bool",
    "byte",
    "rune",
    "string",
    "error",
    "any",
    "make",
    "new",
    "len",
    "cap",
    "append",
    "copy",
    "close",
    "delete",
    "panic",
    "recover",
    "print",
    "println",
    "fmt.Println",
    "fmt.Printf",
    "fmt.Sprintf",
    "fmt.Errorf",
    "errors.New",
    "log.Println",
    "log.Fatal",
    "os.Exit",
  ]),
];

const SQL_KEYWORDS: Completion[] = kw([
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "NOT",
  "IN",
  "EXISTS",
  "LIKE",
  "BETWEEN",
  "IS NULL",
  "IS NOT NULL",
  "JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "FULL JOIN",
  "ON",
  "GROUP BY",
  "ORDER BY",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "UNION",
  "UNION ALL",
  "INSERT INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE FROM",
  "CREATE TABLE",
  "DROP TABLE",
  "ALTER TABLE",
  "ADD COLUMN",
  "DROP COLUMN",
  "INDEX",
  "PRIMARY KEY",
  "FOREIGN KEY",
  "REFERENCES",
  "UNIQUE",
  "NOT NULL",
  "DEFAULT",
  "AUTO_INCREMENT",
  "SERIAL",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "WITH",
  "AS",
  "DISTINCT",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "COALESCE",
  "NULLIF",
  "CAST",
  "CONVERT",
  "SUBSTR",
  "TRIM",
  "UPPER",
  "LOWER",
  "NOW()",
  "CURRENT_TIMESTAMP",
  "DATE",
  "DATETIME",
  "TIMESTAMP",
  "INTEGER",
  "VARCHAR",
  "TEXT",
  "BOOLEAN",
  "FLOAT",
  "DOUBLE",
  "DECIMAL",
  "JSON",
]);

const YAML_COMPLETIONS: Completion[] = [
  ...kw(["true", "false", "null", "~", "yes", "no", "on", "off"], "literal"),
  snip("mapping", "${key}: ${value}", "key-value"),
  snip("list item", "- ${value}", "list"),
  snip("multiline |", "${key}: |\n  ${value}", "literal block"),
  snip("multiline >", "${key}: >\n  ${value}", "folded block"),
  snip("anchor", "&${anchor} ${value}", "anchor"),
  snip("alias", "*${anchor}", "alias"),
];

const SYMBOL_PATTERNS: Record<string, RegExp[]> = {
  rust: [
    /\bfn\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /\bstruct\s+([A-Z][a-zA-Z0-9_]*)/g,
    /\benum\s+([A-Z][a-zA-Z0-9_]*)/g,
    /\btrait\s+([A-Z][a-zA-Z0-9_]*)/g,
    /\btype\s+([A-Z][a-zA-Z0-9_]*)/g,
    /\blet(?:\s+mut)?\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /\bconst\s+([A-Z_][A-Z0-9_]*)/g,
  ],
  cpp: [
    /\b(?:void|int|float|double|bool|auto|string)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    /\bclass\s+([A-Z][a-zA-Z0-9_]*)/g,
    /\bstruct\s+([A-Z][a-zA-Z0-9_]*)/g,
    /\bauto\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g,
  ],
  java: [
    /\b(?:public|private|protected|static)?\s*(?:void|int|float|double|boolean|String|[A-Z][a-zA-Z0-9_<>]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    /\bclass\s+([A-Z][a-zA-Z0-9_]*)/g,
    /\binterface\s+([A-Z][a-zA-Z0-9_]*)/g,
  ],
  bash: [/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\)/gm, /\b([A-Z_][A-Z0-9_]*)=/g],
  go: [
    /\bfunc\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /\btype\s+([A-Z][a-zA-Z0-9_]*)/g,
    /\bvar\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:=/g,
  ],
  sql: [
    /\bCREATE\s+(?:TABLE|VIEW)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    /\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    /\bJOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
  ],
  python: [
    /\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm,
  ],
};

function extractLocalSymbols(blockText: string, lang: string): Completion[] {
  const patterns = SYMBOL_PATTERNS[lang] ?? [
    /\bfunction\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /\bconst\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /\blet\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
  ];

  const seen = new Set<string>();
  const completions: Completion[] = [];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match = pattern.exec(blockText);
    while (match !== null) {
      const name = match[1];
      if (name && !seen.has(name)) {
        seen.add(name);
        completions.push({ label: name, type: "variable", detail: "local" });
      }
      match = pattern.exec(blockText);
    }
  }

  return completions;
}

function getCodeBlockContext(context: CompletionContext): {
  lang: string;
  blockText: string;
} | null {
  const tree = syntaxTree(context.state);
  const node = tree.resolveInner(context.pos, -1);

  let cur = node;
  while (cur.parent) {
    const typeName = cur.type.name;
    if (typeName === "FencedCode") {
      const fullText = context.state.doc.toString();
      const blockText = fullText.slice(cur.from, cur.to);
      const langMatch = blockText.match(/^```+(\w+)/);
      const lang = langMatch ? langMatch[1].toLowerCase() : "";

      const codeStart = blockText.indexOf("\n") + 1;
      const codeEnd = blockText.lastIndexOf("```");
      const codeOnly =
        codeEnd > codeStart ? blockText.slice(codeStart, codeEnd) : blockText.slice(codeStart);

      return { lang, blockText: codeOnly };
    }
    cur = cur.parent;
  }

  return null;
}

function staticSource(completions: Completion[]): LangSource {
  return (context: CompletionContext) => {
    const word = context.matchBefore(/[a-zA-Z_#@$][a-zA-Z0-9_]*/);
    if (!word && !context.explicit) return null;
    const from = word?.from ?? context.pos;
    const prefix = (word?.text ?? "").toLowerCase();

    const options = prefix
      ? completions.filter((c) => c.label.toLowerCase().startsWith(prefix))
      : completions;

    if (options.length === 0) return null;
    return { from, options };
  };
}

function mergedSource(
  staticCompletions: Completion[],
  nativeSource?: LangSource,
  blockText?: string,
  lang?: string
): LangSource {
  return async (context: CompletionContext) => {
    const word = context.matchBefore(/[a-zA-Z_][a-zA-Z0-9_]*/);
    if (!word && !context.explicit) return null;
    const from = word?.from ?? context.pos;
    const prefix = (word?.text ?? "").toLowerCase();

    const localSymbols = blockText && lang ? extractLocalSymbols(blockText, lang) : [];

    let nativeOptions: Completion[] = [];
    if (nativeSource) {
      const result = await nativeSource(context);
      if (result) nativeOptions = [...result.options];
    }

    const staticFiltered = prefix
      ? staticCompletions.filter((c) => c.label.toLowerCase().startsWith(prefix))
      : staticCompletions;

    const localFiltered = prefix
      ? localSymbols.filter(
          (c) => c.label.toLowerCase().startsWith(prefix) && c.label !== word?.text
        )
      : localSymbols;

    const nativeFiltered = prefix
      ? nativeOptions.filter((c) => c.label.toLowerCase().startsWith(prefix))
      : nativeOptions;

    const seen = new Set<string>();
    const merged: Completion[] = [];
    for (const opt of [...localFiltered, ...nativeFiltered, ...staticFiltered]) {
      if (!seen.has(opt.label)) {
        seen.add(opt.label);
        merged.push(opt);
      }
    }

    if (merged.length === 0) return null;
    return { from, options: merged };
  };
}

const jsScope = scopeCompletionSource(globalThis);

const LANG_SOURCES: Record<string, (blockText: string) => LangSource> = {
  javascript: (bt) =>
    mergedSource(
      [...jsSnippets] as Completion[],
      mergedSource([], jsScope, bt, "javascript"),
      bt,
      "javascript"
    ),
  jsx: (bt) =>
    mergedSource(
      [...jsSnippets] as Completion[],
      mergedSource([], jsScope, bt, "javascript"),
      bt,
      "javascript"
    ),
  typescript: (bt) =>
    mergedSource(
      [...jsSnippets, ...typescriptSnippets] as Completion[],
      mergedSource([], jsLocal, bt, "typescript"),
      bt,
      "typescript"
    ),
  tsx: (bt) =>
    mergedSource(
      [...jsSnippets, ...typescriptSnippets] as Completion[],
      mergedSource([], jsLocal, bt, "typescript"),
      bt,
      "typescript"
    ),
  python: (bt) =>
    mergedSource(PYTHON_SNIPPETS, mergedSource([], pyGlobal, bt, "python"), bt, "python"),
  go: (bt) => mergedSource([...(goSnippets as Completion[]), ...GO_SNIPPETS], goLocal, bt, "go"),
  rust: (bt) =>
    staticSource([
      ...RUST_COMPLETIONS,
      ...extractLocalSymbols(bt, "rust").map((s) => ({ ...s, type: "variable" as const })),
    ]),
  cpp: (bt) => staticSource([...CPP_COMPLETIONS, ...extractLocalSymbols(bt, "cpp")]),
  "c++": (bt) => staticSource([...CPP_COMPLETIONS, ...extractLocalSymbols(bt, "cpp")]),
  c: (bt) => staticSource([...CPP_COMPLETIONS, ...extractLocalSymbols(bt, "cpp")]),
  java: (bt) => staticSource([...JAVA_COMPLETIONS, ...extractLocalSymbols(bt, "java")]),
  css: (_bt) => cssCompletionSource,
  html: (_bt) => htmlCompletionSource,
  sql: (_bt) => mergedSource(SQL_KEYWORDS, keywordCompletionSource(StandardSQL)),
  bash: (bt) => staticSource([...BASH_COMPLETIONS, ...extractLocalSymbols(bt, "bash")]),
  sh: (bt) => staticSource([...BASH_COMPLETIONS, ...extractLocalSymbols(bt, "bash")]),
  shell: (bt) => staticSource([...BASH_COMPLETIONS, ...extractLocalSymbols(bt, "bash")]),
  yaml: (_bt) => staticSource(YAML_COMPLETIONS),
  yml: (_bt) => staticSource(YAML_COMPLETIONS),
};

export async function codeBlockCompletion(
  context: CompletionContext
): Promise<CompletionResult | null> {
  const blockCtx = getCodeBlockContext(context);
  if (!blockCtx?.lang) return null;

  const { lang, blockText } = blockCtx;
  const sourceFactory = LANG_SOURCES[lang];
  if (!sourceFactory) return null;

  const source = sourceFactory(blockText);
  return source(context);
}
