// =============================================
// STATE
// =============================================
console.log('state.js start');
const state = {
  nodes: [], edges: [], nextId: 1,
  mode: 'add', selected: null, connectSource: null, dragging: null,
  isTree: true, isDirected: true, showEdgeW: false,
  dpResults: {}, dpGroups: [],
  display: { id: true, val: true, childCount: false, isLeaf: false },
  dpFocused: false,
  multiSelected: new Set(),
  rubberBand: null,
  globalParam: 0
};
const hist = { stack: [], idx: -1 };
const STORAGE_KEY = 'tree_dp_editor_v2';
const MAX_TABLE_ROWS = 500;
let canvas, ctx, displayContainer;

// =============================================
// CUSTOM FORMULAS
// =============================================
const CUSTOM_FORMULAS_KEY = 'tree_dp_custom_formulas';
let customFormulas = {};

function loadCustomFormulas() {
  try {
    const saved = localStorage.getItem(CUSTOM_FORMULAS_KEY);
    if (saved) {
      customFormulas = JSON.parse(saved);
    }
  } catch (e) {
    customFormulas = {};
  }
}

function saveCustomFormulas() {
  try {
    localStorage.setItem(CUSTOM_FORMULAS_KEY, JSON.stringify(customFormulas));
  } catch (e) {
    console.error('Failed to save custom formulas:', e);
  }
}

function updateDropdownWithCustomFormulas() {
  const select = document.getElementById('dpExamples');
  // Remove old custom options
  const customOptions = Array.from(select.options).filter(opt => opt.dataset.custom === 'true');
  customOptions.forEach(opt => select.removeChild(opt));

  // Add separator if there are custom formulas
  if (Object.keys(customFormulas).length > 0) {
    const separator = document.createElement('option');
    separator.disabled = true;
    separator.textContent = '──────────';
    separator.dataset.custom = 'true';
    select.appendChild(separator);

    // Add custom formulas
    Object.keys(customFormulas).sort().forEach(key => {
      const opt = document.createElement('option');
      opt.value = 'custom_' + key;
      opt.textContent = '⭐ ' + key;
      opt.dataset.custom = 'true';
      select.appendChild(opt);
    });
  }
}

function promptSaveFormula() {
  const code = document.getElementById('dpCode').value.trim();
  if (!code) {
    alert('Please enter a formula first.');
    return;
  }

  let name = prompt('Enter a name for this formula:', '');
  if (!name) return;

  name = name.trim();
  if (name === '') return;

  // Check if name conflicts with built-in examples
  if (EXAMPLES[name]) {
    alert('This name conflicts with a built-in example. Please choose a different name.');
    return;
  }

  customFormulas[name] = code;
  saveCustomFormulas();
  updateDropdownWithCustomFormulas();
  alert('Successfully saved formula: ' + name);
}

function promptDeleteFormula() {
  if (Object.keys(customFormulas).length === 0) {
    alert('No custom formulas to delete.');
    return;
  }

  const names = Object.keys(customFormulas).sort();
  let message = 'Enter the name of the formula to delete:\n\n';
  names.forEach((name, idx) => {
    message += (idx + 1) + '. ' + name + '\n';
  });

  const name = prompt(message, '');
  if (!name) return;

  const trimmedName = name.trim();
  if (customFormulas[trimmedName]) {
    if (confirm('Delete formula "' + trimmedName + '"?')) {
      delete customFormulas[trimmedName];
      saveCustomFormulas();
      updateDropdownWithCustomFormulas();
      alert('Successfully deleted formula: ' + trimmedName);
    }
  } else {
    alert('Formula not found: ' + trimmedName);
  }
}

// =============================================
// STORAGE
// =============================================

// Helper used by both the tree manager and storage layer. Takes the
// current `state` object and returns a plain-JSON snapshot that omits
// transient fields (Sets, selections, drag state etc) so it can be
// safely stringified/parsed later.
function makeSnapshot() {
  const snap = JSON.parse(JSON.stringify(state));
  // transient/unsafe properties
  delete snap.multiSelected;
  delete snap.selected;
  delete snap.connectSource;
  delete snap.dragging;
  delete snap.rubberBand;
  // dpResults/dpGroups are recalculated on load, but keeping them is
  // harmless; we just clear them when restoring.
  return snap;
}
// ensure global symbol for other scripts
window.makeSnapshot = makeSnapshot;
console.log('makeSnapshot defined');

// Sanitize an arbitrary snapshot-like object by stripping transient
// fields.  Used when importing or when loading from storage so older
// snapshots don't bring along broken properties.
function sanitizeSnapshot(raw) {
  const snap = JSON.parse(JSON.stringify(raw));
  delete snap.multiSelected;
  delete snap.selected;
  delete snap.connectSource;
  delete snap.dragging;
  delete snap.rubberBand;
  return snap;
}

// Load a snapshot back into `state`, resetting all ephemeral values and
// ensuring `multiSelected` is a Set (JSON drops it).
function loadSnapshot(snap) {
  Object.assign(state, JSON.parse(JSON.stringify(snap || {})));
  state.multiSelected = new Set();
  state.selected = null;
  state.connectSource = null;
  state.dragging = null;
  state.rubberBand = null;
  // dpResults and dpGroups are carried along in the snapshot so we
  // leave them intact. They will be recalculated when the user runs
  // DP again, but preserving them allows switching back to a previously
  // evaluated tree without rerunning.
}

function saveToStorage() {
  try {
    // Save all trees and current index
    if (window.treeSnapshots && window.treeSnapshots.length > 0) {
      // Save current state to its snapshot before persisting
      window.treeSnapshots[window.currentTreeIndex] = makeSnapshot();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        treeSnapshots: window.treeSnapshots,
        currentTreeIndex: window.currentTreeIndex,
        dpCode: document.getElementById('dpCode').value,
        display: state.display
      }));
    } else {
      // Fallback: save just current state
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        nodes: state.nodes, edges: state.edges, nextId: state.nextId,
        isTree: state.isTree, isDirected: state.isDirected, showEdgeW: state.showEdgeW,
        dpCode: document.getElementById('dpCode').value, display: state.display
      }));
    }
  } catch (e) { /* ignore */ }
}

function migrateNodes(nodes) {
  (nodes || []).forEach(n => {
    if (n.weights === undefined) { n.weights = [n.weight !== undefined ? n.weight : 0]; delete n.weight; }
  });
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    const data = JSON.parse(saved);
    if (data.treeSnapshots && Array.isArray(data.treeSnapshots)) {
      // copy over snapshots; sanitize in case older versions stored
      // transient properties or Sets that JSON can't handle.
      window.treeSnapshots = (data.treeSnapshots || []).map(s => sanitizeSnapshot(s));
      window.currentTreeIndex = typeof data.currentTreeIndex === 'number' ? data.currentTreeIndex : 0;
      // Load selected tree into state using helper so sets get recreated
      loadSnapshot(window.treeSnapshots[window.currentTreeIndex]);
      document.getElementById('dpCode').value = data.dpCode || '';
      state.display = { ...state.display, ...data.display };
      document.getElementById('tglTree').classList.toggle('active', state.isTree);
      document.getElementById('tglDirected').classList.toggle('active', state.isDirected);
      document.getElementById('tglShowEdgeW').classList.toggle('active', state.showEdgeW);
      document.getElementById('dpWarning').classList.toggle('hidden', state.isTree);
      quickParseDpDefs(data.dpCode);
      if (typeof renderTreesList === 'function') renderTreesList();
      return true;
    } else {
      // Fallback: load just current state
      state.nodes = data.nodes || [];
      migrateNodes(state.nodes);
      state.edges = data.edges || [];
      state.nextId = data.nextId || 1;
      state.isTree = data.isTree !== undefined ? data.isTree : true;
      state.isDirected = data.isDirected !== undefined ? data.isDirected : true;
      state.showEdgeW = data.showEdgeW || false;
      state.display = { ...state.display, ...data.display };
      document.getElementById('dpCode').value = data.dpCode || '';
      document.getElementById('tglTree').classList.toggle('active', state.isTree);
      document.getElementById('tglDirected').classList.toggle('active', state.isDirected);
      document.getElementById('tglShowEdgeW').classList.toggle('active', state.showEdgeW);
      document.getElementById('dpWarning').classList.toggle('hidden', state.isTree);
      quickParseDpDefs(data.dpCode);
      return true;
    }
  } catch (e) { return false; }
}

function resetStorage() { localStorage.removeItem(STORAGE_KEY); location.reload(); }

// =============================================
// HISTORY
// =============================================
const saveHistory = () => {
  hist.stack = hist.stack.slice(0, hist.idx + 1);
  hist.stack.push(JSON.stringify({ nodes: state.nodes, edges: state.edges, nextId: state.nextId }));
  hist.idx++;
  if (hist.stack.length > 30) { hist.stack.shift(); hist.idx--; }
  saveToStorage();
};
const undo = () => {
  if (hist.idx > 0) {
    hist.idx--;
    const snap = JSON.parse(hist.stack[hist.idx]);
    state.nodes = snap.nodes; migrateNodes(state.nodes); state.edges = snap.edges; state.nextId = snap.nextId;
    state.selected = null; state.multiSelected = new Set(); state.dpResults = {}; fullUpdate();
  }
};
const redo = () => {
  if (hist.idx < hist.stack.length - 1) {
    hist.idx++;
    const snap = JSON.parse(hist.stack[hist.idx]);
    state.nodes = snap.nodes; migrateNodes(state.nodes); state.edges = snap.edges; state.nextId = snap.nextId;
    state.selected = null; state.multiSelected = new Set(); state.dpResults = {}; fullUpdate();
  }
};
