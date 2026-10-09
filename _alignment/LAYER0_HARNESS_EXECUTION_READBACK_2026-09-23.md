# Layer-0 harness fabric — verified state and isolated repairs

Checked 23 September 2026 on the existing RunPod `rp-3090-now`. The pasted Claude report was treated as a claim to verify, not as release authorization.

## Baseline readback

The package `/workspace/SOVOS/packages/sovos-layer0-harness-kernel` exists. Its 9 original tests pass. The registry has exactly 11 pack records. It has a Python planner module and CLI; the six `kernel_protocols` values were metadata strings (`inherited`). No MCP/A2A/HTTP server, TypeScript SDK, pack adapter or execution method exists in that package. The demonstrated EU AI Act prompt produced an ordered map of pack IDs, not measurements, decisions, enforcement, corrections or receipts. The baseline incorrectly placed the unlocated 417-provision reference pack in `map` despite a warning. It also planned `contain` for a generic compliance fix.

Independent source checks: the GSPC files contain 193 + 45 + 24 + 8 = **270 evaluation items**. That is an item inventory, not a fresh 270-item model evaluation. The existing SOVOS crosswalk computes over 13 hardcoded EU AI Act identifiers and NIST/ISO target strings; its internal self-test returned 26 rows and a 0.6923 identifier-overlap ratio against its own constructed ISO subset. That ratio is not verified legal equivalence. Frameworks Drum has 89 framework, 51 charter and 62 regulation root files; those are not 202 compiled packs. The canonical 417-provision directory was not found in the examined roots. The active Claim Maintenance RunPod wrapper exists at `/workspace/lanes/loops/claim-watch-measure.sh` (SHA-256 `31a2ce28ba991a1a56e4de5caf1b4c367674346b5682180b719eaa72a42f60dc`); the new pack record points instead to an M4 estate URI. The Corrections Ledger source path referenced by the stack is absent on this pod.

## Isolated kernel correction

RunPod: `/workspace/lanes/codex-layer0-kernel-review-20260923/sovos-layer0-harness-kernel`

Mac copy: `/Users/nicholas/clawd/codex-layer0-kernel-review-20260923/sovos-layer0-harness-kernel`

Reviewable patch: `/Users/nicholas/clawd/_alignment/LAYER0_KERNEL_HONESTY_GATES_2026-09-23.patch` (applies to the verified baseline and passes tests).

The correction records Python API/CLI as `planner_only` and MCP/A2A/HTTP/TypeScript as `not_implemented`. Plans now say `NOT_EXECUTED`, `execution_ready=false`, `ready_packs=[]`, and mark selected entries `unbound`. Caller tags cannot suppress inferred security/remediation tags. The reference-only 417 pack is listed separately, outside actionable stages. A generic compliance fix no longer plans containment. A mixed “draft and send customer email” request gets an external-action warning and human-review flag; this still is **not** an authorization or email sender. README and target spec distinguish intended architecture from implemented behavior.

Root readback on RunPod: **17/17 tests pass**. The exact EU AI Act example returns `reference_packs=[eu-ai-act-417-frozen]`, `execution_state=NOT_EXECUTED`, `execution_ready=false`, `ready_packs=[]`, `requires_human_review=true`, and no `contain` stage. The corrected kernel SHA-256 is `331b24646c9ff83326d449c92a1adc07a871ffa6c61dff8b758eb8e4970a1935`; registry SHA-256 `f5d730de9bc85562a0a890707a82fe7a8bc683deac5f39d38bb076fdec670c8e`. Mac and RunPod copies match.

## First real pack invocation, still isolated

RunPod: `/workspace/lanes/codex-layer0-crosswalk-adapter-20260923/`

Mac copy: `/Users/nicholas/clawd/codex-layer0-crosswalk-adapter-20260923/`

The adapter pins the existing crosswalk source SHA-256 `ce317dd9c4b79a83134e1cc1262834653abdd7fbfe414e59fcd7301030b289e8`, validates a synthetic input file, invokes the actual package, and emits an output digest. Re-run on RunPod yielded 2 of 3 synthetic local identifiers shared, `TEST-B` missing, `computation_status=COMPUTED`, `measurement_status=UNMEASURED`, payload digest `71760ebff0c67678ca40225c0d359b5ee65c409eb48cfcc140b1b10340238615`. **21/21 adapter and copied upstream tests pass**. Invalid input exits 2 with `UNCHECKABLE` and no result. See `READBACK.md` in that lane for exact-byte hashes and reproduction steps. This is a deterministic identifier-overlap computation, not an assessment of target-control correctness, implementation, or legal compliance.

## Frameworks Drum reference inventory

RunPod: `/workspace/lanes/codex-frameworks-drum-reference-20260923/reference-inventory.json`

Mac copy: `/Users/nicholas/clawd/codex-frameworks-drum-reference-20260923/reference-inventory.json`

The deterministic manifest covers exactly 202 root regular files: 89 frameworks, 51 charters, 62 regulations. Every entry has relative path, exact byte length and SHA-256, with `maturity=reference` and `loaded=false`. It infers no legal obligations. Root readback rehashed all 202 against the source files; **4/4 tests pass**. Manifest SHA-256: `8f9728ae68eec85e4dea7894f0f34b446a4b38bbd03d261e29d1865dd547e5d0`. It is a source inventory, not 202 compiled, measured, or executable harness packs.

## Boundary / next integration

Both improvements are isolated. The original `/workspace/SOVOS` kernel and registry remain at baseline hashes `3dca54d1df3314eafecf25450f3280f6855726f0857f367276921bdbbfeff11e` and `b93b9638083f8dfb0cdf1db07c865f80dc1b11e83d9bf8c21f10249c9e20e11e`. No public endpoint, paid door, model evaluation, signature, anchor, or site was changed.

The next valid promotion is to bind each pack through an explicit adapter contract, with source/version, declared side-effect level, output schema, failure state, and a test proving actual invocation. Any consequential adapter must pass AGISafe and SOVOS at the tool boundary and return real pre/post receipts. A protocol label alone cannot make a pack callable; a file count cannot promote its maturity.
