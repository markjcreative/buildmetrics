/**
 * BuildMetrics — Navbar Dropdown Component
 * Provides a "More ▾" dropdown for secondary navigation links
 */
const NavDropdown = (() => {
    const ITEMS = [
        { label: 'Tools', href: '/tools.html', icon: '🔧' },
        { label: 'Standards', href: '/standards.html', icon: '📐' },
        { label: 'Templates', href: '/templates.html', icon: '📋' },
        { label: 'Help & Support', href: '/support.html', icon: '💬' },
    ];

    function _injectStyles() {
        if (document.getElementById('bm-nav-dropdown-styles')) return;
        const s = document.createElement('style');
        s.id = 'bm-nav-dropdown-styles';
        s.textContent = `
            .nav-more-wrap { position: relative; display: inline-flex; }
            .nav-more-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: var(--radius); border: none; background: transparent; color: var(--text-secondary); font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: background 0.15s, color 0.15s; white-space: nowrap; }
            .nav-more-btn:hover { background: var(--bg-subtle); color: var(--text-primary); }
            .nav-more-btn svg { transition: transform 0.2s; }
            .nav-more-btn.open svg { transform: rotate(180deg); }
            .nav-dropdown-panel { position: absolute; top: calc(100% + 6px); right: 0; min-width: 180px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); z-index: 1000; overflow: hidden; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: opacity 0.15s, transform 0.15s; }
            .nav-dropdown-panel.open { opacity: 1; transform: translateY(0); pointer-events: all; }
            .nav-dropdown-item { display: flex; align-items: center; gap: 10px; padding: 9px 14px; color: var(--text-secondary); text-decoration: none; font-size: 0.85rem; font-weight: 500; transition: background 0.12s, color 0.12s; }
            .nav-dropdown-item:hover { background: var(--bg-subtle); color: var(--text-primary); }
            .nav-dropdown-item.active { color: var(--accent); background: var(--accent-light); }
            .nav-dropdown-sep { height: 1px; background: var(--border); margin: 4px 0; }
            .nav-dropdown-icon { font-size: 14px; line-height: 1; }
        `;
        document.head.appendChild(s);
    }

    function init(containerId) {
        _injectStyles();
        const container = document.getElementById(containerId || 'nav-more-container');
        if (!container) return;

        const currentPath = location.pathname;

        const wrap = document.createElement('div');
        wrap.className = 'nav-more-wrap';

        const btn = document.createElement('button');
        btn.className = 'nav-more-btn';
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = `More <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

        const panel = document.createElement('div');
        panel.className = 'nav-dropdown-panel';
        panel.setAttribute('role', 'menu');

        ITEMS.forEach(item => {
            const a = document.createElement('a');
            a.className = 'nav-dropdown-item' + (currentPath.includes(item.href.replace('.html','')) ? ' active' : '');
            a.href = item.href;
            a.setAttribute('role', 'menuitem');
            a.innerHTML = `<span class="nav-dropdown-icon">${item.icon}</span>${item.label}`;
            panel.appendChild(a);
        });

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = panel.classList.contains('open');
            closeAll();
            if (!isOpen) {
                panel.classList.add('open');
                btn.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });

        wrap.appendChild(btn);
        wrap.appendChild(panel);
        container.appendChild(wrap);

        document.addEventListener('click', closeAll, { once: false });
    }

    function closeAll() {
        document.querySelectorAll('.nav-dropdown-panel.open').forEach(p => {
            p.classList.remove('open');
            const btn = p.previousElementSibling;
            if (btn) { btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
        });
    }

    return { init };
})();
window.NavDropdown = NavDropdown;
