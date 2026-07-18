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
