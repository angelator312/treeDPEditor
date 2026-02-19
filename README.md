# 🌳 Tree DP & Graph Editor

An interactive **Graph Editor & Tree DP Visualizer** for competitive programming — build trees visually, write DP formulas in a mini DSL, run them, and see results on every node.

**🔗 Live:** [https://angelator312.github.io/tree-dp-and-graph-editor/](https://angelator312.github.io/treeDPEditor/)

## ✨ Features

- **Visual Graph Editor** — Add, connect, edit, drag nodes on a canvas
- **Tree DP Engine** — Write formulas, run with Ctrl+Enter, see results instantly
- **30+ DSL Functions** — sum, prod, min, max, abs, gcd, lcm, filter, map, prefix, suffix, and more
- **Pre-built Examples** — 9 classic tree DP problems ready to load (Subtree Size, Max Independent Set, Min Vertex Cover, Tree Diameter, Sum of Distances, Tree Matching, Tree Coloring, Longest Path)
- **All Tree DP Types** — Subtree (bottom-up), Rerooting (top-down via `par()`), multi-state, edge-weighted
- **CP Format Export** — Copy tree data in competitive programming format
- **Undo/Redo, Import/Export, localStorage persistence**

## 🚀 Quick Start

1. Open the [live site](https://angelator312.github.io/treeDPEditor/)
2. Click **Add (A)** mode and click on the canvas to add nodes
3. Switch to **Connect (C)** mode and click two nodes to create an edge
4. Pick an example from the **Examples** dropdown, or write your own formula
5. Click **Run (Ctrl+Enter)** to compute DP values
6. Check the **Data** tab for a table of all node values

## 📐 DSL Reference

### Variables
| Variable | Description |
|----------|-------------|
| `val` | Node weight |
| `children` | Array of child IDs |
| `edgeWeight` | Edge weight to this node |
| `id` | Node ID |
| `childCount` | Number of children |
| `isLeaf` | 1 if leaf, 0 otherwise |
| `depth` | Depth from root (root = 0) |
| `subtreeSize` | Subtree size including self |
| `n` | Total number of nodes |

### Functions
**Aggregation:** `sum`, `prod`, `max`, `min`, `count`, `avg`
**Math:** `abs`, `floor`, `ceil`, `sqrt`, `log`, `log2`, `pow`, `mod`, `gcd`, `lcm`, `sign`, `clamp`
**Access:** `par(var)`, `len(arr)`
**Arrays:** `range`, `map`, `filter`, `sort`, `reverse`, `concat`, `unique`, `flatten`, `prefix`, `suffix`, `slice`, `indexOf`

### Operators
`+` `-` `*` `/` `%` `^` `==` `!=` `<` `>` `<=` `>=` `&&` `||` `!` `? :`

## 📝 Example Formulas

```
# Subtree Size
sz = sum(children, sz) + 1

# Max Independent Set
dp0 = sum(children, max({dp0, dp1}))
dp1 = sum(children, dp0) + val

# Sum of Distances (Rerooting)
sz = sum(children, sz) + 1
down = sum(children, down + sz)
ans = par(ans) - sz + (n - sz) + down
```

## 🛠️ Setup for GitHub Pages

1. Fork or clone this repo
2. Go to **Settings → Pages → Source: main branch, / (root)**
3. Your site is live!
