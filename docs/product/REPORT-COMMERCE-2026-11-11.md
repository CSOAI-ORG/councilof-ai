# Report-to-revenue: outward discovery and buyer workflow

**Observed:** 11 November 2026. **Scope:** public discovery, existing report previews and a bounded repair to three owned directory descriptions. This is not an exhaustive commercial acceptance audit, a revenue forecast or a new pricing decision.

## Completed outward work

The public 402 Index query returned 37 exact `councilof.ai` URLs. Nine descriptions still contained a promotion ending 11 October 2026. The existing registration loop checks only whether a URL is absent, so it does not repair stale descriptions on existing rows.

At 06:45:00–06:45:04 UTC, the documented public re-registration API updated three existing records: provider-document history, the Article 50 evidence-bundle entry, and the proof bundle. Their identities and display names were preserved; descriptions came from the current canonical `/.well-known/x402.json`. No price, wallet, credential or contact-email field was sent. Each returned HTTP 201, then the exact public record returned HTTP 200 with matching description and `status: active`. Independent reads at 06:47:34–06:47:36 UTC confirmed the changes remained visible. This is metadata maintenance, not three new customers or three new services.

The directory's separate cached `price_usd` fields still showed 0.01, while the inspected canonical manifest quotes were 20,000 atomic USDC (0.02 USDC). The numeric directory mismatch remains unresolved; the payment challenge is authoritative. The observed directory `domain_verified` fields remained zero. Neither price synchronization nor verified directory ownership is claimed.

A public x402scan endpoint registration for the Article 53 evidence bundle subsequently displayed **“Successfully registered 1 of 1 resources”** at 06:48:33 UTC, with an API page at `https://www.x402scan.com/server/9b8bcb34-6c9f-45d6-b881-9a6afe7bf6b5` and merchant link `https://tryponcho.com/m/councilof.ai`. The form discovered many other operations; they are not counted as registered products. Earlier domain-only attempts had not completed and were not counted as success. A fresh public API-page readback at 06:52:37 UTC, after expanding the ordinary resource list, showed the evidence-bundle route and its current descriptive limitations. The page also included free and retired operations; its operation count is not a product count. No purchase or test-call widget was used.

## The current commercial position

| Observation | What it supports | What it does not support |
|---|---|---|
| Canonical manifest advertises 32 concrete resource URLs | Existing discovery coverage | 32 independent products, or a proven set of 22 earning loops |
| Coinbase validator accepted Article 53 evidence assembly, provider history and MCP discovery-probe challenges | These three unpaid challenge/metadata checks passed | A settled purchase, completed paid delivery, current index presence or demand |
| Coinbase merchant lookup returned zero resources for the specified pay-to address | No active result in that scoped lookup at 06:28:44 UTC | Absence from every facilitator, directory or marketplace |
| Public revenue endpoint reported four non-self payer wallets and five qualifying settlements, totaling 60,000 atomic USDC | The ledger reports 0.06 USDC, excluding self and zero-value records | Four independently authenticated customers or product-market fit |
| One all-time repeat non-self payer wallet; none with two settlements within the last 30 days | Limited recorded repeat-wallet evidence | Reliable recurring revenue |

The ledger also reported 22 excluded self-settlements and nine excluded zero-value records. None of the work in this pass paid the estate or generated a new customer purchase. The ledger was not independently reconciled against chain transactions in this pass.

## Sell the workflow around the report

These are prioritized commercial hypotheses using existing capabilities, not newly launched products or adopted prices.

| Priority | Buyer job | Existing route or asset | Defensible paid value | Repeat trigger and acceptance gate |
|---|---|---|---|---|
| 1 | Prepare evidence about a named model/provider for an internal governance review | `GET /api/evidence-bundle?obligation=article-53` preview; paid bundle adds `bundle=1`; other supported obligations include Article 50, DORA and CRA | Subject-filtered assembly, machine-readable packaging, explicit missing coverage and reproducibility | New model/version or review date; accept only after preview relevance, settled delivery, artifact validation and buyer confirmation |
| 2 | Check a public agent/tool endpoint before integration | Existing `/api/ras/mcp-probe` and `/api/ras/x402-check` routes | A scoped discovery/conformance read and its actual evidence state | Endpoint version or deployment changes; no claim that a discovery probe guarantees runtime safety or calls a tool |
| 3 | Understand the history of provider-document changes | Existing `/api/feeds/provider-diff` and its paid history assembly | Filtered, dated hash-change history, source references and retained evidence | Buyer-selected provider/time window; do not imply semantic interpretation from a hash change |
| 4 | Keep an audit's evidence references reconstructable | Existing proof bundle, historical card batch and corrections routes | Assembly of the requested history, proof paths and correction/version context | Review renewal, changed evidence or migration; verify each relevant record rather than infer truth from a signature |
| 5 | Maintain a client's explicit claim inventory | Existing claim-maintenance registries and `/api/pop/claim-watch` archive | Scoped history and, after operational qualification, paid cadence/review work | Current source permissions, freshness and actual human/service capacity must be established before a recurring delivery promise |
| 6 | Reproduce a result inside a buyer's own pipeline | Existing source-pinned Hugging Face/Kaggle packages, evaluation inputs and negative controls | Integration, supported reproduction, rights-cleared curation and versioned exports | A real workflow integration and repeat consumption; public bytes are not exclusive IP and private customer material is not training permission |

The useful customer sequence is **report → inspect a relevant free preview → select scope → see current terms → authorize one purchase → retrieve and validate the output → request the next dated update**. For a human buyer without an agent wallet, keep the existing scoped invoice enquiry distinct from an automated checkout. Do not create another payment system, hide the public verifier, or turn a catalog entry into a service-level promise.

Every report should have one relevant next action, not links to every product. A GPAI report should lead to the matching subject/obligation preview; an endpoint report to that endpoint's discovery evidence; a provider-change report to the appropriate dated history. Record no conversion merely because a link rendered or someone opened it.

## Freshness is part of the product

At the actual reads, the provider-document feed's latest `as_of` was **2 November 2026**, the GPAI evidence corpus was dated **7 November 2026**, and the claim registry preview stated **28 September 2026**. The latter distinguished **206 historical rows across published versions** from **99 rows in the current registry set**. These denominators must remain separate.

A response produced today is not necessarily data observed today. These archives can support a dated-history product, but cannot establish an operating current daily-monitoring service. The existing producer/release owners must qualify refreshes before advertising recurring freshness. No producer, scheduler or private fleet control was changed in this pass.

## Indexing strategy and durable value

Coinbase documents discovery through eligible settled calls with Bazaar metadata, not a separate registration form. Validator success is not indexing. Do not self-pay, create wallets, manufacture transactions or count internal probes as customers to improve a listing. Use a genuine authorized buyer journey and inspect the resulting facilitator/index evidence when it occurs.

The durable commercial asset is a reconstructable history: exact source revisions, observation windows, corrections, missingness, repeatable methods and buyer-useful delivery. New permissioned outcome labels can improve product design: which question was asked, whether the evidence covered it, whether delivery succeeded and whether the buyer returned. These require appropriate consent/minimization and must remain separate from the public measurement score. Download counts, endpoint counts and repackaging alone do not establish a defensible moat or an IP valuation.

The next acceptance target is one real external buyer completing and confirming one useful paid workflow, followed by a repeat purchase. Track discovery, preview relevance, accepted price, settlement, successful delivery and repeat use as distinct stages. No proposed package price or revenue target is adopted by this report.

## Source improvement and boundaries

The existing `register-402index.py` gains an explicit `--refresh-existing` dispatch. New `index402_refresh.py` requires exact selected owned URLs, defaults to plan-only, bounds pages/bytes/time, refuses ambiguous listings and price-bearing descriptions, preserves descriptive metadata, checks for concurrent edits and retains an intent before each write. It never retries an ambiguous write. A 201 response alone does not qualify active publication.

The final source passed **37 offline tests**, including the unchanged default missing-only path, dry-run/no-write, pending-versus-active, duplicate/incomplete pages, concurrent edits, price exclusion, failed transport and no automatic re-submission. These are synthetic instrument controls, not model benchmarks or extra commercial transactions. The existing installed loop and schedules remain unchanged; source review/merge is a separate step.

Primary platform references: [402 Index registration API](https://402index.io/api-docs), [Coinbase discovery](https://docs.cdp.coinbase.com/x402/seller/get-discovered), [x402scan discovery specification](https://github.com/Merit-Systems/x402scan/blob/main/docs/DISCOVERY.md). Exact observations, timestamps and hashes are retained in the accompanying qualification records. The directory-maintenance event reuses `csoai.evidence-event/0.1`, remains unsigned and grants no execution authority.

## Explicit operator invocation

```sh
python3 -B scripts/pod-loops/register-402index.py --refresh-existing \
  --only-url 'https://councilof.ai/api/proof?bundle=1' \
  --max-changes 1 --out /approved/receipt-directory
# The command above is plan-only. Add --apply only for the authorised selected refresh.
python3 -B -m unittest discover -s scripts/pod-loops -p test_index402_refresh.py
```
