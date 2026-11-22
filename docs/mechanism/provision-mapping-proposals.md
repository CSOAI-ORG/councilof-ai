# Provision-mapping proposals (DRAFT, for owner review)

Source of truth: `public/mechanism/provision-mapping-proposals.json`. Review sheet: `docs/mechanism/mapping_review_sheet.csv` (one row per proposal; fill `owner_decision` and `owner_notes`, then set each proposal's `status` in the JSON to `REVIEWED` or `REJECTED` and re-run the producers).

Every proposal points a measurement at a provision of frozen corpus v3 (root `8d057a301973ec0307566152362cf711a661eea956426fe960ee9e28a49c25c0`) and quotes the span of that provision it rests on, verbatim. Relations are `partial` (the measurement observes one trace the provision names) or `related` (it observes something the provision's text is about); never equivalence. Measurement, not certification.

## Counts (derived)

| source | proposals | subjects with a proposal | subjects left unmapped |
|---|---|---|---|
| adapter | 3 | 3 | 8 |
| predicate | 1 | 1 | 5 |
| axis | 21 | 14 | 9 |

`coverage.json` → `capsule_binding`: CAPSULE_BOUND = 0 (reviewed only), CAPSULE_BOUND_DRAFT = 1779 of 11529 capsules. Both are derived by `scripts/mechanism/backfill-capsule-provisions.mjs` and `scripts/mechanism/build-coverage.mjs`; neither is typed.

## How a status flip binds

* `REVIEWED` adapter proposal: the sidecar `capsule-provision-bindings.json` gains a binding row per matched capsule, pinned to the corpus v3 manifest, and CAPSULE_BOUND rises by those capsules. A proposal with `match` binds only capsules whose claim field equals the value (contract_parity: `claim.dimension = TOOLS`).
* `DRAFT`: counted in CAPSULE_BOUND_DRAFT only. `REJECTED`: counted nowhere.
* Predicate and axis proposals bind no capsule (no capsule batch carries them); they are pointers for the review only.
* The capsule library (`packages/venturi-capsule`) still writes in-capsule 0.3 bindings from `capsule-provision-map.json` only, whose ids are CELEX ids of the v1 manifest; a REVIEWED corpus v3 proposal binds through the sidecar.

## Left unmapped, with the reason

| source | subject | reason |
|---|---|---|
| adapter | a2a_card | Measures whether an A2A agent card verifies under the key it references (signature over the served bytes). No corpus v3 provision with published text names agent-card signing or verification; the CRA integrity requirement sits in Annex I, which corpus v3 does not hold, and OWASP LLM01:2026 point 10 names MCP servers and tool packages, not agent cards. A signature check is not evidence of AI Act transparency. |
| adapter | busabase | Measures our own store's live record counts and record-set digests on the build pod. No provision names this observable. |
| adapter | claim_watch | Measures whether a sealed subject's captured claims still reproduce at re-read. Which provision a claim concerns depends on the claim, and the subjects are sealed (named only by id), so no provision can be bound at adapter level. |
| adapter | cross_ledger | Measures an issuer's own deployment list against ledger state (issued supply only). The nearest frozen text, MiCA Art 30(1) (amount of asset-referenced tokens in circulation), applies to issuers of asset-referenced tokens, and none of the measured products (USDC, BENJI, JPMD, BUIDL, deposit-token services, USDe) is established as one; binding every capsule to it would point at a duty that does not apply to these subjects. |
| adapter | meok | Measures sha256 digests of MEOK files and a Busabase base on the build pod. No provision names this observable. |
| adapter | operations | Measures our own deploy runs, master landings, corrections, dataset commits, anchors and private notices, declared against observed. No provision names this observable. |
| adapter | public_signals | Measures outside signals about CSOAI itself (downloads, listings, citations, payers). No provision names this observable. |
| adapter | self_parity | Measures whether external indexes list CSOAI's own offerings as served. No provision names this observable. |
| predicate | cra-13-support-period | Did not pass the held-out check (never fired on home-page inputs; untested); must not be bound. |
| predicate | cra-19-importer | Did not pass the held-out check (never fired on home-page inputs; untested); must not be bound. |
| predicate | gdpr-13 | Did not pass the held-out check (held-out FN 7/9 auditable negatives); must not be bound. |
| predicate | gdpr-14 | Did not pass the held-out check (held-out precision 2/3 (one false positive)); must not be bound. |
| predicate | gdpr-37 | Did not pass the held-out check (held-out FN 3/7); must not be bound. |
| axis | ai-adoption-components | Cites two Eurostat AI-adoption series (isoc_eb_ai). A public statistic is not evidence for or against any party's duty, and no frozen provision names this series. |
| axis | claim-maintenance | Asks whether a captured public claim is still served unchanged at re-read. Which provision a claim concerns depends on the claim; no provision names claim maintenance as such. |
| axis | humanoid-labour-index | Records whether 8 frozen humanoid-vendor URLs publish a dated deployment count. No corpus v3 provision requires a vendor to publish deployment counts. |
| axis | interop-conformance | Asks whether interoperability and standards groups publish specs, test suites and conformance records. No corpus v3 provision places a publication duty on such groups. |
| axis | interpretability-reproducibility | Asks what an interpretability group publishes and whether it reproduces. No corpus v3 provision places a duty on such groups. |
| axis | labour-components | Cites two Eurostat labour series (lfsi_emp_a, une_rt_a). A public statistic is not evidence for any provision. |
| axis | provenance-controls | Measures on-chain issuer control flags (allowlisting, freeze capability, identity domain). No corpus v3 provision with published text names issuer freeze or allowlist capability as a duty or disclosure. |
| axis | serving-fidelity | Asks whether an endpoint claiming model M behaves like M's reference serving. No corpus v3 provision names this observable; a behavioural divergence is not by itself a misrepresentation. |
| axis | watchdog-ingest | Asks whether public watchdog and incident sources answer and what they contain. No provision places a duty on those sources; the AI Act serious-incident reports (Art 73) are not public. |

## Not changed

* The 11 GSPC axes that already point at 13 EU AI Act provisions (served by `/api/gspc`; `functions/api/gspc.ts` is not edited).
* `capsule-provision-map.json` (its rule and its single Art 50(2) route mapping).
* The CRA Art 13(8) binding is for the `cra-13-cvd` predicate only (held-out: 14/14 DETECTED rows true positive, 95% Wilson 0.785-1.000; 0/6 false negatives, 95% Wilson 0.00-0.39; 30 sites). GDPR 13/14/37, the CRA support-period predicate and CRA 19 did not pass and are not bound. Annex I Part II of the CRA is not a frozen provision in corpus v3.
