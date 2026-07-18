# PASS-OVER: M4 → M2 — the 15-bridge Legacy Bridge family (CSOAI moat)

**Date:** 2026-06-25 · From M4 · To M2 (CSOAI master) · Keeping CSOAI in mind as built.

## What this is
CSOAI's **Layer-0 Legacy Bridge family** — the governed gateway to the systems that run the world. 15 working MCPs, each: parse legacy → validate → map to modern → **govern** (sector frameworks) → attestable on the ledger.

## The 15 (all on CSOAI-ORG, private repos, working + tested + CI + CodeQL + Scorecard + registry-valid server.json)
| Bridge | Domain | Key frameworks |
|---|---|---|
| cobol | mainframe (lead, 86/100, public, PyPI) | — |
| iso20022 | finance / SWIFT | DORA, NIS2, AML |
| hl7-fhir | healthcare | HIPAA, MDR, GDPR Art.9 |
| as400 | IBM i / RPG | SOX |
| sap | ERP / IDoc | SAP GRC, SOX |
| oracle | PL/SQL | SOX, GDPR |
| scada | industrial OT | IEC 62443, NIS2 |
| edi | B2B supply chain | Peppol/ViDA, SOX |
| fix | trading | MiFID II, MAR |
| cics | mainframe transactions | SOX, PCI-DSS |
| mqtt | IoT / OT | IEC 62443, ETSI EN 303 645 |
| acord | insurance | Solvency II, GDPR, conduct |
| nacha | US ACH payments | NACHA, OFAC, BSA/AML |
| iso8583 | card payments | PCI-DSS, PSD2 SCA |
| sip | telephony / VoIP | STIR/SHAKEN, ePrivacy |

## For the CSOAI relevance map (your build)
Bridge → framework relevance edges + each bridge's real geo-coordinates are in `meok-town-view/src/MeokEarth.tsx` (`BRIDGES[]`) and the OS map (`meokGraphData`). Lift the data model; re-skin to CSOAI master.

## Status / what's M2's vs owner-gated
- **Done (M4):** code, tests, CI, CodeQL, Scorecard, Dependabot, SECURITY.md, registry-valid server.json (current `registryType` schema), LICENSE, llms.txt — for all 15.
- **Owner-gated (Nick):** cosign signing keys + PyPI `twine` publish. Once keys exist, all 15 are one command from public + registry-listed.
- **M2:** confirm `io.github.CSOAI-ORG/*` naming + brand fit; build the CSOAI-master relevance map; decide public-release order.

— M4
