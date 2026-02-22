# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

No build step. Serve locally and open in a browser:

```bash
python3 -m http.server 8080
# visit http://localhost:8080
```

There is no automated test suite. Manual verification: load an example from the dropdown, run it with **Ctrl+Enter**, and confirm node values match the expected output in the example comments.

## Architecture

This is a **zero-build, vanilla JS, single-page app** — no npm, no bundler, no framework.

| File | Role |
|------|------|
| `index.html` | All UI markup + ~1400 lines of inline `<script>`. State management, canvas rendering, event handlers, DP display. |
| `dp-engine.js` | DP evaluation engine. Loaded before the inline script. Exposes `EXAMPLES` (built-in formula strings) and `runDP(nodes, edges, code, isDirected)` returning `{ results, groups, error }`. |
| `style.css` | CSS custom properties for theming (`--accent`, `--bg`, `--card`, `--border`, `--fg`, `--muted`, `--danger`, `--orange`) + custom layout classes. |
| `examples/` | `.txt` files with DSL formula examples, loaded verbatim into the textarea. |

**No modules, no imports.** All globals are shared across `dp-engine.js` and the inline script.

## State & Mutation Conventions

`state` in `index.html` is the single source of truth for the graph, UI mode, DP results, and display settings.

- Call `saveHistory()` **before** any mutation that should be undoable (snapshots `{ nodes, edges, nextId }`).
- Call `fullUpdate()` after graph mutations — it calls `render()`, `updateOutput()`, `updateDataTable()`, and `updateDisplayOptions()`.
- Call `saveToStorage()` after display-only changes (persists to `localStorage`).
- Node/edge IDs are sequential integers via `state.nextId`. Never reuse IDs.

**localStorage keys:**
- `tree_dp_editor_v2` — graph state (nodes, edges, nextId), topology flags, DP code, display settings
- `tree_dp_custom_formulas` — user-saved formula names + code (JSON)

## Canvas Rendering

All rendering is **immediate-mode** in the `render()` function — no retained-mode scene graph. Always call `render()` after any state change that affects visuals. The canvas clears and redraws edges, arrowheads, nodes, and per-node labels on every call.

## DP Engine

`dp-engine.js` contains a regex-based tokenizer, a recursive-descent expression parser, and an AST evaluator with operator precedence (ternary → or → and → eq → cmp → add → mul → mod → pow → unary).

**Two execution modes:**
1. **Regular groups** — one DP variable per line; evaluated post-order (children before parents) by default; switches to pre-order when `par()` is used (rerooting/top-down second pass).
2. **Bundles** — multiple interdependent lines wrapped in `{ ... }`; all lines execute in order per node.

**Local variables** use the format `dpName:localVar` — they're not stored in results or shown in display options.

**Bundle variables** are keyed as `__bundle_N` internally and hidden from display by default.

## Adding a New Built-in Example

1. Add an entry to the `EXAMPLES` object in `dp-engine.js`.
2. Add a matching `<option>` in the `#dpExamples` `<select>` in `index.html`.
3. Optionally add a `.txt` file in `examples/` with the formula text.

## Code Style

The inline script in `index.html` is divided into sections with banner comments — follow this pattern when adding new sections:

```js
// =============================================
// SECTION NAME
// =============================================
```

UI toggle state (`isTree`, `isDirected`, `showEdgeW`) is reflected on DOM elements via the `.active` class. The `display` object in `state` controls which per-node values appear as canvas labels; `renderDisplayOptions()` rebuilds `#displayOptionsContainer` whenever DP results change.
