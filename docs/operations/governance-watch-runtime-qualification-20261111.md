# Governance watch runtime qualification — 11 November 2026

Status: source qualification; not installed-runtime recovery or legal approval.

## Scope

This increment builds on PR #4109. It changes collector failure reporting, scope validation and private evidence commit ordering. The source list, normalizer version, public legal documents, membership statements, signatures, production configuration and all schedules are unchanged. Legal surface reconciliation stays with existing issue #4110; package licence questions remain separate in #4035.

## Executed offline evidence

58 unittest cases passed: the 37 existing cases plus 21 runtime/evidence-state cases. Live fetching was mocked for all new runtime cases. Tests exercised ordinary successful report publication, disk/temp failures before networking, corrupt or empty history, mismatched report/notification state, busy locks, each output-write phase, redacted error reporting and preservation of historical evidence. These observations establish tested software behavior, not legal correctness or current website availability.

Four separate negative-control runs deliberately disabled one safety property at a time. Removing the storage preflight, removing the prior-pair check, returning success on a busy lock, and claiming fresh report acceptance on an error each caused its targeted test to fail. All mutations were discarded; they are not the proposed source.

Qualified collector SHA-256: ae38013347fc787b2ccffe951a435f49f6402d50e2e41a8c05dfa7e29124e100.
New runtime test SHA-256: 5fd4208a08e0c9079e0219d6864eef2e4f6339a1a37e52f9863967f17b85e782.
Unchanged source-list SHA-256: 246ce89f332cdd6a81ff31e3aa456015aa660587ed28d57448c7b226233927e9.

## Release and acceptance sequence

1. Review the exact source change and pass the existing protected repository checks; no waiver or direct production deployment.
2. Verify the merged blobs against the qualified hashes. A successful merge alone does not replace any installed collector.
3. The existing runtime owner qualifies the original authorized environment and performs any separately approved source/pin adoption. No fallback host, storage cleanup or permission expansion is implied.
4. Observe one normal bounded collection with a completed process result, current report timestamp, consistent report/notification pair and per-source states. Unknown execution or stale saved evidence cannot establish recovery.
5. Keep public user-journey readback separate from collection: reachable privacy/security pages do not prove mailbox delivery, legal compliance, private agreement validity or signing-key custody.
6. Substantive legal changes remain exact-version human review decisions. After any separately approved publication, verify operative/archival status, aliases, displayed version, contact targets and machine-readable identity. Retain old contractual evidence.

## Known limitations

Storage probes do not reserve capacity or prevent later exhaustion. The two discovery files are not committed atomically together; an interrupted final update is detected and held, not automatically repaired. Source content changes still require materiality review. The added tests do not establish device recovery, production deployment, email delivery, complete regulatory coverage, or an end-to-end human legal approval. There is no claim that every failure mode or every future change has been covered.
