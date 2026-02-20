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

// =============================================
// DOCS
// =============================================
function buildDocs() {
  const dc = s => `<code class="doc-code">${s}</code>`;
  const sections = [
    { title: 'Variables', items: [
      [dc('val'), 'Node weight.'],
      [dc('children'), 'Array of child node IDs.'],
      [dc('edgeWeight'), 'Edge weight from parent to this node.'],
      [dc('id'), 'Node ID.'],
      [dc('childCount'), 'Number of children.'],
      [dc('isLeaf'), '1 if leaf node, 0 otherwise.'],
      [dc('depth'), 'Depth from root (root = 0).'],
      [dc('subtreeSize'), 'Number of nodes in subtree (including self).'],
      [dc('n'), 'Total number of nodes in the tree.'],
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
      [dc('findNodes(condition)'), 'Returns array of node IDs where condition is true. Example: findNodes(val > 5)'],
    ]},
    { title: 'Array Builders', items: [
      [dc('range(n)'), 'Array [0, 1, ..., n-1].'],
      [dc('map(arr, expr)'), 'Map expression over array (element becomes eval context).'],
      [dc('filter(arr, expr)'), 'Keep elements where expr ≠ 0.'],
      [dc('sort(arr, expr?)'), 'Sort array. If expr provided, sorts by mapped value.'],
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

// =============================================
// PARSER
// =============================================
const Parser = {
  tokenize(code) {
    const tokens = [];
    const regex = /\s*(!=|<=|>=|==|&&|\|\||\.\.|=>|[+\-*\/\^%?:(),.[\]{}<>!]|\d+\.?\d*|"[^"]*"|[a-zA-Z_][a-zA-Z0-9_]*)\s*/g;
    let match;
    while ((match = regex.exec(code)) !== null) if (match[1]) tokens.push(match[1]);
    return tokens;
  },
  parse(code) {
    const tokens = this.tokenize(code);
    let pos = 0;
    const peek = () => tokens[pos];
    const consume = (expected) => {
      const t = tokens[pos++];
      if (expected && t !== expected) throw new Error(`Expected '${expected}' but got '${t || 'EOF'}'`);
      return t;
    };

    const expr = () => {
      let node = or();
      if (peek() === '?') {
        consume();
        const t = expr();
        consume(':');
        const f = expr();
        node = { type: 'ternary', cond: node, t, f };
      }
      return node;
    };
    const or = () => { let l = and(); while (peek() === '||') { consume(); l = { type: 'binop', op: '||', l, r: and() }; } return l; };
    const and = () => { let l = eq(); while (peek() === '&&') { consume(); l = { type: 'binop', op: '&&', l, r: eq() }; } return l; };
    const eq = () => { let l = cmp(); while (peek() === '==' || peek() === '!=') { const op = consume(); l = { type: 'binop', op, l, r: cmp() }; } return l; };
    const cmp = () => { let l = add(); while (['<', '>', '<=', '>='].includes(peek())) { const op = consume(); l = { type: 'binop', op, l, r: add() }; } return l; };
    const add = () => { let l = mul(); while (peek() === '+' || peek() === '-') { const op = consume(); l = { type: 'binop', op, l, r: mul() }; } return l; };
    const mul = () => { let l = modop(); while (peek() === '*' || peek() === '/') { const op = consume(); l = { type: 'binop', op, l, r: modop() }; } return l; };
    const modop = () => { let l = powop(); while (peek() === '%') { consume(); l = { type: 'binop', op: '%', l, r: powop() }; } return l; };
    const powop = () => { let l = unary(); if (peek() === '^') { consume(); return { type: 'binop', op: '^', l, r: powop() }; } return l; };

    const unary = () => {
      if (peek() === '-') { consume(); return { type: 'unary', op: '-', arg: unary() }; }
      if (peek() === '!') { consume(); return { type: 'unary', op: '!', arg: unary() }; }
      return postfix();
    };

    const postfix = () => {
      let node = atom();
      while (peek() === '[') {
        consume();
        const index = expr();
        consume(']');
        node = { type: 'index', target: node, index };
      }
      return node;
    };

    const atom = () => {
      const t = peek();
      if (t === '(') { consume(); const n = expr(); consume(')'); return n; }
      if (t === '{') {
        consume();
        const items = [];
        if (peek() !== '}') { items.push(expr()); while (peek() === ',') { consume(); items.push(expr()); } }
        consume('}');
        return { type: 'array', items };
      }
      if (t && t.startsWith('"')) { consume(); return { type: 'str', val: t.slice(1, -1) }; }
      if (t && /^\d/.test(t)) { consume(); return { type: 'num', val: parseFloat(t) }; }
      if (t && /^[a-zA-Z_]/.test(t)) {
        consume();
        if (peek() === '(') {
          consume();
          const args = [];
          if (peek() !== ')') { args.push(expr()); while (peek() === ',') { consume(); args.push(expr()); } }
          consume(')');
          return { type: 'call', name: t, args };
        }
        return { type: 'var', name: t };
      }
      if (pos < tokens.length) consume(); // skip unknown
      return { type: 'num', val: 0 };
    };

    const result = expr();
    return result;
  }
};

// =============================================
// QUICK PARSE DP DEFS
// =============================================
function quickParseDpDefs(code) {
  if (!code) return;
  try {
    const groups = {};
    const bundles = [];
    const lines = code.split('\n').map(l => l.replace(/#.*$/, '').trim());
    
    // Extract bundle blocks first
    let processedLines = [];
    let inBundle = false;
    let bundleLines = [];
    
    lines.forEach((line, idx) => {
      if (line === '{') {
        inBundle = true;
        bundleLines = [];
      } else if (line === '}') {
        if (inBundle && bundleLines.length > 0) {
          bundles.push(bundleLines);
          processedLines.push(`__BUNDLE_${bundles.length - 1}__`);
        }
        inBundle = false;
        bundleLines = [];
      } else if (inBundle) {
        if (line.includes('=')) bundleLines.push(line);
      } else if (line) {
        processedLines.push(line);
      }
    });

    // Parse regular groups
    processedLines.filter(l => l.includes('=') && !l.startsWith('__BUNDLE')).forEach(l => {
      const eqIdx = l.indexOf('=');
      // skip == and !=
      if (l[eqIdx + 1] === '=' || (eqIdx > 0 && l[eqIdx - 1] === '!')) return;
      const lhs = l.substring(0, eqIdx).trim();
      const rhs = l.substring(eqIdx + 1).trim();
      let dpName;
      if (lhs.includes(':')) dpName = lhs.substring(0, lhs.indexOf(':')).trim();
      else dpName = lhs;
      if (!groups[dpName]) groups[dpName] = { name: dpName, lines: [], locals: new Set(), isTopDown: false, isBundle: false };
      if (lhs.includes(':')) groups[dpName].locals.add(lhs.split(':')[1].trim());
      try { groups[dpName].lines.push({ target: lhs, ast: Parser.parse(rhs) }); } catch (e) { /* skip */ }
    });
    
    // Parse bundles
    bundles.forEach((bundleLines, idx) => {
      const bundleName = `__bundle_${idx}`;
      const bundleGroup = { name: bundleName, lines: [], locals: new Set(), isTopDown: false, isBundle: true };
      bundleLines.forEach(l => {
        const eqIdx = l.indexOf('=');
        if (l[eqIdx + 1] === '=' || (eqIdx > 0 && l[eqIdx - 1] === '!')) return;
        const lhs = l.substring(0, eqIdx).trim();
        const rhs = l.substring(eqIdx + 1).trim();
        if (lhs.includes(':')) bundleGroup.locals.add(lhs.split(':')[1].trim());
        try { bundleGroup.lines.push({ target: lhs, ast: Parser.parse(rhs) }); } catch (e) { /* skip */ }
      });
      groups[bundleName] = bundleGroup;
    });
    
    state.dpGroups = Object.values(groups);
    state.dpGroups.forEach(g => { if (state.display[g.name] === undefined) state.display[g.name] = false; });
  } catch (e) { /* skip */ }
}

// =============================================
// DP ENGINE
// =============================================
function runDP() {
  if (!state.isTree) { alert('DP requires Tree Mode.'); return; }
  const code = document.getElementById('dpCode').value.trim();
  const errorBox = document.getElementById('dpErrorBox');
  errorBox.classList.add('hidden');

  try {
    // Parse groups and bundles
    const groups = {};
    const bundleDefs = [];
    const lines = code.split('\n').map(l => l.replace(/#.*$/, '').trim());
    
    // Extract bundle blocks first
    let processedLines = [];
    let inBundle = false;
    let bundleLines = [];
    
    lines.forEach((line, idx) => {
      if (line === '{') {
        inBundle = true;
        bundleLines = [];
      } else if (line === '}') {
        if (inBundle && bundleLines.length > 0) {
          bundleDefs.push(bundleLines);
          processedLines.push(`__BUNDLE_${bundleDefs.length - 1}__`);
        }
        inBundle = false;
        bundleLines = [];
      } else if (inBundle) {
        if (line.includes('=')) bundleLines.push(line);
      } else if (line) {
        processedLines.push(line);
      }
    });

    // Parse regular groups
    processedLines.filter(l => l.includes('=') && !l.startsWith('__BUNDLE')).forEach(l => {
      const eqIdx = l.indexOf('=');
      if (l[eqIdx + 1] === '=' || (eqIdx > 0 && l[eqIdx - 1] === '!') || (eqIdx > 0 && l[eqIdx - 1] === '<') || (eqIdx > 0 && l[eqIdx - 1] === '>')) return;
      const lhs = l.substring(0, eqIdx).trim();
      const rhs = l.substring(eqIdx + 1).trim();
      let dpName, isLocal = false;
      if (lhs.includes(':')) { dpName = lhs.substring(0, lhs.indexOf(':')).trim(); isLocal = true; } else dpName = lhs;
      if (!groups[dpName]) groups[dpName] = { name: dpName, lines: [], locals: new Set(), isTopDown: false, isBundle: false };
      if (isLocal) groups[dpName].locals.add(lhs.split(':')[1].trim());
      try { groups[dpName].lines.push({ target: lhs, ast: Parser.parse(rhs) }); }
      catch (err) { throw new Error(`Parse error in "${l}": ${err.message}`); }
    });

    // Parse bundles
    bundleDefs.forEach((bundleLines, idx) => {
      const bundleName = `__bundle_${idx}`;
      const bundleGroup = { name: bundleName, lines: [], locals: new Set(), isTopDown: false, isBundle: true };
      bundleLines.forEach(l => {
        const eqIdx = l.indexOf('=');
        if (l[eqIdx + 1] === '=' || (eqIdx > 0 && l[eqIdx - 1] === '!') || (eqIdx > 0 && l[eqIdx - 1] === '<') || (eqIdx > 0 && l[eqIdx - 1] === '>')) return;
        const lhs = l.substring(0, eqIdx).trim();
        const rhs = l.substring(eqIdx + 1).trim();
        let dpName, isLocal = false;
        if (lhs.includes(':')) { dpName = lhs.substring(0, lhs.indexOf(':')).trim(); isLocal = true; } else dpName = lhs;
        if (isLocal) bundleGroup.locals.add(lhs.split(':')[1].trim());
        try { bundleGroup.lines.push({ target: lhs, ast: Parser.parse(rhs) }); }
        catch (err) { throw new Error(`Parse error in bundle line "${l}": ${err.message}`); }
      });
      groups[bundleName] = bundleGroup;
    });

    state.dpGroups = Object.values(groups);
    lastDpsLen = -1;
    updateDisplayOptions();

    // Build tree structures
    const childrenMap = {}, parentMap = {}, edgeWeightMap = {};
    state.nodes.forEach(n => { childrenMap[n.id] = []; parentMap[n.id] = null; edgeWeightMap[n.id] = 0; });
    state.edges.forEach(e => {
      childrenMap[e.source].push(e.target);
      parentMap[e.target] = e.source;
      edgeWeightMap[e.target] = e.weight;
    });

    // Compute depth and subtree size
    const roots = state.nodes.filter(n => !parentMap[n.id]).map(n => n.id);
    const depthMap = {}, sizeMap = {};
    state.nodes.forEach(n => { depthMap[n.id] = 0; sizeMap[n.id] = 1; });

    const computeDepth = (u, d) => { depthMap[u] = d; childrenMap[u].forEach(c => computeDepth(c, d + 1)); };
    roots.forEach(r => computeDepth(r, 0));

    const postOrderIds = [];
    const buildPostOrder = u => { childrenMap[u].forEach(c => buildPostOrder(c)); postOrderIds.push(u); };
    roots.forEach(r => buildPostOrder(r));
    postOrderIds.forEach(u => { sizeMap[u] = 1 + childrenMap[u].reduce((s, c) => s + sizeMap[c], 0); });

    const N = state.nodes.length;

    // Detect top-down
    const hasPar = (node) => {
      if (!node) return false;
      if (node.type === 'call' && node.name === 'par') return true;
      for (const k of ['cond', 't', 'f', 'arg', 'l', 'r', 'target', 'index']) if (node[k] && hasPar(node[k])) return true;
      if (node.args) return node.args.some(hasPar);
      if (node.items) return node.items.some(hasPar);
      return false;
    };
    state.dpGroups.forEach(g => { g.isTopDown = g.lines.some(line => hasPar(line.ast)); });

    // Results
    const results = {};
    state.nodes.forEach(n => results[n.id] = {});

    // Separate bundles and regular groups
    const bundles = state.dpGroups.filter(g => g.isBundle);
    const regularGroups = state.dpGroups.filter(g => !g.isBundle);

    // Execute DP groups
    const postOrder = (u, fn) => { childrenMap[u].forEach(c => postOrder(c, fn)); fn(u); };
    const preOrder = (u, fn) => { fn(u); childrenMap[u].forEach(c => preOrder(c, fn)); };

    // Execute regular groups first
    regularGroups.forEach(g => {
      const fn = u => { g.lines.forEach(line => { results[u][line.target] = evalAST(line.ast, u, g.name, u, g.locals); }); };
      if (g.isTopDown) roots.forEach(r => preOrder(r, fn));
      else roots.forEach(r => postOrder(r, fn));
    });

    // Execute bundles (process all lines in order for each node)
    bundles.forEach(bundle => {
      const fn = u => { 
        bundle.lines.forEach(line => { 
          results[u][line.target] = evalAST(line.ast, u, bundle.name, u, bundle.locals); 
        }); 
      };
      if (bundle.isTopDown) roots.forEach(r => preOrder(r, fn));
      else roots.forEach(r => postOrder(r, fn));
    });

    // GCD helper
    const gcd2 = (a, b) => { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { [a, b] = [b, a % b]; } return a; };

    // Resolve variable
    const resolve = (evalNodeId, varName, currentDp, contextNodeId, locals) => {
      const n = state.nodes.find(x => x.id === evalNodeId);
      const children = (n && childrenMap[evalNodeId]) || [];

      if (varName === 'val') return n ? n.weight : 0;
      if (varName === 'id') return evalNodeId;
      if (varName === 'childCount') return children.length;
      if (varName === 'isLeaf') return children.length === 0 ? 1 : 0;
      if (varName === 'children') return children;
      if (varName === 'edgeWeight') return edgeWeightMap[evalNodeId] || 0;
      if (varName === 'depth') return depthMap[evalNodeId] || 0;
      if (varName === 'subtreeSize') return sizeMap[evalNodeId] || 1;
      if (varName === 'n') return N;
      if (locals.has(varName)) return results[contextNodeId][`${currentDp}:${varName}`] || 0;
      return results[evalNodeId]?.[varName] ?? 0;
    };

    // Evaluate AST
    const evalAST = (ast, evalNodeId, currentDp, contextNodeId, locals) => {
      if (!ast) return 0;

      if (ast.type === 'num') return ast.val;
      if (ast.type === 'str') return ast.val;
      if (ast.type === 'var') return resolve(evalNodeId, ast.name, currentDp, contextNodeId, locals);

      if (ast.type === 'ternary') {
        return evalAST(ast.cond, evalNodeId, currentDp, contextNodeId, locals)
          ? evalAST(ast.t, evalNodeId, currentDp, contextNodeId, locals)
          : evalAST(ast.f, evalNodeId, currentDp, contextNodeId, locals);
      }

      if (ast.type === 'unary') {
        const v = evalAST(ast.arg, evalNodeId, currentDp, contextNodeId, locals);
        if (ast.op === '-') return -(Array.isArray(v) ? 0 : v);
        if (ast.op === '!') return (Array.isArray(v) ? 0 : v) ? 0 : 1;
        return 0;
      }

      if (ast.type === 'binop') {
        const l = evalAST(ast.l, evalNodeId, currentDp, contextNodeId, locals);
        const r = evalAST(ast.r, evalNodeId, currentDp, contextNodeId, locals);
        const ln = Array.isArray(l) ? 0 : l;
        const rn = Array.isArray(r) ? 0 : r;
        switch (ast.op) {
          case '+': return ln + rn; case '-': return ln - rn; case '*': return ln * rn;
          case '/': return rn ? ln / rn : 0; case '%': return rn ? ln % rn : 0;
          case '^': return Math.pow(ln, rn);
          case '<': return ln < rn ? 1 : 0; case '>': return ln > rn ? 1 : 0;
          case '<=': return ln <= rn ? 1 : 0; case '>=': return ln >= rn ? 1 : 0;
          case '==': return ln === rn ? 1 : 0; case '!=': return ln !== rn ? 1 : 0;
          case '&&': return (ln && rn) ? 1 : 0; case '||': return (ln || rn) ? 1 : 0;
        }
      }

      if (ast.type === 'array') {
        return ast.items.map(item => evalAST(item, evalNodeId, currentDp, contextNodeId, locals));
      }

      if (ast.type === 'index') {
        const target = evalAST(ast.target, evalNodeId, currentDp, contextNodeId, locals);
        const idx = Math.floor(evalAST(ast.index, evalNodeId, currentDp, contextNodeId, locals));
        if (Array.isArray(target) && idx >= 0 && idx < target.length) return target[idx];
        return 0;
      }

      if (ast.type === 'call') {
        const ev = (a, nid) => evalAST(a, nid !== undefined ? nid : evalNodeId, currentDp, contextNodeId, locals);
        const evSelf = a => ev(a);
        const name = ast.name;
        const args = ast.args;

        // ---- Access ----
        if (name === 'par') {
          const pId = parentMap[evalNodeId]; if (!pId) return 0;
          if (args[0] && args[0].type === 'var') {
            const vn = args[0].name;
            if (vn === 'val') { const pn = state.nodes.find(x => x.id === pId); return pn ? pn.weight : 0; }
            if (vn === 'children') return childrenMap[pId] || [];
            return results[pId]?.[vn] ?? resolve(pId, vn, currentDp, pId, locals);
          }
          return evalAST(args[0], pId, currentDp, contextNodeId, locals);
        }

        if (name === 'len') {
          const a = evSelf(args[0]);
          return Array.isArray(a) ? a.length : 0;
        }

        // ---- Math ----
        if (name === 'abs') return Math.abs(evSelf(args[0]));
        if (name === 'floor') return Math.floor(evSelf(args[0]));
        if (name === 'ceil') return Math.ceil(evSelf(args[0]));
        if (name === 'sqrt') return Math.sqrt(evSelf(args[0]));
        if (name === 'log') return Math.log(evSelf(args[0]));
        if (name === 'log2') return Math.log2(evSelf(args[0]));
        if (name === 'pow') return Math.pow(evSelf(args[0]), evSelf(args[1]));
        if (name === 'mod') { const b = evSelf(args[1]); return b ? evSelf(args[0]) % b : 0; }
        if (name === 'gcd') return gcd2(evSelf(args[0]), evSelf(args[1]));
        if (name === 'lcm') { const a = Math.abs(Math.round(evSelf(args[0]))), b = Math.abs(Math.round(evSelf(args[1]))); return (a && b) ? (a / gcd2(a, b)) * b : 0; }
        if (name === 'sign') { const v = evSelf(args[0]); return v > 0 ? 1 : v < 0 ? -1 : 0; }
        if (name === 'clamp') { const x = evSelf(args[0]), lo = evSelf(args[1]), hi = evSelf(args[2]); return Math.max(lo, Math.min(hi, x)); }

        // ---- Aggregation ----
        if (['sum', 'prod', 'max', 'min', 'count', 'avg'].includes(name)) {
          if (args.length === 0) throw new Error(`${name}() requires at least 1 argument`);
          const arr = evSelf(args[0]);
          if (!Array.isArray(arr)) return 0;

          if (args.length === 1) {
            // Raw values
            if (arr.length === 0) {
              if (name === 'max') return -Infinity;
              if (name === 'min') return Infinity;
              if (name === 'prod') return 1;
              return 0;
            }
            const nums = arr.map(v => typeof v === 'number' ? v : 0);
            if (name === 'sum') return nums.reduce((a, b) => a + b, 0);
            if (name === 'prod') return nums.reduce((a, b) => a * b, 1);
            if (name === 'max') return Math.max(...nums);
            if (name === 'min') return Math.min(...nums);
            if (name === 'count') return nums.length;
            if (name === 'avg') return nums.reduce((a, b) => a + b, 0) / nums.length;
          }

          const exprAst = args[1];
          const defVal = args.length > 2 ? evSelf(args[2]) : (name === 'max' ? -Infinity : name === 'min' ? Infinity : name === 'prod' ? 1 : 0);

          if (name === 'count') {
            // count with expr: count where expr != 0
            let c = 0;
            for (const item of arr) { if (ev(exprAst, item)) c++; }
            return c;
          }

          const vals = arr.map(item => ev(exprAst, item));
          if (vals.length === 0) return defVal;

          if (name === 'sum') return vals.reduce((a, b) => a + b, 0);
          if (name === 'prod') return vals.reduce((a, b) => a * b, 1);
          if (name === 'max') return Math.max(defVal, ...vals);
          if (name === 'min') return Math.min(defVal, ...vals);
          if (name === 'avg') return vals.reduce((a, b) => a + b, 0) / vals.length;
        }

        // ---- Array builders ----
        if (name === 'range') {
          const n = Math.max(0, Math.floor(evSelf(args[0])));
          return Array.from({ length: Math.min(n, 10000) }, (_, i) => i);
        }

        if (name === 'map') {
          const arr = evSelf(args[0]);
          if (!Array.isArray(arr)) return [];
          return arr.map(item => ev(args[1], item));
        }

        if (name === 'filter') {
          const arr = evSelf(args[0]);
          if (!Array.isArray(arr)) return [];
          return arr.filter(item => ev(args[1], item));
        }

        if (name === 'sort') {
          const arr = evSelf(args[0]);
          if (!Array.isArray(arr)) return [];
          if (args.length < 2) {
            // sort raw values
            return [...arr].sort((a, b) => {
              const an = typeof a === 'number' ? a : 0;
              const bn = typeof b === 'number' ? b : 0;
              return an - bn;
            });
          }
          const exprAst = args[1];
          const vals = arr.map(item => ev(exprAst, item));
          return vals.sort((a, b) => a - b);
        }

        if (name === 'reverse') {
          const arr = evSelf(args[0]);
          return Array.isArray(arr) ? [...arr].reverse() : [];
        }

        if (name === 'concat') {
          const a = evSelf(args[0]), b = evSelf(args[1]);
          return [...(Array.isArray(a) ? a : [a]), ...(Array.isArray(b) ? b : [b])];
        }

        if (name === 'unique') {
          const arr = evSelf(args[0]);
          return Array.isArray(arr) ? [...new Set(arr)] : [];
        }

        if (name === 'flatten') {
          const arr = evSelf(args[0]);
          if (!Array.isArray(arr)) return [];
          const result = [];
          for (const item of arr) {
            if (Array.isArray(item)) result.push(...item);
            else result.push(item);
          }
          return result;
        }

        if (name === 'prefix' || name === 'suffix') {
          const arr = evSelf(args[0]);
          if (!Array.isArray(arr) || arr.length === 0) return [];
          const op = args.length > 1 ? evSelf(args[1]) : 'sum';
          const nums = arr.map(v => typeof v === 'number' ? v : 0);
          const result = new Array(nums.length);
          const apply = (a, b) => {
            if (op === 'sum') return a + b;
            if (op === 'max') return Math.max(a, b);
            if (op === 'min') return Math.min(a, b);
            if (op === 'prod') return a * b;
            return a + b;
          };
          if (name === 'prefix') {
            result[0] = nums[0];
            for (let i = 1; i < nums.length; i++) result[i] = apply(result[i - 1], nums[i]);
          } else {
            result[nums.length - 1] = nums[nums.length - 1];
            for (let i = nums.length - 2; i >= 0; i--) result[i] = apply(nums[i], result[i + 1]);
          }
          return result;
        }

        if (name === 'slice') {
          const arr = evSelf(args[0]);
          if (!Array.isArray(arr)) return [];
          const start = Math.floor(evSelf(args[1]));
          const end = args.length > 2 ? Math.floor(evSelf(args[2])) : arr.length;
          return arr.slice(start, end);
        }

        if (name === 'indexOf') {
          const arr = evSelf(args[0]);
          if (!Array.isArray(arr)) return -1;
          const val = evSelf(args[1]);
          return arr.indexOf(val);
        }

        if (name === 'child') {
          const idx = evSelf(args[0]);
          const children = childrenMap[evalNodeId] || [];
          if (idx >= 0 && idx < children.length) return ev(args[1], children[idx]);
          return 0;
        }

        // ---- Node Filtering ----
        if (name === 'allNodes') {
          return state.nodes.map(n => n.id);
        }

        if (name === 'findNodes') {
          if (args.length === 0) throw new Error('findNodes() requires a condition expression as an argument');
          const result = [];
          for (const node of state.nodes) {
            if (ev(args[0], node.id)) result.push(node.id);
          }
          return result;
        }

        throw new Error(`Unknown function: ${name}`);
      }

      return 0;
    };

    state.dpResults = results;
    fullUpdate();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('hidden');
  }
}
