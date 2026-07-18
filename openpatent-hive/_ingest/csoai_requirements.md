# CSOAI Ecosystem: Comprehensive Requirements Document

**Version:** 1.0
**Date:** July 2026
**Scope:** 6 domains (csoai.org, proofof.ai, councilof.ai, safetyof.ai, meok.ai, relevance.ai)
**Sources:** Competitive audit (dim01), AEO infrastructure research (dim02), EU AI Act content strategy (dim03), site-by-site UX audit (9 parts)

---

## Executive Summary

This document captures **230+ individual requirements** extracted from the CSOAI ecosystem audit and three parallel research dimensions. Requirements are organized into 8 categories covering technical implementation, UX/UI design, content production, cross-sell mechanics, AEO/SEO infrastructure, cross-site integration, competitive parity, and strategic differentiation.

---

## Category 1: Technical Requirements
### Code, Schemas, APIs, Infrastructure

| ID | Requirement | Priority | Effort | Site(s) | Dependencies |
|----|-------------|----------|--------|---------|--------------|
| **T1** | **Create `/robots.txt`** with explicit AI crawler access policy -- allow OAI-SearchBot, Claude-SearchBot, PerplexityBot; disallow training crawlers (GPTBot, ClaudeBot) selectively; list all 24+ user-agent blocks individually with blank lines between | P0 | Small | All 6 | None |
| **T2** | **Implement `/llms.txt`** at root following Jeremy Howard/Answer.AI proposed standard: H1 heading, blockquote summary, H2 sections with curated markdown links, Optional section for lower-priority content | P0 | Small | csoai.org, proofof.ai, meok.ai | None |
| **T3** | **Create `/llms-full.txt`** with complete site content in single markdown file for documentation-heavy sites | P1 | Small | csoai.org, proofof.ai, meok.ai | T2 |
| **T4** | **Implement Organization JSON-LD schema** on all homepages: `@id`, `name`, `alternateName` (CSOAI), `url`, `logo` (min 112x112px PNG), `description`, `foundingDate` (2024), `contactPoint` (phone/email), `sameAs` (LinkedIn, X, GitHub, Crunchbase, Wikidata), `address`, `parentOrganization` (meok.ai), `subOrganization` (councilof.ai, proofof.ai, safetyof.ai, relevance.ai), `knowsAbout` (7+ topics), `memberOf` | P0 | Small | All 6 | None |
| **T5** | **Implement Person JSON-LD schema** for all founders/leadership: stable `@id`, `name`, `alternateName`, `url`, `image` (800x800), `description` (2-3 sentence bio), `jobTitle`, `worksFor` (Organization ref), `affiliation`, `alumniOf` (CollegeOrUniversity with sameAs), `knowsAbout` (Thing refs with Wikipedia links), `sameAs` (LinkedIn, X, GitHub, Google Scholar, Crunchbase, ORCID) | P0 | Medium | All 6 | T4 |
| **T6** | **Implement FAQPage JSON-LD schema** (5-10 QAs per page) on all homepages and key landing pages: `@id`, `mainEntity` array of Question/Answer pairs, answers 40-110 words each, self-contained, matched to real AI prompt patterns ("What is...", "How does...") | P0 | Medium | All 6 | None |
| **T7** | **Implement `@graph` schema stacking** combining Organization + WebSite + BreadcrumbList + Article + FAQPage in single script tag with `@id` references for entity consolidation | P1 | Medium | All 6 | T4, T5, T6 |
| **T8** | **Implement Article/BlogPosting JSON-LD** with `datePublished` and `dateModified` (ISO 8601), `author` (Person `@id` ref), `publisher`, `image`, `keywords`, `inLanguage`, `isAccessibleForFree`, `copyrightHolder`, `license` (CC BY 4.0) | P0 | Small | All 6 | T5 |
| **T9** | **Implement BreadcrumbList schema** on all non-home pages: `itemListElement` array with `ListItem` (position, name, item URL) | P1 | Small | All 6 | None |
| **T10** | **Implement SoftwareApplication + Offer schema** on proofof.ai pricing: `applicationCategory`, `operatingSystem`, `offers` array with `@type: Offer` (name, description, price, priceCurrency, priceValidUntil), `aggregateRating`, `featureList`, `softwareVersion`, `releaseNotes` | P1 | Small | proofof.ai | T4 |
| **T11** | **Implement WebSite schema with SearchAction** for sitelinks search box: `@id`, `url`, `name`, `publisher` (ref), `potentialAction` (SearchAction with target, query-input) | P1 | Small | All 6 | T4 |
| **T12** | **Create `/.well-known/agent.json`** (A2A Agent Card): `name`, `description`, `url` (endpoint), `version`, `capabilities` (streaming, pushNotifications), `authentication` (bearer), `skills` array (id, name, description, tags, examples), `defaultInputModes`, `defaultOutputModes`; with CORS headers `Access-Control-Allow-Origin: *` | P1 | Medium | csoai.org, meok.ai | None |
| **T13** | **Implement ProfilePage schema** for all team/author bio pages | P1 | Small | All 6 | T5 |
| **T14** | **Configure HTTP `Last-Modified` headers** on all servers/CDNs (Apache: mod_headers; Nginx: add_header) | P1 | Small | All 6 | None |
| **T15** | **Create `.md` alternate versions** of key pages (append `.md` to URLs) for LLM consumption | P2 | Medium | All 6 | None |
| **T16** | **Set up automated `dateModified` updates** via CMS on actual content changes (quarterly minimum for core pages, monthly for competitive pages) | P1 | Medium | All 6 | CMS access |
| **T17** | **Implement HowTo schema** for tutorial/step-by-step content on proofof.ai guides | P2 | Small | proofof.ai | None |
| **T18** | **Add Service schema** for consulting/advisory offerings on csoai.org | P2 | Small | csoai.org | T4 |
| **T19** | **Create and verify Wikidata entries** for CSOAI organization and key persons | P2 | Large | All 6 | None |
| **T20** | **Add Speakable schema** for voice-optimized content sections | P2 | Small | csoai.org | None |
| **T21** | **Implement `link rel="alternate" type="text/markdown"`** referencing `/llms.txt` in HTML `<head>` | P1 | Small | All 6 | T2 |
| **T22** | **Implement Review schema** with genuine first-party testimonials (only where visible on page): `itemReviewed` (SoftwareApplication ref), `author` (Person with jobTitle/worksFor), `reviewRating`, `reviewBody`, `datePublished` | P2 | Small | proofof.ai | T10 |
| **T23** | **Add Table schema** for comparison content pages (framework crosswalks, competitor comparisons) | P1 | Small | csoai.org | None |
| **T24** | **Create `/about/llm` integrated AI identity pages** (NOT standalone at root): comprehensive factual machine-readable info, Organization + Person schemas, breadcrumb navigation, markdown alternate, unique content (not duplicate of About) | P1 | Medium | All 6 | T4, T5 |
| **T25** | **Implement sitemap.xml** with accurate `lastmod` dates matching content updates | P0 | Small | All 6 | None |
| **T26** | **Add HTML `<link>` tag for llms.txt discovery**: `<link rel="alternate" type="text/markdown" href="/llms.txt" />` | P1 | Small | All 6 | T2 |
| **T27** | **Create Ed25519 key generator tool** (free, ungated): generates identity keys instantly in browser, displays public/private key pair, provides copy-to-clipboard | P1 | Small | proofof.ai | None |
| **T28** | **Implement BFT network status checker**: real-time display of 294 verification servers, health status, geographic distribution | P1 | Medium | councilof.ai | Backend API |
| **T29** | **Build AI Risk Readiness Assessment** (10-question quiz): scored output, recommendation based on score range, email capture for detailed report, results shareable | P1 | Medium | csoai.org | Email service |
| **T30** | **Build EU AI Act Risk Classifier tool**: classify AI systems by risk level (minimal, limited, high, unacceptable), output compliance checklist based on classification | P1 | Medium | csoai.org | None |
| **T31** | **Build HMAC-signed audit trail verification tool**: upload log file, verify signatures, display verification results | P1 | Medium | councilof.ai | Backend crypto |
| **T32** | **Create downloadable compliance checklist** (PDF lead magnet): EU AI Act step-by-step checklist, gated behind email capture | P1 | Medium | csoai.org | PDF generation |
| **T33** | **Create downloadable framework crosswalk matrix** (spreadsheet): 20+ framework comparison, sortable/filterable, gated behind email | P1 | Medium | csoai.org | Spreadsheet gen |
| **T34** | **Implement API reference documentation** (developer portal): REST API docs with curl examples, OAuth authentication, endpoint descriptions, request/response schemas | P1 | Large | proofof.ai | API backend |
| **T35** | **Create MCP protocol integration guide** with code examples: connection setup, tool calling, resource access, security configuration | P1 | Medium | proofof.ai | None |
| **T36** | **Create Ed25519 signing code examples**: Python, TypeScript, JavaScript code snippets for signature generation/verification | P1 | Medium | proofof.ai | None |
| **T37** | **Create BFT council interaction documentation**: how to query the council, interpret voting results, verify attestations | P1 | Medium | councilof.ai | None |
| **T38** | **Build SDK download portal**: Python SDK, TypeScript SDK, quickstart installers (Mac/Windows), Docker/Kubernetes deployment guides | P1 | Large | proofof.ai | SDK dev |
| **T39** | **Create Postman API collection** for CSOAI APIs: organized endpoints, environment variables, example requests | P2 | Small | proofof.ai | T34 |
| **T40** | **Implement cookie consent banner** with granular toggles (Essential, Functional, Marketing) | P1 | Small | All 6 | None |
| **T41** | **Create GitHub presence** with public repositories: open-source methodologies, benchmark code, MCP server examples, contribution guidelines | P1 | Medium | csoai.org | GitHub org |
| **T42** | **Implement Claude Code integration**: skill files for onboarding CSOAI tools | P2 | Medium | proofof.ai | None |
| **T43** | **Implement Codex integration**: skill installation guides for OpenAI Codex | P2 | Medium | proofof.ai | None |
| **T44** | **Build comparison page templates** with feature comparison tables, G2-style rating boxes, "Why teams switch" sections, CTA blocks | P1 | Medium | csoai.org | None |
| **T45** | **Create gated content form system** for guides/reports: name, email, company, role fields, PDF download delivery | P1 | Medium | csoai.org | Email service |
| **T46** | **Implement email capture + CTA in hero section**: inline email input + primary button ("Get started" / "Get a demo"), no credit card required microcopy | P0 | Small | All 6 | Email service |
| **T47** | **Build on-demand webinar system**: video hosting, registration form, playback with email gate for non-registered users | P2 | Large | csoai.org | Video hosting |
| **T48** | **Create newsletter subscription system** with confirmation email, preference center, unsubscribe | P1 | Small | All 6 | Email service |
| **T49** | **Implement dark mode support** (theme toggle or auto via prefers-color-scheme) | P2 | Large | All 6 | Design system |
| **T50** | **Build unified authentication system** (SSO across all 6 domains): shared session, Ed25519 identity option, social login (Google, GitHub), account dashboard | P0 | Large | All 6 | Auth backend |
| **T51** | **Implement unified event pipeline**: cross-domain event tracking, server network status events, certification events, user activity events | P0 | Large | All 6 | Analytics backend |
| **T52** | **Build shared component library**: announcement banner, navigation, footer, CTA buttons, card components, testimonial blocks -- versioned, documented | P0 | Large | All 6 | Design system |
| **T53** | **Implement MCP server catalog** with 294 verified servers: searchable, filterable, HMAC attestation verification badge per server, security ratings | P0 | Large | proofof.ai | Backend DB |
| **T54** | **Create BFT council governance dashboard**: 33-agent voting visualization, consensus status, HMAC-signed decision receipts, audit trail viewer | P0 | Large | councilof.ai | Backend API |
| **T55** | **Implement unified header component** across all 6 sites: CSOAI logo + site name, ecosystem navigation dropdown, announcement banner, auth state, consistent CTAs | P0 | Large | All 6 | T50, T52 |
| **T56** | **Implement unified footer component**: sitemap links, legal links, social links, security page link, Trust Center link, newsletter signup | P0 | Medium | All 6 | T52 |
| **T57** | **Build cross-site navigation dropdown**: hover/click reveals all 6 domains with descriptions, current site highlighted | P0 | Medium | All 6 | T52 |
| **T58** | **Create network status page** (real-time): 294 server health, geographic map, uptime stats, recent attestations | P1 | Large | meok.ai, csoai.org | Backend API |
| **T59** | **Implement proof of agency certification platform**: submission workflow, evaluation dashboard, public registry, appeals process | P0 | Large | proofof.ai | Full stack |
| **T60** | **Build certification registry search**: public database of certified AI systems, filterable by level, date, provider, category | P0 | Medium | proofof.ai | Backend DB |
| **T61** | **Create AI governance sandbox/interactive tool**: prospects input use cases, receive preliminary risk score, see recommended compliance path | P1 | Medium | csoai.org | Risk scoring API |
| **T62** | **Implement SSR/server-side rendering** for all schema markup (schemas must be in server-rendered HTML, not client-side JS) | P0 | Medium | All 6 | Infra |
| **T63** | **Build sitemap generation pipeline**: auto-generated XML sitemaps with accurate `lastmod`, submitted to search console | P1 | Small | All 6 | None |
| **T64** | **Implement redirect handling**: old URLs to new structure, 301 redirects for SEO preservation | P0 | Small | All 6 | None |

**Category 1 Total: 64 requirements**

---

## Category 2: UX/UI Requirements
### Navigation, Conversion Flows, Wireframes

| ID | Requirement | Priority | Effort | Site(s) | Dependencies |
|----|-------------|----------|--------|---------|--------------|
| **U1** | **Announcement banner** at top of every page: colored bar (purple gradient for CSOAI), closable (X button), links to featured content/product launches/events, persists across sessions if dismissed | P0 | Small | All 6 | T52 |
| **U2** | **Hero email capture**: inline email input field + primary CTA button ("Get started" or "Get a demo"), microcopy below ("No credit card required. Ed25519 identity created instantly."), above the fold on all homepages | P0 | Small | All 6 | T46 |
| **U3** | **Two-CTA hero pattern**: primary CTA ("Get Started" / "Explore Platform") + secondary CTA ("Talk to Sales" / "Talk to an AI Advisor" / "Watch Demo") | P0 | Small | All 6 | None |
| **U4** | **Customer logo bar** below hero: "Trusted By X enterprises" text + partner/customer logos in grayscale row, marquee scroll optional | P0 | Small | All 6 | Logos |
| **U5** | **Stats row**: key metrics display -- "294 Verification Servers" | "5 Governance Domains" | "Ed25519 Cryptographic Signing" | "33-Agent BFT Council" | P0 | Small | All 6 | None |
| **U6** | **Unified navigation structure**: 5-7 top-level items with dropdowns, logo left, CTAs right, consistent across all 6 sites | P0 | Medium | All 6 | T55 |
| **U7** | **Navigation items** (standard pattern): Platform/Product (dropdown), Solutions (dropdown), Resources (dropdown), Company/About (dropdown), Pricing (direct link) | P0 | Small | All 6 | U6 |
| **U8** | **Right-side CTAs**: "Log in" (outlined/text button) + "Get a demo/Get Started" (filled primary button) | P0 | Small | All 6 | T50 |
| **U9** | **Trust Center page**: security documentation hub with governance principles, SOC 2 badge, ISO 27001 badge, Trust Center external link, cookie consent management, vulnerability disclosure | P0 | Medium | csoai.org | None |
| **U10** | **Pricing page**: tiered structure (3-4 tiers), feature matrix comparing tiers, "Most popular" badge on recommended tier, add-on modules listed separately, transparent pricing (show prices) | P0 | Medium | proofof.ai, csoai.org | None |
| **U11** | **Hero section standard layout**: announcement bar > navigation > H1 + subhead (centered or left-aligned) > two CTAs > product screenshot/illustration > customer logos > social proof | P0 | Medium | All 6 | None |
| **U12** | **Split hero layout option** (alternate): left side text + CTAs, right side product screenshot/dashboard | P1 | Small | csoai.org, proofof.ai | None |
| **U13** | **G2/review badges integration**: star rating, review count, "Read reviews" link, G2 Leader badge -- once reviews exist | P2 | Small | All 6 | G2 profile |
| **U14** | **Dark mode toggle**: user preference + auto-detect via prefers-color-scheme | P2 | Large | All 6 | T49 |
| **U15** | **Free tool/assessment CTA sections**: prominently link to free tools (Risk Classifier, Key Generator, Network Checker) | P1 | Small | csoai.org, proofof.ai | T29-T31 |
| **U16** | **Comparison page layout**: feature comparison table, G2 rating callouts, pricing context, "Why teams switch" messaging, demo CTA at bottom | P1 | Medium | csoai.org | T44 |
| **U17** | **Conversion-optimized landing pages**: gated content forms with progressive profiling (name > email > company > role > phone), thank-you page with secondary CTA | P1 | Medium | csoai.org | T45 |
| **U18** | **Onboarding flow** for new users: Ed25519 identity creation, welcome sequence, guided tour of platform features, personalized dashboard | P1 | Large | proofof.ai | T50, T59 |
| **U19** | **Progressive disclosure** for certification process: step-by-step wizard, save progress, status indicators, document upload | P1 | Large | proofof.ai | T59 |
| **U20** | **Mobile-responsive navigation**: hamburger menu on mobile, dropdowns work on touch, CTAs visible without scrolling | P0 | Medium | All 6 | None |
| **U21** | **Page loading performance**: <3s LCP, <100ms FID, CLS <0.1 on all pages | P0 | Large | All 6 | Infra |
| **U22** | **Skeleton screens/loading states** for dynamic content (server status, certification registry, MCP catalog) | P1 | Medium | All 6 | None |
| **U23** | **Empty states** for search, filters, no results -- with helpful guidance and alternative actions | P1 | Small | All 6 | None |
| **U24** | **Error pages** (404, 500, maintenance): branded design, helpful navigation links, search option, contact link | P1 | Small | All 6 | None |
| **U25** | **Breadcrumb navigation** on all non-home pages: Home > Section > Page, clickable links | P1 | Small | All 6 | T9 |
| **U26** | **Jump-to-section links** for long-form content (pillar pages): sticky sidebar TOC, anchor links, highlight current section | P1 | Small | csoai.org | None |
| **U27** | **Social sharing buttons** on content pages: Twitter/X, LinkedIn, copy link | P1 | Small | csoai.org | None |
| **U28** | **Print-friendly stylesheets** for guides/checklists | P2 | Small | csoai.org | None |
| **U29** | **Back-to-top button** on long pages | P2 | Small | All 6 | None |
| **U30** | **Search functionality**: site search with autocomplete, results page with filters | P1 | Medium | csoai.org, proofof.ai | Search backend |
| **U31** | **Sticky CTA bar** on scroll: appears after scrolling past hero, compact bar with key action | P1 | Small | All 6 | None |
| **U32** | **Testimonial carousel/card grid**: named testimonials with photos, titles, company logos, quote text | P1 | Medium | All 6 | Testimonials |
| **U33** | **Analyst badges display**: Forrester Wave, Gartner Market Guide, Fast Company -- where applicable | P2 | Small | csoai.org | Awards |
| **U34** | **Feature detail pages**: deep-dive pages for each major feature with screenshots, code examples, use cases | P1 | Medium | proofof.ai, councilof.ai | None |
| **U35** | **Interactive demo/self-guided tour**: interactive product walkthrough without signup | P1 | Large | proofof.ai, councilof.ai | None |
| **U36** | **Live chat/chatbot integration**: AI-powered chat for Q&A, handoff to human | P2 | Large | All 6 | Chat platform |
| **U37** | **Contact Sales form**: multi-field form (name, email, company, role, message), routing to CRM | P1 | Small | csoai.org | CRM |
| **U38** | **Webinar registration flow**: form > confirmation email > calendar invite > reminder emails > replay access | P2 | Medium | csoai.org | T47 |
| **U39** | **Press kit page**: downloadable logos, brand guidelines, founder photos, boilerplate text, press releases | P2 | Small | csoai.org | Assets |
| **U40** | **Careers page**: open positions, application form, company values, benefits | P2 | Medium | csoai.org | ATS integration |

**Category 2 Total: 40 requirements**

---

## Category 3: Content Requirements
### Pages, Copy, Schemas, Blog Posts

| ID | Requirement | Priority | Effort | Site(s) | Dependencies |
|----|-------------|----------|--------|---------|--------------|
| **C1** | **Hub 1 Hub Page**: "The Complete EU AI Act Compliance Guide: 2025-2027 Implementation Roadmap" -- 7,500-10,000 words, 13 H2 sections, updated for Digital Omnibus Dec 2027 deadline, technical implementation detail, downloadable checklist | P0 | Large | csoai.org | T32 |
| **C2** | **Spoke 1.1**: "EU AI Act Article 50 Explained: Complete Transparency Obligations Guide" -- 2,500-3,500 words, 10 H2 sections | P1 | Large | csoai.org | C1 |
| **C3** | **Spoke 1.2**: "EU AI Act High-Risk Systems: Complete Annex III Requirements Guide" -- 4,000-5,000 words, 11 H2 sections with sector breakdown | P0 | Large | csoai.org | C1 |
| **C4** | **Spoke 1.3**: "EU AI Act Penalties and Fines: Complete 2025-2027 Enforcement Guide" -- 2,500-3,500 words, 10 H2 sections | P0 | Medium | csoai.org | C1 |
| **C5** | **Spoke 1.4**: "EU AI Act GPAI Requirements: General Purpose AI Model Compliance Guide" -- 3,000-4,000 words, 12 H2 sections | P1 | Large | csoai.org | C1 |
| **C6** | **Spoke 1.5**: "EU AI Act Conformity Assessment: Step-by-Step Guide" -- 3,500-4,500 words, 12 H2 sections, HowTo schema | P0 | Large | csoai.org | C1 |
| **C7** | **Spoke 1.6**: "EU AI Act CE Marking: Complete Guide for High-Risk AI Systems" -- 2,000-3,000 words, 9 H2 sections | P1 | Medium | csoai.org | C1 |
| **C8** | **Spoke 1.7**: "EU AI Act Post-Market Monitoring: Article 72 Requirements Guide" -- 2,500-3,500 words, 9 H2 sections | P2 | Medium | csoai.org | C1 |
| **C9** | **Spoke 1.8**: "EU AI Act SME Guide: Compliance for Small and Medium Businesses" -- 2,500-3,500 words, 9 H2 sections | P1 | Medium | csoai.org | C1 |
| **C10** | **Spoke 1.9**: "EU AI Act Article 12: Technical Logging Requirements Implementation Guide" -- 3,500-4,500 words, 10 H2 sections with code examples | P0 | Large | csoai.org | C1 |
| **C11** | **Spoke 1.10**: "EU AI Act vs. GDPR: How the Two Regulations Interact" -- 2,000-3,000 words, 8 H2 sections | P1 | Medium | csoai.org | C1 |
| **C12** | **Hub 2 Hub Page**: "AI Governance Frameworks: Complete Comparison of NIST, ISO 42001, EU AI Act & 20+ Others" -- 6,000-8,000 words, 10 H2 sections, interactive comparison table | P0 | Large | csoai.org | None |
| **C13** | **Spoke 2.1**: "NIST AI RMF Guide: Complete Implementation Framework (2025)" -- 3,500-4,500 words, 11 H2 sections | P1 | Large | csoai.org | C12 |
| **C14** | **Spoke 2.2**: "ISO 42001 Certification: Complete AI Management System Guide" -- 4,000-5,000 words, 10 H2 sections | P0 | Large | csoai.org | C12 |
| **C15** | **Spoke 2.3**: "DORA AI Governance: Digital Operational Resilience Act Compliance Guide" -- 2,500-3,500 words, 8 H2 sections | P1 | Medium | csoai.org | C12 |
| **C16** | **Spoke 2.4**: "NIS2 Directive Compliance for AI Systems: Complete Guide" -- 2,500-3,500 words, 8 H2 sections | P1 | Medium | csoai.org | C12 |
| **C17** | **Spoke 2.5**: "AI Governance Framework Crosswalk: Mapping 20+ Standards" -- 4,000-5,500 words, 10 H2 sections, downloadable matrix | P0 | Large | csoai.org | C12, T33 |
| **C18** | **Spoke 2.6**: "AI Risk Management Framework Comparison: NIST vs. ISO 42001 vs. EU AI Act" -- 3,000-4,000 words, 10 H2 sections | P1 | Medium | csoai.org | C12 |
| **C19** | **Hub 3 Hub Page**: "BFT Council Governance: Multi-Agent AI Voting for Trustworthy AI" -- 5,000-7,000 words, 12 H2 sections, unique differentiator | P0 | Large | councilof.ai | None |
| **C20** | **Spoke 3.1**: "Byzantine Fault Tolerance AI Governance: Technical Architecture Deep Dive" -- 3,500-4,500 words, 10 H2 sections | P0 | Large | councilof.ai | C19 |
| **C21** | **Spoke 3.2**: "Multi-LLM Voting for AI Safety: How Model Diversity Improves Decisions" -- 3,000-4,000 words, 10 H2 sections | P1 | Large | councilof.ai | C19 |
| **C22** | **Spoke 3.3**: "HMAC-Signed AI Audit Trails: Cryptographic Compliance for EU AI Act" -- 3,500-4,500 words, 12 H2 sections with code | P0 | Large | councilof.ai | C19 |
| **C23** | **Spoke 3.4**: "AI Council Governance Model: Building Democratic Multi-Agent Systems" -- 2,500-3,500 words, 10 H2 sections | P2 | Medium | councilof.ai | C19 |
| **C24** | **Hub 4 Hub Page**: "The Complete MCP Protocol Guide: Model Context Protocol for Enterprise AI (2025)" -- 5,000-7,000 words, 14 H2 sections, SoftwareApplication schema | P0 | Large | proofof.ai | None |
| **C25** | **Spoke 4.1**: "Model Context Protocol Explained: A Beginner's Guide to MCP" -- 2,500-3,500 words, 10 H2 sections | P0 | Large | proofof.ai | C24 |
| **C26** | **Spoke 4.2**: "MCP Server Guide: Building Production-Ready MCP Servers" -- 3,500-4,500 words, 10 H2 sections with code | P1 | Large | proofof.ai | C24 |
| **C27** | **Spoke 4.3**: "MCP Security Best Practices: Enterprise Deployment and Governance Guide" -- 3,000-4,000 words, 10 H2 sections | P1 | Large | proofof.ai | C24 |
| **C28** | **Spoke 4.4**: "MCP Registry: Finding, Evaluating, and Managing MCP Servers" -- 2,500-3,500 words, 10 H2 sections | P1 | Medium | proofof.ai | C24 |
| **C29** | **Spoke 4.5**: "Building MCP Servers: Advanced Patterns, Integration, and Compliance" -- 3,000-4,000 words, 10 H2 sections | P1 | Large | proofof.ai | C24 |
| **C30** | **Comparison page: CSOAI vs Vanta**: "CSOAI vs Vanta: AI-Native Governance" -- feature table, rating boxes, "Why teams switch", CTA | P1 | Medium | csoai.org | T44 |
| **C31** | **Comparison page: CSOAI vs Drata**: "CSOAI vs Drata: Decentralized Trust" | P1 | Medium | csoai.org | T44 |
| **C32** | **Comparison page: CSOAI vs Credo AI**: "CSOAI vs Credo AI: Verifiable Governance" | P1 | Medium | csoai.org | T44 |
| **C33** | **Comparison page: CSOAI vs Arthur.ai**: "CSOAI vs Arthur.ai: Council-Based Monitoring" | P1 | Medium | csoai.org | T44 |
| **C34** | **Trust Center page**: security documentation, governance principles, compliance certifications, subprocessor list, security policies, vulnerability disclosure | P0 | Medium | csoai.org | U9 |
| **C35** | **About page** (comprehensive): mission, vision, founding story, team, research methodology, organizational structure | P0 | Medium | csoai.org | None |
| **C36** | **Team page**: all team members with photos, bios, roles, social links, Person schema | P0 | Medium | csoai.org | T5 |
| **C37** | **Contact page**: contact form, email addresses (general, press, partnerships), phone, office address, map | P0 | Small | All 6 | None |
| **C38** | **Pricing page**: 3-4 tiers (Free/Open Source, Premium, Enterprise), feature matrix, transparent prices, FAQ | P0 | Medium | proofof.ai | U10 |
| **C39** | **Security page**: "Security and privacy at CSOAI" -- governance principles, SOC 2 Type II badge, ISO 27001 badge, Trust Center link | P0 | Medium | csoai.org | U9 |
| **C40** | **Case studies page**: 3-5 detailed case studies with metrics, customer quotes, before/after | P1 | Large | csoai.org | Customer data |
| **C41** | **Blog section**: regular publishing cadence (weekly minimum), category filters, author bylines, social sharing | P1 | Large | csoai.org | Writers |
| **C42** | **Blog post: "AI Governance Platform Comparison 2026"**: independent comparison positioning CSOAI as evaluation authority | P1 | Medium | csoai.org | C12 |
| **C43** | **EU AI Act glossary pages**: definitions of key terms (Conformity Assessment, CE Marking, Notified Body, GPAI, etc.) | P1 | Medium | csoai.org | C1 |
| **C44** | **Resources page**: organized library of guides, reports, templates, checklists, webinars | P1 | Medium | csoai.org | Content assets |
| **C45** | **Press page**: press releases, media mentions, press kit download, contact | P2 | Small | csoai.org | U39 |
| **C46** | **Partners page**: partner program details, application form, partner logos, tiers | P1 | Medium | csoai.org | Partner data |
| **C47** | **Events page**: upcoming and past events, registration, recordings archive | P2 | Medium | csoai.org | Event data |
| **C48** | **FAQ page**: comprehensive FAQ organized by topic, FAQPage schema, 20+ questions | P1 | Medium | All 6 | None |
| **C49** | **Terms of Service page**: legal terms, last updated date | P0 | Small | All 6 | Legal review |
| **C50** | **Privacy Policy page**: GDPR-compliant privacy policy, cookie details, data handling | P0 | Small | All 6 | Legal review |
| **C51** | **Cookie Policy page**: detailed cookie explanations, granular consent options | P0 | Small | All 6 | T40 |
| **C52** | **Accessibility statement**: WCAG compliance level, known issues, contact for accessibility feedback | P1 | Small | All 6 | None |
| **C53** | **On-demand webinar: "How to Prepare for EU AI Act with BFT Governance"**: 30-45 min, gated, evergreen | P2 | Large | csoai.org | T47 |
| **C54** | **On-demand webinar: "Ed25519 Signing for AI Compliance: Technical Demo"**: 30-45 min, gated | P2 | Large | csoai.org | T47 |
| **C55** | **On-demand webinar: "Council of AI: Decentralized Governance Explained"**: 30-45 min, gated | P2 | Large | councilof.ai | T47 |
| **C56** | **Free templates**: ISO 42001 checklist, Disaster Recovery Plan for AI, AI Risk Assessment template | P1 | Medium | csoai.org | Template design |
| **C57** | **Research papers section**: peer-reviewed publications, preprints, research briefs, downloadable PDFs | P0 | Medium | csoai.org | Papers |
| **C58** | **Annual report page**: comprehensive year-in-review with metrics, financials, achievements | P1 | Medium | csoai.org | Annual data |
| **C59** | **Certification process documentation**: step-by-step guide, requirements, timeline, pricing, FAQ | P0 | Medium | proofof.ai | T59 |
| **C60** | **Council of AI governance page**: bylaws, ethics policy, transparency reports, quarterly accountability | P0 | Medium | councilof.ai | None |
| **C61** | **Relevance.ai content hub**: applied relevance optimization content, case studies, methodology | P1 | Large | relevance.ai | Content strategy |
| **C62** | **Safety of AI research hub**: safety benchmarks, best practices, safety evaluation standards | P0 | Large | safetyof.ai | Research |
| **C63** | **Meok coordination page**: ecosystem map, governance model, shared services, annual strategy | P0 | Medium | meok.ai | None |
| **C64** | **Developer documentation portal**: API reference, SDK docs, code examples, quickstart guides, Postman collection | P1 | Large | proofof.ai | T34-T39 |
| **C65** | **Newsletter archive**: past newsletter editions, subscribe option | P2 | Small | csoai.org | T48 |
| **C66** | **Webinar archive**: past recordings, registration for upcoming | P2 | Medium | csoai.org | T47 |

**Category 3 Total: 66 requirements**

---

## Category 4: Cross-Sell Requirements
### Triggers, Bundles, CTAs, Email Flows

| ID | Requirement | Priority | Effort | Site(s) | Dependencies |
|----|-------------|----------|--------|---------|--------------|
| **X1** | **Cross-site navigation as cross-sell trigger**: ecosystem dropdown on every page exposes all 6 sites with value propositions | P0 | Small | All 6 | T57 |
| **X2** | **Product hive pattern**: on each site, dedicated "CSOAI Ecosystem" section showcasing all 6 products with descriptions and links | P0 | Medium | All 6 | T52 |
| **X3** | **Contextual cross-sell CTAs**: relevant product recommendations based on current page content (e.g., EU AI Act guide links to certification, MCP guide links to server catalog) | P1 | Medium | All 6 | Content mapping |
| **X4** | **Bundle pricing**: "Ecosystem Bundle" combining certification + council membership + safety audit at discounted rate | P1 | Medium | proofof.ai | Pricing model |
| **X5** | **Site-level cross-sell triggers**: csoai.org readers see "Get Certified" CTA; proofof.ai users see "Join the Council" CTA; councilof.ai visitors see "Verify with Proof of Agency" CTA | P0 | Small | All 6 | None |
| **X6** | **Welcome email sequence** (7-email): Day 0 (welcome + Ed25519 setup), Day 1 (ecosystem overview), Day 3 (relevant content), Day 7 (tool invitation), Day 14 (case study), Day 21 (offer), Day 30 (feedback) | P1 | Large | All 6 | Email platform |
| **X7** | **Certification abandonment email flow**: triggered if user starts but doesn't complete certification submission -- 3 emails (24h, 72h, 7d) | P1 | Medium | proofof.ai | T59 |
| **X8** | **Content nurture sequences**: topic-based drip campaigns (EU AI Act, BFT Governance, MCP) triggered by content consumption | P1 | Large | csoai.org | Email platform |
| **X9** | **Cross-site retargeting**: pixel-based retargeting showing relevant CSOAI site content based on visits to other ecosystem sites | P1 | Medium | All 6 | Ad platform |
| **X10** | **Newsletter cross-promotion**: each site's newsletter promotes content and offerings from sister sites | P1 | Small | All 6 | T48 |
| **X11** | **Exit-intent popups**: offer free assessment/tool before user leaves key pages | P2 | Small | All 6 | Popup library |
| **X12** | **Referral program**: "Refer a colleague" with incentive (discount, extended access) | P2 | Medium | proofof.ai | Referral system |
| **X13** | **Upsell triggers in product**: at certification completion, offer next-tier certification; at basic evaluation, offer professional certification | P1 | Small | proofof.ai | T59 |
| **X14** | **Event pipeline cross-sell**: event attendees on one site receive tailored offers for other ecosystem sites | P1 | Medium | All 6 | T51 |
| **X15** | **Free-to-paid conversion flow**: free tool user > detailed report email > certification consultation offer > paid certification | P0 | Large | csoai.org | T29-T31 |
| **X16** | **Loyalty/re-engagement campaign**: 6-month check-in for inactive users with new features/content | P2 | Medium | All 6 | Email platform |
| **X17** | **Partnership cross-promotion**: partner content and co-branded materials promote full ecosystem | P2 | Medium | All 6 | Partners |

**Category 4 Total: 17 requirements**

---

## Category 5: AEO/SEO Requirements
### Structured Data, llms.txt, Crawler Access, Content Freshness

| ID | Requirement | Priority | Effort | Site(s) | Dependencies |
|----|-------------|----------|--------|---------|--------------|
| **A1** | **robots.txt with explicit AI crawler policy**: 24+ user-agent blocks, allow search/user agents, disallow training agents selectively, sitemap references for all 6 domains | P0 | Small | All 6 | T1 |
| **A2** | **llms.txt at root**: H1 project name, blockquote summary, H2 sections with curated links, Optional section for low-priority content, validated and accessible | P0 | Small | csoai.org, proofof.ai, meok.ai | T2 |
| **A3** | **llms-full.txt**: complete site content in markdown for documentation-heavy sites | P1 | Small | 3 sites | T3 |
| **A4** | **FAQPage schema** (highest-impact for AI citations): 5-10 QAs per page, answers 40-110 words, self-contained, visible on page (not hidden), matched to real query patterns | P0 | Medium | All 6 | T6 |
| **A5** | **Organization schema** on all homepages with complete `sameAs` links to social profiles, `@id` for entity consolidation | P0 | Small | All 6 | T4 |
| **A6** | **Person schema** for all authors/founders with verified `sameAs` profiles (LinkedIn, Google Scholar, ORCID) for E-E-A-T signals | P0 | Medium | All 6 | T5 |
| **A7** | **Article schema with `dateModified`**: ISO 8601 format, reflect actual content changes, update quarterly minimum (core) / monthly (competitive), match visible on-page dates | P0 | Small | All 6 | T8 |
| **A8** | **`@graph` stacking**: combine Organization + WebSite + BreadcrumbList + Article + FAQPage in single script, linked via `@id` references | P1 | Medium | All 6 | T7 |
| **A9** | **BreadcrumbList schema** on all non-home pages for navigational context | P1 | Small | All 6 | T9 |
| **A10** | **SoftwareApplication + Offer schema** on proofof.ai pricing page | P1 | Small | proofof.ai | T10 |
| **A11** | **Triple-schema stacking** (FAQPage + Article + HowTo) on pillar pages for 1.8x AI citation lift | P1 | Medium | csoai.org | T7 |
| **A12** | **A2A Agent Card** at `/.well-known/agent.json` with CORS headers, JSON-RPC 2.0 endpoint, documented skills | P1 | Medium | csoai.org, meok.ai | T12 |
| **A13** | **Content freshness signals**: `dateModified` in schema, HTTP `Last-Modified` header, visible date stamps, sitemap `lastmod`, year references in content ("2025", "2026") | P0 | Small | All 6 | T8, T14 |
| **A14** | **Answer-first paragraph structure**: direct answer in first 1-2 sentences of each section | P1 | Medium | csoai.org | Content writing |
| **A15** | **Question-based H2/H3 headings**: match natural language query patterns ("What is...", "How does...", "Why...") | P1 | Medium | csoai.org | Content writing |
| **A16** | **Minimum 15 headers per article**: long-form content gets cited more by AI engines | P1 | Medium | csoai.org | Content writing |
| **A17** | **Data in tables**: AI engines extract tabular data efficiently -- use tables for comparisons, timelines, penalty structures | P1 | Small | csoai.org | Content writing |
| **A18** | **Lists and numbered steps**: easy for AI to synthesize into answers | P1 | Small | csoai.org | Content writing |
| **A19** | **Perplexity optimization**: statistics and data points, academic-style citations [^number^] format, comparison tables, primary source references | P1 | Medium | csoai.org | Content writing |
| **A20** | **ChatGPT optimization**: comprehensive "ultimate guides", brand mentions, E-E-A-T signals, Wikipedia/authoritative mentions | P1 | Medium | csoai.org | Content writing |
| **A21** | **Google AI Overviews optimization**: traditional SEO + FAQ schema, question-based queries, strong backlink profile | P1 | Medium | All 6 | SEO |
| **A22** | **Freshness update protocol**: update hub pages quarterly with new regulatory developments, publish new content weekly minimum, cover breaking news within 48 hours, reference current year | P1 | Large | csoai.org | Content team |
| **A23** | **Academic-style citations**: use [^number^] format referencing authoritative sources (EU AI Act Service Desk, NIST, etc.) | P1 | Medium | csoai.org | Content writing |
| **A24** | **Internal linking strategy**: hub-to-hub links, spoke-to-spoke links, product page links, 5-8 internal links per content page | P1 | Medium | All 6 | Content writing |
| **A25** | **Meta descriptions**: unique, keyword-rich, under 160 characters for all pages | P0 | Small | All 6 | None |
| **A26** | **Open Graph tags**: og:title, og:description, og:image, og:url for all pages | P0 | Small | All 6 | None |
| **A27** | **Twitter Card tags**: twitter:card, twitter:title, twitter:description, twitter:image | P0 | Small | All 6 | None |
| **A28** | **Canonical URLs**: self-referencing canonical on all pages | P0 | Small | All 6 | None |
| **A29** | **Schema validation pipeline**: Google Rich Results Test, Schema.org Validator -- all pages pass before publish | P0 | Medium | All 6 | CI/CD |
| **A30** | **AI crawler log monitoring**: monitor server logs for GPTBot, ClaudeBot, PerplexityBot visits; track crawl frequency | P1 | Small | All 6 | Log access |
| **A31** | **Hreflang tags**: if multi-language content is added | P2 | Small | All 6 | Translation |
| **A32** | **Structured data for video content**: VideoObject schema for webinars | P2 | Small | csoai.org | T47 |

**Category 5 Total: 32 requirements**

---

## Category 6: Integration Requirements
### Unified Auth, Event Pipeline, Shared Components

| ID | Requirement | Priority | Effort | Site(s) | Dependencies |
|----|-------------|----------|--------|---------|--------------|
| **I1** | **Unified authentication system (SSO)**: single sign-on across all 6 domains using shared identity provider, Ed25519 identity option, social login (Google, GitHub), account dashboard at meok.ai | P0 | Large | All 6 | T50 |
| **I2** | **Shared session management**: cross-domain session cookie, seamless login state transfer between sites | P0 | Large | All 6 | I1 |
| **I3** | **Unified user profile**: name, email, Ed25519 public key, certification status, activity history, preferences -- accessible across all sites | P0 | Large | All 6 | I1 |
| **I4** | **Cross-domain event pipeline**: unified analytics/tracking across all 6 sites, user journey tracking, attribution modeling | P0 | Large | All 6 | T51 |
| **I5** | **Event types to track**: page views, CTA clicks, form submissions, certification starts/completions, tool usage, content downloads, cross-site navigation | P0 | Medium | All 6 | I4 |
| **I6** | **Server network status events**: real-time updates on 294 verification servers, health changes, attestation events | P0 | Large | meok.ai, csoai.org | Backend API |
| **I7** | **Shared component library (design system)**: React/Vue components for announcement banner, navigation, footer, CTAs, cards, testimonials, forms -- versioned npm package or CDN | P0 | Large | All 6 | T52 |
| **I8** | **Unified header component**: CSOAI master logo + site identifier, ecosystem dropdown, announcement banner slot, auth state display, consistent primary/secondary CTAs | P0 | Large | All 6 | T55, I1 |
| **I9** | **Unified footer component**: 6-column sitemap (one per site), legal links, social links, security/Trust Center, newsletter signup, copyright | P0 | Medium | All 6 | T56 |
| **I10** | **Consistent design tokens**: colors, typography, spacing, border-radius, shadows -- shared CSS variables/tokens across all sites | P0 | Medium | All 6 | T52 |
| **I11** | **Cross-site analytics dashboard**: unified view of traffic, conversions, and user journeys across all 6 domains | P1 | Large | meok.ai | I4 |
| **I12** | **CRM integration**: HubSpot/Salesforce sync for leads, contacts, deals from all sites | P1 | Large | csoai.org | CRM |
| **I13** | **Email platform integration**: Mailchimp/ConvertKit/SendGrid for unified email lists, segmentation, automation | P1 | Large | All 6 | Email service |
| **I14** | **Shared CDN for assets**: logo, fonts, icons, common JS/CSS served from shared origin for cache efficiency | P1 | Medium | All 6 | Infra |
| **I15** | **API gateway**: unified API entry point for all backend services with rate limiting, authentication, logging | P0 | Large | meok.ai | Backend |
| **I16** | **Webhook system**: outgoing webhooks for certification events, council votes, network status changes | P1 | Medium | All 6 | Backend |
| **I17** | **Slack/Discord notifications**: real-time alerts for certification submissions, council votes, security events | P2 | Small | csoai.org | I16 |
| **I18** | **Shared search index**: unified search across all 6 sites' content | P2 | Large | All 6 | Search backend |
| **I19** | **Backup and disaster recovery**: shared backup strategy across all sites and databases | P0 | Large | All 6 | Infra |
| **I20** | **CI/CD pipeline**: automated testing, schema validation, deployment across all 6 sites | P0 | Large | All 6 | DevOps |

**Category 6 Total: 20 requirements**

---

## Category 7: Competitive Parity Requirements
### Table Stakes from Competitor Analysis

| ID | Requirement | Priority | Effort | Site(s) | Dependencies |
|----|-------------|----------|--------|---------|--------------|
| **CP1** | **Announcement banner**: colored bar at top of every page for product launches, deadline reminders, events (Vanta: purple, Drata: blue, Arthur: green, Credo: pink; CSOAI: purple gradient) | P0 | Small | All 6 | U1 |
| **CP2** | **Hero email capture**: inline email + CTA (all 4 competitors use this pattern) | P0 | Small | All 6 | U2 |
| **CP3** | **Customer logo bar**: social proof below hero (all competitors display customer/partner logos) | P0 | Small | All 6 | U4 |
| **CP4** | **G2/review badges**: third-party validation via review platforms (Vanta: 4.6/5, Drata: 4.8/5) | P2 | Small | All 6 | G2 profile |
| **CP5** | **Comparison pages**: "vs Competitor" SEO pages (Drata has 10+ dedicated vs-pages targeting Vanta keywords) | P1 | Medium | csoai.org | C30-C33 |
| **CP6** | **Free tools/templates**: ungated lead magnets (Vanta: ISO 27001 checklist, Credo: Governance Sandbox) | P1 | Medium | csoai.org | T29-T32 |
| **CP7** | **Trust Center page**: security documentation hub (Vanta and Drata both have dedicated Trust Centers with real-time compliance status) | P0 | Medium | csoai.org | U9, C34 |
| **CP8** | **Developer portal**: API docs, SDKs, code examples (Arthur.ai: strongest dev experience, Drata: MCP integration) | P1 | Large | proofof.ai | C64 |
| **CP9** | **Transparent pricing**: even Arthur.ai shows pricing ($60/mo Premium); CSOAI should display pricing tiers | P0 | Medium | proofof.ai | C38 |
| **CP10** | **Analyst badges**: Forrester Wave, Gartner Market Guide (Credo has 12 Forrester Perfect Scores, Fast Company #6) | P2 | Small | csoai.org | Awards/recognition |
| **CP11** | **JSON-LD schema markup**: Organization, SoftwareApplication, FAQPage, HowTo, BreadcrumbList, Article (all 4 competitors use standard JSON-LD) | P0 | Medium | All 6 | T4-T11 |
| **CP12** | **Two-CTA hero**: primary + secondary CTA (all competitors use "Get Started" + "Talk to Sales/Expert") | P0 | Small | All 6 | U3 |
| **CP13** | **On-demand webinars**: evergreen lead capture (Vanta and Credo use webinars as primary lead magnets) | P2 | Large | csoai.org | C53-C55 |
| **CP14** | **Free templates/checklists**: high-volume SEO content (Vanta offers ISO 27001 checklist, DR plan template) | P1 | Medium | csoai.org | C56 |
| **CP15** | **Dropdown navigation**: 5-7 top-level items with dropdowns (Vanta: 5, Drata: 7, Arthur: 4, Credo: 7) | P0 | Medium | All 6 | U6, U7 |
| **CP16** | **Named testimonials**: C-level named executives with photos (Arthur: Heather Carroll Cox, Credo: Fortune 500) | P1 | Medium | All 6 | Testimonials |
| **CP17** | **Security page**: dedicated page with governance principles, compliance certifications, Trust Center link | P0 | Medium | csoai.org | C39 |
| **CP18** | **Gated content**: guides/reports with form submission (Vanta, Drata, Credo all use gated downloads) | P1 | Medium | csoai.org | T45 |
| **CP19** | **ROI calculator/metrics**: "Reduce audit completion times by 50%" style claims with supporting metrics | P1 | Small | csoai.org | Metrics data |
| **CP20** | **Contact Sales form**: dedicated page with multi-field form | P1 | Small | csoai.org | U37 |
| **CP21** | **Blog with regular cadence**: ongoing content (Vanta/Drata: high frequency, Arthur/Credo: medium) | P1 | Large | csoai.org | C41 |
| **CP22** | **Cookie consent with granular toggles**: Essential, Functional, Marketing categories (Vanta has this) | P0 | Small | All 6 | T40 |
| **CP23** | **Partner program page**: auditor network, advisory partners, technology partners (Vanta, Drata, Credo all have this) | P1 | Medium | csoai.org | C46 |
| **CP24** | **Resources dropdown**: Blog, Guides, Reports, Webinars, Templates, Checklists | P0 | Small | All 6 | None |
| **CP25** | **Solutions dropdown**: by industry, by framework, by use case | P1 | Small | csoai.org | None |

**Category 7 Total: 25 requirements**

---

## Category 8: Strategic Differentiators
### Unique Capabilities to Highlight

| ID | Requirement | Priority | Effort | Site(s) | Dependencies |
|----|-------------|----------|--------|---------|--------------|
| **S1** | **BFT Council Governance visualization**: interactive display of 33-agent voting, real-time consensus, HMAC-signed receipts -- NO COMPETITOR has this | P0 | Large | councilof.ai | T54 |
| **S2** | **MCP Protocol + Compliance angle**: 294 verified servers with HMAC-signed attestations -- only compliance-focused MCP content in market | P0 | Large | proofof.ai | T53 |
| **S3** | **20+ Framework Crosswalk Engine**: interactive comparison of 20+ governance frameworks -- no competitor offers more than 3 | P0 | Large | csoai.org | C17, T33 |
| **S4** | **Ed25519 Cryptographic Identity**: instant identity creation with cryptographic signing -- unique to CSOAI | P0 | Medium | All 6 | T27 |
| **S5** | **294-Server Verification Network**: real-time display of distributed verification infrastructure | P0 | Large | meok.ai, csoai.org | T58 |
| **S6** | **Multi-site ecosystem positioning**: 6 specialized domains forming integrated governance network -- no competitor has this architecture | P0 | Medium | All 6 | T57, X2 |
| **S7** | **Proof of Agency certification**: rigorous 5-tier agency certification with public registry -- unique open methodology | P0 | Large | proofof.ai | T59 |
| **S8** | **HMAC-Signed Audit Trails**: cryptographic compliance logging for EU AI Act Article 12 -- technical implementation content no competitor has | P0 | Large | councilof.ai | C22 |
| **S9** | **AI Risk Readiness Assessment**: free 10-question quiz with scored output -- lead gen differentiator | P1 | Medium | csoai.org | T29 |
| **S10** | **EU AI Act Digital Omnibus freshness**: be FIRST major guide updated for Dec 2027 deadline extension (most competitors still show Aug 2026) | P0 | Medium | csoai.org | C1 |
| **S11** | **Open-source methodology commitment**: all research, benchmarks, evaluation tools published under permissive licenses | P0 | Medium | csoai.org | T41 |
| **S12** | **Independent governance**: multi-layered Oversight Board, transparent appeals process, no funding from certified organizations | P0 | Small | csoai.org | None |
| **S13** | **Technical implementation depth**: code examples, SDKs, API documentation where competitors only offer legal summaries | P0 | Large | csoai.org, proofof.ai | C64 |
| **S14** | **Multi-LLM consensus**: voting-based governance using diverse models (not single-model like all competitors) | P0 | Large | councilof.ai | T54 |
| **S15** | **Agent-to-Agent (A2A) protocol support**: `/.well-known/agent.json` for agent discovery -- future-proofing | P1 | Medium | csoai.org, meok.ai | T12 |
| **S16** | **Academic credibility**: peer-reviewed publications, open research, interdisciplinary approach (cognitive science + AI + governance) | P0 | Medium | csoai.org | C57 |
| **S17** | **First-mover in BFT AI governance**: completely uncontested niche -- academic papers only, no practitioner guides | P0 | Large | councilof.ai | C19-C23 |
| **S18** | **AI Citation Optimization (GEO)**: structured content specifically optimized for Perplexity, ChatGPT, Claude, Gemini citations | P1 | Large | csoai.org | A19-A21 |
| **S19** | **Cryptographic evidence for compliance defense**: HMAC-signed logs as legal evidence in regulatory proceedings | P1 | Medium | councilof.ai | C22 |
| **S20** | **Council of AI democratic governance**: transparent, participatory governance model vs. black-box competitor approaches | P0 | Medium | councilof.ai | C60 |

**Category 8 Total: 20 requirements**

---

## Summary Statistics

| Category | Total Requirements | P0 Count | P1 Count | P2 Count | Est. Small Effort | Est. Medium Effort | Est. Large Effort |
|----------|-------------------|----------|----------|----------|-------------------|-------------------|-------------------|
| **1. Technical** | 64 | 18 | 30 | 16 | 26 | 23 | 15 |
| **2. UX/UI** | 40 | 12 | 18 | 10 | 15 | 17 | 8 |
| **3. Content** | 66 | 17 | 33 | 16 | 6 | 19 | 41 |
| **4. Cross-Sell** | 17 | 3 | 11 | 3 | 3 | 10 | 4 |
| **5. AEO/SEO** | 32 | 10 | 17 | 5 | 17 | 12 | 3 |
| **6. Integration** | 20 | 8 | 8 | 4 | 0 | 4 | 16 |
| **7. Competitive Parity** | 25 | 9 | 12 | 4 | 5 | 13 | 7 |
| **8. Strategic Differentiators** | 20 | 13 | 6 | 1 | 1 | 6 | 13 |
| **TOTAL** | **284** | **90** | **135** | **59** | **73** | **104** | **107** |

---

## Priority Breakdown

| Priority | Count | Description |
|----------|-------|-------------|
| **P0 (Critical)** | 90 | Must-have for launch; table stakes; blocking other work |
| **P1 (High)** | 135 | Important for competitive parity; implement within 90 days |
| **P2 (Medium)** | 59 | Nice-to-have; post-launch enhancements |
| **TOTAL** | **284** | |

---

## Site Distribution

| Site | Requirements Affected |
|------|----------------------|
| csoai.org | 200+ |
| proofof.ai | 120+ |
| councilof.ai | 100+ |
| meok.ai | 80+ |
| safetyof.ai | 40+ |
| relevance.ai | 30+ |
| **All 6 sites** | 150+ |

---

## Effort Distribution

| Effort Level | Count | Description |
|--------------|-------|-------------|
| Small (< 1 day) | 73 | Quick wins; can be batched |
| Medium (1-3 days) | 104 | Standard implementation work |
| Large (3+ days) | 107 | Major features; dedicated sprints |
| **TOTAL** | **284** | |

---

## Key Dependencies Map

```
Authentication (T50)
  -> Unified Header (T55)
  -> Cross-site Navigation (T57)
  -> User Profile (I3)
  -> Welcome Email (X6)

Design System (T52)
  -> Announcement Banner (U1)
  -> Unified Header (T55)
  -> Unified Footer (T56)
  -> Cross-site Nav (T57)

Schema Foundation (T4-T6)
  -> @graph Stacking (T7)
  -> Article Schema (T8)
  -> AI Citation Optimization (A11)

llms.txt (T2)
  -> llms-full.txt (T3)
  -> HTML Link Tag (T21)

Content Hub Pages (C1, C12, C19, C24)
  -> Spoke Pages (C2-C11, C13-C18, C20-C23, C25-C29)
  -> Internal Linking (A24)

Certification Platform (T59)
  -> Certification Registry (T60)
  -> Onboarding Flow (U18)
  -> Abandonment Emails (X7)

Free Tools (T29-T31)
  -> Cross-sell CTAs (X3, X15)
  -> Free-to-Paid Flow (X15)

Event Pipeline (T51)
  -> Cross-site Analytics (I11)
  -> Cross-sell Events (X14)
```

---

## Sprint Recommendations (90-Day Roadmap)

### Sprint 1 (Days 1-14): Foundation
- T1: robots.txt (all sites)
- T2: llms.txt (3 primary sites)
- T4-T6: Core schema (Organization, Person, FAQPage)
- T8: Article schema with dateModified
- T25: Sitemap.xml
- T40: Cookie consent
- U1: Announcement banner
- U2: Hero email capture
- U3: Two-CTA hero
- U4-U5: Logo bar + stats row
- C1: Hub 1 EU AI Act guide
- C4: Spoke 1.3 Penalties
- C6: Spoke 1.5 Conformity Assessment
- C3: Spoke 1.2 High-Risk Systems
- A1-A7: Core AEO infrastructure

### Sprint 2 (Days 15-30): Differentiation Content
- T7: @graph stacking
- T9: BreadcrumbList
- T10: SoftwareApplication schema
- T12: A2A Agent Card
- C12: Hub 2 Frameworks Comparison
- C17: Spoke 2.5 Crosswalk
- C14: Spoke 2.2 ISO 42001
- C2, C5, C7: Remaining Hub 1 spokes
- C13, C15-C16: Hub 2 spokes
- X1-X3: Cross-sell triggers
- I1-I3: Unified auth foundation

### Sprint 3 (Days 31-45): Platform & Tools
- T27-T31: Free tools (key generator, risk classifier, network checker, audit verifier)
- T29: AI Risk Readiness Assessment
- T53: MCP server catalog
- T54: BFT council dashboard
- C19: Hub 3 BFT Council
- C20-C22: Hub 3 spokes
- T34-T39: Developer portal
- I4-I6: Event pipeline
- U10, C38: Pricing pages

### Sprint 4 (Days 46-60): Integration & Scale
- T55-T58: Unified header/footer/navigation/network status
- T59: Certification platform
- T60: Certification registry
- C24: Hub 4 MCP Guide
- C25-C29: Hub 4 spokes
- I7-I10: Shared component library
- X4-X7: Cross-sell bundles and email flows
- C30-C33: Comparison pages

### Sprint 5 (Days 61-75): Polish & Conversion
- C40: Case studies
- C41: Blog system
- U18-U19: Onboarding flows
- U30: Search functionality
- U32: Testimonials
- U35: Interactive demo
- X8-X10: Nurture campaigns
- I11-I14: Analytics and CRM

### Sprint 6 (Days 76-90): Optimization
- A13-A32: Advanced AEO/SEO
- C53-C55: On-demand webinars
- C56: Free templates
- T47: Webinar system
- U36: Live chat
- X11-X17: Advanced cross-sell
- I15-I20: Infrastructure hardening

---

*Document generated from comprehensive analysis of competitive audit (Vanta, Drata, Arthur.ai, Credo AI), AEO infrastructure research (llms.txt, schema markup, agent.json, crawler access), EU AI Act content strategy (4 hubs, 25 spokes, 90-day calendar), and site-by-site UX audit across 6 domains.*
