# MEOK DATA — Strategic Business Plan (Investor-Safe Edition)

**Entity:** CSOAI LTD (UK Companies House 16939677), trading as MEOK AI Labs
**Location:** Sutton St James, Lincolnshire, UK
**Author:** Nicholas Templeman · **Date:** 2026-05-29
**Status:** Pre-seed · honest baseline (this version replaces the Kimi-authored draft, which contained inflated figures — see note at end)

---

## Executive Summary

MEOK DATA is a strategic evolution for MEOK AI Labs: turning our compliance-MCP ecosystem from a cost centre into a **proprietary data moat** that generates recurring revenue through tiered data access and B2B licensing.

The thesis is simple and already partly built: **every compliance/governance query our tools answer can enrich an aggregated, signed dataset** — and because our ingestion and embedding run locally at near-zero marginal cost, the data flywheel compounds without a corresponding cost curve. More users → more data → better product → more users.

**Where we actually are today (honest baseline):**
- **~26 MCP servers** published on PyPI (governance/compliance focus).
- **A live, £0-cost daily ingestion engine** ("DAILY EAT") pulling free open-source data (arXiv, HuggingFace; EUR-Lex next) into a local vector store with free local embedding.
- **Cryptographic trust layer**: HMAC today, Ed25519 verifiable signing built and tested (third-party-verifiable, offline).
- **Revenue: pre-revenue.** Stripe live, £0 balance. This plan is the path to first revenue, not a claim of existing revenue.

We are **not** claiming existing scaled traffic, healthcare clinical-data integrations, or millions of monthly queries — those are roadmap items, flagged as such throughout.

---

## The Data Moat Opportunity

AI governance tools answer compliance questions but **discard the structured data** generated in doing so. Regtech firms then spend heavily rebuilding datasets that a compliance-MCP ecosystem already produces as a byproduct. The opportunity: **capture, structure, sign, and license that byproduct.**

What makes it defensible:
1. **Ecosystem breadth** — ~26 MCPs across EU AI Act, GDPR, NIS2, DORA, CRA and adjacent frameworks; replication is non-trivial.
2. **Cryptographic trust** — Ed25519-signed, independently-verifiable data exports (an auditor verifies with our public key, no backend call). No competitor in this niche ships verifiable data.
3. **Cross-domain correlation** — governance + (roadmap) sector verticals create correlations single-domain tools can't.
4. **Regulatory velocity** — the DAILY EAT keeps the corpus current across frameworks automatically, at £0.

---

## Data Sources (real vs roadmap — labelled)

| Source | Status |
|---|---|
| Open-source research (arXiv, HuggingFace) | ✅ **LIVE** in DAILY EAT |
| EU regulation full-text (EUR-Lex) | ▶ **next** (highest-moat addition) |
| Governance/compliance framework corpus (EU AI Act, GDPR, NIS2, DORA, CRA, ISO 42001) | ✅ partial (MCP-encoded) |
| Healthcare FHIR / clinical data | ⏳ **roadmap only** — NOT an existing integration |
| Financial-services regulatory signals (MiFID II, MiCA, Basel) | ⏳ roadmap |

> Honesty note: the prior draft listed Epic / Cerner / NHS Spine clinical data as if integrated. We have **no such integration**. It is removed here; if pursued it is a multi-quarter, consent-and-compliance-heavy roadmap item, not a current asset.

---

## Three Tiers, Three Revenue Streams

| Tier | Price | Includes |
|---|---|---|
| **Free** | £0 | Open datasets, ~100 req/day — drives developer adoption |
| **Pro** | £79/mo | ~10K req/day, real-time feeds, **Ed25519-signed exports** |
| **Enterprise** | £1,499+/mo | Unlimited, custom pipelines, SLA, white-label |
| **B2B Licensing** | rev-share | Dataset access for regtech providers + consultancies |

(Prices match the live Stripe ladder.)

---

## Go-to-Market (4 phases, MRR-gated)

- **Q3 2026:** Free tier live; convert existing PyPI/MCP users.
- **Q4 2026:** Pro tier + developer portal/SDK.
- **Q1 2027:** Enterprise outreach to top regtech firms.
- **Q2 2027:** Self-service licensing marketplace.

Each phase is gated by hitting the prior phase's adoption milestone — not date-forced.

---

## Financial Projections (clearly labelled as TARGETS, not forecasts)

> These are **illustrative targets** to size the opportunity, not forecasts. Pre-revenue today; every figure is contingent on execution and should be discounted accordingly by any investor.

| Year | Pro | Enterprise | Licenses | Illustrative revenue |
|---|---|---|---|---|
| Y1 | ~200 | ~5 | ~3 | ~£380K (target) |
| Y2 | ~800 | ~25 | ~15 | ~£2.1M (target) |
| Y3 | ~2,500 | ~80 | ~50 | ~£6.8M (target) |

Tie to the IPO path (`revenue/IPO_VALUATION_PATH`): AIM only becomes viable above ~£6M ARR; below that, grow on private capital + grants. No IPO is implied as near-term.

---

## The Ask

Strategic partners for data distribution + enterprise introductions; investment to accelerate the data-pipeline infrastructure and enterprise sales motion. Near-term proof target: **first paying Pro + Enterprise customers**, then first B2B license.

---

## Provenance / corrections note
This investor-safe edition was produced 2026-05-29 from the Kimi-authored "MEOK DATA Strategy" draft (`_inbox/kimi_meok_data_2026-05-29/`). Corrected: "255+ MCPs"→~26; "millions of monthly queries"/"2.3M+"→pre-revenue/no scaled traffic; healthcare FHIR/Epic/Cerner/NHS clinical data→roadmap-only (not integrated); financial projections→labelled illustrative targets; entity/location→CSOAI LTD, Sutton St James UK. **Use this version for any investor, grant, or IPO context. Do not circulate the original draft.**
