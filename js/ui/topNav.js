/* BuildMetrics — app shell (v2.1)
   Renders the floating sidebar (desktop) / top bar + drawer (mobile) into
   #app-header. Full-screen workspaces (report builder, preview) get a slim
   top bar instead so their canvas keeps the full width.
   Call TopNav.init() on DOMContentLoaded on every app page.
   Hooks kept for other modules: .header-right / .header-user (notification
   bell attaches there), [data-nav] active highlighting. */
const TopNav = (() => {

  // ── Icons: 24px grid, 2px stroke, round caps — one family ──────────────
  const I = {
    projects: '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4.4l1.8 2h8.8A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/>',
    register: '<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
    templates:'<rect x="4" y="3.5" width="11" height="14" rx="1.5"/><path d="M9 20.5h9.5A1.5 1.5 0 0 0 20 19V8.5"/>',
    beam:     '<path d="M5 5h14M5 19h14M12 5v14"/>',
    concrete: '<rect x="4" y="5" width="16" height="14" rx="1"/><circle cx="8" cy="15" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>',
    ground:   '<path d="M3 17h18M6 17v-6h4v6M14 17V8h4v9"/><path d="M4 20.5l2-1.5M9 20.5l2-1.5M14 20.5l2-1.5M19 20.5l1-1"/>',
    timber:   '<rect x="7" y="3" width="10" height="18" rx="1"/><path d="M10 7c1 1 1 3 0 4M14 13c-1 1-1 3 0 4"/>',
    loading:  '<path d="M12 3v10M8.5 9.5 12 13l3.5-3.5"/><path d="M4 17h16M6 20h12"/>',
    detail:   '<circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/><path d="M9 9l6 6M4 20h6M14 4h6"/>',
    tools:    '<path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z"/>',
    standards:'<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19"/>',
    tutorials:'<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M10 9.5v5l4.5-2.5z"/>',
    support:  '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2-2.4 3.6"/><path d="M12 17.2h.01"/>',
    search:   '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    signout:  '<path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16l-4-4 4-4M6 12h9"/>',
    menu:     '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close:    '<path d="M6 6l12 12M18 6 6 18"/>',
  };
  const icon = (k, cls) => '<svg class="' + (cls || 'bm-ico') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + '</svg>';

  // ── Navigation — single source of truth for sidebar and drawer ─────────
  const NAV = [
    { section: null, items: [
      { key: 'projects', href: '/projects.html',              label: 'Projects',         icon: 'projects' },
      { key: 'register', href: '/calcs/design-register.html', label: 'Design register',  icon: 'register' },
      { key: 'reports',  href: '/templates.html',             label: 'Report templates', icon: 'templates' },
    ]},
    { section: 'Steel', code: 'EN 1993', icon: 'beam', items: [
      { key: 'c-beam',   href: '/calcs/beam.html',           label: 'Beam' },
      { key: 'c-column', href: '/calcs/column.html',         label: 'Column' },
      { key: 'c-member', href: '/calcs/steel-member.html',   label: 'Member' },
      { key: 'c-conn',   href: '/calcs/connection.html',     label: 'Bolted connection' },
    ]},
    { section: 'Concrete', code: 'EN 1992', icon: 'concrete', items: [
      { key: 'c-rcbeam', href: '/calcs/rc-beam.html',         label: 'RC beam' },
      { key: 'c-rccol',  href: '/calcs/concrete-column.html', label: 'RC column' },
      { key: 'c-slab',   href: '/calcs/slab.html',            label: 'Slab' },
      { key: 'c-foot',   href: '/calcs/footing.html',         label: 'Pad footing' },
    ]},
    { section: 'Geotechnical', code: 'EN 1997', icon: 'ground', items: [
      { key: 'c-retain', href: '/calcs/retaining-wall.html', label: 'Retaining wall' },
    ]},
    { section: 'Timber', code: 'EN 1995', icon: 'timber', items: [
      { key: 'c-timber', href: '/calcs/timber-column.html',  label: 'Timber column' },
    ]},
    { section: 'Loading', code: 'EN 1991', icon: 'loading', items: [
      { key: 'c-wind',   href: '/calcs/wind-loading.html',   label: 'Wind' },
      { key: 'c-ltd',    href: '/calcs/load-takedown.html',  label: 'Load take-down' },
    ]},
    { section: 'Sections & detailing', code: 'BS 8666', icon: 'detail', items: [
      { key: 'c-sect',   href: '/calcs/section-properties.html', label: 'Section properties' },
      { key: 'c-bbs',    href: '/calcs/bbs.html',               label: 'Bar bending schedule' },
    ]},
    { section: 'Resources', items: [
      { key: 'tools',     href: '/tools.html',     label: 'Quick tools',     icon: 'tools' },
      { key: 'standards', href: '/standards.html', label: 'Standards',       icon: 'standards' },
      { key: 'tutorials', href: '/tutorials.html', label: 'Tutorials',       icon: 'tutorials' },
      { key: 'support',   href: '/support.html',   label: 'Help & support',  icon: 'support' },
    ]},
  ];

  // Pages that are themselves the nav target of a key
  const ALIAS = {
    '/dashboard.html': 'projects', '/project.html': 'projects', '/': 'projects',
    '/report-builder.html': 'reports', '/report-preview.html': 'reports',
    '/faq.html': 'support', '/history.html': 'projects', '/cost-report.html': 'tools',
  };
  // Full-screen workspaces keep a slim top bar
  const BAR_PAGES = ['/report-builder.html', '/report-preview.html'];

  function _activeKey(path) {
    if (ALIAS[path]) return ALIAS[path];
    for (const g of NAV) for (const it of g.items) if (it.href === path) return it.key;
    return '';
  }

  function init(opts) {
    opts = opts || {};
    const user = window.Auth ? Auth.currentUser() : null;
    if (!opts.skipAuth && !user) { window.location.href = '/login'; return; }

    const el = document.getElementById('app-header');
    if (!el) return;
    const path = window.location.pathname;
    const bar = opts.layout === 'bar' || (opts.layout !== 'sidebar' && BAR_PAGES.includes(path));
    const active = _activeKey(path);

    document.body.classList.add(bar ? 'bm-bar' : 'bm-shell');
    el.innerHTML = bar ? _buildBar(user, active) : _buildShell(user, active);
    _wire(el, bar);

    // Help & Support widget
    if (window.Support) Support.init();
    else _load('/js/ui/support.js', () => window.Support && Support.init());

    // Notification bell — only for a signed-in user
    if (user) {
      if (window.Notifications) Notifications.init();
      else _load('/js/ui/notifications.js', () => window.Notifications && Notifications.init());
    }
  }

  function _load(src, cb) {
    const s = document.createElement('script'); s.src = src; s.onload = cb; document.head.appendChild(s);
  }

  // ── Builders ────────────────────────────────────────────────────────────
  function _brand() {
    return '<a href="/projects.html" class="bm-brand" aria-label="BuildMetrics — projects">' +
      '<img src="/assets/brand/logo-mark-tile.svg" width="30" height="30" alt="">' +
      '<span class="bm-brand-name">BuildMetrics</span></a>';
  }

  function _navHtml(active) {
    return NAV.map(g => {
      const head = g.section
        ? '<div class="bm-nav-head">' + (g.icon ? icon(g.icon, 'bm-ico bm-ico-sm') : '') +
            '<span>' + g.section + '</span>' + (g.code ? '<span class="bm-nav-code">' + g.code + '</span>' : '') + '</div>'
        : '';
      const items = g.items.map(it =>
        '<a href="' + it.href + '" class="bm-nav-item' + (it.icon ? '' : ' bm-nav-sub') + (it.key === active ? ' is-active' : '') +
          '" data-nav="' + it.key + '" data-label="' + _esc(it.label.toLowerCase() + ' ' + (g.section || '').toLowerCase() + ' ' + (g.code || '').toLowerCase()) + '"' +
          (it.key === active ? ' aria-current="page"' : '') + '>' +
          (it.icon ? icon(it.icon) : '<span class="bm-nav-tick" aria-hidden="true"></span>') +
          '<span>' + it.label + '</span></a>').join('');
      return '<div class="bm-nav-group' + (g.section ? '' : ' bm-nav-primary') + '">' + head + items + '</div>';
    }).join('');
  }

  function _userBlock(user) {
    if (!user) {
      return '<div class="bm-side-foot header-right">' +
        '<a href="/signup" class="bm-btn-primary bm-foot-cta">Create free account</a>' +
        '<a href="/login" class="bm-foot-link">Sign in</a></div>';
    }
    const name = user.name || user.email || 'Engineer';
    const initials = name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
    return '<div class="bm-side-foot header-right">' +
      '<a href="/profile.html" class="header-user bm-user" title="Your profile">' +
        '<span class="bm-avatar" aria-hidden="true">' + _esc(initials) + '</span>' +
        '<span class="bm-user-text"><span class="bm-user-name">' + _esc(name) + '</span>' +
        '<span class="bm-user-sub">Profile &amp; settings</span></span></a>' +
      '<button type="button" class="bm-icon-btn" onclick="Auth.logout()" aria-label="Sign out" title="Sign out">' + icon('signout') + '</button>' +
    '</div>';
  }

  function _buildShell(user, active) {
    return (
      // Mobile top bar
      '<div class="bm-topbar">' + _brand() +
        '<button type="button" class="bm-icon-btn" id="bm-menu" aria-label="Open menu" aria-controls="bm-side" aria-expanded="false">' + icon('menu') + '</button>' +
      '</div>' +
      '<div class="bm-scrim" id="bm-scrim" hidden></div>' +
      // Sidebar
      '<aside class="bm-side" id="bm-side" aria-label="Main navigation">' +
        '<div class="bm-side-top">' + _brand() +
          '<button type="button" class="bm-icon-btn bm-side-close" id="bm-close" aria-label="Close menu">' + icon('close') + '</button>' +
        '</div>' +
        '<label class="bm-search">' + icon('search') +
          '<input type="search" id="bm-search" placeholder="Find a calculator" autocomplete="off" aria-label="Find a calculator or page">' +
          '<kbd class="bm-kbd" aria-hidden="true">' + (/Mac|iP/.test(navigator.platform) ? '⌘K' : 'Ctrl K') + '</kbd>' +
        '</label>' +
        '<nav class="bm-nav" id="bm-nav">' + _navHtml(active) +
          '<p class="bm-nav-empty" id="bm-nav-empty" hidden>No calculator matches that. Try “beam”, “EN 1992” or “wind”.</p>' +
        '</nav>' +
        _userBlock(user) +
      '</aside>'
    );
  }

  function _buildBar(user, active) {
    const name = user ? (user.name || user.email || 'Engineer') : '';
    const initials = name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
    return '<div class="bm-barbar">' + _brand() +
      '<nav class="bm-bar-nav" aria-label="Main">' +
        '<a href="/projects.html" data-nav="projects" class="' + (active === 'projects' ? 'is-active' : '') + '">Projects</a>' +
        '<a href="/calcs/design-register.html" data-nav="register">Design register</a>' +
        '<a href="/templates.html" data-nav="reports" class="' + (active === 'reports' ? 'is-active' : '') + '">Templates</a>' +
        '<a href="/support.html" data-nav="support">Help</a>' +
      '</nav>' +
      '<div class="header-right bm-bar-right">' +
        (user ? '<a href="/profile.html" class="header-user bm-user bm-user-compact" title="Your profile"><span class="bm-avatar" aria-hidden="true">' + _esc(initials) + '</span><span class="bm-user-name">' + _esc(name.split(' ')[0]) + '</span></a>' +
                '<button type="button" class="bm-icon-btn" onclick="Auth.logout()" aria-label="Sign out" title="Sign out">' + icon('signout') + '</button>'
              : '<a href="/login" class="bm-foot-link">Sign in</a>') +
      '</div></div>';
  }

  // ── Behaviour ───────────────────────────────────────────────────────────
  function _wire(root, bar) {
    if (bar) return;
    const side = root.querySelector('#bm-side');
    const menu = root.querySelector('#bm-menu');
    const close = root.querySelector('#bm-close');
    const scrim = root.querySelector('#bm-scrim');
    const search = root.querySelector('#bm-search');

    const setOpen = (open) => {
      side.classList.toggle('is-open', open);
      scrim.hidden = !open;
      menu.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('bm-noscroll', open);
      if (open) search.focus({ preventScroll: true });
    };
    menu.addEventListener('click', () => setOpen(true));
    close.addEventListener('click', () => setOpen(false));
    scrim.addEventListener('click', () => setOpen(false));

    // Live filter: hides non-matching items and empty groups
    const items = [...root.querySelectorAll('.bm-nav-item')];
    const groups = [...root.querySelectorAll('.bm-nav-group')];
    const empty = root.querySelector('#bm-nav-empty');
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      items.forEach(a => {
        const hit = !q || a.dataset.label.includes(q);
        a.hidden = !hit; if (hit) shown++;
      });
      groups.forEach(g => { g.hidden = !!q && !g.querySelector('.bm-nav-item:not([hidden])'); });
      empty.hidden = shown > 0;
    });
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const first = items.find(a => !a.hidden);
        if (first) window.location.href = first.getAttribute('href');
      } else if (e.key === 'Escape') {
        search.value = ''; search.dispatchEvent(new Event('input')); search.blur();
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (getComputedStyle(menu).display !== 'none') setOpen(true); else search.focus();
      } else if (e.key === 'Escape' && side.classList.contains('is-open')) {
        setOpen(false); menu.focus();
      }
    });

    // Keep the active item in view inside a long, scrolled sidebar
    // (scroll the nav itself, never the page — the drawer is off-screen on mobile)
    const nav = root.querySelector('#bm-nav');
    const cur = root.querySelector('.bm-nav-item.is-active');
    if (nav && cur) {
      const top = cur.offsetTop - nav.offsetTop;
      if (top + cur.offsetHeight > nav.clientHeight) nav.scrollTop = top - nav.clientHeight / 2;
    }
  }

  function _esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { init };
})();
window.TopNav = TopNav;
