/* BuildMetrics — Sidebar Module
   Renders the dark sidebar nav into <aside id="sidebar">
   Call Sidebar.init() on DOMContentLoaded on every page (except login).
*/
const Sidebar = (() => {

  // Maps URL path → data-sb active key
  const PAGE_MAP = {
    '/dashboard.html': 'dashboard',
    '/index.html': 'beam',
    '/': 'beam',
    '/calcs/column.html': 'column',
    '/calcs/slab.html': 'slab',
    '/calcs/footing.html': 'footing',
    '/calcs/retaining-wall.html': 'retaining-wall',
    '/calcs/connection.html': 'connection',
    '/tools.html': 'tools',
    '/standards.html': 'standards',
    '/templates.html': 'templates',
    '/support.html': 'support',
    '/projects.html': 'projects',
    '/history.html': 'history',
    '/profile.html': 'profile',
    '/pricing.html': 'pricing',
  };

  function init(options) {
    const opts = options || {};
    const skipAuth = opts.skipAuth || false;

    // Auth guard
    const user = (window.Auth && Auth.currentUser) ? Auth.currentUser() : null;
    if (!skipAuth && !user) {
      window.location.href = '/login.html';
      return;
    }

    const el = document.getElementById('sidebar');
    if (!el) return;

    el.innerHTML = _buildHtml(user);

    // Restore collapsed state
    const shell = document.getElementById('app-shell');
    if (shell && localStorage.getItem('bcp_sb_collapsed') === '1') {
      shell.classList.add('sb-collapsed');
    }

    // Set active nav item
    const path = window.location.pathname;
    const activeKey = PAGE_MAP[path] || '';
    if (activeKey) {
      const activeEl = el.querySelector('[data-sb="' + activeKey + '"]');
      if (activeEl) activeEl.classList.add('sb-active');
    }

    // Wire collapse button
    const collapseBtn = el.querySelector('#sb-collapse-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', _toggleCollapse);
    }

    // Wire new-calc dropdown
    const newCalcBtn = el.querySelector('#sb-new-calc-btn');
    const newCalcMenu = el.querySelector('#sb-new-calc-menu');
    if (newCalcBtn && newCalcMenu) {
      newCalcBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        newCalcMenu.classList.toggle('open');
      });
      document.addEventListener('click', function() {
        newCalcMenu.classList.remove('open');
      });
    }

    // Cmd+K
    document.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (window.CmdPalette) {
          CmdPalette.open();
        }
      }
    });
  }

  function _toggleCollapse() {
    const shell = document.getElementById('app-shell');
    if (!shell) return;
    const nowCollapsed = shell.classList.toggle('sb-collapsed');
    localStorage.setItem('bcp_sb_collapsed', nowCollapsed ? '1' : '0');
  }

  function _buildHtml(user) {
    const name = user ? (user.name || user.email || 'User') : 'Guest';
    const firstName = name.split(' ')[0];
    const initials = name.slice(0, 2).toUpperCase();
    const plan = (user && user.subscription && user.subscription.plan) ? user.subscription.plan : 'free';
    const isPro = plan === 'pro' || plan === 'enterprise';

    return '<div class="sb-inner">' +
      // HEAD
      '<div class="sb-head">' +
        '<a href="/dashboard.html" class="sb-brand">' +
          '<div class="sb-logo">' +
            '<svg width="28" height="28" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<rect width="30" height="30" rx="7" fill="#3B82F6"/>' +
              '<rect x="8" y="7" width="3" height="16" rx="1" fill="white"/>' +
              '<rect x="8" y="7" width="11" height="3" rx="1" fill="white"/>' +
              '<rect x="8" y="14" width="9" height="3" rx="1" fill="white"/>' +
              '<rect x="8" y="20" width="11" height="3" rx="1" fill="white"/>' +
            '</svg>' +
          '</div>' +
          '<span class="sb-brand-name">BuildMetrics</span>' +
        '</a>' +
        '<button class="sb-collapse" id="sb-collapse-btn" title="Toggle sidebar" aria-label="Toggle sidebar">' +
          '<svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 6l-6 6 6 6"/></svg>' +
        '</button>' +
      '</div>' +

      // NEW CALC CTA
      '<div class="sb-cta-wrap">' +
        '<button class="sb-new-calc" id="sb-new-calc-btn">' +
          '<svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2.5" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>' +
          '<span>New Calculation</span>' +
        '</button>' +
        '<div class="sb-new-calc-menu" id="sb-new-calc-menu">' +
          '<a href="/index.html" class="sb-menu-item"><span class="sb-menu-dot" style="background:#2563EB"></span>Beam Analysis</a>' +
          '<a href="/calcs/column.html" class="sb-menu-item"><span class="sb-menu-dot" style="background:#D97706"></span>Column Design</a>' +
          '<a href="/calcs/slab.html" class="sb-menu-item"><span class="sb-menu-dot" style="background:#16A34A"></span>RC Slab</a>' +
          '<a href="/calcs/footing.html" class="sb-menu-item"><span class="sb-menu-dot" style="background:#7C3AED"></span>Pad Footing</a>' +
          '<a href="/calcs/retaining-wall.html" class="sb-menu-item"><span class="sb-menu-dot" style="background:#DC2626"></span>Retaining Wall</a>' +
          '<a href="/calcs/connection.html" class="sb-menu-item"><span class="sb-menu-dot" style="background:#0891B2"></span>Connection</a>' +
        '</div>' +
      '</div>' +

      // NAV
      '<nav class="sb-nav">' +
        '<a href="/dashboard.html" class="sb-item" data-sb="dashboard">' +
          '<svg class="sb-icon" width="15" height="15" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>' +
          '<span class="sb-label">Dashboard</span>' +
        '</a>' +

        '<div class="sb-section">Calculators</div>' +
        '<a href="/index.html" class="sb-item" data-sb="beam"><span class="sb-dot" style="background:#2563EB"></span><span class="sb-label">Beam Analysis</span></a>' +
        '<a href="/calcs/column.html" class="sb-item" data-sb="column"><span class="sb-dot" style="background:#D97706"></span><span class="sb-label">Column Design</span></a>' +
        '<a href="/calcs/slab.html" class="sb-item" data-sb="slab"><span class="sb-dot" style="background:#16A34A"></span><span class="sb-label">RC Slab</span></a>' +
        '<a href="/calcs/footing.html" class="sb-item" data-sb="footing"><span class="sb-dot" style="background:#7C3AED"></span><span class="sb-label">Pad Footing</span></a>' +
        '<a href="/calcs/retaining-wall.html" class="sb-item" data-sb="retaining-wall"><span class="sb-dot" style="background:#DC2626"></span><span class="sb-label">Retaining Wall</span></a>' +
        '<a href="/calcs/connection.html" class="sb-item" data-sb="connection"><span class="sb-dot" style="background:#0891B2"></span><span class="sb-label">Connection</span></a>' +

        '<div class="sb-section">Workspace</div>' +
        '<a href="/tools.html" class="sb-item" data-sb="tools">' +
          '<svg class="sb-icon" width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>' +
          '<span class="sb-label">Quick Tools</span>' +
        '</a>' +
        '<a href="/standards.html" class="sb-item" data-sb="standards">' +
          '<svg class="sb-icon" width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>' +
          '<span class="sb-label">Standards</span>' +
        '</a>' +
        '<a href="/templates.html" class="sb-item" data-sb="templates">' +
          '<svg class="sb-icon" width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>' +
          '<span class="sb-label">Templates</span>' +
        '</a>' +
        '<a href="/support.html" class="sb-item" data-sb="support">' +
          '<svg class="sb-icon" width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.8"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M9.4 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.4 2.2-2.4 3.9"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>' +
          '<span class="sb-label">Help &amp; Support</span>' +
        '</a>' +
      '</nav>' +

      // FOOTER
      '<div class="sb-footer">' +
        '<a href="/projects.html" class="sb-item" data-sb="projects">' +
          '<svg class="sb-icon" width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>' +
          '<span class="sb-label">Projects</span>' +
        '</a>' +
        '<a href="/history.html" class="sb-item" data-sb="history">' +
          '<svg class="sb-icon" width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
          '<span class="sb-label">History</span>' +
        '</a>' +
        '<div class="sb-sep"></div>' +
        '<a href="/profile.html" class="sb-user" data-sb="profile">' +
          '<div class="sb-avatar">' + initials + '</div>' +
          '<div class="sb-user-text">' +
            '<div class="sb-user-name">' + _escHtml(firstName) + '</div>' +
            '<div class="sb-user-plan">' + (isPro ? '\u2B50 Pro Plan' : 'Free Plan') + '</div>' +
          '</div>' +
        '</a>' +
        '' +
      '</div>' +
    '</div>';
  }

  function _escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init };
})();
window.Sidebar = Sidebar;
