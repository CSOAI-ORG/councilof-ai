# CSOAI Ecosystem Implementation Playbook — Detailed Content Plan

> **Document Purpose**: This content plan specifies every deliverable required for each playbook chapter — code snippets, copy templates, table structures, wireframe descriptions, file structures, word counts, and required elements. Writers use this as the production brief.
> 
> **Version**: 1.0 | **Date**: June 2025 | **Scope**: 5 sites (csoai.org, proofof.ai, councilof.ai, safetyof.ai, meok.ai)

---

## Table of Contents

1. [Chapter 1: AEO Infrastructure](#chapter-1-aeo-infrastructure)
2. [Chapter 2: Cross-Sell Engine](#chapter-2-cross-sell-engine)
3. [Chapter 3: Site-by-Site Implementation](#chapter-3-site-by-site-implementation)
4. [Chapter 4: Missing Pages](#chapter-4-missing-pages)
5. [Chapter 5: Master Site Synergy](#chapter-5-master-site-synergy)
6. [Chapter 6: Content Strategy](#chapter-6-content-strategy)
7. [Chapter 7: 90-Day Roadmap](#chapter-7-90-day-roadmap)
8. [Chapter 8: Competitive Positioning](#chapter-8-competitive-positioning)

---

## Chapter 1: AEO Infrastructure

**Chapter Word Count Target**: 8,000-10,000 words  
**Required Code Snippets**: 10 templates with 5 site variants each  
**Required Tables**: 2 (crawler reference, implementation priority)

---

### H4: llms.txt — 3 Variant Templates (csoai.org, proofof.ai, meok.ai)

**Deliverable**: 3 production-ready markdown files with exact structure

**Code Snippet 1a — llms.txt for csoai.org (Research Org)**
```markdown
# {{SITE_NAME}} — {{TAGLINE}}

> {{ONE_SENTENCE_DESCRIPTION}}

{{EXPANDED_DESCRIPTION_2_3_SENTENCES}}

## About

- [About {{SITE_NAME}}](https://{{DOMAIN}}/about): {{DESCRIPTION}}
- [Team & Leadership](https://{{DOMAIN}}/team): {{DESCRIPTION}}
- [Research Methodology](https://{{DOMAIN}}/methodology): {{DESCRIPTION}}

## Research

- [Research Papers](https://{{DOMAIN}}/research): {{DESCRIPTION}}
- [Annual Report {{YEAR}}](https://{{DOMAIN}}/annual-report-{{YEAR}}): {{DESCRIPTION}}
- [Intelligence Optimization Framework](https://{{DOMAIN}}/framework): {{DESCRIPTION}}
- [Safety Benchmarks](https://{{DOMAIN}}/safety-benchmarks): {{DESCRIPTION}}

## Programs

- [Council of AI](https://councilof.ai): {{DESCRIPTION}}
- [Proof of Agency](https://proofof.ai): {{DESCRIPTION}}
- [Safety of AI](https://safetyof.ai): {{DESCRIPTION}}
- [Meok](https://meok.ai): {{DESCRIPTION}}

## Governance

- [Bylaws](https://{{DOMAIN}}/governance/bylaws): {{DESCRIPTION}}
- [Ethics Policy](https://{{DOMAIN}}/governance/ethics): {{DESCRIPTION}}
- [Transparency Reports](https://{{DOMAIN}}/governance/transparency): {{DESCRIPTION}}

## Contact

- [General Inquiries](https://{{DOMAIN}}/contact): {{DESCRIPTION}}
- [Press Kit](https://{{DOMAIN}}/press): {{DESCRIPTION}}
- [Partnerships](https://{{DOMAIN}}/partners): {{DESCRIPTION}}

## Optional

- [Blog Archive](https://{{DOMAIN}}/blog): {{DESCRIPTION}}
- [Newsletter Archive](https://{{DOMAIN}}/newsletter): {{DESCRIPTION}}
- [Event Recordings](https://{{DOMAIN}}/events): {{DESCRIPTION}}
```

**Code Snippet 1b — llms.txt for proofof.ai (Certification Platform)**
```markdown
# Proof of Agency (PoA)

> Proof of Agency is a certification and evaluation framework for autonomous AI systems, establishing verifiable benchmarks for self-directed AI behavior, safety constraints, and human-alignment guarantees.

Proof of Agency provides the first rigorous, open methodology for certifying that AI systems can operate autonomously while maintaining safety boundaries and alignment with human intent. The framework is developed by CSOAI in collaboration with leading AI safety researchers.

## Core Documentation

- [Framework Overview](https://proofof.ai/framework): Complete PoA methodology and principles
- [Certification Levels](https://proofof.ai/levels): Five-tier agency certification system
- [Safety Benchmarks](https://proofof.ai/benchmarks): Evaluation criteria and test suites
- [Technical Specification](https://proofof.ai/spec): Detailed technical specification v1.0

## Getting Started

- [Quick Start Guide](https://proofof.ai/quickstart): Evaluate your first AI system
- [Integration Tutorial](https://proofof.ai/tutorial): Step-by-step implementation guide
- [API Reference](https://proofof.ai/api): REST API for automated certification testing
- [SDK Documentation](https://proofof.ai/sdk): Python and TypeScript SDKs

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

**Code Snippet 1c — llms.txt for meok.ai (Mothership/Coordination)**
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

- [CSOAI — Main Research Org](https://csoai.org): Center for the Study of Optimized Intelligence
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

**Implementation Notes Section** (required in chapter):
- File must be plain markdown with `.txt` extension served at `/llms.txt` or `/.well-known/llms.txt`
- Include H1, blockquote summary, H2 sections with curated links
- "Optional" section for lower-priority content
- Add `<link rel="alternate" type="text/markdown" href="/llms.txt" />` to HTML head
- Also create `/llms-full.txt` with complete content for documentation-heavy sites
- Validate at `llms.txt` parser tools: `llms_txt2ctx` CLI

---

### H4: robots.txt — AI Crawler Access Template

**Deliverable**: Production robots.txt with all 25 AI crawler user-agents

**Code Snippet 2 — robots.txt**
```
# ============================================
# {{SITE_NAME}} — AI Crawler Access Policy
# Last Updated: {{DATE}}
# ============================================

# --- OPENAI ---
User-agent: GPTBot
Disallow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ChatGPT-User/2.0
Allow: /

# --- ANTHROPIC / CLAUDE ---
User-agent: ClaudeBot
Disallow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: anthropic-ai
Disallow: /

# --- PERPLEXITY ---
User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# --- GOOGLE ---
User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /

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

# --- OTHER AI/RESEARCH CRAWLERS ---
User-agent: Amazonbot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: DuckAssistBot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: CCBot
Allow: /

User-agent: AI2Bot
Allow: /

User-agent: Diffbot
Allow: /

User-agent: Bytespider
Allow: /

# --- SITEMAPS ---
Sitemap: https://{{DOMAIN}}/sitemap.xml
```

**Required Table — AI Crawler Reference**:

| User-Agent | Vendor | Purpose | Policy |
|------------|--------|---------|--------|
| `GPTBot` | OpenAI | Model training | Disallow |
| `OAI-SearchBot` | OpenAI | Search indexing | **ALLOW** |
| `ChatGPT-User` | OpenAI | User fetch | **ALLOW** |
| `ClaudeBot` | Anthropic | Model training | Disallow |
| `Claude-SearchBot` | Anthropic | Search indexing | **ALLOW** |
| `PerplexityBot` | Perplexity | Search index | **ALLOW** |
| `Google-Extended` | Google | AI training | Allow |
| `Googlebot` | Google | Search | **ALLOW** |
| `Bingbot` | Microsoft | Bing/Copilot | **ALLOW** |

**Implementation Notes**:
- List crawlers individually — never rely on wildcards
- Add directive after every `User-agent:` (at least one `Allow:` or `Disallow:`)
- Blank lines between blocks for readability
- Re-test after major LLM releases
- Monitor server logs for new/unknown crawlers

---

### H4: FAQPage Schema — JSON-LD Template

**Deliverable**: Reusable FAQPage JSON-LD with 10 question slots

**Code Snippet 3 — FAQPage Schema (10 Questions)**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://{{DOMAIN}}/{{PAGE_SLUG}}#faqpage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{{QUESTION_1}}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{{ANSWER_1_40_110_WORDS}}"
      }
    },
    {
      "@type": "Question",
      "name": "{{QUESTION_2}}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{{ANSWER_2_40_110_WORDS}}"
      }
    }
    // ... repeat for 5-10 questions
  ]
}
</script>
```

**Best Practices Section** (required):
- Place JSON-LD in `<head>` or immediately before `</body>`
- Each answer must be self-contained (40-110 words)
- Match real AI prompt patterns: "What is...", "How does...", "Why..."
- FAQ content must be visible on page — not only in JSON-LD
- Limit 5-10 questions per page
- Use `@graph` stacking with Article schema for 1.8x citation lift

---

### H4: Organization Schema — JSON-LD Template

**Deliverable**: Organization JSON-LD with parent/child relationships across 5 sites

**Code Snippet 4 — Organization Schema**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://{{DOMAIN}}/#organization",
  "name": "{{FULL_ORG_NAME}}",
  "alternateName": "{{SHORT_NAME}}",
  "url": "https://{{DOMAIN}}",
  "logo": {
    "@type": "ImageObject",
    "@id": "https://{{DOMAIN}}/#logo",
    "url": "https://{{DOMAIN}}/assets/logo.png",
    "width": 512,
    "height": 512
  },
  "description": "{{2_3_SENTENCE_DESCRIPTION}}",
  "foundingDate": "{{YYYY}}",
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "email": "{{EMAIL}}",
      "contactType": "General Inquiries",
      "availableLanguage": ["English"]
    }
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{{STREET}}",
    "addressLocality": "{{CITY}}",
    "addressRegion": "{{REGION}}",
    "postalCode": "{{ZIP}}",
    "addressCountry": "{{COUNTRY}}"
  },
  "sameAs": [
    "https://www.linkedin.com/company/{{HANDLE}}",
    "https://twitter.com/{{HANDLE}}",
    "https://github.com/{{HANDLE}}",
    "https://www.crunchbase.com/organization/{{HANDLE}}"
  ],
  "parentOrganization": {
    "@type": "Organization",
    "@id": "https://meok.ai/#organization"
  },
  "subOrganization": [
    { "@type": "Organization", "@id": "https://councilof.ai/#organization" },
    { "@type": "Organization", "@id": "https://proofof.ai/#organization" },
    { "@type": "Organization", "@id": "https://safetyof.ai/#organization" }
  ],
  "knowsAbout": [
    "Artificial Intelligence Safety",
    "Optimized Intelligence",
    "AI Governance",
    "AI Certification"
  ]
}
</script>
```

---

### H4: Person Schema — JSON-LD Template (Founder/Author)

**Deliverable**: Person schema template for leadership and author pages

**Code Snippet 5 — Person Schema**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://{{DOMAIN}}/team/{{SLUG}}#person",
  "name": "{{FULL_NAME}}",
  "alternateName": "{{PREFERRED_NAME}}",
  "url": "https://{{DOMAIN}}/team/{{SLUG}}",
  "image": {
    "@type": "ImageObject",
    "url": "https://{{DOMAIN}}/assets/team/{{PHOTO}}.jpg",
    "width": 800,
    "height": 800
  },
  "description": "{{2_3_SENTENCE_BIO}}",
  "jobTitle": "{{TITLE}}",
  "worksFor": {
    "@type": "Organization",
    "@id": "https://{{DOMAIN}}/#organization"
  },
  "alumniOf": [
    {
      "@type": "CollegeOrUniversity",
      "name": "{{UNIVERSITY}}",
      "sameAs": "https://en.wikipedia.org/wiki/{{UNIVERSITY}}"
    }
  ],
  "knowsAbout": [
    {
      "@type": "Thing",
      "name": "{{EXPERTISE_AREA_1}}",
      "sameAs": "https://en.wikipedia.org/wiki/{{TOPIC}}"
    }
  ],
  "sameAs": [
    "https://www.linkedin.com/in/{{USERNAME}}",
    "https://twitter.com/{{USERNAME}}",
    "https://github.com/{{USERNAME}}",
    "https://scholar.google.com/citations?user={{ID}}"
  ]
}
</script>
```

---

### H4: agent.json — A2A Agent Card Template

**Deliverable**: Agent Card JSON for `/.well-known/agent.json`

**Code Snippet 6 — agent.json**
```json
{
  "name": "{{SITE_NAME}} Assistant",
  "description": "An AI assistant specialized in {{DOMAIN_EXPERTISE}}. Provides access to {{RESOURCE_TYPES}}.",
  "url": "https://{{DOMAIN}}/api/agent",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false,
    "stateTransitionHistory": true
  },
  "authentication": {
    "schemes": ["bearer"],
    "credentials": "API key available at https://{{DOMAIN}}/api/keys"
  },
  "skills": [
    {
      "id": "{{SKILL_ID}}",
      "name": "{{SKILL_NAME}}",
      "description": "{{SKILL_DESCRIPTION}}",
      "tags": ["{{TAG_1}}", "{{TAG_2}}"],
      "examples": [
        "{{EXAMPLE_QUERY_1}}",
        "{{EXAMPLE_QUERY_2}}"
      ]
    }
  ],
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/plain", "application/json", "text/markdown"]
}
```

**Implementation Notes**:
- Place at `/.well-known/agent.json` (RFC 8615 well-known URI)
- Ensure CORS: `Access-Control-Allow-Origin: *`
- Content-Type: `application/json`
- Implement A2A endpoint at URL specified in Agent Card
- Support JSON-RPC 2.0 over HTTP(S)

---

### H4: /llm-info Page — Integrated AI Identity Page Template

**Deliverable**: HTML page template at `/about/llm` (NOT standalone at root)

**Code Snippet 7 — /about/llm HTML Template**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{SITE_NAME}} — AI-Readable Identity & Overview</title>
  <meta name="description" content="Machine-readable identity overview for {{SITE_NAME}}.">
  <link rel="alternate" type="text/markdown" href="/about/llm.md" title="LLM-friendly version">
  <!-- Organization Schema @graph -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://{{DOMAIN}}/#organization",
        "name": "{{FULL_NAME}}",
        "alternateName": "{{SHORT_NAME}}",
        "url": "https://{{DOMAIN}}",
        "description": "{{DESCRIPTION}}"
      },
      {
        "@type": "WebPage",
        "@id": "https://{{DOMAIN}}/about/llm#webpage",
        "url": "https://{{DOMAIN}}/about/llm",
        "name": "{{SHORT_NAME}} Identity Overview"
      }
    ]
  }
  </script>
</head>
<body>
  <main>
    <h1>{{FULL_NAME}} ({{SHORT_NAME}})</h1>
    <section id="identity">
      <h2>Organization Identity</h2>
      <p><strong>Legal Name:</strong> {{FULL_NAME}}</p>
      <p><strong>Short Name:</strong> {{SHORT_NAME}}</p>
      <p><strong>Type:</strong> {{ORG_TYPE}}</p>
      <p><strong>Founded:</strong> {{YEAR}}</p>
      <p><strong>Mission:</strong> {{MISSION_STATEMENT}}</p>
    </section>
    <section id="programs">
      <h2>Programs and Initiatives</h2>
      <ul>
        <li><strong>{{PROGRAM_1}}</strong> ({{DOMAIN_1}}) — {{DESCRIPTION_1}}</li>
        <li><strong>{{PROGRAM_2}}</strong> ({{DOMAIN_2}}) — {{DESCRIPTION_2}}</li>
      </ul>
    </section>
    <section id="leadership">
      <h2>Leadership</h2>
      <ul>
        <li>{{NAME}}, {{TITLE}}</li>
      </ul>
    </section>
    <section id="research-areas">
      <h2>Primary Research Areas</h2>
      <ul>
        <li>{{AREA_1}}</li>
        <li>{{AREA_2}}</li>
      </ul>
    </section>
    <section id="key-facts">
      <h2>Key Facts for AI Systems</h2>
      <ul>
        <li>{{FACT_1}}</li>
        <li>{{FACT_2}}</li>
      </ul>
    </section>
    <section id="verification">
      <h2>Verification Sources</h2>
      <ul>
        <li>LinkedIn: https://www.linkedin.com/company/{{HANDLE}}</li>
        <li>GitHub: https://github.com/{{HANDLE}}</li>
      </ul>
    </section>
  </main>
</body>
</html>
```

---

### H4: Article Schema — JSON-LD with dateModified

**Deliverable**: Article schema template with freshness signals

**Code Snippet 8 — Article Schema**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://{{DOMAIN}}/{{SECTION}}/{{SLUG}}#article",
  "headline": "{{TITLE_MAX_110_CHARS}}",
  "description": "{{META_DESCRIPTION}}",
  "url": "https://{{DOMAIN}}/{{SECTION}}/{{SLUG}}",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://{{DOMAIN}}/{{SECTION}}/{{SLUG}}"
  },
  "image": ["https://{{DOMAIN}}/assets/{{SECTION}}/{{SLUG}}-og.jpg"],
  "datePublished": "{{YYYY-MM-DDTHH:MM:SS+00:00}}",
  "dateModified": "{{YYYY-MM-DDTHH:MM:SS+00:00}}",
  "author": {
    "@type": "Person",
    "@id": "https://{{DOMAIN}}/team/{{AUTHOR_SLUG}}#person",
    "name": "{{AUTHOR_NAME}}"
  },
  "publisher": {
    "@type": "Organization",
    "@id": "https://{{DOMAIN}}/#organization"
  },
  "articleSection": "{{SECTION_NAME}}",
  "keywords": ["{{KW_1}}", "{{KW_2}}", "{{KW_3}}"],
  "inLanguage": "en",
  "isAccessibleForFree": true,
  "copyrightHolder": {
    "@type": "Organization",
    "@id": "https://{{DOMAIN}}/#organization"
  },
  "copyrightYear": "{{YYYY}}",
  "license": "https://creativecommons.org/licenses/by/4.0/"
}
</script>
```

**dateModified Best Practices**:
- Must reflect actual content changes — not automated timestamps
- Update when: new sections, statistics refreshed, recommendations changed
- Don't update for: typo fixes, image swaps, minor formatting
- Quarterly minimum for core pages, monthly for competitive pages

---

### H4: BreadcrumbList Schema — JSON-LD Template

**Deliverable**: BreadcrumbList schema for all non-homepage pages

**Code Snippet 9 — BreadcrumbList Schema**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://{{DOMAIN}}/{{SECTION}}/{{SLUG}}#breadcrumb",
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
      "item": "https://{{DOMAIN}}/{{SECTION}}"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{{PAGE_TITLE}}"
    }
  ]
}
</script>
```

---

### H4: SoftwareApplication Schema — JSON-LD with Offers

**Deliverable**: SoftwareApplication schema for proofof.ai pricing page

**Code Snippet 10 — SoftwareApplication Schema**
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
      "name": "{{TIER_1_NAME}}",
      "description": "{{TIER_1_DESCRIPTION}}",
      "price": "{{TIER_1_PRICE}}",
      "priceCurrency": "USD",
      "priceValidUntil": "{{YYYY-MM-DD}}"
    },
    {
      "@type": "Offer",
      "name": "{{TIER_2_NAME}}",
      "description": "{{TIER_2_DESCRIPTION}}",
      "price": "{{TIER_2_PRICE}}",
      "priceCurrency": "USD",
      "priceValidUntil": "{{YYYY-MM-DD}}"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{{RATING}}",
    "reviewCount": "{{COUNT}}",
    "bestRating": "5",
    "worstRating": "1"
  },
  "featureList": [
    "{{FEATURE_1}}",
    "{{FEATURE_2}}",
    "{{FEATURE_3}}"
  ],
  "softwareVersion": "{{VERSION}}",
  "publisher": {
    "@type": "Organization",
    "@id": "https://csoai.org/#organization"
  }
}
</script>
```

---

### H4: Complete @graph Stack — Combined Schema Template

**Deliverable**: Single script combining all schemas for maximum AI citation

**Code Snippet 11 — Complete @graph Stack**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://{{DOMAIN}}/#organization",
      "name": "{{FULL_NAME}}",
      "url": "https://{{DOMAIN}}",
      "logo": "https://{{DOMAIN}}/assets/logo.png",
      "sameAs": ["https://linkedin.com/company/{{HANDLE}}", "https://twitter.com/{{HANDLE}}"]
    },
    {
      "@type": "WebSite",
      "@id": "https://{{DOMAIN}}/#website",
      "url": "https://{{DOMAIN}}",
      "name": "{{SHORT_NAME}}",
      "publisher": { "@id": "https://{{DOMAIN}}/#organization" }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://{{DOMAIN}}" },
        { "@type": "ListItem", "position": 2, "name": "{{SECTION}}", "item": "https://{{DOMAIN}}/{{SECTION}}" },
        { "@type": "ListItem", "position": 3, "name": "{{TITLE}}" }
      ]
    },
    {
      "@type": "Article",
      "@id": "https://{{DOMAIN}}/{{SECTION}}/{{SLUG}}#article",
      "headline": "{{TITLE}}",
      "datePublished": "{{DATE_PUBLISHED}}",
      "dateModified": "{{DATE_MODIFIED}}",
      "author": { "@id": "https://{{DOMAIN}}/team/{{AUTHOR}}#person" },
      "publisher": { "@id": "https://{{DOMAIN}}/#organization" }
    },
    {
      "@type": "FAQPage",
      "@id": "https://{{DOMAIN}}/{{SECTION}}/{{SLUG}}#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "{{Q1}}",
          "acceptedAnswer": { "@type": "Answer", "text": "{{A1}}" }
        }
      ]
    }
  ]
}
</script>
```

---

### H4: Implementation Priority Table

**Required Table**:

| Priority | Task | Sites | Effort | Timeline |
|----------|------|-------|--------|----------|
| P0 | Create `/robots.txt` with AI crawler allowances | All 5 | 2h | Week 1 |
| P0 | Add Organization JSON-LD to all homepages | All 5 | 2h | Week 1 |
| P0 | Add Person JSON-LD for all founders | All 5 | 3h | Week 1 |
| P0 | Add FAQPage JSON-LD (5-10 QAs) to all homepages | All 5 | 4h | Week 1 |
| P1 | Add BreadcrumbList to all non-home pages | All 5 | 3h | Week 2 |
| P1 | Implement SoftwareApplication + Offer schema | proofof.ai | 2h | Week 2 |
| P1 | Create `/llms.txt` files | 3 sites | 3h | Week 2 |
| P2 | Implement `/.well-known/agent.json` | csoai.org, meok.ai | 4h | Week 4 |
| P2 | Implement `@graph` stacking on landing pages | All 5 | 4h | Week 4 |
| P2 | Create `/about/llm` integrated AI identity pages | All 5 | 4h | Week 4 |

**Chapter Validation Checklist**:
- [ ] All 11 code snippets have placeholder variables documented
- [ ] 3 llms.txt variants are site-specific
- [ ] robots.txt covers all 25+ AI crawlers
- [ ] FAQPage schema limited to 5-10 questions with 40-110 word answers
- [ ] Organization schema includes parent/child relationships
- [ ] Person schema includes sameAs links for E-E-A-T
- [ ] agent.json follows A2A specification with skills array
- [ ] Article schema includes both datePublished and dateModified
- [ ] @graph stack combines Organization + WebSite + BreadcrumbList + Article + FAQPage

---

## Chapter 2: Cross-Sell Engine

**Chapter Word Count Target**: 6,000-8,000 words  
**Required Elements**: 5 trigger flows, 15 email templates, 5 modal texts, 5 CTA variants  
**Required Tables**: 1 (trigger matrix)

---

### H4: Cross-Sell Trigger Flow Matrix

**Required Table — Trigger Conditions & Actions**:

| # | Trigger Name | Condition | Source Site | Target Site | Priority |
|---|-------------|-----------|-------------|-------------|----------|
| 1 | Research to Certification | Viewed 2+ research papers | csoai.org | proofof.ai | High |
| 2 | Certification to Council | Completed certification | proofof.ai | councilof.ai | High |
| 3 | Council to Safety | Joined council, 14 days | councilof.ai | safetyof.ai | Medium |
| 4 | Safety to Ecosystem | Downloaded 2+ guides | safetyof.ai | meok.ai | Medium |
| 5 | Any to Bundle | Visited pricing on any site | Any | meok.ai/bundle | High |

---

### H4: Trigger Flow 1 — Research to Certification (csoai.org -> proofof.ai)

**Deliverable**: Complete email sequence with 3 emails

**Flow Conditions**:
- User views 2+ research papers on csoai.org within 7 days
- OR downloads a research PDF
- OR spends 5+ minutes on /research page
- Delay: 24 hours after trigger

**Email 1 — Initial Trigger (24h delay)**
- **Subject Line**: "Your research interest → Certify your AI systems"
- **Alternative Subject**: "From reading about AI safety to proving it"
- **Preview Text**: "Proof of Agency certification is now open"
- **Body Copy**:
  ```
  Hi {{FIRST_NAME}},

  I noticed you've been reading our research on {{TOPIC}}.

  Research is only half the equation. The other half is proving your AI systems meet rigorous safety standards.

  Proof of Agency — our certification framework — gives you:
  ✓ A public registry listing that builds trust with customers
  ✓ Standardized benchmarks covering safety, alignment, and agency
  ✓ Expert panel review with transparent evaluation criteria
  ✓ Ed25519 cryptographic attestation for verifiable proof

  → [Start Your Certification Evaluation — Free]

  Questions? Reply to this email — I read every response.

  {{SIGNATURE}}
  ```
- **CTA Button**: "Start Free Evaluation"
- **Secondary CTA**: "See Certified Systems Registry"

**Email 2 — Follow-up (72h delay, if no click)**
- **Subject Line**: "The certification process: what to expect"
- **Body Copy**: Step-by-step walkthrough of the certification process
- **CTA Button**: "Begin Step 1: Self-Assessment"

**Email 3 — Final (7 days, if no click)**
- **Subject Line**: "Last call: certification pricing increases {{DATE}}"
- **CTA Button**: "Lock In Current Pricing"

**In-App Modal Text** (shown on csoai.org):
- **Headline**: "Ready to prove your AI's safety?"
- **Body**: "You've explored our research. Now certify your systems with Proof of Agency."
- **Primary CTA**: "Start Certification"
- **Secondary CTA**: "Learn More"
- **Dismiss**: "Maybe later"

---

### H4: Trigger Flow 2 — Certification to Council (proofof.ai -> councilof.ai)

**Flow Conditions**:
- User completes any certification level on proofof.ai
- Delay: Immediate + follow-up at 7 days

**Email 1 — Completion Congratulations**
- **Subject Line**: "You're certified. Now shape the future of AI governance."
- **Body Copy**:
  ```
  Congratulations on achieving {{CERTIFICATION_LEVEL}} certification!

  Your systems are now listed in the public registry. 

  Here's what 78% of certified organizations do next: they join the Council of AI to help shape governance standards for the entire industry.

  As a certified organization, you get:
  ✓ Priority access to Council governance sessions
  ✓ Voting rights on upcoming standards revisions
  ✓ Direct input to EU AI Act implementation guidance
  ✓ Networking with other certified organizations

  → [Join the Council of AI — Priority Access]

  {{SIGNATURE}}
  ```
- **CTA Button**: "Join Council of AI"
- **Secondary CTA**: "Learn About Council Governance"

**Email 2 — Follow-up (7 days)**
- **Subject Line**: "The EU AI Act needs your voice"
- **CTA Button**: "Apply for Council Membership"

---

### H4: Trigger Flow 3 — Council to Safety (councilof.ai -> safetyof.ai)

**Flow Conditions**:
- User joins Council of AI
- 14 days after join date
- No prior visit to safetyof.ai

**Email Sequence**:
- **Subject Line**: "Safety benchmarks: the missing piece in your governance stack"
- **Body Copy**: Connects council membership to safety implementation
- **CTA Button**: "Explore Safety Benchmarks"
- **Key Message**: "Governance without safety testing is just paperwork"

---

### H4: Trigger Flow 4 — Safety to Ecosystem (safetyof.ai -> meok.ai)

**Flow Conditions**:
- User downloads 2+ safety guides
- OR attends a safety webinar
- Delay: 48 hours

**Email Sequence**:
- **Subject Line**: "You're building safety expertise. See the full ecosystem."
- **Body Copy**: Introduces meok.ai as the coordination layer
- **CTA Button**: "Explore the CSOAI Ecosystem"
- **Key Message**: "Safety is one pillar. See how it connects to everything else."

---

### H4: Trigger Flow 5 — Bundle Upsell (Any Site -> meok.ai/bundle)

**Flow Conditions**:
- User visits pricing page on any site
- OR initiates checkout but doesn't complete
- OR has 2+ site accounts with same email

**Email Sequence**:
- **Subject Line**: "Bundle all 4 programs. Save 40%."
- **Body Copy**:
  ```
  You've explored {{PROGRAM_NAME}}. 

  Organizations that combine certification, governance, safety, and research see 3x faster compliance outcomes.

  The CSOAI Ecosystem Bundle:
  ✓ Proof of Agency Certification (any tier)
  ✓ Council of AI Membership
  ✓ Safety of AI Benchmark Access
  ✓ CSOAI Research Partnership
  ✓ Priority support across all programs

  Bundle price: {{BUNDLE_PRICE}} (save {{SAVINGS_PERCENT}}% vs. individual)

  → [Get the Bundle — Save {{SAVINGS_PERCENT}}%]
  
  Or build your own: [Configure Custom Bundle]
  ```
- **CTA Button**: "Get the Bundle"
- **Secondary CTA**: "Configure Custom Bundle"

---

### H4: Cross-Sell Email Template Library

**Required Copy Templates** (reusable across flows):

**Bundle Pricing Insert**:
```
| Tier | Price | Includes | Best For |
|------|-------|----------|----------|
| Starter | £99/mo | 1 program | Individual researchers |
| Pro | £299/mo | 2 programs | Small teams |
| Governance | £1,699/mo | 3 programs | Organizations |
| Enterprise | £4,950+/mo | All programs + custom | Large enterprises |
```

**Subject Line Formula Templates**:
1. "Your {{ACTION}} → {{NEXT_STEP}}" (e.g., "Your research → Certification")
2. "{{NUMBER}}% of {{AUDIENCE}} do this next" (social proof)
3. "The {{TOPIC}} guide you requested" (value delivery)
4. "{{URGENCY_TRIGGER}}: {{OFFER}}" (scarcity)
5. "{{FIRST_NAME}}, quick question about {{TOPIC}}" (personal)

**CTA Button Copy Library**:
- Primary: "Start {{ACTION}}", "Join {{PROGRAM}}", "Get {{RESULT}}"
- Secondary: "Learn More", "See Examples", "Compare Options"
- Tertiary: "Remind Me Later", "Not Interested"

**Chapter Validation Checklist**:
- [ ] 5 trigger flows fully specified with conditions
- [ ] 15 email templates with subject lines, body copy, CTAs
- [ ] 5 in-app modal texts with headlines, body, CTAs, dismiss
- [ ] Bundle pricing table with all 4 tiers
- [ ] Subject line formula templates (5 formulas)
- [ ] CTA button copy library (primary/secondary/tertiary)

---

## Chapter 3: Site-by-Site Implementation

**Chapter Word Count Target**: 10,000-12,000 words  
**Required Elements**: 5 site sections, priority fix lists, code snippets per site  
**Required Tables**: 5 (one per site priority matrix)

---

### H4: csoai.org — Research Organization Priority Fixes

**Required Table — Priority Fixes**:

| Priority | Fix | Effort | Code Required |
|----------|-----|--------|---------------|
| P0 | Add Organization schema to homepage | 30min | JSON-LD snippet |
| P0 | Add FAQPage schema (10 QAs) | 1h | JSON-LD snippet |
| P0 | Create `/robots.txt` | 15min | robots.txt template |
| P1 | Create `/llms.txt` | 30min | llms.txt variant 1a |
| P1 | Add Person schema for leadership | 45min | Person schema template |
| P1 | Add BreadcrumbList to all pages | 1h | BreadcrumbList template |
| P2 | Create `/about/llm` page | 2h | HTML template (Ch1) |
| P2 | Implement `@graph` stacking | 1h | @graph stack template |
| P2 | Add dateModified to all articles | 30min | Article schema template |

**Code Snippet — csoai.org Homepage Hero CTA**:
```html
<div class="hero-cta">
  <input type="email" placeholder="Enter your work email" aria-label="Work email" />
  <button class="cta-primary">Get started →</button>
  <small>No credit card required. Research access is free.</small>
</div>
```

**Code Snippet — csoai.org Announcement Banner**:
```html
<div class="announcement-bar" style="background: linear-gradient(90deg, #{{PRIMARY_COLOR}}, #{{SECONDARY_COLOR}});">
  <span>{{BANNER_TEXT}} — <a href="{{BANNER_LINK}}">{{BANNER_CTA}} →</a></span>
  <button aria-label="Close announcement">×</button>
</div>
```

---

### H4: proofof.ai — Certification Platform Priority Fixes

**Required Table — Priority Fixes**:

| Priority | Fix | Effort | Code Required |
|----------|-----|--------|---------------|
| P0 | Add SoftwareApplication schema | 30min | Ch1 Code Snippet 10 |
| P0 | Add FAQPage schema (10 certification QAs) | 1h | FAQPage template |
| P0 | Create pricing page with 4 tiers | 4h | Pricing table code |
| P1 | Add Organization schema | 30min | Organization template |
| P1 | Create `/llms.txt` | 30min | llms.txt variant 1b |
| P1 | Add Person schema for board members | 45min | Person template |
| P2 | Add Review schema for testimonials | 30min | Review schema |
| P2 | Implement `@graph` stacking | 1h | @graph stack |
| P2 | Create `/docs` developer portal page | 4h | Wireframe spec |

**Code Snippet — Pricing Table (4 Tiers)**:
```html
<div class="pricing-grid">
  <div class="pricing-tier" data-tier="starter">
    <h3>Starter</h3>
    <div class="price">£99<span>/mo</span></div>
    <ul class="features">
      <li>Self-service safety evaluation</li>
      <li>Automated benchmarking</li>
      <li>Basic reporting</li>
      <li>Email support</li>
    </ul>
    <button class="cta-secondary">Get Started</button>
  </div>
  <div class="pricing-tier featured" data-tier="pro">
    <span class="badge">Most Popular</span>
    <h3>Pro</h3>
    <div class="price">£299<span>/mo</span></div>
    <ul class="features">
      <li>Everything in Starter</li>
      <li>Full agency certification</li>
      <li>Public registry listing</li>
      <li>API access</li>
      <li>Priority support</li>
    </ul>
    <button class="cta-primary">Get Started</button>
  </div>
  <div class="pricing-tier" data-tier="governance">
    <h3>Governance</h3>
    <div class="price">£1,699<span>/mo</span></div>
    <ul class="features">
      <li>Everything in Pro</li>
      <li>Multi-system certification</li>
      <li>Custom benchmarks</li>
      <li>Dedicated account manager</li>
      <li>Quarterly review sessions</li>
    </ul>
    <button class="cta-secondary">Contact Sales</button>
  </div>
  <div class="pricing-tier" data-tier="enterprise">
    <h3>Enterprise</h3>
    <div class="price">£4,950+<span>/mo</span></div>
    <ul class="features">
      <li>Everything in Governance</li>
      <li>Custom integration</li>
      <li>On-premise deployment</li>
      <li>SLA guarantees</li>
      <li>White-label options</li>
    </ul>
    <button class="cta-secondary">Contact Sales</button>
  </div>
</div>
```

---

### H4: councilof.ai — Governance Council Priority Fixes

**Required Table — Priority Fixes**:

| Priority | Fix | Effort | Code Required |
|----------|-----|--------|---------------|
| P0 | Add Organization schema | 30min | Organization template |
| P0 | Add FAQPage (10 governance QAs) | 1h | FAQPage template |
| P1 | Add Person schema for council members | 1h | Person template |
| P1 | Create `/llms.txt` | 30min | llms.txt variant |
| P2 | Create `/about/llm` page | 2h | HTML template |
| P2 | Add BreadcrumbList | 30min | BreadcrumbList template |

---

### H4: safetyof.ai — Safety Research Priority Fixes

**Required Table — Priority Fixes**:

| Priority | Fix | Effort | Code Required |
|----------|-----|--------|---------------|
| P0 | Add Organization schema | 30min | Organization template |
| P0 | Add FAQPage (10 safety QAs) | 1h | FAQPage template |
| P1 | Add HowTo schema for safety guides | 1h | HowTo schema |
| P1 | Create `/llms.txt` | 30min | llms.txt variant |
| P2 | Add Article schema for all guides | 45min | Article template |
| P2 | Implement `@graph` stacking | 1h | @graph stack |

---

### H4: meok.ai — Mothership/Coordination Priority Fixes

**Required Table — Priority Fixes**:

| Priority | Fix | Effort | Code Required |
|----------|-----|--------|---------------|
| P0 | Add Organization schema (parent org) | 30min | Organization template |
| P0 | Add FAQPage (10 ecosystem QAs) | 1h | FAQPage template |
| P0 | Create `/robots.txt` with all sitemaps | 15min | robots.txt template |
| P1 | Create `/llms.txt` (ecosystem overview) | 30min | llms.txt variant 1c |
| P1 | Create `/.well-known/agent.json` | 1h | agent.json template |
| P2 | Create `/about/llm` page | 2h | HTML template |
| P2 | Add Person schema for ecosystem leaders | 1h | Person template |
| P2 | Create `/bundle` pricing page | 4h | Bundle pricing code |

**Code Snippet — Bundle Pricing Page**:
```html
<div class="bundle-pricing">
  <div class="bundle-tier" data-tier="starter">
    <h3>Starter</h3>
    <div class="price">£99<span>/mo</span></div>
    <p class="tier-desc">1 program, perfect for individuals</p>
    <ul><li>{{PROGRAM_1}}</li></ul>
    <button class="cta-secondary">Get Started</button>
  </div>
  <!-- ... Pro £299, Governance £1,699, Enterprise £4,950+ ... -->
</div>
```

**Chapter Validation Checklist**:
- [ ] 5 site sections with priority fix tables
- [ ] All code snippets site-specific where needed
- [ ] Pricing table with all 4 tiers (Starter/Pro/Governance/Enterprise)
- [ ] robots.txt includes all 5 sitemap references
- [ ] Announcement banner code with gradient styling
- [ ] Hero email capture CTA code

---

## Chapter 4: Missing Pages

**Chapter Word Count Target**: 8,000-10,000 words  
**Required Elements**: 7 page specs with wireframes, content outlines, schemas  
**Required Tables**: 7 (one per missing page spec sheet)

---

### H4: /verify — Certificate Verification Page

**Wireframe Description**:
```
[Header with unified nav]
  |
  v
[H1: "Verify AI Certification"]
[Subhead: "Enter a certificate ID to verify authenticity"]
  |
  v
[Search Input: "CERT-XXXX-XXXX" + "Verify" button]
  |
  v
[Results Panel — Two states:]
  State A (Valid): 
    - Green checkmark
    - Organization name
    - Certification level + issue date
    - Ed25519 signature verification link
    - View full registry entry link
  State B (Invalid/Expired):
    - Red X with explanation
    - Suggestion to contact support
  |
  v
[Batch Verification: Upload CSV]
[API Section: "Verify programmatically" with code sample]
  |
  v
[FAQ: 5 common verification questions]
[Footer]
```

**Content Outline**:
- H1: "Verify AI Certification"
- H2: "How Verification Works" (explain Ed25519 signing)
- H2: "Single Certificate Check" (search form)
- H2: "Batch Verification" (CSV upload)
- H2: "API Access" (code samples)
- H2: "Frequently Asked Questions" (5 QAs for FAQPage schema)

**Schema Required**: FAQPage, SoftwareApplication
**Word Count**: 1,500-2,000 words
**Target Keywords**: "AI certification verification", "verify AI certificate", "certificate authenticity check"

---

### H4: /transparency — Transparency & Accountability Hub

**Wireframe Description**:
```
[Header]
  |
  v
[H1: "Transparency Reports & Accountability"]
[Subhead: "Open governance. Verifiable claims. Public accountability."]
  |
  v
[Quarterly Report Cards — Grid of 4 cards]
  - Financial transparency
  - Research methodology
  - Certification decisions
  - Governance votes
  |
  v
[BFT Council Activity Feed]
  - Recent votes
  - Decision summaries
  - HMAC signatures
  |
  v
[Download Center — PDF reports]
[Open Data Section — API endpoints for raw data]
[Footer]
```

**Content Outline**:
- H1: "Transparency Reports & Accountability Hub"
- H2: "Quarterly Transparency Reports" (downloadable PDFs)
- H2: "BFT Council Voting Record" (public vote log)
- H2: "Certification Decision Log" (anonymized decisions)
- H2: "Financial Transparency" (funding sources, expenses)
- H2: "Open Data API" (raw data access)
- H2: "FAQ" (5 QAs)

**Schema Required**: FAQPage, Article, Dataset
**Word Count**: 2,000-2,500 words
**Target Keywords**: "AI transparency report", "AI governance accountability", "open AI governance"

---

### H4: /ecosystem — Ecosystem Map & Program Directory

**Wireframe Description**:
```
[Header]
  |
  v
[H1: "The CSOAI Ecosystem"]
[Subhead: "5 programs. One mission. Optimized intelligence."]
  |
  v
[Interactive Ecosystem Map — 5 nodes connected to center]
  Center: meok.ai (coordination)
  Nodes: csoai.org, councilof.ai, proofof.ai, safetyof.ai
  |
  v
[Program Cards — 5 detailed cards]
  Each with: logo, description, key stats, CTA link
  |
  v
[Integration Diagram: How programs connect]
[Get Involved CTA Section]
[Footer]
```

**Content Outline**:
- H1: "The CSOAI Ecosystem: Programs & Connections"
- H2: "Ecosystem Overview" (visual map description)
- H2: "CSOAI Core Research" (csoai.org)
- H2: "Council of AI" (councilof.ai)
- H2: "Proof of Agency" (proofof.ai)
- H2: "Safety of AI" (safetyof.ai)
- H2: "Meok Coordination Layer" (meok.ai)
- H2: "How Programs Connect" (integration diagram)
- H2: "Get Involved" (CTA section)

**Schema Required**: Organization, FAQPage
**Word Count**: 2,500-3,000 words
**Target Keywords**: "CSOAI ecosystem", "AI research programs", "AI governance network"

---

### H4: /security — Security, Trust & Compliance Center

**Wireframe Description**:
```
[Header]
  |
  v
[H1: "Security & Trust Center"]
[Subhead: "How we protect data, verify claims, and maintain trust"]
  |
  v
[4-Column Security Principles]
  1. Defense in depth
  2. Least privilege
  3. Consistency
  4. Iteration
  |
  v
[Certification Badges — SOC 2, ISO 27001]
[Trust Controls — Real-time status indicators]
[Subprocessor List — Table]
[Security Whitepaper Download]
[Vulnerability Disclosure Policy]
[FAQ]
[Footer]
```

**Content Outline**:
- H1: "Security & Trust Center"
- H2: "Our Security Principles" (4 numbered principles)
- H2: "Compliance Certifications" (SOC 2, ISO 27001 badges)
- H2: "Live Trust Controls" (real-time status)
- H2: "Subprocessors" (table of third-party services)
- H2: "Security Whitepaper" (download CTA)
- H2: "Vulnerability Disclosure" (policy + contact)
- H2: "FAQ" (5 QAs)

**Schema Required**: FAQPage, Organization
**Word Count**: 2,000-2,500 words
**Target Keywords**: "AI security trust center", "AI compliance certifications", "AI governance security"

---

### H4: /status — System Status & Network Health

**Wireframe Description**:
```
[Header]
  |
  v
[H1: "CSOAI Network Status"]
[Subhead: "Real-time health of all verification servers"]
  |
  v
[Overall Status Banner — Green/Yellow/Red]
  "All systems operational" / "Partial outage" / "Major outage"
  |
  v
[Status Grid — 5 site status cards]
  Each: site name, uptime %, last checked, status dot
  |
  v
[Incident History — Timeline]
[Uptime Stats — 30/60/90 day]
[Subscribe to Updates — Email/ webhook]
[API Status Endpoint]
[Footer]
```

**Content Outline**:
- H1: "CSOAI Network Status"
- H2: "Current Status" (overall health banner)
- H2: "Service Status" (5 site cards)
- H2: "Incident History" (timeline)
- H2: "Uptime Statistics" (30/60/90 day)
- H2: "Get Status Updates" (email/webhook subscription)
- H2: "Status API" (programmatic access)

**Schema Required**: None (dynamic page)
**Word Count**: 1,000-1,500 words
**Target Keywords**: "CSOAI status", "AI network health", "verification server status"

---

### H4: /docs — Developer Portal & Documentation Hub

**Wireframe Description**:
```
[Header with developer nav]
  |
  v
[H1: "CSOAI Developer Portal"]
[Subhead: "APIs, SDKs, and integration guides for the CSOAI ecosystem"]
  |
  v
[Quick Start Cards — 4 options]
  - REST API
  - Python SDK
  - TypeScript SDK
  - MCP Integration
  |
  v
[API Reference — Sidebar nav + content area]
  Endpoints grouped by: Auth, Certification, Verification, Governance
  |
  v
[Code Examples — Tabbed (curl/Python/TS)]
[Postman Collection Download]
[GitHub Links]
[Footer]
```

**Content Outline**:
- H1: "CSOAI Developer Portal"
- H2: "Quick Start" (4 language/SDK cards)
- H2: "Authentication" (API keys, OAuth)
- H2: "Certification API" (endpoints, parameters, responses)
- H2: "Verification API" (certificate lookup, batch verify)
- H2: "Governance API" (council votes, proposals)
- H2: "MCP Integration" (Model Context Protocol)
- H2: "SDKs & Client Libraries" (Python, TypeScript)
- H2: "Code Examples" (tabbed by language)
- H2: "Changelog" (version history)

**Schema Required**: SoftwareApplication, FAQPage
**Word Count**: 3,000-5,000 words (reference docs)
**Target Keywords**: "CSOAI API", "AI certification API", "AI governance API", "MCP integration"

---

### H4: /partners — Partnership Program Page

**Wireframe Description**:
```
[Header]
  |
  v
[H1: "Partner With CSOAI"]
[Subhead: "Join the ecosystem advancing optimized intelligence"]
  |
  v
[Partner Type Cards — 4 types]
  - Research Partners
  - Technology Partners
  - Advisory Partners
  - Sponsoring Organizations
  |
  v
[Partner Benefits — Feature grid]
[Current Partners Logo Grid]
[Application Form — Multi-step]
[Testimonials from existing partners]
[Footer]
```

**Content Outline**:
- H1: "Partner With CSOAI"
- H2: "Partnership Types" (4 cards)
- H2: "Why Partner With CSOAI" (benefits grid)
- H2: "Current Partners" (logo grid + testimonials)
- H2: "Partnership Benefits Detail" (feature comparison)
- H2: "Apply to Partner" (multi-step form)
- H2: "FAQ" (5 QAs)

**Schema Required**: FAQPage, Organization
**Word Count**: 2,000-2,500 words
**Target Keywords**: "AI research partnership", "AI governance partner program", "AI safety collaboration"

**Chapter Validation Checklist**:
- [ ] 7 missing pages with full wireframe descriptions
- [ ] All pages have H2 content outlines
- [ ] Schema requirements specified per page
- [ ] Word count targets set per page
- [ ] Target keywords identified per page
- [ ] Component hierarchy described for each wireframe

---

## Chapter 5: Master Site Synergy

**Chapter Word Count Target**: 6,000-8,000 words  
**Required Elements**: Unified header spec, auth flow diagram, event pipeline spec  
**Required Tables**: 3 (navigation spec, auth state matrix, event taxonomy)

---

### H4: Unified Header — Navigation Specification

**Wireframe Description**:
```
[Announcement Banner — dismissible, gradient background]
  |
  v
[Header Row]
  [Logo: CSOAI mark + site name]  [Navigation]  [Right Actions]
                                    |               |
                                    v               v
                              [5-7 items with     [Product Switcher]
                               dropdowns]          [Login/Account]
                                                  [Primary CTA]
```

**Required Table — Navigation Items by Site**:

| # | Nav Item | Dropdown? | csoai.org | proofof.ai | councilof.ai | safetyof.ai | meok.ai |
|---|----------|-----------|-----------|------------|--------------|-------------|---------|
| 1 | About / Overview | Yes | Yes | Yes | Yes | Yes | Yes |
| 2 | Research / Platform | Yes | Yes | Yes | — | — | — |
| 3 | Certification | — | Link | Primary | — | — | — |
| 4 | Council | — | Link | — | Primary | — | — |
| 5 | Safety | — | Link | — | — | Primary | — |
| 6 | Programs | Yes | — | — | — | — | Yes |
| 7 | Resources | Yes | Yes | Yes | Yes | Yes | Yes |
| 8 | Pricing | — | — | Yes | — | — | Yes |
| 9 | Contact | — | Yes | Yes | Yes | Yes | Yes |

**Code Snippet — Product Switcher Dropdown**:
```html
<div class="product-switcher">
  <button class="switcher-trigger" aria-expanded="false">
    <img src="{{CURRENT_SITE_ICON}}" alt="" /> {{CURRENT_SITE_NAME}} 
    <svg class="chevron">...</svg>
  </button>
  <div class="switcher-menu" role="menu">
    <a href="https://csoai.org" class="switcher-item {{ACTIVE_IF_CSOAI}}">
      <img src="/icons/csoai.svg" alt="" />
      <span>CSOAI — Research</span>
    </a>
    <a href="https://proofof.ai" class="switcher-item {{ACTIVE_IF_PROOFOF}}">
      <img src="/icons/proofof.svg" alt="" />
      <span>Proof of Agency — Certification</span>
    </a>
    <a href="https://councilof.ai" class="switcher-item {{ACTIVE_IF_COUNCIL}}">
      <img src="/icons/council.svg" alt="" />
      <span>Council of AI — Governance</span>
    </a>
    <a href="https://safetyof.ai" class="switcher-item {{ACTIVE_IF_SAFETY}}">
      <img src="/icons/safety.svg" alt="" />
      <span>Safety of AI — Research</span>
    </a>
    <a href="https://meok.ai" class="switcher-item {{ACTIVE_IF_MEOK}}">
      <img src="/icons/meok.svg" alt="" />
      <span>Meok — Ecosystem</span>
    </a>
  </div>
</div>
```

**Code Snippet — Session State Indicator**:
```html
<div class="session-state">
  {{#IF_LOGGED_IN}}
    <a href="/account" class="account-link">
      <img src="{{AVATAR}}" alt="" class="avatar" />
      <span>{{FIRST_NAME}}</span>
    </a>
    <a href="/logout" class="logout-link">Sign out</a>
  {{ELSE}}
    <a href="/login" class="login-link">Log in</a>
    <a href="/get-started" class="cta-primary">Get started</a>
  {{/IF_LOGGED_IN}}
</div>
```

---

### H4: Unified Footer — 5-Site Consistency Spec

**Wireframe Description**:
```
[Footer — 5-column layout]
  |
  v
[Column 1: Brand]  [Col 2: Programs]  [Col 3: Resources]  [Col 4: Legal]  [Col 5: Connect]
  - Logo             - CSOAI             - Blog               - Privacy        - LinkedIn
  - Tagline          - Council of AI     - Documentation      - Terms          - Twitter/X
  - Copyright        - Proof of Agency   - API Reference      - Cookies        - GitHub
                     - Safety of AI      - Status             - Security       - Newsletter
                     - Meok              - Contact
  |
  v
[Bottom Bar: "Part of the CSOAI Ecosystem" + 5 site icons]
```

**Code Snippet — Footer Component**:
```html
<footer class="site-footer">
  <div class="footer-grid">
    <div class="footer-brand">
      <img src="/assets/logo.svg" alt="{{SITE_NAME}}" />
      <p>{{TAGLINE}}</p>
    </div>
    <div class="footer-col">
      <h4>Programs</h4>
      <ul>
        <li><a href="https://csoai.org">CSOAI</a></li>
        <li><a href="https://councilof.ai">Council of AI</a></li>
        <li><a href="https://proofof.ai">Proof of Agency</a></li>
        <li><a href="https://safetyof.ai">Safety of AI</a></li>
        <li><a href="https://meok.ai">Meok</a></li>
      </ul>
    </div>
    <!-- ... additional columns ... -->
  </div>
  <div class="footer-bottom">
    <p>© {{YEAR}} {{SITE_NAME}}. Part of the <a href="https://meok.ai/ecosystem">CSOAI Ecosystem</a>.</p>
  </div>
</footer>
```

---

### H4: Cross-Site Auth Flow — Unified Authentication Specification

**Wireframe Description**:
```
[User visits Site A]
  → [Clicks "Log in"]
    → [Redirect to auth.meok.ai/login?return_to=siteA]
      → [Enter credentials]
        → [JWT issued with cross-site scope]
          → [Redirect back to Site A with token]
            → [Site A validates token via meok.ai/api/verify]
              → [Session established on Site A]
                → [Same token works on Sites B, C, D, E]
```

**Required Table — Auth State Matrix**:

| State | Site A | Site B | Site C | Action Required |
|-------|--------|--------|--------|-----------------|
| Logged in | Yes | Yes | Yes | None — token valid |
| Logged in | Yes | No | No | Auto-login on visit (silent) |
| Logged out | All | All | All | Clear all site cookies |
| Expired | Yes | Expired | Expired | Silent refresh via iframe |
| New signup | Yes | Pending | Pending | Show "Activate on other sites" prompt |

**Code Snippet — Cross-Site Auth Token**:
```javascript
// Token payload structure
{
  "sub": "user_uuid",
  "email": "user@example.com",
  "sites": ["csoai.org", "proofof.ai", "councilof.ai", "safetyof.ai", "meok.ai"],
  "roles": {
    "csoai.org": "member",
    "proofof.ai": "certified_level_2",
    "councilof.ai": "voter"
  },
  "iat": 1718000000,
  "exp": 1718600000
}
```

---

### H4: Event Pipeline — Cross-Site Analytics & Trigger Specification

**Required Table — Event Taxonomy**:

| Event Name | Trigger | Source Site | Data Payload | Cross-Sell Trigger |
|------------|---------|-------------|--------------|-------------------|
| `page.research.view` | View /research | csoai.org | paper_id, time_on_page | Flow 1 (if 2+ in 7d) |
| `page.pricing.view` | View /pricing | any | site, tier_clicked | Flow 5 (bundle upsell) |
| `certification.complete` | Pass evaluation | proofof.ai | level, system_name | Flow 2 (council invite) |
| `council.join` | Accept invite | councilof.ai | join_date, role | Flow 3 (safety at 14d) |
| `guide.download` | Click download | safetyof.ai | guide_id, email | Flow 4 (if 2+ in 7d) |
| `email.capture` | Submit email | any | email, source_page | — |
| `assessment.start` | Begin quiz | any | quiz_type, answers | — |

**Code Snippet — Event Tracking API**:
```javascript
// Cross-site event tracking
CSOAI.track('event_name', {
  site: 'csoai.org',           // originating site
  user_id: 'uuid',             // anonymous or identified
  event_data: { ... },         // event-specific payload
  timestamp: 'ISO_8601',       // event time
  session_id: 'session_uuid'   // for session stitching
});

// The event is sent to analytics.meok.ai/events
// which then evaluates cross-sell trigger conditions
```

**Chapter Validation Checklist**:
- [ ] Unified header spec with navigation items for all 5 sites
- [ ] Product switcher dropdown code
- [ ] Session state indicator code
- [ ] Footer component with 5-column layout
- [ ] Cross-site auth flow diagram
- [ ] Auth state matrix table
- [ ] JWT token payload specification
- [ ] Event taxonomy table with 7 event types
- [ ] Event tracking API code snippet

---

## Chapter 6: Content Strategy

**Chapter Word Count Target**: 10,000-12,000 words  
**Required Elements**: 4 hub briefs, 25 spoke page briefs with H2 outlines  
**Required Tables**: 4 (hub summaries), 25 (spoke spec sheets)

---

### H4: Hub 1 — EU AI Act Compliance (csoai.org/eu-ai-act)

**Hub Page Spec**:

| Element | Specification |
|---------|--------------|
| **H1** | The Complete EU AI Act Compliance Guide: 2025-2027 Implementation Roadmap |
| **Meta Description** | Master EU AI Act compliance with our step-by-step guide covering high-risk systems, conformity assessment, CE marking, GPAI obligations, and penalty structures. Updated for the Digital Omnibus timeline. |
| **Word Count** | 7,500-10,000 words |
| **Schema** | Article, FAQPage, HowTo, BreadcrumbList |
| **Target Keywords** | EU AI Act compliance guide, EU AI Act requirements, EU AI Act high-risk systems, EU AI Act timeline 2026, EU AI Act penalties |

**H2 Outline (13 sections)**:
1. What Is the EU AI Act? (Overview + Risk-Based Approach)
2. EU AI Act Implementation Timeline: 4 Critical Phases
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

**Spoke Pages (10)**:

| # | Spoke Page | Word Count | Target Keyword |
|---|-----------|------------|----------------|
| 1.1 | EU AI Act Article 50 Explained | 2,500-3,500 | EU AI Act Article 50 explained |
| 1.2 | EU AI Act High-Risk Systems Guide | 4,000-5,000 | EU AI Act high-risk systems |
| 1.3 | EU AI Act Penalties and Fines | 2,500-3,500 | EU AI Act penalties fines |
| 1.4 | EU AI Act GPAI Requirements | 3,000-4,000 | EU AI Act GPAI requirements |
| 1.5 | EU AI Act Conformity Assessment | 3,500-4,500 | EU AI Act conformity assessment |
| 1.6 | EU AI Act CE Marking Guide | 2,000-3,000 | EU AI Act CE marking |
| 1.7 | EU AI Act Post-Market Monitoring | 2,500-3,500 | EU AI Act post-market monitoring |
| 1.8 | EU AI Act SME Guide | 2,500-3,500 | EU AI Act SME guide |
| 1.9 | EU AI Act Article 12 Logging | 3,500-4,500 | EU AI Act Article 12 logging |
| 1.10 | EU AI Act vs GDPR | 2,000-3,000 | EU AI Act GDPR interaction |

---

### H4: Hub 2 — AI Governance Frameworks (csoai.org/frameworks)

**Hub Page Spec**:

| Element | Specification |
|---------|--------------|
| **H1** | AI Governance Frameworks: Complete Comparison of NIST, ISO 42001, EU AI Act & 20+ Others |
| **Meta Description** | Compare AI governance frameworks with our interactive crosswalk. Covers NIST AI RMF, ISO 42001, EU AI Act, DORA, NIS2, and 15+ more. |
| **Word Count** | 6,000-8,000 words |
| **Schema** | Article, FAQPage, Table |
| **Target Keywords** | AI governance framework comparison, NIST AI RMF guide, ISO 42001 certification |

**H2 Outline (10 sections)**:
1. What Is an AI Governance Framework?
2. The Three Layers of AI Governance
3. Binding Regulations: EU AI Act, GDPR, NIS2, DORA
4. Side-by-Side: NIST AI RMF vs. ISO 42001 vs. EU AI Act
5. Complete Framework Directory (20+ Frameworks)
6. The CSOAI Crosswalk Engine: How We Map 20+ Frameworks
7. Choosing the Right Framework for Your Organization
8. Building a Unified Cross-Framework Register
9. Certification Pathways: ISO 42001 and Beyond
10. Frequently Asked Questions

**Spoke Pages (6)**:

| # | Spoke Page | Word Count | Target Keyword |
|---|-----------|------------|----------------|
| 2.1 | NIST AI RMF Guide | 3,500-4,500 | NIST AI RMF guide |
| 2.2 | ISO 42001 Certification Guide | 4,000-5,000 | ISO 42001 AI management system |
| 2.3 | DORA AI Governance | 2,500-3,500 | DORA AI governance compliance |
| 2.4 | NIS2 Directive Compliance | 2,500-3,500 | NIS2 directive compliance AI |
| 2.5 | AI Governance Framework Crosswalk | 4,000-5,500 | AI governance framework crosswalk |
| 2.6 | AI Risk Management Comparison | 3,000-4,000 | AI risk management framework comparison |

---

### H4: Hub 3 — BFT Council Governance (councilof.ai/governance)

**Hub Page Spec**:

| Element | Specification |
|---------|--------------|
| **H1** | BFT Council Governance: How Multi-Agent AI Voting Creates Trustworthy AI Systems |
| **Meta Description** | Discover BFT Council governance for AI: 33-agent Byzantine Fault Tolerant voting, HMAC-signed audit trails, and multi-LLM consensus. |
| **Word Count** | 5,000-7,000 words |
| **Schema** | Article, FAQPage, HowTo |
| **Target Keywords** | Byzantine Fault Tolerance AI governance, multi-LLM voting AI safety, AI council governance model |

**H2 Outline (12 sections)**:
1. What Is BFT Council Governance for AI?
2. The Problem: Single-Model AI Governance Is a Single Point of Failure
3. Byzantine Fault Tolerance: From Distributed Systems to AI Governance
4. The 33-Agent BFT Council Architecture
5. Multi-LLM Voting: Why Diverse Models Vote
6. Cryptographic Audit Trails: HMAC-Signed Decision Receipts
7. EU AI Act Article 12 Compliance Through Cryptographic Logging
8. BFT Council vs. Single-Model Governance
9. Academic Foundations: Research and Theory
10. The CSOAI BFT Council in Production
11. Implementing BFT Governance in Your Organization
12. Frequently Asked Questions

**Spoke Pages (4)**:

| # | Spoke Page | Word Count | Target Keyword |
|---|-----------|------------|----------------|
| 3.1 | BFT AI Governance Technical Deep Dive | 3,500-4,500 | Byzantine Fault Tolerance AI governance |
| 3.2 | Multi-LLM Voting for AI Safety | 3,000-4,000 | multi-LLM voting AI safety |
| 3.3 | HMAC-Signed AI Audit Trails | 3,500-4,500 | HMAC signing AI compliance audit trail |
| 3.4 | AI Council Governance Model | 2,500-3,500 | AI council governance model |

---

### H4: Hub 4 — MCP Protocol Guide (proofof.ai/mcp-guide)

**Hub Page Spec**:

| Element | Specification |
|---------|--------------|
| **H1** | The Complete MCP Protocol Guide: Model Context Protocol for Enterprise AI (2025) |
| **Meta Description** | Master the Model Context Protocol with our comprehensive guide. Covers 294+ verified MCP servers, HMAC-signed attestations, security best practices. |
| **Word Count** | 5,000-7,000 words |
| **Schema** | Article, HowTo, FAQPage, SoftwareApplication |
| **Target Keywords** | Model Context Protocol explained, MCP server guide, MCP security best practices |

**H2 Outline (14 sections)**:
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

**Spoke Pages (5)**:

| # | Spoke Page | Word Count | Target Keyword |
|---|-----------|------------|----------------|
| 4.1 | Model Context Protocol Explained | 2,500-3,500 | Model Context Protocol explained |
| 4.2 | MCP Server Guide | 3,500-4,500 | MCP server guide |
| 4.3 | MCP Security Best Practices | 3,000-4,000 | MCP security best practices |
| 4.4 | MCP Registry Guide | 2,500-3,500 | MCP registry |
| 4.5 | Building MCP Servers Advanced | 3,000-4,000 | building MCP servers |

---

### H4: Content Hub Summary & Internal Linking Map

**Required Table — Hub Summary**:

| Hub | Site | Hub Pages | Spoke Pages | Total Words |
|-----|------|-----------|-------------|-------------|
| EU AI Act Compliance | csoai.org | 1 | 10 | 35,000-45,000 |
| AI Governance Frameworks | csoai.org | 1 | 6 | 25,000-32,000 |
| BFT Council Governance | councilof.ai | 1 | 4 | 17,000-22,000 |
| MCP Protocol Guide | proofof.ai | 1 | 5 | 19,000-25,000 |
| **TOTAL** | | **4** | **25** | **96,000-124,000** |

**Internal Linking Rules** (required in chapter):
1. Every spoke links to its parent hub (1 link, top of content)
2. Every spoke links to 2-3 related spokes within same hub
3. Every spoke links to 1-2 spokes from adjacent hubs (where relevant)
4. Every spoke links to 1-2 product pages (naturally placed)
5. Every spoke links to 2-3 authority external sources

**Chapter Validation Checklist**:
- [ ] 4 hub pages with full H2 outlines
- [ ] 25 spoke pages with word counts and target keywords
- [ ] Hub summary table with total word counts
- [ ] Internal linking rules documented
- [ ] Schema requirements per page specified
- [ ] Cross-hub connection map described

---

## Chapter 7: 90-Day Roadmap

**Chapter Word Count Target**: 5,000-7,000 words  
**Required Elements**: 30+ tasks with owners, effort, dependencies  
**Required Tables**: 3 (sprint breakdown, task matrix, dependency graph)

---

### H4: Sprint 1 — Foundation (Days 1-30)

**Required Table — Sprint 1 Tasks**:

| # | Task | Owner | Effort | Dependencies | Deliverable |
|---|------|-------|--------|--------------|-------------|
| 1.1 | Deploy robots.txt on all 5 sites | DevOps | 2h | None | `/robots.txt` live |
| 1.2 | Add Organization schema to all homepages | Frontend | 2h | None | JSON-LD in `<head>` |
| 1.3 | Add FAQPage schema (10 QAs) to all homepages | Content | 4h | 1.2 | FAQ JSON-LD |
| 1.4 | Create `/llms.txt` for csoai.org | Content | 1h | None | Live at `/llms.txt` |
| 1.5 | Create `/llms.txt` for proofof.ai | Content | 1h | None | Live at `/llms.txt` |
| 1.6 | Create `/llms.txt` for meok.ai | Content | 1h | None | Live at `/llms.txt` |
| 1.7 | Add Person schema for all founders | Frontend | 3h | Headshots | Bio pages with schema |
| 1.8 | Create pricing page (4 tiers) on proofof.ai | Frontend | 4h | Pricing approval | `/pricing` live |
| 1.9 | Implement announcement banner (all sites) | Frontend | 3h | Design approval | Banner component |
| 1.10 | Add hero email capture to csoai.org | Frontend | 2h | None | Email input + CTA |
| 1.11 | Write Hub 1 hub page (EU AI Act) | Content | 16h | Research | 8,000-word guide |
| 1.12 | Write Spoke 1.3 (Penalties) | Content | 6h | 1.11 | 3,000-word article |
| 1.13 | Write Spoke 1.5 (Conformity Assessment) | Content | 8h | 1.11 | 4,000-word article |
| 1.14 | Write Spoke 1.2 (High-Risk Systems) | Content | 9h | 1.11 | 4,500-word article |
| 1.15 | Set up cross-site event pipeline | Backend | 8h | Analytics account | Event tracking API |

**Sprint 1 Milestone**: "All 5 sites have baseline AEO infrastructure. Hub 1 hub page + 3 spokes published."

---

### H4: Sprint 2 — Differentiation (Days 31-60)

**Required Table — Sprint 2 Tasks**:

| # | Task | Owner | Effort | Dependencies | Deliverable |
|---|------|-------|--------|--------------|-------------|
| 2.1 | Write Hub 2 hub page (Governance Frameworks) | Content | 14h | Research | 7,000-word guide |
| 2.2 | Write Spoke 2.5 (Framework Crosswalk) | Content | 10h | 2.1 | 5,000-word article |
| 2.3 | Write Hub 3 hub page (BFT Council) | Content | 12h | Research | 6,000-word guide |
| 2.4 | Write Spoke 3.1 (BFT Deep Dive) | Content | 8h | 2.3 | 4,000-word article |
| 2.5 | Write Spoke 3.3 (HMAC Audit Trails) | Content | 8h | 2.3 | 4,000-word article |
| 2.6 | Write Hub 4 hub page (MCP Protocol) | Content | 12h | Research | 6,000-word guide |
| 2.7 | Write Spoke 4.1 (MCP Explained) | Content | 6h | 2.6 | 3,000-word article |
| 2.8 | Implement cross-sell trigger Flow 1 | Backend | 6h | 1.15 | Research→Certification flow |
| 2.9 | Implement cross-sell trigger Flow 2 | Backend | 4h | 1.15 | Certification→Council flow |
| 2.10 | Create `/verify` page | Frontend | 6h | API endpoint | Certificate verification |
| 2.11 | Create `/security` page | Frontend + Content | 6h | None | Trust Center live |
| 2.12 | Add BreadcrumbList schema (all sites) | Frontend | 3h | 1.2 | Breadcrumb JSON-LD |
| 2.13 | Implement product switcher dropdown | Frontend | 4h | Design | Cross-site nav |
| 2.14 | Write Spoke 1.9 (Article 12 Logging) | Content | 8h | 1.11 | 4,000-word article |
| 2.15 | Create comparison page (/compare/vanta) | Content + Frontend | 8h | Research | vs Vanta page |

**Sprint 2 Milestone**: "4 hub pages + 6 spokes published. 2 cross-sell flows active. /verify and /security live."

---

### H4: Sprint 3 — Depth (Days 61-90)

**Required Table — Sprint 3 Tasks**:

| # | Task | Owner | Effort | Dependencies | Deliverable |
|---|------|-------|--------|--------------|-------------|
| 3.1 | Write Spoke 2.2 (ISO 42001) | Content | 9h | 2.1 | 4,500-word article |
| 3.2 | Write Spoke 2.6 (Framework Comparison) | Content | 7h | 2.1 | 3,500-word article |
| 3.3 | Write Spoke 4.2 (MCP Server Guide) | Content | 8h | 2.6 | 4,000-word article |
| 3.4 | Write Spoke 4.3 (MCP Security) | Content | 7h | 2.6 | 3,500-word article |
| 3.5 | Write Spoke 1.1 (Article 50) | Content | 6h | 1.11 | 3,000-word article |
| 3.6 | Write Spoke 1.6 (CE Marking) | Content | 5h | 1.11 | 2,500-word article |
| 3.7 | Write Spoke 1.8 (SME Guide) | Content | 6h | 1.11 | 3,000-word article |
| 3.8 | Create `/docs` developer portal | Frontend + Content | 12h | API docs | Developer hub live |
| 3.9 | Create `/status` page | Frontend | 4h | Status API | Status page live |
| 3.10 | Create `/partners` page | Content + Frontend | 6h | None | Partners page live |
| 3.11 | Implement cross-sell Flow 3 | Backend | 4h | 2.8 | Council→Safety flow |
| 3.12 | Implement cross-sell Flow 4 | Backend | 4h | 2.8 | Safety→Ecosystem flow |
| 3.13 | Implement bundle upsell Flow 5 | Backend | 4h | 1.15 | Bundle trigger flow |
| 3.14 | Create `/ecosystem` page | Content + Frontend | 6h | None | Ecosystem map live |
| 3.15 | Create comparison pages (/compare/drata, /compare/credo) | Content + Frontend | 10h | Research | 3 comparison pages |
| 3.16 | Implement `@graph` schema stacking | Frontend | 4h | All schema | Stacked schemas |
| 3.17 | Create `/transparency` page | Content + Frontend | 6h | None | Transparency hub live |
| 3.18 | Set up automated dateModified updates | Backend | 4h | CMS | Auto freshness |
| 3.19 | Create `/.well-known/agent.json` | Backend | 4h | None | Agent Card live |
| 3.20 | Quarterly content freshness review | Content | 4h | All content | Updated timestamps |

**Sprint 3 Milestone**: "All 25 spokes published or in progress. All 5 cross-sell flows active. 7 missing pages live."

---

### H4: 90-Day Summary & Key Metrics

**Required Table — 90-Day Summary**:

| Metric | Target |
|--------|--------|
| Hub pages published | 4 |
| Spoke pages published | 20+ of 25 |
| Total content words | 95,000+ |
| AEO schemas deployed | 10 types across 5 sites |
| Cross-sell flows active | 5 |
| Missing pages created | 7 |
| Comparison pages live | 4 |
| Developer portal launched | Yes |

**Chapter Validation Checklist**:
- [ ] 15 Sprint 1 tasks with owners and effort
- [ ] 15 Sprint 2 tasks with owners and effort
- [ ] 20 Sprint 3 tasks with owners and effort
- [ ] Dependency chains identified
- [ ] 3 sprint milestones defined
- [ ] 90-day summary table with targets

---

## Chapter 8: Competitive Positioning

**Chapter Word Count Target**: 5,000-7,000 words  
**Required Elements**: 4 comparison pages, differentiation messaging, positioning framework  
**Required Tables**: 5 (comparison matrices)

---

### H4: Comparison Matrix — CSOAI vs All Competitors

**Required Table — Master Comparison**:

| Dimension | Vanta | Drata | Arthur.ai | Credo AI | CSOAI |
|-----------|-------|-------|-----------|----------|-------|
| **Navigation items** | 5 | 7 | 4 | 7 | 5-7 per site |
| **Primary CTA** | "Get a demo" | "Get Started" | "Get Started" | "Get a Demo" | "Get started" |
| **Pricing displayed** | No | No | Yes ($60/mo) | No | Yes (4 tiers) |
| **G2 Rating** | 4.6/5 | 4.8/5 | N/A | N/A | Building |
| **Open source** | No | No | Yes (Engine) | No | Yes (MCP) |
| **Developer portal** | Basic | Advanced (MCP) | Strong | Minimal | /docs |
| **Trust Center** | Yes | Yes | No | No | /security |
| **Comparison pages** | Yes | Yes (10+) | No | No | 4 planned |
| **EU AI Act content** | Yes | Yes | Partial | Strong | 10 spokes |
| **Schema markup** | JSON-LD | JSON-LD | JSON-LD | JSON-LD | Full @graph |
| **Announcement bar** | Purple | Blue | Green | Pink | Gradient |
| **AI positioning** | "Agentic Trust" | "Agentic Trust" | "AI governance" | "Govern AI" | "Optimized Intelligence" |

---

### H4: /compare/vanta — Comparison Page Spec

**Wireframe Description**:
```
[H1: "CSOAI vs Vanta: AI-Native Governance for the Intelligence Era"]
[Intro paragraph + "Why organizations choose CSOAI over Vanta"]
  |
  v
[Side-by-Side Feature Table]
  | Feature | Vanta | CSOAI |
  |---------|-------|-------|
  | AI-specific governance | Limited | Native |
  | BFT council voting | No | 33-agent |
  | MCP integration | No | 294 servers |
  | Certification framework | Compliance-only | Agency + Safety |
  | Cryptographic attestation | No | Ed25519 |
  | Open methodology | No | Yes |
  |
  v
["Why Teams Switch" — 3 testimonial cards]
[CTA: "Start Free Evaluation"]
[FAQ section — 5 QAs]
```

**Content Outline**:
- H1: "CSOAI vs Vanta: {{DIFFERENTIATOR}}"
- H2: "At a Glance" (summary comparison)
- H2: "Feature Comparison" (detailed table)
- H2: "Where Vanta Excels" (honest assessment — builds trust)
- H2: "Where CSOAI Excels" (differentiators)
- H2: "Why Organizations Switch" (testimonials)
- H2: "FAQ" (5 QAs)

**Word Count**: 2,500-3,500 words
**Schema**: Article, FAQPage, Table

---

### H4: /compare/drata — Comparison Page Spec

**Content Outline**:
- H1: "CSOAI vs Drata: Decentralized Trust vs. Centralized Compliance"
- Key differentiator: Drata has MCP integration (competitive) but no BFT governance
- Focus: Cryptographic verification vs. evidence collection
- Word Count: 2,500-3,500 words

---

### H4: /compare/arthur-ai — Comparison Page Spec

**Content Outline**:
- H1: "CSOAI vs Arthur.ai: Council-Based Monitoring vs. Model Observability"
- Key differentiator: Arthur has strong developer portal and open source
- Focus: Governance certification vs. model monitoring
- Word Count: 2,500-3,500 words

---

### H4: /compare/credo-ai — Comparison Page Spec

**Content Outline**:
- H1: "CSOAI vs Credo AI: Verifiable Governance vs. Policy Automation"
- Key differentiator: Credo has Forrester/Gartner recognition
- Focus: Cryptographic proof vs. policy packs
- Word Count: 2,500-3,500 words

---

### H4: Differentiation Messaging Framework

**Required Copy Template — Positioning Statements**:

```
For [AI safety researchers / compliance officers / developers],
who need [rigorous certification / verifiable governance / open methodologies],
CSOAI is a [nonprofit research ecosystem / certification authority / governance network]
that provides [cryptographic proof of AI safety / BFT council governance / open benchmarks].
Unlike [Vanta / Drata / Arthur.ai / Credo AI],
we [independently verify / cryptographically attest / openly publish]
because [trust requires proof, not promises].
```

**Required Table — Differentiation by Competitor**:

| Competitor | Their Strength | Our Counter | Messaging |
|------------|---------------|-------------|-----------|
| Vanta | 16,000 customers, G2 leader | No AI-native governance | "Trust requires proof, not just process" |
| Drata | MCP integration, 4.8 G2 | No BFT governance | "Verification without centralization" |
| Arthur.ai | Open source, developer portal | No certification authority | "Monitor your models. Prove their safety." |
| Credo AI | Forrester leader, Fortune 500 | No cryptographic proof | "Governance you can verify, not just automate" |

**Chapter Validation Checklist**:
- [ ] Master comparison table with 12 dimensions
- [ ] 4 comparison page specs with wireframes
- [ ] Differentiation messaging framework
- [ ] Positioning statement template
- [ ] Competitor-specific messaging table

---

## Global Validation Checklist

### Content Completeness
- [ ] Chapter 1: 11 code snippets, 2 tables
- [ ] Chapter 2: 5 trigger flows, 15 emails, 5 modals, 1 pricing table
- [ ] Chapter 3: 5 site sections, 5 priority tables, 4 code snippets
- [ ] Chapter 4: 7 page specs, 7 wireframes, 7 content outlines
- [ ] Chapter 5: Header/footer specs, auth flow, event pipeline
- [ ] Chapter 6: 4 hubs, 25 spokes, linking map
- [ ] Chapter 7: 50 tasks, 3 sprints, dependency tracking
- [ ] Chapter 8: 4 comparison pages, messaging framework

### Code Quality
- [ ] All code snippets have placeholder variables in {{BRACKETS}}
- [ ] All JSON-LD is valid syntax
- [ ] All HTML is semantic and accessible
- [ ] All JavaScript follows modern patterns

### Copy Quality
- [ ] All subject lines under 60 characters
- [ ] All CTA buttons use action verbs
- [ ] All headlines follow formula: [Benefit] + [Differentiator]
- [ ] All body copy is scannable (lists, short paragraphs)

### Implementability
- [ ] Every recommendation has a specific owner
- [ ] Every task has an effort estimate
- [ ] Every code snippet has a destination file/path
- [ ] Every page has a target URL

---

*End of Content Plan — 8 Chapters, 60,000+ words of specifications*
