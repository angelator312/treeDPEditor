// AUTO-GENERATED — do not edit by hand.
// Edit .txt files in examples/ and run: python3 scripts/generate_examples.py

// =============================================
// EXAMPLES
// =============================================
const EXAMPLES = {
  binary_search_on_tree: `# Binary Search on Tree (CF 1997/D style)
# Find the maximum demand k the tree can absorb starting from the root.
# Each node absorbs up to val of the demand; surplus is passed to all children.
# pass = demand received; ok = 1 if subtree handles demand, 0 otherwise
# Set root val = 0 (root weight is handled separately in the final answer).
# Note: ${"`max()`"} is an aggregator and expects an array.  Use array
# literal syntax for a numeric max.
pass = isRoot ? param : par(pass) + max({par(pass) - val, 0})
ok = isLeaf ? (val >= pass ? 1 : 0) : min(children, ok)
ans = bsearch(0, 1000000000, ok)`,
  bundle_example: `# Bundle Example (Interdependent DP)
# All lines in {} execute in order for each node
{
dp2 = isLeaf ? 0 : sum(children, dp1)
dp1 = isLeaf ? 0 : dp2 + max(children, 1 - dp1 + dp2)
}`,
  longest_edge_path: `# Longest Path (Edge Weighted)
# Enable "Edge W" toggle and set edge weights
down = max(children, down + edgeWeight, 0)`,
  max_independent_set: `# Max Independent Set
# dp0 = not taking this node
# dp1 = taking this node
dp0 = sum(children, max({dp0, dp1}))
dp1 = sum(children, dp0) + val`,
  min_vertex_cover: `# Min Vertex Cover
# dp0 = node NOT in cover (children must be)
# dp1 = node IN cover
dp0 = sum(children, dp1)
dp1 = sum(children, min({dp0, dp1})) + 1`,
  subtree_size: `# Subtree Size
sz = sum(children, sz) + 1`,
  subtree_sum: `# Subtree Sum
dp = val + sum(children, dp)`,
  sum_of_distances: `# Sum of Distances (Rerooting DP)
# sz = subtree size, down = sum of distances downward
# ans = total sum of distances when rerooted here
sz = sum(children, sz) + 1
down = sum(children, down + sz)
ans = par(ans) - sz + (n - sz) + down`,
  tree_coloring: `# Tree Coloring (k=3 colors)
# dp = number of valid colorings of subtree
# Each child must differ from parent: (k-1) choices per child
dp = isLeaf ? 1 : prod(children, 2 * dp)`,
  tree_diameter: `# Tree Diameter
# down = longest downward path from this node
# diam = diameter passing through this node
down = max(children, down + 1, 0)
diam = max(sort(children, down + 1), 0) + (len(children) >= 2 ? sort(children, down + 1)[len(children) - 2] : 0)`,
  tree_matching: `# Tree Matching
# dp0 = max matching if this node NOT matched
# dp1 = max matching if this node IS matched to a child
dp0 = sum(children, max({dp0, dp1}))
dp1 = max(children, sum(children, max({dp0, dp1})) - max({dp0, dp1}) + dp0 + 1, 0)`
};
