# AEO Infrastructure Research: Complete Standards & Implementation Templates (2025)

**Research Date**: June 2025
**Scope**: CSOAI network (csoai.org, proofof.ai, councilof.ai, safetyof.ai, meok.ai, relevance.ai)
**Goal**: Production-ready templates for AI Search Optimization (AEO) infrastructure

---

## Table of Contents

1. [llms.txt Standard](#1-llmstxt-standard)
2. [AI Crawler Access & robots.txt](#2-ai-crawler-access--robotstxt)
3. [FAQPage Schema](#3-faqpage-schema)
4. [Organization & Person Schema](#4-organization--person-schema)
5. [A2A / Agent Discovery Protocols](#5-a2a--agent-discovery-protocols)
6. [/llm-info or /for-ai Identity Pages](#6-llm-info-pages)
7. [Article Schema, dateModified & Content Freshness](#7-article-schema--datemodified)
8. [Breadcrumb, Product & Review Schemas](#8-breadcrumb-product--review-schemas)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. llms.txt Standard

### Current Status (June 2025)

llms.txt is a **proposed standard** (not yet official) created by Jeremy Howard of Answer.AI in September 2024 [^47^][^48^]. It is a markdown file served at `/llms.txt` that provides LLM-friendly content summaries and links to help AI systems understand a website's structure without parsing complex HTML, ads, and JavaScript [^14^][^45^].

**Key Facts:**
- No major LLM provider has officially committed to crawling it yet [^49^]
- However, Anthropic requested llms.txt for their documentation on Mintlify [^18^]
- Google included llms.txt in their A2A protocol [^18^]
- Thousands of sites now serve `/llms.txt` [^49^]
- Low effort (1-4 hours) with potential long-term upside [^18^]
- AI agents are actively visiting `/llms.txt` files at growing rates [^45^]

### llms.txt File Specification

The file follows a specific markdown format [^47^][^48^][^50^]:

| Element | Requirement | Description |
|---------|-------------|-------------|
| H1 Heading | **Required** | Project or site name |
| Blockquote | Recommended | Short summary of the project |
| Detail Sections | Optional | Paragraphs/lists with more info (no headings) |
| H2 Sections | Optional | File lists organized by category |
| Link List Items | Recommended | Markdown links `[name](url)` with optional `: description` |
| "Optional" Section | Special | URLs that can be skipped for shorter context |

### File Locations

| File | Purpose | Location |
|------|---------|----------|
| `llms.txt` | Navigation/outline with links | `/.well-known/llms.txt` or `/llms.txt` |
| `llms-full.txt` | Complete site content in one file | `/llms-full.txt` |
| `.md` appended | Markdown version of individual pages | Same URL as page + `.md` |

### Production Template: llms.txt for csoai.org

```markdown
# Center for the Study of Optimized Intelligence (CSOAI)

> CSOAI is a nonprofit research organization dedicated to studying, measuring, and advancing optimized intelligence -- bridging human cognition, artificial intelligence, and collective decision-making systems.

Founded in 2024, CSOAI operates at the intersection of AI safety, cognitive science, and governance innovation. We publish research, convene expert councils, and develop open methodologies for measuring and improving intelligence outcomes across domains.

## About

- [About CSOAI](https://csoai.org/about): Mission, vision, and organizational overview
- [Team & Leadership](https://csoai.org/team): Founders, researchers, and advisory council
- [Research Methodology](https://csoai.org/methodology): Our approach to measuring optimized intelligence

## Research

- [Research Papers](https://csoai.org/research): Peer-reviewed publications and preprints
- [Annual Report 2024](https://csoai.org/annual-report-2024): Comprehensive year-in-review
- [Intelligence Optimization Framework](https://csoai.org/framework): Open methodology for measuring intelligence systems
- [Safety Benchmarks](https://csoai.org/safety-benchmarks): AI safety evaluation standards

## Programs

- [Council of AI](https://councilof.ai): Global expert council on AI governance
- [Proof of Agency](https://proofof.ai): Certification for autonomous AI systems
- [Safety of AI](https://safetyof.ai): AI safety research and best practices
- [Meok](https://meok.ai): Mothership entity and coordination layer
- [Relevance.ai](https://relevance.ai): Applied relevance optimization

## Governance

- [Bylaws](https://csoai.org/governance/bylaws): Organizational charter and operating rules
- [Ethics Policy](https://csoai.org/governance/ethics): Research ethics and conduct guidelines
- [Transparency Reports](https://csoai.org/governance/transparency): Quarterly public accountability reports

## Contact

- [General Inquiries](https://csoai.org/contact): Contact form and email
- [Press Kit](https://csoai.org/press): Media assets and press information
- [Partnerships](https://csoai.org/partners): Collaboration and sponsorship opportunities

## Optional

- [Blog Archive](https://csoai.org/blog): Historical blog posts and updates
- [Newsletter Archive](https://csoai.org/newsletter): Past newsletter editions
- [Event Recordings](https://csoai.org/events): Recordings of past events and webinars
```

### Production Template: llms.txt for proofof.ai

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

### Production Template: llms.txt for meok.ai (Mothership)

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

### Implementation Instructions for llms.txt

1. **Create the file**: Save as plain markdown (`.txt` extension, markdown content)
2. **Place at root**: Serve at `/llms.txt` (or `/.well-known/llms.txt`)
3. **Content**: Include H1, blockquote summary, H2 sections with curated links
4. **Optional section**: Use for lower-priority content that can be skipped
5. **Keep updated**: Refresh when site structure changes
6. **Also create**: `/llms-full.txt` with complete content if documentation-heavy
7. **Link in HTML**: Add `<link rel="alternate" type="text/markdown" href="/llms.txt" />`

### Validation

- Verify raw markdown is accessible at `https://yourdomain.com/llms.txt`
- Check with parser tools: `llms_txt2ctx` CLI [^47^]
- Browse directories: llmstxt.site, directory.llmstxt.cloud [^50^]

---

## 2. AI Crawler Access & robots.txt

### Complete AI Crawler Reference (June 2025)

Based on research from Anagram.ai [^3^], BotRank [^4^], and Momentic Marketing [^5^], here are all major AI crawlers:

| User-Agent | Vendor | Purpose | robots.txt Policy |
|------------|--------|---------|-------------------|
| `GPTBot` | OpenAI | Model training data collection | Allow/Disallow per policy |
| `OAI-SearchBot` | OpenAI | ChatGPT search indexing | **ALLOW** for AI search visibility |
| `ChatGPT-User` | OpenAI | User-initiated page fetch | **ALLOW** |
| `ChatGPT-User/2.0` | OpenAI | User-initiated fetch (v2) | **ALLOW** |
| `ClaudeBot` | Anthropic | Model training | Allow/Disallow per policy |
| `Claude-SearchBot` | Anthropic | Search indexing | **ALLOW** for AI search visibility |
| `Claude-User` | Anthropic | User-initiated fetch | **ALLOW** |
| `anthropic-ai` | Anthropic | Legacy training crawler | Allow/Disallow per policy |
| `PerplexityBot` | Perplexity | Search index building | **ALLOW** for AI search visibility |
| `Perplexity-User` | Perplexity | User-triggered visit | **ALLOW** |
| `Google-Extended` | Google | Gemini AI training control | Allow/Disallow per policy |
| `Googlebot` | Google | Google Search indexing | **ALLOW** (essential for SEO) |
| `GoogleOther` | Google | Generic product team crawler | **ALLOW** |
| `Bingbot` | Microsoft | Bing Search / Copilot | **ALLOW** |
| `Applebot` | Apple | Apple Search / Siri | **ALLOW** |
| `Applebot-Extended` | Apple | Apple AI training | Allow/Disallow per policy |
| `Amazonbot` | Amazon | Alexa / AI products | **ALLOW** |
| `FacebookBot` | Meta | Meta AI products | **ALLOW** |
| `meta-externalagent` | Meta | Meta external crawler | **ALLOW** |
| `LinkedInBot` | LinkedIn | Content sharing | **ALLOW** |
| `Bytespider` | ByteDance / TikTok | AI training | **ALLOW** (may not respect robots.txt) |
| `cohere-ai` | Cohere | Model training | Allow/Disallow per policy |
| `CCBot` | Common Crawl | Open web dataset | **ALLOW** (widely used for training) |
| `AI2Bot` | Allen Institute | AI research | **ALLOW** |
| `DuckAssistBot` | DuckDuckGo | AI search | **ALLOW** |
| `Diffbot` | Diffbot | Knowledge graph | **ALLOW** |

### Production robots.txt Template

```
# ============================================
# CSOAI Network -- AI Crawler Access Policy
# Last Updated: June 2025
# ============================================

# --- OPENAI ---
# Training crawler -- disallow for content protection
User-agent: GPTBot
Disallow: /

# Search indexing -- CRITICAL for AI search visibility
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

# Search indexing -- CRITICAL for AI search visibility
User-agent: Claude-SearchBot
Allow: /

# User-initiated fetches
User-agent: Claude-User
Allow: /

# Legacy training crawler
User-agent: anthropic-ai
Disallow: /

# --- PERPLEXITY ---
# Search indexing -- CRITICAL for AI search visibility
User-agent: PerplexityBot
Allow: /

# User-triggered visits
User-agent: Perplexity-User
Allow: /

# --- GOOGLE ---
# Google Search -- essential for SEO
User-agent: Googlebot
Allow: /

# AI training control (does NOT affect Google Search)
User-agent: Google-Extended
Allow: /

# Generic Google crawler
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

# --- SITEMAPS ---
Sitemap: https://csoai.org/sitemap.xml
Sitemap: https://proofof.ai/sitemap.xml
Sitemap: https://councilof.ai/sitemap.xml
Sitemap: https://safetyof.ai/sitemap.xml
Sitemap: https://meok.ai/sitemap.xml
Sitemap: https://relevance.ai/sitemap.xml
```

### Best Practices [^3^][^5^]

1. **List crawlers individually** -- never rely on a single wildcard rule
2. **Add a directive after every `User-agent:`** -- at least one `Allow:` or `Disallow:`
3. **Use blank lines between blocks** for readability
4. **Allow search/user agents, disallow training agents** selectively
5. **Re-test after major LLM releases** -- new versions may have new user-agent strings
6. **Monitor server logs** for new/unknown AI crawlers
7. **OAI-SearchBot**: Blocking removes site from ChatGPT search answers [^3^]
8. **Claude-SearchBot**: Independent from ClaudeBot -- needs separate directive [^3^]
9. **PerplexityBot**: Primary bot for Perplexity AI search indexing [^5^]

### Validation

- **Google robots.txt Tester**: Search Console > Crawl > robots.txt Tester
- **Browser test**: Visit `https://yourdomain.com/robots.txt` directly
- **Server logs**: Monitor for AI crawler user-agent strings
- **Anagram.ai**: AI visibility auditing tool [^3^]

---

## 3. FAQPage Schema

### Why FAQPage Schema Matters for AI Search

FAQPage schema is the **single highest-impact schema implementation** for AEO and AI citation [^2^][^7^]. It creates standalone Q&A pairs that LLMs can extract and cite independently [^2^].

Key findings:
- FAQPage schema structures content in the exact format LLMs prefer when generating answers [^2^]
- Google's systems restrict FAQ rich results display to government/health sites, but the markup still helps ALL AIs identify and extract answers [^7^]
- Pages with FAQ schema are significantly more likely to appear in AI Overviews [^34^]
- Triple-schema stacking (FAQPage + Article + HowTo) produces **1.8x more AI citations** than Article schema alone [^2^]
- Keep answers between **40-110 words** -- long enough to be complete, short enough to be directly extractable [^2^]
- Align FAQ questions with how users actually phrase queries to AI platforms [^2^]
- Limit to **5-10 questions per page** [^7^]

### Production Template: FAQPage JSON-LD (10 Questions)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://csoai.org/faq#faqpage",
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
        "text": "The Council of AI is a global expert body convened by CSOAI to develop governance recommendations for advanced AI systems. It brings together researchers, ethicists, policymakers, and industry leaders to produce actionable guidance on AI safety, deployment standards, and international coordination. The Council publishes position papers, policy recommendations, and technical standards that inform public and private decision-making."
      }
    },
    {
      "@type": "Question",
      "name": "How can organizations get involved with CSOAI's research programs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Organizations can engage with CSOAI through multiple pathways: joining the Council of AI as a contributing member, submitting AI systems for Proof of Agency certification, sponsoring specific research initiatives, participating in our open source methodology development, or attending our public conferences and workshops. Partnership inquiries can be submitted through the contact form on our website."
      }
    },
    {
      "@type": "Question",
      "name": "What makes CSOAI's approach to AI safety different from other organizations?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CSOAI uniquely combines rigorous measurement science with practical certification frameworks. Rather than focusing solely on theoretical safety research or broad policy advocacy, we develop actionable, testable standards that organizations can implement today. Our open methodologies, public registries, and interdisciplinary approach -- bridging technical AI research with cognitive science and governance -- create a comprehensive ecosystem for intelligence optimization."
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
        "text": "Yes. CSOAI is committed to open research. All methodologies, frameworks, benchmark datasets, and evaluation tools are published under permissive open source licenses. We believe that transparent, reproducible research is essential for advancing the field of optimized intelligence. Our GitHub repositories contain implementation code, documentation, and contribution guidelines."
      }
    },
    {
      "@type": "Question",
      "name": "How does CSOAI ensure its certifications are trustworthy and impartial?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CSOAI maintains independence through a multi-layered governance structure: our Oversight Board includes independent experts with no financial ties to certified organizations, all evaluation criteria are published and community-reviewed, certification decisions require unanimous board approval, and complete evaluation reports are made publicly available. We also maintain a transparent appeals process for challenging certifications."
      }
    },
    {
      "@type": "Question",
      "name": "What is the relationship between CSOAI, Meok, and the program sites?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CSOAI is the primary nonprofit research organization. Meok serves as the coordination layer -- the 'mothership' that provides shared infrastructure and strategic alignment across all programs. Council of AI, Proof of Agency, Safety of AI, and Relevance.ai are specialized program sites, each focused on a specific domain within the optimized intelligence ecosystem. Together, they form an integrated network of research, governance, and application initiatives."
      }
    }
  ]
}
</script>
```

### Implementation Best Practices [^2^][^6^][^7^][^8^]

1. **Place JSON-LD in `<head>`** or immediately before `</body>`
2. **Each answer must be self-contained** -- make sense without surrounding content
3. **Keep answers 40-110 words** -- directly extractable by LLMs [^2^]
4. **Match real AI prompt patterns** -- "What is...", "How does...", "Why..."
5. **FAQ content must be visible on page** -- not only in JSON-LD
6. **Limit 5-10 questions per page** [^7^]
7. **Use `@graph` stacking** with Article schema for 1.8x citation lift [^2^]
8. **Validate before publishing** -- malformed FAQPage is silently ignored

### Validation

- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema.org Validator**: https://validator.schema.org/
- Check in server-rendered HTML (not client-side JS)

---

## 4. Organization & Person Schema

### Organization Schema Best Practices

Organization schema establishes company identity, powers Google's Knowledge Panel, and connects social profiles via `sameAs` [^9^]. Use `@id` references to link Organization across all pages for entity consolidation [^11^][^12^].

**Critical properties:** [^12^]
- `name`: Legal company name
- `url`: Homepage URL
- `logo`: Logo URL (minimum 112x112px PNG)
- `description`: 2-3 sentence summary
- `contactPoint`: Phone/email
- `sameAs`: Social profile URLs (LinkedIn, X, Wikipedia)
- `foundingDate`: ISO 8601 date
- `address`: Physical address (for trust signals)

### Production Template: Organization JSON-LD

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://csoai.org/#organization",
  "name": "Center for the Study of Optimized Intelligence",
  "alternateName": "CSOAI",
  "url": "https://csoai.org",
  "logo": {
    "@type": "ImageObject",
    "@id": "https://csoai.org/#logo",
    "url": "https://csoai.org/assets/logo.png",
    "width": 512,
    "height": 512
  },
  "description": "CSOAI is a nonprofit research organization dedicated to studying, measuring, and advancing optimized intelligence -- bridging human cognition, artificial intelligence, and collective decision-making systems. We publish open research, convene expert councils, and develop certification frameworks for AI safety and agency.",
  "foundingDate": "2024",
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+1-XXX-XXX-XXXX",
      "email": "contact@csoai.org",
      "contactType": "General Inquiries",
      "availableLanguage": ["English"]
    },
    {
      "@type": "ContactPoint",
      "telephone": "+1-XXX-XXX-XXXX",
      "email": "press@csoai.org",
      "contactType": "Media Relations",
      "availableLanguage": ["English"]
    }
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[Street Address]",
    "addressLocality": "[City]",
    "addressRegion": "[State/Region]",
    "postalCode": "[ZIP]",
    "addressCountry": "US"
  },
  "sameAs": [
    "https://www.linkedin.com/company/csoai",
    "https://twitter.com/csoai_org",
    "https://github.com/csoai",
    "https://www.crunchbase.com/organization/csoai",
    "https://www.wikidata.org/entity/[QID]",
    "https://en.wikipedia.org/wiki/[PAGE]"
  ],
  "parentOrganization": {
    "@type": "Organization",
    "@id": "https://meok.ai/#organization"
  },
  "subOrganization": [
    {
      "@type": "Organization",
      "@id": "https://councilof.ai/#organization"
    },
    {
      "@type": "Organization",
      "@id": "https://proofof.ai/#organization"
    },
    {
      "@type": "Organization",
      "@id": "https://safetyof.ai/#organization"
    },
    {
      "@type": "Organization",
      "@id": "https://relevance.ai/#organization"
    }
  ],
  "knowsAbout": [
    "Artificial Intelligence Safety",
    "Optimized Intelligence",
    "AI Governance",
    "AI Certification",
    "Collective Intelligence",
    "Machine Learning",
    "AI Policy"
  ],
  "memberOf": [
    {
      "@type": "Organization",
      "name": "Partnership on AI"
    }
  ]
}
</script>
```

### Person Schema Best Practices

Person schema is critical for E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness). Every author should have Person markup with verifiable credentials [^2^][^8^][^32^].

**Critical properties:**
- `name`: Full name
- `@id`: Stable identifier for entity merging across articles
- `sameAs`: LinkedIn, X, personal site, Wikipedia, Google Scholar
- `jobTitle`: Current role
- `worksFor`: Organization reference
- `alumniOf`: Educational credentials
- `knowsAbout`: Expertise areas

### Production Template: Person JSON-LD (Founder/Author)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://csoai.org/team/[founder-slug]#person",
  "name": "[Founder Full Name]",
  "alternateName": "[Preferred Name / Handle]",
  "url": "https://csoai.org/team/[founder-slug]",
  "image": {
    "@type": "ImageObject",
    "url": "https://csoai.org/assets/team/[founder-photo].jpg",
    "width": 800,
    "height": 800
  },
  "description": "[2-3 sentence bio describing expertise, role at CSOAI, and key achievements. Example: Leading researcher in AI safety and optimized intelligence with 15+ years of experience across academia and industry. Formerly at [Previous Org]. Holds a Ph.D. in [Field] from [University].]",
  "jobTitle": "[Title, e.g., Executive Director & Co-Founder]",
  "worksFor": {
    "@type": "Organization",
    "@id": "https://csoai.org/#organization"
  },
  "affiliation": [
    {
      "@type": "Organization",
      "name": "CSOAI",
      "sameAs": "https://csoai.org"
    },
    {
      "@type": "Organization",
      "name": "[Previous Organization]",
      "sameAs": "https://[prev-org-url]"
    }
  ],
  "alumniOf": [
    {
      "@type": "CollegeOrUniversity",
      "name": "[University Name]",
      "sameAs": "https://en.wikipedia.org/wiki/[University]"
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
    },
    {
      "@type": "Thing",
      "name": "AI Governance",
      "sameAs": "https://en.wikipedia.org/wiki/Regulation_of_artificial_intelligence"
    }
  ],
  "sameAs": [
    "https://www.linkedin.com/in/[username]",
    "https://twitter.com/[username]",
    "https://github.com/[username]",
    "https://scholar.google.com/citations?user=[ID]",
    "https://www.crunchbase.com/person/[username]",
    "https://orcid.org/[orcid-id]"
  ]
}
</script>
```

### Using Person as Author in Article Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title",
  "author": {
    "@type": "Person",
    "@id": "https://csoai.org/team/[founder-slug]#person",
    "name": "[Founder Full Name]",
    "url": "https://csoai.org/team/[founder-slug]",
    "image": "https://csoai.org/assets/team/[founder-photo].jpg",
    "jobTitle": "[Title]",
    "worksFor": {
      "@type": "Organization",
      "name": "CSOAI"
    },
    "sameAs": [
      "https://www.linkedin.com/in/[username]",
      "https://twitter.com/[username]"
    ]
  }
}
```

**Key points for author Person schema** [^32^]:
- Use a **stable `@id`** for every article the person authors -- Google merges them into one entity
- Always include `sameAs` with at least one canonical profile (LinkedIn, Wikidata, X) for disambiguation
- This feeds the **byline** Google may show under articles in SERP

### Implementation Best Practices [^11^][^12^][^32^]

1. **Organization on homepage only** -- one per site, don't duplicate [^12^]
2. **Use `@id` references** to link Organization across all pages for entity consolidation
3. **`@graph` stacking**: Combine Organization, WebSite, BreadcrumbList in one script
4. **Person schema on**: author pages, about pages, bio pages, article templates
5. **Update immediately** when job titles, affiliations, or contact info changes
6. **sameAs is critical** -- gives AI crawlers independent sources to cross-reference credentials [^2^]

### Validation

- Google Rich Results Test
- Schema.org Validator
- Check Knowledge Panel triggers for Person/Organization

---

## 5. A2A / Agent Discovery Protocols

### Current Status (June 2025)

Google's Agent2Agent (A2A) Protocol, launched April 2025, defines how AI agents discover each other, negotiate capabilities, delegate tasks, and exchange results [^35^][^41^]. The protocol is now under the Linux Foundation's Agentic AI Foundation [^35^].

**Key Concepts:** [^35^]
- **Agent Card**: JSON document at `/.well-known/agent.json` describing agent capabilities
- **Task**: Fundamental unit of work with lifecycle states
- **Message**: Communication turn between agents
- **Part**: Actual content (text, files, structured data)
- **Artifact**: Output generated by remote agent

**A2A vs MCP:** [^35^]
- **MCP** (Anthropic): Connects agents to tools/data -- like USB-C
- **A2A** (Google): Connects agents to other agents -- like phone network
- They are **complementary**, not competing

### Agent Card Specification

The Agent Card lives at `/.well-known/agent.json` [^35^][^41^]:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Human-readable agent name |
| `description` | string | What the agent does |
| `url` | string | Endpoint URL for agent |
| `version` | string | Semantic version |
| `capabilities` | object | `streaming`, `pushNotifications` booleans |
| `authentication` | object | Auth schemes (e.g., `bearer`) |
| `skills` | array | List of available skills with id, name, description, tags, examples |
| `defaultInputModes` | array | Accepted input formats |
| `defaultOutputModes` | array | Output formats provided |

### Production Template: agent.json

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

### Implementation Instructions

1. **Create `agent.json`** file with the Agent Card content above
2. **Place at**: `/.well-known/agent.json` (MUST follow RFC 8615 well-known URI)
3. **Ensure CORS headers** allow cross-origin access: `Access-Control-Allow-Origin: *`
4. **Serve with correct Content-Type**: `application/json`
5. **Implement the A2A endpoint** at the `url` specified in the Agent Card
6. **Support JSON-RPC 2.0** over HTTP(S) as the messaging format [^35^]
7. **Document skills clearly** with examples of natural language queries

### Discovery Flow

```
1. Discovery: Client fetches /.well-known/agent.json
2. Capability Review: Client examines skills, auth requirements
3. Task Creation: Client sends tasks/send request
4. Processing: Server processes task, may request additional input
5. Completion: Server returns artifacts, marks task complete
```

### Validation

- Verify `/.well-known/agent.json` is publicly accessible
- Test with A2A client library
- Validate JSON-RPC 2.0 endpoint responses
- Check CORS headers are configured correctly

---

## 6. /llm-info Pages

### Current Status

The concept of dedicated AI-readable pages is debated. Jason Barnard argues that standalone root-level "for AI" pages can **violate single source of truth** by duplicating canonical signals from About/Entity Home pages, potentially diluting AI confidence [^37^].

However, many practitioners recommend creating structured identity pages specifically designed for AI consumption. The key is to make them **unique, context-rich, and integrated** into site hierarchy rather than standalone duplicates [^37^].

### Recommended Approach

Instead of a standalone `/llm-info` page that duplicates About content, create **structured, AI-optimized About/Identity pages** that:

1. Are integrated into normal site hierarchy (with breadcrumbs, internal links)
2. Contain comprehensive, factual, machine-readable information
3. Include all critical entity data (Organization, Person schemas)
4. Serve as the canonical "Entity Home" for your brand

### Production Template: /about/llm (Integrated AI Identity Page)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSOAI -- AI-Readable Identity & Overview</title>
  <meta name="description" content="Machine-readable identity overview for the Center for the Study of Optimized Intelligence (CSOAI). Mission, programs, leadership, and key facts.">
  
  <!-- Organization Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://csoai.org/#organization",
        "name": "Center for the Study of Optimized Intelligence",
        "alternateName": "CSOAI",
        "url": "https://csoai.org",
        "description": "Nonprofit research organization studying optimized intelligence across human, artificial, and collective systems.",
        "foundingDate": "2024",
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "contact@csoai.org",
          "contactType": "General Inquiries"
        }
      },
      {
        "@type": "WebPage",
        "@id": "https://csoai.org/about/llm#webpage",
        "url": "https://csoai.org/about/llm",
        "name": "CSOAI Identity Overview",
        "isPartOf": { "@id": "https://csoai.org/#website" }
      }
    ]
  }
  </script>
  
  <!-- LLM-readable alternate -->
  <link rel="alternate" type="text/markdown" href="/about/llm.md" title="LLM-friendly version">
</head>
<body>
  <main>
    <h1>Center for the Study of Optimized Intelligence (CSOAI)</h1>
    
    <section id="identity">
      <h2>Organization Identity</h2>
      <p><strong>Legal Name:</strong> Center for the Study of Optimized Intelligence</p>
      <p><strong>Short Name:</strong> CSOAI</p>
      <p><strong>Type:</strong> Nonprofit Research Organization</p>
      <p><strong>Founded:</strong> 2024</p>
      <p><strong>Mission:</strong> To study, measure, and advance optimized intelligence across human cognition, artificial intelligence, and collective decision-making systems.</p>
      <p><strong>Website:</strong> <a href="https://csoai.org">csoai.org</a></p>
      <p><strong>Contact:</strong> contact@csoai.org</p>
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
        <li>[Founder Name], Executive Director & Co-Founder</li>
        <li>[Co-Founder Name], Research Director & Co-Founder</li>
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
        <li>CSOAI is independent of any commercial AI company</li>
        <li>The organization accepts no funding from organizations it certifies</li>
        <li>All evaluation reports are publicly available</li>
      </ul>
    </section>
    
    <section id="verification">
      <h2>Verification Sources</h2>
      <ul>
        <li>LinkedIn: https://www.linkedin.com/company/csoai</li>
        <li>GitHub: https://github.com/csoai</li>
        <li>Twitter/X: https://twitter.com/csoai_org</li>
        <li>Crunchbase: https://www.crunchbase.com/organization/csoai</li>
      </ul>
    </section>
  </main>
</body>
</html>
```

### Implementation Best Practices

1. **Integrate into site hierarchy** -- NOT standalone at root [^37^]
2. **Link from About page** with clear breadcrumb navigation
3. **Include comprehensive schema** (Organization, Person, WebPage)
4. **Provide markdown alternate** via `.md` suffix or `/llms.txt` reference
5. **Keep factual and current** -- update when leadership/research areas change
6. **Don't duplicate About content** -- extend it with machine-optimized structure

---

## 7. Article Schema, dateModified & Content Freshness

### Why Content Freshness Matters for AI Search

AI search engines strongly prefer fresh content [^33^][^38^]:
- **50% of AI search citations** come from content less than 13 weeks old [^33^]
- AI citations prefer content **25.7% fresher** than traditional search results [^38^]
- **68.7% of ChatGPT-cited pages** follow logical heading hierarchies [^33^]
- **61% employ three or more schema types** (13% higher citation likelihood) [^33^]
- Stale `dateModified` is an **active citation disadvantage** [^2^]

### Content Freshness Signals AI Crawlers Use [^33^][^38^]

1. **Schema `dateModified`** -- most explicit freshness signal
2. **HTTP `Last-Modified` header** -- server-level signal
3. **Visible date stamps** on page
4. **Content diff between crawls** -- actual changes matter
5. **Sitemap `lastmod`** -- XML sitemap date
6. **Year references in content** -- "in 2025" signals topical freshness

### Production Template: Article JSON-LD with dateModified

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://csoai.org/blog/article-slug#article",
  "headline": "Article Title Here (max 110 characters)",
  "description": "Meta description text summarizing the article content for search and AI systems.",
  "url": "https://csoai.org/blog/article-slug",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://csoai.org/blog/article-slug"
  },
  "image": [
    "https://csoai.org/assets/blog/article-slug-og.jpg"
  ],
  "datePublished": "2025-01-15T08:00:00+00:00",
  "dateModified": "2025-06-10T14:30:00+00:00",
  "author": {
    "@type": "Person",
    "@id": "https://csoai.org/team/author-slug#person",
    "name": "[Author Name]",
    "url": "https://csoai.org/team/author-slug",
    "sameAs": [
      "https://www.linkedin.com/in/[username]"
    ]
  },
  "publisher": {
    "@type": "Organization",
    "@id": "https://csoai.org/#organization"
  },
  "articleSection": "Research",
  "keywords": ["optimized intelligence", "AI safety", "research"],
  "inLanguage": "en",
  "isAccessibleForFree": true,
  "copyrightHolder": {
    "@type": "Organization",
    "@id": "https://csoai.org/#organization"
  },
  "copyrightYear": "2025",
  "license": "https://creativecommons.org/licenses/by/4.0/"
}
</script>
```

### dateModified Best Practices [^33^][^38^]

1. **Must reflect actual content changes** -- not automated timestamp updates [^38^]
2. **Use ISO 8601 format**: `YYYY-MM-DDTHH:MM:SS+00:00`
3. **Update when**: new sections added, statistics refreshed, recommendations changed [^38^]
4. **Don't update for**: typo fixes, image swaps, minor formatting [^38^]
5. **Quarterly minimum** for core pages, **monthly** for competitive/comparison pages [^33^]
6. **Match visible on-page dates** with schema dates
7. **Update sitemap `lastmod`** simultaneously
8. **John Mueller (Google)**: "Don't artificially freshen a story without adding significant information" [^38^]

### HTTP Last-Modified Header

Configure your server/CDN to set accurate `Last-Modified` headers:

```apache
# Apache .htaccess or virtual host
<FilesMatch "\.(html|php)$">
    Header set Last-Modified "expr=%{TIME_YEAR}-%{TIME_MON}-%{TIME_DAY}"
</FilesMatch>
```

```nginx
# Nginx
location ~* \.(html|php)$ {
    add_header Last-Modified $date_gmt;
}
```

---

## 8. Breadcrumb, Product & Review Schemas

### BreadcrumbList Schema

BreadcrumbList provides navigational context for every non-homepage page [^39^].

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://csoai.org/research/paper-slug#breadcrumb",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://csoai.org/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Research",
      "item": "https://csoai.org/research"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Paper Title Here"
    }
  ]
}
</script>
```

### SoftwareApplication Schema (for SaaS/Platform)

For SaaS products like CSOAI's certification platform [^36^][^39^]:

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
      "priceValidUntil": "2025-12-31"
    },
    {
      "@type": "Offer",
      "name": "Professional Certification",
      "description": "Full agency certification with expert review and public registry listing",
      "price": "5000",
      "priceCurrency": "USD",
      "priceValidUntil": "2025-12-31"
    },
    {
      "@type": "Offer",
      "name": "Enterprise Certification",
      "description": "Comprehensive evaluation for complex multi-agent systems with ongoing monitoring",
      "price": "25000",
      "priceCurrency": "USD",
      "priceValidUntil": "2025-12-31"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "47",
    "bestRating": "5",
    "worstRating": "1"
  },
  "featureList": [
    "Automated safety benchmarking",
    "Multi-tier certification levels",
    "Public certification registry",
    "API access for continuous monitoring",
    "Expert panel review"
  ],
  "softwareVersion": "2.1.0",
  "releaseNotes": "https://proofof.ai/changelog",
  "publisher": {
    "@type": "Organization",
    "@id": "https://csoai.org/#organization"
  }
}
</script>
```

### Review Schema (B2B Context)

For B2B, only use Review schema if you have **genuine, visible, first-party reviews** on the page [^36^]:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Review",
  "@id": "https://proofof.ai/reviews/review-1#review",
  "itemReviewed": {
    "@type": "SoftwareApplication",
    "@id": "https://proofof.ai/#software"
  },
  "author": {
    "@type": "Person",
    "name": "[Reviewer Name]",
    "jobTitle": "[Title]",
    "worksFor": {
      "@type": "Organization",
      "name": "[Company Name]"
    }
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5"
  },
  "reviewBody": "Proof of Agency provided a rigorous, transparent evaluation process that gave our team and our customers confidence in our system's safety profile. The certification has become a key differentiator in enterprise sales conversations.",
  "datePublished": "2025-05-15",
  "publisher": {
    "@type": "Organization",
    "@id": "https://csoai.org/#organization"
  }
}
</script>
```

### Complete @graph Stack (Recommended)

Combine all schemas on a single page using `@graph` [^11^]:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://csoai.org/#organization",
      "name": "Center for the Study of Optimized Intelligence",
      "url": "https://csoai.org",
      "logo": "https://csoai.org/assets/logo.png",
      "sameAs": ["https://linkedin.com/company/csoai", "https://twitter.com/csoai_org"]
    },
    {
      "@type": "WebSite",
      "@id": "https://csoai.org/#website",
      "url": "https://csoai.org",
      "name": "CSOAI",
      "publisher": { "@id": "https://csoai.org/#organization" }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://csoai.org" },
        { "@type": "ListItem", "position": 2, "name": "Research", "item": "https://csoai.org/research" },
        { "@type": "ListItem", "position": 3, "name": "Article Title" }
      ]
    },
    {
      "@type": "Article",
      "@id": "https://csoai.org/research/article-slug#article",
      "headline": "Article Title",
      "datePublished": "2025-01-15T08:00:00+00:00",
      "dateModified": "2025-06-10T14:30:00+00:00",
      "author": { "@id": "https://csoai.org/team/author#person" },
      "publisher": { "@id": "https://csoai.org/#organization" }
    },
    {
      "@type": "FAQPage",
      "@id": "https://csoai.org/research/article-slug#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Example question?",
          "acceptedAnswer": { "@type": "Answer", "text": "Example answer text here." }
        }
      ]
    }
  ]
}
</script>
```

---

## 9. Implementation Checklist

### P0 -- Critical (Implement Within 1 Week)

| # | Task | Sites | Effort |
|---|------|-------|--------|
| 1 | Create `/robots.txt` with AI crawler allowances (all user-agents listed above) | All 6 sites | 2h |
| 2 | Add `Organization` JSON-LD schema to all homepages | All 6 sites | 2h |
| 3 | Add `Person` JSON-LD schema for all founders/leadership | All 6 sites | 3h |
| 4 | Add `FAQPage` JSON-LD (5-10 QAs) to all homepages | All 6 sites | 4h |
| 5 | Validate all schemas with Google Rich Results Test | All 6 sites | 2h |
| 6 | Add `datePublished` and `dateModified` to all Article/BlogPosting schemas | All 6 sites | 2h |
| 7 | Create `/llms.txt` files for csoai.org, proofof.ai, meok.ai | 3 sites | 3h |

### P1 -- High Priority (Implement Within 2 Weeks)

| # | Task | Sites | Effort |
|---|------|-------|--------|
| 8 | Add `BreadcrumbList` schema to all non-home pages | All 6 sites | 3h |
| 9 | Implement `SoftwareApplication` + `Offer` schema on proofof.ai pricing | proofof.ai | 2h |
| 10 | Add `WebSite` schema with `SearchAction` for sitelinks search box | All 6 sites | 2h |
| 11 | Create `/llms-full.txt` for documentation-heavy sites | 3 sites | 4h |
| 12 | Set up HTTP `Last-Modified` headers on all servers/CDNs | All 6 sites | 2h |
| 13 | Add `ProfilePage` schema for all team/author bio pages | All 6 sites | 3h |
| 14 | Ensure `sameAs` links are verified and active for all entities | All 6 sites | 2h |
| 15 | Create `/about/llm` integrated AI identity pages | All 6 sites | 4h |

### P2 -- Medium Priority (Implement Within 1 Month)

| # | Task | Sites | Effort |
|---|------|-------|--------|
| 16 | Implement `/.well-known/agent.json` (A2A Agent Card) | csoai.org, meok.ai | 4h |
| 17 | Add `Review` schema with genuine first-party testimonials | proofof.ai | 2h |
| 18 | Implement `@graph` stacking on all major landing pages | All 6 sites | 4h |
| 19 | Add `Speakable` schema for voice-optimized content sections | csoai.org | 2h |
| 20 | Create `.md` alternate versions of key pages (append `.md` to URLs) | All 6 sites | 6h |
| 21 | Set up automated `dateModified` updates via CMS on content changes | All 6 sites | 4h |
| 22 | Implement `HowTo` schema for tutorial/FAQ content | proofof.ai | 3h |
| 23 | Add `Service` schema for consulting/advisory offerings | csoai.org | 2h |
| 24 | Create and verify Wikidata entries for CSOAI and key persons | All 6 sites | 8h |

### Validation Checklist

- [ ] Google Rich Results Test: All pages pass with no errors
- [ ] Schema.org Validator: Syntax and structure verified
- [ ] robots.txt Tester: All AI crawlers have explicit Allow directives
- [ ] Server logs: Confirm AI crawlers (GPTBot, ClaudeBot, PerplexityBot) are visiting
- [ ] llms.txt accessible: Raw markdown loads at `/llms.txt`
- [ ] agent.json accessible: JSON loads at `/.well-known/agent.json`
- [ ] dateModified matches: Schema dates match visible on-page dates
- [ ] sameAs verified: All social/profile links are active and correct
- [ ] Sitemap lastmod: XML sitemap dates match content update dates
- [ ] Mobile-friendly: All schema renders correctly on mobile

---

## Summary of Top 10 Most Critical AEO Implementations

1. **robots.txt with explicit AI crawler allowances** -- Without this, AI search engines cannot index your content. Explicitly allow OAI-SearchBot, Claude-SearchBot, PerplexityBot while selectively disallowing training crawlers (GPTBot, ClaudeBot) based on content strategy. [^3^][^5^]

2. **FAQPage schema on every homepage and key landing page** -- The single highest-impact schema for AI citations. Structures content as extractable Q&A pairs that LLMs can directly cite. Triple-schema stacking (FAQ + Article + HowTo) produces 1.8x more citations. [^2^][^7^]

3. **Complete Organization schema with sameAs links** -- Establishes entity identity, powers Knowledge Panels, and provides machine-verifiable social profile connections. Use `@id` references to link across all pages. [^9^][^12^]

4. **Person schema with verified sameAs profiles for all authors/founders** -- Directly implements E-E-A-T signals. LinkedIn, Google Scholar, and Wikipedia links give AI crawlers independent verification of author identity and expertise. [^2^][^32^]

5. **dateModified in Article schema with real content updates** -- 50% of AI citations come from content <13 weeks old. Stale timestamps actively hurt citation rates. Update monthly for competitive pages, quarterly for evergreen content. [^33^][^38^]

6. **llms.txt file at root** -- Low-effort (1-4 hours), potential high upside. Anthropic actively uses it, Google included it in A2A. Positions CSOAI for when LLM providers commit to the standard. [^47^][^48^]

7. **BreadcrumbList schema on all non-home pages** -- Provides navigational context that helps AI systems understand site hierarchy and page relationships. Required for @graph stacking. [^11^][^39^]

8. **SoftwareApplication + Offer schema on proofof.ai** -- Directly enables AI search engines to understand pricing tiers, certification levels, and product capabilities. Critical for commercial intent queries. [^36^]

9. **A2A Agent Card at /.well-known/agent.json** -- Future-proofs for agent-to-agent discovery. Google's A2A protocol is gaining traction under Linux Foundation governance. Low effort, strategic positioning. [^35^]

10. **@graph schema stacking linking all entities** -- Centralize all schema into a single script with `@graph`. Links Organization, Person, Article, FAQPage into one internally consistent machine-readable graph. AI systems treat this as more authoritative than isolated schema blocks. [^2^][^11^]

---

## Sources

[^1^] Somesite I Used To Crawl: Awareness, Agency and Authority -- arxiv.org/pdf/2411.15091
[^2^] Schema Markup for AI: How to Use Structured Data to Get Cited -- optimizegeo.ai/blog/schema-markup-for-ai
[^3^] AI Crawlers Explained: GPTBot, ClaudeBot, PerplexityBot -- anagram.ai/blog/ai-crawlers-explained
[^4^] Robots.txt - Guide for AI ranking -- botrank.ai/technical-doc/robots-txt
[^5^] List of Top AI Search Crawlers + User Agents -- momenticmarketing.com/blog/ai-search-crawlers-bots
[^6^] Structured Data AI Search: Schema Markup Guide -- stackmatix.com/blog/structured-data-ai-search
[^7^] Schema Markup for AI Search: 7 JSON-LD That Boost Citations -- ailabsaudit.com/blog/en/schema-markup-ai-visibility-guide
[^8^] Schema Markup for AI Search: Beyond the Basics -- 20northmarketing.com/blog/schema-markup-ai-search
[^9^] Organization Schema - JSON-LD Guide & Examples -- unhead.unjs.io/docs/schema-org/api/schema/organization
[^10^] Master Schema JSON-LD: Elevate Your SEO Strategy in 2025 -- interruptmedia.com/master-schema-json-ld-elevate-your-seo-strategy-in-2025
[^11^] Modern JSON-LD implementation in 2025 -- blog.enodo.io/modern-json-ld-implementation-in-2025-toward-cleaner-and-maintainable-seo-9.html
[^12^] Schema.org Implementation Guide 2025 -- thibautcampana.com/en/guides/schema-org-implementation-guide
[^13^] Should Websites Implement llms.txt in 2026? -- linkbuildinghq.com/blog/should-websites-implement-llms-txt-in-2026
[^14^] Meet llms.txt, a proposed standard -- searchengineland.com/llms-txt-proposed-standard-453676
[^15^] LLMs.txt: Does It Actually Work? -- indexlab.ai/blog/llms-txt-does-it-actually-work-october-2025-updated
[^18^] The Complete Guide to llms.txt -- getpublii.com/blog/llms-txt-complete-guide.html
[^20^] What is Llms.txt File and What Does It Do? -- zeo.org/resources/blog/what-is-llms-txt-file-and-what-does-it-do
[^31^] A Survey of AI Agent Protocols -- arxiv.org/pdf/2504.16736
[^32^] Person Schema JSON-LD -- jsonld.com/person/
[^33^] Content Freshness in AI Search -- foglift.io/blog/content-freshness-ai-search
[^34^] Structured Data & Schema for AI Search in 2026 -- itxitpro.ae/blogs/structured-data-schema-for-ai-search-how-to-feed-the-machines-in-2026
[^35^] Google's A2A Protocol -- birjob.com/blog/a2a-protocol-agent-to-agent-google
[^36^] Best Schema Types for SaaS Websites -- austinheaton.com/blog/best-schema-types-for-saas-websites-18360
[^37^] LLMs Are Not Website Visitors -- jasonbarnard.com/digital-marketing/articles/articles-by/strategy-sandbox/why-the-llm-info-page-trend-misreads-the-architecture
[^38^] Content Freshness & Update Signals -- discoveredlabs.com/blog/content-freshness-update-signals-keeping-ai-systems-aware-of-your-latest-information
[^39^] Schema Markup Guide -- seotopsecret.com/blog/schema-markup-guide
[^40^] Free Person Schema Markup Generator -- schemapilot.app/tools/schema-markup-generators/person
[^41^] Inside Google's Agent2Agent (A2A) Protocol -- towardsdatascience.com/inside-googles-agent2agent-a2a-protocol
[^42^] ProfilePage Schema Markup -- aubreyyung.com/profilepage-schema
[^45^] What is llms.txt? -- mintlify.com/blog/what-is-llms-txt
[^46^] LLMs.txt Explained -- medium.com/data-science/llms-txt-explained-414d5121bcb3
[^47^] /llms.txt -- a proposal -- answer.ai/posts/2024-09-03-llmstxt.html
[^48^] The /llms.txt file GitHub repo -- github.com/answerdotai/llms-txt
[^49^] What Is llms.txt, and Should You Care? -- ahrefs.com/blog/what-is-llms-txt
[^50^] llms-txt: The /llms.txt file -- llmstxt.org
[^51^] LLMs.txt Explained -- towardsdatascience.com/llms-txt-414d5121bcb3
[^52^] How to Create an llms.txt File -- firecrawl.dev/blog/How-to-Create-an-llms-txt-File-for-Any-Website
[^53^] Adding /llms.txt -- gilesthomas.com/2025/03/llmstxt
[^54^] Simplifying docs for AI with /llms.txt -- mintlify.com/blog/simplifying-docs-with-llms-txt
