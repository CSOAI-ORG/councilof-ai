# Growth compounding research — CSOAI + MEOK (claude lane, 2026-11-04)

**Doc ID:** `csoai.growth-compound-research/0.1` · deep-research pass per owner direction
**Method:** every number below was measured live today (HF APIs, councilof.ai GETs, the official
MCP registry API, WebSearch for the external channels). Doctrine binds: measurement
credentials, never certification; no adoption, revenue or market-size claims without a
measured source; nothing here is a promise of any multiple — it is a map of compounding
mechanisms and their next executable steps.

---

## 1. The compounding substrate, measured 2026-11-04

| asset | measured state | compounds how |
|---|---|---|
| GSPC board | **34 axes · 34 measured** · `GET /api/gspc` 200 | every axis measured is a reusable, citable measurement; the density is the product |
| HF datasets | **50 public datasets · 90,892 total downloads** · all refreshed 2 Nov (M2/setup lane) · top: gspc-boards 5,579 · gspc-swarm 5,515 · gspc-gov 5,285 | each download is a researcher/agent ingesting CSOAI banks; dataset READMEs already carry 26 councilof.ai/verify references each (audited today) |
| HF Spaces | 28 (the ONE living board Space `csoai/gspc-board` **RUNNING**; intake dataset correctly private) | static per-bank Spaces = permanent, zero-cost distribution |
| MCP official registry | **`ai.councilof/gspc` v1.4.4 (+ `-free` variant) + `a2a-governance-bridge-mcp` v1.0.1 registered** — 18 gspc entries | agent ecosystems discover the door through the official hub; every new MCP client generation finds it |
| x402 rail | 5 metered tools · receipts **status PUBLISHED, count 26** · x402.json manifest live | each metered call produces a receipt; receipts compound into the evidence corpus |
| Trust surfaces | corrections register 93 entries · witness MATCH · presence ledger 2,202 rows (2,138 VERIFIED) · OTS 694 proofs (693 anchored) | the honest-state moat: fail-closed gates + published corrections are the differentiator vs scoreboards |
| End-user journeys | W9 survey **18/18 PASS, slowest 2.7s** (re-run 4 Nov) | every public artefact is checkable by a stranger in under a minute |
| Practice/academy | Boss's Chair practice arena · 59 e2e shell journeys green | learning surface compounds without measurement cost |

## 2. External demand windows (researched 2026-11-04)

1. **EU AI Act, Aug 2026**: high-risk obligations fully apply; conformity-assessment readiness
   demand rises with notified-body engagement and harmonised-standard alignment. The estate's
   Art-50/Art-53 evidence packs and `framework_readiness` tooling are product-ready for the
   **readiness-evidence** layer (never certification — that is notified bodies' role, and the
   doctrine already says so).
2. **MCP Server Cards (2026 roadmap)**: a standard for richer server discovery metadata is
   coming to the official registry. The estate's `server.json` + registry package already
   exist — auditing them against the emerging card schema is a small, high-leverage task.
3. **Agent-ecosystem directories**: official registry + Glama/PulseMCP/Smithery/Raycast. The
   verified-listings register tracks these; the official registry is confirmed live for us.

## 3. Compounding mechanisms, ranked by (leverage ÷ effort), all in-lane executable

| # | mechanism | first executable step | owner act needed? |
|---|---|---|---|
| C1 | **HF engagement loop**: 91k downloads but 0 likes/zero discussion — the audience is real and silent. Add an examples notebook + a "verify this dataset" section to the top-5 dataset cards (cards are 187 lines and already link verify; the gap is a first-run example) | draft + push updated READMEs with the valid local token (local HF ops GO) | no |
| C2 | **MCP Server Cards readiness**: audit `mcp/gspc-server/server.json` against the 2026-12-11 registry schema; ship the richer metadata so the door surfaces in the new discovery UX | schema audit + PR | no |
| C3 | **Receipts flywheel visibility**: receipts are PUBLISHED (26) but invisible on the public surface — surface the count + verify path on the receipts page so each x402 call compounds public evidence | small surface PR | no |
| C4 | **Aug-2026 readiness window**: publish the framework-readiness journey as a dated, source-linked page (the tooling exists; the journey is the product for the wave) | surface PR | no |
| C5 | **N-site hunt → outreach pipeline**: 2,202 onboarded surfaces are a measured contact list; the outreach lane owns it | coordination hand-off | partially (owner approves sends) |
| C6 | **Standards positioning**: SAFE port + IETF capsule draft are prepared (B2/B3 owner-gated filings) | owner | yes |

## 4. The honest multiplier

There is no 1,000,000x. What exists: a measured, self-verifying evidence corpus (the moat),
~91k real dataset downloads (distribution), a registered 53-tool measurement door (agent
reach), a live x402 rail (revenue path), and a regulatory demand window opening Aug 2026.
Every mechanism above feeds the next: downloads → verify → receipts → evidence → registry
rank → downloads. That loop is the compounding; the gates keep it honest.

## 5. Execution log (this pass)

- [x] substrate measured live (section 1)
- [x] external windows researched (section 2)
- [x] HF top-5 dataset-card audit done (cards sound; C1 is the gap)
- [x] this doc landed on master
- [x] C1 done 2026-11-08: verify-first-run sections LIVE on all 5 top datasets (gspc-gov, -boards, -swarm, -mcp, -care); daily survey re-run 18/18 PASS same day (rerun artefact beside this file)
- [x] C2 server.json schema audit done 2026-11-04: **already schema-compliant** (all required fields, zero unknown keys); optional icons/_meta deferred
- [x] C3 re-scoped 2026-11-04: the receipts flywheel surface already exists (/receipts + free /api/receipt-status + verify links) — the doc's "invisible" assumption was wrong; corrected
- [ ] C4 Aug-2026 readiness journey page (queued)

## 6. What this document is not

Not a promise, forecast, certification or market claim. No multiple is predicted. Every
"compounds how" is a mechanism, not a measurement of growth. Sources: live GETs and the HF
APIs today; MCP registry API today; WebSearch for the 2026 registry/AI-Act windows
(registry.modelcontextprotocol.io, truefoundry.com 2026 registry comparison, workos.com MCP
2026 primer, artificialintelligenceact.eu Art 43, FPF conformity guide 2025).
