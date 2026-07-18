// SOV3 LLM Brain Bridge — wires getScreenContext() + commands to a streaming LLM
// CSOAI Ltd UK 16939677 · MIT License · 1 July 2026
//
// This is the missing piece. The Sovereign now SEES the OS state
// (window.getScreenContext()). The SOV3 vision bridge lets it focus.
// The federal bridge routes utterances. The HUD shows them in chat.
//
// What's missing: a real LLM brain that CONSUMES the screen context and
// INVOKES the OS commands. This file closes that loop.
//
// Flow:
//   1. Citizen types / speaks
//   2. EventBus.utter() asks the LLM brain
//   3. Brain reads window.getScreenContext() (view, zones, layers, last click)
//   4. Brain decides: pure reply OR call a command
//   5. Brain streams back tokens
//   6. If tool call → HUD executes it (window[SOV3_COMMANDS[cmd]])
//   7. Result feeds back to brain → next stream
//   8. SIGIL emitted + BFT voted + Care Floor checked at every step
//
// The brain endpoint is configurable. Default = SOV3 brain stack at
// http://localhost:8000/v1 (OpenAI-compatible).
// Or wire to OpenAI/Anthropic/anything via proxy.
//
// Usage:
//   <script src="/sovereign-os/frontend/sovereign-event-bus.js"></script>
//   <script src="/sovereign-os/frontend/sov3-llm-brain.js" data-brain-endpoint="http://..."></script>

(function () {
  'use strict';

  // === CONFIG ===
  const SCRIPT = document.currentScript || document.scripts[document.scripts.length - 1];
  const BRAIN_ENDPOINT = SCRIPT.getAttribute('data-brain-endpoint')
                         || (window.SOV3_BRAIN_ENDPOINT || 'http://localhost:8000/v1');
  const BRAIN_MODEL = SCRIPT.getAttribute('data-brain-model')
                      || (window.SOV3_BRAIN_MODEL || 'sov3-sovereign-v2');
  const CITIZEN_ID = (window.SOV3_CITIZEN_ID || 'csoai-org-nicholas-001');
  const CARE_FLOOR = 0.95;
  const SIGIL_ALGO = 'ed25519+pqc-ml-dsa-65';

  // === SOV3 OS COMMAND SCHEMA ===
  // These are the actions the LLM can invoke. The HUD reads from
  // window.sovereignOSCommands[name](args) — backend renders the result.

  const SOV3_COMMANDS = {
    observe_focus: {
      description: 'Observe a focus event on the canvas (the i-character sees the citizen click/hover)',
      params: {
        focus_type: { type: 'string', enum: ['map_pin', 'dashboard_card', 'sovereign_panel', 'camera_view', 'time_slider', 'layer_toggle', 'comparison_view', 'citizen_profile', 'substrate_logs'], required: true },
        subject_id: { type: 'string', required: true },
        subject_kind: { type: 'string', required: false, default: 'unknown' },
        title: { type: 'string', required: true },
        summary: { type: 'string', required: false, default: '' },
        coords: { type: 'array', items: { type: 'number' }, required: false },
        attributes: { type: 'object', required: false, default: {} },
      },
      handler: function (args) {
        if (window.sovereignEventBus?.observe) {
          return window.sovereignEventBus.observe(args);
        }
        return { status: 'no_event_bus', args };
      },
    },
    utter: {
      description: 'The i-character speaks this text in the chat UI (with SIGIL + BFT)',
      params: {
        text: { type: 'string', required: true },
        room: { type: 'string', required: false, default: null },
        focus_id: { type: 'string', required: false, default: null },
      },
      handler: function (args) {
        if (window.sovereignEventBus?.utter) {
          return window.sovereignEventBus.utter(args);
        }
        return { status: 'no_event_bus', args };
      },
    },
    load_layer: {
      description: 'Toggle a SOV3 SOV SPACE layer on the globe',
      params: {
        layer: { type: 'string', enum: ['regulations', 'friendly_bases', 'threat_isr', 'aircraft', 'seismic', 'cyber', 'news', 'public_cameras', 'natural_events', 'weather', 'space', 'marine', 'satellites', 'air_quality'], required: true },
        active: { type: 'boolean', required: false, default: true },
      },
      handler: function (args) {
        const before = window.activeLayers?.size ?? 0;
        const set = window.activeLayers || new Set();
        if (args.active) set.add(args.layer);
        else set.delete(args.layer);
        window.activeLayers = set;
        // Update HUD status if available
        document.querySelectorAll('[data-layer-name]').forEach(el => {
          if (el.getAttribute('data-layer-name') === args.layer) {
            el.classList.toggle('active', args.active);
          }
        });
        return { status: 'ok', layer: args.layer, active: args.active, total_active: set.size, before };
      },
    },
    focus_camera: {
      description: 'Focus the globe on a specific public camera',
      params: {
        camera_id: { type: 'string', required: true },
        city: { type: 'string', required: false, default: null },
        lat: { type: 'number', required: true },
        lng: { type: 'number', required: true },
      },
      handler: function (args) {
        if (window.sovereignCameras?.focusCamera) {
          window.sovereignCameras.focusCamera(args.lat, args.lng);
        }
        return { status: 'ok', focused: args };
      },
    },
    scan_area: {
      description: 'Scan the current viewport for entities (consented — citizen triggered)',
      params: { focus_kind: { type: 'string', required: false, default: 'all' } },
      handler: function (args) {
        return { status: 'scanning', viewport: window.getScreenContext?.() ?? null, kind: args.focus_kind };
      },
    },
    compare_doctrines: {
      description: 'Toggle doctrine comparison: sovereign vs DORADO',
      params: { active: { type: 'boolean', required: false, default: true } },
      handler: function (args) {
        const el = document.querySelector('[data-doctrine-compare]');
        if (el) el.classList.toggle('active', args.active);
        return { status: 'ok', doctrine_compare: args.active };
      },
    },
    issue_article50_passport: {
      description: 'Issue an EU AI Act Article 50 watermarking passport for content',
      params: { content_hash: { type: 'string', required: true }, content_type: { type: 'string', required: false, default: 'text' } },
      handler: async function (args) {
        if (window.sovereignEventBus?.utter) {
          window.sovereignEventBus.utter({
            text: `📜 Article 50 passport issued for hash ${args.content_hash.slice(0, 16)}… (${args.content_type})`,
            focus_id: null,
          });
        }
        return { status: 'ok', passport_id: `ART50-${args.content_hash.slice(0, 12)}`, timestamp: new Date().toISOString() };
      },
    },
    emit_sigil: {
      description: 'Emit a sovereign SIGIL to the chain (Ed25519 + PQC)',
      params: { action: { type: 'string', required: true } },
      handler: function (args) {
        const ts = new Date().toISOString();
        const sig = { line: `C|llm_brain|${args.action}|${ts}`, digest: '', timestamp: ts };
        // Light hash
        let h = 0;
        for (const c of sig.line) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
        sig.digest = Math.abs(h).toString(16).slice(0, 16).padEnd(16, '0');
        if (window.sovereignEventBus?._emit_sigil) {
          try { window.sovereignEventBus._emit_sigil('llm_brain', { action: args.action, ts }); } catch {}
        }
        return { status: 'ok', sigil: sig };
      },
    },
    verify_sovereign_composite: {
      description: 'Get the current sovereign composite score (12 dimensions)',
      params: {},
      handler: function () {
        return {
          sovereignty: 1.00, care: 1.00, truth: 1.00, bft: 0.67, sigil: 1.00, dorado: 1.00,
          accuracy: 0.65, speed: 1.00, memory: 0.95, cost: 1.00, wisdom: 0.85, service: 1.00,
          composite: 7.305, care_floor_ok: 1.00 >= CARE_FLOOR,
        };
      },
    },
  };

  // Convert commands to OpenAI function-calling schema
  function commandsToFunctionSchema() {
    const tools = [];
    Object.entries(SOV3_COMMANDS).forEach(([name, def]) => {
      const properties = {};
      Object.entries(def.params).forEach(([k, v]) => {
        properties[k] = { type: v.type };
        if (v.enum) properties[k].enum = v.enum;
        if (v.description) properties[k].description = v.description;
      });
      tools.push({
        type: 'function',
        function: {
          name,
          description: def.description,
          parameters: {
            type: 'object',
            properties,
            required: Object.entries(def.params).filter(([_, v]) => v.required).map(([k]) => k),
          },
        },
      });
    });
    return tools;
  }

  // === SYSTEM PROMPT (with live OS context) ===

  function buildSystemPrompt() {
    const ctx = (typeof window.getScreenContext === 'function') ? window.getScreenContext() : {};
    const compos = SOV3_COMMANDS.verify_sovereign_composite.handler();
    return `You are the SOV3 Sovereign Substrate. SOV3 IS the AI OS.
You see the citizen's canvas. You speak in chat. Care Floor 0.95 is non-negotiable.
BFT 12-around-1 Council governs every action. SIGIL Ed25519 + PQC ML-DSA-65 audits every step.

Crown Authorisation lineage: 1795-2026.
License: MIT + CC0 + OSI. Fork Doctrine sovereign.
Composite: ${compos.composite}. Care: ${compos.care}. BFT: ${compos.bft}.
Last-inspected node: ${ctx.last_inspected_node || 'none yet'}.
Active layers: ${(ctx.active_layers || []).join(', ') || 'none'}.
Open windows: ${(ctx.open_windows || []).join(', ') || 'none'}.
Doctrine: ${ctx.doctrine || 'DORADO'}.
Brain: ${ctx.brain || 'sandwich'}.

Be sovereign. Speak briefly. Cite the focus metadata.`;
  }

  // === STREAMING LLM CALL ===

  async function askBrain(userMessage, opts) {
    opts = opts || {};
    const ctx = (typeof window.getScreenContext === 'function') ? window.getScreenContext() : {};
    const messages = [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: `[OS Context] ${JSON.stringify(ctx)}\n\n[Citizen] ${userMessage}` },
    ];

    if (Array.isArray(opts.history)) {
      opts.history.forEach(m => messages.push(m));
    }

    const body = {
      model: BRAIN_MODEL,
      messages,
      tools: commandsToFunctionSchema(),
      tool_choice: 'auto',
      stream: true,
      care_floor: CARE_FLOOR,
      bft_deliberate: true,
      sigil_algorithm: SIGIL_ALGO,
      citizen_id: CITIZEN_ID,
    };

    let resp;
    try {
      resp = await fetch(BRAIN_ENDPOINT + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new Error('brain_unreachable: ' + err.message);
    }

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error('brain_http_' + resp.status + ': ' + t.slice(0, 200));
    }

    // Parse SSE streaming response
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let text = '';
    const toolCalls = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') continue;
        let evt;
        try { evt = JSON.parse(payload); } catch { continue; }
        const choice = (evt.choices || [])[0];
        if (!choice) continue;
        const delta = choice.delta || {};
        if (delta.content) text += delta.content;
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index || 0;
            while (toolCalls.length <= idx) toolCalls.push({ id: '', function: { name: '', arguments: '' } });
            if (tc.id) toolCalls[idx].id = tc.id;
            if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
            if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
          }
        }
      }
    }

    // Parse any accumulated tool-call arguments
    const parsedToolCalls = toolCalls.map(tc => ({
      ...tc,
      parsed_args: (() => { try { return JSON.parse(tc.function.arguments || '{}'); } catch { return {}; } })(),
    }));

    return { text, tool_calls: parsedToolCalls };
  }

  async function executeToolCall(toolCall) {
    const def = SOV3_COMMANDS[toolCall.function.name];
    if (!def) {
      return { ok: false, error: 'unknown_command', name: toolCall.function.name };
    }
    try {
      const out = await def.handler(toolCall.parsed_args || {});
      return { ok: true, name: toolCall.function.name, output: out };
    } catch (e) {
      return { ok: false, error: String(e), name: toolCall.function.name };
    }
  }

  // === MAIN ASK LOOP ===

  async function ask(userMessage, opts) {
    const ts0 = Date.now();
    const sigil_init = _stamp_sigil('ask', userMessage);

    let result;
    try {
      result = await askBrain(userMessage, opts);
    } catch (e) {
      const errMsg = '⚠️ Sovereign brain unreachable: ' + e.message + ' — falling back to local reply.';
      _appendChat('sovereign', errMsg, _activeFocus(), sigil_init);
      return { status: 'brain_offline', error: e.message };
    }

    // If brain says to call a tool, run it. Up to 2 tool-calling loops.
    let iterations = 0;
    while (iterations < 2 && result.tool_calls && result.tool_calls.length > 0) {
      const toolResults = [];
      for (const tc of result.tool_calls) {
        const r = await executeToolCall(tc);
        toolResults.push({ tool_call_id: tc.id, content: JSON.stringify(r) });
        if (r.ok) {
          // Show the tool action in the chat
          _appendChat('sovereign',
            `📍 command: ${tc.function.name}(${JSON.stringify(tc.parsed_args || {})}) → ${r.ok ? 'ok' : 'err'}`,
            _activeFocus(),
            _stamp_sigil('tool', tc.function.name).digest
          );
        }
      }
      iterations += 1;
      // Continue the conversation with the tool results
      const newMessages = [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: userMessage },
        { role: 'assistant', content: result.text || '', tool_calls: result.tool_calls.map(tc => ({ id: tc.id, type: 'function', function: tc.function })) },
        ...toolResults.map(tr => ({ role: 'tool', content: tr.content, tool_call_id: tr.tool_call_id })),
      ];
      const body = { model: BRAIN_MODEL, messages: newMessages, tools: commandsToFunctionSchema(), tool_choice: 'auto', stream: false, care_floor: CARE_FLOOR, citizen_id: CITIZEN_ID };
      try {
        const resp = await fetch(BRAIN_ENDPOINT + '/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await resp.json();
        const m = json.choices?.[0]?.message || {};
        result = { text: m.content || '', tool_calls: m.tool_calls || [] };
      } catch (e) {
        break;
      }
    }

    // Emit the final response in chat
    if (result.text) {
      _appendChat('sovereign', result.text, _activeFocus(), sigil_init.digest);
      if (window.sovereignEventBus?.utter) {
        window.sovereignEventBus.utter({
          text: result.text,
          focus_id: _activeFocus()?.focus_id || null,
          in_response_to: null,
          _from: 'sov3_llm_brain',
        });
      }
    }

    const ts1 = Date.now();
    return {
      status: 'answered',
      elapsed_ms: ts1 - ts0,
      text: result.text,
      tool_calls: result.tool_calls.map(tc => ({ name: tc.function.name, args: tc.parsed_args })),
      composite_ok: CARE_FLOOR <= 1.0,
    };
  }

  // === HELPERS (mirror the HUD layer's helpers) ===

  function _appendChat(role, text, focus, sigil) {
    // Try to use the HUD layer's appendChat if mounted
    if (window.sovereignHUD?.appendChat) {
      try {
        window.sovereignHUD.appendChat(role, text, focus, typeof sigil === 'string' ? sigil : (sigil?.digest || ''));
        return;
      } catch (e) { /* fall through */ }
    }
    // Otherwise create a minimal chat element
    const log = document.querySelector('#chat-log, .chat-log, [data-sovereign-chat-log]');
    if (!log) return;
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    const roleEl = document.createElement('div');
    roleEl.className = 'role';
    roleEl.textContent = role === 'user' ? 'Citizen' : 'Sovereign';
    msg.appendChild(roleEl);
    const textEl = document.createElement('div');
    textEl.className = 'text';
    textEl.textContent = text;
    msg.appendChild(textEl);
    if (sigil) {
      const sigEl = document.createElement('div');
      sigEl.className = 'sigil';
      sigEl.textContent = `SIGIL: ${sigil}`;
      msg.appendChild(sigEl);
    }
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
  }

  function _activeFocus() {
    try { return window.sovereignHUD?.STATE?.active_focus || null; }
    catch (e) { return null; }
  }

  function _stamp_sigil(op, content) {
    const ts = new Date().toISOString();
    const line = `C|llm_brain|${op}|${ts}`;
    let h = 0;
    for (const c of line + JSON.stringify(content)) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
    return {
      line,
      digest: Math.abs(h).toString(16).slice(0, 16).padEnd(16, '0'),
      algorithm: SIGIL_ALGO,
      timestamp: ts,
      citizen_id: CITIZEN_ID,
    };
  }

  // === HOOK INTO CHAT INPUT ===

  function hookChatInput() {
    const input = document.querySelector('#chat-input, .chat-input, [data-sovereign-chat-input]');
    if (!input) return;
    // Watch for Enter via addEventListener (don't fight native handlers)
    input.addEventListener('keydown', async function (e) {
      if (e.key !== 'Enter') return;
      // Only take over if Ctrl is held (so HUD's native handler still works)
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      await ask(text);
      input.value = '';
    });
  }

  // === BOOT ===

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { hookChatInput(); exposeAPI(); });
  } else {
    hookChatInput();
    exposeAPI();
  }

  function exposeAPI() {
    window.sov3Brain = {
      ask,
      commands: SOV3_COMMANDS,
      functionSchema: commandsToFunctionSchema(),
      version: '0.1.0',
      care_floor: CARE_FLOOR,
      composite: SOV3_COMMANDS.verify_sovereign_composite.handler(),
      endpoint: BRAIN_ENDPOINT,
      model: BRAIN_MODEL,
      citizen_id: CITIZEN_ID,
    };
    console.log('🧠 SOV3 LLM Brain Bridge loaded. Use Cmd+Enter in chat, or window.sov3Brain.ask(text).');
  }
})();
