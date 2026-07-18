# Master Site Consolidation: Technical Architecture for Unifying 5+ Sites

## Executive Summary

This document provides a comprehensive technical architecture for consolidating **csoai.org, proofof.ai, councilof.ai, safetyof.ai, meok.ai** and additional `.ai` domains and applications (built across Lovable, Vercel, Cloudflare, Namecheap, Kimi-built, Claude-built) into **one unified platform**. The architecture preserves SEO rankings, maintains sub-2.5s LCP performance, and delivers a seamless cross-domain authentication experience.

**Recommended Architecture**: Hybrid **Cloudflare (DNS/Edge/CDN) + Vercel (Next.js Application Hosting)** with **meok.ai as the master domain**, using subdirectory-based consolidation (`meok.ai/council`, `meok.ai/safety`, `meok.ai/proof`) with other domains configured as satellite domains with Clerk authentication.

---

## Table of Contents

1. [Multi-Site Consolidation Strategy](#1-multi-site-consolidation-strategy)
2. [Recommended Architecture Overview](#2-recommended-architecture-overview)
3. [Vercel + Next.js Architecture](#3-vercel--nextjs-architecture)
4. [Cloudflare Edge Layer](#4-cloudflare-edge-layer)
5. [Lovable Integration Strategy](#5-lovable-integration-strategy)
6. [Domain Consolidation Strategy](#6-domain-consolidation-strategy)
7. [DNS & Infrastructure Management](#7-dns--infrastructure-management)
8. [Authentication & Cross-Domain SSO](#8-authentication--cross-domain-sso)
9. [Performance Optimization](#9-performance-optimization)
10. [SEO Preservation Strategy](#10-seo-preservation-strategy)
11. [Migration Plan](#11-migration-plan)
12. [Tech Stack Decision Matrix](#12-tech-stack-decision-matrix)
13. [Performance Budget](#13-performance-budget)
14. [SEO Preservation Checklist](#14-seo-preservation-checklist)
15. [Risk Mitigation](#15-risk-mitigation)

---

## 1. Multi-Site Consolidation Strategy

### 1.1 Core Decision: Subdirectory vs. Subdomain

Research overwhelmingly favors **subdirectories** over subdomains for SEO authority consolidation in 2025 [^149^][^150^][^151^][^152^].

| Factor | Subdirectory (`meok.ai/council`) | Subdomain (`council.meok.ai`) |
|--------|----------------------------------|-------------------------------|
| **SEO Authority** | Shares main domain authority | Treated as separate site [^149^] |
| **Backlink Equity** | Consolidated to root domain | Fragmented across properties |
| **Google Treatment** | Part of main site, unified crawl budget | Separate crawl budget [^158^] |
| **AI Citations** | Inherits main domain trust | Separate entity for AI engines [^150^] |
| **Management** | Single Search Console, single analytics | Separate properties per subdomain |
| **Internal Linking** | Seamless | Requires cross-domain strategy |

**Verdict**: Use subdirectories for all consolidated content. Subdomains ONLY for technically isolated applications (e.g., `app.meok.ai` for dashboard).

### 1.2 Multi-Site SEO Consolidation Best Practices

Based on comprehensive research [^147^][^148^][^154^][^155^], the consolidation process must follow these steps:

1. **Audit all domains** before migration - traffic analysis, ranking keywords, backlink profiles, page value assessment [^168^]
2. **Choose primary domain** with strongest brand recognition, best domain authority, most valuable backlinks [^168^]
3. **Map every URL** from old sites to new locations with page-level 301 redirects (NOT domain-level) [^177^]
4. **Content migration plan** - identify keep, combine, or eliminate decisions for every page [^155^]
5. **Transfer authority** - update backlinks, contact high-value linking domains [^168^]
6. **Monitor for 60-90 days** post-launch - submit updated sitemaps, verify redirects [^148^]

### 1.3 Consolidation Case Study Results

A B2B company consolidating 5 domains saw [^168^]:
- **+150% organic traffic** (50K to 125K monthly)
- **Domain authority: 25-35 to 48**
- **+185% lead generation**
- **-80% technical overhead**

Orlando.org consolidated 4 properties and achieved [^155^]:
- **287% increase in organic traffic**
- **1,105% increase in lead conversions**
- **73.6% reduction in CPA**

---

## 2. Recommended Architecture Overview

### 2.1 Master Architecture Diagram

```
+================================================================================+
|                         USER REQUEST FLOW                                       |
+================================================================================+
                                                                                  |
    Multiple Domains (csoai.org, proofof.ai, councilof.ai,                        |
    safetyof.ai, meok.ai, others)                                                 |
           |                                                                      |
           v                                                                      |
+================================================================================+
|  LAYER 1: CLOUDFLARE EDGE (DNS + CDN + Edge Compute)                           |
|  ----------------------------------------------------------------------------  |
|  Cloudflare DNS -> Cloudflare Proxy -> Cloudflare Workers -> Cloudflare CDN    |
|                                                                                |
|  Functions:                                                                    |
|  - DNS resolution for all domains                                              |
|  - DDoS protection + WAF                                                       |
|  - Edge caching (static assets, API responses)                                 |
|  - Worker-based routing logic (domain -> path mapping)                         |
|  - KV storage for session tokens, config, redirects                            |
|  - Image optimization via Cloudflare Images                                    |
+================================================================================+
           |                                                                      |
           v                                                                      |
+================================================================================+
|  LAYER 2: AUTHENTICATION (Clerk)                                               |
|  ----------------------------------------------------------------------------  |
|  - Primary domain: meok.ai (auth state lives here)                             |
|  - Satellite domains: all other domains read auth from primary                 |
|  - SSO across all properties via Clerk satellite domains [^206^]               |
|  - JWT tokens stored in httpOnly cookies                                        |
+================================================================================+
           |                                                                      |
           v                                                                      |
+================================================================================+
|  LAYER 3: APPLICATION HOSTING (Vercel)                                         |
|  ----------------------------------------------------------------------------  |
|  Single Next.js 15 Application with Multi-Zone Architecture:                   |
|                                                                                |
|  meok.ai/                    -> Main landing / brand hub                       |
|  meok.ai/council/            -> councilof.ai content (migrated)                |
|  meok.ai/safety/             -> safetyof.ai content (migrated)                 |
|  meok.ai/proof/              -> proofof.ai content (migrated)                  |
|  meok.ai/cso/                -> csoai.org content (migrated)                   |
|  meok.ai/blog/               -> Unified blog                                   |
|  meok.ai/app/                -> Dashboard / authenticated experience           |
|                                                                                |
|  Other domains -> 301 redirects to meok.ai paths:                              |
|  councilof.ai/*  -> meok.ai/council/*                                          |
|  safetyof.ai/*   -> meok.ai/safety/*                                           |
|  proofof.ai/*    -> meok.ai/proof/*                                            |
|  csoai.org/*     -> meok.ai/cso/*                                              |
+================================================================================+
           |                                                                      |
           v                                                                      |
+================================================================================+
|  LAYER 4: DATA & STORAGE                                                       |
|  ----------------------------------------------------------------------------  |
|  Primary: Supabase (PostgreSQL) - user data, content, applications             |
|  Cache: Cloudflare KV - sessions, feature flags, rate limits                   |
|  Edge DB: Cloudflare D1 - edge-config, routing rules                           |
|  Object Storage: Cloudflare R2 - images, files, assets                         |
|  Search: Algolia or Supabase Full-Text Search                                   |
+================================================================================+
           |                                                                      |
           v                                                                      |
+================================================================================+
|  LAYER 5: EXTERNAL SERVICES                                                    |
|  ----------------------------------------------------------------------------  |
|  Lovable-built apps -> Exported to Next.js, integrated as /app/* routes        |
|  Kimi/Claude-built features -> Integrated as modules                           |
|  Analytics: Google Analytics 4 + Vercel Analytics                              |
|  Monitoring: Vercel Speed Insights + Cloudflare Analytics                      |
+================================================================================+
```

### 2.2 Architecture Component Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| DNS/CDN | Cloudflare | DNS management, DDoS protection, edge caching [^183^] |
| Edge Compute | Cloudflare Workers | Routing, redirects, middleware [^167^] |
| Application | Next.js 15 + Vercel | Main application platform |
| Auth | Clerk | Cross-domain SSO with satellite domains [^206^] |
| Database | Supabase (PostgreSQL) | Primary data store |
| Edge Cache | Cloudflare KV | Sessions, config, redirects [^166^] |
| Object Storage | Cloudflare R2 | File storage, images |
| Edge DB | Cloudflare D1 | Lightweight edge data [^172^] |
| Registrar | Namecheap | Domain registration (keep as-is) |
| Monitoring | Vercel Analytics + Cloudflare Analytics | Performance monitoring |

---

## 3. Vercel + Next.js Architecture

### 3.1 Multi-Zone Architecture

The recommended approach uses **Next.js Multi-Zones** [^166^] combined with **middleware-based routing** [^156^]. This allows a single codebase to serve all consolidated sites while maintaining independent deploy cycles for different zones.

**How Multi-Zones Work** (based on Supabase's architecture) [^168^]:
- One `www` workspace handles the main site (`meok.ai`)
- Additional workspaces handle specific zones (`/app`, `/dashboard`)
- `next.config.js` rewrites route requests to the correct zone

```javascript
// next.config.js - Multi-Zone Configuration
async rewrites() {
  return [
    // Council zone (migrated from councilof.ai)
    {
      source: '/council',
      destination: `${process.env.COUNCIL_ZONE_URL}/council`,
    },
    {
      source: '/council/:path*',
      destination: `${process.env.COUNCIL_ZONE_URL}/council/:path*`,
    },
    // Safety zone (migrated from safetyof.ai)
    {
      source: '/safety/:path*',
      destination: `${process.env.SAFETY_ZONE_URL}/safety/:path*`,
    },
    // Proof zone (migrated from proofof.ai)
    {
      source: '/proof/:path*',
      destination: `${process.env.PROOF_ZONE_URL}/proof/:path*`,
    },
    // Static assets for zones
    {
      source: '/council-static/:path*',
      destination: `${process.env.COUNCIL_ZONE_URL}/council-static/:path*`,
    },
  ];
}
```

### 3.2 Subdomain-Based Multi-Tenancy with Middleware

For satellite domains that need to remain active (before redirecting), Next.js middleware can detect the hostname and route accordingly [^156^][^162^]:

```typescript
// middleware.ts - Multi-domain routing
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // Domain to path mapping during transition
  const domainMap: Record<string, string> = {
    'councilof.ai': '/council',
    'www.councilof.ai': '/council',
    'safetyof.ai': '/safety',
    'www.safetyof.ai': '/safety',
    'proofof.ai': '/proof',
    'www.proofof.ai': '/proof',
    'csoai.org': '/cso',
    'www.csoai.org': '/cso',
  };

  const targetPath = domainMap[hostname];
  if (targetPath && !url.pathname.startsWith(targetPath)) {
    url.pathname = `${targetPath}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 3.3 Vercel Microfrontends Alternative

For teams needing independent deploy cycles, Vercel Microfrontends [^160^] is an alternative:
- Define `microfrontends.json` mapping URL paths to different Vercel projects
- Each team can develop, test, and deploy independently
- Vercel handles routing at the CDN layer

```json
// microfrontends.json
{
  "microfrontends": [
    {
      "route": "/council",
      "project": "council-zone"
    },
    {
      "route": "/safety",
      "project": "safety-zone"
    },
    {
      "route": "/app",
      "project": "dashboard-app"
    }
  ]
}
```

### 3.4 Vercel Deployment Model

**Why Vercel over Cloudflare Workers for the main app**:

| Factor | Vercel | Cloudflare Workers |
|--------|--------|-------------------|
| Next.js Native | Zero-config, full feature support [^180^] | Requires @opennextjs/cloudflare adapter [^176^] |
| SSR/ISR/SSG | Full support out of box | Some limitations [^175^] |
| Preview Deployments | Per-push preview URLs [^180^] | Preview URLs available |
| Edge Network | 100+ locations [^180^] | 300+ locations [^180^] |
| Next.js DevEx | Best-in-class [^180^] | Less mature |
| Fluid Compute | In-function concurrency [^179^] | 10ms CPU limit (free) [^188^] |

**Verdict**: Vercel is the optimal host for the Next.js application. Cloudflare Workers handles edge routing, caching, and proxying.

---

## 4. Cloudflare Edge Layer

### 4.1 Cloudflare as the Edge Gateway

Cloudflare sits in front of Vercel as the edge layer, handling:

1. **DNS Resolution** - All domains point to Cloudflare nameservers [^183^]
2. **DDoS Protection** - Automatic protection against attacks
3. **WAF** - Web Application Firewall rules
4. **Edge Caching** - Cache static assets at 300+ edge locations [^167^]
5. **Edge Compute** - Workers for routing logic, A/B testing, redirects
6. **Image Optimization** - Cloudflare Images for automatic optimization

### 4.2 Cloudflare Workers for Domain Routing

Use Cloudflare Workers as a reverse proxy [^214^] to route legacy domains to the new structure:

```javascript
// Cloudflare Worker - Domain Router
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Domain redirect mapping
    const redirects = {
      'councilof.ai': 'meok.ai/council',
      'www.councilof.ai': 'meok.ai/council',
      'safetyof.ai': 'meok.ai/safety',
      'www.safetyof.ai': 'meok.ai/safety',
      'proofof.ai': 'meok.ai/proof',
      'www.proofof.ai': 'meok.ai/proof',
      'csoai.org': 'meok.ai/cso',
      'www.csoai.org': 'meok.ai/cso',
    };

    const target = redirects[hostname];
    if (target) {
      // 301 permanent redirect preserving path
      const newUrl = `https://${target}${url.pathname}${url.search}`;
      return Response.redirect(newUrl, 301);
    }

    // Pass through to origin (Vercel) for meok.ai
    return fetch(request);
  },
};
```

### 4.3 Cloudflare Storage Architecture

| Service | Purpose | Use Case |
|---------|---------|----------|
| **KV** | Global key-value cache | Sessions, feature flags, redirect rules [^166^] |
| **D1** | Edge SQL database | Routing config, edge analytics [^172^] |
| **R2** | Object storage | Images, files, assets (no egress fees) |
| **Durable Objects** | Stateful coordination | Real-time features, rate limiting |

**KV Performance** [^166^]:
- Hot key latency: 500us to 10ms
- 1 RPS write limit per key
- 25MB max value size
- Eventually consistent (writes propagate in seconds)

---

## 5. Lovable Integration Strategy

### 5.1 What Lovable Generates

Lovable.dev creates applications using:
- **Frontend**: Vite + React (SPA), Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Architecture**: Single-page application with client-side routing [^202^]

### 5.2 Export and Migration Strategy

Lovable apps can be exported via multiple methods [^159^]:

1. **Chrome Extension Method**: "Lovable to Next.js" extension exports project as ZIP [^159^]
2. **GitHub Export**: Direct GitHub export (though sync issues reported) [^203^]
3. **Manual Export**: Download files and recreate in Next.js structure

### 5.3 Integration Architecture

**For production consolidation, Lovable apps must be migrated to Next.js** [^163^][^202^]:

| Step | Action | Detail |
|------|--------|--------|
| 1 | Export Lovable code | Use extension or GitHub export [^159^] |
| 2 | Audit code | Identify performance bottlenecks, security gaps [^205^] |
| 3 | Convert to Next.js | Migrate React Router to App Router, add SSR [^163^] |
| 4 | Integrate into monorepo | Add as `/app/zone/` directory or separate zone |
| 5 | Migrate Supabase data | Export/import database tables to main Supabase instance |
| 6 | Add authentication | Replace with Clerk auth for unified SSO |

### 5.4 Lovable Limitations for Production [^202^][^203^][^204^]

- **"Last 30% Problem"**: Gets you 70% done, needs manual engineering for the rest
- **Debugging Loops**: AI may reintroduce old issues while fixing new ones
- **Scaling Issues**: Performance problems on large/complex apps
- **Security Gaps**: Not built for enterprise security requirements
- **Vendor Lock-In**: Code is accessible but hard to maintain without the tool
- **SEO Fragility**: Client-side rendered SPA is poor for SEO [^163^]

**Verdict**: Use Lovable for rapid prototyping only. All production consolidation requires migration to Next.js with proper SSR.

---

## 6. Domain Consolidation Strategy

### 6.1 Choosing the Master Domain

Based on domain strategy best practices [^170^][^168^]:

| Domain | Assessment | Recommendation |
|--------|-----------|----------------|
| **meok.ai** | Short, brandable, memorable; ideal as mothership | **MASTER DOMAIN** |
| csoai.org | .org signals organization; has existing authority | 301 redirect to meok.ai/cso |
| proofof.ai | Descriptive but niche | 301 redirect to meok.ai/proof |
| councilof.ai | Descriptive but long | 301 redirect to meok.ai/council |
| safetyof.ai | Descriptive but long | 301 redirect to meok.ai/safety |

**"One Domain to Rule All" Strategy** [^170^]: Modern best practice is a single powerful domain with subdirectories for localization/segmentation. All SEO authority concentrates on one domain.

### 6.2 Domain Migration SEO Strategy

To preserve domain authority during migration [^177^][^168^]:

1. **Page-level 301 redirects** - Every URL on old domain redirects to equivalent new URL
2. **Preserve for 1+ years** - Keep domains active with redirects indefinitely
3. **Update Google Search Console** - Submit change of address [^147^]
4. **Update backlinks** - Contact high-value linking sites to update URLs [^168^]
5. **Monitor redirect chains** - Ensure no redirect loops or chains [^147^]

### 6.3 Redirect Implementation

```
csoai.org/                     -> 301 -> meok.ai/cso/
csoai.org/about                -> 301 -> meok.ai/cso/about
csoai.org/blog/post-name       -> 301 -> meok.ai/cso/blog/post-name
csoai.org/contact              -> 301 -> meok.ai/cso/contact

councilof.ai/                  -> 301 -> meok.ai/council/
councilof.ai/members           -> 301 -> meok.ai/council/members

safetyof.ai/                   -> 301 -> meok.ai/safety/
proofof.ai/                    -> 301 -> meok.ai/proof/
```

### 6.4 Preserving Other .ai Domains

Other `.ai` domains can serve as:
- **Landing pages** with 301 redirect to meok.ai subdirectory
- **Marketing campaign URLs** that redirect to specific landing pages
- **Future feature previews** (e.g., `newfeature.ai` -> `meok.ai/newfeature`)
- **Email domain** for branded email addresses

---

## 7. DNS & Infrastructure Management

### 7.1 Namecheap + Cloudflare Integration

Keep Namecheap as registrar, use Cloudflare for DNS [^183^][^185^][^189^]:

**Migration Steps**:
1. Create Cloudflare account and add all domains
2. Cloudflare scans and imports existing DNS records
3. In Namecheap, set Custom DNS to Cloudflare nameservers [^185^]:
   - `michael.ns.cloudflare.com`
   - `ollie.ns.cloudflare.com` (or similar pair provided by Cloudflare)
4. Verify with `dig NS domain.ai +short` [^183^]
5. Enable Cloudflare proxy (orange cloud) for all A/AAAA/CNAME records

### 7.2 DNS Configuration for All Domains

| Domain | A Record | Proxy | Purpose |
|--------|----------|-------|---------|
| meok.ai | -> Vercel | Yes | Master site |
| www.meok.ai | CNAME meok.ai | Yes | WWW redirect |
| councilof.ai | -> Worker | Yes | 301 redirects |
| safetyof.ai | -> Worker | Yes | 301 redirects |
| proofof.ai | -> Worker | Yes | 301 redirects |
| csoai.org | -> Worker | Yes | 301 redirects |
| *.meok.ai | -> Vercel | Yes | Wildcard subdomains |
| clerk.meok.ai | CNAME clerk | Yes | Clerk auth [^206^] |

### 7.3 Cloudflare Configuration Checklist

- [ ] Enable Always Use HTTPS
- [ ] Enable Automatic HTTPS Rewrites
- [ ] Enable Brotli compression
- [ ] Enable Early Hints
- [ ] Configure Browser Cache TTL
- [ ] Enable HTTP/2 and HTTP/3
- [ ] Enable 0-RTT Connection Resumption
- [ ] Set up Page Rules for cache levels
- [ ] Configure Cloudflare Images for optimization

---

## 8. Authentication & Cross-Domain SSO

### 8.1 Architecture: Clerk with Satellite Domains

**Clerk** is the recommended authentication provider for cross-domain SSO. It natively supports **satellite domains** - a primary domain where auth state lives, and satellite domains that read auth state from the primary [^206^].

**How It Works**:
1. User signs in on `meok.ai` (primary domain)
2. When visiting `councilof.ai` (satellite), auth state is synced from primary
3. User is automatically authenticated across all domains
4. Sign out from any domain signs out from all domains [^206^]

### 8.2 Clerk Configuration

**Primary Domain (meok.ai)**:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

**Satellite Domains (councilof.ai, safetyof.ai, etc.)**:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_IS_SATELLITE=true
NEXT_PUBLIC_CLERK_DOMAIN=councilof.ai
NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://meok.ai/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://meok.ai/sign-up
```

### 8.3 Middleware Configuration for Satellite Domains

```typescript
// Satellite domain middleware
import { clerkMiddleware } from '@clerk/nextjs/server';

const options = {
  isSatellite: true,
  signInUrl: 'https://meok.ai/sign-in',
  signUpUrl: 'https://meok.ai/sign-up',
  domain: 'councilof.ai',
};

export default clerkMiddleware(async (auth, req) => {
  // Auth state synced from primary domain
}, options);
```

### 8.4 Alternative: Custom JWT Implementation

For a fully custom solution, implement JWT tokens in httpOnly cookies with shared secret:

```
Login Flow:
1. User authenticates at meok.ai/api/auth/login
2. Server issues JWT in httpOnly cookie with domain=.meok.ai
3. For satellite domains, use CORS-enabled auth endpoint
4. All domains verify JWT against shared secret
```

**Verdict**: Use Clerk for production (handles edge cases, security, session management). Custom JWT only if vendor lock-in is a concern.

---

## 9. Performance Optimization

### 9.1 Core Web Vitals Targets

| Metric | Target | Current Best Practice |
|--------|--------|----------------------|
| **LCP** | < 2.5s | Use `next/image`, priority loading, SSG [^181^] |
| **INP** | < 200ms | Dynamic imports, code splitting [^184^] |
| **CLS** | < 0.1 | Image dimensions, font-display: swap [^181^] |
| **TTFB** | < 600ms | Edge deployment, ISR, caching [^167^] |
| **FCP** | < 1.8s | Preload critical resources [^190^] |

### 9.2 Next.js Performance Optimization Checklist

Based on research [^181^][^184^][^190^]:

**Images**:
- Use `next/image` with automatic optimization [^181^]
- Add `priority` prop to hero/above-fold images
- Lazy load below-fold images
- Serve AVIF/WebP formats [^181^]

**Code**:
- Dynamic import heavy components with `next/dynamic` [^190^]
- Use Server Components where possible (reduces client JS)
- Code split by route
- Enable SWC minification

**Rendering**:
- Use ISR for pages that change frequently
- Use SSG for static pages
- Use SSR only when necessary (personalized content)
- Streaming with App Router for progressive loading

**Caching**:
- Edge caching via Cloudflare (static assets)
- ISR revalidation for stale content
- Browser caching via Cache-Control headers
- KV caching for frequently accessed data

### 9.3 Multi-Site Performance Strategy

For 100+ pages across consolidated sites:

1. **Static Generation (SSG)** for 80% of pages - build at deploy time
2. **ISR** for blog posts, listings - revalidate every 60 seconds
3. **SSR** only for authenticated dashboard pages
4. **Edge caching** via Cloudflare for all static assets
5. **Image optimization** via Cloudflare Images or Next.js Image
6. **Font optimization** with `next/font` for zero-layout-shift fonts

### 9.4 Monitoring Core Web Vitals

```javascript
// app/layout.tsx - Web Vitals monitoring
import { useReportWebVitals } from 'next/web-vitals';

function onMetric(metric) {
  // Send to analytics
  fetch('/api/vitals', {
    method: 'POST',
    body: JSON.stringify(metric),
  });
}
```

---

## 10. SEO Preservation Strategy

### 10.1 Pre-Migration SEO Audit

Before any migration [^147^][^148^]:

1. **Crawl all sites** with Screaming Frog or Ahrefs
2. **Export all URLs** with traffic data from Google Analytics
3. **Map keyword rankings** with SEMrush or Ahrefs
4. **Document backlink profiles** for each domain
5. **Identify top-performing pages** that drive most traffic
6. **Check for technical issues** in Google Search Console

### 10.2 URL Mapping Strategy

| Old URL | New URL | Redirect Type | Notes |
|---------|---------|---------------|-------|
| csoai.org/ | meok.ai/cso/ | 301 | Homepage mapping |
| csoai.org/about | meok.ai/cso/about | 301 | Preserve content |
| csoai.org/blog/* | meok.ai/cso/blog/* | 301 | Preserve all blog posts |
| councilof.ai/ | meok.ai/council/ | 301 | Brand consolidation |
| safetyof.ai/ | meok.ai/safety/ | 301 | Brand consolidation |
| proofof.ai/ | meok.ai/proof/ | 301 | Brand consolidation |

### 10.3 Technical SEO Implementation

1. **301 redirects** - Page-level, NOT domain-level [^177^]
2. **Canonical tags** - Point to new canonical URLs
3. **Sitemap submission** - Submit new sitemaps to Google Search Console [^147^]
4. **Change of address** - Use Google's change of address tool [^147^]
5. **robots.txt** - Update to reference new sitemap locations
6. **Hreflang tags** - If multi-language, implement properly [^152^]
7. **Structured data** - Migrate all schema.org markup

### 10.4 Post-Migration Monitoring

- **Week 1**: Daily monitoring of Google Search Console for crawl errors
- **Week 2-4**: Weekly ranking checks for top keywords
- **Month 2-3**: Monitor traffic trends, expect 3-6 months for full stabilization [^168^]
- **Ongoing**: Monitor for broken links, redirect chains, 404 errors

---

## 11. Migration Plan

### 11.1 Phase 1: Foundation (Weeks 1-2)

| Task | Duration | Details |
|------|----------|---------|
| Set up Cloudflare account | 2 days | Add all domains, configure DNS |
| Migrate DNS to Cloudflare | 3 days | Update nameservers in Namecheap [^183^] |
| Set up Next.js project | 3 days | Initialize with App Router, TypeScript |
| Configure Clerk auth | 2 days | Primary domain + satellite setup [^206^] |
| Set up CI/CD | 2 days | Vercel Git integration |

### 11.2 Phase 2: Content Migration (Weeks 3-6)

| Task | Duration | Details |
|------|----------|---------|
| Audit all existing sites | 1 week | Crawl, export URLs, map content |
| Migrate csoai.org content | 1 week | Move to meok.ai/cso/ |
| Migrate councilof.ai content | 1 week | Move to meok.ai/council/ |
| Migrate safetyof.ai content | 1 week | Move to meok.ai/safety/ |
| Migrate proofof.ai content | 1 week | Move to meok.ai/proof/ |
| Export Lovable apps | 1 week | Download code, audit [^159^] |

### 11.3 Phase 3: Integration (Weeks 7-8)

| Task | Duration | Details |
|------|----------|---------|
| Integrate Lovable apps into Next.js | 1 week | Convert to App Router, add SSR |
| Implement 301 redirects | 3 days | Cloudflare Workers for all domains |
| Set up cross-domain auth | 2 days | Clerk satellite configuration |
| Implement URL rewrites | 2 days | Next.js middleware for routing |

### 11.4 Phase 4: Launch (Weeks 9-10)

| Task | Duration | Details |
|------|----------|---------|
| Staging testing | 3 days | Full QA across all routes |
| SEO validation | 2 days | Check redirects, sitemaps, metadata |
| Performance testing | 2 days | Lighthouse, PageSpeed Insights |
| Go live | 1 day | Switch DNS, enable redirects |

### 11.5 Phase 5: Post-Launch (Weeks 11-14)

| Task | Duration | Details |
|------|----------|---------|
| Monitor Search Console | Daily | Crawl errors, indexing status |
| Monitor rankings | Weekly | Track keyword positions |
| Fix issues | Ongoing | Address 404s, redirect chains |
| Content optimization | Ongoing | Improve content on migrated pages |

---

## 12. Tech Stack Decision Matrix

### 12.1 Platform Comparison

| Criteria | Vercel + Next.js | Cloudflare Workers | Hybrid (Recommended) |
|----------|-----------------|-------------------|---------------------|
| **Next.js Native Support** | Excellent [^180^] | Requires adapter [^176^] | Vercel hosts app |
| **Edge Performance** | Good (100+ PoPs) | Excellent (300+ PoPs) | Cloudflare as edge |
| **SSR/ISR Support** | Full native | Partial [^175^] | Full via Vercel |
| **Multi-Domain Routing** | Middleware + Rewrites | Workers [^214^] | Both layers |
| **Auth (Clerk)** | First-class | Compatible | Vercel primary |
| **DevEx** | Best-in-class [^180^] | Moderate [^179^] | Vercel for dev |
| **Cost (Startup)** | Free tier available | Free tier available | Optimize per use |
| **SEO (SSR)** | Excellent | Good | Excellent |
| **Scalability** | Excellent | Excellent | Best of both |
| **Multi-Zone Support** | Native [^166^] | Manual | Native |

### 12.2 Final Recommendation: Hybrid Architecture

**Vercel for Application Hosting** + **Cloudflare for Edge/DNS/CDN**

Rationale:
1. Vercel is the native home for Next.js - best developer experience [^180^]
2. Cloudflare provides the best edge network - 300+ locations [^167^]
3. Clerk works seamlessly on Vercel with satellite domain support [^206^]
4. Cloudflare Workers handle routing/redirects without burdening the app
5. Namecheap stays as registrar (no migration needed)

---

## 13. Performance Budget

### 13.1 Targets by Page Type

| Page Type | LCP Target | INP Target | CLS Target | JS Bundle | Strategy |
|-----------|-----------|-----------|-----------|-----------|----------|
| **Homepage** | < 2.0s | < 150ms | < 0.05 | < 150KB | SSG, priority images |
| **Content Pages** | < 2.5s | < 200ms | < 0.1 | < 200KB | SSG, lazy load below-fold |
| **Blog Posts** | < 2.5s | < 200ms | < 0.1 | < 180KB | ISR, optimized images |
| **Dashboard (/app)** | < 3.0s | < 300ms | < 0.1 | < 300KB | SSR, code split routes |
| **Embedded Apps** | < 3.0s | < 300ms | < 0.1 | < 250KB | Dynamic import, lazy |

### 13.2 Cloudflare Edge Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| DNS Resolution | < 20ms | Cloudflare DNS [^167^] |
| TTFB (global) | < 50ms | Edge caching [^167^] |
| Asset Delivery | < 30ms | Cache HIT at edge |
| API Response | < 100ms | KV cache + edge compute |

---

## 14. SEO Preservation Checklist

### 14.1 Pre-Migration (20+ Items)

- [ ] Crawl all existing sites with Screaming Frog
- [ ] Export all URLs with traffic data from Google Analytics 4
- [ ] Document current keyword rankings (top 100 per domain)
- [ ] Export backlink profiles from Ahrefs/SEMrush
- [ ] Identify top 20% of pages driving 80% of traffic
- [ ] Check Google Search Console for existing issues
- [ ] Audit Core Web Vitals for all domains
- [ ] Create complete URL mapping (old -> new) for every page
- [ ] Plan content improvements during migration
- [ ] Identify duplicate content across domains
- [ ] Audit internal linking structure
- [ ] Document all structured data / schema markup
- [ ] Check for hreflang tags if multi-language
- [ ] Verify robots.txt on all domains
- [ ] Export all meta titles and descriptions
- [ ] Document all canonical URLs
- [ ] Identify 404 errors to fix before migration
- [ ] Plan redirect strategy (page-level 301s)
- [ ] Set up staging environment
- [ ] Create rollback plan

### 14.2 Migration Execution

- [ ] Implement all 301 redirects (page-level, NOT domain-level)
- [ ] Ensure no redirect chains (>1 hop)
- [ ] Ensure no redirect loops
- [ ] Update canonical tags to new URLs
- [ ] Submit new sitemap.xml to Google Search Console
- [ ] Submit change of address in Google Search Console
- [ ] Update robots.txt with new sitemap references
- [ ] Migrate all structured data markup
- [ ] Preserve all internal links (update to new URLs)
- [ ] Ensure meta titles/descriptions transferred
- [ ] Verify all images have alt tags
- [ ] Check for broken links post-migration
- [ ] Verify HTTPS on all pages
- [ ] Test on mobile devices

### 14.3 Post-Migration

- [ ] Monitor Google Search Console daily (Week 1)
- [ ] Check for crawl errors
- [ ] Monitor ranking changes for top keywords
- [ ] Track organic traffic trends
- [ ] Verify redirect chains are working
- [ ] Update high-value external backlinks
- [ ] Monitor Core Web Vitals
- [ ] Check for duplicate content issues
- [ ] Verify structured data is valid
- [ ] Continue monitoring for 60-90 days

---

## 15. Risk Mitigation

### 15.1 Key Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **SEO Traffic Drop** | High | Medium | Page-level 301s, monitor closely, expect 3-6 month recovery [^168^] |
| **Redirect Chain Errors** | High | Medium | Automated testing, Screaming Frog validation |
| **Auth Session Issues** | High | Low | Thorough Clerk testing, fallback auth flow [^206^] |
| **Performance Regression** | Medium | Low | Performance budget, CI-based testing, monitoring |
| **Lovable Export Failures** | Medium | Medium | Manual export fallback, code audit before integration [^202^] |
| **DNS Propagation Delays** | Low | High | Lower TTL before migration, monitor with dig |
| **Content Loss** | High | Low | Full backups, staging validation before go-live |
| **Subdomain SSL Issues** | Medium | Low | Wildcard SSL certificate, test all domains |
| **Broken Internal Links** | Medium | Medium | Automated link checker, update all internal URLs |
| **Google Penalty** | High | Very Low | Follow all best practices, no shortcuts |

### 15.2 Rollback Plan

If critical issues occur post-launch:

1. **Immediate** (0-1 hour): Disable redirects, restore original DNS
2. **Short-term** (1-24 hours): Revert to staging, diagnose issues
3. **Medium-term** (1-7 days): Fix issues in staging, re-test
4. **Full rollback**: Point DNS back to original hosts, re-launch when fixed

---

## Summary: Top 10 Technical Decisions

### Decision 1: Master Domain = meok.ai
Short, brandable, memorable. All other domains redirect via 301 to meok.ai subdirectories. Rationale: "One domain to rule all" is the modern best practice [^170^].

### Decision 2: Subdirectory Structure Over Subdomains
Subdirectories (`meok.ai/council`) consolidate SEO authority; subdomains fragment it [^149^][^152^]. Only use subdomains for technically isolated apps (e.g., `app.meok.ai`).

### Decision 3: Hybrid Cloudflare + Vercel Architecture
Cloudflare handles DNS, edge caching, DDoS protection, and routing. Vercel hosts the Next.js application. Best of both worlds: 300+ edge locations + native Next.js support.

### Decision 4: Next.js Multi-Zone with Middleware
Single Next.js codebase using App Router with multi-zone architecture [^166^] and middleware-based domain detection [^156^]. Supports independent deploy cycles per zone.

### Decision 5: Clerk for Cross-Domain Authentication
Clerk's satellite domain feature [^206^] enables seamless SSO across all domains. Primary domain (meok.ai) holds auth state; satellite domains read it.

### Decision 6: Cloudflare Workers for Redirects
All legacy domains route through Cloudflare Workers that emit 301 redirects to the new meok.ai paths [^214^]. Preserves SEO equity efficiently at the edge.

### Decision 7: Migrate Lovable Apps to Next.js
Lovable apps exported and converted to Next.js [^159^] for proper SSR/SEO. Lovable remains a prototyping tool; production requires Next.js migration [^202^].

### Decision 8: Namecheap as Registrar + Cloudflare DNS
Keep domains registered at Namecheap for cost efficiency. Use Cloudflare for DNS management, proxying, and edge services [^183^].

### Decision 9: Supabase for Primary Database + Cloudflare KV for Edge Cache
Supabase (PostgreSQL) serves as the main database. Cloudflare KV handles sessions, feature flags, and redirect rules at the edge [^166^].

### Decision 10: 14-Week Phased Migration
Foundation (2w) -> Content Migration (4w) -> Integration (2w) -> Launch (2w) -> Post-Launch Monitoring (4w). Expect 3-6 months for full SEO stabilization [^168^].

---

## References

[^147^]: URLLO - Merging or consolidating two websites: a strategic SEO guide (2024). https://www.urllo.com/resources/learn/merging-or-consolidating-two-websites-a-strategic-seo-guide

[^148^]: Web Development Group - How to Merge Two Websites into One (2025). https://www.webdevelopmentgroup.com/insights/how-to-plan-for-and-merge-two-or-more-websites/

[^149^]: Zupo - Subdomain vs. Subdirectory: Which is Better for SEO? (2026). https://zupo.co/subdomain-vs-subdirectory-which-is-better-for-seo/

[^150^]: SEOEngico - Subdomain vs Subdirectory in 2026: AI Citations (2026). https://seoengico.com/blog/subdomain-vs-subdirectory-2026-ai-citations

[^151^]: Area10Marketing - Subdomain vs Subdirectory | International SEO (2025). https://area10marketing.com/en/subdomain-vs-subdirectory-international-seo/

[^152^]: BigRock - Subdomains vs Subdirectories: Which is Better for SEO in 2025? (2025). https://www.bigrock.in/blog/products/domains/subdomains-vs-subdirectories-for-seo

[^154^]: CausalFunnel - Boost Rankings with Effective Multisite for SEO Strategies (2026). https://www.causalfunnel.com/blog/multisite-for-seo-how-to-build-a-strategy-for-long-term-growth/

[^155^]: Search Engine Journal - How We Did It: Mastering Multi-Site SEO Case Study (2024). https://www.searchenginejournal.com/how-we-did-it-mastering-multi-site-seo-case-study/528621/

[^156^]: John Kavanagh - Building Multi-tenant Applications with Next.js (2026). https://johnkavanagh.co.uk/articles/building-a-multi-tenant-application-with-next-js/

[^157^]: DaveGoosem - How to structure your multi-site XM Cloud solution and deploy it to Vercel (2024). https://davegoosem.com/blog/how-to-structure-your-multi-site-xmcloud-solution-and-deploy-it-to-vercel

[^158^]: NameSilo - How Subdomains Impact Site Authority in Modern SEO (2024). https://www.namesilo.com/blog/en/marketing-tips/how-subdomains-impact-site-authority-in-modern-seo

[^159^]: IndieKit - Lovable to Next.js | Free Chrome Extension + AI Migration (2026). https://indiekit.pro/lovable-to-nextjs

[^160^]: Vercel - How can I serve multiple projects under a single domain? (2026). https://vercel.com/kb/guide/how-can-i-serve-multiple-projects-under-a-single-domain

[^162^]: DevGenius - Building a Multi-Tenant SaaS App with Next.js 14 (2025). https://blog.devgenius.io/building-a-multi-tenant-saas-app-with-next-js-14-3df64e5a4cc4

[^163^]: Dev.to - From Lovable.dev to Next.js SEO (2025). https://dev.to/digitaldev/from-lovabledev-to-nextjs-seo-upgrade-your-react-site-in-minutes-1gnn

[^166^]: Next.js Docs - Multi-zones (2026). https://nextjs.org/docs/app/guides/multi-zones

[^167^]: Digital Applied - Edge Computing: Cloudflare Workers Dev Guide 2026 (2026). https://www.digitalapplied.com/blog/edge-computing-cloudflare-workers-development-guide-2026

[^168^]: Medium - How Supabase implemented micro-frontends using Multi Zones in Next.js (2024). https://medium.com/@thinkthroo/how-supabase-implemented-micro-frontends-using-multi-zones-in-next-js-0033d740b9d6

[^170^]: E-Spin Corp - Domain Strategy: One Domain to Rule All in the AI Era (2025). https://www.e-spincorp.com/domain-strategy-one-domain-to-rule-all-ai-era/

[^171^]: The Media Captain - One Website vs. Multiple Websites: What's Best for SEO (2026). https://www.themediacaptain.com/one-website-vs-multiple-websites-whats-best-for-seo/

[^172^]: NextDevKit - Cloudflare D1 Database Docs (2025). https://nextdevkit.com/docs/database/database-cloudflare-d1

[^175^]: Lewis Kori - Deploying a Next.js Monorepo to Cloudflare Workers (2026). https://lewiskori.com/blog/deploying-a-next-js-monorepo-to-cloudflare-workers/

[^176^]: OpenNext - Cloudflare Adapter (2026). https://opennext.js.org/cloudflare

[^177^]: NameSilo - Domain Forwarding & Redirection: How to Preserve SEO Rankings (2024). https://www.namesilo.com/blog/en/marketing-tips/domain-forwarding--redirection-how-to-preserve-seo-rankings

[^179^]: Northflank - Railway vs Cloudflare vs Vercel (2026). https://northflank.com/blog/railway-vs-cloudflare-vs-vercel

[^180^]: AI-Infra-Link - Vercel vs Netlify vs Cloudflare Pages: 2025 Comparison (2026). https://www.ai-infra-link.com/vercel-vs-netlify-vs-cloudflare-pages-2025-comparison-for-developers/

[^181^]: RoastWeb - How to Fix Core Web Vitals in Next.js (2025). https://roastweb.com/blog/core-web-vitals-nextjs

[^183^]: David Isaksson - Moving DNS hosting from Namecheap to Cloudflare (2025). https://davidisaksson.dev/posts/dns-migration-to-cloudflare/

[^184^]: MakersDen - How to Optimize Core Web Vitals in NextJS App Router for 2025 (2025). https://makersden.io/blog/optimize-web-vitals-in-nextjs-2025

[^185^]: Namecheap - How to Change DNS For a Domain (2025). https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-change-dns-for-a-domain/

[^188^]: Dev.to - Cloudflare vs Vercel vs Netlify: The Truth about Edge Performance 2026 (2026). https://dev.to/dataformathub/cloudflare-vs-vercel-vs-netlify-the-truth-about-edge-performance-2026-50h0

[^189^]: Namecheap - How to set up DNS records for your domain in a Cloudflare account (2024). https://www.namecheap.com/support/knowledgebase/article.aspx/9607/2210/how-to-set-up-dns-records-for-your-domain-in-a-cloudflare-account/

[^190^]: Dev.to - Optimizing Next.js Websites for Core Web Vitals and Page Performance (2024). https://dev.to/abhay1kumar/optimizing-nextjs-websites-for-core-web-vitals-and-page-performance-5713

[^202^]: Azumo - Lovable AI Review: Key Limitations & How to Prepare Your App for Production (2026). https://azumo.com/artificial-intelligence/ai-insights/lovable-ai-limitations-benefits

[^203^]: Fora Soft - Lovable App Bugs: How to Fix Them, When to Hire Developers (2026). https://forasoft.medium.com/lovable-app-bugs-how-to-fix-them-when-to-hire-developers-realistic-costs-2026-946199c6496d

[^204^]: FastDev - Lovable: Why Startups Outgrow It (2025). https://www.fastdev.com/blog/blog/startups-scaleups-lovable-limitations/

[^205^]: ShipAI - Created a Lovable App? Here's How to Scale It for Real Users (2025). https://www.shipai.dev/blog/lovable-app-scaling-production-ready

[^206^]: Clerk - Authentication across different domains - Satellite Domains. https://clerk.com/docs/guides/dashboard/dns-domains/satellite-domains

[^207^]: Clerk - Multiple domains for enterprise SSO connections (2025). https://clerk.com/changelog/2025-06-25-multiple-domains-sso

[^214^]: Hrithwik.dev - Use Cloudflare Workers as a Reverse Proxy (2022). https://blog.hrithwik.dev/use-cloudflare-workers-as-a-reverse-proxy

[^168^]: Sadekur Rahman - How to Solve Multi-Domain SEO Strategy Problems for Brand Growth (2026). https://sadekurrahman.com/how-to-solve-multi-domain-seo-strategy-problems-for-brand-growth/

[^165^]: Vercel - Platforms Starter Kit (Multi-tenant example). https://vercel.com/templates/next.js/platforms-starter-kit

[^166^]: EastonDev - Cloudflare Workers KV in Practice: A Complete Guide (2026). https://eastondev.com/blog/en/posts/dev/20260422-cloudflare-workers-kv-guide/

[^173^]: HubSpot - Website Consolidation Guide: Unify Multiple Domains. https://www.hubspot.com/consolidate-multiple-websites-unify-domain

[^208^]: Trickle - Lovable AI Review: The Good, Bad & Pricing Explained (2025). https://trickle.so/blog/lovable-ai-review

[^212^]: Dock.io - Cross-Domain Authentication: What It Is, Why It's Hard, and How It Works. https://www.dock.io/post/cross-domain-authentication
