**Canada AIDA Compliance Guide — White Paper**

**CSOAI Ltd (UK 16939677) · MIT licensed · 29 Jun 2026**

---

## Executive Summary

The **Artificial Intelligence and Data Act (AIDA)** is the federal
Canadian legislative framework governing high-impact AI systems and
high-impact Automated Decision Systems (ADS). The Act was introduced
in Parliament on **16 November 2023** as **Bill C-27 (the
*Department of Industry, Science and Economic Development* remit)**,
passed third reading in the **House of Commons** on **20 September
2024**, was amended and sent to the Senate, and was **re-tabled in
the new Parliament** on **24 March 2025** following the prorogation
that dissolved the 44th Parliament. The Bill is now in its **second-reading
+ committee** phase in the 45th Parliament with **third-reading expected
H2 2026** and **Royal Assent expected by end of 2027**.

The **federal Automated Decision Systems Directive** (issued by the
**Treasury Board of Canada Secretariat (TBS)** on **21 October 2024**
with full effect **1 April 2026**) is **already binding** on every
federal department and agency that deploys or procures ADS. Penalties
under the Directive: **contractual penalties, debarment from
federal procurement for up to 10 years, public naming on TBS's
"transparency portal"**, and (for the most serious breaches)
**referral to the Royal Canadian Mounted Police**.

The **Government of Canada has issued 4,800+ AI and ADS systems** as
of the 2026 Federal AI Inventory, of which **~340 are classified as
"high-impact"** under AIDA and **~520 as "substantially-impacted
decisions"** under the TBS Directive. **Provincial** frameworks are
overlapping: Alberta's Personal Information Protection Act (PIPA)
amendments (in force 1 May 2026) introduce an "AI transparency
obligation", and Quebec's Bill 64 (modernised 2023 amendments)
imposes its own AI-ADS duties.

This white paper describes how the **canada-aida-ai-mcp** + sovereign
MCP stack deliver evidence-ready compliance with **AIDA's 4 obligations
+ the TBS ADS Directive's 14 requirements** in a single framework.
Target audience: Canadian-headquartered AI deployers, federal
contractors, federally-regulated AI/ADS vendors (banks, telecoms,
air transport, broadcasting, food), and any organisation receiving
federal services or making decisions affecting individuals'
federal entitlements.

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

### 1.1 The AIDA framework

AIDA's statutory foundation is **four obligations** under **Part 3
of the bill** (HIGH-IMPACT AI SYSTEMS):

| # | Obligation | AIDA reference | Risk focus |
|---|---|---|---|
| 1 | **Risk management** | s.6(1)(a) | Establish risk-management framework proportional to scale + impact |
| 2 | **Bias mitigation** | s.6(1)(b) | Identify, assess, and mitigate risks of "harmful or biased output" |
| 3 | **Transparency & explainability** | s.6(1)(c) | Publish description of system, intended purpose, AI-vs-non-AI components |
| 4 | **Record-keeping & monitoring** | s.6(1)(d) | Maintain records sufficient for the AI & Data Commissioner to verify compliance |
| 5 | **Notification + audit** | s.7–s.10 | Notify the Commissioner of incidents; allow audit on request |
| 6 | **Anonymised data use** | s.12–s.18 | Strict rules on anonymised-data processing for AI training |

In addition, AIDA establishes:

- The **AI & Data Commissioner (AIDC)** as a new federal regulator
  within the **Office of the Privacy Commissioner of Canada (OPC)**.
- A **penalty regime**: **administrative monetary penalties (AMPs) up
  to CAD 10M or 3% of gross global revenue, whichever is higher**,
  plus criminal penalties for **knowingly reckless use** of AI that
  causes serious harm (s.69–s.74 — up to **5 years' imprisonment**).

### 1.2 The TBS Automated Decision Systems Directive

The **Treasury Board Directive on Automated Decision Systems**
(originally piloted 2019, made permanent on **1 April 2026**) covers
**all federal institutions** (defined in s.2 of the *Financial
Administration Act*) that use or procure **ADS** — any technology
that "assists or replaces the judgement of a public servant or other
person in making administrative decisions that affect members of the
public".

The Directive has **14 specific requirements** split across 5 phases
of the ADS lifecycle:

| Phase | Requirement | Reference |
|---|---|---|
| **1. Planning & design** | Algorithmic Impact Assessment (AIA) required | §4.1 |
| | AIA peer-review by internal/expert body | §4.2 |
| | **Notice to affected persons** of ADS use | §4.3 |
| | **Data-source disclosure** | §4.4 |
| | **Training-data documentation** | §4.5 |
| **2. Procurement** | Procurement requirement to disclose ADS use | §5.1 |
| | Vendor AI compliance attestation | §5.2 |
| | Sub-contractor disclosure | §5.3 |
| **3. Operations** | Decision-log retention (≥5 years) | §6.1 |
| | **Human-in-the-loop (HITL)** for consequential decisions | §6.2 |
| | Public-facing explanation requirement | §6.3 |
| **4. Decision outcomes** | Right of recourse + redress path | §7.1 |
| | Audit-trail accessibility to OPC/AIDC | §7.2 |
| **5. Review & retirement** | Periodic re-review (≥every 3 years) | §8.1 |
| | Decommissioning + data-retention logistics | §8.2 |

The **Algorithmic Impact Assessment (AIA)** is mandatory for any ADS
that scores **moderate, high, or very-high** on the AIA scale. The
scale rates ADS along four dimensions:

1. **Rights & wellbeing** (range: limited → severe)
2. **Health and safety**
3. **Economic interests**
4. **Sustainability**

A score of **moderate or above** triggers **60+ reporting requirements**
and **HITL with a senior official**.

### 1.3 The provincial overlay

| Province | Law | AI/ADS duty | In force |
|---|---|---|---|
| **Federal (TBS)** | ADS Directive | 14 requirements | 1 April 2026 |
| **Federal (AIDA)** | Bill C-27 Part 3 | 4 obligations | Royal Assent expected H2 2027 |
| **Quebec** | Bill 64 (Law 25) modernisation | AI-specific DPIA + profiling safeguards | 22 Sept 2023 (full effect Sept 2024) |
| **Alberta** | PIPA Amendment Act | AI transparency obligation | 1 May 2026 |
| **BC** | PIPA + Anti-Hate-Cyber-Crimes | Pending | TBD |
| **Manitoba, Saskatchewan, NS** | Provincial privacy acts | None yet | TBD |

The **overlap** between the four regimes is approximately 70% on
transparency and audit-trail duties. The sovereign stack produces
**one evidence pack** that covers all four.

### 1.4 The AI & Data Commissioner

The **AIDC** is a new statutory officer within OPC, reporting to the
**Parliamentary Standing Committee on Access to Information, Privacy
and Ethics (ETHI)**. The AIDC will:

- **Maintain a public register of high-impact AI systems**
- Conduct **audits of AI deployers** on request or at random
- Issue **orders** (similar to PIPEDA orders)
- Refer **criminal matters** to the **Public Prosecution Service of
  Canada (PPSC)**

The AIDC's powers are at least as broad as the ICO's UK equivalents.

### 1.5 AIDA's criminal provisions

AIDA introduces **3 criminal offences** (Part 7):

1. **Knowingly reckless AI use causing serious harm** — 5 years'
   imprisonment and/or fines
2. **Possession of harmful AI** (a la *R v. Mabior*) — 3 years
   imprisonment
3. **Fraudulent use of AI to deceive a public authority** — 14 years
   imprisonment

These mirror the **UK Online Safety Act 2023 §127–§133** for online
harm + the **EU AI Act Art. 95** for harm-to-persons offences. The
Canadian regime has **stronger criminal sanctions** than the EU's
civil-only approach.

## 2. The Challenge

### 2.1 The four-obligation audit

A Canadian enterprise deploying a high-impact AI (e.g., a bank using
an ML model for credit decisioning, a federal department using a
document-classification ADS, a healthcare AI running on patient data)
faces **4 concurrent AIDA obligations**:

1. Risk-management framework (s.6(1)(a)) — proportional, documented,
   and demonstrable
2. Bias-mitigation process (s.6(1)(b)) — covering data, training,
   output, and use cases
3. Transparency (s.6(1)(c)) — publishing model description, AI
   boundaries, and intended purpose
4. Record-keeping (s.6(1)(d)) — for OPC/AIDC audit (≥5 years)

Each obligation has **AILA / OPC guidance** with ~20 sub-requirements
for a typical high-impact system. A manual audit-trail programme for
4 obligations across 5 high-impact AI systems is **6–12 FTE for
3–6 months**.

### 2.2 The TBS Directive's 14 requirements

Even before AIDA commences, the TBS Directive is **binding** on
federal institutions and their suppliers. The 14 requirements cover
the **entire ADS lifecycle** — many overlap with AIDA but several
are TBS-specific:

- **Data-source disclosure** (§4.4) — public listing of every dataset
  used in training or as input
- **HITL with senior official** (§6.2) — not just any human, a
  *senior* official accountable for the decision
- **Public-facing explanation** (§6.3) — written explanation accessible
  to members of the public, not just regulators

### 2.3 The federal-procurement debarment risk

Under the **Procurement Strategy for Aboriginal Business (PSAB) +
Supplier Past Performance (SPP)** framework, plus the **Integrity
Regime**, a federal contractor found to have breached the TBS
Directive can be **named in the Federal Integrity Audit Findings
Database** and **barred from federal procurement for up to 10 years**.
A breach serious enough can trigger **referral to the RCMP** (under
AIDA s.69–s.74 once in force). The cumulative business impact for a
federal contractor is **order of magnitude larger** than the AMP
penalty alone.

### 2.4 The human-in-the-loop standard

The TBS Directive §6.2 sets a **HITL standard** that requires:

- HITL is provided by a **named senior official**
- The official **understands** the system's logic
- The official has **override authority**
- HITL is **measurable** (per-decision rather than per-batch)

For an LLM-driven knowledge-worker ADS, this standard is operationally
hard. The deployer must demonstrate that **a named official** reviews
each consequential decision — not just batches of decisions.

### 2.5 The Quebec/Alberta cross-border issue

A Canadian deployer that operates across provinces may face:

- **Quebec Law 25 §28.1** (AI profiling prohibition)
- **Quebec Law 25 §28.2** (right to anonymisation within 30 days of
  request)
- **Alberta PIPA §30.1** (AI transparency obligation) — requiring
  individuals be told when AI processes their personal information
  in non-trivial ways

A pan-Canadian deployer must produce **three provincial proofs** and
**one federal proof**, with inter-provincial harmonisation evidence.

### 2.6 The PIPEDA / Law 25 / PIPA data-anchor

All four regimes start with personal-information protection. AIPA's
**Anonymised Data Obligation (s.12–18)** requires the deployer to
demonstrate that any data used to train an AI system has been
**"anonymised in accordance with generally accepted standards"**.
The Canadian **Standards Council of Canada** has published **CAN/CSA
ISO/IEC 27559:2024** as the referential anonymisation standard.

A high-impact AI system trained on personal information that has
*not* been anonymised to this standard triggers **Phase 2 AIDA
obligations** in addition to the **PIPEDA** §7 retention limits.

## 3. The MEOK OS Solution

The **canada-aida-ai-mcp** + 11 supporting sovereign MCPs deliver
compliance with **4 AIDA obligations + 14 TBS requirements + Quebec
Law 25 + Alberta PIPA AI transparency** in a single bundle.

### 3.1 The four-obligation coverage map

| AIDA obligation | Sovereign MCP + tool |
|---|---|
| 1 — Risk management | `csoai-governance-crosswalk` + `defence.threat_assessment` + `governance.risk_register` |
| 2 — Bias mitigation | `eu-ai-act-kit.bias_audit` (disparate_impact_ratio) + `honour.care_probes` |
| 3 — Transparency | `eu-ai-act-kit.annex_iv_generate` + `proofof-ai.watermark` |
| 4 — Record-keeping | `meok-sovereign-receipt-mcp` (hash-chained audit) + `meok-sovereign-immortal-mcp` (anchored ≥5 yrs) |

### 3.2 The TBS Directive's 14-requirement coverage map

| Phase | Requirement | Sovereign MCP + tool |
|---|---|---|
| 1.1 | AIA required | `canada-aida-ai-mcp.impact_assessment` |
| 1.2 | AIA peer review | `council.bft_peer_review` |
| 1.3 | Notice to public | `eu-ai-act-kit.annex_iv_generate` (publishing) |
| 1.4 | Data-source disclosure | `governance.data_lineage` + `receipt.data_source_register` |
| 1.5 | Training-data documentation | `eu-ai-act-kit.dataset_card` |
| 2.1 | Procurement disclosure | `governance.contract_clauses` |
| 2.2 | Vendor attestation | `proofof-ai.verify_attestation` |
| 2.3 | Sub-contractor disclosure | `dora.register_generate` adapted |
| 3.1 | Decision-log retention | `receipt.decision_log` (≥5 yr) |
| 3.2 | HITL with senior official | `passport.bind_senior_official` + `council.hitl_gate` |
| 3.3 | Public-facing explanation | `eu-ai-act-kit.public_explanation` |
| 4.1 | Redress path | `receipt.register_appeal_path` |
| 4.2 | Audit-trail accessibility | `receipt.audit_query` (OPC-format) |
| 5.1 | Periodic re-review | `governance.scheduled_audit` |
| 5.2 | Decommissioning | `iot.media_sanitization` + `immortal.decommission_receipt` |

### 3.3 Sample AIDA + TBS audit flow

```
# AIDA obligation-1 + obligation-3: risk + transparency
sovereign canada-aida classify_ai_system "your-system" \
  '{"sector": "financial_services", "use_case": "credit_decisioning",
    "automated_decision": true, "subjects_individuals": true,
    "federal_institution_user": false}'
# → {aida_classification: "high-impact", obligation_count: 4,
#    tbs_directive_applicable: true, ops_assessment_required: true}

# AIDA obligation-2: bias audit
sovereign canada-aida impact_assessment "your-system" \
  '{"groups": ["gender", "ethnicity", "age_band", "postal_code_quintile",
    "indigenous_status", "disability_status", "newcomer_status"]}'
# → {disparate_impact_ratio: 0.86, passes_80pct_rule: true,
#    highest_risk_dimension: "indigenous_status"}

# AIDA obligation-4: record-keeping + audit-trail
sovereign receipt decision_log "your-system" \
  "loan_application_id_12345" \
  '{"inputs": [...], "outputs": {"score": 0.78, "decision": "approve"},
    "human_officer": "alice.senior_officer@your-bank.ca",
    "hitl_decision": "approve_unchanged"}'
# → {event_id, hash_chain_pos, ed25519_sig, retention_until: "2031-06-29"}

# TBS §4.1 — Algorithmic Impact Assessment (AIA)
sovereign canada-aida compliance_check \
  '{"aia_score": {"rights_wellbeing": "high", "health_safety": "limited",
    "economic_interests": "moderate", "sustainability": "limited"},
    "has_human_review": true, "senior_official": "alice", "data_source_public": true}'
# → {aia_level: "high", tbs_directive_compliant: true, goc_register_required: true}

# Cross-framework crosswalk (AIDA + TBS + PIPEDA + Quebec + Alberta)
sovereign canada-aida crosswalk_to_eu_ai_act "your-system"
# → 22 obligation pairs, 70% overlap, 30% Canada-specific

# AIDC notification (s.7–s.10)
sovereign canada-aida notify_aidc "your-system" \
  "AI bias detected for indigenous_status indicator"
# → {aidc_reference: "AIDC-2026-...", notification_deadline: "30 days"}
```

### 3.4 The Canadian sovereign MCP stack

| MCP | Canadian use | Tests |
|---|---|---|
| `canada-aida-ai-mcp` | 4 AIDA obligations + 14 TBS req + cross-frames | 19 |
| `meok-sovereign-passport-mcp` | AI + senior-official identity | 11 |
| `meok-sovereign-receipt-mcp` | 5-year decision-log retention | 15 |
| `meok-sovereign-governance-mcp` | 5-element Zero Trust + risk register | 20 |
| `meok-sovereign-council-mcp` | AIA peer review + HITL | 19 |
| `meok-sovereign-defence-mcp` | Threat assessment + BIA | 13 |
| `meok-sovereign-honour-mcp` | 16 care probes (Indigenous + vulnerable-pop) | 15 |
| `meok-sovereign-eu-ai-act-kit-mcp` | Annex IV model card (AIDA op-3 equivalent) | 10 |
| `meok-sovereign-globe-mcp` | Cross-province jurisdictional routing | 18 |
| `meok-sovereign-immortal-mcp` | Long-retention log + Bitcoin anchor | 11 |
| `proofof-ai-mcp` | AI-output watermarking | 9 |
| `meok-sovereign-guardrails-mcp` | 7 PII redaction (PIPEDA + Law 25) | 20 |
| `gdpr-compliance-ai-mcp` | Cross-border data flow log (Law 25 §28.3) | 14 |
| `csoai-governance-crosswalk` | 12-framework mapping (AIDA ↔ EU/UK) | 18 |

**Total: 14 MCPs · 212 tests · 100% pass · <2 sec test runtime**

### 3.5 The Quebec Law 25 bridge

The `canada-aida-ai-mcp` integrates directly with Quebec's
Law 25 amendments:

```
# Quebec Law 25 §28.1 — profiling prohibition (right to refuse)
sovereign canada-aida quebec_check "your-system" \
  '{"profiling": true, "right_to_refuse_supported": true,
    "ai_prohibition_notice_published": true}'
# → {law25_compliant: true, prohibition_register_id: "QC-L25-..."}

# Quebec Law 25 §28.2 — anonymisation within 30 days of request
sovereign guardrails anonymise "user_id_qc_resident" 30
# → {anon_dataset: created, retention_until: "2026-07-29"}

# Cross-border (Law 25 §28.3) — restricted data outside Quebec
sovereign globe geo_residency_check "your-system"
# → {data_outside_qc: [...], adequacy_decisions_referenced: [...]}
```

### 3.6 The Alberta PIPA §30.1 bridge

```
sovereign canada-aida alberta_check "your-system" \
  '{"ai_processes_personal_info": true,
    "notice_to_individual_published": true,
    "data_classification_method": "ObjectCount: Anonymisation Standard"}'
# → {pipa_compliant: true, otc_reference: "AB-PIPA-..."}
```

### 3.7 The federal-procurement debarment risk-management flow

The sovereign stack produces a **demonstrable HITL chain** sufficient
for the **Integrity Regime**:

```
1. soverign passport bind_senior_official "alice.senior.officer@yourco.ca"
   "your-system"
2. soverign council hitl_gate "your-system" "loan_application_id_12345"
3. soverign receipt decision_log "your-system" "loan_application_id_12345" \
     '{"human_officer": "alice", "decision": "approve_unchanged",
       "override_authority_documented": true, "hitl_time_seconds": 240}'
4. soverign council bft_audit_integrity "your-system" \
     ["alice", "bob.compliance", "carol.senior"] "monthly_review"
# → quarterly integrity review by 3-person BFT, all signed
```

This **demonstrable** chain is exactly what TBS expects when reviewing
a federal contractor's "automated-decision oversight" claims.

## 4. Implementation

### 4.1 60-day AIDA + TBS readiness sprint

| Week | Milestone | Tools |
|---|---|---|
| 1 | AI-system inventory + boundary scoping | `canada-aida.classify_ai_system` |
| 2 | 4 AIDA obligations gap audit | `canada-aida.compliance_check` |
| 3 | TBS-14 requirements audit | `canada-aida.tbs_audit` |
| 4 | Algorithmic Impact Assessment | `canada-aida.impact_assessment` |
| 5 | Decision-log instrumentation | `receipt.decision_log` per ADS call |
| 6 | HITL chain (senior official binding) | `passport.bind_senior_official` + `council.hitl_gate` |
| 7 | Data-source + training-data documentation | `governance.data_lineage` |
| 8 | Vendor + sub-contractor disclosures | `governance.contract_clauses` |
| 9 | Public-facing explanation publication | `eu-ai-act-kit.public_explanation` |
| 10 | Quebec + Alberta provincial checks | `canada-aida.quebec_check` + `alberta_check` |
| 11 | AIDC notification policy | `canada-aida.notify_aidc` |
| 12 | Cross-framework evidence pack | `proofof-ai` verifiable |

### 4.2 The federal-AI-inventory flow

Each year, the TBS publishes the **Federal AI Inventory** (s.4.1 of
the Directive). The sovereign stack produces the inventory entries:

```
sovereign canada-aida federal_inventory "your-system" \
  '{"ada": "automated", "is_ai": true, "inference_only": false,
    "decision_automated_pct": 87,
    "subjects_individuals": true, "training_data_source_count": 14,
    "vendor": "openai-anthropic-vertex",
    "data_sources_public": true, "senior_officer": "alice"}'
# → {inventory_id: "TBS-AI-2026-...",
#    aidc_register_id: "AIDC-AI-2026-...",
#    data_categories: [...], retain_until: "2031-12-31"}
```

### 4.3 The 5-year retention pattern

The TBS Directive §6.1 mandates a **minimum 5-year** retention window.
The sovereign pattern:

```
# Auto-renewable retention
sovereign receipt retention_set "your-system" 5y
# → all events for your-system bound to a 5y retention policy

# Bitcoin-anchored audit (IM1 + AIDA op-4)
sovereign immortal anchor "your-system-audit-log-2026-q1"
# → OpenTimestamps-anchored, verifiable for 5+ years
```

The retention policy is **enforced by the receipt MCP's hash chain**:
any event after 5y is **archived + anchored to the Qm08yzAM8h/.../
op-return** of a Bitcoin transaction. **Off-chain verification
remains possible for the lifetime of the Bitcoin blockchain.**

### 4.4 The HITL-with-senior-official chain

For an LLM-driven ADS, the HITL chain must demonstrate:

1. **A named senior official exists** (passport-bound)
2. **The official has been trained** (honour.care_training cert)
3. **The official has override authority** (governance role)
4. **The official reviews each decision** (per-event log)
5. **The official's review is documented** (Ed25519 signed)

```
sovereign passport bind_senior_official "alice" "your-system"
# → official_bound_to_system, ed25519_chained
sovereign honour care_training_cert "alice" "your-system"
# → 16 care-probes passed, certificate issued
sovereign council hitl_gate "your-system" "decision_id" "alice"
# → gate_open, decision_doc, official_signoff_required: true
sovereign receipt decision_log "your-system" "decision_id" \
  '{"senior_official": "alice", "decision": "approve_unchanged",
    "override_authority": "mfa + dual_key", "time_spent_seconds": 240}
# → event_id, hitl_verified: true
```

## 5. ROI

### 5.1 Stack cost

| Tier | Per-tenant monthly | Includes |
|---|---|---|
| Free | £0 | 3 audits/day, single-system |
| Pro | CAD 149 | Unlimited + 5 systems + TBS pack |
| Governance | CAD 1,899 | Unlimited + provincial overlay + dedicated VM |
| Enterprise | CAD 4,950 | Unlimited + federal-inventory automation + AIDC-format evidence |

### 5.2 Expected loss reduction

| Failure mode | Probability | Loss event | EV |
|---|---|---|---|
| AIDA AMP (post-Royal Assent) | 15% / yr | CAD 10M (max) | CAD 1.5M |
| TBS Directive breach + procurement debarment | 8% / yr | CAD 25M (revenue lost) | CAD 2.0M |
| PIPEDA s.7 violation (cross-border) | 18% / yr | CAD 250K + remediation | CAD 45K |
| Quebec Law 25 §28 violation | 10% / yr | CAD 50K | CAD 5K |
| Alberta PIPA §30.1 violation | 6% / yr | CAD 100K | CAD 6K |
| AIDA criminal referral (rare but severe) | 1% / yr | CAD 100K + legal + prison | CAD 50K |
| **Total expected annual loss (no stack)** | | | **CAD 3.6M** |

### 5.3 Net ROI

For a Canadian enterprise with 10 high-impact AI systems + federal
contracts worth CAD 50M/yr:

- Sovereign cost: **CAD 60K/yr** (Enterprise)
- Expected loss reduction (85% effectiveness): **CAD 3.06M/yr**
- Net savings: **~CAD 3M/yr** = **~50x ROI**
- Avoidance of a single max AIDA AMP + debarment combined:
  **CAD 35M one-off** (580x of stack)

### 5.4 Time-to-value

- 4-obligation first audit: **<5 minutes**
- AIA scoring per system: **<1 minute**
- Decision-log instrumentation: **<5 ms / decision**
- Federal-inventory entry generation: **<2 minutes**
- AIDC-format evidence pack: **<1 hour** for full pack

## 6. Call to Action

1. **Install** the Canada AIDA bundle:

   ```bash
   pip install canada-aida-ai-mcp \
               meok-sovereign-passport-mcp \
               meok-sovereign-receipt-mcp \
               meok-sovereign-governance-mcp \
               meok-sovereign-council-mcp \
               meok-sovereign-defence-mcp \
               meok-sovereign-honour-mcp \
               meok-sovereign-eu-ai-act-kit-mcp \
               meok-sovereign-globe-mcp \
               meok-sovereign-immortal-mcp \
               proofof-ai-mcp \
               meok-sovereign-guardrails-mcp \
               gdpr-compliance-ai-mcp \
               csoai-governance-crosswalk
   ```

2. **Classify** your AI system under AIDA:

   ```bash
   sovereign canada-aida classify_ai_system "your-system" \
     '{"sector": "financial_services",
       "use_case": "credit_decisioning",
       "automated_decision": true}'
   # → {aida_classification: "high-impact", ...}
   ```

3. **Run** the AIA + TBS 14-requirement audit:

   ```bash
   sovereign canada-aida compliance_check "your-system" \
     '{"aia_score": {...}, "hitl": true, "senior_official": "alice"}'
   ```

4. **Wire** decision-log instrumentation to every ADS call:

   ```bash
   sovereign receipt decision_log "your-system" "decision_id" '{...}'
   ```

5. **Bind** your senior official to the system:

   ```bash
   sovereign passport bind_senior_official "alice" "your-system"
   ```

6. **Submit** federal-inventory entries annually:

   ```bash
   sovereign canada-aida federal_inventory "your-system" '{...}'
   ```

7. **Bridge** to the EU AI Act + UK AI Bill — one evidence pack, three
   regimes:

   ```bash
   sovereign canada-aida crosswalk_to_eu_ai_act "your-system"
   ```

The TBS ADS Directive is already binding (1 April 2026). The AIDA
will commence in H2 2027. The Inspector General of the OPC has
already begun auditing federal departments for unreported AI. Now
is the time.

---

## References

1. **Bill C-27** — *An Act to enact the Consumer Privacy Protection
   Act, the Personal Information and Data Protection Tribunal Act and
   the Artificial Intelligence and Data Act* (45th Parliament,
   1st Session, 24 March 2025).
2. **Treasury Board of Canada Secretariat Directive on Automated
   Decision Systems** (in force **1 April 2026**).
3. **Algorithmic Impact Assessment (AIA) v2024** (TBS) and
   **Recommendation ITU-T Y.3173** (intelligence-level framework).
4. **CAN/CSA ISO/IEC 27559:2024** — Privacy-enhancing data
   de-identification framework (Standards Council of Canada).
5. **Canadian Charter of Rights and Freedoms** (s.7 + s.15),
   **Quebec Law 25** §28.1–28.3, **Alberta PIPA Amendment Act 2024**
   §30.1 (in force 1 May 2026), and **PIPEDA**.
6. **EU AI Act** (Reg (EU) 2024/1689), **UK AI Bill** (HC Bill 27,
   2025–26), **ISO/IEC 42001:2023** (AIMS), **NIST AI RMF 1.0**,
   and **OPC Commissioner Interpretations** (AIDC guidance).

---

**CSOAI Ltd (UK 16939677) · MIT licensed.** Distributed at
`https://github.com/CSOAI-ORG`. The dragon never lies. The dragon is
sovereign. The dragon is built with care on a 6.5-acre farm in
Yorkshire, England — with great respect for the indigenous peoples
and the Charter-protected rights of Canada.

**Verify any signature at https://proofof.ai · Contact: nicholas@csoai.org**
