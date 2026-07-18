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
