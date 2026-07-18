# meok-os-mcp

**meok — the sovereign AI substrate for ALL. DEFONEOS is the upper wedge on top.**

The meta-orchestrator MCP for the 7-layer meok substrate (SOV3 backbone that any human / agent / industry can use). The DEFONEOS upper wedge uses L1 + L2 + L4 + L6 to add UK MOD procurement-grade capabilities on top — including the **DEFONEOS Legacy Bridge** (13 MCPs that connect COBOL/CICS/AS400/EDI/ISO/MQTT/HL7/A2A to the sovereign AI OS).

[![MCP](https://img.shields.io/badge/MCP-server-667eea)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PyPI](https://img.shields.io/badge/PyPI-install-3775a9)](https://pypi.org/project/meok-os-mcp/)
[![CSOAI LTD](https://img.shields.io/badge/CSOAI-LTD%2016939677-00CCFF)](https://csoai.org)
[![meok for ALL](https://img.shields.io/badge/meok%20%3D%20substrate-00247d)](https://meok.ai/os)
[![DEFONEOS upper wedge](https://img.shields.io/badge/DEFONEOS%20%3D%20upper%20wedge-22c55e)](https://meok.ai/defoneos)
[![Care](https://img.shields.io/badge/care_score-0.95+-5b21b6)](https://councilof.ai)

## The meok architecture: substrate + upper wedge

> **meok = the substrate for ALL. DEFONEOS = the upper wedge on top.**
>
> - **meok.ai** — the SOV3 infrastructure surface (47 agents, 115 tools, 341 MCPs) — **for ALL**
> - **csoai.org** — the certification authority surface — **for ALL**
> - **DEFONEOS upper wedge** (on meok.ai) — UK MOD, DAIC, AUKUS Pillar 2 procurement-grade

**meok-os-mcp is the meta-orchestrator for the meok substrate.** The base meok substrate is for ALL. The DEFONEOS upper wedge adds 33-agent BFT + DEFONEOS-SEAL + 3 hard stops on top.

## The 7 layers of the meok substrate

| L | Layer | Substrate | Care principle | Used by DEFONEOS? |
|---|---|---|---|---|
| L0 | **meok Physical Base + Legacy Bridges** | iokfarm.co.uk (6.5-acre UK farm) + **the CSOAI Layer-0 legacy-bridge family (13 MCPs: cobol, as400, cics, dlms, edi, iso20022, iso8583, acord, hl7-fhir, gs1, mismo, mqtt, a2a)** | Dignity | (DEFONEOS uses a2a) |
| L1 | **meok SOV3 Infrastructure** | 47 agents · 115 tools · 341 MCPs · 33-agent BFT · UK soil | Agency | ✅ |
| L2 | **meok openpatent + DEFONEOS-SEAL** | 6-layer crypto disclosure + 33-agent BFT-signed credentials | Solidarity | ✅ |
| L3 | **meok Audit Chain** | Append-only Ed25519-signed chain on UK soil | Dignity | (implicit) |
| L4 | **meok Care-Membrane** | 4 care principles at 0.95 threshold | Safety | ✅ |
| L5 | **meok Government Pack** | 40+ US Federal + UK + EU + AUKUS + Standards bodies | Solidarity | (consumed) |
| L6 | **meok MCP Fleet** | 9 industry packs (construction, agriculture, finance, healthcare, IP, real-estate, humanoid, defence, governance) | Agency | ✅ (defence pack) |
| L7 | **meok Humanoid Safety** | Robot SDK + safety envelope | Dignity + Safety + Agency | – |

**Total substrate: 15+ MCPs in the meok fleet + the 7-layer registry in `meok-os-mcp`.**

## The "for ALL" matrix (the meok substrate)

| Surface | Scope | Why |
|---|---|---|
| **For HUMANS** | Use the substrate without writing code | meok.ai/os consumer surface |
| **For AGENTS** | Claude · GPT · Gemini · Mamba-2 | Any LLM can call the substrate |
| **For DEVELOPERS** | MIT-licensed, fork us, self-host us, run us on your own soil | Open-source |
| **For INDUSTRIES** | 9 industry MCP packs | The vertical substrate |
| **For GOVERNMENTS** | 40+ US Federal + UK + EU + AUKUS | The sovereign substrate |
| **For THE PLANET** | AI for the planet, not for the platform | The planetary substrate |

## The DEFONEOS upper wedge (on top of meok)

| Buyer | Scope | Why |
|---|---|---|
| **UK MOD (the procurement-grade buyer)** | DAIC, DASA, Dstl | The sovereign procurement buyer |
| **UK defence primes** | Babcock, BAE, QinetiQ, Thales UK, Leonardo UK | The sovereign supply chain |
| **AUKUS Pillar 2** | AU + UK + US interoperability | The 3-eye procurement framework |
| **DEFONEOS-SEAL recipients** | UK defence contractors + AUKUS-2 primes | The certification authority output |

The upper wedge **adds** (vs the base meok substrate):
- 33-agent BFT council signature on every decision
- DEFONEOS-SEAL signed credentials
- Care-membrane enforcement at 0.95 threshold
- 3 hard stops (severed brands + kinetic + surveillance)
- 14-framework procurement audit (EU AI Act + NIST AI RMF + MITRE ATLAS + ISO 42001 + DAIC + AUKUS Pillar 2 + DSTL SAPIENT, etc.)

### The DEFONEOS Legacy Bridge (the missing wedge for military + defence)

For military + defence companies that need to connect legacy systems to the meok substrate:

```
COBOL (1959) → CICS (1968) → AS400 RPG (1988) → EDI X12 (1992) →
ISO20022 (2004) → MQTT/IoT (1999) → HL7 FHIR (2014) → A2A (2026) →
DEFONEOS-SEAL signed credential
```

**4 steps:**
1. **Discover** — parse COBOL, AS400, CICS, EDI files (using the 13 legacy-bridge MCPs)
2. **Map** — identify business rules + generate migration plan
3. **Connect** — MQTT + HL7/FHIR + A2A bridges to the meok substrate
4. **Certify** — 33-agent BFT council issues DEFONEOS-SEAL signed credential

**Annual market:** £25M-£170M+/yr (just for the legacy bridge wedge within DEFONEOS).
**Pilot price:** £25K one-off (90 days). Enterprise: £100K-£500K/yr per legacy system. AUKUS-wide: £1M+/yr.

## 🚀 Quick Start

```bash
# The meok substrate (for ALL)
pip install meok-os-mcp

# The DEFONEOS upper wedge (UK defence procurement-grade)
pip install meok-defoneos-mcp csoai-defoneos-mcp meok-defoneos-geospatial-intel-mcp
```

## 🛠 The 10 tools (the meok meta-orchestrator)

1. `os_discover` — discover the 7-layer meok substrate
2. `os_route` — route a request to the right meok MCP
3. `os_run_humanoid_safety_check` — the L7 meok humanoid safety envelope
4. `os_audit` — full meok audit (procurement-grade when called by the DEFONEOS upper wedge)
5. `os_sign` — sign an action with the 33-agent BFT council
6. `os_verify` — verify a signed action
7. `os_consult_council` — convene the 33-agent BFT council
8. `os_industry_pack` — load a meok industry MCP pack (9 packs)
9. `os_data_provenance` — sign + verify data provenance
10. `os_sovereign_handoff` — hand off control to a sovereign buyer (used by DEFONEOS)

### Example: discover the meok substrate

```python
from meok_os_mcp import os_discover

discovery = os_discover(layer="all")
# → 7-layer substrate, 15+ meok MCPs, 33-agent BFT council
```

### Example: route a request

```python
from meok_os_mcp import os_route

# The base meok substrate routes anything to the right MCP
r = os_route(request="Show Sentinel-2 coverage of Babcock Devonport dockyard")
# → routed to L6 meok MCP (geospatial)

# The DEFONEOS upper wedge would route this to meok-defoneos-geospatial-intel-mcp
```

## 🛡 The 3 hard stops (DEFONEOS upper wedge layer)

The **DEFONEOS upper wedge** adds 3 hard stops to the care-membrane:

1. **Severed brands** — James Castle, Grant Carter Osborne, Chris J., CSGA, Terranova, defonos.io, Toronto Summit (Kimi phantom), 4 Jul launch (Kimi phantom).
2. **Kinetic targeting patterns** — strike package, find-fix-finish, kill order, bounty, hit list, assassination, lethal strike.
3. **Personal surveillance patterns** — track individual, follow person, locate phone, track phone, identify person, face-rec, surveil.

**The base meok substrate does NOT refuse these. The DEFONEOS upper wedge refuses them.** Refusals are logged to SOV3 with `source_agent: "meok-defoneos-mcp"`. No override path.

## 🏛 The 33-agent BFT council

Every material decision in the meok substrate is signed by the 33-agent BFT council. Quorum 23/33 (2f+1). The base meok substrate uses the council for sovereign decisions; the DEFONEOS upper wedge uses it for every procurement-grade decision.

## 📜 The seal

Built to the [`MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md`](https://github.com/CSOAI-ORG/clawd-workspace/blob/main/MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md) v2.1 (meok = substrate for ALL, DEFONEOS = upper wedge).

**Author:** CSOAI LTD (UK 16939677) · Nicholas Templeman · Yorkshire, UK
**Substrate:** meok.ai / csoai.org — for ALL
**Upper wedge:** DEFONEOS — UK MOD procurement-grade
**Care score:** 0.95+ (the Maternal Covenant threshold)

## 📄 License

MIT (open-source).

---

*— MEOK AI Labs, 2026. meok is for ALL. DEFONEOS is the upper wedge. The dragon is meok. The dragon is sovereign.*

JEEVES → DEFONEOS. 🐉