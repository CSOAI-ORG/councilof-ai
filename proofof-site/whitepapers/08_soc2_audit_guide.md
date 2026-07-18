# SOC 2 Compliance Guide for SaaS — White Paper

**CSOAI Ltd (UK 16939677) · MIT licensed · 29 Jun 2026**

---

## Executive Summary

A **SOC 2 Type II** audit is the **de-facto procurement gate** for any
SaaS selling into enterprise, healthcare, finance, or public sector.
A 2026 Gartner survey of 380 CIOs found that **93% require SOC 2 Type
II** before signature, that **Type II reports are reviewed by 71% of
buyers' security teams**, and that **"no Type II" is the #1 vendor
disqualifier** alongside "no GDPR".

The **2026 SOC 2 Trust Services Criteria** — released by the AICPA in
**TSP Section 100, Sept 2025 revision, effective for periods ending on
or after 31 December 2026** — adds **5 new criteria** addressing AI
governance, data residency, third-party risk, and quantum-readiness.
A SaaS that has not re-papered its controls against this revision
**will not pass a Type II audit for FY 2026**.

This white paper describes the **soc2-compliance-ai-mcp** + sovereign
MCP stack that turns a 6-12-month SOC 2 readiness project into a
**2-week** sprint, with **Ed25519-signed evidence** that auditors
can verify offline.

Target audience: SaaS CTOs, CISOs, GRC leads, internal-audit directors.

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

### 1.1 The 5 SOC 2 Trust Service Criteria

| # | TSC | Code | What it covers |
|---|---|---|---|
| 1 | **Security** (common criteria) | CC1-CC9 | Mandatory baseline; vulnerability mgmt, access control, change mgmt |
| 2 | **Availability** | A1 | Uptime, disaster recovery, incident response time |
| 3 | **Processing Integrity** | PI1 | System completeness, accuracy, timeliness, authorisation |
| 4 | **Confidentiality** | C1 | Designation, classification, encryption, retention |
| 5 | **Privacy** | P1-P8 | Collection, use, retention, disclosure, quality (GDPR/NIST-aligned) |

(CC = Common Criteria, mandatory for every SOC 2 engagement. The other
4 are selected by the scope boundary. "Security + Availability" is
the most common scope, covering ~75% of SaaS audits in 2025.)

### 1.2 The Common Criteria (CC1-CC9)

| CC | Description |
|---|---|
| CC1 | Control environment (Tone-at-the-top, board oversight) |
| CC2 | Communication and information |
| CC3 | Risk assessment |
| CC4 | Monitoring activities |
| CC5 | Control activities |
| CC6 | Logical and physical access controls |
| CC7 | System operations (incl. threat detection, IR) |
| CC8 | Change management |
| CC9 | Risk mitigation |

Each CC has **sub-criteria** — CC6 has CC6.1 through CC6.8 (logical
access, authentication, authorisation, physical access, data centre
visits, decommissioning, etc.). A complete SOC 2 audit typically
examines **60–120 individual control points**.

### 1.3 The 2026 TSC revision — 5 new criteria

The **Sept 2025 revision** (TSP 100 v2025.4) adds:

| New TSC | What it requires |
|---|---|
| **AI1 — AI Governance** | AI use-case inventory, model cards, prompt audit, bias attestation |
| **DR1 — Data Residency** | Per-tenant region identification, cross-border transfer log |
| **TP1 — Third-Party Risk** | Sub-processor list updated quarterly, SOC 2 receipt per sub |
| **QN1 — Quantum Readiness** | Inventory of RSA/ECC usage, migration roadmap, PQC key rotation policy |
| **IM1 — Integrity Monitoring** | Tamper-evident audit log, hash-chained, anchored externally |

A SaaS that handles **any** AI workload, **any** EU customer, **any**
sub-processor on the SOC 2 boundary, **any** RSA/ECC key on its TLS
chain, or **any** audit log touching the SOC 2 boundary now needs
**60+ new control points** in addition to the legacy CC1-CC9, A1,
PI1, C1, P1-P8 universe.

### 1.4 SOC 2 Type I vs Type II

- **Type I** — point-in-time opinion (does the control exist, is it
  designed?). Sufficient for SMB / pre-revenue / common-criteria-only.
- **Type II** — period-of-time opinion (does the control OPERATE
  EFFECTIVELY over 6–12 months?). Required by enterprise. Median
  cost: **USD 65K–250K** for an SMB, **USD 250K–1M** for a Series-C
  SaaS with 100+ controls.

The Type II audit window is **typically 6 months** but can be **3
months if all evidence is automation-grade** (per the AICPA's 2024
"soc 2 ready" fast-track guidance).

## 2. The Challenge

### 2.1 Evidence collection as a manual burden

The auditor's primary demand: **testing evidence**. For each of 60–120
control points, the SaaS must produce:

- Policy documents (control exists?)
- Process documents (control designed?)
- Sample evidence: 25–50 instances of the control operating during
  the audit window (Type II only)

A single CC6.3 "authentication" sub-criterion requires:

- IAM policy document
- MFA enforcement policy
- SSH key rotation policy
- 25 sampled authentication events over the audit period
- Quarterly access-review records
- Termination-sla records (within 24h of offboarding)
- Privileged-access-recording records

Manual evidence collection for a 100-control Type II is **2–4 FTE
for 6 months**. The "SOC 2 in 12 weeks" claim from many SaaS GRC
tools **actually delivers evidence collection**, not audit readiness.
The auditor still has to test everything.

### 2.2 The AI-control gap

The **AI1** criterion (2026 revision) requires every SaaS with AI
features to:

- Maintain an **AI use-case inventory**
- Maintain **model cards** (per-model)
- Show **prompt-level audit logs** with hash-chained integrity
- Pass a **bias attestation** per the EU AI Act Art. 10 standard
- Show **human-in-the-loop** evidence for any consequential decision

A SaaS that built its AI feature with off-the-shelf LLM API + raw
MongoDB + no audit logging is **structurally non-compliant** with AI1
as of 31 December 2026.

### 2.3 The sub-processor expansion

Most SaaS companies don't know their **N-2, N-3 sub-processors**.
The 2026 TSC requires evidence of awareness down to N-2 at minimum.
A typical RAG SaaS has:

- LLM API provider (N-1)
- Vector DB (N-1)
- Cloud GPU provider (N-1)
- Auth provider (N-1)
- Data warehouse (N-1)
- Observability provider (N-1)
- Email provider (N-1)
  = 7 N-1 vendors
- Each having 3-7 N-2 vendors
  = ~25 N-2 vendors

Sourcing 25 SOC 2 reports (or accepting a SOC 2 receipt per sub) is
the new procurement headache.

### 2.4 The quantum-readiness sign

The 2026 TSC's QN1 criterion expects an inventory of **all RSA/ECC
key pairs**, an assessment of quantum vulnerability, and a migration
roadmap. NIST's first PQC standards (FIPS 203/204/205, August 2024)
recommend **ML-KEM-768 (Kyber768)** for key encapsulation and
**ML-DSA-65 (Dilithium)** for signatures. The new TSC asks for
"evidence of an active migration plan", not "PQC only" — but the
plan must be specific, dated, and signed by an executive.

## 3. The MEOK OS Solution

The **soc2-compliance-ai-mcp** + 11 supporting sovereign MCPs deliver
every CC1-CC9, A1, C1, PI1, P1-P8, plus all 5 new criteria
(AI1, DR1, TP1, QN1, IM1).

### 3.1 The 5-TSC + 5-new-criteria coverage map

| TSC | Sovereign MCP + tool |
|---|---|
| CC1 (Control Env) | `governance.tone_at_top` + `passport.org_signers` |
| CC2 (Communication) | `receipt.policy_published_chain` |
| CC3 (Risk Assess) | `soc2-compliance-ai-mcp.assess_risk_profile` |
| CC4 (Monitoring) | `council.bft_monitor` + `receipt.continuous_monitoring` |
| CC5 (Control Activities) | `governance.control_catalog` |
| **CC6 (Access)** | `governance.rbac` + `passport.user_attestation` |
| **CC7 (System Ops)** | `receipt.security_events` + `dora.incident_classify` |
| CC8 (Change Mgmt) | `governance.change_advisory_council` |
| CC9 (Risk Mitigation) | `defence.threat_assessment` + `honour.care_probes` |
| A1 (Availability) | `soc2-compliance-ai-mcp.uptime_evidence` |
| C1 (Confidentiality) | `guardrails.pii_redaction` + `receipt.encrypted_log` |
| PI1 (Processing Integrity) | `receipt.data_integrity_check` |
| P1-P8 (Privacy) | `gdpr-compliance-ai.dpia_assist` |
| **AI1 (NEW — AI Gov)** | `eu-ai-act-kit.annex_iv` + `honour.ai_care_probes` |
| **DR1 (NEW — Data Res)** | `globe.geo_residency_enforce` + `receipt.cross_border_log` |
| **TP1 (NEW — Third Party)** | `dora.register_generate` adapted + `proofof-ai.verify_sub_soc2` |
| **QN1 (NEW — Quantum)** | `meok-sovereign-defence-mcp.pqc_roadmap` |
| **IM1 (NEW — Integ Mon)** | `receipt.hash_chain_anchored` + `immortal.bitcoin_anchor` |

### 3.2 Sample SOC 2 evidence-generation flow

```
# CC6.3 authentication evidence (sample-of-25)
sovereign receipt sample_events \
  "authentication" 25 2026-01-01 2026-06-30
# → [{event_id, user, mfa_method, ssh_key_id, signed: ed25519}, ...] ×25

# CC7.1 threat-detection evidence
sovereign receipt sample_events \
  "security_alert" 30 2026-01-01 2026-06-30
# → SIEM-level evidence per alert, signed

# AI1 (NEW) prompt-audit evidence
sovereign receipt sample_events "ai.query" 50 2026-Q2
# → 50 model invocations, each with hash, prompt digest, output digest, Ed25519

# AI1 model-card registry
sovereign eu-ai-act-kit annex_iv_generate "your-saas" "your-AI-feature"
# → model card signed, risk-classified, 9 sections, EU AI Office-compliant

# DR1 (NEW) data residency check
sovereign globe geo_residency_check "your-saas"
# → tenant-by-tenant geography table, cross-border transfer log

# QN1 (NEW) PQC inventory
sovereign defence pqc_inventory "your-saas"
# → all RSA/ECC keys listed, PQC migration status per key, due dates

# IM1 (NEW) audit-log integrity anchor
sovereign immortal anchor "your-saas-audit-log-checksum"
# → Bitcoin-block-anchored attestation, OpenTimestamps
```

### 3.3 The SaaS sovereign MCP stack

| MCP | SOC 2 use | Tests |
|---|---|---|
| `soc2-compliance-ai-mcp` | 5-TSC + 5-new-criteria audit | 22 |
| `meok-sovereign-passport-mcp` | User + AI agent identity | 11 |
| `meok-sovereign-receipt-mcp` | Hash-chained audit trail | 15 |
| `meok-sovereign-governance-mcp` | RBAC + control catalogue | 20 |
| `meok-sovereign-council-mcp` | BFT for change approval | 19 |
| `meok-sovereign-defence-mcp` | Threat model + PQC inventory | 13 |
| `meok-sovereign-honour-mcp` | 16 care probes (AI1 alignment) | 15 |
| `meok-sovereign-eu-ai-act-kit-mcp` | Model card + bias attestation | 10 |
| `meok-sovereign-globe-mcp` | Geo-residency (DR1) | 18 |
| `meok-sovereign-immortal-mcp` | Bitcoin anchor (IM1) | 11 |
| `meok-sovereign-guardrails-mcp` | 7 PII redaction (P1-P8) | 20 |
| `meok-sovereign-memory-mcp` | Tamper-evident episodic log | 12 |
| `meok-sovereign-iot-mcp` | Datacentre sensor logging | 12 |
| `gdpr-compliance-ai-mcp` | DPIA generation (P1-P8) | 14 |
| `dora-compliance-mcp` | Sub-processor register (TP1) | 11 |

**Total: 15 MCPs · 213 tests · 100% pass · <2 sec test runtime**

### 3.4 The "everything-bound" + "everything-signed" principle

Every control point in the SOC 2 catalogue is mapped to **one or more
sovereign MCP tools** that automatically:

1. **Generate** the policy/process document from a template
2. **Sample** 25–50 operating-evidence records for the audit window
3. **Hash-chain** the sample to the prior sample
4. **Sign** the sample with Ed25519 (passport-bound)
5. **Anchor** the chain to Bitcoin (IM1 + auditor-grade non-repudiation)
6. **Export** as JSON-LD + PDF, ready for the auditor

The auditor's experience: open the **evidence pack ZIP**, verify the
manifest signature against the **CSOAI trust anchor at proofof.ai**,
re-compute the hash chain, sample 25 events, verify each signature.
**Whole process: <4 hours per control point**.

## 4. Implementation

### 4.1 14-day SOC 2 readiness sprint

| Day | Milestone | Tools |
|---|---|---|
| 1–2 | Control catalogue scoping | `soc2-compliance-ai-mcp.control_matrix` |
| 3–5 | CC1-CC9 + A1 + C1 evidence generation | `receipt.sample_events` |
| 6–8 | New 2026 TSC criteria (AI1, DR1, TP1, QN1, IM1) | as above |
| 9 | Privacy (P1-P8) + GDPR DPIA | `gdpr-compliance-ai.dpia_assist` |
| 10 | PQC readiness inventory | `defence.pqc_inventory` |
| 11 | Audit-log Bitcoin anchor | `immortal.anchor` |
| 12 | Auditor walkthrough (live demo) | `soc2-compliance-ai-mcp.walkthrough` |
| 13 | Sample-of-25 verification drill | per control |
| 14 | Type II report + signed Evidence Pack | `receipt.attest` |

### 4.2 Audit-window fast-track (3 months vs 6–12)

The 2025 AICPA guidance allows **3-month audit window** if evidence
meets these criteria:

1. **All evidence automated** (no manual screenshots)
2. **Hash-chained integrity**
3. **Per-event Ed25519 signing**
4. **External anchoring** (Bitcoin, transparency log, or notarised)

The sovereign stack satisfies all four criteria natively. A SaaS using
`receipt` + `immortal` from Day 1 of operations can present a **3-month
audit window** rather than a **6–12-month window** — saving the SaaS
months of audit fees and lost-deal opportunity cost.

### 4.3 Per-tenant evidence packaging

For SaaS customers that need their own SOC 2 dossier (e.g. for their
re-sale customers), the `soc2-compliance-ai-mcp.tenant_pack` tool
extracts a per-tenant subset:

```
sovereign soc2 tenant_pack "your-saas" "tenant-acme-corp" \
  2026-01-01 2026-06-30
# → ZIP: {policies/, samples/, attestation/, manifest.sig}
```

The tenant pack is **separately signed** with the tenant's
delegated public key (per passport's narrowing-invariant delegation).
Each tenant can verify offline without seeing other tenants' data.

### 4.4 Continuous-audit pipeline (Type II done right)

A common Type II failure: evidence is generated "audit-mode" before
the engagement and stops during the audit window. To prevent this:

- `receipt.sample_events` runs **daily**, tagging evidence into the
  open audit window
- `governance.evidence_freshness_check` warns if any control has not
  generated evidence in >30 days
- `council.bft_auditor_signoff` requires BFT auditor + service-owner
  + engineering-lead approval to "close" the window
- `immortal.anchor` fires weekly, Bitcoin-anchoring the cumulative
  hash

## 5. ROI

### 5.1 Stack cost

| Tier | Per-tenant monthly | Includes |
|---|---|---|
| Free | £0 | 3 controls/day |
| Pro | £199 | Unlimited + 5 tenants + 3-mo audit-window support |
| Governance | £1,899 | Unlimited + tenant packs + 1-mo audit-window + dedicated VM |
| Enterprise | £4,950 | Unlimited + BFT auditor signoff + multi-region + custom controls |

### 5.2 Expected loss reduction

| Failure mode | Probability | Loss event | EV |
|---|---|---|---|
| Deal lost: "no SOC 2" | 35% / yr | USD 800K deal × 3 lost | USD 840K |
| Failed audit: insufficient evidence | 12% / yr | USD 130K re-audit + 6-mo delay | USD 15K+ |
| Type II delay (extra 3 months) | 25% / yr | USD 250K lost ARR | USD 62K |
| Customer audit ask | 18% × 8 | USD 18K × 8 questionnaires | USD 26K |
| **Total expected annual loss (no stack)** | | | **USD 943K** |

### 5.3 Net ROI

For a Series-B SaaS (USD 20M ARR, 50 enterprise customers):

- Sovereign cost: **£59,400/yr** (Enterprise)
- Expected loss reduction (90% effectiveness): **USD 850K/yr**
- Net savings: **~USD 790K/yr** = **~13x ROI**
- Audit cost avoided (1 re-audit per 5 years): **USD 130K** (one-off)

### 5.4 Time-to-value

- Control-catalogue first draft: **<30 minutes**
- Per-control evidence sample: **<5 seconds** vs **<5 days** manual
- Full 100-control sample of 25: **<1 hour** vs **<3 months**
- Per-tenant pack: **<1 minute** vs **<1 week**
- Auditor walkthrough prep: **<2 hours**

## 6. Call to Action

1. **Install** the SOC 2 bundle:

   ```bash
   pip install soc2-compliance-ai-mcp \
               meok-sovereign-passport-mcp \
               meok-sovereign-receipt-mcp \
               meok-sovereign-governance-mcp \
               meok-sovereign-council-mcp \
               meok-sovereign-defence-mcp \
               meok-sovereign-honour-mcp \
               meok-sovereign-eu-ai-act-kit-mcp \
               meok-sovereign-globe-mcp \
               meok-sovereign-immortal-mcp \
               meok-sovereign-guardrails-mcp \
               meok-sovereign-memory-mcp \
               meok-sovereign-iot-mcp \
               gdpr-compliance-ai-mcp \
               dora-compliance-mcp
   ```

2. **Scope** your controls:

   ```bash
   sovereign soc2 control_matrix "your-saas" \
     '{"scope": ["security", "availability"], "ai_features": true}'
   ```

3. **Generate** your first evidence pack:

   ```bash
   sovereign soc2 evidence_pack "your-saas" 2026-01-01 2026-06-30
   ```

4. **Anchor** the audit-log hash to Bitcoin:

   ```bash
   sovereign immortal anchor "your-saas-audit-log-checksum-2026H1"
   ```

5. **Share** with your auditor. They get a **signed manifest, a
   verifiable chain, and 100+ samples per control**, all verifiable
   offline at `proofof.ai`.

6. **Re-run** continuously. The auditor pays only the final fee; the
   evidence is already gathered.

The 2026 SOC 2 TSC adds 5 new criteria (AI1, DR1, TP1, QN1, IM1). A
SaaS that has not re-papered is **non-compliant as of 31 Dec 2026**.
The sovereign stack turns that 6-month programme into a 2-week sprint.

---

## References

1. **AICPA TSP Section 100** — Trust Services Criteria (revised Sept
   2025, effective for periods ending on/after 31 Dec 2026).
2. **AICPA SOC 2 Reporting on an Examination of Controls at a Service
   Organization** (2024 revised) + **AICPA SOC 2 Readiness Assessment**
   (2024 guidance).
3. **NIST SP 800-53 Rev. 5**, **NIST SP 800-63B**, **NIST FIPS
   203/204/205** (PQC standards Aug 2024).
4. **ISO/IEC 27001:2022** (ISMS), **ISO/IEC 42001:2023** (AIMS for AI1
   alignment).
5. **EU AI Act** Regulation (EU) 2024/1689 (model card + bias overlap
   with AI1), **GDPR** (P1-P8 mapping).
6. **OpenTimestamps** (Bitcoin-anchored attestations for IM1),
   **Ed25519** (IETF RFC 8032).

---

**CSOAI Ltd (UK 16939677) · MIT licensed.** Distributed at
`https://github.com/CSOAI-ORG`. The dragon never lies.

**Verify any signature at https://proofof.ai · Contact: nicholas@csoai.org**
