// =============================================
// DOCS
// =============================================
function buildDocs() {
  const dc = s => `<code class="doc-code">${s}</code>`;
  const sections = [
    { title: 'Variables', items: [
      [dc('val'), 'First (or only) node weight.'],
      [dc('val1'), 'Second node weight (when multiple weights are set).'],
      [dc('val2'), 'Third node weight (when multiple weights are set).'],
      [dc('children'), 'Array of child node IDs.'],
      [dc('edgeWeight'), 'Edge weight from parent to this node.'],
      [dc('id'), 'Node ID.'],
      [dc('childCount'), 'Number of children.'],
      [dc('isLeaf'), '1 if leaf node, 0 otherwise.'],
      [dc('isRoot'), '1 if root node (no parent), 0 otherwise.'],
      [dc('depth'), 'Depth from root (root = 0).'],
      [dc('subtreeSize'), 'Number of nodes in subtree (including self).'],
      [dc('n'), 'Total number of nodes in the tree.'],
      [dc('param'), 'Global numeric parameter set via the "param =" input above the code editor. Also updated automatically during bsearch().'],
      [dc('ONLY_BIG_DIGITS'), 'Example of a reserved uppercase variable. Any name consisting entirely of capital letters (and underscores) is treated as a global constant.'],
    ]},
    { title: 'Aggregation', items: [
      [dc('sum(arr, expr?)'), 'Sum values. Maps expr over each element if provided.'],
      [dc('prod(arr, expr?)'), 'Product of values.'],
      [dc('max(arr, expr?, def?)'), 'Maximum value. Returns def if empty (default: -Infinity).'],
      [dc('min(arr, expr?, def?)'), 'Minimum value. Returns def if empty (default: Infinity).'],
      [dc('count(arr, expr?)'), 'Count elements (or count where expr ≠ 0).'],
      [dc('avg(arr, expr?, def?)'), 'Average. Returns def if empty (default: 0).'],
    ]},
    { title: 'Math', items: [
      [dc('abs(x)'), 'Absolute value.'],
      [dc('floor(x)'), 'Floor.'],
      [dc('ceil(x)'), 'Ceiling.'],
      [dc('sqrt(x)'), 'Square root.'],
      [dc('log(x)'), 'Natural logarithm.'],
      [dc('log2(x)'), 'Base-2 logarithm.'],
      [dc('pow(base, exp)'), 'Power.'],
      [dc('mod(a, b)'), 'Modulo (returns 0 if b=0).'],
      [dc('gcd(a, b)'), 'Greatest common divisor.'],
      [dc('lcm(a, b)'), 'Least common multiple.'],
      [dc('sign(x)'), 'Sign: -1, 0, or 1.'],
      [dc('clamp(x, lo, hi)'), 'Clamp x to [lo, hi].'],
    ]},
    { title: 'Access', items: [
      [dc('par(var)'), 'Access a variable on the parent node. Triggers top-down evaluation.'],
      [dc('len(arr)'), 'Array length.'],
      [dc('allNodes()'), 'Returns array of all node IDs in the tree.'],
      [dc('findNodes(condition)'), 'Returns array of node IDs where condition is true. Example: findNodes(val > 5).  To access a node`s weight from the result you can combine with <code>map</code>, e.g. <code>map(findNodes(isRoot), val)[0]</code> obtains the root weight.'],
    ]},
    { title: 'Binary Search', items: [
      [dc('ans = bsearch(lo, hi, condition)'), 'Binary searches for the largest integer in [lo, hi] for which <em>condition</em> (evaluated at the root) is truthy. During each iteration, <code class="doc-code">param</code> is set to the current candidate. All other DP groups are re-run each iteration. The <code>bsearch</code> call may appear inside a larger expression (e.g. <code>ANS = bsearch(...) + map(...)</code>). After converging, the result is stored in <code class="doc-code">ans</code> at every node and <code class="doc-code">param</code> is left at the optimal value. Uppercase identifiers are treated as global constants and can be used in the search condition.'],
      ['Example:', '<code class="doc-code">pass = isRoot ? param : par(pass) + max({par(pass) - val, 0})</code><br><code class="doc-code">ok = isLeaf ? (val &gt;= pass ? 1 : 0) : min(children, ok)</code><br><code class="doc-code">ANS = bsearch(0, 1000000000, ok) + map(findNodes(isRoot),val) + ONLY_BIG_DIGITS</code><br><em>Note:</em> <code>max</code> requires an array; use <code>max({a, b})</code> for numeric max.'],
    ]},
    { title: 'Array Builders', items: [
      [dc('range(n)'), 'Array [0, 1, ..., n-1].'],
      [dc('map(arr, expr)'), 'Map expression over array (element becomes eval context).'],
      [dc('filter(arr, expr)'), 'Keep elements where expr ≠ 0.'],
      [dc('sort(arr, expr?, "asc"|"desc"?)'), 'Sort array ascending (default). Pass "desc" as last arg for descending. If expr provided, sorts by mapped value.'],
      [dc('reverse(arr)'), 'Reverse array.'],
      [dc('concat(a, b)'), 'Concatenate two arrays.'],
      [dc('unique(arr)'), 'Remove duplicate values.'],
      [dc('flatten(arr)'), 'Flatten nested arrays one level.'],
      [dc('prefix(arr, "op")'), 'Prefix accumulation. op: "sum", "max", "min", "prod".'],
      [dc('suffix(arr, "op")'), 'Suffix accumulation.'],
      [dc('slice(arr, start, end?)'), 'Array slice.'],
      [dc('indexOf(arr, val)'), 'Index of value (-1 if not found).'],
    ]},
    { title: 'Arrays', items: [
      [dc('{a, b, c}'), 'Array literal.'],
      [dc('arr[i]'), 'Array indexing (safe: returns 0 if out of bounds).'],
    ]},
    { title: 'Bundles', items: [
      [dc('{ ... }'), 'Group of DP assignments. All lines execute in order on each node, allowing interdependencies.'],
      ['Example:', 'All inner DPs ({dp1, dp2, ...}) can depend on each other within the same node.'],
    ]},
    { title: 'Operators', items: [
      [dc('+ - * / % ^'), 'Arithmetic (% = modulo, ^ = power).'],
      [dc('== != &lt; &gt; &lt;= &gt;='), 'Comparison (returns 0 or 1).'],
      [dc('&amp;&amp; || !'), 'Logical AND, OR, NOT.'],
      [dc('cond ? then : else'), 'Ternary conditional.'],
    ]},
  ];
  return sections.map(s => `<div class="doc-section"><span class="doc-section-title">${s.title}</span><ul class="doc-list">${s.items.map(([c, d]) => `<li>${c} ${d}</li>`).join('')}</ul></div>`).join('');
}
