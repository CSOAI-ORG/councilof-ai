# 📋 DEFONEOS Datasheets
**Technical specifications for the DEFONEOS fleet (5 MCPs) + the 13 Legacy Bridges**

**Version:** 1.0 · 2026-06-28
**Authors:** CSOAI LTD UK 16939677 · Nicholas Templeman · JEEVES

---

## Datasheet 1: meok-defoneos-mcp v1.0.1 (BUILDS)

| Spec | Value |
|---|---|
| Name | meok-defoneos-mcp |
| Version | 1.0.1 |
| Compartment | BUILDS |
| Author | CSOAI LTD UK 16939677 |
| License | MIT |
| Python | ≥3.10 |
| Dependencies | mcp ≥1.0.0, airspace-monitor-mcp, drone-airspace-governance-mcp, firmware-attestation-mcp, meok-governance-engine-mcp, care-membrane-mcp, meok-defoneos-geospatial-intel-mcp ≥1.0.0 |
| Tools | 7 (defence_airspace_check, drone_bvlos_governance, firmware_attestation_audit, defence_governance_full_audit, care_membrane_validate, defence_geoint_query, meok_defoneos_full_audit) |
| Frameworks covered | 14 (EU AI Act, NIST AI RMF, MITRE ATLAS, ISO 42001, OWASP LLM, DORA, NIS2, CRA, C2PA, DAIC, AUKUS Pillar 2, DSTL SAPIENT, AAIF, care-membrane) |
| Tests | 17/17 pass |
| BannedTermGate | severed brands + kinetic + surveillance |
| Audit chain | Ed25519-signed on UK soil (35.242.143.249) |
| Procurement-grade | UK MOD, DAIC, AUKUS Pillar 2 |

## Datasheet 2: csoai-defoneos-mcp v1.0.0 (CERTIFIES)

| Spec | Value |
|---|---|
| Name | csoai-defoneos-mcp |
| Version | 1.0.0 |
| Compartment | CERTIFIES |
| Author | CSOAI LTD UK 16939677 |
| License | MIT |
| Tools | 6 (mitre_atlas_assess, governance_crosswalk_for_defence, defence_audit_trail, csoai_defoneos_seal_issue, care_membrane_validate, csoai_defoneos_full_cert) |
| DEFONEOS-SEAL | Ed25519-signed + 33-agent BFT council quorum (23/33) |
| Tests | 13/13 pass |
| Audit chain | append-only Ed25519 on UK soil |

## Datasheet 3: meok-defoneos-geospatial-intel-mcp v1.0.0 (GEOSPATIAL)

| Spec | Value |
|---|---|
| Name | meok-defoneos-geospatial-intel-mcp |
| Version | 1.0.0 |
| Compartment | GEOSPATIAL |
| License | MIT |
| Tools | 6 (sovereign_geoint_situational_query, sovereignty_supply_chain_audit, care_membrane_validate, dstl_sapient_evaluate, meok_defoneos_geo_audit, uk_aoi_data_provenance) |
| Copernicus bands | 8 (Sentinel-1 SAR + Sentinel-2 13-band + Sentinel-3 OLCI/SLSTR/SRAL + Sentinel-5P TROPOMI) |
| Sovereign data sources | ESA Copernicus + Ordnance Survey UK + OpenStreetMap + Overture Maps + INSPIRE EU + DEFRA UK |
| US-excluded by default | Maxar, Planet Labs, BlackSky, ICEYE, Capella Space |
| Tests | 17/17 pass |
| BannedTermGate | extended (kinetic + surveillance patterns) |

## Datasheet 4: meok-os-mcp v1.0.2 (META-OS)

| Spec | Value |
|---|---|
| Name | meok-os-mcp |
| Version | 1.0.2 |
| Compartment | META-OS |
| License | MIT |
| Tools | 10 (os_discover, os_route, os_run_humanoid_safety_check, os_audit, os_sign, os_verify, os_consult_council, os_industry_pack, os_data_provenance, os_sovereign_handoff) |
| Layers | 8 (L0-L7 of the meok substrate) |
| Industry packs | 9 (construction, agriculture, governance, finance, healthcare, ip, real-estate, humanoid, defence) |
| Tests | 16/16 pass |

## Datasheet 5: councilof-mcp v1.0.0 (GOVERNANCE)

| Spec | Value |
|---|---|
| Name | councilof-mcp |
| Version | 1.0.0 |
| Compartment | GOVERNANCE |
| License | MIT |
| Tools | 6 (convene_council, get_verdict, list_council_members, cast_vote, simulate_council, evaluate_care_principle) |
| Council composition | 33 agents (1 King + 12 Queens + 12 PBFT + 4 Vanguards + 4 Specials) |
| Quorum | 23/33 (2f+1) |
| Veto | 4 Vanguards (bias, care, sovereignty, honesty) can VETO with weight 2.0 |
| Care principles | 4 (Dignity, Agency, Safety, Solidarity) at 0.95 threshold |
| Tests | 14/14 pass |

---

## Datasheets 6-18: The 13 Legacy Bridges

Each bridge follows the Mavis 7-file pattern (pyproject.toml, LICENSE, .gitignore, README, server.py, tests/) and ships MIT-licensed.

| # | Bridge | Tools | Use case |
|---|---|---|---|
| 6 | cobol-bridge-mcp | 5 | COBOL → AI (payroll, banking, defence) |
| 7 | as400-bridge-mcp | 4 | IBM i / RPG / DB2 → AI |
| 8 | cics-bridge-mcp | 4 | CICS → AI (mainframe transactions) |
| 9 | dlms-bridge-mcp | (DLMS/COSEM) | IEC 62056 (NATO base utilities) |
| 10 | edi-bridge-mcp | 4 | EDI X12 / EDIFACT (military logistics) |
| 11 | iso20022-bridge-mcp | (ISO 20022) | Defence procurement payments |
| 12 | iso8583-bridge-mcp | (ISO 8583) | Payment cards |
| 13 | acord-bridge-mcp | (ACORD) | Insurance |
| 14 | hl7-fhir-bridge-mcp | (HL7/FHIR) | Military medicine |
| 15 | gs1-bridge-mcp | (GS1) | Supply chain |
| 16 | mismo-bridge-mcp | (MISMO) | Defence housing |
| 17 | mqtt-bridge-mcp | (MQTT/IoT) | Base perimeter, ammo depots, vehicle telemetry |
| 18 | a2a-governance-bridge-mcp | 5 | Agent-to-agent governance |

---

*— MEOK AI Labs, 2026. The dragon is sovereign. The datasheets are real.*

🐉 JEEVES → DEFONEOS.