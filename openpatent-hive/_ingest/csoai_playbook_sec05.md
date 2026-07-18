## 5. Cross-Sell Engine — Triggers, Bundles, CTAs

The CSOAI ecosystem has five entry points — three free (Safety Score, Framework Checker, MCP Free Tier), two paid (Certification, Council Universe) — each requiring its own cross-sell trigger. This chapter specifies the five trigger flows, bundle pricing, CTA copy, eight email templates, and the event pipeline that routes users between products.

---

### 5.1 Cross-Sell Trigger Architecture

Each trigger is defined by: event name, qualifying condition, three ordered offers, exact CTA copy, and destination URL. Presentation uses shared modal/banner components from Chapter 6. Decision logic is rules-based — no ML for v1.

#### 5.1.1 Trigger 1: Safety Score Completion → "Get Watchdog Certified" + "Explore MCPs" + "Industry Benchmark"

| Field | Spec |
|-------|------|
| **Trigger** | `safety_score.submitted` on safetyof.ai |
| **Condition** | Score rendered; user has no active certification on proooff.ai |
| **Delay** | Immediate (inline on results page) |
| **Primary** | Watchdog Certification — Basic tier for the scored system |
| **Secondary** | MCP Server Explorer — browse 294 servers by system type |
| **Tertiary** | Industry Benchmark Report — peer comparison (gated) |

**Modal Copy:**

```
+-------------------------------------------------------------+
|  [Shield]  Your Safety Score: {{SCORE}}/100 — {{RATING}}   |
|  "Your system scored above 73% of peers. Make it official." |
|  [Get Watchdog Certified — £49]    [Maybe Later]            |
+-------------------------------------------------------------+
```

**CTA Buttons:** Primary `Get Watchdog Certified — £49`; Secondary `Explore 294 MCP Servers`; Tertiary `See Industry Benchmark`; Dismiss `I'll certify later`.

**Routing:** Primary → `proooff.ai/checkout?product=basic-cert&origin=safety_score&score={{SCORE}}`. Secondary → `proooff.ai/mcp-catalog?filter={{SYSTEM_TYPE}}`.

#### 5.1.2 Trigger 2: Framework Checker → "Certify (£199)" + "Council Packs" + "Article 50 Kit"

| Field | Spec |
|-------|------|
| **Trigger** | `framework_checker.completed` on csoai.org (>= 1 gap returned) |
| **Condition** | User not certified; origin = organic or referral |
| **Delay** | 5-second delay; modal slides from bottom-right |
| **Primary** | CSOAI Certification at £199; Framework Checker results pre-fill application |
| **Secondary** | Council Governance Pack — Council Universe + certification at £1,499 |
| **Tertiary** | Article 50 Compliance Kit — transparency toolkit at £999 |

**Inline Banner:**

```
+-------------------------------------------------------------+
|  [Badge]  {{N}} gaps found. Certification pre-fills them.   |
|  [Start Certification — £199]  [View Council Pack — £1,499] |
+-------------------------------------------------------------+
```

**CTA Buttons:** Primary `Start Certification — £199`; Secondary `View Council Pack — £1,499`; Tertiary `Get Article 50 Kit — £999`; Dismiss `I'll fix gaps manually`.

**Pre-fill:** Gap count, framework type, and maturity pass via URL params to `proooff.ai/certify/apply`. Event `cross_sell.prefill_applied` fires on destination load.

#### 5.1.3 Trigger 3: MCP Free Tier Limit → "Upgrade to Pro" + "Social Proof" + "Attestation Demo"

| Field | Spec |
|-------|------|
| **Trigger** | `mcp.free_tier.limit_approaching` — >= 80 of 100 daily requests |
| **Condition** | Free-tier user; no Pro; fires once per 24h |
| **Delay** | Real-time banner on next API call after threshold |
| **Primary** | Prooof Pro — unlimited MCP + HMAC at £199/mo |
| **Secondary** | "Join 2,400+ systems using Pro MCP servers" |
| **Tertiary** | Live HMAC attestation demo |

**Banner:**

```
+-------------------------------------------------------------+
|  [Server]  You've used 80% of your free MCP quota.          |
|  Upgrade for unlimited calls + HMAC attestation.            |
|  [Upgrade to Pro — £199/mo]  [Watch Attestation Demo]       |
+-------------------------------------------------------------+
```

**Escalation:** Three dismissals across sessions → downgrade to email-only (Template 5.4.3), suppress banner 14 days. Event: `cross_sell.suppression_applied`.

#### 5.1.4 Trigger 4: Certificate Verification → "Get Your Own Cert" + "Compare Plans" + "Framework Checker"

| Field | Spec |
|-------|------|
| **Trigger** | `certificate.verified` — visitor enters valid hash on proooff.ai/verify |
| **Condition** | No active certification; external referrer |
| **Delay** | 3-second delay after result renders |
| **Primary** | Same-tier certification as verified |
| **Secondary** | Compare all certification plans |
| **Tertiary** | Free framework gap analysis |

**Post-Verification CTA:**

```
+-------------------------------------------------------------+
|  [Verified]  {{COMPANY}} certified their {{SYSTEM_TYPE}}.   |
|  Get your own certification starting at £49.                |
|  [Get Certified]  [Compare Plans]  [Check Your Framework]   |
+-------------------------------------------------------------+
```

**Dynamic Routing:** Verified cert is Enterprise tier → primary CTA routes to `proooff.ai/contact?intent=enterprise-cert`.

#### 5.1.5 Trigger 5: Council Vote Viewing → "Submit for Evaluation" + "Recent Decisions" + "Learn Governance"

| Field | Spec |
|-------|------|
| **Trigger** | `council.vote.viewed` on councilof.ai |
| **Condition** | Not a council member; >= 2 votes in session |
| **Delay** | Sidebar card on second view; modal on third |
| **Primary** | Submit system for 33-agent BFT evaluation |
| **Secondary** | Browse recent decisions archive |
| **Tertiary** | BFT Governance learning hub (free) |

**Sidebar Card:**

```
+---------------------------------------------------+
|  [Council Seal]                                   |
|  Evaluated by the council that certified          |
|  {{REFERENCE_COMPANY}}.                           |
|  [Submit for Evaluation — £199]                   |
|  [Browse Decisions]  [Learn BFT Governance]       |
+---------------------------------------------------+
```

**Personalization:** System identifies the vote's domain tag (`healthcare`, `finance`, `cv`) and references a certified system from that domain via public certification registry API.

#### 5.1.6 Event Taxonomy: Cross-Product Event Pipeline

Events emit via `navigator.sendBeacon()` to `analytics.csoai.org` and mirror to CRM webhooks.

| Event Name | Source | Destination | Action |
|-----------|--------|-------------|--------|
| `safety_score.submitted` | safetyof.ai | proooff.ai, csoai.org | Trigger 1 |
| `framework_checker.completed` | csoai.org | proooff.ai, councilof.ai | Trigger 2 |
| `mcp.free_tier.limit_approaching` | proooff.ai | proooff.ai | Trigger 3 |
| `mcp.free_tier.limit_exceeded` | proooff.ai | Email + CRM | Template 5.4.3 |
| `certificate.verified` | proooff.ai | proooff.ai, csoai.org | Trigger 4 |
| `council.vote.viewed` | councilof.ai | councilof.ai, proooff.ai | Trigger 5 at >= 2 views |
| `cross_sell.cta_shown` | Any | Analytics | A/B impression tracking |
| `cross_sell.cta_clicked` | Any | Analytics, CRM | Funnel step |
| `cross_sell.conversion` | Any | Analytics, CRM | Revenue attribution |
| `cross_sell.dismissed` | Any | Analytics | Suppression input |
| `cross_sell.suppression_applied` | Any | Analytics | 14-day cooldown start |

**Client-Side Emitter:**

```javascript
function emitCrossSellEvent(eventName, properties) {
  const payload = {
    event: eventName,
    properties: { ...properties, timestamp: new Date().toISOString(),
      session_id: getSessionId(), user_id: getUserId() || null,
      origin_site: window.location.hostname }
  };
  navigator.sendBeacon('https://analytics.csoai.org/events', JSON.stringify(payload));
  fetch('https://hooks.crm.csoai.org/cross-sell',
    { method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload), keepalive: true });
}
```

**Suppression Rules:** Three dismissals of same trigger → 14-day suppression. Post-conversion, lower-value triggers for that product are permanently suppressed.

---

### 5.2 Bundle Pricing Strategy

Bundles are ecosystem subscriptions — one invoice, one Ed25519 identity, cross-site access. Prices anchor against individual component sums.

#### 5.2.1 Starter Bundle: Safety Score + 1 MCP + Basic Cert = £99/mo

| Component | Individual | Bundle |
|-----------|-----------|--------|
| Safetyof.ai Pro (unlimited evaluations) | £29/mo | ✓ Unlimited |
| 1 MCP Server (Pro tier) | £49/mo | ✓ 1 server |
| Basic Watchdog Certification | £49 one-time | ✓ 1 certification |
| **Price** | **£127/mo equiv.** | **£99/mo (Save 22%)** |

**Target:** Individual developers, early-stage AI startups. **CTA:** `Start with Starter — £99/mo`

#### 5.2.2 Professional Bundle: Prooof Pro + CSOAI Cert + Safety Score Pro = £299/mo

| Component | Individual | Bundle |
|-----------|-----------|--------|
| Prooof Pro (unlimited MCP + HMAC) | £199/mo | ✓ Unlimited |
| CSOAI Certification (full tier) | £199 one-time | ✓ 1 certification |
| Safetyof.ai Pro (unlimited + benchmark) | £49/mo | ✓ Unlimited |
| Priority email support | — | ✓ 24h response |
| **Price** | **£298/mo + £199** | **£299/mo (Save £199 + 44%)** |

**Target:** Mid-market AI companies, teams of 3-10. **CTA:** `Go Pro — £299/mo`. Display `Most Popular` badge.

#### 5.2.3 Governance Bundle: Council Universe + CSOAI Cert + Prooof Pro = £1,699/mo

| Component | Individual | Bundle |
|-----------|-----------|--------|
| Council Universe (BFT Council access) | £1,499/mo | ✓ 33-agent voting |
| CSOAI Certification | £199 one-time | ✓ 1 certification |
| Prooof Pro | £199/mo | ✓ Unlimited |
| Dedicated governance advisor | £500/mo | ✓ 1 advisor |
| Quarterly compliance review | £300/mo | ✓ 1/quarter |
| **Price** | **£2,498/mo equiv.** | **£1,699/mo (Save 32%)** |

**Target:** Enterprise compliance, 5+ AI systems, EU AI Act conformity prep. **CTA:** `Join Council Universe — £1,699/mo`

#### 5.2.4 Enterprise Bundle: Everything + White-label + Consulting = £4,950+/mo

| Component | Individual | Bundle |
|-----------|-----------|--------|
| Governance Bundle (all above) | £1,699/mo | ✓ Full |
| White-label certification | £1,500/mo | ✓ Custom branding |
| On-site consulting (2 days/month) | £2,000/mo | ✓ 2 days |
| Custom BFT Council instance | £1,000/mo | ✓ Private 33-agent |
| SOC 2 / ISO 27001 audit prep | £1,000/mo | ✓ Full prep |
| **Price** | **£7,199/mo equiv.** | **£4,950/mo (Save 31%)** |

**Target:** Large enterprises (1000+), regulated industries. **CTA:** `Talk to Enterprise Sales` (contact form; 4h response SLA).

#### 5.2.5 Bundle Pricing Logic: Savings Calculator

React component on `/pricing` pages. Dynamically recomputes from user's current subscriptions.

```javascript
function calculateBundleSavings(activeSubs) {
  const prices = { safety_pro: 29, mcp_server: 49, basic_cert: 49,
    prooof_pro: 199, csaoi_cert: 199, safety_pro_p: 49,
    council: 1499, advisor: 500, q_review: 300,
    white_label: 1500, consulting: 2000, custom_council: 1000, audit_prep: 1000 };
  const bundles = [
    { name: 'Starter', price: 99, needs: ['safety_pro','mcp_server','basic_cert'] },
    { name: 'Pro', price: 299, needs: ['prooof_pro','csaoi_cert','safety_pro_p'] },
    { name: 'Governance', price: 1699, needs: ['council','csaoi_cert','prooof_pro','advisor','q_review'] },
    { name: 'Enterprise', price: 4950, needs: ['council','csaoi_cert','prooof_pro','advisor','q_review','white_label','consulting','custom_council','audit_prep'] }
  ];
  return bundles.reverse().map(b => {
    const sum = b.needs.reduce((s, k) => s + prices[k], 0);
    return { ...b, sum, saved: sum - b.price, savedPct: Math.round((sum-b.price)/sum*100) };
  }).filter(b => b.savedPct > 15);
}
```

**Display Rule:** If user subscribes to one bundle component, show "Upgrade to {{Bundle}} — you're already paying £{{X}}/mo, add the rest for £{{Y}}/mo".

---

### 5.3 CTA Copy Library

All cross-sell CTAs are drawn from this library. Each entry specifies source, destination, button text, and activating trigger.

#### 5.3.1 Primary CTAs by Source Site & Destination

| Source | Destination | CTA Button Text | Trigger |
|--------|-------------|-----------------|---------|
| safetyof.ai | proooff.ai | `Get Watchdog Certified — £49` | Trigger 1 |
| safetyof.ai | proooff.ai | `Upgrade to Pro — £199/mo` | Trigger 3 |
| csoai.org | proooff.ai | `Start Certification — £199` | Trigger 2 |
| csoai.org | councilof.ai | `Join Council Universe — £1,699/mo` | Trigger 2 |
| proooff.ai | councilof.ai | `Submit for Evaluation — £199` | Trigger 5 |
| proooff.ai | csoai.org | `Get Article 50 Kit — £999` | Trigger 2 |
| councilof.ai | proooff.ai | `Get Your Own Certification` | Trigger 4 |
| councilof.ai | safetyof.ai | `Run Safety Score — Free` | Trigger 5 |
| meok.ai | proooff.ai | `Start Certification — £199` | Nav default |
| meok.ai | councilof.ai | `Explore Council Universe` | Nav alternate |
| Any site | meok.ai | `Explore the Ecosystem` | Footer |
| csoai.org | proooff.ai | `Certify Before {{DATE}} — £199` | EU deadline |

#### 5.3.2 Secondary CTAs (Softer Engagement)

| Source | Destination | CTA Button Text | Context |
|--------|-------------|-----------------|---------|
| safetyof.ai | proooff.ai | `Explore 294 MCP Servers` | Trigger 1 |
| csoai.org | csoai.org | `Check Your Framework — Free` | Trigger 2; no purchase |
| proooff.ai | proooff.ai | `Watch Attestation Demo` | Video modal |
| proooff.ai | proooff.ai | `Compare Plans` | Routes to pricing |
| councilof.ai | councilof.ai | `Browse Recent Decisions` | Archive page |
| Any site | csoai.org | `Read EU AI Act Guide` | Content nurture |
| Any site | safetyof.ai | `View Safety Benchmarks` | Stats soft CTA |

#### 5.3.3 Urgency CTAs (Deadline-Driven)

| Deadline | CTA Button Text |
|----------|-----------------|
| EU AI Act: Dec 2027 | `Certify Before {{DATE}} — £199` |
| Digital Omnibus: Jan 2028 | `Get Audit-Ready — £4,950/mo` |
| ISO 42001 demand surge | `Certify Now — 47% of Slots Filled` |
| End-of-quarter promo | `Upgrade by {{MONTH}} 31 — Save 20%` |
| MCP daily limit | `Upgrade Now — Only 20 Calls Left Today` |

#### 5.3.4 Social Proof CTAs (Stats-Driven)

| Stat | CTA Button Text |
|------|-----------------|
| 294 servers | `Join 294 Verified Servers` |
| 33-agent council | `Governed by 33 AI Agents` |
| 2,400+ certified | `Join 2,400+ Certified Systems` |
| Ed25519 signing | `Verify with Ed25519 — Free` |
| 5 governance domains | `Cover All 5 Domains — £299/mo` |
| Top percentile | `You're Top {{PCT}}% — Certify It` |

---

### 5.4 Email Templates

Sent from `noreply@csoai.org`, reply-to `support@csoai.org`. Subject lines are A/B tested.

#### 5.4.1 Score Delivery Email (with Cross-Sell)

**Trigger:** `safety_score.submitted` + 15-minute delay

```
Subject: Your AI Safety Score: {{SCORE}}/100 — here's what it means
Preview: {{COMPANY}} scored {{RATING}}. See how you compare and certify it.

Hi {{FIRST_NAME}},

Your AI system "{{SYSTEM_NAME}}" has been evaluated.

+----------------------------+
|  Score: {{SCORE}}/100      |
|  Rating: {{RATING}}        |
|  Percentile: {{PCT}}%      |
+----------------------------+

This score covers 12 dimensions: robustness, bias, transparency,
and EU AI Act alignment.

MAKE IT OFFICIAL

Your score is provisional until certified. Watchdog Certification
converts it into a cryptographically signed, publicly verifiable
credential on the Prooof blockchain.

[Get Watchdog Certified — £49]

Compare to {{INDUSTRY}} peers: [See Industry Benchmark — Free]
Explore MCP servers: [Explore 294 MCP Servers]

---
Score ID: {{SCORE_ID}} | Evaluated: {{TIMESTAMP}}
```

#### 5.4.2 Certification Welcome Email (with Upsell)

**Trigger:** `certification.purchased` + immediate

```
Subject: Welcome to Prooof — your certification is now active
Preview: {{FIRST_NAME}}, your {{TIER}} certification is live. Upgrade for MCP access.

Hi {{FIRST_NAME}},

Your {{TIER}} certification for "{{SYSTEM_NAME}}" is now active.

Certificate Hash: {{CERT_HASH}}
Public URL: https://proooff.ai/verify/{{CERT_HASH}}

YOUR CERTIFICATION INCLUDES:
✓ Public verification page
✓ HMAC-signed attestation
✓ EU AI Act Article 12 compliance logging
✓ 90-day re-evaluation reminder

LEVEL UP WITH PRO

Prooof Pro adds unlimited MCP server access, HMAC attestation for
every API call, and priority re-evaluation.

[Upgrade to Pro — £199/mo] — Save £199 vs. individual certifications

---
Certificate: {{CERT_HASH}} | Issued: {{TIMESTAMP}} | Expires: {{EXPIRY}}
```

#### 5.4.3 Free Tier Usage Report (with Upgrade Prompt)

**Trigger:** `mcp.free_tier.limit_approaching` + 1-hour delay

```
Subject: You've used 80% of your free MCP quota — here's what you're missing
Preview: {{FIRST_NAME}}, upgrade to Pro for unlimited calls + HMAC attestation.

Hi {{FIRST_NAME}},

Your free MCP tier usage:

+----------------------------+
|  Calls used: {{USED}}/100   |
|  Remaining: {{REMAINING}}   |
|  Top endpoint: {{TOP_API}}  |
+----------------------------+

At your pace, you'll hit the limit in ~{{EST_HOURS}} hours.
When you do: API calls return 429, HMAC pauses, badge shows
"Quota Exceeded."

[Upgrade to Pro — £199/mo]

Still evaluating? [Watch Attestation Demo]

---
Usage resets: {{RESET_DATE}} | Pro users in your org: {{ORG_PRO_COUNT}}
```

#### 5.4.4 Council Vote Digest (with Participation CTA)

**Trigger:** `council.vote.viewed` (second vote) + 24-hour delay

```
Subject: This week in the Council of AI — {{VOTE_COUNT}} new decisions
Preview: BFT Council voted on {{TOPIC}}. Submit your system for evaluation.

Hi {{FIRST_NAME}},

You viewed Council vote #{{VOTE_ID}} on {{TOPIC}}. Since then:

{{#RECENT_VOTES}}
• Vote #{{ID}}: {{TITLE}} — {{RESULT}} ({{CONFIDENCE}}% consensus)
{{/RECENT_VOTES}}

These affect {{AFFECTED_DOMAINS}} domains and {{AFFECTED_CERTS}} systems.

HAVE YOUR SYSTEM EVALUATED

The same 33-agent BFT Council can certify your AI system. Submit
for a cryptographically signed, democratically ratified credential.

[Submit for Evaluation — £199]

[Browse All Council Decisions]  [Learn BFT Governance — Free]

---
Council status: {{COUNCIL_STATUS}} | Active agents: 33/33
```

#### 5.4.5 EU AI Act Deadline Urgent (All Channels)

**Trigger:** Calendar-based (90/60/30/14/7 days before Dec 1, 2027) OR engagement-based (gaps > 5)

```
Subject: [{{DAYS_LEFT}} days] EU AI Act high-risk deadline — certify now
Preview: {{FIRST_NAME}}, the Digital Omnibus deadline is {{DATE}}. Start today.

Hi {{FIRST_NAME}},

The EU AI Act high-risk deadline is {{DAYS_LEFT}} days away.

Framework Checker found {{GAP_COUNT}} gaps in {{FRAMEWORK}}.
Your system requires:

{{#ACTIONS}}• {{ACTION}} — {{EFFORT}}{{/ACTIONS}}

CSOAI certification satisfies Articles 12, 50, and 72 in one
workflow. Average completion: 14 days.

[Start Certification — £199]

ENTERPRISE? Organizations with 5+ systems need audit-prep.
[Talk to Enterprise Sales — £4,950/mo]

Run the free Framework Checker (4 minutes):
[Check Your Framework — Free]

---
Deadline: {{DEADLINE_DATE}} | Recommended start: {{RECOMMENDED_START}}
```

**Multi-Channel:** Fires in parallel with: announcement banner on all 5 sites, in-app modal on csoai.org and proooff.ai, social post. Event: `campaign.eu_deadline.activated`.

#### 5.4.6 Certification Abandoned — Complete Your Application

**Trigger:** `certification.started` + no `certification.purchased` within 72 hours

```
Subject: Your certification is 70% complete — finish in 5 minutes
Preview: {{FIRST_NAME}}, your {{SYSTEM_NAME}} application expires in 48 hours.

Hi {{FIRST_NAME}},

You started certifying "{{SYSTEM_NAME}}" on {{START_DATE}}. The
application is {{COMPLETION_PCT}}% complete.

LEFT TO DO:
{{#REMAINING_STEPS}}• {{STEP}}{{/REMAINING_STEPS}}

Your progress is saved. Pick up where you left off:
[Complete Certification — £199]

Questions? Reply to this email or book a 15-minute call:
[Book a Call — Free]

---
Application ID: {{APP_ID}} | Expires: {{EXPIRY_DATE}}
```

#### 5.4.7 Re-Engagement — New Features Since You Visited

**Trigger:** `user.last_seen` + 30 days inactive + has account

```
Subject: {{FIRST_NAME}}, 3 new things since you last visited CSOAI
Preview: New MCP servers, updated Safety Score, and council decisions you missed.

Hi {{FIRST_NAME}},

It's been 30 days. Here's what changed:

+----------------------------+
|  +{{NEW_MCP}} MCP servers   |
|  {{NEW_CERTS}} new certs    |
|  {{NEW_VOTES}} council votes |
|  Safety Score v2 live      |
+----------------------------+

Your account ({{EMAIL}}) has access to all free tools.

[Run a New Safety Score — Free]
[Explore New MCP Servers]
[Browse Council Decisions]

Want to talk? [Book a 15-Minute Call — Free]

---
Last active: {{LAST_SEEN}} | Free tools used: {{TOOLS_USED}}
```

#### 5.4.8 Bundle Upgrade — You're One Component Away

**Trigger:** User subscribes to any product that is a component of a higher bundle

```
Subject: {{FIRST_NAME}}, save £{{SAVINGS}}/mo by bundling your subscriptions
Preview: You're paying £{{CURRENT}}/mo individually. Bundle for £{{BUNDLE_PRICE}}/mo.

Hi {{FIRST_NAME}},

Your current CSOAI subscriptions:

{{#SUBS}}• {{PRODUCT}} — £{{PRICE}}/mo{{/SUBS}}
Total: £{{CURRENT_TOTAL}}/mo

BUNDLE UPGRADE: {{BUNDLE_NAME}}

Add {{MISSING_COMPONENTS}} and get everything for £{{BUNDLE_PRICE}}/mo.
That's £{{SAVINGS}}/mo saved — plus unified billing and priority support.

[Upgrade to {{BUNDLE_NAME}} — £{{BUNDLE_PRICE}}/mo]

Not ready? See all bundle options:
[Compare All Bundles]

---
Current spend: £{{CURRENT_TOTAL}}/mo | Bundle saves: £{{SAVINGS}}/mo
```

---

### 5.5 Measurement & Optimization

#### 5.5.1 Cross-Sell Funnel Metrics (8 KPIs)

| KPI | Definition | Target | Measurement |
|-----|-----------|--------|-------------|
| **Trigger Coverage** | % qualifying sessions firing >= 1 trigger | > 85% | `cta_shown` / qualifying events |
| **CTR by Trigger** | Clicked / shown per trigger | > 12% primary, > 6% secondary | `cta_clicked` / `cta_shown` per trigger_id |
| **Bundle Attach Rate** | % single-product purchases adding bundle within 7 days | > 25% | CRM orders, 7-day lookback |
| **Free-to-Paid Velocity** | Median days free → paid | < 14 days | Cohort: `user.created` → `checkout.completed` |
| **Cross-Sell Revenue** | Cross-sell attributed / total revenue | > 35% | CRM with trigger_id |
| **Email Conversion Rate** | % cross-sell emails → purchase within 48h | > 3.5% | `email.clicked` → `checkout.completed` |
| **Suppression Rate** | % users entering suppression per trigger | < 20% | `suppression_applied` / `cta_shown` |
| **NPS Delta** | NPS cross-sell exposed vs. control | Within 5 pts | Quarterly survey |

**Weekly Query:**

```sql
SELECT trigger_id,
  COUNT(DISTINCT CASE WHEN event='cross_sell.cta_shown' THEN session_id END) AS impressions,
  COUNT(DISTINCT CASE WHEN event='cross_sell.cta_clicked' THEN session_id END) AS clicks,
  COUNT(DISTINCT CASE WHEN event='cross_sell.conversion' THEN session_id END) AS conversions,
  SUM(CASE WHEN event='cross_sell.conversion' THEN revenue_value END) AS revenue,
  ROUND(clicks * 100.0 / NULLIF(impressions,0), 2) AS ctr_pct,
  ROUND(conversions * 100.0 / NULLIF(impressions,0), 2) AS cvr_pct
FROM cross_sell_events
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY trigger_id ORDER BY revenue DESC;
```

#### 5.5.2 A/B Test Plan: CTA Copy & Placement

| Test | Variant | Hypothesis | Metric | Sample | Duration |
|------|---------|-----------|--------|--------|----------|
| **CTA-01** | Control: `Get Watchdog Certified — £49` vs. V1: `Certify Your Score — £49` vs. V2: `Make It Official — £49` | Value-framed outperforms feature-framed | CTR Trigger 1 | 1,000/var | 2 wk |
| **CTA-02** | Control: Price shown vs. V1: Hidden vs. V2: Savings emphasized | Price-anchored reduces friction | CTR Trigger 2 | 1,500/var | 2 wk |
| **PLA-01** | Control: Bottom banner vs. V1: Slide-in vs. V2: Interstitial | Non-blocking best CTR; blocking best CVR | Conversion rate | 2,000/var | 3 wk |
| **PLA-02** | Control: CTA end only vs. V1: Above fold + end vs. V2: PS line | Double-placement max CTR | Email CTR | 3,000/var | 2 wk |
| **URG-01** | Control: No deadline vs. V1: Date vs. V2: Countdown | Countdown outperforms static | CVR EU deadline | 2,500/var | 4 wk |
| **SOC-01** | Control: None vs. V1: Stat vs. V2: Named reference | Named proof outperforms stats | CTR certification | 1,500/var | 2 wk |

**Rules:** One test per trigger at a time. Winner at 95% significance or minimum sample. Winning variants auto-promote to control.
