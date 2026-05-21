# Card types

Each response is one `<section class="response">` containing one or more **card** subsections. Two cards are required on every response; the rest are optional and emitted only when there's real content for them.

## Required

### `.response-meta`

The header strip at the top of the response. Status dot (rendered via CSS `::before`) + timestamp + one-line summary.

```html
<div class="response-meta">
  <span class="timestamp">2026-05-21 15:30</span>
  <span class="meta-sep">·</span>
  <span class="summary">one-line summary of the response</span>
</div>
```

### `.response-body`

The Answer card — the main content of the response. Renders standard markdown HTML: headings (`<h1>`–`<h4>`), paragraphs, lists (`<ul>`, `<ol>`), inline code (`<code>`), code blocks (`<pre><code class="language-…">`), tables, blockquotes, links.

Use the inline `.callout` helper for "do this" highlights inside the body:

```html
<div class="callout"><p>Quoted reply or important note</p></div>
```

```html
<section class="response-body">
  <header class="section-header">
    <svg class="section-icon"><use href="#i-answer"/></svg>
    <span>Answer</span>
  </header>
  <h3>Heading</h3>
  <p>Body text…</p>
  <pre><code class="language-js">const x = 1;</code></pre>
</section>
```

## Optional

All optional cards share the same structure: a `<header class="section-header">` with an icon + label, then the card body. Use only when there's real content. **A card with a header and no real body is worse than no card at all.**

### `.user-prompt` — Prompt

Use when the prompt is non-trivial and re-reading the card later benefits from the context. Skip for simple "do X" requests.

```html
<section class="user-prompt">
  <header class="section-header"><svg class="section-icon"><use href="#i-prompt"/></svg><span>Prompt</span></header>
  <blockquote>verbatim or lightly trimmed user message</blockquote>
</section>
```

### `.answer-summary` — TL;DR

Use when the body is longer than ~6 sentences or contains multiple sections. 1–3 sentences, blue-gradient callout style. Skip for short answers where the body itself is already the summary.

```html
<section class="answer-summary">
  <header class="section-header"><svg class="section-icon"><use href="#i-tldr"/></svg><span>TL;DR</span></header>
  <p>The answer in 1–3 sentences.</p>
</section>
```

### `.actions-taken` — Actions

Concrete state changes from this turn. Use `<code>` for paths and commands. Include only when you actually modified state.

```html
<section class="actions-taken">
  <header class="section-header"><svg class="section-icon"><use href="#i-actions"/></svg><span>Actions taken</span></header>
  <ul>
    <li>edited <code>src/foo.ts</code> — switched X to Y</li>
    <li>ran <code>pytest -k bar</code></li>
  </ul>
</section>
```

### `.generated-files` — Files

Files newly created or regenerated this turn. Embed images with `<img>`, link others. Paths are relative to `.htmlcast/responses/`, so use `../` to reach `.htmlcast/` and `../../` to reach the project root.

```html
<section class="generated-files">
  <header class="section-header"><svg class="section-icon"><use href="#i-files"/></svg><span>Files generated</span></header>
  <ul>
    <li><img src="../../assets/output.png" alt="render of output"></li>
    <li><a href="../../scripts/run.sh">scripts/run.sh</a></li>
  </ul>
</section>
```

### `.references` — References

Labeled pointers the reader might follow up on. Each `<li>` starts with a `<span class="ref-label">…</span>` chip categorizing it (`File`, `Memory`, `External`, `Docs`).

```html
<section class="references">
  <header class="section-header"><svg class="section-icon"><use href="#i-refs"/></svg><span>References</span></header>
  <ul>
    <li><span class="ref-label">File</span><a href="../../README.md">README.md</a></li>
    <li><span class="ref-label">Memory</span>name-of-memory-entry</li>
    <li><span class="ref-label">External</span><a href="https://example.com">title</a></li>
  </ul>
</section>
```

### `.questions-for-user` — Questions

Warm-orange callout. **Only render when there are genuine questions** back to the user that would improve the next step. Never include filler questions just to populate the card. If you would normally resolve the ambiguity yourself (e.g. in auto-mode), do that — don't surface it here.

```html
<section class="questions-for-user">
  <header class="section-header"><svg class="section-icon"><use href="#i-questions"/></svg><span>Questions for you</span></header>
  <ol>
    <li>A specific, answerable question.</li>
  </ol>
</section>
```

### `.next-steps` — Next

Concrete follow-ups for the user (verify-this, try-this-if-X-fails). Skip if the turn is fully self-contained.

```html
<section class="next-steps">
  <header class="section-header"><svg class="section-icon"><use href="#i-next"/></svg><span>Next steps</span></header>
  <ul>
    <li>verify X by doing Y</li>
    <li>if Z fails, try W</li>
  </ul>
</section>
```

## Adding a new card type

If you find yourself wanting a new card category:

1. Add a CSS block for it in `skill/assets/base.css` next to the existing card rules.
2. Add a new `<symbol id="i-yourtype">` to the SVG defs block in `skill/templates/template-response.html`.
3. Append an entry to `SECTION_MAP` at the top of `skill/assets/nav.js` so the floating nav picks it up.
4. Re-run `install.sh` / `install.ps1`.

Per-project `.htmlcast/base.css` and `.htmlcast/nav.js` are independent copies — update them in each project, or re-init to pull the latest.
