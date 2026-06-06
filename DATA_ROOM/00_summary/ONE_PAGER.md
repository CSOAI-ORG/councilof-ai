# MEOK AI Labs — Company One-Pager

> **Every figure on this page is verifiable. Verification path is in the right-hand notes. Pre-revenue is stated, not hidden.**

| | |
|---|---|
| **Legal entity** | CSOAI LTD (t/a MEOK AI Labs) |
| **Registered** | England & Wales · Companies House **#16939677** *(verify: find-and-update.company-information.service.gov.uk/company/16939677 — public record, returns live)* |
| **Founder** | Nicholas Templeman — sole founder, 100% ownership |
| **Stage** | Pre-seed / EIS angel |
| **MRR** | **£0** — products live and able to take card payments; no sales closed yet. *Stated up front: this is the headline gap.* |
| **HQ** | United Kingdom |

## What we are
An **AI-governance and compliance infrastructure** company. We turn the EU AI Act, DORA, NIS2, the CRA, ISO 42001 and ~12 other frameworks into **machine-runnable compliance tools** that issue **cryptographically signed (HMAC) attestations** — verifiable proof a control was met, that a stranger can check without trusting us. The thesis is *proof over claims*: in a market full of compliance theatre, we ship the un-fakeable artifact.

## What is real today (verifiable, not aspirational)
- **271 MCP servers published on PyPI** (of 316 built). Live, installable, MIT-licensed. *Verify: `pip install eu-ai-act-compliance-mcp` (v1.8.2), `dora-compliance-mcp` (v1.4.3), `nis2-compliance-mcp` (v1.3.1), `iso-42001-ai-mcp` (v1.1.3). Note: the real package names are `<topic>-compliance-mcp`, not `meok-*`.*
- **Live attestation chain** — issues and verifies signed compliance evidence. *Verify: meok-attestation-api.vercel.app returns HTTP 200; `meok-attestation-verify` v1.0.3 on PyPI.*
- **~18 months of regulatory crosswalk IP** — EU AI Act ↔ NIST ↔ ISO 42001 ↔ DORA ↔ NIS2 ↔ CRA. The single hardest asset to replicate (est. 12–18mo for a competitor). *Verify: `csoai-docs/`, the crosswalk MCPs.*
- **Aquaculture compliance vertical — live and able to transact.** 7 MCPs + 5 live Stripe products (£29–£999/mo) targeting the UK fish-farming sector's hard **ASC May-2027** deadline. *Verify: Stripe acct_1TLlEKQvIueK5Xpb; `revenue/AQUACULTURE_LIVE_LAUNCH_STATE.md`.*
- **SOV3** — a novel care-membrane agentic OS (110 tools, 6 trained neural nets, 8,121 memory episodes). Genuinely differentiated R&D. *Currently down on an environment issue (torch×Python-3.14); not pitched as a finished product.*
- **Real businesses behind the founder:** Templeman Opticians (trading family optical business, ~£2.5–5K/mo) and a 6.5-acre fish farm (the aquaculture testbed). *The only proven cashflow; anchors credibility.*

## The why-now
Two hard regulatory deadlines create forced demand: **EU AI Act** penalties up to **€35M / 7% of global turnover**, and the **ASC Farm Standard mandatory from 1 May 2027** for UK aquaculture (plus RSPCA Assured trout: 177 new standards in force since 23 Jul 2025). Compliance stops being optional on a fixed calendar.

## The bet
A pre-seed angel is betting on **(founder) × (compliance IP depth) × (a deadline-driven wedge)** — not on revenue that does not yet exist. The honest unlock is a little real revenue + a clean structure + warm intros, and that is weeks of work, not years.

## The ask
**£100K–£300K** on a **SAFE at a £1–2M cap**, **EIS-eligible** (UK tax relief: 30% income-tax relief + CGT reliefs, subject to HMRC Advance Assurance — see `06_financials/`). Use of funds and milestones: see `revenue/RAISE_PATH3_ANGEL/SEED_DECK.md` slide 12.

---
*Counts current as of 2026-06-02 alignment (271/316 PyPI). Package versions checked live 2026-06-06. If MRR, customer count, or SOV3 status changes, this page is re-issued.*
