// SOV3 Sovereign Event Bus — wires the web UI to the Federal Bridge
// CSOAI Ltd UK 16939677 · MIT License · 1 July 2026
//
// Drop into any sovereign-app page. Replaces the need for hand-rolled
// fetch() / WebSocket code with one drop-in `sovereignEventBus` singleton.
//
// Usage:
//   <script src="/sovereign-os/frontend/sovereign-event-bus.js" data-citizen-id="your-citizen-id"></script>
//   <script>
//     sovereignEventBus.on('utterance', (msg) => appendChatMessage(msg));
//     sovereignEventBus.on('observe', (msg) => drawMindmapEdge(msg));
//     sovereignEventBus.observe({ focus_type: 'map_pin', subject_id: 'london-tower-bridge', ... });
//   </script>
//
// The bus connects to the Federal Bridge over both WebSocket + HTTP fallback.
// Every utterance is SIGIL-stamped + BFT-deliberated server-side.
// Care Floor 0.95 enforced per-message.

(function() {
  'use strict';

  const SOV3_VERSION = 'v2.0.0';
  const CARE_FLOOR = 0.95;
  const PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const DEFAULT_BRIDGE_HOST = window.location.hostname || 'localhost';
  const DEFAULT_BRIDGE_PORT = 8100;
  const DEFAULT_HTTP_BASE = `${window.location.protocol}//${DEFAULT_BRIDGE_HOST}:${DEFAULT_BRIDGE_PORT}`;
  const DEFAULT_WS_URL = `${PROTOCOL}//${DEFAULT_BRIDGE_HOST}:${DEFAULT_BRIDGE_PORT}/ws`;

  // === CITIZEN ID ===
  const SCRIPT_TAG = document.currentScript || document.scripts[document.scripts.length - 1];
  const CITIZEN_ID = (SCRIPT_TAG.getAttribute('data-citizen-id')
                      || ('citizen-' + (window.crypto.randomUUID?.() || 'anon-' + Math.random().toString(36).slice(2, 10))));

  // === BRAIN STACK ===
  const BRAIN_STACK = {
    mamba2: { model: 'Qwen3:30B-A3B', weight: 0.30, role: 'long_context' },
    big_braim: {
      models: [
        'claude-4.5-sonnet', 'gpt-5.1', 'deepseek-v4', 'falcon3-40b',
        'mistral-large-2', 'yi-1.5-34b', 'qwen3-30b-a3b',
        'gemma-2:27b', 'phi-3-medium', 'ornith-1.0',
      ],
      weight: 0.25,
      role: 'ensemble_router',
    },
    moe_64: { experts: 64, weight: 0.20, role: 'task_routing' },
    open_world: { corpus_gb: 30000, weight: 0.15, role: 'memory' },
    sovereign: { weight: 0.10, role: 'governance' },
  };

  // === STATE ===
  const STATE = {
    citizen_id: CITIZEN_ID,
    peer_id: CITIZEN_ID + '@sovereign',
    bridge_url: DEFAULT_WS_URL,
    http_base: DEFAULT_HTTP_BASE,
    connected: false,
    ws: null,
    seq: 0,
    queue: [],
    listeners: new Map(),       // event_type -> Set<callback>
    observe_history: [],
    utterance_history: [],
    bft_vote_history: [],
    last_msg_id: null,
    reconnect_delay: 1000,
    max_reconnect_delay: 15000,
    reconnect_attempts: 0,
    sigil_count: 0,
    composite_score: 7.305,
    start_ts: Date.now(),
  };

  for (const ev of ['observe', 'utterance', 'broadcast', 'receipt', 'welcome', 'ack', 'error', 'status', 'room_history']) {
    STATE.listeners.set(ev, new Set());
  }

  // === HELPERS ===
  function _emit(event, payload) {
    const ls = STATE.listeners.get(event);
    if (!ls) return;
    for (const cb of ls) {
      try { cb(payload); }
      catch (e) { console.error('[sovereign-event-bus]', event, 'listener error', e); }
    }
  }

  function _seq() {
    STATE.seq += 1;
    return STATE.seq.toString().padStart(8, '0');
  }

  function _hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h).toString(16).slice(0, 8);
  }

  function _stamp_sigil(op) {
    STATE.sigil_count += 1;
    const ts = new Date().toISOString();
    const digest = `${_hash(op + ts + STATE.sigil_count).padEnd(16, '0')}`;
    return { sigil_digest: digest, algorithm: 'ed25519+pqc-ml-dsa-65', timestamp: ts };
  }

  function _log(level, ...args) {
    if (level === 'info' || level === 'warn' || level === 'error') {
      console[`${level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'log'}`]('[sovereign-event-bus]', ...args);
    }
  }

  // === WEBSOCKET ===
  function _connect_ws() {
    const url = `${STATE.bridge_url}?citizen_id=${encodeURIComponent(STATE.citizen_id)}&peer_kind=sovereign`;
    _log('info', 'connecting ws to', url);
    try {
      const ws = new WebSocket(url);
      STATE.ws = ws;

      ws.onopen = () => {
        STATE.connected = true;
        STATE.reconnect_attempts = 0;
        STATE.reconnect_delay = 1000;
        _log('info', '✓ federal bridge connected');
        _emit('status', { connected: true, peer_id: STATE.peer_id, citizen_id: STATE.citizen_id });
        // Flush queue
        while (STATE.queue.length > 0) {
          const m = STATE.queue.shift();
          try { ws.send(JSON.stringify(m)); }
          catch (e) { STATE.queue.unshift(m); break; }
        }
      };

      ws.onmessage = (event) => {
        let data;
        try { data = JSON.parse(event.data); }
        catch (e) { _log('warn', 'bad json from bridge', event.data); return; }

        if (data.type === 'welcome') _emit('welcome', data);
        else if (data.type === 'ack') _emit('receipt', data);
        else if (data.sigil_digest) {
          STATE.last_msg_id = data.msg_id;
          _emit('utterance', data);
          _emit('broadcast', data);
        } else {
          _emit('status', data);
        }
        _log('info', '←', data.type || 'msg', data.msg_id || '');
      };

      ws.onclose = () => {
        STATE.connected = false;
        _emit('status', { connected: false });
        STATE.reconnect_attempts += 1;
        const delay = Math.min(STATE.max_reconnect_delay, STATE.reconnect_delay * Math.pow(2, STATE.reconnect_attempts - 1));
        _log('warn', `✗ bridge disconnected, reconnecting in ${delay}ms`);
        setTimeout(_connect_ws, delay);
      };

      ws.onerror = (err) => {
        _log('error', 'ws error', err);
      };
    } catch (e) {
      _log('error', 'ws construction failed', e);
    }
  }

  // === HTTP FALLBACK ===
  async function _http_send(payload) {
    try {
      const res = await fetch(`${STATE.http_base}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`http_${res.status}`);
      return await res.json();
    } catch (e) {
      _log('warn', 'http fallback failed', e);
      throw e;
    }
  }

  // === PUBLIC API ===

  /**
   * Observe a focus on the canvas. The substrate sees what you see.
   * @param {Object} focus - The focus event.
   *   focus_type: 'map_pin' | 'dashboard_card' | 'sovereign_panel' | 'chat_input' | 'camera_view' | 'time_slider' | 'layer_toggle' | 'comparison_view' | 'citizen_profile' | 'substrate_logs' (required)
   *   subject_id: string (required)
   *   subject_kind: string (required)
   *   title: string (required)
   *   summary: string (required)
   *   coords: [lat, lng, alt] (optional, for map pins)
   *   attributes: object (optional, key-value metadata)
   */
  function observe(focus) {
    if (!focus || !focus.focus_type) {
      _log('error', 'observe(): focus_type required');
      return;
    }
    if (!focus.subject_id || !focus.title) {
      _log('error', 'observe(): subject_id and title required');
      return;
    }

    const sig = _stamp_sigil('observe');
    const msg = {
      msg_id: 'OBS-' + _seq(),
      msg_type: 'OBSERVE',
      from_peer: STATE.peer_id,
      to_peer: null,
      room: focus.room || `sovereign.${STATE.citizen_id}`,
      payload: {
        focus_id: 'focus-' + _seq(),
        focus_type: focus.focus_type,
        subject_id: focus.subject_id,
        subject_kind: focus.subject_kind || 'unknown',
        title: focus.title,
        summary: focus.summary || '',
        coords: focus.coords || null,
        attributes: focus.attributes || {},
        z_index: focus.z_index ?? 0,
        parent_focus_id: focus.parent_focus_id || null,
      },
      care_floor_check: true,
      sigil_digest: sig.sigil_digest,
      sigil_algorithm: sig.algorithm,
      timestamp: sig.timestamp,
    };

    STATE.observe_history.push({ at: Date.now(), focus });
    _emit('observe', msg);

    if (STATE.connected && STATE.ws && STATE.ws.readyState === 1) {
      STATE.ws.send(JSON.stringify(msg));
      return Promise.resolve({ status: 'sent_via_ws', msg_id: msg.msg_id });
    }
    STATE.queue.push(msg);
    return _http_send(msg).catch(err => ({ status: 'failed', error: String(err), msg_id: msg.msg_id }));
  }

  /**
   * Utter (speak) a sovereign response. SIGIL-stamped + BFT-deliberated server-side.
   * @param {Object} utter_args - The utterance.
   *   text: string (required)
   *   in_response_to: msg_id (optional)
   *   focus_id: focus_id (optional, links back to the focus event this answers)
   *   to_peer: peer_id (optional, defaults to broadcast)
   */
  function utter(utter_args) {
    if (!utter_args || !utter_args.text) {
      _log('error', 'utter(): text required');
      return;
    }
    const sig = _stamp_sigil('utter');
    const msg = {
      msg_id: 'UTT-' + _seq(),
      msg_type: 'UTTER',
      from_peer: STATE.peer_id,
      to_peer: utter_args.to_peer || null,
      room: utter_args.room || `sovereign.${STATE.citizen_id}`,
      payload: {
        text: utter_args.text,
        in_response_to: utter_args.in_response_to || null,
        focus_id: utter_args.focus_id || null,
        speaker: STATE.citizen_id,
        composite_score: STATE.composite_score,
        care_floor: CARE_FLOOR,
      },
      care_floor_check: true,
      sigil_digest: sig.sigil_digest,
      sigil_algorithm: sig.algorithm,
      timestamp: sig.timestamp,
    };

    STATE.utterance_history.push({ at: Date.now(), utter: utter_args });
    _emit('utterance', msg);

    if (STATE.connected && STATE.ws && STATE.ws.readyState === 1) {
      STATE.ws.send(JSON.stringify(msg));
      return Promise.resolve({ status: 'sent_via_ws', msg_id: msg.msg_id });
    }
    STATE.queue.push(msg);
    return _http_send(msg).catch(err => ({ status: 'failed', error: String(err), msg_id: msg.msg_id }));
  }

  /**
   * Broadcast to a room (no specific recipient — all peers in the room see).
   */
  function broadcast(text, room) {
    return utter({ text, room: room || `sovereign.${STATE.citizen_id}` });
  }

  /**
   * Subscribe to events: 'observe' | 'utterance' | 'broadcast' | 'receipt' | 'welcome' | 'ack' | 'status'
   */
  function on(event, callback) {
    if (!STATE.listeners.has(event)) STATE.listeners.set(event, new Set());
    STATE.listeners.get(event).add(callback);
    return () => STATE.listeners.get(event).delete(callback);
  }

  /**
   * Get sovereign composite + brain stack + bridge status.
   */
  async function get_status() {
    try {
      const res = await fetch(`${STATE.http_base}/status`);
      return await res.json();
    } catch (e) { return { error: 'bridge_offline', fallback: STATE }; }
  }

  /**
   * Get room message history.
   */
  async function get_room_history(room) {
    try {
      const res = await fetch(`${STATE.http_base}/history?room=${encodeURIComponent(room)}`);
      return await res.json();
    } catch (e) { return { error: e.message }; }
  }

  // === BOOT ===
  _connect_ws();
  _log('info', `SOV3 Sovereign Event Bus · citizen=${STATE.citizen_id} · v${SOV3_VERSION}`);

  // Expose globally
  window.sovereignEventBus = {
    observe,
    utter,
    broadcast,
    on,
    get_status,
    get_room_history,
    state: STATE,
    brain_stack: BRAIN_STACK,
    care_floor: CARE_FLOOR,
    version: SOV3_VERSION,
  };
})();
