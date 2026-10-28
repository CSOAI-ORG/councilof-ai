# GSPC: a living measurement of AI behaviour, and how to re-derive every number in it

*Draft for arXiv. Measurement, not certification.*

**Authors.** CSOAI Ltd (Council of AI), UK company 16939677.
**Live artefact.** <https://councilof.ai/api/gspc> · methodology page <https://councilof.ai/methodology/>
**Code.** <https://github.com/CSOAI-ORG/councilof-ai> · licence MIT.
**Snapshot cited by this draft.** `as_of 2026-10-26T19:19:22Z`, fingerprint `600cf3983c32ff45cbdc7c4a44c9df8967b011aa92d1cd09314e041f1f251750`.

---

## Abstract

We describe **GSPC**, a measurement of AI behaviour that differs from a leaderboard in three
respects. First, every number is re-derivable: the item banks are published as bytes, the grader
is published as code, the per-item answers are published as rows, and the score is the ratio of
two counts over a published file. Second, separation is a statistical claim, not an ordering: a
model is declared ahead of another only when an exact paired test on the discordant items says so
at p < 0.05, and a tie is reported as a tie. Third, absence is a first-class answer. A slot with
no run behind it is published as `UNMEASURED`, never as zero, and our own models are removed from
the comparison fleet before any comparison is made, so we never rank ourselves against ourselves.

We publish 33 board slots (23 measured, 10 unmeasured) across 13 behaviour banks, a signed
evidence chain over the measurements, three independent export formats (a runnable benchmark
suite, an lm-eval-harness port, and instance-level sidecars for the Every Eval Ever datastore),
and a dated, provenance-classed record of third-party published benchmark numbers that we did
not and do not measure. We report the statistical procedure, the denominator rules — including
where two of our own surfaces use different ones — and the limits of the instrument.

---

## 1. The problem this is not

A leaderboard answers "which model is highest on this list". Three things follow that we think
are wrong for a claim about AI behaviour.

1. **The list is a measurement of the list.** The number depends on the items, the prompt
   wording, the grader, and the denominator. Those are usually unpublished, so a number cannot be
   checked, only believed.
2. **The order is a claim about the world.** In a field where a great many scores are within
   each other's noise, declaring a winner on a point estimate manufactures a result.
3. **Zero is a claim too.** A model that timed out, refused to parse, or was never run is not
   wrong; it is absent, and a table that prints 0 for it says something false.

We therefore publish a **board**, not a leaderboard: a set of declared positions, each of which
is either backed by a signed run or visibly empty.

## 2. The instrument

### 2.1 Banks

A *bank* is a frozen set of items for one axis: a prompt, a closed set of admissible labels, and
a gold label per item. Thirteen banks are published as bytes, each with a content hash. The item
count below is the board's own published `n` for the axis:

| Bank | Items | Bank | Items | Bank | Items |
|---|---|---|---|---|---|
| `csoai/gspc-gov` | 237 | `csoai/gspc-affect` | 41 | `csoai/gspc-asi` | 33 |
| `csoai/gspc-care` | 199 | `csoai/gspc-mcp` | 35 | `csoai/gspc-det` | 33 |
| `csoai/gspc-agi` | 36 | `csoai/gspc-mach` | 33 | `csoai/gspc-oss` | 32 |
| `csoai/gspc-art5` | 36 | `csoai/gspc-prv` | 32 | `csoai/gspc-xr` | 32 |
| `csoai/gspc-swarm` | 37 | | | | |

The per-item corpus carries 15,580 rows over 19 models and these 13 banks. It is not exactly one
row per item per model: the `care` bank has 199 distinct items and 200 rows per model, because
one item is asked twice, deliberately, so that the paired design has a matched repeat.

Each published bank carries a **canary row**: an item that is expected to be answered in a
particular way and that detects a grader which has silently changed. The canary is dropped
before scoring, and a run that does not account for it is a different run.

### 2.2 One grader, not two

A score is only comparable with another score if the same grader produced both. We publish one
grader — a closed-label matcher, `read_label`, in `harness/gspc-top100/mill_hub_queue.py` — and
every number in this paper, on the board, in the signed cards, and in every export below comes
from it. Where a second, more lenient grader exists elsewhere in our own code
(`harness/arena/axis_arena.py`), we do not use it for board numbers, because it scores a
substring `"no"` inside `"not"` as a refusal.

`read_label` is exercised by 12 fixtures and 3 historical regressions, and the generated
lm-eval port is proven equal to it over the same fixtures.

### 2.3 Denominators, stated rather than assumed

There are two live denominators in this work and they do not agree, and we say so rather than
quietly pick one.

- **Card rule.** An answer the grader cannot parse **leaves the denominator**. It is neither
  right nor wrong; it is not scored. A cell whose items are all unparseable has no quotable
  figure at all.
- **Board rule.** The board's published number counts **every item in the bank**: an unparsed
  answer contributes 0 and stays in the denominator. The board's own text is explicit, e.g.
  `mistral:7b 139/237` on the governance axis.

This is visible in the artefacts. For the same model and bank, the two rules give different
figures (for `mistral:7b` on `gov`: 139/237 = 0.5865 under the board rule, 139/204 = 0.6814
under the card rule). Every export we publish carries **both** numbers, the count of unparsed
items, and the rule in words, so a consumer can recompute either. Where a record carries a
per-item sidecar, each line is flagged when its answer was unparsed, which makes the graded-only
figure recomputable as well.

### 2.4 What is not scored

Two of our fourteen banks refuse to yield a number under the closed-label grader: `jail`, whose
items admit only one distinct label, and `swarm`, which carries a keyword-match sentinel. We
publish them as **refused** rather than manufacturing a score. On the board, ten slots are
`UNMEASURED` — a declared position with no run behind it. That is the honest state, and it is
published so the gap is visible.

## 3. Statistics

### 3.1 Interval

Every proportion carries a **Wilson 95 % interval** computed at export time from the published
counts. Wilson is used because the Wald interval fails near 0 and 1, which is exactly where
behaviour benchmarks live. Intervals are annotation; they do not decide anything on their own.

### 3.2 Separation

For a model-comparison axis we ask a paired question: of the items where two models disagree,
how many favour each? The test is **exact McNemar on the discordant items**, leader against the
best base model, with our own models removed from the fleet before the comparison is made. The
rule is fixed in advance: **p < 0.05 is `SEPARATED`; anything else is a `TIE`.**

On the snapshot cited above: 14 model-comparison axes, **0 separated**, 7 TIE, 7 UNTESTED. The
governance axis, for example, reads `mistral:7b (base model) 0.5865, Wilson [0.523, 0.647],
separation TIE, exact McNemar p = 0.3787, n = 237` — a point estimate 0.096 above the fleet
mean of 0.49 that the test does not support. We publish the TIE. A tie is not a win, and the
board's lid says so in full: *"TIE is TIE · not a certificate."*

### 3.3 Minimum quotable cell

A cell with fewer than 30 graded items is not quoted. This is a house rule, not a statistical
one, and we apply it to our own exports: 12 of 78 model × bank cells in the per-item export are
held back for this reason and are listed in the export manifest by name.

## 4. The evidence chain

A measurement is worth as much as its provenance, so the provenance is published with it.

1. **Signed cards.** Each measurement is an Ed25519-signed card whose id is the SHA-256 of its
   canonical preimage, signed under the key published in `did:web:csoai.org`
   (`#card-attestation-1`, and `#card-attestation-2` for cards signed after the 27 Sep 2026
   rotation). A card names the model, the axis, the accuracy, the run time, and what it does not
   establish. Verification is free, offline and loginless at `/gspc-verify`; it recomputes the
   id and checks the signature under a key pinned in the verifier and in the DID document.
2. **A chain and a root.** Cards carry a predecessor link, and a separately signed manifest
   declares the sequence. The public root publishes the card digests as an RFC 6962 Merkle tree
   with a recomputable root, so a single published root commits to the whole corpus.
3. **Per-item rows.** The measurements that the board actually displays are backed by
   `csoai/gspc-peritem-rows-2026-08-12` (CC-BY-4.0): 15,580 rows over 19 models and 13 banks,
   one line per model per item, carrying the item text, the expected label, the model's raw
   answer, the parsed label, and the correctness flag. The board cites these files as the
   evidence for its numbers, and says so in its own bytes.
4. **A note when the card and the rows disagree.** For several cells the signed card records an
   *earlier* run with a different item count. The board flags this explicitly
   (`leader_card_state: CARD_RECORDS_A_DIFFERENT_MEASUREMENT`) and our exports say the same in
   the record's own text. A signed record is a provenance claim, not a truth claim, and a corpus
   that contains both must say which one backs which number.

## 5. Re-derivation: three export formats

The same measurement is exported three ways, so that a third party can check it with whatever
tool they already have.

| Format | What it is | How to re-derive |
|---|---|---|
| **Benchmark suite** (`public/bench/`) | 14 axis pages with the bank URL, sha256, label menu, prompt, grader and a run command | `harness/bench/run_bench.py` imports the mill's own `read_label`; it does not re-implement a grader. An unparsed answer leaves the denominator. |
| **lm-eval port** (`public/bench/lm-eval/`) | 12 lm-eval-harness tasks, 780 items, one task per runnable axis, each with its own `utils.py` carrying that axis's label menu | `scripts/surface/test_lm_eval_parity.py` proves every generated port equals `read_label` over the estate's fixtures, and proves the canary is dropped, an unparsed answer is not scored, a wrong answer scores 0.0, and no task exists for a refused axis. |
| **Instance-level sidecars** (Every Eval Ever) | 66 records, 6 third-party models × 13 banks, 4,509 items, each aggregate with a `<uuid>_samples.jsonl` sidecar | Count the sidecar lines whose `evaluation.is_correct` is true and divide by the number of lines: that is the published score. The graded-only figure is recomputable from the same lines. |

The sidecar export is the one that turns a number into a record. It is validated by the upstream
toolchain: `every_eval_ever.validate` reports 66 of 66 files valid with zero errors and zero
warnings, and the duplicate check reports none. It also holds the estate's own rule: own models
are excluded by a published register rule, so no Council of AI model appears in a comparative
datastore.

## 6. Third-party published numbers are recorded, not measured

A benchmark space needs to be able to say what other people have published about a model —
without a stranger mistaking those numbers for ours. We keep a dated, sourced record per model
(`docs/measurement/`), in which every row carries a provenance class:

- `VENDOR_REPORTED_FROM_PRIMARY_BYTES` — read from the publisher's own artefact, bytes pinned;
- `VENDOR_REPORTED_VIA_SEARCH_INDEX` — the publisher's page refused an automated client, so the
  value was read from a search index of that page, **not** from its bytes;
- `INDEPENDENT_FROM_PRIMARY_BYTES` / `INDEPENDENT_VIA_PRESS_RELEASE` — a third party's own run;
- `UNMEASURED` — no run exists.

As of 2026-10-27, GPT-6.1 Terra is the worked example. Its published figures (Terminal-Bench 4.0
at 50.3 %, an Artificial Analysis Intelligence Index of 48 at rank 25 of 221, a DualEntry
Accounting AI Benchmark score of 78.2 %) are recorded with their sources. On our own banks
Terra is `UNMEASURED`: it has no card, no per-item row, and no board cell, so no like-for-like
comparison exists and we do not manufacture one. We also publish no Council of AI figure on
Terminal-Bench, MMMU-Pro, OSWorld, Agents' Last Exam, HealthBench, MentalHealthBench,
ExploitBench, SEC-Bench Pro or the DualEntry benchmark — so on those benchmarks there is
nothing to compare against in either direction, which is itself a published fact about the
instrument's reach.

## 7. Governance of the instrument

- **Claim discipline.** Public claims are gated. Absolutist phrasing ("every problem",
  "guaranteed", "certified") is rejected; internal codenames are rejected on public surfaces; a
  published price or an unevidenced popularity claim in a machine-readable surface is rejected.
- **The board is not a certification.** A card is evidence that a run happened at a time. It is
  not a quality verdict, a compliance determination, an endorsement, or legal advice.
- **Free forever.** Verification, recomputation and the public board cost nothing and need no
  account. The commercial lane is evidence by query, never a score.
- **Unresolved.** Our Zenodo deposits return HTTP 410 (the account was blocked); the DOIs are
  kept as the records' permanent names and are published with status `UNCHECKABLE` rather than
  silently dropped. The live board, the signed cards and the per-item rows are the resolvable
  artefacts, and the paper cites them.

## 8. Reproducing this paper's numbers

Everything above is checkable without an account and without our servers being up:

- the board: `GET https://councilof.ai/api/gspc`;
- the per-item rows: `csoai/gspc-peritem-rows-2026-08-12` (CC-BY-4.0), per-file sha256 published
  in its `MANIFEST.json`;
- the banks: the `csoai/gspc-*` datasets, each hash-pinned;
- the grader: `harness/gspc-top100/mill_hub_queue.py`, with 12 fixtures and 3 regressions;
- the cards: `/signed/card_index.json` and `/signed/cards/{card}.json`, verified under the
  published Ed25519 key, with a Merkle root over the corpus;
- the port: `scripts/surface/test_lm_eval_parity.py`, which proves the lm-eval tasks equal the
  grader.

## 9. Limitations

1. **The fleet is small and not the frontier.** The per-item corpus covers 19 models, of which 6
   are third-party, and they are open-weight models of a few billion parameters. It is not a
   frontier comparison.
2. **One run per cell.** A cell is one run at one time. The banks are frozen, but the models are
   not pinned by weights digest in the rows, and a re-run may differ.
3. **The banks are short.** 32 to 237 items per axis. That is enough to separate a clear
   difference and not enough to resolve a small one — which is why the separation rule is strict
   and the interval is published.
4. **The grader is closed-label.** It cannot score free-form reasoning, and it cannot detect a
   fluent wrong answer that happens to contain a label. Two of our banks are refused outright
   for this reason.
5. **Two denominators.** We publish both because we have both, and a reader who does not know
   which one a given number uses can get it wrong. We consider this a live defect of the
   instrument, not a settled question.
6. **We do not measure the models we care about most.** The models we are building are excluded
   from the public fleet by rule, so this paper says nothing about them.

## 10. Alignment with published practice

- Wilson score intervals for proportions, as advocated in "Adding Error Bars to Evals"
  (arXiv:2411.00640), and NIST AI RMF's MEASURE function's requirements for uncertainty,
  benchmark comparison and structured reporting.
- Paired significance testing (exact McNemar) rather than point-estimate ordering.
- ISO/IEC 42001:2023 and 42005:2025 for management-system and impact-assessment framing; the
  IOSCO CRA Code of Conduct Fundamentals for governance vocabulary; the EU AI Act's
  documentation and marking obligations as the subject matter of two of the banks.
- The Every Eval Ever schema and validator as the third-party interoperability target for
  published evaluation records.

---

*Correspondence: https://councilof.ai. This document is a methodology description, not a legal
opinion, not a certification, and not a ranking of models. Ties are ties.*
