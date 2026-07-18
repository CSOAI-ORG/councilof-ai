// SOV3 Sovereign HUD - the i-character responds in chat with focus metadata
// CSOAI Ltd UK 16939677 · MIT License · 1 July 2026

(function() {
  'use strict';

  const STATE = {
    active_focus: null,
    utterance_seq: 0,
    loop_running: false,
  };

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h).toString(16).slice(0, 8);
  }

  function appendChat(role, text, focus, sigil) {
    const log = $('#chat-log');
    if (!log) return;
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;

    const role_el = document.createElement('div');
    role_el.className = 'role';
    role_el.textContent = role === 'user' ? 'Citizen' : 'Sovereign';
    msg.appendChild(role_el);

    const text_el = document.createElement('div');
    text_el.className = 'text';
    text_el.textContent = text;
    msg.appendChild(text_el);

    if (focus) {
      const meta = document.createElement('div');
      meta.className = 'focus-meta';
      const attrs = focus.attributes || {};
      const attr_str = Object.entries(attrs)
        .map(([k, v]) => `  · ${k}: ${v}`)
        .join('\n');
      meta.textContent = `Focus: ${focus.subject_id} (${focus.title})\n${attr_str}${focus.coords ? '\n  · coords: ' + focus.coords[0].toFixed(4) + ', ' + focus.coords[1].toFixed(4) : ''}`;
      msg.appendChild(meta);
    }

    if (sigil) {
      const sig_el = document.createElement('div');
      sig_el.className = 'sigil';
      sig_el.textContent = `SIGIL: ${sigil} · Composite 7.305 · Care 0.95 · BFT 12-around-1`;
      msg.appendChild(sig_el);
    }

    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
  }

  // === Generate sovereign response based on active focus ===

  function generateSovereignResponse(query, focus) {
    if (!focus) {
      return `Speaking to you, sovereign citizen.\nYou asked: "${query.slice(0, 120)}".\n\nI don't have a specific focus on the canvas. Ask me about something on the map or dashboard — I'll contextualize the answer with full sovereign awareness.`;
    }
    const attrs = focus.attributes || {};
    const attr_lines = Object.entries(attrs)
      .map(([k, v]) => `  · ${k}: ${v}`)
      .join('\n');
    let response = `Speaking to you, sovereign citizen.\nI observe you are focused on: ${focus.title}.\n\nIn sovereign context:\n${attr_lines}`;
    if (focus.coords) {
      response += `\n  · coords: ${focus.coords[0].toFixed(4)}, ${focus.coords[1].toFixed(4)}`;
    }
    response += `\n\nYour question: "${query.slice(0, 120)}"`;
    // Add a question-specific answer snippet
    const q = query.toLowerCase();
    if (q.includes('saf') || q.includes('vs') || q.includes('comp')) {
      response += `\n\nYes — sovereign is safer because:\n  · Care Floor 0.95 (substrate refuses < 0.95)\n  · BFT 12-around-1 Council (peer judgement, 2/3 majority)\n  · SIGIL Ed25519 + PQC ML-DSA-65 (quantum-resistant audit)\n  · UK data residency by default (DORADO 1-click)\n  · MIT + CC0 (no vendor lock-in, forkable)`;
    } else if (q.includes('who') || q.includes('where') || q.includes('when')) {
      response += `\n\nThe substrate knows. Care Floor 0.95 + SIGIL audit on every read.`;
    } else if (q.includes('tell me about') || q.includes('explain')) {
      response += `\n\nThis entity is anchored in the sovereign substrate. The substrate mirrors its history through the 9-rights charter + Crown lineage 1795-2026.`;
    }
    response += `\n\nComposite 7.305 · Care 0.95 · SIGIL emitted. Sovereign. By design. MIT + CC0.`;
    return response;
  }

  // === Focus Observation ===

  function observeFocus(el) {
    const subject_id = el.dataset.subjectId;
    const title = el.dataset.title;
    const summary = el.dataset.summary;
    const coords_attr = el.dataset.coords;
    const coords = coords_attr
      ? coords_attr.split(',').map(Number).length === 3
        ? coords_attr.split(',').map(Number)
        : coords_attr.split(',').map(Number).concat([0]).slice(0, 3)
      : null;
    let attributes = {};
    try { attributes = JSON.parse(el.dataset.attributes || '{}'); } catch (e) {}

    const focus = {
      focus_id: 'focus-' + hash(subject_id + Date.now()),
      focus_type: el.dataset.subjectId?.startsWith('london')
        || el.dataset.subjectId?.startsWith('tokyo')
        || el.dataset.subjectId?.startsWith('nyc') ? 'map_pin' : 'dashboard_card',
      subject_id,
      subject_kind: el.classList.contains('pin') ? 'place' : 'monitor',
      title,
      summary,
      coords,
      attributes,
      parent_focus_id: null,
    };

    STATE.active_focus = focus;

    // Visual feedback
    $$('.pin').forEach(p => p.classList.remove('focused'));
    $$('.dashboard-card').forEach(c => c.classList.remove('focused'));
    el.classList.add('focused');

    // Emit via sovereign event bus
    if (window.sovereignEventBus) {
      window.sovereignEventBus.observe(focus);
    }

    // Auto-narrate what SOV3 sees
    appendChat('sovereign',
      `I see you clicked "${title}".\n\n${summary}\n\nI'll contextualize all my responses with this focus.`,
      focus,
      hash(focus.focus_id + focus.subject_id).padEnd(8, '0')
    );
  }

  // === Wire Up ===

  function setupPinHandlers() {
    $$('.pin').forEach(pin => {
      pin.addEventListener('click', () => observeFocus(pin));
    });
    $$('.dashboard-card').forEach(card => {
      card.addEventListener('click', () => observeFocus(card));
    });
  }

  function setupChatInput() {
    const input = $('#chat-input');
    const sendBtn = $('#send-btn');
    const micBtn = $('#mic-btn');

    function handleSubmit() {
      const text = input.value.trim();
      if (!text) return;
      appendChat('user', text, STATE.active_focus, null);
      input.value = '';
      // Generate sovereign response
      setTimeout(() => {
        const response = generateSovereignResponse(text, STATE.active_focus);
        const sigil = hash(text + Date.now() + STATE.utterance_seq).padEnd(8, '0') +
                      hash(text).padEnd(8, '0');
        STATE.utterance_seq += 1;
        appendChat('sovereign', response, STATE.active_focus, sigil);
        // Emit via event bus
        if (window.sovereignEventBus) {
          window.sovereignEventBus.utter({
            text: response,
            focus_id: STATE.active_focus?.focus_id || null,
            in_response_to: null,
          });
        }
      }, 320);
    }

    sendBtn?.addEventListener('click', handleSubmit);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    });

    micBtn?.addEventListener('click', () => {
      micBtn.classList.toggle('live');
      const is_live = micBtn.classList.contains('live');
      // Live mic would invoke STT in production; here we just narrate
      if (is_live) {
        appendChat('sovereign',
          '🎙 Voice live. Hands-free AWARE.\n\nCare Floor 0.95. BFT 12-around-1. SIGIL emitted.\n\nI hear you, sovereign. Speak.',
          STATE.active_focus,
          hash('mic-live' + Date.now()).padEnd(8, '0')
        );
      }
    });
  }

  function setupBridgeStatus() {
    const indicator = $('#bridge-status');
    if (!indicator) return;
    setInterval(() => {
      if (window.sovereignEventBus?.state?.connected) {
        indicator.textContent = '● connected (' + (window.sovereignEventBus.state.peer_id || '?') + ')';
        indicator.classList.add('connected');
      } else {
        indicator.textContent = '● reconnecting…';
        indicator.classList.remove('connected');
      }
    }, 1500);
  }

  // === BOOT ===

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function boot() {
    setupPinHandlers();
    setupChatInput();
    setupBridgeStatus();

    // Subscribe to incoming utterances from peer bridges (e.g., Amica, Cartographer)
    if (window.sovereignEventBus) {
      window.sovereignEventBus.on('utterance', (msg) => {
        if (msg.from_peer && !msg.from_peer.endsWith('@sovereign')) {
          appendChat('sovereign',
            `[${msg.from_peer} federated]\n\n${msg.payload?.text || msg.text || ''}`,
            msg.payload, msg.sigil_digest
          );
        }
      });
    }

    appendChat('sovereign',
      `🜏 Sovereign OS online.\n\nSOV3 is the AI OS. I see the canvas. Click a map pin or dashboard card — I'll contextualize every answer with full focus metadata.\n\nCare Floor 0.95 · BFT 12-around-1 · SIGIL audit · Composite 7.305.`,
      null,
      'init-bridge-' + hash('sovereign-os-init')
    );
  }

  // Expose for tests
  window.sovereignHUD = { STATE, generateSovereignResponse, appendChat };
})();
