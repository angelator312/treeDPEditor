// =============================================
// EVENT BINDING
// =============================================
function bindEvents() {
  window.addEventListener('resize', resize);

  window.addEventListener('keydown', e => {
    const active = document.activeElement.tagName;
    if (active === 'INPUT' || active === 'TEXTAREA' || active === 'SELECT') {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runDP(); }
      if (e.key === 'Escape') {
        e.preventDefault();
        document.getElementById('dpCode').blur();
        state.dpFocused = false;
        document.getElementById('dpCode').classList.remove('focused');
        setMode('select');
      }
      return;
    }
    if (e.key === 'Escape') {
      state.dpFocused = false;
      document.getElementById('dpCode').classList.remove('focused');
    }
    if (e.key === 'f' && !state.dpFocused) {
      e.preventDefault();
      state.dpFocused = true;
      const dpCode = document.getElementById('dpCode');
      dpCode.classList.add('focused');
      dpCode.focus();
      dpCode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (['a', 'c', 's', 'Delete', 'Backspace'].includes(e.key)) e.preventDefault();
    if (e.key === 'a') setMode('add');
    if (e.key === 'c') setMode('connect');
    if (e.key === 's') setMode('select');
    if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
  });

  document.getElementById('btnAdd').onclick = () => setMode('add');
  document.getElementById('btnConnect').onclick = () => setMode('connect');
  document.getElementById('btnSelect').onclick = () => setMode('select');

  document.getElementById('tglTreeContainer').onclick = () => toggle('isTree');
  document.getElementById('tglDirectedContainer').onclick = () => toggle('isDirected');
  document.getElementById('tglShowEdgeWContainer').onclick = () => toggle('showEdgeW');

  document.getElementById('btnUndo').onclick = undo;
  document.getElementById('btnRedo').onclick = redo;
  document.getElementById('btnBeautify').onclick = beautifyTree;

  document.getElementById('btnOpenImport').onclick = () => document.getElementById('importModal').classList.add('active');
  document.getElementById('btnModalClose').onclick = () => document.getElementById('importModal').classList.remove('active');
  document.getElementById('btnModalImport').onclick = importData;
  document.getElementById('btnResetSave').onclick = resetStorage;

  document.getElementById('btnDelSel').onclick = deleteSelected;
  document.getElementById('btnRunDp').onclick = runDP;
  document.getElementById('btnSaveFormula').onclick = promptSaveFormula;
  document.getElementById('btnDeleteFormula').onclick = promptDeleteFormula;

  document.getElementById('btnCopy').onclick = () => {
    navigator.clipboard.writeText(document.getElementById('textOutput').textContent);
    const btn = document.getElementById('btnCopy');
    btn.textContent = 'Done'; setTimeout(() => btn.textContent = 'Copy', 1000);
  };

  const selWeightInput = document.getElementById('selWeight');
  selWeightInput.onchange = e => { updateSelectedWeight(e.target.value); saveHistory(); };
  selWeightInput.oninput = e => updateSelectedWeight(e.target.value);

  const selXInput = document.getElementById('selX');
  selXInput.onchange = e => { updateSelXY('x', e.target.value); saveHistory(); };
  selXInput.oninput  = e => updateSelXY('x', e.target.value);

  const selYInput = document.getElementById('selY');
  selYInput.onchange = e => { updateSelXY('y', e.target.value); saveHistory(); };
  selYInput.oninput  = e => updateSelXY('y', e.target.value);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('hidden', c.id !== `tab-${btn.dataset.tab}`));
    };
  });

  displayContainer.onchange = e => {
    if (e.target.type === 'checkbox' && e.target.dataset.opt) {
      state.display[e.target.dataset.opt] = e.target.checked;
      render(); saveToStorage();
    }
  };

  // DP Code focus/blur handlers
  document.getElementById('dpCode').onblur = () => {
    state.dpFocused = false;
    document.getElementById('dpCode').classList.remove('focused');
  };

  document.getElementById('dpExamples').onchange = e => {
    const val = e.target.value;
    let code = null;

    // Check built-in examples
    if (val && EXAMPLES[val]) {
      code = EXAMPLES[val];
    }
    // Check custom formulas
    else if (val && val.startsWith('custom_')) {
      const customKey = val.substring(7); // Remove 'custom_' prefix
      if (customFormulas[customKey]) {
        code = customFormulas[customKey];
      }
    }

    if (code) {
      document.getElementById('dpCode').value = code;
      quickParseDpDefs(code);
      lastDpsLen = -1;
      updateDisplayOptions();
      saveToStorage();
    }
    e.target.value = '';
  };

  // Canvas mouse events
  canvas.onmousedown = ev => {
    const pos = { x: ev.offsetX, y: ev.offsetY };
    const node = findNode(pos);
    const edge = findEdge(pos);

    if (state.mode === 'add') {
      if (!node) addNode(pos.x, pos.y);
      else selectObj(node);
    } else if (state.mode === 'connect') {
      if (node) {
        if (!state.connectSource) state.connectSource = node;
        else { addEdge(state.connectSource, node); state.connectSource = null; }
      } else state.connectSource = null;
      render();
    } else {
      if (node) {
        if (ev.shiftKey || ev.ctrlKey || ev.metaKey) {
          selectMultiToggle(node.id);
        } else if (state.multiSelected.has(node.id) && state.multiSelected.size > 1) {
          const basePositions = {};
          state.multiSelected.forEach(id => {
            const n = state.nodes.find(x => x.id === id);
            if (n) basePositions[id] = { x: n.x, y: n.y };
          });
          state.dragging = { type: 'multi', basePositions, startX: pos.x, startY: pos.y };
        } else {
          state.multiSelected = new Set([node.id]);
          state.selected = { type: 'node', id: node.id };
          state.dragging = { type: 'single', id: node.id, ox: pos.x - node.x, oy: pos.y - node.y };
          showSelInfo();
        }
      } else if (edge) {
        state.multiSelected = new Set();
        selectEdge(edge);
      } else {
        state.multiSelected = new Set(); state.selected = null;
        startRubberBand(pos.x, pos.y);
        showSelInfo();
      }
      render();
    }
  };

  canvas.onmousemove = ev => {
    if (state.dragging) {
      if (state.dragging.type === 'multi') {
        const dx = ev.offsetX - state.dragging.startX, dy = ev.offsetY - state.dragging.startY;
        state.multiSelected.forEach(id => {
          const n = state.nodes.find(x => x.id === id), base = state.dragging.basePositions[id];
          if (n && base) { n.x = base.x + dx; n.y = base.y + dy; }
        });
        render();
      } else {
        const n = state.nodes.find(x => x.id === state.dragging.id);
        if (n) { n.x = ev.offsetX - state.dragging.ox; n.y = ev.offsetY - state.dragging.oy; render(); }
      }
    }
    if (state.rubberBand) { state.rubberBand.x2 = ev.offsetX; state.rubberBand.y2 = ev.offsetY; render(); }
    // Track mouse position for connect mode preview line
    if (state.mode === 'connect') {
      state.mousePos = { x: ev.offsetX, y: ev.offsetY };
      if (state.connectSource) render();
    }
  };

  const stopDrag = () => {
    if (state.dragging) saveHistory();
    state.dragging = null;
    if (state.rubberBand) commitRubberBand();
  };
  canvas.onmouseup = stopDrag;
  canvas.onmouseleave = () => {
    stopDrag();
    state.mousePos = null;
    if (state.connectSource && state.mode === 'connect') render();
  };
}

// =============================================
// INIT
// =============================================
function init() {
  canvas = document.getElementById('graphCanvas');
  ctx = canvas.getContext('2d');
  displayContainer = document.getElementById('displayOptionsContainer');

  document.getElementById('docsContent').innerHTML = buildDocs();

  loadCustomFormulas();
  loadFromStorage();

  // Populate built-in examples dropdown from EXAMPLES keys (derived from filenames)
  const dpExamplesEl = document.getElementById('dpExamples');
  Object.keys(EXAMPLES).forEach(key => {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = label;
    dpExamplesEl.appendChild(opt);
  });
  updateDropdownWithCustomFormulas();
  resize();
  bindEvents();
  saveHistory();
  fullUpdate();
  setMode('add');

  if (!document.getElementById('dpCode').value) {
    document.getElementById('dpCode').value = EXAMPLES.subtree_sum;
    quickParseDpDefs(EXAMPLES.subtree_sum);
    updateDisplayOptions();
  }
}

init();
