---
name: htmlcast
description: Render substantive responses as a live-reloadable HTML page so the user can read them in a browser (via live-server) instead of scrolling the terminal. Active only when a .htmlcast/ directory exists in the project root. Skips trivial responses (short confirmations, one-line answers) and only writes a card for substantive ones (explanations, multi-step reasoning, code with commentary, questions back to the user, or generated files).
---

# htmlcast

Render substantive Claude responses as live-reloadable HTML so the user can read them in a browser on a second monitor instead of in the terminal.

## Activation

This skill is active **only** when a directory named `.htmlcast` exists in the current working directory. Check for it at the start of each turn:

```
test -d .htmlcast
```

If absent: do nothing, behave normally, output to terminal as usual. The rest of this skill does not apply.

If present: apply the smart-trigger heuristic below on every assistant response.

## Smart trigger (per response)

Even when active, **not every response goes to HTML.** Decide per response.

### SKIP HTML — terminal only, no file written

Short, low-content responses where reading in the terminal is fine:

- Tool-result confirmations: "Committed and pushed", "Tests pass", "Installed X"
- Single-line factual answers: "Python 3.12.4", "It's in `app/main.py:42`"
- Yes / no / one-word confirmations
- Anything under ~3 sentences with no code blocks, no questions back, no generated files

For these, respond normally in the terminal. **Do not touch `.htmlcast/`.**

### USE HTML — write a response file, terminal gets a one-line summary

Substantive responses where a browser view helps:

- Explanations of what was done and why
- Multi-step analysis, planning, or reasoning
- Responses containing code blocks with surrounding commentary
- Questions back to the user requiring a decision
- Any response where files were generated this turn (images, configs, assets)
- Anything with multiple sections, lists, or formatted content

For these:

1. Write a new file `./.htmlcast/responses/r-<id>.html`.
2. Edit `./.htmlcast/index.html` to prepend a sidebar entry and update the iframe `src` to the new file.
3. In the terminal, emit exactly one line: `✓ <one-line summary> — see browser` followed by the live-server URL.

The terminal stub is the user's signal that the real content is in the browser. Keep it to one line.

### When in doubt

If the response would be a wall of terminal text with formatting, code, or reasoning the user will want to scan rather than scroll past — use HTML. If it's a quick acknowledgement, skip.

## Architecture: skeleton + standalone iframe pages

The page is a two-pane layout. A sticky **sidebar** lists every response (newest at top). The **content pane** is an `<iframe>` that loads one response file at a time. Each response in `./.htmlcast/responses/` is a **fully self-contained HTML page**: doctype, head, body, the response card, plus the floating section nav. Clicking a sidebar link uses `target="content"` so the browser swaps the iframe's source natively — no JavaScript fetch, no fragment injection, no race against live-server's reload.

```
./.htmlcast/                ← hidden directory; presence activates the skill
├── index.html              ← skeleton: sidebar + iframe, links base.css
├── base.css                ← shared styles (linked by skeleton AND every response)
├── nav.js                  ← floating section-nav scroll-spy
├── responses/
│   └── r-YYYY-MM-DD-HHMMSS.html   ← one standalone page per response
└── archive/                ← optional: older response files trimmed from the sidebar
```

Why this shape: an earlier fetch-and-inject architecture raced live-server's reload and served truncated fragments. The iframe variant defers loading to the browser's native semantics and just works.

## First-time setup in a project

If `./.htmlcast/` is missing the scaffold files (`index.html`, `base.css`, `nav.js`), create them by copying from the skill assets:

- `~/.claude/skills/htmlcast/templates/template-index.html` → `./.htmlcast/index.html`, replacing both `{{PROJECT_NAME}}` tokens (in `<title>` and `.project-chip`) with the basename of the current working directory.
- `~/.claude/skills/htmlcast/assets/base.css` → `./.htmlcast/base.css` (verbatim).
- `~/.claude/skills/htmlcast/assets/nav.js` → `./.htmlcast/nav.js` (verbatim).
- Also ensure `./.htmlcast/responses/` and `./.htmlcast/archive/` directories exist.

Normally this is handled up-front by the `/htmlcast-init` slash command. If the user invokes the skill in a directory that has `./.htmlcast/` but it's missing the scaffold files, perform the copy yourself on the first substantive response.

## Per substantive response — step by step

When the smart trigger says USE HTML:

### 1. Render the response file

Copy the structure of `~/.claude/skills/htmlcast/templates/template-response.html` into a new file at `./.htmlcast/responses/r-<id>.html`, where `<id>` is `YYYY-MM-DD-HHMMSS` in current local time.

The file must contain:

- Doctype + `<head>` linking `../base.css`, the highlight.js CSS/JS from CDN, and the Inter / JetBrains Mono Google Fonts.
- `<body class="standalone">` — the `standalone` class is what triggers centered single-card layout.
- The full **inline SVG `<defs>` block with all 8 symbols** (`i-prompt`, `i-tldr`, `i-answer`, `i-actions`, `i-files`, `i-refs`, `i-questions`, `i-next`). All 8 are required even if the response only uses some of them — `nav.js` references symbols by id when building the floating nav.
- One `<section class="response" id="r-<id>">` containing the card subsections below.
- A trailing `<nav id="section-nav" class="section-nav" aria-label="Jump to section"></nav>` (empty — populated by `nav.js`).
- Trailing scripts: `<script defer src="../nav.js"></script>` and a tiny `DOMContentLoaded` handler that calls `hljs.highlightAll()`.

### 2. Card sections

Each card uses an SVG icon defined in the page's defs block, referenced via `<use href="#i-...">`. The section header markup is:

```html
<header class="section-header">
  <svg class="section-icon"><use href="#i-..."/></svg>
  <span>Label</span>
</header>
```

**Required cards**

- `.response-meta` — status dot + timestamp + one-line summary
- `.response-body` — header titled "Answer" (icon `#i-answer`) + the full response body rendered as HTML (headings, lists, paragraphs, fenced code blocks)

**Optional cards** (use only when there is real content; emit in this order when used):

| Class                   | Icon            | Label              | When to use                                                                          |
|-------------------------|-----------------|--------------------|--------------------------------------------------------------------------------------|
| `.user-prompt`          | `#i-prompt`     | Prompt             | When the prompt is non-trivial and re-reading the card later benefits from context.  |
| `.answer-summary`       | `#i-tldr`       | TL;DR              | When the body is longer than ~6 sentences or has multiple sections.                  |
| `.actions-taken`        | `#i-actions`    | Actions taken      | When you modified state — file edits, scripts run, commits.                          |
| `.generated-files`      | `#i-files`      | Files generated    | When you created or regenerated files. Embed images with `<img>`, link others.       |
| `.references`           | `#i-refs`       | References         | Pointers to follow up on: files touched, memory entries, external URLs, docs.        |
| `.questions-for-user`   | `#i-questions`  | Questions for you  | **Only when there are genuine questions** that would improve the next step.          |
| `.next-steps`           | `#i-next`       | Next steps         | When there are concrete follow-ups for the user (verify-this, try-this-if-X-fails).  |

**Never invent filler content for a card just to populate it.** A section with a header and no real body is worse than no section.

### 3. Update the skeleton

Edit `./.htmlcast/index.html`:

- Prepend a new `<li>` at the top of `<ul class="sidebar-list">`:
  ```html
  <li>
    <a target="content" href="responses/r-<id>.html">
      <span class="time">HH:MM</span>
      <span class="sum">one-line summary</span>
    </a>
  </li>
  ```
  The `target="content"` is critical — without it the click navigates the whole page instead of just the iframe.
- Update the `<iframe class="content" src="...">` `src` attribute to `responses/r-<id>.html` so a fresh page load lands on the newest response.

### 4. Trim history (sidebar only)

Keep at most 20 entries in `<ul class="sidebar-list">`. When a 21st response is added, move the oldest entry from the sidebar list to `<ul class="archive-list">`. Do not delete the underlying response file — moved entries still load correctly because they navigate to the same path.

### 5. Terminal output

Emit exactly one line:

```
✓ <one-line summary> — see browser
http://127.0.0.1:8080/
```

(Use the actual live-server URL the user is running — usually port 8080 or 5500.)

If any file write fails (permission, disk, etc.), fall back to the full normal terminal response and tell the user the HTML write failed and why.

## Generated file references

When the turn generates files (images, textures, configs) that live under the project root, link to them with **paths relative to `.htmlcast/responses/`**, e.g. `../assets/output.png` or `../../some-output.png`. Response files live one level deep inside `.htmlcast/`, so `../` reaches the `.htmlcast/` folder and `../../` reaches the project root.

Embed images with `<img src="..." alt="...">` inside the `generated-files` card. Link other file types with `<a href="...">filename</a>`.

## Aesthetic constraints

Dashboard layout, dark theme, royal-blue primary accent (`#4c7dff`), warm-orange secondary for the Questions card (`#e29b50`), monospace for code (JetBrains Mono via CDN, fallback to system mono), sans-serif for prose, high contrast, generous spacing, no animations. The shipped `base.css` already encodes this — do not restyle inside response files.

## Floating section nav

Every rendered response gets a fixed-position right-side nav with one entry per card present (Prompt, TL;DR, Answer, Actions, Files, References, Questions, Next). It's built automatically by `nav.js` at load time by scanning the response's direct-child cards — no per-response markup needed beyond the empty `<nav id="section-nav">` placeholder and the `<script src="../nav.js">` include. Clicking smooth-scrolls to the section, scrolling highlights the topmost-visible one, and the nav auto-hides on viewports narrower than 980px.

To add a new card type in the future: append one entry to `SECTION_MAP` at the top of `nav.js` and one matching `<symbol id="i-...">` to the template's SVG defs.
