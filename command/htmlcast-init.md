---
description: Initialize the current project for the htmlcast skill — create the hidden .htmlcast/ directory with index.html / base.css / nav.js copied from the skill, and print live-server instructions.
---

Initialize the current working directory so the `htmlcast` skill activates here.

Do exactly the following, then stop. **Do not write a card to `./.htmlcast/index.html` for this response** — the smart trigger in `htmlcast` says one-line confirmations stay terminal-only, and init is one of them.

## 1. Create the hidden output directory

Check whether `./.htmlcast/` already exists.

- If it exists, tell the user the project is already initialized.
- Otherwise, create `./.htmlcast/`, `./.htmlcast/responses/`, and `./.htmlcast/archive/`.

The presence of `./.htmlcast/` as a directory is itself the activation marker — there is no separate marker file. The dot-prefix keeps it hidden from normal `ls` and most file-explorer views, since it's generated tooling state rather than project content.

## 2. Scaffold from the skill

Copy the skill's bundled assets into `./.htmlcast/` so the browser view works without further setup:

- `~/.claude/skills/htmlcast/templates/template-index.html` → `./.htmlcast/index.html`
  - Replace **both** `{{PROJECT_NAME}}` tokens (the `<title>` tag and the `.project-chip`) with the basename of the current working directory.
- `~/.claude/skills/htmlcast/assets/base.css` → `./.htmlcast/base.css` (verbatim)
- `~/.claude/skills/htmlcast/assets/nav.js` → `./.htmlcast/nav.js` (verbatim)

If any of those scaffold files already exists in `./.htmlcast/`, leave it alone — the user may have customized it.

## 3. .gitignore (optional, non-creating)

If a `.gitignore` already exists in the cwd and the entry isn't already present, append:

```
.htmlcast/
```

If there is no `.gitignore`, skip this step silently — do not create one.

## 4. Confirm

Print to the terminal in this exact shape:

```
✓ htmlcast initialized
  output:  ./.htmlcast/index.html

Next: in a separate terminal, run
  live-server .htmlcast/
```
