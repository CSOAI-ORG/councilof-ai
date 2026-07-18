# CSOAI Ecosystem: The Complete Implementation Playbook

**Document Type**: Technical Implementation Playbook
**Target Audience**: Frontend developers, content strategists, product managers, and technical leads
**Total Word Count Target**: ~28,000 words
**Version**: 1.0
**Date**: July 2026

---

## Chapter Overview & Word Count Budget

| # | Chapter Title | Word Target | Required Elements |
|---|--------------|-------------|-------------------|
| 1 | Executive Summary & Strategic Context | 1,500 | 3 tables, 1 competitive matrix |
| 2 | Site-by-Site Technical Implementation | 6,000 | 5 site sections, 15 code blocks, 5 schema templates |
| 3 | Missing Pages — Complete Build Specs | 4,000 | 12 page specs, 12 wireframe diagrams (ASCII), 12 copy templates |
| 4 | AEO Infrastructure — Production-Ready Code | 4,500 | 10 code templates, 5 llms.txt files, 5 robots.txt configs |
| 5 | Cross-Sell Engine — Triggers, Bundles, CTAs | 3,000 | 6 trigger matrices, 12 CTA copy templates, 3 pricing tables |
| 6 | Master Site Synergy — Unified Components | 2,500 | 3 component specs, header/footer code, design token table |
| 7 | UX Conversion Flows — Wireframe Specs | 2,500 | 4 flow diagrams, 8 wireframe specs, 2 A/B test plans |
| 8 | Content Strategy — Hub & Spoke Architecture | 3,500 | 4 hub briefs, 25 spoke briefs, keyword matrix, content calendar |
| 9 | 90-Day Implementation Roadmap | 2,500 | 12 sprint tickets, 3 phase tables, Gantt-style timeline |
| 10 | Competitive Positioning & Appendix | 2,000 | 4 competitor profiles, comparison matrix, 5 appendices |
| **Total** | | **~32,000** | |

---

## 1. Executive Summary & Strategic Context

**Word Count Target**: 1,500 words
**Required Elements**: 3 tables, 1 competitive parity matrix, 1 ecosystem diagram

### 1.1 Playbook Purpose & Scope

#### 1.1.1 Document Charter: From Audit to Actionable Deliverables
State the purpose: this playbook transforms a 9-part frontend audit into code-ready implementation specs. Define the boundary — frontend implementation only, backend API contracts referenced but not specified.

#### 1.1.2 Target Audience & Usage Guide
Define 4 reader personas and their navigation paths through the playbook:
| Persona | Primary Chapters | Time to Value |
|---------|-----------------|---------------|
| Frontend Developer | Ch 2, 3, 4, 6 | 2 hours |
| Content Strategist | Ch 4, 8, 9 | 1.5 hours |
| Product Manager | Ch 5, 7, 9 | 1 hour |
| Technical Lead | Ch 1, 6, 9, 10 | 1 hour |

#### 1.1.3 Success Metrics for Implementation
Table: 12 KPIs with baseline targets, measurement method, and review cadence.

### 1.2 Ecosystem Overview

#### 1.2.1 The CSOAI Network: 5 Domains, One Architecture
ASCII diagram showing the 5-site topology:
```
                    [meok.ai] — Coordination Layer
                         |
        +----------------+----------------+----------------+
        |                |                |                |
   [csoai.org]    [councilof.ai]  [proofof.ai]   [safetyof.ai]
   Main Research   BFT Governance  Certification   AI Safety
   Organization   33-Agent Council  & MCP Catalog   Research
```

#### 1.2.2 Site Role Definitions & User Journeys
Table: Each site's primary role, target audience, entry point, and conversion goal.

### 1.3 Competitive Context

#### 1.3.1 Competitive Parity Matrix: Vanta, Drata, Arthur.ai, Credo AI
Full comparison table across 20 dimensions (navigation, schema, lead gen, developer portal, pricing transparency, trust signals, content strategy).

#### 1.3.2 CSOAI's Unique Differentiators: 6 Uncontested Capabilities
Bullet list of capabilities no competitor has: BFT Council Governance, 294-server MCP network, Ed25519 cryptographic signing, multi-site ecosystem, Proof of AI blockchain attestation, Meok coordination layer.

#### 1.3.3 Gap Analysis: 15 Table-Stakes Patterns CSOAI Must Close
Prioritized list from competitive research with effort estimates and sprint assignments.

---

## 2. Site-by-Site Technical Implementation

**Word Count Target**: 6,000 words
**Required Elements**: 5 site sections, 15 code blocks, 5 schema templates, 5 navigation specs, 5 hero specs

### 2.1 csoai.org — Main Research Organization

#### 2.1.1 Current State Assessment & 8 Critical Gaps
Audit findings summary table: gap description, severity (Critical/High/Medium), effort estimate, sprint assignment.

#### 2.1.2 Navigation Redesign: 6-Item Top Nav with Dropdowns
```
[Logo]  Research  |  Programs  |  Certification  |  Resources  |  About  |  Contact    [Log in]  [Get Certified]
          (v)          (v)           (v)             (v)          (v)       
```
Code: HTML structure + CSS dropdown behavior + mobile hamburger breakpoint at 768px.

#### 2.1.3 Hero Section: Email Capture + Two-CTA Layout
Wireframe spec (ASCII):
```
+-------------------------------------------------------------+
| [Announcement Bar: "294 servers verifying AI compliance"]   |
+-------------------------------------------------------------+
| [Logo]  Nav Items...                           [Login] [CTA]|
+-------------------------------------------------------------+
|                                                             |
|  H1: Optimized Intelligence Research                        |
|  Subhead: Certify, govern, and verify AI systems...         |
|  [Email Input          ] [Get Certified ->]                 |
|  No credit card. Ed25519 identity created instantly.        |
|                                                             |
|  [Hero Image / Illustration]                                |
|                                                             |
+-------------------------------------------------------------+
| Trusted by: [Logos]              294 Servers | 5 Programs   |
+-------------------------------------------------------------+
```
Code: Complete HTML/CSS for hero section with responsive breakpoints.

#### 2.1.4 Schema Markup: Organization + Website + BreadcrumbList
Code block: Complete JSON-LD `@graph` combining Organization, WebSite, and BreadcrumbList schemas with `@id` references.

#### 2.1.5 Announcement Banner: Rotating Messages with Dismiss
Code: Cookie-based dismissal, 3 rotating messages, CSS gradient background.

#### 2.1.6 Footer: 5-Column with Ecosystem Cross-Links
Code: HTML footer with all 5 sites cross-linked, newsletter signup, trust badges.

### 2.2 proofof.ai — Certification & MCP Catalog

#### 2.2.1 Current State Assessment & 6 Critical Gaps
Gap table with severity and effort estimates.

#### 2.2.2 Navigation: Developer-First 5-Item Nav
```
[Logo]  Certification  |  MCP Catalog  |  Developers  |  Resources  |  About    [Sign In]  [Get Started]
             (v)             (v)            (v)           (v)
```

#### 2.2.3 Hero: Product Screenshot + Live Server Count
Wireframe spec with dynamic server count display, H1, subhead, email capture CTA.

#### 2.2.4 Schema: SoftwareApplication + AggregateRating + FAQPage
Code: JSON-LD for certification platform as SoftwareApplication with rating and FAQ.

#### 2.2.5 MCP Catalog Page: Filterable 294-Server Grid
Code: HTML/CSS/JS for filterable catalog with HMAC attestation badges, search, category filters.

#### 2.2.6 Developer Portal: API Docs + SDK Downloads
Spec: Portal structure, endpoint documentation template, code example blocks, Postman collection download.

### 2.3 councilof.ai — BFT Governance Council

#### 2.3.1 Current State Assessment & 5 Critical Gaps
Gap table.

#### 2.3.2 Navigation: Governance-Focused 5-Item Nav
```
[Logo]  Council  |  Governance  |  Proposals  |  Research  |  About    [Connect Wallet]  [View Council]
           (v)         (v)          (v)          (v)
```

#### 2.3.3 Hero: Live Council Status + 33-Agent Visualization
Wireframe: Dynamic agent status grid, consensus visualization, latest vote display.

#### 2.3.4 Schema: Organization + GovernmentOrganization Hybrid
Code: JSON-LD combining Organization with government-style governance markup.

#### 2.3.5 Proposal Explorer: Filterable Voting History
Spec: Table with sortable columns, vote detail modal, cryptographic signature verification UI.

### 2.4 safetyof.ai — AI Safety Research

#### 2.4.1 Current State Assessment & 4 Critical Gaps
Gap table.

#### 2.4.2 Navigation: Research-Forward 5-Item Nav

#### 2.4.3 Hero: Safety Benchmark Leaderboard
Wireframe: Live benchmark scores, comparison chart, download report CTA.

#### 2.4.4 Schema: Dataset + ResearchProject Markup
Code: JSON-LD for safety benchmarks as schema.org Dataset, research projects as ResearchProject.

#### 2.4.5 Benchmark Detail Pages: Interactive Results
Spec: Chart.js integration, filterable results table, methodology accordion.

### 2.5 meok.ai — Coordination Layer & Mothership

#### 2.5.1 Current State Assessment & 5 Critical Gaps
Gap table.

#### 2.5.2 Navigation: Ecosystem Hub 6-Item Nav
```
[Logo]  Ecosystem  |  Programs  |  Technology  |  Research  |  About  |  Join    [Connect]  [Explore]
            (v)         (v)          (v)          (v)        (v)
```

#### 2.5.3 Hero: Ecosystem Map + Network Visualization
Wireframe: Interactive SVG ecosystem diagram showing all 5 sites and their relationships.

#### 2.5.4 Schema: Organization (Parent) with subOrganization Array
Code: JSON-LD establishing meok.ai as parent Organization with subOrganization references to all 5 sites.

#### 2.5.5 Cross-Site Navigation Component: Universal Header
Code: Shared header component that appears on all 5 sites with active site highlighting and inter-site links.

---

## 3. Missing Pages — Complete Build Specs

**Word Count Target**: 4,000 words
**Required Elements**: 12 page specs with wireframes, 12 meta description templates, 12 H1/CTA copy pairs, 12 schema assignments

### 3.1 Trust Center (csoai.org/trust)

#### 3.1.1 Page Spec: Trust Center Layout & Trust Signals Grid
Wireframe (ASCII): Full page layout with 4 trust signal categories (Governance, Cryptography, Network, Compliance), each with icon + stat + description.

#### 3.1.2 Copy Template: Trust Center H1, H2s, and CTA
```
H1: "Trust is Verifiable"
Subhead: "CSOAI's governance infrastructure is built on cryptographic proof, not promises."
CTA: "View Network Status" / "Download Security Whitepaper"
```

#### 3.1.3 Schema Assignment: Organization + SecurityPolicy Markup
Code: JSON-LD with security declarations, compliance certifications, and real-time status indicators.

#### 3.1.4 Implementation Checklist: 12 Trust Elements
Table: Element name, description, code requirement, verification method.

### 3.2 Pricing Page (csoai.org/pricing)

#### 3.2.1 Page Spec: 4-Tier Pricing Layout
Wireframe: Tier cards (Free/Professional/Enterprise/Custom), feature matrix, FAQ accordion, "Most Popular" badge on tier 2.

#### 3.2.2 Copy Template: Tier Names, Pricing, Value Propositions
```
Tier 1: "Researcher" — Free — "Access public research and safety benchmarks"
Tier 2: "Professional" — $99/mo — "Certify AI systems and join the Council" [MOST POPULAR]
Tier 3: "Enterprise" — Custom — "Organization-wide governance and compliance"
Tier 4: "Sovereign" — Custom — "Dedicated BFT council instance"
```

#### 3.2.3 Schema Assignment: PriceSpecification + Offer Markup
Code: JSON-LD with PriceSpecification for each tier.

#### 3.2.4 Bundle Pricing Table: Cross-Site Subscription Tiers
Table showing how single subscription grants access across csoai.org, proofof.ai, councilof.ai, and safetyof.ai.

### 3.3 Comparison Pages (5 pages: /compare/vanta, /compare/drata, /compare/credo-ai, /compare/arthur-ai, /compare/summary)

#### 3.3.1 Page Spec: Side-by-Side Feature Comparison Layout
Wireframe: Header with competitor logos, feature matrix with check/x/partial icons, G2-style rating boxes, "Why teams switch" section.

#### 3.3.2 Copy Template: Comparison Page H1s, Anchor Text, CTAs
```
H1: "CSOAI vs Vanta: AI-Native Governance vs. Traditional Compliance"
CTA: "Start Free Certification" / "Talk to Our Team"
```

#### 3.3.3 Feature Matrix: 25-Row Comparison Table
Full table comparing CSOAI vs each competitor across: Navigation, Pricing, Open Source, Developer Portal, BFT Governance, MCP Integration, Schema Markup, Trust Center, EU AI Act Content.

#### 3.3.4 Schema Assignment: Table Schema + FAQPage
Code: JSON-LD with Table schema for the comparison matrix.

### 3.4 Developer Portal (developers.csoai.org)

#### 3.4.1 Page Spec: API Documentation Layout
Wireframe: Sidebar nav, main content area with endpoint docs, code examples in 3 languages, "Try it" button.

#### 3.4.2 Copy Template: Portal Welcome, Endpoint Descriptions
```
H1: "CSOAI Developer Platform"
Subhead: "Integrate BFT governance, MCP certification, and cryptographic verification into your AI systems."
```

#### 3.4.3 Schema Assignment: TechArticle + SoftwareApplication
Code: JSON-LD for developer docs as TechArticle with code examples.

### 3.5 EU AI Act Hub (csoai.org/eu-ai-act)

#### 3.5.1 Page Spec: Definitive Guide Layout (7,500+ word container)
Wireframe: Sticky table of contents, expandable sections, downloadable checklist CTA, FAQ accordion, internal linking to spoke pages.

#### 3.5.2 Copy Template: H1, Section Headers, Download CTAs
```
H1: "The Complete EU AI Act Compliance Guide: 2025-2027 Implementation Roadmap"
CTA: "Download Compliance Checklist" / "Start Certification Assessment"
```

#### 3.5.3 Schema Assignment: Article + FAQPage + HowTo (Triple Stack)
Code: Complete `@graph` with Article, FAQPage (10 questions), and HowTo schemas.

### 3.6 AI Governance Frameworks Hub (csoai.org/frameworks)

#### 3.6.1 Page Spec: Interactive Comparison Table Layout
Wireframe: Filterable/sortable table comparing 20+ frameworks, download crosswalk CTA.

#### 3.6.2 Copy Template: Hub H1, Framework Descriptions
```
H1: "AI Governance Frameworks: Complete Comparison of NIST, ISO 42001, EU AI Act & 20+ Others"
```

#### 3.6.3 Schema Assignment: Article + Table
Code: JSON-LD with Table schema for the comparison matrix.

### 3.7 BFT Council Governance Hub (councilof.ai/governance)

#### 3.7.1 Page Spec: Technical Authority Page Layout
Wireframe: Architecture diagram, agent role descriptions, voting visualization, code examples.

#### 3.7.2 Copy Template: Technical H1, Architecture Descriptions
```
H1: "BFT Council Governance: How Multi-Agent AI Voting Creates Trustworthy AI Systems"
```

#### 3.7.3 Schema Assignment: Article + HowTo
Code: JSON-LD with HowTo for implementing BFT governance.

### 3.8 MCP Protocol Hub (proofof.ai/mcp-guide)

#### 3.8.1 Page Spec: Developer Authority Page Layout
Wireframe: Server count badge, architecture diagram, code examples, security checklist.

#### 3.8.2 Copy Template: Developer-Focused H1, Code Descriptions
```
H1: "The Complete MCP Protocol Guide: Model Context Protocol for Enterprise AI (2025)"
```

#### 3.8.3 Schema Assignment: Article + SoftwareApplication + FAQPage
Code: JSON-LD triple stack.

### 3.9 About / Team Pages (All 5 Sites)

#### 3.9.1 Page Spec: Team Grid + Person Schema
Wireframe: Team photo grid, individual person cards with schema markup.

#### 3.9.2 Schema Assignment: Person + Organization (Dual Markup)
Code: JSON-LD Person schema for each team member with `sameAs` links.

### 3.10 Contact / Get Started Pages (All 5 Sites)

#### 3.10.1 Page Spec: Form Layout with Conversion Optimization
Wireframe: Form fields, trust signals, alternative contact methods, FAQ accordion.

#### 3.10.2 Copy Template: Form Labels, Button Text, Success Messages
```
CTA: "Send Message" / "Schedule a Call" / "Join the Council"
Success: "Your Ed25519-verified inquiry has been received. We'll respond within 24 hours."
```

### 3.11 Blog / Resource Hub (All 5 Sites)

#### 3.11.1 Page Spec: Content Hub with Filtering
Wireframe: Category filters, search, article cards with schema, pagination.

#### 3.11.2 Schema Assignment: BlogPosting + Article + BreadcrumbList
Code: JSON-LD for blog listing and individual posts.

### 3.12 Legal / Compliance Pages (All 5 Sites)

#### 3.12.1 Page Spec: Policy Document Layout
Wireframe: Table of contents, expandable sections, last updated date, download PDF CTA.

#### 3.12.2 Schema Assignment: DigitalDocument + Organization
Code: JSON-LD markup for policy documents.

---

## 4. AEO Infrastructure — Production-Ready Code

**Word Count Target**: 4,500 words
**Required Elements**: 10 code templates, 5 llms.txt files, 5 robots.txt configs, 5 agent.json files, validation checklist

### 4.1 llms.txt Implementation (All 5 Sites)

#### 4.1.1 csoai.org llms.txt: Complete Template with All Sections
Code: Full markdown file with H1, blockquote summary, H2 sections (About, Research, Programs, Governance, Contact), link lists, Optional section.

#### 4.1.2 proofof.ai llms.txt: Certification-Focused Template
Code: Full markdown with Core Documentation, Getting Started, Certified Systems, Governance, Research sections.

#### 4.1.3 councilof.ai llms.txt: Governance-Focused Template
Code: Full markdown with Council Overview, Proposals, Voting, Research, Participation sections.

#### 4.1.4 safetyof.ai llms.txt: Research-Focused Template
Code: Full markdown with Benchmarks, Methodology, Publications, Tools, Collaboration sections.

#### 4.1.5 meok.ai llms.txt: Ecosystem Coordination Template
Code: Full markdown with Overview, Connected Programs, Infrastructure, Technology, Participation sections.

#### 4.1.6 llms.txt Deployment & Validation Checklist
Table: 8-step deployment process with validation commands and expected outputs.

### 4.2 robots.txt — AI Crawler Configuration (All 5 Sites)

#### 4.2.1 Complete robots.txt with 25+ AI Crawler Directives
Code: Full robots.txt with individual blocks for OpenAI (GPTBot, OAI-SearchBot, ChatGPT-User), Anthropic (ClaudeBot, Claude-SearchBot), Perplexity, Google, Microsoft, Apple, Meta, Amazon, and 10+ research crawlers.

#### 4.2.2 Crawler Policy Rationale: Allow Search, Disallow Training
Table: Each crawler's purpose, recommended policy, and business justification.

#### 4.2.3 robots.txt Validation & Testing Protocol
Code: Validation commands using curl, expected responses, log monitoring queries.

### 4.3 JSON-LD Schema Templates (10 Production Templates)

#### 4.3.1 Organization Schema: Parent (meok.ai) with subOrganization Links
Code: Complete Organization JSON-LD with `@id`, logo, contactPoint, sameAs, subOrganization array linking all 5 sites.

#### 4.3.2 Organization Schema: Child Sites with parentOrganization
Code: Organization JSON-LD for csoai.org, proofof.ai, councilof.ai, safetyof.ai with parentOrganization referencing meok.ai.

#### 4.3.3 Person Schema: Founder/Author Template with E-E-A-T
Code: Complete Person schema with name, jobTitle, worksFor, alumniOf, knowsAbout, sameAs (LinkedIn, X, GitHub, Google Scholar, ORCID).

#### 4.3.4 FAQPage Schema: 10-Question Template with Word-Count Rules
Code: FAQPage JSON-LD with 10 questions, each answer 40-110 words, matching AI prompt patterns.

#### 4.3.5 Article + BlogPosting Schema: Content Page Template
Code: Article JSON-LD with author Person reference, dateModified, headline, description.

#### 4.3.6 SoftwareApplication Schema: Product Page Template
Code: SoftwareApplication JSON-LD with AggregateRating, Offers, featureList, applicationCategory.

#### 4.3.7 HowTo Schema: Step-by-Step Guide Template
Code: HowTo JSON-LD with tool, supply, step array with name, text, url for each step.

#### 4.3.8 BreadcrumbList Schema: Navigation Trail Template
Code: BreadcrumbList JSON-LD with itemListElement for each navigation level.

#### 4.3.9 Triple-Schema Stack: Article + FAQPage + HowTo for Maximum AI Citations
Code: Complete `@graph` combining all three schemas on a single page for 1.8x citation lift.

#### 4.3.10 Table Schema: Comparison Page Template
Code: Table JSON-LD for structured comparison data.

### 4.4 A2A / Agent Discovery Protocol

#### 4.4.1 agent.json Template: CSOAI Research Assistant
Code: Complete Agent Card with name, description, url, version, capabilities, authentication, skills array with examples.

#### 4.4.2 agent.json Deployment: CORS, Content-Type, Well-Known URI
Code: Deployment instructions, nginx/Apache config for CORS, verification curl command.

### 4.5 AI-Readable Identity Pages

#### 4.5.1 /about/llm Template: Machine-Readable Identity Page
Code: Complete HTML page with Organization schema, structured facts, program listings, leadership info.

#### 4.5.2 Content Freshness: dateModified Signals & Update Protocol
Code: Meta tags, schema dateModified, sitemap lastmod coordination, update calendar.

### 4.6 Implementation Priority Matrix

#### 4.6.1 AEO Rollout Priority: Week 1 to Week 4 Sequence
Table: Week-by-week deployment schedule for all 5 sites, with effort estimates and owner assignments.

---

## 5. Cross-Sell Engine — Triggers, Bundles, CTAs

**Word Count Target**: 3,000 words
**Required Elements**: 6 trigger matrices, 12 CTA copy templates, 3 pricing tables, 8 notification templates, bundle logic flow

### 5.1 Cross-Sell Trigger Architecture

#### 5.1.1 Trigger Matrix: 20 User Actions Mapped to Cross-Sell Offers
Table: User action (page visit, scroll depth, time on site, click pattern) → Trigger condition → Recommended offer → Destination site → CTA copy.

#### 5.1.2 Behavioral Trigger Specs: Scroll Depth, Time on Page, Return Visits
Code: JavaScript trigger detection with event firing, threshold configuration.

#### 5.1.3 Contextual Trigger Specs: Page Content, Referrer, Campaign Parameters
Table: Context signals and corresponding cross-sell recommendations.

### 5.2 Cross-Sell Component Library

#### 5.2.1 Inline Banner: Slim Cross-Sell Bar Between Content Sections
Code: HTML/CSS for contextual banner with icon, headline, description, CTA button.

#### 5.2.2 Sidebar Card: Related Program Recommendation
Code: Sidebar component with program logo, description, relevance reason, CTA.

#### 5.2.3 Exit-Intent Modal: Last-Chance Offer Before Bounce
Code: JavaScript exit-intent detection + modal HTML/CSS with discount offer.

#### 5.2.4 Post-Conversion Upsell: Thank-You Page Next Steps
Code: Thank-you page layout with "You might also be interested in" recommendations.

#### 5.2.5 Email Trigger Drip: Cross-Sell Sequence Templates
Copy: 5-email sequence templates with subject lines, body copy, CTAs.

### 5.3 CTA Copy Templates by Site & Destination

#### 5.3.1 csoai.org → proofof.ai CTAs: Certification Cross-Sell
Copy templates:
```
Primary: "Certify your AI system with Proof of Agency"
Secondary: "Explore 294 verified MCP servers"
Tertiary: "Join the Council of AI governance network"
```

#### 5.3.2 proofof.ai → councilof.ai CTAs: Governance Cross-Sell
Copy templates for certification users interested in governance participation.

#### 5.3.3 councilof.ai → safetyof.ai CTAs: Research Cross-Sell
Copy templates for council members interested in safety benchmarks.

#### 5.3.4 Any Site → meok.ai CTAs: Ecosystem Discovery
Copy templates for ecosystem-wide discovery CTAs.

### 5.4 Bundle Pricing Strategy

#### 5.4.1 Single-Site Tiers: Free / Pro / Enterprise / Custom
Table: 4 tiers with features, limits, and pricing for each site.

#### 5.4.2 Ecosystem Bundle: Cross-Site Subscription Tiers
Table: 3 bundle tiers (Starter/Growth/Sovereign) with included sites, features, and pricing.

#### 5.4.3 Bundle Pricing Logic: Upgrade Path Math
Code: JavaScript pricing calculator showing savings from bundle vs. individual subscriptions.

### 5.5 Measurement & Optimization

#### 5.5.1 Cross-Sell Funnel Metrics: 8 KPIs with Targets
Table: Metric name, definition, target, measurement method.

#### 5.5.2 A/B Test Plan: CTA Copy, Placement, and Timing
Table: 6 test variants with hypothesis, success metric, and minimum sample size.

---

## 6. Master Site Synergy — Unified Components

**Word Count Target**: 2,500 words
**Required Elements**: 3 component specs, header/footer code, design token table, shared CSS framework, notification system spec

### 6.1 Unified Header Component

#### 6.1.1 Header Spec: Logo, 5-Site Switcher, Search, CTAs
Code: Responsive header HTML/CSS with site switcher dropdown, active site indicator.

#### 6.1.2 Site Switcher Dropdown: Visual Ecosystem Navigator
Code: Dropdown menu showing all 5 sites with icons, descriptions, and current-site highlighting.

#### 6.1.3 Mobile Header: Hamburger + Simplified Switcher
Code: Mobile-optimized header with slide-out menu and site switcher.

### 6.2 Unified Footer Component

#### 6.2.1 Footer Spec: 5-Column with Cross-Site Links, Newsletter, Trust
Code: Full footer HTML/CSS with all 5 sites' page links, newsletter signup, trust badges, social links.

#### 6.2.2 Trust Badge Bar: Security Indicators & Real-Time Stats
Code: Footer sub-bar with server count, last audit timestamp, cryptographic verification link.

### 6.3 Design Token System

#### 6.3.1 Color Palette: 5-Site Color Coding with CSS Variables
Code: CSS custom properties for each site's primary/secondary/accent colors.

#### 6.3.2 Typography Scale: Headings, Body, Mono for Code
Code: CSS typography scale with font families, sizes, weights, line heights.

#### 6.3.3 Spacing & Layout: Grid System, Breakpoints, Container Widths
Code: CSS grid system with breakpoints at 576px, 768px, 992px, 1200px.

### 6.4 Shared Component Library

#### 6.4.1 Button System: Primary, Secondary, Tertiary, Ghost
Code: 4 button variants with hover states, disabled states, loading states.

#### 6.4.2 Card Component: Program Card, Feature Card, Testimonial Card
Code: 3 card variants with image, title, description, CTA.

#### 6.4.3 Form Components: Input, Select, Checkbox, Toggle
Code: Styled form elements with validation states and error messaging.

### 6.5 Cross-Site Notification System

#### 6.5.1 Notification Types: Announcement, Alert, Feature, Cross-Sell
Spec: 4 notification types with visual styles, display rules, and dismissal behavior.

#### 6.5.2 Notification Delivery: API Endpoint + Client Rendering
Code: API spec for fetching notifications, client-side rendering and dismissal.

---

## 7. UX Conversion Flows — Wireframe Specs

**Word Count Target**: 2,500 words
**Required Elements**: 4 flow diagrams, 8 wireframe specs, 2 A/B test plans, conversion metrics table

### 7.1 Homepage Conversion Flow

#### 7.1.1 Flow Diagram: Entry → Hero → Email Capture → Onboarding
ASCII flowchart showing 3 entry paths (organic, direct, referral) through hero engagement to conversion.

#### 7.1.2 Hero Wireframe: Above-the-Fold Elements with Pixel Heights
Wireframe with annotated pixel measurements for each element.

#### 7.1.3 Social Proof Section: Stats Bar + Logo Carousel + Testimonials
Wireframe with 3 social proof variants and placement rules.

### 7.2 Certification Conversion Flow (proofof.ai)

#### 7.2.1 Flow Diagram: Discovery → Assessment → Certification → Badge
ASCII flowchart showing the 5-step certification journey.

#### 7.2.2 Assessment Wireframe: Multi-Step Form with Progress Indicator
Wireframe: 5-step assessment form with progress bar, validation, save/resume.

#### 7.2.3 Certification Badge Display: Shareable Credential Page
Wireframe: Public certification page with badge, verification QR code, details.

### 7.3 Council Participation Flow (councilof.ai)

#### 7.3.1 Flow Diagram: Application → Vetting → Onboarding → Voting
ASCII flowchart showing the council member journey.

#### 7.3.2 Voting Interface Wireframe: Proposal Cards, Vote Buttons, History
Wireframe: Voting dashboard with active proposals, vote buttons, participation history.

### 7.4 Cross-Site Discovery Flow (meok.ai)

#### 7.4.1 Flow Diagram: meok.ai Entry → Program Exploration → Deep Link
ASCII flowchart showing ecosystem discovery and deep-linking to specialized sites.

#### 7.4.2 Ecosystem Map Wireframe: Interactive SVG with Clickable Nodes
Wireframe: Interactive diagram with hover states, click-to-navigate, animated connections.

### 7.5 Mobile Conversion Optimization

#### 7.5.1 Mobile Wireframe Adaptations: 5 Key Pages
Wireframe specs for mobile versions of homepage, pricing, certification, council, and meok.ai.

#### 7.5.2 Touch Target Sizing: 48px Minimum, Spacing Rules
Spec: Touch target sizes, spacing between interactive elements, swipe gestures.

### 7.6 A/B Test Plans

#### 7.6.1 Test Plan 1: Hero CTA Copy Variants (6 Variations)
Table: 6 headline + CTA combinations with hypothesis and success metric.

#### 7.6.2 Test Plan 2: Cross-Sell Banner Placement (4 Positions)
Table: 4 placement variants with expected impact and minimum sample size.

#### 7.6.3 Test Plan 3: Pricing Page Layout (2 Variants)
Table: Horizontal cards vs. vertical tier list with success metrics.

---

## 8. Content Strategy — Hub & Spoke Architecture

**Word Count Target**: 3,500 words
**Required Elements**: 4 hub briefs, 25 spoke briefs, keyword matrix, content calendar, internal linking map

### 8.1 Hub 1: EU AI Act Compliance (csoai.org/eu-ai-act)

#### 8.1.1 Hub Page Brief: "The Complete EU AI Act Compliance Guide"
Table: H1, meta description, target keywords, word count, content type, schema requirements, internal linking strategy.

#### 8.1.2 Spoke 1.1 Brief: "EU AI Act Article 50 Explained"
Table: Target keyword, title, word count, H2 outline, schema, internal links.

#### 8.1.3 Spoke 1.2 Brief: "EU AI Act High-Risk Systems"
Table: Full spec with 11-section H2 outline.

#### 8.1.4 Spoke 1.3 Brief: "EU AI Act Penalties and Fines"
Table: Full spec with 10-section H2 outline.

#### 8.1.5 Spoke 1.4 Brief: "EU AI Act GPAI Requirements"
Table: Full spec with 12-section H2 outline.

#### 8.1.6 Spoke 1.5 Brief: "EU AI Act Conformity Assessment"
Table: Full spec with 12-section H2 outline including HowTo schema.

#### 8.1.7 Spoke 1.6 Brief: "EU AI Act CE Marking"
Table: Full spec with 9-section H2 outline.

#### 8.1.8 Spoke 1.7 Brief: "EU AI Act Post-Market Monitoring"
Table: Full spec with 9-section H2 outline.

#### 8.1.9 Spoke 1.8 Brief: "EU AI Act SME Guide"
Table: Full spec with 9-section H2 outline.

#### 8.1.10 Spoke 1.9 Brief: "EU AI Act Article 12 Logging"
Table: Full spec with 10-section H2 outline including code examples.

#### 8.1.11 Spoke 1.10 Brief: "EU AI Act vs. GDPR"
Table: Full spec with 8-section H2 outline.

### 8.2 Hub 2: AI Governance Frameworks (csoai.org/frameworks)

#### 8.2.1 Hub Page Brief: "AI Governance Frameworks Comparison"
Table: Full spec with 10-section H2 outline and interactive comparison table.

#### 8.2.2 Spoke 2.1 Brief: "NIST AI RMF Guide"
Table: Full spec with 11-section H2 outline.

#### 8.2.3 Spoke 2.2 Brief: "ISO 42001 Certification Guide"
Table: Full spec with 10-section H2 outline.

#### 8.2.4 Spoke 2.3 Brief: "DORA AI Governance"
Table: Full spec with 8-section H2 outline.

#### 8.2.5 Spoke 2.4 Brief: "NIS2 Directive Compliance"
Table: Full spec with 8-section H2 outline.

#### 8.2.6 Spoke 2.5 Brief: "AI Governance Framework Crosswalk"
Table: Full spec with 10-section H2 outline including downloadable matrix.

#### 8.2.7 Spoke 2.6 Brief: "AI Risk Management Framework Comparison"
Table: Full spec with 10-section H2 outline.

### 8.3 Hub 3: BFT Council Governance (councilof.ai/governance)

#### 8.3.1 Hub Page Brief: "BFT Council Governance Technical Authority"
Table: Full spec with 12-section H2 outline emphasizing unique differentiation.

#### 8.3.2 Spoke 3.1 Brief: "Byzantine Fault Tolerance AI Governance Deep Dive"
Table: Full spec with 10-section H2 outline.

#### 8.3.3 Spoke 3.2 Brief: "Multi-LLM Voting for AI Safety"
Table: Full spec with 10-section H2 outline.

#### 8.3.4 Spoke 3.3 Brief: "HMAC-Signed AI Audit Trails"
Table: Full spec with 12-section H2 outline including code examples.

#### 8.3.5 Spoke 3.4 Brief: "AI Council Governance Model"
Table: Full spec with 10-section H2 outline.

### 8.4 Hub 4: MCP Protocol Guide (proofof.ai/mcp-guide)

#### 8.4.1 Hub Page Brief: "Complete MCP Protocol Guide"
Table: Full spec with 14-section H2 outline emphasizing 294-server catalog.

#### 8.4.2 Spoke 4.1 Brief: "Model Context Protocol Explained"
Table: Full spec with 10-section H2 outline.

#### 8.4.3 Spoke 4.2 Brief: "MCP Server Guide"
Table: Full spec with 10-section H2 outline including code examples.

#### 8.4.4 Spoke 4.3 Brief: "MCP Security Best Practices"
Table: Full spec with 10-section H2 outline.

#### 8.4.5 Spoke 4.4 Brief: "MCP Registry Guide"
Table: Full spec with 10-section H2 outline.

#### 8.4.6 Spoke 4.5 Brief: "Building MCP Servers: Advanced Patterns"
Table: Full spec with 10-section H2 outline.

### 8.5 Master Keyword Matrix

#### 8.5.1 Hub 1 Keywords: 25 Keywords with Intent Classification
Table: Keyword, intent (Informational/Commercial/Transactional), priority, est. volume, commercial value.

#### 8.5.2 Hub 2 Keywords: 15 Keywords with Intent Classification
Table: Same format.

#### 8.5.3 Hub 3 Keywords: 10 Keywords with Intent Classification
Table: Same format — note these are uncontested terms.

#### 8.5.4 Hub 4 Keywords: 12 Keywords with Intent Classification
Table: Same format — developer-focused keywords.

### 8.6 Internal Linking Architecture

#### 8.6.1 Hub-to-Hub Linking Map
Diagram: 4 hubs with bidirectional link relationships.

#### 8.6.2 Hub-to-Spoke Linking Rules
Table: Anchor text rules, maximum links per page, link placement guidelines.

#### 8.6.3 Cross-Site Linking Strategy: 5 Sites, One Graph
Diagram: How content across all 5 sites links together for domain authority distribution.

### 8.7 90-Day Content Calendar

#### 8.7.1 Month 1: Foundation (Hub Pages + 5 Priority Spokes)
Calendar table: Week-by-week publishing schedule with author assignments.

#### 8.7.2 Month 2: Expansion (10 Additional Spokes)
Calendar table: Week-by-week publishing schedule.

#### 8.7.3 Month 3: Completion (Remaining 10 Spokes + Optimization)
Calendar table: Week-by-week publishing schedule with refresh priorities.

---

## 9. 90-Day Implementation Roadmap

**Word Count Target**: 2,500 words
**Required Elements**: 12 sprint tickets, 3 phase tables, Gantt-style timeline, resource allocation table, risk register

### 9.1 Phase 1: Foundation (Days 1-30) — Critical Gaps

#### 9.1.1 Sprint 1 (Week 1): Unified Header/Footer + Announcement Banner
Ticket table: 4 tickets with acceptance criteria, effort (story points), owner.

#### 9.1.2 Sprint 2 (Week 2): Schema Markup Rollout (Site 1-2)
Ticket table: 5 tickets for csoai.org and proofof.org schema implementation.

#### 9.1.3 Sprint 3 (Week 3): Schema Markup Rollout (Site 3-5) + llms.txt
Ticket table: 5 tickets for remaining sites plus llms.txt deployment.

#### 9.1.4 Sprint 4 (Week 4): Missing Critical Pages (Trust Center + Pricing)
Ticket table: 4 tickets for highest-priority missing pages.

#### 9.1.5 Phase 1 Deliverables & Exit Criteria
Checklist: 12 deliverables that must be complete before Phase 2.

### 9.2 Phase 2: Conversion (Days 31-60) — Cross-Sell + UX

#### 9.2.1 Sprint 5 (Week 5): Cross-Sell Component Development
Ticket table: 4 tickets for banner, sidebar, modal, and email trigger components.

#### 9.2.2 Sprint 6 (Week 6): CTA Copy Implementation + A/B Test Setup
Ticket table: 3 tickets for copy deployment and test configuration.

#### 9.2.3 Sprint 7 (Week 7): Comparison Pages (3 Competitors)
Ticket table: 3 tickets for Vanta, Drata, and Credo AI comparison pages.

#### 9.2.4 Sprint 8 (Week 8): Developer Portal Launch
Ticket table: 4 tickets for portal structure, API docs, SDK pages, and Postman collection.

#### 9.2.5 Phase 2 Deliverables & Exit Criteria
Checklist: 10 deliverables.

### 9.3 Phase 3: Authority (Days 61-90) — Content + AEO

#### 9.3.1 Sprint 9 (Week 9): Hub Page Publication (4 Hubs)
Ticket table: 4 tickets for EU AI Act, Frameworks, BFT, and MCP hub pages.

#### 9.3.2 Sprint 10 (Week 10): Spoke Page Batch 1 (8 Pages)
Ticket table: 8 tickets for first batch of spoke pages.

#### 9.3.3 Sprint 11 (Week 11): Spoke Page Batch 2 (8 Pages)
Ticket table: 8 tickets for second batch.

#### 9.3.4 Sprint 12 (Week 12): Optimization + Measurement + Retrospective
Ticket table: 5 tickets for performance review, schema validation, content refresh, and retrospective.

#### 9.3.5 Phase 3 Deliverables & Exit Criteria
Checklist: 8 deliverables.

### 9.4 Resource Allocation

#### 9.4.1 Team Roles: Frontend Dev, Content Writer, SEO Specialist, PM
Table: Role, FTE allocation, primary sprints, required skills.

#### 9.4.2 Budget Estimate: Tools, Hosting, Content Production
Table: Cost category, item, monthly cost, 90-day total.

### 9.5 Risk Register

#### 9.5.1 8 Identified Risks with Mitigation Strategies
Table: Risk ID, description, probability, impact, mitigation strategy, owner.

---

## 10. Competitive Positioning & Appendix

**Word Count Target**: 2,000 words
**Required Elements**: 4 competitor profiles, comparison matrix, 5 appendices, site inventory table

### 10.1 Competitive Intelligence Summary

#### 10.1.1 Vanta Profile: Strengths, Weaknesses, Tactical Response
Table: 5 strengths, 5 weaknesses, 3 tactical responses for CSOAI.

#### 10.1.2 Drata Profile: Strengths, Weaknesses, Tactical Response
Table: Same format. Note MCP integration as key differentiator to counter.

#### 10.1.3 Arthur.ai Profile: Strengths, Weaknesses, Tactical Response
Table: Same format. Note open-source strategy as model for CSOAI's BFT approach.

#### 10.1.4 Credo AI Profile: Strengths, Weaknesses, Tactical Response
Table: Same format. Note Forrester/Gartner badges as trust signals to emulate.

### 10.2 Competitive Comparison Matrix

#### 10.2.1 Full Comparison: 20 Dimensions Across 5 Competitors
Master table: CSOAI + 4 competitors across navigation, schema, lead gen, developer portal, pricing, trust signals, content, EU AI Act, BFT governance, MCP, open source, and 10 more dimensions.

#### 10.2.2 White Space Opportunities: 6 Uncontested Niches
List: BFT governance content, MCP + compliance, multi-site ecosystem SEO, cryptographic audit trails, 33-agent voting, Ed25519 identity — all with zero competition.

### 10.3 Appendix A: Site Inventory

#### 10.3.1 csoai.org: Current Page List with URLs, Status, Priority
Table: All existing pages with URL, title, schema status, content freshness, action required.

#### 10.3.2 proofof.ai: Current Page List
Table: Same format.

#### 10.3.3 councilof.ai: Current Page List
Table: Same format.

#### 10.3.4 safetyof.ai: Current Page List
Table: Same format.

#### 10.3.5 meok.ai: Current Page List
Table: Same format.

### 10.4 Appendix B: Schema Quick Reference

#### 10.4.1 Schema Type to Page Type Mapping Table
Table: Page type → Required schema types → Optional schema types → Validation tool.

#### 10.4.2 JSON-LD Validation Checklist
Checklist: 10 validation steps with tool recommendations.

### 10.5 Appendix C: Copy Template Library

#### 10.5.1 Headline Formulas: 10 Proven Patterns for AI Governance
List: Pattern template + 3 examples for each.

#### 10.5.2 CTA Formula Sheet: 20 CTA Templates by Intent
Table: Intent (Learn/Buy/Join/Download/Contact) → CTA template → Example.

### 10.6 Appendix D: Technical Resources

#### 10.6.1 Recommended Tools: Schema Validators, SEO Audit, Analytics
Table: Tool name, purpose, URL, cost, CSOAI use case.

#### 10.6.2 API Endpoint Reference: Cross-Site Data Sharing
Table: Endpoint, method, purpose, auth requirement, rate limit.

### 10.7 Appendix E: Glossary

#### 10.7.1 Key Terms: AEO, BFT, MCP, Ed25519, Schema Types
Definition list: 20 key terms with definitions relevant to the playbook.

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | July 2026 | Playbook Design Team | Initial structure |

## Cross-Reference Index

| Term | Chapter.Section |
|------|----------------|
| AEO Infrastructure | Ch 4 |
| Agent Discovery | 4.4 |
| BFT Council | 2.3, 8.3 |
| Bundle Pricing | 5.4 |
| Comparison Pages | 3.3 |
| Content Calendar | 8.7 |
| Conversion Flows | 7 |
| Cross-Sell Engine | 5 |
| CTA Templates | 5.3, 10.5 |
| Developer Portal | 2.2.6, 3.4 |
| EU AI Act Hub | 8.1 |
| FAQPage Schema | 4.3.4 |
| Hub & Spoke | 8 |
| llms.txt | 4.1 |
| MCP Protocol | 8.4 |
| Missing Pages | 3 |
| Organization Schema | 4.3.1 |
| Person Schema | 4.3.3 |
| Pricing Page | 3.2 |
| robots.txt | 4.2 |
| Site-by-Site | 2 |
| Trust Center | 3.1 |
| Unified Components | 6 |
| UX Wireframes | 7 |
| 90-Day Roadmap | 9 |
