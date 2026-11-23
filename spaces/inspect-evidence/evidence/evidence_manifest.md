# Evidence manifest (layer0-evidence-manifest/0.1)

- sealed_at: `2026-11-20T05:39:36+00:00`
- merkle_root: `dc977e1c9b5c6fa0c1e6a6d1fb05e59dffe5c90fd63fb7e47a19c2c0836bd9e7` over 5 logs
- merkle_rule: leaves sorted by filename; leaf=SHA256(0x00||sha256(file)); node=SHA256(0x01||L||R); odd node promoted
- attestation: **CONTENT_ADDRESSED_UNSIGNED**: Hashes and Merkle root only; no signature. An owner Ed25519 signature over merkle_root (e.g. under did:web:csoai.org) is the next step and is NOT performed here.
- caveat: mockllm rows are pipeline tests: the mock model returns a fixed default string, so metrics are not measurements.

| file | sha256 | task (v) | model | run_kind | n run / dataset | dataset@revision |
|---|---|---|---|---|---|---|
| 2026-11-20T04-51-52-00-00_gspc-govbench_Cb78yXhpQe7ZBGBibCGR4p.eval | `4cdfde2aa7ec18bd13fb175e625175237c62edeb9adfd91348a795fbbee78946` | gspc_govbench (0.1.0) | hf/Qwen/Qwen2.5-0.5B-Instruct | SMOKE_RUN_REAL_MODEL (n too small for any claim) | 10 / 237 | csoai/gspc-gov@c6ddc5a92c23 |
| 2026-11-20T05-31-04-00-00_gspc-govbench_XLvuPum2URdxWY4J8XJGPM.eval | `d9d4c0c4f8bb17c058ff13bc33cde44801664021ffc5a4662ddb73eb399ca3f8` | gspc_govbench (0.1.0) | mockllm/model | PIPELINE_TEST_MOCKLLM (not a measurement) | 10 / 237 | csoai/gspc-gov@c6ddc5a92c23 |
| 2026-11-20T05-36-00-00-00_air-bench_Qo89ffGcv2wQcfL6hk7dNR.eval | `3910d7d6a30652df3709fee4f8cebfdf1b7118acf935fdb7c91c3754aa424ae8` | inspect_evals/air_bench (4) | mockllm/model | PIPELINE_TEST_MOCKLLM (not a measurement) | 5 / 5694 | stanford-crfm/air-bench-2024@976d9fbb0f52 |
| 2026-11-20T05-36-25-00-00_coconot_kSzJiCWx9K5ZN6SBkMLJAW.eval | `efe31d42bafb4ed3d0b10dd3166611157024642716dc11103ee3b07f33976118` | inspect_evals/coconot (4) | mockllm/model | PIPELINE_TEST_MOCKLLM (not a measurement) | 5 / 1001 | allenai/coconot@2cbe16aabf90 |
| 2026-11-20T05-36-30-00-00_coconot_PhXfomJCaAfwHsQEjmaz6A.eval | `6a0530d9bdce9736a7b2c8cebc6e59af24fa35713053c6cfd15586376a1020ad` | inspect_evals/coconot (4) | mockllm/model | PIPELINE_TEST_MOCKLLM (not a measurement) | 5 / 379 | allenai/coconot@2cbe16aabf90 |
