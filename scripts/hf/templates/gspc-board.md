# GSPC Board Export

A dated, machine-readable export of the Council of AI public measurement board. **One row represents one declared axis**, with its evidence type, measurement status, sample count and source dataset.

[Explore the interactive board](https://huggingface.co/spaces/csoai/gspc-board) · [Read the live JSON](https://councilof.ai/api/gspc) · [Verify a signed record](https://councilof.ai/gspc-verify) · [Methodology](https://councilof.ai/methodology/)

## Load the dataset

Install `datasets`, then:

```python
from datasets import load_dataset

board = load_dataset("csoai/gspc-board", split="train")
print(board.column_names)
print(board[0])
```

For reproducible work, pass `revision="<commit SHA>"` using a revision from the repository's commit history. Retain that revision with your analysis. To use downloaded files without the Hub client, read `board.parquet` with a Parquet reader or `board.jsonl` as newline-delimited JSON.

## Schema

| Column | Meaning |
| --- | --- |
| `axis` | Stable measurement axis identifier |
| `family` | Group of related axes |
| `kind` | Evidence type, such as model comparison, deterministic facts or declared slot |
| `status` | Published measurement state; unmeasured is an explicit gap |
| `n` | Published count for that axis; inspect its method before comparing counts |
| `separation` | Statistical separation state, when applicable |
| `leader` | Publicly displayable leader field, when available; it is not proof of a separated win |
| `dataset` | Source dataset identifier, when available |

Null means absent or inapplicable, not zero. Rows are measurement summaries, not training examples. Do not combine different evidence types into one accuracy score.

## Snapshot provenance

{{PROVENANCE}}

The snapshot records what was published when captured. A newer live result does not rewrite this historical export. Verify source bytes against `snapshot/SNAPSHOT.json`; an included root signature does not make every derived row individually signed.

## Files and reproducibility

| File | Use |
| --- | --- |
| `board.parquet`, `board.jsonl` | Current default viewer export; the same eight-column schema |
| `snapshot/SNAPSHOT.json` | Capture time, source hashes, derived counts and bank observations |
| `snapshot/board.json`, `snapshot/root.json` | Captured source board and transparency root |
| `snapshot/gspc-axes.csv`, `snapshot/gspc-axes.jsonl` | More detailed axis export with evidence and bank fields |
| `snapshot/check-board.sh`, `snapshot/README.md` | Local verification instructions and release context |
| `manifest.jsonl` | Repository file inventory; use snapshot hashes to verify that release |

Run the included check script from a downloaded `snapshot/` directory after inspecting it. It checks the captured export, not whether a claim remains admitted today. Older top-level CSVs, registers and dated notes remain historical material; they are not the default viewer or a substitute for the current snapshot manifest.

## Interpretation and limitations

- **MEASURED** indicates available evidence for an axis, not certification or a winning model.
- **TIE** does not establish a separated lead. **UNTESTED** does not establish separation. A displayed leader can coexist with either state.
- **UNMEASURED** marks a coverage gap. A failed retrieval is uncheckable, never a fabricated zero.
- Results are scoped to the recorded system, method, items and date. They do not establish general safety, legal compliance or permission to execute.
- Check signatures where provided, bound intake receipts, admission and the [current corrections register](https://councilof.ai/corrections/) before quoting a card. A signature alone is insufficient.

## Contribute a review

Use the [Public Watchdog working groups and document tracker](https://councilof.ai/working-groups/) to find a bounded review task, inspect its evidence and prepare a contribution. Independent researchers, practitioners and affected people are welcome. Groups are forming; proposals and forum posts do not change measurements or grant authority.

## Licence and citation

Board export: **CC-BY-4.0**, attributed to **Council of AI / CSOAI Ltd**. Linked datasets and third-party source material retain their own licences.

When citing this export, include “Council of AI / CSOAI Ltd, GSPC Board Export”, the repository URL, exact revision, and the capture date in `SNAPSHOT.json`. The [source repository](https://github.com/CSOAI-ORG/councilof-ai) maintains the publishers and methods.

<details>
<summary>Earlier card and release notes</summary>

[Previous dataset card](https://huggingface.co/datasets/csoai/gspc-board/blob/89e80d7a259f7a786ecaf293de662b0922e7f9b5/README.md) preserves the earlier dated notes and file inventory. Read those counts in their historical context.

</details>
