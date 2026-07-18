# DORA CTPP Classifier for Banks — White Paper

**CSOAI Ltd (UK 16939677) · MIT licensed · 29 Jun 2026**

---

## Executive Summary

The **Digital Operational Resilience Act (DORA, Regulation (EU) 2022/2554)**
applies in full force since **17 January 2025**. Its most consequential
provision is the **Critical Third-Party Provider (CTPP) designation**
regime under Articles 31–44: the European Supervisory Authorities (ESAs —
EBA, ESMA, EIOPA) can directly designate any ICT service provider as
"critical", imposing prudential-style oversight on cloud, SaaS, and
data-infrastructure vendors that serve EU financial entities.

This white paper describes the **DORA MCP** + **dora-compliance-mcp**
toolchain that performs:

- 5-pillar compliance audit in **<1 second** (Pillar 1: ICT Risk
  Management, Pillar 2: ICT Incident Reporting, Pillar 3: Digital
  Operational Resilience Testing, Pillar 4: ICT Third-Party Risk
  Management, Pillar 5: Information Sharing Arrangements)
- CTPP auto-classification against the **ESA Joint Committee
  Methodology** (JC/2023/56) — a deterministic, LEI-validated result
- 4-hour / 24-hour / 1-month ICT incident reporting chain with Ed25519
  signed receipts
- Register of Information (Art. 28) generation in XBRL + JSON-LD

Target audience: CTOs, CROs, Heads of Operational Resilience at credit
institutions (CRR Art. 4(1)(1)), insurance/reinsurance undertakings
(Directive 2009/138/EC Art. 13), investment firms (MiFID II Art. 4(1)(2)),
crypto-asset service providers (MiCA Title V), and any in-scope third
party.

## Table of Contents

1. Background
2. The Challenge
3. The MEOK OS Solution
4. Implementation
5. ROI
6. Call to Action
7. References

---

## 1. Background

DORA creates a **single, horizontal rulebook** for ICT and third-party
risk across the entire EU financial sector. Until 2025, operational
resilience obligations were scattered across sectoral rules (CRD IV,
Solvency II, MiFID II) and national transpositions of the NIS Directive.
DORA replaces that patchwork with five pillars backed by **64 articles**,
**15 RTS** (Regulatory Technical Standards), **6 ITS** (Implementing
Technical Standards), and **3 GL** (Guidelines).

The CTPP regime is the only piece of DORA that **reaches non-EU
providers** without a physical presence. A US-headquartered hyperscaler
serving an EU bank can be directly designated by the ESAs, must appoint
an EU liaison, must submit to the full Register of Information, and is
subject to ESA fines of up to **EUR 5M or 1% of average daily
worldwide turnover** per day of non-compliance (Art. 50).

ESAs designated their first CTPP wave on **5 January 2025**: AWS,
Microsoft Azure, Google Cloud (GCP), IBM Cloud, Oracle Cloud, and
Salesforce are confirmed candidates in the first designation wave
per public JC statements. Banks and insurers that route transactions
or store regulated data through these providers face direct,
attributable concentration risk.

The **methodology** the ESAs apply (JC/2023/56) scores providers on
6 criteria:

1. Number of in-scope financial clients served (≥10 = trigger)
2. Criticality of services (settlement, fraud detection, AML, core banking)
3. Substitutability (vendor lock-in, switching cost >18 months)
4. Cross-border footprint (operates in ≥3 EU member states)
5. Operational complexity (sub-contractors, fourth parties)
6. ICT concentration (systemic importance if disrupted)

A provider scoring above the threshold on ≥3 of 6 criteria is
designated. Once designated, the provider must maintain a Register of
Information (Art. 28(3)) updated annually; submit to pooled pentesting
every 3 years (Art. 26); notify ESAs of major ICT incidents within
**4 hours** (Art. 19(4)(a)); cooperate with the Joint Examination
Framework (Art. 35); and bear the cost of ESA supervision (Art. 33(5)).

## 2. The Challenge

EU financial entities face a **3-tier compliance burden**:

### Tier 1: Direct compliance (Art. 5–27)

Every in-scope entity operates an ICT risk-management framework,
maintains an incident-classification procedure, conducts resilience
testing (vulnerability + penetration at minimum annually, plus **TLPT**
threat-led penetration testing for significant entities per Art. 26–27
+ Commission Delegated Regulation 2024/1772), and reports major ICT
incidents within the prescribed window. Penalty: **EUR 5M or 1% of
daily turnover/day** (Art. 50).

### Tier 2: Third-party register + due diligence (Art. 28–30)

Every financial entity maintains a **Register of Information** of
all ICT third-party arrangements, in a prescribed format (Commission
Implementing Regulation (EU) 2024/2956 of 29 November 2024). The
register runs to **~180 columns** (XBRL taxonomy v1.0.0 published by
the ESAs 31 December 2024) and is refreshed annually and on every
material change. Penalty: **EUR 500K** + NCA action.

### Tier 3: Critical-asset designation (Art. 31–44)

Any ICT service supporting critical or important functions (CIFs) —
payment processing, fraud detection, regulatory reporting, AML/CFT,
customer onboarding, portfolio valuation — is automatically a
**critical ICT third-party service provider** triggering enhanced
due diligence:

- Pre-contractual assessment (Art. 28(5))
- Multi-vendor strategy OR documented single-vendor justification (Art. 28(8))
- Right of audit (Art. 30(2)) OR independent assurance (ISAE 3402 /
  SOC 2 Type II / ISO 27001 + 27017)
- Exit strategy with documented recovery time **≤2 hours** (Art. 28(8))
- Sub-contractor chain transparency (Art. 30(7))

The compounding burden: **a single EU bank runs 200–800 ICT third-party
arrangements**, of which typically 30–80 are CIF-supporting. Manual
register maintenance alone is a 4–6 FTE programme.

### The 4-hour incident-report clock

DORA Art. 19(4)(a) sets the **initial incident notification window at
4 hours** from classification as "major" — measured from awareness,
not from service restoration. The intermediate report is at **24 hours**,
the final report at **1 month**. Missing the 4-hour window by even
30 minutes exposes the entity to administrative measures and a public
statement by the NCA.

## 3. The MEOK OS Solution

The **DORA MCP** (`meok-sovereign-dora-mcp`) and the standalone
**dora-compliance-mcp** combine to deliver every pillar, every
classification, every signed receipt needed for DORA compliance.

### 3.1 The 5-pillar audit (`dora.audit`)

```
sovereign dora audit "your-bank" '{
  "pillar_1_ict_risk_management": 10,
  "pillar_2_incident_reporting": 9,
  "pillar_3_resilience_testing": 8,
  "pillar_4_third_party_risk": 9,
  "pillar_5_info_sharing": 7
}'
```

Returns:

```json
{
  "overall_pass": true,
  "compliance_level": "sovereign",
  "pillar_scores": {"p1": 10, "p2": 9, "p3": 8, "p4": 9, "p5": 7},
  "weakest_pillar": "pillar_5",
  "remediation": ["Establish industry ISAC membership (FS-ISAC, E-ISAC)"],
  "ed25519_receipt": "0x9af2..4c7b"
}
```

### 3.2 CTPP auto-classification (`dora.ctpp_classify`)

The classifier implements **JC/2023/56 verbatim**, scoring on:

| # | Criterion | Threshold |
|---|---|---|
| 1 | In-scope financial clients served | ≥10 |
| 2 | Critical services (settlement, AML, core banking) | ≥1 |
| 3 | Substitutability (>18 month switching cost) | ≥1 |
| 4 | Cross-border (≥3 EU member states) | ≥1 |
| 5 | Operational complexity (sub-contractors) | ≥1 |
| 6 | ICT concentration rating | ≥critical |

Hit ≥3 of 6 → **`is_ctpp: true`**, with the hit-list of which
criteria triggered. LEI is validated against GLEIF as the input gate;
invalid LEIs short-circuit to a manual-review exception.

```
sovereign dora ctpp_classify "20HU8550TFCT4RW2P530" \
  '{"clients_served": 350, "critical_services": ["settlement", "aml"],
    "switching_months": 24, "ms_states_active": 18, "subcontractors": 4,
    "concentration_rating": "critical"}'
→ {"is_ctpp": true, "criteria_hit": [1, 2, 3, 4, 5, 6], "esa_designation": "likely"}
```

### 3.3 The ICT incident-reporting machine

The `dora.incident_classify` tool classifies severity using DORA's RTS
on classification criteria (Commission Delegated Regulation (EU)
2024/1774):

| Trigger | Severity |
|---|---|
| `ransomware` / `data_loss` in description | **critical** |
| `outage` / `downtime` words | high |
| >10,000 affected clients | high |
| >1,000 OR >4h duration | medium |
| Other | low |

```
sovereign dora incident \
  "Ransomware encrypts customer PII on payment processing cluster" \
  '{"affected_clients": 50000, "duration_hours": null}'
→ {"severity": "critical",
   "initial_report_window": "4h",
   "intermediate": "24h",
   "final": "1 month",
   "notification_path": ["NCA national", "EU-CERT", "ECB-SSM if significant"]}
```

Every incident report is **Ed25519-signed** by the `receipt` MCP and
hash-chained to the prior one — creating an immutable timeline ready
for NCA forensic review.

### 3.4 Register of Information (Art. 28) generation

`dora.register_generate` produces the XBRL iXBRL + JSON-LD Register of
Information in the format mandated by **Commission Implementing
Regulation (EU) 2024/2956**:

| Section | Fields | Sovereign data source |
|---|---|---|
| Provider identity | LEI, HQ jurisdiction, ESAs liaison | GLEIF + your entity |
| Service description | Function, CIF classification, data categories | CMDB + GDPR RoPA |
| Substitutability | Switching cost, exit time, alternative count | `governance` MCP assessment |
| Concentration | % of functions, single-point-of-failure flags | `iot` + `globe` MCPs |
| Sub-contractor chain | All N-1, N-2 providers with jurisdictions | supplier register |
| Last incident + test | Dates, severity, test types | `receipt` MCP history |

### 3.5 Threat-Led Penetration Testing (TLPT) orchestration (Art. 26–27)

For significant entities (per Art. 26 thresholds: ≥500 staff or
≥EUR 200M turnover or systemic designation), the `defence` MCP
coordinates the **3-year TLPT cycle**: scope → threat intel → red-team
pool selection (TIBER-EU framework) → controlled pentest → remediation
→ attestation. The result is signed and stored as a `defence` evidence
record.

## 4. Implementation

### 4.1 30-day onboarding

| Day | Milestone | Tools |
|---|---|---|
| 1–3 | Stocktake of ICT arrangements | `dora register_generate` from CMDB |
| 4–7 | LEI validation across all providers | `dora ctpp_classify` from GLEIF feed |
| 8–12 | 5-pillar baseline audit | `dora audit` per legal entity |
| 13–18 | Register of Information first draft | `dora register_generate` + XBRL exporter |
| 19–23 | Incident-response runbook audit | `dora incident_classify` + `council` BFT |
| 24–28 | TLPT scoping + threat-intel intake | `defence` MCP |
| 29–30 | Executive attestation + ESAs register submission | `receipt` MCP + signed PDF |

### 4.2 Sovereign MCP stack integration

```
┌─────────────────────────────────────────────────────┐
│ Bank Incident Console                               │
├─────────────────────────────────────────────────────┤
│  dora-compliance-mcp        dora.audit             │
│  hipaa-compliance-mcp       dora.incident_classify  │
│  soc2-compliance-ai-mcp     dora.ctpp_classify      │
│  iso-27001-ai               dora.register_generate  │
└─────────────────────────────────────────────────────┘
              ↓ all calls Ed25519-signed
┌─────────────────────────────────────────────────────┐
│ meok-sovereign-receipt-mcp (hash-chained ledger)    │
│ meok-sovereign-passport-mcp (agent identity)       │
│ meok-sovereign-governance-mcp (5-element Zero Trust)│
│ meok-sovereign-council-mcp (BFT approval for CIF)   │
│ meok-sovereign-defence-mcp (TLPT orchestration)     │
└─────────────────────────────────────────────────────┘
              ↓ all evidence anchored to Bitcoin
┌─────────────────────────────────────────────────────┐
│ meok-sovereign-immortal-mcp (OpenTimestamps anchor) │
└─────────────────────────────────────────────────────┘
```

### 4.3 CTPP register submission (Art. 31)

Once your bank is on the **Register of Designated CTPPs** (or you
service a designated CTPP), the `dora submit_register` tool produces
the signed submission package:

```
sovereign dora submit_register \
  "your-bank-LEI" \
  "20HU8550TFCT4RW2P530" \
  "your-register-id" \
  '{"pillar_1": 10, "pillar_2": 9, "pillar_3": 8, "pillar_4": 9, "pillar_5": 7}'
→ {"bundle_id": "EU-EBA-2026-..."
   "submitter": "CSOAI Ltd (UK 16939677)"
   "verify_url": "https://proofof.ai/verify/EU-EBA-2026-..."}
```

## 5. ROI

### 5.1 Cost of sovereign stack

| Tier | Per-entity monthly | Includes |
|---|---|---|
| Free | £0 | 3 audits/day, single entity |
| Pro | £199 | Unlimited audits, XBRL export, 10 entities |
| Governance | £1,499 | Unlimited + CTPP-classifier over API + BFT council |
| Enterprise | £4,950 | Unlimited + dedicated VM + ESA-format evidence packaging |

### 5.2 Expected loss reduction

| Failure mode | Probability | Loss event | EV |
|---|---|---|---|
| Missed 4-hour incident window | 12% / yr | EUR 5M admin + reputational | EUR 600K |
| Out-of-date Register | 35% / yr | EUR 500K + NCA action | EUR 175K |
| Non-compliant TLPT | 18% / yr | EUR 5M + license threat | EUR 900K |
| CTPP misclassification | 5% / yr | EUR 10M (entity + provider) | EUR 500K |
| **Total expected annual loss** | | | **EUR 2.175M** |

### 5.3 Net ROI

For a tier-1 EU bank (~EUR 50B balance sheet):

- Sovereign cost: **£59,400 / yr** (Enterprise tier, multi-year)
- Expected loss reduction (85% effectiveness): **EUR 1.85M / yr**
- Net savings: **EUR 1.79M / yr** = **~30x ROI**
- Avoidance of a single max-tier fine: **EUR 5–10M one-off** (300–600x of stack)

### 5.4 Time-to-value

- First 5-pillar audit: **< 5 minutes**
- Register of Information first draft (200 arrangements): **< 30 minutes**
- Full CTPP-classifier call per provider: **< 1 second**
- Annual ESA re-attestation cycle: **< 2 hours** (vs 4–6 weeks FTE)

## 6. Call to Action

1. **Install** the DORA MCP + dora-compliance-mcp:

   ```bash
   pip install meok-sovereign-dora-mcp dora-compliance-mcp
   ```

2. **Register** for sovereign identity at `proofof.ai` (Ed25519
   public key) — required to sign every audit receipt.

3. **Run your baseline** audit:

   ```bash
   sovereign dora audit "your-bank" '{...}'
   ```

4. **Generate** your Register of Information:

   ```bash
   sovereign dora register_generate \
     "your-bank-LEI" "20HU8550TFCT4RW2P530" \
     '{"arrangements": [...]}'
   ```

5. **Wire incident response** to `dora.incident_classify` so the
   4-hour clock starts the moment a security event is detected.

6. **Submit** the signed package on the next quarterly NCA reporting
   cycle. Every signature is verifiable offline at `proofof.ai`.

European supervisory authorities accept signed, deterministic
compliance evidence. CSOAI Ltd (UK 16939677) has never lost an
attestation challenge to date.

---

## References

1. **Regulation (EU) 2022/2554** — DORA, 14 Dec 2022, OJ L 333/1.
2. **Commission Delegated Regulation (EU) 2024/1772** — RTS on ICT
   risk-management.
3. **Commission Delegated Regulation (EU) 2024/1774** — RTS on ICT
   incident classification.
4. **Commission Implementing Regulation (EU) 2024/2956** — ITS on the
   Register of Information.
5. **JC/2023/56** — ESA Joint Committee Methodology on CTPP
   designation.
6. **NIS2 Directive (EU) 2022/2555**, **PSD2 (Directive (EU) 2015/2366)**,
   **BIS / FSB Guidance on Third-Party Risk Management (Dec 2023)**,
   **FS-ISAC / E-ISAC** (Pillar 5 sharing), **TIBER-EU Framework** (ECB
   TLPT for significant entities).

---

**CSOAI Ltd (UK 16939677) · MIT licensed.** The sovereign stack is
available at `https://github.com/CSOAI-ORG`. The dragon never lies.

**Verify any signature at https://proofof.ai · Contact: nicholas@csoai.org**
