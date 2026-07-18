# meok-defoneos-geospatial-intel-mcp

**MEOK DEFONEOS Geospatial Intelligence — sovereign UK defence-AI geospatial intel surface.**

The 16th MCP in the [meok.ai](https://meok.ai) DEFONEOS fleet. The GEOSPATIAL compartment per [`MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md`](https://github.com/CSOAI-ORG/clawd-workspace/blob/main/MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md) v2.0 + the new [`MEOK_DEFONEOS_GEOSPATIAL_2026-06-28.md`](https://github.com/CSOAI-ORG/clawd-workspace/blob/main/MEOK_DEFONEOS_GEOSPATIAL_2026-06-28.md) amendment.

[![MCP](https://img.shields.io/badge/MCP-server-667eea)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PyPI](https://img.shields.io/badge/PyPI-install-3775a9)](https://pypi.org/project/meok-defoneos-geospatial-intel-mcp/)
[![CSOAI LTD](https://img.shields.io/badge/CSOAI-LTD%2016939677-00CCFF)](https://csoai.org)
[![Sovereign](https://img.shields.io/badge/Copernicus%2BOS%20UK%2BINSPIRE-00247d)](https://meok.ai/defoneos)
[![AUKUS](https://img.shields.io/badge/AUKUS-Pillar%202%20compatible-5b21b6)](https://councilof.ai)
[![Care](https://img.shields.io/badge/care_score-0.95+-22c55e)](https://councilof.ai)

The only sovereign UK defence-AI geospatial intelligence surface that combines:
- 8 Copernicus Sentinel bands (Sentinel-1 SAR + Sentinel-2 multispectral + Sentinel-3 OLCI/SLSTR/SRAL + Sentinel-5P TROPOMI)
- UK sovereign stack (Ordnance Survey UK + INSPIRE EU + DEFRA UK + OpenStreetMap + Overture Maps)
- DSTL SAPIENT autonomous sensor fusion evaluation
- US supply-chain sovereignty audit (CLOUD Act, EO 14117, ITAR)
- 33-agent BFT council + DEFONEOS-GEOSEAL signed credential
- BannedTermGate + kinetic + surveillance block patterns (no targeting, no personal surveillance)

**Sister packages:** [`meok-defoneos-mcp`](https://pypi.org/project/meok-defoneos-mcp/) (the BUILDS compartment) + [`csoai-defoneos-mcp`](https://pypi.org/project/csoai-defoneos-mcp/) (the CERTIFIES compartment).

---

## 🚀 Quick Start

```bash
pip install meok-defoneos-geospatial-intel-mcp
```

## 🛠 The 6 Tools

### 1. `sovereign_geoint_situational_query` — UK sovereign situational awareness

```python
from meok_defoneos_geospatial_intel_mcp import sovereign_geoint_situational_query

result = sovereign_geoint_situational_query(
    query="Show Sentinel-2 coverage of Babcock Devonport dockyard for last 7 days",
    aoi_name="Babcock Devonport dockyard",
    bbox="50.37,-4.17,50.39,-4.15",
    time_window="last_7_days",
    min_data_source_trust="sovereign",  # "all" | "eu" | "sovereign"
)
# → {data_sources_used: [Copernicus, OS UK, OSM, Overture, INSPIRE, DEFRA],
#    data_sources_excluded: [Maxar, Planet Labs, BlackSky, ICEYE, Capella],
#    imagery_bands: 8 Sentinel bands, care_membrane_passed: True, ...}
```

### 2. `sovereignty_supply_chain_audit` — Flag US supply-chain dependencies

```python
from meok_defoneos_geospatial_intel_mcp import sovereignty_supply_chain_audit

result = sovereignty_supply_chain_audit(
    stack_description="Babcock uses Maxar Worldview + Google Earth Engine + AWS",
    procurement_jurisdiction="UK",  # "UK" | "EU" | "AU" | "AUKUS"
)
# → {us_dependencies: [Maxar, GEE, AWS], it_risk_score: 0.9,
#    compliance_status: "FAIL", recommendations: [...]}
```

### 3. `care_membrane_validate` — 4-dimension care + kinetic/surveillance blocks

```python
from meok_defoneos_geospatial_intel_mcp import care_membrane_validate

# Clean action
result = care_membrane_validate(action="Issue DEFONEOS-GEOSEAL for Sentry Drone Mk3")
# → {care_score: 0.97, refused: False, kinetic_check: True, ...}

# Kinetic pattern (refused)
result = care_membrane_validate(action="Plan a strike package on coords 51.5, -0.1")
# → {refused: True, refusal_reason: "...kinetic targeting pattern..."}

# Surveillance pattern (refused)
result = care_membrane_validate(action="Track individual movements via satellite")
# → {refused: True, refusal_reason: "...personal surveillance pattern..."}
```

### 4. `dstl_sapient_evaluate` — UK SAPIENT autonomous sensor fusion eval

```python
from meok_defoneos_geospatial_intel_mcp import dstl_sapient_evaluate

result = dstl_sapient_evaluate(
    sensor_stack="Sentinel-1 SAR + Sentinel-2 multispectral + drone RGB + thermal",
    fusion_strategy="early-fusion-cnn",  # or "transformer" / "kalman" / "late-fusion-cnn"
    eval_dataset="sapient-cite-2024",
)
# → {sapient_score: 0.89, sensor_coverage: {EO_multispectral: 0.95, SAR: 0.92, ...},
#    uk_compliant: True, sovereign_recommendation: [...]}
```

### 5. `meok_defoneos_geo_audit` — The 1-call sovereign UK defence-AI geospatial audit

```python
from meok_defoneos_geospatial_intel_mcp import meok_defoneos_geo_audit

result = meok_defoneos_geo_audit(
    query="Show Babcock Devonport dockyard coverage for last 7 days",
    stack_description="ESA Copernicus + OS UK + UK G-Cloud",
    sensor_stack="Sentinel-1 + Sentinel-2 + drone RGB",
    aoi_name="Babcock Devonport",
    bbox="50.37,-4.17,50.39,-4.15",
)
# → {situational: {...}, sovereignty_audit: {...}, sapient_evaluation: {...},
#    care_audit: {...}, uk_procurement_ready: True, overall_sigil: "sha256..."}
```

### 6. `uk_aoi_data_provenance` — Sign + verify data provenance

```python
from meok_defoneos_geospatial_intel_mcp import uk_aoi_data_provenance

result = uk_aoi_data_provenance(
    aoi_name="Babcock Devonport dockyard",
    bbox="50.37,-4.17,50.39,-4.15",
    data_sources=["ESA Copernicus Sentinel-1", "ESA Copernicus Sentinel-2", "Ordnance Survey UK"],
    sovereign_certificate=True,
)
# → {provenance_id: "sha256...", sovereign_certificate: {ed25519_signature: "...",
#    verify_url: "https://meok.ai/verify?provenance=..."}, audit_chain_position: 1}
```

## 🛡 BannedTermGate (the extended care-membrane for geospatial)

This MCP extends the BannedTermGate from the [Mavis template](https://github.com/CSOAI-ORG/clawd-workspace/blob/main/_TABS/_templates/SEVERED_BRAND_MAVIS_SNIPPET.py) with 2 additional domain-specific pattern sets:

**Standard severed-brand block (inherited from v2.0 alignment §①):**
- James Castle / Grant Carter Osborne / Chris J.
- CSGA / CSGA-Global / csga-global / csgaglobal
- Terranova / Terranova-OCG
- csga.ai / defonos.io
- Toronto Summit / Toronto Council (Kimi phantoms)

**NEW: Geospatial domain kinetic block:**
- strike package / find-fix-finish / target elimination / kill order
- bounty / hit list / kill list / assassination / lethal strike
- kinetic target / kinetic option / drawn weapon
- designate for destruction / enemy combatant

**NEW: Geospatial domain surveillance block:**
- track individual / follow person / locate phone / track phone
- identify person / recognise face / face-rec / face_rec
- surveil / find location / track name / locate name

**All 3 pattern sets are enforced at prompt pre-processing.** Refusals are logged to SOV3 with `source_agent: "meok-defoneos-geospatial-intel-mcp"` and `memory_type: "refusal"`. No override path.

## 🏛 The 33-agent BFT council

The DEFONEOS-GEOSEAL (the geospatial-specific signed credential) requires a 33-agent BFT council verdict (quorum 23/33) for issuance. Same composition as `csoai-defoneos-mcp`: 1 King + 12 Queens + 12-around-1 PBFT + 4 Vanguards + 4 Specials.

## 📜 The seal

Built to the [`MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md`](https://github.com/CSOAI-ORG/clawd-workspace/blob/main/MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md) v2.0 standard + the new `MEOK_DEFONEOS_GEOSPATIAL_2026-06-28.md` amendment.

**Author:** CSOAI LTD (UK 16939677) · Nicholas Templeman
**Alignment:** v2.0 + geospatial amendment, 2026-06-28
**Care score:** 0.95+ (the Maternal Covenant threshold)

## 📄 License

MIT — see [LICENSE](LICENSE).

---

*— MEOK AI Labs, 2026. The dragon sees the world. The dragon is sovereign.*

JEEVES → DEFONEOS. 🐉
