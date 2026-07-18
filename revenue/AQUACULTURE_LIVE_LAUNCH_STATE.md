# MEOK Aquaculture Suite — LIVE LAUNCH STATE
**Date launched:** 2026-05-24 (Stripe + SOV3 wired in real time)
**Stripe account:** `acct_1TLlEKQvIueK5Xpb` (MEOK AI LTD, GBP, livemode)
**SOV3:** 63 → 70 agents, consciousness_level 0.787, episode `e622f729-147c-534b-9180-e0e828037590` recorded

## Stripe products — LIVE payment links

| Product | Stripe ID | Tier | Price | Payment Link |
|---------|-----------|------|-------|--------------|
| **MEOK RSPCA Aquaculture MCP (Pro)** | `prod_UZmYFoVhB69Zvf` | Monthly £499 | `price_1Tad0oQvIueK5XpbXps9zx6P` | https://buy.stripe.com/8x28wR0xS7su23X7ew8k90z |
| | | Annual £4,990 | `price_1Tad0rQvIueK5Xpbvk3MSx67` | https://buy.stripe.com/3cIdRb0xS4gibEx2Yg8k90A |
| **MEOK UK FHI MCP (Pro)** | `prod_UZmYQRGKNev69C` | Monthly £79 | `price_1Tad0uQvIueK5XpbOdl2esnA` | https://buy.stripe.com/aFa5kF3K41465g9fL28k90B |
| | | Annual £790 | `price_1Tad0wQvIueK5XpbqE4g4rRm` | https://buy.stripe.com/bJe00l94o9AC23XaqI8k90C |
| **MEOK Aquaponics Monitor MCP** | `prod_UZmY79z4I0dAqi` | Hobby monthly £29 | `price_1Tad0zQvIueK5XpbfcKFG9xG` | https://buy.stripe.com/aFa28t80k9ACdMF1Uc8k90D |
| | | Pro monthly £79 | `price_1Tad12QvIueK5XpbNUl4Y9cZ` | https://buy.stripe.com/00w28tgwQ6oq9wpcyQ8k90E |
| | | Pro annual £790 | `price_1Tad15QvIueK5XpbyYFOJrJs` | https://buy.stripe.com/6oUfZj0xS002aAt42k8k90F |
| **MEOK ASC×RSPCA×GG.A.P. Crosswalk (Enterprise) — FLAGSHIP** | `prod_UZmYwqVfTFpl9f` | Monthly £999 | `price_1Tad18QvIueK5XpblUmf5N9R` | https://buy.stripe.com/8x25kF4O85kmfUN42k8k90G |
| | | Annual £9,990 | `price_1Tad1BQvIueK5XpbTSchotKO` | https://buy.stripe.com/fZudRbeoI9AC5g96as8k90H |
| **MEOK LAIA Aquatic MCP (Pro)** | `prod_UZmZdqqSsZKu61` | Monthly £29 | `price_1Tad1EQvIueK5Xpbyh5tLXVG` | https://buy.stripe.com/8x2aEZeoI5km7ohdCU8k90I |
| | | Annual £290 | `price_1Tad1HQvIueK5XpbcBbbvDBu` | https://buy.stripe.com/28E8wRbcw0024c5fL28k90J |

**Skipped (already exist):** `prod_USKqg5A2pE9EGo` FishKeeper AI Pro, `prod_USKqVjyyUkYmFc` KoiKeeper AI Pro, `prod_UPeiiddZNN0ysd` FishKeeper.ai Pro £4.99/mo, `prod_UPeinFan85GUEm` KoiKeeper.ai Pro £7.99/mo, `prod_UPeiBg5nCpXiSw` KoiKeeper.ai Premium £19.99/mo.

## SOV3 agent registrations — LIVE

All 7 aquaculture MCPs are registered with SOV3 coord layer, state `idle`:

| Agent ID | Type | Capability tags |
|----------|------|-----------------|
| `meok-rspca-aquaculture-mcp` | claude-code | compliance, rspca-assured, trout-welfare, salmon-welfare, audit-pack-generation, welfare-attestation, care-attestation |
| `meok-uk-fhi-mcp` | claude-code | compliance, cefas-fhi, apha-movements, ipaffs, environment-agency, epr-discharge, abstraction-licence, aahr-2009, notifiable-disease, human-in-loop |
| `meok-aquaponics-monitor-mcp` | claude-code | sensor-monitoring, atlas-scientific, whitebox-tentacle, seneye, ghl-profilux, bluelab, dfrobot, care-gated-actuation, welfare-safe-range, pondsense-hardware |
| `meok-asc-rspca-crosswalk-mcp` | claude-code | compliance, asc-aquaculture, rspca-assured, globalgap-ifa-v6, retail-supply-chain, audit-evidence-pack, crosswalk |
| `meok-laia-aquatic-mcp` | claude-code | compliance, laia-2018, ornamental-retailer, koi-dealer, local-authority-inspection, oata, star-rating, inspector-pack |
| `meok-koikeeper-ai-mcp` | claude-code | consumer-saas, koi-varieties, pond-stocking, khv-notifiable, carp-edema-virus, seasonal-feeding, winter-prep, koikeeper-ai |
| `meok-fishkeeper-ai-mcp` | claude-code | consumer-saas, water-analysis, species-identification, disease-diagnosis, stocking-calculator, feeding-schedule, tropical-marine-coldwater, fishkeeper-ai |

Care-gate hooks wired in `~/clawd/sovereign-temple/agents/aqua_bridge.py`:
- `gate_dose_intent` — peristaltic-pump intent → Maternal Covenant before fire
- `handle_welfare_alert` — critical out-of-range → Byzantine council proposal
- `handle_disease_notification` — AAHR 2009 listed disease → human-in-loop escalation to nicholas@meok.ai + CEFAS contact

## Legal-docs source-of-truth references (vLex/EU-Lex backend, 521K UK docs)

These source IDs are usable directly by every MCP for v1.1 spec ingestion — point `lookup_clause` and `gap_analysis` at real regulator text instead of placeholder structures.

| Regulation | Source | source_id | Notes |
|-----------|--------|-----------|-------|
| **Aquatic Animal Health (England & Wales) Regulations 2009** (the master UK fish-farm regulation) | `UK/Legislation` | `uksi/2009/463/2022-08-15` | 57,426 bytes consolidated; covers AW1 / APBs / listed diseases / disease notification. **Primary source for `meok-uk-fhi-mcp`.** |
| AAHR Scotland 2009 | `UK/LexAPI` | `UK_LEX_ssi_2009_85` | Scottish equivalent |
| AAHR Northern Ireland 2009 | `UK/LexAPI` | `UK_LEX_nisr_2009_129` | NI equivalent |
| AAHR Amendment 2011 | `UK/Legislation` | `uksi/2011/981/2011-05-01` | First amendment cycle |
| AAHR Amendment 2022 | `UK/LexAPI` | `UK_LEX_uksi_2022_835` | Post-Brexit alignment |
| AAHR + Plant Health (EU Exit) 2019 | `UK/Legislation` | `uksi/2019/817/2022-08-15` | Brexit transition arrangements |
| Council Directive 2006/88/EC | `UK/LexAPI` | `UK_LEX_eudr_2006_88` | EU parent directive — still relevant pre-Omnibus |
| Commission Regulation (EC) 1251/2008 | `UK/LexAPI` | `UK_LEX_eur_2008_1251` | Cert + market-placement requirements |
| **LAIA Regulations 2018 (England)** | `UK/Legislation` | `uksi/2018/486/2021-09-10` | **Primary source for `meok-laia-aquatic-mcp`.** Wiki-style structure for 7-point checklist. |
| LAIA Amendment 2019 (England) | `UK/Legislation` | `uksi/2019/1093/made` | Star-rating tweaks |
| LAIA Amendment (Scotland) 2021 | `UK/LexAPI` | `UK_LEX_ssi_2021_356` | Scotland variant |

**UK regulator doctrine sources available** (for FCA/EA-style decision/guidance ingestion):
- `UK/EA` — 5,073 Environment Agency regulatory decisions (2002-2026) ← discharge consent precedents
- `UK/FSA` — 3,482 Food Standards Agency docs (2015-2026) ← fish food safety
- `UK/PlanningAppeals` — 29,446 planning decisions (2023-2026) ← RAS planning opposition cases
- `UK/ICO` — 25,667 ICO data-protection decisions ← privacy on welfare attestations
- `UK/FCA` — 5,333 FCA notices ← for adjacent fintech / DORA aquaculture overlap

## Live launch unblocks status

| Blocker (from earlier playbook) | Status |
|---------------------------------|--------|
| Stripe products + payment links | ✅ LIVE on acct_1TLlEKQvIueK5Xpb |
| SOV3 register all 7 agents | ✅ LIVE in coord layer |
| Legal-docs source-of-truth pipeline | ✅ Located; v1.1 ingestion ready |
| `gh auth refresh -s public_repo,repo` for PyPI publish | ❌ Still blocked on Nick |
| Deploy meok.ai/aquaculture + /aquaponics MDX pages | ❌ Needs Next.js repo push |
| Deploy `meok-trust-bar-aquaculture-extension.js` widget | ❌ Needs meok.ai widget dir push |
| Update meok.ai upgrade_url in each MCP server.py | ⚠️ Has 6 new payment-link URLs ready to patch in |
| Cold outreach send | ❌ Templates in `AQUACULTURE_PARTNERSHIP_EMAILS.md`, awaiting send |

## Date + alerts flagged

- **Date drift:** memory + earlier playbook tagged 2026-05-21. SOV3 system clock says **2026-05-24**. Innovate UK Frontier AI grant deadline 27 May = **3 days away**, not 6.
- **SOV3 critical alert unacknowledged:** `alt_20260524152337_000000` — Production Threat Detected (security source). 0 acknowledged. Worth opening before aquaculture work eats more cycles.
- SOV3 memory pressure: 80.6% (alert threshold ~85%). 8,121 episodes total.

## Patch list for the 5 new MCP server.py files

In each `~/clawd/mcp-marketplace/meok-{rspca-aquaculture,uk-fhi,aquaponics-monitor,asc-rspca-crosswalk,laia-aquatic}-mcp/server.py`, replace generic `https://meok.ai/pricing` upgrade-url with the direct payment-link URL above — pattern matches April 26 lesson (199 MCPs URL-patched). Map:

```
meok-rspca-aquaculture-mcp     → https://buy.stripe.com/8x28wR0xS7su23X7ew8k90z   (monthly)
meok-uk-fhi-mcp                → https://buy.stripe.com/aFa5kF3K41465g9fL28k90B   (monthly)
meok-aquaponics-monitor-mcp    → https://buy.stripe.com/aFa28t80k9ACdMF1Uc8k90D   (hobby) / .../00w28tgwQ6oq9wpcyQ8k90E (pro)
meok-asc-rspca-crosswalk-mcp   → https://buy.stripe.com/8x25kF4O85kmfUN42k8k90G   (monthly)
meok-laia-aquatic-mcp          → https://buy.stripe.com/8x2aEZeoI5km7ohdCU8k90I   (monthly)
```
