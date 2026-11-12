# Council of AI: measured reuse consolidation and next decisions

10 November 2026. Scope: retained engineering research and a separate review candidate. Publication is not a runtime deployment, neutral model ranking, certification or evidence of general model improvement.

## Decisions

1. Keep the reviewed selective cache as the default in this research comparison. Use direct computation where overhead dominates. Do not adopt a cost-based bypass solely because one request is cheaper.
2. The optional refresh-retain candidate repairs the specific post-refresh cold-cache mechanism, but did not outperform selective reuse over the tested histories. Its exact source, controls and whole-cycle comparisons are in `../../harness/measured-reuse-refresh-20261110/README.md`.
3. Do not pool different experiments merely because both use the short label r04. The cost-selector study and cost-aware-reuse study have distinct full identities, methods and calibration boundaries. Both failed to demonstrate a calibration-inclusive default-policy advantage in their own retained runs.
4. Separate response/evidence reuse, model-prefix KV reuse and physical KV-block isolation. Validity at one layer does not qualify the others.
5. Preserve published observations, synthetic experiments, retained live receipts, fresh runtime checks and independent verification as different evidence types.

## What the accumulated work supports

The retained work demonstrates source-bound reuse and correction/refusal controls on declared fixtures; workload-dependent cache break-even; smaller low-bit storage without automatic serving acceleration; and shared text/graph/timeline views derived from one result. Failed sequence controls, negative performance comparisons and incomplete qualification remain in the record.

It does not establish a global compute saving, unrestricted shared memory, a production-wide learning loop, physical photonic efficiency, or a general-purpose model capability improvement. Compact evidence cards point to separately retained artifacts and do not contain a model or unlimited compressed data. Multiple views of one source are not independent reviewers.

## Dependency-ordered onward plan

| Move | Work | Required evidence before proceeding |
|---|---|---|
| Reconcile | Full study identities, immutable source/method/input hashes and current owner boundaries | No unexplained source-version substitution; no combining incompatible counts |
| Publish | Sanitized research artifacts through the existing repository review path | Readback matches tested artifact; private material excluded; CI accurately reported |
| Qualify reuse | One approved read-only workload through the existing authenticated receiver | Exact outputs and refusal controls; complete cold/change/stable cost; retention and concurrency checks |
| Improve task quality | Separate format failures from reasoning failures; evaluate worker, budget and structured output on development cases | Same-model/harness ablation and fresh held-out checks; correct/all plus coverage, not parsed-only marketing |
| Qualify serving | Actual low-bit kernels, exact model/tokenizer revisions, cache state and reset histories | Matched quality; divergence and task success separated; actual backend memory-isolation controls |
| Admit learning | Rights-scoped data, separate development/training/evaluation sets and preserved negative results | Exact training lineage, held-out gain and regressions; no automatic promotion from a digest |
| Add proof where relevant | Link committed-model inference evidence and independent verifier receipts | Valid/tampered/wrong-input/wrong-commitment controls; explicit scope and overhead |
| Extend legacy and views | Typed read-only source adapters; one result feeding multiple current views | Exact byte/schema/decimal handling, selective invalidation and incomplete-coverage fallback |
| Evaluate hardware | Provisioned supported accelerator only after approval | Physical execution, transfer/conversion costs, matched-quality whole job and measured energy |
| Release selected capability | Existing owner acceptance, protected CI, canary, rollback and readback | No promotion solely from a local passing test; published claims match exact released scope |

The stages are gates, not promises of completion dates. They reuse the existing orchestration, authority, evidence projection and measurement systems; no parallel scheduler, ledger or authority plane is introduced.

## Primary research checked for this consolidation

- Databricks, *Incremental refresh for materialized views*, page updated 31 July 2026: cost-based selection between full and incremental refresh while preserving batch-result semantics. This is relevant prior art, not a novelty or vendor-performance claim for this project. https://docs.databricks.com/aws/en/ldp/incremental-refresh
- vLLM, *Security*, current documentation inspected 10 November 2026: treat cache handling and backend trust boundaries separately from application identity. Its production configuration must be evaluated on the actual serving build. https://docs.vllm.ai/en/latest/usage/security/
- Anthropic, *Progress on provable inference for large language models*, 2 November 2026: FlashProve links inference to committed model computation under its stated protocol. An inference proof does not establish task truth, permission or observed external effect; generation/verification overhead belongs in the complete-job comparison. This project has not reproduced the paper's model or hardware results. https://www.anthropic.com/research/provable-inference

No exhaustive coverage, priority, third-party endorsement or independent replication is asserted. Test outcomes and research claims stay separate from public measurement-board admission.
