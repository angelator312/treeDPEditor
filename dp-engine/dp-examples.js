// =============================================
// EXAMPLES
// =============================================
const EXAMPLES = {
  subtree_size: `# Subtree Size\nsz = sum(children, sz) + 1`,
  subtree_sum: `# Subtree Sum\ndp = val + sum(children, dp)`,
  max_independent: `# Max Independent Set\n# dp0 = not taking this node\n# dp1 = taking this node\ndp0 = sum(children, max({dp0, dp1}))\ndp1 = sum(children, dp0) + val`,
  min_vertex_cover: `# Min Vertex Cover\n# dp0 = node NOT in cover (children must be)\n# dp1 = node IN cover\ndp0 = sum(children, dp1)\ndp1 = sum(children, min({dp0, dp1})) + 1`,
  tree_diameter: `# Tree Diameter\n# down = longest downward path from this node\n# diam = diameter passing through this node\ndown = max(children, down + 1, 0)\ndiam = max(sort(children, down + 1), 0) + (len(children) >= 2 ? sort(children, down + 1)[len(children) - 2] : 0)`,
  sum_of_distances: `# Sum of Distances (Rerooting DP)\n# sz = subtree size, down = sum of distances downward\n# ans = total sum of distances when rerooted here\nsz = sum(children, sz) + 1\ndown = sum(children, down + sz)\nans = par(ans) - sz + (n - sz) + down`,
  tree_matching: `# Tree Matching\n# dp0 = max matching if this node NOT matched\n# dp1 = max matching if this node IS matched to a child\ndp0 = sum(children, max({dp0, dp1}))\ndp1 = max(children, sum(children, max({dp0, dp1})) - max({dp0, dp1}) + dp0 + 1, 0)`,
  tree_coloring: `# Tree Coloring (k=3 colors)\n# dp = number of valid colorings of subtree\n# Each child must differ from parent: (k-1) choices per child\ndp = isLeaf ? 1 : prod(children, 2 * dp)`,
  longest_edge_path: `# Longest Path (Edge Weighted)\n# Enable "Edge W" toggle and set edge weights\ndown = max(children, down + edgeWeight, 0)`,
  bundle_example: `# Bundle Example (Interdependent DP)\n# All lines in {} execute in order for each node\n{\ndp2 = isLeaf ? 0 : sum(children, dp1)\ndp1 = isLeaf ? 0 : dp2 + max(children, 1 - dp1 + dp2)\n}`
};
