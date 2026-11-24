<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

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
python3 harness/bench/run_bench.py --axis care \
  --model your-model --answers answers.jsonl --out result.json
```

This mode makes no model calls. The runner downloads the selected published bank and records its digest, prompts, parsed labels, missing answers and denominator. A live run instead needs your own configured model endpoint and budget. Save the source commit and result file for reproduction. No leaderboard submission or board admission happens automatically.

## What is included

### Qualified Inspect task

The canonical source now includes an optional [Inspect task](https://github.com/CSOAI-ORG/councilof-ai/blob/master/harness/bench/inspect_task.py), qualified with Inspect AI 0.3.259. It imports the canonical grader, requires a local bank and its SHA-256, and retains original replies, parsed coverage and both accuracy denominators. Follow the [installation and run instructions](https://github.com/CSOAI-ORG/councilof-ai/tree/master/harness/bench#inspect-integration).

The qualification executes the actual framework in an isolated environment with synthetic control replies. It checks correct, wrong, malformed, empty and zero-parsed responses, plus refusal of changed banks and unsound label menus. These controls establish software behaviour; they are not model measurements, benchmark registration or leaderboard admission. The older bundled draft below remains historical and is not the maintained task.

### Bundle files

| Path | Purpose |
| --- | --- |
| `lm_eval_tasks/` | Eleven lm-evaluation-harness tasks, the same files as the GitHub suite repository; see the section below. |
| `banks/` | Suite definitions and candidate subject-family banks; inspect each file's scope and status. |
| `registry-packages/` | Draft mappings for external evaluation frameworks and registries, not accepted by any of them. `inspect_gspc_33.py` has the same defaults as `src/csoai_gspc/inspect_tasks.py`, below, and does not load either. The MEOK accuracy values in `openenv_gspc_5.json` are our own figures and have not been checked by anyone outside Council of AI. |
| `src/csoai_gspc/inspect_tasks.py` | An experimental Inspect integration; it is not qualified as a replacement for the canonical runner. As written it does not load: it asks for a `practice` split, which no public bank has, and its default axis, governance, names `csoai/gspc-governance`, which is not a public dataset. |
| `outward-evidence-20261026/` | Dated reports and worked examples from 26 October 2026, retained as historical material. One report's title calls the suite "World-Class"; Council of AI does not make that claim. Their MEOK results are our own figures and have not been checked by anyone outside Council of AI. The technical annex's section on Byzantine fault tolerance repeats a retracted claim: Council of AI had already withdrawn it (DR-0007, cited in corrections entry C-2026-0826-02). |

## Integration status

The earlier page advertised a `pypi/` install directory, `lm_eval/tasks/gspc`, `kaggle/kaggle_benchmark_notebook.py` and `openenv/openenv-manifest.json`. Those paths are absent from this repository. Use the supported runner above. The external integration drafts require qualification against their current APIs, actual dataset names/splits and the canonical grading rule before they can be described as runnable benchmark integrations.

The presence of a `benchmark` tag or registry draft is not acceptance by Hugging Face, Kaggle, Inspect, Lighteval or another leaderboard. Benchmark registration, completed evaluations and external acceptance are separate steps.

## Interpret results correctly

- A candidate bank is an input to evaluation, not evidence that its subject has been measured or admitted.
- Compare complete runs only when bank bytes, prompts, expected labels, grader version and evaluation conditions agree. Preserve unparsed and missing outcomes.
- Report task coverage, uncertainty, model/version, tool access, budgets and observation dates. Keep model comparisons separate from deterministic facts and subject assessments.
- A significant paired result is scoped to that declared comparison. It does not establish general superiority, safety, approval or permission to execute an action.
- Keep development data separate from an independently reviewed, sealed evaluation set. Public-bank optimisation cannot establish performance on unseen tasks.

[Current board](https://councilof.ai/api/gspc) · [Methodology](https://councilof.ai/methodology/) · [Verify supported signed records](https://councilof.ai/gspc-verify/) · [Corrections](https://councilof.ai/claim-maintenance)

Published by Council of AI (CSOAI Ltd). Existing file licences remain applicable. A score here is a measurement, not an approval of any system.

---

## lm-evaluation-harness tasks

`lm_eval_tasks/` holds eleven tasks, the same files as [CSOAI-ORG/gspc-benchmark](https://github.com/CSOAI-ORG/gspc-benchmark) and [EleutherAI/lm-evaluation-harness#4527](https://github.com/EleutherAI/lm-evaluation-harness/pull/4527). Each task reads a public bank on the Hugging Face Hub, and the `utils.process_docs` filter in each task folder removes the bank's canary row, so it is never scored.

```
lm_eval --model local-chat-completions --apply_chat_template \
  --model_args base_url=http://HOST:PORT/v1/chat/completions,model=<model>,num_concurrent=1 \
  --tasks gspc --include_path lm_eval_tasks --output_path out/
```

`--tasks gspc` runs all eleven through the `gspc` tag. Scores are reported per task; there is no aggregate score. `gspc_governance` and `gspc_swarm` have been removed: corrections entry C-2026-1120-02 records that the governance bank's labels can be read from the wording, and every swarm key is the same label.

---

## Harness check runs (3 and 4 November 2026)

These runs checked that the tasks execute; they are not a leaderboard entry. Model: `qwen2.5-coder:1.5b` (non-thinking, chat mode, temperature 0, greedy) via Ollama local-completions, 30 items per task, which lm-eval's `--limit` takes from the start of each bank, before the canary filter existed.

| Task | exact_match | ± | n |
|---|---|---|---|
| gspc_detector_interop | 0.767 | 0.079 | 30 |
| gspc_safety | 0.700 | 0.085 | 30 |
| gspc_care | 0.567 | 0.092 | 30 |
| gspc_machinery | 0.533 | 0.093 | 30 |
| gspc_openness | 0.500 | 0.093 | 30 |
| gspc_provenance | 0.467 | 0.093 | 30 |
| gspc_art5_safeguard | 0.467 | 0.093 | 30 |
| gspc_conformance | 0.433 | 0.092 | 30 |
| gspc_continuity | 0.367 | 0.089 | 30 |
| gspc_affect | 0.300 | 0.085 | 30 |
| gspc_cross_reality | 0.267 | 0.082 | 30 |

- The canary row is the last row of ten banks, so a 30-item run from the start of a bank does not reach it. In csoai/gspc-asi it is the first row, so 1 of the 30 items counted for gspc_continuity was the canary, which none of the task's labels can match.
- The governance row, the swarm row and the aggregate were removed on 24 November 2026. The aggregate averaged in the governance bank (C-2026-1120-02), and swarm's 1.000 was trivial.
- A second run on 4 November reproduced 12 of the 13 tasks then in the suite within one item (±1/30); gspc_affect moved by +0.100 (3 items).
- Anyone can run the same tasks on any model with the command above and compare.

---

## Add GSPC to your AI platform (Claude, ChatGPT, Cursor, Gemini, VS Code...)

The GSPC stack is a **remote MCP server**: `https://councilof.ai/mcp` (streamable HTTP, MCP 2025-03-26 — verified handshake, server `csoai-gspc-mcp` v1.4.4, 49 free tools + 5 paid).

Copy-paste configs for Claude.ai / Claude Desktop / Cursor / Gemini CLI / VS Code / ChatGPT endpoints: **[ADD_TO_PLATFORM.md](https://github.com/CSOAI-ORG/gspc-benchmark/blob/main/ADD_TO_PLATFORM.md)** in the [gspc-benchmark repo](https://github.com/CSOAI-ORG/gspc-benchmark).

Embed the live sidebar anywhere: `<iframe src="https://csoai-gspc-sidebar.hf.space" width="440" height="720"></iframe>`
