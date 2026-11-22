---
license: cc-by-4.0
pretty_name: GSPC estate — the whole measurement record, reproducible
language:
- en
task_categories:
- text-classification
- question-answering
- other
size_categories:
- 10K<n<100K
tags:
- ai-governance
- measurement
- benchmark
- attestation
- ed25519
- provenance
- reproducibility
- opentimestamps
- eu-ai-act
- gspc
- reproducible-research
- model-evaluation
- council-of-ai
configs:
- config_name: board
  data_files:
  - split: train
    path: board/board-axes.jsonl
- config_name: board_longitudinal
  data_files:
  - split: train
    path: board/board-longitudinal.jsonl
- config_name: cards_index
  data_files:
  - split: train
    path: cards/mill-cards-index.jsonl
- config_name: superseded
  data_files:
  - split: train
    path: cards/superseded.jsonl
- config_name: card_corpora
  data_files:
  - split: train
    path: cards/card-corpora.jsonl
- config_name: corrections
  data_files:
  - split: train
    path: corrections/corrections.jsonl
- config_name: populations
  data_files:
  - split: train
    path: populations/populations.jsonl
- config_name: frozen_banks
  data_files:
  - split: train
    path: banks/frozen-banks.jsonl
- config_name: arena_rounds
  data_files:
  - split: train
    path: arena/rounds.jsonl
- config_name: ots_proof_states
  data_files:
  - split: train
    path: chain/ots-proof-states.jsonl
- config_name: evidence_manifest
  data_files:
  - split: train
    path: evidence/evidence-manifest.jsonl
- config_name: distribution
  data_files:
  - split: train
    path: footprint/distribution.jsonl
- config_name: memberships
  data_files:
  - split: train
    path: footprint/memberships.jsonl
- config_name: memberships_excluded
  data_files:
  - split: train
    path: footprint/memberships-excluded.jsonl
- config_name: capabilities
  data_files:
  - split: train
    path: footprint/capabilities.jsonl
- config_name: manifest
  data_files:
  - split: train
    path: manifest.jsonl
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# The GSPC estate

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

**A snapshot of published signed mill-card bodies, frozen banks, selected harness code,
timestamp proof states, and a script that re-verifies one card in front of you.**
Nothing here needs an account, a token, or a request to us.

> 23 axes measured · 14 model fleets · 0 separated leaders · 9 public leader scores · 9 fact runs · TIE is TIE · not a certificate.

`23 axis · 23 measured` · built 2026-09-27T10:05:38Z from repo commit `1f61fc707` ·
live source of truth: `GET https://councilof.ai/api/gspc`

This dataset is a **snapshot**. The board is live and changes. Cite the live endpoint for
the current value and this dataset for what was true at its `as_of`. Where the two differ,
the endpoint is right.

---

## Run the reproduction before you read anything else

A reproduction script nobody ran is a claim, not evidence. This one was run, twice, and
both outputs are in `repro/`.

```bash
python3 repro/verify_estate.py          # the published bytes  -> 9/9 PASS
python3 repro/verify_estate.py --tamper # one byte altered     -> 3 checks FAIL, as required
```

No dependencies. Python 3.8+. Ed25519 is implemented in the file from RFC 8032, so nothing
has to be installed and nothing has to be taken on trust: read it, then run it.

It fetches one signed card live, recomputes `id == sha256(canonical(body))`, verifies the
Ed25519 signature against the key published in the **live DID document** at
`https://csoai.org/.well-known/did.json`, checks the frozen bank and the per-item evidence
against the digests pinned in the card, recomputes every prompt from the bank, re-derives
every graded label from the recorded model output with the published rule, and recomputes
the accuracy. The tampered run alters exactly one field — `body.accuracy`, by 0.0001 — and
the id check, the signature check and the accuracy check all fail. Full transcripts:
`repro/REPRO-PASS.txt` and `repro/REPRO-TAMPER-FAIL.txt`, and both are pasted below so that
you can see the result before you decide whether to run it yourself.

### `python3 repro/verify_estate.py` — the published bytes

```
==============================================================================
GSPC estate reproduction — PUBLISHED BYTES
==============================================================================

card   https://councilof.ai/interop/mill-cards-signed/signed-affect-0377d52b937b.json
       axis=affect  model=Qwen/Qwen2.5-7B-Instruct  n=30  accuracy=0.7667  status=MEASURED
       did=did:web:csoai.org#board-attestation-1  preimage_rule=sha256(canonical body)

  [PASS] id == sha256(canonical(body))  — recomputed 0377d52b937b7b29… vs card id 0377d52b937b7b29…
  [PASS] DID document publishes did:web:csoai.org#board-attestation-1  — https://csoai.org/.well-known/did.json
  [PASS] Ed25519 signature verifies over canonical(body)  — key k2fPWb6ctyu8l5at… from https://csoai.org/.well-known/did.json
  [PASS] sha256(frozen bank) == body.evidence.bank_sha256  — bank-affect-5ce11c084a6e.jsonl  5ce11c084a6e968c…
  [PASS] sha256(item evidence) == body.evidence.items_sha256  — items-affect-e45f03cc3597.jsonl  e45f03cc3597ddf3…

  bank   42 frozen items, menu = DISCLOSE | PERMITTED | PROHIBITED
  rows   30 item-evidence rows, schema csoai.mill-item-evidence/0.2
  run    temperature 0, seed 0, EXACT_LABEL max 128 tokens (keyword banks 1024), route hf-router:Qwen/Qwen2.5-7B-Instruct:featherless-ai

  [PASS] every prompt_sha256 recomputes from bank + published composer  — 30/30 rows
  [PASS] read_label(raw_output) agrees with the recorded `observed` on every item  — 30/30 rows
  [PASS] n == answered items (unreadable replies leave n, they are not wrong answers)  — recomputed n=30 vs card n=30 (0 unreadable of 30)
  [PASS] accuracy == round(hits / n, 4)  — recomputed 0.7667 vs card 0.7667 (23 hits / 30)

  9/9 checks passed
  VERDICT: REPRODUCED — every check passed on the published bytes.
```

### `python3 repro/verify_estate.py --tamper` — one byte altered

```
==============================================================================
GSPC estate reproduction — TAMPERED CONTROL
==============================================================================

card   https://councilof.ai/interop/mill-cards-signed/signed-affect-0377d52b937b.json
       axis=affect  model=Qwen/Qwen2.5-7B-Instruct  n=30  accuracy=0.7667  status=MEASURED
       did=did:web:csoai.org#board-attestation-1  preimage_rule=sha256(canonical body)

  TAMPER: body.accuracy 0.7667 -> 0.7668 (one field, one value)

  [FAIL] id == sha256(canonical(body))  — recomputed 8da41c92bf06e312… vs card id 0377d52b937b7b29…
  [PASS] DID document publishes did:web:csoai.org#board-attestation-1  — https://csoai.org/.well-known/did.json
  [FAIL] Ed25519 signature verifies over canonical(body)  — key k2fPWb6ctyu8l5at… from https://csoai.org/.well-known/did.json
  [PASS] sha256(frozen bank) == body.evidence.bank_sha256  — bank-affect-5ce11c084a6e.jsonl  5ce11c084a6e968c…
  [PASS] sha256(item evidence) == body.evidence.items_sha256  — items-affect-e45f03cc3597.jsonl  e45f03cc3597ddf3…

  bank   42 frozen items, menu = DISCLOSE | PERMITTED | PROHIBITED
  rows   30 item-evidence rows, schema csoai.mill-item-evidence/0.2
  run    temperature 0, seed 0, EXACT_LABEL max 128 tokens (keyword banks 1024), route hf-router:Qwen/Qwen2.5-7B-Instruct:featherless-ai

  [PASS] every prompt_sha256 recomputes from bank + published composer  — 30/30 rows
  [PASS] read_label(raw_output) agrees with the recorded `observed` on every item  — 30/30 rows
  [PASS] n == answered items (unreadable replies leave n, they are not wrong answers)  — recomputed n=30 vs card n=30 (0 unreadable of 30)
  [FAIL] accuracy == round(hits / n, 4)  — recomputed 0.7667 vs card 0.7668 (23 hits / 30)

  6/9 checks passed
  VERDICT: TAMPER DETECTED — 3 check(s) failed on the altered byte, which is the required outcome.
```

The control matters as much as the pass. A checker that returns PASS on tampered bytes has
checked nothing, so the failing case is run every time this dataset is rebuilt and the
publish is refused if either run comes back wrong.

---

## What is in here

| directory | what it is | rows / files |
|---|---|---|
| `board/` | the live board verbatim, one row per axis, plus the dated board artifacts that exist | 23 axes |
| `cards/` | every signed mill card body, a flat index of them, and the supersession ledger | 2825 cards · 1402 supersessions |
| `evidence/` | the per-item evidence and frozen-bank snapshots each card pins | 1542 files |
| `banks/` | every public frozen bank with its sha256 and item count | 14/14 resolvable, 900 items |
| `chain/` | `root.json`, the signed card index, the DID document, a Rekor entry, every `.ots` state | 675 proofs |
| `corrections/` | the public corrections ledger | 74 entries |
| `populations/` | the ten population doors' free previews (`state`, `n`, `as_of`) | 10 doors |
| `arena/` | the arena rounds and the Elo reference with its intervals | 3163 rounds |
| `harness/` | the worker, the grader, the controls, the verifier | see `harness/harness-manifest.jsonl` |
| `repro/` | the reproduction script and both of its recorded runs | 2 runs |
| `figures/` | six figures, each drawn from this dataset by `figures/make_figures.py` | 6 SVG |
| `findings/` | what the board actually shows today, including what it does not show | 1 report |
| `footprint/` | what the estate distributes, where it takes part, what it serves | 837 packages · 33 memberships · 227 surfaces |
| `manifest.jsonl` | every generated bundle file except this manifest, with its sha256; Hub metadata such as `.gitattributes` is excluded | 1605 files, 28.4 MB |

## How to reproduce a cell from scratch

Everything a cell needs is public and pinned.

1. **The bank.** `banks/frozen-banks.jsonl` gives each axis's public HF dataset, its
   `items.jsonl` URL and the sha256 of the bytes. Fetch it with no token and compare the
   digest before you use it. (`jail` is the exception: its bank is a code-execution
   goldbank, `csoai/gspc-jail-goldbank/goldbank_jail.json`, not `items.jsonl`.)
2. **The settings.** Temperature **0**, seed **0**. Exact-label banks are capped at **128**
   generated tokens; keyword banks at **1024**. The loader is the Ollama model manifest
   digest for local runs, or the HF router route — both are recorded on the card
   (`route`, `model_hf_revision`).
3. **The prompt.** `axis_prompt(axis, item, labels)` in `repro/verify_estate.py`, byte for
   byte the composer the mill used. The menu is `exact_label_menu(labels)`, which **refuses
   a one-option menu**: a prompt that cannot be answered wrongly measures format compliance,
   not the axis.
4. **The grade.** `read_label(raw_output, menu)` — after stripping a `<think>` block, an
   `Answer:` prefix and surrounding punctuation, the reply must **be** one of the labels.
   A substring test would let a model that merely restates the menu score a hit on every
   item; that bug is why this rule exists. An unreadable reply **leaves n**; it is not a
   wrong answer.
5. **The number.** `accuracy = round(hits / n, 4)`, `n` = answered items. `n >= 30` or the
   card is published UNMEASURED with the reason `n<30 unquotable`.

The worker, the controls and the grading code are in `harness/`.

## The card corpora — there are several and adding them is meaningless

| corpus | artifact | count | kind |
|---|---|---|---|
| card wrappers on disk | `public/cards-bundle.json` | 4084 | build aggregate; its own generator "signs nothing, measures nothing" |
| public-root Merkle leaves | `public/root.json` | 305 | catalogued |
| signed card index | `public/signed/card_index.json` | 335 | catalogued — and **335 of 335 verify**, kind *measured* |
| living registry | `GET /api/cards` | 336 | catalogued |
| signed mill cards | `public/interop/mill-cards-signed/` | 2825 | catalogued |

`/api/state → corpus_relation` records `SEPARATE_CORPORA`, `identifier_overlap: 0`.
**Never add them, never reconcile them, never substitute one for another.** They are about
different bytes. `cards/CARD-CORPORA.md` is the full statement.

## The numbers, as they stand at this snapshot

- **14 model-comparison axes: 0 separated, 8 TIE, 6 untested.** No axis carries a
  statistically separated leader today. TIE is a result; UNTESTED is not a tie.
- **8 financial/domain axes are deterministic-fact runs** — no fleet, no leader, no accuracy,
  no separation, and they enter no mean. *Measured is not the same as scored.*
- **9 axes carry a public leader score.** 8 had our own models removed from leader
  position; 3 had an external leader dropped for carrying no signed card.
- **OpenTimestamps: 639 files contain Bitcoin attestation data, 36 are submitted and calendar-pending**, of 675 `.ots`
  files under `public/`. This classifies the proof files; it does not independently verify Bitcoin block headers. A pending proof is a submitted request, not evidence of a time.
  (The estate's own manifest scans two directories and reports 643/639/4; this dataset
  scans all of `public/`. The totals differ **by scope, not by disagreement**.)
- **Truncation: `finish_reason` is recorded on only 1680 of 16137 evidence rows.** On those,
  180 ended at the token limit (10.71%). On the rest the rate is **UNMEASURED** — not 0%. We will
  not publish a corpus-wide truncation rate by treating an absent field as a zero.
- **Arena: 3163 rounds, 1098 decided, 2065 ties.** Recomputing the published rank rule over the
  28 arena axes gives **1 separated leader, 19 TIE, 8 UNMEASURED**.

Read `findings/FINDINGS-2026-09-22.md` for the full reading, including section 10,
"What a reader should NOT conclude".

## The estate's own footprint, with its states

Measured across the whole estate, not a flattering subset. `footprint/distribution.jsonl`
carries one row per registry and window; `footprint/memberships.jsonl` and
`footprint/capabilities.jsonl` are one row each.

- **837 packages** across three registries — PyPI 397, npm 324,
  Hugging Face 111. Three registries, three populations, **never added**.
- **386,320 downloads in the last 30 days**, state **PARTIAL**: 836 of
  837 counters answered, so the figure is a **lower bound over those 836**, not a
  total over 837. One PyPI counter returns 404 and its row says so rather than contributing a 0.
- **2,655,891 downloads since first release**, state **PARTIAL**, same coverage caveat.
  The 30-day and cumulative windows are different windows over the same packages and are
  **never added to each other**. Neither is a count of people: mirrors, CI and crawlers are
  inside both.
- **33 memberships**, 31 VERIFIED and 2 PENDING, each naming its evidence and what it
  does **not** prove. A further **13 bodies a reader might expect are listed as excluded**, with
  the reason, in `footprint/memberships-excluded.jsonl`. Participation is not endorsement
  and a listing is not adoption. This manifest is not signed (`signed: false`).
- **227 capability surfaces declared** in `council-os/capabilities.json` — the authority;
  `capabilities/registry.json` is a generated view that says so itself, and is not quoted
  here. 18 of them are recorded as an OpenAPI gap rather than left unsaid.

## What this does NOT prove

- **Not that any model is best at anything.** Zero axes separate.
- **Not that a signature makes a measurement correct.** A signature over a wrong number is
  a signed wrong number. It proves the bytes have not moved and that a named key signed them.
- **Not a certification, a conformity assessment, a grade or an endorsement.** We measure.
  There is no mark, and verification is free. We explicitly **refuse** the mapping
  `MEASURED → SLSA VSA verificationResult: PASSED`.
- **Not independently verified Bitcoin timestamps for this dataset's artifacts.**
  36 of 675 scanned proofs are pending; the others contain attestation data,
  but this build does not check block headers against a node or bind every dataset file to a proof.
  `ots verify` with a node is required for that verification.
- **Not a general ability score.** Each cell is one model, one frozen bank, one day,
  temperature 0, seed 0.
- **Not comparable `n` across families.** On the financial axes `n` counts issuer accounts
  or public series, not bank items.
- **Not an append-only ledger.** The corrections record is source-maintained and claims no
  storage property.

## Licences — named per artifact, because they differ

- **This data** (everything in this dataset): **CC-BY-4.0**. Attribute: Council of AI,
  CSOAI Ltd (UK Companies House 16939677), councilof.ai.
- **The site repository** `CSOAI-ORG/councilof-ai`, from which `harness/` and `repro/` are
  taken: **MIT**.
- **The published packages** `csoai-gspc` (PyPI) and `csoai-gspc-mcp` (npm): **Apache-2.0**.
- **The vocabulary** published at [`csoai/gspc-ontology`](https://huggingface.co/datasets/csoai/gspc-ontology): **CC0-1.0**.

Never write "the licence" for this estate. Name the artifact.

## Provenance

- Live board: `GET https://councilof.ai/api/gspc`
- Live state (every quotable count, with its `kind` and `as_of`): `GET https://councilof.ai/api/state`
- Corrections: `GET https://councilof.ai/api/corrections`
- Public root: `GET https://councilof.ai/root.json` · signed card index: `GET https://councilof.ai/signed/card_index.json`
- DID document: `https://csoai.org/.well-known/did.json`
- Verify a card yourself: <https://councilof.ai/gspc-verify>
- Frozen banks: <https://huggingface.co/csoai> · vocabulary: [`csoai/gspc-ontology`](https://huggingface.co/datasets/csoai/gspc-ontology)
- Methodology: <https://councilof.ai/methodology/>

## Citation

```bibtex
@dataset{csoai_gspc_estate_2026,
  title        = {The GSPC estate: signed measurements, frozen banks, and a reproduction test},
  author       = {{Council of AI (CSOAI Ltd)}},
  year         = {2026},
  publisher    = {Hugging Face},
  url          = {https://huggingface.co/datasets/csoai/gspc-estate},
  note         = {DOI record unavailable since 29 Sep 2026 (Zenodo account blocked; appeal pending)},
  note         = {Snapshot built 2026-09-27T10:05:38Z from councilof-ai commit 1f61fc707.
                  Board as_of behavioural axes 2026-08-12 · jail 2026-08-18 · financial-fact axes 2026-08-25. Measurement, not certification.}
}
```

<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *GSPC estate — the whole measurement record, reproducible*. 2026. Hugging Face dataset `csoai/gspc-estate`. https://huggingface.co/datasets/csoai/gspc-estate

```bibtex
@misc{csoai_gspc_estate,
  title        = {GSPC estate — the whole measurement record, reproducible},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/gspc-estate},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
