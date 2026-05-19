/* BuildMetrics — Notification System
   Self-contained module. Call Notifications.init() after TopNav.init().
   Stores notifications in localStorage. Supports toasts + bell panel.
*/
const Notifications = (() => {

  const STORAGE_KEY = 'bm_notifications';
  const MAX_STORED  = 50;

  /* ── Notification type catalogue ── */
  const TYPES = {
    // Auth & Account
    WELCOME:           { icon: '👋', color: '#3B82F6', label: 'Welcome' },
    EMAIL_VERIFY:      { icon: '✉️', color: '#F59E0B', label: 'Verify Email' },
    PASSWORD_RESET:    { icon: '🔑', color: '#F59E0B', label: 'Password Reset' },
    PASSWORD_CHANGED:  { icon: '🔒', color: '#10B981', label: 'Security' },
    LOGIN_NEW_DEVICE:  { icon: '📱', color: '#EF4444', label: 'Security Alert' },
    PROFILE_UPDATED:   { icon: '👤', color: '#6366F1', label: 'Profile' },
    // Projects
    PROJECT_CREATED:   { icon: '📁', color: '#10B981', label: 'Project' },
    PROJECT_SHARED:    { icon: '🔗', color: '#3B82F6', label: 'Shared With You' },
    PROJECT_UPDATED:   { icon: '✏️', color: '#6366F1', label: 'Project Updated' },
    PROJECT_DEADLINE:  { icon: '⏰', color: '#F59E0B', label: 'Deadline' },
    PROJECT_COMPLETED: { icon: '✅', color: '#10B981', label: 'Completed' },
    PROJECT_DELETED:   { icon: '🗑️', color: '#EF4444', label: 'Project Deleted' },
    // Calculations
    CALC_SAVED:        { icon: '💾', color: '#3B82F6', label: 'Saved' },
    CALC_PASS:         { icon: '✅', color: '#10B981', label: 'Check Passed' },
    CALC_FAIL:         { icon: '⚠️', color: '#EF4444', label: 'Check Failed' },
    CALC_SHARED:       { icon: '🔗', color: '#3B82F6', label: 'Calc Shared' },
    CALC_ERROR:        { icon: '❌', color: '#EF4444', label: 'Error' },
    // Reports
    PDF_READY:         { icon: '📄', color: '#10B981', label: 'PDF Ready' },
    PDF_DOWNLOADED:    { icon: '⬇️', color: '#6366F1', label: 'Downloaded' },
    REPORT_SHARED:     { icon: '📤', color: '#3B82F6', label: 'Report Shared' },
    WORD_READY:        { icon: '📝', color: '#10B981', label: 'Word Export' },
    // Collaboration
    TEAM_INVITE:       { icon: '📨', color: '#3B82F6', label: 'Team Invite' },
    TEAM_JOINED:       { icon: '🤝', color: '#10B981', label: 'Team' },
    TEAM_REMOVED:      { icon: '👋', color: '#EF4444', label: 'Team' },
    COMMENT_ADDED:     { icon: '💬', color: '#6366F1', label: 'New Comment' },
    MENTION:           { icon: '@',  color: '#F59E0B', label: 'Mention' },
    REVIEW_REQUESTED:  { icon: '👁️', color: '#6366F1', label: 'Review Requested' },
    // Subscription
    PLAN_FREE:         { icon: '🎉', color: '#10B981', label: 'Plan' },
    PLAN_UPGRADED:     { icon: '⭐', color: '#F59E0B', label: 'Upgraded' },
    PLAN_RENEWAL:      { icon: '🔄', color: '#F59E0B', label: 'Renewal' },
    PAYMENT_FAILED:    { icon: '💳', color: '#EF4444', label: 'Payment Failed' },
    INVOICE_READY:     { icon: '🧾', color: '#6366F1', label: 'Invoice' },
    // System
    NEW_CALCULATOR:    { icon: '🧮', color: '#3B82F6', label: 'New Calculator' },
    MAINTENANCE:       { icon: '🔧', color: '#F59E0B', label: 'Maintenance' },
    FEATURE_UPDATE:    { icon: '🚀', color: '#6366F1', label: 'New Feature' },
    WEEKLY_DIGEST:     { icon: '📊', color: '#3B82F6', label: 'Weekly Summary' },
    // Waitlist
    WAITLIST_CONFIRMED:{ icon: '📋', color: '#3B82F6', label: 'Waitlist' },
    ACCESS_GRANTED:    { icon: '🎉', color: '#10B981', label: 'Access Granted' },
  };

  /* ── Storage helpers ── */
  function _load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function _save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_STORED)));
  }
  function _unreadCount() {
    return _load().filter(n => !n.read).length;
  }

  /* ── Add a notification ── */
  function add(type, message, opts) {
    opts = opts || {};
    const meta = TYPES[type] || TYPES.FEATURE_UPDATE;
    const n = {
      id:      Date.now() + Math.random().toString(36).slice(2),
      type,
      message,
      title:   opts.title || meta.label,
      link:    opts.link || null,
      read:    false,
      ts:      Date.now(),
    };
    const list = _load();
    list.unshift(n);
    _save(list);
    _updateBadge();
    if (opts.toast !== false) _showToast(n, meta);
    return n;
  }

  function markAllRead() {
    const list = _load().map(n => ({ ...n, read: true }));
    _save(list);
    _updateBadge();
    _renderPanel();
  }

  function markRead(id) {
    const list = _load().map(n => n.id === id ? { ...n, read: true } : n);
    _save(list);
    _updateBadge();
  }

  function clear() {
    _save([]);
    _updateBadge();
    _renderPanel();
  }

  /* ── Badge ── */
  function _updateBadge() {
    const badge = document.getElementById('notif-badge');
    const count = _unreadCount();
    if (!badge) return;
    badge.textContent = count > 9 ? '9+' : count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  /* ── Toast ── */
  function _showToast(n, meta) {
    const container = _getToastContainer();
    const t = document.createElement('div');
    t.className = 'bm-notif-toast';
    t.innerHTML =
      '<div class="bm-notif-toast-icon" style="background:' + meta.color + '22;color:' + meta.color + '">' + meta.icon + '</div>' +
      '<div class="bm-notif-toast-body">' +
        '<div class="bm-notif-toast-title">' + _esc(n.title) + '</div>' +
        '<div class="bm-notif-toast-msg">' + _esc(n.message) + '</div>' +
      '</div>' +
      '<button class="bm-notif-toast-close" aria-label="Dismiss">✕</button>';
    t.querySelector('.bm-notif-toast-close').addEventListener('click', () => _dismissToast(t));
    container.appendChild(t);
    requestAnimationFrame(() => t.classList.add('visible'));
    setTimeout(() => _dismissToast(t), 5000);
  }
  function _dismissToast(t) {
    t.classList.remove('visible');
    t.addEventListener('transitionend', () => t.remove(), { once: true });
  }
  function _getToastContainer() {
    let c = document.getElementById('bm-notif-toasts');
    if (!c) {
      c = document.createElement('div');
      c.id = 'bm-notif-toasts';
      document.body.appendChild(c);
    }
    return c;
  }

  /* ── Panel ── */
  function _renderPanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const list = _load();
    if (!list.length) {
      panel.querySelector('.notif-list').innerHTML =
        '<div class="notif-empty"><span>🔔</span><p>No notifications yet</p></div>';
      return;
    }
    panel.querySelector('.notif-list').innerHTML = list.slice(0, 20).map(n => {
      const meta = TYPES[n.type] || TYPES.FEATURE_UPDATE;
      const age  = _timeAgo(n.ts);
      return '<div class="notif-item' + (n.read ? '' : ' unread') + '" data-id="' + n.id + '" ' +
        (n.link ? 'onclick="window.location.href=\'' + n.link + '\'"' : '') + '>' +
        '<div class="notif-item-icon" style="background:' + meta.color + '22;color:' + meta.color + '">' + meta.icon + '</div>' +
        '<div class="notif-item-body">' +
          '<div class="notif-item-title">' + _esc(n.title) + '</div>' +
          '<div class="notif-item-msg">' + _esc(n.message) + '</div>' +
          '<div class="notif-item-age">' + age + '</div>' +
        '</div>' +
        (!n.read ? '<div class="notif-unread-dot"></div>' : '') +
      '</div>';
    }).join('');
    // Mark as read on click
    panel.querySelectorAll('.notif-item').forEach(el => {
      el.addEventListener('click', () => {
        markRead(el.dataset.id);
        el.classList.remove('unread');
        el.querySelector('.notif-unread-dot')?.remove();
        _updateBadge();
      });
    });
  }

  function _togglePanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const open = panel.classList.toggle('open');
    if (open) {
      _renderPanel();
      setTimeout(() => {
        document.addEventListener('click', _outsideClick, { once: true });
      }, 0);
    }
  }
  function _outsideClick(e) {
    const panel = document.getElementById('notif-panel');
    const btn   = document.getElementById('notif-btn');
    if (panel && !panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove('open');
    }
  }

  /* ── Inject bell + panel into topNav header-right ── */
  function _injectUI() {
    const right = document.querySelector('.header-right');
    if (!right || document.getElementById('notif-btn')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'notif-wrapper';
    wrapper.innerHTML =
      '<button class="notif-btn" id="notif-btn" aria-label="Notifications">' +
        '<svg width="18" height="18" fill="none" viewBox="0 0 24 24">' +
          '<path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>' +
        '</svg>' +
        '<span class="notif-badge" id="notif-badge" style="display:none">0</span>' +
      '</button>' +
      '<div class="notif-panel" id="notif-panel">' +
        '<div class="notif-panel-head">' +
          '<span class="notif-panel-title">Notifications</span>' +
          '<button class="notif-mark-all" onclick="Notifications.markAllRead()">Mark all read</button>' +
        '</div>' +
        '<div class="notif-list"></div>' +
        '<div class="notif-panel-foot">' +
          '<button onclick="Notifications.clear()">Clear all</button>' +
        '</div>' +
      '</div>';

    // Insert before user avatar
    const userLink = right.querySelector('.header-user');
    right.insertBefore(wrapper, userLink);

    document.getElementById('notif-btn').addEventListener('click', e => {
      e.stopPropagation();
      _togglePanel();
    });
  }

  /* ── Init ── */
  function init() {
    _injectStyles();
    _injectUI();
    _updateBadge();
  }

  /* ── Helpers ── */
  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function _timeAgo(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'Just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  /* ── Inline styles ── */
  function _injectStyles() {
    if (document.getElementById('bm-notif-styles')) return;
    const s = document.createElement('style');
    s.id = 'bm-notif-styles';
    s.textContent = `
      /* Bell button */
      .notif-wrapper { position: relative; }
      .notif-btn {
        position: relative; background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
        width: 38px; height: 38px; display: flex; align-items: center;
        justify-content: center; color: rgba(255,255,255,0.7); cursor: pointer;
        transition: background 0.15s;
      }
      .notif-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
      .notif-badge {
        position: absolute; top: -5px; right: -5px;
        background: #EF4444; color: #fff; border-radius: 10px;
        font-size: 0.6rem; font-weight: 700; min-width: 16px; height: 16px;
        display: flex; align-items: center; justify-content: center;
        padding: 0 4px; border: 2px solid var(--navy, #0F172A);
      }
      /* Panel */
      .notif-panel {
        display: none; position: absolute; top: calc(100% + 10px); right: 0;
        width: 340px; background: #1E293B;
        border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5); z-index: 1500;
        overflow: hidden; flex-direction: column;
      }
      .notif-panel.open { display: flex; }
      .notif-panel-head {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.07);
      }
      .notif-panel-title { font-size: 0.88rem; font-weight: 700; color: #fff; }
      .notif-mark-all {
        font-size: 0.75rem; color: #60A5FA; background: none; border: none;
        cursor: pointer; font-family: inherit;
      }
      .notif-list { max-height: 360px; overflow-y: auto; }
      .notif-item {
        display: flex; align-items: flex-start; gap: 10px;
        padding: 12px 16px; cursor: pointer; position: relative;
        transition: background 0.15s;
      }
      .notif-item:hover { background: rgba(255,255,255,0.04); }
      .notif-item.unread { background: rgba(59,130,246,0.06); }
      .notif-item-icon {
        width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.9rem;
      }
      .notif-item-body { flex: 1; min-width: 0; }
      .notif-item-title { font-size: 0.8rem; font-weight: 600; color: #fff; }
      .notif-item-msg { font-size: 0.78rem; color: rgba(255,255,255,0.5); margin-top: 2px; line-height: 1.4; }
      .notif-item-age { font-size: 0.7rem; color: rgba(255,255,255,0.3); margin-top: 4px; }
      .notif-unread-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #3B82F6; flex-shrink: 0; margin-top: 4px;
      }
      .notif-empty {
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; padding: 40px 20px; gap: 8px;
        color: rgba(255,255,255,0.3); font-size: 0.85rem;
      }
      .notif-empty span { font-size: 1.8rem; }
      .notif-panel-foot {
        padding: 10px 16px; border-top: 1px solid rgba(255,255,255,0.07);
        display: flex; justify-content: center;
      }
      .notif-panel-foot button {
        font-size: 0.75rem; color: rgba(255,255,255,0.35); background: none;
        border: none; cursor: pointer; font-family: inherit;
      }
      /* Toasts */
      #bm-notif-toasts {
        position: fixed; bottom: 24px; right: 24px;
        display: flex; flex-direction: column; gap: 10px; z-index: 9999;
        pointer-events: none;
      }
      .bm-notif-toast {
        display: flex; align-items: flex-start; gap: 10px;
        background: #1E293B; border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px; padding: 12px 14px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4); min-width: 280px; max-width: 340px;
        pointer-events: all; opacity: 0; transform: translateY(12px);
        transition: opacity 0.25s, transform 0.25s;
      }
      .bm-notif-toast.visible { opacity: 1; transform: translateY(0); }
      .bm-notif-toast-icon {
        width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center; font-size: 0.85rem;
      }
      .bm-notif-toast-body { flex: 1; min-width: 0; }
      .bm-notif-toast-title { font-size: 0.8rem; font-weight: 700; color: #fff; }
      .bm-notif-toast-msg { font-size: 0.77rem; color: rgba(255,255,255,0.55); margin-top: 2px; line-height: 1.4; }
      .bm-notif-toast-close {
        background: none; border: none; color: rgba(255,255,255,0.3);
        cursor: pointer; font-size: 0.8rem; padding: 0; line-height: 1;
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(s);
  }

  return { init, add, markAllRead, markRead, clear, TYPES };
})();
window.Notifications = Notifications;
