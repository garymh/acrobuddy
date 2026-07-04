import { readFile, writeFile } from "node:fs/promises";
import { PATHS } from "./paths.js";

export interface Acronym {
  acronym: string;
  description: string;
}

const TAB = "\t";
const NL = "\n";

export function parseTsv(content: string): Acronym[] {
  return content
    .split(NL)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const [acronym, ...rest] = line.split(TAB);
      return {
        acronym: acronym ?? "",
        description: rest.join(TAB),
      };
    })
    .filter((row) => row.acronym.length > 0);
}

export async function readAcronyms(): Promise<Acronym[]> {
  return parseTsv(await readFile(PATHS.tsv, "utf8"));
}

export async function writeAcronyms(rows: Acronym[]): Promise<void> {
  const content =
    rows.map((r) => `${r.acronym}${TAB}${r.description}`).join(NL) +
    (rows.length > 0 ? NL : "");
  await writeFile(PATHS.tsv, content, "utf8");
}

export function findAcronym(
  rows: Acronym[],
  acronym: string,
): Acronym | undefined {
  const target = acronym.toLowerCase();
  return rows.find((r) => r.acronym.toLowerCase() === target);
}