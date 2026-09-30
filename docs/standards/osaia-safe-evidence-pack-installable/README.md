# Appendix: installable today

This appendix sits beside the frozen SAFE evidence pack (`../osaia-safe-evidence-pack/`, FREEZE `sha256sums_sha256` f869e917…). It does not edit the pack: a new pack is a new FREEZE, and this is a separate record. Text CC-BY-4.0; code Apache-2.0.

The same evidence fabric the pack uses is installable by anyone, through channels that need no marketplace approval:

| Channel | Artefact | Install |
|---|---|---|
| PyPI | `csoai-evidence-fabric` 0.1.0: the `csoai.evidence-event/0.1` schema, the OCSF 1.9 / OTel / SARIF 2.1.0 / in-toto / ECS-HEC / W3C ACR v0.1 renderers, the ingesters and the offline verifier | `pip install csoai-evidence-fabric` |
| PyPI | `llama-stack-provider-csoai` 0.1.0: a Llama Stack `remote::csoai` eval provider | `pip install llama-stack-provider-csoai` |
| PyPI | `nat-csoai-evidence` 0.1.0: a NeMo Agent Toolkit evaluator plugin, `_type: csoai_evidence` | `pip install "nat-csoai-evidence[eval]"` |
| Helm | `llama-stack-csoai-eval` 0.1.0: the provider in a Llama Stack server | `helm repo add csoai https://councilof.ai/helm/` |
| councilof.ai | `csoai-verify.mjs` 0.1.0: one dependency-free ES module that verifies a board-signed record offline | `import … from "https://councilof.ai/lib/csoai-verify.mjs"` |

Every file's sha256, what was run against each one, and what was not measured are in `installable.json`. That record is board-signed (`installable.signed.json`, `did:web:csoai.org#board-attestation-1`, signed 2026-09-30T16:51:33Z, three altered-preimage controls rejected) and OpenTimestamps-stamped (`installable.json.ots`; pending at signing, which is a request, not a time).

Check it:

```sh
sha256sum installable.json          # e317302e5c8c4a22474c9454bdcf140e2fdd9deb904c42e146d560611a6c215a
pip download --no-deps csoai-evidence-fabric==0.1.0 && sha256sum *.whl   # compare with installable.json
```

**Not measured.** No artefact has been installed on a live OpenShift, Kubernetes, Falcon, Splunk, AI Defense or Foundry tenant. No official marketplace or directory lists any of them. The Helm chart has no provenance signature yet. The npm package `csoai-verify` is prepared but not published.

A valid signature shows who signed these bytes. It does not show that any claim inside is true.
