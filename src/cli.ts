import { Command } from "commander";
import * as cmd from "./commands.js";
import { DictionaryError } from "./lib/dictionary.js";

const program = new Command();

program
  .name("acronym")
  .description("Manage a custom Apple Dictionary of acronyms")
  .version("1.0.0");

program
  .command("add")
  .description("append an acronym (or many via --file), then rebuild + install")
  .argument("[acronym]", "the acronym, e.g. NASA (omit when using --file)")
  .argument("[description]", "what it stands for / means")
  .option("-f, --file <path>", "bulk-add from a TSV file (use '-' for stdin)")
  .option("-u, --update", "overwrite existing acronyms instead of skipping/erroring")
  .action(
    async (
      acronym: string | undefined,
      description: string | undefined,
      options: { file?: string; update?: boolean },
    ) => {
      if (options.file) {
        await cmd.bulkAdd(options.file, { update: options.update });
      } else {
        if (!acronym || !description) {
          throw new DictionaryError(
            `usage: acronym add ACR "desc"  |  acronym add --file <path>`,
          );
        }
        await cmd.add(acronym, description, { update: options.update });
      }
    },
  );

program
  .command("rm")
  .description("remove an acronym, then rebuild + install")
  .argument("<acronym>", "the acronym to remove")
  .action(async (acronym: string) => {
    await cmd.remove(acronym);
  });

program
  .command("list")
  .description("print all acronyms")
  .action(async () => {
    await cmd.list();
  });

program
  .command("edit")
  .description("open acronyms.tsv in $EDITOR")
  .action(() => {
    cmd.edit();
  });

program
  .command("regen")
  .description("regenerate Acronyms.xml from acronyms.tsv")
  .action(async () => {
    await cmd.regen();
  });

program
  .command("build")
  .description("regenerate XML + build the .dictionary bundle")
  .action(async () => {
    await cmd.build();
  });

program
  .command("install")
  .description("copy the built bundle to ~/Library/Dictionaries")
  .action(async () => {
    await cmd.install();
  });

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof DictionaryError) {
      console.error(`error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}

await main();