/*! sovereign-embed.js — drop the Sovereign into ANY site in one line.
 *  CSOAI Ltd UK · MIT. Adds a governed AI-OS dock (chat + sidebar + actions) that speaks
 *  to the SHARED sovereign backend (os.meok.ai/api/*). Public users meet SOV3; the master
 *  SOV33 (King · Hive · SIGIL · Horus) governs & learns behind it.
 *
 *  USE:
 *    <script>window.SOVEREIGN_CONFIG={ brand:'CSOAI', accent:'#c9a84c',
 *      sections:[{label:'Home',href:'/'},{label:'Graph',href:'/graph'},{label:'Plans',href:'/plans'}],
 *      commands:{ open_graph:()=>location.href='/graph' } };</script>
 *    <script src="https://os.meok.ai/sovereign-embed.js" defer></script>
 *
 *  That's it: a 🐉 orb (bottom-right), a chat panel, an optional ☰ sidebar from `sections`,
 *  and the Sovereign takes real actions via `window.sovereignOSCommands` + /api/orchestrate.
 */
(function () {
  'use strict';
  if (window.__SOVEREIGN_EMBED__) return; window.__SOVEREIGN_EMBED__ = true;
  var CFG = window.SOVEREIGN_CONFIG || {};
  var API = (CFG.endpoint || 'https://os.meok.ai/api').replace(/\/$/, '');
  var ACCENT = CFG.accent || '#c9a84c';
  var BRAND = CFG.brand || 'CSOAI';
  var CITIZEN = CFG.citizenId || 'csoai-web';
  var HFP = null, HNAME = null, HATCH = null;   // Hatch fingerprint/name/pkg once loaded (memory namespace + identity)
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };

  /* ---------- what the Sovereign SEES (host can override window.getScreenContext) ----------
     Fully aware: headings + forms + actionable links + current selection + a slice of visible text,
     plus online/offline state. This is the "see" half of see→do→check→act (PDCA). */
  if (typeof window.getScreenContext !== 'function') {
    window.getScreenContext = function () {
      var txt = function (n) { return (n && n.textContent || '').trim(); };
      var heads = [].slice.call(document.querySelectorAll('h1,h2,h3')).slice(0, 8).map(function (h) { return txt(h).slice(0, 70); }).filter(Boolean);
      var links = [].slice.call(document.querySelectorAll('a[href]')).slice(0, 40).map(function (a) { return { label: txt(a).slice(0, 40), href: a.getAttribute('href') }; }).filter(function (l) { return l.label; }).slice(0, 14);
      var forms = [].slice.call(document.querySelectorAll('form')).slice(0, 4).map(function (f) { return { fields: [].slice.call(f.querySelectorAll('input,select,textarea')).map(function (i) { return i.name || i.type; }).slice(0, 10) }; });
      var sel = ''; try { sel = String(window.getSelection ? window.getSelection() : '').trim().slice(0, 300); } catch (e) {}
      return { surface: BRAND.toLowerCase() + '-web', url: location.pathname, title: document.title,
        headings: heads, links: links, forms: forms, selection: sel || null,
        online: (typeof navigator !== 'undefined' ? navigator.onLine !== false : true),
        doctrine: 'sovereign', brain: 'sandwich', care_floor: 0.95,
        hatch: HFP ? { fingerprint: HFP, name: HNAME } : null,
        selected_node: (window.__sovNode || null) };
    };
  }
  /* ---------- what the Sovereign can DO (host commands merge in) ---------- */
  window.sovereignOSCommands = Object.assign({
    navigate: function (a) { if (a && a.href) location.href = a.href; return { ok: 1 }; },
    open_section: function (a) { var s = (CFG.sections || []).find(function (x) { return (x.id || x.label || '').toLowerCase() === String(a && a.id || '').toLowerCase(); }); if (s && s.href) location.href = s.href; return { ok: !!s }; },
    scroll_to: function (a) { try { document.querySelector(a.sel).scrollIntoView({ behavior: 'smooth' }); } catch (e) {} return { ok: 1 }; },
    utter: function () { return { ok: 1 }; }
  }, CFG.commands || {});

  /* ---------- shared sovereign services (same backend as MEOK/DEFONEOS) ---------- */
  window.sovereign = {
    ctx: window.getScreenContext,
    ask: function (message) { return post('/orchestrate', { message: message, context: window.getScreenContext(), citizen: CITIZEN }); },
    govern: function (q) { return fetch(API + '/govern?q=' + encodeURIComponent(q)).then(j); },
    validate: function (message) { return post('/bridge', { message: message }); },
    sign: function (action) { return post('/sign', { action: action }); },
    verify: function (o) { return post('/verify', o); },
    nodes: function () { return fetch(API + '/nodes').then(j); }
  };
  function j(r) { return r.json(); }
  function post(p, b) { return fetch(API + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(j); }

  /* ---------- MEMORY across all surfaces ----------
     Namespaced by the Hatch fingerprint (HFP) so the SAME hatch shares memory on every site it's
     embedded in (per browser). Local-first (localStorage); if the backend is reachable it best-effort
     syncs so memory follows the citizen across devices too. Honest: cross-device sync needs the
     backend + a signed-in citizen; offline it's per-browser durable. */
  function memKey() { return 'sov.mem.' + (HFP || BRAND); }
  var _mem = null;
  function memLoad() { if (_mem) return _mem; try { _mem = JSON.parse(localStorage.getItem(memKey()) || '{"facts":[],"turns":[]}'); } catch (e) { _mem = { facts: [], turns: [] }; } return _mem; }
  function memSave() { try { localStorage.setItem(memKey(), JSON.stringify(_mem)); } catch (e) {} }
  window.sovereign = window.sovereign || {};
  window.sovereign.remember = function (fact) { var m = memLoad(); m.facts.push({ t: Date.now(), fact: String(fact).slice(0, 400) }); m.facts = m.facts.slice(-200); memSave();
    post('/memory', { citizen: CITIZEN, hatch: HFP, fact: String(fact).slice(0, 400) }).catch(function () {}); return { ok: 1, count: m.facts.length }; };
  window.sovereign.recall = function (n) { var m = memLoad(); return m.facts.slice(-(n || 12)).map(function (x) { return x.fact; }); };
  function memTurn(role, text) { var m = memLoad(); m.turns.push({ t: Date.now(), role: role, text: String(text).slice(0, 600) }); m.turns = m.turns.slice(-40); memSave(); }

  /* ---------- BRAIN: online → offline → stub (right where the user is) ----------
     ONLINE  = the shared sovereign backend (/orchestrate, governed + signed).
     OFFLINE = a locally-running model if present (Ollama on localhost:11434, or a host-provided
               window.SOVEREIGN_LOCAL_LLM(prompt)) — so the hatch keeps thinking with no network.
     STUB    = a graceful governed reply so it never dies. Mirrors the on-device runner's routing. */
  window.sovereign.brain = async function (prompt, opts) {
    opts = opts || {}; var ctx = window.getScreenContext(); var mem = window.sovereign.recall(8);
    var on = ctx.online !== false;
    if (on && !opts.forceOffline) { try { var d = await post('/orchestrate', { message: prompt, context: ctx, memory: mem, citizen: CITIZEN, hatch: HFP }); if (d && (d.say || d.text)) return { via: 'online', say: d.say || d.text, actions: d.actions || [] }; } catch (e) {} }
    if (typeof window.SOVEREIGN_LOCAL_LLM === 'function') { try { var t = await window.SOVEREIGN_LOCAL_LLM(prompt, { context: ctx, memory: mem }); if (t) return { via: 'on-device', say: String(t), actions: [] }; } catch (e) {} }
    try { var oc = 'http://localhost:11434/api/generate'; var r = await fetch(oc, { method: 'POST', body: JSON.stringify({ model: opts.model || 'llama3.2', prompt: (mem.length ? 'Known: ' + mem.join('; ') + '\n' : '') + prompt, stream: false }) }); if (r.ok) { var jd = await r.json(); if (jd && jd.response) return { via: 'ollama-local', say: jd.response.trim(), actions: [] }; } } catch (e) {}
    return { via: 'offline-stub', say: "I'm running offline right now — I kept your context and memory. I can still navigate, verify signatures, and explain governance; I'll think deeper when a model (hosted or on-device) is reachable.", actions: [] };
  };

  /* ---------- PDCA: Plan → Do → Check → Act (the hatch can ACT, autonomously + bounded) ----------
     A real, bounded agentic loop: ask the brain for a plan, run each step through the site's own
     sovereignOSCommands (governed), re-read the screen to CHECK, and ACT again until done or max cycles.
     Renders a live trace so the user sees every step (training data for SOV33). */
  window.sovereign.pdca = async function (goal, opts) {
    opts = opts || {}; var max = Math.min(opts.max || 4, 8); var trace = []; var onStep = opts.onStep || function () {};
    for (var cyc = 1; cyc <= max; cyc++) {
      var ctx = window.getScreenContext();
      var plan = await window.sovereign.brain('PLAN the next single concrete step toward: "' + goal + '". Reply with the step, and if it maps to one of these site commands ' + JSON.stringify(Object.keys(window.sovereignOSCommands)) + ' name it as command:<name>. Screen: ' + JSON.stringify(ctx).slice(0, 900), { });
      var step = { cycle: cyc, plan: plan.say, via: plan.via, did: null, check: null }; onStep({ phase: 'plan', text: plan.say, via: plan.via });
      var cmd = (String(plan.say).match(/command:\s*([a-z_]+)/i) || [])[1]; var acts = (plan.actions && plan.actions.length ? plan.actions : (cmd ? [{ command: cmd, args: {} }] : []));
      acts.forEach(function (a) { try { var fn = window.sovereignOSCommands[a.command]; if (fn) { fn(a.args || {}); step.did = a.command; onStep({ phase: 'do', text: a.command }); } } catch (e) {} });
      var after = window.getScreenContext(); step.check = { url: after.url, title: after.title }; onStep({ phase: 'check', text: after.title + ' · ' + after.url });
      trace.push(step); window.sovereign.remember('PDCA "' + goal + '" cyc' + cyc + ': ' + (step.did || plan.say).slice(0, 120));
      if (/\b(done|complete|achieved|finished|no further)\b/i.test(plan.say)) { onStep({ phase: 'act', text: 'goal reached' }); break; }
    }
    return { goal: goal, cycles: trace.length, trace: trace };
  };

  /* ---------- UI: orb + chat + optional sidebar ---------- */
  var css = document.createElement('style'); css.textContent =
    '.sv-orb{position:fixed;right:18px;bottom:18px;z-index:2147483000;width:56px;height:56px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:26px;background:radial-gradient(circle at 50% 38%,#1a2440,#0a1530);box-shadow:0 8px 24px rgba(0,0,0,.32);border:2px solid ' + ACCENT + '}' +
    '.sv-panel{position:fixed;right:18px;bottom:84px;z-index:2147483000;width:min(380px,92vw);max-height:70vh;display:none;flex-direction:column;background:rgba(252,248,241,.72);backdrop-filter:blur(22px) saturate(1.3);-webkit-backdrop-filter:blur(22px) saturate(1.3);border:1px solid rgba(255,255,255,.5);border-radius:16px;box-shadow:0 22px 56px rgba(20,14,6,.34),inset 0 1px 0 rgba(255,255,255,.6);overflow:hidden;font-family:-apple-system,system-ui,sans-serif}' +
    '.sv-panel::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,#e8cd8a,#b9d3c4,#d6b3e0,transparent);opacity:.75;z-index:3}' +
    '.sv-panel.on{display:flex}.sv-head{display:flex;align-items:center;gap:9px;padding:12px 14px;background:rgba(255,255,255,.28);color:#2a1a14;border-bottom:1px solid rgba(255,255,255,.4)}' +
    '.sv-head b{background:linear-gradient(96deg,#c9a84c,#e8cd8a 32%,#b9d3c4 56%,#d6b3e0 80%,#c9a84c);-webkit-background-clip:text;background-clip:text;color:transparent}' +
    '.sv-head b{color:#fff}.sv-head .x{margin-left:auto;cursor:pointer;color:#caa}' +
    '.sv-log{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px;font-size:14px;color:#2a1a14}' +
    '.sv-msg{padding:8px 11px;border-radius:11px;max-width:88%;line-height:1.45}.sv-msg.ai{background:#f4efe2;align-self:flex-start}.sv-msg.me{background:' + ACCENT + ';color:#1a1410;align-self:flex-end}' +
    '.sv-bar{display:flex;gap:6px;padding:10px;border-top:1px solid #eadfc6}.sv-bar input{flex:1;border:1px solid #eadfc6;border-radius:999px;padding:8px 13px;font:14px inherit;outline:none}' +
    '.sv-bar button{border:0;background:' + ACCENT + ';color:#1a1410;width:36px;border-radius:50%;font-weight:800;cursor:pointer}' +
    '.sv-foot{font-size:10.5px;color:#8a7350;text-align:center;padding:0 0 8px}' +
    '.sv-ham{position:fixed;left:14px;top:14px;z-index:2147483000;width:36px;height:34px;border-radius:9px;border:1px solid ' + ACCENT + ';background:#fffdf8;cursor:pointer;font-size:17px;display:flex;align-items:center;justify-content:center}' +
    '.sv-nav{position:fixed;top:0;left:0;bottom:0;z-index:2147483001;width:270px;max-width:84vw;background:#fffdf8;border-right:1px solid ' + ACCENT + ';box-shadow:14px 0 40px rgba(0,0,0,.18);transform:translateX(-104%);transition:transform .3s;overflow-y:auto;padding:16px 0;font-family:-apple-system,system-ui,sans-serif}' +
    '.sv-nav.on{transform:none}.sv-nav h4{margin:0;padding:14px 18px 6px;font-size:11px;letter-spacing:.06em;color:#8a7350;font-weight:800}' +
    '.sv-nav a{display:flex;gap:10px;padding:10px 18px;color:#2a1a14;text-decoration:none;font-weight:600;font-size:14px;cursor:pointer}.sv-nav a:hover{background:rgba(201,168,76,.12)}' +
    '.sv-scrim{position:fixed;inset:0;z-index:2147483000;background:rgba(20,14,10,.3);display:none}.sv-scrim.on{display:block}';
  document.head.appendChild(css);
  // immersive layer — the sovereign CHARACTER + SOV SPACE world, full-screen over any host site
  css.textContent +=
    '.sv-tools{display:flex;gap:6px;padding:8px 10px;background:#faf6ee;border-bottom:1px solid ' + ACCENT + '55}' +
    '.sv-tbtn{flex:1;border:1px solid ' + ACCENT + '66;background:#fff;color:#2a1a14;font:600 12px -apple-system,system-ui,sans-serif;padding:8px 6px;border-radius:9px;cursor:pointer}' +
    '.sv-tbtn:hover{background:' + ACCENT + '22}' +
    '.sv-imm{position:fixed;inset:0;z-index:2147483020;background:rgba(8,6,4,.94);display:none}' +
    '.sv-imm.on{display:block}.sv-imm iframe{width:100%;height:100%;border:0;display:block}' +
    '.sv-imm .cl{position:fixed;top:14px;right:16px;z-index:2;border:1px solid ' + ACCENT + ';background:rgba(20,15,11,.92);color:' + ACCENT + ';border-radius:999px;padding:7px 15px;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer}';
  var SOVHOME = 'https://os.meok.ai';

  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  var orb = el('div', 'sv-orb', CFG.face || '🐉'); orb.title = 'Ask ' + BRAND + ' Sovereign';
  var panel = el('div', 'sv-panel');
  panel.appendChild(el('div', 'sv-head', '<span>' + (CFG.face || '🐉') + '</span><b>' + esc(BRAND) + ' Sovereign</b><span class="x">✕</span>'));
  // immersive tool row — the AI character + the SOV Space world, on top of THIS host site
  var tools = el('div', 'sv-tools',
    '<button class="sv-tbtn" data-imm="' + SOVHOME + '/character.html">🐉 Character</button>' +
    '<button class="sv-tbtn" data-imm="' + SOVHOME + '/sovspace3d.html">🌍 SOV Space</button>');
  panel.appendChild(tools);
  var log = el('div', 'sv-log'); panel.appendChild(log);
  var bar = el('div', 'sv-bar', '<input placeholder="Ask anything — I run this site"><button>➤</button>'); panel.appendChild(bar);
  panel.appendChild(el('div', 'sv-foot', 'governed &amp; Ed25519-signed by ' + esc(BRAND) + ' · SOV3'));
  document.body.appendChild(orb); document.body.appendChild(panel);
  // the immersive overlay: opens the sovereign character / SOV Space world full-screen over the host
  var imm = el('div', 'sv-imm', '<button class="cl">✕ close</button><iframe allow="camera *; microphone *"></iframe>');
  document.body.appendChild(imm);
  function openImmersive(url) { imm.querySelector('iframe').src = url; imm.classList.add('on'); }
  imm.querySelector('.cl').onclick = function () { imm.classList.remove('on'); imm.querySelector('iframe').src = ''; };
  [].slice.call(tools.querySelectorAll('.sv-tbtn')).forEach(function (b) { b.onclick = function () { openImmersive(b.getAttribute('data-imm')); }; });

  function say(who, html) { var m = el('div', 'sv-msg ' + who, html); log.appendChild(m); log.scrollTop = log.scrollHeight; return m; }
  function toggle(on) { panel.classList.toggle('on', on == null ? !panel.classList.contains('on') : on); if (panel.classList.contains('on') && !log.children.length) say('ai', "I'm your <b>" + esc(BRAND) + " Sovereign</b> — I run this site, know what's on screen, and act for you. Try “what governs a bank”, “verify a badge”, or “take me to plans”."); }
  orb.onclick = function () { toggle(); };
  panel.querySelector('.x').onclick = function () { toggle(false); };
  var input = bar.querySelector('input');
  function send() { var v = (input.value || '').trim(); if (!v) return; input.value = ''; say('me', esc(v)); memTurn('user', v);
    var goal = (v.match(/^(?:do|goal|achieve)\s*:\s*(.+)/i) || [])[1];
    if (goal) {  // AUTONOMOUS: run the PDCA loop, stream the trace into the dock
      var t = say('ai', '<b>PDCA →</b> ' + esc(goal));
      window.sovereign.pdca(goal, { max: 4, onStep: function (s) { t.innerHTML += '<br><span style="opacity:.7">' + esc(s.phase.toUpperCase()) + (s.via ? ' (' + esc(s.via) + ')' : '') + ':</span> ' + esc(s.text); log.scrollTop = log.scrollHeight; } })
        .then(function (r) { t.innerHTML += '<br><b>✓ ' + r.cycles + ' cycle(s).</b>'; memTurn('ai', 'ran PDCA ' + goal); }).catch(function () { t.innerHTML += '<br>paused — need a reachable brain to continue.'; });
      return;
    }
    var t = say('ai', '…');
    window.sovereign.brain(v).then(function (d) {
      t.innerHTML = esc(d.say || 'On it.') + (d.via && d.via !== 'online' ? ' <span style="opacity:.5;font-size:11px">· ' + esc(d.via) + '</span>' : '');
      memTurn('ai', d.say || '');
      if (d && d.actions) d.actions.forEach(function (a) { try { var fn = window.sovereignOSCommands[a.command]; if (fn) fn(a.args || {}); } catch (e) {} });
    }).catch(function () { t.innerHTML = 'I hear you — I can explain governance, verify signatures, or navigate. (Reconnecting.)'; }); }
  bar.querySelector('button').onclick = send; input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });

  /* ---------- P3: load a signed MEOK Hatch + VERIFY IT IN-BROWSER (Web Crypto Ed25519) ----------
     window.SOVEREIGN_CONFIG.hatch = 'https://os.meok.ai/api/hatch?name=Aria' → this site becomes a
     VERIFIED sovereign AI-OS: fetch the Hatch, verify its signature client-side (no trust in us),
     show a "✓ Sovereign-verified SOV:…" badge. Don't trust the widget — verify the identity. */
  function _hexToBytes(h) { h = String(h || ''); var a = new Uint8Array(h.length / 2); for (var i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; }
  window.sovereign = window.sovereign || {};
  window.sovereign.verifyHatch = async function (url) {
    var d = await (await fetch(url)).json(); var s = (d && d.signature) || {};
    if (!s.publicKey || !s.signature || !s.canonical || !(window.crypto && crypto.subtle && crypto.subtle.importKey)) return { ok: false, why: 'no-webcrypto-or-sig' };
    try {
      var key = await crypto.subtle.importKey('spki', _hexToBytes(s.publicKey), { name: 'Ed25519' }, false, ['verify']);
      var ok = await crypto.subtle.verify({ name: 'Ed25519' }, key, _hexToBytes(s.signature), new TextEncoder().encode(s.canonical));
      var pkg = d.hatch || d.package || {};
      return { ok: ok, fingerprint: s.fingerprint, seeded: s.seeded, name: (pkg.agent && pkg.agent.name), pkg: pkg };
    } catch (e) { return { ok: false, why: String(e.message || e) }; }
  };
  if (CFG.hatch) {
    window.sovereign.verifyHatch(CFG.hatch).then(function (v) {
      // LAUNCH the UX FROM the hatch: bind identity → memory namespace + persona (only trust it if verified)
      if (v.ok) { HFP = v.fingerprint || null; HNAME = v.name || null; HATCH = v.pkg || null;
        try { if (HNAME) panel.querySelector('.sv-head b').textContent = esc(HNAME); } catch (e) {}
        var greet = memLoad(); if (greet.facts.length) { /* returning citizen: memory carried over from another surface */ }
      }
      var badge = el('div', 'sv-badge', (v.ok ? '✓ Sovereign-verified' : '⚠ unverified') + ' · ' + esc(v.fingerprint || '') + (v.seeded ? '' : ' (demo key)'));
      badge.style.cssText = 'position:fixed;bottom:14px;left:14px;z-index:2147483000;font:600 11px ui-monospace,monospace;padding:6px 11px;border-radius:999px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.15);background:' + (v.ok ? 'rgba(19,122,75,.12);color:#137a4b;border:1px solid #b7e0c6' : 'rgba(179,38,30,.1);color:#b3261e;border:1px solid #f0c3bd');
      badge.title = (v.name ? v.name + ' — ' : '') + 'this AI-OS layer is a signed MEOK Hatch. Click to verify.';
      badge.onclick = function () { window.open('https://os.meok.ai/verify.html', '_blank'); };
      document.body.appendChild(badge);
      try { var f = document.querySelector('.sv-foot'); if (f && v.ok) f.innerHTML = 'signed MEOK Hatch · ' + esc(v.fingerprint || '') + ' · verified in your browser'; } catch (e) {}
    }).catch(function () {});
  }

  /* optional sidebar/menu from config.sections — so nobody rebuilds nav */
  if (Array.isArray(CFG.sections) && CFG.sections.length) {
    var ham = el('div', 'sv-ham', '☰'); ham.title = 'Menu';
    var scrim = el('div', 'sv-scrim'); var nav = el('div', 'sv-nav');
    nav.appendChild(el('h4', null, esc(BRAND) + ' · Sovereign OS'));
    CFG.sections.forEach(function (s) { var a = el('a', null, (s.icon ? s.icon + ' ' : '') + esc(s.label || '')); a.onclick = function () { if (s.href) location.href = s.href; else if (s.action && window.sovereignOSCommands[s.action]) window.sovereignOSCommands[s.action]({}); nav.classList.remove('on'); scrim.classList.remove('on'); }; nav.appendChild(a); });
    nav.appendChild(el('a', null, '🐉 Ask the Sovereign')).onclick = function () { nav.classList.remove('on'); scrim.classList.remove('on'); toggle(true); };
    document.body.appendChild(ham); document.body.appendChild(scrim); document.body.appendChild(nav);
    ham.onclick = function () { nav.classList.add('on'); scrim.classList.add('on'); };
    scrim.onclick = function () { nav.classList.remove('on'); scrim.classList.remove('on'); };
  }
})();
