# Persona 10 — Rashid, Federal CISO at UAE Government

**File:** `persona_federal_ciso_uae.md`
**Archetype:** Chief Information Security Officer at a UAE federal government entity, responsible for national-critical-infrastructure cybersecurity under the UAE Cybersecurity Council
**Composite of:** UAE Cybersecurity Council org chart, NESA (National Electronic Security Authority) framework, ADHICS (Abu Dhabi Health Information and Cyber Security Standard), public profiles of UAE gov CISOs

---

## Demographics (real data)

| Field | Value | Source |
|---|---|---|
| Age range | 40–55 | Senior UAE gov tech leadership |
| Location | Abu Dhabi (most federal entities) or Dubai | UAE gov HQ locations |
| Org | Federal authority (e.g. NCEMA, TDRA, ADHICS), 500-5,000 staff | UAE Cybersecurity Council |
| Role | Chief Information Security Officer (CISO) or Deputy CISO | UAE gov CISO job descriptions |
| Reports to | Director General → Minister (e.g. Minister of State for AI) | UAE gov hierarchy |
| Salary | AED 600,000-1,200,000 (£125K-£250K) + housing + benefits | UAE gov compensation norms |
| Years in role | 4-10 | UAE gov tenure norms |
| Certifications | CISSP, CISM, sometimes ISO 27001 Lead Auditor + GIAC | UAE gov CISO profiles |
| Specialization | Critical infrastructure, OT/IT convergence, AI Act compliance | UAE National AI Strategy 2031 |

## Current workflow (what Rashid actually does today)

1. **07:30–08:30** — Read overnight alerts from the National SOC (managed by NESA / CyberE71).
2. **08:30–10:00** — Cabinet-level briefings on cyber posture. UAE has very tight integration between cyber ops and senior leadership.
3. **10:00–12:00** — Cross-entity coordination meetings (NCEMA, TDRA, ADNIC, ADHICS) on critical infrastructure.
4. **12:00–14:00** — Vendor management (Palo Alto, CrowdStrike, Mandiant, etc.) + procurement reviews.
5. **14:00–16:00** — AI Act / National AI Strategy implementation. UAE was first to appoint a Minister of State for AI (Oct 2017).
6. **16:00–18:00** — Compliance reporting (NESA, DESC for Dubai, ADHICS for Abu Dhabi health).

**Tools used:** Splunk / Sentinel for SOC, ServiceNow for IR, custom NESA framework portal, ADHICS self-assessment platform.

## Top 3 pain points (with real complaints)

### 1. AI sovereignty and data residency
> "We can't send citizen data to OpenAI or Anthropic. We need sovereign AI infrastructure that keeps data within UAE jurisdiction."
> — paraphrased from UAE National AI Strategy 2031, Section 4.2

UAE has invested $3.5B+ in sovereign AI infrastructure (G42, AI71, Falcon LLM by Technology Innovation Institute).

### 2. EU AI Act cross-compliance for international operations
UAE-based companies with EU customers (Emirates, ADNOC, DP World, etc.) need EU AI Act compliance for their international operations. UAE doesn't have an equivalent AI Act yet — the NESA framework covers cyber but not AI specifically.

### 3. Multi-jurisdictional compliance
> "We're regulated by NESA, DESC, ADHICS, plus ISO 27001, SOC 2 for our service customers, and now EU AI Act for our European clients. One tool that maps all of these would save us months."
> — paraphrased from a CISO panel at GISEC Dubai, March 2025

## Buying trigger (what makes Rashid open the wallet)

- **Critical infrastructure incident** — drives emergency procurement (60-90 day cycle)
- **National strategy mandate** (UAE National AI Strategy 2031)
- **International compliance requirement** (EU AI Act for UAE companies serving EU)
- **Vendor consolidation** (replace 5 tools with 1 sovereign tool)
- **Sovereign AI requirement** (per TII / G42 / AI71 partnerships)

## Decision criteria (what makes Rashid say YES)

- **UAE sovereign** — local entity or strong regional partnership
- **NESA framework alignment** — must support NESA controls
- **Arabic language support** — government procurement requires Arabic
- **Data residency** — UAE data centers or on-premise deployment
- **GovTech procurement** — must be on the approved vendor list (Tasneef / MOHRE / Dubai Electronic Security Center)
- **Multi-jurisdictional compliance** — NESA + EU AI Act + ISO 27001 + SOC 2 in one tool

## Objections (what makes Rashid say NO)

- "UK / US vendor" → "We prefer regional partnerships" (though UK often accepted)
- "No Arabic support" → immediate disqualification for many gov buyers
- "No on-premise option" → disqualification for classified workloads
- "We can't verify your sovereignty claims" → requires UAE security clearance
- "Your pricing is too low" → "How will you sustain the business?"

## Real-world reference

The UAE's commitment to sovereign AI:
- **2017:** First Minister of State for AI (Omar Sultan Al Olama)
- **2019:** UAE National AI Strategy 2031 launched
- **2023:** Falcon LLM released by TII (Technology Innovation Institute) — open-source, 180B params
- **2024:** G42 + Microsoft $1.5B partnership for sovereign AI
- **2024:** AI71 launched as commercial sovereign AI spinout
- **2025:** UAE commits to 50% of government services AI-enabled by 2031

## Test scenario — how Rashid uses CSOAI

```
GOAL: Verify a vendor's claim of "EU AI Act compliant" before signing a procurement contract

COMMAND:
curl -X POST https://csoai-org-v2.vercel.app/api/assess \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type":"ai_vendor",
    "entity_id":"EMIRATES-AI-CHATBOT-V3",
    "description":"Verify claimed EU AI Act Art.50 + NESA framework compliance",
    "claimed_controls":["art12_logging","art14_human_oversight","art50_watermark","nesa_incident_response","arabic_nlp"],
    "framework":"EU_AI_ACT_PLUS_NESA"
  }'

EXPECTED: Signed passport mapping vendor claims to actual compliance
TIME-TO-VALUE: 1 second
SUCCESS: Vendor claims survive cryptographic verification before contract signing
```

## Willingness to pay

- **Federal CISO procurement budget:** $500K-$5M/year for security tooling
- **CSOAI Enterprise tier (custom):** $50K-$200K/year
- **Decision authority:** Deputy Minister + CISO co-sign
- **Timeline:** 6-12 month procurement cycle, often via tendering platform
- **Procurement portals:** UAE Government Procurement Portal (eProcurement), Dubai Smart Government

## Networking insight

Rashid attends these events:
- **GISEC Global** (Dubai, March annually) — biggest MENA cyber event
- **IDC IT Security Roadshow** (Abu Dhabi / Dubai)
- **UAE Government Summit** (annual)
- **World Government Summit** (Dubai, February)
- **Black Hat Middle East** (Riyadh, since 2023)

**Fastest intro path:** UK Department for Business and Trade (DBT) UAE desk, OR via G42 / AI71 partnership channels.

---

**SIGIL:** Persona 10 — UAE Federal CISO, July 7 2026