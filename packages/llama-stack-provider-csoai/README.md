# llama-stack-provider-csoai: a `remote::csoai` eval provider

Apache-2.0. This is an out-of-tree Llama Stack eval provider, and it takes no network access.

- A benchmark lists directories of CSOAI signed evidence batches (`batch.json`, `batch.signed.json`, `events.jsonl`).
- Each eval job verifies every directory offline against a pinned DID document.
- The job returns one row per event. The row carries the event's state word, or INVALID / UNVERIFIABLE_KEY when the batch does not verify.
- `aggregated_results` counts state words. It holds no score and no average.
- The candidate model in the request is never called.

## Install

```sh
pip install llama-stack-provider-csoai              # Python >= 3.12, llama-stack 0.7.x
curl -o did.json https://csoai.org/.well-known/did.json   # pin the issuer's keys; verification never fetches them
```

Add the provider to your run config with the `module:` form:

```yaml
apis:
- eval
providers:
  eval:
  - provider_id: csoai
    provider_type: remote::csoai
    module: llama_stack_provider_csoai
    config:
      did_json: ${env.CSOAI_DID_JSON:=./did.json}
```

Then register a benchmark whose `metadata.bundles` lists your batch directories, and run a job:

```sh
llama stack run run.yaml &
curl -X POST localhost:8321/v1alpha/eval/benchmarks -H 'content-type: application/json' \
  -d '{"benchmark_id":"csoai-evidence","dataset_id":"csoai-evidence","scoring_functions":["csoai::state"],"provider_id":"csoai","metadata":{"bundles":["./batch-dir"]}}'
curl -X POST localhost:8321/v1alpha/eval/benchmarks/csoai-evidence/jobs -H 'content-type: application/json' \
  -d '{"benchmark_config":{"eval_candidate":{"type":"model","model":"none-no-model-is-called","sampling_params":{}}}}'
curl localhost:8321/v1alpha/eval/benchmarks/csoai-evidence/jobs/<job_id>/result
```

A Helm chart that runs this provider in a Llama Stack server is in the repository at `https://councilof.ai/helm/`:

```sh
helm repo add csoai https://councilof.ai/helm/
helm install csoai-evidence csoai/llama-stack-csoai-eval
```

## What the fixture job returns

The source distribution carries fixtures signed with a **published test key** (they attest nothing). A job over them returns these rows, in this order:

1. CONSISTENT
2. DIVERGENT (the negative-control case)
3. UNMEASURED
4. INVALID (a one-word edit made after signing)
5. UNVERIFIABLE_KEY

The older `external_providers_dir` layout is also shipped, in `providers.d/remote/eval/csoai.yaml`.

**Dependency pin.** llama-stack 0.7.3 declares `mcp>=1.23.0`. With the resolver's choice, mcp 2.2.0 (read 30 Sep 2026), the server fails at import: `cannot import name 'McpError' from 'mcp'`. Pinning `mcp<2` makes it start. The declared range and the import disagree.

**Not measured.**
- Registering this provider on a hosted OpenShift AI cluster was not done, because it needs an account. That registration is UNMEASURED.
- The Helm chart was rendered and linted; it has not been installed on a live cluster. That install is UNMEASURED.

**Limit.** A VALID batch shows who signed these bytes. It does not show that any claim inside is true.

This provider is our code. It is not a Red Hat or Meta integration, and no vendor has reviewed it. More: https://councilof.ai/connect/
