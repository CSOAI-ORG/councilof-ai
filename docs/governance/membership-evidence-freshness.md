# Membership evidence freshness

The public membership register is a dated evidence snapshot, not a live membership assertion.

## Acceptance thresholds

- The manifest `as_of` date must be no more than **14 UTC calendar days** old.
- Every row except a row explicitly marked `UNVERIFIED` must carry a valid `verified_on` date.
- Each row's `verified_on` date must be no more than **60 UTC calendar days** old and must not post-date the manifest `as_of` date.
- The update log and the manifest must carry the same `as_of` date.
- The human-facing `/memberships` page must display the same date as `/interop/memberships.json` and disclose that the manifest is unsigned.

The limits are monitoring thresholds, not evidence that a membership is legally valid. A threshold failure makes the check fail and requires an owner-reviewed manifest refresh; the checker does not edit or sign the manifest.

## Row verification

The live checker fetches every row whose evidence kind is `public_url`, including rows recorded as `UNVERIFIED` or `PENDING` with their respective semantics. Private mailbox evidence is schema-checked and counted, but is not fetched or represented as independently verified. The current manifest has 35 rows: 26 public-evidence rows and 9 private-evidence rows.

## Execution

`membership-evidence-freshness.yml` runs offline regression tests on relevant pull requests, and performs the live public-evidence plus HTML/JSON parity check on the daily schedule, manual dispatch, and relevant pushes to `master`. A stale snapshot remains visible as a failing check until the authorized evidence owner updates the dated manifest and its change log.

The public page shows a client-side stale-snapshot warning when its manifest date exceeds the 14-day target. No membership claim is automatically promoted, downgraded, removed, or signed.
