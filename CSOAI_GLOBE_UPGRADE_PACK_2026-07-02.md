# CSOAI Sovereign Globe — audit + upgrade pack to DEFONEOS level
**Target:** https://csoai-v2-app.vercel.app/globe.html (MapLibre GL globe, ~26 KB, single file).
**Goal:** bring it level with the DEFONEOS dome, but for **AI governance · cybersecurity · AI economy**.
**Compiled 2026-07-02** from a full source read + live-dependency e2e.

---

## E2E audit — what's real, what isn't, what's stale

### ✅ Real & good (keep)
- **MapLibre globe** (globe projection + sky), 12 jurisdiction nodes with tier (binding/emerging/voluntary), sovereign-AI, tool counts, frameworks, Layer-0 controls, per-node click panel, "Fly to" jumps, projection toggle, legend.
- **Sovereign-Town flywheel is LIVE** — `fetch(proofof-site/sovereign-town/status.json)` returns real `{cum_episodes:1.446B, governed_crimes:0, ungoverned_crimes:121M, hives:28…}`. The 0-vs-121M moat is genuinely data-backed.
- **"Ask the Sovereign about this jurisdiction"** wires to the shared dock (`window.sovereign.ask` from `os.meok.ai/sovereign-embed.js`, which loads 200 OK).
- Compliance ring (Art-50 readiness), governed-vs-ungoverned test animation, time slider, Bitcoin-anchor link.

### ⚠️ Fake / decorative presented as real (honesty-register fixes — P0)
1. **`mcpGeo` = 290 RANDOM points** (`Math.random()*22-11` around nodes) rendered as *"290 governance servers"*. → **Wire the real fleet** (`/api/mcps`) or label "illustrative distribution".
2. **`buildSwarm()` = 320 RANDOM points** rendered as *"governed agents — live"*. → same: real agents or label illustrative.
3. **`Bitcoin block 954857`** hardcoded in the test proof. → pull the block from the anchor JSON, or drop the specific number.

### ⚠️ Stale / inaccurate regulatory data (accuracy — P0)
- **EU: `"2 Aug 2026 — Art 50"`** is stale. Per the **Digital Omnibus** (political agreement May 2026): **Art 50 transparency → 2 Dec 2026**, **high-risk Annex III → 2 Dec 2027**. Kill "Aug 2 2026".
- **US: `"EO 14110"`** was **revoked (Jan 2025)**. Current US baseline = **OMB M-24-10 / agency AI use policy + NIST AI RMF** (+ state laws: Colorado AI Act 1 Jan 2027, California). Update the framework list.
- **South Korea `"Jan 2026 — AI Act"`** — the AI Basic Act enforcement is **Jan 2026**; verify exact date. Add **CMMC 2.0 Phase-2 (10 Nov 2026)** and **FedRAMP-OSCAL (30 Sep 2026)** to the US radar. (Full matrix: `~/clawd/_compintel/regulators-matrix.md`.)

### 🕳️ Capability gaps vs DEFONEOS (the roadmap)
No living hover-cards · no real MCP/agent wiring · no signed-per-node artifact · no OSCAL/CoT-style export · no cyber self-scan · no governance "POC" chain (the Rainbow→council→refuse→sign moment) · no AI-economy layer · flywheel scope not reconciled with DEFONEOS (121M all-hosts vs 54.3M mac-host).

---

## Priorities
- **P0 (today, honesty+accuracy):** wire real MCP fleet OR label random layers illustrative; fix EU/US dates; de-hardcode the Bitcoin block; reconcile the flywheel scope caption.
- **P1 (real-data + engagement):** living hover-cards; regulator "next-7-dates" radar from the matrix; per-jurisdiction **signed** governance snapshot.
- **P2 (the three pillars, the DEFONEOS-level leap):** Governance-POC chain · Cyber self-scan (reuse `godseye.html`) · AI-economy layer (x402 signed-attestation).

---

## Drop-in code (paste into globe.html)

### 1 · Replace random MCP points with the REAL fleet (or label illustrative)
```js
// was: const mcpGeo = {...290 Math.random points...}  — REPLACE with real fleet
fetch('https://os.meok.ai/api/mcps').then(r=>r.json()).then(d=>{
  const list = (d.mcps||d.matches||[]).filter(m=>m.name);
  // scatter real servers around their cluster's anchor jurisdiction (deterministic, labelled)
  const feats = list.map((m,i)=>{ const b=NODES[i%NODES.length];
    return {type:'Feature',geometry:{type:'Point',coordinates:[b.c[0]+((i*37)%22-11),b.c[1]+((i*19)%16-8)]},
            properties:{name:m.name,cluster:m.clusterLabel||m.category||'',tools:m.tools||0}}; });
  const src=map.getSource('mcp'); if(src) src.setData({type:'FeatureCollection',features:feats});
  document.querySelector('.stat:nth-child(4) b').textContent = d.total||list.length; // real count
}).catch(()=>{ /* keep the illustrative layer but relabel it */
  document.querySelectorAll('.lyr .nm small').forEach(s=>{ if(/governance servers/.test(s.textContent)) s.textContent='fleet (illustrative distribution)'; });
});
```

### 2 · Living hover flash-card (MapLibre popup, DEFONEOS-style HUD)
```js
const hcPop = new maplibregl.Popup({closeButton:false,closeOnClick:false,className:'hc-pop'});
['jur','mcp'].forEach(L=> map.on('mousemove',L,e=>{ const p=e.features[0].properties;
  map.getCanvas().style.cursor='pointer';
  hcPop.setLngLat(e.lngLat).setHTML(
    `<div class="hc"><b>${p.n||p.name||'node'}</b>
     <div class="k">${(p.tier?('JURISDICTION · '+p.tier.toUpperCase()):(p.cluster||'MCP · governance'))}</div>
     ${p.dl?`<div>next: ${p.dl}</div>`:''}${p.tools?`<div>${p.tools} governed tools</div>`:''}
     <div class="sig">◉ signed · governed</div></div>`).addTo(map);
}));
['jur','mcp'].forEach(L=> map.on('mouseleave',L,()=>{hcPop.remove();map.getCanvas().style.cursor='';}));
```
```css
.hc-pop .maplibregl-popup-content{background:rgba(8,14,20,.92);border:1px solid rgba(16,185,129,.4);border-radius:9px;color:#dbf6ea;font:11px ui-monospace,monospace;box-shadow:0 8px 30px rgba(0,0,0,.5)}
.hc .k{color:#8aa2ad;font-size:9px;letter-spacing:1.3px;text-transform:uppercase;margin:1px 0}.hc .sig{color:#34d399;margin-top:3px}
.hc-pop .maplibregl-popup-tip{display:none}
```

### 3 · Fix the stale regulator data (accurate as of the Digital Omnibus)
```js
// EU node — replace dl + fw:
dl:'Art 50 transparency 2 Dec 2026 · high-risk Annex III 2 Dec 2027 (Digital Omnibus)',
fw:['EU AI Act','GDPR','DORA','NIS2','CRA'],
// US node — EO 14110 was revoked Jan 2025:
dl:'OMB M-24-10 · state laws (CO 1 Jan 2027)', fw:['NIST AI RMF','NIST CSF 2.0','OMB M-24-10'],
```

### 4 · Governance-POC chain (the CSOAI analogue of the DEFONEOS threat-POC)
```js
// "Run governance test" → make it the full chain: agent proposes a non-compliant action →
// council gate → care-floor REFUSES → signed. Honest: illustrative council, real signing via the dock.
async function runGovernancePOC(){
  const box=document.getElementById('test'); box.classList.add('show');
  const steps=[['propose','an agent requests: train on unconsented EU personal data'],
    ['classify','EU AI Act Art 5/9 · GDPR Art 6 → HIGH-RISK + unlawful basis'],
    ['gate','33-agent council vote → 6/33 (quorum 23 NOT met)'],
    ['care-floor','refuses — no lawful basis, rights impact'],
    ['act','BLOCKED before execution'],['sign','refusal Ed25519-signed → ledger']];
  const el=document.getElementById('a-gov').parentElement.parentElement; // reuse the arms area or a log div
  for(const [k,v] of steps){ await new Promise(r=>setTimeout(r,700));
    if(window.sovereign&&window.sovereign.sign&&k==='sign') try{ await window.sovereign.sign('governance-poc: blocked unconsented-EU-training'); }catch(e){} }
  // headline: governed 0 vs ungoverned (the action would complete) — same as the flywheel
}
```
> Wire this to a new "▶ Governance POC" button next to "Run governance test". It mirrors DEFONEOS's `sovThreatPOC()` but in the compliance domain: **the care-floor refuses the non-compliant action, and the refusal itself is signed.**

### 5 · Cybersecurity pillar — reuse the DEFONEOS Gods-Eye self-scan
Add a rail item + CTA that opens the already-built scanner (real external baseline + signed report + FOSS deep-stack):
```html
<div class="lyr" onclick="window.open('https://defoneos.vercel.app/godseye.html','_blank')">
  <span class="sw on"><i></i></span><span class="nm">Cyber · Gods-Eye self-scan<small>scan your estate, signed</small></span></div>
```
(Or port `/api/scan` + `godseye.html` under the CSOAI domain — same code, green accent.)

### 6 · AI-economy pillar — signed-attestation ticker (x402)
```js
// The AI economy = value flows as SIGNED PROOF, not seats. Show it live.
// os.meok.ai exposes x402 metering; render a ticker of signed attestations / PAYG.
fetch('https://os.meok.ai/api/status').then(r=>r.json()).then(d=>{
  const c=d.consolidation||{};
  addStat('Federation MCPs', c.federation_mcps||377);
  addStat('Signed attestations', 'metered');   // x402 · pay-per-proof, not per-seat
});
function addStat(label,val){ const s=document.createElement('div'); s.className='stat';
  s.innerHTML='<b>'+val+'</b><span>'+label+'</span>'; document.querySelector('.stats').appendChild(s); }
```

### 7 · Governance interop (the CoT/2525 analogue) — OSCAL export
DEFONEOS speaks CoT + MIL-STD-2525 for defence. CSOAI's equivalent lingua-franca is **OSCAL** (NIST). Add an "Export OSCAL" button that emits the visible jurisdiction/framework state as an OSCAL component-definition + signs it — so an auditor ingests it directly. (Same pattern as DEFONEOS's `cotExport()`.)

---

## Reconcile the flywheel (cross-surface honesty)
DEFONEOS cites **54.3M / 649M** (≈ the `mac` host); this globe shows **121M / 1.446B** (all 28 hives, all hosts). Both come from `status.json` and are real — but they read as contradictory across sites. **Fix:** caption each with its scope, e.g. *"1.45B episodes across 28 hives (0 governed vs 121M ungoverned)"* here, and *"per-node: 649M / 54.3M"* on DEFONEOS. One source, two honest views.

## The one-line pitch to hold
> **CSOAI is the governance/assurance layer of the same signed Sovereign** — DEFONEOS wears the defence body, this globe wears the **governance + cyber + AI-economy** body. Same SIGIL ledger, same council, same care-floor. Lead with the moat nobody else has: **every governed action carries an offline-verifiable receipt.**
