# Academy and charter review: correct source attribution

11 November 2026. Source baseline: `b5cef696a1ae17d756bd73897d2e68293d05d94e`.

The existing Watchdog review feed labelled its runtime/oversight topic as a
WG-SAFE charter obligation. The upstream charter remains under development in
the source inspected on this date. New feed output now attributes the topic to
the **Council of AI candidate authority-effect profile**, with adoption recorded
as `NOT_ESTABLISHED`. The stable topic ID remains `charter`.

Each affected row carries an additive `obligation_source` reference:

- Council profile: `csoai.hitl-authority-effect/0.2`, pinned to the baseline's
  `docs/standards/osaia-safe-reverification/HITL-AUTHORITY-EFFECT-PROFILE.md`,
  Git blob `f7c9af51d7ab897c62e2fa46cb63998e0cea9719`.
- External reference: [SAFE Working Group charter](https://github.com/OpenSecureAIAlliance/wg-safe/blob/3769437209edac11d745dd58c165b951ed474e27/CHARTER.md),
  Git blob `c74309c122a465a88731f3f7842beb812c89cac4`, checked on 11 November 2026.
  `REFERENCE_ONLY` and `UNDER_DEVELOPMENT` describe this dated read, not a live
  status check, adoption or external endorsement.

The existing Evidence & Learning `makeReviewDraft` in
`public/evidence-learning/contract.mjs` remains the practice-to-review path.
This correction creates no parallel review system. A challenge is a proposal
for review, separate from a recorded decision, authenticated human identity
and permission to execute. Existing `/api/hitl` and authority-effect acceptance
requirements continue to govern those later stages.

## Executed checks

`python3 -B scripts/test_watchdog_charter_feed.py` passed **19 tests**, including
four attribution/reference cases. The attribution test failed against the
unchanged baseline generator as expected. A five-topic comparison preserved
all routing IDs, counts, input digests, question text, buckets and HOLD flags;
only the corrected charter label, explanatory challenge note and additive
reference differ. Returned nested references cannot mutate later outputs.

Historical feed files and observations are unchanged. No schedule, roster,
challenge, decision, model, signature, GSPC score or external submission was
created or modified by this correction. Source qualification does not establish
deployment or genuine human acceptance.
