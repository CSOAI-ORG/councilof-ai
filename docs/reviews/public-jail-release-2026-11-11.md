# Jail evidence journey: consolidation and acceptance — 11 November 2026

## Scope

Continuation of PR #4116 and its existing `fix/jail-public-evidence-current-archive-20261108` branch, not a replacement lane. The 8 November audit remains historical. This update does not change measurements, signed records, the original archive, private services, execution authority, billing, CI rules or deployment configuration.

## Current-source reconciliation

Inspected PR head: `b4d8d6840e7165e576bfd58207e4aacf2c4d0a7a`. All six workflows reported success at that revision: pr-gates, CI, eval-ci, lane-guard, conflict-guard and crawler-view-gate. The PR was still draft and unmerged. Those historical successes do not qualify this new composition.

Inspected master: `b5cef696a1ae17d756bd73897d2e68293d05d94e`; tree `3e31aa9e70e2ebec8f4645699b509f5df7789744`. Its JailFolder blob remains `7ff06829cb4970940c85d89e9bcc99f40f9067eb`, identical to the original preimage. The new reader, prior test file and prior audit file were absent at that master. The composition starts from this master tree, overlays only the scoped PR paths and new controls, and retains both histories. Unrelated master content is preserved.

## Additional improvements

- Measurement status must be an actual string in the accepted set; arrays and objects cannot become a positive status through string coercion.
- Dataset references containing single- or double-dot path segments are rejected rather than linking to a browser-normalised different path.
- Aborted requests stop before dispatch or parsing. An abort cancels a stalled body even when a compatible request adapter does not propagate its signal.
- Unread HTTP-error bodies are released. Oversized or aborted reads do not await a potentially unresolved cancellation promise. The existing 64 KiB cap and component-owned eight-second timer are preserved.
- The earlier HTTP-error test now asserts body cancellation and an unlocked stream, not an untouched unread body. No validation assertion is removed.

## Tests actually performed

Fourteen additional synthetic controls were run in Node: the pre-change reader failed nine and passed five; the hardened reader passed all fourteen. The corresponding committed test bodies were also executed in Chromium 144.0.7559.96 using native Web Streams, with network access blocked: fourteen passed. These are the same control families in two environments, not twenty-eight independent behaviours or real measurement results.

The Chromium run completed at `2026-11-11T02:31:38.482Z`. It is a native browser reader/transport check, not a hydrated full React application or mobile layout audit. Full repository CI must qualify the newly published head.

Targeted repository command:

```sh
npm test -- client/src/pages/JailFolder.test.tsx client/src/pages/jailEvidence.hardening.test.ts
```

## Public end-user readback before publication

A separate public browser session inspected `/gspc/jail/`, followed its current-board API link and used the existing `/gspc-verify/` interface for the first published card (`acec0ee7b86c1385e0455660ea1f2f23bfccc904a1b68308263a5e2eb982fa57`). Its report reproduced the old page's TIE presentation versus the API's UNTESTED separation. Neither of the candidate's new current/archive sections was present. The verifier UI reported a valid card and no mismatches/errors. That is a scoped UI observation, not a new independent cryptographic proof or validation of the measurement's truth. Mobile resizing was unavailable in that session and is NOT_TESTED. The provider-reported observation clock was not independently qualified and is not used as an authoritative timestamp.

The pre-publication browser result therefore does not establish that this fix is deployed.

## Release and subsequent acceptance

1. Pass the existing required checks on the exact composed head, retain any actual failures, and use the normal protected release process. Do not bypass required review or deployment ownership.
2. After a successful production deployment, read both apex and production alias; verify the new neutral title and distinct current/archive sections, including the API's current separation and the archive's historical label.
3. Follow a per-card verifier link and record the actual verification result; exercise failure/retry and narrow-width behaviour on a controlled preview. Repeat production readback after the release to detect overwrite or stale-alias regressions.
4. Reconcile the previously recorded axis-index count, traction metadata and companion headings with their existing owners. Do not duplicate those sources or classify them as fixed without current evidence.

No universal 100% correctness, full-estate completion, service recovery, customer acceptance or deployment claim is made by a source commit or a passing synthetic control.
