# MEOK working data

Private working storage for the existing MEOK integration. Canonical source:
`CSOAI-ORG/councilof-ai`, `mcp/meok-gspc-layer0/cosmos-working-data`.

This bucket is working storage. Creating it does not establish that collection,
memory admission, training or evaluation is running. No task examples or model
weights are supplied by this initial setup.

Use unique run IDs under these intended prefixes:

| Prefix | Intended content |
| --- | --- |
| `training-candidates/` | Authorised, reviewed candidate traces, with source rights and producer/model revisions |
| `training-runs/` | Separately budgeted training configurations and intermediate checkpoints |
| `evaluation-runs/` | Evaluation outputs referencing an unchanged, separately versioned evaluation bank |
| `cache/` | Reconstructible model/runtime downloads; not authoritative memory |

Hugging Face buckets are mutable and do not supply Git version history. Preserve
the exact hashes and immutable source revisions of admitted releases in model
and dataset repositories. A directory name does not make its contents reviewed,
correct, licensed for training or an admitted GSPC result.

Do not automatically ingest reports, conversations, personal data, credentials
or third-party model outputs. Use only the task data for which the existing
rights and privacy checks permit this use. Exclude held-out GSPC evaluation
examples from training exports. Use the canonical mill's complete provenance
and verifier; never substitute truncated response previews or a different
grader for its measurement record.

When the evidence is ready, a versioned training release can feed an explicitly
configured compatible training job. Promotion requires an evaluation result
against the unchanged base model. Inference calls alone do not update weights.

Bucket attachment and automatic ingestion are separate configuration steps.
This setup does not attach private data to a public Space.
