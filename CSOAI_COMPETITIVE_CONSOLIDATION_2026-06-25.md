# CSOAI / MEOK — Competitive Consolidation (2026-06-25, research-grounded)

Where we stand vs the field. Market: AI-governance **35% CAGR → $6.26B by 2034**; pricing $50K–several-hundred-K/yr; North America ~40%. Honest moat + honest gaps.

## The market, mapped
| Cluster | Players | What they do |
|---|---|---|
| **Incumbents (extend GRC)** | IBM watsonx.governance · ServiceNow AI Control Tower · OneTrust AI Governance · Collibra | bolt AI onto existing GRC/ITSM/privacy stacks; broadest integrations |
| **Dedicated AI-gov** | Credo AI ($12.5M) · Holistic AI ($4M) · Modulos · Vanta (ISO 42001 fast-cert: 70 controls, 2–4wk) | assessment + audit-readiness + framework templates |
| **⭐ Agent / MCP-runtime layer (the new frontier)** | Obot (Enterprise MCP Gateway) · Straiker (MCP visibility + 10K-vuln DB + runtime guardrails) · Salt Security (Agentic Security Graph: LLM+MCP+API) · Speakeasy (AI Control Plane) · Prediction Guard (register-before-govern asset registry) | govern agent→tool calls at runtime, server-side, logged with identity |

**The thesis is now consensus:** *"The EU AI Act was written for models; your agents need runtime compliance"* — the MCP/action layer is in scope (Annex III high-risk, Aug 2 2026). That's **exactly CSOAI's bet** (runtime enforcement + MCP registry + every tool call logged). The market validated us.

## CSOAI's real moat (what NONE of them have)
1. **Governing the LEGACY economy** — 19 governed bridges (COBOL · SAP · HL7 · SCADA · ISO 20022 · tax · mortgage · energy · cards · telecom…). Every competitor governs *modern* AI agents; **nobody governs the legacy systems those agents actually touch** ($3T/day moves through these). This is a category of one.
2. **SIGIL — sovereign signed attestation.** Competitors log to *their* cloud ("trust us"). CSOAI hash-chains + Ed25519-signs every governed action to a chain you can **verify offline, no account.** A fundamentally stronger trust model.
3. **Sovereign / on-device.** They're SaaS control planes (your data → their cloud). CSOAI keeps the data yours (the MEOK side: Guardian/Family/Aware on-device).
4. **Open core / Layer 0** — a protocol beneath, not a walled SaaS; the "same bloodline" every hive inherits.
5. **Breadth + the OS** — 347 MCPs · 19 bridges · 13+ frameworks · the 41-app OS · the governed globe · MEOK Law (jurisdiction) · the knowledge hives.

## Honest gaps (don't hide them — they're the roadmap)
- **Distribution** — *built ≫ published* (19 bridges built, ~19 MCPs published). The live competitors (Obot/Straiker/Speakeasy) are **shipping** the MCP-runtime product CSOAI has **coded but not deployed**. They'll capture mindshare unless CSOAI publishes + deploys. **This is the #1 risk and the #1 lever.**
- **Runtime not live** — the api-server/queens/SIGIL-enforcement need the GCP VM. Today it's "governed by design," not "enforced in prod."
- **Funding + logos** — competitors raised $4–12M+, OneTrust is a unicorn; CSOAI is pre-first-revenue with 0 enterprise logos.
- **No 30-sec "try it"** for the agent-governance product (M2's demo door closes this).

## The wedge (how CSOAI wins from here)
*"Everyone governs your AI agents. CSOAI governs the **legacy economy** your agents touch — and **signs every action** so you can prove it, sovereignly."* Land where they can't: banks/hospitals/grids/insurers on COBOL/SAP/HL7/SCADA, where a *governed, signed bridge* is the only safe on-ramp to AI — backed by the same 13-framework fleet, but with attestation they don't have.

## Next (to convert moat → market)
1. **Publish** the 19 bridges (one `PYPI_TOKEN` → `publish-all-bridges.sh`) → distribution.
2. **Deploy** api-server (GCP VM) → runtime enforcement live → "enforced," not "designed."
3. **Ship the demo door** (M2) → the 30-sec WOW.
4. Lead the **legacy-bridge + SIGIL** narrative — the category nobody else owns.

→ Pairs with `GAPS_AS_ROADMAP_v1.md`, `CSOAI_BRIDGE_FAMILY_INDEX.md`, `PUBLISH_CHECKLIST_bridges.md`. M2/owner: this is the competitive slide for the deck.
