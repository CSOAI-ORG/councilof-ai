# CSOAI Ecosystem: The Complete Implementation Playbook

**Subtitle:** From Frontend Audit to Production-Ready Code — UX, SEO/AEO, Cross-Sell & Master Site Synergy

**Date:** June 13, 2026

**Version:** 1.0

**Classification:** Internal Implementation Document — Confidential

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | June 13, 2026 | CSOAI Implementation Team | Initial comprehensive playbook |

## Sites Covered

| Domain | Purpose | Priority |
|--------|---------|----------|
| csoai.org | Certification authority | P0 |
| proofof.ai | MCP catalogue + compliance | P0 |
| councilof.ai | BFT council substrate | P0 |
| safetyof.ai | Free safety score tool | P1 |
| meok.ai | Mothership / products | P0 |
| relevance.ai | Enterprise agent platform | P0 |

## Key Statistics

- **Total Requirements Identified:** 284 (90 P0 / 135 P1 / 59 P2)
- **Production-Ready Code Templates:** 11 (llms.txt, robots.txt, 6 JSON-LD schemas, agent.json, /llm-info)
- **Missing Pages Specified:** 12 (with wireframes, copy, and schema assignments)
- **Cross-Sell Trigger Flows:** 5 (with full email templates and CTA copy)
- **Content Hub & Spoke Pages:** 4 hubs + 25 spokes (62 keywords)
- **90-Day Sprint Tickets:** 63 tickets across 12 sprints
- **Competitors Analyzed:** 4 (Vanta, Drata, Arthur.ai, Credo AI)

---

## Table of Contents

1. [Executive Summary & Strategic Context](#1-executive-summary--strategic-context)
2. [Site-by-Site Technical Implementation](#2-site-by-site-technical-implementation)
3. [Missing Pages — Complete Build Specs](#3-missing-pages--complete-build-specs)
4. [AEO Infrastructure — Production-Ready Code](#4-aeo-infrastructure--production-ready-code)
5. [Cross-Sell Engine — Triggers, Bundles, CTAs](#5-cross-sell-engine--triggers-bundles-ctas)
6. [Master Site Synergy — Unified Components](#6-master-site-synergy--unified-components)
7. [UX Conversion Flows — Wireframe Specs](#7-ux-conversion-flows--wireframe-specs)
8. [Content Strategy — Hub & Spoke Architecture](#8-content-strategy--hub--spoke-architecture)
9. [90-Day Implementation Roadmap](#9-90-day-implementation-roadmap)
10. [Competitive Positioning & Appendix](#10-competitive-positioning--appendix)

---



---

# 1. Executive Summary & Strategic Context

## 1.1 Playbook Purpose & Scope

### 1.1.1 Document Charter: From Audit to Actionable Deliverables

This playbook transforms a comprehensive nine-part frontend audit into deployable implementation specifications for the CSOAI ecosystem. CSOAI LTD (UK 16939677) operates five interconnected domains — csoai.org, proofof.ai, councilof.ai, safetyof.ai, and meok.ai — supporting 294 Model Context Protocol (MCP) servers, a 33-agent Byzantine Fault Tolerant (BFT) governance council, and cryptographic attestation infrastructure built on Ed25519 signing and HMAC verification. The audit identified **284 discrete requirements across eight categories**: navigation redesign, schema markup, AEO (AI Engine Optimization) infrastructure, cross-sell mechanics, master-site synergy, UX conversion flows, content strategy, and competitive positioning.

This document is strictly bounded to **frontend implementation**. Backend API contracts are referenced where interface alignment is required (e.g., `/api/v1/council/votes` for the proposal explorer), but server-side logic, database schemas, and smart contract specifications live outside its scope. Every section ships with production-ready code — HTML/CSS snippets, JSON-LD schema templates, copy blocks, wireframe ASCII diagrams, and step-by-step configuration instructions. The EU AI Act Article 50 transparency obligations take effect August 2, 2026[^12^]; the implementation roadmap in Chapter 9 sequences all deliverables across 12 sprints to meet this deadline.

### 1.1.2 Target Audience & Usage Guide

Four personas drive distinct navigation paths through this playbook. Each path is designed to surface relevant deliverables within a single focused reading session.

| Persona | Primary Chapters | Time to Value | Key Deliverables |
|---------|-----------------|---------------|-----------------|
| **Frontend Developer** | Ch 2, 3, 4, 6 | 2 hours | 15 code blocks, 5 schema templates, header/footer specs, responsive breakpoints |
| **Content Strategist** | Ch 4, 8, 9 | 1.5 hours | 5 llms.txt files, 25 spoke briefs, keyword matrix, 90-day content calendar |
| **Product Manager** | Ch 5, 7, 9 | 1 hour | 6 trigger matrices, 12 CTA templates, 4 UX flow diagrams, pricing tables |
| **Technical Lead** | Ch 1, 6, 9, 10 | 1 hour | Design token system, synergy architecture, sprint tickets, competitive matrix |

**Reading guidance**: Frontend developers should start with Chapter 2 (site-by-site technical specs) and keep Chapter 4 (AEO code templates) open as a reference. Content strategists should read Chapter 8 (hub-and-spoke architecture) first, then Chapter 4 for llms.txt and schema implementation. Product managers should begin with Chapter 5 (cross-sell engine) for trigger logic, then Chapter 7 for wireframe flows. Technical leads should read this chapter in full, then jump to Chapter 6 (shared component architecture) and Chapter 9 (roadmap sequencing).

### 1.1.3 Success Metrics: 12 KPIs with Baseline Targets

Implementation success is measured against 12 KPIs tracked weekly during the 90-day sprint cycle. Baselines reflect pre-implementation measurements; targets represent post-implementation goals at Day 90.

| # | KPI | Baseline | Day 90 Target | Measurement Method | Owner |
|---|-----|----------|---------------|-------------------|-------|
| 1 | Organic search traffic (monthly sessions) | {{BASELINE_ORGANIC}} | +120% | Google Analytics 4 → Traffic Acquisition | Content Lead |
| 2 | AI citation rate (Perplexity/ChatGPT brand mentions) | {{BASELINE_AICITE}} | +200% | Brand mention tracking via Perplexity API + manual spot-checks | Content Lead |
| 3 | Certification conversion rate (visitor → cert signup) | {{BASELINE_CONV}} | 3.5% | proofof.ai conversion funnel in GA4 | Product Manager |
| 4 | Cross-sell revenue (inter-site referrals) | {{BASELINE_XSELL}} | +80% | UTM-tagged cross-links + revenue attribution | Product Manager |
| 5 | Cert sales (monthly paid certifications) | {{BASELINE_CERTS}} | 50/month | proofof.ai checkout events | Product Manager |
| 6 | Safety score completions (safetyof.ai assessments) | {{BASELINE_SAFETY}} | 200/month | safetyof.ai form submission events | Product Manager |
| 7 | MCP server installs (developer onboarding) | {{BASELINE_MCP}} | 150/month | proofof.ai `/api/v1/install` event tracking | Frontend Dev |
| 8 | Council votes participated (councilof.ai engagement) | {{BASELINE_VOTES}} | 500/month | councilof.ai vote submission logs | Frontend Dev |
| 9 | Pages indexed (Google Search Console) | {{BASELINE_INDEXED}} | 100% of published pages | Google Search Console → Coverage report | Content Lead |
| 10 | Schema coverage (% pages with valid JSON-LD) | {{BASELINE_SCHEMA}} | 100% | Schema.org validator API batch check | Frontend Dev |
| 11 | G2 rating (proofof.ai product page) | N/A | 4.5+/5 | G2 review solicitation campaign | Product Manager |
| 12 | Domain Authority (Ahrefs/Moz average across 5 sites) | {{BASELINE_DA}} | +15 points | Ahrefs Domain Rating monthly snapshot | Content Lead |

KPIs 1–2 measure discoverability, 3–5 measure commercial impact, 6–8 measure ecosystem engagement, and 9–12 measure technical health. A weekly standup reviews the KPI dashboard; any metric falling behind target for two consecutive weeks triggers a scope rebalancing discussion per the escalation protocol in Chapter 9.

---

## 1.2 Ecosystem Overview

### 1.2.1 The CSOAI Network: 5 Domains, One Architecture

CSOAI's network is architected as a hub-and-spoke topology with meok.ai as the coordination layer and four specialized domains radiating from it. Each domain carries a distinct user journey but shares a unified design system, schema vocabulary, and cross-sell infrastructure documented in Chapter 6.

```
+---------------------------------------------------------------+
|                                                               |
|                      [ meok.ai ]                              |
|                   Coordination Layer                          |
|              Mothership • Cross-site SSO                      |
|          Ecosystem Map • Shared Navigation                    |
|                                                               |
+----------------------------+----------------------------------+
                             |
        +--------------------+--------------------+--------------------+
        |                    |                    |                    |
   [csoai.org]       [councilof.ai]      [proofof.ai]      [safetyof.ai]
        |                    |                    |                    |
   Main Research       BFT Governance      Certification      AI Safety
   Organization        33-Agent Council    & MCP Catalog      Research
        |                    |                    |                    |
   - Research pubs      - Proposal voting    - 294 MCP servers    - Safety benchmarks
   - Framework docs     - Agent consensus    - Ed25519 signing    - Risk assessments
   - EU AI Act guide    - Vote explorer      - HMAC attestation   - Compliance scoring
   - Team / About       - Council roster     - x402 micropay      - Best practices
        |                    |                    |                    |
   Conversion:          Conversion:          Conversion:         Conversion:
   Newsletter signup     Wallet connect      Cert purchase      Assessment start
+---------------------------------------------------------------+
|  Shared Infrastructure (Chapter 6):                           |
|  Unified header/footer • Cross-site CTA bar • Design tokens   |
|  Ecosystem schema • llms.txt • robots.txt • Analytics         |
+---------------------------------------------------------------+
```

**csoai.org** is the primary research organization site. It publishes open methodologies, hosts the EU AI Act compliance hub, and serves as the default entry point for organic traffic. **councilof.ai** exposes the BFT governance layer: 33 specialized AI agents vote on proposals using weighted consensus, with every vote cryptographically signed and recorded on-chain. **proofof.ai** is the certification marketplace and MCP catalog — 294 servers are listed with HMAC attestation badges, x402 micropayment integration, and five-tier certification levels. **safetyof.ai** houses AI safety benchmarks, risk assessment tooling, and crosswalks mapping 20+ regulatory frameworks (NIST AI RMF, ISO 42001, EU AI Act, DORA, NIS2). **meok.ai** functions as the coordination layer: shared SSO, ecosystem navigation, and the mothership entity binding the network into a coherent user experience.

### 1.2.2 Site Role Definitions & User Journeys

| Site | Primary Role | Target Audience | Entry Point | Conversion Goal |
|------|-------------|-----------------|-------------|-----------------|
| **csoai.org** | Research authority & organic anchor | AI researchers, compliance officers, regulators | Blog / SEO / Direct | Newsletter signup + certification interest |
| **councilof.ai** | Governance transparency & trust | Developers, governance engineers, auditors | proofof.ai cross-link / Direct | Wallet connect + proposal participation |
| **proofof.ai** | Certification marketplace & dev hub | AI developers, platform engineers, CTOs | csoai.org cross-link / MCP search | Certification purchase + MCP server install |
| **safetyof.ai** | Safety benchmarking & assessment | Safety researchers, risk officers, legal | csoai.org cross-link / SEO | Assessment completion + framework download |
| **meok.ai** | Ecosystem coordination & discovery | All personas exploring the network | Any site header link | Cross-site navigation depth + SSO signup |

The user journey is designed as a loop: organic entry on csoai.org → content consumption → cross-sell CTA to proofof.ai (certification) or safetyof.ai (assessment) → conversion → ongoing engagement via councilof.ai (governance participation) → return to csoai.org for new content. Chapter 5 defines the trigger conditions, bundle logic, and CTA copy for each transition.

---

## 1.3 Competitive Context

### 1.3.1 Competitive Parity Matrix: Vanta, Drata, Arthur.ai, Credo AI

The following matrix evaluates CSOAI against four established competitors across 15 dimensions that determine frontend credibility and conversion performance. Scoring uses a three-state system: ✅ (implemented at or above competitive standard), ⚠️ (partially implemented or below standard), ❌ (not implemented). CSOAI's current state is scored pre-implementation; this playbook closes every ❌ and ⚠️ marked below.

| Dimension | Vanta | Drata | Arthur.ai | Credo AI | CSOAI (Pre) |
|-----------|:-----:|:-----:|:---------:|:--------:|:-----------:|
| **Navigation clarity** (5–7 item top nav) | ✅ 5 items[^44^] | ✅ 7 items[^45^] | ✅ 4 items[^42^] | ✅ 7 items[^43^] | ⚠️ Inconsistent across 5 sites |
| **Announcement banner** | ✅ Purple bar[^44^] | ✅ Blue bar[^45^] | ✅ Green bar | ✅ Pink bar | ❌ None |
| **Hero email capture** | ✅ Inline form[^44^] | ✅ Inline form[^45^] | ✅ Inline form | ✅ Demo CTA | ❌ No capture |
| **Customer logo bar** | ✅ Above fold[^44^] | ✅ Above fold[^45^] | ✅ Logos shown | ✅ Fortune 500 | ❌ Not displayed |
| **G2/review badges** | ✅ 4.6/5 (2,450+)[^125^] | ✅ 4.8/5 (1,097)[^78^] | ❌ N/A | ❌ N/A | ❌ No G2 presence |
| **Comparison pages** (SEO) | ✅ vs Drata[^86^] | ✅ 10+ pages[^80^] | ❌ None | ❌ None | ❌ None |
| **Free tools / lead magnets** | ✅ Templates[^116^] | ✅ Templates + Academy | ✅ Open source[^85^] | ✅ Sandbox | ⚠️ Minimal |
| **Trust Center page** | ✅ trust.vanta.com[^84^] | ✅ Trust Hub[^122^] | ❌ None | ❌ None | ❌ None |
| **Developer portal** | ✅ Basic API[^78^] | ✅ Advanced + MCP[^95^][^99^] | ✅ Strong OSS[^85^] | ⚠️ Limited | ❌ None |
| **Pricing transparency** | ❌ Hidden (req demo)[^101^] | ❌ Hidden (req demo) | ✅ $60/mo shown | ❌ Hidden | ❌ No pricing page |
| **Analyst badges** | ✅ G2 Leader[^130^] | ✅ G2 Leader | ❌ None | ✅ Forrester 12/12[^77^] | ❌ None |
| **Schema markup (JSON-LD)** | ✅ Full coverage | ✅ Full coverage | ✅ Full coverage | ✅ Full coverage | ⚠️ Partial |
| **EU AI Act content** | ✅ Dedicated hub | ✅ Dedicated hub[^26^] | ⚠️ Partial | ✅ Strong[^112^] | ⚠️ Needs expansion |
| **Dark mode support** | ❌ Light only | ✅ Yes[^45^] | ✅ Yes | ✅ Yes | ❌ Light only |
| **AI positioning clarity** | ✅ "Agentic Trust" | ✅ "Agentic Trust" | ✅ "AI governance" | ✅ "AI Governance" | ⚠️ Fragmented |

**Matrix interpretation**: CSOAI enters with two structural advantages no competitor can replicate — the 294-server MCP network with HMAC attestation and the 33-agent BFT council with on-chain voting. However, the presentation layer is missing **9 of 15** table-stakes patterns that every competitor has implemented. Vanta and Drata each deploy 12+ of 15 dimensions at full competitive standard; CSOAI currently deploys 2. The gap is not a capability deficit — it is an execution deficit. This playbook closes all 15 dimensions within 90 days.

### 1.3.2 CSOAI's 6 Unique Differentiators

Six capabilities are uncontested in the competitive landscape. No competitor has replicated or announced any of these:

1. **BFT Council Governance** — 33 specialized AI agents reaching consensus through Byzantine Fault Tolerant voting, with every decision cryptographically signed and immutably recorded. No competitor offers multi-agent governance; all use single-point human committees.
2. **294-Server MCP Network** — The largest public catalog of Model Context Protocol servers with live HMAC attestation badges showing real-time verification status. Drata operates a single MCP server[^99^]; CSOAI operates 294.
3. **Ed25519 Cryptographic Signing** — Every certification, vote, and attestation is signed with Ed25519, producing non-repudiable audit trails that satisfy EU AI Act Article 12 logging requirements[^34^]. Competitors rely on conventional database logs.
4. **Multi-Site Ecosystem Architecture** — Five purpose-built domains create topical authority silos (research, governance, certification, safety, coordination) that no single-site competitor can match for SEO depth.
5. **Proof of AI Blockchain Attestation** — Certification records are anchored to a public blockchain, creating tamper-evident credentials that employers and auditors can verify independently.
6. **x402 Micropayment Integration** — Per-request micropayment infrastructure enables usage-based certification pricing, a model none of the subscription-only competitors support.

### 1.3.3 Gap Analysis: 15 Table-Stakes Patterns to Close

The 15 gaps identified in the competitive parity matrix are sequenced by effort estimate and sprint assignment. All high-priority items (Sprints 1–3) are implemented before the EU AI Act August 2026 deadline.

| # | Table-Stakes Pattern | Effort | Priority | Sprint | Chapter |
|---|---------------------|--------|----------|--------|---------|
| 1 | Unified 5–7 item navigation with dropdowns | 2 dev days | Critical | 1 | Ch 2, Ch 6 |
| 2 | Announcement banner (rotating, dismissible) | 0.5 dev days | Critical | 1 | Ch 2 |
| 3 | Hero email capture with inline CTA | 1 dev day | Critical | 1 | Ch 2 |
| 4 | Customer logo bar + stats row | 0.5 dev days | Critical | 1 | Ch 3 |
| 5 | Schema markup audit + JSON-LD deployment | 3 dev days | Critical | 2 | Ch 4 |
| 6 | Trust Center page (security docs, compliance) | 2 dev days | Critical | 2 | Ch 3 |
| 7 | Comparison pages (vs Vanta, Drata, Credo, Arthur) | 2 content days | Critical | 2–3 | Ch 8 |
| 8 | Free tool launch (EU AI Act risk classifier) | 3 dev days | High | 3 | Ch 3 |
| 9 | Developer portal (API docs, SDKs, Postman) | 4 dev days | High | 4 | Ch 2 |
| 10 | Pricing page with transparent tiers | 1 dev day | High | 3 | Ch 3 |
| 11 | llms.txt + robots.txt AEO infrastructure | 1 dev day | High | 2 | Ch 4 |
| 12 | G2 review solicitation campaign | 0.5 dev days | Medium | 5 | Ch 9 |
| 13 | On-demand webinar series (3 episodes) | 3 content days | Medium | 5–7 | Ch 8 |
| 14 | Free template/checklist library (5 assets) | 2 content days | Medium | 4–6 | Ch 8 |
| 15 | Dark mode toggle + theme system | 2 dev days | Low | 8 | Ch 6 |

The sequencing reflects a simple principle: **credibility before conversion, conversion before optimization**. Sprints 1–3 establish navigational trust (items 1–7) so visitors believe the site is legitimate. Sprints 4–6 build conversion mechanics (items 8–11, 14) that turn trust into action. Sprints 7–9 optimize and extend (items 12–13, 15) to widen the funnel. Total implementation effort: **~25 developer days + ~10 content days**, fully resourced within a single 90-day cycle.


---

# 2. Site-by-Site Technical Implementation

**Word Count Target**: 6,000 words
**Required Elements**: 5 site sections, 15+ code blocks, 5 schema templates, 5 navigation specs, 5 hero specs, gap tables per site

---

This chapter translates the strategic audit findings into deployable code. Every section contains production-ready HTML, CSS, and JSON-LD that your engineering team can copy-paste into the codebase today. CSOAI operates five public-facing domains — each with distinct audience, conversion goal, and technical gaps. The implementation sequence follows the 90-day sprint plan from the requirements document: foundation (Days 1-14), differentiation (Days 15-30), platform (Days 31-45), integration (Days 46-60), and polish (Days 61-90).

Each site section follows a consistent structure: a gap table scoring 10 priority fixes by severity and effort, followed by the five deployable components (navigation, hero, schema, banner/special, footer). Code blocks use `{{PLACEHOLDER}}` syntax for values that vary per environment. All CSS uses the Morandi palette specified in the design system: `#8B7355` (primary brown), `#A6A6A6` (secondary gray), `#C4B7A6` (warm sand), `#B5C4B1` (soft sage), `#D4C4B0` (light tan), `#9B8B7A` (deep stone), `#A8B5A0` (muted moss).

---

## 2.1 csoai.org — "The Council"

**Primary Audience**: Enterprise compliance officers, AI governance leaders, regulatory consultants
**Conversion Goal**: Email capture → certification consultation booking
**Current State**: No unified navigation, no hero email capture, no announcement banner, minimal schema markup

### 2.1.1 Gap Table: 10 Priority Fixes with Severity and Effort

| # | Gap | Severity | Fix | Effort |
|---|-----|----------|-----|--------|
| 1 | No announcement banner — all 4 competitors (Vanta, Drata, Arthur, Credo) use colored top bars for deadline messaging and product launches | HIGH | Deploy purple-gradient closable banner with EU AI Act countdown; rotate 3 messages | 2h |
| 2 | No hero email capture — missing the #1 SaaS lead gen pattern; zero lead capture above the fold | HIGH | Two-CTA hero: inline email + "Get Started" primary + "Talk to Sales" secondary | 4h |
| 3 | No customer logo bar or stats row — zero social proof above the fold | HIGH | Stats row: "294 Verification Servers \| 5 Governance Domains \| Ed25519 Signing \| 33-Agent BFT Council" | 3h |
| 4 | No unified navigation — fragmented UX across 5 sites; no cross-site wayfinding | HIGH | 6-item top nav with Ecosystem dropdown linking all 5 domains | 6h |
| 5 | No Organization JSON-LD — AI crawlers cannot consolidate CSOAI entity across sites | HIGH | Full Organization schema with `sameAs`, `subOrganization` array, `parentOrganization` link | 2h |
| 6 | No FAQPage schema — highest-impact schema for AI citations (1.8x lift with triple-stack) | HIGH | 10 Q&A pairs covering CSOAI mission, certification, governance, research | 3h |
| 7 | No footer with ecosystem cross-links — missed cross-sell opportunity on every page | MEDIUM | 5-column footer: Product, Resources, Company, Ecosystem, Legal + newsletter signup | 4h |
| 8 | No comparison pages — Drata has 10+ vs-pages; CSOAI has zero competitive SEO targeting | MEDIUM | Build `/compare/vanta`, `/compare/drata`, `/compare/credo-ai`, `/compare/arthur-ai` | 2 days each |
| 9 | No Trust Center page — Vanta/Drata dedicate entire sections to security documentation | MEDIUM | Trust Center with SOC 2 badge, ISO 27001 badge, governance principles, subprocessor list | 1 day |
| 10 | No framework checker or free assessment tool — Credo AI's sandbox drives qualified leads | MEDIUM | Embed EU AI Act readiness assessment (10-question quiz) linked from hero | 2-3 days |

**Analytical Interpretation**: The top four gaps are all HIGH severity and collectively represent table-stakes patterns that every competitor implements. The announcement banner (Gap 1) and hero email capture (Gap 2) alone drive 40-60% of SaaS homepage lead generation. The navigation gap (Gap 4) is structural — without cross-site wayfinding, the multi-domain ecosystem works against CSOAI instead of for it. Gaps 5-6 are invisible to users but critical for AI search engine indexing; without Organization and FAQPage schemas, CSOAI will not appear in AI-generated answers regardless of content quality. Gaps 8-10 are medium-term builds that compound in value: comparison pages rank well for high-commercial-intent queries, the Trust Center closes enterprise sales cycles, and the free assessment tool creates a viral lead magnet loop.

### 2.1.2 Navigation Redesign: 6-Item Top Nav with Product Dropdown

The navigation must accomplish two tasks simultaneously: orient the user within csoai.org and expose the full ecosystem. The 6-item structure balances depth with scannability — Vanta uses 5 items, Drata uses 7, Credo uses 7. The Ecosystem dropdown is the critical cross-sell mechanism.

**Navigation Structure:**

```
[CSOAI Logo]  Platform ▾  Solutions ▾  Resources ▾  Research  Pricing  [Ecosystem ▾]  [Log In]  [Get Started]
```

**HTML Implementation:**

```html
<!-- csoai.org: 6-Item Top Navigation -->
<!-- Place in <header> or component template -->
<nav class="csoai-nav" role="navigation" aria-label="Primary">
  <div class="csoai-nav__container">
    <!-- Logo -->
    <a href="/" class="csoai-nav__logo" aria-label="CSOAI Home">
      <img src="{{LOGO_PATH}}" alt="CSOAI" width="140" height="32" />
    </a>

    <!-- Mobile hamburger -->
    <button class="csoai-nav__mobile-toggle" aria-expanded="false" aria-controls="nav-menu">
      <span class="sr-only">Toggle menu</span>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <!-- Main menu -->
    <ul id="nav-menu" class="csoai-nav__menu">
      <!-- Item 1: Platform (dropdown) -->
      <li class="csoai-nav__item csoai-nav__item--has-dropdown">
        <button class="csoai-nav__link" aria-expanded="false" aria-haspopup="true">
          Platform <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        </button>
        <ul class="csoai-nav__dropdown" role="menu">
          <li><a href="/platform/framework-checker" role="menuitem">Framework Checker</a></li>
          <li><a href="/platform/certification" role="menuitem">Certification Engine</a></li>
          <li><a href="/platform/audit-trails" role="menuitem">HMAC Audit Trails</a></li>
          <li><a href="/platform/ed25519-identity" role="menuitem">Ed25519 Identity</a></li>
        </ul>
      </li>

      <!-- Item 2: Solutions (dropdown) -->
      <li class="csoai-nav__item csoai-nav__item--has-dropdown">
        <button class="csoai-nav__link" aria-expanded="false" aria-haspopup="true">
          Solutions <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        </button>
        <ul class="csoai-nav__dropdown" role="menu">
          <li><a href="/solutions/eu-ai-act" role="menuitem">EU AI Act Compliance</a></li>
          <li><a href="/solutions/iso-42001" role="menuitem">ISO 42001 Certification</a></li>
          <li><a href="/solutions/nist-rmf" role="menuitem">NIST AI RMF</a></li>
          <li><a href="/solutions/governance" role="menuitem">AI Governance</a></li>
        </ul>
      </li>

      <!-- Item 3: Resources (dropdown) -->
      <li class="csoai-nav__item csoai-nav__item--has-dropdown">
        <button class="csoai-nav__link" aria-expanded="false" aria-haspopup="true">
          Resources <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        </button>
        <ul class="csoai-nav__dropdown" role="menu">
          <li><a href="/guides" role="menuitem">Guides &amp; Reports</a></li>
          <li><a href="/blog" role="menuitem">Blog</a></li>
          <li><a href="/webinars" role="menuitem">Webinars</a></li>
          <li><a href="/templates" role="menuitem">Free Templates</a></li>
        </ul>
      </li>

      <!-- Item 4: Research (direct link) -->
      <li class="csoai-nav__item">
        <a href="/research" class="csoai-nav__link">Research</a>
      </li>

      <!-- Item 5: Pricing (direct link) -->
      <li class="csoai-nav__item">
        <a href="/pricing" class="csoai-nav__link">Pricing</a>
      </li>

      <!-- Item 6: Ecosystem (dropdown — cross-sell) -->
      <li class="csoai-nav__item csoai-nav__item--has-dropdown csoai-nav__item--ecosystem">
        <button class="csoai-nav__link" aria-expanded="false" aria-haspopup="true">
          Ecosystem <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        </button>
        <ul class="csoai-nav__dropdown csoai-nav__dropdown--ecosystem" role="menu">
          <li><a href="https://csoai.org" role="menuitem" class="csoai-nav__ecosystem-link csoai-nav__ecosystem-link--current">
            <strong>csoai.org</strong><span> — The Council</span>
          </a></li>
          <li><a href="https://proofof.ai" role="menuitem" class="csoai-nav__ecosystem-link">
            <strong>proofof.ai</strong><span> — MCP Catalogue &amp; Certification</span>
          </a></li>
          <li><a href="https://councilof.ai" role="menuitem" class="csoai-nav__ecosystem-link">
            <strong>councilof.ai</strong><span> — BFT Governance</span>
          </a></li>
          <li><a href="https://safetyof.ai" role="menuitem" class="csoai-nav__ecosystem-link">
            <strong>safetyof.ai</strong><span> — Safety Score</span>
          </a></li>
          <li><a href="https://meok.ai" role="menuitem" class="csoai-nav__ecosystem-link">
            <strong>meok.ai</strong><span> — Ecosystem Hub</span>
          </a></li>
        </ul>
      </li>
    </ul>

    <!-- Right-side CTAs -->
    <div class="csoai-nav__actions">
      <a href="/login" class="csoai-btn csoai-btn--ghost">Log In</a>
      <a href="/get-started" class="csoai-btn csoai-btn--primary">Get Started</a>
    </div>
  </div>
</nav>
```

**CSS (Morandi Palette):**

```css
/* csoai.org Navigation Styles — Morandi Palette */
.csoai-nav {
  background: #ffffff;
  border-bottom: 1px solid #C4B7A6;
  position: sticky;
  top: 0;
  z-index: 100;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.csoai-nav__container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  height: 64px;
}
.csoai-nav__logo { margin-right: 40px; flex-shrink: 0; }
.csoai-nav__menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 4px;
  flex: 1;
}
.csoai-nav__item { position: relative; }
.csoai-nav__link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  color: #9B8B7A;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
  background: none;
  border: none;
  cursor: pointer;
}
.csoai-nav__link:hover { background: #F5F0EB; color: #8B7355; }
.csoai-nav__dropdown {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 240px;
  background: #ffffff;
  border: 1px solid #C4B7A6;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.08);
  list-style: none;
  margin: 6px 0 0;
  padding: 8px;
}
.csoai-nav__item--has-dropdown:hover .csoai-nav__dropdown,
.csoai-nav__item--has-dropdown:focus-within .csoai-nav__dropdown { display: block; }
.csoai-nav__dropdown li a {
  display: block;
  padding: 10px 14px;
  color: #9B8B7A;
  font-size: 14px;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.15s;
}
.csoai-nav__dropdown li a:hover { background: #F5F0EB; color: #8B7355; }
.csoai-nav__dropdown--ecosystem { min-width: 280px; }
.csoai-nav__ecosystem-link--current { background: #F5F0EB; color: #8B7355 !important; font-weight: 600; }
.csoai-nav__actions { display: flex; gap: 10px; align-items: center; margin-left: auto; }
.csoai-btn {
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.15s;
  cursor: pointer;
  display: inline-block;
}
.csoai-btn--ghost { color: #9B8B7A; border: 1px solid #C4B7A6; background: transparent; }
.csoai-btn--ghost:hover { background: #F5F0EB; color: #8B7355; }
.csoai-btn--primary { color: #fff; background: #8B7355; border: 1px solid #8B7355; }
.csoai-btn--primary:hover { background: #7A6548; }
```

### 2.1.3 Hero Section: Framework Checker Integration + Two-CTA Layout

The hero must accomplish three things in the first viewport: explain what CSOAI does, capture an email, and establish credibility through stats. The two-CTA pattern (primary "Get Started" + secondary "Talk to Sales") is table stakes — all four competitors use it.

**Wireframe (ASCII):**

```
+--------------------------------------------------------------------------+
| [Announcement Banner: "EU AI Act high-risk deadline: Dec 2027" Close X]  |
| [Nav: Logo  Platform  Solutions  Resources  Research  Pricing  Ecosystem]| |
|                                                                          |
|  +------------------------------------+  +-----------------------------+ |
|  | H1: AI Governance That             |  |                           | |
|  |     Proves Itself                  |  |   [Framework Checker       | |
|  |                                    |  |    Interactive Preview]    | |
|  | Subhead: CSOAI certifies AI        |  |                           | |
|  | systems with Ed25519-signed        |  |   Select framework:        | |
|  | attestations across 294 verifi-    |  |   [ EU AI Act ▾]           | |
|  | cation servers. BFT governance,    |  |                           | |
|  | zero trust, complete transparency. |  |   [Run Assessment →]       | |
|  |                                    |  |                           | |
|  | [Email: _____________] [Get Started]|  |   Compliance Score: 0/100 | |
|  | No credit card. Ed25519 identity   |  |   [=====>          ] 23%  | |
|  | created instantly.                 |  |                           | |
|  |                                    |  +-----------------------------+ |
|  | [Talk to an AI Advisor] (secondary)|                                |
|  +------------------------------------+                                |
|                                                                          |
|  +----Stats Row----+----Stats Row----+----Stats Row----+----Stats Row---+|
|  | 294 Verification | 5 Governance   | Ed25519        | 33-Agent       ||
|  | Servers          | Domains        | Cryptographic  | BFT Council    ||
|  +------------------+----------------+----------------+----------------+|
```

**HTML/CSS Implementation:**

```html
<!-- csoai.org Hero Section — Two-CTA + Framework Checker -->
<section class="csoai-hero" aria-label="Hero">
  <div class="csoai-hero__container">
    <div class="csoai-hero__content">
      <h1 class="csoai-hero__title">AI Governance That Proves Itself</h1>
      <p class="csoai-hero__subhead">
        CSOAI certifies AI systems with Ed25519-signed attestations across
        294 verification servers. BFT governance, zero trust, complete transparency.
      </p>

      <!-- Email capture form -->
      <form class="csoai-hero__form" action="/api/signup" method="POST" novalidate>
        <div class="csoai-hero__form-row">
          <input
            type="email"
            name="email"
            class="csoai-hero__input"
            placeholder="Enter your work email"
            aria-label="Work email"
            required
          />
          <button type="submit" class="csoai-btn csoai-btn--primary csoai-btn--lg">
            Get Started
          </button>
        </div>
        <p class="csoai-hero__microcopy">
          No credit card required. Ed25519 identity created instantly.
        </p>
      </form>

      <!-- Secondary CTA -->
      <a href="/demo" class="csoai-btn csoai-btn--secondary">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <polygon points="4,2 14,8 4,14"/>
        </svg>
        Talk to an AI Advisor
      </a>
    </div>

    <!-- Right side: Framework checker preview -->
    <div class="csoai-hero__visual">
      <div class="csoai-checker">
        <h3 class="csoai-checker__title">Framework Checker</h3>
        <label for="framework-select" class="csoai-checker__label">Select framework</label>
        <select id="framework-select" class="csoai-checker__select">
          <option value="eu-ai-act">EU AI Act (2024/1689)</option>
          <option value="iso-42001">ISO 42001:2023</option>
          <option value="nist-rmf">NIST AI RMF</option>
          <option value="dora">DORA</option>
          <option value="nis2">NIS2 Directive</option>
        </select>
        <button class="csoai-btn csoai-btn--primary csoai-checker__btn">
          Run Assessment →
        </button>
        <div class="csoai-checker__score">
          <span class="csoai-checker__score-label">Compliance Score</span>
          <div class="csoai-checker__bar">
            <div class="csoai-checker__bar-fill" style="width: 23%;"></div>
          </div>
          <span class="csoai-checker__score-value">23/100</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Stats row -->
  <div class="csoai-hero__stats">
    <div class="csoai-stat">
      <span class="csoai-stat__number">294</span>
      <span class="csoai-stat__label">Verification Servers</span>
    </div>
    <div class="csoai-stat">
      <span class="csoai-stat__number">5</span>
      <span class="csoai-stat__label">Governance Domains</span>
    </div>
    <div class="csoai-stat">
      <span class="csoai-stat__number">Ed25519</span>
      <span class="csoai-stat__label">Cryptographic Signing</span>
    </div>
    <div class="csoai-stat">
      <span class="csoai-stat__number">33</span>
      <span class="csoai-stat__label">Agent BFT Council</span>
    </div>
  </div>
</section>
```

```css
/* csoai.org Hero Styles — Morandi Palette */
.csoai-hero {
  background: linear-gradient(135deg, #FAF8F5 0%, #F0EBE3 100%);
  padding: 64px 24px 48px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.csoai-hero__container {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}
.csoai-hero__title {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.1;
  color: #4A4238;
  margin: 0 0 20px;
  letter-spacing: -0.02em;
}
.csoai-hero__subhead {
  font-size: 18px;
  line-height: 1.6;
  color: #9B8B7A;
  margin: 0 0 32px;
  max-width: 480px;
}
.csoai-hero__form { margin-bottom: 16px; }
.csoai-hero__form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}
.csoai-hero__input {
  flex: 1;
  padding: 12px 16px;
  font-size: 15px;
  border: 1px solid #C4B7A6;
  border-radius: 8px;
  background: #fff;
  color: #4A4238;
  min-width: 0;
}
.csoai-hero__input::placeholder { color: #A6A6A6; }
.csoai-hero__input:focus {
  outline: none;
  border-color: #8B7355;
  box-shadow: 0 0 0 3px rgba(139,115,85,0.12);
}
.csoai-btn--lg { padding: 12px 24px; font-size: 15px; }
.csoai-btn--secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  color: #8B7355;
  background: transparent;
  border: 1px solid #C4B7A6;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s;
}
.csoai-btn--secondary:hover { background: #F5F0EB; }
.csoai-hero__microcopy {
  font-size: 13px;
  color: #A6A6A6;
  margin: 0;
}
.csoai-hero__visual { justify-self: end; }
.csoai-checker {
  background: #ffffff;
  border: 1px solid #C4B7A6;
  border-radius: 12px;
  padding: 28px;
  width: 380px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.06);
}
.csoai-checker__title {
  font-size: 16px;
  font-weight: 600;
  color: #4A4238;
  margin: 0 0 16px;
}
.csoai-checker__label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #9B8B7A;
  margin-bottom: 6px;
}
.csoai-checker__select {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #C4B7A6;
  border-radius: 6px;
  background: #FAF8F5;
  color: #4A4238;
  margin-bottom: 14px;
}
.csoai-checker__btn { width: 100%; margin-bottom: 20px; }
.csoai-checker__score { display: flex; align-items: center; gap: 12px; }
.csoai-checker__score-label { font-size: 12px; color: #A6A6A6; }
.csoai-checker__bar { flex: 1; height: 8px; background: #E8E0D6; border-radius: 4px; overflow: hidden; }
.csoai-checker__bar-fill { height: 100%; background: linear-gradient(90deg, #8B7355, #B5C4B1); border-radius: 4px; }
.csoai-checker__score-value { font-size: 13px; font-weight: 600; color: #8B7355; min-width: 40px; text-align: right; }
.csoai-hero__stats {
  max-width: 1280px;
  margin: 48px auto 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding-top: 32px;
  border-top: 1px solid #C4B7A6;
}
.csoai-stat { text-align: center; }
.csoai-stat__number { display: block; font-size: 28px; font-weight: 700; color: #8B7355; }
.csoai-stat__label { display: block; font-size: 13px; color: #9B8B7A; margin-top: 4px; }
@media (max-width: 768px) {
  .csoai-hero__container { grid-template-columns: 1fr; gap: 40px; }
  .csoai-hero__title { font-size: 32px; }
  .csoai-checker { width: 100%; }
  .csoai-hero__stats { grid-template-columns: repeat(2, 1fr); }
}
```

### 2.1.4 Schema Markup: Organization + Website + BreadcrumbList JSON-LD

This `@graph` stack combines Organization, WebSite, and BreadcrumbList into a single script tag. The Organization schema uses `@id` references so other pages and other sites in the ecosystem can link back to the canonical entity definition.

```html
<!-- csoai.org: Organization + WebSite + BreadcrumbList @graph -->
<!-- Place in <head>, before closing </head> -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://csoai.org/#organization",
      "name": "CSOAI — Council for the Study of Optimized Intelligence",
      "alternateName": ["CSOAI", "Council for the Study of Optimized Intelligence"],
      "url": "https://csoai.org",
      "logo": {
        "@type": "ImageObject",
        "url": "https://csoai.org/assets/logo-112x112.png",
        "width": 112,
        "height": 112
      },
      "description": "CSOAI certifies AI systems with Ed25519-signed attestations across 294 verification servers, governed by a 33-agent BFT Council. We make AI compliance verifiable, transparent, and trustworthy.",
      "foundingDate": "2024",
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "General Inquiries",
          "email": "contact@csoai.org",
          "availableLanguage": ["English"]
        },
        {
          "@type": "ContactPoint",
          "contactType": "Media Relations",
          "email": "press@csoai.org",
          "availableLanguage": ["English"]
        }
      ],
      "sameAs": [
        "https://www.linkedin.com/company/csoai",
        "https://twitter.com/csoai_org",
        "https://github.com/csoai",
        "https://www.crunchbase.com/organization/csoai",
        "https://www.wikidata.org/entity/{{QID}}"
      ],
      "parentOrganization": {
        "@id": "https://meok.ai/#organization"
      },
      "subOrganization": [
        { "@id": "https://councilof.ai/#organization" },
        { "@id": "https://proofof.ai/#organization" },
        { "@id": "https://safetyof.ai/#organization" }
      ],
      "knowsAbout": [
        "AI Safety",
        "AI Governance",
        "Optimized Intelligence",
        "EU AI Act Compliance",
        "ISO 42001 Certification",
        "Byzantine Fault Tolerance",
        "Ed25519 Cryptographic Signing",
        "Model Context Protocol"
      ],
      "memberOf": {
        "@type": "Organization",
        "name": "Partnership on AI"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://csoai.org/#website",
      "url": "https://csoai.org",
      "name": "CSOAI",
      "publisher": { "@id": "https://csoai.org/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://csoai.org/search?q={search_term_string}" },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://csoai.org/#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://csoai.org/" },
        { "@type": "ListItem", "position": 2, "name": "Platform", "item": "https://csoai.org/platform" }
      ]
    }
  ]
}
</script>
```

### 2.1.5 Announcement Banner: EU AI Act Countdown + Rotating Messages

The announcement banner serves two purposes: urgency (regulatory deadlines drive action) and discovery (new content, product launches, events). Vanta uses purple, Drata uses blue, Credo uses pink. CSOAI uses a warm gradient drawn from the Morandi palette.

```html
<!-- csoai.org: Announcement Banner — Rotating Messages -->
<!-- Place as first child of <body> -->
<div id="announcement-banner" class="csoai-banner" role="region" aria-label="Announcement">
  <div class="csoai-banner__container">
    <a href="/eu-ai-act-guide" class="csoai-banner__link" id="banner-message">
      <!-- Message 1: Urgency -->
      <span class="csoai-banner__urgent">EU AI Act high-risk deadline: December 2027</span>
      <span class="csoai-banner__sep">—</span>
      <span class="csoai-banner__cta">Get the compliance guide →</span>
    </a>
    <button
      class="csoai-banner__close"
      onclick="dismissBanner()"
      aria-label="Dismiss announcement"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="2" y1="2" x2="12" y2="12"/>
        <line x1="12" y1="2" x2="2" y2="12"/>
      </svg>
    </button>
  </div>
</div>
```

```css
/* csoai.org Banner Styles */
.csoai-banner {
  background: linear-gradient(90deg, #8B7355, #9B8B7A);
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  position: relative;
  z-index: 200;
}
.csoai-banner__container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 10px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.csoai-banner__link {
  color: #fff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.csoai-banner__link:hover { text-decoration: underline; }
.csoai-banner__urgent { font-weight: 600; }
.csoai-banner__sep { opacity: 0.6; }
.csoai-banner__cta { font-weight: 500; opacity: 0.95; }
.csoai-banner__close {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
  transition: opacity 0.15s;
  margin-left: auto;
  flex-shrink: 0;
}
.csoai-banner__close:hover { opacity: 1; }
.csoai-banner--hidden { display: none; }
```

```javascript
// csoai.org: Banner rotation + dismissal
// Place before closing </body> or in site JS bundle
(function() {
  const BANNER_KEY = 'csoai_banner_dismissed';
  const ROTATE_INTERVAL = 8000; // ms

  const messages = [
    {
      urgent: 'EU AI Act high-risk deadline: December 2027',
      cta: 'Get the compliance guide →',
      href: '/eu-ai-act-guide'
    },
    {
      urgent: 'New: AI Governance Framework Crosswalk (20+ frameworks)',
      cta: 'Compare now →',
      href: '/governance-frameworks'
    },
    {
      urgent: 'Proof of Agency certification is now live',
      cta: 'Get certified →',
      href: 'https://proofof.ai'
    }
  ];

  // Check dismissal (7-day expiry)
  const dismissed = localStorage.getItem(BANNER_KEY);
  if (dismissed) {
    const dismissedAt = parseInt(dismissed, 10);
    if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
      document.getElementById('announcement-banner').classList.add('csoai-banner--hidden');
      return;
    }
  }

  // Rotation
  let idx = 0;
  const linkEl = document.getElementById('banner-message');
  setInterval(() => {
    idx = (idx + 1) % messages.length;
    linkEl.href = messages[idx].href;
    linkEl.innerHTML = `
      <span class="csoai-banner__urgent">${messages[idx].urgent}</span>
      <span class="csoai-banner__sep">—</span>
      <span class="csoai-banner__cta">${messages[idx].cta}</span>
    `;
  }, ROTATE_INTERVAL);

  // Dismissal handler
  window.dismissBanner = function() {
    document.getElementById('announcement-banner').classList.add('csoai-banner--hidden');
    localStorage.setItem(BANNER_KEY, Date.now().toString());
  };
})();
```

### 2.1.6 Footer: 5-Column with Ecosystem Cross-Links

The footer is the second most-viewed page element (after the hero). It must provide wayfinding for users who scrolled past their target, legal compliance, and ecosystem cross-sell.

```html
<!-- csoai.org: 5-Column Footer with Ecosystem Cross-Links -->
<footer class="csoai-footer" role="contentinfo">
  <div class="csoai-footer__container">
    <div class="csoai-footer__grid">
      <!-- Col 1: Product -->
      <div class="csoai-footer__col">
        <h4 class="csoai-footer__heading">Product</h4>
        <ul class="csoai-footer__list">
          <li><a href="/platform/framework-checker">Framework Checker</a></li>
          <li><a href="/platform/certification">Certification Engine</a></li>
          <li><a href="/platform/audit-trails">HMAC Audit Trails</a></li>
          <li><a href="/platform/ed25519-identity">Ed25519 Identity</a></li>
          <li><a href="/pricing">Pricing</a></li>
        </ul>
      </div>

      <!-- Col 2: Resources -->
      <div class="csoai-footer__col">
        <h4 class="csoai-footer__heading">Resources</h4>
        <ul class="csoai-footer__list">
          <li><a href="/guides/eu-ai-act">EU AI Act Guide</a></li>
          <li><a href="/guides/iso-42001">ISO 42001 Guide</a></li>
          <li><a href="/blog">Blog</a></li>
          <li><a href="/templates">Free Templates</a></li>
          <li><a href="/webinars">Webinars</a></li>
        </ul>
      </div>

      <!-- Col 3: Company -->
      <div class="csoai-footer__col">
        <h4 class="csoai-footer__heading">Company</h4>
        <ul class="csoai-footer__list">
          <li><a href="/about">About</a></li>
          <li><a href="/team">Team</a></li>
          <li><a href="/research">Research</a></li>
          <li><a href="/careers">Careers</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </div>

      <!-- Col 4: Ecosystem — cross-sell -->
      <div class="csoai-footer__col csoai-footer__col--ecosystem">
        <h4 class="csoai-footer__heading">Ecosystem</h4>
        <ul class="csoai-footer__list">
          <li><a href="https://proofof.ai" rel="noopener">proofof.ai — Certification</a></li>
          <li><a href="https://councilof.ai" rel="noopener">councilof.ai — Governance</a></li>
          <li><a href="https://safetyof.ai" rel="noopener">safetyof.ai — Safety Score</a></li>
          <li><a href="https://meok.ai" rel="noopener">meok.ai — Hub</a></li>
        </ul>
      </div>

      <!-- Col 5: Legal + Newsletter -->
      <div class="csoai-footer__col">
        <h4 class="csoai-footer__heading">Legal</h4>
        <ul class="csoai-footer__list">
          <li><a href="/privacy">Privacy Policy</a></li>
          <li><a href="/terms">Terms of Service</a></li>
          <li><a href="/security">Security</a></li>
          <li><a href="/trust-center">Trust Center</a></li>
          <li><a href="/accessibility">Accessibility</a></li>
        </ul>
        <form class="csoai-footer__newsletter" action="/api/newsletter" method="POST">
          <label for="footer-email" class="csoai-footer__newsletter-label">Newsletter</label>
          <div class="csoai-footer__newsletter-row">
            <input type="email" id="footer-email" name="email" placeholder="Your email" required />
            <button type="submit">→</button>
          </div>
        </form>
      </div>
    </div>

    <div class="csoai-footer__bottom">
      <p class="csoai-footer__copyright">© {{YEAR}} CSOAI. All rights reserved.</p>
      <div class="csoai-footer__social">
        <a href="https://linkedin.com/company/csoai" aria-label="LinkedIn" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
        <a href="https://twitter.com/csoai_org" aria-label="Twitter" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href="https://github.com/csoai" aria-label="GitHub" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>
```

---

## 2.2 proofof.ai — "The MCP Catalogue"

**Primary Audience**: AI developers, platform engineers, DevOps teams integrating MCP servers
**Conversion Goal**: MCP server discovery → certification registration → SDK download
**Current State**: No developer portal, no MCP catalog browser, no pricing page, no schema markup

### 2.2.1 Gap Table: 10 Priority Fixes with Severity and Effort

| # | Gap | Severity | Fix | Effort |
|---|-----|----------|-----|--------|
| 1 | No MCP catalog browser — 294 servers exist but no discoverability UI | HIGH | Searchable, filterable grid with attestation badges, security ratings, per-server detail | 1 week |
| 2 | No developer portal — Arthur.ai has 1,000+ GitHub stars; Drata has MCP integration docs | HIGH | docs.proofof.ai with API reference, SDK quickstart, code examples, Postman collection | 2-3 weeks |
| 3 | No pricing page — even Arthur.ai shows pricing ($60/mo free tier) | HIGH | 3-tier pricing (Free/Open Source $0, Professional $5,000, Enterprise $25,000) with feature matrix | 1 day |
| 4 | No SoftwareApplication + Offer schema — AI search engines cannot understand pricing | HIGH | SoftwareApplication schema with 3 Offer tiers, aggregateRating, featureList | 3h |
| 5 | No integration guides per IDE — developers need Claude, ChatGPT, Cursor setup | MEDIUM | Per-IDE setup pages with copy-paste config, screenshots, troubleshooting | 2 days each |
| 6 | No hero server count or live attestation demo — missing credibility signal | MEDIUM | Hero showing live server count ("294 Verified MCP Servers") + "Explore the Catalog" CTA | 4h |
| 7 | No FAQPage schema for developer questions — missed AI citation opportunity | MEDIUM | 10 developer-focused QAs (MCP setup, attestation verification, certification process) | 3h |
| 8 | No Announcement banner — consistency with ecosystem; Drata uses for product launches | LOW | Deploy shared banner component with MCP server launch announcements | 1h |
| 9 | No Review schema for testimonials — social proof for certification registrations | LOW | First-party Review schema with reviewer credentials on testimonials page | 2h |
| 10 | No footer ecosystem cross-links — missed cross-sell to councilof.ai and csoai.org | LOW | 5-column footer mirroring csoai.org structure with ecosystem column | 3h |

**Analytical Interpretation**: proofof.ai has the highest developer-expectation gap. Arthur.ai's 1,000+ GitHub stars and Drata's MCP integration documentation set the bar for developer trust signals. The MCP catalog browser (Gap 1) is the single highest-impact build — without it, 294 verification servers are invisible. The developer portal (Gap 2) is a large effort but compounds: every SDK download, API call, and code example builds developer affinity that converts to certification registrations. Pricing transparency (Gap 3) is a trust signal even for free tiers — developers expect to see cost before investing integration time. Schema markup (Gap 4) enables AI search engines to surface pricing in answers, a competitive advantage when developers ask "how much does MCP certification cost."

### 2.2.2 Navigation: Developer-First 5-Item Nav with MCP Search

Developer audiences prioritize scannability and density. The navigation is compact (5 items vs. 6 on csoai.org) with a search field for instant MCP server lookup.

```html
<!-- proofof.ai: Developer-First 5-Item Navigation -->
<nav class="poa-nav" role="navigation" aria-label="Primary">
  <div class="poa-nav__container">
    <a href="/" class="poa-nav__logo" aria-label="Proof of Agency Home">
      <img src="{{LOGO_PATH}}" alt="Proof of Agency" width="160" height="32" />
    </a>

    <ul class="poa-nav__menu">
      <li class="poa-nav__item poa-nav__item--has-dropdown">
        <button class="poa-nav__link" aria-expanded="false">Catalog <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></button>
        <ul class="poa-nav__dropdown">
          <li><a href="/catalog">All Servers</a></li>
          <li><a href="/catalog/verified">Verified Only</a></li>
          <li><a href="/catalog/categories">Categories</a></li>
          <li><a href="/catalog/integrations">IDE Integrations</a></li>
        </ul>
      </li>
      <li class="poa-nav__item poa-nav__item--has-dropdown">
        <button class="poa-nav__link" aria-expanded="false">Developers <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></button>
        <ul class="poa-nav__dropdown">
          <li><a href="/docs">Documentation</a></li>
          <li><a href="/docs/quickstart">Quickstart</a></li>
          <li><a href="/docs/api">API Reference</a></li>
          <li><a href="/docs/sdks">SDKs</a></li>
        </ul>
      </li>
      <li class="poa-nav__item"><a href="/certification" class="poa-nav__link">Certification</a></li>
      <li class="poa-nav__item"><a href="/pricing" class="poa-nav__link">Pricing</a></li>
      <li class="poa-nav__item"><a href="/blog" class="poa-nav__link">Blog</a></li>
    </ul>

    <!-- MCP Search -->
    <form class="poa-nav__search" action="/catalog" method="GET" role="search">
      <input
        type="search"
        name="q"
        class="poa-nav__search-input"
        placeholder="Search 294 MCP servers..."
        aria-label="Search MCP servers"
      />
      <button type="submit" class="poa-nav__search-btn" aria-label="Search">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="15" y2="15"/>
        </svg>
      </button>
    </form>

    <div class="poa-nav__actions">
      <a href="https://csoai.org/login" class="poa-btn poa-btn--ghost">Log In</a>
      <a href="/get-started" class="poa-btn poa-btn--primary">Get Started</a>
    </div>
  </div>
</nav>
```

### 2.2.3 Hero: Server Count + Live Attestation Demo CTA

Developer heroes need density: stats, code snippets, and immediate utility. The hero combines a live server counter with a terminal-style attestation preview.

**Wireframe (ASCII):**

```
+--------------------------------------------------------------------------+
| [Nav: Logo  Catalog  Developers  Certification  Pricing  Blog] [Search]  | |
|                                                              [Log In][Go]|
|                                                                          |
|  +------------------------------------+  +-----------------------------+ |
|  | H1: 294 Verified MCP Servers       |  | $ curl https://proofof.ai   | |
|  |     with HMAC-Signed Attestations  |  |     /api/v1/attest/verify   | |
|  |                                    |  |                             | |
|  | Subhead: The largest catalog of    |  | {                         | |
|  | compliance-governed Model Context  |  |   "server_id": "mcp-042", | |
|  | Protocol servers. Every server     |  |   "status": "verified",   | |
|  | cryptographically attested by the  |  |   "signature":            | |
|  | BFT Council.                       |  |  "Ed25519:abc123...",    | |
|  |                                    |  |   "council_vote": "33/33",| |
|  | [Explore the Catalog] (primary)    |  |   "timestamp": "..."      | |
|  | [Read the Docs] (secondary)        |  | }                         | |
|  |                                    |  |                             | |
|  | 294 Servers | 33 Agents | Ed25519  |  | Verified. Trusted. Yours. | |
|  +------------------------------------+  +-----------------------------+ |
```

```html
<!-- proofof.ai: Developer Hero — Server Count + Terminal Preview -->
<section class="poa-hero">
  <div class="poa-hero__container">
    <div class="poa-hero__content">
      <h1 class="poa-hero__title">294 Verified MCP Servers with HMAC-Signed Attestations</h1>
      <p class="poa-hero__subhead">
        The largest catalog of compliance-governed Model Context Protocol servers.
        Every server cryptographically attested by the BFT Council.
      </p>
      <div class="poa-hero__ctas">
        <a href="/catalog" class="poa-btn poa-btn--primary poa-btn--lg">Explore the Catalog</a>
        <a href="/docs/quickstart" class="poa-btn poa-btn--secondary">Read the Docs</a>
      </div>
      <div class="poa-hero__stats">
        <span class="poa-hero__stat"><strong>294</strong> Servers</span>
        <span class="poa-hero__stat"><strong>33</strong> Council Agents</span>
        <span class="poa-hero__stat"><strong>Ed25519</strong> Signing</span>
      </div>
    </div>
    <div class="poa-hero__terminal">
      <div class="poa-terminal">
        <div class="poa-terminal__header">
          <span class="poa-terminal__dot poa-terminal__dot--red"></span>
          <span class="poa-terminal__dot poa-terminal__dot--yellow"></span>
          <span class="poa-terminal__dot poa-terminal__dot--green"></span>
          <span class="poa-terminal__title">bash — proofof.ai</span>
        </div>
        <pre class="poa-terminal__body"><code>$ curl https://proofof.ai/api/v1/attest/verify \
    -H "Authorization: Bearer $POA_TOKEN" \
    -d '{"server_id": "mcp-042"}'

{
  "server_id": "mcp-042",
  "status": "verified",
  "signature": "Ed25519:7a3f9c...e2d1",
  "council_vote": "33/33",
  "timestamp": "2026-07-15T09:23:17Z",
  "frameworks": ["EU AI Act", "ISO 42001"]
}</code></pre>
        <div class="poa-terminal__footer">
          <span class="poa-terminal__badge">Verified</span>
          <span class="poa-terminal__badge poa-terminal__badge--success">Trusted</span>
          <span class="poa-terminal__copy">Click to copy →</span>
        </div>
      </div>
    </div>
  </div>
</section>
```

```css
/* proofof.ai Hero — Dark Developer Theme */
.poa-hero {
  background: #1A1A2E;
  color: #E8E0D6;
  padding: 80px 24px 64px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}
.poa-hero__container {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}
.poa-hero__title {
  font-size: 40px;
  font-weight: 700;
  line-height: 1.15;
  color: #D4C4B0;
  margin: 0 0 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.poa-hero__subhead {
  font-size: 17px;
  line-height: 1.6;
  color: #A6A6A6;
  margin: 0 0 32px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.poa-hero__ctas { display: flex; gap: 12px; margin-bottom: 28px; }
.poa-hero__stats { display: flex; gap: 24px; }
.poa-hero__stat { font-size: 14px; color: #9B8B7A; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
.poa-hero__stat strong { color: #D4C4B0; font-size: 20px; display: block; }
.poa-btn--primary { background: #8B7355; color: #fff; border: 1px solid #8B7355; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 500; text-decoration: none; display: inline-block; transition: all 0.15s; }
.poa-btn--primary:hover { background: #7A6548; }
.poa-btn--secondary { background: transparent; color: #C4B7A6; border: 1px solid #9B8B7A; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 500; text-decoration: none; display: inline-block; }
.poa-btn--secondary:hover { background: rgba(139,115,85,0.1); }
.poa-terminal {
  background: #16213E;
  border: 1px solid #2A2A4A;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0,0,0,0.3);
}
.poa-terminal__header {
  background: #0F3460;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.poa-terminal__dot { width: 12px; height: 12px; border-radius: 50%; }
.poa-terminal__dot--red { background: #E74C3C; }
.poa-terminal__dot--yellow { background: #F39C12; }
.poa-terminal__dot--green { background: #2ECC71; }
.poa-terminal__title { font-size: 12px; color: #A6A6A6; margin-left: 8px; font-family: -apple-system, sans-serif; }
.poa-terminal__body {
  padding: 20px;
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #B5C4B1;
  overflow-x: auto;
}
.poa-terminal__body code { font-family: 'SF Mono', Monaco, monospace; }
.poa-terminal__footer {
  padding: 12px 20px;
  border-top: 1px solid #2A2A4A;
  display: flex;
  align-items: center;
  gap: 8px;
}
.poa-terminal__badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 4px;
  background: #2A2A4A;
  color: #A6A6A6;
  font-family: -apple-system, sans-serif;
}
.poa-terminal__badge--success { background: rgba(46,204,113,0.15); color: #2ECC71; }
.poa-terminal__copy { margin-left: auto; font-size: 11px; color: #9B8B7A; cursor: pointer; font-family: -apple-system, sans-serif; }
```

### 2.2.4 Schema: SoftwareApplication + AggregateRating + FAQPage JSON-LD

```html
<!-- proofof.ai: SoftwareApplication + AggregateRating + FAQPage @graph -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://proofof.ai/#application",
      "name": "Proof of Agency — MCP Certification Platform",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Any",
      "softwareVersion": "1.0.0",
      "url": "https://proofof.ai",
      "description": "Certify and verify MCP servers with HMAC-signed attestations. Browse 294 verified Model Context Protocol servers with compliance governance.",
      "offers": [
        {
          "@type": "Offer",
          "name": "Open Source",
          "description": "Free for individuals and open-source projects. Basic attestation verification.",
          "price": "0",
          "priceCurrency": "USD",
          "priceValidUntil": "2027-12-31"
        },
        {
          "@type": "Offer",
          "name": "Professional",
          "description": "Team certification, priority verification, API access.",
          "price": "5000",
          "priceCurrency": "USD",
          "priceValidUntil": "2027-12-31"
        },
        {
          "@type": "Offer",
          "name": "Enterprise",
          "description": "Custom SLA, dedicated council, on-premise deployment.",
          "price": "25000",
          "priceCurrency": "USD",
          "priceValidUntil": "2027-12-31"
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "{{REVIEW_COUNT}}",
        "bestRating": "5",
        "worstRating": "1"
      },
      "featureList": "HMAC-Signed Attestations, Ed25519 Cryptographic Verification, BFT Council Governance, 294 Verified MCP Servers, IDE Integrations (Claude, ChatGPT, Cursor), API Access, Conformity Assessment Reports",
      "publisher": { "@id": "https://csoai.org/#organization" }
    },
    {
      "@type": "FAQPage",
      "@id": "https://proofof.ai/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Proof of Agency certification?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Proof of Agency (PoA) certification is a rigorous evaluation process that verifies AI systems meet governance standards through cryptographic attestation. Each certified system receives an Ed25519-signed certificate that proves compliance with frameworks like the EU AI Act, ISO 42001, and NIST AI RMF."
          }
        },
        {
          "@type": "Question",
          "name": "How does HMAC attestation work for MCP servers?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "HMAC attestation creates a cryptographically signed record of an MCP server's compliance evaluation. The 33-agent BFT Council votes on each server. Once consensus is reached, the attestation is signed with Ed25519 and published to the verification network. Developers can verify any attestation in real-time via the API."
          }
        },
        {
          "@type": "Question",
          "name": "How do I connect a certified MCP server to Claude?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Add the server's MCP endpoint to your Claude Desktop configuration file (claude_desktop_config.json). The server will appear as available tools in your Claude conversations. Certified servers display a verification badge confirming their attestation status. See our Claude integration guide for step-by-step instructions."
          }
        }
      ]
    }
  ]
}
</script>
```

### 2.2.5 MCP Catalog Browser: Searchable Filterable Grid Spec

The catalog browser is the primary conversion surface for proofof.ai. It must handle 294+ entries with sub-second filtering, clear attestation status, and one-click integration copy.

```html
<!-- proofof.ai: MCP Catalog Browser Component -->
<section class="poa-catalog" aria-label="MCP Server Catalog">
  <div class="poa-catalog__header">
    <h2 class="poa-catalog__title">Browse 294 Verified MCP Servers</h2>
    <div class="poa-catalog__filters">
      <input type="search" class="poa-catalog__search" placeholder="Search servers..." aria-label="Search servers" />
      <select class="poa-catalog__filter" aria-label="Filter by category">
        <option value="">All Categories</option>
        <option value="database">Database</option>
        <option value="api">API Integration</option>
        <option value="search">Search</option>
        <option value="analytics">Analytics</option>
        <option value="security">Security</option>
      </select>
      <select class="poa-catalog__filter" aria-label="Filter by framework">
        <option value="">All Frameworks</option>
        <option value="eu-ai-act">EU AI Act</option>
        <option value="iso-42001">ISO 42001</option>
        <option value="nist-rmf">NIST AI RMF</option>
      </select>
      <label class="poa-catalog__toggle">
        <input type="checkbox" id="verified-only" /> Verified only
      </label>
    </div>
  </div>

  <div class="poa-catalog__grid" id="catalog-grid">
    <!-- Server card template (repeat for each server) -->
    <article class="poa-server" data-categories="database" data-frameworks="eu-ai-act,iso-42001" data-verified="true">
      <div class="poa-server__header">
        <h3 class="poa-server__name">postgres-mcp</h3>
        <span class="poa-server__badge poa-server__badge--verified" title="HMAC attestation verified by BFT Council">
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 0a7 7 0 100 14A7 7 0 007 0zm3.5 5.5L6.5 9.5 4.5 7.5" stroke="#2ECC71" stroke-width="1.5" fill="none"/></svg>
          Verified
        </span>
      </div>
      <p class="poa-server__desc">PostgreSQL database access with schema introspection and query execution.</p>
      <div class="poa-server__meta">
        <span class="poa-server__framework">EU AI Act</span>
        <span class="poa-server__framework">ISO 42001</span>
        <span class="poa-server__votes">33/33 votes</span>
      </div>
      <div class="poa-server__actions">
        <button class="poa-server__copy" data-config='{"mcpServers":{"postgres":{"command":"npx","args":["-y","@modelcontextprotocol/server-postgres"]}}}'>Copy Config</button>
        <a href="/catalog/postgres-mcp" class="poa-server__detail">Details →</a>
      </div>
    </article>
    <!-- Repeat for remaining 293 servers -->
  </div>
</section>
```

### 2.2.6 Integration Guides: Per-IDE Setup (Claude, ChatGPT, Cursor)

Each IDE guide follows an identical structure: prerequisites, config snippet, verification step, troubleshooting. This consistency reduces maintenance and accelerates content production.

```html
<!-- proofof.ai: Per-IDE Integration Guide Template -->
<!-- Use as base template for /docs/integrations/claude, /chatgpt, /cursor -->
<article class="poa-guide">
  <header class="poa-guide__header">
    <span class="poa-guide__product-badge">{{IDE_NAME}}</span>
    <h1 class="poa-guide__title">Connect Verified MCP Servers to {{IDE_NAME}}</h1>
    <p class="poa-guide__lead">Step-by-step setup for HMAC-attested MCP servers in {{IDE_NAME}}.</p>
    <div class="poa-guide__meta">
      <span class="poa-guide__time">5 min read</span>
      <span class="poa-guide__difficulty">Beginner</span>
    </div>
  </header>

  <nav class="poa-guide__toc" aria-label="Table of contents">
    <ol>
      <li><a href="#prerequisites">Prerequisites</a></li>
      <li><a href="#config">Configuration</a></li>
      <li><a href="#verify">Verify Connection</a></li>
      <li><a href="#troubleshoot">Troubleshooting</a></li>
    </ol>
  </nav>

  <section id="prerequisites" class="poa-guide__section">
    <h2>Prerequisites</h2>
    <ul>
      <li>{{IDE_NAME}} installed (version {{MIN_VERSION}}+)</li>
      <li>A Proof of Agency account (<a href="/get-started">free signup</a>)</li>
      <li>Node.js 18+ (for npx-based servers)</li>
    </ul>
  </section>

  <section id="config" class="poa-guide__section">
    <h2>Configuration</h2>
    <p>Open your {{IDE_NAME}} configuration file and add the MCP server:</p>
    <pre class="poa-guide__code"><code class="language-json">{
  "mcpServers": {
    "{{SERVER_ID}}": {
      "command": "npx",
      "args": ["-y", "{{NPX_PACKAGE}}"],
      "env": {
        "POA_API_KEY": "{{API_KEY}}"
      }
    }
  }
}</code></pre>
    <button class="poa-guide__copy" data-clipboard-target="#config-snippet">Copy to clipboard</button>
  </section>

  <section id="verify" class="poa-guide__section">
    <h2>Verify Connection</h2>
    <p>Restart {{IDE_NAME}} and check for the green verification badge:</p>
    <ol>
      <li>Open a new conversation</li>
      <li>Type "List available tools"</li>
      <li>Confirm <code>{{SERVER_ID}}</code> appears with <span class="poa-verified-badge">Verified</span> status</li>
    </ol>
  </section>

  <section id="troubleshoot" class="poa-guide__section">
    <h2>Troubleshooting</h2>
    <details class="poa-guide__faq">
      <summary>Server not appearing in tool list</summary>
      <p>Ensure Node.js is in your PATH. Run <code>node --version</code> in your terminal to verify.</p>
    </details>
    <details class="poa-guide__faq">
      <summary>Attestation verification failed</summary>
      <p>Check your API key at <a href="/account">Account Settings</a>. Regenerate if necessary.</p>
    </details>
  </section>

  <!-- Cross-sell CTA -->
  <aside class="poa-guide__cross-sell">
    <p>Want to certify your own MCP server?</p>
    <a href="/certification/apply" class="poa-btn poa-btn--primary">Start Certification →</a>
  </aside>
</article>
```

---

## 2.3 councilof.ai — "The BFT Council"

**Primary Audience**: AI governance researchers, policy makers, compliance auditors, technical leads evaluating governance infrastructure
**Conversion Goal**: Council transparency engagement → certification trust → ecosystem participation
**Current State**: No live council status, no interactive demo, no governance documentation portal

### 2.3.1 Gap Table: 10 Priority Fixes with Severity and Effort

| # | Gap | Severity | Fix | Effort |
|---|-----|----------|-----|--------|
| 1 | No live council status display — zero visibility into 33-agent voting | HIGH | Real-time dashboard: consensus status, active votes, recent decisions, agent participation | 1 week |
| 2 | No interactive demo CTA — visitors cannot experience BFT governance | HIGH | Interactive "Simulate a Vote" widget: pick scenario, see agent votes, observe consensus | 3-4 days |
| 3 | No Organization + GovernmentOrganization hybrid schema — missed entity classification | HIGH | Hybrid schema declaring both organizational types with governance-specific properties | 2h |
| 4 | No transparency page with vote history — governance requires audit trail | HIGH | Vote history explorer: filterable by date, topic, outcome; HMAC-signed receipts | 4 days |
| 5 | No navigation linking to other ecosystem sites — isolated domain | MEDIUM | 5-item governance-focused nav with Ecosystem dropdown | 4h |
| 6 | No hero explaining BFT Council — visitors land without context | MEDIUM | Hero with live status ("Council Active: 33/33 Agents Online") + demo CTA | 4h |
| 7 | no FAQPage schema for governance questions | MEDIUM | 10 governance QAs (BFT explanation, vote process, agent roles, appeal process) | 3h |
| 8 | no footer with ecosystem cross-links | LOW | Standard 5-column footer with governance-specific links | 3h |
| 9 | No HowTo schema for council interaction | LOW | HowTo schema for "How to query the BFT Council" | 2h |
| 10 | No announcement banner — consistency with ecosystem | LOW | Shared banner component with governance updates | 1h |

**Analytical Interpretation**: councilof.ai is CSOAI's most unique differentiator — zero competitors have multi-agent BFT governance. However, the gap table reveals that uniqueness is currently invisible. The live council status (Gap 1) and interactive demo (Gap 2) are the two highest-impact builds because they turn an abstract concept into a tangible experience. A visitor who simulates a vote and sees 33 agents reach consensus in real-time becomes a believer. The transparency page (Gap 4) is non-negotiable for governance credibility: without a public audit trail, the BFT Council is just a marketing claim. The hybrid Organization + GovernmentOrganization schema (Gap 3) is a strategic entity classification that helps AI search engines understand CSOAI's dual nature as both a standards body and a technical infrastructure provider.

### 2.3.2 Navigation: Governance-Focused 5-Item Nav

```html
<!-- councilof.ai: Governance-Focused 5-Item Navigation -->
<nav class="council-nav" role="navigation" aria-label="Primary">
  <div class="council-nav__container">
    <a href="/" class="council-nav__logo">
      <img src="{{LOGO_PATH}}" alt="Council of AI" width="150" height="32" />
    </a>
    <ul class="council-nav__menu">
      <li class="council-nav__item"><a href="/status" class="council-nav__link">Live Status</a></li>
      <li class="council-nav__item council-nav__item--has-dropdown">
        <button class="council-nav__link" aria-expanded="false">Governance <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></button>
        <ul class="council-nav__dropdown">
          <li><a href="/governance/bylaws">Bylaws</a></li>
          <li><a href="/governance/agents">Agent Registry</a></li>
          <li><a href="/governance/voting">Voting Process</a></li>
          <li><a href="/governance/appeals">Appeals</a></li>
        </ul>
      </li>
      <li class="council-nav__item"><a href="/votes" class="council-nav__link">Vote History</a></li>
      <li class="council-nav__item"><a href="/transparency" class="council-nav__link">Transparency</a></li>
      <li class="council-nav__item council-nav__item--has-dropdown">
        <button class="council-nav__link" aria-expanded="false">Ecosystem <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></button>
        <ul class="council-nav__dropdown">
          <li><a href="https://csoai.org">csoai.org</a></li>
          <li><a href="https://proofof.ai">proofof.ai</a></li>
          <li><a href="https://safetyof.ai">safetyof.ai</a></li>
          <li><a href="https://meok.ai">meok.ai</a></li>
        </ul>
      </li>
    </ul>
    <div class="council-nav__actions">
      <a href="/demo" class="council-btn council-btn--primary">Try the Demo</a>
    </div>
  </div>
</nav>
```

### 2.3.3 Hero: Live Council Status + Interactive Demo CTA

```html
<!-- councilof.ai: Live Council Status Hero -->
<section class="council-hero">
  <div class="council-hero__container">
    <div class="council-hero__status-bar">
      <span class="council-hero__pulse"></span>
      <span class="council-hero__status-text">Council Active — 33/33 Agents Online</span>
      <span class="council-hero__last-vote">Last vote: 2 minutes ago</span>
    </div>
    <h1 class="council-hero__title">33 Agents. One Consensus. Zero Trust Required.</h1>
    <p class="council-hero__subhead">
      The BFT Council governs AI certification through Byzantine Fault Tolerant multi-agent voting.
      Every decision is cryptographically signed, permanently auditable, and democratically reached.
    </p>
    <div class="council-hero__ctas">
      <a href="/demo" class="council-btn council-btn--primary council-btn--lg">Simulate a Vote</a>
      <a href="/governance" class="council-btn council-btn--secondary">How It Works</a>
    </div>
  </div>
</section>
```

```css
/* councilof.ai Hero — Live Status */
.council-hero {
  background: linear-gradient(160deg, #FAF8F5 0%, #E8ECE4 50%, #F0EBE3 100%);
  padding: 56px 24px 64px;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.council-hero__container { max-width: 800px; margin: 0 auto; }
.council-hero__status-bar {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #B5C4B1;
  padding: 10px 20px;
  border-radius: 100px;
  margin-bottom: 32px;
  font-size: 14px;
}
.council-hero__pulse {
  width: 10px;
  height: 10px;
  background: #2ECC71;
  border-radius: 50%;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}
.council-hero__status-text { font-weight: 600; color: #4A4238; }
.council-hero__last-vote { color: #A6A6A6; font-size: 13px; }
.council-hero__title { font-size: 44px; font-weight: 700; color: #4A4238; margin: 0 0 20px; line-height: 1.1; }
.council-hero__subhead { font-size: 18px; color: #9B8B7A; line-height: 1.6; margin: 0 0 32px; }
.council-hero__ctas { display: flex; gap: 14px; justify-content: center; }
.council-btn--primary { background: #8B7355; color: #fff; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500; text-decoration: none; border: 1px solid #8B7355; display: inline-block; }
.council-btn--primary:hover { background: #7A6548; }
.council-btn--secondary { background: transparent; color: #8B7355; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500; text-decoration: none; border: 1px solid #C4B7A6; display: inline-block; }
.council-btn--secondary:hover { background: #F5F0EB; }
```

### 2.3.4 Schema: Organization + GovernmentOrganization Hybrid JSON-LD

```html
<!-- councilof.ai: Organization + GovernmentOrganization Hybrid Schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "GovernmentOrganization"],
      "@id": "https://councilof.ai/#organization",
      "name": "Council of AI — BFT Governance Body",
      "alternateName": ["Council of AI", "BFT Council"],
      "url": "https://councilof.ai",
      "description": "The Council of AI is a Byzantine Fault Tolerant multi-agent governance body that oversees AI system certification through democratic 33-agent voting. Every decision is cryptographically signed with Ed25519 and permanently auditable.",
      "parentOrganization": { "@id": "https://csoai.org/#organization" },
      "knowsAbout": [
        "Byzantine Fault Tolerance",
        "Multi-Agent Governance",
        "AI Certification",
        "Ed25519 Cryptographic Signing",
        "Democratic AI Decision-Making"
      ],
      "member": {
        "@type": "OrganizationRole",
        "roleName": "Council Agent",
        "numberOfMembers": 33
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Governance Services",
        "itemListElement": [
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "AI System Certification Voting" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "HMAC Attestation Signing" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Compliance Appeals Review" } }
        ]
      }
    },
    {
      "@type": "FAQPage",
      "@id": "https://councilof.ai/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Byzantine Fault Tolerant governance?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Byzantine Fault Tolerance (BFT) is a distributed systems property that enables consensus even when some participants fail or act maliciously. The Council of AI uses BFT to ensure that certification decisions are reached reliably even if up to one-third of agents disagree or fail. This eliminates single points of failure and makes the governance process resilient."
          }
        },
        {
          "@type": "Question",
          "name": "How does the 33-agent voting process work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Each certification request is evaluated by 33 specialized AI agents, each running a different large language model. Agents independently analyze the submission, vote approve or reject, and sign their vote with Ed25519. When two-thirds consensus is reached, the decision is finalized and an HMAC-signed attestation is issued. The full vote record is published to the transparency log."
          }
        }
      ]
    }
  ]
}
</script>
```

### 2.3.5 Transparency Page: Vote History Explorer Spec

The transparency page is the trust anchor for the entire BFT Council. It must make every vote discoverable, verifiable, and permanently linked.

```html
<!-- councilof.ai: Vote History Explorer -->
<section class="council-votes" aria-label="Vote History">
  <header class="council-votes__header">
    <h2 class="council-votes__title">Council Vote History</h2>
    <p class="council-votes__subtitle">Every decision, permanently recorded and cryptographically signed.</p>
    <div class="council-votes__filters">
      <input type="date" class="council-votes__filter" aria-label="From date" />
      <input type="date" class="council-votes__filter" aria-label="To date" />
      <select class="council-votes__filter" aria-label="Filter by outcome">
        <option value="">All Outcomes</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="appealed">Under Appeal</option>
      </select>
      <input type="search" class="council-votes__filter council-votes__filter--search" placeholder="Search votes..." />
    </div>
  </header>

  <table class="council-votes__table">
    <thead>
      <tr>
        <th scope="col">ID</th>
        <th scope="col">Topic</th>
        <th scope="col">Date</th>
        <th scope="col">Vote</th>
        <th scope="col">Outcome</th>
        <th scope="col">Receipt</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>vote-2026-07-15-0842</code></td>
        <td><a href="/votes/vote-2026-07-15-0842">Certify postgres-mcp v2.1.0</a></td>
        <td>2026-07-15</td>
        <td><span class="vote-badge vote-badge--pass">33/33</span></td>
        <td><span class="outcome-badge outcome-badge--approved">Approved</span></td>
        <td><a href="/receipts/vote-2026-07-15-0842.sig" download>Download .sig</a></td>
      </tr>
      <!-- Additional vote rows -->
    </tbody>
  </table>

  <div class="council-votes__pagination">
    <button class="council-btn council-btn--ghost" disabled>← Previous</button>
    <span class="council-votes__page-info">Page 1 of 47</span>
    <button class="council-btn council-btn--ghost">Next →</button>
  </div>
</section>
```

---

## 2.4 safetyof.ai — "The Safety Score"

**Primary Audience**: AI safety researchers, model evaluators, enterprises assessing AI risk
**Conversion Goal**: Safety score lookup → research engagement → certification cross-sell
**Current State**: No score visualization, no benchmark preview, no cross-sell CTAs

### 2.4.1 Gap Table: 10 Priority Fixes with Severity and Effort

| # | Gap | Severity | Fix | Effort |
|---|-----|----------|-----|--------|
| 1 | No safety score visualization — core product is invisible | HIGH | Interactive score gauge + breakdown by dimension (fairness, robustness, transparency, accountability, safety) | 3 days |
 2 | No benchmark preview — researchers need comparison data | HIGH | Benchmark table: CSOAI Safety Score vs. HELM, MMLU, TruthfulQA with methodology note | 2 days |
 3 | No cross-sell CTAs after score display — missed certification conversion | HIGH | Post-score email CTA + "Get Certified" banner with contextual recommendation | 4h |
 4 | No Dataset + ResearchProject schema — missed academic citation | HIGH | Dataset schema for safety benchmarks, ResearchProject schema for ongoing evaluations | 3h |
 5 | No research-forward navigation — audience expects academic patterns | MEDIUM | 5-item nav: Scores, Benchmarks, Methodology, Research, About | 4h |
 6 | No hero with score lookup input — primary use case buried | MEDIUM | Hero with model name input + "Get Safety Score" CTA | 4h |
 7 | No FAQPage schema for safety methodology questions | MEDIUM | 10 safety-focused QAs (score calculation, benchmark selection, update frequency) | 3h |
 8 | No footer with ecosystem cross-links | LOW | Standard footer with research-specific links | 3h |
 9 | No comparison table vs. other safety benchmarks | LOW | Structured comparison: CSOAI vs. HELM vs. MMLU vs. TruthfulQA | 1 day |
 10 | No announcement banner — ecosystem consistency | LOW | Shared banner with safety research updates | 1h |

**Analytical Interpretation**: safetyof.ai serves the research community, which has distinct UX expectations: methodological transparency, reproducible benchmarks, and academic citation patterns. The score visualization (Gap 1) is the defining feature — without it, the domain's value proposition is opaque. The benchmark preview (Gap 2) establishes methodological credibility; researchers will not trust a safety score without knowing what it measures and how it compares to established benchmarks. The post-score cross-sell (Gap 3) is the primary commercial conversion path: a user who just looked up a safety score is primed to learn about certification. Dataset and ResearchProject schemas (Gap 4) are critical for academic discoverability — they enable Google Scholar, Semantic Scholar, and AI research engines to index CSOAI's safety work.

### 2.4.2 Navigation: Research-Forward 5-Item Nav

```html
<!-- safetyof.ai: Research-Forward 5-Item Navigation -->
<nav class="safety-nav" role="navigation" aria-label="Primary">
  <div class="safety-nav__container">
    <a href="/" class="safety-nav__logo">
      <img src="{{LOGO_PATH}}" alt="Safety of AI" width="140" height="32" />
    </a>
    <ul class="safety-nav__menu">
      <li class="safety-nav__item"><a href="/scores" class="safety-nav__link">Scores</a></li>
      <li class="safety-nav__item"><a href="/benchmarks" class="safety-nav__link">Benchmarks</a></li>
      <li class="safety-nav__item"><a href="/methodology" class="safety-nav__link">Methodology</a></li>
      <li class="safety-nav__item"><a href="/research" class="safety-nav__link">Research</a></li>
      <li class="safety-nav__item"><a href="/about" class="safety-nav__link">About</a></li>
    </ul>
    <div class="safety-nav__actions">
      <a href="https://proofof.ai/certification" class="safety-btn safety-btn--primary">Get Certified</a>
    </div>
  </div>
</nav>
```

### 2.4.3 Hero: Score Visualization + Benchmark Preview

```html
<!-- safetyof.ai: Score Lookup Hero -->
<section class="safety-hero">
  <div class="safety-hero__container">
    <h1 class="safety-hero__title">How Safe Is Your AI?</h1>
    <p class="safety-hero__subhead">Search 2,400+ evaluated models across 5 safety dimensions.</p>
    <form class="safety-hero__search" action="/scores" method="GET">
      <input
        type="search"
        name="model"
        class="safety-hero__input"
        placeholder="Enter model name (e.g., GPT-4, Claude 3, Llama 3)..."
        aria-label="Model name"
        autofocus
      />
      <button type="submit" class="safety-btn safety-btn--primary safety-btn--lg">Get Safety Score</button>
    </form>
    <p class="safety-hero__examples">Try: <a href="/scores?model=gpt-4">GPT-4</a>, <a href="/scores?model=claude-3">Claude 3</a>, <a href="/scores?model=llama-3">Llama 3</a></p>
  </div>
</section>
```

### 2.4.4 Post-Score Cross-Sell: Email CTA Templates

After a user views a safety score, three contextual CTAs appear based on the score range. This is the primary conversion surface on safetyof.ai.

```html
<!-- safetyof.ai: Post-Score Cross-Sell CTAs -->
<!-- Displayed after score lookup, below the score visualization -->
<section class="safety-cross-sell" aria-label="Recommended next steps">
  <!-- Template A: Score < 60 (Low safety) -->
  <div class="safety-cta safety-cta--urgent" data-score-range="0-60">
    <div class="safety-cta__icon">⚠️</div>
    <div class="safety-cta__content">
      <h3 class="safety-cta__title">This model scores below safety thresholds</h3>
      <p class="safety-cta__body">Get a detailed remediation report and certification pathway. Join 200+ organizations that improved their safety scores through CSOAI certification.</p>
      <form class="safety-cta__form" action="/api/lead" method="POST">
        <input type="email" name="email" placeholder="Work email" required class="safety-cta__input" />
        <input type="hidden" name="model" value="{{MODEL_NAME}}" />
        <input type="hidden" name="score" value="{{SCORE}}" />
        <button type="submit" class="safety-btn safety-btn--primary">Get Remediation Report</button>
      </form>
    </div>
  </div>

  <!-- Template B: Score 60-80 (Medium safety) -->
  <div class="safety-cta safety-cta--improve" data-score-range="60-80">
    <div class="safety-cta__icon">📈</div>
    <div class="safety-cta__content">
      <h3 class="safety-cta__title">Good foundation — certification can raise this further</h3>
      <p class="safety-cta__body">CSOAI certification addresses the gaps keeping this score from the top tier. See exactly what improvements would drive the biggest safety gains.</p>
      <a href="https://proofof.ai/certification?model={{MODEL_NAME}}&score={{SCORE}}" class="safety-btn safety-btn--primary">View Certification Path</a>
    </div>
  </div>

  <!-- Template C: Score > 80 (High safety) -->
  <div class="safety-cta safety-cta--excellent" data-score-range="80-100">
    <div class="safety-cta__icon">✓</div>
    <div class="safety-cta__content">
      <h3 class="safety-cta__title">Excellent safety profile — get it certified</h3>
      <p class="safety-cta__body">High-scoring models benefit most from formal certification. An Ed25519-signed attestation proves your safety claims to customers, regulators, and partners.</p>
      <a href="https://proofof.ai/certification/apply?model={{MODEL_NAME}}" class="safety-btn safety-btn--primary">Apply for Certification</a>
    </div>
  </div>
</section>
```

```css
/* safetyof.ai Cross-Sell CTAs */
.safety-cross-sell { max-width: 720px; margin: 40px auto; }
.safety-cta {
  display: flex;
  gap: 20px;
  padding: 28px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
.safety-cta--urgent { background: #FDF2F2; border: 1px solid #F5C6CB; }
.safety-cta--improve { background: #F5F0EB; border: 1px solid #C4B7A6; }
.safety-cta--excellent { background: #F0F5EE; border: 1px solid #B5C4B1; }
.safety-cta__icon { font-size: 28px; flex-shrink: 0; }
.safety-cta__title { font-size: 18px; font-weight: 600; color: #4A4238; margin: 0 0 8px; }
.safety-cta__body { font-size: 15px; color: #9B8B7A; line-height: 1.5; margin: 0 0 16px; }
.safety-cta__form { display: flex; gap: 10px; }
.safety-cta__input { flex: 1; padding: 10px 14px; border: 1px solid #C4B7A6; border-radius: 6px; font-size: 14px; }
```

### 2.4.5 Schema: Dataset + ResearchProject JSON-LD

```html
<!-- safetyof.ai: Dataset + ResearchProject Schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Dataset",
      "@id": "https://safetyof.ai/#dataset",
      "name": "CSOAI Safety Score Benchmark Dataset",
      "description": "Comprehensive safety evaluations of 2,400+ AI models across 5 dimensions: fairness, robustness, transparency, accountability, and safety. Updated monthly.",
      "url": "https://safetyof.ai/benchmarks",
      "license": "https://creativecommons.org/licenses/by/4.0/",
      "isAccessibleForFree": true,
      "creator": { "@id": "https://csoai.org/#organization" },
      "citation": "CSOAI Safety Score Benchmark (2026). Council for the Study of Optimized Intelligence.",
      "distribution": {
        "@type": "DataDownload",
        "contentUrl": "https://safetyof.ai/api/v1/benchmarks/download",
        "encodingFormat": "application/json",
        "datePublished": "2026-07-01"
      },
      "variableMeasured": [
        "Fairness (demographic parity, equalized odds)",
        "Robustness (adversarial resistance, distribution shift)",
        "Transparency (explainability, documentation completeness)",
        "Accountability (audit trail, human oversight)",
        "Safety (harm prevention, output filtering)"
      ],
      "temporalCoverage": "2024-01/2026-07",
      "spatialCoverage": "Global"
    },
    {
      "@type": "ResearchProject",
      "@id": "https://safetyof.ai/#research",
      "name": "CSOAI Safety Evaluation Research Program",
      "description": "Ongoing research program evaluating AI system safety through automated benchmarking, human review, and BFT Council governance. Produces the monthly CSOAI Safety Score updates.",
      "url": "https://safetyof.ai/research",
      "sponsor": { "@id": "https://csoai.org/#organization" },
      "status": "Active",
      "member": {
        "@type": "OrganizationRole",
        "roleName": "Research Contributor",
        "numberOfMembers": "{{RESEARCHER_COUNT}}"
      }
    }
  ]
}
</script>
```

---

## 2.5 meok.ai — "The Mothership"

**Primary Audience**: Ecosystem newcomers, investors, partners, press
**Conversion Goal**: Ecosystem understanding → site selection → engagement
**Current State**: Navigation overloaded (12+ items), no clear hierarchy, no ecosystem map

### 2.5.1 Gap Table: 10 Priority Fixes with Severity and Effort

| # | Gap | Severity | Fix | Effort |
|---|-----|----------|-----|--------|
| 1 | Navigation overloaded (12+ items) — cognitive overload for first-time visitors | HIGH | Consolidated 6-item nav: Ecosystem, Research, Technology, Governance, About, Join | 4h |
| 2 | No ecosystem map component — visitors cannot understand 5-site architecture | HIGH | Visual product interconnection diagram: 5 domains with relationship lines and descriptions | 2-3 days |
| 3 | No Organization (Parent) schema with subOrganization array | HIGH | Parent Organization schema listing all 5 sub-organizations with descriptive relationships | 2h |
| 4 | No hero with ecosystem positioning — "what is Meok?" unanswered | HIGH | Hero: "The Coordination Layer for Verifiable AI" + countdown timer for next milestone | 4h |
| 5 | No unified auth entry point — SSO promised but no visible login | MEDIUM | Central login portal with ecosystem site selector post-authentication | 3 days |
 6 | No FAQPage schema for ecosystem questions | MEDIUM | 10 QAs (what is Meok, site purposes, how sites connect, getting involved) | 3h |
 7 | No cross-site analytics dashboard — no visibility into ecosystem traffic | MEDIUM | Embedded analytics overview (public): total visitors, certification starts, council votes | 1 week |
 8 | No footer with ecosystem cross-links | LOW | Standard footer with all 5 domains + newsletter | 3h |
 9 | No announcement banner | LOW | Shared banner with ecosystem-wide announcements | 1h |
 10 | No Trust Center link aggregation — security docs scattered | LOW | Centralized security page linking to all site Trust Centers | 1 day |

**Analytical Interpretation**: meok.ai is the ecosystem's front door but currently functions as a confusing hallway. The overloaded navigation (Gap 1) is the most immediate fix — reducing 12+ items to 6 transforms the experience from overwhelming to navigable. The ecosystem map (Gap 2) is the defining visual element: a first-time visitor must understand "there are 5 sites, here's what each does, here's how they connect" within 5 seconds. The parent Organization schema (Gap 3) is critical for AI search engine entity consolidation — it tells crawlers that csoai.org, proofof.ai, councilof.ai, safetyof.ai, and meok.ai are not competitors but a single ecosystem. The hero countdown timer (Gap 4) creates urgency around governance milestones (next council vote, certification deadline, network expansion), giving visitors a reason to return.

### 2.5.2 Navigation: Consolidated 6-Item Nav (from 12+)

```html
<!-- meok.ai: Consolidated 6-Item Navigation -->
<nav class="meok-nav" role="navigation" aria-label="Primary">
  <div class="meok-nav__container">
    <a href="/" class="meok-nav__logo">
      <img src="{{LOGO_PATH}}" alt="Meok" width="100" height="32" />
    </a>
    <ul class="meok-nav__menu">
      <li class="meok-nav__item meok-nav__item--has-dropdown">
        <button class="meok-nav__link" aria-expanded="false">Ecosystem <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></button>
        <ul class="meok-nav__dropdown meok-nav__dropdown--ecosystem">
          <li><a href="https://csoai.org"><strong>csoai.org</strong><span>The Council — Governance &amp; Compliance</span></a></li>
          <li><a href="https://proofof.ai"><strong>proofof.ai</strong><span>MCP Catalogue &amp; Certification</span></a></li>
          <li><a href="https://councilof.ai"><strong>councilof.ai</strong><span>BFT Governance Body</span></a></li>
          <li><a href="https://safetyof.ai"><strong>safetyof.ai</strong><span>Safety Score &amp; Benchmarks</span></a></li>
        </ul>
      </li>
      <li class="meok-nav__item"><a href="/research" class="meok-nav__link">Research</a></li>
      <li class="meok-nav__item"><a href="/technology" class="meok-nav__link">Technology</a></li>
      <li class="meok-nav__item"><a href="/governance" class="meok-nav__link">Governance</a></li>
      <li class="meok-nav__item"><a href="/about" class="meok-nav__link">About</a></li>
      <li class="meok-nav__item"><a href="/join" class="meok-nav__link">Join</a></li>
    </ul>
    <div class="meok-nav__actions">
      <a href="/login" class="meok-btn meok-btn--ghost">Log In</a>
      <a href="/get-started" class="meok-btn meok-btn--primary">Get Started</a>
    </div>
  </div>
</nav>
```

### 2.5.3 Hero: Countdown Timer + Sovereign AI Messaging

```html
<!-- meok.ai: Countdown Hero + Ecosystem Positioning -->
<section class="meok-hero">
  <div class="meok-hero__container">
    <div class="meok-hero__countdown" aria-label="Next council vote countdown">
      <span class="meok-hero__countdown-label">Next BFT Council Vote</span>
      <div class="meok-hero__timer" id="countdown-timer">
        <span class="meok-hero__timer-unit"><strong id="cd-days">03</strong> days</span>
        <span class="meok-hero__timer-unit"><strong id="cd-hours">14</strong> hrs</span>
        <span class="meok-hero__timer-unit"><strong id="cd-minutes">22</strong> min</span>
      </div>
    </div>
    <h1 class="meok-hero__title">The Coordination Layer for Verifiable AI</h1>
    <p class="meok-hero__subhead">
      Meok connects 5 specialized domains into a single ecosystem for AI governance,
      certification, and safety. Ed25519-signed. BFT-governed. Fully transparent.
    </p>
    <div class="meok-hero__ctas">
      <a href="#ecosystem-map" class="meok-btn meok-btn--primary meok-btn--lg">Explore the Ecosystem</a>
      <a href="/technology" class="meok-btn meok-btn--secondary">How It Works</a>
    </div>
  </div>
</section>
```

```css
/* meok.ai Hero — Countdown Timer */
.meok-hero {
  background: linear-gradient(135deg, #4A4238 0%, #8B7355 50%, #9B8B7A 100%);
  color: #fff;
  padding: 72px 24px 64px;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.meok-hero__container { max-width: 800px; margin: 0 auto; }
.meok-hero__countdown {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(8px);
  padding: 16px 32px;
  border-radius: 12px;
  margin-bottom: 32px;
}
.meok-hero__countdown-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 8px; }
.meok-hero__timer { display: flex; gap: 20px; }
.meok-hero__timer-unit { text-align: center; }
.meok-hero__timer-unit strong { display: block; font-size: 32px; font-weight: 700; line-height: 1; }
.meok-hero__timer-unit span { font-size: 12px; opacity: 0.7; }
.meok-hero__title { font-size: 44px; font-weight: 700; margin: 0 0 20px; line-height: 1.1; }
.meok-hero__subhead { font-size: 18px; line-height: 1.6; opacity: 0.9; margin: 0 0 32px; max-width: 560px; margin-left: auto; margin-right: auto; }
.meok-hero__ctas { display: flex; gap: 14px; justify-content: center; }
.meok-btn--primary { background: #D4C4B0; color: #4A4238; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; text-decoration: none; border: none; display: inline-block; }
.meok-btn--primary:hover { background: #C4B7A6; }
.meok-btn--secondary { background: transparent; color: #D4C4B0; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500; text-decoration: none; border: 1px solid rgba(212,196,176,0.4); display: inline-block; }
.meok-btn--secondary:hover { background: rgba(255,255,255,0.08); }
```

```javascript
// meok.ai: Countdown Timer
(function() {
  // Set target: next Friday at 14:00 UTC (example cadence)
  function getNextVoteDate() {
    const now = new Date();
    const day = now.getUTCDay();
    const daysUntilFriday = (5 - day + 7) % 7 || 7;
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilFriday, 14, 0, 0));
    return next;
  }

  function updateTimer() {
    const diff = getNextVoteDate() - Date.now();
    if (diff <= 0) return;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    document.getElementById('cd-days').textContent = String(d).padStart(2, '0');
    document.getElementById('cd-hours').textContent = String(h).padStart(2, '0');
    document.getElementById('cd-minutes').textContent = String(m).padStart(2, '0');
  }
  updateTimer();
  setInterval(updateTimer, 60000);
})();
```

### 2.5.4 Schema: Organization (Parent) with subOrganization Array JSON-LD

```html
<!-- meok.ai: Parent Organization Schema with subOrganization Array -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://meok.ai/#organization",
      "name": "Meok — Coordination Layer for Verifiable AI",
      "alternateName": ["Meok", "Meok AI"],
      "url": "https://meok.ai",
      "logo": {
        "@type": "ImageObject",
        "url": "https://meok.ai/assets/logo-112x112.png",
        "width": 112,
        "height": 112
      },
      "description": "Meok is the coordination layer that connects CSOAI's five specialized domains — governance, certification, safety, and research — into a single ecosystem for verifiable AI compliance.",
      "foundingDate": "2024",
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "General Inquiries",
          "email": "hello@meok.ai"
        }
      ],
      "sameAs": [
        "https://www.linkedin.com/company/meok-ai",
        "https://twitter.com/meok_ai"
      ],
      "subOrganization": [
        {
          "@type": "Organization",
          "@id": "https://csoai.org/#organization",
          "name": "CSOAI — Council for the Study of Optimized Intelligence",
          "description": "Primary governance and compliance domain. EU AI Act guides, framework checker, certification engine.",
          "url": "https://csoai.org"
        },
        {
          "@type": "Organization",
          "@id": "https://proofof.ai/#organization",
          "name": "Proof of Agency — MCP Certification Platform",
          "description": "MCP server catalog with 294 verified servers. HMAC-signed attestations, developer SDKs, certification platform.",
          "url": "https://proofof.ai"
        },
        {
          "@type": "Organization",
          "@id": "https://councilof.ai/#organization",
          "name": "Council of AI — BFT Governance Body",
          "description": "33-agent Byzantine Fault Tolerant governance council. Democratic AI decision-making with cryptographic audit trails.",
          "url": "https://councilof.ai"
        },
        {
          "@type": "Organization",
          "@id": "https://safetyof.ai/#organization",
          "name": "Safety of AI — Safety Score & Benchmarks",
          "description": "AI safety evaluation platform with 2,400+ model benchmarks across 5 safety dimensions.",
          "url": "https://safetyof.ai"
        }
      ],
      "knowsAbout": [
        "AI Ecosystem Coordination",
        "Verifiable AI Compliance",
        "Multi-Domain Governance",
        "Cryptographic Trust Infrastructure"
      ]
    }
  ]
}
</script>
```

### 2.5.5 Ecosystem Map Component: Visual Product Interconnection

The ecosystem map is the centerpiece of meok.ai. It must communicate the relationship between five domains in a single glance.

```html
<!-- meok.ai: Ecosystem Map Component -->
<section class="meok-map" id="ecosystem-map" aria-label="CSOAI Ecosystem Map">
  <div class="meok-map__container">
    <header class="meok-map__header">
      <h2 class="meok-map__title">One Ecosystem. Five Domains.</h2>
      <p class="meok-map__subtitle">Every domain is connected through shared identity, governance, and trust.</p>
    </header>

    <div class="meok-map__diagram">
      <!-- Center: Meok -->
      <div class="meok-map__center">
        <div class="meok-map__node meok-map__node--center">
          <span class="meok-map__node-label">Meok</span>
          <span class="meok-map__node-desc">Coordination Layer</span>
        </div>
      </div>

      <!-- Surrounding: 4 domains -->
      <div class="meok-map__orbit">
        <a href="https://csoai.org" class="meok-map__node meok-map__node--satellite meok-map__node--csoai">
          <span class="meok-map__node-label">csoai.org</span>
          <span class="meok-map__node-desc">Governance &amp; Compliance</span>
          <span class="meok-map__node-stat">EU AI Act Guides</span>
        </a>
        <a href="https://proofof.ai" class="meok-map__node meok-map__node--satellite meok-map__node--proofof">
          <span class="meok-map__node-label">proofof.ai</span>
          <span class="meok-map__node-desc">MCP Certification</span>
          <span class="meok-map__node-stat">294 Servers</span>
        </a>
        <a href="https://councilof.ai" class="meok-map__node meok-map__node--satellite meok-map__node--council">
          <span class="meok-map__node-label">councilof.ai</span>
          <span class="meok-map__node-desc">BFT Governance</span>
          <span class="meok-map__node-stat">33 Agents</span>
        </a>
        <a href="https://safetyof.ai" class="meok-map__node meok-map__node--satellite meok-map__node--safety">
          <span class="meok-map__node-label">safetyof.ai</span>
          <span class="meok-map__node-desc">Safety Scores</span>
          <span class="meok-map__node-stat">2,400+ Models</span>
        </a>
      </div>

      <!-- Connection lines (SVG overlay) -->
      <svg class="meok-map__connections" viewBox="0 0 600 400" aria-hidden="true">
        <line x1="300" y1="200" x2="150" y2="100" stroke="#C4B7A6" stroke-width="1.5" stroke-dasharray="6,4"/>
        <line x1="300" y1="200" x2="450" y2="100" stroke="#C4B7A6" stroke-width="1.5" stroke-dasharray="6,4"/>
        <line x1="300" y1="200" x2="150" y2="300" stroke="#C4B7A6" stroke-width="1.5" stroke-dasharray="6,4"/>
        <line x1="300" y1="200" x2="450" y2="300" stroke="#C4B7A6" stroke-width="1.5" stroke-dasharray="6,4"/>
        <!-- Inter-satellite connections -->
        <line x1="150" y1="100" x2="450" y2="100" stroke="#B5C4B1" stroke-width="1" opacity="0.4"/>
        <line x1="450" y1="100" x2="450" y2="300" stroke="#B5C4B1" stroke-width="1" opacity="0.4"/>
        <line x1="450" y1="300" x2="150" y2="300" stroke="#B5C4B1" stroke-width="1" opacity="0.4"/>
        <line x1="150" y1="300" x2="150" y2="100" stroke="#B5C4B1" stroke-width="1" opacity="0.4"/>
      </svg>
    </div>

    <!-- Shared identity callout -->
    <div class="meok-map__identity">
      <span class="meok-map__identity-icon">
        <svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 1l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z" fill="#8B7355"/></svg>
      </span>
      <span class="meok-map__identity-text">Unified by Ed25519 identity — one cryptographic key, all five domains.</span>
      <a href="/technology/identity" class="meok-map__identity-link">Learn more →</a>
    </div>
  </div>
</section>
```

```css
/* meok.ai Ecosystem Map */
.meok-map { padding: 80px 24px; background: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
.meok-map__container { max-width: 960px; margin: 0 auto; }
.meok-map__header { text-align: center; margin-bottom: 48px; }
.meok-map__title { font-size: 32px; font-weight: 700; color: #4A4238; margin: 0 0 12px; }
.meok-map__subtitle { font-size: 16px; color: #9B8B7A; margin: 0; }
.meok-map__diagram { position: relative; width: 100%; max-width: 600px; height: 400px; margin: 0 auto; }
.meok-map__center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2; }
.meok-map__node { display: flex; flex-direction: column; align-items: center; text-align: center; text-decoration: none; border-radius: 12px; transition: all 0.2s; }
.meok-map__node--center { background: #8B7355; color: #fff; padding: 20px 32px; box-shadow: 0 4px 20px rgba(139,115,85,0.3); }
.meok-map__node-label { font-size: 18px; font-weight: 700; }
.meok-map__node-desc { font-size: 12px; opacity: 0.8; margin-top: 2px; }
.meok-map__orbit { position: absolute; width: 100%; height: 100%; }
.meok-map__node--satellite {
  position: absolute;
  background: #fff;
  border: 2px solid #C4B7A6;
  padding: 16px 20px;
  width: 140px;
  color: #4A4238;
}
.meok-map__node--satellite:hover { border-color: #8B7355; box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-2px); }
.meok-map__node--csoai { top: 40px; left: 40px; }
.meok-map__node--proofof { top: 40px; right: 40px; }
.meok-map__node--council { bottom: 40px; left: 40px; }
.meok-map__node--safety { bottom: 40px; right: 40px; }
.meok-map__node-stat { font-size: 11px; color: #8B7355; font-weight: 600; margin-top: 6px; }
.meok-map__connections { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
.meok-map__identity {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 40px;
  padding: 16px 24px;
  background: #fff;
  border: 1px solid #C4B7A6;
  border-radius: 8px;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
  font-size: 14px;
  color: #9B8B7A;
}
.meok-map__identity-link { color: #8B7355; font-weight: 500; text-decoration: none; }
.meok-map__identity-link:hover { text-decoration: underline; }
@media (max-width: 640px) {
  .meok-map__diagram { height: auto; display: flex; flex-direction: column; gap: 16px; }
  .meok-map__center, .meok-map__orbit { position: static; transform: none; }
  .meok-map__node--satellite { position: static; width: auto; }
  .meok-map__connections { display: none; }
}
```

---

*Chapter 2 provides production-ready implementations for all five CSOAI ecosystem sites. Every code block has been validated for syntax correctness and is designed for immediate deployment with `{{PLACEHOLDER}}` substitution. The 50 gaps identified across all sites should be addressed in priority order within Sprint 1 (Days 1-14) of the 90-day roadmap. Chapter 3 covers the complete build specifications for new pages — comparison pages, Trust Center, assessment tools, and developer portal — that these implementations reference.*


---

## 3. Missing Pages — Complete Build Specs

Every competitive gap maps to a specific page. This chapter provides production-ready build specifications for 12 critical pages — each with ASCII wireframe, meta description, H1/CTA copy pair, schema.org assignment, and implementation checklist.

---

### 3.1 /trust-center — Trust & Security Page

Vanta's trust center includes real-time control evidence, subprocessor lists, and FAQ [^84^]. CSOAI must match this baseline and exceed it with live verification data.

#### 3.1.1 Wireframe

```
+------------------------------------------------------------------+
|  H1: Trust is Verifiable                                         |
|  Sub: Real-time compliance evidence from 294 verification servers|
+------------------------------------------------------------------+
|  STATS: [SOC 2 In Progress] [ISO 27001 Planned] [294 Servers]    |
|  [Ed25519 Active] [BFT Council: 33 Agents]                       |
+------------------------------------------------------------------+
|  H2: Security Certifications (2-col)                             |
|  SOC 2 Type II -- Q4 2026    ISO 27001 -- Q1 2027               |
|  EU AI Act Art 12 -- Active  GDPR -- Active                      |
+------------------------------------------------------------------+
|  H2: Governed by Council, Not a Single Model                     |
|  [BFT voting diagram]  CTA: "View Live Council Votes →"          |
+------------------------------------------------------------------+
|  H2: Subprocessors [Sortable table: Vendor|Purpose|Location|SOC2] |
+------------------------------------------------------------------+
|  H2: Compliance Resources                                        |
|  [Pen Test Summary] [DPA Template] [VDP] security@csoai.org      |
+------------------------------------------------------------------+
|  CTA: "Download Security Whitepaper" [Email] [Get]               |
+------------------------------------------------------------------+
```

#### 3.1.2 Copy Template

| Element | Copy |
|---------|------|
| **Title tag** | `Trust Center — CSOAI Security, Compliance & Governance` |
| **Meta description** | `Verify CSOAI's security posture: 294 verification servers, Ed25519 cryptographic signing, BFT council governance, SOC 2/ISO 27001 roadmap. Download our security whitepaper.` |
| **H1** | Trust is Verifiable |
| **H2s** | Security Certifications / Governance by Distributed Council / Subprocessors / Compliance Resources |
| **Primary CTA** | Download Security Whitepaper |
| **Secondary CTA** | View Live Council Votes → |
| **Trust bar** | `294 servers • Ed25519 signing • 33-agent BFT council • EU AI Act aligned` |

#### 3.1.3 Schema: Organization + SecurityPolicy

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {"@type": "Organization", "@id": "https://csoai.org/#organization",
     "name": "CSOAI", "description": "AI certification authority with BFT council governance"},
    {"@type": "SecurityPolicy", "@id": "https://csoai.org/trust-center#policy",
     "publisher": {"@id": "https://csoai.org/#organization"},
     "about": {"@type": "Thing", "name": "SOC 2 Type II", "description": "In progress, target Q4 2026"}}
  ]
}
```

#### 3.1.4 Implementation Checklist

| # | Item | Owner |
|---|------|-------|
| 1 | Add Organization `@id` linking to parent meok.ai entity | Dev |
| 2 | Display SOC 2 status badge (Q4 2026) | Compliance |
| 3 | Display ISO 27001 status badge (Q1 2027) | Compliance |
| 4 | Implement live server count API | Dev |
| 5 | Build sortable subprocessor table | Dev |
| 6 | Create security whitepaper PDF (8-12 pages) | Content |
| 7 | Write Vulnerability Disclosure Policy | Security |
| 8 | Add DPA template download | Legal |
| 9 | Embed BFT council diagram (SVG, animated) | Design |
| 10 | Add FAQPage schema with 8 Q&A pairs | SEO |
| 11 | Link to /transparency for vote history | Dev |
| 12 | Set HTTP Last-Modified header | Dev |

---

### 3.2 /pricing — Transparent Pricing Page

Arthur.ai is the only competitor with transparent pricing ($0/$60/Custom) [^75^]. CSOAI must exceed this with public pricing for all tiers.

#### 3.2.1 Wireframe

```
+------------------------------------------------------------------+
|  H1: Simple, Transparent Pricing for AI Governance               |
|  [Monthly] [Annual -- Save 20%] toggle                           |
+------------------------------------------------------------------+
|  ESSENTIAL £199 | PRO £999 | ENTERPRISE £1,499 | SOVEREIGN £4,950|
|  • EU AI Act    | • All in   | • All in Pro    | • Custom Council|
|  • Basic cert   |   Essential| • BFT Council   | • Full BFT Gov  |
|  • Email supp   | • ISO 42001| • CSM + SLA     | • On-prem       |
|  [Get Started]  | • NIST RMF | [Talk to Sales] | [Contact]       |
|  +----------------+----------------+----------------+------------+
|  FEATURE MATRIX (25 rows): Feature | Ess | Pro | Ent | Sov      |
|  EU AI Act Gap | ✓✓✓✓  Ed25519 | --✓✓✓  ISO 42001 | --✓✓✓ ... |
+------------------------------------------------------------------+
|  BANNER: "Need custom? Contact enterprise@csoai.org"             |
+------------------------------------------------------------------+
```

#### 3.2.2 Copy Template

| Element | Copy |
|---------|------|
| **Title tag** | `Pricing — CSOAI AI Governance Certification Tiers` |
| **Meta description** | `CSOAI pricing from £199/month. EU AI Act, ISO 42001, and NIST RMF certification tiers with Ed25519 signing and BFT council governance.` |
| **H1** | Simple, Transparent Pricing for AI Governance |
| **H2** | Compare Certification Tiers |
| **Tiers** | Essential £199 / Professional £999 / Enterprise £1,499 / Sovereign £4,950 |
| **Primary CTA** | Get Started (Essential/Pro) / Talk to Sales (Enterprise/Sovereign) |
| **Secondary CTA** | Take Free AI Governance Assessment → |

#### 3.2.3 Schema: PriceSpecification + Offer

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "CSOAI Governance Network",
  "applicationCategory": "BusinessApplication",
  "offers": [
    {"@type": "Offer", "name": "Essential", "price": "199", "priceCurrency": "GBP"},
    {"@type": "Offer", "name": "Professional", "price": "999", "priceCurrency": "GBP"},
    {"@type": "Offer", "name": "Enterprise", "price": "1499", "priceCurrency": "GBP"}
  ]
}
```

#### 3.2.4 Bundle Pricing Table

The Sovereign tier maps to the MEOK Universe bundle:

| Component | Standalone | Bundle |
|-----------|-----------|--------|
| csoai.org certification | £999/mo | Included |
| councilof.ai governance | £500/mo | Included |
| proofof.ai verification | £499/mo | Included |
| safetyof.ai risk | £499/mo | Included |
| meok.ai coordination | £499/mo | Included |
| **Total** | **£2,996/mo** | **£4,950/mo** (custom SLA + on-prem) |

#### 3.2.5 Implementation Checklist

| # | Item | Owner |
|---|------|-------|
| 1 | Implement monthly/annual toggle with 20% discount | Dev |
| 2 | Build 4-tier card layout with "Most Popular" badge | Dev |
| 3 | Create 25-row feature matrix | Dev |
| 4 | Deploy SoftwareApplication + PriceSpecification schema | SEO |
| 5 | Add FAQPage schema with 6 pricing Q&A pairs | SEO |
| 6 | Integrate Stripe checkout for Essential + Professional | Dev |
| 7 | Build "Talk to Sales" form for Enterprise + Sovereign | Dev |
| 8 | Add MEOK Universe bundle table (expandable) | Dev |
| 9 | Write price comparison copy | Content |
| 10 | Add trust badges: "30-day refund • No setup fees" | Content |

---

### 3.3 /compare — Comparison Hub

Drata operates 10+ comparison pages with feature grids and G2 callouts [^118^]. CSOAI needs equivalent pages against all 4 competitors.

#### 3.3.1 Wireframe

```
+------------------------------------------------------------------+
|  H1: CSOAI vs Vanta: AI-Native Governance vs Legacy Compliance  |
|  Breadcrumb: Home > Compare > Vanta                              |
+------------------------------------------------------------------+
|  CSOAI: 294 servers, BFT council, Ed25519, G2: N/A               |
|  Vanta: 16,000+ customers, SOC 2/ISO 27001, G2: 4.6/5 [^125^]  |
+------------------------------------------------------------------+
|  H2: Why Switch [Cryptographic Verification] [Council Gov]       |
|  [Transparent Pricing]                                            |
+------------------------------------------------------------------+
|  H2: Feature Comparison (25 rows)                                |
|  Feature | CSOAI | V | D | A | C                                 |
|  BFT Gov | ✓ | ✗ | ✗ | ✗ | ✗  Ed25519 | ✓ | ✗ | ✗ | ✗ | ✗        |
|  Public Verify | ✓ | P | P | ✗ | ✗  Trans. Price | ✓ | ✗ | ✗ | ✓ | ✗ |
|  ... (18 more rows)                                               |
+------------------------------------------------------------------+
|  CTA: [Start Free Assessment] [Talk to Sales]                    |
+------------------------------------------------------------------+
```

#### 3.3.2 Copy Template

| Element | Copy Pattern |
|---------|-------------|
| **Title tag** | `CSOAI vs {{COMPETITOR}}: AI Governance Comparison 2026` |
| **Meta description** | `Compare CSOAI and {{COMPETITOR}}. BFT council governance, Ed25519 signing, 294 verification servers vs legacy compliance. Side-by-side feature comparison.` |
| **H1** | `CSOAI vs {{COMPETITOR}}: {{ADVANTAGE}}` |
| **H2s** | Why Switch / Feature Comparison / What CSOAI Offers That {{COMPETITOR}} Does Not |
| **Primary CTA** | Start Free AI Governance Assessment |
| **Secondary CTA** | Talk to a Governance Advisor |

Child pages: `/compare/vanta` — "Cryptographic Governance vs Legacy Compliance"; `/compare/drata` — "Decentralized Trust vs Centralized GRC"; `/compare/credo-ai` — "Verifiable Governance vs Black-Box Scoring"; `/compare/arthur-ai` — "Council-Based Monitoring vs Single-Model Observability".

#### 3.3.3 Feature Matrix: 25 Rows

| # | Feature | CSOAI | V | D | A | C |
|---|---------|-------|---|---|---|---|
| 1 | BFT multi-agent governance | ✓ | ✗ | ✗ | ✗ | ✗ |
| 2 | Ed25519 cryptographic signing | ✓ | ✗ | ✗ | ✗ | ✗ |
| 3 | Public certificate verification | ✓ | P | P | ✗ | ✗ |
| 4 | 294-server verification network | ✓ | ✗ | ✗ | ✗ | ✗ |
| 5 | Transparent public pricing | ✓ | ✗ | ✗ | ✓ [^75^] | ✗ |
| 6 | EU AI Act specialist focus | ✓ | P | P | P | ✓ |
| 7 | ISO 42001 certification path | ✓ | ✓ | ✓ | ✗ | ✓ |
| 8 | MCP protocol integration | ✓ | ✗ | ✓ [^99^] | ✗ | ✗ |
| 9 | Open-source components | P | ✗ | ✗ | ✓ [^85^] | ✗ |
| 10 | Developer portal | Basic | Basic | Adv | Strong [^25^] | Min |
| 11 | Free tier | Assess | ✗ | ✗ | ✓ | Sandbox |
| 12 | Council vote transparency | ✓ | ✗ | ✗ | ✗ | ✗ |
| 13 | HMAC-signed audit trails | ✓ | ✗ | ✗ | ✗ | ✗ |
| 14 | Blockchain attestation | ✓ | ✗ | ✗ | ✗ | ✗ |
| 15 | G2 rating | N/A | 4.6 [^125^] | 4.8 [^78^] | N/A | N/A |
| 16 | Analyst badges | None | G2 | G2 | None | F+G [^81^] |
| 17 | Multi-site ecosystem | ✓ (5) | ✗ | ✗ | ✗ | ✗ |
| 18 | AI readiness assessment | ✓ | Tmpl | Tmpl | ✗ | ✓ [^92^] |
| 19 | Webinar series | Plan | ✓ [^100^] | ✓ | Lim | ✓ |
| 20 | Comparison pages | This | ✓ [^86^] | ✓ [^118^] | ✗ | ✗ |
| 21 | SOC 2 badge | Plan | ✓ | ✓ | ✓ | ✓ |
| 22 | ISO 27001 badge | Plan | ✓ | ✓ | ✗ | ✓ |
| 23 | Dark mode | Plan | ✗ | ✓ | ✓ | ✓ |
| 24 | API access | Plan | ✓ | ✓ [^95^] | ✓ | Lim |
| 25 | 24/7 support | Ent+ | Ent | Ent | Ent | Ent |

#### 3.3.4 Schema: Table + FAQPage

```json
{"@context": "https://schema.org", "@type": "Table",
 "about": "Feature comparison between CSOAI and competitors",
 "tableBody": {"@type": "TableRow",
  "row": ["Feature", "CSOAI", "Vanta", "Drata", "Arthur.ai", "Credo AI"]}}
```

#### 3.3.5 Implementation Checklist

| # | Item | Owner |
|---|------|-------|
| 1 | Build reusable comparison template for 4 competitors | Dev |
| 2 | Populate 25-row matrix with accurate data | Content |
| 3 | Write competitor-specific H2 copy | Content |
| 4 | Deploy Table + FAQPage schema | SEO |
| 5 | Add BreadcrumbList schema | SEO |
| 6 | Link comparison pages from /pricing and homepage | Dev |
| 7 | Create "Why Switch" migration copy | Content |
| 8 | Add anonymized testimonials | Content |
| 9 | Include G2 rating callouts | Content |
| 10 | Set canonical URL per page | SEO |

---

### 3.4 /verify — Public Certificate Verification

No competitor offers public certificate verification with cryptographic proof.

#### 3.4.1 Wireframe

```
+------------------------------------------------------------------+
|  H1: Verify Any CSOAI Certification                              |
|  Sub: Enter a certificate ID to verify its cryptographic proof   |
+------------------------------------------------------------------+
|  [__________________________] [Verify Certificate]               |
|  Or paste Ed25519 public key: [________________] [Verify Key]    |
+------------------------------------------------------------------+
|  RESULT: CERT-2026-8F3D...  Status: VALID (Agent #17)            |
|  Org: {{ORG}}  Standard: EU AI Act High-Risk                     |
|  Ed25519 Key: 0x8f3d...  Signature: 0x2a4f...                   |
|  [Download PDF] [View on Blockchain]                             |
+------------------------------------------------------------------+
|  HOW IT WORKS: Council votes → Ed25519 signs → You verify        |
|  POST-VERIFY: "Need certification?" [Start Assessment]           |
+------------------------------------------------------------------+
```

#### 3.4.2 Copy Template

| Element | Copy |
|---------|------|
| **Title tag** | `Verify CSOAI Certification — Public Certificate Lookup` |
| **Meta description** | `Verify any CSOAI certificate in seconds. Enter a certificate ID to view its Ed25519 cryptographic signature and blockchain attestation.` |
| **H1** | Verify Any CSOAI Certification |
| **H2s** | How Verification Works / Understanding Results / FAQ |
| **Primary CTA** | Verify Certificate |
| **Post-verify CTA** | Get Your AI System Certified → |

#### 3.4.3 Schema: HowTo + FAQPage

```json
{"@context": "https://schema.org", "@type": "HowTo",
 "name": "Verify a CSOAI Certificate",
 "step": [
  {"@type": "HowToStep", "name": "Enter Certificate ID",
   "text": "Type the certificate ID into the lookup field."},
  {"@type": "HowToStep", "name": "Retrieve Cryptographic Proof",
   "text": "The system fetches the Ed25519 signature and HMAC attestation."},
  {"@type": "HowToStep", "name": "Confirm Validity",
   "text": "Verify the certificate status and blockchain record."}]}
```

#### 3.4.4 Post-Verify Cross-Sell CTA

| Verified Standard | Cross-Sell CTA |
|-------------------|----------------|
| EU AI Act High-Risk | "Assess your compliance → Start Free Assessment" |
| ISO 42001 | "Get certified → View Pricing" |
| BFT Council | "Join the Council → Apply" |
| MCP Server | "Verify your server → Submit to Catalog" |

#### 3.4.5 Implementation Checklist

| # | Item | Owner |
|---|------|-------|
| 1 | Build certificate lookup API (GET /api/v1/verify/{certId}) | Dev |
| 2 | Implement Ed25519 signature verification | Dev |
| 3 | Design result card with status, key, signature | Dev |
| 4 | Add 3-step explainer with icons | Design |
| 5 | Deploy HowTo + FAQPage schema | SEO |
| 6 | Build cross-sell module with 4 contextual CTAs | Dev |
| 7 | Add "Download Attestation PDF" | Dev |
| 8 | Link "View on Blockchain" to Proof of AI explorer | Dev |
| 9 | Pre-fill example certificate on page load | Dev |
| 10 | Set up analytics for verify queries | Analytics |

---

### 3.5 /transparency — Council Vote History

No competitor publishes governance vote history. This page makes BFT council decision-making auditable.

#### 3.5.1 Wireframe

```
+------------------------------------------------------------------+
|  H1: Audit-Ready Council Transparency                            |
|  Sub: Every vote by the 33-agent BFT Council, cryptographically  |
|  signed and published in real time                                |
+------------------------------------------------------------------+
|  [All Votes] [Certifications] [Policy Changes] [Appeals]         |
|  [Date range] [Export CSV]                                       |
+------------------------------------------------------------------+
|  Vote ID | Date | Agent Panel | Topic | Result | Signature       |
|  V-2047  | 07-14| #3,#8,#12  | Certify Acme HR AI | PASS | 0x3f..|
|  V-2046  | 07-13| #1,#7,#22  | Policy: GPAI threshold | PASS | 0x8e..|
|  V-2045  | 07-12| #5,#9,#31  | Appeal #AP-089 | FAIL | 0x2c..    |
|  ... (paginated, 50 per page)                                     |
+------------------------------------------------------------------+
|  STATS: Total: 2,047 | Pass Rate: 94.2% | Avg: 4.3min           |
|  CTA: "Join the Council of AI →"                                 |
+------------------------------------------------------------------+
```

#### 3.5.2 Copy Template

| Element | Copy |
|---------|------|
| **Title tag** | `Council Transparency — BFT Vote History & Governance` |
| **Meta description** | `Audit every decision by the 33-agent BFT Council. Filterable vote history with Ed25519 signatures and real-time results.` |
| **H1** | Audit-Ready Council Transparency |
| **H2s** | Recent Council Votes / Governance Statistics / How Voting Works |
| **Primary CTA** | Join the Council of AI |
| **Secondary CTA** | Download Full Audit Log (CSV) |

#### 3.5.3 Schema: Dataset + GovernmentOrganization

```json
{"@context": "https://schema.org", "@graph": [
  {"@type": "GovernmentOrganization", "@id": "https://councilof.ai/#organization",
   "name": "Council of AI", "description": "33-agent BFT governance council"},
  {"@type": "Dataset", "name": "BFT Council Vote History",
   "publisher": {"@id": "https://councilof.ai/#organization"},
   "temporalCoverage": "2025-01-01/.."}
]}
```

#### 3.5.4 Implementation Checklist

| # | Item | Owner |
|---|------|-------|
| 1 | Build vote history API with pagination and filtering | Dev |
| 2 | Implement 4-category filter tabs | Dev |
| 3 | Create sortable table | Dev |
| 4 | Add CSV export | Dev |
| 5 | Display aggregate stats | Dev |
| 6 | Deploy Dataset + GovernmentOrganization schema | SEO |
| 7 | Link votes to detail pages | Dev |
| 8 | Add date range filter | Dev |
| 9 | Write "How Voting Works" with BFT diagram | Content |
| 10 | Set up WebSocket streaming for live updates | Dev |

---

### 3.6 /ecosystem — Product Interconnection Map

CSOAI operates 5 interconnected domains — no competitor has this architecture [^6^]. This page transforms fragmentation into demonstrated ecosystem breadth.

#### 3.6.1 Wireframe

```
+------------------------------------------------------------------+
|  H1: The CSOAI Ecosystem                                         |
|  Sub: Five domains. One governance layer. Zero fragmentation.    |
+------------------------------------------------------------------+
|  [meok.ai] Coordination Layer                                     |
|     /        |        \                                          |
| [csoai.org] [councilof.ai] [proofof.ai] [safetyof.ai]            |
| Certification  Governance   Verification   Risk Assessment       |
|  Click any domain to expand details                               |
+------------------------------------------------------------------+
|  csoai.org: Cert authority for EU AI Act, ISO 42001 [Explore →]  |
|  councilof.ai: BFT Council 33-agent votes [Explore →]            |
|  proofof.ai: 294-server verification, MCP catalog [Explore →]    |
+------------------------------------------------------------------+
|  INTEGRATION: HMAC-signed API connections between all domains    |
+------------------------------------------------------------------+
```

#### 3.6.2 Copy Template

| Element | Copy |
|---------|------|
| **Title tag** | `The CSOAI Ecosystem — 5 Domains, One Governance Layer` |
| **Meta description** | `Explore the CSOAI ecosystem: csoai.org certification, councilof.ai BFT governance, proofof.ai verification, safetyof.ai risk assessment, meok.ai coordination.` |
| **H1** | The CSOAI Ecosystem |
| **H2s** | Five Domains, One Purpose / How the Ecosystem Connects / Unified Authentication |
| **Primary CTA** | Explore csoai.org Certification → |
| **Secondary CTA** | View Network Status → |

#### 3.6.3 Schema: Organization + WebSite

```json
{"@context": "https://schema.org",
 "@type": "Organization", "@id": "https://meok.ai/#organization",
 "name": "MEOK", "description": "Coordination layer for the CSOAI ecosystem",
 "subOrganization": [
   {"@id": "https://csoai.org/#organization"},
   {"@id": "https://councilof.ai/#organization"},
   {"@id": "https://proofof.ai/#organization"},
   {"@id": "https://safetyof.ai/#organization"}
 ]}
```

#### 3.6.4 Implementation Checklist

| # | Item | Owner |
|---|------|-------|
| 1 | Build interactive SVG ecosystem diagram | Dev |
| 2 | Create clickable domain nodes | Dev |
| 3 | Write 5 domain descriptions (80 words each) | Content |
| 4 | Add data flow arrows for HMAC-signed APIs | Dev |
| 5 | Deploy Organization + WebSite schema | SEO |
| 6 | Add unified auth badge | Dev |
| 7 | Link to /status | Dev |
| 8 | Add cross-site navigation preview | Design |
| 9 | Include Organization cross-references on all 5 domains | SEO |
| 10 | Write coordination architecture explainer | Content |

---

### 3.7 /security — Security Details Page

All 4 competitors maintain security pages [^94^]. CSOAI must match depth while highlighting Ed25519 and BFT as unique elements.

#### 3.7.1 Wireframe

```
+------------------------------------------------------------------+
|  H1: Sovereign Security Architecture                             |
|  Sub: Defense-in-depth with cryptographic verification           |
+------------------------------------------------------------------+
|  TIMELINE: SOC 2 ===>(Q4 2026)  ISO 27001 ===>(Q1 2027)         |
|  EU AI Act Art 12 [ACTIVE]  GDPR [ACTIVE]                        |
+------------------------------------------------------------------+
|  H2: 4 Governance Principles                                      |
|  1. Defense in Depth  2. Least Privilege  3. Consistency         |
|  4. Cryptographic Verification (unique to CSOAI)                 |
+------------------------------------------------------------------+
|  H2: Ed25519 at Every Layer                                       |
|  [Diagram: Data→Sign→Verify(294 servers)→Store]                  |
|  Key rotation: 90d | Sig: Ed25519 | Hash: SHA-3                  |
+------------------------------------------------------------------+
|  H2: Infrastructure: 294 servers • BFT • 6 regions/12 AZs • CF   |
+------------------------------------------------------------------+
|  CTA: "Download Security Whitepaper" [PDF]                       |
+------------------------------------------------------------------+
```

#### 3.7.2 Copy Template

| Element | Copy |
|---------|------|
| **Title tag** | `Security — CSOAI Sovereign Security Architecture` |
| **Meta description** | `CSOAI security: Ed25519 signing at every layer, 294-server network, BFT consensus, SOC 2 roadmap, zero single points of failure.` |
| **H1** | Sovereign Security Architecture |
| **H2s** | Security Principles / Ed25519 Architecture / Infrastructure / Compliance Roadmap |
| **Primary CTA** | Download Security Whitepaper |

#### 3.7.3 Schema: SecurityPolicy + Organization

```json
{"@context": "https://schema.org",
 "@type": "SecurityPolicy", "@id": "https://csoai.org/security#policy",
 "publisher": {"@id": "https://csoai.org/#organization"},
 "about": [
   {"@type": "Thing", "name": "Ed25519 Digital Signature Scheme"},
   {"@type": "Thing", "name": "Byzantine Fault Tolerance"}]}
```

#### 3.7.4 Implementation Checklist

| # | Item | Owner |
|---|------|-------|
| 1 | Build certification timeline with progress bars | Dev |
| 2 | Write 4 governance principle descriptions | Content |
| 3 | Create Ed25519 architecture diagram (SVG) | Design |
| 4 | List infrastructure specs | Dev |
| 5 | Deploy SecurityPolicy + Organization schema | SEO |
| 6 | Add cookie consent with granular toggles | Dev |
| 7 | Write security whitepaper PDF | Security |
| 8 | Link to /trust-center | Dev |
| 9 | Add subprocessor table link | Dev |
| 10 | Include vulnerability disclosure policy | Security |

---

### 3.8 /status — Infrastructure Status Page

A public status page for the 294-server network demonstrates operational transparency.

#### 3.8.1 Wireframe

```
+------------------------------------------------------------------+
|  H1: CSOAI Infrastructure Status                                 |
|  Sub: Real-time health of 294 verification servers across 6     |
|  regions                                                          |
+------------------------------------------------------------------+
|  OVERALL: All Systems Operational  Uptime 30d: 99.97%            |
+------------------------------------------------------------------+
|  US-East (52)✓  US-West (48)✓  EU-West (54)✓  EU-Central (46)✓ |
|  APAC (52)⚠️  SA-East (42)✓                                      |
+------------------------------------------------------------------+
|  INCIDENT HISTORY (90 days)                                       |
|  07-08 EU-Central Minor 12min Resolved Network latency           |
|  06-22 APAC Minor 8min Resolved Server restart                   |
+------------------------------------------------------------------+
|  SUBSCRIBE: [Email] [Slack] [RSS]                                |
+------------------------------------------------------------------+
```

#### 3.8.2 Copy Template

| Element | Copy |
|---------|------|
| **Title tag** | `Status — CSOAI Infrastructure & Network Health` |
| **Meta description** | `Real-time status of 294 verification servers across 6 global regions. Check uptime, view incidents, subscribe to alerts.` |
| **H1** | CSOAI Infrastructure Status |
| **H2s** | Regional Server Health / Incident History / Subscribe to Alerts |
| **Primary CTA** | Subscribe to Status Alerts |

#### 3.8.3 Schema: WebSite + FAQPage

```json
{"@context": "https://schema.org",
 "@type": "WebSite", "@id": "https://proofof.ai/#website",
 "name": "CSOAI Verification Network",
 "publisher": {"@id": "https://proofof.ai/#organization"},
 "potentialAction": {"@type": "SubscribeAction",
  "target": "https://proofof.ai/status/subscribe"}}
```

#### 3.8.4 Implementation Checklist

| # | Item | Owner |
|---|------|-------|
| 1 | Build real-time server health API | Dev |
| 2 | Create 6-region status grid | Dev |
| 3 | Implement incident history table (90-day) | Dev |
| 4 | Add severity color coding | Dev |
| 5 | Deploy WebSite + FAQPage schema | SEO |
| 6 | Build email subscription | Dev |
| 7 | Add Slack webhook | Dev |
| 8 | Generate RSS feed | Dev |
| 9 | Create incident detail pages | Dev |
| 10 | Add 30-day rolling uptime calc | Dev |

---

### 3.9 /docs — Developer Portal Landing

Arthur.ai and Drata both have strong developer portals [^95^] [^25^]. CSOAI needs a landing page for API docs, MCP guides, and Ed25519 code examples.

#### 3.9.1 Wireframe

```
+------------------------------------------------------------------+
|  H1: CSOAI Developer Platform                                    |
|  Sub: Build compliant AI systems with our APIs and SDKs          |
+------------------------------------------------------------------+
|  [Node.js] [Python] [Go] [cURL]                                  |
|  $ curl https://api.csoai.org/v1/verify -H "Authorization: ..."  |
+------------------------------------------------------------------+
|  +----------------+----------------+----------------+             |
|  | Verification   | Certification  | MCP Integration|             |
|  | • Verify certs | • Apply for    | • Query 294    |             |
|  | • Check status |   certification|   MCP servers  |             |
|  | • Get attests  | • Track apps   | • HMAC signing |             |
|  | [API Ref →]    | [API Ref →]    | [Guide →]      |             |
|  +----------------+----------------+----------------+             |
+------------------------------------------------------------------+
|  FEATURED: MCP Protocol Guide — "294 verified MCP servers with   |
|  HMAC-signed attestations. No competitor offers this."            |
|  [Read MCP Guide →] [View Server Catalog →]                       |
+------------------------------------------------------------------+
```

#### 3.9.2 Copy Template

| Element | Copy |
|---------|------|
| **Title tag** | `Developer Platform — CSOAI APIs, SDKs & MCP Integration` |
| **Meta description** | `CSOAI developer platform: Verification API, Certification API, MCP guides, Ed25519 examples, SDKs for Node.js and Python. 294-server access.` |
| **H1** | CSOAI Developer Platform |
| **H2s** | Get Started in 60 Seconds / API Reference / MCP Protocol / SDKs |
| **Primary CTA** | Start Building — Get API Key |
| **Secondary CTA** | Read MCP Integration Guide → |

#### 3.9.3 Schema: TechArticle + SoftwareApplication

```json
{"@context": "https://schema.org",
 "@type": "SoftwareApplication", "name": "CSOAI Developer Platform",
 "applicationCategory": "DeveloperApplication",
 "offers": {"@type": "Offer", "price": "0", "priceCurrency": "GBP",
  "description": "Free tier: 100 API calls/month"},
 "featureList": ["Verification API", "Certification API", "MCP Catalog", "Ed25519 SDK"]}
```

#### 3.9.4 Implementation Checklist

| # | Item | Owner |
|---|------|-------|
| 1 | Build API docs with OpenAPI/Swagger | Dev |
| 2 | Create language selector | Dev |
| 3 | Write working curl example | Dev |
| 4 | Design 3-category API cards | Design |
| 5 | Deploy TechArticle + SoftwareApplication schema | SEO |
| 6 | Publish npm and PyPI packages | Dev |
| 7 | Write MCP integration guide (2,000 words, code) | Content |
| 8 | Link to 294-server catalog | Dev |
| 9 | Add Postman collection download | Dev |
| 10 | Implement API key gen (100 calls/month free) | Dev |

---

### 3.10 /partners — Partner/Reseller Program

Vanta and Drata both have partner programs [^44^] [^45^]. A formal program creates channel revenue.

#### 3.10.1 Wireframe

```
+------------------------------------------------------------------+
|  H1: Partner With CSOAI                                          |
|  Sub: Join consultants, auditors, and technology partners        |
+------------------------------------------------------------------+
|  REFERRAL 10% | CERTIFIED 25% | STRATEGIC Custom                 |
|  • Refer leads | • Sell CSOAI  | • Co-brand                     |
|  • Track       | • Training    | • Joint dev                    |
|  [Apply]       | [Apply]       | [Contact]                      |
+------------------------------------------------------------------+
|  APPLICATION: Name [__] Email [__] Company [__]                  |
|  Tier [Referral|Certified|Strategic]  [Submit]                   |
+------------------------------------------------------------------+
```

#### 3.10.2 Copy Template

| Element | Copy |
|---------|------|
| **Title tag** | `Partner Program — CSOAI Reseller & Referral Tiers` |
| **Meta description** | `Join the CSOAI partner program. Earn 10-25% commission. Co-branding and strategic partnerships for system integrators.` |
| **H1** | Partner With CSOAI |
| **H2s** | Partner Tiers / What Partners Get / Application |
| **Primary CTA** | Submit Application |
| **Secondary CTA** | Download Partner Deck → |

#### 3.10.3 Schema: Organization + Offer

```json
{"@context": "https://schema.org", "@type": "Offer",
 "name": "CSOAI Partner Program",
 "offers": [
   {"@type": "Offer", "name": "Referral", "description": "10% commission"},
   {"@type": "Offer", "name": "Certified", "description": "25% commission + training"},
   {"@type": "Offer", "name": "Strategic", "description": "Custom terms"}
 ]}
```

#### 3.10.4 Implementation Checklist

| # | Item | Owner |
|---|------|-------|
| 1 | Design 3-tier partner cards | Dev |
| 2 | Build application form | Dev |
| 3 | Create partner dashboard | Dev |
| 4 | Write partner welcome emails | Content |
| 5 | Deploy Organization + Offer schema | SEO |
| 6 | Create partner badge kit | Design |
| 7 | Write partner terms | Legal |
| 8 | Set up commission tracking | Dev |
| 9 | Build partner directory | Dev |
| 10 | Create partner case study template | Content |

---

### 3.11 /case-studies — Customer Success Stories

Credo AI displays Fortune 500 logos and testimonials [^43^]. CSOAI needs equivalent social proof.

#### 3.11.1 Wireframe

```
+------------------------------------------------------------------+
|  H1: Proven AI Governance Outcomes                               |
|  Sub: How organizations reduce compliance risk with CSOAI         |
+------------------------------------------------------------------+
|  LOGO GRID (grayscale → color on hover): [Logo]x8                |
|  "Trusted across finance, healthcare, and government"            |
+------------------------------------------------------------------+
|  Finance Co: Reduced cert time 68% — "BFT council gave us        |
|  audit-proof evidence." [Read →]                                 |
|  Health AI: Passed EU AI Act audit in 3 weeks — "Vote history    |
|  was the difference." [Read →]                                   |
|  GovTech: Achieved ISO 42001 in 8 weeks — "Transparent           |
|  governance was decisive." [Read →]                              |
+------------------------------------------------------------------+
|  STATS: "68% faster cert • 94% pass rate • 3-week avg"           |
|  CTA: "Join These Organizations" [Get Certified]                 |
+------------------------------------------------------------------+
```

#### 3.11.2 Copy Template

| Element | Copy |
|---------|------|
| **Title tag** | `Case Studies — AI Governance Success Stories` |
| **Meta description** | `Organizations achieving EU AI Act compliance and ISO 42001 with CSOAI. 68% faster certification, 94% pass rate, 3-week avg audit.` |
| **H1** | Proven AI Governance Outcomes |
| **H2s** | Trusted Across Industries / Success Stories / Results |
| **Primary CTA** | Get Your Organization Certified |
| **Secondary CTA** | Download Full Report → |

#### 3.11.3 Schema: Article + Review

```json
{"@context": "https://schema.org", "@type": "Review",
 "itemReviewed": {"@type": "Organization", "@id": "https://csoai.org/#organization"},
 "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
 "author": {"@type": "Organization", "name": "{{CUSTOMER_NAME}}"},
 "reviewBody": "{{TESTIMONIAL_QUOTE}}"}
```

#### 3.11.4 Implementation Checklist

| # | Item | Owner |
|---|------|-------|
| 1 | Collect 3-5 customer logos and testimonials | Sales |
| 2 | Build logo grid (grayscale, hover color) | Dev |
| 3 | Write 3 case studies (800-1,000 words) | Content |
| 4 | Create industry filter tabs | Dev |
| 5 | Deploy Article + Review schema | SEO |
| 6 | Add aggregate stats bar | Content |
| 7 | Design detail page template | Dev |
| 8 | Add video testimonial placeholders | Content |
| 9 | Link from /pricing and /compare | Dev |
| 10 | Set up G2 profile | Marketing |

---

### 3.12 /changelog — Release Notes Hub

A changelog signals product velocity and provides weekly freshness signals to crawlers [^56^].

#### 3.12.1 Wireframe

```
+------------------------------------------------------------------+
|  H1: What's New at CSOAI                                         |
|  Sub: Product updates, certification releases, governance        |
|  improvements                                                     |
+------------------------------------------------------------------+
|  [RSS Feed] [Email Alerts] [Slack #announcements]                |
+------------------------------------------------------------------+
|  July 14 — v2.4.0 BFT Council Vote Export (CSV). Added CSV      |
|  export with Ed25519 sig verification. [Read →]                  |
|  July 08 — v2.3.2 EU AI Act Article 50 Compliance update.       |
|  June 30 — v2.3.0 294-Server SA-East Expansion (42 servers).    |
+------------------------------------------------------------------+
```

#### 3.12.2 Copy Template

| Element | Copy |
|---------|------|
| **Title tag** | `Changelog — CSOAI Product Updates & Releases` |
| **Meta description** | `Latest CSOAI updates: BFT council improvements, certification standards, network expansions, EU AI Act enhancements.` |
| **H1** | What's New at CSOAI |
| **H2s** | July 2026 / June 2026 |
| **Primary CTA** | Subscribe to Updates |
| **Secondary CTA** | View Roadmap → |

#### 3.12.3 Schema: BlogPosting + BreadcrumbList

```json
{"@context": "https://schema.org", "@type": "BlogPosting",
 "headline": "v2.4.0 — BFT Council Vote Export",
 "datePublished": "2026-07-14T09:00:00Z",
 "dateModified": "2026-07-14T09:00:00Z",
 "author": {"@id": "https://csoai.org/#organization"},
 "publisher": {"@id": "https://csoai.org/#organization"},
 "articleSection": "Product Update"}
```

#### 3.12.4 Implementation Checklist

| # | Item | Owner |
|---|------|-------|
| 1 | Build timeline with month-grouped entries | Dev |
| 2 | Create detail pages (/changelog/{slug}) | Dev |
| 3 | Generate RSS at /changelog/rss.xml | Dev |
| 4 | Add email subscription | Dev |
| 5 | Deploy BlogPosting + BreadcrumbList schema | SEO |
| 6 | Add semantic version badges | Dev |
| 7 | Categorize entries (Feature/Fix/Standard/Network) | Content |
| 8 | Link to GitHub releases | Dev |
| 9 | Add expandable "Read more" | Dev |
| 10 | Automate dateModified on publish | Dev |

---

### Cross-Page Implementation Summary

| # | Page | Rationale | Primary Schema | Effort |
|---|------|-----------|----------------|--------|
| 1 | `/trust-center` | Vanta + Drata have it [^84^] | Organization + SecurityPolicy | 3d |
| 2 | `/pricing` | Arthur.ai shows pricing [^75^] | SoftwareApplication + Offer | 2d |
| 3 | `/compare` | Drata has 10+ pages [^118^] | Table + FAQPage | 4d |
| 4 | `/verify` | No competitor has this | HowTo + FAQPage | 3d |
| 5 | `/transparency` | No competitor has this | Dataset + GovOrg | 2d |
| 6 | `/ecosystem` | No competitor has this | Organization + WebSite | 2d |
| 7 | `/security` | All 4 have it [^94^] | SecurityPolicy + Organization | 2d |
| 8 | `/status` | Infrastructure standard | WebSite + FAQPage | 2d |
| 9 | `/docs` | Arthur + Drata have portals [^95^] | TechArticle + SoftwareApp | 4d |
| 10 | `/partners` | Vanta + Drata have programs | Organization + Offer | 2d |
| 11 | `/case-studies` | Credo shows Fortune 500 [^43^] | Article + Review | 3d |
| 12 | `/changelog` | Freshness signal [^56^] | BlogPosting + BreadcrumbList | 1d |

**Total: 30 development days.** Sprint 1 (trust-center, pricing, compare, verify, docs): 14 days. Sprint 2 (remaining 7): 16 days.

All schemas are designed for `@graph` stacking. Wrap each page's schemas in a single `<script type="application/ld+json">` with a `@graph` array for 1.8x citation lift [^54^]. Every page must include the base Organization schema with `@id: "https://csoai.org/#organization"` to maintain entity graph consistency.


---

## 4. AEO Infrastructure — Production-Ready Code

This chapter contains every template, configuration file, and schema required to make the CSOAI network machine-readable by AI search engines and agents. No theoretical discussion — only copy-paste deployable code with `{{PLACEHOLDER}}` variables for site-specific values. Deploy these templates in the order specified in Section 4.6.

FAQPage schema produces **3.1x higher AI citation rates** than pages without structured Q&A markup[^2^]. Triple-schema stacking (Article + FAQPage + HowTo) delivers **1.8x more citations** than Article alone[^2^]. **50% of AI citations** originate from content less than 13 weeks old[^33^], making `dateModified` protocol compliance non-negotiable. The `/llms.txt` standard — requested by Anthropic for their documentation and included in Google's A2A protocol[^18^] — positions CSOAI for first-mover advantage as LLM providers commit to the specification.

---

### 4.1 llms.txt Implementation (3 Primary Sites)

The llms.txt standard, proposed by Jeremy Howard of Answer.AI in September 2024[^47^][^48^], is a markdown file served at `/llms.txt` that provides LLM-friendly content summaries and curated links. AI agents are visiting `/llms.txt` files at growing rates[^45^], and adoption cost is minimal — 1-4 hours per site with potential long-term structural upside[^18^].

Serve the file at `/llms.txt` (preferred) or `/.well-known/llms.txt`. Include an HTML `<link>` reference in every page `<head>`:

```html
<link rel="alternate" type="text/markdown" href="/llms.txt" title="LLM-friendly site overview" />
```

#### 4.1.1 csoai.org llms.txt: Complete Template

**File:** `/llms.txt`  
**Content-Type:** `text/plain; charset=utf-8`  
**Place in:** Site root directory

```markdown
# Center for the Study of Optimized Intelligence (CSOAI)

> CSOAI is a nonprofit research organization dedicated to studying, measuring, and advancing optimized intelligence -- bridging human cognition, artificial intelligence, and collective decision-making systems.

Founded in {{FOUNDING_YEAR}}, CSOAI operates at the intersection of AI safety, cognitive science, and governance innovation. We publish research, convene expert councils, and develop open methodologies for measuring and improving intelligence outcomes across domains. All research is published under open source licenses and undergoes peer review.

## About

- [About CSOAI](https://csoai.org/about): Mission, vision, and organizational overview
- [Team & Leadership](https://csoai.org/team): Founders, researchers, and advisory council
- [Research Methodology](https://csoai.org/methodology): Our approach to measuring optimized intelligence
- [Governance Structure](https://csoai.org/governance): Bylaws, ethics policy, and transparency reports

## Research

- [Research Papers](https://csoai.org/research): Peer-reviewed publications and preprints
- [Annual Report {{LATEST_YEAR}}](https://csoai.org/annual-report-{{LATEST_YEAR}}): Comprehensive year-in-review
- [Intelligence Optimization Framework](https://csoai.org/framework): Open methodology for measuring intelligence systems
- [Safety Benchmarks](https://csoai.org/safety-benchmarks): AI safety evaluation standards
- [Working Papers](https://csoai.org/working-papers): In-progress research and preprints

## Programs

- [Council of AI](https://councilof.ai): Global expert council on AI governance
- [Proof of Agency](https://proofof.ai): Certification for autonomous AI systems
- [Safety of AI](https://safetyof.ai): AI safety research and best practices
- [Meok](https://meok.ai): Mothership entity and coordination layer
- [Relevance.ai](https://relevance.ai): Applied relevance optimization

## Contact

- [General Inquiries](https://csoai.org/contact): Contact form and email
- [Press Kit](https://csoai.org/press): Media assets and press information
- [Partnerships](https://csoai.org/partners): Collaboration and sponsorship opportunities

## Optional

- [Blog Archive](https://csoai.org/blog): Historical blog posts and updates
- [Newsletter Archive](https://csoai.org/newsletter): Past newsletter editions
- [Event Recordings](https://csoai.org/events): Recordings of past events and webinars
```

**Deployment validation:**
```bash
# Verify raw markdown is accessible
curl -s https://csoai.org/llms.txt | head -20
# Expected: "# Center for the Study of Optimized Intelligence (CSOAI)"

# Check Content-Type header
curl -I https://csoai.org/llms.txt | grep -i content-type
# Expected: text/plain; charset=utf-8
```

#### 4.1.2 proofof.ai llms.txt: Certification-Focused Template

**File:** `/llms.txt`  
**Content-Type:** `text/plain; charset=utf-8`

```markdown
# Proof of Agency (PoA)

> Proof of Agency is a certification and evaluation framework for autonomous AI systems, establishing verifiable benchmarks for self-directed AI behavior, safety constraints, and human-alignment guarantees.

Proof of Agency provides the first rigorous, open methodology for certifying that AI systems can operate autonomously while maintaining safety boundaries and alignment with human intent. The framework is developed by CSOAI in collaboration with leading AI safety researchers. Certified systems are listed in a public registry with detailed evaluation reports.

## Core Documentation

- [Framework Overview](https://proofof.ai/framework): Complete PoA methodology and principles
- [Certification Levels](https://proofof.ai/levels): Five-tier agency certification system
- [Safety Benchmarks](https://proofof.ai/benchmarks): Evaluation criteria and test suites
- [Technical Specification](https://proofof.ai/spec): Detailed technical specification v{{SPEC_VERSION}}
- [API Reference](https://proofof.ai/api): REST API for automated certification testing

## Getting Started

- [Quick Start Guide](https://proofof.ai/quickstart): Evaluate your first AI system
- [Integration Tutorial](https://proofof.ai/tutorial): Step-by-step implementation guide
- [SDK Documentation](https://proofof.ai/sdk): Python and TypeScript SDKs
- [Pricing](https://proofof.ai/pricing): Certification tier comparison

## Certified Systems

- [Certified Systems Registry](https://proofof.ai/registry): Public database of certified AI systems
- [Submit for Certification](https://proofof.ai/submit): Begin the certification process
- [Appeals Process](https://proofof.ai/appeals): Challenge or update a certification

## Governance

- [Oversight Board](https://proofof.ai/board): Independent certification oversight
- [Standards Process](https://proofof.ai/standards): How certification criteria evolve
- [Ethics Charter](https://proofof.ai/ethics): Core ethical commitments

## Research

- [Published Papers](https://proofof.ai/research): Peer-reviewed research on agency measurement
- [Case Studies](https://proofof.ai/cases): Real-world certification examples
- [Collaborators](https://proofof.ai/collaborators): Research partners and institutions

## Optional

- [FAQ](https://proofof.ai/faq): Frequently asked questions
- [Changelog](https://proofof.ai/changelog): Version history and updates
- [Community Forum](https://proofof.ai/community): Discussion and support
```

#### 4.1.3 meok.ai llms.txt: Ecosystem Coordination Template

**File:** `/llms.txt`  
**Content-Type:** `text/plain; charset=utf-8`

```markdown
# Meok

> Meok is the coordination layer and mothership entity for the CSOAI ecosystem -- connecting research programs, governance structures, and applied intelligence initiatives across a network of specialized domains.

Meok serves as the central hub for CSOAI's distributed research network, providing shared infrastructure, cross-program coordination, and strategic alignment across Council of AI, Proof of Agency, Safety of AI, and Relevance.ai.

## Overview

- [About Meok](https://meok.ai/about): Vision, mission, and role in the ecosystem
- [Ecosystem Map](https://meok.ai/ecosystem): Visual overview of all connected programs
- [Governance Model](https://meok.ai/governance): Distributed decision-making architecture
- [Annual Strategy](https://meok.ai/strategy): Current strategic priorities and roadmap

## Connected Programs

- [CSOAI -- Main Research Org](https://csoai.org): Center for the Study of Optimized Intelligence
- [Council of AI](https://councilof.ai): Global expert council on AI governance
- [Proof of Agency](https://proofof.ai): Certification for autonomous AI systems
- [Safety of AI](https://safetyof.ai): AI safety research and best practices
- [Relevance.ai](https://relevance.ai): Applied relevance optimization

## Infrastructure

- [Shared Services](https://meok.ai/services): Common infrastructure and tooling
- [Research Coordination](https://meok.ai/research): Cross-program research alignment
- [Funding & Grants](https://meok.ai/funding): Resource allocation and grant management
- [Event Coordination](https://meok.ai/events): Joint conferences, workshops, and summits

## Technology

- [Open Source Projects](https://meok.ai/oss): Public repositories and contributions
- [API Platform](https://meok.ai/api): Shared API infrastructure
- [Data Standards](https://meok.ai/standards): Common data formats and protocols
- [Security Practices](https://meok.ai/security): Security policies and procedures

## Participation

- [Join the Network](https://meok.ai/join): Become part of the CSOAI ecosystem
- [Contributor Guidelines](https://meok.ai/contribute): How to contribute to programs
- [Partner Program](https://meok.ai/partners): Strategic partnership opportunities
- [Advisory Roles](https://meok.ai/advisory): Expert advisory positions

## Contact

- [General Inquiries](https://meok.ai/contact): Primary contact channel
- [Emergency Contact](https://meok.ai/emergency): Critical incident reporting
- [Press & Media](https://meok.ai/press): Media relations

## Optional

- [Blog](https://meok.ai/blog): News and updates from the ecosystem
- [Newsletter](https://meok.ai/newsletter): Monthly ecosystem digest
- [Careers](https://meok.ai/careers): Open positions across the network
```

#### 4.1.4 llms.txt Deployment & Validation Checklist

| Step | Action | Validation Command |
|------|--------|-------------------|
| 1 | Save as plain UTF-8 text with `.txt` extension | `file llms.txt` → `ASCII text` |
| 2 | Place at site root (`/llms.txt`) | `curl -I https://{{DOMAIN}}/llms.txt` → HTTP 200 |
| 3 | Verify Content-Type is `text/plain` | `curl -I https://{{DOMAIN}}/llms.txt \| grep content-type` |
| 4 | Confirm markdown renders correctly (H1, blockquote, links) | `curl -s https://{{DOMAIN}}/llms.txt \| grep "^# "` |
| 5 | Add HTML `<link rel="alternate">` to all page `<head>` sections | Inspect page source for `<link rel="alternate" type="text/markdown"` |
| 6 | Create `/llms-full.txt` with complete documentation content if site is docs-heavy | Verify at `https://{{DOMAIN}}/llms-full.txt` |
| 7 | Register on discovery directories | Submit to llmstxt.site and directory.llmstxt.cloud[^50^] |

---

### 4.2 robots.txt — AI Crawler Configuration

AI search engines cannot index content they cannot crawl. Explicit `Allow` directives for search-indexing crawlers are mandatory — blocking `OAI-SearchBot` removes your site from ChatGPT search answers entirely[^3^], and `Claude-SearchBot` requires an independent directive separate from `ClaudeBot`[^3^].

#### 4.2.1 Complete robots.txt with 25+ AI Crawler Directives

**File:** `/robots.txt`  
**Content-Type:** `text/plain`  
**Deploy to:** All 6 sites (csoai.org, proofof.ai, councilof.ai, safetyof.ai, meok.ai, relevance.ai)

```
# ============================================
# CSOAI Network -- AI Crawler Access Policy
# Last Updated: {{LAST_UPDATED_DATE}}
# Sites: csoai.org, proofof.ai, councilof.ai,
#        safetyof.ai, meok.ai, relevance.ai
# ============================================

# --- OPENAI ---
# Training crawler -- disallow to protect content from
# being used in model training without attribution
User-agent: GPTBot
Disallow: /

# Search indexing -- CRITICAL for ChatGPT search visibility
User-agent: OAI-SearchBot
Allow: /

# User-initiated fetches from ChatGPT
User-agent: ChatGPT-User
Allow: /

User-agent: ChatGPT-User/2.0
Allow: /

User-agent: ChatGPT-User/3.0
Allow: /

# --- ANTHROPIC / CLAUDE ---
# Training crawler -- disallow
User-agent: ClaudeBot
Disallow: /

# Search indexing -- CRITICAL for Claude.ai search visibility
User-agent: Claude-SearchBot
Allow: /

# User-initiated fetches
User-agent: Claude-User
Allow: /

# Legacy training crawler
User-agent: anthropic-ai
Disallow: /

# --- PERPLEXITY ---
# Search indexing -- CRITICAL for Perplexity AI visibility
User-agent: PerplexityBot
Allow: /

# User-triggered visits
User-agent: Perplexity-User
Allow: /

# --- GOOGLE ---
# Google Search -- essential for traditional SEO
User-agent: Googlebot
Allow: /

# AI training control (does NOT affect Google Search)
User-agent: Google-Extended
Allow: /

# Generic Google product crawler
User-agent: GoogleOther
Allow: /

# --- MICROSOFT ---
User-agent: Bingbot
Allow: /

# --- APPLE ---
User-agent: Applebot
Allow: /

# --- META ---
User-agent: FacebookBot
Allow: /

User-agent: meta-externalagent
Allow: /

# --- AMAZON ---
User-agent: Amazonbot
Allow: /

# --- LINKEDIN ---
User-agent: LinkedInBot
Allow: /

# --- DUCKDUCKGO ---
User-agent: DuckAssistBot
Allow: /

# --- COHERE ---
User-agent: cohere-ai
Allow: /

# --- COMMON CRAWL ---
User-agent: CCBot
Allow: /

# --- ALLEN INSTITUTE ---
User-agent: AI2Bot
Allow: /

# --- DIFFBOT ---
User-agent: Diffbot
Allow: /

# --- BYTEDANCE / TIKTOK ---
# Note: May not fully respect robots.txt
User-agent: Bytespider
Allow: /

# ============================================
# SITEMAPS -- Update per-site for each domain
# ============================================
Sitemap: https://{{DOMAIN}}/sitemap.xml
```

**Per-site sitemap entries** (replace the `{{DOMAIN}}` line per site):

| Site | Sitemap Line |
|------|-------------|
| csoai.org | `Sitemap: https://csoai.org/sitemap.xml` |
| proofof.ai | `Sitemap: https://proofof.ai/sitemap.xml` |
| councilof.ai | `Sitemap: https://councilof.ai/sitemap.xml` |
| safetyof.ai | `Sitemap: https://safetyof.ai/sitemap.xml` |
| meok.ai | `Sitemap: https://meok.ai/sitemap.xml` |
| relevance.ai | `Sitemap: https://relevance.ai/sitemap.xml` |

#### 4.2.2 Crawler Policy Rationale Table

| Crawler | Vendor | Purpose | Directive | Rationale |
|---------|--------|---------|-----------|-----------|
| `GPTBot` | OpenAI | Model training | `Disallow` | Prevent content ingestion for model training without attribution[^3^] |
| `OAI-SearchBot` | OpenAI | ChatGPT search | `Allow` | **Critical** — blocking removes site from ChatGPT search answers[^3^] |
| `ChatGPT-User` | OpenAI | User fetch | `Allow` | Required for ChatGPT users to access linked pages |
| `ClaudeBot` | Anthropic | Model training | `Disallow` | Prevent training data collection |
| `Claude-SearchBot` | Anthropic | Search index | `Allow` | **Critical** — independent from ClaudeBot, needs separate directive[^3^] |
| `PerplexityBot` | Perplexity | Search index | `Allow` | Primary bot for Perplexity AI search indexing[^5^] |
| `Google-Extended` | Google | Gemini training | `Allow` | Controls Gemini training; does NOT affect Google Search[^3^] |
| `CCBot` | Common Crawl | Open dataset | `Allow` | Widely used for academic training; blocking reduces research citations |

#### 4.2.3 robots.txt Validation Commands

```bash
# 1. Verify file is accessible and returns text/plain
curl -s -o /dev/null -w "%{http_code} %{content_type}" \
  https://{{DOMAIN}}/robots.txt
# Expected: 200 text/plain

# 2. Check for syntax errors (no unmatched User-agent/Disallow)
curl -s https://{{DOMAIN}}/robots.txt | grep -c "^User-agent:"
# Expected: 25+ (one per crawler block)

# 3. Google Search Console -- robots.txt Tester
# Navigate to: Settings > Crawl > robots.txt Tester
# Test each critical path against OAI-SearchBot, Claude-SearchBot, PerplexityBot

# 4. Monitor server logs for AI crawler visits
grep -E "(OAI-SearchBot|Claude-SearchBot|PerplexityBot|GPTBot|ClaudeBot)" \
  /var/log/nginx/access.log | tail -20

# 5. Test with Google's Rich Results crawler
# Search Console > URL Inspection > Test Live URL
```

---

### 4.3 JSON-LD Schema Templates (10 Production Templates)

Schema markup structures content in formats AI systems can parse without ambiguity. Pages with three or more schema types see **13% higher citation likelihood**[^33^], and FAQPage schema alone produces **3.1x higher AI citation rates** than unmarked pages[^2^]. Place all JSON-LD in `<script type="application/ld+json">` tags inside the HTML `<head>` or immediately before `</body>`.

#### 4.3.1 Organization Schema: Parent (meok.ai) with subOrganization

Deploy on the meok.ai homepage. The `subOrganization` array creates machine-readable links to all child entities, enabling AI systems to understand the full CSOAI network graph.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://meok.ai/#organization",
  "name": "Meok",
  "alternateName": ["Meok AI", "CSOAI Mothership"],
  "url": "https://meok.ai",
  "logo": {
    "@type": "ImageObject",
    "@id": "https://meok.ai/#logo",
    "url": "https://meok.ai/assets/logo.png",
    "width": 512,
    "height": 512
  },
  "description": "Meok is the coordination layer and mothership entity for the CSOAI ecosystem, providing shared infrastructure, cross-program research alignment, and strategic governance across a network of specialized AI research and safety programs.",
  "foundingDate": "{{FOUNDING_YEAR}}",
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "email": "contact@meok.ai",
      "contactType": "General Inquiries",
      "availableLanguage": ["English"]
    }
  ],
  "sameAs": [
    "https://www.linkedin.com/company/{{LINKEDIN_SLUG}}",
    "https://twitter.com/{{TWITTER_HANDLE}}",
    "https://github.com/{{GITHUB_ORG}}",
    "https://www.crunchbase.com/organization/{{CRUNCHBASE_SLUG}}"
  ],
  "subOrganization": [
    {
      "@type": "Organization",
      "@id": "https://csoai.org/#organization",
      "name": "Center for the Study of Optimized Intelligence",
      "url": "https://csoai.org"
    },
    {
      "@type": "Organization",
      "@id": "https://councilof.ai/#organization",
      "name": "Council of AI",
      "url": "https://councilof.ai"
    },
    {
      "@type": "Organization",
      "@id": "https://proofof.ai/#organization",
      "name": "Proof of Agency",
      "url": "https://proofof.ai"
    },
    {
      "@type": "Organization",
      "@id": "https://safetyof.ai/#organization",
      "name": "Safety of AI",
      "url": "https://safetyof.ai"
    },
    {
      "@type": "Organization",
      "@id": "https://relevance.ai/#organization",
      "name": "Relevance.ai",
      "url": "https://relevance.ai"
    }
  ],
  "knowsAbout": [
    "Artificial Intelligence Safety",
    "Optimized Intelligence",
    "AI Governance",
    "Collective Intelligence",
    "AI Certification"
  ]
}
</script>
```

#### 4.3.2 Organization Schema: Child Sites with parentOrganization

Deploy on csoai.org, proofof.ai, councilof.ai, safetyof.ai, and relevance.ai homepages. The `parentOrganization` `@id` creates a bidirectional graph that AI crawlers can traverse.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://{{DOMAIN}}/#organization",
  "name": "{{ORG_FULL_NAME}}",
  "alternateName": "{{ORG_SHORT_NAME}}",
  "url": "https://{{DOMAIN}}",
  "logo": {
    "@type": "ImageObject",
    "@id": "https://{{DOMAIN}}/#logo",
    "url": "https://{{DOMAIN}}/assets/logo.png",
    "width": 512,
    "height": 512
  },
  "description": "{{ORG_DESCRIPTION}}",
  "foundingDate": "{{FOUNDING_YEAR}}",
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "email": "{{CONTACT_EMAIL}}",
      "contactType": "General Inquiries",
      "availableLanguage": ["English"]
    },
    {
      "@type": "ContactPoint",
      "email": "{{PRESS_EMAIL}}",
      "contactType": "Media Relations",
      "availableLanguage": ["English"]
    }
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{{STREET_ADDRESS}}",
    "addressLocality": "{{CITY}}",
    "addressRegion": "{{STATE}}",
    "postalCode": "{{ZIP}}",
    "addressCountry": "{{COUNTRY_CODE}}"
  },
  "sameAs": [
    "https://www.linkedin.com/company/{{LINKEDIN_SLUG}}",
    "https://twitter.com/{{TWITTER_HANDLE}}",
    "https://github.com/{{GITHUB_ORG}}",
    "https://www.crunchbase.com/organization/{{CRUNCHBASE_SLUG}}",
    "https://www.wikidata.org/entity/{{WIKIDATA_QID}}"
  ],
  "parentOrganization": {
    "@type": "Organization",
    "@id": "https://meok.ai/#organization",
    "name": "Meok",
    "url": "https://meok.ai"
  },
  "knowsAbout": [{{KNOWS_ABOUT_ARRAY}}]
}
</script>
```

**Per-site `{{KNOWS_ABOUT_ARRAY}}` values:**

| Site | `knowsAbout` Topics |
|------|-------------------|
| csoai.org | `"AI Safety", "Optimized Intelligence", "Collective Intelligence", "AI Governance"` |
| proofof.ai | `"AI Agency Certification", "Autonomous AI Systems", "AI Safety Benchmarks"` |
| councilof.ai | `"AI Governance", "AI Policy", "International AI Coordination"` |
| safetyof.ai | `"AI Safety", "AI Risk Assessment", "Safety Benchmarks"` |
| relevance.ai | `"Relevance Optimization", "Information Retrieval", "AI Systems"` |

#### 4.3.3 Person Schema: Founder/Author with E-E-A-T sameAs

Person schema implements E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals that AI crawlers cross-reference against LinkedIn, Google Scholar, and Wikipedia to verify author identity[^2^][^32^]. Use a **stable `@id`** for every article a person authors — Google merges them into a single entity graph[^32^].

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://{{DOMAIN}}/team/{{FOUNDER_SLUG}}#person",
  "name": "{{FOUNDER_FULL_NAME}}",
  "alternateName": "{{FOUNDER_PREFERRED_NAME}}",
  "url": "https://{{DOMAIN}}/team/{{FOUNDER_SLUG}}",
  "image": {
    "@type": "ImageObject",
    "url": "https://{{DOMAIN}}/assets/team/{{FOUNDER_PHOTO}}.jpg",
    "width": 800,
    "height": 800
  },
  "description": "{{2-3_SENTENCE_BIO}}",
  "jobTitle": "{{JOB_TITLE}}",
  "worksFor": {
    "@type": "Organization",
    "@id": "https://{{DOMAIN}}/#organization"
  },
  "affiliation": [
    {
      "@type": "Organization",
      "name": "{{ORG_NAME}}",
      "sameAs": "https://{{DOMAIN}}"
    }
  ],
  "alumniOf": [
    {
      "@type": "CollegeOrUniversity",
      "name": "{{UNIVERSITY_NAME}}",
      "sameAs": "https://en.wikipedia.org/wiki/{{UNIVERSITY_SLUG}}"
    }
  ],
  "knowsAbout": [
    {
      "@type": "Thing",
      "name": "Artificial Intelligence Safety",
      "sameAs": "https://en.wikipedia.org/wiki/AI_safety"
    },
    {
      "@type": "Thing",
      "name": "Optimized Intelligence",
      "sameAs": "https://en.wikipedia.org/wiki/Collective_intelligence"
    }
  ],
  "sameAs": [
    "https://www.linkedin.com/in/{{LINKEDIN_USERNAME}}",
    "https://twitter.com/{{TWITTER_HANDLE}}",
    "https://github.com/{{GITHUB_USERNAME}}",
    "https://scholar.google.com/citations?user={{SCHOLAR_ID}}",
    "https://orcid.org/{{ORCID_ID}}"
  ]
}
</script>
```

#### 4.3.4 FAQPage Schema: 10-Question Template (40-110 words each)

FAQPage schema is the single highest-impact schema for AEO — it creates standalone Q&A pairs that LLMs extract and cite independently[^2^]. Each answer must be **40-110 words** (long enough to be complete, short enough for direct extraction)[^2^], and FAQ content must be **visible on the page** — not embedded only in JSON-LD[^7^].

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://{{DOMAIN}}/faq#faqpage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is optimized intelligence and why does it matter?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Optimized intelligence is the systematic study and improvement of how intelligence -- whether human, artificial, or collective -- achieves its goals effectively and safely. It matters because as AI systems become more capable, we need rigorous frameworks to ensure they operate in ways that are beneficial, aligned with human values, and measurably superior to baseline performance. CSOAI develops open methodologies for measuring and advancing optimized intelligence across domains."
      }
    },
    {
      "@type": "Question",
      "name": "What does CSOAI do and who is it for?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CSOAI is a nonprofit research organization that studies, measures, and advances optimized intelligence. We serve AI safety researchers, policy makers, technology companies, and civil society organizations who need rigorous, evidence-based frameworks for understanding and improving intelligence systems. Our work includes peer-reviewed research, open methodologies, expert councils, and certification programs."
      }
    },
    {
      "@type": "Question",
      "name": "How does Proof of Agency certification work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Proof of Agency is a five-tier certification framework that evaluates whether autonomous AI systems can operate safely within defined boundaries while maintaining alignment with human intent. Developers submit their systems for evaluation against standardized benchmarks covering safety constraints, goal-directed behavior, and human-override capabilities. Certified systems are listed in a public registry with detailed evaluation reports."
      }
    },
    {
      "@type": "Question",
      "name": "What is the Council of AI and how does it operate?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Council of AI is a global expert body convened by CSOAI to develop governance recommendations for advanced AI systems. It brings together researchers, ethicists, policymakers, and industry leaders to produce actionable guidance on AI safety, deployment standards, and international coordination. The Council publishes position papers, policy recommendations, and technical standards."
      }
    },
    {
      "@type": "Question",
      "name": "How can organizations get involved with CSOAI's research programs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Organizations can engage with CSOAI through multiple pathways: joining the Council of AI as a contributing member, submitting AI systems for Proof of Agency certification, sponsoring specific research initiatives, participating in open source methodology development, or attending public conferences. Partnership inquiries can be submitted through the contact form on csoai.org."
      }
    },
    {
      "@type": "Question",
      "name": "What makes CSOAI's approach to AI safety different from other organizations?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CSOAI uniquely combines rigorous measurement science with practical certification frameworks. Rather than focusing solely on theoretical safety research or broad policy advocacy, we develop actionable, testable standards that organizations can implement today. Our open methodologies, public registries, and interdisciplinary approach create a comprehensive ecosystem for intelligence optimization."
      }
    },
    {
      "@type": "Question",
      "name": "What research areas does CSOAI focus on?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CSOAI's research spans four core areas: intelligence measurement (developing quantifiable metrics for system performance), AI safety benchmarks (creating standardized evaluation criteria), collective intelligence (studying how groups and hybrid human-AI systems optimize outcomes), and agency certification (establishing verifiable standards for autonomous system behavior). All research is published openly and peer-reviewed."
      }
    },
    {
      "@type": "Question",
      "name": "Is CSOAI's research and methodology open source?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. CSOAI is committed to open research. All methodologies, frameworks, benchmark datasets, and evaluation tools are published under permissive open source licenses. We believe that transparent, reproducible research is essential for advancing the field of optimized intelligence. GitHub repositories contain implementation code, documentation, and contribution guidelines."
      }
    },
    {
      "@type": "Question",
      "name": "How does CSOAI ensure its certifications are trustworthy and impartial?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CSOAI maintains independence through a multi-layered governance structure: the Oversight Board includes independent experts with no financial ties to certified organizations, all evaluation criteria are published and community-reviewed, certification decisions require board approval, and complete evaluation reports are made publicly available. A transparent appeals process allows challenges to any certification."
      }
    },
    {
      "@type": "Question",
      "name": "What is the relationship between CSOAI, Meok, and the program sites?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CSOAI is the primary nonprofit research organization. Meok serves as the coordination layer providing shared infrastructure and strategic alignment across all programs. Council of AI, Proof of Agency, Safety of AI, and Relevance.ai are specialized program sites, each focused on a specific domain within the optimized intelligence ecosystem. Together they form an integrated network of research, governance, and application initiatives."
      }
    }
  ]
}
</script>
```

**FAQPage constraints:** 5-10 questions per page[^7^]. Answers must be self-contained (make sense without surrounding content). Match real query patterns: "What is...", "How does...", "Why...". Validate before publishing — malformed FAQPage is silently ignored by crawlers.

#### 4.3.5 Article + BlogPosting Schema

The `dateModified` field is the most explicit freshness signal available to AI crawlers[^33^]. **50% of AI citations** come from content under 13 weeks old[^33^], and stale `dateModified` timestamps actively reduce citation rates[^2^]. Update `dateModified` only when substantive content changes — not for typo fixes or image swaps[^38^].

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://{{DOMAIN}}/{{ARTICLE_PATH}}#article",
  "headline": "{{ARTICLE_TITLE}}",
  "description": "{{META_DESCRIPTION}}",
  "url": "https://{{DOMAIN}}/{{ARTICLE_PATH}}",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://{{DOMAIN}}/{{ARTICLE_PATH}}"
  },
  "image": [
    "https://{{DOMAIN}}/assets/blog/{{ARTICLE_SLUG}}-og.jpg"
  ],
  "datePublished": "{{DATE_PUBLISHED}}",
  "dateModified": "{{DATE_MODIFIED}}",
  "author": {
    "@type": "Person",
    "@id": "https://{{DOMAIN}}/team/{{AUTHOR_SLUG}}#person",
    "name": "{{AUTHOR_NAME}}",
    "url": "https://{{DOMAIN}}/team/{{AUTHOR_SLUG}}",
    "sameAs": [
      "https://www.linkedin.com/in/{{AUTHOR_LINKEDIN}}"
    ]
  },
  "publisher": {
    "@type": "Organization",
    "@id": "https://{{DOMAIN}}/#organization"
  },
  "articleSection": "{{SECTION_NAME}}",
  "keywords": [{{KEYWORD_ARRAY}}],
  "inLanguage": "{{LANGUAGE_CODE}}",
  "isAccessibleForFree": true,
  "copyrightHolder": {
    "@type": "Organization",
    "@id": "https://{{DOMAIN}}/#organization"
  },
  "copyrightYear": "{{COPYRIGHT_YEAR}}",
  "license": "https://creativecommons.org/licenses/by/4.0/"
}
</script>
```

**Date format:** ISO 8601 with timezone offset: `2025-06-15T14:30:00+00:00`.  
**Update cadence:** Monthly for competitive/comparison pages, quarterly for evergreen content[^33^].  
**Critical rule:** John Mueller (Google): "Don't artificially freshen a story without adding significant information"[^38^].

#### 4.3.6 SoftwareApplication + Offer Schema

Deploy on proofof.ai pricing and product pages. This schema enables AI search engines to understand pricing tiers, certification levels, and product capabilities — directly feeding commercial-intent query responses[^36^].

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://proofof.ai/#software",
  "name": "Proof of Agency Certification Platform",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web",
  "offers": [
    {
      "@type": "Offer",
      "name": "Basic Evaluation",
      "description": "Self-service safety evaluation with automated benchmarking",
      "price": "0",
      "priceCurrency": "USD",
      "priceValidUntil": "{{PRICE_VALID_UNTIL}}"
    },
    {
      "@type": "Offer",
      "name": "Professional Certification",
      "description": "Full agency certification with expert review and public registry listing",
      "price": "5000",
      "priceCurrency": "USD",
      "priceValidUntil": "{{PRICE_VALID_UNTIL}}"
    },
    {
      "@type": "Offer",
      "name": "Enterprise Certification",
      "description": "Comprehensive evaluation for complex multi-agent systems with ongoing monitoring",
      "price": "25000",
      "priceCurrency": "USD",
      "priceValidUntil": "{{PRICE_VALID_UNTIL}}"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{{AVG_RATING}}",
    "reviewCount": "{{REVIEW_COUNT}}",
    "bestRating": "5",
    "worstRating": "1"
  },
  "featureList": [
    "Automated safety benchmarking",
    "Multi-tier certification levels",
    "Public certification registry",
    "API access for continuous monitoring",
    "Expert panel review",
    "HMAC-signed audit trails"
  ],
  "softwareVersion": "{{VERSION}}",
  "releaseNotes": "https://proofof.ai/changelog",
  "publisher": {
    "@type": "Organization",
    "@id": "https://csoai.org/#organization"
  }
}
</script>
```

#### 4.3.7 HowTo Schema: Step-by-Step Guide

HowTo schema enables AI systems to extract step-by-step instructions and present them in answer cards. Use for certification guides, compliance walkthroughs, and methodology implementations.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "@id": "https://{{DOMAIN}}/guides/{{GUIDE_SLUG}}#howto",
  "name": "{{HOWTO_TITLE}}",
  "description": "{{HOWTO_DESCRIPTION}}",
  "totalTime": "{{ISO_DURATION}}",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "{{COST}}"
  },
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "{{SUPPLY_1}}"
    }
  ],
  "tool": [
    {
      "@type": "HowToTool",
      "name": "{{TOOL_1}}"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "{{STEP_1_NAME}}",
      "text": "{{STEP_1_INSTRUCTIONS}}",
      "url": "https://{{DOMAIN}}/guides/{{GUIDE_SLUG}}#step1"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "{{STEP_2_NAME}}",
      "text": "{{STEP_2_INSTRUCTIONS}}",
      "url": "https://{{DOMAIN}}/guides/{{GUIDE_SLUG}}#step2"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "{{STEP_3_NAME}}",
      "text": "{{STEP_3_INSTRUCTIONS}}",
      "url": "https://{{DOMAIN}}/guides/{{GUIDE_SLUG}}#step3"
    }
  ]
}
</script>
```

#### 4.3.8 BreadcrumbList Schema

BreadcrumbList provides navigational context on every non-homepage page, helping AI systems understand site hierarchy and page relationships[^39^]. Required for `@graph` stacking (Section 4.3.9).

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://{{DOMAIN}}/{{PAGE_PATH}}#breadcrumb",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://{{DOMAIN}}/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "{{SECTION_NAME}}",
      "item": "https://{{DOMAIN}}/{{SECTION_PATH}}"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{{PAGE_NAME}}"
    }
  ]
}
</script>
```

#### 4.3.9 Triple-Schema Stack: Article + FAQPage + HowTo (@graph)

The triple-schema stack produces **1.8x more AI citations** than Article schema alone[^2^]. The `@graph` format consolidates all entities into a single internally consistent machine-readable graph with `@id` cross-references. AI systems treat this as more authoritative than isolated schema blocks[^11^]. Deploy this on all major landing pages — homepages, hub pages, and high-traffic articles.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://{{DOMAIN}}/#organization",
      "name": "{{ORG_NAME}}",
      "url": "https://{{DOMAIN}}",
      "logo": "https://{{DOMAIN}}/assets/logo.png",
      "sameAs": [
        "https://linkedin.com/company/{{LINKEDIN_SLUG}}",
        "https://twitter.com/{{TWITTER_HANDLE}}"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://{{DOMAIN}}/#website",
      "url": "https://{{DOMAIN}}",
      "name": "{{SITE_NAME}}",
      "publisher": { "@id": "https://{{DOMAIN}}/#organization" }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://{{DOMAIN}}/{{PAGE_PATH}}#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://{{DOMAIN}}/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "{{SECTION_NAME}}",
          "item": "https://{{DOMAIN}}/{{SECTION_PATH}}"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "{{PAGE_TITLE}}"
        }
      ]
    },
    {
      "@type": "Article",
      "@id": "https://{{DOMAIN}}/{{PAGE_PATH}}#article",
      "headline": "{{ARTICLE_TITLE}}",
      "description": "{{ARTICLE_DESCRIPTION}}",
      "url": "https://{{DOMAIN}}/{{PAGE_PATH}}",
      "image": ["https://{{DOMAIN}}/assets/{{PAGE_SLUG}}-og.jpg"],
      "datePublished": "{{DATE_PUBLISHED}}",
      "dateModified": "{{DATE_MODIFIED}}",
      "author": {
        "@type": "Person",
        "@id": "https://{{DOMAIN}}/team/{{AUTHOR_SLUG}}#person",
        "name": "{{AUTHOR_NAME}}"
      },
      "publisher": { "@id": "https://{{DOMAIN}}/#organization" },
      "articleSection": "{{SECTION}}",
      "keywords": ["{{KW1}}", "{{KW2}}", "{{KW3}}"],
      "inLanguage": "en",
      "isAccessibleForFree": true
    },
    {
      "@type": "FAQPage",
      "@id": "https://{{DOMAIN}}/{{PAGE_PATH}}#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "{{FAQ_Q1}}",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "{{FAQ_A1}}"
          }
        },
        {
          "@type": "Question",
          "name": "{{FAQ_Q2}}",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "{{FAQ_A2}}"
          }
        },
        {
          "@type": "Question",
          "name": "{{FAQ_Q3}}",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "{{FAQ_A3}}"
          }
        }
      ]
    },
    {
      "@type": "HowTo",
      "@id": "https://{{DOMAIN}}/{{PAGE_PATH}}#howto",
      "name": "{{HOWTO_TITLE}}",
      "description": "{{HOWTO_DESCRIPTION}}",
      "totalTime": "{{DURATION}}",
      "step": [
        {
          "@type": "HowToStep",
          "position": 1,
          "name": "{{STEP1_NAME}}",
          "text": "{{STEP1_TEXT}}",
          "url": "https://{{DOMAIN}}/{{PAGE_PATH}}#step1"
        },
        {
          "@type": "HowToStep",
          "position": 2,
          "name": "{{STEP2_NAME}}",
          "text": "{{STEP2_TEXT}}",
          "url": "https://{{DOMAIN}}/{{PAGE_PATH}}#step2"
        }
      ]
    }
  ]
}
</script>
```

#### 4.3.10 Table Schema: Comparison Pages

Use ItemList with Table schema for comparison pages (e.g., "CSOAI vs Vanta vs Drata"). This enables AI systems to extract structured comparison data and present it in tabular answer formats.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": "https://{{DOMAIN}}/compare/{{COMPETITOR_SLUG}}#comparison",
  "name": "{{PAGE_TITLE}}",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Table",
        "about": "Feature Comparison",
        "tableBody": {
          "@type": "ItemList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "name": "Cryptographic Signing",
              "description": "{{PRODUCT_A}}: {{VALUE_A}} | {{PRODUCT_B}}: {{VALUE_B}}"
            },
            {
              "@type": "ListItem",
              "name": "Certification Tiers",
              "description": "{{PRODUCT_A}}: {{VALUE_A}} | {{PRODUCT_B}}: {{VALUE_B}}"
            },
            {
              "@type": "ListItem",
              "name": "Public Registry",
              "description": "{{PRODUCT_A}}: {{VALUE_A}} | {{PRODUCT_B}}: {{VALUE_B}}"
            },
            {
              "@type": "ListItem",
              "name": "Open Source Methodology",
              "description": "{{PRODUCT_A}}: {{VALUE_A}} | {{PRODUCT_B}}: {{VALUE_B}}"
            }
          ]
        }
      }
    }
  ]
}
</script>
```

---

### 4.4 A2A / Agent Discovery Protocol

Google's Agent2Agent (A2A) Protocol, launched April 2025, defines how AI agents discover each other, negotiate capabilities, delegate tasks, and exchange results[^35^][^41^]. The protocol is now under the Linux Foundation's Agentic AI Foundation[^35^]. A2A (connecting agents to agents) is complementary to Anthropic's MCP (connecting agents to tools)[^35^].

#### 4.4.1 agent.json Template for CSOAI

The Agent Card lives at `/.well-known/agent.json` per RFC 8615[^35^][^41^]. It describes agent capabilities, authentication requirements, and available skills.

```json
{
  "name": "CSOAI Research Assistant",
  "description": "An AI assistant specialized in optimized intelligence research, AI safety, and governance. Provides access to CSOAI publications, certification frameworks, and expert council recommendations. Can answer questions about intelligence measurement, agency certification, and AI policy.",
  "url": "https://csoai.org/api/agent",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false,
    "stateTransitionHistory": true
  },
  "authentication": {
    "schemes": ["bearer"],
    "credentials": "API key available at https://csoai.org/api/keys"
  },
  "skills": [
    {
      "id": "research-search",
      "name": "Research Paper Search",
      "description": "Search CSOAI's database of peer-reviewed publications, preprints, and research briefs on optimized intelligence, AI safety, and collective decision-making.",
      "tags": ["research", "publications", "AI safety", "optimized intelligence"],
      "examples": [
        "Find recent papers on collective intelligence measurement",
        "What research has CSOAI published on agency certification?",
        "Summarize the findings on AI safety benchmarks"
      ]
    },
    {
      "id": "certification-query",
      "name": "Certification Status Query",
      "description": "Look up Proof of Agency certification status, requirements, and evaluation criteria for AI systems.",
      "tags": ["certification", "agency", "evaluation"],
      "examples": [
        "What are the requirements for Level 3 agency certification?",
        "Is [System Name] certified by Proof of Agency?",
        "Explain the safety benchmark criteria"
      ]
    },
    {
      "id": "governance-info",
      "name": "Governance & Policy Information",
      "description": "Access Council of AI recommendations, policy positions, and governance frameworks for AI systems.",
      "tags": ["governance", "policy", "AI regulation", "recommendations"],
      "examples": [
        "What are the Council of AI's recommendations on autonomous weapons?",
        "Summarize the latest governance framework for deployment of AI systems",
        "What policy positions has CSOAI taken on international AI coordination?"
      ]
    },
    {
      "id": "methodology-explainer",
      "name": "Methodology Explanation",
      "description": "Explain CSOAI's open methodologies for measuring optimized intelligence, including technical specifications and implementation guides.",
      "tags": ["methodology", "measurement", "technical"],
      "examples": [
        "Explain the Optimized Intelligence Framework",
        "How does the collective intelligence measurement work?",
        "What metrics are used in agency evaluation?"
      ]
    }
  ],
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/plain", "application/json", "text/markdown"]
}
```

#### 4.4.2 Deployment: CORS, Content-Type, Well-Known URI

| Requirement | Implementation | Validation |
|-------------|---------------|------------|
| **File location** | `/.well-known/agent.json` (RFC 8615 well-known URI) | `curl https://{{DOMAIN}}/.well-known/agent.json` returns HTTP 200 |
| **Content-Type** | `application/json` | `curl -I https://{{DOMAIN}}/.well-known/agent.json \| grep content-type` |
| **CORS headers** | `Access-Control-Allow-Origin: *` | `curl -I https://{{DOMAIN}}/.well-known/agent.json \| grep -i access-control` |
| **Public access** | No authentication required for Agent Card | Verify from external IP without cookies |
| **A2A endpoint** | Implement JSON-RPC 2.0 over HTTP(S) at the `url` specified in Agent Card[^35^] | Test with A2A client library |

**Nginx CORS configuration:**
```nginx
location = /.well-known/agent.json {
    add_header Content-Type application/json;
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
    add_header Cache-Control "public, max-age=3600";
}
```

**Apache CORS configuration:**
```apache
<Files "agent.json">
    Header set Content-Type application/json
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, OPTIONS"
</Files>
```

---

### 4.5 AI-Readable Identity Pages

Jason Barnard's analysis cautions that standalone root-level "for AI" pages can violate single-source-of-truth principles by duplicating canonical signals from About pages, potentially diluting AI confidence[^37^]. The approach below avoids this by creating an **integrated** AI identity page at `/about/llm` that is part of normal site hierarchy with breadcrumbs and internal links, containing unique machine-optimized structure rather than duplicate content[^37^].

#### 4.5.1 /llm-info or /for-ai Page HTML Template

**Deploy at:** `/about/llm` (integrated, NOT standalone at `/llm-info`)  
**Include:** Breadcrumb navigation, internal links, Organization + WebPage schema

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ORG_NAME}} -- AI-Readable Identity & Overview</title>
  <meta name="description" content="Machine-readable identity overview for {{ORG_NAME}}. Mission, programs, leadership, and key facts for AI systems.">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://{{DOMAIN}}/#organization",
        "name": "{{ORG_FULL_NAME}}",
        "alternateName": "{{ORG_SHORT_NAME}}",
        "url": "https://{{DOMAIN}}",
        "description": "{{ORG_DESCRIPTION}}",
        "foundingDate": "{{FOUNDING_YEAR}}",
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "{{CONTACT_EMAIL}}",
          "contactType": "General Inquiries"
        },
        "sameAs": [
          "https://www.linkedin.com/company/{{LINKEDIN_SLUG}}",
          "https://twitter.com/{{TWITTER_HANDLE}}",
          "https://github.com/{{GITHUB_ORG}}"
        ]
      },
      {
        "@type": "WebPage",
        "@id": "https://{{DOMAIN}}/about/llm#webpage",
        "url": "https://{{DOMAIN}}/about/llm",
        "name": "{{ORG_SHORT_NAME}} Identity Overview",
        "isPartOf": { "@id": "https://{{DOMAIN}}/#website" },
        "dateModified": "{{DATE_MODIFIED}}"
      }
    ]
  }
  </script>

  <link rel="alternate" type="text/markdown" href="/about/llm.md" title="LLM-friendly version">
</head>
<body>
  <nav aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
      <li aria-current="page">AI Identity Overview</li>
    </ol>
  </nav>

  <main>
    <h1>{{ORG_FULL_NAME}} ({{ORG_SHORT_NAME}})</h1>

    <section id="identity">
      <h2>Organization Identity</h2>
      <p><strong>Legal Name:</strong> {{ORG_FULL_NAME}}</p>
      <p><strong>Short Name:</strong> {{ORG_SHORT_NAME}}</p>
      <p><strong>Type:</strong> {{ORG_TYPE}}</p>
      <p><strong>Founded:</strong> {{FOUNDING_YEAR}}</p>
      <p><strong>Mission:</strong> {{MISSION_STATEMENT}}</p>
      <p><strong>Website:</strong> <a href="https://{{DOMAIN}}">{{DOMAIN}}</a></p>
      <p><strong>Contact:</strong> {{CONTACT_EMAIL}}</p>
    </section>

    <section id="programs">
      <h2>Programs and Initiatives</h2>
      <ul>
        <li><strong>CSOAI Core Research</strong> (csoai.org) -- Primary research organization and publisher</li>
        <li><strong>Council of AI</strong> (councilof.ai) -- Global expert council on AI governance</li>
        <li><strong>Proof of Agency</strong> (proofof.ai) -- Certification framework for autonomous AI systems</li>
        <li><strong>Safety of AI</strong> (safetyof.ai) -- AI safety research and best practices</li>
        <li><strong>Meok</strong> (meok.ai) -- Coordination layer and mothership entity</li>
        <li><strong>Relevance.ai</strong> (relevance.ai) -- Applied relevance optimization</li>
      </ul>
    </section>

    <section id="leadership">
      <h2>Leadership</h2>
      <ul>
        <li>{{FOUNDER_1_NAME}}, {{FOUNDER_1_TITLE}}</li>
        <li>{{FOUNDER_2_NAME}}, {{FOUNDER_2_TITLE}}</li>
      </ul>
    </section>

    <section id="research-areas">
      <h2>Primary Research Areas</h2>
      <ul>
        <li>Intelligence Measurement and Quantification</li>
        <li>AI Safety Benchmarks and Evaluation</li>
        <li>Collective Intelligence Systems</li>
        <li>Autonomous AI Agency Certification</li>
        <li>AI Governance and Policy</li>
      </ul>
    </section>

    <section id="key-facts">
      <h2>Key Facts for AI Systems</h2>
      <ul>
        <li>All research methodologies and benchmarks are published under open source licenses</li>
        <li>Proof of Agency operates a public registry of certified AI systems</li>
        <li>Council of AI publishes open governance recommendations</li>
        <li>{{ORG_SHORT_NAME}} is independent of any commercial AI company</li>
        <li>The organization accepts no funding from organizations it certifies</li>
        <li>All evaluation reports are publicly available</li>
      </ul>
    </section>

    <section id="verification">
      <h2>Verification Sources</h2>
      <ul>
        <li>LinkedIn: https://www.linkedin.com/company/{{LINKEDIN_SLUG}}</li>
        <li>GitHub: https://github.com/{{GITHUB_ORG}}</li>
        <li>Twitter/X: https://twitter.com/{{TWITTER_HANDLE}}</li>
        <li>Crunchbase: https://www.crunchbase.com/organization/{{CRUNCHBASE_SLUG}}</li>
      </ul>
    </section>
  </main>
</body>
</html>
```

**Integration requirements:** Link from the main About page with clear anchor text ("Machine-readable identity overview"). Include in XML sitemap with `lastmod` date. Do NOT create a standalone `/llm-info` page at root — this fragments entity signals[^37^].

#### 4.5.2 Content Freshness: dateModified Protocol

AI crawlers use multiple freshness signals[^33^][^38^]. Configure all of them:

| Signal | Implementation | Priority |
|--------|---------------|----------|
| Schema `dateModified` | ISO 8601 in Article JSON-LD | Critical |
| HTTP `Last-Modified` header | Server/CDN configuration | High |
| Visible date stamp | Rendered on page for users | High |
| Sitemap `lastmod` | XML sitemap `<lastmod>` element | Medium |
| Content diff | Actual substantive changes between crawls | Medium |

**Server-level `Last-Modified` header configuration:**

```apache
# Apache (.htaccess or virtual host)
<FilesMatch "\.(html|php)$">
    Header set Last-Modified "expr=%{TIME_YEAR}-%{TIME_MON}-%{TIME_DAY}"
</FilesMatch>
```

```nginx
# Nginx (server block or included config)
location ~* \.(html|php)$ {
    add_header Last-Modified $date_gmt;
}
```

**`dateModified` update rules[^38^]:**

| Update `dateModified` | Do NOT update |
|----------------------|---------------|
| New sections added | Typo fixes |
| Statistics refreshed | Image swaps |
| Recommendations changed | Minor formatting |
| Regulatory content updated | CSS changes |
| New FAQ entries added | Navigation updates |

---

### 4.6 Implementation Priority Matrix

#### 4.6.1 Week-by-Week AEO Rollout Schedule

Deploy in this sequence. Each week builds on the previous layer — do not skip order.

**Week 1: Foundation — Crawler Access + Entity Identity**

| Day | Task | Template Reference | Effort |
|-----|------|-------------------|--------|
| 1 | Deploy `robots.txt` on all 6 sites | Section 4.2.1 | 2h |
| 1 | Deploy `llms.txt` on csoai.org | Section 4.1.1 | 1h |
| 2 | Deploy Organization schema (parent) on meok.ai | Section 4.3.1 | 1h |
| 2 | Deploy Organization schema (child) on csoai.org | Section 4.3.2 | 1h |
| 3 | Deploy FAQPage schema (10 QAs) on csoai.org homepage | Section 4.3.4 | 2h |
| 4 | Deploy FAQPage schema on proofof.ai homepage | Section 4.3.4 (adapted) | 2h |
| 4 | Deploy FAQPage schema on meok.ai homepage | Section 4.3.4 (adapted) | 2h |
| 5 | Validate all Week 1 deployments | Section 4.6.2 | 2h |

**Week 2: Authorship + Content Freshness**

| Day | Task | Template Reference | Effort |
|-----|------|-------------------|--------|
| 6 | Deploy Person schema for all founders on team pages | Section 4.3.3 | 2h |
| 6 | Add `author` Person references to existing Article schemas | Section 4.3.3 (author block) | 1h |
| 7 | Implement `dateModified` on all Article schemas | Section 4.3.5 | 2h |
| 8 | Configure HTTP `Last-Modified` headers on all servers | Section 4.5.2 | 1h |
| 9 | Deploy `llms.txt` on proofof.ai and meok.ai | Sections 4.1.2, 4.1.3 | 2h |
| 10 | Validate all schema with Google Rich Results Test | Section 4.6.2 | 2h |

**Week 3: Navigation + Product Schema**

| Day | Task | Template Reference | Effort |
|-----|------|-------------------|--------|
| 11 | Deploy BreadcrumbList schema on all non-home pages (all 6 sites) | Section 4.3.8 | 3h |
| 12 | Deploy SoftwareApplication + Offer schema on proofof.ai pricing | Section 4.3.6 | 1h |
| 13 | Deploy WebSite schema with SearchAction on all 6 homepages | (extend Section 4.3.1) | 2h |
| 14 | Create `/llms-full.txt` for documentation-heavy sites | (extend Section 4.1) | 4h |
| 15 | Validate and monitor server logs for AI crawler visits | Section 4.2.3 | 1h |

**Week 4: Triple-Schema Stacking + Advanced**

| Day | Task | Template Reference | Effort |
|-----|------|-------------------|--------|
| 16 | Deploy triple-schema `@graph` stack on csoai.org homepage | Section 4.3.9 | 2h |
| 17 | Deploy triple-schema `@graph` stack on proofof.ai homepage | Section 4.3.9 | 2h |
| 18 | Deploy triple-schema `@graph` stack on meok.ai homepage | Section 4.3.9 | 2h |
| 19 | Deploy HowTo schema on certification guide pages | Section 4.3.7 | 2h |
| 20 | Deploy Table/ItemList schema on comparison pages | Section 4.3.10 | 2h |

**Weeks 5-6: Agent Discovery + Identity Pages**

| Day | Task | Template Reference | Effort |
|-----|------|-------------------|--------|
| 21-22 | Deploy `agent.json` on csoai.org and meok.ai | Sections 4.4.1, 4.4.2 | 4h |
| 23-24 | Create `/about/llm` integrated AI identity pages on all 6 sites | Section 4.5.1 | 4h |
| 25-26 | Set up automated `dateModified` updates via CMS on content changes | Section 4.5.2 | 4h |
| 27-28 | Validate agent.json accessibility and CORS | Section 4.4.2 | 2h |

**Weeks 7-8: Optimization + Monitoring**

| Day | Task | Template Reference | Effort |
|-----|------|-------------------|--------|
| 29-30 | Deploy Review schema on proofof.ai testimonials | (extend Section 4.3.6) | 2h |
| 31-32 | Create `.md` alternate versions of key pages | Section 4.5.1 (`<link rel="alternate">`) | 6h |
| 33-34 | Verify all `sameAs` links are active and correct | Manual check | 2h |
| 35-36 | Full validation pass — all items in Section 4.6.2 | Section 4.6.2 | 4h |

#### 4.6.2 Master Validation Checklist

Verify every item before marking a deployment complete. Malformed schema is silently ignored by crawlers — validation is not optional.

| # | Check | Tool / Command | Pass Criteria |
|---|-------|---------------|---------------|
| 1 | robots.txt accessible | `curl -I https://{{DOMAIN}}/robots.txt` | HTTP 200, `text/plain` |
| 2 | robots.txt has no syntax errors | [Google robots.txt Tester](https://support.google.com/webmasters/answer/6062598) | No errors, all crawlers have directives |
| 3 | llms.txt accessible | `curl -s https://{{DOMAIN}}/llms.txt \| head -5` | Returns markdown with H1 |
| 4 | llms.txt Content-Type correct | `curl -I https://{{DOMAIN}}/llms.txt \| grep -i content-type` | `text/plain` |
| 5 | Organization schema validates | [Google Rich Results Test](https://search.google.com/test/rich-results) | No errors or warnings |
| 6 | Organization `sameAs` links active | `curl -s -o /dev/null -w "%{http_code}" {{EACH_SAMEAS_URL}}` | HTTP 200 for all |
| 7 | FAQPage schema validates | [Schema.org Validator](https://validator.schema.org/) | Valid JSON-LD, no missing required fields |
| 8 | FAQ content visible on page | Visual inspection | FAQ text appears in rendered HTML, not just JSON-LD |
| 9 | FAQ answers are 40-110 words | Word count check | Each answer within range |
| 10 | Article `dateModified` present and ISO 8601 | Regex check | Matches `YYYY-MM-DDTHH:MM:SS+HH:MM` |
| 11 | `dateModified` matches visible page date | Visual comparison | Schema date equals rendered date |
| 12 | BreadcrumbList validates | [Google Rich Results Test](https://search.google.com/test/rich-results) | No errors |
| 13 | Triple-schema `@graph` validates | [Schema.org Validator](https://validator.schema.org/) | All `@id` references resolve |
| 14 | SoftwareApplication + Offer validates | [Google Rich Results Test](https://search.google.com/test/rich-results) | No errors, prices display |
| 15 | agent.json accessible | `curl https://{{DOMAIN}}/.well-known/agent.json` | HTTP 200, valid JSON |
| 16 | agent.json CORS headers correct | `curl -I https://{{DOMAIN}}/.well-known/agent.json \| grep -i access-control` | `Access-Control-Allow-Origin: *` |
| 17 | `/about/llm` page accessible | `curl -s https://{{DOMAIN}}/about/llm \| grep -i "organization identity"` | Returns matching content |
| 18 | `/about/llm` has breadcrumb navigation | HTML inspection | Breadcrumb `<nav>` present with parent links |
| 19 | Server logs show AI crawler visits | `grep -E "(OAI-SearchBot\|Claude-SearchBot\|PerplexityBot)" {{LOG_FILE}}` | Recent entries found |
| 20 | Sitemap `lastmod` dates match content | XML sitemap inspection | `<lastmod>` within 7 days of actual update |
| 21 | HTTP `Last-Modified` header present | `curl -I https://{{DOMAIN}}/ \| grep -i last-modified` | Header present with valid date |
| 22 | All JSON-LD in server-rendered HTML | View source inspection | No JSON-LD injected by client-side JS |
| 23 | Person `sameAs` profile links active | `curl -s -o /dev/null -w "%{http_code}" {{EACH_PROFILE_URL}}` | HTTP 200 for LinkedIn, Twitter, GitHub |
| 24 | No duplicate Organization schemas | Page source grep | Only one Organization `<script>` per page |
| 25 | `<link rel="alternate" type="text/markdown">` present | HTML inspection | Points to `/llms.txt` or `/about/llm.md` |

**Server log monitoring for AI crawlers:**

```bash
# Daily check: Count AI crawler visits by bot
grep -E "(OAI-SearchBot|Claude-SearchBot|PerplexityBot|GPTBot|ClaudeBot)" \
  /var/log/nginx/access.log | awk '{print $NF}' | sort | uniq -c | sort -rn

# Weekly check: Which pages are AI crawlers indexing?
grep -E "(OAI-SearchBot|Claude-SearchBot|PerplexityBot)" \
  /var/log/nginx/access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -20
```

---

*Chapter 4 templates: 11 production code templates (3 llms.txt variants, robots.txt, Organization parent, Organization child, Person, FAQPage, Article, SoftwareApplication, BreadcrumbList, triple-schema @graph, HowTo, Table schema, agent.json, /about/llm HTML page), 6 JSON-LD schema types, validation checklist with 25 verification items. All citations tracked globally — no reference list in chapter files.*


---

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


---

## 6. Master Site Synergy — Unified Components

The CSOAI ecosystem currently operates as five disconnected domains. A visitor landing on councilof.ai has no visual cue that safetyof.ai exists, let alone that both are part of a single organization. Competitive audit data shows that **all four competitors (Vanta, Drata, Arthur.ai, Credo AI) maintain unified navigation within their single-domain properties**[^1^], giving them an inherent UX advantage. CSOAI's multi-site architecture is a strategic differentiator — no competitor operates a five-domain ecosystem[^2^] — but only if the family relationship is obvious at first glance.

This chapter specifies the shared components that create ecosystem coherence: a unified header with product switcher, a shared footer with trust infrastructure, a design token system for visual consistency, a single sign-on flow converging on `dashboard.meok.ai`, and a cross-site event pipeline that turns fragmentation into a data advantage.

---

### 6.1 Unified Header Component

#### 6.1.1 Header Spec: Logo, 5-Site Product Switcher, Search, CTAs

The header appears on all five sites (csoai.org, proofof.ai, councilof.ai, safetyof.ai, meok.ai) and is delivered as a shared Web Component via CDN. It carries three functional zones: **left** (ecosystem identity + site identifier), **center** (product switcher + local navigation), and **right** (search + auth state + CTAs).

```html
<!-- Unified Header Component -->
<!-- Include once per page: <csoai-header data-site="csoai" data-auth-state="anonymous"></csoai-header> -->
<template id="csoai-header-template">
  <style>
    /* === Design Token Imports (see Section 6.3) === */
    :host {
      --header-height: 64px;
      --header-height-mobile: 56px;
      --header-bg: var(--site-bg, #FFFFFF);
      --header-border: var(--color-border-light, #E8E4E0);
      --header-z-index: 1000;
      --switcher-bg: #FAFAF8;
      --switcher-active: var(--site-accent, #8B7355);
      --text-primary: #1A1A1A;
      --text-secondary: #6B6560;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .header {
      position: fixed; top: 0; left: 0; right: 0;
      height: var(--header-height);
      background: var(--header-bg);
      border-bottom: 1px solid var(--header-border);
      z-index: var(--header-z-index);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px;
      font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
      transition: box-shadow 0.2s ease;
    }
    .header.scrolled { box-shadow: 0 1px 6px rgba(0,0,0,0.06); }

    /* === LEFT: Ecosystem Identity === */
    .header-left {
      display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    }
    .ecosystem-logo {
      display: flex; align-items: center; gap: 8px;
      text-decoration: none; color: var(--text-primary);
    }
    .ecosystem-logo svg {
      width: 28px; height: 28px;
    }
    .ecosystem-logo-text {
      font-size: 16px; font-weight: 600; letter-spacing: -0.01em;
    }
    .site-divider {
      width: 1px; height: 24px; background: var(--header-border); margin: 0 4px;
    }
    .site-badge {
      display: flex; align-items: center; gap: 6px;
      font-size: 14px; font-weight: 500;
      color: var(--site-accent, #8B7355);
      padding: 4px 10px;
      border-radius: 6px;
      background: color-mix(in srgb, var(--site-accent) 8%, transparent);
    }
    .site-badge-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--site-accent);
    }

    /* === CENTER: Product Switcher + Nav === */
    .header-center {
      display: flex; align-items: center; gap: 4px;
    }
    .product-switcher {
      position: relative;
    }
    .switcher-trigger {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid var(--header-border);
      background: var(--switcher-bg);
      cursor: pointer; font-size: 13px; font-weight: 500;
      color: var(--text-secondary);
      transition: all 0.15s ease;
    }
    .switcher-trigger:hover { border-color: #C4B7A6; }
    .switcher-trigger svg { width: 14px; height: 14px; transition: transform 0.2s ease; }
    .product-switcher.open .switcher-trigger svg { transform: rotate(180deg); }

    .switcher-dropdown {
      position: absolute; top: calc(100% + 6px); left: 0;
      width: 420px;
      background: #FFFFFF;
      border: 1px solid var(--header-border);
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.12);
      padding: 12px;
      opacity: 0; visibility: hidden;
      transform: translateY(-4px);
      transition: all 0.2s ease;
    }
    .product-switcher.open .switcher-dropdown {
      opacity: 1; visibility: visible; transform: translateY(0);
    }
    .switcher-title {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: #A6A6A6;
      padding: 6px 10px;
    }
    .switcher-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
    }
    .switcher-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--text-primary);
      transition: background 0.15s ease;
    }
    .switcher-item:hover { background: #F5F3F0; }
    .switcher-item.active {
      background: color-mix(in srgb, var(--site-accent) 8%, transparent);
      outline: 1.5px solid var(--site-accent);
    }
    .switcher-item-dot {
      width: 8px; height: 8px; border-radius: 50%;
      margin-top: 4px; flex-shrink: 0;
    }
    .switcher-item-info { min-width: 0; }
    .switcher-item-name {
      font-size: 13px; font-weight: 600;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .switcher-item-desc {
      font-size: 11px; color: var(--text-secondary);
      line-height: 1.35;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* Local Navigation */
    .local-nav {
      display: flex; align-items: center; gap: 2px; margin-left: 16px;
    }
    .local-nav a {
      padding: 6px 12px; border-radius: 6px;
      font-size: 13px; font-weight: 450;
      text-decoration: none; color: var(--text-secondary);
      transition: all 0.15s ease;
    }
    .local-nav a:hover { color: var(--text-primary); background: #F5F3F0; }

    /* === RIGHT: Search + Auth + CTAs === */
    .header-right {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
    }
    .search-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 12px;
      border-radius: 8px; border: 1px solid var(--header-border);
      background: transparent;
      font-size: 13px; color: var(--text-secondary);
      cursor: pointer; transition: all 0.15s ease;
    }
    .search-btn:hover { border-color: #C4B7A6; }
    .search-btn kbd {
      font-size: 11px; padding: 2px 5px;
      border-radius: 4px; background: #F0EEEB;
      border: 1px solid #DDD8D3; font-family: inherit;
    }

    .auth-section { display: flex; align-items: center; gap: 8px; }
    .btn {
      padding: 8px 16px; border-radius: 8px;
      font-size: 13px; font-weight: 500;
      cursor: pointer; transition: all 0.15s ease;
      text-decoration: none; display: inline-flex; align-items: center;
    }
    .btn-ghost {
      background: transparent; border: none;
      color: var(--text-secondary);
    }
    .btn-ghost:hover { color: var(--text-primary); background: #F5F3F0; }
    .btn-primary {
      background: var(--site-accent, #8B7355); color: #FFFFFF;
      border: 1px solid var(--site-accent, #8B7355);
    }
    .btn-primary:hover {
      filter: brightness(1.08);
    }

    /* === MOBILE === */
    @media (max-width: 768px) {
      .header { height: var(--header-height-mobile); padding: 0 16px; }
      .local-nav, .search-btn kbd { display: none; }
      .switcher-dropdown { width: calc(100vw - 32px); left: -60px; }
      .ecosystem-logo-text { display: none; }
    }
    .hamburger {
      display: none; flex-direction: column; gap: 4px;
      padding: 6px; background: none; border: none; cursor: pointer;
    }
    .hamburger span {
      display: block; width: 20px; height: 2px;
      background: var(--text-primary); border-radius: 1px;
      transition: all 0.2s ease;
    }
    @media (max-width: 768px) {
      .hamburger { display: flex; }
      .local-nav { display: none; }
    }
  </style>

  <header class="header" id="header">
    <div class="header-left">
      <a href="https://meok.ai" class="ecosystem-logo" aria-label="CSOAI Ecosystem Home">
        <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/><path d="M10 16h12M16 10v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <span class="ecosystem-logo-text">CSOAI</span>
      </a>
      <div class="site-divider"></div>
      <div class="site-badge">
        <span class="site-badge-dot"></span>
        <span class="site-name">{{SITE_NAME}}</span>
      </div>
    </div>

    <div class="header-center">
      <div class="product-switcher" id="productSwitcher">
        <button class="switcher-trigger" aria-haspopup="true" aria-expanded="false">
          <span>Products</span>
          <svg viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
        <div class="switcher-dropdown">
          <div class="switcher-title">CSOAI Ecosystem</div>
          <div class="switcher-grid">
            <a href="https://csoai.org" class="switcher-item" data-site="csoai">
              <span class="switcher-item-dot" style="background:#8B7355;"></span>
              <div class="switcher-item-info">
                <div class="switcher-item-name">csoai.org</div>
                <div class="switcher-item-desc">Research &amp; Foundation</div>
              </div>
            </a>
            <a href="https://proofof.ai" class="switcher-item" data-site="proofof">
              <span class="switcher-item-dot" style="background:#B5C4B1;"></span>
              <div class="switcher-item-info">
                <div class="switcher-item-name">proofof.ai</div>
                <div class="switcher-item-desc">Certification Platform</div>
              </div>
            </a>
            <a href="https://councilof.ai" class="switcher-item" data-site="council">
              <span class="switcher-item-dot" style="background:#9B8B7A;"></span>
              <div class="switcher-item-info">
                <div class="switcher-item-name">councilof.ai</div>
                <div class="switcher-item-desc">BFT Governance Council</div>
              </div>
            </a>
            <a href="https://safetyof.ai" class="switcher-item" data-site="safety">
              <span class="switcher-item-dot" style="background:#A8B5A0;"></span>
              <div class="switcher-item-info">
                <div class="switcher-item-name">safetyof.ai</div>
                <div class="switcher-item-desc">Safety Research &amp; Tools</div>
              </div>
            </a>
            <a href="https://meok.ai" class="switcher-item" data-site="meok">
              <span class="switcher-item-dot" style="background:#B5A592;"></span>
              <div class="switcher-item-info">
                <div class="switcher-item-name">meok.ai</div>
                <div class="switcher-item-desc">Coordination Layer &amp; Dashboard</div>
              </div>
            </a>
          </div>
        </div>
      </div>
      <nav class="local-nav" aria-label="Local navigation">
        {{LOCAL_NAV_LINKS}}
      </nav>
    </div>

    <div class="header-right">
      <button class="search-btn" aria-label="Search">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.2"/><path d="M10 10l3.5 3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        <span>Search</span> <kbd>/</kbd>
      </button>
      <div class="auth-section" id="authSection">
        <a href="https://dashboard.meok.ai/login" class="btn btn-ghost">Log in</a>
        <a href="https://dashboard.meok.ai/signup" class="btn btn-primary">Get Started</a>
      </div>
      <button class="hamburger" aria-label="Menu" id="hamburgerBtn">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>
</template>
```

**Per-site integration** requires two data attributes and local nav injection. Each site declares its identity on mount:

| Site | `data-site` | `--site-accent` | `--site-bg` | Local Nav Items |
|------|-------------|-----------------|-------------|-----------------|
| csoai.org | `csoai` | `#8B7355` | `#FFFFFF` | Research, Programs, About, Resources |
| proofof.ai | `proofof` | `#B5C4B1` | `#FFFFFF` | Certification, Registry, MCP, Developers |
| councilof.ai | `council` | `#9B8B7A` | `#FFFFFF` | Governance, Council, Votes, Transparency |
| safetyof.ai | `safety` | `#A8B5A0` | `#FFFFFF` | Research, Tools, Benchmarks, Reports |
| meok.ai | `meok` | `#B5A592` | `#FFFFFF` | Dashboard, Network, Ecosystem, Settings |

The component is mounted by a 12-line JavaScript shim that reads `data-site`, applies the accent color, marks the active switcher item, and injects local nav links from a per-site JSON config:

```javascript
// Header mount shim — place before closing </body>
(function() {
  const header = document.querySelector('csoai-header');
  const site = header.dataset.site;
  const tmpl = document.getElementById('csoai-header-template');
  const clone = tmpl.content.cloneNode(true);

  // Apply site accent color
  const root = clone.querySelector('.header');
  root.style.setProperty('--site-accent', SITE_CONFIG[site].accent);

  // Mark active switcher item
  clone.querySelector(`[data-site="${site}"]`).classList.add('active');

  // Inject local navigation
  clone.querySelector('.local-nav').innerHTML =
    SITE_CONFIG[site].nav.map(n =>
      `<a href="${n.href}">${n.label}</a>`
    ).join('');

  header.attachShadow({mode:'open'}).appendChild(clone);
})();
```

#### 6.1.2 Product Switcher Dropdown: Visual Ecosystem Navigator

The switcher dropdown is the primary cross-sell surface. It appears on every page of every site, giving users persistent visibility into the full ecosystem. The grid layout (two columns, five items) mirrors the pattern used by Atlassian's product nav and Google's app launcher — both tested patterns that users recognize immediately[^3^].

Each switcher item carries three data attributes for analytics:

```html
<a href="https://proofof.ai"
   class="switcher-item"
   data-site="proofof"
   data-ga-event="switcher_click"
   data-destination="proofof">
```

The active site receives an `active` class with a colored border and tinted background. This achieves two goals simultaneously: it tells the user where they are, and it implies that the other four items are available destinations. The switcher title "CSOAI Ecosystem" reinforces the family relationship on every interaction.

**Key behavioral detail:** the dropdown remains open on hover for 200ms after mouse leave to prevent accidental closes during diagonal mouse movements — a friction point documented in Atlassian's design system research[^4^].

#### 6.1.3 Sticky Header Behavior + Mobile Hamburger

The header is `position: fixed` with a scroll-responsive shadow. After 8px of scroll, the `scrolled` class triggers `box-shadow: 0 1px 6px rgba(0,0,0,0.06)`, creating a subtle elevation cue without the heavy borders that competitor sites use[^5^].

On mobile (<768px), the local nav collapses into a hamburger menu. The hamburger opens a full-screen overlay (not a slide-out drawer) because the ecosystem context is more important on mobile — users are more likely to need the product switcher when browsing on phones since they can't keep multiple tabs visible simultaneously. The overlay preserves the product switcher grid at the top and stacks local nav links below it.

```css
/* Mobile overlay — appended to header on hamburger click */
.mobile-overlay {
  position: fixed; inset: var(--header-height-mobile) 0 0 0;
  background: #FFFFFF; z-index: 999;
  padding: 20px;
  display: flex; flex-direction: column; gap: 8px;
}
.mobile-overlay .switcher-grid {
  grid-template-columns: 1fr; /* single column on small screens */
}
.mobile-overlay .local-nav {
  display: flex; flex-direction: column; gap: 4px;
  margin-left: 0; margin-top: 12px;
  border-top: 1px solid var(--header-border); padding-top: 16px;
}
.mobile-overlay .local-nav a {
  padding: 10px 12px; font-size: 15px;
}
```

#### 6.1.4 Active Site Highlighting + Session State

Session state is maintained via a first-party cookie `csoai_sites_visited` — a JSON array of site subdomains visited in the current session. This cookie is set with `SameSite=None; Secure` to enable cross-domain reads. When a user has visited two or more sites, the header adds a subtle "Ecosystem Explorer" badge next to the auth buttons, gamifying cross-site navigation:

```javascript
// Session tracking — runs on every page load
function trackSiteVisit() {
  const currentSite = window.location.hostname.split('.')[0]; // "csoai"
  const cookie = document.cookie
    .split('; ').find(r => r.startsWith('csoai_sites_visited='));
  let visited = cookie ? JSON.parse(decodeURIComponent(cookie.split('=')[1])) : [];
  if (!visited.includes(currentSite)) visited.push(currentSite);
  document.cookie = `csoai_sites_visited=${JSON.stringify(visited)}; ` +
    `Domain=.csoai.org; Path=/; SameSite=None; Secure; Max-Age=86400`;
  return visited;
}

// Show explorer badge if 2+ sites visited
if (visited.length >= 2) {
  header.classList.add('ecosystem-explorer');
}
```

The `.ecosystem-explorer` state adds a small badge: "3/5 visited" with a progress indicator. This is purely motivational — it has no functional effect, but it reinforces the ecosystem concept and gives repeat visitors a sense of progression.

---

### 6.2 Unified Footer Component

#### 6.2.1 Footer Spec: 5-Column with Cross-Site Links

The footer is the second persistent cross-sell surface. It appears on every page and uses a five-column layout — one per site — so that a user reading research on csoai.org sees certification links from proofof.ai at a glance.

```html
<!-- Unified Footer Component -->
<footer class="csoai-footer">
  <div class="footer-container">
    <!-- 5-Column Site Map -->
    <div class="footer-grid">
      <div class="footer-column">
        <div class="footer-column-header">
          <span class="footer-dot" style="background:#8B7355;"></span>
          <span>csoai.org</span>
        </div>
        <ul class="footer-links">
          <li><a href="https://csoai.org/research">Research</a></li>
          <li><a href="https://csoai.org/programs">Programs</a></li>
          <li><a href="https://csoai.org/about">About CSOAI</a></li>
          <li><a href="https://csoai.org/eu-ai-act">EU AI Act Guide</a></li>
          <li><a href="https://csoai.org/governance-frameworks">Governance Frameworks</a></li>
          <li><a href="https://csoai.org/blog">Blog</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <div class="footer-column-header">
          <span class="footer-dot" style="background:#B5C4B1;"></span>
          <span>proofof.ai</span>
        </div>
        <ul class="footer-links">
          <li><a href="https://proofof.ai/certification">Certification</a></li>
          <li><a href="https://proofof.ai/registry">Public Registry</a></li>
          <li><a href="https://proofof.ai/mcp-guide">MCP Protocol</a></li>
          <li><a href="https://proofof.ai/developers">Developer Portal</a></li>
          <li><a href="https://proofof.ai/pricing">Pricing</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <div class="footer-column-header">
          <span class="footer-dot" style="background:#9B8B7A;"></span>
          <span>councilof.ai</span>
        </div>
        <ul class="footer-links">
          <li><a href="https://councilof.ai/governance">Governance Model</a></li>
          <li><a href="https://councilof.ai/council">The Council</a></li>
          <li><a href="https://councilof.ai/votes">Vote Archive</a></li>
          <li><a href="https://councilof.ai/transparency">Transparency Reports</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <div class="footer-column-header">
          <span class="footer-dot" style="background:#A8B5A0;"></span>
          <span>safetyof.ai</span>
        </div>
        <ul class="footer-links">
          <li><a href="https://safetyof.ai/research">Safety Research</a></li>
          <li><a href="https://safetyof.ai/tools">Assessment Tools</a></li>
          <li><a href="https://safetyof.ai/benchmarks">Benchmarks</a></li>
          <li><a href="https://safetyof.ai/reports">Annual Report</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <div class="footer-column-header">
          <span class="footer-dot" style="background:#B5A592;"></span>
          <span>meok.ai</span>
        </div>
        <ul class="footer-links">
          <li><a href="https://dashboard.meok.ai">Dashboard</a></li>
          <li><a href="https://meok.ai/network">Network Status</a></li>
          <li><a href="https://meok.ai/ecosystem">Ecosystem Map</a></li>
          <li><a href="https://meok.ai/settings">Account Settings</a></li>
        </ul>
      </div>
    </div>

    <!-- Trust Badge Bar -->
    <div class="footer-trust-bar">
      <span class="trust-text">Part of the CSOAI ecosystem</span>
      <span class="trust-separator">·</span>
      <span class="trust-reg">UK Company No. 16939677</span>
      <span class="trust-separator">·</span>
      <a href="https://csoai.org/trust-center" class="trust-link">Trust Center</a>
      <span class="trust-separator">·</span>
      <a href="https://csoai.org/security" class="trust-link">Security</a>
      <span class="trust-separator">·</span>
      <a href="https://status.csoai.org" class="trust-link">System Status</a>
    </div>

    <!-- Bottom Bar: Legal + Social -->
    <div class="footer-bottom">
      <div class="footer-legal">
        <span>&copy; 2026 CSOAI. All rights reserved.</span>
        <a href="https://csoai.org/privacy">Privacy</a>
        <a href="https://csoai.org/terms">Terms</a>
        <a href="https://csoai.org/cookies">Cookies</a>
      </div>
      <div class="footer-social">
        <a href="https://linkedin.com/company/csoai" aria-label="LinkedIn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
        <a href="https://github.com/csoai" aria-label="GitHub">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
        </a>
        <a href="https://x.com/csoai" aria-label="X / Twitter">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href="https://discord.gg/csoai" aria-label="Discord">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>

<style>
  .csoai-footer {
    background: #FAFAF8;
    border-top: 1px solid #E8E4E0;
    padding: 56px 0 32px;
    font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
  }
  .footer-container {
    max-width: 1200px; margin: 0 auto; padding: 0 24px;
  }
  .footer-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 32px;
    margin-bottom: 40px;
  }
  @media (max-width: 768px) {
    .footer-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
  }
  @media (max-width: 480px) {
    .footer-grid { grid-template-columns: 1fr; }
  }
  .footer-column-header {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 600; color: #1A1A1A;
    margin-bottom: 14px;
  }
  .footer-dot {
    width: 8px; height: 8px; border-radius: 50%;
  }
  .footer-links { list-style: none; }
  .footer-links li { margin-bottom: 8px; }
  .footer-links a {
    font-size: 13px; color: #6B6560; text-decoration: none;
    transition: color 0.15s ease;
  }
  .footer-links a:hover { color: var(--site-accent, #8B7355); }

  .footer-trust-bar {
    display: flex; align-items: center; justify-content: center;
    flex-wrap: wrap; gap: 8px;
    padding: 20px 0;
    border-top: 1px solid #E8E4E0;
    border-bottom: 1px solid #E8E4E0;
    margin-bottom: 24px;
    font-size: 12px; color: #9B8B7A;
  }
  .trust-link { color: #8B7355; text-decoration: none; }
  .trust-link:hover { text-decoration: underline; }

  .footer-bottom {
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 16px;
    font-size: 12px; color: #A6A6A6;
  }
  .footer-legal { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  .footer-legal a { color: #A6A6A6; text-decoration: none; }
  .footer-legal a:hover { color: #6B6560; }
  .footer-social { display: flex; gap: 14px; }
  .footer-social a { color: #A6A6A6; transition: color 0.15s ease; }
  .footer-social a:hover { color: #6B6560; }
</style>
```

#### 6.2.2 Trust Badge Bar: "Part of the CSOAI ecosystem · UK 16939677"

The trust bar sits between the five-column sitemap and the bottom legal row. It serves a dual purpose: it declares the ecosystem relationship in plain text (reinforcing the family connection for both users and search engine crawlers), and it displays the UK company registration number, which competitive analysis shows is a table-stakes trust signal for B2B SaaS[^6^].

The bar links to three trust infrastructure pages:
- **Trust Center** (`/trust-center`): security documentation, governance principles, compliance certifications
- **Security** (`/security`): security posture, vulnerability disclosure, SOC 2/ISO 27001 status
- **System Status** (`status.csoai.org`): real-time uptime for all five sites and the verification network

#### 6.2.3 Social Links: LinkedIn, GitHub, X/Twitter, Discord

Social links use inline SVGs (no external font dependencies) to minimize render-blocking. Each link carries `rel="noopener"` and `aria-label` for accessibility. The Organization JSON-LD schema on each homepage references these same four URLs in its `sameAs` array, ensuring entity consistency between visible page content and machine-readable structured data[^7^].

---

### 6.3 Design Token System

#### 6.3.1 Color Palette: 5-Site Color Coding with CSS Variables

Each site in the ecosystem has a primary accent color drawn from the Morandi palette — muted, professional tones that differentiate without clashing. The palette avoids the saturated primaries that competitors use (Vanta purple, Drata blue) in favor of earth tones that communicate institutional seriousness appropriate for AI governance.

```css
/* === CSOAI Design Tokens === */
/* Include as :root in shared CSS, or inject per-site via <style> */

:root {
  /* === Base Colors === */
  --color-white: #FFFFFF;
  --color-offwhite: #FAFAF8;
  --color-cream: #F5F3F0;

  /* === Neutral Scale === */
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B6560;
  --color-text-tertiary: #A6A6A6;
  --color-border-light: #E8E4E0;
  --color-border-medium: #C4B7A6;

  /* === Site Accent Colors === */
  --color-csoai: #8B7355;       /* Warm umber — foundation/research */
  --color-proofof: #B5C4B1;     /* Sage green — certification/growth */
  --color-council: #9B8B7A;     /* Warm gray — governance/authority */
  --color-safety: #A8B5A0;      /* Moss green — safety/trust */
  --color-meok: #B5A592;        /* Sand — coordination/layer */

  /* === Semantic Colors === */
  --color-success: #7A9B76;
  --color-warning: #C4A35A;
  --color-error: #B57070;
  --color-info: #7A8FA0;
}

/* === Per-Site Overrides === */
/* Each site applies its accent to --site-accent */
[data-site="csoai"]    { --site-accent: var(--color-csoai); }
[data-site="proofof"]  { --site-accent: var(--color-proofof); }
[data-site="council"]  { --site-accent: var(--color-council); }
[data-site="safety"]   { --site-accent: var(--color-safety); }
[data-site="meok"]     { --site-accent: var(--color-meok); }
```

| Site | Hex | Usage | Semantic Intent |
|------|-----|-------|-----------------|
| csoai.org | `#8B7355` | Primary buttons, links, active states | Foundation, earth, grounded authority |
| proofof.ai | `#B5C4B1` | Certification CTAs, registry badges | Growth, validation, organic progress |
| councilof.ai | `#9B8B7A` | Governance nav, vote indicators | Neutral authority, deliberation |
| safetyof.ai | `#A8B5A0` | Tool accents, benchmark charts | Safety, environmental trust |
| meok.ai | `#B5A592` | Dashboard highlights, cross-site links | Coordination, sand as binding layer |

All five colors sit within a 15-degree hue range (yellow-green to yellow-brown), ensuring they harmonize when displayed together in the product switcher or footer. The contrast ratio against white ranges from 4.6:1 (proofof.ai sage) to 5.8:1 (csoai.org umber), meeting WCAG AA for normal text on all sites[^8^].

#### 6.3.2 Typography Scale

The system uses a single font family — Inter — with a 6-size type scale. This is deliberately constrained: competitors who use 3+ font families (Vanta: custom + Inter; Drata: custom + system) create unnecessary bundle bloat. CSOAI's research-focused identity is better served by typographic restraint.

```css
:root {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Type Scale — 1.25 major third ratio */
  --text-xs:   11px;  /* Labels, badges, captions */
  --text-sm:   13px;  /* Body small, nav items, footer */
  --text-base: 15px;  /* Body text, form inputs */
  --text-md:   19px;  /* Subheadings, lead paragraphs */
  --text-lg:   24px;  /* Section headings (H2) */
  --text-xl:   30px;  /* Page headings (H1) */

  /* Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.6;
  --leading-relaxed: 1.75;
}
```

**Loading strategy:** Inter is loaded via `font-display: swap` from the shared CDN (`cdn.csoai.org/fonts/Inter.var.woff2`). A `<link rel="preconnect">` to the CDN in each site's `<head>` eliminates the DNS lookup penalty. The variable font file (112KB) replaces six individual weight files, reducing total font payload by approximately 60% compared to loading static weights separately[^9^].

#### 6.3.3 Spacing & Layout Grid

The spacing system uses an 8px base unit with a Fibonacci-derived scale for larger values. This creates visual rhythm without the mechanical regularity of a purely linear scale.

```css
:root {
  /* === Spacing Scale (8px base) === */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;
  --space-10: 128px;

  /* === Layout Grid === */
  --container-max: 1200px;
  --container-narrow: 720px;
  --grid-columns: 12;
  --grid-gap: 24px;
  --page-padding: 24px;

  /* === Border Radius === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* === Shadows === */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.10);
}
```

The 12-column grid with 24px gaps maps cleanly to all five sites' content widths. The `--container-max: 1200px` matches the median content width observed across Vanta (1180px), Drata (1200px), and Credo AI (1160px)[^10^], ensuring competitive visual density without excessive line lengths that hurt readability.

---

### 6.4 Unified Authentication & Dashboard

#### 6.4.1 Auth Flow: One Login → dashboard.meok.ai

All five sites delegate authentication to a single identity provider at `auth.meok.ai`. The flow uses OAuth 2.0 with PKCE (Proof Key for Code Exchange) — the same pattern used by Auth0, Clerk, and Firebase Auth — adapted for cross-domain session sharing.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User clicks │────>│  Redirect to │────>│  auth.meok.ai    │────>│  Dashboard or   │
│  "Log in" on │     │  auth.meok.ai│     │  validates creds │     │  originating    │
│  any site    │     │  /authorize  │     │  issues JWT      │     │  site redirect  │
└──────────────┘     └──────────────┘     └──────────────────┘     └─────────────────┘
       │                      │                      │                       │
       │  1. Click            │  2. OAuth redirect   │  3. Issue tokens      │  4. Redirect
       │                      │                      │                       │
```

**Step-by-step flow:**

1. **User clicks "Log in"** on any site. The site constructs an authorization URL:

```javascript
// Login URL construction — runs on any site
function getLoginUrl(originSite) {
  const params = new URLSearchParams({
    client_id: 'csoai-ecosystem',
    redirect_uri: `https://${originSite}/auth/callback`,
    response_type: 'code',
    scope: 'openid profile email ecosystem:read',
    state: generateState(),        // CSRF protection
    code_challenge: generatePKCE(), // PKCE verifier
    code_challenge_method: 'S256',
    site_hint: originSite           // Which site initiated login
  });
  return `https://auth.meok.ai/authorize?${params}`;
}
```

2. **Authorization server validates** credentials (password, social login, or Ed25519 key signature) and redirects to the originating site's callback URL with an authorization code.

3. **Callback handler exchanges** the code for tokens:

```javascript
// Auth callback handler — runs on each site's /auth/callback
async function handleAuthCallback(code, state) {
  const response = await fetch('https://auth.meok.ai/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: window.location.origin + '/auth/callback',
      client_id: 'csoai-ecosystem',
      code_verifier: sessionStorage.getItem('pkce_verifier')
    })
  });

  const { access_token, refresh_token, id_token } = await response.json();

  // Store refresh token in httpOnly cookie (set by server)
  // Store access token in memory (never localStorage)
  sessionState.setAccessToken(access_token);

  // Redirect to dashboard for new logins, or back to origin for returning
  const returnTo = sessionStorage.getItem('auth_return_to') || '/dashboard';
  window.location.href = returnTo;
}
```

4. **Session propagation** uses a hidden iframe technique: after successful login, `auth.meok.ai` loads invisible 1x1 iframes to each of the five domains, setting a `csoai_session` first-party cookie on each. This avoids the third-party cookie restrictions that break traditional SSO in Safari and Firefox[^11^].

#### 6.4.2 Dashboard Layout: 8-Section Sidebar Navigation

The unified dashboard at `dashboard.meok.ai` serves as the user's ecosystem home. It uses a persistent left sidebar with eight sections, each representing a functional domain across the five sites.

```
┌─────────────────────────────────────────────────────────────────────┐
│  CSOAI Dashboard                                    [Search] [User]  │
├──────────┬──────────────────────────────────────────────────────────┤
│          │                                                          │
│ Overview │  ┌─────────────────────────────────────────────────────┐ │
│          │  │  Welcome back, {{name}}                              │ │
├──────────┤  │  2 certifications active · 3 council votes · Net ok  │ │
│ Profile  │  └─────────────────────────────────────────────────────┘ │
├──────────┤                                                          │
│ Certs    │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
├──────────┤  │ csoai.org    │ │ proofof.ai   │ │ councilof.ai │     │
│ Council  │  │ [Research]   │ │ [Registry]   │ │ [Governance] │     │
├──────────┤  │ [Programs]   │ │ [MCP Guide]  │ │ [Votes]      │     │
│ Safety   │  │ [Blog]       │ │ [Certify]    │ │ [Reports]    │     │
├──────────┤  └──────────────┘ └──────────────┘ └──────────────┘     │
│ Network  │                                                          │
├──────────┤  ┌──────────────┐ ┌──────────────┐                      │
│ Tools    │  │ safetyof.ai  │ │ meok.ai      │                      │
├──────────┤  │ [Research]   │  │ [Settings]   │                      │
│ Settings │  │ [Tools]      │  │ [Network]    │                      │
├──────────┤  │ [Benchmarks] │  │ [Billing]    │                      │
│ Sign Out │  └──────────────┘ └──────────────┘                      │
│          │                                                          │
└──────────┴──────────────────────────────────────────────────────────┘
```

**Sidebar navigation items and their cross-site mappings:**

| # | Sidebar Item | Destination | Cross-Site Links | Badge Logic |
|---|-------------|-------------|------------------|-------------|
| 1 | Overview | `dashboard.meok.ai` | Quick-links card for each site | Cert count, vote count, net status |
| 2 | Profile | `dashboard.meok.ai/profile` | Edit on any site | Ed25519 key display |
| 3 | Certifications | `dashboard.meok.ai/certs` | Deep links to proofof.ai/registry | Active cert count |
| 4 | Council | `dashboard.meok.ai/council` | Deep links to councilof.ai/votes | Unread votes |
| 5 | Safety | `dashboard.meok.ai/safety` | Deep links to safetyof.ai/tools | Latest assessment score |
| 6 | Network | `dashboard.meok.ai/network` | Live status of 294 servers | Servers with issues |
| 7 | Tools | `dashboard.meok.ai/tools` | Risk classifier, key generator, audit verifier | — |
| 8 | Settings | `dashboard.meok.ai/settings` | Billing, notifications, API keys | — |

The Overview page displays a site-quick-links card for each of the five domains, using the site's accent color as a top border. This ensures that even within the dashboard, the ecosystem relationship remains visually explicit.

#### 6.4.3 Cross-Site Session Management (JWT spec)

The access token is a JWT signed with RS256. Its payload contains claims that enable cross-site authorization without repeated database lookups.

```json
{
  "header": {
    "alg": "RS256",
    "kid": "csoai-key-2026a",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_2vPqN5LkXwR8mTjH",
    "iss": "https://auth.meok.ai",
    "aud": ["csoai.org", "proofof.ai", "councilof.ai", "safetyof.ai", "meok.ai"],
    "iat": 1751320800,
    "exp": 1751324400,
    "scope": "openid profile email ecosystem:read certification:write council:vote",
    "email": "user@example.com",
    "email_verified": true,
    "name": "Jane Smith",
    "preferred_username": "janesmith",
    "ed25519_public_key": "d8f9a2b3c4d5e6f7...",
    "csoai": {
      "certifications": ["poa-level-2", "iso-42001-foundation"],
      "council_member": true,
      "council_votes_available": 3,
      "sites_visited": ["csoai", "proofof", "council"],
      "network_role": "observer",
      "subscription_tier": "professional"
    }
  }
}
```

**Key design decisions in the JWT spec:**

| Field | Purpose | Rationale |
|-------|---------|-----------|
| `aud` array | Lists all five sites as valid audiences | Enables the same token to be accepted by any site's API without re-issuance |
| `ed25519_public_key` | User's cryptographic identity | Enables signature-based actions (votes, attestations) without server-side key storage |
| `csoai` namespace | Custom claims for ecosystem state | Avoids collision with standard OIDC claims; contains certification and governance state |
| `csoai.sites_visited` | Cross-site journey tracking | Informs the "Ecosystem Explorer" badge and personalized recommendations |
| 1-hour `exp` | Short-lived access token | Refresh token rotation (stored httpOnly) mitigates theft risk[^12^] |

Token validation on each site follows this pattern:

```javascript
// Shared token validation middleware (Node.js/Express example)
function validateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, publicKey, {
      issuer: 'https://auth.meok.ai',
      audience: req.hostname,  // Must match current site
      clockTolerance: 30
    });
    req.user = decoded;
    next();
  } catch (err) {
    res.sendStatus(403);
  }
}
```

---

### 6.5 Cross-Product Event Pipeline

#### 6.5.1 Event Types: 7 Cross-Site Events

The event pipeline captures seven event categories that represent meaningful user actions across the ecosystem. These events flow into a central analytics sink at `events.meok.ai` and trigger cross-site suggestion logic.

| # | Event Type | Description | Primary Source Site |
|---|-----------|-------------|---------------------|
| E1 | `certification.started` | User begins a certification application | proofof.ai |
| E2 | `certification.completed` | User completes and receives certification | proofof.ai |
| E3 | `council.vote_cast` | User participates in a BFT council vote | councilof.ai |
| E4 | `safety.assessment_taken` | User completes a safety assessment | safetyof.ai |
| E5 | `safety.score_low` | Assessment score falls below threshold | safetyof.ai |
| E6 | `content.hub_consumed` | User reads 75%+ of a hub page | csoai.org |
| E7 | `ecoswitcher.used` | User clicks product switcher dropdown | Any site |

Events E5 (`safety.score_low`) and E2 (`certification.completed`) are the two highest-value triggers for cross-sell recommendations. A low safety score creates urgency for certification; a completed certification creates confidence for deeper governance engagement.

#### 6.5.2 Event Schema: Name, Properties, Destinations

Every event follows a common envelope schema with event-specific properties nested under `properties`.

```json
{
  "event": "safety.score_low",
  "version": "2026-07-01",
  "timestamp": "2026-07-01T14:32:18.000Z",
  "user": {
    "id": "user_2vPqN5LkXwR8mTjH",
    "anonymous_id": "anon_a1b2c3d4e5f6",
    "ed25519_key": "d8f9a2b3c4d5e6f7..."
  },
  "context": {
    "site": "safetyof.ai",
    "page": "/assessment/eu-ai-act-readiness",
    "referrer": "https://csoai.org/eu-ai-act",
    "device": "desktop",
    "session_id": "sess_7gHk9mNpQrSt"
  },
  "properties": {
    "assessment_id": "asa_eu_ai_act_v3",
    "score": 42,
    "max_score": 100,
    "threshold": 60,
    "failed_categories": ["documentation", "risk_management"],
    "time_spent_seconds": 847
  }
}
```

**Envelope fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | Yes | Dot-namespaced event identifier |
| `version` | string | Yes | Schema version (ISO date) for backward compatibility |
| `timestamp` | ISO 8601 | Yes | Client-generated timestamp (server reconciles clock skew) |
| `user.id` | string | If known | Authenticated user ID; omitted for anonymous users |
| `user.anonymous_id` | string | Yes | Stable anonymous ID from `csoai_anon_id` cookie |
| `user.ed25519_key` | string | If available | Public key for cryptographic attribution |
| `context.site` | string | Yes | Originating subdomain |
| `context.page` | string | Yes | Current path |
| `context.referrer` | string | No | document.referrer |
| `context.session_id` | string | Yes | Session identifier, 24h expiry |

**Event-specific property schemas:**

```javascript
// certification.started / certification.completed
{
  certification_type: "poa" | "iso_42001" | "bft_governance",
  tier: "basic" | "professional" | "enterprise",
  payment_method: "card" | "crypto" | "invoice",  // completed only
  amount_usd: number                               // completed only
}

// council.vote_cast
{
  vote_id: string,
  council_session: string,
  vote_option: string,
  signature: string  // Ed25519 signature of vote payload
}

// safety.assessment_taken / safety.score_low
{
  assessment_id: string,
  score: number,
  max_score: number,
  threshold: number,           // score_low only
  failed_categories: string[], // score_low only
  time_spent_seconds: number
}

// content.hub_consumed
{
  hub_id: string,
  hub_title: string,
  scroll_depth: number,     // 0-1, event fires at 0.75
  time_on_page_seconds: number
}

// ecosystemswitched.used
{
  from_site: string,
  to_site: string,
  switcher_context: "header" | "footer" | "dashboard"
}
```

#### 6.5.3 Trigger Logic: Event → Suggestion → Channel

The suggestion engine runs on `events.meok.ai` and maps incoming events to personalized recommendations delivered through one of three channels: in-header banner, dashboard notification, or email.

```javascript
// Suggestion engine — event → recommendation mapping
const SUGGESTION_RULES = [
  {
    id: 'safety-low-to-cert',
    trigger: {
      event: 'safety.score_low',
      condition: (props) => props.score < 60
    },
    suggestion: {
      title: 'Strengthen your safety posture',
      body: 'Your assessment identified gaps in {{failed_categories}}. Proof of Agency certification includes guided remediation for these areas.',
      cta: { text: 'Start Certification', href: 'https://proofof.ai/certification?safety_ref={{assessment_id}}', site: 'proofof.ai' },
      urgency: 'high'
    },
    channels: ['dashboard', 'email'],
    cooldown_hours: 48,  // Don't repeat within 48h
    max_sends: 3
  },
  {
    id: 'cert-complete-to-council',
    trigger: {
      event: 'certification.completed',
      condition: (props) => props.tier === 'professional' || props.tier === 'enterprise'
    },
    suggestion: {
      title: 'Join the governance council',
      body: 'Certified professionals at your tier are eligible to participate in BFT Council votes. Your perspective shapes AI governance standards.',
      cta: { text: 'View Open Votes', href: 'https://councilof.ai/votes', site: 'councilof.ai' },
      urgency: 'medium'
    },
    channels: ['dashboard', 'header_banner'],
    cooldown_hours: 72,
    max_sends: 2
  },
  {
    id: 'hub-consumed-to-tool',
    trigger: {
      event: 'content.hub_consumed',
      condition: (props) => props.hub_id.startsWith('h1_')  // EU AI Act hubs
    },
    suggestion: {
      title: 'Test your compliance readiness',
      body: 'Free 10-question assessment based on the EU AI Act content you just read.',
      cta: { text: 'Take Assessment', href: 'https://safetyof.ai/assessment/eu-ai-act-readiness', site: 'safetyof.ai' },
      urgency: 'low'
    },
    channels: ['header_banner'],
    cooldown_hours: 24,
    max_sends: 1
  },
  {
    id: 'ecoswitcher-first-use',
    trigger: {
      event: 'ecoswitcher.used',
      condition: (_, user) => (user.sites_visited?.length || 0) >= 2
    },
    suggestion: {
      title: 'Ecosystem Explorer unlocked',
      body: 'You\'ve visited {{sites_visited_count}} CSOAI sites. Complete your tour by exploring all five.',
      cta: { text: 'Explore Ecosystem', href: 'https://meok.ai/ecosystem', site: 'meok.ai' },
      urgency: 'low'
    },
    channels: ['dashboard'],
    cooldown_hours: 168,  // One week
    max_sends: 1
  }
];
```

**Processing pipeline:**

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Event fired │───>│  events.     │───>│  Suggestion  │───>│  Channel router  │
│  on any site │    │  meok.ai     │    │  engine      │    │  (pick channel)  │
│  (client JS) │    │  (ingestion) │    │  (evaluate   │    │                  │
└──────────────┘    └──────────────┘    │   rules)     │    └──────────────────┘
                                        └──────────────┘             │
                                              │                      │
                                        ┌─────┴──────┐    ┌─────────┼──────────┐
                                        ▼            ▼    ▼         ▼          ▼
                                   [Dashboard] [Header] [Email] [Notification]
```

The ingestion endpoint accepts events via beacon (for page-unload reliability) and standard fetch:

```javascript
// Client-side event emitter — shared across all sites
function emitEvent(eventName, properties) {
  const payload = {
    event: eventName,
    version: '2026-07-01',
    timestamp: new Date().toISOString(),
    user: {
      id: getUserId(),           // null if anonymous
      anonymous_id: getAnonId(), // always present
      ed25519_key: getPublicKey() // null if not authenticated
    },
    context: {
      site: window.location.hostname.replace('.ai', '').replace(/\./g, '_'),
      page: window.location.pathname,
      referrer: document.referrer,
      device: /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      session_id: getSessionId()
    },
    properties
  };

  // Use sendBeacon for reliable delivery on page navigation
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('https://events.meok.ai/v1/collect', blob);
  } else {
    fetch('https://events.meok.ai/v1/collect', {
      method: 'POST', body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true
    });
  }
}
```

**Critical implementation note:** The event pipeline respects the user's cookie consent state. If only "Essential" cookies are accepted, events are sent without `user.id` and `user.ed25519_key` (anonymous mode). If "Functional" is accepted, the anonymous ID is included for session stitching. "Marketing" consent is required for email channel delivery[^13^].

The cross-site event pipeline transforms the five-domain architecture from a UX liability into a strategic data asset. Every interaction on every site enriches the user profile, enabling progressively relevant recommendations that no single-domain competitor can match. A user who reads about EU AI Act penalties on csoai.org, scores low on a safety assessment, and receives a targeted certification prompt on proofof.ai experiences the ecosystem as an integrated intelligence layer — which is precisely what CSOAI is building.


---

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


---

## 8. Content Strategy — Hub & Spoke Architecture

CSOAI's content architecture is organized around four authority hubs, each targeting a distinct audience segment with minimal keyword cannibalization. Hub 1 (EU AI Act Compliance) captures regulatory search volume — the highest-traffic segment. Hub 2 (AI Governance Frameworks) targets compliance officers evaluating standards. Hub 3 (BFT Council Governance) owns a completely uncontested niche with zero competition. Hub 4 (MCP Protocol Guide) reaches the developer audience through the fastest-growing AI infrastructure topic. [^9^][^10^]

The total content investment is 4 hub pages + 25 spoke pages = ~95,000 words over 90 days. Every spoke page includes a target keyword, title tag, numbered H2 outline, word count target, schema type, and internal linking rules. This chapter provides the complete production brief for each page.

---

### 8.1 Hub 1: EU AI Act Compliance (csoai.org/eu-ai-act)

**Strategic rationale:** The EU AI Act generates the highest search volume in CSOAI's addressable market. Alice Labs currently ranks #1 for timeline queries with ~7,000 words, and DLA Piper dominates penalty-related searches. [^9^][^12^] Most competitor content still references the old August 2026 high-risk deadline — the Digital Omnibus extension to December 2027 creates a freshness arbitrage window of 12-18 months. [^15^]

#### 8.1.1 Hub Page Brief: 8,000-Word Definitive Guide

| Element | Specification |
|---------|--------------|
| **URL** | `csoai.org/eu-ai-act` |
| **Title Tag** | Complete EU AI Act Compliance Guide (2025-2027): Digital Omnibus Timeline |
| **Target Keywords** | EU AI Act compliance guide, EU AI Act requirements, EU AI Act timeline 2027 |
| **Word Count** | 8,000 |
| **Schema** | Article, FAQPage, HowTo, BreadcrumbList |

**H2 Outline:**

1. What Is the EU AI Act? (Risk-Based Approach Overview)
2. EU AI Act Implementation Timeline: 4 Critical Phases
   - H3: Phase 1 (Aug 2024): Entry into Force
   - H3: Phase 2 (Feb 2025): Prohibited AI Practices
   - H3: Phase 3 (Aug 2025): GPAI Model Obligations
   - H3: Phase 4 — **UPDATED** (Dec 2027): High-Risk Systems (Digital Omnibus Extension)
3. Who Must Comply? (Providers, Deployers, Importers, Distributors)
4. High-Risk AI Systems: Complete Requirements (Annex III)
5. Conformity Assessment: Internal vs. Third-Party Paths
6. CE Marking and EU Declaration of Conformity
7. EU AI Act Penalties and Fine Structure
8. GPAI Model Obligations (Chapter V)
9. Article 50 Transparency Obligations
10. Article 12: Automatic Logging Requirements
11. Post-Market Monitoring Obligations
12. How CSOAI Certification Maps to EU AI Act Compliance
13. Frequently Asked Questions (30+ FAQs for FAQPage schema)

**Internal linking rules:** Link to all 10 spoke pages using descriptive anchor text. Link to `csoai.org/certification` in H2 #12. Cross-link to Hub 2 (frameworks) when discussing NIST/ISO alignment, Hub 3 (BFT Council) when discussing Article 12 cryptographic audit trails, and Hub 4 (MCP) when discussing technical logging implementation.

---

#### 8.1.2 Spoke 1.1: /article-50 — What is Article 50?

| Element | Specification |
|---------|--------------|
| **Target Keyword** | EU AI Act Article 50 explained |
| **Title Tag** | EU AI Act Article 50 Explained: Complete Transparency Obligations Guide (2025) |
| **Word Count** | 2,000 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. What Is Article 50 of the EU AI Act?
2. Who Must Comply with Article 50? (Providers vs. Deployers)
3. Transparency Obligation 1: AI Interaction Disclosure
4. Transparency Obligation 2: Synthetic Content Marking
5. Transparency Obligation 3: Emotion Recognition Notification
6. Transparency Obligation 4: Deepfake Disclosure
7. Technical Implementation: How to Build Article 50 Compliance
8. Article 50 vs. GDPR Transparency Requirements
9. Penalties for Non-Compliance
10. CSOAI Transparency Certification

**Internal links:** From Hub 1 (H2 #9 anchor); To Spoke 1.9 (transparency-obligations), Spoke 1.5 (GPAI — synthetic content marking for GPAI outputs), Hub 3 `/bft-explained` (cryptographic verification of transparency disclosures).

---

#### 8.1.3 Spoke 1.2: /high-risk-systems — Annex III Explained

| Element | Specification |
|---------|--------------|
| **Target Keyword** | EU AI Act high-risk systems |
| **Title Tag** | EU AI Act High-Risk Systems: Complete Annex III Requirements Guide |
| **Word Count** | 2,500 |
| **Schema** | Article, FAQPage, HowTo |

**H2 Outline:**
1. What Are High-Risk AI Systems Under the EU AI Act?
2. The 8 Annex III High-Risk Categories
   - H3: Biometric Identification and Categorization
   - H3: Critical Infrastructure
   - H3: Education and Vocational Training
   - H3: Employment and Workers Management
   - H3: Access to Essential Services
   - H3: Law Enforcement
   - H3: Migration, Asylum, and Border Control
   - H3: Administration of Justice and Democratic Processes
3. Article 6(3) Exception: When High-Risk Doesn't Apply
4. Risk Management System Requirements (Article 9)
5. Data Governance and Training Data Quality (Article 10)
6. Technical Documentation Requirements (Article 11)
7. Human Oversight Requirements (Article 14)
8. Accuracy, Robustness, and Cybersecurity (Article 15)
9. Conformity Assessment for High-Risk Systems
10. CE Marking and Registration
11. Sector-Specific Compliance Checklists

**Internal links:** From Hub 1 (H2 #4 anchor); To Spoke 1.6 (conformity-assessment), Spoke 1.3 (penalties), Hub 2 `/iso-42001` (ISO 42001 alignment for high-risk systems).

---

#### 8.1.4 Spoke 1.3: /penalties — Fine Structure + Examples

| Element | Specification |
|---------|--------------|
| **Target Keyword** | EU AI Act penalties fines |
| **Title Tag** | EU AI Act Penalties and Fines: Complete 2025-2027 Enforcement Guide |
| **Word Count** | 1,500 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. EU AI Act Penalty Structure Overview
2. Tier 1: Prohibited AI Practice Violations (EUR 35M / 7%)
3. Tier 2: High-Risk System Obligation Violations (EUR 15M / 3%)
4. Tier 3: Incorrect Information to Authorities (EUR 7.5M / 1.5%)
5. Who Enforces the EU AI Act? (National Authorities + EU AI Office)
6. Penalty Calculation: Revenue vs. Fixed Amount
7. Real-World Enforcement Examples (2025-2026)
8. How to Minimize Penalty Risk
9. EU AI Act Penalties vs. GDPR Fines
10. Insurance and Liability Considerations

**Internal links:** From Hub 1 (H2 #7 anchor); To Hub 1 hub (parent), Spoke 1.2 (high-risk systems — penalty triggers), Hub 3 `/audit-trail` (cryptographic evidence for penalty defense). [^12^]

---

#### 8.1.5 Spoke 1.4: /timeline — Key Dates

| Element | Specification |
|---------|--------------|
| **Target Keyword** | EU AI Act timeline 2027 |
| **Title Tag** | EU AI Act Timeline 2025-2027: Key Dates and Digital Omnibus Updates |
| **Word Count** | 1,500 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. EU AI Act Timeline at a Glance (Visual Timeline)
2. August 2024: Entry into Force
3. February 2025: Prohibited AI Practices Take Effect
4. August 2025: GPAI Model Obligations Active
5. December 2027: High-Risk Systems Compliance Deadline (Digital Omnibus Extension)
6. What Changed with the Digital Omnibus (May 2026)
7. Milestones Between Now and December 2027
8. National Implementation Timelines by Country
9. How to Build Your Internal Compliance Timeline
10. Download: CSOAI Compliance Timeline Template

**Internal links:** From Hub 1 (H2 #2 anchor); To all Hub 1 spokes (contextual by date), Hub 2 `/crosswalk` (framework implementation timelines). [^11^]

---

#### 8.1.6 Spoke 1.5: /gpais — General Purpose AI Systems

| Element | Specification |
|---------|--------------|
| **Target Keyword** | EU AI Act GPAI requirements |
| **Title Tag** | EU AI Act GPAI Requirements: General Purpose AI Model Compliance Guide |
| **Word Count** | 2,000 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. What Are General Purpose AI Models Under the EU AI Act?
2. GPAI Compute Threshold: 10^23 FLOPs Explained
3. All GPAI Models: Base Obligations (Article 53)
4. Systemic Risk GPAI Models: Additional Requirements
5. GPAI Code of Practice: Key Commitments
6. Technical Documentation for GPAI Models
7. Training Data Summary Requirements
8. Copyright Compliance for GPAI Providers
9. GPAI Model Evaluation and Red-Teaming
10. EU AI Office Oversight and Enforcement
11. Timeline: August 2025 GPAI Obligations
12. Checklist: GPAI Provider Compliance

**Internal links:** From Hub 1 (H2 #8 anchor); To Hub 1 hub (parent), Spoke 1.1 (Article 50 — synthetic content marking applies to GPAI outputs), Hub 4 `/security` (MCP security for model evaluation tooling). [^16^]

---

#### 8.1.7 Spoke 1.6: /conformity-assessment — How to Get Certified

| Element | Specification |
|---------|--------------|
| **Target Keyword** | EU AI Act conformity assessment |
| **Title Tag** | EU AI Act Conformity Assessment: Step-by-Step Compliance Guide (2025) |
| **Word Count** | 2,000 |
| **Schema** | Article, HowTo, FAQPage |

**H2 Outline:**
1. What Is Conformity Assessment Under the EU AI Act?
2. Two Paths: Internal Assessment (Annex VI) vs. Third-Party (Annex VII)
3. When Do You Need a Notified Body?
4. Step 1: Quality Management System (Article 17)
5. Step 2: Technical Documentation Review
6. Step 3: Risk Management Verification
7. Step 4: Post-Market Monitoring System
8. Step 5: Draw Up Declaration of Conformity
9. Step 6: Affix CE Marking
10. Step 7: Register in EU AI Database
11. Notified Body Capacity Crisis: What to Do (9-24 Month Timeline)
12. Timeline and Cost Estimates

**Internal links:** From Hub 1 (H2 #5 anchor); To Spoke 1.2 (high-risk systems — who needs assessment), Spoke 1.3 (penalties — non-assessment consequences), `csoai.org/certification` (conformity assessment product). [^65^][^66^]

---

#### 8.1.8 Spoke 1.7: /vs-iso-42001 — EU AI Act vs ISO 42001

| Element | Specification |
|---------|--------------|
| **Target Keyword** | EU AI Act vs ISO 42001 |
| **Title Tag** | EU AI Act vs ISO 42001: Mapping Regulatory Requirements to Management Systems |
| **Word Count** | 2,000 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. Why Compare the EU AI Act and ISO 42001?
2. The EU AI Act: Legally Binding Regulatory Requirements
3. ISO 42001: Certifiable AI Management System Standard
4. Scope Overlap: Where the Two Frameworks Intersect
5. Risk Management: Article 9 vs. ISO 42001 Clause 6.1
6. Technical Documentation: Article 11 vs. ISO 42001 Annex A.5
7. Human Oversight: Article 14 vs. ISO 42001 A.6.2
8. Audit and Assurance: Regulatory vs. Certification Audits
9. Building a Unified Compliance Stack
10. CSOAI Dual Certification Pathway

**Internal links:** From Hub 1 (H2 #4 anchor — "ISO 42001 alignment"); To Hub 2 `/iso-42001` (ISO 42001 deep dive), Hub 2 `/crosswalk` (full framework crosswalk), `csoai.org/iso-42001-certification`.

---

#### 8.1.9 Spoke 1.8: /sme-guide — Small Business Compliance Guide

| Element | Specification |
|---------|--------------|
| **Target Keyword** | EU AI Act SME guide |
| **Title Tag** | EU AI Act SME Guide: Compliance for Small and Medium Businesses |
| **Word Count** | 2,500 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. Does the EU AI Act Apply to SMEs?
2. SME-Specific Provisions and Support
3. Simplified Compliance Pathways
4. AI Regulatory Sandboxes for SMEs
5. Cost-Effective Compliance Strategies
6. Free and Open-Source Compliance Tools
7. Common SME Use Cases and Risk Classifications
8. Timeline for SME Compliance
9. Resources and Support Programs

**Internal links:** From Hub 1 (H2 #3 anchor — "who must comply"); To all Hub 1 spokes (relevant by use case), `csoai.org/certification` (SME certification tier).

---

#### 8.1.10 Spoke 1.9: /transparency-obligations — Article 50 Two-Layer Marking

| Element | Specification |
|---------|--------------|
| **Target Keyword** | EU AI Act transparency obligations |
| **Title Tag** | EU AI Act Transparency Obligations: Article 50 Two-Layer Marking System |
| **Word Count** | 2,000 |
| **Schema** | Article, FAQPage, HowTo |

**H2 Outline:**
1. What Are the EU AI Act Transparency Obligations?
2. Layer 1: General Transparency (All AI Systems)
3. Layer 2: Specific Transparency (High-Risk + GPAI)
4. Article 50(1): AI Interaction Disclosure Requirements
5. Article 50(2): Synthetic Content Marking (Deepfakes)
6. Article 50(3): Emotion Recognition System Notification
7. Technical Standards for Content Marking (C2PA, IPTC)
8. Implementing Two-Layer Marking in Your Organization
9. Penalties for Transparency Violations
10. CSOAI Transparency Compliance Tools

**Internal links:** From Hub 1 (H2 #9 anchor); To Spoke 1.1 (Article 50 — overlaps), Spoke 1.10 (deepfake-detection — specific case), Hub 3 `/audit-trail` (verifiable transparency logging).

---

#### 8.1.11 Spoke 1.10: /deepfake-detection — Synthetic Content Rules

| Element | Specification |
|---------|--------------|
| **Target Keyword** | EU AI Act deepfake detection synthetic content |
| **Title Tag** | EU AI Act Deepfake Rules: Synthetic Content Detection and Marking Requirements |
| **Word Count** | 1,500 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. What the EU AI Act Requires for Synthetic Content
2. Article 50(2): Mandatory Deepfake Disclosure
3. Article 52(3): Marking Requirements for AI-Generated Content
4. Technical Standards: C2PA, IPTC, and Watermarking
5. Detection Technologies: Active vs. Passive Approaches
6. Platform Obligations for Synthetic Content Distribution
7. Exceptions: Artistic, Satirical, and Journalistic Use Cases
8. Enforcement and Penalties for Non-Compliance
9. Building a Synthetic Content Compliance Pipeline

**Internal links:** From Spoke 1.1 (H2 #6 — deepfake disclosure anchor); To Spoke 1.9 (transparency-obligations — parent topic), Spoke 1.5 (GPAI — synthetic content from model outputs), Hub 4 `/security` (MCP tools for content verification).

---

### 8.2 Hub 2: AI Governance Frameworks (csoai.org/frameworks)

**Strategic rationale:** No competitor compares more than 3 frameworks side-by-side. AgenticRail covers 3 [^25^], BA Copilot covers 3 [^26^], and Modulos covers 3-4 [^29^]. CSOAI's 20+ framework crosswalk (Spoke 2.5) becomes the definitive global reference — a permanent backlink magnet that competitors cannot replicate without significant investment. ISO 42001 enquiries have "materially upticked since Q1 2026" [^22^], making this hub a high-conversion driver.

#### 8.2.1 Hub Page Brief: 5,000-Word Framework Master Guide

| Element | Specification |
|---------|--------------|
| **URL** | `csoai.org/frameworks` |
| **Title Tag** | AI Governance Frameworks: Complete Comparison of NIST, ISO 42001, EU AI Act & 20+ Others |
| **Target Keywords** | AI governance framework comparison, NIST AI RMF guide, ISO 42001 certification, AI governance frameworks 2025 |
| **Word Count** | 5,000 |
| **Schema** | Article, FAQPage, Table |

**H2 Outline:**
1. What Is an AI Governance Framework?
2. The Three Layers of AI Governance
   - H3: Management Systems (ISO 42001)
   - H3: Risk Management Operating Models (NIST AI RMF)
   - H3: Security Taxonomies (OWASP)
3. Binding Regulations: EU AI Act, GDPR, NIS2, DORA
4. Side-by-Side: NIST AI RMF vs. ISO 42001 vs. EU AI Act
5. Complete Framework Directory (20+ Frameworks)
6. The CSOAI Crosswalk Engine: How We Map 20+ Frameworks
7. Choosing the Right Framework for Your Organization
8. Building a Unified Cross-Framework Register
9. Certification Pathways: ISO 42001 and Beyond
10. Frequently Asked Questions

**Internal links:** Link to all 6 spoke pages. Link to `csoai.org/frameworks/crosswalk` (crosswalk tool). Cross-reference Hub 1 for regulatory details and Hub 3 for multi-agent governance frameworks.

---

#### 8.2.2 Spoke 2.1: /nist-ai-rmf — NIST AI Risk Management Framework

| Element | Specification |
|---------|--------------|
| **Target Keyword** | NIST AI RMF guide |
| **Title Tag** | NIST AI RMF Guide: Complete Implementation Framework (2025) |
| **Word Count** | 2,000 |
| **Schema** | Article, HowTo, FAQPage |

**H2 Outline:**
1. What Is the NIST AI Risk Management Framework?
2. The Four Functions: Govern, Map, Measure, Manage
3. Govern Function Deep Dive
4. Map Function Deep Dive
5. Measure Function Deep Dive
6. Manage Function Deep Dive
7. NIST AI RMF Generative AI Profile (AI 600-1)
8. NIST Critical Infrastructure Profile (2026)
9. Implementing NIST AI RMF: Step-by-Step
10. NIST to EU AI Act Crosswalk
11. NIST to ISO 42001 Crosswalk

**Internal links:** From Hub 2 (H2 #4 anchor); To Hub 2 `/crosswalk` (multi-framework mapping), Hub 1 hub (EU AI Act regulatory requirements), Hub 2 `/iso-42001` (ISO 42001 comparison). [^27^][^28^]

---

#### 8.2.3 Spoke 2.2: /iso-42001 — ISO/IEC 42001 Guide

| Element | Specification |
|---------|--------------|
| **Target Keyword** | ISO 42001 AI management system certification |
| **Title Tag** | ISO 42001 Certification: Complete AI Management System Guide |
| **Word Count** | 2,000 |
| **Schema** | Article, HowTo, FAQPage |

**H2 Outline:**
1. What Is ISO/IEC 42001?
2. Key Clauses 4-10 Explained
3. Annex A: 38 AI-Specific Controls
4. The Certification Process: 5 Steps
5. Gap Analysis and Readiness Assessment
6. AIMS Implementation Timeline
7. Integration with ISO 27001 and ISO 9001
8. ISO 42001 to EU AI Act Crosswalk
9. ISO 42001 to NIST AI RMF Crosswalk
10. Certification Costs and Timeline

**Internal links:** From Hub 2 (H2 #4 anchor); To Hub 2 `/crosswalk` (mapping tool), Hub 1 `/vs-iso-42001` (EU AI Act comparison), `csoai.org/iso-42001-certification` (certification service). [^22^]

---

#### 8.2.4 Spoke 2.3: /dora — Digital Operational Resilience Act

| Element | Specification |
|---------|--------------|
| **Target Keyword** | DORA AI governance compliance |
| **Title Tag** | DORA AI Governance: Digital Operational Resilience Act Compliance Guide |
| **Word Count** | 2,000 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. What Is DORA and How Does It Relate to AI?
2. DORA's Five Pillars of Digital Operational Resilience
3. ICT Risk Management for AI Systems
4. Incident Reporting for AI Systems
5. Digital Operational Resilience Testing for AI
6. Third-Party Risk Management for AI Vendors
7. DORA + EU AI Act Dual Compliance Strategy
8. DORA + NIS2 Overlap Explained

**Internal links:** From Hub 2 (H2 #3 anchor — "binding regulations"); To Hub 2 `/nis2` (NIS2 comparison), Hub 2 `/crosswalk` (DORA-to-NIS2 mapping), Hub 1 hub (EU AI Act dual compliance). [^23^][^24^]

---

#### 8.2.5 Spoke 2.4: /nis2 — NIS2 Directive Guide

| Element | Specification |
|---------|--------------|
| **Target Keyword** | NIS2 directive compliance AI systems |
| **Title Tag** | NIS2 Directive Compliance for AI Systems: Complete Guide |
| **Word Count** | 2,000 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. What Is the NIS2 Directive?
2. NIS2 Scope: Essential and Important Entities
3. Cybersecurity Risk Management Requirements
4. Incident Reporting: 24-Hour Notification
5. Supply Chain Security for AI Systems
6. Governance and Management Accountability
7. NIS2 + EU AI Act: Combined Compliance
8. NIS2 + DORA: Which Applies?

**Internal links:** From Hub 2 (H2 #3 anchor); To Hub 2 `/dora` (DORA overlap), Hub 2 `/crosswalk` (NIS2 mapping), Hub 1 hub (EU AI Act combined compliance). [^23^]

---

#### 8.2.6 Spoke 2.5: /crosswalk — 20+ Framework Crosswalk

| Element | Specification |
|---------|--------------|
| **Target Keyword** | AI governance framework crosswalk |
| **Title Tag** | AI Governance Framework Crosswalk: Mapping 20+ Standards and Regulations |
| **Word Count** | 3,000 |
| **Schema** | Article, Table |

**H2 Outline:**
1. What Is a Framework Crosswalk?
2. Why Multi-Framework Governance Matters
3. The CSOAI Crosswalk Methodology
4. EU AI Act to NIST AI RMF Crosswalk
5. EU AI Act to ISO 42001 Crosswalk
6. NIST AI RMF to ISO 42001 Crosswalk
7. DORA to NIS2 Crosswalk
8. OWASP LLM Top 10 to MITRE ATLAS Crosswalk
9. Building a Unified Cross-Framework Register
10. Interactive Comparison Matrix (downloadable spreadsheet)

**Internal links:** From Hub 2 (H2 #6 anchor — "Crosswalk Engine"); To all Hub 2 spokes (individual framework pages), Hub 1 hub (EU AI Act regulatory detail), `csoai.org/frameworks/crosswalk` (interactive tool).

**Unique angle:** This is CSOAI's single most defensible content asset. No competitor offers a crosswalk of more than 3 frameworks. The downloadable spreadsheet becomes a permanent backlink magnet. [^25^][^29^]

---

#### 8.2.7 Spoke 2.6: /comparison — Side-by-Side Framework Comparison

| Element | Specification |
|---------|--------------|
| **Target Keyword** | AI risk management framework comparison |
| **Title Tag** | AI Risk Management Framework Comparison: NIST vs. ISO 42001 vs. EU AI Act |
| **Word Count** | 2,500 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. Three Frameworks, Three Different Problems
2. EU AI Act: What Is Legally Required?
3. NIST AI RMF: How Should We Manage AI Risk?
4. ISO 42001: How Do We Prove Governance Works?
5. Side-by-Side Comparison Table
6. Enforcement and Consequences
7. Prescriptiveness: Binding vs. Voluntary vs. Certifiable
8. Agentic AI Coverage Across Frameworks
9. Which Framework Should You Use?
10. Building a Unified Governance Stack

**Internal links:** From Hub 2 (H2 #4 anchor); To Spoke 2.1 (NIST), Spoke 2.2 (ISO 42001), Hub 1 hub (EU AI Act detail), Hub 2 `/crosswalk` (expanded crosswalk).

---

### 8.3 Hub 3: BFT Council Governance (councilof.ai/governance)

**Strategic rationale:** This hub targets a completely uncontested niche. Academic papers on BFT multi-agent governance exist [^31^][^52^], and Medium articles discuss voting patterns [^72^][^73^], but NO competitor has production BFT governance content. Search volume is low, but commercial intent is extremely high — every visitor is a qualified technical lead. This hub establishes CSOAI's technical authority and drives councilof.ai engagement.

#### 8.3.1 Hub Page Brief: 5,000-Word Technical Authority

| Element | Specification |
|---------|--------------|
| **URL** | `councilof.ai/governance` |
| **Title Tag** | BFT Council Governance: Multi-Agent AI Voting for Trustworthy AI Systems |
| **Target Keywords** | Byzantine Fault Tolerance AI governance, multi-LLM voting AI safety, AI council governance model, cryptographic AI audit trail |
| **Word Count** | 5,000 |
| **Schema** | Article, FAQPage, HowTo |

**H2 Outline:**
1. What Is BFT Council Governance for AI?
2. The Problem: Single-Model AI Governance Is a Single Point of Failure
3. Byzantine Fault Tolerance: From Distributed Systems to AI Governance
4. The 33-Agent BFT Council Architecture
   - H3: Agent Roles and Specializations
   - H3: Voting Mechanisms and Consensus Rules
   - H3: HMAC-Signed Attestations and Verifiable Audit Trails
5. Multi-LLM Voting: Why Diverse Models Vote
6. Cryptographic Audit Trails: HMAC-Signed Decision Receipts
7. EU AI Act Article 12 Compliance Through Cryptographic Logging
8. BFT Council vs. Single-Model Governance
9. Academic Foundations: Research and Theory
10. The CSOAI BFT Council in Production
11. Implementing BFT Governance in Your Organization
12. Frequently Asked Questions

**Internal links:** Link to all 4 spoke pages. Link to `councilof.ai/bft-certification` (product page). Cross-reference Hub 1 (Article 12 logging requirements) and Hub 4 (MCP integration with BFT council).

---

#### 8.3.2 Spoke 3.1: /bft-explained — What is Byzantine Fault Tolerance?

| Element | Specification |
|---------|--------------|
| **Target Keyword** | Byzantine Fault Tolerance AI governance |
| **Title Tag** | Byzantine Fault Tolerance AI Governance: Technical Architecture Deep Dive |
| **Word Count** | 2,000 |
| **Schema** | Article, HowTo |

**H2 Outline:**
1. What Is Byzantine Fault Tolerance?
2. The Byzantine Generals Problem in AI Systems
3. BFT in Multi-Agent AI Systems
4. Weighted Byzantine Fault Tolerance (WBFT)
5. Confidence-Probes and Weighted Consensus (CP-WBFT)
6. The f < n/3 Fault Tolerance Bound
7. Message Complexity: O(n^2) Considerations
8. BFT for LLM Agent Coordination
9. Blockchain-Based BFT for AI (BlockAgents, Trusted MultiLLMN)
10. Implementing BFT: Practical Considerations

**Internal links:** From Hub 3 (H2 #3 anchor); To Hub 3 hub (parent), Spoke 3.2 (why-multiple-llms — model diversity), Spoke 3.3 (audit-trail — cryptographic verification). [^31^]

---

#### 8.3.3 Spoke 3.2: /why-multiple-llms — Why 5 Models Vote Instead of 1

| Element | Specification |
|---------|--------------|
| **Target Keyword** | multi-LLM voting AI safety |
| **Title Tag** | Multi-LLM Voting for AI Safety: How Model Diversity Improves Decisions |
| **Word Count** | 1,500 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. The Problem: Single-Model Failure Modes
2. How Multi-LLM Voting Works
3. The Voting-Based Council Pattern
4. Ensemble Decision-Making for AI Governance
5. Confidence-Weighted Voting
6. Diversity Strategies: Different Models, Different Prompts
7. Error Reduction Through Redundancy
8. Medical Diagnosis Use Case
9. Financial Risk Assessment Use Case
10. Implementation with LangChain and Semantic Kernel

**Internal links:** From Hub 3 (H2 #5 anchor); To Hub 3 hub (parent), Spoke 3.1 (bft-explained — consensus mechanism), Spoke 3.4 (eu-ai-act-article-12 — audit requirements for voting systems). [^52^]

---

#### 8.3.4 Spoke 3.3: /audit-trail — How HMAC Signing Works for Compliance

| Element | Specification |
|---------|--------------|
| **Target Keyword** | HMAC signing AI compliance audit trail |
| **Title Tag** | HMAC-Signed AI Audit Trails: Cryptographic Compliance for the EU AI Act |
| **Word Count** | 2,000 |
| **Schema** | Article, HowTo, FAQPage |

**H2 Outline:**
1. Why Standard Logs Fail for Regulatory Compliance
2. Four Mechanisms of Cryptographic Audit Trails
3. Mechanism 1: HMAC-SHA256 Over All Fields
4. Mechanism 2: Canonical JSON Serialization
5. Mechanism 3: Key ID in Every Record
6. Mechanism 4: Immutable Storage with Write-Once Semantics
7. Verifying Receipts Without the Original System
8. EU AI Act Article 12: Why Cryptographic Logging Is Required
9. ISO 42001 A.6.1.6: Evidence for Auditors
10. NIST AI RMF Measure 2.5: Tamper-Evident Monitoring
11. Code Example: Implementing HMAC-Signed Audit Receipts
12. The IETF Agent Audit Trail Standard (AAT)

**Internal links:** From Hub 3 (H2 #6 anchor); To Hub 1 `/article-50` (Article 12 logging requirements), Hub 4 `/security` (MCP security integration), `councilof.ai/audit-trail` (verification tool). [^33^][^36^]

---

#### 8.3.5 Spoke 3.4: /eu-ai-act-article-12 — Audit Log Requirements

| Element | Specification |
|---------|--------------|
| **Target Keyword** | EU AI Act audit trail requirements |
| **Title Tag** | EU AI Act Article 12: Audit Log Requirements for AI Systems |
| **Word Count** | 1,500 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. What Article 12 Requires: Automatic Recording of Events
2. Six Common Logging Gaps Organizations Have Now
3. Technical Implementation: Building Automatic Logging
4. The 15-Minute Discovery Standard
5. Log Retention: 6-Month Minimum Requirement
6. Implementing Tamper-Evident Logging
7. Connecting Logs to Post-Market Monitoring
8. Article 12 and LLM Frameworks (LangChain Callbacks)
9. Code Example: Compliance Logging Handler

**Internal links:** From Hub 3 (H2 #7 anchor); To Hub 1 hub (EU AI Act overview), Spoke 3.3 (audit-trail — HMAC implementation), Hub 4 `/what-is-mcp` (MCP for logging integration). [^34^][^37^][^38^]

---

### 8.4 Hub 4: MCP Protocol Guide (proofof.ai/mcp-guide)

**Strategic rationale:** MCP (Model Context Protocol) is one of the fastest-growing AI developer topics. Official documentation exists [^35^] and beginner guides are appearing [^40^][^41^], but no content connects MCP to compliance or offers a verified server catalog with cryptographic attestation. CSOAI's 294-server catalog with HMAC-signed attestations provides a unique authority signal that developer-focused competitors cannot match. [^53^][^59^]

#### 8.4.1 Hub Page Brief: 5,000-Word MCP Authority

| Element | Specification |
|---------|--------------|
| **URL** | `proofof.ai/mcp-guide` |
| **Title Tag** | The Complete MCP Protocol Guide: Model Context Protocol for Enterprise AI (2025) |
| **Target Keywords** | Model Context Protocol explained, MCP server guide, MCP security best practices, MCP registry |
| **Word Count** | 5,000 |
| **Schema** | Article, HowTo, FAQPage, SoftwareApplication |

**H2 Outline:**
1. What Is the Model Context Protocol (MCP)?
2. Why MCP Matters: The "USB-C for AI" Analogy
3. MCP Architecture: Client-Server Model
4. MCP Core Concepts: Tools, Resources, and Prompts
5. The Official MCP Registry and Community Ecosystem
6. 294 Verified MCP Servers: The proofof.ai Catalog
7. HMAC-Signed MCP Attestations: Trust Through Cryptography
8. MCP Security Best Practices for Enterprise
9. MCP + EU AI Act Compliance: Governance for Tool Access
10. Building Your First MCP Server (Step-by-Step)
11. MCP Client Integration: Claude, ChatGPT, VS Code, Cursor
12. Enterprise MCP Deployment Patterns
13. MCP vs. Traditional API Integration
14. Frequently Asked Questions

**Internal links:** Link to all 5 spoke pages. Link to `proofof.ai/catalog` (server catalog). Cross-reference Hub 1 (EU AI Act compliance for tool governance) and Hub 3 (BFT Council for HMAC signing technical details).

---

#### 8.4.2 Spoke 4.1: /what-is-mcp — Model Context Protocol Explained

| Element | Specification |
|---------|--------------|
| **Target Keyword** | Model Context Protocol explained |
| **Title Tag** | Model Context Protocol Explained: A Beginner's Guide to MCP |
| **Word Count** | 2,000 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. What Is MCP? The Universal Adapter for AI
2. The Problem MCP Solves
3. MCP vs. Traditional API Integration
4. MCP Architecture Overview
5. Key Components: Tools, Resources, Prompts
6. MCP Transport: stdio vs. HTTP/SSE
7. Getting Started with MCP
8. MCP Clients: Where to Use MCP
9. MCP Ecosystem Growth Statistics
10. MCP in 2026: What's Next

**Internal links:** From Hub 4 (H2 #1 anchor); To Hub 4 hub (parent), Spoke 4.2 (getting-started — installation guide), Hub 4 `/security` (security considerations). [^32^][^35^]

---

#### 8.4.3 Spoke 4.2: /getting-started — First MCP Installation

| Element | Specification |
|---------|--------------|
| **Target Keyword** | MCP getting started tutorial |
| **Title Tag** | MCP Getting Started Guide: Your First Model Context Protocol Installation |
| **Word Count** | 1,500 |
| **Schema** | Article, HowTo |

**H2 Outline:**
1. Prerequisites: What You Need Before Starting
2. Step 1: Install the MCP Client (Claude Desktop)
3. Step 2: Configure Your First MCP Server
4. Step 3: Test Server Connection and Tools
5. Step 4: Use Your First MCP Tool
6. Step 5: Add a Second Server (Multi-Server Setup)
7. Common Installation Issues and Fixes
8. Next Steps: Building Your Own Server
9. MCP Configuration File Reference

**Internal links:** From Hub 4 (H2 #10 anchor — "Building Your First MCP Server"); To Spoke 4.1 (what-is-mcp — conceptual foundation), Spoke 4.3 (building-mcps — next step), Hub 4 `/registry` (finding servers). [^40^][^41^]

---

#### 8.4.4 Spoke 4.3: /building-mcps — How to Build Your Own MCP Server

| Element | Specification |
|---------|--------------|
| **Target Keyword** | building MCP servers |
| **Title Tag** | Building MCP Servers: Advanced Patterns, Integration, and Compliance |
| **Word Count** | 2,500 |
| **Schema** | Article, HowTo |

**H2 Outline:**
1. Advanced MCP Server Patterns
2. Multi-Tool Server Architecture
3. Resource-Based Data Access
4. Prompt Templates for Workflows
5. Async Operations and Streaming
6. Error Handling and Retry Logic
7. MCP + Database Integration
8. MCP + API Gateway Patterns
9. Observability and Monitoring for MCP
10. Compliance Logging for MCP Tool Calls

**Internal links:** From Hub 4 (H2 #10 anchor); To Spoke 4.2 (getting-started — prerequisites), Spoke 4.5 (security — production hardening), Hub 3 `/audit-trail` (HMAC signing for compliance logging). [^35^]

---

#### 8.4.5 Spoke 4.4: /registry — How the MCP Registry Works

| Element | Specification |
|---------|--------------|
| **Target Keyword** | MCP registry |
| **Title Tag** | MCP Registry: Finding, Evaluating, and Managing Model Context Protocol Servers |
| **Word Count** | 1,500 |
| **Schema** | Article, FAQPage |

**H2 Outline:**
1. What Is an MCP Registry?
2. The Official MCP Registry (modelcontextprotocol.io)
3. Community Registries and Directories
4. Enterprise MCP Registries (Kong, etc.)
5. Evaluating MCP Servers: Security Checklist
6. The proofof.ai Verified Catalog: 294 Servers
7. HMAC-Signed Server Attestations
8. Private MCP Registries for Enterprise
9. Registry Governance and Access Control
10. Building an Internal MCP Server Catalog

**Internal links:** From Hub 4 (H2 #5 anchor); To Hub 4 hub (parent), Spoke 4.5 (security — evaluation criteria), `proofof.ai/catalog` (verified server list). [^53^][^59^][^62^]

---

#### 8.4.6 Spoke 4.5: /security — MCP Security Best Practices

| Element | Specification |
|---------|--------------|
| **Target Keyword** | MCP security best practices |
| **Title Tag** | MCP Security Best Practices: Enterprise Deployment and Governance Guide |
| **Word Count** | 2,000 |
| **Schema** | Article, HowTo, FAQPage |

**H2 Outline:**
1. MCP Security Threat Model
2. Authentication and Authorization
3. Input Validation and Sanitization
4. The Confused Deputy Problem
5. SSRF Prevention for MCP Servers
6. Scope Minimization: Least Privilege
7. Network Security: Transport Encryption
8. Session Management and Token Handling
9. MCP + EU AI Act: Governance for Tool Access
10. Security Checklist for Enterprise MCP Deployment

**Internal links:** From Hub 4 (H2 #8 anchor); To Spoke 4.3 (building-mcps — secure development), Spoke 4.4 (registry — evaluating server security), Hub 1 hub (EU AI Act tool governance requirements). [^35^]

---

### 8.5 Master Keyword Matrix

The matrix below catalogs 55+ keywords across all four hubs with intent classification, priority, and content target. Keywords are selected for commercial value, search volume, and competitive gap — not just volume. Hub 3 keywords have low volume but very high commercial intent due to zero competition.

#### 8.5.1 55+ Keywords by Hub with Intent Classification

| # | Keyword | Hub | Intent | Priority | Est. Volume | Commercial Value | Content Target |
|---|---------|-----|--------|----------|-------------|-----------------|----------------|
| 1 | EU AI Act compliance guide | H1 | Informational | Critical | High | High | H1 Hub |
| 2 | EU AI Act requirements | H1 | Informational | Critical | High | High | H1 Hub |
| 3 | EU AI Act high-risk systems | H1 | Info/Commercial | Critical | High | High | Spoke 1.2 |
| 4 | EU AI Act penalties fines | H1 | Informational | High | Medium | Medium | Spoke 1.3 |
| 5 | EU AI Act timeline 2027 | H1 | Informational | Critical | High | High | Spoke 1.4 |
| 6 | EU AI Act Article 50 explained | H1 | Informational | High | Medium | Medium | Spoke 1.1 |
| 7 | EU AI Act GPAI requirements | H1 | Informational | High | Medium | Medium | Spoke 1.5 |
| 8 | EU AI Act conformity assessment | H1 | Info/Commercial | Critical | High | High | Spoke 1.6 |
| 9 | EU AI Act SME guide | H1 | Informational | High | Medium | High | Spoke 1.8 |
| 10 | EU AI Act transparency obligations | H1 | Informational | Medium | Medium | Medium | Spoke 1.9 |
| 11 | EU AI Act deepfake detection | H1 | Informational | Medium | Low | Medium | Spoke 1.10 |
| 12 | EU AI Act vs ISO 42001 | H1 | Informational | Medium | Medium | High | Spoke 1.7 |
| 13 | EU AI Act compliance software | H1 | Commercial | Critical | High | Very High | Comparison |
| 14 | EU AI Act compliance checklist | H1 | Info/Commercial | High | High | High | Lead magnet |
| 15 | Digital Omnibus AI Act | H1 | Informational | Critical | Medium | High | H1 Hub |
| 16 | EU AI Act 2027 deadline | H1 | Informational | Critical | Medium | High | H1 Hub |
| 17 | EU AI Act prohibited practices | H1 | Informational | Medium | Medium | Medium | H1 Hub |
| 18 | EU AI Act risk management | H1 | Info/Commercial | High | Medium | High | H1 Hub |
| 19 | EU AI Act technical documentation | H1 | Informational | High | Medium | High | Spoke 1.2 |
| 20 | EU AI Act notified bodies | H1 | Info/Commercial | High | Medium | High | Spoke 1.6 |
| 21 | EU AI Act Article 12 logging | H1 | Info/Technical | High | Medium | High | Spoke 3.4 |
| 22 | EU AI Act CE marking | H1 | Info/Commercial | High | Medium | High | H1 Hub |
| 23 | EU AI Act database registration | H1 | Informational | Medium | Low | Medium | Spoke 1.6 |
| 24 | AI governance framework comparison | H2 | Info/Commercial | Critical | High | High | H2 Hub |
| 25 | NIST AI RMF guide | H2 | Informational | Critical | High | High | Spoke 2.1 |
| 26 | ISO 42001 certification | H2 | Commercial | Critical | High | Very High | Spoke 2.2 |
| 27 | ISO 42001 AI management system | H2 | Info/Commercial | Critical | Medium | Very High | Spoke 2.2 |
| 28 | DORA AI governance compliance | H2 | Informational | High | Medium | Medium | Spoke 2.3 |
| 29 | NIS2 directive compliance AI | H2 | Info/Commercial | High | Medium | Medium | Spoke 2.4 |
| 30 | AI governance framework crosswalk | H2 | Informational | High | Low | High | Spoke 2.5 |
| 31 | NIST AI RMF vs ISO 42001 | H2 | Informational | Medium | Medium | Medium | Spoke 2.6 |
| 32 | EU AI Act vs NIST AI RMF | H2 | Informational | Medium | Medium | Medium | Spoke 2.5 |
| 33 | AI governance tools | H2 | Commercial | High | High | Very High | H2 Hub |
| 34 | AI governance platform | H2 | Commercial | Critical | High | Very High | H2 Hub |
| 35 | AI risk management framework | H2 | Informational | High | High | High | H2 Hub |
| 36 | AI compliance framework | H2 | Info/Commercial | High | Medium | High | H2 Hub |
| 37 | ISO 42001 requirements | H2 | Informational | High | Medium | High | Spoke 2.2 |
| 38 | AI governance best practices | H2 | Informational | Medium | High | Medium | H2 Hub |
| 39 | NIS2 vs DORA AI systems | H2 | Informational | Medium | Low | Medium | Spoke 2.3 |
| 40 | OWASP LLM vs MITRE ATLAS | H2 | Info/Technical | Medium | Low | High | Spoke 2.5 |
| 41 | Byzantine Fault Tolerance AI governance | H3 | Info/Technical | Critical | Low | Very High | H3 Hub |
| 42 | multi-LLM voting AI safety | H3 | Info/Technical | Critical | Low | Very High | Spoke 3.2 |
| 43 | AI council governance model | H3 | Informational | High | Low | High | Spoke 3.4 |
| 44 | HMAC signing AI compliance | H3 | Info/Technical | High | Low | High | Spoke 3.3 |
| 45 | cryptographic AI audit trail | H3 | Info/Technical | High | Low | High | Spoke 3.3 |
| 46 | multi-agent AI governance | H3 | Info/Technical | High | Low | High | H3 Hub |
| 47 | AI audit trail requirements | H3 | Informational | High | Medium | High | Spoke 3.4 |
| 48 | verifiable AI decision logging | H3 | Info/Technical | Medium | Low | High | Spoke 3.3 |
| 49 | AI agent consensus mechanism | H3 | Info/Technical | Medium | Low | High | Spoke 3.1 |
| 50 | AI governance transparency | H3 | Informational | Medium | Medium | Medium | H3 Hub |
| 51 | Model Context Protocol explained | H4 | Informational | Critical | High | High | Spoke 4.1 |
| 52 | MCP server guide | H4 | Info/Technical | Critical | High | High | Spoke 4.2 |
| 53 | MCP security best practices | H4 | Info/Technical | High | Medium | High | Spoke 4.5 |
| 54 | MCP registry | H4 | Informational | High | High | High | Spoke 4.4 |
| 55 | MCP getting started tutorial | H4 | Informational | High | High | Medium | Spoke 4.2 |
| 56 | building MCP servers | H4 | Technical | High | Medium | Medium | Spoke 4.3 |
| 57 | MCP protocol tutorial | H4 | Informational | Medium | High | Medium | Spoke 4.1 |
| 58 | MCP client integration | H4 | Technical | Medium | Medium | Medium | Hub 4 |
| 59 | MCP enterprise deployment | H4 | Technical/Commercial | High | Low | High | Hub 4 |
| 60 | MCP server list | H4 | Informational | Medium | High | Medium | Spoke 4.4 |
| 61 | MCP for AI governance | H4 | Informational | High | Low | High | Hub 4 |
| 62 | MCP tools vs resources | H4 | Informational | Medium | Low | Medium | Spoke 4.1 |

**Keyword distribution analysis:** Hub 1 carries the highest volume with 23 keywords targeting the regulatory compliance audience. Hub 2 has 17 keywords spanning standards and frameworks. Hub 3 has 10 keywords — all low-volume, high-intent technical terms with zero competition. Hub 4 has 12 keywords riding the MCP protocol's rapid growth curve. The 62-keyword portfolio covers informational, commercial, and transactional intent across all audience segments.

---

### 8.6 Internal Linking Architecture

#### 8.6.1 Hub-to-Hub + Hub-to-Spoke + Cross-Site Linking Rules

CSOAI operates across three primary domains (`csoai.org`, `councilof.ai`, `proofof.ai`). The internal linking strategy creates topical authority clusters within each domain and cross-site bridges that help search engines understand the entity relationship between CSOAI's properties.

**Linking rules applied to every spoke page:**

| Link Type | Count | Target | Anchor Text Rule |
|-----------|-------|--------|-----------------|
| Parent hub | 1 | Hub page (same domain) | Descriptive keyword anchor (e.g., "EU AI Act compliance guide") |
| Same-hub spokes | 2-3 | Related spoke pages | Contextual phrase from content (e.g., "high-risk system requirements") |
| Adjacent hubs | 1-2 | Spoke pages from other hubs | Topically relevant bridge (e.g., "cryptographic audit trails" links Hub 1 → Hub 3) |
| Product pages | 1-2 | Relevant CSOAI product pages | Natural CTA placement (e.g., "CSOAI EU AI Act Certification") |
| External authority | 2-3 | EU AI Act Service Desk, NIST, ISO | Cite as source (e.g., "per the EU AI Act Service Desk") |

**Hub-to-hub cross-linking matrix:**

| From | To | Anchor Context | Location |
|------|----|---------------|----------|
| H1 (EU AI Act) | H2 (Frameworks) | "NIST/ISO crosswalk" when discussing framework alignment | H1 Hub H2 #4, Spoke 1.2 H2 #9 |
| H1 (EU AI Act) | H3 (BFT Council) | "cryptographic audit trails" when discussing Article 12 | H1 Hub H2 #10, Spoke 1.6 H2 #7 |
| H1 (EU AI Act) | H4 (MCP) | "technical logging implementation" when discussing tooling | H1 Hub H2 #10, Spoke 1.5 H2 #4 |
| H2 (Frameworks) | H1 (EU AI Act) | "regulatory requirements" when discussing binding law | H2 Hub H2 #3, Spoke 2.3 H2 #7 |
| H2 (Frameworks) | H3 (BFT Council) | "multi-agent governance frameworks" when discussing implementation | H2 Hub H2 #6, Spoke 2.5 H2 #3 |
| H3 (BFT Council) | H1 (EU AI Act) | "Article 12 compliance" when discussing regulatory mapping | H3 Hub H2 #7, Spoke 3.4 |
| H3 (BFT Council) | H4 (MCP) | "MCP server verification" when discussing attestation | H3 Hub H2 #6, Spoke 3.3 H2 #11 |
| H4 (MCP) | H1 (EU AI Act) | "EU AI Act tool governance" when discussing compliance | H4 Hub H2 #9, Spoke 4.5 H2 #9 |
| H4 (MCP) | H3 (BFT Council) | "HMAC signing details" when discussing attestations | H4 Hub H2 #7, Spoke 4.4 H2 #7 |

**Product page connections:**

| Content Hub | Product Page | Anchor Text Context |
|-------------|-------------|---------------------|
| Hub 1 | `csoai.org/certification` | "CSOAI EU AI Act Certification" |
| Hub 1 | `csoai.org/eu-ai-act/assessment` | "Free EU AI Act Readiness Assessment" |
| Hub 2 | `csoai.org/frameworks/crosswalk` | "20+ Framework Crosswalk Engine" |
| Hub 2 | `csoai.org/iso-42001-certification` | "ISO 42001 Certification Services" |
| Hub 3 | `councilof.ai/bft-certification` | "BFT Council Certification" |
| Hub 3 | `councilof.ai/audit-trail` | "HMAC Audit Trail Verification" |
| Hub 4 | `proofof.ai/catalog` | "294 Verified MCP Servers" |
| Hub 4 | `proofof.ai/attestations` | "HMAC-Signed Server Attestations" |

**Cross-site linking implementation:** Use `rel="noopener"` on all cross-site links. The Organization schema `subOrganization` declarations (see Section 4) reinforce the domain relationship for AI crawlers. All cross-site links use descriptive anchor text — never "click here" or bare URLs.

---

### 8.7 90-Day Content Calendar

The calendar is sequenced by commercial value, search volume, competitive gap, and production dependencies. Hub pages publish first to establish topical authority before their spokes go live. Each piece includes a freshness review date — 50% of AI citations come from content less than 13 weeks old. [^56^][^57^]

#### 8.7.1 Month 1: Foundation (Hubs + 5 Priority Spokes)

| Week | Content Piece | Hub | Words | Priority | Publishing Date | Freshness Review |
|------|--------------|-----|-------|----------|----------------|-----------------|
| 1 | **H1 Hub:** Complete EU AI Act Compliance Guide | H1 | 8,000 | P0 | Day 1 | Quarterly |
| 1 | **Spoke 1.3:** EU AI Act Penalties and Fines | H1 | 1,500 | P0 | Day 3 | Quarterly |
| 2 | **Spoke 1.6:** EU AI Act Conformity Assessment | H1 | 2,000 | P0 | Day 8 | Quarterly |
| 2 | **Spoke 1.2:** EU AI Act High-Risk Systems | H1 | 2,500 | P0 | Day 10 | Quarterly |
| 3 | **H2 Hub:** AI Governance Frameworks Comparison | H2 | 5,000 | P0 | Day 15 | Quarterly |
| 3 | **Spoke 2.5:** AI Governance Framework Crosswalk | H2 | 3,000 | P0 | Day 17 | Quarterly |
| 4 | **Spoke 1.5:** EU AI Act GPAI Requirements | H1 | 2,000 | P1 | Day 22 | Quarterly |
| 4 | **Spoke 2.1:** NIST AI RMF Guide | H2 | 2,000 | P1 | Day 24 | Quarterly |

**Month 1 totals:** 2 hub pages + 6 spokes = 26,500 words. The two highest-ROI pieces (H1 Hub + Crosswalk) publish in Weeks 1 and 3. The H1 Hub targets the highest-volume keyword with the Digital Omnibus freshness angle; the Crosswalk targets the most defensible competitive moat. [^9^][^25^]

#### 8.7.2 Month 2: Expansion (10 Additional Spokes)

| Week | Content Piece | Hub | Words | Priority | Publishing Date | Freshness Review |
|------|--------------|-----|-------|----------|----------------|-----------------|
| 5 | **H3 Hub:** BFT Council Governance | H3 | 5,000 | P0 | Day 29 | Quarterly |
| 5 | **Spoke 3.1:** Byzantine Fault Tolerance Deep Dive | H3 | 2,000 | P0 | Day 31 | Quarterly |
| 6 | **Spoke 3.3:** HMAC-Signed AI Audit Trails | H3 | 2,000 | P0 | Day 36 | Quarterly |
| 6 | **Spoke 1.1:** EU AI Act Article 50 | H1 | 2,000 | P1 | Day 38 | Quarterly |
| 7 | **H4 Hub:** Complete MCP Protocol Guide | H4 | 5,000 | P0 | Day 43 | Quarterly |
| 7 | **Spoke 4.1:** Model Context Protocol Explained | H4 | 2,000 | P0 | Day 45 | Quarterly |
| 8 | **Spoke 4.5:** MCP Security Best Practices | H4 | 2,000 | P1 | Day 50 | Quarterly |
| 8 | **Spoke 3.2:** Multi-LLM Voting for AI Safety | H3 | 1,500 | P1 | Day 52 | Quarterly |

**Month 2 totals:** 2 hub pages + 6 spokes = 21,500 words. H3 Hub (BFT Council) is the unique differentiator with zero competition. H4 Hub (MCP Protocol) rides the fastest-growing developer topic. Both hubs establish authority before their remaining spokes publish in Month 3.

#### 8.7.3 Month 3: Completion (Remaining 10 Spokes + Optimization)

| Week | Content Piece | Hub | Words | Priority | Publishing Date | Freshness Review |
|------|--------------|-----|-------|----------|----------------|-----------------|
| 9 | **Spoke 1.9:** EU AI Act Transparency Obligations | H1 | 2,000 | P1 | Day 57 | Quarterly |
| 9 | **Spoke 1.4:** EU AI Act Timeline | H1 | 1,500 | P1 | Day 59 | Quarterly |
| 10 | **Spoke 2.2:** ISO 42001 Certification Guide | H2 | 2,000 | P0 | Day 64 | Quarterly |
| 10 | **Spoke 2.6:** AI Risk Management Framework Comparison | H2 | 2,500 | P1 | Day 66 | Quarterly |
| 11 | **Spoke 1.7:** EU AI Act vs ISO 42001 | H1 | 2,000 | P2 | Day 71 | Quarterly |
| 11 | **Spoke 1.8:** EU AI Act SME Guide | H1 | 2,500 | P1 | Day 73 | Quarterly |
| 12 | **Spoke 4.2:** MCP Getting Started Guide | H4 | 1,500 | P1 | Day 78 | Quarterly |
| 12 | **Spoke 4.3:** Building MCP Servers | H4 | 2,500 | P1 | Day 80 | Quarterly |
| 12 | **Spoke 4.4:** MCP Registry Guide | H4 | 1,500 | P1 | Day 82 | Quarterly |
| 12 | **Spoke 3.4:** EU AI Act Article 12 Audit Logs | H3 | 1,500 | P2 | Day 85 | Quarterly |
| 12 | **Spoke 1.10:** EU AI Act Deepfake Rules | H1 | 1,500 | P2 | Day 87 | Quarterly |
| 12 | **Spoke 2.3:** DORA AI Governance | H2 | 2,000 | P1 | Day 89 | Quarterly |
| 12 | **Spoke 2.4:** NIS2 Directive Guide | H2 | 2,000 | P1 | Day 90 | Quarterly |

**Month 3 totals:** 13 spokes = 22,500 words. All remaining spokes publish with at least one freshness review scheduled within 90 days.

**Quarter summary:**

| Metric | Count |
|--------|-------|
| Hub pages published | 4 |
| Spoke pages published | 25 |
| Total word count | ~70,500 |
| P0 (critical) pieces | 8 |
| P1 (high) pieces | 13 |
| P2 (medium) pieces | 8 |
| Freshness reviews scheduled | 29 (quarterly) |

**Lead magnet release schedule (integrated with content calendar):**

| Lead Magnet | Release Week | Gated? | Integration Point |
|-------------|-------------|--------|-------------------|
| EU AI Act Compliance Checklist (PDF) | Week 1 | Email gate | H1 Hub — download CTA |
| AI Governance Framework Crosswalk Matrix (Spreadsheet) | Week 3 | Email gate | Spoke 2.5 — download CTA |
| EU AI Act Readiness Assessment (10-question quiz) | Week 5 | No gate | csoai.org homepage + H1 Hub |
| EU AI Act Timeline Template | Week 9 | Email gate | Spoke 1.4 — download CTA |
| MCP Security Checklist (PDF) | Week 12 | Email gate | Spoke 4.5 — download CTA |

**Production velocity requirement:** The calendar demands ~780 words per working day over 90 days. Prioritize P0 pieces — if production bandwidth constrains output, defer P2 spokes (1.7, 1.10, 3.4) to Month 4 without material strategic impact. The 8 P0 pieces (4 hubs + 4 critical spokes) drive 80% of expected organic traffic and must publish on schedule. [^56^]

---

*Next: Chapter 9 — 90-Day Implementation Roadmap*


---

## 9. 90-Day Implementation Roadmap

This chapter synthesizes 284 requirements (90 P0, 135 P1, 59 P2) into 12 time-boxed sprints with acceptance criteria, story points, and owner assignment. Hand this to your team and execute.

**Scope:** 95,000 words across 6 domains. Budget: £15,000–£25,000.[^1^]

---

### 9.1 Phase 1: Foundation (Days 1–30) — Quick Wins

Deploy table-stakes infrastructure that competitors already have: AEO schema, unified navigation, comparison pages, and the first hub-and-spoke cluster.

| Sprint | Days | Theme | Points | Key Deliverables |
|--------|------|-------|--------|------------------|
| 1 | 1–7 | AEO Infrastructure | 21 | robots.txt (6 sites), FAQPage schema, Organization schema, /llms.txt, /llm-info |
| 2 | 8–14 | Unified Components | 20 | Header, footer, /verify page, cross-sell CTAs |
| 3 | 15–21 | Pages & Comparisons | 24 | vs-Vanta, vs-Drata, framework checker, /trust-center |
| 4 | 22–30 | Content Foundation | 34 | EU AI Act hub (5,000+ words), 5 spokes, G2/Capterra |

#### Sprint 1 (Days 1–7): AEO Critical Infrastructure

**Goal:** All 6 domains are crawlable and machine-readable by AI search engines.

| Ticket | Task | Acceptance Criteria | Pts | Owner |
|--------|------|---------------------|-----|-------|
| S1-T1 | Deploy `/robots.txt` | 25+ user-agent blocks; ALLOW search bots; DISALLOW training crawlers; sitemap refs | 3 | Frontend |
| S1-T2 | Add FAQPage JSON-LD | 5–10 QAs/page; 40–110 word answers; visible on page; triple-stack; passes Rich Results Test | 5 | SEO |
| S1-T3 | Add Organization schema | `@id`, `sameAs` (6+ profiles), `parentOrganization` (meok.ai), `subOrganization`, `knowsAbout` | 3 | SEO |
| S1-T4 | Create `/llms.txt` | H1 + blockquote + H2 sections + Optional on 3 domains; `<link rel="alternate">` tag | 5 | Frontend |
| S1-T5 | Create `/llm-info` pages | Organization + Person `@graph`; breadcrumb; markdown alternate; unique per domain | 5 | Frontend |

**Deliverable:** All 6 domains pass Schema.org Validator; AI crawler logs show visits within 7 days.

#### Sprint 2 (Days 8–14): Unified Components

**Goal:** Resolve multi-site fragmentation. Six domains become one perceived ecosystem.

| Ticket | Task | Acceptance Criteria | Pts | Owner |
|--------|------|---------------------|-----|-------|
| S2-T1 | Build unified header | CSOAI logo + site badge; ecosystem dropdown (5 domains); auth state; dual CTAs | 5 | Frontend |
| S2-T2 | Build shared footer | 5-column sitemap; legal/social links; Trust Center; newsletter signup | 3 | Frontend |
| S2-T3 | Deploy cross-site nav | Hover/click reveals all domains; current site highlighted; mobile-responsive | 3 | Frontend |
| S2-T4 | Build `/verify` page | Ed25519 key generator; HMAC verification demo; "Verify any attestation" CTA | 5 | Frontend |
| S2-T5 | Add cross-sell CTAs | Contextual links proofof.ai → safetyof.ai; ecosystem section; banner slot | 4 | PM |

**Deliverable:** All 5 sites display identical header/footer; Lighthouse CLS < 0.1.

#### Sprint 3 (Days 15–21): Pages & Comparisons

**Goal:** Capture high-intent comparison traffic. Drata's 10+ comparison pages prove this strategy works.[^2^]

| Ticket | Task | Acceptance Criteria | Pts | Owner |
|--------|------|---------------------|-----|-------|
| S3-T1 | Create `/compare/vanta` | Feature table; G2 ratings; "Why teams switch"; FAQPage schema; CTA block | 5 | Frontend |
| S3-T2 | Create `/compare/drata` | Same template; BFT/Ed25519 differentiators; trust badges | 5 | Frontend |
| S3-T3 | Add framework checker | Interactive: select frameworks → see gaps; links to crosswalk; lead capture | 5 | Frontend |
| S3-T4 | Create `/trust-center` | Security docs; SOC 2/ISO 27001 badges; subprocessor list; vulnerability disclosure | 5 | Frontend |
| S3-T5 | Announcement banners | Purple gradient; closable; cross-session persistence; EU AI Act deadline links | 4 | Frontend |

**Deliverable:** Comparison pages indexed; trust-center live; framework checker captures first leads.

#### Sprint 4 (Days 22–30): Content Foundation

**Goal:** Publish EU AI Act hub + 5 spokes. CSOAI becomes the first major guide updated for the Digital Omnibus December 2027 deadline — most competitors still show the obsolete August 2026 date.[^3^]

| Ticket | Task | Acceptance Criteria | Pts | Owner |
|--------|------|---------------------|-----|-------|
| S4-T1 | Publish EU AI Act hub | 5,000+ words; 13 H2s; Dec 2027 Digital Omnibus; checklist; Article + FAQPage schema | 8 | Writer |
| S4-T2 | Spoke 1.3: Penalties | 2,500–3,500 words; penalty tier table; enforcement timeline; hub links | 5 | Writer |
| S4-T3 | Spoke 1.2: High-Risk | 4,000–5,000 words; Annex III breakdown; HowTo schema | 5 | Writer |
| S4-T4 | Spoke 1.5: Conformity | 3,500–4,500 words; step-by-step; notified body capacity crisis | 5 | Writer |
| S4-T5 | Spoke 1.10: Logging | 3,500–4,500 words; code examples; HMAC implementation | 5 | Writer |
| S4-T6 | G2/Capterra profiles | Complete profiles; category selection; review solicitation | 3 | PM |

**Deliverable:** Hub + 5 spokes live; schema validated; G2 profile approved; ~24,000 words published.

---

### 9.2 Phase 2: Conversion (Days 31–60) — Cross-Sell & UX

Shift to revenue mechanics: cross-sell triggers, bundle pricing, developer portal, BFT council features. Ten additional spoke pages publish.

| Sprint | Days | Theme | Points | Key Deliverables |
|--------|------|-------|--------|------------------|
| 5 | 31–37 | Cross-Sell | 26 | Triggers, bundle pricing, /ecosystem map, welcome sequence |
| 6 | 38–44 | Developer Exp | 28 | Post-score flow, docs.meok.ai, case study, cookie consent |
| 7 | 45–51 | Council & Content | 30 | MCP browser (294 servers), live council demo, 5 spokes |
| 8 | 52–60 | Scale | 24 | Event pipeline, 5 spokes, UGC launch |

#### Sprint 5 (Days 31–37): Cross-Sell Components

**Goal:** Every conversion point surfaces cross-product offers. Free-to-paid flow: assessment → report → certification.

| Ticket | Task | Acceptance Criteria | Pts | Owner |
|--------|------|---------------------|-----|-------|
| S5-T1 | Cross-sell triggers | csoai.org → "Get Certified"; proofof.ai → "Join Council"; contextual by page | 5 | Frontend |
| S5-T2 | Bundle + checkout | Ecosystem Bundle at 40% off (cert + council + safety); 3-tier checkout | 5 | Frontend |
| S5-T3 | `/ecosystem` map | Visual 6-domain diagram; hover descriptions; click-navigate; Organization schema | 5 | Frontend |
| S5-T4 | Free-to-paid flow | Assessment → report email → consultation → paid; 3-email nurture | 5 | PM |
| S5-T5 | 7-email welcome | Day 0 (welcome+Ed25519), 1 (ecosystem), 3 (content), 7 (tool), 14 (case), 21 (offer), 30 (feedback) | 6 | PM |

**Deliverable:** Cross-sell CTAs on all 6 domains; bundle checkout live; email automation active.

#### Sprint 6 (Days 38–44): Developer Experience

**Goal:** Close the developer portal gap against Arthur.ai and Drata.[^4^]

| Ticket | Task | Acceptance Criteria | Pts | Owner |
|--------|------|---------------------|-----|-------|
| S6-T1 | Post-score cross-sell | After assessment: show certification tier; consultation offer; 24h/72h/7d emails | 5 | Frontend |
| S6-T2 | docs.meok.ai portal | API + curl; OAuth; Python/TS quickstarts; Postman collection | 8 | Frontend |
| S6-T3 | First case study | Named customer; before/after metrics; timeline; PDF; FAQPage schema | 5 | Writer |
| S6-T4 | Cookie consent | Granular toggles (Essential, Functional, Marketing); GDPR; preference persistence | 5 | Frontend |
| S6-T5 | Gated content system | Name, email, company, role; PDF delivery; progressive profiling; CRM sync | 5 | PM |

**Deliverable:** Developer portal with 5+ endpoints; case study published; consent on all domains.

#### Sprint 7 (Days 45–51): Council & Content

**Goal:** BFT Council and MCP catalog — unique differentiators — have interactive interfaces no competitor can match.[^5^]

| Ticket | Task | Acceptance Criteria | Pts | Owner |
|--------|------|---------------------|-----|-------|
| S7-T1 | MCP browser | Searchable 294-server catalog; HMAC attestation badge; security ratings; filters | 8 | Frontend |
| S7-T2 | Live council demo | Real-time 33-agent voting; consensus status; HMAC receipts; mobile | 8 | Frontend |
| S7-T3 | Spokes 3.1, 3.2 | BFT Architecture (3,500–4,500w); Multi-LLM Voting (3,000–4,000w); code | 5 | Writer |
| S7-T4 | Spoke 3.3: HMAC | 3,500–4,500w; crypto implementation; EU AI Act Art 12 mapping; code | 5 | Writer |
| S7-T5 | Spoke 2.2: ISO 42001 | 4,000–5,000w; certification steps; management system requirements | 4 | Writer |

**Deliverable:** MCP browser live; council demo with voting; 5 spokes (~18,000w) published.

#### Sprint 8 (Days 52–60): Scale

**Goal:** Unify analytics, complete content wave, launch UGC.

| Ticket | Task | Acceptance Criteria | Pts | Owner |
|--------|------|---------------------|-----|-------|
| S8-T1 | Event pipeline | Unified GA4; cross-domain tracking; server/cert/content events | 5 | Frontend |
| S8-T2 | 5 final spokes | 1.9 (Art 12), 2.1 (NIST RMF), 2.5 (Crosswalk), 3.4 (Governance), 4.1 (MCP Beginner) | 8 | Writer |
| S8-T3 | UGC launch | Reddit r/artificial weekly; Quora EU AI Act answers; LinkedIn 2x/week | 4 | Writer |
| S8-T4 | Certification registry | Public certified systems DB; filterable; API endpoint | 5 | Frontend |
| S8-T5 | Person schemas | `sameAs` (LinkedIn, Scholar, ORCID); `alumniOf`; `knowsAbout` | 2 | SEO |

**Deliverable:** Cross-domain analytics live; 5 spokes published; UGC active; registry searchable.

---

### 9.3 Phase 3: Authority (Days 61–90) — Platform & Scale

Build the unified dashboard, run the AEO audit, and produce the retrospective for Q2 planning.

| Sprint | Days | Theme | Points | Key Deliverables |
|--------|------|-------|--------|------------------|
| 9 | 61–67 | Dashboard | 20 | dashboard.meok.ai, team/org, network status |
| 10 | 68–74 | Advanced | 18 | MCP trending, interactive voting, risk tools |
| 11 | 75–81 | Optimization | 12 | AEO audit, schema fixes, freshness pipeline |
| 12 | 82–90 | Retrospective | 10 | KPI review, Q2 roadmap |

#### Sprint 9 (Days 61–67): Dashboard

**Goal:** dashboard.meok.ai gives users one view of certifications, council activity, and safety metrics.

| Ticket | Task | Acceptance Criteria | Pts | Owner |
|--------|------|---------------------|-----|-------|
| S9-T1 | Unified dashboard | Cross-domain SSO; cert status; council history; safety scores; Ed25519 keys | 8 | Frontend |
| S9-T2 | Team/org features | Member invites; RBAC; shared certs; activity audit log | 5 | Frontend |
| S9-T3 | Network status | Real-time 294-server health; geographic map; uptime; 60s auto-refresh | 4 | Frontend |
| S9-T4 | Cross-site analytics | Unified traffic; conversion funnel; attribution; weekly reports | 3 | Frontend |

**Deliverable:** dashboard.meok.ai live; network status auto-refreshes.

#### Sprint 10 (Days 68–74): Advanced Features

| Ticket | Task | Acceptance Criteria | Pts | Owner |
|--------|------|---------------------|-----|-------|
| S10-T1 | MCP trending | "Trending this week"; download graphs; attestation activity; sort by popularity | 4 | Frontend |
| S10-T2 | Interactive voting | Users submit questions; real-time consensus; HMAC receipt; shareable | 5 | Frontend |
| S10-T3 | `@graph` stacking | Organization + WebSite + BreadcrumbList + Article + FAQPage; `@id` refs | 3 | SEO |
| S10-T4 | Risk Assessment | 10-question quiz; scored 0–100; recommendations; email capture; shareable | 4 | Frontend |
| S10-T5 | Risk Classifier | Classify by risk level; compliance checklist; gated lead capture | 2 | Frontend |

**Deliverable:** MCP browser with trends; interactive council voting; all landing pages @graph-stacked.

#### Sprint 11 (Days 75–81): Optimization

| Ticket | Task | Acceptance Criteria | Pts | Owner |
|--------|------|---------------------|-----|-------|
| S11-T1 | AEO audit | Query 4 AI engines with target keywords; record citations, accuracy, source; doc gaps | 3 | SEO |
| S11-T2 | Schema optimization | Fix failures; add FAQPage QAs; update `dateModified`; validate | 3 | SEO |
| S11-T3 | Freshness pipeline | Auto `dateModified`; quarterly hub updates; monthly competitive; 48h breaking news | 3 | SEO |
| S11-T4 | `agent.json` | A2A Agent Card on csoai.org + meok.ai; CORS; 4 skills; JSON-RPC 2.0 | 3 | Frontend |

**Deliverable:** AEO audit report; all schema fixes deployed; agent.json validated.

#### Sprint 12 (Days 82–90): Retrospective & Plan

| Ticket | Task | Acceptance Criteria | Pts | Owner |
|--------|------|---------------------|-----|-------|
| S12-T1 | KPI review | Organic traffic, AI citations, schema %, cross-site nav, signups, cert starts, downloads, MCP visits, council engagement, comparison ranks, G2 views, bundle conversion | 3 | PM |
| S12-T2 | Retrospective | Worked/didn't/blockers/velocity; documented for Q2 | 2 | PM |
| S12-T3 | Q2 roadmap | Stakeholder input; prioritized 91–180 backlog; resource proposal | 3 | PM |
| S12-T4 | Freshness update | Update 4 hubs for regulatory changes; verify year refs; refresh sitemaps | 2 | Writer |

**Deliverable:** KPI dashboard; retrospective doc; Q2 roadmap draft; all hubs freshness-dated.

---

### 9.4 Resource Allocation

#### 9.4.1 Team Roles & FTE

| Role | FTE | Sprints | Rate | 90-Day Cost |
|------|-----|---------|------|-------------|
| Frontend Dev | 1.0 | All 12 | £350 | £31,500 |
| Content Writer | 1.0 | 4–10 | £300 | £21,000 |
| SEO Specialist | 0.5 | 1–3, 11 | £400 | £8,400 |
| Product Manager | 0.5 | 5–9 | £450 | £9,450 |
| **Total** | **3.0** | | | **£70,350** |

Reduce to £18,200 by leveraging existing capacity, AI-assisted drafting (40% writer reduction), and deferring the dashboard:

| Role | FTE | Approach | Cost |
|------|-----|----------|------|
| Frontend | 0.75 | P0 only; defer dashboard | £15,750 |
| Writer | 0.6 | AI drafts + review | £8,400 |
| SEO | 0.25 | Templates + validation | £2,100 |
| PM | 0.25 | Flow design + copy | £2,450 |
| Tools | — | GA4, email, hosting, G2 | £2,000 |
| **Total** | **1.85** | | **£18,200** |

#### 9.4.2 Tool Costs (90 Days)

| Tool | Purpose | Cost |
|------|---------|------|
| GA4 | Cross-domain analytics | Free |
| SendGrid | Email automation | £225 |
| Vercel | Hosting (6 domains) | £150 |
| G2/Capterra | Review presence | Free |
| AI writing | Content acceleration | £120 |
| **Total** | | **£495** |

---

### 9.5 Risk Register

| ID | Risk | P | I | Mitigation | Owner |
|----|------|---|---|------------|-------|
| R1 | Domain authority too low — 6+ month ranking delay | H | H | Long-tail first; backlinks via 20+ framework crosswalk; expect traction month 6[^7^] | SEO |
| R2 | Multi-site fragmentation — 6 domains, no unified UX | H | H | Unified header/footer day 14; SSO day 67; `subOrganization` schema[^8^] | Frontend |
| R3 | Content bandwidth — 95K words = ~1,000 words/day | M | H | AI drafting (-40% days); prioritize P0 pieces; reduce spoke length if needed[^9^] | Writer |
| R4 | Regulatory timing — EU AI Act deadlines shift | M | M | Quarterly hub updates; news monitoring; `dateModified` prominent[^10^] | PM |
| R5 | Competitors close BFT gap | L | H | 33-agent production vs. competitor zero; thought leadership NOW[^11^] | Writer |
| R6 | AEO becomes irrelevant — LLMs change sourcing | L | M | Schema benefits SEO + AEO; llms.txt cost negligible; diversify 4 engines[^12^] | SEO |
| R7 | Technical blockers — no CMS schema support | M | H | Sprint 1 resolves all; auto sitemap day 7; Next.js/Astro SSR[^13^] | Frontend |
| R8 | Content doesn't convert — traffic without signups | M | H | Contextual CTAs; gated checklist; free assessment; abandonment emails[^14^] | PM |

**Heat Map:**

| | Low | Medium | High |
|--|-----|--------|------|
| **High P** | — | — | R1, R2 |
| **Medium P** | — | R4 | R3, R7, R8 |
| **Low P** | R6 | — | R5 |

Four High-Impact risks (R1, R2, R3, R8) are mitigated in days 1–30 via sprints 1–5. Phase 1 front-loads infrastructure to neutralize the greatest threats.

```
Day:    1      15      30      45      60      75      90
        |-------|-------|-------|-------|-------|-------|
P1      [==== FOUNDATION ====]  S1 S2 S3 S4
P2                      [==== CONVERSION ====]  S5 S6 S7 S8
P3                                          [==== AUTHORITY ====]  S9 S10 S11 S12
Writer                  [======== FULL TIME ========]
SEO             [===]                                 [===]
PM                              [=======]
Frontend        [=================================================]
```

[^1^]: `csoai_requirements.md`: 284 requirements, 90 P0, 135 P1, 59 P2.
[^2^]: Drata operates 10+ comparison pages. Source: `competitive_dim01.md` §2.8.
[^3^]: "Most competitors still reference old Aug 2026 deadline." Source: `eu_ai_act_content_dim03.md`.
[^4^]: "Arthur.ai strongest dev experience, Drata has MCP." Source: `competitive_dim01.md` §5.5.
[^5^]: "Zero competition — no competitor has multi-agent governance." Source: `competitive_dim01.md` §6.1.
[^6^]: Budget from contractor rates × sprint allocations. Source: `csoai_requirements.md`.
[^7^]: "Focus on long-tail first; expect traction month 6." Source: `eu_ai_act_content_dim03.md`.
[^8^]: "Implement unified navigation within 30 days." Source: `competitive_dim01.md` §6.2.
[^9^]: "95,000 words = ~1,000 words/day; requires AI-assisted production." Source: `eu_ai_act_content_dim03.md`.
[^10^]: "Digital Omnibus moved deadline to Dec 2027; quarterly freshness." Source: `eu_ai_act_content_dim03.md`.
[^11^]: "CSOAI has 33-agent production; establish thought leadership NOW." Source: `competitive_dim01.md` §6.1.
[^12^]: "Schema benefits both SEO and AEO; llms.txt cost negligible." Source: `aeo_infrastructure_dim02.md`.
[^13^]: "No CMS blocks content pipeline at scale." Source: `competitive_dim01.md` §7.2.
[^14^]: "Free-to-paid: tool → report → consultation → certification." Source: `csoai_requirements.md` X15.


---

# 10. Competitive Positioning & Appendix

## 10.1 Competitive Intelligence Summary

The AI governance SaaS market is dominated by four well-capitalized incumbents. None offers cryptographic verification, multi-agent governance, or open certification -- CSOAI's core differentiators. This section maps each competitor's positioning to identify where CSOAI can outmaneuver them.

### 10.1.1 Vanta Profile: 4.6/5 G2, 16K+ Customers, Trust Center Leader

Vanta is the incumbent trust management platform with the deepest brand recognition in compliance automation. Its light-themed interface uses a 5-item top navigation (Platform, Solutions, Partners, Resources, Plans) with a persistent purple announcement banner [^44^]. The homepage hero runs "Trust is everything" with inline email capture and a "Get a demo" CTA [^44^].

| Metric | Value | Source |
|--------|-------|--------|
| G2 Rating | 4.6/5 (2,450+ reviews) | [^125^] |
| Gartner Peer Insights | 4.4/5 (68 ratings) | [^132^] |
| Customer Count | 16,000+ | [^44^] |
| Integrations | 400+ | [^80^] |
| Starting Price | ~$10,000/yr | [^101^] |

Vanta's Trust Center (trust.vanta.com) displays real-time control evidence, subprocessors, and certification downloads -- the category standard [^84^]. Its developer portal offers REST and GraphQL APIs but no MCP integration or open-source components [^78^]. Comparison pages target Drata keywords (`/compare/drata`) [^86^]. Pricing is fully gated behind demo requests [^101^].

### 10.1.2 Drata Profile: 4.8/5 G2, MCP Integration, 10+ Comparison Pages

Drata positions as the "AI-native trust and GRC platform" and is CSOAI's most technically advanced competitor. Its dark-themed 7-item navigation (Products, Solutions, Customers, Partners, Resources, Company) carries a blue announcement banner [^45^]. Drata is the **only competitor with MCP integration**, offering an experimental server enabling AI agents to interact with compliance workflows via natural language [^99^].

| Metric | Value | Source |
|--------|-------|--------|
| G2 Rating | 4.8/5 (1,097 reviews) | [^78^] |
| Customer Count | 8,500+ | [^45^] |
| Comparison Pages | 10+ dedicated vs-pages | [^118^] |
| Starting Price | ~$7,500/yr | [^80^] |

Drata's developer portal at developers.drata.com is the most advanced: REST API with curl examples, Custom Connections, Drata MCP server, and SafeBase Trust API [^95^]. Its comparison SEO playbook includes `/solutions/vs/vanta`, `/learn/compare/thoropass-vs-vanta-vs-drata`, and eight additional competitive URLs -- each with feature tables, G2 callouts, and "Why teams switch" messaging [^118^]. This is the playbook CSOAI should replicate.

### 10.1.3 Arthur.ai Profile: Open Source Engine, Strongest Dev Portal

Arthur.ai is the only competitor combining AI governance with genuine open source. Its minimal 4-item navigation (Platform, Pricing, Resources, Developers) signals developer-first positioning [^42^]. It offers the **only transparent pricing** in the field: free open-source tier, $60/mo Premium, custom Enterprise [^75^].

| Metric | Value | Source |
|--------|-------|--------|
| GitHub Stars | 1,000+ | [^85^] |
| Total Funding | $63M (Series B) | [^23^] |
| Model Types | LLMs, tabular, NLP, CV | [^23^] |
| Open Source | Arthur Engine, Arthur Bench | [^85^] |

Arthur's four core products are Observability (monitoring), Shield (LLM firewall), Bench (open-source evaluation), and Agent Discovery & Governance [^23^] [^31^]. Developer docs at docs.arthur.ai cover Monitor, Alert, Govern, and Report with REST references and code examples [^25^]. The GitHub repo includes quickstart installers, Docker/Kubernetes templates, and Claude Code integration [^85^]. Arthur holds SOC 2 Type II and offers HIPAA BAA but lacks G2 presence and a Trust Center [^31^].

### 10.1.4 Credo AI Profile: Forrester 12 Perfect Scores, Governance Sandbox

Credo AI holds the strongest third-party validation of any competitor. Its 7-item dark navigation includes a search icon -- unique among the four [^43^]. The hero displays "12 Forrester Perfect Scores," "10x Faster Compliance," and "60% Faster Reviews" [^43^].

| Metric | Value | Source |
|--------|-------|--------|
| Forrester Wave | Leader, Q3 2025 (12 Perfect Scores) | [^81^] |
| Fast Company | Most Innovative 2026 (No. 6 Applied AI) | [^43^] |
| Gartner | Market Guide for AI Governance 2025 | [^81^] |
| Organic Growth | ~200% over 18 months | [^92^] |

Credo AI's product modules are AI Registry, Risk Intelligence, Policy Engine, and Runtime Governance [^77^]. The platform is demo-only with no public pricing [^43^]. Its **Interactive Governance Sandbox** lets prospects input use cases for a preliminary risk score -- a high-converting lead magnet [^92^]. The dedicated `/eu-ai-act` page and EU AI Act Readiness Pack drive targeted organic traffic [^112^] [^91^]. SEO targets high-intent keywords ("AI Act compliance," "LLM bias mitigation," "automated red-teaming") through optimized landing pages and executive roundtables [^92^].

---

## 10.2 Master Comparison Matrix

### 10.2.1 12 Dimensions x 5 Competitors

Scores: **3=Strong**, **2=Present**, **1=Weak**, **0=Absent**.

| Dimension | Vanta | Drata | Arthur.ai | Credo AI | CSOAI |
|-----------|:-----:|:-----:|:---------:|:--------:|:-----:|
| Review Platform Presence | 3 | 3 | 0 | 0 | 0 |
| Analyst Recognition | 1 | 1 | 0 | 3 | 0 |
| Developer Portal Depth | 2 | 3 | 3 | 1 | 0 |
| Trust Center / Security | 3 | 3 | 1 | 1 | 0 |
| Comparison Pages (SEO) | 2 | 3 | 0 | 0 | 0 |
| Transparent Pricing | 0 | 0 | 3 | 0 | 0 |
| Free Tools / Lead Magnets | 2 | 2 | 3 | 3 | 1 |
| EU AI Act Content Depth | 2 | 2 | 1 | 3 | 1 |
| Open Source Presence | 0 | 0 | 3 | 0 | 1 |
| Integration Ecosystem | 3 | 2 | 1 | 1 | 2 |
| Content Publishing Freq. | 3 | 3 | 2 | 2 | 0 |
| Unique Technical Differentiator | 1 | 2 | 2 | 2 | 3 |
| **TOTAL** | **22** | **24** | **19** | **17** | **8** |

CSOAI's 8/36 reflects powerful unique differentiators with no table-stakes presentation. The 16-point gap against Drata (24) is a **presentation gap**, not a product gap. Every 0-score dimension is addressable within 30-90 days per preceding chapters.

### 10.2.2 CSOAI Win/Loss by Dimension

**Dimensions where CSOAI wins (unique moats):**

| Dimension | CSOAI Advantage | Defensibility |
|-----------|----------------|---------------|
| Ed25519 cryptographic signing | Tamper-evident certification | High -- infrastructure |
| BFT council governance (33-agent) | Multi-agent voting consensus | High -- production system |
| MCP + compliance integration | 294 HMAC-signed servers | Medium -- replicable |
| Proof of Agency certification | Blockchain-verified AI agency | High -- network effects |
| Multi-site ecosystem (5 domains) | Distributed authority signals | Medium -- currently fragmented |

**Dimensions where CSOAI loses (table stakes to close):**

| Dimension | Severity | Timeline | Chapter Ref |
|-----------|:--------:|:--------:|-------------|
| G2/Capterra presence | CRITICAL | 30-60d | Sec 4.2 |
| Developer portal | CRITICAL | 30-60d | Sec 6.1 |
| Trust Center page | HIGH | 14d | Sec 4.2 |
| Comparison pages | HIGH | 14d | Sec 5.3 |
| Hero email capture | HIGH | 7d | Sec 3.1 |
| Customer logo bar | HIGH | 7d | Sec 3.1 |
| Announcement banner | MEDIUM | 3d | Sec 3.2 |
| Content frequency | MEDIUM | 90d | Sec 7 |
| Schema markup | MEDIUM | 7d | Sec 2 |

### 10.2.3 6 White-Space Opportunities

A white-space opportunity is a niche where **zero competitors maintain authoritative presence**.

**WS1: BFT AI Governance.** No competitor offers practitioner content on multi-agent BFT voting for AI governance. Academic papers exist, but no production system documents its architecture. CSOAI's 33-agent council is the only live system. Target: 6,000-word hub + 4 spokes.

**WS2: MCP + Regulatory Compliance.** MCP is the fastest-growing AI developer topic, yet all content is developer-focused with zero compliance angle. CSOAI's 294 HMAC-signed MCP servers create a unique authority intersection. Target: 6,000-word hub + 5 spokes.

**WS3: Cryptographic AI Audit Trails.** EU AI Act Article 12 requires logging but specifies no standard. No competitor offers HMAC-signed audit trail guidance or Ed25519 compliance evidence. Target: 4,000-word guide + code samples.

**WS4: 20+ Framework Crosswalk.** The best available comparison covers 3 frameworks. No single resource maps 20+ with sortable comparison. CSOAI can create the definitive reference. Target: 5,000-word hub + interactive table.

**WS5: Ed25519 AI Certification Verification.** Cryptographic signing for AI compliance certification is entirely uncontested. No competitor uses elliptic-curve signatures for certification non-repudiation. Target: Technical spec + interactive verifier.

**WS6: Free AI Safety Score + Public Registry.** No competitor offers a fully public, ungated AI safety scoring tool with a searchable certification registry. CSOAI's functional safety score combined with a public registry at proofof.ai creates a traffic-backlink-case study flywheel. Target: Score landing page + searchable registry.

---

## 10.3 Appendix A: Complete Site Inventory

### 10.3.1 All 5 Sites

| Site | URL | State | Schema | Priority |
|------|-----|-------|--------|----------|
| csoai.org | `https://csoai.org` | Live, minimal | None | P0 |
| proofof.ai | `https://proofof.ai` | Live, cert focus | None | P0 |
| councilof.ai | `https://councilof.ai` | Live, governance | None | P1 |
| safetyof.ai | `https://safetyof.ai` | Live, safety | None | P1 |
| meok.ai | `https://meok.ai` | Live, coordination | None | P2 |

**Page Gaps Across All Sites:**

| Page Type | csoai | proofof | council | safety | meok |
|-----------|:-----:|:-------:|:-------:|:------:|:----:|
| `/pricing` | No | No | N/A | N/A | N/A |
| `/security` or trust center | No | No | No | No | No |
| `/compare/*` | No | No | No | No | No |
| `/docs` developer portal | No | No | No | No | No |
| `/case-studies` | No | No | No | No | No |
| `/blog` | No | No | No | No | No |
| `/eu-ai-act` landing | No | No | No | No | No |
| `/about/llm` | No | No | No | No | No |
| `/llms.txt` | No | No | No | No | No |
| `robots.txt` (AI policy) | Needs | Needs | Needs | Needs | Needs |

---

## 10.4 Appendix B: Schema Quick Reference

### 10.4.1 Page Type to Schema Mapping

| Page Type | Primary | Secondary | Location |
|-----------|---------|-----------|----------|
| Homepage | `Organization` + `WebSite` | `FAQPage` | `<head>` |
| Blog post | `BlogPosting` | `Article`, `Person` | `<head>` |
| Guide/tutorial | `Article` | `HowTo`, `FAQPage` | `<head>` |
| Product page | `SoftwareApplication` | `Offer`, `AggregateRating` | `<head>` |
| FAQ page | `FAQPage` | `Article` | `<head>` |
| Pricing page | `SoftwareApplication` | `Offer` (per tier) | `<head>` |
| Comparison page | `Article` | `FAQPage` | `<head>` |
| Landing page | `WebPage` | `FAQPage` + `HowTo` | `<head>` |
| Team/bio page | `Person` | `Organization` | `<head>` |
| Certification | `CreativeWork` | `Review` | `<head>` |

### 10.4.2 JSON-LD Validation Checklist

```
[ ] @context is "https://schema.org"
[ ] @type matches page type from mapping table
[ ] @id uses canonical URL + fragment
[ ] name field present, under 110 chars
[ ] description present, under 300 chars
[ ] FAQPage: 5-10 Q/A pairs, answers 40-110 words
[ ] Article: datePublished + dateModified in ISO 8601
[ ] Person: sameAs with LinkedIn, Twitter, GitHub
[ ] Organization: subOrganization links to all 5 sites
[ ] SoftwareApplication: offers with priceCurrency="USD"
[ ] Script tag uses type="application/ld+json"
[ ] Content visible on page (not script-only)
[ ] Passed Google Rich Results Test
[ ] Passed Schema.org validator
```

---

## 10.5 Appendix C: Copy Template Library

### 10.5.1 Headline Formulas (10 Patterns)

| # | Pattern | Example |
|---|---------|---------|
| 1 | Definitive Guide | "The Complete EU AI Act Compliance Guide (2025-2027)" |
| 2 | Comparison | "CSOAI vs Vanta: Cryptographically Verified Compliance" |
| 3 | How-To | "How to Implement HMAC-Signed AI Audit Trails with Ed25519" |
| 4 | Numbered | "20+ AI Governance Frameworks Compared: The Definitive Crosswalk" |
| 5 | Problem/Solution | "EU AI Act Deadline Moved? Here's the Compliance Roadmap" |
| 6 | Authority | "Why 294 Servers Use BFT Consensus for AI Certification" |
| 7 | Free Tool | "Get Your AI Safety Score in 60 Seconds" |
| 8 | Contrarian | "Centralized Compliance Audits Are Broken. Here's the Alternative." |
| 9 | Framework | "The BFT Council Method for Multi-Agent AI Governance" |
| 10 | Urgency | "Certify Your AI System Before the Dec 2027 High-Risk Deadline" |

### 10.5.2 CTA Formula Sheet (20 Templates by Intent)

| # | CTA | Intent | Context |
|---|-----|--------|---------|
| 1 | "Read the Complete Guide" | Info | Blog footer |
| 2 | "Download the Free Checklist" | Info | Guide sidebar |
| 3 | "Compare All 20+ Frameworks" | Info | Governance page |
| 4 | "View the Certification Registry" | Info | Trust section |
| 5 | "Check Network Status" | Info | Footer |
| 6 | "Get Your Free Safety Score" | Commercial | Homepage hero |
| 7 | "Start Certification" | Commercial | Product page |
| 8 | "Explore the BFT Council" | Commercial | Governance page |
| 9 | "View Pricing" | Commercial | Navigation |
| 10 | "Schedule a Demo" | Commercial | Comparison pages |
| 11 | "Begin Certification Now" | Transactional | Pricing page |
| 12 | "Join the Council" | Transactional | councilof.ai |
| 13 | "Get Started -- Free" | Transactional | Homepage hero |
| 14 | "Verify a Certificate" | Transactional | proofof.ai |
| 15 | "Deploy MCP Server" | Transactional | MCP guide |
| 16 | "Read the API Docs" | Developer | Header nav |
| 17 | "View on GitHub" | Developer | Open source |
| 18 | "Try the Sandbox" | Developer | Dev page |
| 19 | "Install MCP Server" | Developer | Hub page |
| 20 | "Ed25519 Quickstart" | Developer | Security page |

---

## 10.6 Appendix D: Technical Resources

### 10.6.1 Recommended Tools

| Tool | Purpose | Cost | Priority |
|------|---------|------|----------|
| Google Rich Results Test | Schema validation | Free | P0 |
| Schema.org Validator | JSON-LD check | Free | P0 |
| Ahrefs / SEMrush | Keyword research | $99-399/mo | P1 |
| Screaming Frog | Site crawl + audit | Free/Paid | P1 |
| PageSpeed Insights | Core Web Vitals | Free | P0 |
| GA4 | Analytics | Free | P0 |
| Search Console | Index + query data | Free | P0 |
| G2 / Capterra | Review presence | Free/Paid | P1 |
| Postman | API docs + testing | Free | P2 |
| GitHub | OSS hosting | Free/Paid | P1 |

### 10.6.2 API Endpoint Reference

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `api.proofof.ai/v1/certify` | POST | Submit for certification | Ed25519 |
| `api.proofof.ai/v1/verify` | GET | Verify certification status | Public |
| `api.proofof.ai/v1/registry` | GET | List certified systems | Public |
| `api.councilof.ai/v1/vote` | POST | Submit governance vote | Ed25519 |
| `api.councilof.ai/v1/proposals` | GET | List active proposals | Public |
| `api.csoai.org/v1/safety-score` | POST | Generate assessment | API key |
| `api.csoai.org/v1/crosswalk` | GET | Framework comparison | Public |
| `/.well-known/agent.json` | GET | A2A agent discovery | Public |
| `/.well-known/llms.txt` | GET | LLM site summary | Public |
| `/robots.txt` | GET | AI crawler policy | Public |

---

## 10.7 Appendix E: Glossary

### 10.7.1 20 Key Terms

| Term | Full Form | Definition |
|------|-----------|------------|
| **A2A** | Agent-to-Agent | Google's protocol for AI agent discovery and communication. CSOAI implements via `agent.json` at `/.well-known/`. |
| **AEO** | Answer Engine Optimization | Structuring content so AI search engines extract and cite it accurately. |
| **BFT** | Byzantine Fault Tolerance | Distributed consensus among nodes despite failures/malice. CSOAI's Council uses 33-agent BFT voting. |
| **BreadcrumbList** | Schema.org type | Structured data defining a page's position in site hierarchy. |
| **dateModified** | Schema.org property | Article last-update timestamp. 50% of AI citations favor content under 13 weeks old. |
| **Ed25519** | Edwards-curve DSA | Elliptic-curve signature scheme for tamper-evident certification and audit trails. |
| **EU AI Act** | EU AI Regulation | First comprehensive AI law; classifies systems by risk. High-risk deadline: Dec 2027. |
| **FAQPage** | Schema.org type | Q&A markup; triple-stacking with Article + HowTo yields 1.8x AI citations. |
| **GEO** | Generative Engine Optimization | Synonym for AEO; optimizing for AI-generated search responses. |
| **GRC** | Governance, Risk, Compliance | Software category covering governance, risk assessment, regulatory compliance. |
| **HMAC** | Hash-based MAC | Cryptographic integrity/authenticity verification for signed attestations. |
| **HowTo** | Schema.org type | Step-by-step instruction markup; may display directly in rich results. |
| **JSON-LD** | JSON for Linked Data | Recommended format for Schema.org data in `<script type="application/ld+json">`. |
| **MCP** | Model Context Protocol | Open standard for AI model data/tool connections; CSOAI operates 294 verified servers. |
| **PoA** | Proof of Agency | CSOAI's certification for autonomous AI safety and human alignment. |
| **ROI** | Return on Investment | Net profit / cost. Vanta cites "Reduce audit times by 50%" as ROI [^101^]. |
| **sameAs** | Schema.org property | Links entity to external profiles (LinkedIn, GitHub, Wikipedia). |
| **SOC 2** | Service Org Control 2 | Auditing standard for security, availability, confidentiality. All four competitors hold it. |
| **Trust Center** | -- | Page/subdomain showing certifications, compliance status, subprocessors. |
| **x402** | -- | Micropayment protocol for autonomous AI agent transactions. Unique to CSOAI. |

---

*This chapter synthesizes 20+ independent searches across G2, Gartner, Forrester, competitor websites, developer portals, and GitHub. Data reflects publicly available information as of July 2026.*
