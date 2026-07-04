# acrobuddy

<img width="384" height="441" alt="Screenshot 2026-07-03 at 23 40 12" src="https://github.com/user-attachments/assets/1dd80b0f-9d7b-4b49-b7bd-544a261fc106" />

Acronyms are annoying. This little app will let you manage a custom Apple Dictionary of acronyms from the command line. You can add, remove, list, and rebuild entries until your heart is content. It should automatically add them to your custom dictionaries, you just need to enable it once. Enjoy!

macOS only. Depends on Apple's [Dictionary Development Kit](https://developer.apple.com/).

## Setup

1. Install Node 18+.
2. Download the Dictionary Development Kit (ships with older Auxiliary Tools for Xcode). Set its build script path in your shell:

   ```sh
   export DICT_DEV_KIT_BIN="/path/to/Dictionary Development Kit/bin/build_dict.sh"
   ```

3. `npm install`
4. `npm link` (optional) — exposes the `acronym` command globally.

## Usage

```
acronym add WTF "What the Fudge"
acronym add --file extra.tsv        # bulk-add from a TSV (use - for stdin)
acronym add --update WTF "..."     # overwrite an existing entry
acronym rm WTF
acronym list
acronym edit                        # open acronyms.tsv in $EDITOR
acronym build                       # regenerate XML + build the .dictionary bundle
acronym install                     # copy the bundle to ~/Library/Dictionaries
```

`add`, `rm`, and `add --file` rebuild and install in one step. Use `build` / `install` separately when you only need one.

## How it works!

* Entries live in `acronyms.tsv` (`acronym<TAB>description` per line).
* Commands regenerate `Acronyms.xml`, run the kit's `build_dict.sh` to produce `objects/Acronyms.dictionary`, and `ditto` it into `~/Library/Dictionaries`.
* After install, lookup helpers are killed so the next force-click reloads the new index.

## Important:

Enable **Acronyms** in Dictionary.app → Preferences (Cmd-,) on first use!
