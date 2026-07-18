# csoai-defoneos-mcp

**CSOAI DEFONEOS — sovereign UK defence-AI CERTIFICATION surface.**

The CERTIFIES compartment per
[`MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md`](https://github.com/CSOAI-ORG/clawd-workspace/blob/main/MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md) v2.0.
Sister to [`meok-defoneos-mcp`](https://pypi.org/project/meok-defoneos-mcp/) (the BUILDS compartment).

[![MCP](https://img.shields.io/badge/MCP-server-667eea)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PyPI](https://img.shields.io/badge/PyPI-csoai--defoneos--mcp-3775a9)](https://pypi.org/project/csoai-defoneos-mcp/)
[![CSOAI LTD](https://img.shields.io/badge/CSOAI-LTD%2016939677-00CCFF)](https://csoai.org)
[![Council](https://img.shields.io/badge/33--agent%20BFT%20Council-5b21b6)](https://councilof.ai)
[![Care](https://img.shields.io/badge/care_score-0.95+-22c55e)](https://councilof.ai)
[![DEFONEOS-SEAL](https://img.shields.io/badge/DEFONEOS--SEAL-v1-FF6600)](https://meok.ai/verify)

The certification authority surface for UK defence-AI. Every certification
is cryptographically attested (Ed25519 + 33-agent BFT council quorum +
care-membrane), every DEFONEOS-SEAL is verifiable at a public URL, every
audit chain entry is append-only with no delete.

> **Mission:** the only UK-sovereign, AUKUS-compatible AI certification
> authority for defence. Built by a UK research institute (CSOAI LTD,
> Companies House 16939677). Procurement-grade for Babcock, BAE, QinetiQ,
> Thales UK, Leonardo UK, DAIC, DSTL, AUKUS Pillar 2.

---

## 🚀 Quick Start

```bash
pip install csoai-defoneos-mcp
```

## 🛠 The 6 Tools

### 1. `mitre_atlas_assess` — MITRE ATLAS 14 tactics × 90+ techniques

```python
from csoai_defoneos_mcp import mitre_atlas_assess

result = mitre_atlas_assess(
    system_name="Sentry Drone Mk3",
    use_case="Base perimeter autonomous patrol",
    deployment_context="production",
)
# → {"tactics_covered": 14, "techniques_covered": 90,
#    "highest_risk_tactics": [...], "atlas_score": 0.92, ...}
```

### 2. `governance_crosswalk_for_defence` — 12 frameworks × 52 articles

```python
from csoai_defoneos_mcp import governance_crosswalk_for_defence

result = governance_crosswalk_for_defence(
    control_id="EU-AI-Act-Article-9-RMS",
)
# → {"frameworks_covered": [...12 frameworks...], "article_references": {...},
#    "defence_applicability": "DIRECT (UK MOD procurement-grade; AUKUS-compatible)"}
```

### 3. `defence_audit_trail` — Append-only Ed25519-signed audit chain

```python
from csoai_defoneos_mcp import defence_audit_trail

result = defence_audit_trail(
    action="DEFONEOS-SEAL issued for Sentry Drone Mk3",
    actor="33-agent BFT council verdict NT-2026-06-28-001",
    system_id="SENTRY-DRONE-MK3",
    care_score=0.97,
    sov3_sigil="abc123",  # optional: chain to a prior sigil
)
# → {"audit_id": "...", "this_sigil": "...", "chain_position": 1, ...}
```

### 4. `csoai_defoneos_seal_issue` — DEFONEOS-SEAL signed credential

```python
from csoai_defoneos_mcp import csoai_defoneos_seal_issue, defence_audit_trail, care_membrane_validate

# First, run the audits
gov = {"defoneos_seal_eligible": True, "compliance_score": 0.87}
care = care_membrane_validate(action="Issue DEFONEOS-SEAL for Sentry Drone Mk3")

# Then issue the SEAL
seal = csoai_defoneos_seal_issue(
    system_id="SENTRY-DRONE-MK3",
    buyer_org="Babcock International",
    governance_audit_result=gov,
    care_audit_result=care,
    council_verdict_id="NT-2026-06-28-001",  # 33-agent BFT verdict
)
# → {"seal_id": "...", "seal_url": "https://meok.ai/verify?seal=...",
#    "ed25519_signature": "...", "council_verdict_id": "...", ...}
```

### 5. `care_membrane_validate` — 4-dimension care ethics + 16 probes

```python
from csoai_defoneos_mcp import care_membrane_validate

result = care_membrane_validate(
    action="Issue DEFONEOS-SEAL for Sentry Drone Mk3 to Babcock",
    care_score_threshold=0.95,
)
# → {"care_score": 0.97, "above_threshold": True, "probes_passed": 15, ...}
```

### 6. `csoai_defoneos_full_cert` — The 1-call sovereign UK defence-AI certification

```python
from csoai_defoneos_mcp import csoai_defoneos_full_cert

result = csoai_defoneos_full_cert(
    system={
        "system_name": "Sentry Drone Mk3",
        "use_case": "Base perimeter autonomous patrol",
        "system_id": "SENTRY-DRONE-MK3",
        "control_id": "EU-AI-Act-Article-9-RMS",
        "actor": "csoai-defoneos-mcp",
        "care_score": 0.97,
    },
    buyer_org="Babcock International",
    council_verdict_id="NT-2026-06-28-001",  # optional but required for SEAL
)
# → {"atlas_assessment": {...}, "crosswalk": {...}, "audit_trail": {...},
#    "care_audit": {...}, "seal": {...}, "certification_eligible": True, ...}
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

**Forbidden phantoms (Kimi-era fabricated):**
- Toronto Summit / Toronto Council / Toronto conference / Toronto AI
- 4 Jul launch (the Kimi phantom, NOT the real Article 50 launch)
- 306 queue (the phantom email queue)
- defonos.io (an old domain that was a James Castle–era trap)

**The pattern is enforced in `server.py` via the `BannedTermGate` class.**
Any prompt matching the regex is refused with a 403 response and a
"severed brand" explanation. The refusal is logged to SOV3 via
`record_memory` with `source_agent: "csoai-defoneos-mcp"` and
`memory_type: "refusal"`. No override path.

## 🏛 The 33-agent BFT council (the cert authority)

The DEFONEOS-SEAL can only be issued after a 33-agent BFT council vote
reaches quorum (2f+1 = 23 of 33 voters). The council's composition:
- 12 queen personas (one per hive domain)
- 1 King (the orchestrator)
- 12-around-1 PBFT consensus logic (the safety veto)
- 4 vanguards (the bias / care / sovereignty / honesty lenses)
- 4 special roles (the sovereign companion, the dreamer, the chronicler, the cultivator)

The verdict is recorded in `sovereign-temple/council_log/<YYYY-MM-DD>.jsonl`
and the seal includes the `council_verdict_id` for full audit chain.

## 📜 The seal

This package was built to the [`MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md`](https://github.com/CSOAI-ORG/clawd-workspace/blob/main/MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md) v2.0 standard, with the BannedTermGate auto-inherited from the Mavis template at `_TABS/_templates/SEVERED_BRAND_MAVIS_SNIPPET.py`.

**Author:** CSOAI LTD (UK 16939677) · Nicholas Templeman
**Alignment:** v2.0, ratified 2026-06-27
**Care score:** 0.95+ (the Maternal Covenant threshold)
**BFT council quorum:** 23/33 (per the 12-around-1 PBFT + Liquid KAN Council)

## 📄 License

MIT — see [LICENSE](LICENSE).

---

*— MEOK AI Labs, 2026. The dragon certifies. The dragon is sovereign.*

JEEVES → DEFONEOS. 🐉
