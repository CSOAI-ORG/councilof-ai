# TUI 1 — frontend and learning lane

**Date:** 2026-09-04
**Branch:** `codex/council-release-candidate`
**Checkpoint:** reviewed current-master checkpoint; refresh evidence at handoff
**Owner:** TUI 1 frontend/learning operator

## Outcome

Deliver one calm, chat-first Council OS. Conversation remains available while
tools, GSPC views, games, reports and learning paths open in the centre canvas.
Practice may create a consented evidence candidate; it never promotes itself
to a measurement or training record.

**Current state:** the unified shell and leaf-pane selection are integrated in
the candidate. The current focused UI/data selection passes 84/84 tests, and
the consolidated embed/breadcrumb/harness navigation selection passes 33/33.
The frozen candidate shell E2E passes 27 tests with one intentional conditional
skip across desktop and mobile. A production-shaped local preview exists; this
is release-candidate evidence, not production proof.

## Business and GSPC purpose

- **Revenue:** make request, verify, measure and remediate journeys usable
  enough to convert into scoped evidence work.
- **Growth:** make the 22-axis learning and Coliseum loops useful and
  repeatable without manufacturing engagement claims.
- **IP:** preserve Council of AI's evidence vocabulary and interaction design;
  do not duplicate the canonical lifecycle in page-specific state.
- **GSPC:** render published board state exactly, with empty and unmeasured
  cells remaining explicit.

## Exclusive path boundary

Write only within:

- `client/src/components/brand/CouncilBrand.tsx`
- `client/src/components/Dashboard*.tsx`,
  `CandidateEvidenceTray.tsx`, `EvidenceLifecycleView.tsx`,
  `ToolRunner.tsx` and their focused tests
- `client/src/components/home/HomeGspcBoard*`
- `client/src/components/lobby/*` for the agreed dashboard experience
- `client/src/data/gspc-learning-paths*` and `games-catalog*`
- `client/src/lib/dashboardView*`, `candidateEvidence*`,
  `capabilityFabric*` and `evidenceLifecycle*`
- `client/src/styles/index.css` and `e2e/tests/dashboard-shell.spec.ts`

`App.tsx`, `pages/Dashboard.tsx`, Functions, release scripts, generated
public files and workflows belong to other lanes.

## Required work

1. Keep `/dashboard` as the only application shell and preserve one composer,
   one centre canvas and one workspace/history rail.
2. Make every tool and supporting page open without nesting another Council OS
   shell or losing the user's conversation.
3. Align spacing, typography, focus behaviour and cream/slate/emerald branding
   across home, arena, measured, evidence, learning, tools and settings.
4. Route game/report output through explicit candidate review and consent.
5. Display capability and evidence states verbatim; a configured or catalogued
   integration is not runtime evidence.
6. Keep learning human-in-the-loop: explain, propose, review and retest before
   any external submission.

## Acceptance evidence

```bash
npx vitest run client/src/lib/dashboardView.test.ts client/src/lib/candidateEvidence.test.ts client/src/lib/capabilityFabric.test.ts client/src/lib/evidenceLifecycle.test.ts client/src/data/gspc-learning-paths.test.ts client/src/data/games-catalog.test.ts client/src/components/ToolRunner.test.ts client/src/components/DashboardArenaPane.test.tsx client/src/components/DashboardRequestPane.test.tsx client/src/components/EvidenceLifecycleView.test.tsx client/src/components/home/HomeGspcBoard.test.tsx client/src/components/DashboardCataloguePane.test.ts
npx vitest run client/src/lib/embed.test.ts client/src/components/lobby/breadcrumbs.test.ts client/src/components/lobby/harness-tab.test.ts
npm run test:e2e:shell
git diff --check
```

At the current checkpoint the focused UI/data selection passed **84/84**, and
the consolidated navigation selection passed **33/33**. The last successful
frozen-candidate shell E2E run reported **27 passed, 1 skipped**. Supply desktop
and mobile screenshots, keyboard/focus evidence, one
game return path, one consented local candidate, and an exact changed-path
manifest.

## Non-goals

No backend state transitions, provider probing, model training, public
publishing, certification claims, payments, commits, merges or deployment.

## Handoff gates

Hand Claude the exact paths, test output, screenshots, required endpoints and
known degraded states. Stop if the shell duplicates, a measurement is inferred
in React, consent defaults on, or an unframeable route opens inside itself.
