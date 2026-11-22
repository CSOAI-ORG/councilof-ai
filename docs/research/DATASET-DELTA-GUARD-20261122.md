# GSPC candidate: source-pinned dataset delta and denominator guard

**22 November 2026 · UNSIGNED OFFLINE RESEARCH TOOL · NOT GSPC AXIS ADMISSION**

The 2025 Anthropic / UK AI Security Institute / Alan Turing Institute study found a backdoor from **250 malicious pretraining documents** in a specific experimental setup. It does not establish a universal number, detection threshold, or mitigation. A data-integrity comparison is not a poisoning detector. Reference: <https://www.anthropic.com/research/small-samples-poison>.

The existing `scripts/gspc_bank_distinct.py` counts distinct *prompts* for pinned GSPC banks; it does **not** compare all per-document changes across two pinned dataset revisions. The existing separate memory-poisoning axis tests persistence of poisoned *memory*, not training-data provenance. This additive tool addresses that different, narrow gap.

## Scope / inputs

`dataset_delta_guard.py` accepts small (2 MB / 5,000 records maximum) JSONL files that already exist on a local authorised filesystem, with unique string `id` fields. It never fetches data, opens remote models, downloads weights, signs, publishes, deploys or calls an inference endpoint. A human source owner must first establish the trusted baseline and rights separately. `--revision` must be an immutable 40-hex commit identifier, but the tool cannot authenticate that the caller supplied the correct revision or exact upstream bytes.

1. `baseline`: create an **unsigned candidate** with per-record canonical-json SHA-256 digests, raw file SHA-256, identity denominator and self-checking manifest digest. This is not a signature, source endorsement or GSPC admission.
2. `compare`: compare a candidate against the reviewed baseline; return `UNCHANGED` (zero difference in these bytes), `RAW_ONLY_CHANGE` (format/order-only difference), `REVIEW_REQUIRED` (one or more records modified, missing or added), or `UNCHECKABLE` (invalid input, duplicate record identity or broken baseline). `UNCHANGED` never means safe. The output contains hashed identifiers, not original text.
3. `REVIEW_REQUIRED` routes to existing source custody and human approval; it never automatically quarantines a publisher, edits a bank or scores a model.

## Reproduction

```bash
python3 -B -m unittest discover -s scripts/security -p 'test_dataset_delta_guard.py' -v
python3 -B scripts/security/dataset_delta_guard.py baseline \
  --input /local/approved-baseline.jsonl --dataset organisation/repo \
  --revision 0123456789abcdef0123456789abcdef01234567 > /private/review/baseline-candidate.json
python3 -B scripts/security/dataset_delta_guard.py compare \
  --baseline /private/review/baseline-candidate.json \
  --input /local/candidate.jsonl --revision 89abcdef0123456789abcdef0123456789abcdef
```

No actual customer data, model weights or unsafe prompt payloads are needed to run the tests. Synthetic controls change the inert field `policy` from `DENY` to `ALLOW` in **one of 150** and **one of 250** records, and also check duplicate IDs, duplicate JSON fields, missing IDs, malformed input, tampered manifest, falsified denominator and reorder-only changes.

## What this enables — and what it does not

- **Can establish:** a document/record differs from an already trusted and pinned baseline, or two files are canonically equivalent despite line reordering; with exact denominators, source hashes and fail-closed unknowns.
- **Cannot establish:** that the input baseline was clean, that a semantic change is malicious, that any model trained on the data is clean, that a specific model contains a backdoor, that every upstream training document was visible, or that a runtime blocked an attack.
- **To advance:** retain a rights-cleared frozen method and dataset manifest, compare known controlled mutations versus real held-out model behaviour, collect false positives/negatives and actual tool-effect observations under independent witness, use existing admission and protected release gates. Keep compiler/weight provenance, MCP schema mutation and runtime enforcement as separate tests.

An additive, manual **source-only Evidence Fabric adapter** now exists at `packages/evidence-fabric/ingest/dataset_delta_in.py`. It maps a bounded unsigned comparison to one `csoai.evidence-event/0.1` with `PARTIAL` state, `value: null`, and declared source-authentication limitations. It does not validate the upstream revision, rerun the producer, execute a model, create a signed event, or connect to a production queue. Reproduce with `python3 -B -m unittest discover -s packages/evidence-fabric/tests -p test_dataset_delta_in.py -v` in the full repository. Venturi could consume a subsequently owner-qualified event, SovSpace could display a reviewed changed-identity record, and Claim Maintenance could reopen a source-bound claim; **none is automatically wired or executed** by this candidate. No payments, new catalogue entry, spend, signing or claims about preventing ARTEX, MiniMax prompt exposure, A2A misuse or model poisoning follow from this test.


## Single-command offline evidence packet

The combined `scripts/security/dataset_delta_pipeline.py` requires **both**
original JSONL bytes and the baseline manifest. It regenerates the entire
unsigned baseline from those original bytes before comparing a candidate; a
manifest that does not match fails closed. The resulting packet contains the
reported delta and one existing Evidence Fabric event, always `PARTIAL`
with `value: null`. It does not elevate the caller's unverified repo revision.

```sh
python3 -B -m unittest discover -s scripts/security -p 'test_dataset_delta_pipeline.py' -v
python3 -B scripts/security/dataset_delta_pipeline.py \
  --baseline-manifest /local/approved-manifest.json \
  --baseline-file /local/approved-baseline.jsonl \
  --candidate-file /local/candidate.jsonl \
  --candidate-revision 89abcdef0123456789abcdef0123456789abcdef \
  --read-at 2026-11-22T05:50:00Z
```

Exit 0: same canonical records or raw-only changes. Exit 1: source records
changed, added or removed and human review is needed. Exit 2: an `UNCHECKABLE`
error on stderr, no packet on stdout. **These are CLI process exit codes,
not a pass/fail safety grade.** Inputs must be existing small local regular
files, not symlinks; the source reader uses no-follow descriptor checks.
Nothing is written to GSPC, the signed evidence board, a model or a wallet.
Retaining a packet is a separate operator-authorised action.

## Interaction with the Living Signal Plane

The existing owner-held [PR #4652](https://github.com/CSOAI-ORG/councilof-ai/pull/4652)
measures **whole-file** byte changes by named file paths. This PR measures
**per-record** identity and canonical-content changes inside one small JSONL
file and projects the resulting *claim-limited* event through existing Evidence
Fabric. These are complementary scopes. Neither should become a second
canonical dataset registry, model-security grade or automatic publishing lane.
If the owner integrates both, the file-level manifest can identify which
pinned JSONL file warrants a bounded per-record comparison; that transition
must have explicit source and rights review. No cross-PR live wiring is claimed.

The existing [PR #4649](https://github.com/CSOAI-ORG/councilof-ai/pull/4649)
owns broad 34-axis evidence coverage/projections, and [PR #4644](https://github.com/CSOAI-ORG/councilof-ai/pull/4644)
owns the separate 16-case human-effect synthetic research bank. This tool does
not assume either was released, merge their methods or change their custody.
