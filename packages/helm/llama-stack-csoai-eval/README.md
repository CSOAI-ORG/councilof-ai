# llama-stack-csoai-eval

Runs a Llama Stack server with the `remote::csoai` eval provider (`llama-stack-provider-csoai` on PyPI). The provider verifies CSOAI signed evidence batches offline against a pinned DID document and returns each event's state, never a score.

```sh
helm repo add csoai https://councilof.ai/helm/
helm install csoai-evidence csoai/llama-stack-csoai-eval --set bundles.existingClaim=<pvc-with-batch-dirs>
# OpenShift (restricted SCC): add --set podSecurityContext.runAsUser=null
```

The container installs the provider from PyPI at start, so the pod needs egress to pypi.org. `files/did.json` is a pinned copy of `https://csoai.org/.well-known/did.json`; override it with `--set-file didJson=did.json`.

Not measured: the chart was rendered and linted, and its start command was run outside Kubernetes; it has not been installed on a live cluster. Apache-2.0. Our code; not a Red Hat integration. More: https://councilof.ai/connect/
