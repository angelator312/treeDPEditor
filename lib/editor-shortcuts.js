// =============================================
// EDITOR SHORTCUTS
// =============================================
// Helper utilities for manipulating textarea content (lines/blocks)
(function(){
  function getLineBounds(text, index) {
    if (index < 0) index = 0;
    if (index > text.length) index = text.length;
    const startNL = text.lastIndexOf('\n', index - 1);
    const start = startNL === -1 ? 0 : startNL + 1;
    const nextNL = text.indexOf('\n', index);
    const end = nextNL === -1 ? text.length : nextNL + 1;
    return { start, end };
  }

  function getSelectionBlockBounds(text, selStart, selEnd) {
    // ensure selEnd refers to last character in selection
    if (selEnd > 0 && selStart!=selEnd) selEnd = selEnd - 1;
    const first = getLineBounds(text, selStart);
    const last = getLineBounds(text, selEnd);
    return { start: first.start, end: last.end };
  }
  function deleteLineOrSelection(textarea) {
    const text = textarea.value;
    const s = textarea.selectionStart, e = textarea.selectionEnd;
    const { start, end } = getSelectionBlockBounds(text, s, e);
    // if empty selection but single empty line, still remove line
    saveHistory();
    const before = text.slice(0, start);
    const after = text.slice(end);
    textarea.value = before + after;
    textarea.selectionStart = textarea.selectionEnd = start;
    return true;
  }

  function moveBlock(textarea, dir /* 'up'|'down' */) {
    const text = textarea.value;
    const s = textarea.selectionStart, e = textarea.selectionEnd;
    const { start, end } = getSelectionBlockBounds(text, s, e);
    if (dir === 'up') {
      // find previous block bounds
      if (start === 0) return false;
      const prevEnd = start; // includes newline
      const prevStartNL = text.lastIndexOf('\n', start - 2);
      const prevStart = prevStartNL === -1 ? 0 : prevStartNL + 1;
      const prevBlock = text.slice(prevStart, prevEnd);
      const curBlock = text.slice(start, end);
      const beforePrev = text.slice(0, prevStart);
      const afterCur = text.slice(end);
      saveHistory();
      const needsSep = (a, b) => (a.length > 0 && b.length > 0 && a[a.length - 1] !== '\n' && b[0] !== '\n');
      const sep = needsSep(curBlock, prevBlock) ? '\n' : '';
      textarea.value = beforePrev + curBlock + sep + prevBlock + afterCur;
      // set selection to where the block moved
      const newStart = beforePrev.length;
      textarea.selectionStart = newStart;
      textarea.selectionEnd = newStart + curBlock.length;
      return true;
    } else {
      // move down
      if (end >= text.length) return false;
      const nextStart = end;
      const nextEndNL = text.indexOf('\n', nextStart);
      const nextEnd = nextEndNL === -1 ? text.length : nextEndNL + 1;
      const nextBlock = text.slice(nextStart, nextEnd);
      const curBlock = text.slice(start, end);
      const before = text.slice(0, start);
      const afterNext = text.slice(nextEnd);
      saveHistory();
      const needsSep = (a, b) => (a.length > 0 && b.length > 0 && a[a.length - 1] !== '\n' && b[0] !== '\n');
      const sep = needsSep(nextBlock, curBlock) ? '\n' : '';
      textarea.value = before + nextBlock + sep + curBlock + afterNext;
      const newStart = before.length + nextBlock.length + (sep ? 1 : 0);
      textarea.selectionStart = newStart;
      textarea.selectionEnd = newStart + curBlock.length;
      return true;
    }
  }

  // public setup function: attach key handler to textarea
  window.setupEditorShortcuts = function(textarea) {
    if (!textarea) return;
    textarea.addEventListener('keydown', e => {
      try {
        const mode = (window.editorSettings && window.editorSettings.editorKeyMode) || 'common';
        const meta = e.metaKey, ctrl = e.ctrlKey, alt = e.altKey, shift = e.shiftKey;
        // mapping based on mode
        // Delete line: Ctrl+Shift+K or Meta+Shift+K (common), safe: require Ctrl+Shift+K
        if (( (ctrl || meta) && shift && (e.key === 'k' || e.key === 'K')) || (mode === 'safe' && ctrl && shift && (e.key === 'k' || e.key === 'K'))) {
          e.preventDefault();
          deleteLineOrSelection(textarea);
          return;
        }
        // Move up/down: common => Alt+ArrowUp/Down ; safe => Ctrl+Alt+Arrow
        if (((alt && !ctrl) && e.key === 'ArrowUp' && mode === 'common') || ((alt && ctrl) && e.key === 'ArrowUp' && mode === 'safe')) {
          e.preventDefault();
          moveBlock(textarea, 'up');
          return;
        }
        if (((alt && !ctrl) && e.key === 'ArrowDown' && mode === 'common') || ((alt && ctrl) && e.key === 'ArrowDown' && mode === 'safe')) {
          e.preventDefault();
          moveBlock(textarea, 'down');
          return;
        }
      } catch (err) { console.error('editor-shortcuts error', err); }
    });
  };
})();
