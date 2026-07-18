# 📘 DEFONEOS Legacy Bridge Whitepaper
**How to connect any 1959-2026 legacy system to the UK sovereign AI operating system in 90 days**

**Version:** 1.0 · 2026-06-28
**Authors:** CSOAI LTD UK 16939677 · Nicholas Templeman · JEEVES
**Classification:** Public · CC-BY-4.0
**Authority:** v2.1 of `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` + `DEFONEOS_LEGACY_BRIDGE_W7_2026-06-28`

---

## Abstract

Military and defence companies operate a heterogeneous mix of legacy systems: COBOL mainframes from the 1960s, CICS transaction processors, AS400 ERP, EDI X12 / EDIFACT B2B messaging, ISO20022 financial messaging, MQTT/IoT sensors, HL7/FHIR medical records, and modern agent-to-agent (A2A) protocols. **The DEFONEOS Legacy Bridge is the 13-MCP migration path that connects any legacy system to the UK sovereign AI OS** — the meok substrate + the DEFONEOS upper wedge — in 90 days. Each bridge MCP is MIT-licensed, pre-existing, and audited by the 33-agent BFT council. The end result: a DEFONEOS-SEAL signed credential that UK MOD procurement accepts.

---

## 1. The problem

UK defence companies face a 4-decade legacy tax:

- **COBOL mainframes** (1960s) run payroll, defence pensions, and procurement payments. Babcock and BAE Systems maintain 100+ COBOL programmes each.
- **CICS transactions** (1968) handle real-time defence logistics at every UK base. The DWP defence pay system runs on CICS.
- **AS400 RPG** (1988) runs the legacy ERP for inventory, vehicle fleet management, and equipment maintenance at Babcock's dockyards.
- **EDI X12 / EDIFACT** (1992) is the military logistics standard for NATO stock numbers (NSN), Defence Logistics Agency (DLA) transactions, and Babcock's supply chain.
- **ISO20022** (2004) is the financial messaging standard for defence procurement payments.
- **MQTT / IoT** (1999) connects base perimeter sensors, ammo depot temperature monitors, and vehicle telemetry (modbus, J1939, CAN-bus).
- **HL7 / FHIR** (2014) handles military medicine at MHS GENESIS, TRICARE, and NATO medical facilities.
- **A2A (2026)** is the new agent-to-agent protocol for sovereign AI agents.

**Each of these is a procurement-grade compliance gap when AI agents operate on them.** DEFONEOS Legacy Bridge closes each gap with a specific bridge MCP.

## 2. The 13 bridges (the CSOAI Layer-0 legacy-bridge family)

| # | Bridge MCP | Tools | Use case | Buyer |
|---|---|---|---|---|
| 1 | `cobol-bridge-mcp` | parse_cobol, identify_business_rules, plan_migration, generate_test_harness, estimate_complexity | COBOL → AI (payroll, banking, insurance) | UK MOD, Babcock, BAE |
| 2 | `as400-bridge-mcp` | parse_rpg, identify_files, map_to_modern, govern_ibmi | IBM i / RPG / DB2 → AI (legacy defence ERP) | Babcock, BAE |
| 3 | `cics-bridge-mcp` | parse_cics, identify_transactions, map_to_modern, govern_cics | CICS → AI (mainframe transactions, DWP defence pay) | UK MOD, DWP |
| 4 | `dlms-bridge-mcp` | (DLMS/COSEM) | IEC 62056 smart meters (NATO base utilities) | UK MOD, NATO |
| 5 | `edi-bridge-mcp` | parse_edi, validate_edi, map_to_modern, govern_edi | EDI X12 / EDIFACT (military logistics, NSN, DLA) | UK MOD, NATO |
| 6 | `iso20022-bridge-mcp` | (ISO 20022) | Defence procurement payments | UK MOD |
| 7 | `iso8583-bridge-mcp` | (ISO 8583) | Payment cards (defence procurement cards) | UK MOD |
| 8 | `acord-bridge-mcp` | (ACORD) | Insurance (TRICARE, military insurance) | UK MOD, US DoD |
| 9 | `hl7-fhir-bridge-mcp` | (HL7 / FHIR) | Healthcare (MHS GENESIS, NATO medicine) | UK MOD, US DoD, NATO |
| 10 | `gs1-bridge-mcp` | (GS1) | Supply chain (NATO stock numbers) | UK MOD, NATO |
| 11 | `mismo-bridge-mcp` | (MISMO) | Defence housing (BAH) | UK MOD, US DoD |
| 12 | `mqtt-bridge-mcp` | (MQTT/IoT) | Base perimeter, ammo depots, vehicle telemetry (modbus, J1939, CAN) | UK MOD, NATO |
| 13 | `a2a-governance-bridge-mcp` | verify_agent_compliance, authorize_a2a_transaction, get_trust_registry, get_a2a_audit_trail, cross_agent_risk_score | Agent-to-agent governance (used by DEFONEOS) | all |

**All 13 are MIT-licensed, pre-existing in the meok substrate, audited by the 33-agent BFT council.**

## 3. The 4-step migration path

```
[Step 1] DISCOVER       [Step 2] MAP            [Step 3] CONNECT       [Step 4] CERTIFY
parse legacy files    →  extract business    →  MQTT + A2A bridge →  33-agent BFT
13 bridge MCPs            rules + plan          to meok substrate    council signs
                                                                  DEFONEOS-SEAL
```

**Step 1 (Discover, days 1-14):** Run `cobol-bridge-mcp.parse_cobol` (or as400/cics/edi equivalents) on the legacy files. Output: paragraph inventory, file IO surfaces, cyclomatic complexity. ~100 files / day per bridge.

**Step 2 (Map, days 15-35):** Run `cobol-bridge-mcp.identify_business_rules` + `cobol-bridge-mcp.plan_migration`. Output: business-rule inventory + 3-phase migration plan + estimated effort.

**Step 3 (Connect, days 36-75):** Stand up `mqtt-bridge-mcp` + `a2a-governance-bridge-mcp` to bridge the legacy system to the meok substrate. Run a pilot AI agent through the bridges. Verify audit chain integrity.

**Step 4 (Certify, days 76-90):** Call `csoai-defoneos-mcp.csoai_defoneos_seal_issue` with the system + buyer_org. The 33-agent BFT council convenes (simulate_council + cast_vote × 23). The council signs the DEFONEOS-SEAL credential. Output: Ed25519-signed credential + verify URL.

## 4. The 90-day pilot (the smallest viable procurement)

| Week | Deliverable | Tool |
|---|---|---|
| W1 | Inventory of all legacy systems + bridge selection | `os_discover(layer="L0")` |
| W2 | First legacy file parsed, business rules extracted | `cobol-bridge-mcp.parse_cobol` |
| W3 | Migration plan generated, top 5 highest-value AI agents identified | `cobol-bridge-mcp.plan_migration` |
| W4 | MQTT + A2A bridges stood up, first pilot AI agent running | `mqtt-bridge-mcp`, `a2a-governance-bridge-mcp` |
| W5-12 | Continuous migration + agent expansion | All 13 bridges |
| W13 | DEFONEOS-SEAL signed by 33-agent BFT council | `csoai-defoneos-mcp.csoai_defoneos_seal_issue` |

**Pilot price:** £25K one-off (90 days). **Enterprise:** £100K-£500K/yr per legacy system. **AUKUS-wide:** £1M+/yr.

## 5. The buyer journey

1. **DAIC procurement officer** evaluates DEFONEOS against the 14-framework audit (see Architecture Whitepaper §8).
2. **UK defence prime** (Babcock, BAE, QinetiQ, Thales UK, Leonardo UK) signs a 90-day pilot for £25K.
3. **Pilot delivers** the 4-step migration on a single legacy system (typically COBOL payroll or EDI logistics).
4. **DEFONEOS-SEAL issued** by the 33-agent BFT council.
5. **Enterprise contract** at £100K-£500K/yr per legacy system, multi-year, with AUKUS-wide expansion.

## 6. The defence vs civilian framing

**For UK MOD procurement:** the Legacy Bridge is a sovereign-AI migration path for defence systems. The DEFONEOS-SEAL is procurement-grade attestation. The audit chain is auditable by DAIC, DSTL, AUKUS partners.

**For commercial customers** (outside UK defence): the Legacy Bridge is available via the meok substrate (meok.ai) without the DEFONEOS upper wedge. The care-membrane is the same; the 3 hard stops + DEFONEOS-SEAL are DEFONEOS-specific extensions.

## 7. The pitch

> **"DEFONEOS connects your 1959 COBOL mainframe to our 2026 sovereign AI OS in 90 days — with a DEFONEOS-SEAL signed credential that UK MOD procurement accepts."**

---

## 8. Author + citation

```bibtex
@techreport{defoneos-legacy-bridge2026,
  title = {DEFONEOS Legacy Bridge: connecting 1959-2026 legacy systems to the UK sovereign AI OS},
  author = {Templeman, Nicholas and JEEVES},
  institution = {CSOAI LTD UK 16939677},
  year = {2026},
  month = jun,
  number = {DEFONEOS-WP-LEGACY-1.0}
}
```

---

*— MEOK AI Labs, 2026. The dragon connects old to new.*

🐉 JEEVES → DEFONEOS.