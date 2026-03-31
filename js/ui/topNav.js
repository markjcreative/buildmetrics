/* BuildMetrics — TopNav Module
   Renders the top navigation header.
   Call TopNav.init() on DOMContentLoaded on every page except login.
*/
const TopNav = (() => {

  // Maps pathname → nav highlight key
  const NAV_MAP = {
    '/projects.html':   'projects',
    '/tools.html':      'tools',
    '/standards.html':  'standards',
    '/templates.html':  'templates',
    '/ai-assistant.html': 'ai',
  };

  function init(opts) {
    opts = opts || {};

    // Auth guard
    const user = window.Auth ? Auth.currentUser() : null;
    if (!opts.skipAuth && !user) {
      window.location.href = '/login.html';
      return;
    }

    // Render header
    const el = document.getElementById('app-header');
    if (el) {
      el.innerHTML = _buildHeader(user);
    }

    // Inject mobile drawer into body (after header)
    if (!document.getElementById('mobile-drawer')) {
      const drawer = document.createElement('div');
      drawer.id = 'mobile-drawer';
      drawer.innerHTML = _buildDrawer();
      document.body.insertBefore(drawer, document.body.firstChild.nextSibling);
    }

    // Active nav link
    const path = window.location.pathname;
    const activeKey = NAV_MAP[path] || (path === '/dashboard.html' || path === '/' ? 'dashboard' : '');
    if (activeKey) {
      document.querySelectorAll('[data-nav="' + activeKey + '"]').forEach(function(el) {
        el.classList.add('hn-active');
      });
    }

    // Wire mobile menu
    const menuBtn = document.getElementById('hdr-menu-btn');
    const drawer = document.getElementById('mobile-drawer');
    if (menuBtn && drawer) {
      menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        drawer.classList.toggle('open');
      });
      document.addEventListener('click', function() {
        if (drawer) drawer.classList.remove('open');
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
          '<rect x="8" y="7" width="3" height="16" rx="1" fill="white"/>' +
          '<rect x="8" y="7" width="11" height="3" rx="1" fill="white"/>' +
          '<rect x="8" y="14" width="9" height="3" rx="1" fill="white"/>' +
          '<rect x="8" y="20" width="11" height="3" rx="1" fill="white"/>' +
        '</svg>' +
        '<span class="header-logo-name">BuildMetrics</span>' +
      '</a>' +
      // Nav links
      '<nav class="header-nav">' +
        '<a href="/projects.html" data-nav="projects">Projects</a>' +
        '<a href="/tools.html" data-nav="tools">Quick Tools</a>' +
        '<a href="/standards.html" data-nav="standards">Standards</a>' +
        '<a href="/templates.html" data-nav="templates">Templates</a>' +
        '<a href="/ai-assistant.html" data-nav="ai">AI Assistant</a>' +
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

  function _buildDrawer() {
    return '<a href="/dashboard.html">Dashboard</a>' +
      '<a href="/projects.html">Projects</a>' +
      '<a href="/tools.html">Quick Tools</a>' +
      '<a href="/standards.html">Standards</a>' +
      '<a href="/templates.html">Templates</a>' +
      '<a href="/ai-assistant.html">AI Assistant</a>' +
      '<div class="drawer-sep"></div>' +
      '<a href="/profile.html">Profile</a>' +
      '<a href="#" onclick="Auth.logout();return false;">Sign out</a>';
  }

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init };
})();
window.TopNav = TopNav;
