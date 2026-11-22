---
license: cc0-1.0
pretty_name: GSPC measurement vocabulary — JSON-LD, SKOS and an honest crosswalk
language:
- en
task_categories:
- other
size_categories:
- n<1K
tags:
- ontology
- vocabulary
- skos
- json-ld
- crosswalk
- provenance
- attestation
- ai-governance
- scitt
- in-toto
- council-of-ai
configs:
- config_name: terms
  data_files:
  - split: train
    path: terms.jsonl
- config_name: crosswalk
  data_files:
  - split: train
    path: crosswalk.jsonl
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# The GSPC measurement vocabulary

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

**CC0. Take it, fork it, map onto it, without asking us.**

A small controlled vocabulary for saying *how a measurement was made and what is not known
about it*. It contains **no conformity, certification or pass/fail term**, by design.

Version `0.1.0` · namespace `https://councilof.ai/ns/gspc/0.1/`

| | |
|---|---|
| entities | 10 — `Axis`, `Bank`, `Cell`, `Run`, `Card`, `Root`, `Receipt`, `Correction`, `Claim`, `Supersession` |
| states | 11 in 5 independent groups |
| transitions | 10, each a published rule |
| crosswalk rows | 17 |

## Files

| file | what it is |
|---|---|
| `context.jsonld` | JSON-LD 1.1 context. Drop it into an `@context` and your card terms resolve. |
| `gspc.skos.ttl` | SKOS concept scheme, Turtle. Parses with rdflib: 172 triples, 21 `skos:Concept`. |
| `terms.jsonl` | every entity, state and transition with its definition and its **authority** — the executable file or live endpoint that decides the term, not a gloss. |
| `crosswalk.jsonl` | the mapping onto other standards, with a `mapping` state and a `basis` for each. |
| `state-machine.svg` | the five state groups and every transition, drawn from `terms.jsonl`. |
| `make_ontology.py` | the generator. One table produces all of the above, so they cannot drift. |

## Why SKOS and JSON-LD, and not OWL

We publish a **controlled vocabulary for citation and crosswalk**, not a logical theory.

SKOS says "this is a concept, here is its definition, here is the scheme it belongs to"
and stops. That is exactly the strength of the claim we can support. OWL would let us
assert disjointness, domain and range, and cardinality — axioms a reasoner would then
*entail things from*. We have not tested those entailments, and shipping untested axioms
so the vocabulary looks more formal would be the same defect as shipping an untested
benchmark because the name sounds rigorous.

JSON-LD carries the same terms into the JSON artifacts we already publish, with no
reshaping, so a card can point at this context and be linked data without becoming a
different document.

**If a mapping turns out to need OWL, the version number moves and the reason is published.**

## The state machine

Five **independent** groups. A thing has one state from each group that applies to it;
they are not one ladder, and a pipeline word like `DISCOVERED` is not a schema state.

- **anchor-state** — `BITCOIN_ATTESTED`, `SUBMITTED_PENDING`
- **claim-state** — `CLAIM_CAPTURED`
- **measurement-state** — `MEASURED`, `UNMEASURED`
- **separation-state** — `SEPARATED`, `TIE`, `UNTESTED`
- **verification-state** — `UNCHECKABLE`, `VALID`, `INVALID`

`UNMEASURED` and `UNCHECKABLE` are **first-class states, published as findings**. They are
never an absent field, and `UNCHECKABLE` ("we could not run the check") is deliberately
distinct from `INVALID` ("we ran it and it failed").

## The crosswalk, including where it refuses

5 EXACT · 2 CLOSE · 4 RELATED · 1 WEAKER_THAN_THEIRS · **5 NO_EQUIVALENT**

`NO_EQUIVALENT` is a finding, not a gap. It means the mapping was looked for and declined,
and the reason is in the row. Where another vocabulary's word is *stronger* than ours —
where it implies certification, accreditation or a pass verdict — we decline rather than
borrow a word that would flatter us.

| our term | standard | their term | mapping | basis |
|---|---|---|---|---|
| `Card` | in-toto | Statement (_type / subject / predicateType / predicate) | **CLOSE** | Identical in role: a signed statement about a subject. Our predicateType is our own URI (https://councilof.ai/attestations/measurement/v1), which the in-toto guidelines permit without registration. scripts/crosswalk/emit_intoto.py emits these from signed cards. |
| `Card.id` | in-toto | subject[].digest.sha256 | **EXACT** | Both are a sha256 over the canonical bytes of the thing being described. |
| `Card` | SCITT | Signed Statement (COSE_Sign1, CWT_Claims label 15) | **RELATED** | Same role, different envelope: ours is raw Ed25519 over canonical JSON, not COSE_Sign1. The root statement is shaped as a SCITT Signed Statement; the mill cards are not. |
| `Root` | SCITT | COSE Receipt `vdp` (VDS 1 = RFC9162_SHA256) | **WEAKER_THAN_THEIRS** | Ours is a subset. The public root duplicates an odd node instead of using RFC 6962 domain separation, so the shape is collidable (CVE-2012-2459); the ambiguity is closed only because card_count is inside the signed preimage and a verifier MUST reject a presentation where len(card_sha256) != card_count. Recorded, not silently upgraded. |
| `Card.signature` | W3C VC | eddsa-jcs-2022 data-integrity proof | **EXACT** | Ed25519 over canonical JSON is the same primitive; only the multibase wrapper differs. |
| `Card` | W3C VC | Verifiable Credential 2.0 with `evidence` (§5.6) | **RELATED** | `evidence` is identical in intent to our per-item evidence pointer. The credential framing is not adopted: we issue no credential about a subject's status. |
| `Card.did` | W3C VC | verificationMethod / assertionMethod | **EXACT** | did:web:csoai.org#board-attestation-1 resolves in the DID document exactly as specified. |
| `Card` | C2PA | assertion in a manifest | **NO_EQUIVALENT** | C2PA 2.4 permits only X.509 certificates for signing. Our signer is a raw Ed25519 key with no X.509 chain, so a C2PA manifest cannot carry this signature. Claiming the mapping would mean claiming a certificate we do not have. |
| `Run` | evaluation harnesses | Inspect EvalScore.scored_samples | **EXACT** | Our single `n` maps to scored_samples, NOT total_samples. Inspect splits n four ways and models it better than we do; lm-eval's `effective` is the same distinction. |
| `Bank` | MLCommons | Croissant RecordSet / FileObject / Field | **RELATED** | A frozen bank is describable as a Croissant RecordSet. Pin the -1.1 URL: the unversioned URL still serves 1.0, and HF's auto-emitted Croissant uses cr:dataBiases, not rai:. |
| `Correction` | DataCite | relatedIdentifier IsObsoletedBy | **RELATED** | Theirs revokes. Ours publishes the refutation itself, with the measured delta and its confidence interval, and leaves the refuted statement readable. |
| `Supersession` | DataCite | relatedIdentifier IsPreviousVersionOf | **CLOSE** | The closest published match. Ours additionally keeps the superseded signed bytes alive and verifiable after they stop being current. |
| `MEASURED` | SLSA | VSA verificationResult: PASSED | **NO_EQUIVALENT** | REFUSED, not missing. PASSED is a verdict against a policy. MEASURED means a run happened and was graded; it carries no pass, no threshold and no policy. Mapping it to PASSED would manufacture a conformity assessment out of a measurement. |
| `UNCHECKABLE` | any | — | **NO_EQUIVALENT** | No surveyed vocabulary has a third state beside valid and invalid for 'the check could not be run'. The word is ours and we do not imply it is standard. |
| `TIE` | any | — | **NO_EQUIVALENT** | Every leaderboard vocabulary ranks. None has a state meaning 'the lead was tested and is not separated, so no winner is named'. |
| `Axis.n` | schema.org | Observation / StatisticalVariable | **NO_EQUIVALENT** | schema.org has marginOfError (dispersion without a sample size); measurementDenominator is a ratio denominator, not an n. A measured value published together with the number of items behind it has no schema.org expression. |
| `Receipt` | x402 | PaymentRequired v2 | **EXACT** | Our 402 challenge is an x402 PaymentRequired. A 402 challenge is not settlement, not delivery and not revenue, and the vocabulary does not claim otherwise. |

The two refusals worth naming out loud:

- **`MEASURED` is not SLSA VSA `PASSED`.** `PASSED` is a verdict against a policy.
  `MEASURED` means a run happened against a frozen bank and was graded — no pass, no
  threshold, no policy. Mapping one to the other manufactures a conformity assessment out
  of a measurement.
- **A card is not a C2PA assertion.** C2PA 2.4 permits only X.509 certificates for
  signing. Our signer is a raw Ed25519 key with no X.509 chain. Claiming the mapping would
  mean claiming a certificate we do not have.

## What this does NOT prove

- It is **not** a standard. It is one body's published vocabulary, versioned and CC0.
- It is **not** an endorsement by any of the standards it crosswalks onto. The mappings are
  our reading, with the spec and version in each row so you can disagree with a citation.
- A term's presence here says **nothing** about whether any particular measurement using it
  is correct.

## Source and provenance

Derived from `docs/interop/VOCABULARY-CROSSWALK.md` in `CSOAI-ORG/councilof-ai` (MIT),
which traces every term to the executable file that decides it. The data this vocabulary
describes is at [`csoai/gspc-estate`](https://huggingface.co/datasets/csoai/gspc-estate) (CC-BY-4.0). Live
board: `GET https://councilof.ai/api/gspc`. Org index: <https://huggingface.co/csoai>.
Methodology: <https://councilof.ai/methodology/>

## Citation

```bibtex
@misc{csoai_gspc_vocabulary_2026,
  title     = {The GSPC measurement vocabulary},
  author    = {{Council of AI (CSOAI Ltd)}},
  year      = {2026},
  version   = {0.1.0},
  publisher = {Hugging Face},
  url       = {https://huggingface.co/datasets/csoai/gspc-ontology},
  note      = {CC0-1.0. Measurement, not certification.}
}
```

<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *GSPC measurement vocabulary — JSON-LD, SKOS and an honest crosswalk*. 2026. Hugging Face dataset `csoai/gspc-ontology`. https://huggingface.co/datasets/csoai/gspc-ontology

```bibtex
@misc{csoai_gspc_ontology,
  title        = {GSPC measurement vocabulary — JSON-LD, SKOS and an honest crosswalk},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/gspc-ontology},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC0-1.0. Attribution is appreciated, not required.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
