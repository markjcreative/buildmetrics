/**
 * Canvas.js — Report Builder Canvas Manager
 *
 * Manages the canvas state, drag-to-reorder (SortableJS), API persistence,
 * and block shell rendering for the Engineering Canvas Report Builder.
 *
 * Exposes:
 *   Canvas.init(containerEl, reportData, options?)
 *   Canvas.addBlock(type, configOverride?, insertAfterIndex?)
 *   Canvas.removeBlock(id)
 *   Canvas.save()
 *   Canvas.getState()
 *   Canvas.getChecksData()
 *   Canvas.applyTemplate(templateBlocks)
 */

const Canvas = (() => {

  let _reportId    = null;
  let _blocks      = [];        // array of block data objects
  let _containerEl = null;
  let _saveTimeout = null;
  let _onSaveStatus = null;     // fn('saving' | 'saved' | 'error')
  let _dirty       = new Set(); // block ids that need saving

  const API = '/api/report-blocks.php';

  // ── Utilities ─────────────────────────────────────────────────────────

  function _uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function _setSaveStatus(status) {
    if (typeof _onSaveStatus === 'function') _onSaveStatus(status);
  }

  function _coerceBlock(raw) {
    return {
      ...raw,
      config: typeof raw.config === 'string'
        ? (JSON.parse(raw.config || '{}') || {})
        : (raw.config || {}),
      results: typeof raw.results === 'string'
        ? (JSON.parse(raw.results || '{}') || {})
        : (raw.results || {}),
      validated: Boolean(raw.validated),
      _dirty: false,
    };
  }

  // ── Canvas shell HTML for a block ─────────────────────────────────────

  function _buildBlockShell(block) {
    const def = BlockRegistry.getDefinition(block.type) || { icon: '◻', label: block.type };

    const shell = document.createElement('div');
    shell.className = 'canvas-block';
    shell.dataset.id = block.id;
    shell.dataset.type = block.type;

    // Determine status indicator
    let statusHTML = '';
    if (block.type.startsWith('calc_')) {
      if (block.validated && block.results && block.results._ran) {
        statusHTML = '<span class="block-status-dot dot-pass" title="Calculated"></span>';
      } else {
        statusHTML = '<span class="block-status-dot dot-pending" title="Not yet calculated"></span>';
      }
    }

    shell.innerHTML = `
      <div class="canvas-block-header">
        <span class="canvas-block-drag" title="Drag to reorder">⠿</span>
        <span class="canvas-block-icon">${def.icon}</span>
        <span class="canvas-block-label">${_escHTML(block.label || def.label)}</span>
        ${statusHTML}
        <div class="canvas-block-header-actions">
          <button class="canvas-block-btn btn-collapse" title="Collapse/Expand" data-action="collapse">−</button>
          <button class="canvas-block-btn btn-delete" title="Delete block" data-action="delete">✕</button>
        </div>
      </div>
      <div class="canvas-block-body" id="cbody-${block.id}"></div>
    `;

    // Inject rendered body
    const bodyEl = shell.querySelector('.canvas-block-body');
    try {
      const bodyContent = BlockRegistry.render(block);
      if (bodyContent instanceof HTMLElement) bodyEl.appendChild(bodyContent);
      else bodyEl.innerHTML = bodyContent;
    } catch (err) {
      bodyEl.innerHTML = '<p style="color:#dc2626;font-size:0.8rem;">Render error: ' + _escHTML(err.message) + '</p>';
      console.error('Block render error', block.type, err);
    }

    // Collapse/expand button
    shell.querySelector('[data-action="collapse"]').addEventListener('click', () => {
      const isCollapsed = bodyEl.classList.toggle('collapsed');
      shell.querySelector('[data-action="collapse"]').textContent = isCollapsed ? '+' : '−';
    });

    // Delete button
    shell.querySelector('[data-action="delete"]').addEventListener('click', () => {
      removeBlock(block.id);
    });

    return shell;
  }

  function _escHTML(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Render all blocks ─────────────────────────────────────────────────

  function _render() {
    if (!_containerEl) return;

    // Save scroll position
    const scrollTop = _containerEl.scrollTop;

    _containerEl.innerHTML = '';

    if (_blocks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'canvas-empty';
      empty.innerHTML = '<p>No blocks yet. Drag blocks from the sidebar or click <strong>+ Add Block</strong>.</p>';
      _containerEl.appendChild(empty);
    }

    _blocks.forEach(block => {
      _containerEl.appendChild(_buildBlockShell(block));
    });

    // Add block button
    const addBtnWrap = document.createElement('div');
    addBtnWrap.className = 'canvas-add-btn-wrap';
    const addBtn = document.createElement('button');
    addBtn.className = 'canvas-add-btn';
    addBtn.textContent = '+ Add Block';
    addBtn.addEventListener('click', () => {
      // Dispatch event — report-builder.html opens the sidebar or a picker
      document.dispatchEvent(new CustomEvent('canvas:add-block-request', { detail: { insertAfterIndex: _blocks.length - 1 } }));
    });
    addBtnWrap.appendChild(addBtn);
    _containerEl.appendChild(addBtnWrap);

    // Restore scroll
    _containerEl.scrollTop = scrollTop;

    // Re-init sortable after re-render
    _initSortable();
  }

  // ── Sortable ──────────────────────────────────────────────────────────

  function _initSortable() {
    if (!window.Sortable) return;
    if (_containerEl._sortable) _containerEl._sortable.destroy();

    _containerEl._sortable = Sortable.create(_containerEl, {
      animation: 150,
      handle: '.canvas-block-drag',
      ghostClass: 'canvas-block-ghost',
      chosenClass: 'canvas-block-chosen',
      dragClass: 'canvas-block-dragging',
      group: {
        name: 'canvas',
        pull: false,
        put: 'sidebar', // accepts from sidebar group
      },
      onEnd(evt) {
        // Reorder _blocks to match DOM order
        const newOrder = [];
        _containerEl.querySelectorAll('.canvas-block[data-id]').forEach(el => {
          const found = _blocks.find(b => String(b.id) === el.dataset.id);
          if (found) newOrder.push(found);
        });
        _blocks = newOrder;
        _debouncedSave();
      },
      onAdd(evt) {
        // Item dragged from sidebar
        const type = evt.item.dataset.blockType;
        if (!type) return;

        // Remove the sidebar clone that sortable placed
        evt.item.remove();

        // Find insertion position from DOM
        let insertIdx = _blocks.length;
        const siblings = _containerEl.querySelectorAll('.canvas-block[data-id]');
        siblings.forEach((el, i) => {
          if (el === evt.item) insertIdx = i;
        });

        addBlock(type, {}, insertIdx);
      },
    });
  }

  // ── Block listen for changes ──────────────────────────────────────────

  function _listenBlockChanges() {
    _containerEl.addEventListener('block-change', (e) => {
      const id = e.detail && e.detail.id;
      if (id) {
        _dirty.add(String(id));
        _updateChecksBlock();
      }
      _debouncedSave();
    });
  }

  function _updateChecksBlock() {
    const checksBlock = _blocks.find(b => b.type === 'checks_summary');
    if (!checksBlock) return;
    const checks = getChecksData();
    checksBlock.results = { checks };
    // Re-render just this block's body
    const bodyEl = _containerEl.querySelector('#cbody-' + checksBlock.id);
    if (bodyEl) {
      try {
        const bodyContent = BlockRegistry.render(checksBlock);
        bodyEl.innerHTML = '';
        if (bodyContent instanceof HTMLElement) bodyEl.appendChild(bodyContent);
        else bodyEl.innerHTML = bodyContent;
      } catch (_) {}
    }
  }

  // ── API calls ─────────────────────────────────────────────────────────

  async function _apiPost(data) {
    const headers = window.Auth ? Auth.authHeaders() : { 'Content-Type': 'application/json' };
    const resp = await fetch(API, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error('API error: ' + resp.status);
    return resp.json();
  }

  async function _reorder() {
    try {
      await _apiPost({
        action: 'reorder',
        report_id: _reportId,
        order: _blocks.map((b, i) => ({ id: b.id, order_index: i })),
      });
    } catch (err) {
      console.warn('Reorder save failed:', err);
    }
  }

  // ── Debounced save ────────────────────────────────────────────────────

  function _debouncedSave() {
    clearTimeout(_saveTimeout);
    _saveTimeout = setTimeout(() => save(), 2000);
  }

  // ── Public: init ─────────────────────────────────────────────────────

  async function init(containerEl, reportData, { onSaveStatus } = {}) {
    _containerEl = containerEl;
    _reportId = reportData.id;
    _onSaveStatus = onSaveStatus || null;

    _blocks = (reportData.blocks || [])
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      .map(_coerceBlock);

    _render();
    _listenBlockChanges();
  }

  // ── Public: addBlock ─────────────────────────────────────────────────

  async function addBlock(type, configOverride = {}, insertAfterIndex = null) {
    const def = BlockRegistry.getDefinition(type);
    if (!def) { console.warn('Unknown block type:', type); return null; }

    const tempId = _uuid();
    const block = _coerceBlock({
      id: tempId,
      type,
      label: def.label,
      config: { ...configOverride },
      results: {},
      validated: false,
      order_index: _blocks.length,
    });

    if (insertAfterIndex != null && insertAfterIndex >= 0 && insertAfterIndex < _blocks.length) {
      _blocks.splice(insertAfterIndex + 1, 0, block);
    } else {
      _blocks.push(block);
    }

    _render();

    // Scroll to new block
    setTimeout(() => {
      const el = _containerEl.querySelector('[data-id="' + tempId + '"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

    // Persist to API
    try {
      const resp = await _apiPost({
        action: 'create',
        report_id: _reportId,
        type,
        label: def.label,
        order_index: _blocks.indexOf(block),
        config_json: JSON.stringify(block.config),
        results_json: '{}',
        validated: 0,
      });
      if (resp && resp.id) {
        // Replace temp id with real id
        block.id = resp.id;
        const el = _containerEl.querySelector('[data-id="' + tempId + '"]');
        if (el) { el.dataset.id = resp.id; const bodyEl = el.querySelector('.canvas-block-body'); if (bodyEl) bodyEl.id = 'cbody-' + resp.id; }
      }
    } catch (err) {
      console.warn('addBlock API call failed:', err);
    }

    return block;
  }

  // ── Public: removeBlock ──────────────────────────────────────────────

  async function removeBlock(id) {
    if (!window.confirm('Delete this block? This cannot be undone.')) return;
    const idx = _blocks.findIndex(b => String(b.id) === String(id));
    if (idx === -1) return;
    _blocks.splice(idx, 1);
    _dirty.delete(String(id));
    _render();

    try {
      await _apiPost({ action: 'delete', id });
    } catch (err) {
      console.warn('removeBlock API call failed:', err);
    }
  }

  // ── Public: save ──────────────────────────────────────────────────────

  async function save() {
    if (_dirty.size === 0 && _blocks.every(b => !b._dirty)) {
      await _reorder();
      return;
    }
    _setSaveStatus('saving');
    try {
      const dirtyBlocks = _blocks.filter(b => _dirty.has(String(b.id)));
      await Promise.all(dirtyBlocks.map(block =>
        _apiPost({
          action: 'update',
          id: block.id,
          config_json: JSON.stringify(block.config),
          results_json: JSON.stringify(block.results),
          validated: block.validated ? 1 : 0,
        }).catch(e => console.warn('Block save failed', block.id, e))
      ));
      await _reorder();
      _dirty.clear();
      _setSaveStatus('saved');
    } catch (err) {
      console.error('Canvas save error:', err);
      _setSaveStatus('error');
    }
  }

  // ── Public: getState ─────────────────────────────────────────────────

  function getState() {
    return { report_id: _reportId, blocks: _blocks };
  }

  // ── Public: getChecksData ────────────────────────────────────────────

  function getChecksData() {
    const checks = [];
    _blocks.forEach(block => {
      if (!block.type.startsWith('calc_')) return;
      if (!block.results || !block.results._ran) return;
      const extracted = BlockRegistry._extractChecks(block);
      checks.push(...extracted.map(c => ({ ...c, calcType: block.type, label: block.label || block.type })));
    });
    return checks;
  }

  // ── Public: applyTemplate ────────────────────────────────────────────

  async function applyTemplate(templateBlocks) {
    if (!window.confirm('Apply this template? Current blocks will be cleared.')) return;
    // Delete all existing blocks
    try {
      await Promise.all(_blocks.map(b => _apiPost({ action: 'delete', id: b.id }).catch(() => {})));
    } catch (_) {}
    _blocks = [];

    for (let i = 0; i < templateBlocks.length; i++) {
      const tb = templateBlocks[i];
      await addBlock(tb.type, tb.config || {});
    }
  }

  return { init, addBlock, removeBlock, save, getState, getChecksData, applyTemplate };

})();

window.Canvas = Canvas;
if (typeof module !== 'undefined') module.exports = Canvas;
