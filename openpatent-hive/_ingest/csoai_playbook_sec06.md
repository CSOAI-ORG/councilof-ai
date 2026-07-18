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

