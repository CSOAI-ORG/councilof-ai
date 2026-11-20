---
title: Inspect Evidence Verifier
emoji: 🔏
colorFrom: gray
colorTo: green
sdk: static
app_file: index.html
pinned: false
license: mit
short_description: Sealed Inspect AI logs with in-browser SHA-256 verification
---

# Inspect evidence: verify in browser

Established evaluations run with [Inspect AI](https://inspect.aisi.org.uk/). The logs are content-addressed
in a Layer-0-style manifest and verified client-side with WebCrypto.

- Manifest: `evidence/evidence_manifest.json` (also `.csv`, `.md`). Merkle root `dc977e1c9b5c6fa0c1e6a6d1fb05e59dffe5c90fd63fb7e47a19c2c0836bd9e7` over 5 logs.
- Report: `evidence/report.md` / `evidence/report.html`, generated from the `.eval` logs and manifest only (no GSPC service).
- Attestation: **CONTENT_ADDRESSED_UNSIGNED**. No signature is claimed.

**These are not measurements.** Four logs are `mockllm` pipeline tests (a fixed-string mock model). One log is a
10-item smoke run of Qwen2.5-0.5B-Instruct on GovBench. Use them to check the pipeline, never to rank models.

Tasks: `gspc_govbench` (csoai/gspc-gov@c6ddc5a9), `inspect_evals/air_bench` (stanford-crfm/air-bench-2024@976d9fbb),
`inspect_evals/coconot` original + contrast (allenai/coconot@2cbe16aa). inspect_ai 0.3.291, inspect_evals 0.29.0.
