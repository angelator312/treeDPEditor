// =============================================
// EXPORT: Excalidraw elements exporter
// =============================================
(function(){
  function randInt() { return Math.floor(Math.random()*0xfffffff); }
  function makeId(prefix){ return prefix + '_' + Date.now().toString(36) + '_' + Math.floor(Math.random()*1e6); }

  function makeEllipse(node, r, colors){
    const x = node.x - r, y = node.y - r, w = r*2, h = r*2;
    return {
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
      version: 1,
      versionNonce: randInt(),
      isDeleted: false,
      groupIds: null,
      strokeSharpness: 'sharp'
    };
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

  function makeText(x,y,w,h,text){
    return {
      id: makeId('t'),
      type: 'text',
      x, y, width: w, height: h, angle: 0,
      strokeColor: '#000000',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      roughness: 0,
      opacity: 100,
      seed: randInt(),
      version: 1,
      versionNonce: randInt(),
      isDeleted: false,
      groupIds: null,
      strokeSharpness: 'sharp',
      text: String(text),
      fontSize: 12,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle'
    };
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

    // map nodes by id for quick lookup
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    // Edges first (so they appear below nodes visually)
    edges.forEach(e => {
      const a = nodeMap[e.u] || nodeMap[e.source] || nodeMap[e.from];
      const b = nodeMap[e.v] || nodeMap[e.target] || nodeMap[e.to];
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y; const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist, uy = dy / dist;
      const p1 = { x: a.x + ux * r, y: a.y + uy * r };
      const p2 = { x: b.x - ux * r, y: b.y - uy * r };
      elements.push(makeArrow(p1, p2, colors, !!snapshot.isDirected));
      if (includeLabels && (e.w !== undefined || e.weight !== undefined)) {
        const wlabel = (e.w!==undefined?e.w:(e.weight!==undefined?e.weight:''));
        const mx = (p1.x + p2.x)/2, my = (p1.y + p2.y)/2;
        elements.push(makeText(mx - 20, my - 8, 40, 14, wlabel));
      }
    });

    // Nodes
    nodes.forEach(n => {
      elements.push(makeEllipse(n, r, colors));
      // always add compact id label centered inside node
      elements.push(makeText(n.x - 12, n.y - 8, 24, 20, n.id));
      if (includeLabels) {
        // add a small weight label under the node (concise)
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
