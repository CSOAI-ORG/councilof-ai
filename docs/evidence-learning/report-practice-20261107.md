# Report-grounded practice: implementation and handoff

Date: 7 November 2026. Status: draft implementation; autoMerge: false.

## Behaviour

The existing Council OS evidence-learning pane can turn its loaded public GSPC report into three objective comprehension exercises. Previously its practice section contained only fixed synthetic exercises. The additional section teaches the selected axis's recorded status, recorded n and measurement-date precision.

The compiler parses and hashes the same raw response, validates the board and exact public source, and freezes the resulting practice. Supplied parsed data and supplied digests are ignored. Question identity includes axis, source digest and template version. Retrieval time never substitutes for measurement time.

Refreshing updates availability and the historical-source notice without rewriting questions, answers or focused answer controls. Explicit rebinding preserves answers for identical source bytes and resets them for changed bytes. Answer events from another axis or revision are rejected. Answers remain in this tab and do not alter saved learning points, backups, reviewer status or action authority. Source text is escaped.

This is report comprehension, not generated incident instruction, independent verification, model retraining or compliance certification. A hash identifies bytes; it does not establish their truth or authenticity. Historical source bytes are not durably archived by this component.

## Validation

- Baseline: 17/17 existing Node component tests passed.
- Updated: 25/25 passed, including raw-byte binding, malformed/foreign/oversized source rejection, unknown/draft/zero states, revision identity, source escaping, stale answer events and explicit rebinding.
- Added the existing test file to the shared NODE_TEST_FILES registry so the PR gate executes it under Node instead of leaving it unregistered.
- Current master brand-gate passed against the rendered new panel fixture.
- Existing public GET allowlist remains the only network reader. No published JSON surface or new endpoint is introduced.
- Browser attempt was blocked by this execution environment's socket restriction. Desktop/mobile visual acceptance is therefore pending.
- Full repository build, required hosted gates and live deployment acceptance have not been established by this source-only run. Direct unauthenticated production source reads returned HTTP 403 from the observer; this does not establish an outage.

## Existing work to reuse

Coordinate with the existing evidence workbench (#3975), daily axis history (#3988), applicability checks (#3968), evidence-event adapters (#3971) and SAFE product closure (#4007). These references identify work streams, not merged or deployed guarantees.

Next stages should consume the existing evidence-event contract and correction history: first approved report-to-lesson mapping, then held-out human transfer evaluation; separately, a sandboxed policy proposal with exact authenticated human approval, expiry/revocation/scope enforcement and independently witnessed effect. Do not infer human approval from a bearer token, test completion or a learning score.

Keep incident intake and private source rights with their existing owners. Any future incident-derived lessons need rights, redaction, reviewer acceptance and versioned source applicability before publication. No new scheduler, parallel case journal, notification channel or model-weight training is created here.

## Release acceptance

The source owner should review this lane, run required gates and a browser smoke test against the composed Council OS pane, then decide merge/release. Check initial source load, answer selection, changed-source refresh, explicit rebinding, failed refresh and keyboard/mobile layout. No production deployment or merge is requested automatically.
