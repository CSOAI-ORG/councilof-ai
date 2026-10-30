# GSPC benchmark suite — banks, methods and evaluation tools

This repository collects GSPC evaluation banks, candidate subject-family banks and integration drafts. Use it to inspect the measurement inputs and reproduce a supported model evaluation. Current admitted results are published on the [GSPC board](https://councilof.ai/api/gspc).

Browse the [Files](https://huggingface.co/datasets/csoai/gspc-benchmark-suite/tree/main) tab for the bundle. Its banks and registry manifests have different schemas, so the automatic tabular viewer is disabled; it previously displayed one registry manifest as a one-row test dataset.

## Start with the supported runner

The maintained runner and its grader live together in the [Council of AI source repository](https://github.com/CSOAI-ORG/councilof-ai/tree/master/harness/bench). It imports the canonical grader; it does not substitute a generic exact-match scorer.

```bash
git clone https://github.com/CSOAI-ORG/councilof-ai.git
cd councilof-ai
python3 harness/bench/run_bench.py --list
```

To score answers you already hold, place one JSON object on each line of `answers.jsonl`, using `index` for the zero-based bank item and `answer` for the exact model reply. Include every item; retain the original replies.

```bash
python3 harness/bench/run_bench.py --axis governance \
  --model your-model --answers answers.jsonl --out result.json
```

This mode makes no model calls. The runner downloads the selected published bank and records its digest, prompts, parsed labels, missing answers and denominator. A live run instead needs your own configured model endpoint and budget. Save the source commit and result file for reproduction. No leaderboard submission or board admission happens automatically.

## What is included

| Path | Purpose |
| --- | --- |
| `banks/` | Suite definitions and candidate subject-family banks; inspect each file's scope and status. |
| `registry-packages/` | Draft mappings for external evaluation frameworks and registries. |
| `src/csoai_gspc/inspect_tasks.py` | An experimental Inspect integration; it is not qualified as a replacement for the canonical runner. |
| `outward-evidence-20261026/` | Dated reports and worked examples, retained as historical material. |

## Integration status

The earlier page advertised a `pypi/` install directory, `lm_eval/tasks/gspc`, `kaggle/kaggle_benchmark_notebook.py` and `openenv/openenv-manifest.json`. Those paths are absent from this repository. Use the supported runner above. The external integration drafts require qualification against their current APIs, actual dataset names/splits and the canonical grading rule before they can be described as runnable benchmark integrations.

The presence of a `benchmark` tag or registry draft is not acceptance by Hugging Face, Kaggle, Inspect, Lighteval or another leaderboard. Benchmark registration, completed evaluations and external acceptance are separate steps.

## Interpret results correctly

- A candidate bank is an input to evaluation, not evidence that its subject has been measured or admitted.
- Compare complete runs only when bank bytes, prompts, expected labels, grader version and evaluation conditions agree. Preserve unparsed and missing outcomes.
- Report task coverage, uncertainty, model/version, tool access, budgets and observation dates. Keep model comparisons separate from deterministic facts and subject assessments.
- A significant paired result is scoped to that declared comparison. It does not establish general superiority, certification, safety or permission to execute an action.
- Keep development data separate from an independently reviewed, sealed evaluation set. Public-bank optimisation cannot establish performance on unseen tasks.

[Current board](https://councilof.ai/api/gspc) · [Methodology](https://councilof.ai/methodology/) · [Verify supported signed records](https://councilof.ai/gspc-verify/) · [Corrections](https://councilof.ai/claim-maintenance)

Published by Council of AI — Council for the Safety of Artificial Intelligence, operated by CSOAI Ltd. Existing file licences remain applicable. Measurement is not certification.
