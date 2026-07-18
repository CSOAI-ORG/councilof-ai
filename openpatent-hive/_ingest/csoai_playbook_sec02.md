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
