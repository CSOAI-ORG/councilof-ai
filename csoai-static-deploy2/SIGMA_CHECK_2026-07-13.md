# SIGMA CHECK — 2026-07-13

**Audit:** every `defoneos-*.html` page in `/Users/nicholas/clawd/csoai-static-deploy2/` against the 8-signal sovereign gate.

**Working dir:** `/Users/nicholas/clawd/csoai-static-deploy2/`
**Pages audited:** 300 (task brief said 299; filesystem holds 300 — all 300 audited).
**Method:** read-only static HTML grep on each file. No deploys, no mutations.
**Output:** this file + `.sigma_audit_results.json` + `.sigma_audit_totals.json` in the deploy dir.

---

## 1-Page Summary

- **Pages passing ALL 8 signals: 0 / 300** (0.0%)
- **Pages failing ≥1 signal: 300 / 300** (100.0%)

### Per-signal pass rate

| Signal | Pass | Fail | Pass rate |
|---|---:|---:|---:|
| S1 — meta description | 281 | 19 | 93.7% |
| S2 — canonical | 111 | 189 | 37.0% |
| S3 — og:title+og:description | 118 | 182 | 39.3% |
| S4 — JSON-LD Article | 0 | 300 | 0.0% |
| S5 — Article 50 banner | 166 | 134 | 55.3% |
| S6 — link to /master | 1 | 299 | 0.3% |
| S7 — SIGIL footer/receipt | 269 | 31 | 89.7% |
| S8 — CTA article-50/owem-rfq | 1 | 299 | 0.3% |

### Fail-count distribution (out of 8 signals)

| Failing signals | Pages | % of estate |
|---:|---:|---:|
| 3 | 44 | 14.7% |
| 4 | 69 | 23.0% |
| 5 | 106 | 35.3% |
| 6 | 57 | 19.0% |
| 7 | 19 | 6.3% |
| 8 | 5 | 1.7% |

### Hard truths

- **S4 JSON-LD Article schema: 0/300 pages.** The estate has zero Article-schema structured data. This is the single biggest gap and is blocking Article 50–era rich-result eligibility and machine-readable provenance.
- **S6 link to `/master`: 1/300 pages.** Only `defoneos-article-50.html` references `/master` (and only because it references itself in context). No cross-page sovereign hub wiring.
- **S8 CTA to `/defoneos-article-50` or `/defoneos-owem-rfq`: 1/300 pages.** No commercial conversion path is wired into the rest of the estate. Only `defoneos-article-50.html` self-links.
- **S2 canonical: 37.0% pass. S3 og tags: 39.3% pass.** Roughly 6 in 10 pages are missing canonicals and OpenGraph metadata — basic GEO/AEO hygiene gap.
- **S5 Article 50 banner: 55.3% pass.** Slightly more than half reference EU AI Act / Article 50 — the rest are non-EU-AI-Act-anchored surfaces.
- **S1 description (93.7%) and S7 SIGIL (89.7%) are the strongest signals** — most pages do have meta description and SIGIL footer/receipt reference.

---

## Top 10 Highest-Traffic Pages Needing Immediate Patch

Hub pages (named traffic anchors / conversion surfaces) are listed first, then worst-failing non-hub pages, sorted by fail-count (DESC) then size (DESC) as a substance proxy.

| Rank | Page | HUB | Failing | Missing signals |
|---:|---|:---:|---:|---|
| 1 | `defoneos-owem-rfq.html` | YES | 5/8 | S2, S3, S4, S6, S8 |
| 2 | `defoneos-mod-public-evidence-pack.html` | YES | 5/8 | S2, S3, S4, S6, S8 |
| 3 | `defoneos-mod-board-update.html` | YES | 5/8 | S2, S3, S4, S6, S8 |
| 4 | `defoneos-mod-uk-sovereign-pitch.html` | YES | 5/8 | S2, S3, S4, S6, S8 |
| 5 | `defoneos-mod-auditor-counter.html` | YES | 5/8 | S2, S3, S4, S6, S8 |
| 6 | `defoneos-mod-defcon-760-cross-walk.html` | YES | 5/8 | S2, S3, S4, S6, S8 |
| 7 | `defoneos-mod-post-pilot-lessons-learned.html` | YES | 5/8 | S2, S3, S4, S6, S8 |
| 8 | `defoneos-index.html` | YES | 4/8 | S4, S5, S6, S8 |
| 9 | `defoneos-article-50.html` | YES | 3/8 | S2, S3, S4 |
| 10 | `defoneos-mod-dsp-registration-walkthrough.html` | — | 8/8 | S1, S2, S3, S4, S5, S6, S7, S8 |

### Per-page patch recipes (top 10)

**1. `defoneos-owem-rfq.html`** — 5/8 signals missing (size 35,902b)
- Patch: add `<link rel="canonical" href="https://csoai-static-deploy2.vercel.app/{page}">`; add `<meta property="og:title">` + `<meta property="og:description">`; add a `<script type="application/ld+json">` block containing `"@context": "https://schema.org"` + `"@type": "Article"`; add sovereign-hub link `<a href="/master">Master Index</a>`; add CTA strip linking to `/defoneos-article-50` AND `/defoneos-owem-rfq`.

**2. `defoneos-mod-public-evidence-pack.html`** — 5/8 signals missing (size 20,980b)
- Patch: add `<link rel="canonical" href="https://csoai-static-deploy2.vercel.app/{page}">`; add `<meta property="og:title">` + `<meta property="og:description">`; add a `<script type="application/ld+json">` block containing `"@context": "https://schema.org"` + `"@type": "Article"`; add sovereign-hub link `<a href="/master">Master Index</a>`; add CTA strip linking to `/defoneos-article-50` AND `/defoneos-owem-rfq`.

**3. `defoneos-mod-board-update.html`** — 5/8 signals missing (size 19,576b)
- Patch: add `<link rel="canonical" href="https://csoai-static-deploy2.vercel.app/{page}">`; add `<meta property="og:title">` + `<meta property="og:description">`; add a `<script type="application/ld+json">` block containing `"@context": "https://schema.org"` + `"@type": "Article"`; add sovereign-hub link `<a href="/master">Master Index</a>`; add CTA strip linking to `/defoneos-article-50` AND `/defoneos-owem-rfq`.

**4. `defoneos-mod-uk-sovereign-pitch.html`** — 5/8 signals missing (size 18,069b)
- Patch: add `<link rel="canonical" href="https://csoai-static-deploy2.vercel.app/{page}">`; add `<meta property="og:title">` + `<meta property="og:description">`; add a `<script type="application/ld+json">` block containing `"@context": "https://schema.org"` + `"@type": "Article"`; add sovereign-hub link `<a href="/master">Master Index</a>`; add CTA strip linking to `/defoneos-article-50` AND `/defoneos-owem-rfq`.

**5. `defoneos-mod-auditor-counter.html`** — 5/8 signals missing (size 17,257b)
- Patch: add `<link rel="canonical" href="https://csoai-static-deploy2.vercel.app/{page}">`; add `<meta property="og:title">` + `<meta property="og:description">`; add a `<script type="application/ld+json">` block containing `"@context": "https://schema.org"` + `"@type": "Article"`; add sovereign-hub link `<a href="/master">Master Index</a>`; add CTA strip linking to `/defoneos-article-50` AND `/defoneos-owem-rfq`.

**6. `defoneos-mod-defcon-760-cross-walk.html`** — 5/8 signals missing (size 16,882b)
- Patch: add `<link rel="canonical" href="https://csoai-static-deploy2.vercel.app/{page}">`; add `<meta property="og:title">` + `<meta property="og:description">`; add a `<script type="application/ld+json">` block containing `"@context": "https://schema.org"` + `"@type": "Article"`; add sovereign-hub link `<a href="/master">Master Index</a>`; add CTA strip linking to `/defoneos-article-50` AND `/defoneos-owem-rfq`.

**7. `defoneos-mod-post-pilot-lessons-learned.html`** — 5/8 signals missing (size 15,595b)
- Patch: add `<link rel="canonical" href="https://csoai-static-deploy2.vercel.app/{page}">`; add `<meta property="og:title">` + `<meta property="og:description">`; add a `<script type="application/ld+json">` block containing `"@context": "https://schema.org"` + `"@type": "Article"`; add sovereign-hub link `<a href="/master">Master Index</a>`; add CTA strip linking to `/defoneos-article-50` AND `/defoneos-owem-rfq`.

**8. `defoneos-index.html`** — 4/8 signals missing (size 8,524b)
- Patch: add a `<script type="application/ld+json">` block containing `"@context": "https://schema.org"` + `"@type": "Article"`; add EU AI Act Article 50 banner block (top or sidebar); add sovereign-hub link `<a href="/master">Master Index</a>`; add CTA strip linking to `/defoneos-article-50` AND `/defoneos-owem-rfq`.

**9. `defoneos-article-50.html`** — 3/8 signals missing (size 33,479b)
- Patch: add `<link rel="canonical" href="https://csoai-static-deploy2.vercel.app/{page}">`; add `<meta property="og:title">` + `<meta property="og:description">`; add a `<script type="application/ld+json">` block containing `"@context": "https://schema.org"` + `"@type": "Article"`.

**10. `defoneos-mod-dsp-registration-walkthrough.html`** — 8/8 signals missing (size 17,322b)
- Patch: add `<link rel="canonical" href="https://csoai-static-deploy2.vercel.app/{page}">`; add `<meta property="og:title">` + `<meta property="og:description">`; add a `<script type="application/ld+json">` block containing `"@context": "https://schema.org"` + `"@type": "Article"`; add EU AI Act Article 50 banner block (top or sidebar); add sovereign-hub link `<a href="/master">Master Index</a>`; add CTA strip linking to `/defoneos-article-50` AND `/defoneos-owem-rfq`; add `<meta name="description" content="...">`; add SIGIL footer / receipt reference.

---

## Full Per-Page Audit Table (300 pages, 8 boolean columns)

Legend: ✅ = signal present, ❌ = signal missing. Columns: S1=meta desc, S2=canonical, S3=og:title+og:description, S4=JSON-LD Article, S5=Article 50 banner, S6=/master link, S7=SIGIL footer/receipt, S8=CTA to article-50/owem-rfq.

| # | Page | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | Fail |
|---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---:|
| 1 | `defoneos-10-day-sprint-retrospective.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 2 | `defoneos-100.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 3 | `defoneos-33-bft-council.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 4 | `defoneos-7-day-plan.html` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 6 |
| 5 | `defoneos-90-day-commercial-calculator.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 7 |
| 6 | `defoneos-999.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 7 | `defoneos-academy.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 8 | `defoneos-adversarial-robustness.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 9 | `defoneos-aisi-evaluation.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 10 | `defoneos-anthropic.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 11 | `defoneos-anti-fabrication.html` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 12 | `defoneos-api-docs.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 13 | `defoneos-api-playground.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 14 | `defoneos-api.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 15 | `defoneos-architecture.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 16 | `defoneos-article-50.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | 3 |
| 17 | `defoneos-audit-pack.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 18 | `defoneos-aukus-proposal.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 19 | `defoneos-aukus.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 20 | `defoneos-automated-decision.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 21 | `defoneos-battle-card.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 22 | `defoneos-benchmarks.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 23 | `defoneos-bft-transcript.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 24 | `defoneos-bft.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 25 | `defoneos-blackhat.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 26 | `defoneos-build.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 27 | `defoneos-cabinet-office-sro-pack.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 28 | `defoneos-case-studies.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 29 | `defoneos-ce-marking.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 30 | `defoneos-cesium-3d-cop.html` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 8 |
| 31 | `defoneos-changelog.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 32 | `defoneos-charter-universe.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 33 | `defoneos-charter.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 34 | `defoneos-checklist.html` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 35 | `defoneos-china.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 36 | `defoneos-ciso-selfscan.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 37 | `defoneos-civil-services-nhs.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 38 | `defoneos-civil-services.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 39 | `defoneos-cnic-pillar-2-proposal.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 40 | `defoneos-co-pilot-takeover-script.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 41 | `defoneos-commands.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 42 | `defoneos-compare.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 43 | `defoneos-compete.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 44 | `defoneos-compliance-crosswalk.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 45 | `defoneos-compliance-suite.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 6 |
| 46 | `defoneos-conformity-assessment.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 47 | `defoneos-conspiracy.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 48 | `defoneos-constitution.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 49 | `defoneos-contact.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 50 | `defoneos-cost-comparison.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 51 | `defoneos-counterdrone.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 52 | `defoneos-cpni-csp-evidence.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 6 |
| 53 | `defoneos-crown-agreement.html` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 54 | `defoneos-crown-pack.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 55 | `defoneos-crown-procurement.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 56 | `defoneos-crownjewels.html` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 6 |
| 57 | `defoneos-cyber-essentials-application.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 6 |
| 58 | `defoneos-cyber.html` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 59 | `defoneos-dasa-application.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 60 | `defoneos-dasa.html` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 6 |
| 61 | `defoneos-data-governance.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 62 | `defoneos-data.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 63 | `defoneos-defence-academy-pitch.html` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 6 |
| 64 | `defoneos-defence-primes.html` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 65 | `defoneos-defense-rfq.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 66 | `defoneos-defra-environment.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 6 |
| 67 | `defoneos-demo.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 68 | `defoneos-deploy.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 69 | `defoneos-deployer-obligations.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 70 | `defoneos-deployment-comparison.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 71 | `defoneos-deployment-runbook.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 72 | `defoneos-digital-twin.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 73 | `defoneos-domains.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 74 | `defoneos-drones.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 75 | `defoneos-dsrb.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 76 | `defoneos-dstl-dasa-submission-walkthrough.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 7 |
| 77 | `defoneos-e2e-results.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 78 | `defoneos-eat-control.html` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 6 |
| 79 | `defoneos-edge.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 80 | `defoneos-email-deliverability-auto-verifier.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 7 |
| 81 | `defoneos-email-deliverability-hardening.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 82 | `defoneos-energy-desnz.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 83 | `defoneos-eu-ai-act-deep-dive.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 84 | `defoneos-eu-declaration.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 85 | `defoneos-evidence-vault.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 86 | `defoneos-faq-investors.html` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 87 | `defoneos-faq-v2.html` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 6 |
| 88 | `defoneos-faq.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 89 | `defoneos-fcdo-sanctions-dev.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 90 | `defoneos-finance-treasury.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 91 | `defoneos-finance.html` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 92 | `defoneos-five-eyes-proposal.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 93 | `defoneos-fiveeyes.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 94 | `defoneos-framing.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 95 | `defoneos-freetak.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 96 | `defoneos-frequency.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 97 | `defoneos-fundamental-rights-impact-assessment.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 98 | `defoneos-future.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 99 | `defoneos-fvey-pitch.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 100 | `defoneos-gap-analysis.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 101 | `defoneos-gcloud14-listing-bundle.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 6 |
| 102 | `defoneos-gemini.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 103 | `defoneos-give-me-5.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 104 | `defoneos-global.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 105 | `defoneos-globe.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 106 | `defoneos-glossary.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 107 | `defoneos-gpai-transparency.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 108 | `defoneos-grants-uk.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 109 | `defoneos-grants.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 110 | `defoneos-healthcare.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 111 | `defoneos-hives.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 112 | `defoneos-hmg-commercial-finder.html` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 8 |
| 113 | `defoneos-home-office-border.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 114 | `defoneos-human-oversight-deep.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 115 | `defoneos-human-oversight.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 116 | `defoneos-incident-response.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 117 | `defoneos-index.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 118 | `defoneos-install.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 119 | `defoneos-integrate.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 120 | `defoneos-integration.html` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 121 | `defoneos-investor-deck.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 122 | `defoneos-investor-onepager.html` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 123 | `defoneos-investor-thesis.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 124 | `defoneos-iso-42001-deep-dive.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 125 | `defoneos-isr-cesium-demo.html` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 7 |
| 126 | `defoneos-isr-pipeline.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 127 | `defoneos-jsp936.html` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 128 | `defoneos-knowledge.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 129 | `defoneos-labs.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 130 | `defoneos-launch.html` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 6 |
| 131 | `defoneos-ledger.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 132 | `defoneos-live.html` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 133 | `defoneos-m2.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 134 | `defoneos-market-surveillance.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 135 | `defoneos-mava-reward-inspector.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 7 |
| 136 | `defoneos-mava-swarm.html` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 7 |
| 137 | `defoneos-mava-training.html` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 7 |
| 138 | `defoneos-mcp-registry.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 139 | `defoneos-medevac.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 140 | `defoneos-moat.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 141 | `defoneos-mod-30-60-90-customer.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 142 | `defoneos-mod-30-60-90-day-onboarding.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 143 | `defoneos-mod-48h-follow-up-sequence.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 144 | `defoneos-mod-90-day-sovereign-pilot-sow.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 145 | `defoneos-mod-air-gap-deployment-guide.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 146 | `defoneos-mod-auditor-counter.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 147 | `defoneos-mod-board-decision-pack.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 148 | `defoneos-mod-board-update.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 149 | `defoneos-mod-buyer-reply-triage-dashboard.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 150 | `defoneos-mod-buyer-triage.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 151 | `defoneos-mod-call-prep-brief.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 7 |
| 152 | `defoneos-mod-ceo-letter.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 153 | `defoneos-mod-champion-bio.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 154 | `defoneos-mod-champion-memo.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 155 | `defoneos-mod-churn-prevention.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 156 | `defoneos-mod-competitive-battle-card.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 157 | `defoneos-mod-contract-award-letter.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 158 | `defoneos-mod-crm-tracking-pipeline.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 7 |
| 159 | `defoneos-mod-customer-success-scorecard.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 160 | `defoneos-mod-dapa-defence-as-platform.html` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 8 |
| 161 | `defoneos-mod-day-0-pilot-launch-runbook.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 7 |
| 162 | `defoneos-mod-deal-defcon-comparison.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 163 | `defoneos-mod-deal-economics-roi.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 7 |
| 164 | `defoneos-mod-defcon-760-cross-walk.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 165 | `defoneos-mod-defcon-760.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 166 | `defoneos-mod-dsea-safety.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 167 | `defoneos-mod-dsp-registration-walkthrough.html` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 8 |
| 168 | `defoneos-mod-dstl.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 169 | `defoneos-mod-escalation-runbook.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 170 | `defoneos-mod-evidence-room-index.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 171 | `defoneos-mod-first-email-blueprint.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 7 |
| 172 | `defoneos-mod-gtm-launch-kit.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 173 | `defoneos-mod-investor-pitch.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 174 | `defoneos-mod-jsp-compliance.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 6 |
| 175 | `defoneos-mod-live-demo-fallback-script.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 176 | `defoneos-mod-meeting-notes-to-sow.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 177 | `defoneos-mod-minister-briefing.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 178 | `defoneos-mod-no-reply-nurture-calendar.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 179 | `defoneos-mod-no-reply-nurture.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 180 | `defoneos-mod-objection-handling-playbook.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 6 |
| 181 | `defoneos-mod-outreach-tracker.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 7 |
| 182 | `defoneos-mod-partner-channel-kit.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 183 | `defoneos-mod-pilot-evidence-pack.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 184 | `defoneos-mod-pilot-risk-acceptance.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 185 | `defoneos-mod-portfolio-priority-list.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 7 |
| 186 | `defoneos-mod-post-pilot-lessons-learned.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 187 | `defoneos-mod-pricing-card-onepager.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 188 | `defoneos-mod-pricing-defense.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 189 | `defoneos-mod-prime-prime-pitch.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 190 | `defoneos-mod-procurement-rebuttal-grid.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 191 | `defoneos-mod-proposal-pack.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 192 | `defoneos-mod-proposal.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 193 | `defoneos-mod-public-evidence-pack.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 194 | `defoneos-mod-quarterly-review.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 195 | `defoneos-mod-red-team-rubric.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 196 | `defoneos-mod-referral-partner-letter.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 6 |
| 197 | `defoneos-mod-renewal-negotiation.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 198 | `defoneos-mod-renewal-upsell-playbook.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 199 | `defoneos-mod-rfp-response-runbook.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 200 | `defoneos-mod-second-meeting-deep-dive.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 7 |
| 201 | `defoneos-mod-technical-validation-agenda.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 202 | `defoneos-mod-uk-sovereign-pitch.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 203 | `defoneos-mod-vendor-pivot-playbook.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 204 | `defoneos-mod.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 205 | `defoneos-morning.html` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 7 |
| 206 | `defoneos-mot-transport.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 6 |
| 207 | `defoneos-nato-ags-channel.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 208 | `defoneos-nato-diana-application.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 6 |
| 209 | `defoneos-nato-diana.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 210 | `defoneos-nato-dsrb.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 211 | `defoneos-nato-sto-collaboration-pitch.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 6 |
| 212 | `defoneos-nato-sto-pitch.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 6 |
| 213 | `defoneos-nato.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 214 | `defoneos-neural.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 215 | `defoneos-news-2026-07.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 216 | `defoneos-nhs-dhsc.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 217 | `defoneos-noise.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 218 | `defoneos-nvidia.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 219 | `defoneos-onboarding.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 220 | `defoneos-ontology.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 221 | `defoneos-opensource.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 222 | `defoneos-ops-control.html` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 223 | `defoneos-os.html` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 224 | `defoneos-oscal-catalog.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 225 | `defoneos-oscal-deep-dive.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 226 | `defoneos-oscalssp-pipeline.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 227 | `defoneos-owem-rfq.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 228 | `defoneos-partner-ecosystem.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 229 | `defoneos-partner-integration.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 230 | `defoneos-partners.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 231 | `defoneos-patents.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 232 | `defoneos-pilot.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 233 | `defoneos-pipeline.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 234 | `defoneos-post-market-monitoring.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 235 | `defoneos-press.html` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 236 | `defoneos-pricing.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 237 | `defoneos-prime-pitch.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 238 | `defoneos-privacy.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 239 | `defoneos-procurement-guide.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 240 | `defoneos-protocols.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 241 | `defoneos-quality-management.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 242 | `defoneos-realworld.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 243 | `defoneos-record-keeping.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 244 | `defoneos-regulators.html` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 245 | `defoneos-right-to-explanation.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 246 | `defoneos-risk-management.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 247 | `defoneos-roadmap-v2.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 248 | `defoneos-roadmap.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 249 | `defoneos-roi-calculator.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 250 | `defoneos-sc-clearance.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 251 | `defoneos-security-architecture.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 252 | `defoneos-security.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 253 | `defoneos-sensor-layer.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 254 | `defoneos-seriesa.html` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 255 | `defoneos-ships.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 256 | `defoneos-sigil.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 257 | `defoneos-signup-hub.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 258 | `defoneos-signup-v2.html` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 259 | `defoneos-sov-town.html` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 260 | `defoneos-sov3.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 261 | `defoneos-sovereign-cloud.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 262 | `defoneos-sovereign-proof-pack.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 263 | `defoneos-sovereign.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 264 | `defoneos-sovereignty.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 265 | `defoneos-sovspace.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 266 | `defoneos-sprint-monitor.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 267 | `defoneos-sprint.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 268 | `defoneos-stack-assembled.html` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 6 |
| 269 | `defoneos-stack.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 270 | `defoneos-start.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 271 | `defoneos-status.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 272 | `defoneos-substrate.html` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 273 | `defoneos-swarm.html` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 5 |
| 274 | `defoneos-system-card.html` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4 |
| 275 | `defoneos-team.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 276 | `defoneos-technical-documentation.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 277 | `defoneos-term-sheet.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 278 | `defoneos-terms.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 279 | `defoneos-testing-framework.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 280 | `defoneos-thanks.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 281 | `defoneos-threat-model.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 282 | `defoneos-timeline.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 283 | `defoneos-train.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 284 | `defoneos-training-cert.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 285 | `defoneos-transparency-deployers.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 286 | `defoneos-transparency-register.html` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5 |
| 287 | `defoneos-tunnels.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 288 | `defoneos-ue5.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 5 |
| 289 | `defoneos-uk-cloud-pitch.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 290 | `defoneos-uk-deployment-guide.html` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 7 |
| 291 | `defoneos-uk-mod-acquisition-procurement.html` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 8 |
| 292 | `defoneos-ukdi-outreach.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 293 | `defoneos-use-cases.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 294 | `defoneos-user.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 295 | `defoneos-verify.html` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | 3 |
| 296 | `defoneos-win.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 297 | `defoneos-work.html` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 4 |
| 298 | `defoneos-yolov8-demo.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 6 |
| 299 | `defoneos-yolov8-finetune.html` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 7 |
| 300 | `defoneos-yorkshire-twin-script.html` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 7 |

---

## Grand Totals

- Total defoneos-*.html pages audited: **300**
- Pages passing all 8 sovereign signals: **0**
- Pages failing ≥1 signal: **300**

### Per-signal totals

| Signal | Pass | Fail |
|---|---:|---:|
| S1 | 281 | 19 |
| S2 | 111 | 189 |
| S3 | 118 | 182 |
| S4 | 0 | 300 |
| S5 | 166 | 134 |
| S6 | 1 | 299 |
| S7 | 269 | 31 |
| S8 | 1 | 299 |

### Pages failing ≥1 check

**300 of 300 pages fail at least one sovereign signal.**

Distribution by fail-count:

| Failing signals | Pages |
|---:|---:|
| 3 | 44 |
| 4 | 69 |
| 5 | 106 |
| 6 | 57 |
| 7 | 19 |
| 8 | 5 |

### Pages passing ALL 8 signals

**(none — 0/300 pages pass the sovereign signal gate.)**

---

## Appendix — Methodology

Each `defoneos-*.html` file was scanned (regex, case-insensitive) for the 8 sovereign signals. Definitions:

- **S1** — `<meta name="description" ...>` tag present
- **S2** — `<link rel="canonical" ...>` tag present
- **S3** — both `<meta property="og:title">` AND `<meta property="og:description">` present
- **S4** — at least one `<script type="application/ld+json">` block containing `"@type":"Article"`
- **S5** — text reference to `Article 50` OR `EU AI Act` (banner / disclosure language)
- **S6** — `<a href=".../master">` link present anywhere
- **S7** — text matching `SIGIL`, `SIGIL|`, `receipt`, `sigil-anchor`, `sigil-chain`, or `sigil_digest`
- **S8** — `<a href=".../defoneos-article-50">` OR `<a href=".../defoneos-owem-rfq">` present

Audit script: `.sigma_audit.py` · Raw JSON: `.sigma_audit_results.json` · Totals JSON: `.sigma_audit_totals.json`

**Final path of this report:** `/Users/nicholas/clawd/csoai-static-deploy2/SIGMA_CHECK_2026-07-13.md`
