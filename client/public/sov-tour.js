/* SOV TOUR — immersive AI voice tour for CSOAI / councilof.ai + the globe.
 * Voice matches DEFONEOS exactly (Google UK English Female, en-GB female fallback),
 * with word-by-word highlight ("karaoke") + a speaking state, per defoneos-com/sovereign-kit.js.
 * Every line is honest: it narrates the MEASURED estate — no simulated telemetry.
 * Runs on any page. Auto-starts on ?tour=1; otherwise injects a "Take the tour" button.
 */
(function (global) {
  'use strict';
  if (global.__sovTour) return; global.__sovTour = true;
  var synth = global.speechSynthesis;

  // ---- DEFONEOS voice selection (verbatim logic) ----
  function bestVoice() {
    try {
      var v = (synth && synth.getVoices()) || [];
      return v.find(function (x) { return /Google UK English Female/.test(x.name); })
        || v.find(function (x) { return /en-GB/.test(x.lang) && /female/i.test(x.name); })
        || v.find(function (x) { return /en-GB/.test(x.lang); })
        || v.find(function (x) { return /^en/.test(x.lang); }) || null;
    } catch (e) { return null; }
  }

  // ---- honest tour steps (the measured estate) ----
  var STEPS = [
    { sel: null, title: 'CSOAI',
      say: "Welcome. I am your guide to CSOAI, the measurement body for AI compliance. Everything I show you is measured and signed. Nothing here is claimed that has not been proven." },
    { sel: '[data-tour="measures"], nav, header', title: '12 Measures',
      say: "This is the Arena. Twelve Measures of AI governance, from governance and safety to provenance and post quantum continuity. Each one is a real benchmark with a real number and an interval." },
    { sel: '[data-tour="asi"], a[href*="pqcbench"]', title: 'The discriminator',
      say: "Our strongest signal is post quantum continuity. Thirty three measurements. It is the one axis that cleanly separates frontier models, spread of nought point two nine five. Measured, not asserted." },
    { sel: '[data-tour="jail"], a[href*="defbench"]', title: 'The empty lane',
      say: "And here is what makes us credible. The containment lane is empty, and we say so plainly. We publish what we have not measured, not only what we have." },
    { sel: '[data-tour="ledger"], a[href*="ledger"], a[href*="refut"]', title: 'The ledger',
      say: "Every claim traces to a signed card. We have published seven refutations. Four times we killed our own bad ideas. That discipline is the product." },
    { sel: '[data-tour="globe"], canvas, #globe, #cesiumContainer', title: 'The globe',
      say: "All of it lives on the globe. Every measure anchored to the law it maps, positioned on Earth. Governance you can see." },
    { sel: null, title: 'Measured. Signed. Honest.',
      say: "That is CSOAI. Measured. Signed. Honest. No black box. Thank you for taking the tour." }
  ];

  var wrapEl, bubble, i = -1, active = false;

  function css() {
    if (document.getElementById('sov-tour-css')) return;
    var s = document.createElement('style'); s.id = 'sov-tour-css';
    s.textContent =
      '.sov-tour-btn{position:fixed;right:20px;bottom:20px;z-index:99998;background:#0b0b12;color:#FFD700;border:1px solid #FFD700;border-radius:999px;padding:12px 18px;font:600 14px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 24px rgba(255,215,0,.25)}' +
      '.sov-tour-btn:hover{background:#FFD700;color:#0b0b12}' +
      '.sov-tour-scrim{position:fixed;inset:0;background:rgba(4,4,10,.62);z-index:99997;opacity:0;transition:opacity .4s;pointer-events:none}' +
      '.sov-tour-scrim.on{opacity:1}' +
      '.sov-tour-spot{position:fixed;z-index:99997;border-radius:14px;box-shadow:0 0 0 3px #FFD700,0 0 60px rgba(255,215,0,.5),0 0 0 9999px rgba(4,4,10,.62);transition:all .5s cubic-bezier(.2,.8,.2,1);pointer-events:none}' +
      '.sov-tour-bubble{position:fixed;z-index:99999;max-width:min(460px,86vw);background:#0b0b12;color:#eee;border:1px solid #FFD700;border-radius:16px;padding:18px 20px;font:16px/1.55 system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.6),0 0 40px rgba(255,215,0,.15);transition:all .45s}' +
      '.sov-tour-bubble .h{color:#FFD700;font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;display:flex;gap:8px;align-items:center}' +
      '.sov-tour-bubble .h .dot{width:9px;height:9px;border-radius:50%;background:#FFD700;box-shadow:0 0 10px #FFD700}' +
      '.sov-tour-bubble.speaking .h .dot{animation:sovpulse 1s infinite}' +
      '@keyframes sovpulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.7);opacity:.5}}' +
      '.sov-tour-bubble w{transition:color .12s,text-shadow .12s}' +
      '.sov-tour-bubble w.on{color:#FFD700;text-shadow:0 0 12px rgba(255,215,0,.6)}' +
      '.sov-tour-bubble .row{margin-top:14px;display:flex;gap:8px;justify-content:flex-end}' +
      '.sov-tour-bubble button{background:#FFD700;color:#0b0b12;border:0;border-radius:999px;padding:8px 16px;font-weight:700;cursor:pointer}' +
      '.sov-tour-bubble button.ghost{background:transparent;color:#888;border:1px solid #333}';
    document.head.appendChild(s);
  }

  function wrapWords(text) {
    return text.split(/(\s+)/).map(function (t) {
      return /\S/.test(t) ? '<w>' + t + '</w>' : t;
    }).join('');
  }

  function ensureUI() {
    css();
    if (!document.getElementById('sov-tour-scrim')) {
      var sc = document.createElement('div'); sc.id = 'sov-tour-scrim'; sc.className = 'sov-tour-scrim'; document.body.appendChild(sc);
    }
    if (!bubble) {
      bubble = document.createElement('div'); bubble.className = 'sov-tour-bubble'; bubble.style.display = 'none';
      document.body.appendChild(bubble);
    }
  }

  function spotlight(sel) {
    var el = sel ? document.querySelector(sel) : null;
    var old = document.querySelector('.sov-tour-spot');
    if (!el) { if (old) old.remove(); document.getElementById('sov-tour-scrim').classList.add('on'); return null; }
    document.getElementById('sov-tour-scrim').classList.remove('on'); // spot provides the scrim
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    var r = el.getBoundingClientRect();
    var spot = old || document.createElement('div');
    spot.className = 'sov-tour-spot';
    var pad = 8;
    spot.style.left = Math.max(0, r.left - pad) + 'px';
    spot.style.top = Math.max(0, r.top - pad) + 'px';
    spot.style.width = (r.width + pad * 2) + 'px';
    spot.style.height = (r.height + pad * 2) + 'px';
    if (!old) document.body.appendChild(spot);
    return spot;
  }

  function placeBubble(spot) {
    var b = bubble.getBoundingClientRect();
    if (!spot) { bubble.style.left = '50%'; bubble.style.top = '50%'; bubble.style.transform = 'translate(-50%,-50%)'; return; }
    var r = spot.getBoundingClientRect(); bubble.style.transform = 'none';
    var below = r.bottom + 16 + b.height < innerHeight;
    bubble.style.top = (below ? r.bottom + 16 : Math.max(16, r.top - b.height - 16)) + 'px';
    bubble.style.left = Math.min(Math.max(16, r.left), innerWidth - b.width - 16) + 'px';
  }

  function runStep() {
    if (!active) return;
    if (i >= STEPS.length) return end();
    var step = STEPS[i];
    var spot = spotlight(step.sel);
    bubble.style.display = '';
    bubble.innerHTML = '<div class="h"><span class="dot"></span>' + step.title + '</div><div class="body">' + wrapWords(step.say) +
      '</div><div class="row"><button class="ghost" onclick="SovTour.end()">Skip</button><button onclick="SovTour.next()">Next →</button></div>';
    placeBubble(spot);
    speak(step.say, bubble.querySelector('.body'));
  }

  function speak(text, el) {
    if (!synth) { return; }
    var words = el ? el.querySelectorAll('w') : [];
    try {
      var u = new SpeechSynthesisUtterance(text);
      var v = bestVoice(); if (v) u.voice = v;
      u.lang = 'en-GB'; u.rate = 0.98; u.pitch = 1.0;
      var wi = -1;
      u.onstart = function () { bubble.classList.add('speaking'); };
      u.onboundary = function (ev) { if (ev.name && ev.name !== 'word') return; wi++; for (var k = 0; k < words.length; k++) words[k].classList.toggle('on', k === wi); };
      u.onend = function () { bubble.classList.remove('speaking'); for (var k = 0; k < words.length; k++) words[k].classList.add('on'); };
      u.onerror = function () { bubble.classList.remove('speaking'); };
      synth.cancel(); synth.speak(u);
    } catch (e) {}
  }

  var SovTour = {
    start: function () {
      ensureUI(); active = true; i = 0;
      // getVoices() is async in some browsers — warm it
      if (synth && !synth.getVoices().length) { synth.onvoiceschanged = function () { runStep(); synth.onvoiceschanged = null; }; setTimeout(runStep, 400); }
      else runStep();
    },
    next: function () { i++; runStep(); },
    end: function () {
      active = false; if (synth) synth.cancel();
      if (bubble) bubble.style.display = 'none';
      var sp = document.querySelector('.sov-tour-spot'); if (sp) sp.remove();
      var sc = document.getElementById('sov-tour-scrim'); if (sc) sc.classList.remove('on');
    }
  };
  global.SovTour = SovTour;

  function bootBtn() {
    css();
    var b = document.createElement('button'); b.className = 'sov-tour-btn';
    b.innerHTML = '🐉 Take the tour';
    b.onclick = function () { SovTour.start(); };
    document.body.appendChild(b);
  }

  function boot() {
    if (/[?&]tour=1/.test(location.search)) SovTour.start();
    else bootBtn();
    addEventListener('resize', function () { if (active) { var s = document.querySelector('.sov-tour-spot'); if (s) placeBubble(s); } });
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
})(window);
