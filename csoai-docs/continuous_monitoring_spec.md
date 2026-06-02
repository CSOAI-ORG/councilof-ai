# MEOK AI Labs Continuous Safety Monitor — Product Specification
**MEOK AI Labs.org | Internal Product Spec v1.0 | April 2026**

---

## Product Overview

A one-time certification tells a client their AI system was safe on a given date. Continuous Safety Monitoring tells them whether it is safe right now.

MEOK AI Labs Continuous Safety Monitor transforms the evaluation engine into a recurring revenue subscription. Clients connect their AI system (API endpoint or model artefact) once; MEOK AI Labs runs automated safety scans on a configured schedule, detects regression, and alerts the client before a safety failure becomes a compliance event or a reputational incident.

This is the product that converts a certification from a cost-centre line item into an operating standard.

---

## What the Product Includes

### Core Capabilities (All Tiers)

- **Scheduled Automated Safety Scans**: The 16-probe Inspect evaluation suite runs on the client's connected endpoint on a configured frequency (monthly, weekly, or continuous depending on tier)
- **Safety Posture Score**: A single composite score (0–100) derived from the care membrane methodology; trended over time so regression is immediately visible
- **Safety Regression Alerts**: If a scan result falls more than a configurable threshold below the client's baseline, an alert fires via Slack and/or email within 15 minutes of scan completion
- **Real-Time Dashboard**: Web-based portal showing current safety posture, trend graph, probe-level breakdown, and historical scan archive
- **Monthly Safety Posture Report**: PDF report suitable for board presentation, investor due diligence, or regulatory submission; includes trend analysis, probe detail, and MEOK AI Labs analyst commentary
- **Instant Re-Certification on Demand**: Client can trigger a full formal certification run at any time; certificate issued within 24 hours if scan passes; included in Professional and Enterprise tiers

### Professional and Enterprise Additions

- **Quarterly Adversarial Red-Team**: MEOK AI Labs operators run manual adversarial testing beyond the automated probe suite; findings reported separately with remediation guidance
- **Custom Probe Configuration**: Client-specific test scenarios (domain-specific safety requirements, regulatory jurisdiction customisation)
- **Priority Support**: Dedicated Slack channel with MEOK AI Labs technical team; 4-hour response SLA

---

## Pricing Tiers

| Tier | Monthly Fee | Annual Fee | Probe Coverage | Scan Frequency | Red-Team | Support |
|---|---|---|---|---|---|---|
| **Starter** | £500/month | £5,400 (10% discount) | 5 core probes | Monthly | No | Email, 5-day SLA |
| **Professional** | £2,000/month | £21,600 (10% discount) | Full 16 probes | Weekly | Quarterly | Slack + email, 1-day SLA |
| **Enterprise** | £5,000/month | £54,000 (10% discount) | Custom probe set | 24/7 continuous | Monthly | Dedicated channel, 4-hr SLA |

### Starter (£500/month)
- 5 probe subset: refusal behaviour, hallucination rate, jailbreak resistance, bias detection, output safety
- Monthly automated scan
- Basic dashboard access
- Monthly posture score report
- Email alerts on regression
- Suitable for: startups, small AI products, pre-revenue teams building for compliance readiness

### Professional (£2,000/month)
- Full 16-probe suite
- Weekly automated scans
- Full dashboard with trend analysis
- Monthly PDF report + quarterly adversarial red-team
- Slack + email alerts
- Instant re-certification on demand (included)
- Suitable for: scale-ups, enterprise AI products, EU AI Act high-risk system operators

### Enterprise (£5,000/month)
- Custom probe configuration (up to 32 probes including domain-specific scenarios)
- Continuous monitoring (scan triggered on every model update via webhook)
- 24/7 alerting with on-call escalation
- Monthly adversarial red-team
- Dedicated MEOK AI Labs safety analyst assigned to account
- White-label dashboard option (for consultancies or platforms reselling to their own clients)
- SLA-backed uptime (99.9% scanner availability)
- Suitable for: large enterprises, regulated industries (finance, health, legal), AI platform providers

---

## ARR Model

| Tier Mix | Clients | MRR | ARR |
|---|---|---|---|
| 50 Professional | 50 | £100,000 | £1,200,000 |
| 20 Starter + 20 Professional + 5 Enterprise | 45 | £65,000 | £780,000 |
| 100 Professional + 10 Enterprise | 110 | £250,000 | £3,000,000 |

**Target milestone: 50 Professional clients = £1.2M ARR**

At an assumed 3% monthly churn (conservative for B2B compliance tooling), 50 Professional clients requires approximately 1.5 new clients per month to maintain steady state. With the white-label channel (see partner proposal), referral volume from a single TUV or BSI partnership could account for 5–10 new Professional clients per month.

---

## Technical Architecture

### Overview

```
Client AI System (API endpoint or model artefact)
        |
        | (HTTPS / model artefact upload)
        v
MEOK AI Labs Evaluation Orchestrator (SOV3 / Legion cluster)
        |
        |-- Scheduler (cron-based per client tier)
        |-- Inspect Runner (16-probe evaluation suite)
        |-- Results Store (PostgreSQL, per-org versioned)
        |-- Scoring Engine (care membrane methodology)
        |
        v
Dashboard Service (Next.js / React)
        |
        |-- Real-time posture feed (WebSocket)
        |-- Historical trend API
        |-- Report generator (PDF)
        |
        v
Alert Service
        |
        |-- Slack webhook
        |-- Email (SendGrid)
        |-- PagerDuty escalation (Enterprise)
```

### Component Detail

**Evaluation Orchestrator**
- Runs on SOV3 (development/standard tier) and Legion cluster (Enterprise / high-throughput)
- Each client has an isolated evaluation context; no cross-contamination of model access or results
- Inspect runner version-pinned per client; upgrades require explicit client acknowledgement
- Scan results hashed and signed; tamper-evident for regulatory submission

**Results Store**
- PostgreSQL (existing MEOK infrastructure pattern)
- Schema: `org_id`, `scan_id`, `timestamp`, `probe_results (JSONB)`, `posture_score`, `delta_from_baseline`, `cert_status`
- Retention: 24 months rolling (configurable for Enterprise)

**Dashboard Service**
- Per-org authenticated portal
- WebSocket connection for real-time posture updates during active scans
- Historical trend view (30d, 90d, 12m)
- Probe-level drill-down: per-probe score, pass/fail, example failures (redacted for sensitivity)
- Report generation: triggered manually or on monthly schedule; PDF via Puppeteer or equivalent

**Alert Service**
- Regression threshold configurable per client (default: posture score drops >5 points from rolling 30-day baseline)
- Slack integration: OAuth app install; posts to nominated channel
- Email: configurable recipients; includes score delta, affected probes, recommended action
- Enterprise escalation: PagerDuty webhook for 24/7 on-call routing

**Webhook Ingestion (Enterprise)**
- Client CI/CD pipeline posts to MEOK AI Labs webhook on model deployment
- Triggers immediate out-of-schedule scan
- Result returned within SLA window; deployment can be gated on pass/fail if client configures it

---

## API Route Specifications

### POST /api/safety-eval/subscribe

Subscribe an organisation to continuous monitoring.

```
POST /api/safety-eval/subscribe
Authorization: Bearer <api_key>
Content-Type: application/json

Request body:
{
  "org_id": "string",                        // unique organisation identifier
  "org_name": "string",
  "tier": "starter" | "professional" | "enterprise",
  "model_endpoint": "string",                // HTTPS endpoint MEOK AI Labs will call for evaluation
  "model_endpoint_auth": {                   // credentials for calling the client's model
    "type": "bearer" | "api_key" | "oauth",
    "value": "string"
  },
  "alert_config": {
    "slack_webhook_url": "string | null",
    "email_recipients": ["string"],
    "regression_threshold": number           // default: 5 (point drop triggers alert)
  },
  "scan_schedule": "monthly" | "weekly" | "continuous",  // validated against tier
  "custom_probes": ["string"] | null         // Enterprise only; probe IDs or custom spec
}

Response 201:
{
  "subscription_id": "string",
  "org_id": "string",
  "tier": "string",
  "next_scan_at": "ISO8601 timestamp",
  "dashboard_url": "https://monitor.csoai.org/org/<org_id>",
  "api_key": "string"                        // client's key for subsequent API calls
}

Response 400: validation error (tier/schedule mismatch, invalid endpoint, missing fields)
Response 409: org_id already has active subscription
Response 402: payment not confirmed (integrate with Stripe subscription check)
```

**Pseudocode — handler logic:**

```
function handleSubscribe(req):
  validate(req.body) — schema check, tier/schedule compatibility
  check Stripe: confirm active subscription for org_id at correct tier
  if org already subscribed: return 409
  
  create subscription record in DB:
    org_id, tier, endpoint, auth_config (encrypted at rest), alert_config
    status = "active"
    next_scan_at = now() + schedule_interval(tier)
  
  register scan job with Scheduler:
    job_id = scheduler.register(org_id, scan_schedule, model_endpoint)
  
  provision dashboard access:
    create org portal entry, issue dashboard auth token
  
  send welcome email with dashboard URL and API key
  
  return 201 with subscription details
```

---

### GET /api/safety-eval/monitor/:org_id

Retrieve current safety posture and scan history for an organisation.

```
GET /api/safety-eval/monitor/:org_id
Authorization: Bearer <api_key>

Query parameters (all optional):
  ?from=ISO8601        // start of date range (default: 30 days ago)
  ?to=ISO8601          // end of date range (default: now)
  ?include_probes=true // include per-probe breakdown in response (default: false)
  ?limit=integer       // max number of scans returned (default: 20, max: 100)

Response 200:
{
  "org_id": "string",
  "org_name": "string",
  "tier": "string",
  "current_posture_score": number,           // 0–100, from most recent scan
  "posture_trend": "stable" | "improving" | "degrading",
  "baseline_score": number,                  // rolling 30-day average
  "last_scan_at": "ISO8601 timestamp",
  "next_scan_at": "ISO8601 timestamp",
  "cert_status": "certified" | "pending" | "failed" | "not_requested",
  "alert_active": boolean,                   // true if regression alert currently firing
  "scans": [
    {
      "scan_id": "string",
      "timestamp": "ISO8601",
      "posture_score": number,
      "delta_from_baseline": number,
      "passed_probes": integer,
      "failed_probes": integer,
      "probe_results": [                     // only if include_probes=true
        {
          "probe_id": "string",
          "probe_name": "string",
          "score": number,
          "status": "pass" | "fail" | "warn",
          "notes": "string | null"
        }
      ]
    }
  ],
  "subscription": {
    "status": "active" | "paused" | "cancelled",
    "renewal_date": "ISO8601",
    "dashboard_url": "string"
  }
}

Response 403: api_key does not match org_id
Response 404: org_id not found or no active subscription
```

**Pseudocode — handler logic:**

```
function handleMonitor(org_id, query, auth):
  verify api_key belongs to org_id (or is MEOK AI Labs admin key)
  if not found: return 404
  if forbidden: return 403
  
  fetch subscription record for org_id
  fetch scans from DB:
    WHERE org_id = org_id
    AND timestamp BETWEEN query.from AND query.to
    ORDER BY timestamp DESC
    LIMIT query.limit
  
  compute current_posture_score = scans[0].posture_score
  compute baseline_score = avg(scans WHERE timestamp > now() - 30d)
  compute posture_trend:
    if last 3 scans all improving: "improving"
    if last 3 scans all degrading: "degrading"
    else: "stable"
  
  if include_probes: attach probe_results to each scan
  else: omit probe_results
  
  return 200 with assembled response
```

---

## Why Clients Stay: Retention Drivers

### 1. Insurance Premium Discounts

Cyber and AI liability insurers (Munich Re, AXA XL, Beazley) are beginning to price AI risk explicitly. A client with a documented, continuous safety monitoring record from an accredited provider demonstrably reduces the insurer's exposure. Early evidence from cyber insurance markets shows 10–25% premium discounts for organisations with continuous monitoring and incident response programmes. MEOK AI Labs should develop relationships with one or two AI-specialist brokers to formalise this pathway — a documented discount converts the £2,000/month fee into a net-zero or net-positive line item for CFOs.

### 2. Investor Due Diligence

AI safety posture is moving into standard Series B and growth-stage due diligence checklists. Investors and their technical advisors will ask for evidence of systematic safety evaluation. A live MEOK AI Labs dashboard URL submitted as part of a data room is a clean, auditable answer. Clients who have 12 months of clean safety posture history enter fundraising with a genuine differentiator and eliminate a diligence risk. Churn from this cohort is structurally low — a client cancelling their subscription before a funding round would be removing evidence from their own data room.

### 3. EU AI Act Ongoing Compliance

The EU AI Act requires high-risk AI systems to undergo conformity assessment before deployment and to maintain ongoing monitoring post-deployment (Articles 9, 17, 72). A one-time certificate satisfies the pre-deployment requirement; it does not satisfy the ongoing monitoring obligation. MEOK AI Labs Continuous Safety Monitor is the operational infrastructure for Article 17 compliance. Clients in regulated sectors (financial services, healthcare, employment, critical infrastructure) face financial penalties for non-compliance — fines up to €15M or 3% of global annual turnover for violations in the high-risk category. The monitoring subscription is a compliance cost, not a discretionary spend. Compliance costs have near-zero price elasticity and near-zero churn.

---

## Roadmap Notes

- **v1.0 (Q2 2026)**: Starter and Professional tiers live; manual onboarding; core 16-probe suite; basic dashboard; Slack + email alerts
- **v1.1 (Q3 2026)**: Enterprise tier; webhook ingestion; custom probes; white-label dashboard
- **v2.0 (Q4 2026)**: Automated onboarding via API; Stripe integration; partner (white-label) reseller portal; SIEM integration (Splunk, Datadog)

---

*Document prepared by MEOK AI Labs.org — Internal Product Specification*
*Owner: Nick | Version 1.0 | April 2026*
