export function generateFrontmatter(fileName: string, parentPath: string): string {
  const today = new Date().toISOString().slice(0, 10);

  const title = fileName
    .replace(/\.md$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const folderName = parentPath.split("/").pop() ?? "";
  const type = folderName
    ? folderName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
    : "concept";

  return `---
title: "${title}"
type: ${type}
tags: []
created: ${today}
updated: ${today}
---

`;
}
