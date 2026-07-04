import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { $ } from "execa";
import { PATHS, KIT } from "./paths.js";
import type { Acronym } from "./tsv.js";
import { generateXml } from "./xml.js";

export class DictionaryError extends Error {}

export async function regenXml(rows: Acronym[]): Promise<void> {
  await generateXml(rows);
  console.log(`regenerated ${PATHS.xml}`);
}

export async function buildDictionary(): Promise<void> {
  if (!KIT.buildScript || !existsSync(KIT.buildScript)) {
    throw new DictionaryError(
      `set DICT_DEV_KIT_BIN to the Apple Dictionary Development Kit's build_dict.sh`,
    );
  }

  await rm(PATHS.objects, { recursive: true, force: true });
  await mkdir(PATHS.objects, { recursive: true });

  await $({
    cwd: PATHS.project,
    env: { ...process.env, DICT_DEV_KIT_OBJ_DIR: PATHS.objects },
  })`${KIT.buildScript} ${KIT.dictName} ${PATHS.xml} ${PATHS.css} ${PATHS.plist}`;

  if (!existsSync(PATHS.builtDictionary)) {
    throw new DictionaryError(
      `build finished but ${PATHS.builtDictionary} was not produced`,
    );
  }
  console.log(`built ${PATHS.builtDictionary}`);
}

// The lookup popup (force-click / long-press in Safari) is served by
// launch-on-demand XPC helpers that cache the dictionary index. After a rebuild
// they keep serving stale content until killed; they ignore polite signals, so
// SIGKILL (-9). They respawn fresh on the next lookup, reloading the new index.
// pkill exit codes: 0 = signaled, 1 = no match (normal), 2 = syntax error.
const LOOKUP_HELPERS = ["DictionaryServiceHelper", "LookupViewService"];

async function refreshLookupHelpers(): Promise<void> {
  for (const name of LOOKUP_HELPERS) {
    const result = await $({ reject: false })`pkill -9 ${name}`;
    if (result.exitCode !== 0 && result.exitCode !== 1) {
      throw new DictionaryError(
        `pkill ${name} failed (exit ${result.exitCode})`,
      );
    }
  }
  console.log("refreshed lookup helpers — next lookup reloads the dictionary");
}

export async function installDictionary(): Promise<void> {
  if (!existsSync(PATHS.builtDictionary)) {
    throw new DictionaryError(`nothing built — run 'acronym build' first`);
  }
  const destDir = PATHS.installDestination;
  await mkdir(dirname(destDir), { recursive: true });
  await $`ditto --noextattr --norsrc ${PATHS.builtDictionary} ${destDir}`;
  console.log(`installed -> ${destDir}`);
  await refreshLookupHelpers();
  console.log(
    `open Dictionary.app and enable '${KIT.dictName}' in Preferences (Cmd-,) if not already.`,
  );
}