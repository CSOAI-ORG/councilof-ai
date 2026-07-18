# Sovereign Kit for CSOAI (and any .ai site) — hand this to M2

Add the Sovereign AI-OS to any site in **one line**. Dock + chat + optional sidebar/menu, wired
to the **shared sovereign backend**, so nobody rebuilds sidebars, menus, or the Sovereign again.

---

## 1. Drop it in (copy-paste)
```html
<!-- config first (optional) -->
<script>
window.SOVEREIGN_CONFIG = {
  brand: 'CSOAI',
  accent: '#c9a84c',
  face: '🐉',
  // builds the ☰ left sidebar/menu for you — no rebuild
  sections: [
    { label: 'Home',   href: '/' },
    { label: 'Graph',  href: '/graph',  icon: '🕸️' },
    { label: 'World',  href: '/world-3d', icon: '🌍' },
    { label: 'Plans',  href: '/plans',  icon: '💎' },
    { label: 'Verify', href: '/verify', icon: '✓' }
  ],
  // your own actions the AI can invoke (extend freely)
  commands: {
    open_graph:  () => location.href = '/graph',
    highlight_country: (a) => window.myMap && window.myMap.flyTo(a.country)
  }
};
</script>
<!-- then the kit -->
<script src="https://os.meok.ai/sovereign-embed.js" defer></script>
```
You now have: a 🐉 orb (bottom-right), a chat panel, a ☰ sidebar from `sections`, and a Sovereign
that **speaks + takes real actions** and answers governance questions. Nothing else to build.

---

## 2. Make the Sovereign your AI-OS (control the map / page)
The kit exposes two globals — the **shared contract** (same one MEOK & DEFONEOS use):

- **`window.getScreenContext()`** — what the Sovereign SEES. Override it to feed your map state:
  ```js
  window.getScreenContext = () => ({
    surface: 'csoai-web', url: location.pathname, title: document.title,
    selected_node: window.myMap?.selected,       // ← what the user clicked on the map
    active_layers: window.myMap?.layers, view: window.myMap?.view
  });
  ```
- **`window.sovereignOSCommands`** — what it can DO. Add yours (merged with defaults
  `navigate/open_section/scroll_to`):
  ```js
  window.sovereignOSCommands.focus_node = (a) => window.myMap.select(a.id);
  window.sovereignOSCommands.load_layer = (a) => window.myMap.toggleLayer(a.layer);
  ```
Then when a user **clicks a map pin**, tell the Sovereign to explain it in chat:
```js
myMap.on('pinClick', node => window.sovereign.ask('Tell me about ' + node.name)
  .then(d => { /* d.say shown automatically if you route through the dock, or render it */ }));
```
The Sovereign reads `getScreenContext()`, so its answer is **in sync with what's on screen**.

---

## 3. The shared backend — `os.meok.ai/api/*` (all CORS `*`, use directly)
| Endpoint | Call | Returns |
|---|---|---|
| `/api/orchestrate` | `window.sovereign.ask(text)` | `{say, actions:[{command,args}]}` — the brain (speaks + controls the OS) |
| `/api/govern` | `window.sovereign.govern('bank')` | real frameworks (EU AI Act/DORA/HIPAA…) + bridges |
| `/api/bridge` | `window.sovereign.validate(msg)` | validate IBAN/ISO20022/HL7/ISO8583/SWIFT |
| `/api/sign` · `/api/verify` | `window.sovereign.sign(action)` / `.verify({message,signature,publicKey})` | **Ed25519** sign / verify offline (the SIGIL moat) |
| `/api/nodes` | `window.sovereign.nodes()` | canonical sovereign node graph (build your map from this) |
| `/api/chat` · `/api/knowledge` · `/api/tools` · `/api/badge` · `/api/avatar` | fetch | council brain · live world facts · tool router · authority badge · character |

Everything is already CORS-open — CSOAI calls the SAME endpoints MEOK & DEFONEOS use.

---

## 4. SOV3 (what users see) vs SOV33 (the master, behind everything)
- **SOV3** = the public Sovereign users interact with on each site (this kit). Warm, governed,
  signs every action. Front-end never sees the master.
- **SOV33** = the **master King orchestrator** — King · Hive · SIGIL · Horus — running *over all
  sites/AI-OSes*. It **learns from every site**, holds the sovereign King key, adjudicates (BFT
  council + Care Floor 0.95), and can **edit/operate every business**. SOV3 is its public face.
- **How they connect:** every SOV3 surface calls `os.meok.ai/api/*`; those endpoints are the
  seam SOV33 fronts/governs. When SOV33's local brain (SOV3 substrate `:8000/v1` or the King hive)
  is reachable, point `window.SOV3_BRAIN_ENDPOINT` at it and the same dock uses the master brain;
  otherwise it uses the public shared brain. **Same contract either way** — so SOV33 can reach into
  any site, read its `getScreenContext()`, and run its `sovereignOSCommands` to work on that business.

---

## 5. SIGIL / governance (the moat, working)
- Every governed action → `window.sovereign.sign(action)` → **Ed25519** signature + public key.
- Anyone verifies offline → `window.sovereign.verify({message, signature, publicKey})`. No account.
- Set one env var **`SIGIL_SEED`** (the sovereign King seed) on the backend and **all sites sign
  with the identical sovereign identity** — one SIGIL across MEOK/CSOAI/DEFONEOS. (DEFONEOS's PQC
  ML-DSA-65 folds in as a second signature field; Ed25519 is the interop baseline all verify.)

---

## 6. What M2 does NOT have to build
Sidebar/menu (config-driven), the chat dock, the Sovereign brain, governance lookup, signing,
legacy-bridge validation, the node graph, world knowledge. All shared. M2 just: (a) drop the kit,
(b) map their own `getScreenContext()`/commands to their map, (c) call the endpoints for governance.

Source: `os.meok.ai/sovereign-embed.js` (MIT). Backend contract + adopt-path for DEFONEOS:
`clawd/SHARED_SOVEREIGN_BACKEND_2026-07-01.md`.

— M4
