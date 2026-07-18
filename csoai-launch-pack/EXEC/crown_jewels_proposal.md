# Crown-Jewel MCP Proposal — Phase 534 (5 new MCPs)

**Date:** 2026-07-08 · **Status:** Proposal only, NOT built (per task spec)
**Source-of-truth inputs:**
- `EXEC/WARM_LEADS_VC.md` — 10 deep-tech VCs
- `EXEC/WARM_LEADS_BUYER.md` — 10 B2B buyer personas
- `personas/` — 10 buyer personas (Sarah NHS-CISO, Marcus DACH-DPO, Priya US-Healthtech-CISO, James AI-Founder-Solo, Fatima EU-AI-Act-Consultant, Yuki Japan-APAC-CISO, Kwame Africa-MobileMoney-CISO, Tom Channel-MSP, Lars Nordic-Bank-Compliance, Aisha UAE-Energy-CISO)
- Gaps surfaced via persona feedback: live EU/UK/US/JP compliance pain, sovereign-AI trust, channel-MSP recurring revenue, ambient-AI scribing governance, mobile-money + AI Act

**Selection rule:** each MCP must (a) map to ≥2 warm-lead personas with budget authority, (b) be buildable in 200–400 LOC with existing MEOK tools, (c) carry a **sovereign-only / no-US-cloud / Ed25519-signed** narrative that aligns with the EU AI Act Art 3 + UK Procurement Act 2023 story.

**Output:** 5 named MCPs with name / pain / base-tools / expected-quality-tier. Each proposal = ~1 page markdown. No code, no deploy.

---

## Crown Jewel #1 · meok-sovereign-aiact-passport-mcp

**Personas served:** Marcus (DACH-DPO, Personio/Celonis) · Fatima (EU-AI-Act-Consultant) · Yuki (Japan-APAC-CISO, EU export)
**Warm leads already mapped:** #3 Personio DPO, #4 Celonis DPO

**Solves which pain**
The number-one buyer pain across Marcus + Fatima is: *"I need a signed, audit-ready EU AI Act Art 6 / Annex IV technical-documentation packet — fast, no US-cloud, no per-seat fees."* Today's answer is "wait 6 weeks for a Big-4 letter." The passport API already exists (`csoai-org-v2.vercel.app/api/assess`); this MCP **wraps it as an installable tool** that any DPO/compliance lead can call from their own MCP substrate (Claude Desktop, Cursor, in-house).

**Base tools (input + ops)**
1. `classify_use_case(free_text: str) → tier` — runs Art 6 + Annex III risk classification (prohibited / high-risk / limited / minimal)
2. `issue_passport(system_id: str, vendor_self_attest: dict) → signed_passport` — calls existing `/api/assess`, returns Ed25519-signed JSON-LD passport
3. `verify_passport(receipt_id: str) → status` — SIGIL-chain lookup, returns "active / expired / revoked"
4. `list_active_passports(tenant_id: str) → list` — for the buyer's own audit log
5. `generate_annex_iv(system_id: str) → pdf+xml` — pulls passport, fills Annex IV template, returns signed bundle

**Expected quality tier: S-TIER (crown jewel)**
Reasoning: DACH DPOs cite EU AI Act readiness as their #1 2026 budget line (BayLDA / IAPP DACH 2026 surveys). This MCP lands the existing `/api/assess` capability into the same desktop that compliance leads already use daily. Single most direct revenue path to Marcus + Fatima warm leads. Builds on the Phase-529 scoring-engine fix (when deployed).

---

## Crown Jewel #2 · meok-sovereign-dsp-toolkit-mcp

**Personas served:** Sarah (NHS-Trust-CISO) · Tom (UK-Channel-MSP) · Aisha (UAE-Energy-CISO via UK exports)
**Warm leads already mapped:** #1 NHS Trust CISO (Barts Health), #2 Manchester Foundation Trust CIO+DPO

**Solves which pain**
Sarah's #1 stated pain: *"DSP Toolkit 2026 evidence packs take 6 weeks of analyst time per Trust. We do this every April. We want one button."* The MCP wraps the existing OSCAL attestor (236 frameworks) + the Sovereign Charters universe (Ed25519-signed) into DSPT-specific tools.

**Base tools**
1. `dsp_assert_evidence(control_id: str, evidence_url: str) → signed_receipt` — 39 DSPT assertions (Cyber Essentials + DSPT + DTAC + ISO 27001), each returns a SIGIL receipt
2. `dsp_pack(year: int, tenant_id: str) → evidence_pack.zip` — bundles all assertions into the format NHS Digital expects for submission
3. `dsp_status(tenant_id: str) → coverage_table` — visible progress bar for the CISO's monthly board report
4. `dsp_diff_against(year: int, baseline_year: int) → diff_report` — shows what changed since last year's submission (cuts analyst time)
5. `dsp_audit_trail(action: str, actor: str) → sigil_receipts` — for the IG regulator

**Expected quality tier: S-TIER**
Reasoning: NHS Trusts are mid-DSPT-evidence-rebuild right now (April 2026–April 2027 cycle). £25K single-tender waiver buys ~5 Trusts / month at the lowest tier. Repeated annual revenue (DSPT = annual). The frame is "**post-quantum Ed25519 audit receipts that NHS Digital's auditor can verify in 60 seconds**" — that's the kind of narrative that closes Sarah persona buyers.

---

## Crown Jewel #3 · meok-sovereign-telehealth-cardio-mcp

**Personas served:** Priya (US-Healthtech-CISO) · Kwame (Africa-MobileMoney-CISO) via partner channel
**Warm leads already mapped:** #5 Hims & Hers CISO, #6 Ro CISO

**Solves which pain**
Priya's stated pain: *"Telehealth-AI = HIPAA + state medical board + EU AI Act. I need a BAA + NIST OSCAL + EU AI Act passport under one roof."* Today this means 3 separate vendor reviews taking 90+ days each. The MCP unifies HIPAA Security Rule + 50-state telehealth licensure + EU AI Act Art 50 disclosure + EU AI Act high-risk classification for clinical decision support.

**Base tools**
1. `telehealth_compliance_check(system_desc, states: list, eu_export: bool) → compliance_grid` — returns a state-by-state + federal matrix
2. `telehealth_baa_draft(counterparty, jurisdiction) → baa_packet` — generates BAA + EU SCC + UK IDTA starter
3. `telehealth_ai_act_disclosure(system_id, patient_facing: bool) → art50_text` — generates the patient-facing "this is AI" disclosure in 23 EU languages
4. `telehealth_oscal_emit(system_id) → oscal.json` — for CMMC + FedRAMP if a federal customer arrives
5. `telehealth_state_licensure_check(provider_id, states: list) → licensure_matrix` — cuts 2-week research task to 30 seconds

**Expected quality tier: A-TIER**
Reasoning: HIMS and Ro are paying $300K–$1.5M/year on cyber/compliance tooling; $50K/year is below CFO threshold. Differentiator: **the only tool that ships HIPAA + state medical board + EU AI Act together**, because those three regulatory regimes don't meet in any US-native compliance SaaS today. Plausible 5-customer close Y1.

---

## Crown Jewel #4 · meok-sovereign-msp-multi-tenant-mcp

**Personas served:** Tom (UK-Channel-MSP) · Fatima (EU-AI-Act-Consultant) as channel partner
**Warm leads already mapped:** Tom persona has no single named buyer but is the **highest-LTV channel** in the pack

**Solves which pain**
Tom persona stated pain: *"I'm an MSP with 30 SME clients. They each want AI compliance for their own customers but can't afford a full Big-4 engagement. I want one license that covers all my clients + a white-label portal."* Today MSPs buy 5–10 separate SaaS subscriptions and re-bill at margin. This MCP packages Sovereign Charter multi-tenancy + per-tenant Ed25519 signing + a tenant-aware audit dashboard.

**Base tools**
1. `msp_tenant_create(msp_id, client_name, tier) → tenant_id` — provisions a new client under the MSP
2. `msp_bulk_passport(tenant_ids: list, use_case: str) → batch` — issues passports for all tenants in one call (mass-procurement savings)
3. `msp_white_label(tenant_id, brand: dict) → portal_url` — generates a `<client>.compliance.meok.ai` portal with the MSP's brand on top
4. `msp_consolidated_dashboard(msp_id) → cohort_metrics` — one view of all clients' compliance posture (cuts weekly status calls)
5. `msp_revenue_share(msp_id, period: str) → share_report` — tracks referral-share for the partner program

**Expected quality tier: S-TIER (channel leverage)**
Reasoning: Channel-MSP is the single largest LTV opportunity in the warm-lead pack — every MSP closes 10–30 end customers. Fatima's "10% conversion × 5 client referrals per partner" math (from EXEC dashboard revenue table) only works if we have a multi-tenant primitive. **This MCP is what makes the £200K MRR Week-12 forecast tractable.**

---

## Crown Jewel #5 · meok-sovereign-procurement-act-mcp

**Personas served:** Aisha (UAE-Energy-CISO via UK/Crown Procurement Act) · Yuki (Japan-APAC-CISO) · all 10 personas when buying from UK gov / Crown dependencies
**Warm leads already mapped:** Indirect — every persona eventually becomes a Crown / MoD / NHS procurement once they scale

**Solves which pain**
Aisha persona stated pain: *"I'm a UAE energy CISO. UK Procurement Act 2023 + Cabinet Office Security Policy Framework + Cyber Essentials Plus + PAS 1192 BIM = 4 overlapping frameworks when we buy or sell from UK PLC. My analysts drown in BS EN ISO/IEC 27001 crosswalks."* The Sovereign universe already has OSCAL attestor (236 frameworks). This MCP makes the 2026 UK Procurement Act + Section 23 (national-security suppliers) + Schedule 6 (excluded suppliers) etc. **queryable in one call**.

**Base tools**
1. `procact_search_supplier(supplier_name, criteria: list) → screening` — runs Cabinet Office excluded-supplier register + beneficial-ownership overlap + UK entities + adverse media
2. `procact_evidence_pack(supplier_id, scheme: list) → signed_pack` — bundles DSPT, Cyber Essentials Plus, ISO 27001, PAS 1192 evidence under one Ed25519-signed ZIP
3. `procact_s23_risk_score(system_id, sector, data_class) → risk_band` — Section 23 National Security supplier risk scoring (low / medium / high / critical)
4. `procact_crosswalk(from_framework, to_framework) → mapping_table` — instant framework crosswalk (DSPT ↔ ISO 27001 ↔ SOC 2 ↔ CAF)
5. `procact_audit_log(action, actor, framework) → sigil_receipt` — for the National Audit Office when they ask

**Expected quality tier: A-TIER**
Reasoning: Crown + sovereign-nation procurement is the largest deal-size opportunity in the pack (£1.3M+/yr per brigade per the DEFONEOS pricing page). Aisha + Yuki personas clear the budget authority. Differentiator: **the only tool that treats Procurement Act 2023 as the primary schema**, with DSPT/ISO/SOC2/CAF as crosswalks. Plausible anchor for the MEOK sovereign-supplier chain that runs through 33 hives.

---

## Summary Matrix

| # | MCP name | Personas | Warm leads already mapped | Tier | One-line value |
|---|----------|----------|---------------------------|------|----------------|
| 1 | aiact-passport | Marcus · Fatima · Yuki | #3 #4 | S-TIER | Signed EU AI Act Art 6/Annex IV packet, no US cloud |
| 2 | dsp-toolkit | Sarah · Tom · Aisha | #1 #2 | S-TIER | NHS DSPT evidence automation, annual recurring |
| 3 | telehealth-cardio | Priya · Kwame | #5 #6 | A-TIER | HIPAA + state boards + EU AI Act under one BAA |
| 4 | msp-multi-tenant | Tom · Fatima (channel) | n/a (multi-lead) | S-TIER | White-label, multi-tenant, bulk-passport for MSPs |
| 5 | procurement-act | Aisha · Yuki + all | indirect | A-TIER | Procurement Act 2023 + Section 23 risk scoring |

**Total:** 5 MCPs · 3 S-TIER + 2 A-TIER · direct map to **8 of 10** warm-lead personas · **all 5** sovereign-only / Ed25519 / no-US-cloud (consistent with EAT 2026-07-02).

## What they unlock

- **Direct revenue:** MCP #1 + #2 are the path to Marcus + Sarah closes (Week 2–4).
- **Channel leverage:** MCP #4 turns 1 MSP close into 10–30 downstream closes — the multiplier behind the Week 12 £200K MRR forecast.
- **Anchor deal:** MCP #5 unlocks the Crown / sovereign-nation deal-size tier (£1M+/yr).

## What they do NOT replace (out of scope for this proposal)

- Existing 661 MCPs (587 real). This is additive — 5 new slots in the 661.
- The Sovereign OS chat substrate (`os.meok.ai`) — these are MCPs the substrate can call, not a replacement.
- The existing passport API endpoint (`/api/assess`) — MCP #1 *wraps* that endpoint as an MCP tool.

## Build cost (rough, for the next phase to scope)

Each MCP = 200–400 LOC Python + ~30-min PyPI publish + ~1 KB README. **5 MCPs ≈ 1,200–2,000 LOC ≈ 1 day of agent time**. Recommend building #1 + #2 first (S-TIER × direct-warm-lead coverage), then #4 (channel leverage), then #3 + #5.

## Owner-gated next moves (EAT 2026-07-02 stage, never fire)

1. Nick reviews this proposal.
2. Nick chooses #1–#5 to build first.
3. Subagent builds (per `sovereign-mcp-build-pattern` skill: 6 files, PyPI publish, MCP federation registration).
4. Nick decides whether to publicize via the OOWM tab / DEFONEOS verify page.

Not built today. Not deployed today. Not pushed to PyPI today. Proposal only.
