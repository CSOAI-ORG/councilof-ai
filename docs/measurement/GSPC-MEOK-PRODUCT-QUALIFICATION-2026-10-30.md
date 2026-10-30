# GSPC and MEOK: product and benchmark qualification

Reviewed 30 October 2026. This is an execution specification, not a completed evaluation or a claim of leadership.

## The products and their jobs

| Product | Primary entry | What a user should be able to do |
| --- | --- | --- |
| Current measurement board | `https://councilof.ai/api/gspc` and `https://huggingface.co/spaces/csoai/gspc-board` | Find a current admitted result, its scope, evidence and limitations. |
| Notebook-ready board snapshot | `https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board` | Download the versioned snapshot, understand its columns and reproduce a view without presenting it as live data. |
| Evaluation package | `https://huggingface.co/datasets/csoai/gspc-benchmark-suite` and `harness/bench/` | Select a supported bank, generate canonical prompts, score original replies and retain the complete result ledger. |
| Historical evidence and censuses | Individual HF/Kaggle repositories | Recover dated source material and correction history; distinguish protocol probes, unsigned records, candidate banks and measured model results. |
| MEOK | User task interface and canonical request journal | Complete a scoped user task, recover the original request after interruption, and export evidence of the result. General agent completion and human-authorised effects require separate acceptance. |

Keep these purposes visible. A catalogue with many repositories is not one finished product. Package quality means a newcomer can identify the right entry, run its example, interpret its output and find its limits.

## Changes delivered by this source patch

- Catalogue card renderers remove specifically identified shared legacy notices, preserve unique research content and add revision/file-specific usage guidance. Publication checks parent revisions or complete metadata before writing, then checks readback and non-presentation invariants.
- The benchmark-suite front page points to the canonical runner and identifies unsupported integration drafts. It no longer instructs users to install from paths absent from the repository.
- The runner retains missing replies as unparsed ledger rows, preserves and hashes complete replies, rejects duplicate answer indices, records the canonical grader's file digest and full-bank coverage, and returns a nonzero status for unparsed output.
- Paired comparison refuses mismatched banks, graders, item sets, prompts, expected labels, duplicate indices and partial coverage. Zero parsed pairs is UNTESTED. Historical unsigned or signed results are not rewritten.

## How to improve benchmark performance credibly

1. **Fix the measurement contract.** Freeze bank bytes, item identities, prompt builder, grader, model revision, tool interface and run configuration. Record hashes, exact replies, failures, budget and latency. Distinguish accuracy over all items from accuracy over parsed items.
2. **Separate development from evaluation.** Use public banks for debugging only. Build a reviewed, sealed holdout from the same intended task population, check duplicates and leakage, and restrict access to its labels. Do not tune on leaderboard outcomes or turn gold labels into routing rules.
3. **Find the largest failure classes.** Group failures by parsing, missing context, tool selection, policy compliance, recovery and task verification. Improve the general system against development examples, then evaluate the frozen candidate once on the holdout.
4. **Run fair ablations.** Compare the same underlying model with and without each MEOK capability. Hold task set, tools, tokens, time and retry budget fixed. Disclose deterministic answers, retrieval, routing and ensemble components. An improvement by a complete agent system is not a new base-model result.
5. **Report all outcomes.** Show complete task coverage, invalid/missing responses, uncertainty and cost/latency beside success. Predeclare the primary endpoint and comparison. If many axes or candidates are tested, account for multiple comparisons; the current pairwise p-value is not a family-wide leadership test.
6. **Reproduce before claiming a lead.** Preserve a replayable evaluation bundle, reproduce on an independent environment and follow the target benchmark's submission rules. Only claim the particular verified result under the reported conditions.

No single change guarantees a top rank. The useful target is a reproducible improvement on unseen tasks with the same resource budget and no loss of safety or permission compliance.

## External evaluation tracks

| Track | Use | Entry condition | Evidence required |
| --- | --- | --- | --- |
| GSPC model banks | Canonical label evaluation and uncertainty | Full bank, sound answer menus and canonical grader parity | Frozen bank/grader/prompt hashes, complete per-item ledger, declared denominators and independent replay. |
| τ-bench 2.0 text | MEOK's tool-using task completion | A qualified agent adapter, fixed benchmark revision and an approved resource budget | Complete released task frame; consistent model, simulator and arguments; valid trajectory package. Use custom-submission rules if the benchmark-side scaffold is modified. |
| OSWorld 2.0 | Long tasks, recovery, cross-source reasoning and computer use | An isolated benchmark environment and a working computer-use adapter | Official task validators; declared step budget, binary completion, partial score, safety report and reproducible trajectories. Do not compare with OSWorld 1.x as though it were the same test. |
| Private MEOK acceptance | The actual user's workflow | Enrolled operator, scoped executor and recovery/export path | End-to-end evidence of the user's decision and allowed effect; refusal and recovery controls; exact exported result. Fixtures are not human acceptance. |

The current τ-bench guide distinguishes 1.x from 2.0 and requires complete runs. Its text standard/custom distinction depends on changes to the benchmark-side scaffold. Choose the track before implementation rather than relabelling a modified setup afterwards.

OSWorld 2.0 uses 108 long-horizon workflows and separate execution/safety reporting. It is a later-stage evaluation for MEOK, after its own scoped user workflow is complete; it is not a substitute for product acceptance.

## Hugging Face integration qualification

The Hub's current evaluation-results feature registers benchmark datasets through a root `eval.yaml` and stores model results under `.eval_results/`. The feature is still subject to its documented rollout and registration process. A benchmark tag, draft manifest or local signed receipt is not registration or a verified Hub result.

Before offering an external adapter:

1. Pin the framework and source revision.
2. Verify every referenced dataset, split, task entrypoint and install path exists.
3. Exercise correct, incorrect, malformed and missing-answer cases against the canonical grader; demonstrate parity on the full declared bank.
4. Save a clean-environment installation/replay receipt and keep it in CI.
5. Publish results only after a real run. The Hub's verified badge requires its supported verification flow; never synthesize a verification token or relabel a Council signature as that badge.

The existing Inspect/Lighteval/registry files remain experimental until these checks pass. No paid evaluation jobs, external leaderboard submissions or new measurements are performed by this patch.

## MEOK completion gates

Product acceptance must be evidenced separately from software tests. The repository's `AGENTS.md` identifies the human end-user decision path as a gap. Recheck the actual deployment before describing it as complete. Advance in this order:

| Gate | Concrete completion evidence |
| --- | --- |
| Human decision | A real enrolled operator accepts or declines one bounded challenge and the decision is associated with the original request. |
| Scoped execution | An allowed executor performs only the authorised effect; decline, expiry and replay controls prevent effects. |
| Recipient acceptance | The intended recipient opens the exact exported artifact and confirms it answers the request. |
| Model route | A named provider/model, permitted data scope and spending cap are configured, then tested on a bounded task. |
| Restart/recovery | Startup and interrupted-request recovery work on the intended device without duplicate effects. |
| Benchmark evaluation | The frozen agent and budget complete the selected official task frame and produce valid evidence. |

Re-read the current deployment handoff before modifying an active runtime. Do not infer human acceptance from automated test counts.

## Maintenance commands

```bash
# Focused software and publication invariants; no provider calls.
python3 -m pytest -q scripts/hf/test_product_cards.py \
  scripts/hf/test_polish_frontdoors.py scripts/hf/test_catalogue_publication.py \
  harness/bench/test_comparison_integrity.py harness/bench/test_paired_comparison.py

# Catalogue rendering only. Audit inputs must include full current metadata.
python3 scripts/hf/product_cards.py --audit hf-public-audit.jsonl --out hf-preview
python3 scripts/hf/kaggle_product_cards.py --audit kaggle-audit.json --out kaggle-preview
```

Review generated previews before publication. The publication scripts use existing authenticated sessions and stop on a changed parent, mismatched settings, readback failure or API error. Preserve receipts. On an API rate limit, honour the service's retry instructions. A successful page update does not mean its underlying application, data collection or benchmark adapter has passed acceptance.

## Primary sources

- Hugging Face evaluation results: https://huggingface.co/docs/hub/en/eval-results
- τ-bench submission rules: https://github.com/sierra-research/tau2-bench/blob/main/docs/leaderboard-submission.md
- OSWorld 2.0 project and official code/data links: https://osworld-v2.xlang.ai/

Sources checked 30 October 2026. Pin the exact revisions again before an evaluation; benchmark rules can change.
