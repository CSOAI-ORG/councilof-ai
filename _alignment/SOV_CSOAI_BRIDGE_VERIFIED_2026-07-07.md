# 🌉 SOV ↔ CSOAI Bridge — VERIFIED LIVE (2026-07-07)

**Do not rebuild this.** SOV Space, the sims, and the Sovereign brain are **already bridged into the
live CSOAI site** (`councilof-ai`) and E2E-verified working. This documents the contract so no third
agent forks a parallel bridge. M4 verified from the os.meok.ai side; M2 owns the councilof-ai pages.

## The architecture (one brain, three surfaces)
`/api/health` returns: `service: "sovereign-backend" v3.0.0, surface_of: ["meok","csoai","defoneos"]`,
with an **OpenAI-compatible brain** at `/api/v1/chat/completions`. One sovereign backend already
powers meok.ai, csoai.org, and defoneos — the bridge is the architecture, not a bolt-on.

## What's wired (verified 2026-07-07)
| CSOAI page (councilof-ai) | Calls (os.meok.ai/api) | Verified |
|---|---|---|
| `SovSpace.tsx` | `/govern?q=<industry>` → real frameworks | ✅ `healthcare → EU AI Act + HIPAA + MDR + FDA SaMD + HL7/FHIR` |
| `SovSpace.tsx` | `/chat` (POST) → 33-agent council verdict | ✅ real verdict ("CV-screening AI is high-risk under EU AI Act…") |
| tool surfaces (`/os`,`/workbench`,`/tool-commons`) | `/tools?q=` → 378 catalog | ✅ `total:378`, CORS-open |
| council / nodes | `/nodes` → canonical sovereign node graph | ✅ 200, real |
| Already-present pages | `Council`, `PDCASimulator`, `SovTowns`, `SovereignHives`, `SovereignAcademy`, `Crosswalk`, `OscalStudio`, `DemoOS`, `RealWorldMap`, `SocialOS` | exist in master |

## The endpoint contract (26 endpoints, ~all CORS-open)
Live + real: `chat` · `govern` · `tools` · `nodes` · `health` · `sign` · `verify` · `systemcard` ·
`agentcard` · `hatch` · `sap` · `knowledge` · `geo` · `fx` · `weather` · `badge` · `registry` · `mcp`.
**Rule for M2 + M4:** these are a public contract csoai.org depends on — keep them **CORS-open and
backward-compatible**. Don't rename/remove without updating `SovSpace.tsx`.

## ⚠️ Honest thin spots (the real "what's needed", not a rebuild)
1. **`/orchestrate` is shallow** — returns `{say:"…", actions:[]}`; it talks but doesn't yet *execute*
   real OS actions. Wiring it to actually run tools/sims is the highest-value upgrade.
2. **`/govern` is rule-based** (keyword→framework map), not the OOWM. Solid + grounded, but upgrading
   it to route through the 12-General OOWM would make it reason, not match.
3. **Sims** — `PDCASimulator.tsx` exists but I did not verify it runs against the *live* brain vs a
   local mock. The OOWM/brain-race sims (`sov_oowm_*`) have **no public endpoint** yet — a `/api/sim`
   that runs a real OOWM sim would complete "run real sims" (task #22) properly.
4. **Two SOV Space surfaces exist** — `os.meok.ai/sovspace.html` (static storefront) and
   `councilof-ai/SovSpace.tsx` (the live CSOAI page). Decide canonical or make one embed the other;
   don't maintain two.

## Next (non-duplicative)
- **M4 (os.meok.ai lane):** deepen `/orchestrate` to execute tools; add `/api/sim` (real OOWM run);
  keep the contract stable.
- **M2 (councilof-ai lane):** confirm `PDCASimulator` + sim pages hit the live brain; reconcile the
  two SOV Space surfaces; the `Crosswalk.tsx` page can adopt the new signed [crosswalk linkable asset].
- **Both:** one brain, one contract, one SOV Space. The bridge exists — extend the thin spots only.
