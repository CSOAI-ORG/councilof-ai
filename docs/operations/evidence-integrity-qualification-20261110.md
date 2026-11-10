# Evidence-integrity repair qualification — 10 November 2026

Status: reviewed-by-author source candidate, NOT production acceptance.
Baseline: `3f0d7d351c35379400af0a356df00a32940edd72`.

## Scope and custody

This correction contribution does not replace the existing source/release owners.
It leaves the owner-held report-practice branch #4027 unchanged. That branch
also edits `element.js`; reconcile its eventual composition against this exact
candidate and run the resulting head's own tests. No predecessor pass transfers.
Auto-merge remains off. The normal protected GitHub Actions release is the only
production publisher. No signing, payments, schedules, keys, private source data,
model calls, canonical evidence bytes or local-executor admission are changed.

## Changes

1. Evidence & Learning: refresh source-owned summary/context regions; clear stale
   scenarios; distinguish successful board retrieval from scenario failure;
   retain drafts, focus, selection and pinned sources. Bind timeouts to their own
   request and reject late/aborted responses. Clone nested source fields and local
   snapshot totals; reject out-of-range clock values. Revise the complete browser
   module graph while preserving the local-state version.
2. Layer-0: preserve the documented legacy receipt-only meaning of `attested`,
   but reject malformed or mismatched envelopes. Report signature/issuer/effect
   checks as unperformed. Fingerprint supported callback JSON, include only its
   digest/encoding in the existing envelope request, and compare returned bindings.
   A changed or unsupported output remains uncheckable. The local executor stays held.
3. Claim maintenance: validate real calendar dates and the existing fixed-width
   UTC-second profile before accepting ledger rows or comparing schedule times.
   Hash integrity alone cannot turn an impossible date into completed work.
4. Register the new offline regression suite in the existing Node test list.
   No new workflow, job, schedule or test exclusion is introduced.

## Executed qualification

- Evidence & Learning: all 46 component tests passed (24 original assertions
  unchanged, plus 22 regressions); zero skipped.
- Existing Layer-0 package suite: 29 passed. The old dummy receipt fixture now
  supplies an explicitly UNVERIFIED envelope in the actual format. Original
  receipt-success assertions remain, with explicit non-verification assertions.
- New receipt/calendar suite: 46 passed, zero skipped. The first 45 cases ran
  against the baseline: 11 passed and 34 failed, identifying discriminating controls.
- Existing claim-state suite: 11 direct tests passed unchanged. Its generator
  entry-point case could not execute in the partial checkout because the 31 KB
  generator was not materialized. The initial missing-file failure is retained;
  it is not a product regression or a passed check. No test is disabled in source.
- Test environment: Node 22.16.0 in an isolated working container, with synthetic
  transport responses. The existing package's temporary-file/key fixtures are
  test-owned; they are not operator acceptance or production signing.

## Browser acceptance: BLOCKED, not passed

Chromium rejected navigation to the owned fixture origin with
`net::ERR_BLOCKED_BY_ADMINISTRATOR` before the component loaded. No journey,
layout, contrast, accessibility or visual-polish pass is claimed. Navigation was
stopped; no alternate origin, device or policy change was used to circumvent it.
The browser harness is not a public-deployment receipt.

The existing release/QA owner must qualify desktop and 393px mobile on the exact
released bytes: source-date display; keyboard tabs and focus; escaped source text;
scenario failure and recovery; wrong-axis refusal; draft edit and source-pin
preservation during refresh; unsigned draft download/reopen; local backup/import;
reload with the same original pin; and no horizontal document overflow. Record
actual raw outcomes and failures, not a blanket route count.

## Remaining acceptance gates

Full repository CI, the generator integration test, all owner-required reviews,
protected merge/deployment and post-release public readback remain separate.
This candidate does not close trusted-issuer signature verification, authenticated
human authority, gateway origin/role/Base binding, independent effect observation,
external buyer acceptance, exact paid-artifact recovery or repeat demand.

The RFC 3339 clock profile is the validation reference, not a legal conformance
claim: https://www.rfc-editor.org/rfc/rfc3339.html . Request-scoped cancellation
follows the AbortController model: https://dom.spec.whatwg.org/#interface-abortcontroller .
