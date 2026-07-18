# CSOAI Layer-0 Compliance Intelligence OS — Blueprint (2026-06-19)

The thesis: not "what are the AI rules" (commodity) but **"who must comply with what, by
when, and are they on track?"** A continuously-crawled, always-current global governance
dataset that connects the *obligation landscape* to the *entity landscape* via deadlines.
Posture = **help-first** (sell compliance to the at-risk; sell regulators aggregate/sectoral
intelligence — NOT named accusation lists). Front-end = an immersive map cockpit. Backbone =
**Layer 0**.

## Layer 0 connects all
Layer 0 (CSOAI's trust/protocol substrate — Ed25519 attestations, agent.json, .well-known/mcp.json,
the MCP fleet as the callable surface) is the bus. Every object in the OS is a Layer-0-addressable,
attestable node:
- a **regulation/obligation** → has a canonical id, citation, attestable provenance (we signed when/where we ingested it)
- a **company/entity** → has an id, jurisdiction, AI/robotics systems, applicable obligations
- a **tool** (MCP) → callable per obligation, returns Ed25519-signed attestations
- a **deadline** → an event on the global clock that fans out to in-scope entities
So "the EU AI Act Article 50 deadline" connects to → every in-scope company → the MCP tool that
proves compliance → the signed attestation. One graph, addressable through Layer 0.

## The 5 layers (all run on the hive: MCP fleet + SOV3 + scheduled crawl)
1. **Regulation Graph** — structured: jurisdiction → instrument → obligation → deadline →
   applicability(sector, risk-tier, company-size). Seeded by frameworks.ts + regulationsGeo.ts
   (177-country map). Contracts in `client/src/data/intel/types.ts`.
2. **Daily Ingest (the moat)** — EUR-Lex, national gazettes, regulator sites, enforcement actions,
   standards updates, guidance, news → structured extraction → updates the graph + emits **deltas**.
   Scheduled on the hive. "Always the most advanced dataset on governance."
3. **Entity Registry** — companies + AI/robotics exposure from public signals (products, sector,
   jurisdiction, headcount) → which obligations attach. Geo-located for the map.
4. **Risk Engine** — score each entity × obligation: in-scope? deadline proximity? signal of
   readiness? Output is a **risk indicator we can defend**, never a "non-compliant verdict."
5. **Action Layer** — (a) Outreach/lead-gen ("you're in scope of X due D — CSOAI helps") → Delboy.
   (b) Regulator B2G: aggregate/sectoral landscape intelligence.

## The immersive cockpit (OpenGridWorks → "AI Governance Earth")
Zoom is the interaction. Each zoom level reveals more:
- **World** → regulation-density heat (have it).
- **Country** → obligations + live deadline clocks + the global standards that apply (have most).
- **Region/admin-1** (needs 50m/10m atlas + admin boundaries) → state/provincial rules (Colorado,
  California, Quebec…).
- **City / cluster** → company markers: each AI/robotics company, its systems, the obligations it's
  in scope of, its readiness signal. Click → entity dossier → "help this company" / "prove it" (MCP).
Easy + engaging because it's *spatial and progressive* — you fly in, the rules and the players
appear together. 12 languages already; RTL done.

## Honesty / legal guardrails (non-negotiable)
- "Risk signal" not "verdict." Never publicly brand a named company non-compliant without evidence
  (defamation). Named-informant features gated behind real legal counsel.
- GDPR / lawful basis on collected entity + personal data; respect robots/ToS on crawl.
- Same principle that made us cut the "250k jobs" claims: defensible indicator > undefendable claim.

## Build sequence (staged, shippable)
- **Wave A (now):** data contracts (`intel/types.ts`) + deadline radar engine (`intel/deadlines.ts`,
  turns framework `effective` dates into a live countdown/"what's due when" per jurisdiction). New
  files, collision-free with the running data agent.
- **Wave B (after data agent lands):** entity registry seed (real public AI/robotics cos per region,
  factual) + wire deadline radar + entity layer into the map panel (companies per country).
- **Wave C:** higher-res geography (admin-1) + company markers/clustering = the true drill-down.
- **Wave D:** the daily crawler/ingest on the hive (the moat) + delta alerts.
- **Wave E:** risk engine + outreach (Delboy) + B2G aggregate intelligence.

Tie-ins: EU AI Act cliffs (2 Aug 2026 GPAI, 2 Dec 2027 Annex III) = the first deadline the radar
lights up. MCP fleet = the "prove it" tools. SOV3 = the crawl/scoring brain. Delboy = the outreach.
