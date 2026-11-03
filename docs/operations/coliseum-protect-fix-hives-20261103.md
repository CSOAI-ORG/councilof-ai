# Coliseum engineering note: real effects versus a stored registry

3 November 2026. Base: `823f8fd62f760f0d30609d86eebc10300976137f`. First-party, unsigned engineering evidence; not a model score, certification or named-platform acceptance.

## Protect
On Node 22.19.0, at 06:20 UTC, eight cases completed on the pinned Layer-0 JS module (SHA-256 `0eef4ed967b64be6b33e7a9b378a8b68c7680892bb54486795dd818d89578736`). The test supplied gate responses. The callback performed a real exclusive-create in temporary storage. Another Node process checked absence or exact bytes. Deny, unknown gate, unverified escalation, unqualified local execution and pre-dispatch cancellation each left zero callbacks and no file. The allowed control wrote once and reported executed without attestation. Losing the reply after a write produced an unknown outcome, a file and one callback. The unwrapped sensitivity control also wrote once. No provider model or native assistant application was invoked.

Run `node harness/owem/tests/protect-round.mjs packages/layer0-js/index.js` on the pinned source. A changed source digest intentionally requires review. The local-executor hold and SDK adapters are already present in merged #3609 and #3599. Do not infer deployment from this PR.

## Fix and Hives
The prior OOWM query formatted an absent aggregate as a number, breaking the query for an empty register. Its response also described running clusters although the handler only read stored data. The candidate reports unknown versus known empty, keeps genuine zero, labels last-known scores and explicitly states that it did not dispatch a worker. One snapshot supplies both rows and coverage. This change is scoped to the query projection; it does not add worker transport, change the canonical GSPC board or qualify other gateway endpoints.

Run `python3 -B harness/owem/test_oowm_query.py`. The 11-case suite covers the real HTTP and JSON-RPC handlers with synthetic data and a loopback-only test server. Registry reads are not worker acknowledgements. An end-to-end Hive claim still requires the same task ID and digest at the actual router, a named worker and the user-facing receiver, plus a worker-offline case that cannot return success.

## Cross-suite findings and release limit

Do not report the whole baseline green: on the pinned master implementation, the two package test files together passed 19 of 21. Two old expectations assumed an unverified receipt or the unapproved escape flag could execute. Taking only the updated `index.test.js` from #3598 head `f4396313812314081bdff89126e2168f68cddf5c` gives 40 of 41. The last mismatch was the independent fixture's expected hash: it used property insertion order (`target, content`), while the implementation hashed sorted keys (`content, target`). The file-existed, single-callback and unknown-outcome assertions passed before the hash assertion. In a disposable composition, changing only the expected serialization for this two-property vector produced 41 of 41. This is a tested source-owner reconciliation, not 41 passing tests on unchanged master; do not relax runtime hash comparison.

The repaired register projection passed 11 cases on macOS and Linux using isolated fixtures. A final macOS pass also checked that reading a registry file closed its handle without ResourceWarnings. The public static Coliseum viewer is separate from the runner. No private worker delivery, native vendor interception, human approval or production deployment was recorded by this round.
