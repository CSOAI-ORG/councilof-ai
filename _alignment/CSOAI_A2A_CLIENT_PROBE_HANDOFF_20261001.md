# A2A machine-client probe handoff — 1 October 2026

Canonical mirror review branch: `review/codex-a2a-client-probe-20261001` at `c4f66e03ba9b0827bf36d533c54bf772a5a7645`, based on `master` `f4e63746c4a4e7f305ac555179faa8bcd2da759f`.

The branch adds a stdlib-only, anonymous agent-card compatibility probe and the seven-day source findings. Syntax parsing and staged `git diff --check` passed. A live M4 run failed as intended: curl user-agent HTTP 200 / 18,702 bytes / SHA-256 `91d3918b65a17e8db38649c39004cbcbbe86cd3d08539d8fbfa10773e98ec188`; Python-urllib HTTP 403 / Cloudflare 1010. Cloudflare Ray `a43bdcd31af4eb1d-MAN` at 2026-10-01 13:37:32 UTC.

The existing build-pod OAuth token can list the zone and query sampled Security Events. It cannot read the zone BIC setting (HTTP 403 / 9109) or edit the WAF. The sampled five-minute window omitted our Ray, though another client was blocked by `source: bic`. Thus BIC is plausible but unproven for this exact request. Inspect the exact event in the authorized Cloudflare Security Events UI or with a security-read token, apply only the needed exact-path exception through the release owner, and rerun the probe.

A second anonymous probe from the build pod at 13:53 UTC reproduced the same result: the curl signature read the same SHA-256, while Python-urllib received Cloudflare 1010 (blocked Ray `a43bf450bb47c6bf-FRA`). A narrower Security Events query over 13:52–13:55 UTC returned zero sampled events. The exact blocking rule is therefore still unobserved. Do not weaken zone security on the assumption that BIC was responsible.

For the shared GSPC job acceptance slice, canon already has `functions/api/action-jobs.ts`: it is a single-writer, authenticated, intent-only KV staging ledger with `job_` identities and no provider execution. It does not implement the `gspcjob:` shared identity, public API replay, or human/MCP convergence described by M2. Reuse or explicitly bridge this ledger when the one-job work is owned; do not create a second uncoordinated job store. Its own source requires a Durable Object or transactional D1 before multi-writer execution.

No Cloudflare rule was changed, and the branch was neither landed nor deployed. The existing `review/codex-release-unblock-20261001` and `review/codex-corpus-label-ready-20261001` branches also remain separate and unlanded as of this handoff. Preserve the build-pod gated `land:` path; do not use Mac Wrangler.
