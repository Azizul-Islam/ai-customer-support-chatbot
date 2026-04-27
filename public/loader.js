/*!
 * SupportIQ Loader v1.0
 * Inject via: <script src="https://your-app.com/loader.js" data-chatbot-id="YOUR_ID"></script>
 */
(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────────────────────────
  var script = document.currentScript ||
    (function () {
      var tags = document.querySelectorAll('script[data-chatbot-id]');
      return tags[tags.length - 1] || null;
    })();

  var chatbotId = script && script.getAttribute('data-chatbot-id');
  if (!chatbotId) return;

  // Derive app origin from script src so the loader is host-agnostic
  var appOrigin = (function () {
    var src = (script && script.src) || '';
    var m = src.match(/^(https?:\/\/[^/]+)/);
    return m ? m[1] : window.location.origin;
  })();

  var IFRAME_URL = appOrigin + '/chatbot/' + encodeURIComponent(chatbotId) + '?embed=1';
  var Z = '2147483647';

  // ── Stylesheet ──────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#_cb_btn{',
      'position:fixed;bottom:24px;right:24px;',
      'width:56px;height:56px;border-radius:50%;',
      'border:none;cursor:pointer;',
      'background:#6366f1;color:#fff;',
      'box-shadow:0 4px 20px rgba(0,0,0,.28);',
      'z-index:' + Z + ';',
      'display:flex;align-items:center;justify-content:center;',
      'transition:transform .18s ease,box-shadow .18s ease;',
      'padding:0;outline:none;',
    '}',
    '#_cb_btn:hover{transform:scale(1.09);box-shadow:0 6px 28px rgba(0,0,0,.35);}',
    '#_cb_btn:focus-visible{outline:3px solid #818cf8;outline-offset:3px;}',
    '#_cb_wrap{',
      'position:fixed;bottom:92px;right:24px;',
      'width:400px;height:600px;',
      'border-radius:16px;overflow:hidden;',
      'box-shadow:0 8px 40px rgba(0,0,0,.22);',
      'z-index:' + Z + ';',
      'border:1px solid rgba(0,0,0,.1);',
      'display:none;',
      'transform-origin:bottom right;',
    '}',
    '#_cb_wrap._open{display:block;animation:_cb_pop .2s ease;}',
    '@keyframes _cb_pop{',
      'from{opacity:0;transform:scale(.94) translateY(10px);}',
      'to{opacity:1;transform:scale(1) translateY(0);}',
    '}',
    '#_cb_iframe{width:100%;height:100%;border:none;display:block;}',
    '@media(max-width:480px){',
      '#_cb_wrap{width:calc(100vw - 32px);height:calc(100dvh - 110px);}',
    '}',
  ].join('');
  document.head.appendChild(style);

  // ── SVG icons ───────────────────────────────────────────────────────────────
  var ICON_CHAT = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var ICON_X    = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  // ── DOM ─────────────────────────────────────────────────────────────────────
  var btn = document.createElement('button');
  btn.id = '_cb_btn';
  btn.setAttribute('aria-label', 'Open chat');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = ICON_CHAT;

  var wrap = document.createElement('div');
  wrap.id = '_cb_wrap';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-label', 'Chat support');

  var iframe = document.createElement('iframe');
  iframe.id = '_cb_iframe';
  iframe.title = 'Chat support';
  iframe.allow = 'clipboard-write';
  // src is set lazily on first open to avoid unnecessary network requests
  wrap.appendChild(iframe);

  document.body.appendChild(btn);
  document.body.appendChild(wrap);

  // ── Toggle ───────────────────────────────────────────────────────────────────
  var isOpen  = false;
  var loaded  = false;

  function open() {
    if (!loaded) { iframe.src = IFRAME_URL; loaded = true; }
    wrap.classList.add('_open');
    btn.innerHTML = ICON_X;
    btn.setAttribute('aria-label', 'Close chat');
    btn.setAttribute('aria-expanded', 'true');
    isOpen = true;
  }

  function close() {
    wrap.classList.remove('_open');
    btn.innerHTML = ICON_CHAT;
    btn.setAttribute('aria-label', 'Open chat');
    btn.setAttribute('aria-expanded', 'false');
    isOpen = false;
  }

  btn.addEventListener('click', function () { isOpen ? close() : open(); });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (isOpen && e.key === 'Escape') close();
  });

  // ── Receive primary color from iframe ────────────────────────────────────────
  // The chatbot page posts its primary color so the toggle button matches.
  window.addEventListener('message', function (e) {
    if (e.origin !== appOrigin) return;
    if (e.data && e.data.type === 'cb:color' && typeof e.data.color === 'string') {
      btn.style.background = e.data.color;
    }
  });
})();
