// =============================================
// EVENT BINDING
// =============================================
// MULTI-TREE SNAPSHOTS (no state change)
// =============================================
window.treeSnapshots = [];
window.currentTreeIndex = 0;

// global error catcher so we can see why buttons might not work
window.onerror = function(msg, url, line, col, error) {
  // use alert so user notices in browser
  alert('JavaScript error: ' + msg + '\n' + url + ':' + line + ':' + col + '\n' + (error && error.stack));
};


function renderTreesList() {
  const list = document.getElementById('treesList');
  if (!list) return;
  list.innerHTML = '';
  treeSnapshots.forEach((snap, idx) => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 mb-1';
    div.style.opacity = idx === currentTreeIndex ? '1' : '0.7';
    div.innerHTML = `
      <input type="checkbox" class="tree-batch-checkbox" data-idx="${idx}" style="margin-right:4px;">
      <input type="text" value="${snap.name||('Tree '+(idx+1))}" data-idx="${idx}" class="tree-name-input text-xs px-1 rounded" style="width:90px;">
      <button class="btn-switch-tree btn text-xs px-2 py-0.5 rounded" data-idx="${idx}" ${idx===currentTreeIndex?'disabled':''} style="background: var(--accent); color: var(--bg);">Switch</button>
      <button class="btn-del-tree btn text-xs px-2 py-0.5 rounded" data-idx="${idx}" style="background: var(--danger); color: white;">Del</button>
    `;
    list.appendChild(div);
  });

  // Bind switch, delete, rename events
  list.querySelectorAll('.btn-switch-tree').forEach(btn => {
    btn.onclick = e => {
      const idx = +btn.dataset.idx;
      if (idx === currentTreeIndex) return; // nothing to do when clicking current tree

      // persist current tree before leaving
      if (treeSnapshots[currentTreeIndex]) {
        treeSnapshots[currentTreeIndex] = makeSnapshot();
      }

      // load the selected snapshot
      loadSnapshot(treeSnapshots[idx]);
      currentTreeIndex = idx;

      // update everything and persist the change
      fullUpdate();
      renderTreesList();
      saveToStorage();
    };
  });
  list.querySelectorAll('.btn-del-tree').forEach(btn => {
    btn.onclick = e => {
      const idx = +btn.dataset.idx;
      if (treeSnapshots.length <= 1) {
        // if there's only one tree we treat deletion as reset
        if (!confirm('This is the only tree. Delete it and start fresh?')) return;
        // clear current state and keep a blank snapshot
        state.nodes = [];
        state.edges = [];
        state.nextId = 1;
        state.dpResults = {};
        state.dpGroups = [];
        treeSnapshots[0] = makeSnapshot();
        fullUpdate();
        renderTreesList();
        saveToStorage();
        return;
      }

      // track whether we are deleting the current tree
      const wasCurrent = idx === currentTreeIndex;
      // remove the chosen snapshot
      treeSnapshots.splice(idx, 1);
      if (wasCurrent) {
        // if we removed the current tree, choose the next one if possible,
        // otherwise pick the previous (which will be last after splice).
        currentTreeIndex = Math.min(idx, treeSnapshots.length - 1);
      } else if (idx < currentTreeIndex) {
        // deleted an earlier tree, shift index down to keep referring
        // to the same logical tree
        currentTreeIndex--;
      }

      // load whatever is now current
      loadSnapshot(treeSnapshots[currentTreeIndex]);
      fullUpdate();
      renderTreesList();
      saveToStorage();
    };
  });
  list.querySelectorAll('.tree-name-input').forEach(input => {
    input.onchange = e => {
      const idx = +input.dataset.idx;
      treeSnapshots[idx].name = input.value;
      renderTreesList();
    };
  });
}
// =============================================
function bindEvents() {
  console.log('bindEvents start');
              // Import new tree as new entry
              const importNewTreeInput = document.getElementById('importNewTreeInput');
              if (importNewTreeInput) {
                importNewTreeInput.onchange = e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = evt => {
                    try {
                      const raw = JSON.parse(evt.target.result);
                      // deep-copy to detach from file object and strip transient props
                      const data = JSON.parse(JSON.stringify(raw));
                      if (!data.name) data.name = 'Tree ' + (treeSnapshots.length + 1);
                      treeSnapshots.push(data);
                      currentTreeIndex = treeSnapshots.length - 1;
                      loadSnapshot(data);
                      render();
                      renderTreesList();
                      saveToStorage();
                    } catch (e) {
                      alert('Invalid tree file.');
                    }
                  };
                  reader.readAsText(file);
                  importNewTreeInput.value = '';
                };
              }
          // Export selected tree
          const btnExportTree = document.getElementById('btnExportTree');
          if (btnExportTree) {
            btnExportTree.onclick = () => {
              const checkboxes = document.querySelectorAll('.tree-batch-checkbox');
              let idx = -1;
              checkboxes.forEach(cb => { if (cb.checked) idx = +cb.dataset.idx; });
              if (idx === -1) {
                alert('Select a tree to export.');
                return;
              }
              const tree = treeSnapshots[idx];
              const blob = new Blob([JSON.stringify(tree, null, 2)], {type: 'application/json'});
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = (tree.name || 'tree') + '.json';
              document.body.appendChild(a);
              a.click();
              setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
            };
          }

          // Import to selected tree
          const importTreeInput = document.getElementById('importTreeInput');
          if (importTreeInput) {
            importTreeInput.onchange = e => {
              const file = e.target.files[0];
              if (!file) return;
              const checkboxes = document.querySelectorAll('.tree-batch-checkbox');
              let idx = -1;
              checkboxes.forEach(cb => { if (cb.checked) idx = +cb.dataset.idx; });
              if (idx === -1) {
                alert('Select a tree to import into.');
                return;
              }
              const reader = new FileReader();
              reader.onload = evt => {
                try {
                  const data = JSON.parse(evt.target.result);
                  treeSnapshots[idx] = data;
                  if (idx === currentTreeIndex) {
                    loadSnapshot(data);
                    render();
                  }
                  renderTreesList();
                  saveToStorage();
                } catch (e) {
                  alert('Invalid tree file.');
                }
              };
              reader.readAsText(file);
              // Reset input so same file can be imported again if needed
              importTreeInput.value = '';
            };
          }
      // Batch DP button
      const btnBatchDP = document.getElementById('btnBatchDP');
      if (btnBatchDP) {
        btnBatchDP.onclick = async () => {
          const checkboxes = document.querySelectorAll('.tree-batch-checkbox');
          const selected = [];
          checkboxes.forEach(cb => { if (cb.checked) selected.push(+cb.dataset.idx); });
          if (selected.length === 0) {
            document.getElementById('batchDpResults').textContent = 'No trees selected.';
            return;
          }
          // Save current state to snapshot before batch
          if (treeSnapshots[currentTreeIndex]) {
            treeSnapshots[currentTreeIndex] = makeSnapshot();
          }
          const results = [];
          for (const idx of selected) {
            // Load snapshot into state
            loadSnapshot(treeSnapshots[idx]);
            // Run DP (simulate click)
            if (typeof runDP === 'function') await runDP();
            // Collect output (from output panel)
            const output = document.getElementById('textOutput').textContent;
            let entry = `<b>${treeSnapshots[idx].name||('Tree '+(idx+1))}:</b><br><pre>${output}</pre>`;
            // append special uppercase variables if any
            if (state.specialVars) {
              const caps = Object.keys(state.specialVars).filter(n => /^[A-Z][A-Z0-9_]*$/.test(n));
              if (caps.length) {
                entry += '<br><small>' + caps.map(n => `${n} = ${state.specialVars[n]}`).join(', ') + '</small>';
              }
            }
            results.push(entry);
          }
          // Restore current tree
          loadSnapshot(treeSnapshots[currentTreeIndex]);
          render();
          renderTreesList();
          document.getElementById('batchDpResults').innerHTML = results.join('<hr>');
        };
      }
    // Trees tab: Add Tree button
    const btnAddTree = document.getElementById('btnAddTree');
    if (btnAddTree) {
      btnAddTree.onclick = () => {
        // start from an empty tree instead of copying current state
        const snap = { nodes: [], edges: [], nextId: 1, isTree: true, isDirected: true, showEdgeW: false, display: {...state.display} };
        snap.name = 'Tree ' + (treeSnapshots.length + 1);
        treeSnapshots.push(snap);
        currentTreeIndex = treeSnapshots.length - 1;
        loadSnapshot(snap);  // switch to the new blank tree immediately
        // ensure no lingering DP results from previous tree
        state.dpResults = {};
        state.dpGroups = [];
        fullUpdate();
        renderTreesList();
        saveToStorage();
      };
    }
    // Initial render
    renderTreesList();
  window.addEventListener('resize', resize);
  console.log('bindEvents end');

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
      handleDpEditorKey(e);
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

  document.getElementById('btnAdd').onclick = () => { console.log('btnAdd clicked'); setMode('add'); };
  document.getElementById('btnConnect').onclick = () => { console.log('btnConnect clicked'); setMode('connect'); };
  document.getElementById('btnSelect').onclick = () => { console.log('btnSelect clicked'); setMode('select'); };

  document.getElementById('tglTreeContainer').onclick = () => toggle('isTree');
  document.getElementById('tglDirectedContainer').onclick = () => toggle('isDirected');
  document.getElementById('tglShowEdgeWContainer').onclick = () => toggle('showEdgeW');

  document.getElementById('btnUndo').onclick = () => { console.log('Undo'); undo(); };
  document.getElementById('btnRedo').onclick = () => { console.log('Redo'); redo(); };
  document.getElementById('btnBeautify').onclick = () => { console.log('Beautify'); beautifyTree(); };

  document.getElementById('btnOpenImport').onclick = () => document.getElementById('importModal').classList.add('active');
  document.getElementById('btnModalClose').onclick = () => document.getElementById('importModal').classList.remove('active');
  document.getElementById('btnModalImport').onclick = importData;
  document.getElementById('btnResetSave').onclick = resetStorage;

  document.getElementById('btnDelSel').onclick = () => { console.log('Delete selected'); deleteSelected(); };
  document.getElementById('btnRunDp').onclick = () => { console.log('RunDP'); runDP(); };
  document.getElementById('btnSaveFormula').onclick = () => { console.log('SaveFormula'); promptSaveFormula(); };
  document.getElementById('btnDeleteFormula').onclick = () => { console.log('DeleteFormula'); promptDeleteFormula(); };

  const btnEditorKeyMode = document.getElementById('btnEditorKeyMode');
  if (btnEditorKeyMode) {
    btnEditorKeyMode.onclick = () => {
      editorSettings.keyMode = editorSettings.keyMode === 'vscode' ? 'safe' : 'vscode';
      saveEditorSettings();
      updateEditorKeyModeButton();
    };
  }

  const dpParamInput = document.getElementById('dpParam');
  dpParamInput.oninput = e => { state.globalParam = parseFloat(e.target.value) || 0; };
  dpParamInput.onchange = e => { state.globalParam = parseFloat(e.target.value) || 0; };

  document.getElementById('btnCopy').onclick = () => {
    navigator.clipboard.writeText(document.getElementById('textOutput').textContent);
    const btn = document.getElementById('btnCopy');
    btn.textContent = 'Done'; setTimeout(() => btn.textContent = 'Copy', 1000);
  };

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

  // if no snapshots were present (fresh start) create one for the current empty state
  if (!window.treeSnapshots || window.treeSnapshots.length === 0) {
    const snap = makeSnapshot();
    snap.name = 'Tree 1';
    window.treeSnapshots = [snap];
    window.currentTreeIndex = 0;
    // load so that ephemeral fields are reset (multiSelected etc)
    loadSnapshot(snap);
  }

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
  // make sure any modal overlay is hidden (could be left from previous state)
  const importModal = document.getElementById('importModal');
  if (importModal) importModal.classList.remove('active');

  resize();
  bindEvents();
  loadEditorSettings();
  updateEditorKeyModeButton();
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
