# Acceptance and next work - 19 September 2026, 16:22 UTC

## Completed and retained
- 22 unit tests passed on M2 and the same 22 passed on M4; not 44 independent tests.
- Real MCP initialization, discovery, three read-only tool calls and unknown-tool rejection passed on both.
- Existing SSH host identity checks passed in both directions; no network binding or keys changed.
- Five source files match by SHA-256 on both Macs; both receipt sets are retained on both Macs.
- Actual bundled ChatGPT/Codex client reports csoai-readonly-observer enabled on both.
- Before/after parsing proves every previous config setting was preserved; backups stay local and private.
- Retained 16:20 UTC snapshot: 418 historical rows, 11 usable combinations, one unobserved combination.
- Canonical payload hash: b8c3c8a13144a371e9215856142746d10078485e33ab237b3613515eadec8ed6.
- M4 Condor and Hummingbot unauthenticated root checks returned HTTP 200; not full trading readiness.

## Next work; not claimed completed
M2 data quality: add per-request receipt time, exchange event time, explicit unsupported-market and fetch-failure accounting to an isolated recorder candidate. Review before restarting the current recorder.
Paper research: retain fee assumptions, fill and latency models, slippage, out-of-sample periods and drawdown before drawing strategy conclusions. No live-trading promotion is implemented by this observer.
CSOAI integration: map retained observations into the existing execution programme; preserve its instrument, review, signature and release gates rather than creating another authoritative board.
M4 release: leave producer, witness metadata and protected deployment with their existing owners; earlier handover blockers are not closed by this work.
Desktop: client registration and direct MCP operation passed; the already-open app conversation's tool refresh was not verified or forced.

## Security boundary
This new adapter has no trading, signing, key-management, arbitrary-command or publication tools.
It does not establish that pre-existing Condor/Hummingbot tools enforce GSPC execution policy.
Legacy M2 clawd-workspace/AGENTS.md contains credential-like plaintext. Do not copy that document into shared handovers or use its embedded credential. Owner-managed secret hygiene remains open; no credential was rotated here.
No inference purchase, order, wallet transaction, email, LinkedIn submission, Git push or deployment occurred.
