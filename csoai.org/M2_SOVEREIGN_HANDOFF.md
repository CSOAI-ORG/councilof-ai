# → HAND THIS TO M2 · Add the Sovereign AI-OS to any CSOAI map/app

**Goal:** put the DEFONEOS "Sovereign" (chat sidebar + voice + governance + brain that drives the app) onto your map **without rebuilding sidebars, menus, chat, voice, signing, or AI-governance.** Two files do it. Your only job is a `commands` map + a `getContext()`.

**Files (already built, MIT, in this repo):**
- `csoai.org/sovereign-kit.js` — the drop-in library (~6 KB, zero deps).
- `csoai.org/SOVEREIGN_KIT_README.md` — full API reference.

---

## 30-second version

```html
<script src="/sovereign-kit.js"></script>
<script>
Sovereign.init({
  brand: 'CSOAI · MY APP',
  commands: {                                   // ← YOUR app's real actions, as tools
    go_to:        { desc:'fly to a place',  params:{ q:'string' },               run:a => myApp.goTo(a.q) },
    toggle_layer: { desc:'toggle a layer',  params:{ name:'string', on:'boolean'}, run:a => myApp.layer(a.name,a.on) },
    open_panel:   { desc:'open a panel',    params:{ id:'string' },              run:a => myApp.open(a.id) },
  },
  getContext: () => myApp.state(),              // ← what's on screen (so it isn't blind)
  brainEndpoint: 'http://localhost:8000/v1',    // ← shared SOV3 (or omit for rule mode)
  brainModel: 'sov3-sovereign-v2',
});
</script>
```

You get, for free: a docked Sovereign panel, 🎙 hands-free voice, replies **spoken with a visible speaking state + word-highlight**, **Ed25519 SIGIL** signing of every ask/tool/utterance, and an LLM loop that reads your state and calls your tools.

---

## COMPLETE runnable example — a CSOAI map + Sovereign (copy this whole file)

Uses Leaflet as a stand-in "map app". Swap the `myApp` functions for your real ones — the Sovereign wiring is identical for Cesium, MapLibre, a dashboard, anything.

```html
<!DOCTYPE html><html><head><meta charset="utf-8"><title>CSOAI · Sovereign map</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0;background:#05070f}</style></head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  // ---- 1) YOUR app (whatever it already is) ----
  const map = L.map('map').setView([51.5,-0.12], 5);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  const layers = { risk:L.layerGroup(), assets:L.layerGroup(), incidents:L.layerGroup() };
  const active = new Set();
  const PLACES = { london:[51.5,-0.12], kyiv:[50.45,30.5], tokyo:[35.68,139.7], 'new york':[40.71,-74] };

  const myApp = {
    goTo: q => { const p = PLACES[(q||'').toLowerCase().trim()]; if(p){ map.flyTo(p, 9); return {ok:true, at:q}; } return {ok:false, error:'unknown place'}; },
    layer: (name,on) => { const g=layers[name]; if(!g) return {ok:false,error:'no layer '+name}; if(on!==false){ g.addTo(map); active.add(name);} else { map.removeLayer(g); active.delete(name);} return {ok:true,layer:name,on:on!==false}; },
    open: id => { alert('open panel: '+id); return {ok:true,panel:id}; },
    // the state the Sovereign 'sees' — keep it small (IDs + values, not geometry):
    state: () => ({ center: map.getCenter(), zoom: map.getZoom(), active_layers:[...active], available_layers:Object.keys(layers) }),
  };
</script>

<!-- ---- 2) THE SOVEREIGN (drop-in) ---- -->
<script src="/sovereign-kit.js"></script>
<script>
Sovereign.init({
  brand: 'CSOAI · RISK MAP',
  commands: {
    go_to:        { desc:'fly the map to a named place',  params:{ q:'string' },               run:a => myApp.goTo(a.q) },
    toggle_layer: { desc:'toggle a map layer on/off',      params:{ name:'string', on:'boolean' }, run:a => myApp.layer(a.name, a.on) },
    open_panel:   { desc:'open a side panel by id',        params:{ id:'string' },              run:a => myApp.open(a.id) },
  },
  getContext: () => myApp.state(),
  // brainEndpoint: 'http://localhost:8000/v1',   // ← uncomment to reason with SOV3
  onCommand: text => {                            // ← fallback parser when no brain
    const t = text.toLowerCase();
    const place = Object.keys({london:1,kyiv:1,tokyo:1,'new york':1}).find(p=>t.includes(p));
    if (place) { myApp.goTo(place); Sovereign.reply('Flying to '+place+'.'); return true; }
    if (/risk|asset|incident/.test(t)) { const L=t.match(/risk|assets?|incidents?/)[0].replace(/s$/,''); myApp.layer(L, !/off|hide/.test(t)); Sovereign.reply(L+' layer toggled.'); return true; }
    return false;
  },
  voice: true, autoOpen: true,
});
</script>
</body></html>
```

Open it → the Sovereign docks, you say/type *"go to kyiv"* or *"show risk"* → the map moves, it speaks, and each action is signed. Add `brainEndpoint` and it reasons over the same tools instead of the rule fallback.

---

## The `commands` contract (this is the whole integration)

Each command = a tool the Sovereign can invoke.

```js
name: {
  desc:   'plain-English description (the LLM reads this to decide when to use it)',
  params: { field:'string' | 'number' | 'boolean', ... },   // JSON-schema-lite
  run:    (args) => { /* do the thing */ return { ok:true, ...result }; }   // sync or Promise
}
```

Rules of thumb:
- Expose **actions, not internals** — `toggle_layer`, `go_to`, `open_panel`, `run_report`, `filter_by`, `compare`, `export`.
- `run` returns a small JSON result — the Sovereign feeds it back and continues.
- Keep `getContext()` **small** (a few hundred tokens): current view, active layers, selection, mode. IDs and values, not full geometry. This is how it "sees the screen" — the honest, fast, mobile-safe way (do **not** screen-capture).

---

## Governance & the AI-OS (where each piece lives)

| Layer | Where | What |
|---|---|---|
| **SIGIL** (Ed25519 signing) | **in the kit, client-side** | Every ask/tool/utterance hash-chained + signed on-device. `Sovereign.ledger()` exports it; verify independently (see DEFONEOS `verify.html`). |
| **Care-Floor + BFT council** | **your brain endpoint** (`sovereign-os/backend/`) | The refuse-or-pass + 12-around-1 vote per utterance. Enforced server-side, returned in the response. |
| **Refusals** (surveillance / kinetic / private-CCTV) | kit system prompt + backend | Hard-coded in the prompt; back it with server policy. |
| **The brain** (reasoning) | `brainEndpoint` (SOV3 local or any OpenAI-compatible) | Function-calling model. Same endpoint across all CSOAI apps = one brain, one governance. |

**One brain, every app:** point every CSOAI product's `brainEndpoint` at the shared SOV3 (`csoai.org/sovereign-os/backend/server.py`, OpenAI-compatible). Use the **same command names** where they map, and the identical Sovereign+governance runs everywhere.

---

## Match DEFONEOS exactly (optional, recommended)

To make CSOAI apps feel like one product, mirror the DEFONEOS brain schema:
- **12 sovereign mindsets**: Strategist · Guardian · Sentinel · Scout · Counsel · Companion · Quant · Cyber · Maker · Oracle · Mamba-Edge · Custom.
- **OOWM sandwich stack**: Mamba-2 → 64-expert MoE → BIG BRAIM router → open weights → Sovereign Layer-0. Left brain (reason) ⟂ right brain (imagine), each a model-type × provider mixture.
- **Modes**: Local SOV3 / Online (provider) / Offline. **Tiers**: Free (persona) / Pro £199 / PAYG (x402).
- Reference build: `defoneos-com/cop.html` (`getScreenContext`, `sovereignOSCommands`, `sovBrain`, `brainPanel`).

---

## M2 checklist

- [ ] Add `<script src="/sovereign-kit.js">`.
- [ ] Write `commands` (your app's real functions) + `getContext()`.
- [ ] Set `brainEndpoint` to the shared SOV3 (or leave off + wire `onCommand`).
- [ ] (Optional) match the DEFONEOS command names + mindsets for a unified feel.
- [ ] Ship. Sidebar, chat, voice, speaking-state, signing, governance = handled.

**Do NOT** rebuild the panel/menus/voice/signing — the kit is the canonical one; improve it there so every app benefits.

— CSOAI Ltd (UK 16939677) · MIT · reuse freely across the empire.
