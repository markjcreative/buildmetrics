/* BuildMetrics — TopNav Module
   Renders the top navigation header.
   Call TopNav.init() on DOMContentLoaded on every page except login.
*/
const TopNav = (() => {

  // Maps pathname → nav highlight key
  const NAV_MAP = {
    '/projects.html':               'projects',
    '/dashboard.html':              'projects',
    '/project.html':                'projects',
    '/calcs/design-register.html':  'register',
    '/templates.html':              'reports',
    '/report-builder.html':         'reports',
    '/report-preview.html':         'reports',
    '/tools.html':                  'tools',
    '/tutorials.html':              'tutorials',
    '/faq.html':                    'faq',
    '/notifications.html':          'notifications',
  };

  function init(opts) {
    opts = opts || {};

    // Auth guard
    const user = window.Auth ? Auth.currentUser() : null;
    if (!opts.skipAuth && !user) {
      window.location.href = '/login';
      return;
    }

    // Render header
    const el = document.getElementById('app-header');
    if (el) {
      el.innerHTML = _buildHeader(user);
    }

    // Inject mobile drawer into body
    if (!document.getElementById('mobile-drawer')) {
      const drawer = document.createElement('div');
      drawer.id = 'mobile-drawer';
      drawer.innerHTML = _buildDrawer(user);
      document.body.appendChild(drawer);
    }

    // Active nav link
    const path = window.location.pathname;
    const activeKey = NAV_MAP[path] || (path === '/' ? 'projects' : '');
    if (activeKey) {
      document.querySelectorAll('[data-nav="' + activeKey + '"]').forEach(function(el) {
        el.classList.add('hn-active');
      });
    }

    // Load and init notification bell
    if (window.Notifications) {
      Notifications.init();
    } else {
      var s = document.createElement('script');
      s.src = '/js/ui/notifications.js';
      s.onload = function() { Notifications.init(); };
      document.head.appendChild(s);
    }

    // Load and init AI chat widget
    if (window.AIChat) {
      AIChat.init();
    } else {
      var ac = document.createElement('script');
      ac.src = '/js/ui/aiChat.js';
      ac.onload = function() { AIChat.init(); };
      document.head.appendChild(ac);
    }

    // Wire mobile menu open/close
    const menuBtn = document.getElementById('hdr-menu-btn');
    const drawer = document.getElementById('mobile-drawer');
    if (menuBtn && drawer) {
      menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        drawer.classList.toggle('open');
        document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
      });
      // Close button inside drawer
      drawer.addEventListener('click', function(e) {
        const closeBtn = e.target.closest('#mnd-close-btn');
        if (closeBtn) {
          drawer.classList.remove('open');
          document.body.style.overflow = '';
        }
        // Close when tapping a nav link
        if (e.target.closest('.mnd-item') || e.target.closest('.mnd-brand')) {
          drawer.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }
  }

  function _buildHeader(user) {
    const name = user ? (user.name || user.email || 'User') : 'User';
    const firstName = _esc(name.split(' ')[0]);
    const initials = name.slice(0, 2).toUpperCase();

    return '<div class="header-inner">' +
      // Logo
      '<a href="/dashboard.html" class="header-logo" data-nav="dashboard">' +
        '<svg width="26" height="26" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="30" height="30" rx="7" fill="#2563EB"/>' +
          '<rect x="6" y="8" width="3" height="15" rx="1" fill="white"/>' +
          '<rect x="21" y="8" width="3" height="15" rx="1" fill="white"/>' +
          '<rect x="6" y="8" width="18" height="3" rx="1" fill="white"/>' +
          '<rect x="12" y="15" width="6" height="2.5" rx="1" fill="rgba(255,255,255,0.55)"/>' +
        '</svg>' +
        '<span class="header-logo-name">BuildMetrics</span>' +
      '</a>' +
      // Nav links
      '<nav class="header-nav">' +
        '<a href="/projects.html" data-nav="projects">Projects</a>' +
        '<a href="/calcs/design-register.html" data-nav="register">Design Register</a>' +
      '</nav>' +
      // Right
      '<div class="header-right">' +
        '<a href="/profile.html" class="header-user">' +
          '<div class="header-avatar">' + initials + '</div>' +
          '<span class="header-user-name">' + firstName + '</span>' +
        '</a>' +
        '<button class="header-signout" onclick="Auth.logout()">Sign out</button>' +
        '<button class="header-menu-btn" id="hdr-menu-btn" aria-label="Open menu">' +
          '<svg width="20" height="20" fill="none" viewBox="0 0 24 24">' +
            '<path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  function _buildDrawer(user) {
    const name = user ? (user.name || user.email || 'User') : 'User';
    const firstName = _esc(name.split(' ')[0]);
    const initials = name.slice(0, 2).toUpperCase();
    const email = _esc(user ? (user.email || '') : '');

    const navItems = [
      { href: '/projects.html',     label: 'Projects',     bg: '#1E3A8A', icon: '<svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path stroke="white" stroke-width="1.8" stroke-linecap="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>' },
      { href: '/templates.html',    label: 'Report Builder', bg: '#1E3A8A', icon: '<svg width="26" height="26" fill="none" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" stroke="white" stroke-width="1.8"/><path stroke="white" stroke-width="1.5" stroke-linecap="round" d="M8 8h8M8 12h8M8 16h5"/><circle cx="18" cy="18" r="4" fill="#2563EB"/><path stroke="white" stroke-width="1.5" stroke-linecap="round" d="M18 16v4M16 18h4"/></svg>' },
      { href: '/calcs/design-register.html', label: 'Design Register', bg: '#065F46', icon: '<svg width="26" height="26" fill="none" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" stroke="white" stroke-width="1.8"/><path stroke="white" stroke-width="1.5" stroke-linecap="round" d="M8 8h8M8 12h8M8 16h5"/></svg>' },
      { href: '/tools.html',        label: 'Quick Tools',  bg: '#134E4A', icon: '<svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3-3a8 8 0 01-11 11l-6 6a2 2 0 01-3-3l6-6a8 8 0 0111-11l-3 3z"/></svg>' },
      { href: '/tutorials.html',   label: 'Tutorials',    bg: '#0369A1', icon: '<svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>' },
      { href: '/faq.html',         label: 'FAQ',          bg: '#065F46', icon: '<svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/></svg>' },
      { href: '/notifications.html', label: 'Notifications', bg: '#1E3A8A', icon: '<svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>' },
    ];

    const gridItems = navItems.map(item =>
      '<a href="' + item.href + '" class="mnd-item">' +
        '<div class="mnd-item-icon" style="background:' + item.bg + ';">' + item.icon + '</div>' +
        '<span class="mnd-item-label">' + item.label + '</span>' +
      '</a>'
    ).join('');

    return (
      '<div class="mnd-topbar">' +
        '<a href="/dashboard.html" class="mnd-brand">' +
          '<svg width="28" height="28" viewBox="0 0 30 30" fill="none"><rect width="30" height="30" rx="7" fill="#2563EB"/><rect x="6" y="8" width="3" height="15" rx="1" fill="white"/><rect x="21" y="8" width="3" height="15" rx="1" fill="white"/><rect x="6" y="8" width="18" height="3" rx="1" fill="white"/><rect x="12" y="15" width="6" height="2.5" rx="1" fill="rgba(255,255,255,0.55)"/></svg>' +
          '<span class="mnd-brand-name">BuildMetrics</span>' +
        '</a>' +
        '<button class="mnd-close" id="mnd-close-btn" aria-label="Close menu">' +
          '<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M18 6L6 18M6 6l12 12"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="mnd-greeting">Hi ' + firstName + ' 👋</div>' +
      '<div class="mnd-section-label">Navigation</div>' +
      '<div class="mnd-grid">' + gridItems + '</div>' +
      '<div class="mnd-footer">' +
        '<div class="mnd-footer-avatar">' + initials + '</div>' +
        '<div class="mnd-footer-info">' +
          '<div class="mnd-footer-name">' + firstName + '</div>' +
          '<div class="mnd-footer-email">' + email + '</div>' +
        '</div>' +
        '<button class="mnd-footer-signout" onclick="Auth.logout()">Sign out</button>' +
      '</div>'
    );
  }

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init };
})();
window.TopNav = TopNav;
