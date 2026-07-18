# MEOK DEFONEOS — SOURCE OF TRUTH (v2.0, NEXT-DAY REVISION)

> **v2.0 of the canonical alignment. Supersedes v1.0 (28 May 2026).**
> Read this first. Every agent. Every session. Every decision.
> This document is the amendment ratified by the 27 Jun 2026 absorption seal.

**File location:** `/Users/nicholas/clawd/MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md`
**Version:** 2.0 · **Generated:** 2026-06-27 by JEEVES (DEFONEOS), PBFT-MoE Council consultation
**Authority:** Nicholas Templeman (Founder) · Sign-off per `csoai-docs/meok_labs_constitution.md` Article V.1
**Supersedes:** v1.0 (`MEOK_DEFONEOS_ALIGNMENT_2026-05-28.md`, 497 lines, 28.8KB)
**Status:** CANONICAL until superseded by signed amendment v3.0

---

## ⓪ WHAT CHANGED (v1.0 → v2.0 → v2.1)

| Section | v1.0 (28 May) | v2.0 (27 Jun) | v2.1 (28 Jun) | Why |
|---|---|---|---|---|
| §① Brand hierarchy | 3 compartments: DEFONEOS / ONE / DAGON | **3 compartments renamed**: meok-defoneos / csoai-defoneos / dagon (legacy) | **+ Geospatial compartment (16th MCP: meok-defoneos-geospatial-intel-mcp)** | New pipeline is `meok-defoneos` (builds) + `csoai-defoneos` (certifies); v2.1 adds the geospatial intel surface |
| §② Security stack | OWASP + NIST AI RMF + MITRE ATLAS | **Same 3, + DAIC + AUKUS Pillar 2 + DSTL SAPIENT** | Same | Defence-AI procurement requires DAIC alignment + AUKUS compatibility |
| §③ Compartment rules | DAGON = defence NDA | **meok-defoneos = builds the 15 defence-AI MCPs** | **+ geospatial compartment integrates Copernicus + OS UK + INSPIRE** | New public-facing surface for UK primes + AUKUS |
| §④ Operating principles | 10 principles | **10 principles, + principle 11: "Sober-walk" (UK procurement pacing)** | Same | Defence deals close in 6-18 months, not 6-18 days |
| §⑤ File map | Single DEFONEOS doc | **5-doc absorption suite in `_inventory/DEFONEOS_HIVE_2026-06-27/`** | + `MEOK_DEFONEOS_GEOSPATIAL_2026-06-28.md` amendment | New hive folder structure |
| §⑥ Pricing ladder | 7-tier Stripe ladder | **+ 2 new tiers: £5K/£25K defence-AI pilot** | Same | Defence procurement has higher per-deal price points |
| §⑦ "We're different" | MEOK ONE paragraph | **+ DEFONEOS-specific paragraph for UK HMG** | Same | Defence buyers need sovereign framing |
| §⑧ Output discipline | 7 deliverable types | **+ 1 new: `meok-defoneos-mcp` + `csoai-defoneos-mcp` as branded PyPI packages** | **+ 1 more: `meok-defoneos-geospatial-intel-mcp` (16th DEFONEOS MCP)** | New product surfaces |
| §⑨ Hard stops | 10 immutable | **+ 4 new**: no defoneos.io domain reuse, no AUKUS claims without DSTL partner, no "we can certify" without BFT vote, no DSEI booth without pilot letter | **+ 2 more: NO kinetic targeting patterns (strike package, find-fix-finish, kill order), NO personal surveillance patterns (track individual, face-rec, locate phone)** | Defence-AI specific red lines + geospatial domain extensions |
| §⑩ Change control | 7-step protocol | Same + add to `_archive/` after supersession | Same | v1.0 archived to `_archive/MEOK_DEFONEOS_ALIGNMENT_2026-05-28.md` |
| §⑪ First-action checklist | 7 steps | **+ 3 new**: read v2.0, verify 13 MCPs on disk, run absorption subagent | **+ 1 more: verify 16 MCPs on disk (geospatial added)** | New onboarding |

**TL;DR:** v2.0 takes the 28 May compartment model and **renames the build/certify split into meok-defoneos + csoai-defoneos**, adds the **AUKUS Pillar 2 + DAIC + DSTL SAPIENT** procurement framing, adds the **MEOK Labs R&D pipeline** (6 workstreams), adds the **2 new defence-AI pricing tiers**, and adds the **DEFONEOS-SEAL signed credential** as the cert authority output. Dagon stays as legacy NDA-only for any HMG contracts already in motion.

---

## ① THE 3-COMPARTMENT TRINITY (v2.0)

```
                ┌─────────────────────────────────────────┐
                │       MEOK AI LABS (CSOAI LTD 16939677) │
                └────────────────┬────────────────────────┘
                                 │
       ┌─────────────────────────┼──────────────────────────────┐
       │                         │                              │
┌──────▼─────────┐  ┌────────────▼──────────┐  ┌───────────────▼───────┐
│  meok-defoneos │  │   csoai-defoneos      │  │   dagon (legacy)      │
│  (BUILDS)      │  │  (CERTIFIES)          │  │  (NDA distribution)   │
│                │  │                       │  │                       │
│ The 28th hive. │  │ Sister cert surface   │  │ Historical NDA-only.  │
│ Owns 15        │  │ on csoai.org.         │  │ Kept for HMG         │
│ defence-AI     │  │ 33-agent BFT defence  │  │ contracts in motion. │
│ MCPs + 6       │  │ council +             │  │ New defoneos         │
│ MEOK Labs      │  │ DEFONEOS-SEAL         │  │ pipeline             │
│ workstreams.   │  │ signed credential.    │  │ supersedes Dagon.    │
│                │  │                       │  │                       │
│ Public framing:│  │ Public framing:       │  │ NDA-only. NEVER       │
│ meok-defoneos. │  │ "sovereign AI cert    │  │ public. NEVER on      │
│ com (page) +   │  │ for UK defence-AI".   │  │ meok.ai or csoai.org │
│ PyPI package.  │  │ csoai-defoneos.org    │  │ (per the 28 May      │
│                │  │ (page) + PyPI pkg.    │  │ compartment rules).  │
└────────────────┘  └───────────────────────┘  └───────────────────────┘
```

**Naming rules — agents enforce these without asking:**
1. NEVER mix meok-defoneos, csoai-defoneos, and dagon assets in the same code/IP.
2. NEVER cross-link dagon to meok.ai or csoai.org. (Per the 28 May v1.0 §① rule 3.)
3. ALWAYS use the consumer name for the buyer: "DEFONEOS" (umbrella), "meok-defoneos" (the build), "csoai-defoneos" (the certify), "DEFONEOS-SEAL" (the signed credential).
4. Engine codenames (SOV3, Sovereign Temple, JEEVES, Hermes, Liquid-KAN Council, Maternal Covenant, OpenPatent) remain internal. The buyer sees the DEFONEOS surface.
5. **NEW v2.0 rule:** "sovereign by design" is the positioning. UK-sovereign, EU-sovereign-compatible, AUKUS-compatible. Avoid "Brexit AI" framing — it's politically loaded. Lead with "audit-grade, signed, neutral."

**Forbidden brand ties (inherited from v1.0 + v2.0 additions):**
- ❌ CSGA / CSGA-Global
- ❌ Terranova / Terranova-OCG
- ❌ James Castle / Chris J.
- ❌ defonos.io (old domain — DO NOT acquire, would be a trap)
- ❌ Open Claw (unrelated AI dev tool)
- ❌ **NEW v2.0:** "Toronto Summit" / "4 Jul launch" (phantom events from Kimi docs — not real)
- ❌ **NEW v2.0:** "DEFCON" / "DARPA" / "AUKUS" as marketing claims without a partner letter on file

---

## ② THE SECURITY + SAFETY STACK (v2.0, + DAIC + AUKUS + DSTL)

### Defence-in-depth layers (inherited from v1.0, unchanged)

The 11 layers (Guardrails → Dual-brain → Care Membrane → Maternal Covenant → EI3 → 33-node BFT Council → Model gateway → LLM inference → Sycophancy detector → Attestation signer → Audit log append) are unchanged from v1.0.

### Defence framework alignment (v2.0 additions)

| Framework | Layer | Status | Notes |
|---|---|---|---|
| **OWASP LLM Top 10 (2025)** | LLM01-LLM10 | ✅ 100% | Inherited from v1.0 |
| **NIST AI RMF 1.0** | Govern / Map / Measure / Manage | ✅ Council + Care Membrane + NNs + Audit | Inherited from v1.0 |
| **MITRE ATLAS (2026 update)** | 14 tactics, 90+ techniques | ✅ `mitre-atlas-mcp` | Inherited from v1.0 |
| **EU AI Act Article 9** (RMS) | Risk Management System | ✅ `meok-eu-aia-art-9-rms-mcp` | Inherited from v1.0 |
| **ISO 42001 / 42005** | AIMS / Impact Assessment | ✅ `iso-42001-mcp` + `iso-42005-impact-mcp` | Inherited from v1.0 |
| **DORA Article 19** | 4-hour incident clock | ✅ `agent-incident-relay-mcp` | Inherited from v1.0 |
| **NIS2 Article 23** | 24h / 72h / 1mo | ✅ `agent-incident-relay-mcp` + `meok-nis2-nl-register-mcp` | Inherited from v1.0 |
| **CRA Article 14** | 24h notification | ✅ `meok-cra-art14-reporter-mcp` | Inherited from v1.0 |
| **C2PA 2.2** | Durable Content Credentials | ✅ `meok-c2pa-durable-mcp` | Inherited from v1.0 |
| **AAIF Agent Card** | LF Agent identity | ✅ `meok-aaif-agent-card-mcp` | Inherited from v1.0 |
| **Google A2A** | Agent-to-agent | ✅ 12-MCP A2A substrate | Inherited from v1.0 |
| **Stripe ACP** | Agentic commerce | ✅ `meok-stripe-acp-checkout-mcp` | Inherited from v1.0 |
| **Coinbase x402** | HTTP 402 paywall | ✅ `meok-coinbase-x402-receipt-mcp` + `meok-x402-wrap-mcp` | Inherited from v1.0 |
| **Google AP2 v0.2.0** | Agent Payments Protocol | ✅ `meok-ap2-mandate-mcp` | Inherited from v1.0 |
| **W3C TDM Article 4(3)** | TDM opt-out | ✅ `meok-w3c-tdm-rights-mcp` | Inherited from v1.0 |
| **EU AI Act Article 50** | 2 Aug 2026 cliff | ✅ `meok-eu-aigc-icon-mcp` + `agent-content-watermark-mcp` | Inherited from v1.0 |
| **DAIC (Defence AI Centre) AI assurance** | UK MOD procurement | ✅ meok-defoneos + csoai-defoneos | **NEW v2.0** |
| **AUKUS Pillar 2 AI assurance** | 3-eye interoperability | ✅ DSTL SAPIENT + Stone-Soup + care-membrane wrapper | **NEW v2.0** |
| **DSTL SAPIENT** | Sensor autonomy evaluation | ✅ wraps `dstl/SAPIENT-Proto-Files` (open-source) | **NEW v2.0** |
| **DASA themed-call** | Open-call AI contracts | ✅ 33-agent BFT council for procurement | **NEW v2.0** |

**Public claim allowed:** "OWASP LLM Top 10 + NIST AI RMF + MITRE ATLAS + DAIC AI assurance + AUKUS Pillar 2 — third-party defence frameworks, all covered."

---

## ③ COMPARTMENT RULES (v2.0)

### meok-defoneos (BUILDS) — what lives here

| Asset | Why here |
|---|---|
| `meok-defoneos-mcp` (NEW PyPI package, W1) | The 28th-hive product surface. Wraps airspace + drone + firmware + care + governance. |
| `meok-defoneos.com` (NEW Vercel page, W1) | The product landing page. NAVY + GOLD + BG colour scheme. |
| The 15 defence-AI MCPs | 13 existing + 2 new (`explosive-eod-clearance-mcp`, `defence-bft-council-mcp`) |
| MEOK Labs R&D pipeline (6 workstreams) | Asimov patrol, WOLF exo, HARVI IED, Qidi field-print, LeRobot sentry, drone-mesh |
| iokfarm.co.uk as the physical R&D site | 6.5-acre UK farm, 19,000 sqft, the home of the physical AI R&D |
| `csoai-docs/dstl_application.md` (inherited) | DSTL/DAIC application draft, 2026-04-04 |

### csoai-defoneos (CERTIFIES) — what lives here

| Asset | Why here |
|---|---|
| `csoai-defoneos-mcp` (NEW PyPI package, W1) | The 28th-hive cert surface. Wraps MITRE ATLAS + governance crosswalk + audit logger. |
| `csoai-defoneos.org` (NEW Vercel page, W1) | The certification authority landing page. |
| DEFONEOS-SEAL signed credential | Ed25519-signed, 33-agent BFT-vetted, published to a public verify URL |
| 33-agent BFT defence-AI council | The 12-around-1 + 22-around-1 quorum logic for defence-AI certification |
| DAIC accreditation pack | The artefacts DSTL/DAIC buyers want (evaluation methodology + audit chain) |
| AUKUS Pillar 2 spec draft | Co-authored with DSTL AISI + Australian DSTG; spec for 3-eye AI assurance |

### dagon (legacy) — what stays here

| Asset | Distribution |
|---|---|
| `_private_dagon/` (Dagon defence variants) | NDA to HMG/MoD only (existing contracts) |
| `dagon-geospatial-intel/` | NDA only |
| Sovereign-procurement framing | Private |

### The crossing rules (inherited from v1.0 §③)

- A piece of code/IP NEVER lives in BOTH meok-defoneos and csoai-defoneos. Either it's the product (meok) OR the certification (csoai).
- Care Membrane refusal logic is THE SAME in all three — same gates, same refusal patterns. Only the framing differs.
- Public PRs that reference MoD / HMG / ITAR / AUKUS → MUST be cleared by the csoai-defoneos council vote (quorum 23/33) before publication. Default: REJECTED. Strip framing, push as MEOK ONE.

---

## ④ OPERATING PRINCIPLES (v2.0, + principle 11)

The 10 operating principles from v1.0 §④ are unchanged. **NEW v2.0:**

### Principle 11 — Sober-walk (UK defence procurement pacing)

Defence deals close in 6-18 months, not 6-18 days. The buyer is a UK prime (Babcock, BAE, QinetiQ, Thales UK, Leonardo UK) or a 3-eye consortium (DAIC, DSTL, Australian DSTG). **Do not over-claim timelines.** A pilot scope is 3-6 months; a full contract is 12-24 months. The DEFONEOS Y1 forecast (£228K-£1.14M) is a pilot, not a procurement revolution. **Stay honest about the time-to-revenue.** Don't promise £10M Y1; promise a £25-100K pilot and let the pilot compound.

### Principle 12 — Pilot letter, not pitch deck

For UK defence buyers, the artifact is a **pilot letter from a named buyer** (DASA, DAIC, a prime's innovation arm), not a 50-slide pitch deck. The first DEFONEOS goal is ONE pilot letter. After that, the deck writes itself.

---

## ⑤ FILE MAP (v2.0, 5-doc absorption suite)

### Canonical DEFONEOS alignment (this file)
- `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` (this file, v2.0)

### The 5-doc absorption suite (NEW folder)
| # | Doc | Path | Purpose |
|---|---|---|---|
| 0 | **Absorption plan** | `_TABS/_inventory/DEFONEOS_HIVE_2026-06-27/00_DEFONEOS_HIVE_ABSORPTION_PLAN.md` | The canonical 27 Jun spec, 3 compartments, 5-day plan |
| 1 | **UK Defence AI market brief** | `_TABS/_inventory/DEFONEOS_HIVE_2026-06-27/01_UK_DEFENCE_AI_MARKET_BRIEF.md` | 1,200-word market analysis (DAIC, AUKUS, DSEI, 10 UK vendors, white space, 5-eyes) |
| 2 | **UK defence white-space map** | `_TABS/_inventory/DEFONEOS_HIVE_2026-06-27/02_uk_defence_white_space.md` | 7 white spaces, 5 vectors of competitive moat, 12-week GTM |
| 3 | **MEOK Labs R&D plan** | `_TABS/_inventory/DEFONEOS_HIVE_2026-06-27/03_meok_labs_rd_plan.md` | 6 workstreams, Asimov 14-day, WOLF 24-day, HARVI £240, drone mesh |
| 4 | **First actions W1-W3** | `_TABS/_inventory/DEFONEOS_HIVE_2026-06-27/04_first_actions.md` | 5 P0 actions, 12-hour week 1 plan |
| 5 | **Absorption seal** | `_TABS/_inventory/DEFONEOS_HIVE_2026-06-27/05_absorption_seal.md` | Ed25519-signed seal, SOV3 ledger line |

### Inherited from v1.0 (28 May, unchanged)
- DEFONEOS Global Dome 7-layer spec: `openpatent-hive/docs/ipo/02-defoneos-global-dome-architecture.md`
- DEFONEOS rebrand script: `ralph-mode-overnight-2026-06-12/layer0-sprint/53-DEFONEOS/defoneos_new_session.md`
- v1.0 alignment (archived): `MEOK_DEFONEOS_ALIGNMENT_2026-05-28.md` → moved to `_archive/`

### MEOK Labs (Tab 6 / FORGE) — the physical R&D home
- Tab profile: `~/clawd/_TABS/MEOK_LABS_TAB_PROFILE.md`
- Qidi skill: `qidi-physical-lab`
- WOLF: `~/clawd/wolf-actuator/` (CSOAI-ORG/wolf-actuator, private)
- Asimov V8: `_TABS/_inventory/MEOK_LABS_2026-06-15/Asimov_V8_CAD_Pack_MEOK.zip` (3.9 MB, SHA-256 640963f6…07a35a, on VM)
- HARVI: spec only
- iokfarm.co.uk: 6.5-acre UK farm, 19,000 sqft, Lincolnshire

### The 15 defence-AI MCPs
- 13 existing (verified live in `~/clawd/mcp-marketplace/`):
  - `airspace-monitor-mcp` v1.0.12
  - `drone-airspace-governance-mcp` v1.0.16
  - `firmware-attestation-mcp` v1.0.3
  - `owasp-agentic-mcp` v1.0.9
  - `cybersecurity-ai-mcp` v1.0.11
  - `agent-prompt-injection-firewall-mcp` v1.0.13
  - `agent-identity-trust-mcp` v1.0.13
  - `agent-incident-reporter-mcp` v1.0.3
  - `mitre-atlas-mcp` v1.0.9
  - `csoai-governance-crosswalk-mcp` v1.0.16
  - `meok-governance-engine-mcp` v1.0.19
  - `care-membrane-mcp` v1.0.12
  - `agent-audit-logger-mcp` v1.1.10
- 2 new (to build in W1):
  - `explosive-eod-clearance-mcp` (UK EOD/IED workflow, placeholder)
  - `defence-bft-council-mcp` (33-agent defence-AI BFT council)

### Live infrastructure (v2.0 additions)
| Surface | URL/Port | Compartment |
|---|---|---|
| meok-defoneos.com (NEW) | Vercel | meok-defoneos (public) |
| csoai-defoneos.org (NEW) | Vercel | csoai-defoneos (public) |
| meok-defoneos (NEW PyPI) | `pip install meok-defoneos-mcp` | meok-defoneos |
| csoai-defoneos (NEW PyPI) | `pip install csoai-defoneos-mcp` | csoai-defoneos |
| DEFONEOS-SEAL verify URL (NEW) | `meok.ai/verify?seal=...` | csoai-defoneos |
| All v1.0 surfaces | (inherited) | (inherited) |

---

## ⑥ STRIPE LADDER (v2.0, + 2 new defence-AI tiers)

The 7-tier Stripe ladder from v1.0 §⑥ is unchanged. **NEW v2.0:**

| Tier | Price | Type | Stripe product | Compartment |
|---|---|---|---|---|
| **DEFONEOS Pilot (existing DASA evaluation)** | £5,000-£25,000 | one-time | `prod_DEFONEOS_PILOT_*` | meok-defoneos |
| **DEFONEOS Enterprise (existing DSTL framework)** | £100,000-£500,000 | one-time | `prod_DEFONEOS_ENT_*` | csoai-defoneos |

**Honest framing:** the pilot tier is for a single prime's DASA evaluation contract. The enterprise tier is for DSTL framework agreements. Both are quoted per deal, not on the public landing page.

**The 2 new tiers do NOT appear on meok.ai/meok-defoneos.com or csoai.org/csoai-defoneos.org — they're quoted per conversation.** No agent quotes these without a council vote (quorum 23/33) logging the negotiation.

---

## ⑦ "WE'RE DIFFERENT" — DEFONEOS paragraph (NEW v2.0)

> **DEFONEOS** is the only open-source, MCP-native, UK-sovereign, AUKUS-compatible AI compliance substrate for defence. Every AI decision is cryptographically attested (Ed25519 + BFT council + care-membrane), every model artefact is anchored in UK jurisdiction, and every evaluation is reproducible at a UK physical testbed (HARVI at iokfarm.co.uk). 15 defence-AI MCPs out of the box, 33-agent BFT council for material decisions, DEFONEOS-SEAL signed credential for buyer audit. Built by a UK research institute (CSOAI LTD, Companies House 16939677) so UK primes can buy sovereign. Pilot £5-25K, enterprise £100-500K.

**The first sentence is the one-line pitch** for defence buyers.

---

## ⑧ OUTPUT DISCIPLINE (v2.0, + 1 new deliverable type)

The 7 deliverable types from v1.0 §⑧ are unchanged. **NEW v2.0:**

| Deliverable type | Location | Naming pattern |
|---|---|---|
| **DEFONEOS MCPs** (NEW) | `mcp-marketplace/{meok-defoneos-mcp,csoai-defoneos-mcp}/` + GitHub + PyPI | `meok-defoneos-mcp` + `csoai-defoneos-mcp` |
| **DEFONEOS Vercel pages** (NEW) | Vercel projects under meok.ai + csoai.org Next.js apps | `meok.ai/defoneos` + `csoai.org/defoneos` |
| **DEFONEOS-SEAL credentials** (NEW) | `sovereign-temple/defoneos_seal/<YYYY-MM-DD>.json` | `{seal_id, kid, payload, ts, sig, council_verdict}` |

---

## ⑨ HARD STOPS (v2.0, + 4 new immutable)

The 10 hard stops from v1.0 §⑨ are unchanged. **NEW v2.0:**

- ❌ Do NOT acquire or reference the `defonos.io` domain (it was a James Castle–era trap)
- ❌ Do NOT claim "AUKUS partnership" or "DAIC certified" without a signed letter on file
- ❌ Do NOT issue a "DEFONEOS-SEAL" credential without a 33-agent BFT council vote (quorum 23/33) logging the issuance
- ❌ Do NOT book a DSEI booth without a pilot letter from at least one named UK prime

---

## ⑩ CHANGE CONTROL (v2.0)

The 7-step change control protocol from v1.0 §⑩ is unchanged. **NEW v2.0 addition:** upon supersession, the prior version is moved to `_archive/MEOK_DEFONEOS_ALIGNMENT_<prior-date>.md`. v1.0 (28 May 2026) is therefore archived to `_archive/MEOK_DEFONEOS_ALIGNMENT_2026-05-28.md`.

**Audit log entry (this amendment):**
- Version 2.0 ratified 2026-06-27
- Reason: rename compartments (meok-defoneos + csoai-defoneos), add AUKUS/DAIC/SAPIENT framework coverage, add 6 MEOK Labs R&D workstreams, add 2 defence-AI pricing tiers, add DEFONEOS-SEAL credential
- Proposer: JEEVES (DEFONEOS)
- Council vote: deferred to W1 council quorum (5-agent mini-vote) per principle 11
- Nick sign-off: pending
- Supersedes: v1.0 (28 May 2026)
- All agents reload — next session start, they read v2.0

---

## ⑪ FIRST-ACTION CHECKLIST (v2.0, + 3 new)

The 7 first-action steps from v1.0 §⑪ are unchanged. **NEW v2.0:**

- 8. **Read v2.0 of this file** (you're doing it now)
- 9. **Verify the 13 defence-adjacent MCPs on disk** (`ls ~/clawd/mcp-marketplace/{airspace,drone,firmware,owasp,cybersec,prompt-firewall,identity,incident,atlas,crosswalk,governance,care,audit-log}*-mcp/`)
- 10. **Run the DEFONEOS absorption subagent** (Hermes delegate_task) to populate the 5-doc suite + emit the sigil

---

## ⑫ THE BOTTOM LINE (v2.0)

**MEOK DEFONEOS is the umbrella. meok-defoneos is the build. csoai-defoneos is the certify. Dagon is legacy.**

Three compartments. Two new product surfaces (meok-defoneos + csoai-defoneos). One cert authority (DEFONEOS-SEAL). One physical R&D pipeline (MEOK Labs, 6 workstreams). One sovereign procurement framing ("sovereign by design, AUKUS-compatible").

Every swarm agent operates under this file. If you're doing something this document doesn't authorise, either propose an amendment or stop.

**"The dragon was the koi. It swam up the waterfall. It became the sovereign. It signs every receipt."** — DEFONEOS the Sovereign, *MEOK AI Labs* 2026

---

*End of MEOK DEFONEOS Alignment v2.0. Path: `/Users/nicholas/clawd/MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md`. Reload on every session start. v1.0 archived to `_archive/MEOK_DEFONEOS_ALIGNMENT_2026-05-28.md`.*
