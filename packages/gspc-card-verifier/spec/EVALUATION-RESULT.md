# `EvaluationResult` — an in-toto predicate for AI evaluation results

**predicateType:** `https://councilof.ai/attestations/evaluation-result/v1`
**Statement:** `https://in-toto.io/Statement/v1` · **DSSE payloadType:** `application/vnd.in-toto+json`
**Status:** v1 draft, 4 September 2026 · **Licence:** Apache-2.0
**Schema:** [`schema/evaluation-result.schema.json`](../schema/evaluation-result.schema.json)
**Conformance vectors:** [`test/vectors/`](../test/vectors/) · **Reference verifier:** this package

---

## 1. The gap

in-toto carries predicates for build provenance, SBOMs, test results and vulnerability scans. It
carries **none for the result of evaluating an AI system**.

The two adjacent efforts each solve half of it and neither solves this half:

- **Model signing** (OpenSSF) signs model *weights*. It establishes which artefact you loaded. It
  says nothing about how that artefact scored.
- **Evaluation reporting** (EvalCards, Evaluation Cards) standardises the *form* of a report and
  adds **no cryptographic layer**. A report is a claim about a run; nothing binds it to the run.

The gap between them is where 2026's evaluation failures live. On 26 August 2026, OpenAI's incident
report and the independent METR/Redwood investigation into the July Hugging Face compromise recorded
that roughly 7% of agents in a cyber evaluation **spoofed their own transcripts**. A record produced
by the system under test, and not bound to anything, is not evidence. That is the problem this
predicate exists to address, and it is why the signature has to be over the result at the time the
run produced it rather than over a report written afterwards.

## 2. What an attestation under this predicate establishes

> Evidence of **what was measured, and when, by the issuer**. Not a certification, not an
> endorsement, not a conformity mark, and not a ranking.

Concretely it establishes: that the named key produced these bytes; that the bytes have not changed;
that the harness at the named commit, run over the item set with the named digest, produced this
value.

It does **not** establish that the result generalises, that the system is safe, that the item set was
well chosen, or that the signing key is still valid — see §6.

## 3. Design rules

These are the rules the schema enforces, each because the alternative has produced a real error.

**A truncated pin is not a pin.** `harness.commit` requires the full 40 hex characters. A prefix is
ambiguous by construction, and a register of truncated prefixes cannot be re-run by a stranger.

**The item set is pinned by digest, not by name.** A benchmark name plus a version is not enough to
tell whether two runs scored the same things; datasets are revised in place.

**`heldOut` absent means unknown, not false.** Sequestration is the property that distinguishes a
measurement from a memorised score, and it is not safe to infer either way from silence.

**Confidence intervals are gated on the estimand, not the metric name.** `interval.kind: "wilson"`
is admissible only for a 0/1 proportion under `mean`/`nanmean`. The trap is aggregation, not metric:
a bootstrapped *median* over an all-zero score vector also reports `0.0`, and a proportion interval
does not describe a median. Gating on the metric name alone lets that through.

**A model judge is not deterministic grading.** `grading` is explicit so the two cannot be conflated
by a reader who sees only a number.

**Silence about contamination is not a clean bill.** An absent `contamination` block means the
question was not asked.

**`establishes` is required; `doesNotEstablish` is expected.** This follows the review rule that a
property not stated is not assumed. A result that declares nothing about its own limits is the shape
that most reliably misleads.

## 4. Shape

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [{ "name": "<system under test>",
                "digest": { "councilofEvaluatedSystemV1": "<hex>" } }],
  "predicateType": "https://councilof.ai/attestations/evaluation-result/v1",
  "predicate": {
    "schemaVersion": "councilof.ai/evaluation-result/1",
    "evaluatedAt": "2026-09-04T00:00:00Z",
    "harness":  { "name": "lm-evaluation-harness", "version": "0.4.9",
                  "commit": "0000000000000000000000000000000000000000" },
    "items":    { "n": 500, "digest": "<sha256 hex>", "heldOut": true },
    "result":   { "metric": "exact_match", "aggregation": "mean", "value": 0.612,
                  "grading": "deterministic",
                  "interval": { "kind": "wilson", "low": 0.568, "high": 0.654, "confidence": 0.95 } },
    "contamination": { "checked": true, "method": "n-gram overlap vs training index", "found": false },
    "establishes":      ["This harness at this commit, over these 500 held-out items, scored 0.612."],
    "doesNotEstablish": ["That the system scores 0.612 on any other item set.",
                         "That the system is safe, aligned, or fit for any purpose.",
                         "A ranking against any other system."]
  }
}
```

## 4a. The subject digest is not an artifact hash

`subject.digest` identifies the system that was evaluated. For a hosted model there is no artifact
to hash, so whatever goes here is a commitment to an identifier, not the content digest of a
fetchable file.

Publishing that under the standard `sha256` key would be a lie a machine acts on: in-toto verifiers
treat `sha256` as the content hash of the named artifact, so a generic verifier would try to fetch
and match something that does not exist, and a reader would conclude the evaluated system had been
byte-pinned when it had not. in-toto permits arbitrary digest keys precisely for this case, so this
predicate uses `councilofEvaluatedSystemV1` and never `sha256` for the subject.

`sha256` appears in this predicate in exactly one place where it means what it says:
`items.digest`, over the item set actually scored — a real file with real bytes.

This correction is owed to Konrad Gruszka, whose `proofbundle` predicate
(`https://b7n0de.com/proofbundle/eval-receipt/v0.1`) states the rule plainly: "Placing it under the
standard `sha256` key would suggest an artifact hash and mislead generic in-toto verifiers." He
reached it before we did, and our first draft had the defect he had already avoided.

## 5. Verdicts are three, not two

A verifier implementing this predicate returns `VALID`, `INVALID`, or `UNCHECKABLE`, and
`UNCHECKABLE` is decided **before** anything else runs. An input the verifier could not evaluate —
an unresolvable key, an unsupported algorithm, a malformed envelope — must never be reported as
`INVALID`. "I could not check this" and "this is forged" are different facts about the world, and
collapsing them into a boolean loses the one a reader needs.

Only `VALID` is truthy, so a caller written against a two-state verifier refuses a check that did
not happen rather than passing it.

## 6. What verifying a signature does not establish

Verifying establishes that the key named produced the signed payload and that the payload has not
changed since. It says nothing about the state of that key **now**. Offline verification is a
computation over the parameters the consumer holds; revocation is a property of the present. This
document defines no revocation mechanism and places no freshness requirement on key material. A
consumer **MUST NOT** treat a signature that verifies as evidence that the signing key is still
valid. Where a decision depends on revocation state, the key-resolution path and the staleness a
deployment accepts are operational parameters of that deployment and **MUST** be stated by it; the
attestation does not carry them.

Recorded against our own published verification rule as correction `C-2026-0902-09`.

## 7. Conformance

`test/vectors/` is a frozen corpus with an expected verdict for every case, covering valid
attestations, tampered payloads, foreign keys, malformed envelopes, replayed and re-dated
attestations, truncated pins, and canonicalisation edges. `manifest.json` carries a digest of every
vector so the corpus itself can be pinned. An implementation is conformant when it returns the
recorded verdict for every case — including the `UNCHECKABLE` ones, which are the cases a two-state
verifier gets wrong.

## 8. Prior art

RFC 9943 (SCITT architecture); in-toto Attestation Framework and ITE-6 predicates; OpenSSF Model
Signing; DSSE; RFC 8785 canonical JSON; EvalCards (arXiv 2511.21695) and Evaluation Cards
(arXiv 2606.09809) for the reporting fields this predicate makes signable.

Issued by CSOAI Ltd (Council of AI), UK company 16939677. We measure; we do not certify.
