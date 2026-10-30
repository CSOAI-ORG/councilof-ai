# GSPC product completion and evaluation plan

Owner: Council of AI. Scope: the existing public Hugging Face and Kaggle products,
their canonical source, and the evidence needed for a credible MEOK evaluation.
Use this plan with GSPC-MEOK-PRODUCT-QUALIFICATION-2026-10-30.md. A completed
software check is not a completed human workflow or a benchmark rank.

## Ordered delivery gates

| Step | Work | Completion evidence | Dependency |
| --- | --- | --- | --- |
| 1. Inventory | Read every public repository's metadata; distinguish tables, archives, applications and controlled access. | 150 HF public entries and 146 Kaggle public entries inventoried; private entries excluded. | Existing read access. |
| 2. Product pages | Clear purpose, inputs, usage, provenance, limits and canonical links; remove repeated announcements. | Published README/description hashes and anonymous readbacks; existing data unchanged. | Completed in PR 3647. |
| 3. Dataset access | Select homogeneous tables; document structured archives; preserve gates. | Original bytes load and convert to Parquet for each table recipe; archive examples parse; public publication receipts and server readback. | This change. |
| 4. Licence consistency | Reconcile Kaggle platform labels with pinned source and public mirrored README declarations. | Exact before/after proposal for each of 20 CC0/CC-BY discrepancies; owner decision, then metadata-only readback. | Explicit owner approval for a licence-label change, enforced by scripts/spray/gspc-spray.py:kaggle_licences. |
| 5. Reproducible tools | Qualified canonical runner and a pinned Inspect integration; retain missing/malformed answers and both denominators. | Framework execution using synthetic controls, canonical grader parity, complete log readback and tamper refusal. | Local software checks; no paid model calls. |
| 6. Source release | Canonical source, tests, reviewed PR and protected merge. | Successful checks on the exact merged revision; deployment result. | Existing repository protections. |
| 7. Real user acceptance | Enrol an actual operator; accept and decline bounded challenges; verify allowed effects, exported artifact and recovery. | Named human decision joined to the request and effect. Automated fixtures do not satisfy this gate. | Operator participation and scoped runtime. |
| 8. Competitive evaluation | Freeze candidate, baseline, unseen holdout, adapter, task frame and equal budget; run, analyse, reproduce and submit. | Full original trajectories, failures, cost, latency, uncertainty, matched comparison and the target's admission receipt. | Named model/provider, spending cap, accepted benchmark rules and qualified execution. |

## Access repair acceptance

- OMAI: benchmark items only, excluding the file manifest.
- MCP registry audit: 22 September 2026 snapshot only; earlier schemas stay separate.
- Index presence: the dated listing checks, preserving upstream terms on other files.
- Fleet: job records from the original public JSON; aggregate context stays in that document.
- Organism: integration-target catalogue, with external deployment status kept explicit.
- Cross-ledger supply, evidence index, EU measurements, disclosure completeness and tool parity:
  structured JSON access with exact file/key examples. No flattened derivative is substituted for signed evidence.
- Large evidence and site mirrors: file archives, not training tables.
- MCP census and trust index: existing manual access gates remain in effect.

For all changes, compare repository parents before writing and all original non-README
blob identities after writing. A stale parent, privacy change or mismatched readback stops publication.
Pending dataset-server processing is reported separately from failed local loading.

## Reproduction commands

```bash
python scripts/hf/prepare_dataset_access.py --out access-preview
# Review manifest.json and the generated README files, then:
python scripts/hf/publish_product_cards.py --preview access-preview --publish
python -m pytest -q scripts/hf/test_dataset_access.py harness/bench
```

The preview directory includes local qualification Parquet files. The publisher uploads
only the reviewed README files; those local Parquet files are never published.

## Performance improvement loop

Use public banks to debug the general system. Group failures by parsing, retrieval,
tool choice, recovery and verification; improve the largest classes and run equal-budget
ablations. Freeze a candidate before touching a sealed holdout. Track unparsed replies,
task completion, safety, latency and cost alongside accuracy. Repeat only under a declared
evaluation protocol; do not select a favourable run and present it as general superiority.

External integration drafts, HF benchmark registration and Kaggle competition entry are
separate deliverables. Only the exact adapter/framework combination actually executed
may be labelled qualified. No fabricated scores, verification badges or human acceptance.

## Shared work boundaries

The working-group release has its own PR and acceptance record. This change does not
appoint people, send outreach, change active runtime authorities or publish that lane's
candidate notebook. The latest human-acceptance record must be read again before any
runtime work; old repository notes are not evidence of the current deployment state.
