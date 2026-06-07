# EOD AUDIT — MEOK Live Infrastructure & Content

**Date:** 2026-06-06
**Scope:** Vercel project health (team `team_4IkNIyYl7TtEOi9aoz17SUO7`, 50 projects = API cap), live domains, content/blog inventory, PAYG + attestation endpoints.
**Method:** Vercel MCP (`list_projects`, `get_project`) + `curl` HEAD/GET. READ-ONLY — no deploys, no changes.

---

## 1. Summary

- **Live domains verified:** 22 apex/host domains returning HTTP 200 with real content.
- **Broken/down live domains:** 0. (One probed domain, `muckaway.co.uk`, does not resolve — code 000 — but it has no Vercel project; treat as not-provisioned, not "broken".)
- **Vercel projects with FAILED latest production build:** 5 — `meok-ai` (ERROR), `safetyofai` (ERROR), `suicidestop-ai` (ERROR), `cobol-bridge` (BLOCKED), `councilof-ai` (BLOCKED). **None of these takes a live domain down** — each live apex is served either by a sibling project or by an older good deployment.
- **meok.ai blog:** 351 published posts (programmatic SEO). Full pricing ladder live (Open Source / Pro £19 / Defence / Enterprise / Family / PAYG £0.05/call).
- **PAYG + attestation:** both endpoints healthy — `councilof.ai/payg` (200, real billing page, 7 MCPs, USDC-on-Base) and `meok-attestation-api.vercel.app/payg/balance` (functional; returns `{"error":"Missing 'token' query param"}` without a token).

> **Key nuance:** "latest production = ERROR/BLOCKED" in Vercel does NOT mean the public site is down. The most recent *push* failed, but the live domain keeps serving the last successful deployment. Worth a clean redeploy on the 5 flagged projects to stop drift, but no live-site outage exists right now.

---

## 2. Live Domains — status table

| Domain | HTTP | Live? | Served by (Vercel project unless noted) | Notes |
|---|---|---|---|---|
| meok.ai | 307→200 | LIVE | `meok` (Next.js, READY) | apex 307→`www.meok.ai`. Flagship. 50+ routes, 351-post blog. llms.txt ✅ (via www) |
| councilof.ai | 200 | LIVE | `council-ai-storefront` (READY) | single-page (22 KB), 3 tiers, PAYG. llms.txt ❌ (404). NOT served by the `councilof-ai` project (that one is BLOCKED/stale) |
| csoai.org | 200 | LIVE | `csoai-dashboard` (READY) — also claimed by `csoai-org` (READY) | ~157 KB. llms.txt ✅. Two projects bind csoai.org; dashboard has newest deploy |
| proofof.ai | 307→200 | LIVE | `meok-attestation-api` (Python, READY) | apex→www. Serves "MEOK Compliance MCP Catalogue" HTML. HEAD returns 501 (no HEAD handler) — **GET is 200, site is fine**. llms.txt ✅ (via www). NB: standalone `proofof-ai` project is READY but has NO custom domain attached |
| agisafe.ai | 307→200 | LIVE | `safetyofai` (latest prod ERROR, serving older good deploy) | apex 307→`/agi-safety`. "AGI/Frontier-AI Safety". llms.txt ❌ |
| safetyof.ai | 200 | LIVE | `safetyofai` (ERROR latest, older deploy live) | "Free AI Safety Posture Score" |
| suicidestop.ai | 200 | LIVE | `suicidestop-ai` (ERROR latest, older deploy live) | crisis-helplines page. Safety-critical — keep monitored |
| biasdetectionof.ai | 200 | LIVE | `biasdetectionof-ai` (READY) | "AI Bias Detection & Testing — CouncilOf.AI". llms.txt ❌ |
| transparencyof.ai | 200 | LIVE | `transparencyof-ai` (READY) | governance "of.ai" family |
| accountabilityof.ai | 200 | LIVE | `accountabilityof-ai` (READY) | governance "of.ai" family |
| dataprivacyof.ai | 200 | LIVE | `dataprivacyof-ai` (READY) | governance "of.ai" family |
| fishkeeper.ai | 307→200 | LIVE | (aquaculture vertical, Vercel) | apex→www. "AI Fish Disease Diagnosis". llms.txt ❌ |
| koikeeper.ai | 307→200 | LIVE | (aquaculture vertical, Vercel) | apex→www. "24/7 AI Koi Expert". llms.txt ❌ |
| aquaponics.app | 200 | LIVE | **Netlify** (NOT Vercel) | "Aquaponics Toolkit". llms.txt ❌ |
| optimobile.ai | 307→200 | LIVE | (optometry vertical, Vercel) | apex→www. "AI Optician Practice Mgmt". llms.txt ❌. (Correct spelling: optimobile.ai) |
| templeman-opticians.com | 200 | LIVE | (Vercel) | family business: home eye tests / care-home optician. llms.txt ✅ |
| haulage.app | 200 | LIVE | (trade umbrella, Vercel) | trade vertical |
| grabhire.ai | 200 | LIVE | (Vercel) | trade vertical |
| planthire.ai | 200 | LIVE | (Vercel) | trade vertical |
| cobolbridge.ai | 200 | LIVE | (Vercel) | migration brand |
| cobolbridge.com | 200 | LIVE | (Vercel) | migration brand |
| agentpayments.ai | 200 | LIVE | (Vercel) | A2A / agent commerce |
| api.meok.ai | (host) | LIVE | `meok-api-gateway` (READY) | API gateway |
| **muckaway.co.uk** | **000** | **NOT RESOLVING** | n/a | DNS/connection failure; no Vercel project bound. Either un-provisioned or DNS gap |

llms.txt present: meok.ai, csoai.org, proofof.ai, templeman-opticians.com. Missing on: councilof.ai, agisafe.ai, biasdetectionof.ai, fishkeeper.ai, koikeeper.ai, aquaponics.app, optimobile.ai (and the `of.ai` family). → quick AEO win available.

---

## 3. Vercel Project Health (inspected subset)

**Team:** `team_4IkNIyYl7TtEOi9aoz17SUO7` · 50 projects returned (API cap of 50 — list may be truncated; lower-priority projects beyond cap not individually pulled).

### READY (healthy latest production)
| Project | Latest prod | Live domain |
|---|---|---|
| meok | READY | meok.ai (via www) |
| council-ai-storefront | READY | councilof.ai |
| csoai-dashboard | READY | csoai.org / www.csoai.org |
| csoai-org | READY | (also binds csoai.org) |
| csoai-v2-app | READY | csoai-v2-app.vercel.app |
| csoai-readiness | READY | *.vercel.app only |
| meok-attestation-api | READY | proofof.ai + attestation API |
| proofof-ai | READY | **no custom domain attached** (only *.vercel.app) |
| meok-api-gateway | READY | api.meok.ai |
| biasdetectionof-ai | READY | biasdetectionof.ai |
| transparencyof-ai | READY | transparencyof.ai |
| accountabilityof-ai | READY | accountabilityof.ai |
| dataprivacyof-ai | READY | dataprivacyof.ai |
| haulage-app-umbrella | READY | *.vercel.app |

### ⚠️ FAILED latest production (live site NOT down — older deploy / sibling serves)
| Project | Latest prod state | Live impact |
|---|---|---|
| **meok-ai** | **ERROR** | None — meok.ai apex served by `meok` (Next.js, READY). `meok-ai.vercel.app` itself = 404. Secondary/legacy project; latest push broken |
| **safetyofai** | **ERROR** | None — agisafe.ai + safetyof.ai still serve 200 from prior good deploy |
| **suicidestop-ai** | **ERROR** | None — suicidestop.ai serves 200 from prior good deploy. **Safety-critical page; redeploy to clear drift** |
| **cobol-bridge** | **BLOCKED** | None — cobolbridge.ai/.com serve 200. BLOCKED = superseded; no apex on this project |
| **councilof-ai** | **BLOCKED** | None — councilof.ai served by `council-ai-storefront`. This project is stale/duplicate; candidate for cleanup |

### Other projects in account (not individually health-pulled; mostly MCP-server & trade deploys)
MCP servers: `a2a-governance-bridge-mcp`, `ai-gateway-mcp`, `agriculture-robotics-mcp`, `agent-orchestrator-mcp`, `agent-negotiation-mcp`, `agent-identity-trust-mcp`, `agent-delegation-mcp`, `agent-commerce-payments-mcp`, `ad-copy-ai-mcp`, `accounting-ai-mcp`, `accessibility-ai-mcp`.
Trade/utility: `haulage-deploy`, `muckaway-saas`, `muckaway-site`, `grabhire-ai-uk`, `planthire-ai-uk`, `planthire-site`, `wcr-grab-hire`, `cobolbridge-upgrade`, `ui`, `checkout-deploy`, `countdown`, `dpia-template`, `compliance-score`, `risk-classifier`, `fine-calculator`.
Severed-brand (CSGA / Erranova — should be archived per memory): `csga-global`, `csga-global-site`, `csga-global-v34`, `erranova`.
Duplicate/temp: `meok-api-gateway-tmp`.

---

## 4. Content / Blog Inventory

### meok.ai (flagship)
- **Blog posts: 351** (unique `/blog/<slug>`) — programmatic SEO, themes: AI-companion-for-X (loneliness, grief, elderly, autism, ADHD, dementia carers, menopause, bereavement, addiction, etc.), comparisons (MEOK vs Perplexity / Copilot / Character AI), explainers (Maternal Covenant, Ralph Mode, Sovereign AI), reviews.
- **Site routes (~50):** /about /features /how-it-works /pricing /docs /faq /demo /labs /characters (+ aria, gabriel, luna, marcus, sage, scout, shanti) /guardian (children/elderly/personal/scam-stop) /gaming (live-copilot/platforms/post-game/predator-stop/strategy) /family /governance /councilof /cobol /consulting /case-studies /a2a /bias-detection /article-50-kit /audit-prep-bundle /anthropic-registry /birth /checkout.
- **Pricing:** Open Source (free), Pro £19/mo, Defence, Enterprise, Family Plan, PAYG £0.05/call across 7 compliance MCPs. Prices seen: £9, £19, £29, £49, £99, £149, £499, £999/mo + £0.05/call + annual options. 30-day money-back. (Easter-egg "tap the egg" present.)
- robots.txt / sitemap.xml present (307→www→served). llms.txt ✅.

### councilof.ai
- **Single-page** site (~22 KB), no separate blog.
- Sections: Why-a-council / 5 specialty packs (A2A, Governance, Cybersec, Industry, Council Universe) / 3 Simple Tiers / FAQ.
- Tiers/prices: PAYG £0.0002/call, £199/mo, £299/mo, £499/mo. llms.txt ❌.
- `/payg` = dedicated billing page (200): "Pay-per-call billing for MEOK AI compliance MCPs", setup in 30s, covers 7 MCPs, USDC on Base L2 accepted.

### csoai.org
- ~157 KB page. "CSOAI — AI Safety Certification & Compliance Platform". llms.txt ✅. Served by `csoai-dashboard` (Vite).

### proofof.ai
- "MEOK Compliance MCP Catalogue — Signed EU AI Act, DORA, NIS2, CRA, CSRD Attestations". 15 Python MCP servers. Backed by `meok-attestation-api`. llms.txt ✅.

---

## 5. PAYG + Attestation Endpoints

| Endpoint | Status | Result |
|---|---|---|
| `councilof.ai/payg` | 200 | Live billing page — per-call billing, 7 MCPs, USDC-on-Base L2 |
| `meok-attestation-api.vercel.app/payg/balance` | functional | Returns `{"error":"Missing 'token' query param"}` (expects a token; endpoint works) |
| `meok-attestation-api.vercel.app/` (root) | 200 (GET) | Compliance MCP catalogue HTML (HEAD→501, GET→200) |

---

## 6. Action Items (no changes made — READ-ONLY audit)

1. **Redeploy 5 drifted projects** so latest-prod is green again: `meok-ai` (ERROR), `safetyofai` (ERROR), `suicidestop-ai` (ERROR — safety-critical), `cobol-bridge` (BLOCKED), `councilof-ai` (BLOCKED). Live sites are up but running stale builds.
2. **Resolve domain duplication:** csoai.org bound to both `csoai-dashboard` and `csoai-org`; `councilof-ai` project is a dead duplicate of `council-ai-storefront`; `meok-ai` vs `meok` overlap. Consolidate to avoid future routing confusion.
3. **`proofof-ai` project** is READY but orphaned (no custom domain — proofof.ai is on `meok-attestation-api`). Decide: delete or repoint.
4. **muckaway.co.uk** does not resolve (000) — provision DNS or confirm intentionally parked.
5. **llms.txt gap** on councilof.ai, agisafe.ai, biasdetectionof.ai, fishkeeper.ai, koikeeper.ai, aquaponics.app, optimobile.ai + `of.ai` family — quick AEO/discoverability win.
6. **Severed-brand cleanup:** `csga-global*` (×3) and `erranova` projects still in account — archive/delete per memory (CSGA/Terranova ties severed). `meok-api-gateway-tmp` is a leftover temp.
