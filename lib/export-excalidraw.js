// =============================================
// EXPORT: Excalidraw elements exporter
// =============================================
(function(){
  function randInt() { return Math.floor(Math.random()*0xfffffff); }
  function makeId(prefix){ return prefix + '_' + Date.now().toString(36) + '_' + Math.floor(Math.random()*1e6); }

  function makeEllipse(node, r, colors, textContent){
    const x = node.x - r, y = node.y - r, w = r*2, h = r*2;
    const ellipse = {
      id: makeId('e'),
      type: 'ellipse',
      x, y, width: w, height: h, angle: 0,
      strokeColor: colors.stroke || '#444',
      backgroundColor: '#ffffff',
      fillStyle: 'solid',
      strokeWidth: 1.5,
      roughness: 0,
      opacity: 100,
      seed: randInt(),
      version: 20,
      versionNonce: randInt(),
      isDeleted: false,
      groupIds: [],
      boundElements: [],
      index: 'a' + randInt().toString(36),
      strokeStyle: 'solid',
      frameId: null,
      roundness: null,
      updated: Date.now(),
      link: null,
      locked: false
    };
    if (textContent !== undefined) {
      ellipse.text = String(textContent);
    }
    return ellipse;
  }

  function makeArrow(p1, p2, colors, directed){
    const x = Math.min(p1.x, p2.x), y = Math.min(p1.y, p2.y);
    const obj = {
      id: makeId('a'),
      type: 'arrow',
      x, y,
      width: Math.abs(p2.x - p1.x) || 1,
      height: Math.abs(p2.y - p1.y) || 1,
      angle: 0,
      strokeColor: colors.stroke || '#666',
      backgroundColor: 'transparent',
      fillStyle: 'hachure',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
      seed: randInt(),
      version: 1,
      versionNonce: randInt(),
      isDeleted: false,
      groupIds: null,
      strokeSharpness: 'round',
      points: [ [p1.x - x, p1.y - y], [p2.x - x, p2.y - y] ]
    };
    if (directed) obj.arrowheadEnd = 'arrow';
    return obj;
  }

  function makeText(x, y, w, h, text, containerId){
    const textEl = {
      id: makeId('t'),
      type: 'text',
      x, y, width: w, height: h, angle: 0,
      strokeColor: '#1e1e1e',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 2,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      seed: randInt(),
      version: 4,
      versionNonce: randInt(),
      isDeleted: false,
      groupIds: [],
      frameId: null,
      roundness: null,
      updated: Date.now(),
      link: null,
      locked: false,
      text: String(text),
      fontSize: 20,
      fontFamily: 5,
      textAlign: 'center',
      verticalAlign: 'middle'
    };
    if (containerId !== undefined) {
      textEl.containerId = containerId;
      textEl.originalText = String(text);
      textEl.autoResize = true;
      textEl.lineHeight = 1.25;
    }
    return textEl;
  }

  // Export snapshot -> Excalidraw elements array (elements only per plan)
  window.exportSnapshotToExcalidraw = function(snapshot, opts){
    opts = opts || {};
    const scale = (typeof opts.scale === 'number') ? opts.scale : 1;
    const includeLabels = opts.includeLabels !== false;
    const nodes = snapshot.nodes || [];
    const edges = snapshot.edges || [];

    // colors: try read CSS vars from document, fallback to constants
    const cs = getComputedStyle(document.documentElement || document.body);
    const colors = { fill: cs.getPropertyValue('--card') || '#ffffff', stroke: cs.getPropertyValue('--border') || '#444' };

    const r = 20 * scale;
    const elements = [];

    // create node ellipse elements first (kept aside) so arrows can reference their ids
    const nodeElemMap = {}; // nodeId -> ellipse element
    const nodeBoundMap = {}; // nodeId -> array of bound elements
    nodes.forEach(n => {
      const el = makeEllipse(n, r, colors);
      // initialize bound list; will be filled when creating arrows
      nodeElemMap[n.id] = el;
      nodeBoundMap[n.id] = [];
    });

    // Edges (create arrows referencing node element ids)
    edges.forEach(e => {
      const a = nodes.find(n => n.id === (e.u || e.source || e.from));
      const b = nodes.find(n => n.id === (e.v || e.target || e.to));
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y; const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist, uy = dy / dist;
      const p1 = { x: a.x + ux * r, y: a.y + uy * r };
      const p2 = { x: b.x - ux * r, y: b.y - uy * r };
      const arrowEl = makeArrow(p1, p2, colors, !!snapshot.isDirected);

      // attach binding metadata
      const startBinding = {
        elementId: nodeElemMap[a.id].id,
        focus: Math.max(-1, Math.min(1, ( (p1.x - a.x) / r ))),
        gap: Math.round((Math.hypot(p1.x - a.x, p1.y - a.y) - r) * 1000)/1000
      };
      const endBinding = {
        elementId: nodeElemMap[b.id].id,
        focus: Math.max(-1, Math.min(1, ( (p2.x - b.x) / r ))),
        gap: Math.round((Math.hypot(p2.x - b.x, p2.y - b.y) - r) * 1000)/1000
      };
      arrowEl.startBinding = startBinding;
      arrowEl.endBinding = endBinding;

      // add edge weight as arrow.text when requested
      if (includeLabels && (e.w !== undefined || e.weight !== undefined)) {
        arrowEl.text = String(e.w !== undefined ? e.w : e.weight);
      }

      elements.push(arrowEl);

      // register boundElements on nodes
      nodeBoundMap[a.id].push({ id: arrowEl.id, type: 'arrow' });
      nodeBoundMap[b.id].push({ id: arrowEl.id, type: 'arrow' });
    });

    // Now append node elements (so they render above edges) and include boundElements
    nodes.forEach(n => {
      const el = nodeElemMap[n.id];
      if (!el) return;
      const bounds = nodeBoundMap[n.id] || [];
      
      // Create text element for node ID with containerId pointing to ellipse
      const textEl = makeText(n.x - 12, n.y - 8, 24, 20, n.id, el.id);
      el.text = String(n.id);
      
      // Add text element to ellipse's boundElements
      bounds.push({ type: 'text', id: textEl.id });
      
      if (bounds.length) el.boundElements = bounds;
      elements.push(el);
      elements.push(textEl);
      
      // Add weight labels (separate text elements outside ellipse)
      if (includeLabels) {
        const ws = n.weights || (n.weight !== undefined ? [n.weight] : []);
        if (ws && ws.length) {
          const lab = ws.length === 1 ? String(ws[0]) : ws.join(',');
          elements.push(makeText(n.x - 20, n.y + r + 4, 40, 14, lab));
        }
      }
    });

    return elements;
  };

  window.copyElementsToClipboard = async function(elements){
    try {
        const forExport = { type: 'excalidraw/clipboard', elements };
      await navigator.clipboard.writeText(JSON.stringify(forExport, null, 2));
      return true;
    } catch (e) {
      console.error('Clipboard write failed', e);
      return false;
    }
  };

  window.downloadElementsJSON = function(elements, filename){
    const blob = new Blob([JSON.stringify(elements, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'export.excalidraw.json';
    document.body.appendChild(a); a.click(); setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 150);
  };
})();
