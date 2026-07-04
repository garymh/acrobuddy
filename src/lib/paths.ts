import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ponytail: derive project root from this file's location instead of cwd,
// so the CLI works no matter where it's invoked from.
const projectDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

export const PATHS = {
  project: projectDir,
  tsv: join(projectDir, "acronyms.tsv"),
  xml: join(projectDir, "Acronyms.xml"),
  css: join(projectDir, "Acronyms.css"),
  plist: join(projectDir, "AcronymsInfo.plist"),
  objects: join(projectDir, "objects"),
  builtDictionary: join(projectDir, "objects", "Acronyms.dictionary"),
  installDestination: join(
    process.env.HOME ?? "",
    "Library",
    "Dictionaries",
    "Acronyms.dictionary",
  ),
} as const;

export const KIT = {
  buildScript: process.env.DICT_DEV_KIT_BIN ?? "",
  dictName: "Acronyms",
} as const;