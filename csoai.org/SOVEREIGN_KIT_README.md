# Sovereign Kit — drop the DEFONEOS AI-OS into any CSOAI app

**One file. ~2 lines. Any web app gets a governed AI-OS Sovereign** — chat sidebar, voice (with a visible speaking state), state-awareness, function-calling control of *your* app, and Ed25519 SIGIL signing on every action. Built once for the DEFONEOS globe; extracted so **M2 never rebuilds sidebars / menus / Sovereign / AI-governance again.**

- File: `csoai.org/sovereign-kit.js` (MIT, ~6 KB, zero dependencies — pulls `@noble/ed25519` from a CDN at runtime for signing).
- Works on any page: a map, a dashboard, a plain site. Your app just exposes its actions as "commands" and (optionally) reports what's on screen.

---

## 1. Quick start (copy-paste)

```html
<script src="/sovereign-kit.js"></script>
<script>
Sovereign.init({
  brand: 'CSOAI · MY APP',

  // (A) Expose YOUR app's actions as tools the Sovereign can call:
  commands: {
    go_to:        { desc:'fly / scroll to a place', params:{ q:'string' },              run:a => myApp.goTo(a.q) },
    toggle_layer: { desc:'toggle a data layer',      params:{ name:'string', on:'boolean' }, run:a => myApp.layer(a.name, a.on) },
    open_panel:   { desc:'open a panel/tool',        params:{ id:'string' },             run:a => myApp.open(a.id) },
  },

  // (B) Tell it what's on screen so answers are state-aware (not blind):
  getContext: () => ({ view: myApp.view(), layers: myApp.activeLayers(), selected: myApp.selection() }),

  // (C) OPTIONAL — a real reasoning brain (OpenAI-compatible / local SOV3):
  brainEndpoint: 'http://localhost:8000/v1',   // omit → echo/handler mode
  brainModel: 'sov3-sovereign-v2',
  brainKey: '',                                // stays on the device, never logged

  // (D) OPTIONAL — fallback when there's no brain (your existing parser):
  onCommand: text => myApp.parse(text),        // return true if you handled it

  voice: true,      // speak replies (default on)
  autoOpen: true,   // open the panel on load
});
</script>
```

That's it. A cyan Sovereign panel docks on the right, listens (🎙), speaks, and drives your app.

---

## 2. The config API

| Key | Type | What |
|---|---|---|
| `brand` | string | Name shown in the panel header (e.g. `"CSOAI · GRC"`). |
| `commands` | object | **The tool set.** Each key = a tool name. `{ desc, params, run }`. `params` = `{ name: 'string'|'number'|'boolean' }`. `run(args)` executes it and returns any JSON result. |
| `getContext` | function | Returns a small JSON of current app state (view, layers, selection…). Injected into the brain so it *sees* the screen. Keep it to a few hundred tokens — IDs and values, not geometry. |
| `brainEndpoint` | string | OpenAI-compatible `/chat/completions` base URL. Local SOV3 = `http://localhost:8000/v1`. Cloud = `https://api.openai.com/v1`, OpenRouter, etc. Omit → no LLM (uses `onCommand`/echo). |
| `brainModel` | string | Model id. Default `sov3-sovereign-v2`. |
| `brainKey` | string | Bearer key (device-local, optional). |
| `onCommand` | function | Fallback intent handler when there's no brain or the brain is unreachable. Return `true`/Promise<true> if handled. This is where your existing rule parser plugs in. |
| `voice` | bool | Speak replies + show the speaking state. Default `true`. |
| `autoOpen` | bool | Auto-open the panel on load. |

**Public methods:** `Sovereign.ask(text)`, `Sovereign.reply(text)`, `Sovereign.speak(text)`, `Sovereign.sigil(action, detail)`, `Sovereign.context()`, `Sovereign.ledger()`.

---

## 3. How the loop works (what you get for free)

```
citizen types / speaks
   → Sovereign.ask(text)                         [+ SIGIL 'ask' signed]
   → getContext() → system prompt (it SEES the app state)
   → POST brainEndpoint/chat/completions with your tools
   → LLM returns tool_calls → each runs commands[name].run(args)   [+ SIGIL 'tool:x' signed]
   → tool results fed back → LLM streams final answer
   → answer rendered in chat + SPOKEN, words highlighting in time   [+ SIGIL 'utter' signed]
   → if no brain reachable → falls back to onCommand(text)
```

- **State-awareness** is the honest web approach (read the app, not the pixels) — cheaper, faster, private, works on mobile. (Screen-capture + vision is 1–3 s latency, costly, and unsupported on mobile web — don't.)
- **Governance is locked:** every ask / tool / utterance is Ed25519-signed into a hash-chained SIGIL ledger (`Sovereign.ledger()` to export; verify independently). The system prompt refuses surveillance / kinetic-targeting / private-CCTV. Add your Care-Floor / BFT server-side behind the brain endpoint (the DEFONEOS/SOV3 pattern).

---

## 4. Connecting the brain (local / online / offline)

| Mode | `brainEndpoint` | Notes |
|---|---|---|
| **Local SOV3** (sovereign) | `http://localhost:8000/v1` | Your SOV3 substrate — air-gappable, care-floor + BFT + SIGIL server-side. |
| **Online (any provider)** | `https://api.openai.com/v1`, OpenRouter, etc. | Set `brainKey`. Subscription or PAYG (x402). |
| **Offline** | *(omit)* | No network. Uses `onCommand` (your rules) + on-device speech. Still signs. |

The endpoint must accept OpenAI `chat/completions` with `tools` (function-calling). SOV3, OpenAI, Anthropic-via-proxy, OpenRouter, Ollama (`/v1`), vLLM, LM Studio all work.

---

## 5. The DEFONEOS reference (already built — copy the patterns)

The live reference implementation is the DEFONEOS dome (`defoneos-com/cop.html`). Everything below is proven there and is the source of this kit:

- **Sovereign chat + voice + visible speaking** (equalizer, word-highlight, amplitude lip-sync for Piper).
- **`window.getScreenContext()`** — the state introspection (view/zone, layers, extras, open windows, selection, doctrine, brain, user).
- **`window.sovereignOSCommands`** — the command adapter (load_layer, weather_radar, set_view, fly_to, scan_area, run_scenario, local_places, open_tool, compare_doctrines, emit_sigil, speak, run_command).
- **`sovBrain(text)`** — the LLM loop this kit generalises.
- **Brain Setup UI** — 12 sovereign mindsets (Strategist, Guardian, Sentinel, Scout, Counsel, Companion, Quant, Cyber, Maker, Oracle, Mamba-Edge, Custom) × left/right **sandwich** (model type LLM/MoE/**MoM**/SLM/World/Reasoning/Multimodal × provider) × local/online/offline × tier (Free/Pro £199/PAYG). The OOWM stack: **Mamba-2 → 64-expert MoE → BIG BRAIM router → open weights → Sovereign Layer-0**.
- **Top-bar pattern** — Globe/Dome view modes + Demo/Light-up/Sim/Compare/Sitrep/Cinematic.
- **SIGIL verifier** — `verify.html` re-checks the ledger independently (tamper-evident).

To match DEFONEOS's brain schema exactly, expose your app's actions under the same command names where they map (so one SOV3 backend drives every CSOAI app identically).

---

## 6. For M2 — what to do

1. Drop `sovereign-kit.js` into the CSOAI app.
2. Write the `commands` map (your app's real functions) + `getContext()` (your app's state). *That's the only per-app work.*
3. Point `brainEndpoint` at the shared SOV3 endpoint (or leave it off and wire `onCommand` to the existing parser).
4. Ship. The sidebar, chat, voice, speaking-state, signing, and governance framing are all handled.

**Honest limits:** the kit gives the *client* AI-OS layer. The reasoning quality + Care-Floor/BFT enforcement live behind the `brainEndpoint` (the SOV3 backend at `csoai.org/sovereign-os/backend/`). Photoreal-3D map tiles (Google) need Map Tiles API billing. Screen-capture "vision" is intentionally not included — structured `getContext()` is the right call.

— CSOAI Ltd · MIT · reuse freely across the empire.
