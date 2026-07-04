#!/usr/bin/env node
// Shebang: `#!/usr/bin/env node` runs this file with Node. The `.mjs` extension
// marks it as an ES module regardless of any package.json `"type"` setting, so
// `import` works even when invoked as a standalone script. (The shebang MUST
// be the very first line — no blank lines or comments above it.)
//
// Shim so the globally-linked `acronym` bin can find the project's own tsx
// regardless of the caller's cwd. ponytail: spawnSync wrapper, ~10 lines, no
// extra deps — the alternative (npx in a shebang) would hit the registry.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// `import.meta.url` here is THIS shim's URL. Because `npm link` symlinks this
// file into the global bin dir, its real location is still inside the project,
// so `..` reliably reaches the project root — independent of where the user
// ran `acronym` from. This is the crux of making a global bin self-locating.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tsx = join(root, "node_modules", ".bin", "tsx");
const cli = join(root, "src", "cli.ts");

// `process.argv.slice(2)` drops the first two elements (`["node", "shim"]`),
// leaving the user's real args — like Ruby's `ARGV`. We forward them to tsx.
// The SPREAD `[cli, ...process.argv.slice(2)]` builds the new argv array.
const result = spawnSync(tsx, [cli, ...process.argv.slice(2)], {
  stdio: "inherit", // child shares the parent's tty (output streams through)
  env: process.env, // pass the full environment through
});

// `?? 1` — if `status` is null (process killed by a signal), exit 1. Mirrors
// the shell convention of non-zero on failure.
process.exit(result.status ?? 1);