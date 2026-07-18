# COAI Platform - User Journeys & System Architecture

## Executive Summary

COAI serves as the **compliance infrastructure layer** between three key stakeholders in the AI safety ecosystem. This document outlines how each stakeholder interacts with the platform and how the system creates value through the SOAI-PDCA continuous improvement loop.

---

## The Three-Bridge Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REGULATORY FRAMEWORKS                              │
│                    (EU AI Act, NIST RMF, TC260, ISO 42001)                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────┐
                        │    BRIDGE 1: COAI       │
                        │  Translates regulations │
                        │  into actionable        │
                        │  compliance controls    │
                        └─────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   AI COMPANIES      │   │    REGULATORS       │   │    PUBLIC USERS     │
│   (Enterprise)      │   │    (Government)     │   │    (Consumers)      │
│                     │   │                     │   │                     │
│ • Register systems  │   │ • View compliance   │   │ • Report incidents  │
│ • Run assessments   │   │   statistics        │   │ • Check company     │
│ • Get certified     │   │ • Access incident   │   │   compliance        │
│ • PDCA improvement  │   │   database          │   │ • View Watchdog     │
│ • API integration   │   │ • Audit companies   │   │   reports           │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      ▼
                        ┌─────────────────────────┐
                        │   RLMAI KNOWLEDGE BASE  │
                        │  (33-Agent Council)     │
                        │                         │
                        │  Learns from:           │
                        │  • Council votes        │
                        │  • Incident reports     │
                        │  • PDCA outcomes        │
                        │  • Assessment results   │
                        └─────────────────────────┘
```

---

## User Journey 1: AI Company (Enterprise Customer)

### Persona
**TechCorp AI** - A company deploying a customer service chatbot that needs EU AI Act compliance.

### Journey Stages

#### Stage 1: Discovery & Signup
1. Visit COAI public landing page
2. Learn about compliance requirements for their AI system
3. Sign up for account (Free tier initially)
4. Explore dashboard and features

#### Stage 2: AI System Registration
1. Navigate to "AI Systems" page
2. Click "Add AI System"
3. Fill in system details:
   - Name: "CustomerBot Pro"
   - Type: "Chatbot / Conversational AI"
   - Description: "Customer service automation"
   - Risk Level: "Limited Risk" (auto-suggested based on type)
4. System is registered and appears in dashboard

#### Stage 3: Initial Compliance Assessment
1. Go to "Compliance" page
2. Select framework: "EU AI Act"
3. Run assessment against registered AI system
4. System evaluates against 25+ controls
5. Receive compliance score (e.g., 67% compliant)
6. View detailed breakdown of gaps

#### Stage 4: 33-Agent Council Review
1. Submit system for council review
2. 33 AI agents analyze the system:
   - Legal agents check regulatory alignment
   - Technical agents assess safety measures
   - Ethics agents evaluate fairness/bias
3. Receive council verdict with recommendations
4. View individual agent votes and reasoning

#### Stage 5: PDCA Improvement Cycle
1. Create PDCA cycle for the AI system
2. **Plan Phase**: Document improvement objectives
   - "Implement bias detection in training data"
   - "Add human oversight for edge cases"
3. **Do Phase**: Implement the changes
   - Update system configuration
   - Deploy new safety measures
4. **Check Phase**: Re-run compliance assessment
   - Score improves to 89%
   - Document what worked
5. **Act Phase**: Standardize successful changes
   - Update policies and procedures
   - Complete cycle

#### Stage 6: Certification & Ongoing Monitoring
1. Achieve passing compliance score (>80%)
2. Receive COAI certification badge
3. Embed badge on company website
4. Set up API integration for continuous monitoring
5. Receive alerts if Watchdog reports are filed

### Enterprise API Integration

```python
# Example: Enterprise SDK Usage
from coai import COAIClient

client = COAIClient(api_key="coai_xxx...")

# Register AI system
system = client.ai_systems.create(
    name="CustomerBot Pro",
    type="chatbot",
    risk_level="limited"
)

# Run compliance check
assessment = client.compliance.assess(
    system_id=system.id,
    framework="eu_ai_act"
)

# Get recommendations
if assessment.score < 80:
    recommendations = client.council.get_recommendations(system.id)
    for rec in recommendations:
        print(f"Priority {rec.priority}: {rec.action}")
```

---

## User Journey 2: Regulator / Government Agency

### Persona
**EU Digital Services Coordinator** - Needs to monitor AI compliance across their jurisdiction.

### Journey Stages

#### Stage 1: Regulator Account Setup
1. Request regulator access (verified government email)
2. COAI admin approves regulator role
3. Access regulator-specific dashboard

#### Stage 2: Industry Overview
1. View aggregated compliance statistics:
   - Total registered AI systems: 1,247
   - Average compliance score: 73%
   - High-risk systems: 89
   - Systems pending review: 34
2. Filter by industry, risk level, framework

#### Stage 3: Incident Monitoring
1. Access Watchdog incident database
2. View trends:
   - Incidents by category (bias, privacy, safety)
   - Incidents by company
   - Resolution rates
3. Export data for regulatory reports

#### Stage 4: Company Auditing
1. Search for specific company
2. View their compliance history:
   - All registered AI systems
   - Assessment scores over time
   - PDCA cycle completion rates
   - Incident history
3. Request additional documentation
4. Issue compliance notices if needed

#### Stage 5: Policy Feedback
1. Identify common compliance gaps
2. Provide feedback to framework maintainers
3. Suggest new controls based on incident patterns

---

## User Journey 3: Public User (Consumer)

### Persona
**Sarah** - A consumer who experienced bias from an AI hiring tool.

### Journey Stages

#### Stage 1: Incident Discovery
1. Sarah applies for job, rejected by AI screening
2. Suspects bias in the AI system
3. Searches "report AI bias" → finds COAI Watchdog

#### Stage 2: Report Submission
**Option A: Web Portal**
1. Visit COAI Watchdog page
2. Click "Report an Incident"
3. Fill in details:
   - AI System: "HireBot by TechRecruit Inc."
   - Category: "Discrimination/Bias"
   - Description: Detailed account
   - Evidence: Screenshots, emails
4. Submit report (public or anonymous)

**Option B: Browser Extension (SOAI)**
1. Install SOAI Chrome extension
2. While on the company's website, click extension
3. Extension auto-captures URL and context
4. Fill in incident details
5. Submit directly from browser

#### Stage 3: Report Processing
1. Report enters Watchdog queue
2. Certified Watchdog Analyst reviews:
   - Verifies evidence
   - Categorizes incident
   - Assesses severity
3. Report status updates visible to Sarah

#### Stage 4: Council Review
1. Verified reports go to 33-Agent Council
2. Council evaluates:
   - Is this a valid safety concern?
   - What framework violations occurred?
   - What remediation is needed?
3. Council issues verdict

#### Stage 5: Resolution & Transparency
1. Company is notified of verified incident
2. Company must respond within timeframe
3. Resolution actions are tracked
4. Sarah can see outcome on public report
5. Incident feeds into company's compliance score

---

## User Journey 4: Watchdog Analyst

### Persona
**Alex** - A professional who wants to become a certified AI safety analyst.

### Journey Stages

#### Stage 1: Application
1. Visit Watchdog Signup page
2. Submit Letter of Intent (LOI)
3. Provide background information
4. Wait for application review

#### Stage 2: Training
1. Application approved → Access training portal
2. Complete 5 training modules:
   - Module 1: Introduction to AI Safety
   - Module 2: EU AI Act Deep Dive
   - Module 3: NIST AI RMF Framework
   - Module 4: TC260 Requirements
   - Module 5: Incident Analysis Methods
3. Track progress on Training page

#### Stage 3: Certification Exam
1. Complete all training modules
2. Take certification exam:
   - 30 questions, 60 minutes
   - Multiple choice + scenarios
   - 70% passing threshold
3. Pass exam → Receive certificate
4. Certificate valid for 1 year

#### Stage 4: Case Assignment
1. Access Analyst Workbench
2. View assigned cases (Watchdog reports)
3. For each case:
   - Review submitted evidence
   - Check company's compliance history
   - View council agent votes
   - Make decision: Verify/Reject/Escalate
4. Submit decision with reasoning

#### Stage 5: Performance Tracking
1. View personal statistics:
   - Cases reviewed
   - Accuracy rate
   - Average review time
2. Earn reputation points
3. Appear on analyst leaderboard
4. Maintain certification through continued work

---

## The SOAI-PDCA Loop (Continuous Safety Improvement)

The platform implements a continuous improvement cycle that connects all stakeholders:

```
                    ┌──────────────────────────────────────┐
                    │           SOAI (Watchdog)            │
                    │    Public reports AI incidents       │
                    └──────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              PDCA CYCLE                                       │
│                                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │    PLAN     │───▶│     DO      │───▶│    CHECK    │───▶│     ACT     │   │
│  │             │    │             │    │             │    │             │   │
│  │ Analyze     │    │ Implement   │    │ Verify      │    │ Standardize │   │
│  │ incidents   │    │ safety      │    │ improvements│    │ successful  │   │
│  │ & gaps      │    │ measures    │    │ via         │    │ changes     │   │
│  │             │    │             │    │ assessment  │    │             │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│         ▲                                                        │          │
│         └────────────────────────────────────────────────────────┘          │
│                           Continuous Loop                                    │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────────────┐
                    │         RLMAI Knowledge Base         │
                    │   Learns from every cycle iteration  │
                    └──────────────────────────────────────┘
```

### How RLMAI Learns

1. **From Council Votes**: Each 33-agent vote creates training data
   - Which scenarios are high-risk?
   - What remediation works?
   - How do different frameworks apply?

2. **From Watchdog Reports**: Real-world incidents inform the system
   - Common failure patterns
   - Industry-specific risks
   - Emerging threat categories

3. **From PDCA Outcomes**: Improvement cycles show what works
   - Effective safety measures
   - Time to remediation
   - Success rates by approach

4. **From Assessments**: Compliance data reveals gaps
   - Common control failures
   - Framework interpretation issues
   - Industry benchmarks

---

## Integration Points

### For AI Companies

| Integration | Method | Use Case |
|-------------|--------|----------|
| REST API | API Key | Automated compliance checks |
| SDK (Python) | Package | Native integration |
| SDK (JavaScript) | NPM | Web application integration |
| Webhooks | HTTP POST | Real-time incident alerts |
| Embeddable Badge | HTML/JS | Display certification |

### For Regulators

| Feature | Access | Purpose |
|---------|--------|---------|
| Compliance Dashboard | Web UI | Industry monitoring |
| Export API | Authenticated | Bulk data export |
| Audit Trail | Web UI | Company investigation |
| Incident Database | Web UI + API | Public safety monitoring |

### For Public

| Feature | Access | Purpose |
|---------|--------|---------|
| Watchdog Portal | Public Web | Report incidents |
| Browser Extension | Chrome/Firefox | Quick reporting |
| Company Scorecards | Public Web | Check compliance |
| Incident Search | Public Web | Research AI safety |

---

## Why Companies Can't Build This Themselves

1. **Regulatory Interpretation**: COAI maintains expert interpretation of complex regulations
2. **Cross-Framework Mapping**: We map controls across EU AI Act, NIST, TC260, ISO
3. **Collective Intelligence**: 33-Agent Council provides unbiased evaluation
4. **Public Accountability**: Watchdog creates external pressure for compliance
5. **Continuous Updates**: Regulations change; we update controls centrally
6. **Network Effects**: More companies = better benchmarks and insights
7. **Third-Party Credibility**: Self-certification isn't trusted; COAI certification is

---

## Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | 1 AI system, basic assessment, community support |
| **Pro** | $49/mo | 10 AI systems, all frameworks, API access, email support |
| **Enterprise** | $199/mo | Unlimited systems, custom frameworks, dedicated support, SLA |

Additional revenue streams:
- Certification exam fees
- Enterprise consulting
- Regulator data access licenses
- Training program licensing

---

## Success Metrics

### For the Platform
- Number of registered AI systems
- Compliance assessments completed
- Watchdog reports processed
- Certified analysts active
- API calls per month

### For AI Companies
- Time to compliance
- Compliance score improvement
- Incident reduction rate
- Certification achievement

### For Regulators
- Industry compliance rates
- Incident resolution times
- Framework adoption rates

### For Public
- Report submission rate
- Report resolution rate
- Transparency score

