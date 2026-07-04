import { writeFile } from "node:fs/promises";
import { PATHS } from "./paths.js";
import type { Acronym } from "./tsv.js";

// ponytail: hand-rolled escape is correct and dependency-free for the tiny
// set of chars acronym text can realistically contain.
function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function entryId(acronym: string): string {
  return acronym
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function generateXml(rows: Acronym[]): Promise<void> {
  const lines: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<d:dictionary xmlns="http://www.w3.org/1999/xhtml" xmlns:d="http://www.apple.com/DTDs/DictionaryService-1.0.rng">`,
  ];

  for (const row of rows) {
    const id = entryId(row.acronym);
    const title = escapeXml(row.acronym);
    const desc = escapeXml(row.description);
    lines.push(
      `<d:entry id="${id}" d:title="${title}">`,
      `\t<d:index d:value="${title}"/>`,
      `\t<h1>${title}</h1>`,
      `\t<p>${desc}</p>`,
      `</d:entry>`,
    );
  }

  lines.push(`</d:dictionary>`);
  await writeFile(PATHS.xml, lines.join("\n") + "\n", "utf8");
}