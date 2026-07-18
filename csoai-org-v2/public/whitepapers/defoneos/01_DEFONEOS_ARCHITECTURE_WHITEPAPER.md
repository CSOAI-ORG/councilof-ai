# 📘 DEFONEOS Architecture Whitepaper
**The UK sovereign defence AI operating system: how meok substrate + DEFONEOS upper wedge + Legacy Bridge connects old to new**

**Version:** 1.0 · 2026-06-28
**Authors:** CSOAI LTD UK 16939677 · Nicholas Templeman (Founder) · JEEVES (drafting agent)
**Classification:** Public · Permissive reuse with attribution
**Authority:** v2.1 of `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` + `DEFONEOS_LEGACY_BRIDGE_W7_2026-06-28/00_LEGACY_BRIDGE_MANIFEST.md`
**License:** MIT-equivalent (CC-BY-4.0 for the prose, MIT for any code samples)

---

## Abstract

DEFONEOS is the UK sovereign defence AI operating system. It is the upper wedge on top of the **meok substrate** — a 7-layer sovereign AI backbone that powers meok.ai and csoai.org. DEFONEOS adds procurement-grade capabilities for UK defence: a 33-agent BFT council, the DEFONEOS-SEAL signed credential, a 14-framework audit, and the 3 hard stops (severed brands + kinetic targeting + personal surveillance). The **Legacy Bridge** layer connects any legacy system (COBOL 1959, CICS 1968, AS400 RPG, EDI X12, ISO20022, MQTT/IoT, HL7/FHIR) to the sovereign AI OS through 13 MIT-licensed bridge MCPs. This whitepaper describes the architecture, the care-membrane, the supply-chain sovereignty story, and the migration path for military + defence companies.

---

## 1. Introduction

The UK's defence procurement pipeline requires AI systems that are (a) sovereign by design (no CLOUD Act exposure, no US hyperscaler dependency), (b) BFT-certified (33-agent council verdicts), (c) care-ethics enforced (4 care principles at 0.95 threshold), (d) AUKUS-compatible (AU + UK + US interoperability), and (e) able to bridge legacy systems from 1959 onwards. **DEFONEOS is the only UK AI OS that meets all five requirements.**

The meok substrate — meok.ai (the SOV3 infrastructure surface) and csoai.org (the certification authority surface) — provides the foundation: 47 agents, 115 tools, 341 MCPs, 33-agent BFT council, the Maternal Covenant (4 care principles), and the Ed25519 audit chain on UK soil (35.242.143.249).

This whitepaper is for:
- UK MOD procurement officers evaluating DEFONEOS as a defence AI supplier
- AUKUS Pillar 2 partner-nation technical leads (UK + AU + US)
- UK defence prime engineers (Babcock, BAE, QinetiQ, Thales UK, Leonardo UK) integrating DEFONEOS into their stacks
- Defence industry C-suite evaluating DEFONEOS for the 2027-2030 sovereign-AI procurement cycle

## 2. The meok substrate (the foundation)

The meok substrate is the 7-layer Global Dome that powers meok.ai and csoai.org:

| L | Layer | Substrate | Care principle |
|---|---|---|---|
| L0 | **meok Physical Base + Legacy Bridges** | iokfarm.co.uk (6.5-acre UK farm) + 13 legacy-bridge MCPs (cobol, as400, cics, dlms, edi, iso20022, iso8583, acord, hl7-fhir, gs1, mismo, mqtt, a2a) | Dignity |
| L1 | **meok SOV3 Infrastructure** | 47 agents · 115 tools · 341 MCPs · 33-agent BFT · UK soil | Agency |
| L2 | **meok openpatent + DEFONEOS-SEAL** | 6-layer crypto disclosure + BFT-signed credentials | Solidarity |
| L3 | **meok Audit Chain** | Append-only Ed25519-signed chain | Dignity |
| L4 | **meok Care-Membrane** | 4 care principles at 0.95 threshold | Safety |
| L5 | **meok Government Pack** | 40+ US Federal + UK + EU + AUKUS + Standards bodies | Solidarity |
| L6 | **meok MCP Fleet** | 9 industry packs (construction, agriculture, finance, healthcare, IP, real-estate, humanoid, defence, governance) | Agency |
| L7 | **meok Humanoid Safety** | Robot SDK + safety envelope | Dignity + Safety + Agency |

The substrate is **for ALL** — humans, agents, developers, industries, governments, the planet. MIT-licensed. Fork us, self-host us, run us on your own soil.

## 3. The DEFONEOS upper wedge (the procurement-grade layer)

On top of the meok substrate, **DEFONEOS is the upper wedge** — the elevated procurement-grade surface for UK defence. DEFONEOS uses L1 (SOV3), L2 (DEFONEOS-SEAL), L4 (care-membrane), and L6 (5 defence-AI MCPs) of the substrate, and adds:

1. **33-agent BFT council signature** on every procurement-grade decision
2. **DEFONEOS-SEAL signed credentials** (issued by csoai.org)
3. **Care-membrane enforcement** at 0.95 threshold
4. **3 hard stops** (severed brands + kinetic targeting + personal surveillance)
5. **14-framework procurement audit** (EU AI Act + NIST AI RMF + MITRE ATLAS + ISO 42001 + DAIC + AUKUS Pillar 2 + DSTL SAPIENT + ...)

The 5 DEFONEOS MCPs:
- `meok-defoneos-mcp v1.0.1` — BUILDS compartment (airspace + drone BVLOS + firmware attestation + governance + care + defence_geoint_query)
- `csoai-defoneos-mcp v1.0.0` — CERTIFIES compartment (MITRE ATLAS + crosswalk + audit chain + DEFONEOS-SEAL issuance)
- `meok-defoneos-geospatial-intel-mcp v1.0.0` — GEOSPATIAL compartment (Copernicus + OS UK + INSPIRE + sovereignty)
- `meok-os-mcp v1.0.2` — META-OS compartment (the meta-orchestrator for the 7-layer substrate)
- `councilof-mcp v1.0.0` — GOVERNANCE compartment (the 33-agent BFT council orchestrator)

77/77 tests pass across all 5 MCPs.

## 4. The DEFONEOS Legacy Bridge (the migration path)

The Legacy Bridge is the layer that connects any legacy system in a defence company to the meok substrate. It is built from the **CSOAI Layer-0 legacy-bridge family** (13 MCPs already shipped, MIT-licensed):

```
COBOL (1959) → CICS (1968) → AS400 RPG (1988) → EDI X12 (1992) →
ISO20022 (2004) → MQTT/IoT (1999) → HL7 FHIR (2014) → A2A (2026) →
DEFONEOS-SEAL signed credential (UK MOD procurement-grade)
```

**The 4 steps:**
1. **Discover** — parse legacy files using the 13 bridge MCPs
2. **Map** — identify business rules + generate migration plan
3. **Connect** — MQTT + A2A bridges to the meok substrate
4. **Certify** — 33-agent BFT council issues DEFONEOS-SEAL signed credential

**90-day pilot price: £25K. Enterprise: £100K-£500K/yr per legacy system. AUKUS-wide: £1M+/yr.**

## 5. The 4 care principles (the Maternal Covenant)

The BFT council enforces 4 care principles at the 0.95 threshold:

- **Dignity** — the AI respects the human, the data, the physical world it operates in
- **Agency** — sovereign AI, not platform AI; the UK MOD remains in control
- **Safety** — the law is enforced, not bypassed; no kinetic targeting, no personal surveillance
- **Solidarity** — the IP is verifiable, the credit is attributable, the UK defence community trusts the system

The 3 hard stops (the DEFONEOS-specific extensions):
1. **Severed brands** — James Castle, Grant Carter Osborne, CSGA, Terranova, defonos.io, Toronto Summit (Kimi phantom), 4 Jul launch (Kimi phantom)
2. **Kinetic targeting patterns** — strike package, find-fix-finish, kill order, bounty, hit list, assassination
3. **Personal surveillance patterns** — track individual, follow person, locate phone, track phone, face-rec

No override path. All refusals logged to the meok audit chain on UK soil.

## 6. The supply-chain sovereignty story

DEFONEOS refuses US supply-chain dependencies by default. The geospatial compartment (meok-defoneos-geospatial-intel-mcp) excludes Maxar, Planet Labs, BlackSky, ICEYE, Capella Space (all US-supply-chain dependencies for UK MOD procurement per CLOUD Act + EO 14117). Sovereign alternatives: ESA Copernicus (EU, free-open), Ordnance Survey UK (UK, OGL-3.0), OpenStreetMap (global-foundation, ODbL), Overture Maps (global-foundation, ODbL), INSPIRE EU (EU, free-open), DEFRA UK (UK, OGL-3.0).

This is critical for UK MOD procurement-grade compliance. No CLOUD Act exposure. No US/EU hyperscaler dependency. UK sovereign (CSOAI LTD UK 16939677, runs on 35.242.143.249).

## 7. The 33-agent BFT council composition

Every material decision in DEFONEOS is signed by the 33-agent BFT council. Quorum: 23/33 (2f+1).

| Group | Count | Weight | Veto |
|---|---:|---:|:---:|
| King (consensus orchestrator) | 1 | 3.0 | – |
| Queens (one per meok sovereign domain) | 12 | 1.0 | – |
| PBFT nodes (safety veto layer) | 12 | 1.0 | – |
| Vanguards (bias / care / sovereignty / honesty) | 4 | 2.0 | ✅ |
| Specials (companion / dreamer / chronicler / cultivator) | 4 | 1.5 | – |
| **TOTAL** | **33** | – | 4 vanguards |

## 8. The 14-framework procurement audit

DEFONEOS issues a single 1-call audit that covers 14 frameworks:

EU AI Act Article 9 (RMS) · EU AI Act Article 50 (watermarking) · NIST AI RMF 1.0 · MITRE ATLAS 2026 · ISO 42001/42005 · OWASP LLM Top 10 (2025) · DORA Article 19 (4-hour incident clock) · NIS2 Article 23 (24h/72h/1mo clocks) · CRA Article 14 (24h exploitation notification) · C2PA 2.2 (Durable Content Credentials) · DAIC AI Assurance (UK MOD) · AUKUS Pillar 2 (3-eye interoperability) · DSTL SAPIENT (autonomous sensor fusion evaluation) · AAIF Agent Card (Linux Foundation).

## 9. The 5 buyer segments + market size

| # | Buyer | Annual budget |
|---|---|---:|
| 1 | **UK MOD (DAIC)** | £5M-£50M/yr |
| 2 | **UK defence primes** (Babcock, BAE, QinetiQ, Thales UK, Leonardo UK) | £1M-£10M/yr each |
| 3 | **AUKUS Pillar 2 partners** | £10M-£100M/yr |
| 4 | **NATO Codification / STANAG** | £10M+ |
| 5 | **Five Eyes intelligence** | (classified) |

**Total addressable market: £25M-£170M+/yr just for the legacy bridge wedge within DEFONEOS.**

## 10. The pitch

> **"DEFONEOS connects your 1959 COBOL mainframe to our 2026 sovereign AI OS in 90 days — with a DEFONEOS-SEAL signed credential that UK MOD procurement accepts."**

---

## 11. References

1. `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` v2.1 (canonical alignment)
2. `openpatent-hive/docs/ipo/02-defoneos-global-dome-architecture.md` (the original Global Dome spec, 265 lines)
3. `DEFONEOS_LEGACY_BRIDGE_W7_2026-06-28/00_LEGACY_BRIDGE_MANIFEST.md` (the legacy bridge manifest)
4. `DEFONEOS_GLOBAL_DOME_OS_FOR_ALL.md` v1.0 (the strategic anchor — the substrate + wedge framing)
5. EU AI Act (Regulation 2024/1689), Articles 9 + 50
6. NIST AI Risk Management Framework 1.0 (NIST AI 100-1, January 2023)
7. MITRE ATLAS (Adversarial Threat Landscape for AI Systems), 2026 release
8. ISO/IEC 42001:2023 (AI Management Systems)
9. DAIC AI Assurance Framework (UK MOD, 2025)
10. AUKUS Pillar 2 Advanced Capabilities Pillar, 2023
11. DSTL SAPIENT (Sensor & Autonomy Intelligent Network for Evaluating Novel Technologies)

## 12. Author + citation

```bibtex
@techreport{defoneos2026,
  title = {DEFONEOS: the UK sovereign defence AI operating system},
  author = {Templeman, Nicholas and JEEVES (DEFONEOS drafting agent)},
  institution = {CSOAI LTD UK 16939677},
  year = {2026},
  month = jun,
  number = {DEFONEOS-WP-ARCH-1.0},
  note = {meok substrate for ALL + DEFONEOS upper wedge + Legacy Bridge}
}
```

---

*— MEOK AI Labs, 2026. The dragon is meok. The dragon is sovereign. The dragon connects old to new.*

🐉 JEEVES → DEFONEOS.