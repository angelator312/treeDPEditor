// =============================================
// GRAPH LOGIC
// =============================================
function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.max(100, rect.width);
  canvas.height = 400;
  render();
}

function setMode(m) {
  state.mode = m; state.connectSource = null;
  state.multiSelected = new Set(); state.selected = null;
  document.getElementById('btnAdd').classList.toggle('active', m === 'add');
  document.getElementById('btnConnect').classList.toggle('active', m === 'connect');
  document.getElementById('btnSelect').classList.toggle('active', m === 'select');
  canvas.className = `mode-${m}`;
  render();
}

function toggle(k) {
  state[k] = !state[k];
  const map = { isTree: 'tglTree', isDirected: 'tglDirected', showEdgeW: 'tglShowEdgeW' };
  document.getElementById(map[k]).classList.toggle('active', state[k]);
  if (k === 'isTree' && state.isTree && !state.isDirected) toggle('isDirected');
  document.getElementById('dpWarning').classList.toggle('hidden', state.isTree);
  render(); saveToStorage();
}

function addNode(x, y) { state.nodes.push({ id: state.nextId++, x, y, weights: [0] }); fullUpdate(); saveHistory(); }

function addEdge(u, v) {
  if (u.id === v.id) return false;
  if (state.edges.some(e => (e.source === u.id && e.target === v.id) || (!state.isDirected && e.source === v.id && e.target === u.id))) return false;
  if (state.isTree) {
    if (!state.isDirected) return false;
    if (state.edges.some(e => e.target === v.id)) { alert('Node already has parent in Tree Mode.'); return false; }
    if (isReachable(v.id, u.id)) { alert('Cycle detected in Tree Mode.'); return false; }
  }
  state.edges.push({ id: Date.now(), source: u.id, target: v.id, weight: 0 });
  fullUpdate(); saveHistory();
  return true;
}

function selectObj(obj) {
  state.multiSelected = new Set([obj.id]);
  state.selected = { type: 'node', id: obj.id };
  render();
}
function selectEdge(obj) { state.selected = { type: 'edge', id: obj.id }; render(); }

function selectMultiToggle(nodeId) {
  if (state.multiSelected.has(nodeId)) state.multiSelected.delete(nodeId);
  else state.multiSelected.add(nodeId);
  const size = state.multiSelected.size;
  state.selected = size === 1 ? { type: 'node', id: [...state.multiSelected][0] } : null;
  render();
}

function startRubberBand(x, y) {
  state.rubberBand = { x1: x, y1: y, x2: x, y2: y };
}

function commitRubberBand() {
  if (!state.rubberBand) return;
  const { x1, y1, x2, y2 } = state.rubberBand;
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
  state.multiSelected = new Set(
    state.nodes.filter(n => n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY).map(n => n.id)
  );
  state.selected = null;
  state.rubberBand = null;
  render();
}

function updateSelXY(axis, value) {
  const v = parseFloat(value);
  if (isNaN(v)) return;
  const nodes = [...state.multiSelected].map(id => state.nodes.find(n => n.id === id)).filter(Boolean);
  if (!nodes.length) return;
  const centroid = nodes.reduce((s, n) => s + (axis === 'x' ? n.x : n.y), 0) / nodes.length;
  const delta = v - centroid;
  nodes.forEach(n => { if (axis === 'x') n.x += delta; else n.y += delta; });
  render(); updateOutput(); saveToStorage();
}

function deleteSelected() {
  if (state.multiSelected.size > 0) {
    const ids = state.multiSelected;
    state.nodes = state.nodes.filter(n => !ids.has(n.id));
    state.edges = state.edges.filter(e => !ids.has(e.source) && !ids.has(e.target));
    state.multiSelected = new Set(); state.selected = null;
    state.dpResults = {}; fullUpdate(); saveHistory();
    return;
  }
  if (!state.selected) return;
  if (state.selected.type === 'edge')
    state.edges = state.edges.filter(e => e.id !== state.selected.id);
  state.selected = null; state.dpResults = {}; fullUpdate(); saveHistory();
}

function updateSelectedWeight(v, index = 0) {
  const w = parseFloat(v);
  if (isNaN(w)) return;
  if (state.multiSelected.size > 0) {
    state.multiSelected.forEach(id => {
      const n = state.nodes.find(x => x.id === id);
      if (n) { if (!n.weights) n.weights = [0]; n.weights[index] = w; }
    });
    render(); updateOutput(); saveToStorage(); return;
  }
  if (!state.selected) return;
  if (state.selected.type === 'node') {
    const n = state.nodes.find(x => x.id === state.selected.id);
    if (n) { if (!n.weights) n.weights = [0]; n.weights[index] = w; }
  } else {
    const e = state.edges.find(x => x.id === state.selected.id);
    if (e) e.weight = w;
  }
  render(); updateOutput(); saveToStorage();
}

function addWeightToNode() {
  if (!state.selected || state.selected.type !== 'node') return;
  const n = state.nodes.find(x => x.id === state.selected.id);
  if (!n) return;
  if (!n.weights) n.weights = [0];
  n.weights.push(0);
  render(); updateOutput(); updateDataTable(); saveToStorage(); saveHistory();
  showSelInfo();
}

function removeWeightFromNode(index) {
  if (!state.selected || state.selected.type !== 'node') return;
  const n = state.nodes.find(x => x.id === state.selected.id);
  if (!n || !n.weights || n.weights.length <= 1) return;
  n.weights.splice(index, 1);
  render(); updateOutput(); updateDataTable(); saveToStorage(); saveHistory();
  showSelInfo();
}

function fullUpdate() { render(); updateOutput(); updateDataTable(); updateDisplayOptions(); }

function importData() {
  try {
    const text = document.getElementById('importText').value.trim();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (!lines.length) return;
    const firstParts = lines[0].split(/\s+/).map(Number);

    // attempt Codeforces multi-tree format: first line = T (# of cases)
    if (firstParts.length === 1 && firstParts[0] > 1) {
      const T = firstParts[0];
      let idx = 1;
      const snapshots = [];
      let ok = true;
      for (let t = 0; t < T; t++) {
        if (idx >= lines.length) { ok = false; break; }
        const n = parseInt(lines[idx++], 10);
        if (isNaN(n) || n < 1) { ok = false; break; }
        if (idx >= lines.length) { ok = false; break; }
        const wArr = lines[idx++].split(/\s+/).map(Number);
        if (wArr.length !== n) { ok = false; break; }
        let parents = [];
        if (n > 1) {
          if (idx >= lines.length) { ok = false; break; }
          parents = lines[idx++].split(/\s+/).map(Number);
          if (parents.length !== n - 1) { ok = false; break; }
        }
        // build snapshot object
        const snap = { nodes: [], edges: [], nextId: 1, isTree: true, isDirected: true, showEdgeW: false, display: {...state.display} };
        // give a name; will be updated after push if necessary
        snap.name = 'Tree ' + (snapshots.length + 1);
        for (let i = 1; i <= n; i++) {
          snap.nodes.push({ id: snap.nextId++, x: 100 + (i % 5) * 100, y: 100 + Math.floor(i / 5) * 100, weights: [wArr[i - 1] || 0] });
        }
        if (n > 1) {
          parents.forEach((p, j) => {
            snap.edges.push({ id: Date.now() + j, source: p, target: j + 2, weight: 0 });
          });
        }
        snapshots.push(snap);
      }
      if (ok && snapshots.length === T) {
        // install snapshots and load first
        window.treeSnapshots = snapshots;
        window.currentTreeIndex = 0;
        loadSnapshot(window.treeSnapshots[0]);
        fullUpdate();
        renderTreesList();
        saveToStorage();
        document.getElementById('importModal').classList.remove('active');
        return;
      }
      // otherwise fall through and treat as single tree
    }

    // fall-back single-tree import
    state.nodes = []; state.edges = []; state.nextId = 1; state.dpResults = {}; state.dpGroups = [];
    if (firstParts.length === 1) {
      // Format B: parent array format
      const n = firstParts[0];
      if (isNaN(n) || n < 1) throw new Error('Invalid n');
      const wArr = lines.length > 1 ? lines[1].split(/\s+/).map(Number) : [];
      if (wArr.length !== n) throw new Error('Weight count mismatch');
      for (let i = 1; i <= n; i++) state.nodes.push({ id: state.nextId++, x: 100 + (i % 5) * 100, y: 100 + Math.floor(i / 5) * 100, weights: [wArr[i - 1] || 0] });
      if (n > 1) {
        const parents = lines.length > 2 ? lines[2].split(/\s+/).map(Number) : [];
        if (parents.length !== n - 1) throw new Error('Parent count mismatch');
        parents.forEach((p, idx) => {
          state.edges.push({ id: Date.now() + idx, source: p, target: idx + 2, weight: 0 });
        });
      }
    } else {
      // Format A: edge list format
      const [V, E] = firstParts;
      let hasWeights = false;
      if (lines.length > 1) { const parts = lines[1].split(/\s+/); if (parts.length === V && !isNaN(parts[0])) hasWeights = true; }
      for (let i = 1; i <= V; i++) state.nodes.push({ id: state.nextId++, x: 100 + (i % 5) * 100, y: 100 + Math.floor(i / 5) * 100, weights: [0] });
      if (hasWeights) { const wArr = lines[1].split(/\s+/).map(Number); state.nodes.forEach((n, i) => n.weights = [wArr[i] || 0]); }
      const startIdx = hasWeights ? 2 : 1;
      for (let i = 0; i < E; i++) {
        if (startIdx + i >= lines.length) break;
        const parts = lines[startIdx + i].split(/\s+/).map(Number);
        if (parts.length >= 2) state.edges.push({ id: Date.now() + i, source: parts[0], target: parts[1], weight: parts[2] || 0 });
      }
    }
    autoLayout(); saveHistory(); fullUpdate();
    document.getElementById('importModal').classList.remove('active');
  } catch (e) { alert('Error parsing data.'); }
}

function autoLayout() {
  const V = state.nodes.length;
  if (!V) return;
  const radius = Math.min(canvas.width, canvas.height) * 0.35;
  state.nodes.forEach((n, i) => {
    const angle = (i / V) * 2 * Math.PI - Math.PI / 2;
    n.x = canvas.width / 2 + radius * Math.cos(angle);
    n.y = canvas.height / 2 + radius * Math.sin(angle);
  });
}

// =============================================
// BEAUTIFY / RE-ROOT LAYOUT
// =============================================
function beautifyTree() {
  const V = state.nodes.length;
  if (!V) return;

  // 1. Determine root
  let rootId;
  if (state.isDirected) {
    const parentMap = {};
    state.nodes.forEach(n => { parentMap[n.id] = null; });
    state.edges.forEach(e => { parentMap[e.target] = e.source; });
    const roots = state.nodes.filter(n => parentMap[n.id] === null).map(n => n.id);
    if (roots.length !== 1) {
      const btn = document.getElementById('btnBeautify');
      const orig = btn.textContent;
      btn.textContent = roots.length === 0 ? 'No root!' : 'Multi-root!';
      setTimeout(() => { btn.textContent = orig; }, 1500);
      return;
    }
    rootId = roots[0];
  } else {
    rootId = state.nodes.reduce((min, n) => n.id < min ? n.id : min, state.nodes[0].id);
  }

  // 2. Build adjacency list (undirected: both directions; directed: source→target only)
  const adj = {};
  state.nodes.forEach(n => { adj[n.id] = []; });
  state.edges.forEach(e => {
    adj[e.source].push(e.target);
    if (!state.isDirected) adj[e.target].push(e.source);
  });

  // 3. BFS from root to orient tree, compute depth
  const childrenMap = {};
  const depthMap = {};
  state.nodes.forEach(n => { childrenMap[n.id] = []; depthMap[n.id] = 0; });
  const visited = new Set([rootId]);
  const bfsQueue = [rootId];
  while (bfsQueue.length) {
    const u = bfsQueue.shift();
    for (const v of adj[u]) {
      if (!visited.has(v)) {
        visited.add(v);
        childrenMap[u].push(v);
        depthMap[v] = depthMap[u] + 1;
        bfsQueue.push(v);
      }
    }
  }

  // 4. Compute subtree widths via iterative post-order
  const subtreeWidth = {};
  const postOrder = [];
  const dfsStack = [[rootId, false]];
  while (dfsStack.length) {
    const [u, processed] = dfsStack.pop();
    if (processed) {
      postOrder.push(u);
    } else {
      dfsStack.push([u, true]);
      for (const c of childrenMap[u]) dfsStack.push([c, false]);
    }
  }
  postOrder.forEach(u => {
    const kids = childrenMap[u];
    subtreeWidth[u] = kids.length === 0 ? 1 : kids.reduce((s, c) => s + subtreeWidth[c], 0);
  });

  // 5. Assign normalized x positions
  const xNorm = {};
  function assignX(u, offset) {
    const kids = childrenMap[u];
    if (kids.length === 0) {
      xNorm[u] = offset + 0.5;
    } else {
      let childOffset = offset;
      for (const c of kids) { assignX(c, childOffset); childOffset += subtreeWidth[c]; }
      xNorm[u] = (xNorm[kids[0]] + xNorm[kids[kids.length - 1]]) / 2;
    }
  }
  assignX(rootId, 0);

  // 6. Scale to canvas and mutate (saveHistory BEFORE mutation)
  const MARGIN = 40;
  const totalWidth = subtreeWidth[rootId] || 1;
  const maxDepth = visited.size > 1 ? Math.max(...Array.from(visited).map(id => depthMap[id])) : 0;
  const hSpacing = (canvas.width  - 2 * MARGIN) / totalWidth;
  const vSpacing = (canvas.height - 2 * MARGIN) / (maxDepth || 1);

  saveHistory();
  state.nodes.forEach(n => {
    if (xNorm[n.id] !== undefined) {
      n.x = MARGIN + xNorm[n.id] * hSpacing;
      n.y = MARGIN + depthMap[n.id] * vSpacing;
    }
  });
  saveToStorage();
  render();
}

function isReachable(s, t) {
  const adj = {};
  state.edges.forEach(e => (adj[e.source] = adj[e.source] || []).push(e.target));
  const q = [s], vis = new Set(q);
  while (q.length) { const u = q.shift(); if (u === t) return true; (adj[u] || []).forEach(v => { if (!vis.has(v)) { vis.add(v); q.push(v); } }); }
  return false;
}
