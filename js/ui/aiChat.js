/* BuildMetrics — AI Engineering Assistant Chat Widget
   Single glassmorphism card: compact trigger → expands inline to full chat.
   Call AIChat.init() once after TopNav.init().
*/
const AIChat = (() => {

  const ENDPOINT = '/api/ai-chat.php';

  const TAGLINES = [
    'Design beams and columns instantly.',
    'Check Eurocode compliance in seconds.',
    'Solve structural problems with AI.',
    'Calculate load combinations effortlessly.',
    'Get instant answers on EC2, EC3 & EC5.',
    'From footings to connections — ask anything.',
  ];

  const SAMPLES = [
    { q: 'How do I size a steel beam for a 6m span?',     icon: '🔩' },
    { q: 'What are EC2 minimum cover requirements?',       icon: '🏗️' },
    { q: 'Explain lateral torsional buckling',             icon: '📐' },
    { q: 'What ULS load combinations does EC0 use?',       icon: '⚖️' },
    { q: 'How do I check punching shear on a flat slab?',  icon: '🔲' },
    { q: 'Typical imposed loads for office floors?',       icon: '📊' },
  ];

  let _msgs          = [];
  let _busy          = false;
  let _open          = false;
  let _tagIdx        = 0;
  let _charIdx       = 0;
  let _deleting      = false;
  let _tymerT        = null;
  let _compactHeight = 0;  // saved when card is in compact state

  /* ── Public ── */
  function init() {
    if (document.getElementById('ai-chat-root')) return;
    _injectStyles();
    _injectHTML();
    _startTypewriter();
  }

  /* ── HTML ── */
  function _injectHTML() {
    const root = document.createElement('div');
    root.id = 'ai-chat-root';

    const sampleChips = SAMPLES.map(s =>
      '<button class="ai-sample" data-q="' + _esc(s.q) + '">' +
        '<span class="ai-sample-icon">' + s.icon + '</span>' +
        '<span>' + _esc(s.q) + '</span>' +
      '</button>'
    ).join('');

    root.innerHTML =
      /* ── Single glassmorphism card — two views inside ── */
      '<div id="ai-card">' +
        '<div class="ai-card-glow"></div>' +

        /* ── VIEW 1: Compact trigger ── */
        '<div class="ai-trigger-view">' +
          '<div class="ai-card-inner">' +
            '<div class="ai-card-top">' +
              '<div class="ai-card-brand">' +
                '<div class="ai-card-icon">' +
                  '<svg width="18" height="18" fill="none" viewBox="0 0 24 24">' +
                    '<path stroke="white" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"' +
                      ' d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12' +
                      ' l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0' +
                      ' 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>' +
                  '</svg>' +
                '</div>' +
                '<div>' +
                  '<div class="ai-card-title">AI Assistant</div>' +
                  '<div class="ai-card-online"><span class="ai-card-dot"></span>Online</div>' +
                '</div>' +
              '</div>' +
              '<button class="ai-card-dismiss" id="ai-card-dismiss" aria-label="Dismiss">' +
                '<svg width="13" height="13" fill="none" viewBox="0 0 24 24">' +
                  '<path stroke="currentColor" stroke-width="2.5" stroke-linecap="round" d="M18 6L6 18M6 6l12 12"/>' +
                '</svg>' +
              '</button>' +
            '</div>' +
            '<div class="ai-card-typewriter">' +
              '<span id="ai-typewriter-text"></span>' +
              '<span class="ai-cursor">|</span>' +
            '</div>' +
            '<button class="ai-card-cta" id="ai-card-open">' +
              '<svg width="14" height="14" fill="none" viewBox="0 0 24 24">' +
                '<path stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"' +
                  ' d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0' +
                  ' 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75' +
                  ' 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972' +
                  ' 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226' +
                  ' C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>' +
              '</svg>' +
              'Ask anything about engineering' +
            '</button>' +
          '</div>' +
        '</div>' +

        /* ── VIEW 2: Expanded chat (same card, glassmorphism maintained) ── */
        '<div class="ai-chat-view">' +

          /* Chat header */
          '<div class="ai-chat-hdr">' +
            '<div class="ai-chat-hdr-left">' +
              '<div class="ai-chat-avatar">' +
                '<svg width="17" height="17" fill="none" viewBox="0 0 24 24">' +
                  '<path stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' +
                    ' d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12' +
                    ' l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0' +
                    ' 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>' +
                '</svg>' +
              '</div>' +
              '<div>' +
                '<div class="ai-chat-name">BuildMetrics AI</div>' +
                '<div class="ai-chat-status"><span class="ai-status-dot"></span>Online · Engineering Assistant</div>' +
              '</div>' +
            '</div>' +
            '<button class="ai-chat-close-btn" id="ai-chat-close" aria-label="Close chat">' +
              '<svg width="14" height="14" fill="none" viewBox="0 0 24 24">' +
                '<path stroke="currentColor" stroke-width="2.5" stroke-linecap="round" d="M18 6L6 18M6 6l12 12"/>' +
              '</svg>' +
            '</button>' +
          '</div>' +

          /* Messages */
          '<div class="ai-msgs" id="ai-msgs">' +
            '<div class="ai-welcome" id="ai-welcome">' +
              '<div class="ai-welcome-icon">⚙️</div>' +
              '<div class="ai-welcome-title">Structural Engineering AI</div>' +
              '<p class="ai-welcome-sub">Ask me anything about Eurocodes, structural design, materials, or how to use the BuildMetrics calculators.</p>' +
              '<div class="ai-samples" id="ai-samples">' + sampleChips + '</div>' +
            '</div>' +
          '</div>' +

          /* Input */
          '<div class="ai-input-wrap">' +
            '<textarea id="ai-input" class="ai-input" placeholder="Ask an engineering question…" rows="1"></textarea>' +
            '<button id="ai-send" class="ai-send-btn" aria-label="Send">' +
              '<svg width="15" height="15" fill="none" viewBox="0 0 24 24">' +
                '<path stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"' +
                  ' d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>' +
              '</svg>' +
            '</button>' +
          '</div>' +
          '<div class="ai-footer-bar">Powered by OpenAI · BuildMetrics Engineering AI</div>' +

        '</div>' +
      '</div>';

    document.body.appendChild(root);

    /* Events — trigger view */
    document.getElementById('ai-card-open').addEventListener('click', function(e) {
      e.stopPropagation();
      _openChat();
    });
    document.getElementById('ai-card').addEventListener('click', function(e) {
      if (!_open && !e.target.closest('#ai-card-dismiss') && !e.target.closest('#ai-card-open')) {
        _openChat();
      }
    });
    document.getElementById('ai-card-dismiss').addEventListener('click', function(e) {
      e.stopPropagation();
      _dismissCard();
    });

    /* Events — chat view */
    document.getElementById('ai-chat-close').addEventListener('click', function(e) {
      e.stopPropagation();   // prevent bubbling to #ai-card which would re-open
      _closeChat();
    });
    document.getElementById('ai-send').addEventListener('click', _handleSend);
    document.getElementById('ai-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _handleSend(); }
    });
    document.getElementById('ai-input').addEventListener('input', _resizeInput);

    document.querySelectorAll('.ai-sample').forEach(function(btn) {
      btn.addEventListener('click', function() { _sendMessage(btn.dataset.q); });
    });
  }

  /* ── Typewriter ── */
  function _startTypewriter() {
    _tickTypewriter();
  }

  function _tickTypewriter() {
    const el = document.getElementById('ai-typewriter-text');
    if (!el) return;
    const target = TAGLINES[_tagIdx];
    if (!_deleting) {
      if (_charIdx < target.length) {
        el.textContent = target.slice(0, ++_charIdx);
        _tymerT = setTimeout(_tickTypewriter, 45);
      } else {
        _tymerT = setTimeout(function() { _deleting = true; _tickTypewriter(); }, 2200);
      }
    } else {
      if (_charIdx > 0) {
        el.textContent = target.slice(0, --_charIdx);
        _tymerT = setTimeout(_tickTypewriter, 22);
      } else {
        _deleting = false;
        _tagIdx   = (_tagIdx + 1) % TAGLINES.length;
        _tymerT   = setTimeout(_tickTypewriter, 300);
      }
    }
  }

  /* ── Card dismiss ── */
  function _dismissCard() {
    const card = document.getElementById('ai-card');
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(12px) scale(0.95)';
      setTimeout(function() { card.style.display = 'none'; }, 250);
    }
    if (_tymerT) clearTimeout(_tymerT);
  }

  /* ── Open chat: expand card inline ── */
  function _openChat() {
    if (_open) return;
    _open = true;
    if (_tymerT) clearTimeout(_tymerT);

    const card = document.getElementById('ai-card');
    if (!card) return;

    // Pin the current compact dimensions so CSS transition has a start value
    _compactHeight = card.offsetHeight;
    card.style.height = _compactHeight + 'px';
    card.style.width  = card.offsetWidth + 'px';

    // Next frame: animate to expanded size and switch content
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        card.style.height = '520px';
        card.style.width  = '340px';
        card.classList.add('chat-open');
      });
    });

    setTimeout(function() {
      const i = document.getElementById('ai-input');
      if (i) i.focus();
    }, 340);
  }

  /* ── Close chat: collapse back to trigger card ── */
  function _closeChat() {
    _open = false;
    const card = document.getElementById('ai-card');
    if (!card) return;

    // Animate height/width back to compact while still showing chat content
    card.style.height = '520px';
    card.style.width  = '340px';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        card.style.height = (_compactHeight || 145) + 'px';
        card.style.width  = '300px';
      });
    });

    // After animation: switch content back to trigger view, clear inline sizes
    setTimeout(function() {
      card.classList.remove('chat-open');
      card.style.height = '';
      card.style.width  = '';
    }, 340);

    /* Restart typewriter */
    _charIdx  = 0;
    _deleting = false;
    if (_tymerT) clearTimeout(_tymerT);
    setTimeout(_startTypewriter, 400);
  }

  /* ── Send ── */
  function _handleSend() {
    const inp  = document.getElementById('ai-input');
    const text = inp ? inp.value.trim() : '';
    if (!text || _busy) return;
    inp.value = '';
    _resizeInput();
    _sendMessage(text);
  }

  async function _sendMessage(text) {
    if (_busy) return;
    _busy = true;

    const welcome = document.getElementById('ai-welcome');
    if (welcome) { welcome.style.opacity = '0'; setTimeout(function() { welcome.style.display = 'none'; }, 180); }

    const sendBtn = document.getElementById('ai-send');
    if (sendBtn) sendBtn.disabled = true;

    _addBubble('user', text);
    _msgs.push({ role: 'user', content: text });

    const typingId = _showTyping();

    let reply = '';
    try {
      reply = await _callAPI(_msgs);
    } catch (e) {
      reply = "I'm having trouble connecting right now. Please ensure your OpenAI API key is configured in `/api/ai-chat.php`, or try again shortly.";
    }

    _removeTyping(typingId);
    _addBubble('assistant', reply);
    _msgs.push({ role: 'assistant', content: reply });

    _busy = false;
    if (sendBtn) sendBtn.disabled = false;
    _scrollBottom();
  }

  /* ── API ── */
  async function _callAPI(messages) {
    const res  = await fetch(ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'API error');
    return data.reply;
  }

  /* ── Bubbles ── */
  function _addBubble(role, content) {
    const c = document.getElementById('ai-msgs');
    if (!c) return;
    const row = document.createElement('div');
    row.className = 'ai-row ' + (role === 'user' ? 'ai-row-user' : 'ai-row-ai');
    row.innerHTML = role === 'user'
      ? '<div class="ai-bubble ai-bubble-user">' + _esc(content) + '</div>'
      : '<div class="ai-bot-avatar">⚙️</div><div class="ai-bubble ai-bubble-ai">' + _formatMd(content) + '</div>';
    c.appendChild(row);
    _scrollBottom();
  }

  /* ── Typing ── */
  function _showTyping() {
    const c = document.getElementById('ai-msgs');
    if (!c) return null;
    const id  = 'typing-' + Date.now();
    const row = document.createElement('div');
    row.className = 'ai-row ai-row-ai';
    row.id = id;
    row.innerHTML = '<div class="ai-bot-avatar">⚙️</div><div class="ai-bubble ai-bubble-ai ai-typing"><span></span><span></span><span></span></div>';
    c.appendChild(row);
    _scrollBottom();
    return id;
  }

  function _removeTyping(id) {
    const el = id ? document.getElementById(id) : null;
    if (el) el.remove();
  }

  /* ── Helpers ── */
  function _scrollBottom() {
    const c = document.getElementById('ai-msgs');
    if (c) c.scrollTop = c.scrollHeight;
  }

  function _resizeInput() {
    const el = document.getElementById('ai-input');
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _formatMd(text) {
    const lines = String(text).split('\n');
    const out   = [];
    let inUL = false, inOL = false;

    function closeList() {
      if (inUL) { out.push('</ul>'); inUL = false; }
      if (inOL) { out.push('</ol>'); inOL = false; }
    }

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i], t = raw.trim();
      if (!t) { closeList(); out.push('<div class="ai-spacer"></div>'); continue; }
      if (/^#{1,3}\s/.test(t)) { closeList(); out.push('<div class="ai-md-h">' + _inline(t.replace(/^#+\s+/,'')) + '</div>'); continue; }
      if (/^[-*•]\s/.test(t)) {
        if (inOL) { out.push('</ol>'); inOL = false; }
        if (!inUL) { out.push('<ul class="ai-md-ul">'); inUL = true; }
        out.push('<li>' + _inline(t.replace(/^[-*•]\s+/,'')) + '</li>'); continue;
      }
      if (/^\d+\.\s/.test(t)) {
        if (inUL) { out.push('</ul>'); inUL = false; }
        if (!inOL) { out.push('<ol class="ai-md-ol">'); inOL = true; }
        out.push('<li>' + _inline(t.replace(/^\d+\.\s+/,'')) + '</li>'); continue;
      }
      if (t.startsWith('```')) {
        closeList();
        const code = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) { code.push(_esc(lines[i])); i++; }
        out.push('<pre class="ai-md-pre"><code>' + code.join('\n') + '</code></pre>'); continue;
      }
      closeList();
      out.push('<p class="ai-md-p">' + _inline(t) + '</p>');
    }
    closeList();
    return out.join('');
  }

  function _inline(s) {
    let t = _esc(s);
    t = t.replace(/`([^`]+)`/g, '<code class="ai-md-code">$1</code>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return t;
  }

  /* ── Styles ── */
  function _injectStyles() {
    if (document.getElementById('ai-chat-styles')) return;
    const s = document.createElement('style');
    s.id = 'ai-chat-styles';
    s.textContent = `
      /* ── Root ── */
      #ai-chat-root {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2000;
        font-family: 'Inter', -apple-system, sans-serif;
      }

      /* ════════════════════════════════════
         SINGLE GLASSMORPHISM CARD
         Transitions between compact ↔ chat
      ════════════════════════════════════ */
      #ai-card {
        width: 300px;
        background: linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(239,246,255,0.90) 100%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(147,197,253,0.50);
        border-radius: 18px;
        box-shadow:
          0 0 0 1px rgba(37,99,235,0.05),
          0 8px 32px rgba(37,99,235,0.12),
          0 2px 8px rgba(0,0,0,0.06);
        position: relative;
        overflow: hidden;
        cursor: pointer;
        /* Compact → expanded transition */
        transition:
          width 0.32s cubic-bezier(0.4,0,0.2,1),
          height 0.32s cubic-bezier(0.4,0,0.2,1),
          border-radius 0.32s ease,
          box-shadow 0.32s ease;
        animation: ai-card-in 0.4s cubic-bezier(0.34,1.56,0.64,1);
        transform-origin: bottom right;
      }

      /* Expanded (chat-open) state */
      #ai-card.chat-open {
        width: 340px;
        height: 520px;
        border-radius: 20px;
        cursor: default;
        box-shadow:
          0 0 0 1px rgba(37,99,235,0.08),
          0 20px 60px rgba(37,99,235,0.16),
          0 4px 16px rgba(0,0,0,0.08);
      }

      @keyframes ai-card-in {
        from { opacity: 0; transform: scale(0.88) translateY(20px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }

      #ai-card:not(.chat-open):hover {
        border-color: rgba(96,165,250,0.65);
        box-shadow:
          0 0 0 1px rgba(37,99,235,0.08),
          0 12px 40px rgba(37,99,235,0.16),
          0 2px 8px rgba(0,0,0,0.06);
        transform: translateY(-2px) scale(1.01);
      }

      /* Subtle blue shimmer */
      .ai-card-glow {
        position: absolute;
        top: -40px; right: -40px;
        width: 140px; height: 140px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(147,197,253,0.30) 0%, transparent 70%);
        animation: ai-glow-drift 6s ease-in-out infinite;
        pointer-events: none;
        z-index: 0;
      }
      @keyframes ai-glow-drift {
        0%, 100% { transform: translate(0,0); opacity: 0.8; }
        50%       { transform: translate(-20px,20px); opacity: 0.4; }
      }

      /* ════════════════════════════════════
         VIEW 1 — COMPACT TRIGGER
      ════════════════════════════════════ */
      .ai-trigger-view {
        display: block;
        position: relative;
        z-index: 1;
      }
      #ai-card.chat-open .ai-trigger-view {
        display: none;
      }

      .ai-card-inner {
        padding: 14px 16px 14px;
      }
      .ai-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .ai-card-brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .ai-card-icon {
        width: 34px; height: 34px;
        border-radius: 10px;
        background: linear-gradient(135deg, #2563EB, #7C3AED);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 3px 10px rgba(37,99,235,0.35);
      }
      .ai-card-title {
        font-size: 0.88rem;
        font-weight: 700;
        color: #0F172A;
        letter-spacing: -0.2px;
      }
      .ai-card-online {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.67rem;
        color: #64748B;
        margin-top: 2px;
      }
      .ai-card-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: #22C55E;
        box-shadow: 0 0 5px rgba(34,197,94,0.7);
        flex-shrink: 0;
        animation: ai-dot-pulse 2.4s ease-in-out infinite;
      }
      @keyframes ai-dot-pulse {
        0%, 100% { opacity: 1; box-shadow: 0 0 5px rgba(34,197,94,0.7); }
        50%       { opacity: 0.6; box-shadow: 0 0 8px rgba(34,197,94,0.3); }
      }
      .ai-card-dismiss {
        width: 24px; height: 24px;
        border-radius: 6px;
        background: rgba(15,23,42,0.05);
        border: 1px solid rgba(15,23,42,0.08);
        color: #94A3B8;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.14s;
        flex-shrink: 0;
      }
      .ai-card-dismiss:hover {
        background: rgba(239,68,68,0.08);
        border-color: rgba(239,68,68,0.2);
        color: #EF4444;
      }

      /* Typewriter */
      .ai-card-typewriter {
        font-size: 0.76rem;
        color: #64748B;
        min-height: 1.3em;
        margin-bottom: 12px;
        font-style: italic;
      }
      .ai-cursor {
        display: inline-block;
        color: #3B82F6;
        animation: ai-blink 0.9s step-end infinite;
        margin-left: 1px;
      }
      @keyframes ai-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

      /* CTA button */
      .ai-card-cta {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 16px;
        background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
        border: none;
        border-radius: 12px;
        color: #fff;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
        box-shadow: 0 4px 16px rgba(37,99,235,0.45);
        font-family: 'Inter', sans-serif;
        letter-spacing: -0.1px;
      }
      .ai-card-cta:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 22px rgba(37,99,235,0.55);
        filter: brightness(1.08);
      }

      /* ════════════════════════════════════
         VIEW 2 — EXPANDED CHAT
         (glassmorphism maintained)
      ════════════════════════════════════ */
      .ai-chat-view {
        display: none;
        flex-direction: column;
        height: 100%;
        position: relative;
        z-index: 1;
      }
      #ai-card.chat-open .ai-chat-view {
        display: flex;
      }

      /* Chat header — gradient on top of the glass card */
      .ai-chat-hdr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 13px 14px;
        background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #7C3AED 100%);
        flex-shrink: 0;
        border-radius: 19px 19px 0 0;
      }
      .ai-chat-hdr-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .ai-chat-avatar {
        width: 34px; height: 34px;
        border-radius: 10px;
        background: rgba(255,255,255,0.18);
        border: 1.5px solid rgba(255,255,255,0.24);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .ai-chat-name {
        font-size: 0.87rem;
        font-weight: 700;
        color: #fff;
        letter-spacing: -0.1px;
      }
      .ai-chat-status {
        font-size: 0.68rem;
        color: rgba(255,255,255,0.72);
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 2px;
      }
      .ai-status-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: #4ADE80;
        box-shadow: 0 0 6px rgba(74,222,128,0.7);
        flex-shrink: 0;
      }
      .ai-chat-close-btn {
        width: 28px; height: 28px;
        border-radius: 8px;
        background: rgba(255,255,255,0.14);
        border: none;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: rgba(255,255,255,0.78);
        transition: background 0.14s, color 0.14s;
        flex-shrink: 0;
      }
      .ai-chat-close-btn:hover {
        background: rgba(255,255,255,0.26);
        color: #fff;
      }

      /* Messages area — semi-transparent to show glassmorphism behind */
      .ai-msgs {
        flex: 1;
        overflow-y: auto;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: rgba(248,250,252,0.75);
        -webkit-backdrop-filter: blur(4px);
        backdrop-filter: blur(4px);
        scrollbar-width: thin;
        scrollbar-color: #CBD5E1 transparent;
      }
      .ai-msgs::-webkit-scrollbar { width: 4px; }
      .ai-msgs::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }

      /* Welcome screen */
      .ai-welcome {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 6px 4px 4px;
        transition: opacity 0.18s;
      }
      .ai-welcome-icon { font-size: 2rem; margin-bottom: 6px; }
      .ai-welcome-title { font-size: 0.88rem; font-weight: 800; color: #0F172A; margin-bottom: 4px; }
      .ai-welcome-sub { font-size: 0.76rem; color: #64748B; line-height: 1.55; margin: 0 0 12px; max-width: 270px; }
      .ai-samples { display: flex; flex-direction: column; gap: 5px; width: 100%; text-align: left; }
      .ai-sample {
        display: flex; align-items: center; gap: 7px;
        padding: 8px 11px;
        background: rgba(255,255,255,0.85);
        border: 1.5px solid rgba(226,232,240,0.8);
        border-radius: 10px;
        cursor: pointer;
        font-size: 0.76rem;
        font-weight: 500;
        color: #334155;
        text-align: left;
        transition: all 0.14s;
        font-family: 'Inter', sans-serif;
        line-height: 1.4;
      }
      .ai-sample:hover {
        border-color: #93C5FD;
        background: rgba(239,246,255,0.92);
        color: #1D4ED8;
        transform: translateX(2px);
      }
      .ai-sample-icon { font-size: 0.9rem; flex-shrink: 0; }

      /* Message rows */
      .ai-row { display: flex; align-items: flex-end; gap: 7px; max-width: 100%; }
      .ai-row-user { flex-direction: row-reverse; }
      .ai-bot-avatar {
        width: 24px; height: 24px;
        border-radius: 7px;
        background: linear-gradient(135deg, rgba(239,246,255,0.9), rgba(224,231,255,0.9));
        display: flex; align-items: center; justify-content: center;
        font-size: 0.74rem;
        flex-shrink: 0;
        border: 1px solid rgba(191,219,254,0.6);
      }

      /* Bubbles */
      .ai-bubble {
        max-width: 84%;
        padding: 9px 12px;
        border-radius: 14px;
        font-size: 0.80rem;
        line-height: 1.55;
        word-wrap: break-word;
      }
      .ai-bubble-user {
        background: linear-gradient(135deg, #2563EB, #1D4ED8);
        color: #fff;
        border-radius: 14px 14px 4px 14px;
        font-weight: 500;
      }
      .ai-bubble-ai {
        background: rgba(255,255,255,0.90);
        color: #1E293B;
        border: 1.5px solid rgba(226,232,240,0.7);
        border-radius: 14px 14px 14px 4px;
        box-shadow: 0 1px 4px rgba(15,23,42,0.05);
        -webkit-backdrop-filter: blur(4px);
        backdrop-filter: blur(4px);
      }

      /* Typing dots */
      .ai-typing { display: flex !important; align-items: center; gap: 4px; padding: 12px 14px; min-width: 48px; }
      .ai-typing span { width: 6px; height: 6px; border-radius: 50%; background: #94A3B8; display: inline-block; animation: ai-bounce 1.2s ease-in-out infinite; }
      .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
      .ai-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes ai-bounce { 0%,60%,100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-6px); opacity: 1; } }

      /* Markdown */
      .ai-md-p { margin: 0 0 5px; } .ai-md-p:last-child { margin-bottom: 0; }
      .ai-spacer { height: 4px; }
      .ai-md-h { font-size: 0.82rem; font-weight: 700; color: #0F172A; margin: 6px 0 3px; }
      .ai-md-ul, .ai-md-ol { padding-left: 15px; margin: 3px 0 5px; }
      .ai-md-ul li, .ai-md-ol li { margin-bottom: 3px; font-size: 0.79rem; }
      .ai-md-pre { background: #0F172A; color: #E2E8F0; border-radius: 8px; padding: 9px 11px; font-size: 0.71rem; overflow-x: auto; margin: 5px 0; font-family: 'SF Mono','Fira Code',Consolas,monospace; line-height: 1.5; }
      .ai-md-code { background: rgba(241,245,249,0.9); color: #0F172A; border-radius: 4px; padding: 1px 5px; font-size: 0.79em; font-family: 'SF Mono','Fira Code',Consolas,monospace; border: 1px solid #E2E8F0; }

      /* Input area — glass tinted */
      .ai-input-wrap {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        padding: 10px 12px;
        background: rgba(255,255,255,0.88);
        -webkit-backdrop-filter: blur(8px);
        backdrop-filter: blur(8px);
        border-top: 1px solid rgba(147,197,253,0.30);
        flex-shrink: 0;
      }
      .ai-input {
        flex: 1;
        border: 1.5px solid rgba(203,213,225,0.7);
        border-radius: 11px;
        padding: 8px 12px;
        font-family: 'Inter', sans-serif;
        font-size: 0.81rem;
        color: #0F172A;
        resize: none;
        outline: none;
        min-height: 36px;
        max-height: 120px;
        line-height: 1.5;
        background: rgba(248,250,252,0.8);
        transition: border-color 0.14s, background 0.14s;
      }
      .ai-input:focus {
        border-color: #93C5FD;
        background: rgba(255,255,255,0.95);
      }
      .ai-input::placeholder { color: #94A3B8; }
      .ai-send-btn {
        width: 36px; height: 36px;
        border-radius: 10px;
        background: linear-gradient(135deg, #2563EB, #7C3AED);
        border: none;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: #fff;
        flex-shrink: 0;
        transition: transform 0.14s, box-shadow 0.14s;
        box-shadow: 0 2px 8px rgba(37,99,235,0.38);
      }
      .ai-send-btn:hover:not(:disabled) { transform: scale(1.07); box-shadow: 0 4px 14px rgba(37,99,235,0.48); }
      .ai-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      /* Footer bar */
      .ai-footer-bar {
        padding: 5px 14px;
        font-size: 0.63rem;
        color: #CBD5E1;
        background: rgba(255,255,255,0.80);
        -webkit-backdrop-filter: blur(4px);
        backdrop-filter: blur(4px);
        text-align: center;
        border-top: 1px solid rgba(241,245,249,0.8);
        flex-shrink: 0;
        border-radius: 0 0 19px 19px;
        letter-spacing: 0.02em;
      }

      /* Mobile */
      @media (max-width: 480px) {
        #ai-chat-root { bottom: 14px; right: 14px; }
        #ai-card { width: calc(100vw - 28px); }
        #ai-card.chat-open { width: calc(100vw - 28px); height: 480px; }
      }
    `;
    document.head.appendChild(s);
  }

  return { init };

})();
window.AIChat = AIChat;
