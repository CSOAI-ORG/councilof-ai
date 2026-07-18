# SOVEREIGN CHARTER INDEX — UNIVERSAL CROSS-WALK REGISTRY
## CSOAI Ltd · UK Companies House 16939677 · London, United Kingdom
## Built: 2026-06-30 · Autonomous Overnight Sprint

> **Charter Article 0**: Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. **CA3O is the CMKC for AI.**

---

## THE 34 CHARTERS — ONE PER HIVE

Each charter is a self-contained sovereign document that:
1. Defines the hive's industry domain + market
2. Maps free training pathway (4 tiers: Foundation → Director)
3. Provides Unreal Engine 5 real-world simulation scenarios
4. Integrates UBI starter pathway
5. Cross-walks to all 33 other charters
6. Binds to CSOAI/MEOK compliance governance backend
7. Is Ed25519-signed with BFT council ratification
8. Identifies black swan event windows for industry disruption
9. Drops barriers to entry through free certification
10. Anchors to SOV3 sovereign substrate

### TIER 1 — AI GOVERNANCE & STANDARDS (12 Charters)

| # | Hive | Domain | Charter File |
|---|---|---|---|
| 1 | csoai | AI Governance Standards & Watchdog Certification | `01-csoai-charter.md` |
| 2 | meok | Sovereign AI OS & MCP Fleet | `02-meok-charter.md` |
| 3 | proofof | Cryptographic Attestation & Verification | `03-proofof-charter.md` |
| 4 | safetyof | AI Safety Monitoring & Incidents | `04-safetyof-charter.md` |
| 5 | accountabilityof | AI Incident Reporting & Audit Trails | `05-accountabilityof-charter.md` |
| 6 | ethicalgovernanceof | Ethical AI Frameworks & Value Alignment | `06-ethicalgovernanceof-charter.md` |
| 7 | transparencyof | Model Explainability & Decision Paths | `07-transparencyof-charter.md` |
| 8 | biasdetectionof | AI Fairness & Bias Detection | `08-biasdetectionof-charter.md` |
| 9 | dataprivacyof | Data Protection & GDPR Compliance | `09-dataprivacyof-charter.md` |
| 10 | asisecurity | AI Security Threats & Defensive Patterns | `10-asisecurity-charter.md` |
| 11 | agisafe | AGI Safety Research & Risk Assessment | `11-agisafe-charter.md` |
| 12 | defoneos | Defence AI Operating System | `12-defoneos-charter.md` |

### TIER 2 — TECHNICAL INFRASTRUCTURE & ORCHESTRATION (11 Charters)

| # | Hive | Domain | Charter File |
|---|---|---|---|
| 13 | councilof | BFT Governance Councils & Agent Orchestration | `13-councilof-charter.md` |
| 14 | openmoe | Mixture-of-Experts Base Model & BFT Consensus | `14-openmoe-charter.md` |
| 15 | openMCP | MCP Server Directory & Registry Listings | `15-openmcp-charter.md` |
| 16 | openpatent | SIGIL-Signed Invention Disclosures & Patent Chain | `16-openpatent-charter.md` |
| 17 | sandbox | Hive Architecture Diagnostics & Self-Testing | `17-sandbox-charter.md` |
| 18 | sovereign-town | Sovereign Town Lab & Headless Simulation | `18-sovereign-town-charter.md` |
| 19 | meok-compliance-gateway | MCP Transport Layer & x402 Payments | `19-meok-compliance-gateway-charter.md` |
| 20 | loopfactory | Automation Workflows & Cron/Webhook Triggers | `20-loopfactory-charter.md` |
| 21 | optimobile | Mobile Apps & Retention Analytics | `21-optimobile-charter.md` |
| 22 | socialmediamanager | Multi-Platform Social Scheduling & Content | `22-socialmediamanager-charter.md` |
| 23 | cobolbridge | COBOL Legacy Modernisation & Transpilation | `23-cobolbridge-charter.md` |

### TIER 3 — INDUSTRY VERTICALS & SPECIALIZED (11 Charters)

| # | Hive | Domain | Charter File |
|---|---|---|---|
| 24 | commercialvehicle | UK Commercial Fleets & Logistics | `24-commercialvehicle-charter.md` |
| 25 | diyhelp | DIY Home Improvement & How-To Guides | `25-diyhelp-charter.md` |
| 26 | fishkeeper | Freshwater/Saltwater Species & Aquatics | `26-fishkeeper-charter.md` |
| 27 | grabhire | UK Haulage & Grab-Lorry Fleet Operations | `27-grabhire-charter.md` |
| 28 | koikeeper | Koi Varieties & Water Quality Management | `28-koikeeper-charter.md` |
| 29 | landlaw | UK Property Law & Conveyancing | `29-landlaw-charter.md` |
| 30 | muckaway | UK Skip Hire & Waste Management | `30-muckaway-charter.md` |
| 31 | planthire | UK Plant Hire & Machinery Operations | `31-planthire-charter.md` |
| 32 | pokerhud | Poker Hands, GTO Solutions & ICM Analysis | `32-pokerhud-charter.md` |
| 33 | suicidestop | Crisis Hotlines & Mental Health Resources | `33-suicidestop-charter.md` |
| 34 | science | Scientific Research & Discovery | `34-science-charter.md` |

---

## CROSS-WALK MATRIX

All 34 charters cross-walk to each other through:
- **Shared governance**: CSOAI Watchdog Certification
- **Shared compliance**: 30-framework crosswalk engine
- **Shared substrate**: SOV3 sovereign MCP federation
- **Shared signing**: Ed25519 SIGIL chain
- **Shared verification**: `proofof.ai/verify/{charter_id}`

**Total cross-walk edges**: 34 × 33 = **1,122 bilateral cross-walks**

---

## VERIFICATION

Every charter can be independently verified:
```bash
# Verify charter signature
curl https://proofof.ai/verify/CSOAI-CHARTER-{hive_slug}-2026-06-30

# Check BFT ratification
curl -X POST http://localhost:3101/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_council_proposal","arguments":{"proposal_id":"{bft_proposal_id}"}}}'

# Verify SIGIL chain
curl -X POST http://localhost:3101/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"sigil_verify","arguments":{"digest":"{sigil_digest}"}}}'
```

---

## BUILD MANIFEST

| Metric | Count |
|---|---|
| Total Charters | 34 |
| Total Industries Covered | 34 |
| Free Training Tiers | 4 per charter (136 total) |
| UE5 Simulation Scenarios | 3+ per charter (102+ total) |
| Cross-Walk Edges | 1,122 |
| Ed25519 Signatures | 34 |
| BFT Council Ratifications | 34 |
| Compliance Frameworks Cross-Walked | 30 per charter (1,020 total) |

---

> *"34 charters. 34 industries. Free training. Free certification. Sovereign governance. Ed25519-signed. BFT-ratified. The barrier to entry is now zero."* 🐉
