# N-site GSPC loop readback — 24 September 2026

Observed 22:47 UTC from a manual invocation of the installed M4 loop; its hourly LaunchAgent is separately loaded. This readback is not inferred from a scheduler label.

## Completed

- Repaired `/Users/nicholas/.local/share/csoai/nsite-spray/run.sh`: after writing `status.json`, it now exits nonzero if either the spray or claim-watch child exits nonzero or the status receipt cannot be written. Previously it always exited zero. Original retained as `run.sh.backup-20260924T224352Z`; the intermediate pre-receipt-write revision is `run.sh.backup-20260924T224848Z`.
- Repaired installed JSON fetch handling: an HTML SPA fallback with HTTP 200 is recorded as HTTP 200 with no valid JSON, rather than status `null`. Original retained as `gspc_site_spray.py.backup-20260924T224635Z`. The source patch is isolated in branch `codex/nsite-soft-404-readback-20260924`, commit `4334a7b` at `/Users/nicholas/clawd/wt-codex-nsite-soft404-20260924`.
- Shell syntax passed; five simulated launcher cases passed (both success, either child failure, both failures, failed receipt write). Four focused Python tests passed. A fresh real run of the final installed launcher completed with spray exit 0 and claim-watch exit 0; `latest.json` generated at 22:49:14 UTC.

## Public boundary

The read-only loop inspected 8 reachable apexes and derived 8 × 23 site/axis pointers. That number is **not** 184 independent measurements, deployments or users. It found zero valid `/.well-known/csoai-governance.json` documents. Councilof.ai, csoai.org, proofof.ai and asisecurity.ai return 404. Meok.ai, openmoe.ai, safetyof.ai and agisafe.ai return HTTP 200 with HTML fallback, not JSON. The governance document is already prepared in the governance-fabric source worktree; this run did not publish it. The 23-axis live board's Ed25519 attestation verifies, while its older 22-axis frozen signed snapshot remains historical.

The value ledger readback reports one non-self payer and one 0.02 USDC settlement, with no repeat payer shown. It does not establish product demand.

## Release gate

Publish the prepared governance discovery asset through the current guarded publisher after its site build checks; verify the exact served JSON at each apex. Do not deploy an older site checkout over the newer public root, correction or OTS material. The installed automation fix is active now; the source branch records the JSON-status change for integration without replacing the newer installed attestation logic.

## Adjacent distribution health

At 22:50 UTC the mirror fanout log showed a guarded hold because its canonical RunPod SSH source was unreachable (exit 78); it did not publish an older local checkout. The Kaggle guard had earlier logged `No space left on device` while writing a receipt. On this Mac, free space was 277 MiB. I cleared only npm's rebuildable `_cacache` (leaving the active `_npx` installations), raising free space to 414 MiB. Re-running the existing Kaggle guard returned exit 0 and `UNCHANGED` for live board SHA-256 `be45a7ed47dc7f43a0ab83b75d3ce60909f918ecf386af7c11a78c0d5a708cca`, Ready version 38. No new Kaggle version was written. Disk space remains tight and the mirror remains held until the current-source RunPod is reachable.
