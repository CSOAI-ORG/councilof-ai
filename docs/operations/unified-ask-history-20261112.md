# Unified Ask and Council OS history — 12 November 2026

## Reproduced defect

The public browser acceptance test on 12 November submitted `What does the leaderboard show? Public workspace check 12 November.` through the bottom dashboard composer. The board returned `34 of the 34 tests on the board have published results. No test has a clear winner yet; 7 are ties.` Opening header Ask showed a fresh Cody greeting with neither the question nor answer. Header Ask and the floating bubble shared their transcript, but the bottom composer did not.

## Change

One public AG-UI TalkPanel is now the request owner. The home canvas no longer mounts a second TalkPanel. The dashboard bottom composer and Get Results lookup route to the same AskHost used by the header and floating bubble. Explicit pane-navigation commands retain the deterministic lobby router.

Ask emits a typed start event with its exact server thread id and a settled event containing the actual returned text/status. Dashboard session history records the user turn before streaming and the returned council turn against that same remote thread. It does not fabricate a reply when the run has no text, and it does not attach a result to a different currently selected thread. Selecting an existing history thread updates AskHost and TalkPanel's thread ref; follow-up requests continue that server thread. A new thread explicitly clears the remote id.

The history remains session-only, in memory, consistent with the existing UI disclosure. No chat transcript is sent to a new storage service. Company-case requests remain on their separately authenticated path; the public lifecycle callbacks are attached to the public TalkPanel only. No model training, AI inference, approval, payment, signing or external communication is claimed by this UI change.

## Regression coverage added

- Dashboard free-text routing uses one Ask host and keeps explicit pane commands local.
- Ask bus carries an explicit history thread id and omits it when a launcher merely opens the pane.
- TalkPanel emits one start and one settled callback with the same selected thread id, including interrupted stream closure.
- Session history creates a thread with the server id and appends the actual answer to that thread, not another selected thread; unknown ids and empty replies do not fabricate turns.
- Source contract checks ensure AskHost follows thread selection, AskPane forwards lifecycle events and DashboardWorkspace no longer mounts a second TalkPanel.

## Validation and release status

A local TypeScript 7 parse pass reported no TS1xxx syntax diagnostics. Full project type checking, the full Vitest suite, protected CI, desktop/mobile browser acceptance and live production readback are required before release. The M4 working copy is deliberately untouched: it has unrelated dirty changes and less than 0.5 GiB free disk. Source is prepared as an isolated GitHub API commit from the exact master revision, not applied to the dirty local checkout.
