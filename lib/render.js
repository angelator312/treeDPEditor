// =============================================
// DISPLAY OPTIONS
// =============================================
let lastDpsLen = 0;
function updateDisplayOptions() {
  if (state.dpGroups.length !== lastDpsLen) {
    lastDpsLen = state.dpGroups.length;
    const staticOpts = [
      { key: 'id', label: 'ID' }, { key: 'val', label: 'Weight' },
      { key: 'childCount', label: 'childCount' }, { key: 'isLeaf', label: 'isLeaf' }
    ];
    let html = staticOpts.map(o => `<label class="cb-container"><input type="checkbox" ${state.display[o.key] ? 'checked' : ''} data-opt="${o.key}"><span class="cb-box"></span>${o.label}</label>`).join('');
    const nonBundleGroups = state.dpGroups.filter(g => !g.name.startsWith('__bundle_'));
    if (nonBundleGroups.length > 0) {
      html += `<div class="w-full border-t my-1" style="border-color:var(--border)"></div>`;
      html += nonBundleGroups.map(g => `<label class="cb-container"><input type="checkbox" ${state.display[g.name] ? 'checked' : ''} data-opt="${g.name}"><span class="cb-box"></span>${g.name}</label>`).join('');
    }
    displayContainer.innerHTML = html;
  }
}

// =============================================
// RENDER
// =============================================
function formatVal(v) {
  if (Array.isArray(v)) return `[${v.map(x => typeof x === 'number' ? (Number.isInteger(x) ? x : x.toFixed(2)) : x).join(', ')}]`;
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return '-';
}

function updateOutput() {
  document.getElementById('statNodes').textContent = state.nodes.length;
  document.getElementById('statEdges').textContent = state.edges.length;
  const hasParent = new Set(state.edges.map(e => e.target));
  document.getElementById('statRoot').textContent = state.nodes.find(n => !hasParent.has(n.id))?.id || '-';
  // show special vars beneath stats
  if (state.specialVars) {
    const caps = Object.keys(state.specialVars).filter(n => /^[A-Z][A-Z0-9_]*$/.test(n));
    document.getElementById('statSpecial').textContent = caps.length ? caps.map(n => `${n}=${state.specialVars[n]}`).join(' ') : '';
  }
  const lines = [`${state.nodes.length} ${state.edges.length}`];
  if (state.nodes.length) lines.push([...state.nodes].sort((a, b) => a.id - b.id).map(n => (n.weights || [0])[0]).join(' '));
  state.edges.forEach(e => lines.push(`${e.source} ${e.target}${state.showEdgeW ? ' ' + e.weight : ''}`));
  document.getElementById('textOutput').textContent = lines.join('\n');
  // if there are special globals, append them to the output as comments
  if (state.specialVars) {
    const caps = Object.keys(state.specialVars).filter(n => /^[A-Z][A-Z0-9_]*$/.test(n));
    if (caps.length) {
      const extras = caps.map(n => `${n}=${state.specialVars[n]}`).join(' ');
      document.getElementById('textOutput').textContent += '\n# ' + extras;
    }
  }
}

function updateDataTable() {
  const el = document.getElementById('dataTable');
  if (!state.nodes.length) { el.innerHTML = '<p class="p-2 text-xs opacity-60">No data</p>'; return; }
  const rows = [...state.nodes].sort((a, b) => a.id - b.id);
  if (rows.length > MAX_TABLE_ROWS) { el.innerHTML = `<p class="p-2 text-xs opacity-60">Too large (${rows.length}).</p>`; return; }

  // Build header with all DP columns (excluding bundles and locals)
  const dpCols = [];
  const seenCols = new Set();

  state.dpGroups.forEach(g => {
    if (!g.name.startsWith('__bundle_')) {
      dpCols.push({ type: 'group', name: g.name });
      seenCols.add(g.name);
    } else {
      // For bundles, add individual DP columns
      g.lines.forEach(line => {
        const dpName = line.target.includes(':') ? line.target.split(':')[0].trim() : line.target.trim();
        if (!seenCols.has(dpName)) {
          dpCols.push({ type: 'bundle', name: dpName, target: line.target });
          seenCols.add(dpName);
        }
      });
    }
  });

  const maxWeights = Math.max(...rows.map(n => (n.weights || [0]).length));
  const wHeaders = maxWeights === 1 ? '<th>W</th>' : Array.from({length: maxWeights}, (_, i) => `<th>W${i}</th>`).join('');
  const wCells = n => {
    const ws = n.weights || [0];
    if (maxWeights === 1) return `<td>${ws[0]}</td>`;
    return Array.from({length: maxWeights}, (_, i) => `<td>${ws[i] !== undefined ? ws[i] : ''}</td>`).join('');
  };
  el.innerHTML = `<table><thead><tr><th>ID</th>${wHeaders}${dpCols.map(col => `<th>${col.name}</th>`).join('')}</tr></thead><tbody>${rows.map(n => `<tr><td style="color:var(--accent)">${n.id}</td>${wCells(n)}${dpCols.map(col => `<td style="color:var(--purple)">${formatVal(state.dpResults[n.id]?.[col.target || col.name])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function showSelInfo() {
  const info = document.getElementById('selInfo');
  const xyGroup = document.getElementById('selXYGroup');
  const dpVals = document.getElementById('selDpVals');
  const weightsCont = document.getElementById('weightsContainer');
  const weightAddRow = document.getElementById('weightAddRow');
  const count = state.multiSelected.size;

  if (count > 1) {
    info.classList.remove('hidden');
    document.getElementById('selName').textContent = `${count} nodes`;
    const nodes = [...state.multiSelected].map(id => state.nodes.find(n => n.id === id)).filter(Boolean);
    const ws = nodes.map(n => (n.weights || [0])[0]);
    const allSame = ws.length > 0 && ws.every(w => w === ws[0]);
    // Render single weight input for bulk edit (w0 only)
    weightsCont.innerHTML = `<div class="mb-1"><label class="block text-xs opacity-60 mb-1">Weight 0</label><input type="number" class="w-full" ${allSame ? `value="${ws[0]}"` : ''} placeholder="${allSame ? '' : 'mixed'}" data-wi="0"></div>`;
    weightAddRow.classList.add('hidden');
    const inp = weightsCont.querySelector('[data-wi="0"]');
    inp.onchange = e => { updateSelectedWeight(e.target.value, 0); saveHistory(); };
    inp.oninput = e => updateSelectedWeight(e.target.value, 0);
    const cx = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;
    const cy = nodes.reduce((s, n) => s + n.y, 0) / nodes.length;
    document.getElementById('selX').value = Math.round(cx);
    document.getElementById('selY').value = Math.round(cy);
    xyGroup.classList.remove('hidden'); dpVals.classList.add('hidden'); return;
  }

  if (!state.selected) { info.classList.add('hidden'); return; }

  info.classList.remove('hidden');
  const isNode = state.selected.type === 'node';
  const obj = isNode ? state.nodes.find(n => n.id === state.selected.id) : state.edges.find(e => e.id === state.selected.id);
  if (!obj) { info.classList.add('hidden'); return; }
  document.getElementById('selName').textContent = isNode ? `Node ${obj.id}` : `Edge ${obj.source}→${obj.target}`;
  if (isNode) {
    renderWeightInputs(weightsCont, weightAddRow, obj.weights || [0], false, 0);
    document.getElementById('selX').value = Math.round(obj.x);
    document.getElementById('selY').value = Math.round(obj.y);
    xyGroup.classList.remove('hidden');
  } else {
    renderWeightInputs(weightsCont, weightAddRow, null, true, obj.weight);
    xyGroup.classList.add('hidden');
  }
  if (isNode && state.dpResults[obj.id]) {
    dpVals.classList.remove('hidden');
    dpVals.innerHTML = Object.entries(state.dpResults[obj.id]).filter(([k]) => !k.includes(':'))
      .map(([k, v]) => `<span style="margin-right:8px"><span style="color:var(--accent)">${k}</span>: ${formatVal(v)}</span>`).join('');
  } else dpVals.classList.add('hidden');
}

function renderWeightInputs(container, addRow, weights, isEdge, edgeWeight) {
  if (isEdge) {
    container.innerHTML = `<div class="mb-1"><label class="block text-xs opacity-60 mb-1">Weight</label><input type="number" class="w-full" value="${edgeWeight}" data-wi="edge"></div>`;
    addRow.classList.add('hidden');
    const inp = container.querySelector('[data-wi="edge"]');
    inp.onchange = e => { updateSelectedWeight(e.target.value, 0); saveHistory(); };
    inp.oninput = e => updateSelectedWeight(e.target.value, 0);
    return;
  }
  const multi = Array.isArray(weights);
  const wArr = multi ? weights : [weights];
  let html = '';
  wArr.forEach((w, i) => {
    const label = wArr.length === 1 ? 'Weight' : `Weight ${i}`;
    const removable = wArr.length > 1;
    html += `<div class="flex items-center gap-1 mb-1">
      <div class="flex-1">
        <label class="block text-xs opacity-60 mb-1">${label}</label>
        <input type="number" class="w-full" value="${w}" data-wi="${i}">
      </div>
      ${removable ? `<button data-wrm="${i}" class="text-xs px-1 rounded self-end mb-0.5" style="background:var(--danger);color:white;cursor:pointer;border:none;line-height:1.6">×</button>` : ''}
    </div>`;
  });
  container.innerHTML = html;
  addRow.classList.remove('hidden');
  container.querySelectorAll('input[data-wi]').forEach(inp => {
    const idx = parseInt(inp.dataset.wi);
    inp.onchange = e => { updateSelectedWeight(e.target.value, idx); saveHistory(); };
    inp.oninput = e => updateSelectedWeight(e.target.value, idx);
  });
  container.querySelectorAll('[data-wrm]').forEach(btn => {
    btn.onclick = () => removeWeightFromNode(parseInt(btn.dataset.wrm));
  });
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function findNode(pos) { return [...state.nodes].reverse().find(n => dist(pos, n) <= 20); }
function findEdge(pos) {
  let minD = 15, found = null;
  for (const e of state.edges) {
    const s = state.nodes.find(n => n.id === e.source), t = state.nodes.find(n => n.id === e.target);
    if (!s || !t) continue;
    const d = pLineDist(pos, s, t);
    if (d < minD) { minD = d; found = e; }
  }
  return found;
}
function pLineDist(p, a, b) {
  const A = p.x - a.x, B = p.y - a.y, C = b.x - a.x, D = b.y - a.y;
  const dot = A * C + B * D, len = C * C + D * D;
  let param = len ? dot / len : -1;
  let xx, yy;
  if (param < 0) { xx = a.x; yy = a.y; }
  else if (param > 1) { xx = b.x; yy = b.y; }
  else { xx = a.x + param * C; yy = a.y + param * D; }
  return Math.hypot(p.x - xx, p.y - yy);
}

function render() {
  if (!canvas || canvas.width === 0) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const childrenMap = {};
  state.nodes.forEach(n => childrenMap[n.id] = []);
  state.edges.forEach(e => { if (childrenMap[e.source]) childrenMap[e.source].push(e.target); });

  // Draw edges
  state.edges.forEach(e => {
    const s = state.nodes.find(n => n.id === e.source);
    const t = state.nodes.find(n => n.id === e.target);
    if (!s || !t) return;
    const ang = Math.atan2(t.y - s.y, t.x - s.x);
    const sel = state.selected?.id === e.id;

    ctx.beginPath();
    ctx.moveTo(s.x + Math.cos(ang) * 20, s.y + Math.sin(ang) * 20);
    ctx.lineTo(t.x - Math.cos(ang) * 24, t.y - Math.sin(ang) * 24);
    ctx.strokeStyle = sel ? '#00d4aa' : '#555';
    ctx.lineWidth = sel ? 3 : 2;
    ctx.stroke();

    if (state.isDirected) {
      const ex = t.x - Math.cos(ang) * 24, ey = t.y - Math.sin(ang) * 24;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 10 * Math.cos(ang - Math.PI / 6), ey - 10 * Math.sin(ang - Math.PI / 6));
      ctx.lineTo(ex - 10 * Math.cos(ang + Math.PI / 6), ey - 10 * Math.sin(ang + Math.PI / 6));
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }

    if (state.showEdgeW) {
      const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
      ctx.beginPath(); ctx.arc(mx, my, 10, 0, 6.3); ctx.fillStyle = '#1a1a24'; ctx.fill();
      ctx.fillStyle = '#888'; ctx.font = '9px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText(e.weight, mx, my + 3);
    }
  });

  // Draw preview line when connecting
  if (state.connectSource && state.mousePos) {
    const s = state.nodes.find(n => n.id === state.connectSource.id);
    if (s) {
      const ang = Math.atan2(state.mousePos.y - s.y, state.mousePos.x - s.x);
      ctx.beginPath();
      ctx.moveTo(s.x + Math.cos(ang) * 20, s.y + Math.sin(ang) * 20);
      ctx.lineTo(state.mousePos.x, state.mousePos.y);
      ctx.strokeStyle = 'rgba(0, 212, 170, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Draw nodes
  state.nodes.forEach(n => {
    const sel = state.multiSelected.has(n.id);
    const isConnectSource = state.connectSource?.id === n.id;

    // Draw connect source indicator
    if (isConnectSource) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 32, 0, 6.3);
      ctx.strokeStyle = 'rgba(0, 212, 170, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(n.x, n.y, 28, 0, 6.3);
      ctx.strokeStyle = 'rgba(0, 212, 170, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (sel) { ctx.beginPath(); ctx.arc(n.x, n.y, 26, 0, 6.3); ctx.strokeStyle = '#00d4aa'; ctx.lineWidth = 3; ctx.stroke(); }

    ctx.beginPath(); ctx.arc(n.x, n.y, 20, 0, 6.3); ctx.fillStyle = '#1a1a24'; ctx.fill(); ctx.strokeStyle = '#444'; ctx.lineWidth = 1; ctx.stroke();

    const parts = [];
    if (state.display.val) {
      const ws = n.weights || [0];
      if (ws.length === 1) parts.push(`w:${ws[0]}`);
      else ws.forEach((w, i) => parts.push(`w${i}:${w}`));
    }
    if (state.display.childCount) parts.push(`c:${(childrenMap[n.id] || []).length}`);
    if (state.display.isLeaf) parts.push(`l:${(childrenMap[n.id] || []).length === 0 ? 1 : 0}`);

    // Display regular DP groups
    state.dpGroups.forEach(g => {
      if (!g.name.startsWith('__bundle_') && state.display[g.name]) {
        const val = state.dpResults[n.id]?.[g.name];
        if (val !== undefined) parts.push(`${g.name}:${formatVal(val)}`);
      }
    });

    // Display bundle DP values
    state.dpGroups.forEach(g => {
      if (g.name.startsWith('__bundle_')) {
        g.lines.forEach(line => {
          const dpName = line.target.includes(':') ? line.target.split(':')[0].trim() : line.target.trim();
          const val = state.dpResults[n.id]?.[line.target];
          if (val !== undefined) parts.push(`${dpName}:${formatVal(val)}`);
        });
      }
    });

    ctx.textAlign = 'center';
    if (state.display.id) {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText(n.id, n.x, n.y - (parts.length > 0 ? 5 : 4));
    }
    if (parts.length > 0) {
      ctx.fillStyle = '#bd93f9'; ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText(parts.join(' | '), n.x, n.y + (state.display.id ? 10 : 4));
    }
  });

  if (state.rubberBand) {
    const rb = state.rubberBand;
    const x = Math.min(rb.x1, rb.x2), y = Math.min(rb.y1, rb.y2);
    const w = Math.abs(rb.x2 - rb.x1), h = Math.abs(rb.y2 - rb.y1);
    ctx.beginPath(); ctx.rect(x, y, w, h);
    ctx.fillStyle = 'rgba(0,212,170,0.08)'; ctx.fill();
    ctx.strokeStyle = 'rgba(0,212,170,0.6)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
  }
  showSelInfo();
}
