# PROVISIONAL PATENT APPLICATION

**Title:** Deterministic Transparency-Obligation Probing with Evidence-Carrying Verdicts and Public Self-Inclusive Measurement Boards

**Applicant:** CSOAI Ltd (UK 16939677)
**Inventor:** Nicholas Templeman
**Priority Date (drafted):** 2026-10-08
**Filing Route:** UK IPO Form 1 (provisional) → PCT at 12 months → national phases at 30 months
**OIN 2.0 / LOT scope check (recorded):** NOT Linux-System-adjacent — claims cover measurement instruments, probe methods and evidence formats. No Limitation Election required; grant-back does not apply. Conscious, recorded decision per AGENTS.md patent governance.

**Companion provisional (scope-split, same portfolio):** `PROVISIONAL_SIGNED_MEASUREMENT_RECEIPTS_GOVERNED_DISTRIBUTED_INFERENCE_2026-10-07.md` — covers signed measurement receipts and governance-aware tier routing for distributed LLM inference. The present application claims the *transparency-obligation probe and public measurement-board* methods and explicitly does not claim distributed-inference receipt routing.

---

## 1. Field of the Invention

Relates generally to automated regulatory-compliance measurement of networked software, and more specifically to deterministic probing of live digital surfaces for machine-detectable transparency obligations (disclosure of AI interaction, machine-readable marking of synthetic content, and labelling of AI-generated media), producing per-verdict evidence-carrying measurement observations that include self-measurement of the measuring party and are published to a shared measurement board.

## 2. Background

Transparency regimes (notably EU AI Act Article 50, Regulation (EU) 2024/1689) impose machine-detectable duties: AI-interaction disclosure (Art. 50(1)), machine-readable marking of synthetic content (Art. 50(2)), and labelling of AI-generated/deepfake media (Art. 50(4)). Enforcement is complaint-driven and evidence-starved: nothing in the ecosystem continuously measures whether covered surfaces actually carry the required artefacts.

Existing tools fail in three characteristic ways. (a) Self-service checkers and toolkits (e.g. "Article 50" compliance toolkits, 2026) produce **self-attested** outputs: the party being measured controls the evidence, and exported "evidence packs" are dated but **unsealed** (mutable after export). (b) Governance platforms generate **platform-attested** workflow evidence ("the platform says so") inside the customer's own tenant — the measuring instrument and the measured party share an interest. (c) Open-source scanners (e.g. `article50` CLI, 2026) detect gaps with static rules but emit no verdict-integrity guarantees and do not bind each verdict to its evidence. Directory and registry "verification" programmes explicitly disclaim being audits.

A further deficiency: all existing measurers measure *others*. None include themselves in their own measurement population, so a board's neutrality claim is untestable. And no existing probe binds each rendered verdict to the concrete evidence snippet (or to the explicit statement "checked, none found") that produced it — a precondition for adversarial review and for later signature/anchoring of observations.

## 3. Summary of the Invention (Claims)

1. **A method for deterministic measurement of transparency obligations on live digital surfaces**, comprising: retrieving, by a measurement instrument, a digital surface associated with a subject; applying, without probabilistic inference, a plurality of obligation-specific pattern sets derived from a regulatory transparency provision to the retrieved surface; and emitting, for each obligation, a verdict tuple comprising (i) a verdict state selected from a fixed honest-label set including PASS, PARTIAL, ABSENT and N/A, (ii) at least one verbatim evidence excerpt bound to said verdict, or an explicit checked-none-found marker, and (iii) a scan-scope qualifier identifying the retrieval scope, thereby producing measurement observations reproducible bit-for-bit by independent re-execution.

2. **The method of Claim 1**, wherein the fixed honest-label set further encodes non-accusatory semantics: ABSENT is defined as "checked, none found in scanned scope" and is disclaimed as not constituting a legal finding.

3. **A system for self-inclusive measurement boards**, comprising: a probe instrument as in Claim 1; and a publishing stage that publishes verdict tuples for a plurality of third-party subjects and, using the identical instrument and label set, for the operator's own surface in the same population and format, whereby the neutrality of the measurement operator is itself continuously measurable.

4. **A method for evidence-binding in compliance measurement output**, comprising: for each emitted verdict, storing within the verdict record the exact evidence excerpt retrieved from the measured surface, or the explicit marker "checked, none found", together with timestamp and byte-count of the scanned scope; and emitting a machine-readable dataset in which every verdict is independently reviewable against its bound evidence without re-execution of the probe.

5. **The method of Claim 1**, wherein the pattern sets detect, for synthetic-content marking, the presence of C2PA/Content Credentials manifests, IPTC algorithmic-media metadata (including `trainedAlgorithmicMedia` and `digitalSourceType`), and AI-generated meta tags, and distinguish mere structured-data presence from synthetic-content marking via a PARTIAL verdict state.

6. **An integrated system**, comprising: the deterministic probe of Claim 1; the evidence-binding of Claim 4; the self-inclusive board of Claim 3; and a downstream signing stage that converts verdict tuples into signed measurement credentials using public-key signatures and public timestamp anchoring, wherein the unsigned probe observations and the signed credentials are separately labelled so that measurement output is never represented as certification.

## 4. Detailed Description with Reduction to Practice

Implemented as `art50_probe` v0 (module `art50_probe.py`; package scaffold `packages/art50-probe/`, MIT, stdlib-only, console entry point `art50-probe`). Core function `probe(url) -> dict` returns the verdict-tuple structure of Claim 1 literally: keys `url`, `ts` (UTC ISO-8601), `bytes_scanned`, `chat_widgets`, `verdicts{art50_1_disclosure, art50_2_marking, art50_4_media_labels}`, and a `disclaimer` field stating "UNSIGNED probe v0 heuristic observation — measurement data, NOT certification or a credential" (Claim 6's labelling separation).

Obligation pattern sets (Claim 5): `MARKING_PATTERNS` maps `(c2pa|jumb manifest|contentcredentials)` to "C2PA/Content Credentials", `(trainedAlgorithmicMedia|digitalSourceType|IPTC.*Algorithmic)` to "IPTC algorithmic-media metadata", and ai-generated meta tags to their own class; structured-data-only presence yields the PARTIAL state (Claim 5). Disclosure patterns (`\bAI assistant\b`, `\bI am an AI\b`, …) and media-label patterns (`AI-generated (image|video|…)`, `deepfake`, …) implement Claims 1-2; `CHAT_WIDGET_MARKERS` (18 widget families) gates N/A-NO-AI-SURFACE-DETECTED versus ABSENT (Claim 2's non-accusatory semantics). Evidence binding (Claim 4): `probe()` stores verbatim ±60-character excerpts for each positive match and the literal `"checked, none found"` otherwise, with `ts` and `bytes_scanned` on every record.

Self-inclusive board (Claim 3): the measurement population of the first working embodiment is 15 live surfaces — 14 third-party AI-governance/assurance/tooling vendors plus `councilof.ai`, the operator's own surface, measured with the same instrument in the same run (dataset `public/interop/art50-probe-sweep-2026-10-08.json`, published 2026-10-08). Experimental result: machine-readable marking (Art. 50(2)) verdict PASS for 2 of 15 surfaces — the operator's own surface and one third-party toolkit vendor; the governance/assurance vendors exhibited PARTIAL (structured data only) or ABSENT. The result demonstrates the utility of the method: it converts an unmeasurable compliance debate into reproducible per-verdict observations.

Verification: `packages/art50-probe/tests/test_probe.py` — hermetic tests asserting pattern-set compilability, verdict-tuple shape with evidence binding on every verdict, honest UNREACHABLE reporting (Claim 2 semantics), and the checked-none-found marker of Claim 4 (4/4 tests passing in the working implementation as of 2026-10-08). Determinism check: two independent executions of the 15-surface sweep on 2026-10-08 produced identical verdict states (2/15 marking PASS in both runs).

### Prior art comparison

| Reference | What it does | How this invention differs |
|---|---|---|
| EU AI Act Reg. (EU) 2024/1689 Art. 50 | Imposes transparency duties | Regulation, not a measurement instrument; no verdict/evidence machinery |
| C2PA specification (2024) | Carries provenance manifests in media | A *marking format* — one of the artefacts Claim 5 detects; not a probe |
| `article50` open-source CLI (2026) | Static scan for Art. 50 gaps | No verdict-integrity tuple, no evidence binding per verdict, no self-inclusive board, no label separation toward signing |
| Commercial Art-50 toolkits (2026) | Self-service checkers; dated evidence-pack exports | Self-attested; exported packs unsealed; measured party controls evidence |
| Governance platforms (2025-26) | Platform-attested workflow evidence | Instrument owned by interested party; no public self-measurement |
| W3C DID Core (2024); RFC 8032 (Ed25519) | Identifiers; signatures | Primitives used downstream in Claim 6's signing stage; not probe/verdict methods |
| Companion provisional (2026-10-07) | Signed receipts for distributed LLM inference | Different field (distributed inference routing); referenced, not claimed here |

## 5. Prior Art References

Regulation (EU) 2024/1689 (AI Act), Art. 50 and Art. 99 · C2PA Technical Specification 2.x (2024) · IPTC Photo Metadata Standard, digitalSourceType/trainedAlgorithmicMedia terms · RFC 8032 (Ed25519) · NIST FIPS 180-4 (SHA-256) · W3C DID Core 1.0 (2024) · OpenTimestamps protocol (public calendar anchoring) · `satwikbasu/article50` CLI (2026) · Castro & Liskov, PBFT (OSDI 1999) (referenced for governance contexts).

## 6. Abstract

A deterministic method and system measure transparency obligations on live digital surfaces and emit evidence-carrying measurement observations. Obligation-specific pattern sets derived from regulatory provisions are applied without probabilistic inference; each obligation yields a verdict tuple from a fixed honest-label set (PASS/PARTIAL/ABSENT/N/A) bound to verbatim evidence excerpts or an explicit checked-none-found marker, timestamp and scan-scope byte count. A publishing stage renders a self-inclusive measurement board in which the measurement operator's own surface is measured with the identical instrument and published beside third-party subjects, making operator neutrality continuously testable. Observations are labelled unsigned and separated from downstream signed, timestamp-anchored measurement credentials so that measurement is never represented as certification. A first 15-surface embodiment measured machine-readable synthetic-content marking across AI-governance vendors and the operator, finding 2 of 15 compliant on the probed scope.

## 7. Filing Instructions

UK IPO Form 1 provisional to lock priority date; PCT at 12 months; national phases at 30 months (target: UK, EU, US, JP, AU). Public-disclosure warning: the probe code and first sweep results were publicly disclosed on 2026-10-08 (councilof.ai); file this provisional promptly — the UK provides a 12-month grace period, but priority should be secured before further disclosure. Do NOT publish prices in any filing-adjacent materials.

## 8. Novelty Statement

No single primitive here is new — regex pattern matching, hashing, signatures and timestamping are all prior art. The novelty is the specific combination: (i) regulatory-transparency obligations compiled into obligation-specific deterministic pattern sets with a PARTIAL state distinguishing structured-data presence from true synthetic-content marking; (ii) verdict tuples that bind every verdict to verbatim evidence or an explicit checked-none-found marker with scan-scope qualifiers, admitting the label ABSENT as a non-accusatory, re-executable observation; (iii) a self-inclusive measurement board where the measuring operator publishes its own surface in the same population, making neutrality a measurable property rather than a claim; and (iv) the strict labelling separation between unsigned observations and downstream signed, publicly anchored credentials. No cited prior art combines these elements.

---

*Prepared for CSOAI Ltd (UK 16939677). Inventor: Nicholas Templeman.
This document constitutes a reduction to practice of the claimed inventions via the `art50_probe` module of the CSOAI measurement stack (4/4 hermetic tests passing; 15-surface sweep executed twice with identical verdicts, 2026-10-08). Probe v0 operational; signed-credential stage wired to the existing measurement pipeline. Measurement, not certification.*
