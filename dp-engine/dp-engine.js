// =============================================
// QUICK PARSE DP DEFS
// =============================================
const hasBsearch = (node) => {
  if (!node) return false;
  if (node.type === 'call' && node.name === 'bsearch') return true;
  for (const k of ['cond', 't', 'f', 'arg', 'l', 'r', 'target', 'index']) if (node[k] && hasBsearch(node[k])) return true;
  if (node.args) return node.args.some(hasBsearch);
  if (node.items) return node.items.some(hasBsearch);
  return false;
};
    // Detect top-down and bsearch
    const hasPar = (node) => {
      if (!node) return false;
      if (node.type === 'call' && node.name === 'par') return true;
      for (const k of ['cond', 't', 'f', 'arg', 'l', 'r', 'target', 'index']) if (node[k] && hasPar(node[k])) return true;
      if (node.args) return node.args.some(hasPar);
      if (node.items) return node.items.some(hasPar);
      return false;
    };

    // Helpers for bsearch flexibility
   

    // return first bsearch call AST within `node`
    const findBsearch = (node) => {
      if (!node) return null;
      if (node.type === 'call' && node.name === 'bsearch') return node;
      for (const k of ['cond', 't', 'f', 'arg', 'l', 'r', 'target', 'index']) {
        if (node[k]) {
          const found = findBsearch(node[k]);
          if (found) return found;
        }
      }
      if (node.args) {
        for (const a of node.args) {
          const found = findBsearch(a);
          if (found) return found;
        }
      }
      if (node.items) {
        for (const it of node.items) {
          const found = findBsearch(it);
          if (found) return found;
        }
      }
      return null;
    };

    // count number of bsearch calls in AST
    const countBsearch = (node) => {
      if (!node) return 0;
      let cnt = 0;
      if (node.type === 'call' && node.name === 'bsearch') cnt++;
      for (const k of ['cond', 't', 'f', 'arg', 'l', 'r', 'target', 'index']) if (node[k]) cnt += countBsearch(node[k]);
      if (node.args) node.args.forEach(a => cnt += countBsearch(a));
      if (node.items) node.items.forEach(i => cnt += countBsearch(i));
      return cnt;
    };
function quickParseDpDefs(code) {
  if (!code) return;
  // clear any previously parsed uppercase globals
  state.specialVars = {};
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

    console.log('processedLines for parsing', processedLines);
    // Parse regular groups
    processedLines.filter(l => l.includes('=') && !l.startsWith('__BUNDLE')).forEach(l => {
      console.log('  quickParseDpDefs processing line:', l);
      const eqIdx = l.indexOf('=');
      // skip ==, !=, <=, >= comparisons
      if (l[eqIdx + 1] === '=' || (eqIdx > 0 && ['!','<','>'].includes(l[eqIdx - 1]))) {
        console.log('    skipped line as comparison');
        return;
      }
      const lhs = l.substring(0, eqIdx).trim();
      const rhs = l.substring(eqIdx + 1).trim();
      let dpName;
      if (lhs.includes(':')) dpName = lhs.substring(0, lhs.indexOf(':')).trim();
      else dpName = lhs;
      if (!groups[dpName]) groups[dpName] = { name: dpName, lines: [], locals: new Set(), isTopDown: false, isBundle: false };
      if (lhs.includes(':')) groups[dpName].locals.add(lhs.split(':')[1].trim());
      try {
        groups[dpName].lines.push({ target: lhs, ast: Parser.parse(rhs) });
      } catch (e) {
        console.error('parse error for dp line', l, e);
      }
    });

    state.dpGroups = Object.values(groups);
    state.dpGroups.forEach(g => {
      g.isBsearch = g.lines.some(l => hasBsearch(l.ast));
      if (state.display[g.name] === undefined) state.display[g.name] = false;
    });
  } catch (e) { /* skip */ }
}

// =============================================
// DP ENGINE
// =============================================
function runDP() {
  if (!state.isTree) { alert('DP requires Tree Mode.'); return; }
  const code = document.getElementById('dpCode').value.trim();
  console.log('runDP formula:', code.replace(/\n/g,' | '));
  const errorBox = document.getElementById('dpErrorBox');
  errorBox.classList.add('hidden');
  // reset special variables map
  state.specialVars = {};

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

    // Parse regular groups and uppercase global definitions
    processedLines.filter(l => l.includes('=') && !l.startsWith('__BUNDLE')).forEach(l => {
      console.log('  runDP parsing line:', l);
      const eqIdx = l.indexOf('=');
      if (l[eqIdx + 1] === '=' || (eqIdx > 0 && ['!','<','>'].includes(l[eqIdx - 1]))) {
        console.log('    skipped line as comparison');
        return;
      }
      const lhs = l.substring(0, eqIdx).trim();
      const rhs = l.substring(eqIdx + 1).trim();
      // global constant if all caps. However, if the RHS contains a bsearch
      // call we must keep it as a DP group so the engine can run the
      // bsearch logic. Parse the RHS first and promote to a group when
      // necessary.
      if (/^[A-Z][A-Z0-9_]*$/.test(lhs)) {
        console.log('    detected special var', lhs, '=', rhs);
        let ast = null;
        try { ast = Parser.parse(rhs); } catch (e) { ast = { type: 'num', val: 0 }; }
        // If the expression contains a bsearch call, treat it as a DP group
        // so that the bsearch execution path will handle it. Otherwise store
        // it as a plain special variable (AST or value will be evaluated
        // later once roots are known).
        if (hasBsearch(ast)) {
          // create a pseudo-group for this uppercase name so it participates
          // in group processing (bsearch detection, substitution, etc.)
          if (!groups[lhs]) groups[lhs] = { name: lhs, lines: [], locals: new Set(), isTopDown: false, isBundle: false };
          groups[lhs].lines.push({ target: lhs, ast });
        } else {
          if (!state.specialVars) state.specialVars = {};
          state.specialVars[lhs] = ast;
        }
        return;
      }
      let dpName, isLocal = false;
      if (lhs.includes(':')) { dpName = lhs.substring(0, lhs.indexOf(':')).trim(); isLocal = true; } else dpName = lhs;
      if (!groups[dpName]) groups[dpName] = { name: dpName, lines: [], locals: new Set(), isTopDown: false, isBundle: false };
      if (isLocal) groups[dpName].locals.add(lhs.split(':')[1].trim());
      try { groups[dpName].lines.push({ target: lhs, ast: Parser.parse(rhs) });
        console.log('    added group', dpName);
      }
      catch (err) { console.error(`Parse error in "${l}": ${err.message}`); }
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
    console.log('parsed dpGroups', state.dpGroups);
    // detect bsearch and top-down after parsing
    state.dpGroups.forEach(g => {
      g.isBsearch = g.lines.some(l => hasBsearch(l.ast));
      g.isTopDown = g.lines.some(line => !hasBsearch(line.ast) && hasPar(line.ast));
      if (state.display[g.name] === undefined) state.display[g.name] = false;
    });
    lastDpsLen = -1;
    updateDisplayOptions();
    // update groups info panel if present
    const gi = document.getElementById('groupsInfo');
    if (gi) {
      gi.textContent = state.dpGroups.map(g => `${g.name}: bsearch=${g.isBsearch}, lines=${g.lines.length}`).join('\n');
    }

    // Build tree structures
    const childrenMap = {}, parentMap = {}, edgeWeightMap = {};
    state.nodes.forEach(n => { childrenMap[n.id] = []; parentMap[n.id] = null; edgeWeightMap[n.id] = 0; });
    state.edges.forEach(e => {
      childrenMap[e.source].push(e.target);
      parentMap[e.target] = e.source;
      edgeWeightMap[e.target] = e.weight;
    });

    // Compute depth and subtree size
    let roots = state.nodes.filter(n => !parentMap[n.id]).map(n => n.id);
    if (roots.length === 0) {
      console.warn('runDP: no root found, falling back to all nodes');
      roots = state.nodes.map(n => n.id);
    }
    // evaluate any special uppercase globals now that we know a root ID
    if (state.specialVars) {
      Object.keys(state.specialVars).forEach(k => {
        try {
          state.specialVars[k] = evalAST(state.specialVars[k], roots[0] || 0, '', roots[0] || 0, new Set());
        } catch (e) { state.specialVars[k] = 0; }
      });
    }
    const depthMap = {}, sizeMap = {};
    state.nodes.forEach(n => { depthMap[n.id] = 0; sizeMap[n.id] = 1; });

    const computeDepth = (u, d) => { depthMap[u] = d; childrenMap[u].forEach(c => computeDepth(c, d + 1)); };
    roots.forEach(r => computeDepth(r, 0));

    const postOrderIds = [];
    const buildPostOrder = u => { childrenMap[u].forEach(c => buildPostOrder(c)); postOrderIds.push(u); };
    roots.forEach(r => buildPostOrder(r));
    postOrderIds.forEach(u => { sizeMap[u] = 1 + childrenMap[u].reduce((s, c) => s + sizeMap[c], 0); });

    const N = state.nodes.length;


    // clone AST and replace any bsearch call with literal value
    const substituteBsearch = (ast, val) => {
      if (!ast) return ast;
      if (ast.type === 'call' && ast.name === 'bsearch') {
        return { type: 'num', val };
      }
      const clone = { ...ast };
      ['cond','t','f','arg','l','r','target','index'].forEach(k => {
        if (clone[k]) clone[k] = substituteBsearch(clone[k], val);
      });
      if (clone.args) clone.args = clone.args.map(a => substituteBsearch(a, val));
      if (clone.items) clone.items = clone.items.map(i => substituteBsearch(i, val));
      return clone;
    };

    // pattern for uppercase-only variable names
    const isSpecialVarName = name => /^[A-Z][A-Z0-9_]*$/.test(name);

    const isLineBsearch = (line) => line.ast && line.ast.type === 'call' && line.ast.name === 'bsearch';
    state.dpGroups.forEach(g => {
      g.isBsearch = g.lines.some(isLineBsearch);
      g.isTopDown = g.lines.some(line => !isLineBsearch(line) && hasPar(line.ast));
    });

    // Results
    const results = {};
    state.nodes.forEach(n => results[n.id] = {});

    // Separate groups: bsearch, inner-bundles, inner-regular
    const bsearchGroups = state.dpGroups.filter(g => g.isBsearch);
    const innerRegular = state.dpGroups.filter(g => !g.isBsearch && !g.isBundle);
    const innerBundles = state.dpGroups.filter(g => !g.isBsearch && g.isBundle);

    // Execute DP groups
    const postOrder = (u, fn) => { childrenMap[u].forEach(c => postOrder(c, fn)); fn(u); };
    const preOrder = (u, fn) => { fn(u); childrenMap[u].forEach(c => preOrder(c, fn)); };

    // GCD helper
    const gcd2 = (a, b) => { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { [a, b] = [b, a % b]; } return a; };

    // Resolve variable
    const resolve = (evalNodeId, varName, currentDp, contextNodeId, locals) => {
      const n = state.nodes.find(x => x.id === evalNodeId);
      const children = (n && childrenMap[evalNodeId]) || [];

      if (varName === 'val') return n ? ((n.weights || [0])[0] ?? 0) : 0;
      const valMatch = varName.match(/^val(\d+)$/);
      if (valMatch) return n ? ((n.weights || [])[parseInt(valMatch[1])] ?? 0) : 0;
      if (varName === 'id') return evalNodeId;
      if (varName === 'childCount') return children.length;
      if (varName === 'isLeaf') return children.length === 0 ? 1 : 0;
      if (varName === 'isRoot') return parentMap[evalNodeId] === null ? 1 : 0;
      if (varName === 'children') return children;
      if (varName === 'edgeWeight') return edgeWeightMap[evalNodeId] || 0;
      if (varName === 'depth') return depthMap[evalNodeId] || 0;
      if (varName === 'subtreeSize') return sizeMap[evalNodeId] || 1;
      if (varName === 'n') return N;
      if (varName === 'param') return state.globalParam ?? 0;
      // uppercase-only identifiers are treated as global constants
      if (isSpecialVarName(varName)) {
        if (state.specialVars && state.specialVars[varName] !== undefined) return state.specialVars[varName];
        // fall through to normal per-node lookup if not set
      }
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
            if (vn === 'val') { const pn = state.nodes.find(x => x.id === pId); return pn ? ((pn.weights || [0])[0] ?? 0) : 0; }
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
          // Detect optional trailing direction string: "asc" or "desc"
          let dir = 1;
          let numExprArgs = args.length;
          if (args.length >= 2) {
            const lastVal = evSelf(args[args.length - 1]);
            if (lastVal === 'desc') { dir = -1; numExprArgs = args.length - 1; }
            else if (lastVal === 'asc') { dir = 1; numExprArgs = args.length - 1; }
          }
          if (numExprArgs < 2) {
            // sort raw values
            return [...arr].sort((a, b) => {
              const an = typeof a === 'number' ? a : 0;
              const bn = typeof b === 'number' ? b : 0;
              return dir * (an - bn);
            });
          }
          const exprAst = args[1];
          const vals = arr.map(item => ev(exprAst, item));
          return vals.sort((a, b) => dir * (a - b));
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

        // bsearch calls are evaluated as part of the line-processing above;
        // they should never reach the generic call handler.  If they do, just
        // return 0 to avoid breaking the evaluator.
        if (name === 'bsearch') return 0;
        throw new Error(`Unknown function: ${name}`);
      }

      return 0;
    };

    // Helper to run all inner (non-bsearch) groups in defined order
    const runInnerGroups = () => {
      innerRegular.forEach(g => {
        const fn = u => { g.lines.forEach(line => { results[u][line.target] = evalAST(line.ast, u, g.name, u, g.locals); }); };
        if (g.isTopDown) roots.forEach(r => preOrder(r, fn));
        else roots.forEach(r => postOrder(r, fn));
        // if group name is uppercase, record its root value as a special var
        if (/^[A-Z][A-Z0-9_]*$/.test(g.name) && roots[0] !== undefined) {
          if (!state.specialVars) state.specialVars = {};
          const val = results[roots[0]][g.name];
          console.log('SETTING SPECIAL', g.name, 'to', val);
          state.specialVars[g.name] = val;
        }
      });
      innerBundles.forEach(bundle => {
        const fn = u => { bundle.lines.forEach(line => { results[u][line.target] = evalAST(line.ast, u, bundle.name, u, bundle.locals); }); };
        if (bundle.isTopDown) roots.forEach(r => preOrder(r, fn));
        else roots.forEach(r => postOrder(r, fn));
        if (/^[A-Z][A-Z0-9_]*$/.test(bundle.name) && roots[0] !== undefined) {
          if (!state.specialVars) state.specialVars = {};
          const val = results[roots[0]][bundle.name];
          console.log('SETTING SPECIAL (bundle)', bundle.name, 'to', val);
          state.specialVars[bundle.name] = val;
        }
      });
    };

    console.log('innerRegular count', innerRegular.length, 'innerBundles', innerBundles.length, 'bsearchGroups', bsearchGroups.length);
    if (bsearchGroups.length === 0) {
      // No bsearch: standard execution
      runInnerGroups();
    } else {
      // Execute bsearch groups
      bsearchGroups.forEach(g => {
        // Lines that belong to this group other than any lines containing
        // a bsearch call.  They must be recomputed each iteration since the
        // condition may reference <code>param</code> or other globals.
        const nonSearchLines = g.lines.filter(l => !hasBsearch(l.ast));

        const evalNonSearch = () => {
          nonSearchLines.forEach(line => {
            const fn = u => {
              results[u][line.target] = evalAST(line.ast, u, g.name, u, g.locals);
            };
            if (g.isTopDown) roots.forEach(r => preOrder(r, fn));
            else roots.forEach(r => postOrder(r, fn));
          });
        };

        g.lines.forEach(line => {
          if (hasBsearch(line.ast)) {
            if (countBsearch(line.ast) > 1) throw new Error('Only one bsearch() call allowed per expression');
            const bsNode = findBsearch(line.ast);
            if (!bsNode || !bsNode.args || bsNode.args.length < 3)
              throw new Error('bsearch(lo, hi, condition) requires exactly 3 arguments');
            const rootId = roots[0];
            if (rootId === undefined) throw new Error('bsearch requires at least one root node');
            const lo = Math.floor(evalAST(bsNode.args[0], rootId, g.name, rootId, g.locals));
            const hi = Math.floor(evalAST(bsNode.args[1], rootId, g.name, rootId, g.locals));
            const condAst = bsNode.args[2];
            let L = lo, R = hi, bestAns = lo - 1;
            for (let iter = 0; iter <= 62 && L <= R; iter++) {
              const mid = L + Math.floor((R - L) / 2);
              state.globalParam = mid;
              runInnerGroups();
              evalNonSearch();
              const feasible = evalAST(condAst, rootId, g.name, rootId, g.locals);
              if (feasible) { bestAns = mid; L = mid + 1; }
              else R = mid - 1;
            }
            const finalVal = bestAns >= lo ? bestAns : lo - 1;
            // evaluate full expression with substitution
            const substituted = substituteBsearch(line.ast, finalVal);
            if (g.isTopDown) roots.forEach(r => preOrder(r, u => {
              results[u][line.target] = evalAST(substituted, u, g.name, u, g.locals);
            }));
            else roots.forEach(r => postOrder(r, u => {
              results[u][line.target] = evalAST(substituted, u, g.name, u, g.locals);
            }));
            // record special variable value from root if name is uppercase
            if (/^[A-Z][A-Z0-9_]*$/.test(g.name) && roots[0] !== undefined) {
              if (!state.specialVars) state.specialVars = {};
              state.specialVars[g.name] = results[roots[0]][g.name];
            }
            state.globalParam = bestAns >= lo ? bestAns : lo;
            runInnerGroups();
            evalNonSearch();
          }
        });
      });
    }

    state.dpResults = results;
    console.log('runDP complete, roots=', roots, 'specialVars=', state.specialVars, 'results root=', results[roots[0]]);
    fullUpdate();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('hidden');
  }
}
