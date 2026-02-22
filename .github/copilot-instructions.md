# Project Guidelines — Tree DP & Graph Editor

## Architecture

This is a **single-page, zero-build, vanilla JS** web app with no npm, no bundler, no framework. Code is modularized across focused files loaded in order via `<script>` tags in `index.html`.

- [index.html](../index.html) — DOM markup only (174 lines). Loads all JS files; order matters.
- [state.js](../state.js) — `state` object, `saveToStorage()`, `loadFromStorage()`, history, custom formulas
- [graph.js](../graph.js) — Graph operations, multi-select, rubber band selection, `beautifyTree()` layout
- [events.js](../events.js) — Event binding and canvas interactions. **Must load last**; calls `init()` on `DOMContentLoaded`
- [render.js](../render.js) — Canvas rendering, `renderDisplayOptions()`, node/edge visualization
- [dp-engine.js](../dp-engine.js) — DP evaluation engine; executes AST bottom-up (and top-down for `par()`)
- [dp-parser.js](../dp-parser.js) — DSL tokenizer and recursive descent parser
- [dp-docs.js](../dp-docs.js) — Builds the DSL reference panel HTML
- [dp-examples.js](../dp-examples.js) — `EXAMPLES` object with built-in formula strings
- [style.css](../style.css) — CSS custom properties: `--accent`, `--bg`, `--card`, `--border`, `--fg`, `--muted`, `--danger`, `--orange`. Layout uses Tailwind CDN.
- [examples/](../examples/) — `.txt` files containing example DSL formulas, loaded verbatim.

## Code Style

- **No modules, no imports.** All globals are shared across files via `window`/global scope.
- Each file uses section banner comments:
  ```js
  // =============================================
  // SECTION NAME
  // =============================================
  ```
- `state` is the single source of truth. Mutate it directly; call `saveToStorage()` + `render()` after changes.
- Call `saveHistory()` **before** any mutation that should be undoable. History snapshots `{ nodes, edges, nextId }` (max 30).
- Persistence uses `localStorage` keys: `'tree_dp_editor_v2'` (graph state) and `'tree_dp_custom_formulas'` (saved formulas).
- `events.js` is the last script loaded; its `DOMContentLoaded` listener calls `init()` → `bindEvents()` + `loadFromStorage()` + `fullUpdate()`.

## State Structure

```js
state = {
  nodes, edges, nextId,
  mode: 'add' | 'connect' | 'select',
  selected: { type: 'node'|'edge', id },
  connectSource, dragging, rubberBand,
  isTree, isDirected, showEdgeW,
  dpResults, dpGroups,
  display: { id, val, childCount, isLeaf, ...dpVarNames },
  dpFocused,
  multiSelected: new Set()   // node IDs in multi-selection
}
```

## Project Conventions

- **Canvas rendering** is entirely immediate-mode in `render()` — no retained scene graph. Always call `render()` after state changes.
- **Node and edge IDs** use sequential integers (`state.nextId`). Never reuse IDs.
- **Multi-select:** `state.multiSelected` (Set) tracks selected nodes. Shift/Ctrl+Click toggles membership; drag on empty canvas activates rubber band (`state.rubberBand` rect) and `commitRubberBand()` selects nodes by bounds. Multi-drag preserves relative positions.
- **Graph layout:** `beautifyTree()` in `graph.js` does BFS-based positioning with subtree-width balancing. Calls `saveHistory()` first.
- **Custom formulas:** Saved/deleted by user; merged into the examples dropdown with a `⭐ ` prefix. Use `updateDropdownWithCustomFormulas()` to refresh.
- **Display options:** `state.display` controls per-node canvas labels. `updateDisplayOptions()` rebuilds the `#displayOptionsContainer` whenever DP groups change.
- UI toggles (`isTree`, `isDirected`, `showEdgeW`) are reflected via `.active` class on their DOM elements.
- Example `.txt` files in [examples/](../examples/) must remain plain UTF-8 text.

## DSL / DP Engine

The DSL is parsed by `dp-parser.js` and evaluated by `dp-engine.js`:

- **Simple assignment:** `dp = val + sum(children, dp)`
- **Multi-state:** multiple lines, each a named variable, evaluated bottom-up
- **Bundle:** `{ var1 = expr1; var2 = expr2; }` groups interdependent assignments; results are stored with a `__bundle_N__` prefix in `state.dpGroups`
- **`par(varName)`** triggers a top-down rerooting pass
- **30+ built-in functions:**
  - Aggregation: `sum`, `prod`, `min`, `max`, `avg`, `count`
  - Math: `abs`, `floor`, `ceil`, `sqrt`, `pow`, `mod`, `gcd`, `lcm`, `clamp`
  - Access: `par`, `len`, `allNodes`, `findNodes`
  - Array: `range`, `map`, `filter`, `sort`, `reverse`, `concat`, `unique`, `flatten`, `prefix`, `suffix`, `slice`, `indexOf`

Adding a new built-in example: add an entry to `EXAMPLES` in `dp-examples.js` and a matching `<option>` in `#dpExamples` in `index.html`.

## Build and Test

No build step. Open `index.html` directly in a browser, or serve locally:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

No automated test suite. Manual verification: load an example from the dropdown, run with **Ctrl+Enter**, and confirm node values match the expected output documented in the example's comments.
