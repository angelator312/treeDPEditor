// =============================================
// EDITOR SETTINGS
// =============================================
// Stored separately from graph state so they persist independently.
// Key: 'tree_dp_editor_settings'  (distinct from STORAGE_KEY)

const EDITOR_SETTINGS_KEY = 'tree_dp_editor_settings';

const editorSettings = {
  keyMode: 'vscode'   // 'vscode' | 'safe'
};

function loadEditorSettings() {
  try {
    const saved = localStorage.getItem(EDITOR_SETTINGS_KEY);
    if (saved) Object.assign(editorSettings, JSON.parse(saved));
  } catch (e) { /* keep defaults */ }
}

function saveEditorSettings() {
  try {
    localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(editorSettings));
  } catch (e) { /* ignore */ }
}

function updateEditorKeyModeButton() {
  const btn = document.getElementById('btnEditorKeyMode');
  if (!btn) return;
  if (editorSettings.keyMode === 'vscode') {
    btn.textContent = 'Keys: VS Code';
    btn.title = 'VS Code shortcuts active.\nCtrl+Shift+K – delete line\nAlt+↑/↓ – move line\nCtrl+Shift+D – duplicate line\nTab / Shift+Tab – indent\nClick to switch to Safe mode.';
  } else {
    btn.textContent = 'Keys: Safe';
    btn.title = 'Safe shortcuts active (no browser conflicts).\nCtrl+Shift+Backspace – delete line\nCtrl+Shift+↑/↓ – move line\nCtrl+Shift+D – duplicate line\nTab / Shift+Tab – indent\nClick to switch to VS Code mode.';
  }
}

// =============================================
// EDITOR OPERATIONS  (work on the #dpCode textarea)
// =============================================

// Returns line boundaries for the line that contains the cursor.
function _getLineRange(ta) {
  const text = ta.value;
  const pos  = ta.selectionStart;
  const lineStart   = text.lastIndexOf('\n', pos - 1) + 1;
  const lineEndIdx  = text.indexOf('\n', pos);          // -1 on last line
  const lineEnd     = lineEndIdx === -1 ? text.length : lineEndIdx;
  return { text, pos, lineStart, lineEnd, lineEndIdx };
}

// Replace the entire textarea content while registering a single undo step.
function _replaceAll(ta, newText, cursorPos) {
  ta.focus();
  ta.setSelectionRange(0, ta.value.length);
  if (!document.execCommand('insertText', false, newText)) {
    // execCommand unavailable (e.g. Firefox with dom.allow_cut_copy=false)
    ta.value = newText;
  }
  ta.setSelectionRange(cursorPos, cursorPos);
}

// Delete the current line (Ctrl+Shift+K / Ctrl+Shift+Backspace).
function editorDeleteLine(ta) {
  const { text, lineStart, lineEnd, lineEndIdx } = _getLineRange(ta);
  let from, to;
  if (lineEndIdx !== -1) {
    from = lineStart; to = lineEnd + 1;   // include trailing \n
  } else if (lineStart > 0) {
    from = lineStart - 1; to = lineEnd;   // include preceding \n (last line)
  } else {
    from = 0; to = lineEnd;               // only line
  }
  ta.focus();
  ta.setSelectionRange(from, to);
  if (!document.execCommand('delete')) {
    ta.value = text.slice(0, from) + text.slice(to);
  }
  const clamp = Math.min(from, ta.value.length);
  ta.setSelectionRange(clamp, clamp);
}

// Move current line one position up (Alt+↑ / Ctrl+Shift+↑).
function editorMoveLineUp(ta) {
  const { text, pos, lineStart, lineEnd, lineEndIdx } = _getLineRange(ta);
  if (lineStart === 0) return;                       // already at top
  const currentLine = text.slice(lineStart, lineEnd);
  const prevLineEnd   = lineStart - 1;               // index of \n before current
  const prevLineStart = text.lastIndexOf('\n', prevLineEnd - 1) + 1;
  const prevLine      = text.slice(prevLineStart, prevLineEnd);
  const suffix        = text.slice(lineEnd);         // \n + rest, or '' on last
  const newText = text.slice(0, prevLineStart) + currentLine + '\n' + prevLine + suffix;
  _replaceAll(ta, newText, prevLineStart + (pos - lineStart));
}

// Move current line one position down (Alt+↓ / Ctrl+Shift+↓).
function editorMoveLineDown(ta) {
  const { text, pos, lineStart, lineEnd, lineEndIdx } = _getLineRange(ta);
  if (lineEndIdx === -1) return;                     // already at bottom
  const currentLine    = text.slice(lineStart, lineEnd);
  const nextLineStart  = lineEnd + 1;
  const nextLineEndIdx = text.indexOf('\n', nextLineStart);
  const nextLineEnd    = nextLineEndIdx === -1 ? text.length : nextLineEndIdx;
  const nextLine       = text.slice(nextLineStart, nextLineEnd);
  const prefix         = text.slice(0, lineStart);
  const suffix         = text.slice(nextLineEnd);
  const newText = prefix + nextLine + '\n' + currentLine + suffix;
  _replaceAll(ta, newText, lineStart + nextLine.length + 1 + (pos - lineStart));
}

// Duplicate the current line below itself (Ctrl+Shift+D).
function editorDuplicateLine(ta) {
  const { text, pos, lineStart, lineEnd } = _getLineRange(ta);
  const currentLine = text.slice(lineStart, lineEnd);
  ta.focus();
  ta.setSelectionRange(lineEnd, lineEnd);
  const insertion = '\n' + currentLine;
  if (!document.execCommand('insertText', false, insertion)) {
    ta.value = text.slice(0, lineEnd) + insertion + text.slice(lineEnd);
  }
  ta.setSelectionRange(lineEnd + 1 + (pos - lineStart), lineEnd + 1 + (pos - lineStart));
}

// Indent / unindent with 2 spaces (Tab / Shift+Tab).
function editorHandleTab(ta, shift) {
  const INDENT = '  ';
  ta.focus();
  if (!shift) {
    if (!document.execCommand('insertText', false, INDENT)) {
      const s = ta.selectionStart;
      ta.value = ta.value.slice(0, s) + INDENT + ta.value.slice(ta.selectionEnd);
      ta.setSelectionRange(s + INDENT.length, s + INDENT.length);
    }
  } else {
    const text       = ta.value;
    const pos        = ta.selectionStart;
    const lineStart  = text.lastIndexOf('\n', pos - 1) + 1;
    const ahead      = text.slice(lineStart, lineStart + INDENT.length);
    const m          = ahead.match(/^ {1,2}/);
    if (m) {
      ta.setSelectionRange(lineStart, lineStart + m[0].length);
      if (!document.execCommand('delete')) {
        ta.value = text.slice(0, lineStart) + text.slice(lineStart + m[0].length);
      }
      ta.setSelectionRange(Math.max(lineStart, pos - m[0].length), Math.max(lineStart, pos - m[0].length));
    }
  }
}

// =============================================
// SHORTCUT DISPATCHER
// =============================================

// Called by the global keydown listener when #dpCode is the active element.
function handleDpEditorKey(e) {
  const ta = document.getElementById('dpCode');
  if (!ta || document.activeElement !== ta) return;

  const ctrl  = e.ctrlKey || e.metaKey;
  const shift = e.shiftKey;
  const alt   = e.altKey;

  // Tab / Shift+Tab: same in both modes
  if (e.key === 'Tab') {
    e.preventDefault();
    editorHandleTab(ta, shift);
    return;
  }

  if (editorSettings.keyMode === 'vscode') {
    // ── VS Code-style shortcuts ──────────────────────────────────────────
    if (ctrl && shift && !alt && e.key === 'K') {
      e.preventDefault(); editorDeleteLine(ta); return;
    }
    if (alt && !ctrl && !shift && e.key === 'ArrowUp') {
      e.preventDefault(); editorMoveLineUp(ta); return;
    }
    if (alt && !ctrl && !shift && e.key === 'ArrowDown') {
      e.preventDefault(); editorMoveLineDown(ta); return;
    }
    if (ctrl && shift && !alt && e.key === 'D') {
      e.preventDefault(); editorDuplicateLine(ta); return;
    }
  } else {
    // ── Safe-mode shortcuts (avoid common browser conflicts) ─────────────
    if (ctrl && shift && !alt && e.key === 'Backspace') {
      e.preventDefault(); editorDeleteLine(ta); return;
    }
    if (ctrl && shift && !alt && e.key === 'ArrowUp') {
      e.preventDefault(); editorMoveLineUp(ta); return;
    }
    if (ctrl && shift && !alt && e.key === 'ArrowDown') {
      e.preventDefault(); editorMoveLineDown(ta); return;
    }
    if (ctrl && shift && !alt && e.key === 'D') {
      e.preventDefault(); editorDuplicateLine(ta); return;
    }
  }
}
