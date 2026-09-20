# DRAFT — public incident note (NOT PUBLISHED)

Status: DRAFT for owner review. Every sentence below is backed by evidence in
`evidence/reconciliation-2026-09-20/` or `evidence/exit-plan-gates-2026-09-20/`.
Words the audit rejected — "deleted", "uninterrupted", "anchored", "migrated" —
are not used, because the direct evidence for them does not exist.

---

**Site attestation on the GSPC board was unverifiable; fix is merged and awaiting deploy.**

On 20 September 2026, an outside reconciliation of our public evidence found that the
`site_attestation` Ed25519 signature on `GET /api/gspc` did not verify under its own
published verification rule. Eleven board axes carried a field set to a value our signer
serialised literally but our serving layer omitted, so the signed bytes could not be
reconstructed from the bytes we served. The defect was in the signing code, not in the
measurements.

What this means for a relying party: during the affected window the board payload's
site-level attestation could not be independently verified, and should not have been
read as validating the payload. The board's embedded living stamp verified correctly
throughout, as did all 335 signed measurement cards and the public root — each was
re-checked on 20 September 2026 (335/335 cards valid; root recomputes and its envelope
signature verifies).

The fix — omitting the field rather than serialising it — was merged to the main branch
(PR #2657) with an end-to-end proof that the attestation verifies from served bytes, and
the correction is recorded on our public corrections ledger as C-2026-0920-01 (PR #2658).
Deployment of the fix is pending: our CI/CD provider currently reports Actions disabled
for the account, so no automated deploy has run since 15 September 2026. We will confirm
the fix live by re-verifying the served bytes after the next deploy, and will update the
correction entry with that readback.

We thank the reconciliation process for catching what our own checks missed: no check
verified the attestation from the served bytes, which are the only bytes a relying party
has. That check now exists in the release rehearsal protocol.

---

## Evidence backing each sentence (reviewer map)

| Claim | Evidence |
|---|---|
| site_attestation did not verify under published rule | reconciliation-report.json → artifact "live board site attestation": 0/11 variants × 2 implementations |
| 11 axes / serialiser divergence | gspc.ts `excludeOwnLeader`/`dropUncardedLeader` `leader: undefined`; canonical() vs JSON.stringify demonstration in README |
| living_stamp + 335 cards + root verified 2026-09-20 | verify-estate run log; reconciliation-report.json artifacts 1–5 |
| fix merged, end-to-end proof | PR #2657 (commit 1cf29374); throwaway-key harness proof in README |
| correction recorded | PR #2658 (commit 05d3d263), ledger id C-2026-0920-01 |
| Actions disabled for the account | GitHub API 422 "Actions has been disabled for this user" on workflow_dispatch, 2026-09-20; zero runs since 2026-09-15T08:06Z |
| window start unknown | stated as "affected window" without start date — first_observed 2026-09-20T01:52Z only |

## Explicitly NOT claimed

- When the defect began (unknown — not asserted).
- That any GitHub organisation/resource is deleted (anonymous 404 is not determinate).
- That any root is anchored in a specific Bitcoin block (exact-byte binding unverified).
- That any migration has occurred (none has).
