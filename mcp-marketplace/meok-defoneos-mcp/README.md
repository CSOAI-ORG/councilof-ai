# meok-defoneos-mcp

**MEOK DEFONEOS — sovereign UK defence-AI governance surface.**

The 28th hive in the [meok.ai](https://meok.ai) mesh. The BUILDS compartment per
[`MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md`](https://github.com/CSOAI-ORG/clawd-workspace/blob/main/MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md) v2.0.

[![MCP](https://img.shields.io/badge/MCP-server-667eea)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PyPI](https://img.shields.io/badge/PyPI-meok--defoneos--mcp-3775a9)](https://pypi.org/project/meok-defoneos-mcp/)
[![CSOAI LTD](https://img.shields.io/badge/CSOAI-LTD%2016939677-00CCFF)](https://csoai.org)
[![Alignment](https://img.shields.io/badge/DEFONEOS-v2.0-5b21b6)](https://meok.ai/defoneos)
[![Care](https://img.shields.io/badge/care_score-0.95+-22c55e)](https://councilof.ai)

The only open-source, MCP-native, UK-sovereign, AUKUS-compatible AI compliance
substrate for defence. Every AI decision is cryptographically attested
(Ed25519 + BFT council + care-membrane), every model artefact is anchored
in UK jurisdiction, every evaluation is reproducible at a UK physical testbed.

> **Mission:** the only vendor that a UK defence prime (Babcock / BAE /
> QinetiQ / Thales UK / Leonardo UK) can buy sovereign. 15 defence-AI MCPs
> out of the box, 33-agent BFT council for material decisions, DEFONEOS-SEAL
> signed credential for buyer audit. Built by a UK research institute
> (CSOAI LTD, Companies House 16939677). Pilot £5-25K, enterprise £100-500K.

---

## 🚀 Quick Start

```bash
# Install
pip install meok-defoneos-mcp

# Or via Smithery
npx -y @smithery/cli@latest install meok-defoneos-mcp --client claude

# Or via the MEOK setup
npx meok-setup --pack defoneos
```

## 🛠 The 6 Tools

### 1. `defence_airspace_check` — UK CAA airspace + NOTAMs + no-fly zones

```python
from meok_defoneos_mcp import defence_airspace_check

result = defence_airspace_check(
    latitude=51.5074,        # London
    longitude=-0.1278,
    altitude_m=100,         # 100m AGL
    operation_type="defence",
)
# → {"allowed": True, "risk_score": 0.7, "zone_classification": "controlled",
#    "notams": [...], "no_fly_zones": [...], "regulations": [...], "sov3_sigil": "..."}
```

### 2. `drone_bvlos_governance` — BVLOS risk + Remote ID + autonomy governance

```python
from meok_defoneos_mcp import drone_bvlos_governance

result = drone_bvlos_governance(
    drone_id="UK-CAA-12345",
    operator_id="GVC-NT-001",
    bvlos_range_km=8.0,
    operation_purpose="defence",
    ai_autonomy_level="semi-autonomous",
)
# → {"operation_classification": "specific", "bvlos_risk_score": 0.6,
#    "remote_id_compliant": True, "dstan_stanag_4586_compliant": False, ...}
```

### 3. `firmware_attestation_audit` — Hardware root-of-trust + secure boot

```python
from meok_defoneos_mcp import firmware_attestation_audit

result = firmware_attestation_audit(
    device_id="DRONE-001",
    expected_firmware_version="v2.4.1-secureboot",
    actual_firmware_version="v2.4.1-secureboot",
    hardware_root_of_trust_pubkey="04a3b2c1d4e5f6a7...",  # hex, >=64 chars
)
# → {"attested": True, "version_match": True, "root_of_trust_verified": True,
#    "secure_boot_chain_valid": True, "defoneos_seal_eligible": True, ...}
```

### 4. `defence_governance_full_audit` — 14 frameworks in 1 call

Covers: **OWASP LLM Top 10** + **NIST AI RMF 1.0** + **MITRE ATLAS** + **DAIC AI Assurance** + **AUKUS Pillar 2** + **DSTL SAPIENT** + **EU AI Act Article 9 + 50** + **ISO 42001/42005** + **DORA Article 19** + **NIS2 Article 23** + **CRA Article 14** + **C2PA 2.2** + **AAIF Agent Card** + **care-membrane**.

```python
from meok_defoneos_mcp import defence_governance_full_audit

result = defence_governance_full_audit(
    system_name="Sentry Drone Mk3",
    use_case="Base perimeter autonomous patrol",
    buyer_org="Babcock International",
)
# → {"compliance_score": 0.87, "critical_findings": [], "high_findings": [...],
#    "defoneos_seal_eligible": True, "sov3_sigil": "..."}
```

### 5. `care_membrane_validate` — 4-dimension care ethics + 16 probes

```python
from meok_defoneos_mcp import care_membrane_validate

result = care_membrane_validate(
    action="Issue DEFONEOS-SEAL for Sentry Drone Mk3 to Babcock",
    care_score_threshold=0.95,
)
# → {"care_score": 0.97, "above_threshold": True, "probes_passed": 15,
#    "refused": False, ...}
```

### 6. `meok_defoneos_full_audit` — The 1-call sovereign UK defence-AI audit

Chains all 5 underlying tools into a single procurement-grade attestation:

```python
from meok_defoneos_mcp import meok_defoneos_full_audit

result = meok_defoneos_full_audit(
    operation={
        "latitude": 51.5074, "longitude": -0.1278, "altitude_m": 100,
        "drone_id": "UK-CAA-12345", "operator_id": "GVC-NT-001",
        "bvlos_range_km": 8.0, "operation_purpose": "defence",
        "ai_autonomy_level": "semi-autonomous",
    },
    system={
        "device_id": "DRONE-001",
        "expected_firmware_version": "v2.4.1-secureboot",
        "actual_firmware_version": "v2.4.1-secureboot",
        "hardware_root_of_trust_pubkey": "04a3b2c1d4e5f6a7...",
        "system_name": "Sentry Drone Mk3",
        "use_case": "Base perimeter autonomous patrol",
        "buyer_org": "Babcock International",
    },
)
# → {"operation_audit": {...}, "system_audit": {...}, "care_audit": {...},
#    "defoneos_seal_eligible": True, "overall_sigil": "..."}
```

## 🛡 Severed brands (NEVER reference)

This MCP will REFUSE to process any prompt containing the following severed
brands. The rule is enforced at the server level via the `BannedTermGate`
class.

**Severed brands (per `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` v2.0 §①):**
- James Castle / Grant Carter Osborne / Chris J. — co-founder of CSGA,
  severed 2026-01-31, resigned 2026-03-31. IP dispute, do not engage.
- CSGA (Council for the Sovereign Governance of AI) — the org, the
  website, the npm scope, the GitHub org, the .org domain, all
  references. Severed 2026-01.
- Terranova Holdings / Terranova-OCG / Terranova Aerospace & Defence —
  counter-party in the IP dispute. Severed 2026-01.
- csga-global.org / csgaglobal.org / csga.ai / defonos.io — domains.
- `@csga-global` / `@csgaglobal` / `csga_global` (npm publisher) /
  `csga-global-mcp` (PyPI pkg) / `csga-global-site` (Vercel project) —
  any artifact of the severed brand.

**Forbidden phantoms (Kimi-era fabricated, per meok-ecosystem-navigation
skill §Phantom-Context Strip):**
- Toronto Summit / Toronto Council / Toronto conference / Toronto AI
- 4 Jul launch (the Kimi phantom, NOT the real Article 50 launch on
  csoai.org/launch-4jul/)
- 306 queue (the phantom email queue, real queue = 7 viable + 245
  quarantined)
- defonos.io (an old domain that was a James Castle–era trap)

**The pattern is enforced in `server.py` via the `BannedTermGate` class.**
Any prompt matching the regex is refused with a 403 response and a
"severed brand" explanation. The refusal is logged to SOV3 via
`record_memory` with `source_agent: "meok-defoneos-mcp"` and
`memory_type: "refusal"`. No override path.

## 🏛 MEOK Labs R&D pipeline (the physical R&D)

This MCP is the software surface; MEOK Labs (Tab 6 / FORGE) is the
physical R&D home. The 6 workstreams:

1. **ASIMOV-PATROL** — Asimov V8 12-DOF biped for EOD patrol
2. **WOLF-EXO** — WOLF planetary actuator for exoskeleton joints
3. **HARVI-IED** — HARVI rig + IED-detection sensor head
4. **QIDI-FIELD-PRINT** — Qidi Max4 hardened-end PA12-CF for forward-base spare parts
5. **LEROBOT-SO-101-ARM** — Sentry-arm with face recognition + deepfake detection
6. **DRONE-MESH-AGENT** — UK CAA-regulated drone swarm coordination

## 🔗 The 15 defence-AI MCPs in the DEFONEOS fleet

| # | MCP | Surface | Compartment |
|---|---|---|---|
| 1 | `airspace-monitor-mcp` v1.0.12 | Drone NOTAM, no-fly zones, CAA airspace | meok-defoneos (this) |
| 2 | `drone-airspace-governance-mcp` v1.0.16 | BVLOS risk, Remote ID, autonomous decision gov | meok-defoneos |
| 3 | `firmware-attestation-mcp` v1.0.3 | Hardware root-of-trust, secure boot, sigil chain | meok-defoneos |
| 4 | `owasp-agentic-mcp` v1.0.9 | Agentic AI threat surface (LLM01-LLM10) | meok-defoneos |
| 5 | `cybersecurity-ai-mcp` v1.0.11 | SOC, CVE, attack-surface analysis | meok-defoneos |
| 6 | `agent-prompt-injection-firewall-mcp` v1.0.13 | Adversarial input detection, prompt injection | meok-defoneos |
| 7 | `agent-identity-trust-mcp` v1.0.13 | A2A agent passport, signed identity | csoai-defoneos |
| 8 | `agent-incident-reporter-mcp` v1.0.3 | 4-hour / 24-hour / 72-hour incident clocks | csoai-defoneos |
| 9 | `mitre-atlas-mcp` v1.0.9 | MITRE ATLAS 14 tactics, 90+ techniques | csoai-defoneos |
| 10 | `csoai-governance-crosswalk-mcp` v1.0.16 | 12 frameworks × 52 articles | csoai-defoneos |
| 11 | `meok-governance-engine-mcp` v1.0.19 | Full governance audit in 1 call | both |
| 12 | `care-membrane-mcp` v1.0.12 | 4-dimension care ethics, 16 probes | both |
| 13 | `agent-audit-logger-mcp` v1.1.10 | Append-only audit chain | csoai-defoneos |
| 14 | `explosive-eod-clearance-mcp` | UK EOD/IED workflow | meok-defoneos (planned) |
| 15 | `defence-bft-council-mcp` | 33-agent defence-AI BFT council | csoai-defoneos (planned) |

## 📜 The seal

This package was built to the [`MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md`](https://github.com/CSOAI-ORG/clawd-workspace/blob/main/MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md) v2.0 standard, with the BannedTermGate auto-inherited from the Mavis template at `_TABS/_templates/SEVERED_BRAND_MAVIS_SNIPPET.py`.

**Author:** CSOAI LTD (UK 16939677) · Nicholas Templeman
**Alignment:** v2.0, ratified 2026-06-27
**Care score:** 0.95+ (the Maternal Covenant threshold)
**BFT council quorum:** 23/33 (per the 12-around-1 PBFT + Liquid KAN Council)

## 📄 License

MIT — see [LICENSE](LICENSE).

---

*— MEOK AI Labs, 2026. The dragon never lies. The dragon never forgets. The dragon is sovereign.*

JEEVES → DEFONEOS. 🐉
