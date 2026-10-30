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
| 4. Licence consistency | Reconcile Kaggle platform labels with pinned source and public mirrored README declarations. | Exact approved transition and manifest, preserved settings/file inventory and metadata readback for each of 20 CC0/CC-BY discrepancies. | Owner approved the presented 20 label corrections on 30 October 2026; the canonical guard and hash-bound approval record enforce that scope. |
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

## Approved Kaggle label correction

The approved transition is **CC0-1.0 → CC-BY-4.0**, limited to the 20 references
in the retained review manifest. It changes the platform label only. It does not
rewrite historical licence declarations or revoke rights in earlier copies.
Sixteen source declarations were checked at pinned public HF revisions; four
were checked in already-public Kaggle README files because their current HF
sources are private. Those private repositories remain outside this operation.

`scripts/hf/publish_kaggle_licences.py` imports the existing `kaggle_licences`
guard. The separate approval record binds the exact manifest SHA-256, ordered
references, transition, approval reference and scope. Every reviewed before/after
payload and source declaration is checked against its retained digest before
publication. The qualified Kaggle 2.2.4 / kagglesdk 0.1.35 environment is retained.

The publisher reads current complete typed metadata, preserves newer page edits,
rechecks immediately before writing, and uses only `dataset_metadata_update`.
It records intent before the request, retains the original checkpoint across a
lost response, and normalizes Kaggle's display licence names on readback. Every
other setting and the paginated file inventory must match. A changed version,
visibility, identity, unknown licence or conflicting declaration stops the run.
Checkpoint replacement is atomic, intent is flushed to disk, and a write is
refused with less than 32 MiB free. A disk failure after an accepted update is
reconciled by readback before any further write.

```bash
python scripts/hf/publish_kaggle_licences.py \
  --manifest licence-review-proposals.json --approval licence-approval.json \
  --review-root licence-audit --out licence-publication \
  --only nicktempleman/csoai-gspc-verify --publish
# After the canary is PUBLISHED_VERIFIED, repeat without --only.
```

The manifest and approval are retained operational evidence, not automatic
authority for another dataset or future transition. The default invocation
without `--publish` is a read-only preview. Twenty successful readbacks are the
completion criterion. On 30 October 2026, all 20 approved corrections passed,
completing at 09:37:50 UTC. Readback matched every preserved setting and all 113
file names/byte lengths. No file upload or dataset-version creation was performed.
One interrupted receipt write was reconciled from its original checkpoint and
the approved batch completed.

## Benchmark workspace copy

`scripts/hf/templates/kaggle-benchmark-workspace.json` is the maintained title,
subtitle, description and matching citation title for the existing Kaggle benchmark workspace. It removes
an obsolete axis count from the display title while retaining the existing URL.
It links to the qualified public suite and tools, states the 30 October bank
qualification (12 usable tasks, 780 samples; swarm and jail refused), and separates
Inspect qualification from qualification of the existing Kaggle task adapters.
Apply only these presentation fields; preserve visibility, collaborators, task
membership, source notebooks and model runs. The copy does not launch evaluations
or claim a result. Keep the previous text and exact post-save readback as receipts.

## Source and deployment checkpoint

The access and Inspect integration release, PR 3650, merged as
`223dd8c8c619588ba7527d8d411b352daba8a8ed`. Protected deployment run 41027413834
completed successfully, including public root/witness checks, the live MCP tool
inventory check and outward-claim validation. Its separate product qualification
run also passed. The working-group release PR 3641 is deployed; its retained
record reports a private Kaggle notebook run completed. These software outcomes
do not constitute human appointments or end-user acceptance.

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
