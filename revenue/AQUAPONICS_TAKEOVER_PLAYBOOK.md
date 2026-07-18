# MEOK Aquaponics Takeover Playbook
**Date:** 2026-05-21 · **Owner:** Nick Templeman · **Status:** Phase 1 MCPs built, distribution pending

## Strategic frame (one paragraph)

UK has ~290 trout farms and a growing RAS/aquaponic small-operator base. Sainsbury's is 100% ASC; Co-op pledged 100% by 2027; M&S / Waitrose / Tesco Finest gate farmed fish on RSPCA Assured. Every UK fish farm currently pays £800-£2,500/yr to a human consultant for the compliance pack. There is no SaaS. Iron Ox, Plenty, Bowery, AeroFarms, AppHarvest, Upward Farms — all bankrupt or shut, ~$1.37bn capital incinerated through 2025. The vacuum is real, the buyer profile is real, the spec is public. MEOK takes this vertical by being the only software layer that wraps RSPCA + ASC + GG.A.P. + CEFAS + EA + APHA as a single MCP / A2A surface, and sells it at our existing £29 / £79 / £499 / £999 Stripe ladder.

## What shipped today (2026-05-21)

| MCP | Tier | Audience | Status |
|-----|------|----------|--------|
| `meok-rspca-aquaculture-mcp` | £499/mo | UK trout + salmon farms | ✅ Built, ready to publish |
| `meok-uk-fhi-mcp` | £79/mo | Every UK fish farm + importer | ✅ Built, ready to publish |
| `meok-aquaponics-monitor-mcp` | £29/£79/mo | Aquaponics + koi + small RAS | ✅ Built, ready to publish |
| `meok-asc-rspca-crosswalk-mcp` | £999/mo flagship | Retail-supplying farms | ✅ Built, ready to publish |
| `meok-laia-aquatic-mcp` | £29/mo | OATA ornamental + koi retailers | ✅ Built, ready to publish |
| `meok-soil-assoc-organic-aqua-mcp` | £499/mo | Organic-curious trout/shellfish | 🟡 Scaffold only (timing — Soil Assoc 2026 std not yet released) |
| `meok-koikeeper-ai-mcp` | consumer companion | koikeeper.ai users | 🟡 Scaffold only (clone fishkeeper pattern next session) |

## Sites + Stripe (already live)

- **fishkeeper.ai** — React+Vite Lovable, Rewardful affiliate `5192b4`, meok.ai trust-bar widget embedded ✅
- **koikeeper.ai** — React+Vite+Supabase+Lovable AI Gateway, meok.ai trust-bar widget embedded ✅
- **aquaponics.app** — Netlify Edge, separate stack
- **Stripe products live:** KoiKeeper Pro £7.99/mo, KoiKeeper Premium £19.99/mo, FishKeeper £4.99/mo (per April 27 sprint)
- **Gap:** check Stripe MRR before any rebrand. If zero, focus on B2B not rearranging consumer.

## Execution plan — next 30 days

### Week 1: ship + distribute

1. **PyPI publish** all 5 new MCPs under `io.github.CSOAI-ORG/*` (follow April 27 MCP Registry pattern).
2. **MCP Registry** submission for all 5 (auto-ingests to PulseMCP within 7 days).
3. **Stripe products** — 5 new payment links, attach to existing acct_1TLlEKQvIueK5Xpb:
   - meok-rspca-aquaculture £499/mo + £4,990/yr
   - meok-uk-fhi £79/mo + £790/yr
   - meok-aquaponics-monitor £29/mo (hobby), £79/mo (pro)
   - meok-asc-rspca-crosswalk £999/mo + £9,990/yr
   - meok-laia-aquatic £29/mo + £290/yr
4. **meok.ai/aquaculture** landing page — pillar route with the 5-product ladder + 290-trout-farm-pain-point hero + Sainsbury's/Co-op pressure narrative.
5. **meok.ai/aquaponics** landing page — sensor-monitor + LAIA + PondSense kit teaser.

### Week 2: integrate the live SaaS apps

Both Lovable apps already embed `https://meok.ai/widgets/meok-trust-bar.js`. Extend that widget with:
- Welfare-attestation badge sourced from `meok-attestation-api`
- "MCP-discoverable" hint header `X-MEOK-MCP-Server: meok-fishkeeper-ai-mcp@1.0.5`
- Shared user-account proxy (Clerk → Supabase JWT exchange)

For fishkeeper.ai + koikeeper.ai users:
- Free tier remains hobbyist consultation
- Upgrade ladder: hobbyist → LAIA Pro (£29) → PondSense kit (£180-£550) → koi business compliance (£79 FHI bundle)

### Week 3: outbound to the 290 UK trout farms

**Target list sources:**
- British Trout Association membership: https://britishtrout.co.uk/
- ASC-certified UK site list: https://asc-aqua.org/find-a-farm/ (filter UK, ~83 sites)
- RSPCA Assured member directory
- CEFAS APB register (public, scrape)

**Cold email template — UK trout farm operator** (paste-ready, customise [BRACKETS]):

```
Subject: RSPCA Assured audit pack — automated for [FARM NAME]

Hi [NAME],

We've built an MCP server that turns the RSPCA Assured trout standard
(2025.07 refresh) into a programmable surface — gap analysis on your
operating data, audit-ready markdown pack for your assessor, signed
welfare attestation for buyers.

Most farms we've spoken to pay £800-£2,500/yr to a consultant for the
same compliance pack, year after year. Ours runs against your existing
sensor data and re-generates whenever the standard refreshes.

We've extended it to one-click ASC + RSPCA + GlobalG.A.P. evidence
packs — for farms supplying Sainsbury's (100% ASC) or Co-op (100% ASC
by 2027), this collapses three audits to one.

Live now at meok.ai/aquaculture. £499/mo single-scheme, £999/mo
unified crosswalk. Free tier for testing.

15-minute call this week? No pitch — just walk you through it.

— Nick
nicholas@meok.ai
```

### Week 4: partnership pitches

1. **University of Stirling Institute of Aquaculture** — joint MCP wrapping their welfare-indicator toolboxes for 5 species. Co-branded, MEOK distributes, Stirling lends academic credibility. Contact: https://www.susaquastirling.net/welfare-resources
2. **OATA (Ornamental Aquatic Trade Association)** — distribution channel for `meok-laia-aquatic-mcp`. Member benefit at £29/mo bulk seat licence.
3. **CEFAS** — data licence pitch for Aquaculture Production Database. Position MEOK as the publishing layer.

## MCP / ACP / A2A integration spec for SaaS apps

The Lovable apps (fishkeeper.ai + koikeeper.ai) become **MCP-discoverable AI surfaces** by adopting three headers + one widget:

**Headers to add at edge / Vercel function:**
```
X-MEOK-MCP-Server: meok-fishkeeper-ai-mcp@1.0.5
X-MEOK-A2A-Endpoint: https://meok-attestation-api.vercel.app/a2a/fishkeeper
X-MEOK-Care-Tier: hobbyist|pro|enterprise
```

**Widget already embedded → extend to badge:**
```html
<script src="https://meok.ai/widgets/meok-trust-bar.js" defer async
        data-attestation="auto" data-product="fishkeeper-ai"></script>
```

**A2A flow (Claude/SOV3 agent → fishkeeper.ai):**
1. Agent discovers via MCP Registry: `meok-fishkeeper-ai-mcp` advertises `https://fishkeeper.ai` as its hosted SaaS face.
2. Agent calls `analyze_water_params(...)` through the MCP locally OR posts to fishkeeper.ai REST shim that proxies the same tool.
3. Response includes attestation fingerprint → verifiable at `meok.ai/verify`.
4. SOV3 care membrane gates any actuation (dose, feed schedule change) before fishkeeper.ai writes through.

**SOV3 (Sovereign Temple) wiring:**
- New endpoints in `~/clawd/sovereign-temple/agents/` for fishkeeper + koikeeper bridges
- `coord_register_agent(agent_id="fishkeeper-ai-mcp", endpoints=[...])`
- Care membrane subscribes to `meok-attestation-api/intake/*`

## Pricing ladder (unified across the 5 aquaculture MCPs)

| Bundle | Price | MCPs included | Target buyer |
|--------|-------|---------------|--------------|
| Hobbyist | £29/mo | Monitor + LAIA | Aquaponic grower / koi keeper |
| Aquaculture Starter | £79/mo | UK FHI + LAIA | Small UK fish farm |
| Aquaculture Pro | £499/mo | Starter + RSPCA + Soil Assoc | Single-cert UK farm |
| Aquaculture Enterprise | £999/mo | Pro + ASC-RSPCA-GGAP Crosswalk | Multi-cert retail-supplying farm |
| MEOK PondSense kit | £180-£550 one-off | Hardware + 1yr Pro subscription | Hobby and pro tier hardware |

## Hardware track — MEOK PondSense v1.0 (parallel work)

Fork `https://github.com/whitebox-labs/tentacle` (OSHWA UID CH000003, CC-BY-SA-4.0). PA12-CF IP67 enclosure on Qidi Max4. CSOAI stamp 10mm raised. Two SKUs: ESP32-S3 hobby, RPi5 pro. BoM target £180-£280 hobby / £450-£550 assembled pro with 1yr Pro subscription. CERN-OHL-S-2.0 hardware / MIT firmware / AGPL-3.0 MCP. Distribution: ships with `meok-aquaponics-monitor-mcp` pre-flashed.

## What's actively blocked

- **PyPI publish workflow** — need `gh auth refresh -s public_repo,repo` per April 26 memory. Five new repos to push.
- **Stripe payment links** — need access to acct_1TLlEKQvIueK5Xpb; 5 new products + payment links + thanks-page redirects.
- **Cold-email send capacity** — nicholas@csoai.org SMTP from past sessions. 20-50 BTA members in batch 1.
- **Stripe £0 MRR question** — is fishkeeper/koikeeper actually selling? If yes, hand-off matters. If no, rebrand vs B2B-focus decision still open.

## Don't lose the thread on

- Innovate UK Frontier AI 2026 grant — **27 May deadline = 6 days away** (April 27 memory). Aquaponics ship can't eat that hour.
- Omnibus stale-date fixes still outstanding on csoai-org blog backlog (~10 HTML files), eu-ai-act-landing, eu-ai-act-kit.
- Asimov v7 print queue running on Qidi Max4 — PondSense enclosure CAD work goes after WOLF gear plates.

## 90-day weighted EV (rough)

| Scenario | Probability | Revenue contribution |
|----------|------------|----------------------|
| 3 UK trout farms onboarded at £499/mo | 50% | £750/mo blended |
| 1 ASC-supplier farm at £999/mo | 30% | £300/mo blended |
| 20 LAIA / hobby seats at £29-£79 | 60% | £550/mo blended |
| OATA bulk-member deal | 20% | £400/mo blended |
| Stirling co-brand partnership | 25% | reputation, not £ |
| **Total expected MRR add (90d)** | | **~£2,000/mo** |

Realistic floor. Upside if a single Mowi / Bakkafrost-class buyer takes the £999 Enterprise tier multi-site: 10× this.

---

**Next session priorities (in order):**
1. Publish 5 MCPs to PyPI + MCP Registry.
2. Create 5 Stripe products + payment links.
3. Build meok.ai/aquaculture + meok.ai/aquaponics landing pages.
4. Extend meok-trust-bar.js widget to surface aquaculture attestations on fishkeeper.ai + koikeeper.ai.
5. First 20 cold emails to BTA members.
