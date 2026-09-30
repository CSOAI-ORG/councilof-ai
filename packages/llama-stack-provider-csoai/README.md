# llama-stack-provider-csoai: a `remote::csoai` eval provider

Apache-2.0. This is an out-of-tree Llama Stack eval provider, and it takes no network access.

- A benchmark lists directories of CSOAI signed evidence batches (`batch.json`, `batch.signed.json`, `events.jsonl`).
- Each eval job verifies every directory offline against a pinned DID document.
- The job returns one row per event. The row carries the event's state word, or INVALID / UNVERIFIABLE_KEY when the batch does not verify.
- `aggregated_results` counts state words. It holds no score and no average.
- The candidate model in the request is never called.

```sh
pip install -e .                                   # llama-stack >= 0.7, Python >= 3.12
python3 fixtures/make_fixtures.py                  # fixtures signed with a PUBLISHED TEST KEY; attest nothing
llama stack run run.yaml &                         # provider loaded via `module: llama_stack_provider_csoai`
curl -X POST localhost:8321/v1alpha/eval/benchmarks -H 'content-type: application/json' -d @fixtures/benchmark.json
curl -X POST localhost:8321/v1alpha/eval/benchmarks/csoai-evidence/jobs -H 'content-type: application/json' -d @fixtures/job.json
curl localhost:8321/v1alpha/eval/benchmarks/csoai-evidence/jobs/<job_id>/result
python3 -m pytest -q tests
```

A fixture job must return these rows, in this order:

1. CONSISTENT
2. DIVERGENT (the negative-control case)
3. UNMEASURED
4. INVALID (a one-word edit made after signing)
5. UNVERIFIABLE_KEY

The older `external_providers_dir` layout is also shipped, in `providers.d/remote/eval/csoai.yaml`.

**Dependency pin.** llama-stack 0.7.3 declares `mcp>=1.23.0`. With the resolver's choice, mcp 2.2.0 (read 30 Sep 2026), the server fails at import: `cannot import name 'McpError' from 'mcp'`. Pinning `mcp<2` (1.30.0) makes it start. The declared range and the import disagree.

**Not measured.**
- Registering this provider on a hosted OpenShift AI cluster was not done, because it needs an account. That registration is UNMEASURED.
- The TrustyAI garak provider that this layout was first modelled on moved away from Llama Stack in its 0.5.0 release, where its compatibility table reads "Eval-hub only (Llama Stack removed)". An eval-hub adapter would be separate work. It was not built.

This provider is our code. It is not a Red Hat integration.
