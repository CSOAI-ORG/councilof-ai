/**
 * sov-tour.js — Shared tour engine (CSOAI + MEOK)
 * Step = {target, camera, narration, dataRef}
 * URL-hash state for shareable pitch links.
 * Deck mode: ?deck=1 hides chrome, auto-advances, 16:9 safe area.
 * REGISTER: every number is REAL (wired endpoint) or badged SIMULATED.
 */

(function (global) {
  'use strict';

  const defaults = {
    rootSelector: '#sov-tour',
    stepAttr: 'data-step',
    deckQuery: 'deck',
    autoAdvanceMs: 8000,
    hashPrefix: 'step',
  };

  function SovTour(opts) {
    this.opts = Object.assign({}, defaults, opts);
    this.steps = opts.steps || [];
    this.step = 0;
    this.deck = new URLSearchParams(location.search).get(this.opts.deckQuery) === '1';
    this.timer = null;
    this.onStep = opts.onStep || function () {};
    this.onEnd = opts.onEnd || function () {};
    this.init();
  }

  SovTour.prototype.init = function () {
    this.readHash();
    if (this.deck) this.enterDeck();
    this.render();
    this.bind();
    if (this.deck) this.startAutoAdvance();
  };

  SovTour.prototype.readHash = function () {
    const m = location.hash.match(new RegExp('^#' + this.opts.hashPrefix + '(\\d+)$'));
    if (m) { this.step = Math.max(0, Math.min(this.steps.length - 1, parseInt(m[1], 10))); }
  };

  SovTour.prototype.setHash = function () {
    history.replaceState(null, '', '#' + this.opts.hashPrefix + this.step);
  };

  SovTour.prototype.enterDeck = function () {
    document.documentElement.classList.add('sov-deck');
  };

  SovTour.prototype.startAutoAdvance = function () {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.step >= this.steps.length - 1) { this.onEnd(this); return; }
      this.next();
    }, this.opts.autoAdvanceMs);
  };

  SovTour.prototype.stopAutoAdvance = function () {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  };

  SovTour.prototype.go = function (n) {
    this.step = Math.max(0, Math.min(this.steps.length - 1, n));
    this.setHash();
    this.render();
    this.onStep(this.step, this.steps[this.step], this);
  };

  SovTour.prototype.next = function () { this.go(this.step + 1); };
  SovTour.prototype.prev = function () { this.go(this.step - 1); };

  SovTour.prototype.render = function () {
    const root = document.querySelector(this.opts.rootSelector);
    if (!root) return;
    root.setAttribute('data-step-idx', String(this.step));
    const dots = root.querySelectorAll('[data-dot]');
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === this.step);
      d.setAttribute('aria-current', i === this.step ? 'step' : 'false');
    });
    const narrations = root.querySelectorAll('[data-narration]');
    narrations.forEach((el) => {
      const idx = parseInt(el.getAttribute('data-narration') || '0', 10);
      el.style.display = idx === this.step ? '' : 'none';
    });
    const cameraTriggers = root.querySelectorAll('[data-camera]');
    cameraTriggers.forEach((el) => {
      const idx = parseInt(el.getAttribute('data-camera') || '0', 10);
      el.style.display = idx === this.step ? '' : 'none';
    });
  };

  SovTour.prototype.bind = function () {
    const root = document.querySelector(this.opts.rootSelector);
    if (!root) return;
    root.querySelector('[data-action="prev"]')?.addEventListener('click', () => { this.stopAutoAdvance(); this.prev(); });
    root.querySelector('[data-action="next"]')?.addEventListener('click', () => { this.stopAutoAdvance(); this.next(); });
    root.querySelector('[data-action="replay"]')?.addEventListener('click', () => { this.stopAutoAdvance(); this.go(0); if (this.deck) this.startAutoAdvance(); });
    root.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => { this.stopAutoAdvance(); this.go(parseInt(el.getAttribute('data-goto') || '0', 10)); });
    });
  };

  // ── Data-source helpers (register-aware) ──
  SovTour.prototype.fetchJSON = function (url, opts) {
    return fetch(url, Object.assign({ cache: 'no-store' }, opts))
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  };

  // Badge a value as SIMULATED
  SovTour.simulatedBadge = function (label) {
    return '<span class="sov-badge-simulated" aria-label="Simulated data">SIMULATED</span>' +
           (label != null ? '<span class="sov-simulated-val">' + label + '</span>' : '');
  };

  // Badge a value as REAL with verify link
  SovTour.realBadge = function (value, verifyHref, sourceName) {
    const v = value != null ? String(value) : '—';
    const verify = verifyHref
      ? '<a class="sov-verify" href="' + verifyHref + '" target="_blank" rel="noopener">Verify this number ↗</a>'
      : '';
    return '<span class="sov-badge-real" aria-label="Real data from ' + (sourceName || 'endpoint') + '">LIVE</span>' +
           '<span class="sov-real-val">' + v + '</span>' + verify;
  };

  // Expose
  global.SovTour = SovTour;
})(typeof globalThis !== 'undefined' ? globalThis : window);
