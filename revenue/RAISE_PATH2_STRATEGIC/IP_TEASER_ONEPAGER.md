# MEOK AI Labs — AI-Governance IP Teaser
**CONFIDENTIAL · For strategic / corp-dev review · 2026-06-06**
**CSOAI LTD** (United Kingdom · Companies House #16939677) · Sole founder & 100% owner: Nicholas Templeman

> **One sentence:** MEOK is a UK deep-IP company whose product *is* cryptographic proof-of-compliance — 271 published, installable AI-governance tools, an ~18-month multi-framework regulatory crosswalk corpus, and an HMAC-signed attestation chain — i.e. the exact "AI governance + agent/MCP governance" coverage a GRC, AI-governance, or AI-security vendor would otherwise spend 12–18 months and a team building.

> **We lead with our weaknesses, because our product is honesty:** pre-revenue (£0 MRR), max 2 GitHub stars, sole founder. This teaser sells **IP depth, coverage breadth, founder velocity, and verifiability** — not revenue, not traction. Every claim below is checkable by a stranger in an afternoon. That is the point.

---

## The IP moat (three assets — each independently verifiable)

### 1 · 271 PyPI-published MCP servers (316 built)
Live, `pip install`-able, **MIT-licensed** compliance & industry tools — the largest single-author corpus of Model Context Protocol governance servers we are aware of. Coverage spans EU AI Act, DORA, NIS2, CRA, ISO 42001, AI-BOM, plus regulated verticals (aquaculture/welfare, legacy-system modernization, trade).
- **Verify:** `pip install` any package; run `python3 tools/pypi_check.py` (live PyPI count); browse the public CSOAI-ORG GitHub repos.
- **Why it matters to a buyer:** an MCP-native delivery layer for governance — the form factor every AI-security and GRC vendor is now racing to govern (Snyk Agent Scan, Wiz Agent Gateway). Breadth that would take a team a year to author.

### 2 · ~18-month multi-framework regulatory crosswalk corpus ("MEOK LAW")
Hand-built mappings between **EU AI Act ↔ NIST AI RMF ↔ ISO/IEC 42001 ↔ DORA ↔ NIS2 ↔ CRA + 12 frameworks** — the structured "policy intelligence" that AI-governance products *run on*.
- **Verify:** read `csoai-docs/`, inspect the crosswalk MCPs, MEOK LAW commit `8439b15`.
- **Why it matters to a buyer:** this is the **single strongest asset** — domain IP that takes a competitor 12–18 months to replicate. It is the raw material behind every "we map you to N frameworks" claim a Credo / Holistic / Vanta makes. *(Comparable: AuditBoard paid to acquire FairNow — "38+ frameworks incl. ISO 42001, EU AI Act" — in Oct 2025.)*

### 3 · HMAC-signed attestation chain — the "un-fakeable" layer
A live API (`meok-attestation-api.vercel.app`) that **issues and cryptographically verifies signed compliance evidence**. Rare: most compliance vendors are closed-source and unverifiable; MEOK is MIT-licensed *and* cryptographically checkable.
- **Verify:** `curl` the live API; verify a fingerprint at `meok.ai/verify`.
- **Why it matters to a buyer:** a ready-made **trust/attestation primitive** for the MCP/agent ecosystem ("is this server trusted? prove it") and a verifiability differentiator no AI-governance specialist currently ships. Potentially patentable process.

---

## Bonus capability — proof MEOK can spin a regulated vertical fast
The **aquaculture compliance vertical**: 7 MCPs (RSPCA / ASC / CEFAS / LAIA) and 5 *live Stripe products* (£29–£999/mo) built into a real regulated market with a hard 2027 ASC deadline — shipped by one person in one sprint.
- **Verify:** `revenue/AQUACULTURE_LIVE_LAUNCH_STATE.md`; Stripe account `acct_1TLlEKQvIueK5Xpb`.
- **Why it matters to a buyer:** demonstrates the *capability* an acquirer values — the ability to stand up a new regulated-vertical governance suite quickly. (Stated as capability, not as revenue — these products are live but pre-sale.)

---

## Strategic fit — who this is for and why now

| Buyer type | The gap MEOK fills | 2026 proof this is a live buying priority |
|---|---|---|
| **AI-governance specialists** (Credo AI, Holistic AI, Trustible, Saidot) | Deeper framework coverage + MCP delivery + verifiable evidence | Fairly AI × Anch.ai merge (Jun 2025); whole cohort racing on coverage |
| **GRC platforms** (AuditBoard, Vanta, OneTrust, Drata, Sprinto) | A ready-made AI-governance + agent-governance module | **AuditBoard → FairNow (Oct 2025)**; Vanta EU-AI-Act product + Riskey buy; OneTrust "AI-Ready Governance" + agent oversight (Mar 2026) |
| **AI-security / MCP-governance** (Snyk, Wiz, MCP-security seed cos) | A compliance/attestation layer on top of agent security | Snyk Agent Scan governs "every MCP server" (Mar 2026); Alphabet→Wiz $32B (Mar 2026); $40M+ into MCP-security startups |
| **Big-4 AI practices** (Deloitte, EY, KPMG, PwC) | A toolkit to productise AI-governance advisory + ship signed evidence | $10B+ Big-4 AI investment since 2023; Trustworthy/Responsible-AI frameworks need delivery tooling |

**Why now:** EU AI Act + ISO 42001 are the #1 driver CISOs cite for prioritising AI risk in 2026; MCP adoption (80%+ of orgs) has run ahead of governance; incumbents are *buying* AI-governance IP rather than building it. MEOK is the buildable-today version of what they're shopping for.

---

## What's on offer (structures detailed in `LICENSING_MODELS.md`)
1. **Full acquisition** of CSOAI LTD's IP estate (crosswalks + 271 MCPs + attestation chain + 5 verticals).
2. **IP / tech license** — non-exclusive or field-exclusive license to the crosswalk corpus and/or attestation chain; founder remains.
3. **Acqui-hire** — founder (deep optometry + aquaculture + regulatory-crosswalk + demonstrated single-founder build-velocity) plus clean, transferable MIT IP.

**Clean to transact:** 100%-owned, single sole founder, IP-assignment deed in progress (Nicholas → CSOAI LTD), no outside cap-table complexity, MIT-licensed (no training-data/fair-use overhang).

---

## How to verify everything on this page (the anti-vapourware checklist)
- [ ] **271 MCPs:** `pip install` any package · `python3 tools/pypi_check.py` · public CSOAI-ORG GitHub
- [ ] **Crosswalk corpus:** read `csoai-docs/` + crosswalk MCPs + MEOK LAW commit `8439b15`
- [ ] **Attestation chain:** `curl meok-attestation-api.vercel.app` · verify a fingerprint at `meok.ai/verify`
- [ ] **Aquaculture vertical:** `revenue/AQUACULTURE_LIVE_LAUNCH_STATE.md` · Stripe `acct_1TLlEKQvIueK5Xpb`
- [ ] **Corporate:** Companies House #16939677 · IP-assignment deed (on request) · 100% founder ownership
- [ ] **Founder velocity:** the CSOAI-ORG git history (one person, the entire estate)

**Stated plainly:** £0 MRR · max 2 GitHub stars · sole founder · SOV3 "brain" component currently in an env-fix (not part of the compliance-IP on offer). We surface these first on purpose — a buyer's diligence would find them in an afternoon, and a company whose product is verifiable proof should have nothing to hide.

---
*Contact: Nicholas Templeman · CSOAI LTD · nicholastempleman@gmail.com · meok.ai*
*This is a confidential teaser. Figures are traceable to the MEOK verifiable data room (`_alignment/SWEAT_EQUITY_AND_DATAROOM_2026-06-02.md`). No revenue is represented or implied.*
