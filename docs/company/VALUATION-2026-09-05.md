# CSOAI LTD — valuation, 5 September 2026

**Company:** CSOAI LTD, UK **16939677**, Active, private limited, incorporated **2 January 2026**,
3rd Floor 86-90 Paul Street, London EC2A 4NE.
Source: <https://find-and-update.company-information.service.gov.uk/company/16939677> (probed 2026-09-05, HTTP 200).

**Not an offer, not advice, not a fairness opinion.** This is a derivation. Every input below is
either read from a live URL on 2026-09-05 or quoted from a named document with its date. Where an
input does not exist, the method that needs it is marked **UNCOMPUTABLE** and no number is invented
to fill the hole. That is the whole point of the file.

**No SKU amount appears anywhere in this document.** `/api/x402` → `invariants.no_public_price`:
*"Amounts appear only in a 402 challenge."* SKUs are referenced by id.

---

## 0. The live fact base (every valuation input, with its URL)

| Fact | Value @ 2026-09-05 | Source URL |
|---|---|---|
| Board axes | **22 axes / 22 measured / 0 unmeasured** | `/api/gspc` → `totals` |
| Hub cells | **761 cells, 691 measured, 70 unmeasured** | `/api/hub-cards` → `counts` |
| Signed card index | **335** (`n_cards == n_cells == cards[].length`) | `/signed/card_index.json` |
| Cards under the signed Merkle root | **167**, root `6347384a…`, `sig_ed25519` present | `/root.json` |
| Published doors | **292** | `/.well-known/index.json` → `total_doors` |
| Published interchange formats | **372** | `/interop/index.json` → `total_formats` |
| Corrections issued | **46** | `/api/corrections` |
| MCP servers in the official registry | **330** latest (329 PyPI, 1 npm) | `registry.modelcontextprotocol.io` paginated, `isLatest` |
| Repos in `CSOAI-ORG` | **678** | `gh repo list CSOAI-ORG --limit 1000` |
| x402 rail | `mode: live`, `pay_to_configured: true`, `facilitator_configured: true`, Base `eip155:8453`, USDC | `/api/x402` → `rail` |
| **Settled revenue (the One Number)** | **`null` — UNMEASURED, never 0** | `/api/revenue` → `settled_usdc.count` |
| Paying customers | **0**, by doctrine — verification is free forever | `/api/x402` → `free_forever` (9 URLs) |
| Employees / officers | **1** (sole director) | Companies House 16939677 |
| Concept DOI | `10.5281/zenodo.21991104` (resolves, HTTP 200) | `https://doi.org/10.5281/zenodo.21991104` |

### A defect found while gathering these inputs

`/api/revenue` **contradicts itself**. Its `contract.null_rule` reads *"The x402 rail is currently
live — a facilitator is provisioned"*, which agrees with `/api/x402` (`mode: live`). But
`skus.issuance.note` on the same payload reads *"No live settle path (x402 is fail-closed,
mode:mock)"*. One of the two is stale, and it is the SKU note. Filed as a backlog row with its
probe. It does not change any figure below, because **both readings give the same One Number: null.**

---

## 1. Berkus — each factor scored against a NAMED LIVE ARTEFACT

Berkus assigns value for de-risking, not for earnings. The classic ceiling is ~£0.5M per factor.
**A factor with no artefact behind it scores zero.** No factor here is scored on intent.

| Factor (risk it retires) | Artefact that proves it, or absence | Score |
|---|---|---|
| **Sound idea** (basic value) | `/api/gspc` serves 22 axes with 22 measured and 0 unmeasured, and `/.well-known/index.json` serves **292 doors**. The thesis is not a deck; it is an answering surface. | **£0.4M** |
| **Prototype** (technology risk) | `/api/hub-cards` → 761 cells with **691 measured**; `/signed/card_index.json` → **335/335**; `/root.json` → **167** cards under a Merkle root carrying `sig_ed25519`; `councilof.ai/mcp` → 200; `/api/x402` rail `mode: live` with facilitator provisioned. This is the strongest factor and the artefacts are independently re-runnable. | **£0.5M** |
| **Quality management team** (execution risk) | Companies House 16939677 shows **one officer**. There is no artefact that evidences a second person. Scoring this above zero would be, in the August analysis's own words, *"gaming"*. | **£0.0M** |
| **Strategic relationships** (market risk) | **330** servers in the official MCP registry and 292 doors are *distribution*, not relationships. Probing found **no signed commercial agreement, no counterparty signature, and no countersigned attestation** anywhere in the estate — `/.well-known/erc-8004-registries.json` records that even the ERC-8004 validator path is blocked on an upstream unshipped registry. Standards-body membership is participation, not endorsement. | **£0.1M** |
| **Product rollout / sales** (production risk) | `/api/revenue` → `settled_usdc.count` is **null**. No receipt has settled. `free_forever` lists 9 URLs that are free by doctrine. There is no artefact of a sale. | **£0.0M** |
| **Berkus total** | | **£1.0M** |

Cross-check: the 19 Aug 2026 analysis independently ran Berkus at **£1.0M–£1.6M**. This
derivation lands at the bottom of that band because it scores relationships strictly — participation
is not a relationship without a counterparty signature, and none exists.

---

## 2. Scorecard (Payne) — peers from the Tracxn export

Base: UK pre-seed average **~£1.4M** (Beauhurst via FounderCatalyst, cited in the 19 Aug analysis).
Peer set: `TracxnExport-CSOAI-CompanyPdf-Aug-23-2026.pdf`, generated 23 Aug 2026.

**Where CSOAI sits in its own competitive set, per Tracxn:**
Tracxn score **24**, ranked **104th of 1,061** competitors, **Unfunded**, total equity **$0**.
The set holds 1,059 active competitors, 64 funded, 6 exited, **$725M** raised across 97 rounds.

| Peer (Tracxn score) | Location | Founded | Stage | Total equity |
|---|---|---|---|---|
| Credo (64) | Palo Alto | 2020 | Series B | $41.3M |
| Vijil (60) | Santa Clara | 2023 | Series A | $23M |
| ModelOp (60) | Chicago | 2016 | Series B | $16M |
| Witness (59) | San Mateo | 2023 | Series B | $85.5M |
| Hirundo (58) | London | 2023 | Seed | $8M |
| Singulr AI (58) | Palo Alto | 2023 | Seed | $10M |
| Aurascape (55) | Santa Clara | 2024 | Series A | $62.8M |
| Portal26 (54) | San Jose | 2019 | Series A | $15M |
| Holistic AI (54) | London | 2020 | Funding raised | — |
| **CSOAI (24)** | **London** | **2026** | **Unfunded** | **$0** |

| Scorecard factor | Weight | vs peer set | Multiplier | Contribution |
|---|---|---|---|---|
| Strength of team | 30% | 1 officer vs peers with funded teams | **0.30×** | 0.090 |
| Size of opportunity | 25% | EU AI Act tailwind; sector median AI-governance valuation ~$24M; 1,061 competitors | **1.10×** | 0.275 |
| Product / technology | 15% | 292 doors, 335 signed cards, live rail, DOI-anchored method — strongest axis | **1.60×** | 0.240 |
| Competitive environment | 10% | 1,059 active competitors, $725M deployed; CSOAI 104th | **0.70×** | 0.070 |
| Marketing / sales channels | 10% | 330 registry servers; but 0 settled receipts and 0 paying customers | **0.60×** | 0.060 |
| Need for further investment | 5% | Unfunded; no runway artefact published | **0.70×** | 0.035 |
| Management / other | 5% | Solo, unregistered trademarks (see §5) | **0.50×** | 0.025 |
| **Sum of factors** | 100% | | | **0.795** |

**Scorecard = £1.4M × 0.795 = £1.11M.**

---

## 3. VC method — **UNCOMPUTABLE**, and the formula is shown so you can see why

The lane doc specifies: *revenue = One Number × SKU price at the 402; no forecasts typed without
the formula shown.* The formula, in full:

```
  Exit value      = terminal_revenue × exit_multiple
  Post-money now  = exit_value / (1 + target_IRR)^years
  Pre-money now   = post-money − new_investment

  where terminal_revenue is grown from:
      current_revenue = One Number × SKU price at the 402
```

**Inputs, read live:**

| Term | Value | Source |
|---|---|---|
| One Number (settled receipts) | **`null` — UNMEASURED** | `/api/revenue` → `settled_usdc.count` |
| SKU price | quoted **only in a live 402 challenge**, by invariant | `/api/x402` → `invariants.no_public_price` |
| SKUs defined | 6 tiers: `issuance`, `evidence_bundle`, `data_feed`, `rwa_evidence`, `provider_diff_feed`, `receipts_batch` | `/api/x402` → `tiers` |
| terminal_revenue | requires a growth rate — **no published forecast exists in the estate** | — |

`current_revenue = null × price`. **Null is not zero.** Zero would assert a measured count of no
sales; null states that no settlement has been observed. Either way the product is undefined, so
every term downstream — terminal_revenue, exit_value, post-money — is undefined.

> **VC method output: UNCOMPUTABLE from live facts.**

To produce a number here I would have to type a revenue forecast that exists in no artefact. The
19 Aug analysis ran this method anyway and got **£0.3M–£1.0M**, flagging it *"low confidence"*, and
Equidam's own VC output was **£0.31M** — both are outputs of a near-zero denominator, not signals.
**This method should carry zero weight until one receipt settles.** The moment it does,
`settled_usdc` becomes an integer, the formula above evaluates, and this section stops being a hole.

---

## 4. Comparable multiples — arena.ai and peers

Sources: the 19 Aug 2026 analysis and the research briefs mined 2026-09-05.

| Company | Category | Round / date | Valuation | Revenue signal |
|---|---|---|---|---|
| **LMArena (arena.ai)** | AI eval leaderboard | Series A $150M, 6 Jan 2026 | **$1.7B post** | ~$30M annualised consumption; 5M+ MAU |
| Vals AI | AI evaluation | Series A $40M, 13 Aug 2026 | **$400M post** | revenue up 8× YoY |
| **AIUC (Caliber Labs)** | standards + audit + insurance | Seed $15M, Jul 2025 | **$57.43M post** | *closest structural analogue* |
| Patronus AI | AI eval/simulation | Series B $50M, Jun 2026 | undisclosed | 15× revenue growth |
| LatticeFlow | AI risk/eval | ~$17.5–18M total | ~$69M est. | — |
| Trismik | AI eval (Cambridge UK) | Pre-seed £2.2M, Sep 2025 | undisclosed | closest UK-eval peer |
| Sector median | AI-governance startup | — | **~$24M** | newmarketpitch.com |

**Applying a multiple requires a denominator CSOAI does not have.** LMArena at $1.7B against ~$30M
consumption is ~57× revenue; CSOAI's revenue is `null`, so the multiple is undefined for the same
reason §3 is. The August analysis makes this explicit about its own 159.41× figure: *"the entry
multiple is an output of the process, not an input"* — a valuation divided by a near-zero
denominator carries no information and **must never be quoted to an investor as a comp**.

**What the comps do support, honestly:** the category is being funded, and the *closest structural
analogue* — AIUC, a standards + audit + insurance company — was priced at **$57.43M post** at seed
**with a multi-person credentialed team and a live insurance mechanism at launch**. CSOAI shares the
thesis and holds neither of those two traction inputs. The comps therefore bound the **destination**,
not the present.

> **Comparable-multiples output: NO DEFENSIBLE POINT ESTIMATE.** Directional only.

---

## 5. Triangulation

| Method | Output | Weight | Why |
|---|---|---|---|
| Berkus | **£1.0M** | high | every factor tied to a re-runnable artefact |
| Scorecard (Payne) | **£1.11M** | high | peer set is a dated third-party export |
| VC method | **UNCOMPUTABLE** | **zero** | One Number is null; no forecast exists to type |
| Comparable multiples | no point estimate | directional | denominator undefined |

**Two computable methods agree within 10%: £1.0M–£1.11M.**

The 19 Aug 2026 analysis triangulated **£1.2M–£2.6M pre-money, central £1.6M–£1.8M**, anchored on an
independently verified COCOMO II cost-to-replicate floor of **£0.97M–£2.4M** (45,595 LOC; 169–196
person-months). That floor is a *cost*, not a price, and it is not re-derived here because no live
endpoint publishes it — it comes from the August document and is quoted as such.

**Reconciliation:** this derivation sits at or below the bottom of the August band, for one reason —
it scores strictly against artefacts and refuses to run two of the four methods. What has changed
since 19 August is coverage, not commercial traction: doors 193 → **292**, formats 240 → **372**,
board 15-of-22 measured → **22 of 22**, root cards → **167**, corrections → **46**. Revenue has not
moved off `null`. In the August document's own phrase: **the floor got firmer; the ceiling did not
rise.**

### The largest quantifiable value risk is unchanged and cheap to fix

"Council of AI", "CSOAI", "MEOK" and "GSPC" are **unregistered**, with a known conflicting registered
mark. That is a classic early-stage discount driver and a re-brand tail risk a diligent investor
will price in or make a condition of investment. UKIPO filing from 1 April 2026 is **£205 first
class + £60 per additional class** online. It is the single highest-ROI action on this page and it
is owner-gated — see `OWNER-ASKS`.

---

## 6. What would move the number

| Move | Effect | Status |
|---|---|---|
| **One settled USDC receipt** | Turns `settled_usdc` from `null` into an integer and makes §3 computable at all | rail is `mode: live` with facilitator provisioned — nothing settled yet |
| **Trademark filings** | Removes the largest quantifiable discount | owner-gated, £205 + £60/class |
| **A second person** | Berkus team factor is £0.0M today and cannot rise without an artefact | — |
| **A countersigned attestation** | Berkus relationships £0.1M → materially higher; needs a counterparty key | see `/.well-known/erc-8004-registries.json` |
| **Anchoring `root.json`** | Removes the "signed but unanchored" gap three research briefs independently flag | free; OTS calendars cost nothing |

---

_Derived 2026-09-05 by the capital lane. Every live figure carries the URL it came from; every
quoted figure carries its document and date. Two of four methods return no number, and that is the
finding, not a gap in the work._
