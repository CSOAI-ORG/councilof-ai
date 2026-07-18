## 7. UX Conversion Flows — Wireframe Specs

This chapter specifies improved conversion flows for four critical user journeys with ASCII flow diagrams, pixel-spec wireframes, mobile adaptations, and data-driven A/B test plans.

---

### 7.1 Homepage Conversion Flow (csoai.org)

#### 7.1.1 Current vs Improved: Framework Checker as Hero Entry Point

All four competitors use inline email capture in the hero as their primary lead gen pattern [^44^] [^45^] [^42^] [^43^]. CSOAI's framework checker provides a natural hero entry point: visitors select a governance framework, receive an instant compatibility assessment, and route to appropriate next steps.

| Current State | Improved State | Conversion Impact |
|---|---|---|
| Static research description | Interactive framework checker as hero | 3-5x engagement lift for interactive heroes [^92^] |
| No email capture | Inline email + two-CTA layout | Closes gap #2 from competitive audit |
| No social proof above fold | Stats bar + customer logos | All competitors display logos above fold [^44^] |
| Unclear next step | Branched routing to Cert, Safety Score, or Council | Increases pages per session |

#### 7.1.2 Flow Diagram: Visitor → Framework Check → Cert CTA OR Safety Score OR Council

```
                    Organic    Direct     Referral    Paid
                      |          |          |           |
                      +----------+----------+-----------+
                                 |
                                 v
+---------------------------------------------------------------+
|  HERO: "Is Your AI Framework Compliant?"                       |
|  [Select Framework ▼] [Check Compatibility →]                 |
|  [Email ____________ ] [Get Full Report →]                    |
+---------------------------------------------------------------+
            |                  |                  |
       MATCH FOUND        PARTIAL MATCH        NO MATCH
            |                  |                  |
            v                  v                  v
    +-----------+       +-----------+       +-----------+
    | "Full     |       | "Partial  |       | "Gap      |
    |  Support" |       |  Gap"     |       |  Detected"|
    | Cert CTA  |       | Safety    |       | Council   |
    |           |       | Score CTA |       | Invite    |
    +-----------+       +-----------+       +-----------+
         |                   |                   |
         v                   v                   v
    proofof.ai         safetyof.ai        councilof.ai
    certification      risk assessment    governance
    onboarding         + remediation      participation
```

#### 7.1.3 Hero Wireframe: Email Capture + Two-CTA Layout (pixel specs)

```
+------------------------------------------------------------------+
| [Announcement Bar: 48px]                                         |
| "EU AI Act deadline extended to Dec 2027 — Read Guide →"        |
+------------------------------------------------------------------+
| [Logo:120x32] Research | Programs | Cert | Resources | About  [L |
+------------------------------------------------------------------+
|                                                                  |
| +---------------------------+  +---------------------------+    |
| | H1: "Is Your AI Framework |  | [Framework Checker Widget |    |
| |      Compliant?"          |  |  440px x 360px]           |    |
| |                           |  |                           |    |
| | Subhead: "Check 20+       |  | Select: [ISO 42001    ▼] |    |
| | frameworks against 294    |  |                           |    |
| | verification servers."    |  | [Run Compatibility Check] |    |
| |                           |  | 280px x 48px button       |    |
| | [Email: _______________ ] |  |                           |    |
| | [Get Full Report →]       |  | Ed25519-signed results    |    |
| | 200px x 48px              |  | HMAC attestation included |    |
| |                           |  +---------------------------+    |
| | <small>Free. No credit    |                                   |
| | card. Ed25519 identity    |                                   |
| | created instantly.</s>    |                                   |
| | [↓ Explore Frameworks]    |                                   |
| | 160px x 40px secondary    |                                   |
| +---------------------------+                                   |
+------------------------------------------------------------------+
|  [Stats Bar: 80px]  294 Servers | 33 Agents | 5 Frameworks      |
+------------------------------------------------------------------+
|  [Logo Bar: 100px] [Logo] [Logo] [Logo] — "Trusted by teams"   |
+------------------------------------------------------------------+
```

| Element | Width | Height | Notes |
|---------|-------|--------|-------|
| Announcement bar | 100% | 48px | Closable, gradient bg |
| Navigation | 100% | 64px | 12px horizontal padding |
| Hero area | 100% | 520px | Two-column flex |
| Left column | 55% | auto | 48px left padding |
| Right column (widget) | 45% | auto | Centered |
| H1 | 480px max | auto | 42px font, 1.1 line-height |
| Subhead | 440px max | auto | 18px font |
| Email input | 280px | 48px | Inline with CTA |
| Primary CTA | 200px | 48px | Filled, brand color |
| Secondary CTA | 160px | 40px | Ghost/outline |
| Checker widget | 440px | 360px | Card with shadow |
| Stats bar | 100% | 80px | 4-column grid |
| Logo bar | 100% | 100px | Flex, space-evenly |

#### 7.1.4 Stats Bar + Customer Logo Section Spec

Stats use 36px bold numerals with 14px uppercase labels. Logos are grayscale at 60% opacity, full color on hover.

---

### 7.2 Certification Onboarding Flow (csoai.org → prooof)

#### 7.2.1 Current vs Improved: 8-Step Post-Payment Journey

The current flow terminates at payment. No post-payment experience, progress tracking, or sharing mechanism exists — a missed viral loop Credo AI exploits [^92^].

| Step | Current | Improved | Owner |
|------|---------|----------|-------|
| Payment | Form only | + instant welcome email with Ed25519 key | proofof.ai |
| Welcome | None | Branded email + progress dashboard link | Email |
| System Reg | None | Guided registration with template upload | proofof.ai |
| Assessment | None | Self-service with save/resume | proofof.ai |
| Council Review | None | BFT vote with live status | councilof.ai |
| Certification | None | Ed25519-signed certificate + public page | proofof.ai |
| Share | None | LinkedIn/Twitter sharing with verified badge | Social |
| Monitor | None | Continuous compliance dashboard | proofof.ai |

#### 7.2.2 Flow Diagram: Pay → Welcome Email → System Reg → Assessment → Cert → Share → Monitor

```
+---------+   +-------------+   +------------+   +------------+
| Payment |-->|   Welcome   |-->| System Reg |-->| Assessment |
|         |   | (Ed25519 key)|  |            |   | (save/resume|
+---------+   +-------------+   +------------+   +------------+
                                                        |
                              +-------------------------+
                              |
            +------------+   +---------------+   +---------+   +---------+
| Monitor  |<--|   Share    |<--| Certification |<--| Council |<--|  DP1:   |
| Dashboard|   |(Social+Embed|  | (Ed25519-sign |   | Review  |   | PASS →  |
|          |   | + Renewal) |   |  credential)  |   |(BFT vote)|   | REMED → |
+------------+   +---------------+   +---------+   +---------+

DP2: CONSENSUS → Cert  |  NO_CONSENSUS → Appeal (48hr)
DP3: LinkedIn | Twitter | Embed code | PDF download
```

#### 7.2.3 Progress Dashboard Wireframe

```
+------------------------------------------------------------------+
| Proof of Agency Certification                    [User] [Logout] |
+------------------------------------------------------------------+
|                                                                  |
| CERTIFICATION PROGRESS                                 5 of 8   |
| ==========================================================>>    |
|                                                                  |
| +----------------+ +----------------+ +----------------+        |
| | 1. Payment     | | 2. Welcome     | | 3. System Reg  |        |
| |    [COMPLETE]  | |    [COMPLETE]  | |    [COMPLETE]  |        |
| |    Green check | |    Green check | |    Green check |        |
| |    Jul 1, 2026 | |    Jul 1, 2026 | |    Jul 2, 2026 |        |
| +----------------+ +----------------+ +----------------+        |
|                                                                  |
| +----------------+ +----------------+ +----------------+        |
| | 4. Assessment  | | 5. Council     | | 6. Certificate |        |
| |    [IN PROG]   | |    [PENDING]   | |    [LOCKED]    |        |
| |    Blue spinner| |    Gray lock   | |    Gray lock   |        |
| |    12 of 20 Qs | |    Est. 48hrs  | |    After vote  |        |
| |    [Resume →]  | |                | |                |        |
| +----------------+ +----------------+ +----------------+        |
|                                                                  |
| +----------------+ +----------------+                            |
| | 7. Share       | | 8. Monitor     |                            |
| |    [LOCKED]    | |    [LOCKED]    |                            |
| +----------------+ +----------------+                            |
|                                                                  |
| [Sidebar: 280px]                                                 |
| Your Ed25519 Key: 0x7f8a9b...2c3d4e  [Copy] [Verify]           |
| [Chat with Support] [View Documentation]                         |
+------------------------------------------------------------------+
```

#### 7.2.4 "Share Your Certification" Social Sharing Spec

```
+------------------------------------------------------------------+
|                  YOUR CERTIFICATION IS LIVE                      |
|                                                                  |
| +-----------------------------------------------------------+   |
| | [VERIFIED BADGE: 80x80px]                                 |   |
| |                                                           |   |
| | Certified: ISO 42001 Compliant AI System                  |   |
| | Organization: {{ORG_NAME}}                                |   |
| | Certified by: CSOAI Council of AI (33-agent BFT vote)     |   |
| | Credential ID: 0x9a8b7c...1d2e3f                         |   |
| | Verified: proofof.ai/verify/{{ID}}                        |   |
| | Signature: Ed25519 HMAC-signed                            |   |
| +-----------------------------------------------------------+   |
|                                                                  |
| [Share on LinkedIn] [Tweet Credential] [Copy Link]               |
|   160px x 48px        160px x 48px      120px x 48px            |
|                                                                  |
| Embed: <iframe src="proofof.ai/embed/{{ID}}" width="320"        |
|        height="120"></iframe>  [Copy Embed Code]                 |
|                                                                  |
| [Set Up Monitoring] [Download PDF] [Certify Another]             |
+------------------------------------------------------------------+
```

---

### 7.3 Developer Onboarding Flow (docs.meok.ai)

#### 7.3.1 Current vs Improved: 5-Minute Quickstart Journey

The current experience terminates at `pip install`. Arthur.ai and Drata offer live API playgrounds [^85^] [^95^]. The improved flow reduces time-to-first-MCP-call to under five minutes.

| Step | Current | Improved | Time |
|------|---------|----------|------|
| Landing | No portal | docs.meok.ai quickstart | 0:00 |
| Quickstart | None | 3-step interactive guide | 0:30 |
| API Playground | None | Live endpoint testing | 2:00 |
| Colab | None | One-click notebook | 3:00 |
| First MCP Call | pip only | Verified call with HMAC response | 5:00 |

#### 7.3.2 Flow Diagram: Docs → Quickstart → API Playground → Colab → First MCP Call

```
+-------------+   +--------------+   +----------------+   +------------+
| docs.meok.ai|-->| Quickstart   |-->| API Playground |-->| Google     |
| Landing     |   | (3 steps)    |   | - Endpoint list|   | Colab      |
|             |   | 1. pip install |   | - Pre-filled   |   | Notebook   |
| Sidebar:    |   | 2. csoai config|  | - Execute btn  |   | - SDK pre- |
| - Quickstart|   | 3. csoai verify|  | - Response view|   |   installed|
| - API Ref   |   |              |   |                |   | - First    |
| - MCP Guide |   |              |   | [Open in Colab]|   |   call     |
+-------------+   +--------------+   +----------------+   |   ready    |
                                                           +------------+
                                                                  |
                                                                  v
                                                           +------------+
                                                           | SUCCESS:   |
                                                           | - Attestation
                                                           | - HMAC sig |
                                                           | - Verify URL
                                                           |            |
                                                           | [Explore   |
                                                           |  294 Svrs] |
                                                           | [Discord]  |
                                                           | [MCP Guide]|
                                                           +------------+
```

#### 7.3.3 Interactive API Playground Wireframe

```
+------------------------------------------------------------------+
| CSOAI Developer Platform              [Search] [GitHub] [Discord]|
+------------------------------------------------------------------+
| [Sidebar:260px]      |  POST /v1/mcp/verify                     |
|                      |                                  [Try It] |
| QUICKSTART           |  +-------------------------------------+  |
| [Get Started]        |  | Endpoint: https://api.csoai.org/... |  |
|                      |  |                                     |  |
| API REFERENCE        |  | Headers:                            |  |
| [MCP]                |  | Authorization: Bearer {{API_KEY}}   |  |
| [Council]            |  | Content-Type: application/json      |  |
| [Certification]      |  |                                     |  |
| [Network]            |  | Body: { "server_id": "mcp-safety...  |  |
|                      |  +-------------------------------------+  |
| SDKS                 |                                           |
| [Python]             |  Response: 200 OK                         |
| [TypeScript]         |  +-------------------------------------+  |
| [Go]                 |  | { "verified": true,                 |  |
|                      |  |   "attestation": "0x7a8b...",       |  |
| COMMUNITY            |  |   "hmac": "sha256=0x3d4e...",        |  |
| [Discord]            |  |   "signature_algorithm": "Ed25519"  |  |
| [GitHub]             |  | }                                   |  |
| [Forum]              |  +-------------------------------------+  |
|                      |  [Copy Request] [Copy Response] [Colab]   |
+----------------------+-------------------------------------------+
```

| Element | Width | Height | Notes |
|---------|-------|--------|-------|
| Sidebar | 260px | 100vh | Fixed, scrollable |
| Main content | calc(100%-260px) | auto | Max 900px |
| Endpoint header | 100% | 48px | Method badge + URL |
| Code block | 100% | auto | 13px monospace |
| Action buttons | auto | 36px | Bottom of response |

#### 7.3.4 SDK Download + Discord Community Spec

```
+------------------------------------------------------------------+
|  DOWNLOAD THE SDK                                                |
|  +----------------+ +----------------+ +----------------+       |
|  | Python         |  | TypeScript     |  | Go             |       |
|  | pip install    |  | npm install    |  | go get         |       |
|  | csoai-mcp      |  | @csoai/mcp-sdk |  | csoai.org/mcp  |       |
|  | [View Docs]    |  | [View Docs]    |  | [View Docs]    |       |
|  | [GitHub →]     |  | [GitHub →]     |  | [GitHub →]     |       |
|  +----------------+ +----------------+ +----------------+       |
+------------------------------------------------------------------+
|  JOIN THE COMMUNITY                                              |
|  +------------------------+ +------------------------+          |
|  | [Discord]              |  | [GitHub Stars Badge]   |          |
|  | 1,200+ developers     |  | Open Source SDKs       |          |
|  | Real-time MCP support  |  | Star us on GitHub      |          |
|  | Weekly office hours    |  | Contribute             |          |
|  | [Join Discord →]       |  | [csoai GitHub →]       |          |
|  +------------------------+ +------------------------+          |
+------------------------------------------------------------------+
```

---

### 7.4 Enterprise Sales Flow (meok.ai)

#### 7.4.1 Current vs Improved: ROI Calculator → Demo → Pilot → Close

Enterprise visitors land on generic content. Vanta and Drata guide them through ROI calculators, demo scheduling, and pilot programs [^44^] [^45^].

| Stage | Current | Improved | Target |
|-------|---------|----------|--------|
| Landing | Generic homepage | Enterprise landing + ROI calculator | 15% calculator completion |
| Qualification | None | Calculator inputs become MQL data | Lead scoring |
| Demo | None | Calendar → custom demo with SE | 30% demo-to-pilot |
| Pilot | None | 14-day pilot with CSM | 40% pilot-to-close |
| Close | Email only | Proposal + security review | 25% avg cycle |

#### 7.4.2 Flow Diagram: Enterprise Landing → Calculator → Calendar → Custom Demo → Pilot

```
+---------------+   +----------------+   +----------------+   +-------------+
| meok.ai       |-->| ROI Calculator |-->| Calendar       |-->| Custom Demo |
| /enterprise   |   | (5 questions)  |   | Scheduling     |   | (45 min SE) |
|               |   |                |   |                |   |             |
| Hero:         |   | Inputs:        |   | [Pick Date]    |   | - BFT vote  |
| "Governance   |   | - Team size    |   |                |   | - 294 svrs  |
|  at Scale"    |   | - Frameworks   |   | Pre-filled     |   | - Ed25519   |
|               |   | - Audit freq   |   | from calc      |   | - Security  |
| [Talk to      |   | - Risk expos   |   |                |   |   FAQ       |
|  Sales]       |   | Output:        |   | [Add team]     |   |             |
| [Get Demo]    |   | "$X saved/yr"  |   | [Confirm]      |   |             |
+---------------+   +----------------+   +----------------+   +-------------+
                                                                      |
            +----------------+   +----------------+   +---------------+
            |                |   |                |   |
+---------+ | 14-Day Pilot   |<--| Proposal +     |<--| [Go Live →] |
| Close   |<--| - Dedicated CSM  |   | Security Review|   +---------------+
| Contract|   | - Weekly checks  |   | - SOC 2 docs   |
| [E-sign]|   | - Metrics dash   |   | - Trust Center |
+---------+   | [Go Live →]      |   | - SLA terms    |
              +----------------+   | [Accept Prop]  |
                                   +----------------+
```

#### 7.4.3 Enterprise Landing Page Wireframe

```
+------------------------------------------------------------------+
| [Announcement Bar: 48px]                                         |
| "See how BFT governance reduces audit time 50% — Schedule Demo" |
+------------------------------------------------------------------+
| [Logo] Platform | Solutions | Developers | Resources | About    |
+------------------------------------------------------------------+
|                                                                  |
| ENTERPRISE AI GOVERNANCE                                         |
| +-------------------------+ +--------------------------------+  |
| | H1: "Govern AI at Scale | | [ROI Calculator Widget         |  |
| |      with Cryptographic | |  480px x 440px]                |  |
| |      Certainty"         | |                                |  |
| |                         | | Team: [______] people          |  |
| | Subhead: "Enterprise-   | | Frameworks: [ISO 42001 ▼]     |  |
| | grade BFT governance,   | | Audit freq: [Quarterly ▼]     |  |
| | 294-server verification | | Risk: [High ▼]                |  |
| | and Ed25519 signing."   | |                                |  |
| |                         | | [Calculate ROI →] 240px x 48px |  |
| | [Talk to Sales]         | |                                |  |
| | [Get a Demo]            | | Result: $847K savings          |  |
| |                         | | 2,400 hrs saved | 94% risk red |  |
| | "Trusted by Fortune 500 | | [Schedule Demo →]             |  |
| | governance teams"       | +--------------------------------+  |
| +-------------------------+                                     |
+------------------------------------------------------------------+
|  [Stats Bar: 80px]  294 Servers | 33 Agents | 5 Frameworks      |
+------------------------------------------------------------------+
|  CASE STUDIES                                                    |
|  +--------------+ +--------------+ +--------------+             |
|  | Global Bank  | | Healthcare   | | Gov Agency   |             |
|  | 50% audit    | | HIPAA + ISO  | | FedRAMP in   |             |
|  | reduction    | | dual cert    | | 90 days      |             |
|  | [Read →]     | | [Read →]     | | [Read →]     |             |
|  +--------------+ +--------------+ +--------------+             |
+------------------------------------------------------------------+
|  SECURITY: [SOC 2] [ISO 27001] [HIPAA] [GDPR] [Trust Center →] |
+------------------------------------------------------------------+
```

#### 7.4.4 Security/Trust Page + Case Studies Spec

```
+------------------------------------------------------------------+
|  TRUST CENTER                                                    |
|  H1: "Security is Verifiable, Not Declared"                      |
|                                                                  |
|  GOVERNANCE        CRYPTOGRAPHY       NETWORK                    |
|  +--------------+ +--------------+ +--------------+             |
|  | 33-agent BFT | | Ed25519      | | 294 servers |             |
|  | council with | | signing for  | | across 45   |             |
|  | vote history | | every cert   | | countries   |             |
|  | [View Council| | [Verify Sig] | | [View Status|             |
|  +--------------+ +--------------+ +--------------+             |
|                                                                  |
|  COMPLIANCE: [SOC 2] [ISO 27001] [HIPAA] [GDPR] [EU AI Act]    |
|                                                                  |
|  CASE STUDIES         [All] [Finance] [Healthcare] [Gov] [Tech] |
|  +----------------+ +----------------+ +----------------+       |
|  | Global Financial | | EU Healthcare  | | US Federal     |       |
|  | Challenge: 2000+ | | Challenge: Pat-| | Challenge: Cl- |       |
|  | AI models, no    | | ient data + AI | | assified data  |       |
|  | governance       | | diagnosis      | | AI threat det  |       |
|  | Result: 67% cost | | Result: Dual   | | Result: Fed-   |       |
|  | reduction        | | ISO+H certified| | RAMP ATO 90d   |       |
|  | [Read Full →]    | | [Read Full →]  | | [Read Full →]  |       |
|  +----------------+ +----------------+ +----------------+       |
+------------------------------------------------------------------+
```

The Trust Center addresses gap #6 from the competitive audit [^84^]. CSOAI differentiates with interactive Ed25519 signature validation.

---

### 7.5 Mobile Conversion Optimization

#### 7.5.1 Mobile Wireframe Adaptations: 5 Key Pages

**Homepage Mobile:**

```
+-------------------------------+
| [=] [Logo]         [Get App] |  56px
+-------------------------------+
| EU AI Act deadline Dec 2027 → |  48px
+-------------------------------+
|                               |
| Is Your AI Framework          |  H1: 28px
| Compliant?                    |
|                               |
| [Select Framework      ▼]    |  48px
|                               |
| [Check Compatibility →]      |  48px CTA
|                               |
| or enter your email:          |
| [Email ________________]     |  48px
| [Get Full Report →]          |  48px CTA
|                               |
| +-----+ +-----+ +-----+      |
| | 294 | |  33 | |  5  |      |  72px each
| |Srvrs| |Agnts| |Frmwk|      |
| +-----+ +-----+ +-----+      |
|                               |
| Trusted by: [Logo][Logo]     |  64px
+-------------------------------+
```

**Certification Dashboard Mobile:**

```
+-------------------------------+
| [←] Certification       [⋮]  |
+-------------------------------+
| Progress: 5 of 8              |
| ████████████████░░░░░░        |  8px bar
+-------------------------------+
| +---------------------------+ |
| | 1. Payment  [✓] Jul 1    | |  72px card
| +---------------------------+ |
| | 2. Welcome  [✓] Jul 1    | |
| +---------------------------+ |
| | 3. Sys Reg  [✓] Jul 2    | |
| +---------------------------+ |
| | 4. Assess   [▶] 12/20    | |  Active
| |    [Resume →]             | |
| +---------------------------+ |
| | 5. Council  [○] 48hrs    | |  Locked
| +---------------------------+ |
+-------------------------------+
```

**API Playground Mobile:**

```
+-------------------------------+
| [←] API Playground      [⚙]  |
+-------------------------------+
| [POST ▼] [/v1/mcp/verify ▼] |
| [Run] Headers  Body           |
+-------------------------------+
| Authorization: Bearer {{KEY}} |  13px mono
| Content-Type: application/json|
+-------------------------------+
| [Execute Request →]           |  Full-width
+-------------------------------+
| Response: 200 OK              |
| { "verified": true, ... }     |
+-------------------------------+
| [Copy] [Colab] [Share]        |
+-------------------------------+
```

**Enterprise Landing Mobile:**

```
+-------------------------------+
| [=] [Logo]        [Contact]  |
+-------------------------------+
| Enterprise AI Governance      |  28px
|                               |
| Govern AI at scale with       |  16px
| cryptographic certainty.      |
|                               |
| [Talk to Sales →]            |  Full-width
| [Get a Demo →]               |  Full-width
|                               |
| Quick ROI:                    |
| Team: [__] people            |
| [Calculate Savings →]        |
|                               |
| $847K est. savings            |  24px bold
| [Schedule Demo →]            |
+-------------------------------+
```

**Trust Center Mobile:**

```
+-------------------------------+
| [←] Trust Center        [🔍] |
+-------------------------------+
| Security is Verifiable        |
| +--------+ +--------+        |
| |33-Agent| |Ed25519 |        |  2-col grid
| |BFT     | |Signing |        |  100x80px
| |[View]  | |[Verify]|        |
| +--------+ +--------+        |
| +--------+ +--------+        |
| |294 Srv | |99.97%  |        |
| |[Status]| |[Check] |        |
| +--------+ +--------+        |
| Compliance:                   |
| [SOC 2][ISO 27001][HIPAA]    |  Scrollable chips
| [GDPR][EU AI Act]            |
+-------------------------------+
```

#### 7.5.2 Touch Target Sizing: 48px Minimum

Google's Material Design specifies 48dp minimum touch targets with 8dp between adjacent targets [^44^]. Apple's HIG recommends 44pt minimum; 48px is the safer cross-platform standard.

| Element | Desktop | Mobile | Spacing | Notes |
|---------|---------|--------|---------|-------|
| Primary CTA | 200x48 | 100% x 48 | 16px below | Full-width on mobile |
| Secondary CTA | 160x40 | 100% x 44 | 12px below | Minimum 44px |
| Text input | 280x48 | 100% x 48 | 12px below | 16px horiz padding |
| Dropdown | 240x48 | 100% x 48 | 12px below | Native select |
| Icon button | 36x36 | 48x48 | 8px min | Thumb-optimized |
| Card | N/A | 100% x 72 | 8px between | Entire card tappable |

---

### 7.6 A/B Test Plans

#### 7.6.1 Test 1: Hero CTA Copy Variants (6 variations)

Test six CTA variants against proven competitor patterns [^44^] [^45^].

| Variant | CTA Text | Subheadline |
|---------|----------|-------------|
| Control | "Get Started" | "Join the CSOAI governance network" |
| V2 | "Check Your Framework →" | "Verify compliance in 30 seconds" |
| V3 | "Get Certified →" | "Ed25519-signed certification trusted by teams" |
| V4 | "Join the Council →" | "Participate in 33-agent BFT governance" |
| V5 | "Verify Your AI →" | "294 servers. Cryptographic proof." |
| V6 | "Start Free →" | "No credit card. Ed25519 identity instantly." |

| Parameter | Value |
|-----------|-------|
| Primary metric | Email submission rate (submissions / pageviews) |
| Secondary metrics | Pages per session, time on page, bounce rate |
| Minimum sample | 1,000 visitors per variant (6,000 total) |
| Duration | 14 days or until significance |
| Significance | p < 0.05, 95% confidence |
| Segmentation | Desktop/mobile independent; organic/paid/referral separate |

#### 7.6.2 Test 2: Cross-Sell Banner Placement (4 positions)

| Variant | Placement | Position |
|---------|-----------|----------|
| A | Below hero | Inline, early exposure |
| B | Below stats bar | Inline, after social proof |
| C | Sticky bottom bar | Fixed, persistent |
| D | Sidebar (desktop) / Below content (mobile) | Contextual |

| Parameter | Value |
|-----------|-------|
| Primary metric | Cross-site click-through rate |
| Guardrail metric | Hero CTA conversion must not decrease >5% |
| Minimum sample | 2,000 impressions per variant (8,000 total) |
| Duration | 10 days |
| Significance | p < 0.05 |

#### 7.6.3 Test 3: Pricing Page Layout (2 variants)

Arthur.ai is the only competitor with transparent pricing ($0/$60/Custom) [^75^]. Two layouts test self-serve clarity vs. sales-contact qualification.

| Variant | Layout | Structure |
|---------|--------|-----------|
| A | Horizontal cards | 4-column: Free / Pro ($99/mo) / Enterprise (Custom) / Sovereign (Custom) |
| B | Vertical tier list | Stacked rows with expanding feature detail |

```
Variant A (Horizontal Cards):
+-----------+ +-----------+ +-----------+ +-----------+
| Researcher| |Professional| | Enterprise| | Sovereign |
|   FREE    | |  $99/mo   | |  Custom   | |  Custom   |
| [Start]   | |[Most Pop] | |[Talk to  | |[Contact  |
|           | | [Get Pro] | |  Sales]   | |  Us]     |
+-----------+ +-----------+ +-----------+ +-----------+
```

| Parameter | Value |
|-----------|-------|
| Primary metric | Combined conversion ("Get Started" + "Contact Sales") |
| Secondary metrics | Time on page, scroll depth, tier distribution |
| Minimum sample | 1,500 visitors per variant (3,000 total) |
| Duration | 14 days |
| Significance | p < 0.05 |

Horizontal cards (Variant A) are predicted to win — Vanta, Drata, and Arthur.ai all use horizontal layouts [^44^] [^45^] [^75^]. CSOAI's four tiers (vs. competitors' three) may create cognitive overload; segment analysis is critical.
