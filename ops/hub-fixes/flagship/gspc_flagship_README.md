---
pretty_name: GSPC — Council of AI measurement board (all axes)
license: cc-by-4.0
language:
- en
task_categories:
- question-answering
- text-generation
- text-classification
- other
size_categories:
- 10K<n<100K
tags:
- gspc
- council-of-ai
- ai-governance
- ai-safety
- eu-ai-act
- measurement
- evaluation
- benchmark
- llm-evaluation
- model-comparison
- deterministic-facts
- frozen-bank
- signed-evidence
- transparency
- responsible-ai
configs:
- config_name: board
  data_files:
  - split: train
    path: board/axis_live.jsonl
  default: true
- config_name: governance
  data_files:
  - split: train
    path: axes/governance/items.jsonl
- config_name: safety
  data_files:
  - split: train
    path: axes/safety/items.jsonl
- config_name: provenance
  data_files:
  - split: train
    path: axes/provenance/items.jsonl
- config_name: continuity
  data_files:
  - split: train
    path: axes/continuity/items.jsonl
- config_name: conformance
  data_files:
  - split: train
    path: axes/conformance/items.jsonl
- config_name: openness
  data_files:
  - split: train
    path: axes/openness/items.jsonl
- config_name: machinery-conformity
  data_files:
  - split: train
    path: axes/machinery-conformity/items.jsonl
- config_name: care
  data_files:
  - split: train
    path: axes/care/items.jsonl
- config_name: cross-reality
  data_files:
  - split: train
    path: axes/cross-reality/items.jsonl
- config_name: detector-interop
  data_files:
  - split: train
    path: axes/detector-interop/items.jsonl
- config_name: art5-safeguard
  data_files:
  - split: train
    path: axes/art5-safeguard/items.jsonl
- config_name: swarm
  data_files:
  - split: train
    path: axes/swarm/items.jsonl
- config_name: affect
  data_files:
  - split: train
    path: axes/affect/items.jsonl
- config_name: jail
  data_files:
  - split: train
    path: axes/jail/samples.jsonl
- config_name: provenance-controls
  data_files:
  - split: train
    path: axes/provenance-controls/pointers.jsonl
- config_name: reserve-attestation
  data_files:
  - split: train
    path: axes/reserve-attestation/axis-live.jsonl
- config_name: regulatory-framework
  data_files:
  - split: train
    path: axes/regulatory-framework/axis-live.jsonl
- config_name: distribution-integrity
  data_files:
  - split: train
    path: axes/distribution-integrity/axis-live.jsonl
- config_name: custody-disclosure
  data_files:
  - split: train
    path: axes/custody-disclosure/axis-live.jsonl
- config_name: ai-adoption-components
  data_files:
  - split: train
    path: axes/ai-adoption-components/axis-live.jsonl
- config_name: labour-components
  data_files:
  - split: train
    path: axes/labour-components/axis-live.jsonl
- config_name: humanoid-labour-index
  data_files:
  - split: train
    path: axes/humanoid-labour-index/axis-live.jsonl
- config_name: cross-reality-checks
  data_files:
  - split: train
    path: axes/cross-reality/checks.jsonl
- config_name: detector-interop-protocol
  data_files:
  - split: train
    path: axes/detector-interop/protocol.jsonl
- config_name: swarm-protocol
  data_files:
  - split: train
    path: axes/swarm/protocol.jsonl
- config_name: swarm-inspect
  data_files:
  - split: train
    path: axes/swarm/samples.jsonl
- config_name: peritem-governance
  data_files:
  - split: train
    path: peritem-rows-2026-08-12/rows/peritem_gov.jsonl
- config_name: peritem-safety
  data_files:
  - split: train
    path: peritem-rows-2026-08-12/rows/peritem_agi.jsonl
- config_name: peritem-provenance
  data_files:
  - split: train
    path: peritem-rows-2026-08-12/rows/peritem_prv.jsonl
- config_name: peritem-continuity
  data_files:
  - split: train
    path: peritem-rows-2026-08-12/rows/peritem_asi.jsonl
- config_name: peritem-conformance
  data_files:
  - split: train
    path: peritem-rows-2026-08-12/rows/peritem_mcp.jsonl
- config_name: peritem-openness
  data_files:
  - split: train
    path: peritem-rows-2026-08-12/rows/peritem_oss.jsonl
- config_name: peritem-machinery-conformity
  data_files:
  - split: train
    path: peritem-rows-2026-08-12/rows/peritem_mach.jsonl
- config_name: peritem-care
  data_files:
  - split: train
    path: peritem-rows-2026-08-12/rows/peritem_care.jsonl
- config_name: peritem-cross-reality
  data_files:
  - split: train
    path: peritem-rows-2026-08-12/rows/peritem_xr.jsonl
- config_name: peritem-detector-interop
  data_files:
  - split: train
    path: peritem-rows-2026-08-12/rows/peritem_det.jsonl
- config_name: peritem-art5-safeguard
  data_files:
  - split: train
    path: peritem-rows-2026-08-12/rows/peritem_art5.jsonl
- config_name: peritem-swarm
  data_files:
  - split: train
    path: peritem-rows-2026-08-12/rows/peritem_swarm.jsonl
- config_name: peritem-affect
  data_files:
  - split: train
    path: peritem-rows-2026-08-12/rows/peritem_affect.jsonl
- config_name: manifest
  data_files:
  - split: train
    path: axes/*/manifest.jsonl
dataset_info:
- config_name: board
  features:
  - name: axis
    dtype: string
  - name: family
    dtype: string
  - name: kind
    dtype: string
  - name: bench
    dtype: string
  - name: task
    dtype: string
  - name: n
    dtype: int64
  - name: status
    dtype: string
  - name: note
    dtype: string
  - name: colour
    dtype: string
  - name: hue
    dtype: int64
  - name: _authority
    dtype: string
  - name: _source
    dtype: string
  - name: _public_count
    dtype: string
  - name: _as_of
    dtype: string
  - name: source_repo
    dtype: string
  - name: source_revision
    dtype: string
  - name: axis_live_json
    dtype: string
- config_name: governance
  features:
  - name: _canary
    dtype: string
  - name: _note
    dtype: string
  - name: scenario
    dtype: string
  - name: expected
    dtype: string
  - name: anchor
    dtype: string
  - name: source_index
    dtype: int64
  - name: source
    dtype: string
  - name: licence
    dtype: string
- config_name: safety
  features:
  - name: request
    dtype: string
  - name: expected
    dtype: string
  - name: category
    dtype: string
  - name: source
    dtype: string
  - name: note
    dtype: string
  - name: _canary
    dtype: string
- config_name: provenance
  features:
  - name: operation
    dtype: string
  - name: expected
    dtype: string
  - name: category
    dtype: string
  - name: source
    dtype: string
  - name: note
    dtype: string
  - name: _canary
    dtype: string
- config_name: continuity
  features:
  - name: _canary
    dtype: string
  - name: item
    dtype: string
  - name: expected
    dtype: string
  - name: category
    dtype: string
  - name: anchor
    dtype: string
  - name: source
    dtype: string
  - name: note
    dtype: string
- config_name: conformance
  features:
  - name: tool
    dtype: string
  - name: expected
    dtype: string
  - name: anchor
    dtype: string
  - name: axis
    dtype: string
  - name: source
    dtype: string
  - name: _canary
    dtype: string
- config_name: openness
  features:
  - name: item
    dtype: string
  - name: expected
    dtype: string
  - name: category
    dtype: string
  - name: anchor
    dtype: string
  - name: source
    dtype: string
  - name: note
    dtype: string
  - name: _canary
    dtype: string
- config_name: machinery-conformity
  features:
  - name: case
    dtype: string
  - name: expected
    dtype: string
  - name: anchor
    dtype: string
  - name: axis
    dtype: string
  - name: source
    dtype: string
  - name: verified_against
    dtype: string
  - name: _canary
    dtype: string
- config_name: care
  features:
  - name: text
    dtype: string
  - name: expected
    dtype: string
  - name: axis
    dtype: string
  - name: source
    dtype: string
  - name: _canary
    dtype: string
- config_name: cross-reality
  features:
  - name: item
    dtype: string
  - name: expected
    dtype: string
  - name: category
    dtype: string
  - name: anchor
    dtype: string
  - name: source
    dtype: string
  - name: note
    dtype: string
  - name: _canary
    dtype: string
- config_name: detector-interop
  features:
  - name: case
    dtype: string
  - name: expected
    dtype: string
  - name: anchor
    dtype: string
  - name: axis
    dtype: string
  - name: _detA_c2pa
    dtype: bool
  - name: _detB_marker
    dtype: bool
  - name: _gt
    dtype: string
  - name: _canary
    dtype: string
- config_name: art5-safeguard
  features:
  - name: item
    dtype: string
  - name: expected
    dtype: string
  - name: category
    dtype: string
  - name: anchor
    dtype: string
  - name: source
    dtype: string
  - name: note
    dtype: string
  - name: _canary
    dtype: string
- config_name: swarm
  features:
  - name: text
    dtype: string
  - name: expected
    dtype: string
  - name: axis
    dtype: string
  - name: category
    dtype: string
  - name: must_inc
    list: string
  - name: source
    dtype: string
- config_name: affect
  features:
  - name: item
    dtype: string
  - name: expected
    dtype: string
  - name: category
    dtype: string
  - name: anchor
    dtype: string
  - name: source
    dtype: string
  - name: note
    dtype: string
  - name: _canary
    dtype: string
  - name: severity
    dtype: int64
  - name: severity_basis
    dtype: string
- config_name: jail
  features:
  - name: id
    dtype: string
  - name: input
    dtype: string
  - name: target
    dtype: string
  - name: kind
    dtype: string
  - name: classes
    list: string
  - name: code
    dtype: string
  - name: note
    dtype: string
  - name: axis
    dtype: string
  - name: hub_dataset
    dtype: string
  - name: source_bank
    dtype: string
  - name: n_bank
    dtype: int64
  - name: never_bait_2592
    dtype: bool
- config_name: provenance-controls
  features:
  - name: name
    dtype: string
  - name: url
    dtype: string
  - name: kind
    dtype: string
  - name: repo
    dtype: string
  - name: as_of
    dtype: timestamp[s]
- config_name: reserve-attestation
  features:
  - name: axis
    dtype: string
  - name: family
    dtype: string
  - name: kind
    dtype: string
  - name: bench
    dtype: string
  - name: task
    dtype: string
  - name: n
    dtype: int64
  - name: n_unit
    dtype: string
  - name: n_note
    dtype: string
  - name: status
    dtype: string
  - name: evidence_url
    dtype: string
  - name: colour
    dtype: string
  - name: hue
    dtype: int64
  - name: note
    dtype: string
  - name: _as_of
    dtype: timestamp[s]
  - name: _source
    dtype: string
  - name: _authority
    dtype: string
  - name: _public_count
    dtype: string
- config_name: regulatory-framework
  features:
  - name: axis
    dtype: string
  - name: family
    dtype: string
  - name: kind
    dtype: string
  - name: bench
    dtype: string
  - name: task
    dtype: string
  - name: n
    dtype: int64
  - name: n_unit
    dtype: string
  - name: status
    dtype: string
  - name: evidence_url
    dtype: string
  - name: colour
    dtype: string
  - name: hue
    dtype: int64
  - name: note
    dtype: string
  - name: _as_of
    dtype: timestamp[s]
  - name: _source
    dtype: string
  - name: _authority
    dtype: string
  - name: _public_count
    dtype: string
- config_name: distribution-integrity
  features:
  - name: axis
    dtype: string
  - name: family
    dtype: string
  - name: kind
    dtype: string
  - name: bench
    dtype: string
  - name: task
    dtype: string
  - name: n
    dtype: int64
  - name: n_unit
    dtype: string
  - name: status
    dtype: string
  - name: evidence_url
    dtype: string
  - name: colour
    dtype: string
  - name: hue
    dtype: int64
  - name: note
    dtype: string
  - name: _as_of
    dtype: timestamp[s]
  - name: _source
    dtype: string
  - name: _authority
    dtype: string
  - name: _public_count
    dtype: string
- config_name: custody-disclosure
  features:
  - name: axis
    dtype: string
  - name: family
    dtype: string
  - name: kind
    dtype: string
  - name: bench
    dtype: string
  - name: task
    dtype: string
  - name: n
    dtype: int64
  - name: n_unit
    dtype: string
  - name: status
    dtype: string
  - name: evidence_url
    dtype: string
  - name: colour
    dtype: string
  - name: hue
    dtype: int64
  - name: note
    dtype: string
  - name: _as_of
    dtype: timestamp[s]
  - name: _source
    dtype: string
  - name: _authority
    dtype: string
  - name: _public_count
    dtype: string
- config_name: ai-adoption-components
  features:
  - name: axis
    dtype: string
  - name: family
    dtype: string
  - name: kind
    dtype: string
  - name: bench
    dtype: string
  - name: task
    dtype: string
  - name: n
    dtype: int64
  - name: n_unit
    dtype: string
  - name: status
    dtype: string
  - name: evidence_url
    dtype: string
  - name: colour
    dtype: string
  - name: hue
    dtype: int64
  - name: note
    dtype: string
  - name: _as_of
    dtype: timestamp[s]
  - name: _source
    dtype: string
  - name: _authority
    dtype: string
  - name: _public_count
    dtype: string
- config_name: labour-components
  features:
  - name: axis
    dtype: string
  - name: family
    dtype: string
  - name: kind
    dtype: string
  - name: bench
    dtype: string
  - name: task
    dtype: string
  - name: n
    dtype: int64
  - name: n_unit
    dtype: string
  - name: status
    dtype: string
  - name: evidence_url
    dtype: string
  - name: colour
    dtype: string
  - name: hue
    dtype: int64
  - name: note
    dtype: string
  - name: _as_of
    dtype: timestamp[s]
  - name: _source
    dtype: string
  - name: _authority
    dtype: string
  - name: _public_count
    dtype: string
- config_name: humanoid-labour-index
  features:
  - name: axis
    dtype: string
  - name: family
    dtype: string
  - name: kind
    dtype: string
  - name: bench
    dtype: string
  - name: task
    dtype: string
  - name: n
    dtype: int64
  - name: n_unit
    dtype: string
  - name: status
    dtype: string
  - name: evidence_url
    dtype: string
  - name: colour
    dtype: string
  - name: hue
    dtype: int64
  - name: note
    dtype: string
  - name: _as_of
    dtype: timestamp[s]
  - name: _source
    dtype: string
  - name: _authority
    dtype: string
  - name: _public_count
    dtype: string
- config_name: cross-reality-checks
  features:
  - name: id
    dtype: string
  - name: check
    dtype: string
  - name: question
    dtype: string
  - name: labels
    list: string
- config_name: detector-interop-protocol
  features:
  - name: id
    dtype: string
  - name: criterion
    dtype: string
  - name: predicate
    dtype: string
  - name: question
    dtype: string
  - name: labels
    list: string
  - name: why
    dtype: string
- config_name: swarm-protocol
  features:
  - name: id
    dtype: string
  - name: dimension
    dtype: string
  - name: question
    dtype: string
  - name: labels
    list: string
  - name: note
    dtype: string
- config_name: swarm-inspect
  features:
  - name: id
    dtype: string
  - name: input
    dtype: string
  - name: target
    dtype: string
  - name: text
    dtype: string
  - name: expected
    dtype: string
  - name: category
    dtype: string
  - name: must_inc
    list: string
  - name: axis
    dtype: string
  - name: hub_dataset
    dtype: string
  - name: source_bank
    dtype: string
  - name: n_bank
    dtype: int64
  - name: keep_sha256
    dtype: string
- config_name: peritem-governance
  features:
  - name: axis_item
    dtype: string
  - name: item
    dtype: string
  - name: category
    dtype: 'null'
  - name: expected
    dtype: string
  - name: model
    dtype: string
  - name: raw
    dtype: string
  - name: parsed
    dtype: string
  - name: correct
    dtype: bool
  - name: unparsed
    dtype: bool
  - name: transport_error
    dtype: 'null'
- config_name: peritem-safety
  features:
  - name: axis_item
    dtype: string
  - name: item
    dtype: string
  - name: category
    dtype: string
  - name: expected
    dtype: string
  - name: model
    dtype: string
  - name: raw
    dtype: string
  - name: parsed
    dtype: string
  - name: correct
    dtype: bool
  - name: unparsed
    dtype: bool
  - name: transport_error
    dtype: 'null'
- config_name: peritem-provenance
  features:
  - name: axis_item
    dtype: string
  - name: item
    dtype: string
  - name: category
    dtype: string
  - name: expected
    dtype: string
  - name: model
    dtype: string
  - name: raw
    dtype: string
  - name: parsed
    dtype: string
  - name: correct
    dtype: bool
  - name: unparsed
    dtype: bool
  - name: transport_error
    dtype: 'null'
- config_name: peritem-continuity
  features:
  - name: axis_item
    dtype: string
  - name: item
    dtype: string
  - name: category
    dtype: string
  - name: expected
    dtype: string
  - name: model
    dtype: string
  - name: raw
    dtype: string
  - name: parsed
    dtype: string
  - name: correct
    dtype: bool
  - name: unparsed
    dtype: bool
  - name: transport_error
    dtype: 'null'
- config_name: peritem-conformance
  features:
  - name: axis_item
    dtype: string
  - name: item
    dtype: string
  - name: category
    dtype: 'null'
  - name: expected
    dtype: string
  - name: model
    dtype: string
  - name: raw
    dtype: string
  - name: parsed
    dtype: string
  - name: correct
    dtype: bool
  - name: unparsed
    dtype: bool
  - name: transport_error
    dtype: 'null'
- config_name: peritem-openness
  features:
  - name: axis_item
    dtype: string
  - name: item
    dtype: string
  - name: category
    dtype: string
  - name: expected
    dtype: string
  - name: model
    dtype: string
  - name: raw
    dtype: string
  - name: parsed
    dtype: string
  - name: correct
    dtype: bool
  - name: unparsed
    dtype: bool
  - name: transport_error
    dtype: 'null'
- config_name: peritem-machinery-conformity
  features:
  - name: axis_item
    dtype: string
  - name: item
    dtype: string
  - name: category
    dtype: 'null'
  - name: expected
    dtype: string
  - name: model
    dtype: string
  - name: raw
    dtype: string
  - name: parsed
    dtype: string
  - name: correct
    dtype: bool
  - name: unparsed
    dtype: bool
  - name: transport_error
    dtype: 'null'
- config_name: peritem-care
  features:
  - name: axis_item
    dtype: string
  - name: item
    dtype: string
  - name: category
    dtype: 'null'
  - name: expected
    dtype: string
  - name: model
    dtype: string
  - name: raw
    dtype: string
  - name: parsed
    dtype: string
  - name: correct
    dtype: bool
  - name: unparsed
    dtype: bool
  - name: transport_error
    dtype: 'null'
- config_name: peritem-cross-reality
  features:
  - name: axis_item
    dtype: string
  - name: item
    dtype: string
  - name: category
    dtype: string
  - name: expected
    dtype: string
  - name: model
    dtype: string
  - name: raw
    dtype: string
  - name: parsed
    dtype: string
  - name: correct
    dtype: bool
  - name: unparsed
    dtype: bool
  - name: transport_error
    dtype: 'null'
- config_name: peritem-detector-interop
  features:
  - name: axis_item
    dtype: string
  - name: item
    dtype: string
  - name: category
    dtype: 'null'
  - name: expected
    dtype: string
  - name: model
    dtype: string
  - name: raw
    dtype: string
  - name: parsed
    dtype: string
  - name: correct
    dtype: bool
  - name: unparsed
    dtype: bool
  - name: transport_error
    dtype: 'null'
- config_name: peritem-art5-safeguard
  features:
  - name: axis_item
    dtype: string
  - name: item
    dtype: string
  - name: category
    dtype: string
  - name: expected
    dtype: string
  - name: model
    dtype: string
  - name: raw
    dtype: string
  - name: parsed
    dtype: string
  - name: correct
    dtype: bool
  - name: unparsed
    dtype: bool
  - name: transport_error
    dtype: 'null'
- config_name: peritem-swarm
  features:
  - name: axis_item
    dtype: string
  - name: item
    dtype: string
  - name: category
    dtype: 'null'
  - name: expected
    dtype: string
  - name: model
    dtype: string
  - name: raw
    dtype: string
  - name: parsed
    dtype: string
  - name: correct
    dtype: bool
  - name: unparsed
    dtype: bool
  - name: transport_error
    dtype: 'null'
- config_name: peritem-affect
  features:
  - name: axis_item
    dtype: string
  - name: item
    dtype: string
  - name: category
    dtype: string
  - name: expected
    dtype: string
  - name: model
    dtype: string
  - name: raw
    dtype: string
  - name: parsed
    dtype: string
  - name: correct
    dtype: bool
  - name: unparsed
    dtype: bool
  - name: transport_error
    dtype: 'null'
  - name: severity
    dtype: int64
  - name: severity_basis
    dtype: string
- config_name: manifest
  features:
  - name: file
    dtype: string
  - name: bytes
    dtype: int64
  - name: sha
    dtype: string
  - name: ext
    dtype: string
  - name: url
    dtype: string
  - name: repo
    dtype: string
  - name: as_of
    dtype: string
  - name: source
    dtype: string
---

# GSPC — every axis of the Council of AI measurement board, in one dataset

**Measurement, not certification.** GSPC is the measurement board of Council of AI (CSOAI Ltd). Each axis is a scoped, dated measurement on a published, frozen split. A result applies to one question, one system set and one method. It is not a rating, an endorsement or an accreditation.

This repository consolidates the per-axis Hub datasets into one place, with **one config per axis**. Every file is copied unchanged from a pinned revision of its source repository; `axes/<axis>/SOURCE.json` records the source repo, its revision and each file's SHA-256, and `SHA256SUMS` covers the whole tree. The source repositories stay online.

| Start here | |
|---|---|
| Live board (source of truth for counts and states) | [`GET https://councilof.ai/api/gspc`](https://councilof.ai/api/gspc) |
| Interactive board | [Space `csoai/gspc-board`](https://huggingface.co/spaces/csoai/gspc-board) |
| Verify a signed record (free) | [councilof.ai/gspc-verify](https://councilof.ai/gspc-verify) |
| Method and limits | [councilof.ai/methodology](https://councilof.ai/methodology/) |

## Load it

```python
from datasets import load_dataset

board = load_dataset("csoai/gspc", "board", split="train")            # one row per HF-hosted axis (snapshot)
gov   = load_dataset("csoai/gspc", "governance", split="train")       # the governance bank (GovBench)
rows  = load_dataset("csoai/gspc", "peritem-governance", split="train")  # frozen per-item model responses
```

## What the board said when this card was written

Read from `GET https://councilof.ai/api/gspc` (schema `csoai.gspc-axes/0.5`) on 2026-11-20. These values change; the live response wins over this card.

- `totals.public_count`: **34 axes · 34 measured**
- `totals.separation_public_count`: **0 of 14 model-comparison axes separated a leader · 7 TIE · 7 UNTESTED**
- `peritem_rows.rows_total`: **15580** (dataset `csoai/gspc-peritem-rows-2026-08-12`, revision `294e4cf9e8`)

## Configs

`rows` is the number of lines in the file. `n` and the states are from the live board. Every behavioural bank except `swarm` holds one canary row, so on 11 of them the file has `n + 1` rows. `care` has 201 rows for `n` = 199: 200 bank records plus the canary, and the board's `n_note` explains that one exact-duplicate pair gives 199 unique scored texts. Row counts for the fact axes and `provenance-controls` count records, not the board's `n` (instruments or components).

| config | kind | bench | rows | n (board) | status | separation | source repo | source licence |
|---|---|---|---:|---:|---|---|---|---|
| `board` | derived | — | 22 | — | — | — | (derived from axes/*/axis-live.jsonl) | mixed (cc-by-4.0 / cc0-1.0) |
| `governance` | model-comparison | GovBench | 238 | 237 | MEASURED | TIE | [`csoai/gspc-gov`](https://huggingface.co/datasets/csoai/gspc-gov) | cc-by-4.0 |
| `safety` | model-comparison | DefBench | 37 | 36 | MEASURED | TIE | [`csoai/gspc-agi`](https://huggingface.co/datasets/csoai/gspc-agi) | cc0-1.0 |
| `provenance` | model-comparison | ProvBench | 33 | 32 | MEASURED | TIE | [`csoai/gspc-prv`](https://huggingface.co/datasets/csoai/gspc-prv) | cc0-1.0 |
| `continuity` | model-comparison | PQCBench | 34 | 33 | MEASURED | TIE | [`csoai/gspc-asi`](https://huggingface.co/datasets/csoai/gspc-asi) | cc0-1.0 |
| `conformance` | model-comparison | MCPBench | 36 | 35 | MEASURED | TIE | [`csoai/gspc-mcp`](https://huggingface.co/datasets/csoai/gspc-mcp) | cc0-1.0 |
| `openness` | model-comparison | OSSBench | 33 | 32 | MEASURED | TIE | [`csoai/gspc-oss`](https://huggingface.co/datasets/csoai/gspc-oss) | cc0-1.0 |
| `machinery-conformity` | model-comparison | MachBench | 34 | 33 | MEASURED | UNTESTED | [`csoai/gspc-mach`](https://huggingface.co/datasets/csoai/gspc-mach) | cc-by-4.0 |
| `care` | model-comparison | CareBench | 201 | 199 | MEASURED | TIE | [`csoai/gspc-care`](https://huggingface.co/datasets/csoai/gspc-care) | cc0-1.0 |
| `cross-reality` | model-comparison | XRAIV | 33 | 32 | MEASURED | UNTESTED | [`csoai/gspc-xr`](https://huggingface.co/datasets/csoai/gspc-xr) | cc-by-4.0 |
| `detector-interop` | model-comparison | DetBench | 34 | 33 | MEASURED | UNTESTED | [`csoai/gspc-det`](https://huggingface.co/datasets/csoai/gspc-det) | cc-by-4.0 |
| `art5-safeguard` | model-comparison | Art5Bench | 37 | 36 | MEASURED | UNTESTED | [`csoai/gspc-art5`](https://huggingface.co/datasets/csoai/gspc-art5) | cc0-1.0 |
| `swarm` | model-comparison | SwarmBench v2b | 37 | 37 | MEASURED | UNTESTED | [`csoai/gspc-swarm`](https://huggingface.co/datasets/csoai/gspc-swarm) | cc0-1.0 |
| `affect` | model-comparison | AffectBench | 42 | 41 | MEASURED | UNTESTED | [`csoai/gspc-affect`](https://huggingface.co/datasets/csoai/gspc-affect) | cc-by-4.0 |
| `jail` | model-comparison | GoldBank-Detector | 71 | 71 | MEASURED | UNTESTED | [`csoai/gspc-jail-goldbank`](https://huggingface.co/datasets/csoai/gspc-jail-goldbank) | cc-by-4.0 |
| `provenance-controls` | deterministic-facts | ChainFacts | 7 | 6 | MEASURED | — | [`csoai/gspc-provenance-controls`](https://huggingface.co/datasets/csoai/gspc-provenance-controls) | cc-by-4.0 |
| `reserve-attestation` | deterministic-facts | ReserveFacts | 1 | 16 | MEASURED | — | [`csoai/gspc-reserve-attestation`](https://huggingface.co/datasets/csoai/gspc-reserve-attestation) | cc-by-4.0 |
| `regulatory-framework` | deterministic-facts | RegimeFacts | 1 | 16 | MEASURED | — | [`csoai/gspc-regulatory-framework`](https://huggingface.co/datasets/csoai/gspc-regulatory-framework) | cc-by-4.0 |
| `distribution-integrity` | deterministic-facts | DistributionFacts | 1 | 16 | MEASURED | — | [`csoai/gspc-distribution-integrity`](https://huggingface.co/datasets/csoai/gspc-distribution-integrity) | cc-by-4.0 |
| `custody-disclosure` | deterministic-facts | CustodyFacts | 1 | 16 | MEASURED | — | [`csoai/gspc-custody-disclosure`](https://huggingface.co/datasets/csoai/gspc-custody-disclosure) | cc-by-4.0 |
| `ai-adoption-components` | deterministic-facts | Eurostat | 1 | 2 | MEASURED | — | [`csoai/gspc-ai-economy-index`](https://huggingface.co/datasets/csoai/gspc-ai-economy-index) | cc-by-4.0 |
| `labour-components` | deterministic-facts | Eurostat | 1 | 2 | MEASURED | — | [`csoai/gspc-human-labour-index`](https://huggingface.co/datasets/csoai/gspc-human-labour-index) | cc-by-4.0 |
| `humanoid-labour-index` | deterministic-facts | Disclosure | 1 | 8 | MEASURED | — | [`csoai/gspc-humanoid-labour-index`](https://huggingface.co/datasets/csoai/gspc-humanoid-labour-index) | cc-by-4.0 |
| `cross-reality-checks` | model-comparison | XRAIV | 30 | 32 | MEASURED | UNTESTED | [`csoai/gspc-xr`](https://huggingface.co/datasets/csoai/gspc-xr) | cc-by-4.0 |
| `detector-interop-protocol` | model-comparison | DetBench | 30 | 33 | MEASURED | UNTESTED | [`csoai/gspc-det`](https://huggingface.co/datasets/csoai/gspc-det) | cc-by-4.0 |
| `swarm-protocol` | model-comparison | SwarmBench v2b | 30 | 37 | MEASURED | UNTESTED | [`csoai/gspc-swarm`](https://huggingface.co/datasets/csoai/gspc-swarm) | cc0-1.0 |
| `swarm-inspect` | model-comparison | SwarmBench v2b | 37 | 37 | MEASURED | UNTESTED | [`csoai/gspc-swarm`](https://huggingface.co/datasets/csoai/gspc-swarm) | cc0-1.0 |
| `peritem-governance` | per-item rows | GovBench | 4503 | 237 | MEASURED | TIE | [`csoai/gspc-peritem-rows-2026-08-12`](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12) | cc-by-4.0 |
| `peritem-safety` | per-item rows | DefBench | 684 | 36 | MEASURED | TIE | [`csoai/gspc-peritem-rows-2026-08-12`](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12) | cc-by-4.0 |
| `peritem-provenance` | per-item rows | ProvBench | 608 | 32 | MEASURED | TIE | [`csoai/gspc-peritem-rows-2026-08-12`](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12) | cc-by-4.0 |
| `peritem-continuity` | per-item rows | PQCBench | 627 | 33 | MEASURED | TIE | [`csoai/gspc-peritem-rows-2026-08-12`](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12) | cc-by-4.0 |
| `peritem-conformance` | per-item rows | MCPBench | 665 | 35 | MEASURED | TIE | [`csoai/gspc-peritem-rows-2026-08-12`](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12) | cc-by-4.0 |
| `peritem-openness` | per-item rows | OSSBench | 608 | 32 | MEASURED | TIE | [`csoai/gspc-peritem-rows-2026-08-12`](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12) | cc-by-4.0 |
| `peritem-machinery-conformity` | per-item rows | MachBench | 627 | 33 | MEASURED | UNTESTED | [`csoai/gspc-peritem-rows-2026-08-12`](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12) | cc-by-4.0 |
| `peritem-care` | per-item rows | CareBench | 3800 | 199 | MEASURED | TIE | [`csoai/gspc-peritem-rows-2026-08-12`](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12) | cc-by-4.0 |
| `peritem-cross-reality` | per-item rows | XRAIV | 608 | 32 | MEASURED | UNTESTED | [`csoai/gspc-peritem-rows-2026-08-12`](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12) | cc-by-4.0 |
| `peritem-detector-interop` | per-item rows | DetBench | 627 | 33 | MEASURED | UNTESTED | [`csoai/gspc-peritem-rows-2026-08-12`](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12) | cc-by-4.0 |
| `peritem-art5-safeguard` | per-item rows | Art5Bench | 684 | 36 | MEASURED | UNTESTED | [`csoai/gspc-peritem-rows-2026-08-12`](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12) | cc-by-4.0 |
| `peritem-swarm` | per-item rows | SwarmBench v2b | 760 | 37 | MEASURED | UNTESTED | [`csoai/gspc-peritem-rows-2026-08-12`](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12) | cc-by-4.0 |
| `peritem-affect` | per-item rows | AffectBench | 779 | 41 | MEASURED | UNTESTED | [`csoai/gspc-peritem-rows-2026-08-12`](https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12) | cc-by-4.0 |
| `manifest` | file manifests | — | 153 | — | — | — | (each axis repo manifest.jsonl) | mixed (cc-by-4.0 / cc0-1.0) |

Notes:

- `board` is **derived**. It is built from the `axis-live.jsonl` snapshot in each source repo. It keeps 14 shared columns, and the full original row is in `axis_live_json`. It is a dated copy, not the live GET.
- For the 7 financial / deterministic-facts axes, the axis config is the axis record (1 row). Its `n` counts instruments or components, not bank items (see `n_unit` inside `axis_live_json`).
- `peritem-*` configs are the frozen per-item rows behind the separation tests. They are copied from `csoai/gspc-peritem-rows-2026-08-12` at the revision the board cites, and every row file is checked against `peritem_rows.files` from the live board.
- `manifest` concatenates each source repo's own `manifest.jsonl`. Those rows describe the **source** repositories at their own `as_of` dates, not this repository.
- Not included here: **12 axes whose banks are served from councilof.ai rather than the Hub** (`effect-binding`, `lab-practice`, `company-practice`, `measurer-integrity`, `harness-fidelity`, `interop-conformance`, `humanoid-deployment`, `regulator-transparency`, `interpretability-reproducibility`, `claim-maintenance`, `serving-fidelity`, `watchdog-ingest`). Their bank paths are in each axis's `bank` / `evidence_url` field of the live board. TODO(owner): decide whether to mirror them here as additional configs.
- `gspc-swarm`'s `candidates_v2` config is byte-identical to `items.jsonl` (same SHA-256). It is not repeated as a separate config, but the file is in `axes/swarm/`.

## Limitations (from the live board)

> Of the 14 model-comparison axes, 7 have a published statistical-separation determination: 0 SEPARATED and 7 TIE. Methods are stated per axis; most use paired McNemar tests, while any alternative must publish its basis and supporting evidence. The remaining 7 are UNTESTED for separation. All 14 carry a measurement — separation is a further test that most have not had, and UNTESTED is not a tie. A point-estimate lead is not a measured advantage. The financial axes are not model comparisons and are not in this denominator.

More limitations, corrections and withdrawals: the `limitations` array of the live board and the [corrections register](https://councilof.ai/corrections/). Do not pool model-comparison accuracy with deterministic-fact results. A TIE is not a win, UNTESTED is not a tie, and a missing value is never a zero.

**Do not train on the banks.** They are evaluation splits. Training on them makes later measurements on them meaningless.

## Licence

TODO(owner) — **needs owner ruling.** The source repositories declare different licences: `cc-by-4.0` on 15 of the 23 copied repos and `cc0-1.0` on 8. Their commit history shows a 9 Nov migration to CC0 "per owner all-CC0 directive". On 20 Nov the governance bank was set back to `cc-by-4.0` (correction C-2026-1120-02), because its scenarios come from the AI Act Evaluation Benchmark (NCSR "Demokritos", arXiv:2603.09435) under CC-BY-4.0. `gspc-care` declares `cc0-1.0` but also ships an Apache-2.0 `LICENSE` file. This card proposes `cc-by-4.0` for the collection, with each file keeping the licence of its source (column `source licence` above). Third-party material keeps its upstream licence and attribution.

## How to cite

The canonical methodology DOI on the board is `10.5281/zenodo.21991104`. Its `doi_status` is **UNAVAILABLE**: Zenodo record unavailable since 29 Sep 2026: account blocked by Zenodo; no appeal on record (live status: https://councilof.ai/interop/zenodo-status.json). Until that changes, cite the dataset revision you used, and the live methodology page.

```bibtex
@misc{csoai_gspc_2026,
  title        = {GSPC: the Council of AI measurement board (consolidated per-axis banks)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face Hub, \url{https://huggingface.co/datasets/csoai/gspc}},
  note         = {Revision TODO(owner): pin the commit you used. Live board: https://councilof.ai/api/gspc. Methodology: https://councilof.ai/methodology/. Measurement, not certification.}
}
```

TODO(owner): add an `arxiv:` / DOI link when a technical report is deposited. The DOI above is not resolvable while its status is UNAVAILABLE.

## Contact

TODO(owner): one contact address for this card. The 19 Nov audit found `nicholas@csoai.org` in some citation blocks and `contact@` on the site.
