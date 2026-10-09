# Isolated Layer-0 public-root verifier review — 25 September 2026

This is a review candidate, **not** a shared-kernel installation or Council OS deployment.

Source: `/workspace/lanes/out/codex-layer0-public-root-review-20260925` on RunPod `fpowppss5ngtkw`. The original `/workspace/SOVOS/packages/sovos-layer0-harness-kernel` was not edited. Its `kernel.py` and `packs.v1.json` are byte-identical to the isolated copy.

The isolated copy adds exactly one CLI operation, `verify-public-root`. It reads three fixed public HTTPS sources: the councilof.ai root, the Hugging Face mirror and the csoai.org board DID. It checks exact apex/mirror bytes, recomputes the ordered listed-leaf Merkle commitment and verifies the Ed25519 signature over the root's declared six-field preimage. The CLI exits 0 only when all three checks are VALID; unavailable sources and mismatches exit 2. Source URLs cannot be overridden through the CLI. It does not access a private key, issue a signature or stamp, promote a root, publish, or assess OTS, Rekor, individual card truth, all-estate coverage or regulatory compliance.

Validation on the isolated copy:

```sh
cd /workspace/lanes/out/codex-layer0-public-root-review-20260925
PYTHONPATH=src python3 -m unittest discover -s tests -v
PYTHONPATH=src python3 -m sovos_layer0_harness.cli verify-public-root --selftest
PYTHONPATH=src python3 -m sovos_layer0_harness.cli verify-public-root
```

Results: 11/11 tests pass, including unavailable-source fail-closed and rejected DID URL override. The selftest passes valid, mirror mismatch, count tamper, leaf tamper, signature tamper and missing-DID controls. The live read at `2026-09-25T06:17:20Z` returned VALID for all three checks, root/mirror SHA-256 `ae8bbfcedf7cc30172498110e7df66a4f6c98c4aae69c9f47cdcba2abc1d334e`, 305 listed leaves and `as_of=2026-09-22T08:54:02Z`. This verifies the **older served root**, not a new 25 September all-estate root.

Changed-file SHA-256 in the isolated review copy: `cli.py=e5f9b728d19837d315e5a74e79ed181b3a82cceffc6a628a37869bd19f0cf5a8`; `root_verify.py=efd91a550b028aea87ec1cc82204e34c0d01292bd780ad7acfc5bb556c61ed32`; `test_root_verify_cli.py=6b58f3a7baee3ff04b2747989f1c51e7553765ba80da68986a497242c1e2664b`; `README.md=54ebe5f5bd59150e0e7345f9ccf545134a3ca51c9f6ba906bf68b75c77a48dd7`; `pyproject.toml=d4f0371f0fde5a60e3420d333ce15caaa7cde8fdec28541c632567140cfa49c9`.

Promotion gate: code review, dependency/environment pinning, and explicit decision about installation and UI/API exposure. The package's existing MCP/A2A/HTTP names remain planner metadata, not implemented verification transports.
