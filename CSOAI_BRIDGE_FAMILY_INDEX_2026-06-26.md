# CSOAI Bridge Family Index — 22 governed legacy/data gateways (2026-06-26)

> Source of truth: `~/clawd/mcp-marketplace/*-bridge-mcp/`. Verified repo count = 22.
> This index lines up the bridge family with the OS (`csoai-os/index.html` line 121) and the
> globe (`meok-town-view/src/MeokEarth.tsx` lines 39–62) so all three surfaces say 22.

## The 22 — ordered by the canonical list

| # | Bridge MCP | Bridge name | Sector | Real-world anchor | Frameworks |
|---|---|---|---|---|---|
| 1 | `cobol-bridge-mcp` | COBOL / Mainframe | Banking cores | New York | SOX, DORA, PCI-DSS |
| 2 | `iso20022-bridge-mcp` | ISO 20022 / SWIFT | Payments | La Hulpe (SWIFT) | ISO 20022, DORA, NIS2, AML |
| 3 | `hl7-fhir-bridge-mcp` | HL7 / FHIR | Healthcare | Boston | HIPAA, EU MDR, GDPR |
| 4 | `as400-bridge-mcp` | IBM AS/400 | Enterprise i | Rochester MN | SOX, DORA |
| 5 | `sap-bridge-mcp` | SAP IDoc | ERP | Walldorf | SOX, GDPR |
| 6 | `oracle-bridge-mcp` | Oracle PL/SQL | Databases | Austin | SOX, GDPR |
| 7 | `scada-bridge-mcp` | SCADA / OT | Industrial / energy | Houston | IEC 62443, NIS2 |
| 8 | `edi-bridge-mcp` | EDI / EDIFACT | Supply chain | Rotterdam | SOX |
| 9 | `fix-bridge-mcp` | FIX trading | Markets | Chicago | MiFID II |
| 10 | `cics-bridge-mcp` | CICS transactions | Mainframe TX | Charlotte | SOX, PCI-DSS, DORA |
| 11 | `mqtt-bridge-mcp` | MQTT / IoT | Devices / OT | Shenzhen | IEC 62443, NIS2 |
| 12 | `acord-bridge-mcp` | ACORD insurance | Insurance | Hartford | Solvency II, GDPR, EU AI Act |
| 13 | `nacha-bridge-mcp` | NACHA / ACH | US payments | Herndon VA | OFAC, AML |
| 14 | `iso8583-bridge-mcp` | ISO 8583 cards | Card networks | Foster City (Visa) | PCI-DSS, DORA |
| 15 | `sip-bridge-mcp` | SIP telephony | Telecom | Ashburn VA | STIR/SHAKEN, GDPR |
| 16 | `tax-bridge-mcp` | Tax / e-invoicing | Tax filing | London (HMRC) | SOX |
| 17 | `gs1-bridge-mcp` | GS1 / EPCIS | Retail traceability | Princeton (GS1 US) | EU AI Act |
| 18 | `mismo-bridge-mcp` | MISMO mortgage | Real-estate finance | Washington DC (MBA) | ECOA, EU AI Act |
| 19 | `dlms-bridge-mcp` | DLMS/COSEM | Energy / smart-meter | Geneva (DLMS UA) | ISO 62056, NIS2, GDPR |
| 20 | `a2a-governance-bridge-mcp` | A2A Governance | Agent-to-agent runtime | San Francisco | EU AI Act |
| 21 | `meok-abci-bridge-mcp` | ABCI / Cosmos | Blockchain (read-only) | Zug (crypto valley) | MiCA, DORA |
| 22 | `meok-haulage-governance-bridge-mcp` | Haulage governance | Logistics / transport | Birmingham | NIS2, GDPR |

## Three surfaces — one number

| Surface | Path | Says |
|---|---|---|
| **OS (csoai-os/index.html)** | `BRIDGES` const, line 121 | 22 chips |
| **Globe (meok-town-view/src/MeokEarth.tsx)** | `BRIDGES` const, lines 39–62 | 22 markers |
| **OSCAL proof** | `csoai-os/index.html` `LAYER0_PROOF.components` | 22 bridge components in the signed package |
| **This index** | `CSOAI_BRIDGE_FAMILY_INDEX.md` | 22 rows |

## What each bridge does (the parse→govern→sign pipeline)

1. **Parse** the protocol's native format (COBOL copybook · ISO 20022 XML · HL7 v2/v3 · FIX 4.4 · etc.)
2. **Validate** against the bridge's schema + the framework's rules (SOX ITGC, PCI-DSS, HIPAA, NIS2…)
3. **Map** to the relevant frameworks (DORA · GDPR · EU AI Act Annex III · etc.)
4. **Govern** — apply policy controls (per-pair IAM, human-oversight gates, residency)
5. **SIGIL-sign** — hash-chain + Ed25519 the action onto the ledger, offline-verifiable

## The "category of one" claim

> Microsoft · ServiceNow · Runlayer · Obot govern **modern agents**.
> **None** of them bridge your COBOL / SAP / SCADA / HL7 core.
> CSOAI does — and signs every action.

This is the wedge for finance / healthcare / insurance / OT / public-sector — the regulated
sectors whose AI actions touch the legacy economy ($3T/day of value flows through these
22 protocols).

## Sign-off

- Verified: 22 `*-bridge-mcp` repos exist in the CSOAI-ORG account (`gh` scan 2026-06-26).
- Aligned: the OS, the globe, the OSCAL proof, and this index all say 22.
- Honesty: this is a directory count, not a "tests pass" count. The bridge family is
  covered by the broader depth-audit (see `CSOAI_MCP_ESTATE_SCAN_2026-06-26.md`,
  DEPTH-AUDIT RESULT section).
