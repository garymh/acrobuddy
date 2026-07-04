import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import {
  readAcronyms,
  writeAcronyms,
  findAcronym,
  parseTsv,
} from "./lib/tsv.js";
import {
  regenXml,
  buildDictionary,
  installDictionary,
  DictionaryError,
} from "./lib/dictionary.js";
import { PATHS } from "./lib/paths.js";

export async function add(
  acronym: string,
  description: string,
  options: { update?: boolean } = {},
): Promise<void> {
  if (!acronym || !description) {
    throw new DictionaryError("acronym and description are required");
  }
  const rows = await readAcronyms();
  const idx = rows.findIndex(
    (r) => r.acronym.toLowerCase() === acronym.toLowerCase(),
  );
  if (idx !== -1 && !options.update) {
    throw new DictionaryError(
      `${acronym} already exists; use 'acronym add --update' to change it, or 'acronym edit'`,
    );
  }
  if (idx !== -1) {
    rows[idx].description = description;
    console.log(`updated ${acronym}`);
  } else {
    rows.push({ acronym, description });
    console.log(`added ${acronym}`);
  }
  await writeAcronyms(rows);
  await regenXml(rows);
  await buildDictionary();
  await installDictionary();
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function bulkAdd(
  source: string,
  options: { update?: boolean } = {},
): Promise<void> {
  let content: string;
  if (source === "-") {
    content = await readStdin();
  } else {
    try {
      content = await readFile(source, "utf8");
    } catch (err) {
      throw new DictionaryError(
        `could not read ${source}: ${(err as Error).message}`,
      );
    }
  }

  const entries = parseTsv(content);
  if (entries.length === 0) {
    console.log("no entries found in input");
    return;
  }

  const rows = await readAcronyms();
  const indexByAcronym = new Map<string, number>();
  rows.forEach((r, i) => indexByAcronym.set(r.acronym.toLowerCase(), i));

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const entry of entries) {
    const key = entry.acronym.toLowerCase();
    const idx = indexByAcronym.get(key);
    if (idx !== undefined) {
      if (options.update) {
        rows[idx].description = entry.description;
        updated++;
      } else {
        skipped++;
      }
    } else {
      rows.push(entry);
      indexByAcronym.set(key, rows.length - 1);
      added++;
    }
  }

  if (added === 0 && updated === 0) {
    console.log(`nothing to add (all ${skipped} already existed)`);
    return;
  }

  await writeAcronyms(rows);

  const summary = [
    added ? `added ${added}` : "",
    updated ? `updated ${updated}` : "",
    skipped ? `skipped ${skipped} duplicate(s)` : "",
  ]
    .filter(Boolean)
    .join(", ");
  console.log(summary);

  await regenXml(rows);
  await buildDictionary();
  await installDictionary();
}

export async function remove(acronym: string): Promise<void> {
  if (!acronym) {
    throw new DictionaryError("usage: acronym rm ACR");
  }
  const rows = await readAcronyms();
  if (!findAcronym(rows, acronym)) {
    throw new DictionaryError(`${acronym} not found`);
  }
  const remaining = rows.filter(
    (r) => r.acronym.toLowerCase() !== acronym.toLowerCase(),
  );
  await writeAcronyms(remaining);
  console.log(`removed ${acronym}`);
  await regenXml(remaining);
  await buildDictionary();
  await installDictionary();
}

export async function list(): Promise<void> {
  const rows = await readAcronyms();
  for (const row of rows) {
    console.log(`${row.acronym.padEnd(12)} ${row.description}`);
  }
}

export function edit(): void {
  const editor = process.env.EDITOR ?? "vi";
  const result = spawnSync(editor, ["acronyms.tsv"], {
    stdio: "inherit",
    cwd: PATHS.project,
  });
  if (result.status !== 0) {
    throw new DictionaryError(`editor exited with status ${result.status}`);
  }
}

export async function regen(): Promise<void> {
  await regenXml(await readAcronyms());
}

export async function build(): Promise<void> {
  await regenXml(await readAcronyms());
  await buildDictionary();
}

export async function install(): Promise<void> {
  await installDictionary();
}