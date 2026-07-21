/* BuildMetrics — Command Palette Module
   Opens with Cmd+K (wired in sidebar.js) or CmdPalette.open().
   Provides fuzzy search across all app pages and recent history.
*/
const CmdPalette = (() => {

  // ─── Static item definitions ─────────────────────────────
  const STATIC_ITEMS = [
    // CALCULATORS
    { group: 'Calculators', name: 'Beam Analysis',   href: '/index.html',                 icon: '🔵', color: '#EFF6FF' },
    { group: 'Calculators', name: 'Column Design',   href: '/calcs/column.html',           icon: '🟠', color: '#FFFBEB' },
    { group: 'Calculators', name: 'RC Slab',         href: '/calcs/slab.html',             icon: '🟢', color: '#F0FDF4' },
    { group: 'Calculators', name: 'Pad Footing',     href: '/calcs/footing.html',          icon: '🟣', color: '#F5F3FF' },
    { group: 'Calculators', name: 'Retaining Wall',  href: '/calcs/retaining-wall.html',   icon: '🔴', color: '#FEF2F2' },
    { group: 'Calculators', name: 'Connection',      href: '/calcs/connection.html',       icon: '🔷', color: '#ECFEFF' },
    // WORKSPACE
    { group: 'Workspace',   name: 'Quick Tools',     href: '/tools.html',                  icon: '🔧', color: '#F4F4F5' },
    { group: 'Workspace',   name: 'Standards Library', href: '/standards.html',            icon: '📚', color: '#F4F4F5' },
    { group: 'Workspace',   name: 'Templates',       href: '/templates.html',              icon: '📋', color: '#F4F4F5' },
    { group: 'Workspace',   name: 'Help & Support',  href: '/support.html',                icon: '💬', color: '#EFF6FF' },
    // NAVIGATE
    { group: 'Navigate',    name: 'Dashboard',       href: '/dashboard.html',              icon: '🏠', color: '#F4F4F5' },
    { group: 'Navigate',    name: 'Projects',        href: '/projects.html',               icon: '📁', color: '#F4F4F5' },
    { group: 'Navigate',    name: 'History',         href: '/history.html',                icon: '🕐', color: '#F4F4F5' },
    { group: 'Navigate',    name: 'Profile',         href: '/profile.html',                icon: '👤', color: '#F4F4F5' },
  ];

  // Map calcType keys from history to readable names
  const CALC_TYPE_NAMES = {
    beam: 'Beam Analysis',
    column: 'Column Design',
    slab: 'RC Slab',
    footing: 'Pad Footing',
    'retaining-wall': 'Retaining Wall',
    connection: 'Connection',
  };

  const CALC_TYPE_HREFS = {
    beam: '/index.html',
    column: '/calcs/column.html',
    slab: '/calcs/slab.html',
    footing: '/calcs/footing.html',
    'retaining-wall': '/calcs/retaining-wall.html',
    connection: '/calcs/connection.html',
  };

  // ─── State ───────────────────────────────────────────────
  let _overlay = null;
  let _input = null;
  let _results = null;
  let _allItems = [];
  let _filteredItems = [];
  let _selectedIdx = -1;
  let _isOpen = false;

  // ─── Public API ──────────────────────────────────────────
  function open() {
    _ensureDOM();
    _buildItems();
    _overlay.classList.add('open');
    _isOpen = true;
    _input.value = '';
    _selectedIdx = -1;
    _render(_allItems);
    setTimeout(function() { _input.focus(); }, 50);
  }

  function close() {
    if (!_overlay) return;
    _overlay.classList.remove('open');
    _isOpen = false;
  }

  // ─── DOM setup (lazy, injected once) ─────────────────────
  function _ensureDOM() {
    if (_overlay) return;

    _overlay = document.createElement('div');
    _overlay.id = 'cmd-palette-overlay';
    _overlay.innerHTML =
      '<div class="cmd-palette">' +
        '<div class="cmd-input-wrap">' +
          '<svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M21 21l-4.35-4.35"/></svg>' +
          '<input id="cmd-input" type="text" placeholder="Search calculators, tools, pages\u2026" autocomplete="off" spellcheck="false"/>' +
          '<button class="cmd-esc" id="cmd-esc-btn">esc</button>' +
        '</div>' +
        '<div class="cmd-results" id="cmd-results"></div>' +
      '</div>';

    document.body.appendChild(_overlay);

    _input   = _overlay.querySelector('#cmd-input');
    _results = _overlay.querySelector('#cmd-results');

    // Close on overlay background click
    _overlay.addEventListener('click', function(e) {
      if (e.target === _overlay) close();
    });

    // Close on Esc button click
    _overlay.querySelector('#cmd-esc-btn').addEventListener('click', close);

    // Search input
    _input.addEventListener('input', function() {
      _selectedIdx = -1;
      var q = _input.value.trim();
      _filteredItems = q ? _filterItems(q) : _allItems;
      _render(_filteredItems);
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (!_isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _selectedIdx = Math.min(_selectedIdx + 1, _countNavigableItems() - 1);
        _updateSelection();
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        _selectedIdx = Math.max(_selectedIdx - 1, 0);
        _updateSelection();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        var selected = _results.querySelector('.cmd-item.cmd-selected');
        if (selected && selected.dataset.href) {
          close();
          window.location.href = selected.dataset.href;
        }
      }
    });
  }

  // ─── Build item list (static + recent) ───────────────────
  function _buildItems() {
    _allItems = STATIC_ITEMS.slice();

    // Append recent items from bcp_history
    try {
      var raw = localStorage.getItem('bcp_history');
      if (raw) {
        var history = JSON.parse(raw);
        if (Array.isArray(history)) {
          var recent = history.slice(0, 5);
          recent.forEach(function(entry) {
            var calcType = entry.config && entry.config.calcType ? entry.config.calcType : '';
            var href = CALC_TYPE_HREFS[calcType] || '/index.html';
            var label = entry.name || (CALC_TYPE_NAMES[calcType] || 'Calculation');
            var projectNote = entry.projectId ? 'Project #' + entry.projectId : 'Recent';
            _allItems.push({
              group: 'Recent',
              name: label,
              href: href,
              icon: '🕐',
              color: '#F4F4F5',
              meta: projectNote,
            });
          });
        }
      }
    } catch (e) {
      // silently ignore malformed history
    }
  }

  // ─── Filter ───────────────────────────────────────────────
  function _filterItems(q) {
    var lower = q.toLowerCase();
    return _allItems.filter(function(item) {
      return item.name.toLowerCase().indexOf(lower) !== -1;
    });
  }

  // ─── Render results ───────────────────────────────────────
  function _render(items) {
    if (!items || items.length === 0) {
      _results.innerHTML = '<div class="cmd-empty">No results for &ldquo;' + _escHtml(_input.value) + '&rdquo;</div>';
      return;
    }

    // Group items
    var groups = {};
    var groupOrder = [];
    items.forEach(function(item) {
      if (!groups[item.group]) {
        groups[item.group] = [];
        groupOrder.push(item.group);
      }
      groups[item.group].push(item);
    });

    var html = '';
    var navIdx = 0;

    groupOrder.forEach(function(groupName) {
      html += '<div class="cmd-group-label">' + _escHtml(groupName) + '</div>';
      groups[groupName].forEach(function(item) {
        var isSelected = navIdx === _selectedIdx;
        html +=
          '<div class="cmd-item' + (isSelected ? ' cmd-selected' : '') + '" data-href="' + _escHtml(item.href) + '" data-nav-idx="' + navIdx + '">' +
            '<div class="cmd-item-icon" style="background:' + item.color + '">' + item.icon + '</div>' +
            '<div class="cmd-item-text">' +
              '<div class="cmd-item-name">' + _escHtml(item.name) + '</div>' +
              (item.meta ? '<div class="cmd-item-meta">' + _escHtml(item.meta) + '</div>' : '') +
            '</div>' +
            (isSelected ? '<span class="cmd-item-hint">Enter</span>' : '') +
          '</div>';
        navIdx++;
      });
    });

    _results.innerHTML = html;

    // Wire click handlers
    _results.querySelectorAll('.cmd-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var href = el.dataset.href;
        if (href) {
          close();
          window.location.href = href;
        }
      });
    });
  }

  function _countNavigableItems() {
    return _results.querySelectorAll('.cmd-item').length;
  }

  function _updateSelection() {
    var items = _results.querySelectorAll('.cmd-item');
    items.forEach(function(el, i) {
      if (i === _selectedIdx) {
        el.classList.add('cmd-selected');
        // Add Enter hint if not present
        if (!el.querySelector('.cmd-item-hint')) {
          var hint = document.createElement('span');
          hint.className = 'cmd-item-hint';
          hint.textContent = 'Enter';
          el.appendChild(hint);
        }
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('cmd-selected');
        var hint = el.querySelector('.cmd-item-hint');
        if (hint) hint.remove();
      }
    });
  }

  function _escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { open, close };
})();
window.CmdPalette = CmdPalette;
