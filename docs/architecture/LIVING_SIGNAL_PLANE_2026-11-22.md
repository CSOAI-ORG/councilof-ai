# Council of AI: living signal plane — integration and release map
**Prepared:** 2026-11-22 UTC  
**Status:** reviewable engineering slice, not deployed, not adopted governance, not legal advice.

## Why this is a convergence, not a new authority

The repository already contains a regulatory inventory with a byte-pinned discovery pointer, a daily mapping review queue, signed GSPC measurement cards, corrections and claims registers, workgroup proposals, OTEL adapters, a GSPC web component, MCP tools and x402 catalogues. The verified public /api/gspc read on 22 November 2026 reports 34 axes and 34 measured, **zero** statistically separated model-comparison leaders (seven TIE; seven UNTESTED). The old 31 October watchdog note says 33 axes and is a historical observation, not the current board. Do not update a score, legal mapping or charter because a new official document appears.

Some code/docs explicitly mark important services **design**, **UNAVAILABLE**, **NOT_STAFFED**, **PENDING** or **OWNER LOCK / DRAFT HOLD**. They must remain that way until their stated acceptance evidence exists. The tokenized passport is a proof pointer, not a compliance grade.

## Single record spine

Do not fork existing `csoai.evidence-event/0.1`, `csoai.hitl-authority-effect/0.1`, review queue or signed-card schemas. Build adapters to these contracts. Every cross-system message needs:

- Immutable subject identifier and revision, source URL, retrieval time, declared legal basis for retention and source rights.
- SHA-256 of the **exact bytes**, stable canonicalization profile, optional Merkle inclusion, Ed25519 signing identity and key-validity window.
- Evidence status distinct from materiality, legal applicability, measurement outcome, human authority and buyer acceptance.
- Prior event, supersession/correction references, challenge status, appeal state, time-to-review and publication decision.
- Trace ID with redacted OTel attributes; no PII, secrets or unrestricted prompts in public evidence.
- Machine-readable failure modes: UNKNOWN, UNVERIFIED, UNCHECKABLE, NOT_STAFFED, HELD, SUPERSEDED.

### Lifecycle: frozen measurement, fluid operational state

```text
Official source / model / dataset / agent trace
   -> source eligibility and purpose check
   -> bounded collector with exact source, version and digest
   -> immutable candidate event and diff
   -> reviewed crosswalk candidate (jurisdiction, scope, date, affected axis)
   -> remeasure request, never score mutation
   -> GSPC reproducible run and independent verification
   -> pre-authorised containment for imminent boundary violations only
   -> accepted working-group human/quorum review
   -> correction or signed disposition / supersession
   -> verified public API + MCP + CouncilOS + plugin + optional paid assembly
   -> watch renewal, expiry and revocation
```

No queued machine draft is an accepted human decision. No role name is a roster acceptance. No W3C, IETF, OWASP, NIST, SEC, WG-SAFE or Linux Foundation group can be used as an automatic incident-response queue or implied endorsing body.

## Regulatory signal engine

1. Source registry: official URL, issuing body, instrument, legal status, source permissions, locale, effective/publication dates and canonical URL/version. A bot challenge/403 is UNVERIFIED; not an origin outage.
2. Delta registry: exact changes and normalizer-version changes separated. Normalize revisions deterministically. A hash change is a **review candidate**, not a legal event.
3. Date engine: effective date, grace period, review-by date, implementation date and public-comment close are different fields. An unreviewed date is UNKNOWN.
4. Crosswalk: **approved** links from provisions to GSPC axes, tests, covered products, affected claims and customer evidence subscriptions. Route unmatched signals to human review, not into a default axis.
5. Evaluation trigger: signed job request keyed by source revision + model revision + method commit + corpus digest + test suite; deduplicate concurrent jobs and retain failures.
6. Output: a regulatory-change card with official source links, applicability NOT_ASSESSED until resolved, dated evidence, reviewer state, and export to signed claim passport.
7. API and portal: `/interop/living-signal-plane.html` (read-only preview in this PR), then graduate a canonical CouncilOS native pane after buyer/keyboard/mobile testing.

This PR provides an isolated read-only `triageRegulatoryQueue` implementation consuming the **existing** queue contract, plus exact-byte dataset delta and agent trace guards. No automatic source ingestion, formal legal mapping or human dispatch is claimed. The public page's date references are curated as-of 2026-11-22 and MUST NOT be presented as live legal updates.

## GSPC / agent security experiments

The goal is to distinguish **proven trace boundary violations** from **possible covert communication** and **model-intention speculation**:

- Dataset manifest: SHA-256 per file, deterministic sorted manifest digest, fixed baseline revision, added/deleted/changed leaves, verified negative controls. One-byte changes are detectable when both byte sets are available. Poisoning intent and effect require further evaluation.
- Poisoning study: 0/1/10/50/150 malicious-document synthetic interventions under permissioned corpora, 3+ independent seeds, attack success rate, clean utility, label leakage, baseline reproducibility, blind anomaly detector, false-positive and missed-detection rates.
- Multi-agent studies: allowed communication graph vs observed edges, tool permissions, network egress, tool-result tampering, shared-memory writes, delayed/encoded side channels, steganographic payload correlation, decoy canaries and holdout adversarial cases.
- Confinement: test a real tool/egress proxy with fail-closed policy, then measure interrupt-to-last-effect latency. Logging alone is **not** a kill switch. No monitor can guarantee detection of all covert channels or hidden reasoning.
- Quorum H.I.M.: role-based, independent reviewers, conflict-of-interest check, signed receipt from authenticated key, two-of-three escalation for higher risk, explicit no-response fallback. Human notification is never equivalent to acceptance; receiver identity and operating hours must be verified.
- Source/reader failures, negative-control false positives and data rights all enter the run receipt.

## Front end / buyer journeys (same factual state, many surfaces)

| Persona | Entry | Task | Completion condition |
|---|---|---|---|
| Buyer | Homepage case study, clear CTA | What is measured? Scope fresh-run request, see paid boundary | Free verified preview; buyer knowingly initiates paid or invoiced action |
| Developer | MCP / SDK install guide | Connect and use existing GSPC tools | Valid tools/list, tools/call and verifier readback in target client |
| Security operator | CouncilOS agent security pane | Inspect unexpected edge/tool/egress; hold action | Refusal at actual enforcement gateway, measured latency and audit receipt |
| Researcher | GSPC axis panel | Download frozen dataset and rerun | Independent reproduction or specific UNCHECKABLE gap |
| Human reviewer | H.I.M./WG queue | Accept scope; evaluate contested evidence; decide | Authenticated acceptance, decision and separately verified persistence |
| Regulator/auditor | Evidence passport export | Compare provision, evidence and correction history | Reproducible source-bound export with non-certification scope |
| Agent client | x402/MCP | Discover resource, inspect free preview, buy approved assembly | 402->facilitator-confirmed receipt->delivery with independently verified bytes |

Improve the embeddable panel first with discoverable GSPC, corrections, review and regulatory links, then test the same routes in ChatGPT/Claude-compatible MCP clients, desktop/mobile, iframe, keyboards and screen readers. Do not show fabricated platform installation screenshots or suggest directory approval where there is none.

## Tokenized passport (still owner-locked)

Attach **revocable status pointer** to claim revision + signed evidence root + issuer identity + expiry + scope + challenge state. Prefer interoperable W3C VC 2.0 / JOSE-COSE profiles where applicable. Keep free verification. Fee is for computation, assembly, scheduled renewal or private delivery; never the grade, reviewer decision, legal approval or truth. Do not mint/release passport under the current owner lock. ERC-8004 and x402 are integration options; neither converts a token into assurance.

## External alignment: reuse rather than claim affiliation

- IETF SCITT RFC 9943: interoperable transparent statements/receipts. The repo declares no operating SCITT transparency service; test receipt verification separately.
- Sigstore / SLSA: build provenance, signing and transparency. Distinguish Rekor integration, timestamp authority and issuer identity.
- OpenTelemetry GenAI: trace correlation, control points and privacy-conscious evidence projection.
- W3C VC 2.0 and JOSE/COSE: issuer/holder presentation and revocation/status semantics.
- NIST AI agent standards and OWASP Agent Control Standard: test matrix and proposal crosswalk, not NIST/OWASP endorsement.
- Hugging Face model/dataset revisions: training lineage and reproducible benchmark runs; no new spend without approval.
- Cloudflare Workers/R2/Queues and x402/MPP: deployment, job isolation and transaction infrastructure; programme participation is not a partnership.
- Human external working groups: submit standards-relevant **public, sanitised, authorised** proposals only through their actual participation mechanisms; no automatic incident dumping.

## Release gates

**Gate A — contract and evidence:** schema compatibility; exact source digests; consumer contract tests; baseline/normalizer differentiation.

**Gate B — security:** threat model, SSRF/egress boundaries, replay and forged-event negative tests; no public user data leaks; enforcement proof separate from advisory detector.

**Gate C — human:** verified identity, role acceptance, independent quorum, appeals, no-response state, audit receipt and correction.

**Gate D — platform UX:** actual buyer/developer/researcher/reviewer journeys and responsive/keyboard tests; result text matches independent verifier.

**Gate E — commercial:** free verification, explicit payment authorisation, confirmed settlement, signed deliverable linked to receipt; no revenue from token mint or HTTP 200 assumed.

**Gate F — release:** CI pass, reviewer decision, preview check and production user-journey readback. PR merge is not deployment, and deployment is not evidence of adoption.

## Sequencing and completion evidence

| Wave | Work | Done only when |
|---|---|---|
| 0 | Existing source/axis/runtime inventory and guarded adapters | Read-only data endpoints and exact limitations are publicly consistent |
| 1 | Regulatory triage + data diff + agent observer (this PR) | Tests and review pass; no unauthorized side effect |
| 2 | Single evidence event / passport adapter | Every claim links to a real source revision, verification and corrections status |
| 3 | GSPC poisoning and covert-channel controlled challenge | Frozen reproducible false-positive and detection results; comparison baseline |
| 4 | Enforced agent boundary and group review | Denial at gateway, valid human quorum and halt-time measurement |
| 5 | CouncilOS native signal desk and panel product UX | End-to-end real client/keyboard/mobile tests |
| 6 | Monetization and distribution | Proven 402 challenge, settlement, delivery, repeat buyer, margin |
| 7 | Standards participation and periodic independent review | Accepted contributions/receipts and no invented institutional authority |

**North-star metrics:** externally reproducible measurement percentage, stale claim hours, event-to-review latency, halt/last-effect latency, reviewer disagreement, false-positive rate, paid successful delivery rate, repeat paying customers and evidence consumers with independently verified readbacks. Downloads, signatures, visits and registry appearances are separately reported indicators, not conversion or trust by themselves.

## Official source references checked 22 Nov 2026

- [EU AI Act implementation timeline](https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act)
- [AI Omnibus adopted legislative text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R1744)
- [IETF SCITT RFC 9943](https://datatracker.ietf.org/doc/rfc9943/)
- [W3C VC JOSE/COSE Recommendation, 13 Oct 2026](https://www.w3.org/TR/2026/REC-vc-jose-cose-20261013/)
- [NIST AI Agent Standards Initiative](https://www.nist.gov/news-events/news/2026/02/announcing-ai-agent-standards-initiative-interoperable-and-secure)
- [OWASP Agentic Security](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
- [ICO agentic AI and data-protection risks](https://ico.org.uk/about-the-ico/research-reports-impact-and-evaluation/research-and-reports/technology-and-innovation/tech-horizons-and-ico-tech-futures-agentic-ai/data-protection-and-privacy-risks)
- [Cloudflare machine payments](https://developers.cloudflare.com/agents/tools/payments/)
