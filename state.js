// =============================================
// STATE
// =============================================
const state = {
  nodes: [], edges: [], nextId: 1,
  mode: 'add', selected: null, connectSource: null, dragging: null,
  isTree: true, isDirected: true, showEdgeW: false,
  dpResults: {}, dpGroups: [],
  display: { id: true, val: true, childCount: false, isLeaf: false },
  dpFocused: false,
  multiSelected: new Set(),
  rubberBand: null
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
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      nodes: state.nodes, edges: state.edges, nextId: state.nextId,
      isTree: state.isTree, isDirected: state.isDirected, showEdgeW: state.showEdgeW,
      dpCode: document.getElementById('dpCode').value, display: state.display
    }));
  } catch (e) { /* ignore */ }
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    const data = JSON.parse(saved);
    state.nodes = data.nodes || [];
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
    state.nodes = snap.nodes; state.edges = snap.edges; state.nextId = snap.nextId;
    state.selected = null; state.multiSelected = new Set(); state.dpResults = {}; fullUpdate();
  }
};
const redo = () => {
  if (hist.idx < hist.stack.length - 1) {
    hist.idx++;
    const snap = JSON.parse(hist.stack[hist.idx]);
    state.nodes = snap.nodes; state.edges = snap.edges; state.nextId = snap.nextId;
    state.selected = null; state.multiSelected = new Set(); state.dpResults = {}; fullUpdate();
  }
};
