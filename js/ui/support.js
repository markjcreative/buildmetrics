/* BuildMetrics — Help & Support widget
   Floating bottom-right launcher → panel with quick FAQs and links through to
   the full support page (form + guides). Call Support.init() once after
   TopNav.init(). Replaces the former AI chat widget.
*/
const Support = (() => {

  // A handful of the most common questions, answered inline. Fuller list lives
  // on /faq.html; anything not covered goes to the contact form on /support.html.
  const FAQS = [
    { q: 'Is BuildMetrics really free?',
      a: 'Yes — every calculator, the full report builder and unlimited PDF & Word exports are free, with no subscription and no per-report fee.' },
    { q: 'How do I create a calculation report?',
      a: 'Open a project, click <strong>New Report</strong>, then add calculation blocks to the canvas. Each block shows clause-referenced working and design checks, and exports to a letterheaded PDF.' },
    { q: 'Can I put my company details on reports?',
      a: 'Yes. Add a <strong>Project Information</strong> block and fill in your company name, address and contact details — they become the letterhead on every page.' },
    { q: 'Which standards do the calculators use?',
      a: 'The Eurocodes with the UK National Annex (EC0–EC7), plus TWf2012 for hoarding and BS 8666 for bar scheduling. Every result prints its clause reference.' },
    { q: 'I forgot my password / can\'t sign in',
      a: 'Use <a href="/reset-password.html">Forgot password</a> on the sign-in page. If you signed up with Google, use the <em>Continue with Google</em> button instead — Google accounts have no separate password.' },
  ];

  let _open = false;

  function init() {
    if (document.getElementById('bm-support-root')) return;
    _injectStyles();
    _injectHTML();
    _wire();
  }

  function _injectStyles() {
    if (document.getElementById('bm-support-styles')) return;
    const css = `
      #bm-support-root{position:fixed;right:20px;bottom:20px;z-index:9000;font-family:'Inter',system-ui,sans-serif}
      #bm-support-launch{display:flex;align-items:center;gap:9px;background:#2563EB;color:#fff;border:none;
        border-radius:999px;padding:12px 18px 12px 15px;font-size:14px;font-weight:600;cursor:pointer;
        box-shadow:0 8px 26px rgba(37,99,235,.4);transition:transform .14s,box-shadow .14s,background .14s}
      #bm-support-launch:hover{background:#1D4ED8;transform:translateY(-1px);box-shadow:0 12px 30px rgba(37,99,235,.5)}
      #bm-support-launch svg{width:19px;height:19px;flex-shrink:0}
      #bm-support-launch.hidden{display:none}

      #bm-support-panel{position:absolute;right:0;bottom:0;width:360px;max-width:calc(100vw - 40px);
        background:#fff;border:1px solid #E4E7EC;border-radius:16px;box-shadow:0 24px 70px rgba(16,24,40,.28);
        overflow:hidden;display:none;flex-direction:column;max-height:min(560px,calc(100vh - 40px))}
      #bm-support-panel.open{display:flex;animation:bmSupIn .18s ease}
      @keyframes bmSupIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

      .bm-sup-head{background:linear-gradient(135deg,#0F172A,#1E3A8A);color:#fff;padding:18px 18px 20px}
      .bm-sup-head h3{margin:0;font-size:16px;font-weight:700}
      .bm-sup-head p{margin:4px 0 0;font-size:12.5px;color:rgba(255,255,255,.72)}
      .bm-sup-close{position:absolute;top:14px;right:14px;width:28px;height:28px;border:none;border-radius:8px;
        background:rgba(255,255,255,.14);color:#fff;font-size:15px;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center}
      .bm-sup-close:hover{background:rgba(255,255,255,.26)}

      .bm-sup-body{padding:14px 16px 8px;overflow-y:auto}
      .bm-sup-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#98A2B3;margin:4px 2px 8px}
      .bm-faq{border:1px solid #EAECF0;border-radius:10px;margin-bottom:8px;overflow:hidden;background:#fff}
      .bm-faq-q{width:100%;text-align:left;background:none;border:none;padding:11px 14px;font-size:13.5px;font-weight:600;
        color:#1D2939;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:10px;font-family:inherit}
      .bm-faq-q:hover{background:#F9FAFB}
      .bm-faq-q .chev{transition:transform .18s;color:#98A2B3;flex-shrink:0}
      .bm-faq.open .bm-faq-q{color:#2563EB}
      .bm-faq.open .bm-faq-q .chev{transform:rotate(180deg);color:#2563EB}
      .bm-faq-a{display:none;padding:0 14px 13px;font-size:13px;line-height:1.6;color:#475467}
      .bm-faq.open .bm-faq-a{display:block}
      .bm-faq-a a{color:#2563EB}

      .bm-sup-foot{padding:12px 16px 16px;border-top:1px solid #F2F4F7;display:flex;flex-direction:column;gap:8px;background:#fff}
      .bm-sup-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:11px;border-radius:10px;
        font-size:13.5px;font-weight:600;text-decoration:none;cursor:pointer;font-family:inherit;border:none;transition:filter .14s,background .14s}
      .bm-sup-btn.primary{background:#2563EB;color:#fff}
      .bm-sup-btn.primary:hover{background:#1D4ED8}
      .bm-sup-btn.ghost{background:#F2F4F7;color:#344054}
      .bm-sup-btn.ghost:hover{background:#EAECF0}
      .bm-sup-btn svg{width:16px;height:16px}

      @media (prefers-color-scheme: dark){
        #bm-support-panel{background:#131A2C;border-color:#26304A}
        .bm-faq{background:#0F1728;border-color:#26304A}
        .bm-faq-q{color:#EDF1F9}
        .bm-faq-q:hover{background:#182137}
        .bm-faq-a{color:#A7B1C5}
        .bm-sup-foot{background:#131A2C;border-color:#26304A}
        .bm-sup-btn.ghost{background:#1E2A44;color:#C7D0E0}
        .bm-sup-btn.ghost:hover{background:#26304A}
        .bm-sup-label{color:#6E7A92}
      }`;
    const s = document.createElement('style');
    s.id = 'bm-support-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function _injectHTML() {
    const root = document.createElement('div');
    root.id = 'bm-support-root';

    const faqHtml = FAQS.map((f, i) => `
      <div class="bm-faq" data-i="${i}">
        <button class="bm-faq-q" type="button" aria-expanded="false">
          <span>${f.q}</span>
          <svg class="chev" width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="bm-faq-a">${f.a}</div>
      </div>`).join('');

    root.innerHTML = `
      <button id="bm-support-launch" aria-label="Open help and support">
        <svg fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.8"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M9.4 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.4 2.2-2.4 3.9"/><circle cx="12" cy="17" r="1.1" fill="currentColor"/></svg>
        Help
      </button>
      <div id="bm-support-panel" role="dialog" aria-label="Help and support">
        <div class="bm-sup-head">
          <h3>Help &amp; Support</h3>
          <p>Quick answers, guides, or send us a message.</p>
          <button class="bm-sup-close" aria-label="Close">✕</button>
        </div>
        <div class="bm-sup-body">
          <div class="bm-sup-label">Common questions</div>
          ${faqHtml}
        </div>
        <div class="bm-sup-foot">
          <a class="bm-sup-btn primary" href="/support.html#contact">
            <svg fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16v12H4z M4 7l8 6 8-6"/></svg>
            Contact support
          </a>
          <a class="bm-sup-btn ghost" href="/support.html#guide">
            <svg fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" d="M4 5.5A1.5 1.5 0 0 1 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5z"/></svg>
            Help guide &amp; documentation
          </a>
        </div>
      </div>`;
    document.body.appendChild(root);
  }

  function _wire() {
    const launch = document.getElementById('bm-support-launch');
    const panel  = document.getElementById('bm-support-panel');
    const close  = panel.querySelector('.bm-sup-close');

    const setOpen = (v) => {
      _open = v;
      panel.classList.toggle('open', v);
      launch.classList.toggle('hidden', v);
    };
    launch.addEventListener('click', () => setOpen(true));
    close.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && _open) setOpen(false); });

    panel.querySelectorAll('.bm-faq-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.bm-faq');
        const isOpen = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });
    });
  }

  return { init, open: () => { const b = document.getElementById('bm-support-launch'); if (b) b.click(); } };
})();

window.Support = Support;
