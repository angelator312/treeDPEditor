# Project Guidelines — Tree DP & Graph Editor

## Architecture

This is a **single-page, zero-build, vanilla JS** web app with no npm, no bundler, no framework.

- [index.html](../index.html) — All UI markup + all application logic (~1400 lines of inline `<script>`). State management, canvas rendering, event handlers, and DP display all live here.
- [dp-engine.js](../dp-engine.js) — The DP evaluation engine loaded before the inline script. Exposes `EXAMPLES` (built-in formula strings) and `runDP(nodes, edges, code, isDirected)` which returns `{ results, groups, error }`.
- [style.css](../style.css) — CSS custom properties for theming (`--accent`, `--bg`, `--card`, `--border`, `--fg`, `--muted`, `--danger`, `--orange`). Layout uses Tailwind CDN + custom classes.
- [examples/](../examples/) — `.txt` files containing example DSL formulas, loaded verbatim into the textarea.

## Code Style

- **No modules, no imports.** All globals are shared across `dp-engine.js` and the inline script in `index.html`.
- The inline script in `index.html` is divided into clearly labelled sections with banner comments:
  ```js
  // =============================================
  // STATE / STORAGE / HISTORY / CANVAS / DP / ...
  // =============================================
  ```
  Follow this pattern when adding new sections.
- `state` is the single source of truth. Mutate it directly and call `saveToStorage()` + `render()` after changes.
- History (undo/redo) snapshots `{ nodes, edges, nextId }` via `saveHistory()` — call it before any mutation that should be undoable.
- Persistence uses `localStorage` with keys `'tree_dp_editor_v2'` (graph state) and `'tree_dp_custom_formulas'` (user-saved formulas).

## DSL / DP Engine

The DSL parsed by [dp-engine.js](../dp-engine.js) supports:
- **Simple assignment:** `dp = val + sum(children, dp)`
- **Multi-state:** multiple lines, each a separate named variable; they are evaluated bottom-up (or top-down when `par()` is used)
- **Bundle:** wrap multiple interdependent lines in `{ ... }` for coordinated evaluation
- **`par(varName)`** triggers rerooting (top-down second pass)
- Aggregation functions take `(arr, expr)` where `expr` is evaluated with each child's context

Adding a new built-in example: add an entry to the `EXAMPLES` object in [dp-engine.js](../dp-engine.js) and a matching `<option>` in the `#dpExamples` `<select>` in [index.html](../index.html).

## Build and Test

No build step. Open [index.html](../index.html) directly in a browser, or serve locally:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

There is no automated test suite. Manual verification: load an example from the dropdown, run it with **Ctrl+Enter**, and confirm node values match the expected output documented in the example comments.

## Project Conventions

- **Canvas rendering** is entirely immediate-mode in the `render()` function — no retained-mode scene graph. Always call `render()` after any state change that affects visuals.
- **Node and edge IDs** use sequential integers (`state.nextId`). Never reuse IDs.
- UI toggle state (`isTree`, `isDirected`, `showEdgeW`) is reflected on the toggle DOM elements via the `.active` class.
- The `display` object in `state` controls which per-node values are shown as canvas labels; the `#displayOptionsContainer` div is rebuilt by `renderDisplayOptions()` whenever DP results change.
- Example `.txt` files in [examples/](../examples/) must remain loadable as plain text — do not add binary or non-UTF-8 content.
